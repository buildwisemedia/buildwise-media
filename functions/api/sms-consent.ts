/**
 * Cloudflare Pages Function — Account Notification SMS opt-in capture.
 *
 * Backs the form on /sms-consent (sms-consent.html). Each successful POST
 * creates an auditable consent record by inserting a `narrative` event into
 * Supabase `operational_events` with payload.kind = "sms_consent_recorded".
 * That event row IS the consent of record — queryable, append-only, and
 * carries the timestamp the database assigns (occurred_at).
 *
 * This page-function is referenced from the A2P 10DLC campaign submission
 * as the verifiable opt-in URL TCR can hit. Do not change the route or
 * payload shape without updating the campaign metadata in lockstep.
 *
 * Per-Pages-project env vars (set via CF dashboard → Pages → Settings):
 *   SUPABASE_URL          — https://<project>.supabase.co
 *   SUPABASE_SERVICE_KEY  — service-role key for inserting into
 *                           operational_events
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
}

interface ConsentBody {
  phone?: unknown;
  role?: unknown;
  consent_text_version?: unknown;
  consented_at_client?: unknown;
}

const E164_RE = /^\+[1-9]\d{6,14}$/;
const VERSION_RE = /^\d{4}-\d{2}-\d{2}$/;

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function ulid(): string {
  let ts = Date.now();
  let timeChars = '';
  for (let i = 0; i < 10; i++) {
    timeChars = ULID_ALPHABET[ts & 31] + timeChars;
    ts = Math.floor(ts / 32);
  }
  const rand = new Uint8Array(16);
  crypto.getRandomValues(rand);
  let randChars = '';
  for (let i = 0; i < 16; i++) {
    randChars += ULID_ALPHABET[rand[i] & 31];
  }
  return timeChars + randChars;
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.log(JSON.stringify({ fn: 'api/sms-consent', error: 'config_missing' }));
    return jsonError(500, 'service_misconfigured');
  }

  let body: ConsentBody;
  try {
    body = (await request.json()) as ConsentBody;
  } catch {
    return jsonError(400, 'invalid_json');
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const consentTextVersion = typeof body.consent_text_version === 'string' ? body.consent_text_version : '';
  const consentedAtClient = typeof body.consented_at_client === 'string' ? body.consented_at_client : '';

  if (!E164_RE.test(phone)) return jsonError(400, 'invalid_phone');
  if (!role || role.length > 200) return jsonError(400, 'invalid_role');
  if (!VERSION_RE.test(consentTextVersion)) return jsonError(400, 'invalid_consent_version');

  const consentId = ulid();
  const eventId = ulid();
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ua = request.headers.get('user-agent') ?? '';
  const country = request.headers.get('cf-ipcountry') ?? '';

  const eventRow = {
    id: eventId,
    event_type: 'narrative',
    client_id: null,
    session_id: `sms-consent-${consentId}`,
    payload: {
      kind: 'sms_consent_recorded',
      consent_id: consentId,
      program: 'account_notification_a2p',
      phone,
      role,
      consent_text_version: consentTextVersion,
      consented_at_client: consentedAtClient,
      capture: {
        url: 'https://buildwisemedia.com/sms-consent',
        ip,
        user_agent: ua,
        country,
      },
      title: 'SMS Account Notification consent recorded',
      body: `Authorized account holder consented to Buildwise Media Account Notification SMS at ${phone}. Role: ${role}. Consent text version: ${consentTextVersion}. Captured from https://buildwisemedia.com/sms-consent.`,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${env.SUPABASE_URL}/rest/v1/operational_events`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=ignore-duplicates',
      },
      body: JSON.stringify(eventRow),
    });
  } catch (e) {
    console.log(JSON.stringify({ fn: 'api/sms-consent', error: 'supabase_unreachable' }));
    return jsonError(502, 'storage_unavailable');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.log(JSON.stringify({ fn: 'api/sms-consent', error: 'supabase_insert_failed', status: res.status, detail }));
    return jsonError(502, 'storage_rejected');
  }

  return new Response(
    JSON.stringify({ ok: true, consent_id: consentId, recorded_at: new Date().toISOString() }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
};

export const onRequest: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
};
