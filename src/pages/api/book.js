export const prerender = false;

const UPSTREAM = "https://bwm-form-handler.robert-ba0.workers.dev/buildwisemedia/fit-contact";
const MAX_BODY_BYTES = 32 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://buildwisemedia.com",
  "https://www.buildwisemedia.com",
  "https://bwm-new-website-review.pages.dev",
]);
const ALLOWED_HOSTS = new Set([
  "buildwisemedia.com",
  "www.buildwisemedia.com",
  "bwm-new-website-review.pages.dev",
]);

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function safeVisitorIp(request) {
  const value = (request.headers.get("CF-Connecting-IP") || "").trim();
  return /^[0-9a-f:.]{2,64}$/i.test(value) ? value : "";
}

export async function handleBookRequest(request, env = {}) {
  if (request.method !== "POST") {
    return json({ ok: false, emailed: false, error: "method_not_allowed" }, 405);
  }

  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  if (!ALLOWED_HOSTS.has(url.hostname) || !origin || !ALLOWED_ORIGINS.has(origin)) {
    return json({ ok: false, emailed: false, error: "origin_not_allowed" }, 403);
  }

  const intakeKey = typeof env.BWM_BOOK_INTAKE_KEY === "string"
    ? env.BWM_BOOK_INTAKE_KEY.trim()
    : "";
  if (!intakeKey) {
    return json({ ok: false, emailed: false, error: "intake_not_configured" }, 503);
  }

  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return json({ ok: false, emailed: false, error: "content_type_not_supported" }, 415);
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json({ ok: false, emailed: false, error: "payload_too_large" }, 413);
  }

  let body;
  try {
    body = await request.text();
  } catch {
    return json({ ok: false, emailed: false, error: "body_read_failed" }, 400);
  }
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, emailed: false, error: "payload_too_large" }, 413);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let upstream;
  try {
    const headers = new Headers({
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "Origin": "https://buildwisemedia.com",
      "X-BWM-Book-Key": intakeKey,
      "User-Agent": request.headers.get("User-Agent") || "BWM-Book-Astro-Endpoint/1.0",
    });
    const visitorIp = safeVisitorIp(request);
    if (visitorIp) headers.set("X-BWM-Visitor-IP", visitorIp);
    upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers,
      body,
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    return json({ ok: false, emailed: false, retryable: true, error: "intake_unavailable" }, 503);
  } finally {
    clearTimeout(timeout);
  }

  let result;
  try {
    result = await upstream.json();
  } catch {
    return json({ ok: false, emailed: false, retryable: true, error: "invalid_intake_response" }, 502);
  }

  if (upstream.ok && !(
    result?.ok === true &&
    result?.captured === true &&
    result?.emailed === true &&
    result?.receipt_recorded === true
  )) {
    return json({
      ok: false,
      captured: result?.captured === true,
      emailed: result?.emailed === true,
      receipt_recorded: result?.receipt_recorded === true,
      retryable: true,
      error: "incomplete_intake_response",
    }, 502);
  }
  return json(result, upstream.status);
}

export async function POST({ request, locals }) {
  return handleBookRequest(request, locals.runtime?.env);
}

export async function ALL({ request }) {
  return handleBookRequest(request);
}
