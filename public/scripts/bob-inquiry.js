const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const REQUESTS = {
  fit: '',
  luncheon: 'Luncheon interest: Please email me details of the next Buildwise luncheon.',
  speaking: 'Speaking request: I would like to ask about a Buildwise talk.',
};

// Keep only known campaign tags. A visitor may put private data in any other URL field.
export function cleanSource(raw, base) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const url = new URL(raw, base);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    const clean = new URL(url.origin + url.pathname);
    for (const key of CAMPAIGN_KEYS) {
      const value = url.searchParams.get(key);
      if (value) clean.searchParams.set(key, value.slice(0, 160));
    }
    return clean.href.slice(0, 1000);
  } catch { return ''; }
}

export function sourceDetails(href, referrer = '') {
  const page = cleanSource(href);
  const tags = new URL(page || 'https://buildwisemedia.com/').searchParams;
  const result = { page_url: page, landing_page: page, referrer: cleanSource(referrer, href) };
  for (const key of CAMPAIGN_KEYS) if (tags.has(key)) result[key] = tags.get(key);
  return result;
}

export function requestNote(kind, text) {
  const prefix = REQUESTS[kind] ?? REQUESTS.fit;
  return [prefix, String(text || '').trim()].filter(Boolean).join('\n\n');
}

export function deliveryComplete(response, body) {
  return response.ok && body?.ok === true && body?.captured === true &&
    body?.emailed === true && body?.receipt_recorded === true;
}

export function initInquiry(form) {
  if (form.dataset.ready) return;
  form.dataset.ready = 'true';
  const panel = form.closest('[data-inquiry-panel]');
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  const status = panel.querySelector('[data-inquiry-status]');
  const success = panel.querySelector('[data-inquiry-success]');
  const fields = form.elements;
  const kind = Object.hasOwn(REQUESTS, form.dataset.kind) ? form.dataset.kind : 'fit';
  const startedAt = Date.now();
  let failed = null;
  let sending = false;
  button.disabled = false;
  const track = (name) => {
    if (!['buildwisemedia.com', 'www.buildwisemedia.com'].includes(location.hostname)) return;
    if (typeof window.gtag === 'function') window.gtag('event', name, {
      form_id: `bob_${kind}`, request_kind: kind, transport_type: 'beacon',
    });
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    status.hidden = true;
    if (!form.reportValidity()) return;
    const content = {
      contact_name: fields.contact_name.value.trim(),
      work_email: fields.work_email.value.trim(),
      company: fields.company.value.trim(),
      company_url: fields.company_url.value,
      bottleneck: requestNote(kind, fields.bottleneck?.value),
      contact_permission: fields.contact_permission.checked,
    };
    // Native required validation accepts spaces. Refuse an empty name or question too.
    if (!content.contact_name || (kind === 'fit' && !content.bottleneck) ||
        (kind === 'speaking' && !fields.bottleneck.value.trim())) {
      status.textContent = 'Please add your name and a short note.';
      status.hidden = false;
      status.focus();
      return;
    }
    const fingerprint = JSON.stringify(content);
    const payload = failed?.fingerprint === fingerprint ? failed.payload : {
      version: 'bwm-fit-contact-v1', submission_id: crypto.randomUUID(),
      form_started_at: startedAt, ...content, attribution: sourceDetails(location.href, document.referrer),
    };
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let result = {};
    try {
      const response = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal,
      });
      try { result = await response.json(); } catch { /* An incomplete receipt cannot mean success. */ }
      if (!deliveryComplete(response, result)) throw new Error('delivery_incomplete');
      failed = null;
      track(kind === 'fit' ? 'fit_note_submitted' : `${kind}_request_submitted`);
      if (kind === 'fit') track('generate_lead');
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      // Retry the identical payload, including its ID and attribution, after an uncertain result.
      failed = { fingerprint, payload };
      status.textContent = result.emailed === true
        ? 'Your note was emailed, but the final check did not finish. Please try again in a moment.'
        : result.captured === true
          ? 'We saved your note, but could not email it yet. Please try again.'
          : 'We could not confirm delivery. Your note is still here. Please try again.';
      status.hidden = false;
      status.focus();
      track('form_submit_error');
    } finally {
      clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-bob-inquiry]').forEach(initInquiry);
