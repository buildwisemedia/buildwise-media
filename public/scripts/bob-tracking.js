/* Bob production tracking. Verified GTM v14 owns Clarity, Meta and Ads.
   Direct GA4 owns page views and events; its GTM duplicates are paused. */
(() => {
  'use strict';
  const GA4 = 'G-V5LSP69E41', GTM = 'GTM-P5JSD86L';
  const production = ['buildwisemedia.com', 'www.buildwisemedia.com'].includes(location.hostname);
  const optedOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const interests = ['leads', 'service', 'connected-data', 'website', 'meetings', 'content', 'knowledge'];
  const clean = raw => {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const u = new URL(raw, location.href);
      if (!/^https?:$/.test(u.protocol)) return '';
      const out = new URL(u.origin + u.pathname);
      for (const k of keys) {
        const v = u.searchParams.get(k);
        if (v && !/[@\r\n]/.test(v)) out.searchParams.set(k, v.slice(0, 160));
      }
      return out.href.slice(0, 1000);
    } catch { return ''; }
  };
  const visitParams = new URL(location.href).searchParams;
  const clickKeys = ['gclid','fbclid'];
  const clickValue = v => typeof v === 'string' && /^[A-Za-z0-9._-]{1,500}$/.test(v) ? v : '';
  const current = clean(location.href);
  const pageReferrer = clean(document.referrer);
  const source = { page_url: current, landing_page: current, referrer: pageReferrer };
  const params = new URL(current || location.href).searchParams;
  keys.forEach(k => { if (params.has(k)) source[k] = params.get(k); });
  clickKeys.forEach(k => { const v=clickValue(visitParams.get(k));if(v)source[k]=v; });
  // A campaign is one set of tags. A page view with its own tags never mixes in an older campaign's.
  const campaignOf = raw => {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    keys.forEach(k => { if (typeof raw[k] === 'string' && raw[k] && !/[@\r\n]/.test(raw[k])) out[k] = raw[k].slice(0,160); });
    clickKeys.forEach(k => { if (clickValue(raw[k])) out[k] = raw[k]; });
    return out;
  };
  const has = tags => Object.keys(tags).length > 0;
  const visitCampaign = campaignOf(source);
  // Internal Bob links forward UTM tags but not click IDs. When a page repeats the saved campaign's
  // tags without its own click IDs, it is the same campaign: keep the saved IDs. New tags drop them.
  const carryClicks = raw => {
    const prev = campaignOf(raw);
    if (!has(visitCampaign) || clickKeys.some(k => visitCampaign[k])) return;
    if (!keys.every(k => (visitCampaign[k] || '') === (prev[k] || ''))) return;
    clickKeys.forEach(k => { if (prev[k]) visitCampaign[k] = source[k] = prev[k]; });
  };
  let savedCampaign = {};
  if (production && !optedOut) {
    // Spec-Attribution-JS: keep the first touch and the latest campaign for 30 days in the same
    // _bwm_attribution record and cookie the older site pages use (disclosed on /privacy).
    const KEY = '_bwm_attribution';
    // Touching a blocked store can itself throw, so each access is guarded. Reads come first, so a
    // blocked or full store can never discard what was already known.
    const local = () => localStorage, session = () => sessionStorage;
    const read = (store, k) => { try { const v = JSON.parse(store().getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch { return null; } };
    const write = (store, k, v) => { try { store().setItem(k, JSON.stringify(v)); } catch { /* best effort */ } };
    // Every saved campaign is dated and counts for 30 days, like the cookie. Undated copies restore nothing.
    const fresh = touch => { const t = Date.parse(touch?.ts); return t > 0 && Date.now() - t <= 2592000000 ? campaignOf(touch.utm) : {}; };
    let record = read(local, KEY);
    if (record && (!record.first_touch || typeof record.first_touch !== 'object')) record = null;
    const prior = read(session, 'bob_visit_source');
    const tabTouch = read(session, 'bob_tab_campaign');
    const heldTouch = read(session, 'bob_lead_campaign');
    const newest = fresh(record?.last_touch), tab = fresh(tabTouch), held = fresh(heldTouch);
    carryClicks(newest);
    carryClicks(tab);
    const now = new Date().toISOString();
    let tabNext = has(visitCampaign) ? { ts: now, utm: visitCampaign } : null;
    if (prior) {
      source.landing_page = clean(prior.landing_page) || current;
      source.referrer = clean(prior.referrer);
    }
    if (!has(visitCampaign)) {
      // Every tagged visit, on these pages or the older ones, rewrites last_touch. So when this tab
      // has a campaign and last_touch holds a fresh one, last_touch is the same or a newer campaign.
      // A tab without a campaign stays direct; the saved campaign then fills the lead only.
      const pick = has(tab) && has(newest) ? record.last_touch : has(tab) ? tabTouch : null;
      if (pick) { Object.assign(source, fresh(pick)); tabNext = { ts: pick.ts, utm: fresh(pick) }; }
    }
    write(session, 'bob_visit_source', source);
    write(session, 'bob_tab_campaign', tabNext);
    const touch = { ts: now, referrer: pageReferrer || null, landing_page: current, utm: visitCampaign };
    const saved = record || { first_touch: touch, last_touch: null };
    // Only a visit with campaign tags replaces the last touch, so a later direct visit keeps it.
    if (!record || has(visitCampaign)) saved.last_touch = touch;
    write(local, KEY, saved);
    const firstTags = campaignOf(saved.first_touch.utm), lastTags = fresh(saved.last_touch), firstFresh = fresh(saved.first_touch);
    // The campaign a direct tab's lead falls back to is held for the tab, so an older page that
    // clears last_touch cannot switch it to the first touch mid-visit. GA4 never reads it.
    const savedTouch = has(lastTags) ? saved.last_touch : has(held) ? heldTouch : has(firstFresh) ? saved.first_touch : null;
    savedCampaign = savedTouch ? fresh(savedTouch) : {};
    write(session, 'bob_lead_campaign', savedTouch ? { ts: savedTouch.ts, utm: savedCampaign } : null);
    try {
      const lead = has(campaignOf(source)) ? campaignOf(source) : savedCampaign;
      const cookie = { referrer: source.referrer || '', landing_page: source.landing_page || '' };
      [...keys, ...clickKeys].forEach(k => { cookie[k] = lead[k] || ''; });
      for (const [k, v] of Object.entries(firstTags)) cookie['first_touch_' + k] = v;
      Object.assign(cookie, { attribution_version: '3.0', attribution_status: 'captured', attribution_provenance: 'bob_tracking_v1' });
      const value = encodeURIComponent(JSON.stringify(cookie));
      if (value.length <= 3800) document.cookie = `${KEY}=${value}; path=/; max-age=2592000; SameSite=Lax; Secure`;
    } catch { /* Saving the campaign is best effort; the visit still counts. */ }
  }
  window.__bobSourceDetails = () => {
    const result={...source,page_url:clean(location.href)};
    if(production&&!optedOut){
      // A saved campaign fills the lead only; GA4 keeps its own cross-session attribution.
      if(!has(campaignOf(result)))Object.assign(result,savedCampaign);
      for(const [key,cookieName] of [['fbp','_fbp'],['fbc','_fbc']]){
        const raw=document.cookie.split('; ').find(c=>c.startsWith(cookieName+'='))?.slice(cookieName.length+1);
        if(raw&&/^[A-Za-z0-9._-]{1,500}$/.test(raw))result[key]=raw;
      }
      const exp=window.__BWM_EXP;
      if(exp&&/^[A-Za-z0-9._-]{1,120}$/.test(exp.experiment_id||'')&&/^[A-Za-z0-9._-]{1,120}$/.test(exp.variant_id||'')){result.experiment_id=exp.experiment_id;result.experiment_variant_id=exp.variant_id;}
    }
    return result;
  };
  if (!production || optedOut) {
    window['ga-disable-' + GA4] = true;
    window.__bwmTrackEvent = () => {};
    return;
  }
  let measurementUrl = location.origin + location.pathname;
  // The chosen job has already filled the form. Remove unknown query fields before vendors read the URL.
  try {
    const safe = new URL(current);
    const job = new URL(location.href).searchParams.get('job');
    if (interests.includes(job)) safe.searchParams.set('job', job);
    clickKeys.forEach(k=>{const v=clickValue(visitParams.get(k));if(v)safe.searchParams.set(k,v);});
    measurementUrl = safe.href;
    safe.hash = /^#[A-Za-z0-9_-]*$/.test(location.hash) ? location.hash : '';
    history.replaceState(history.state, '', safe.href);
  } catch { /* Source fields above remain filtered. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  const referrerOrigin = source.referrer ? new URL(source.referrer).origin : '';
  window.gtag('config', GA4, {
    send_page_view: true,
    campaign_source: source.utm_source, campaign_medium: source.utm_medium,
    campaign_name: source.utm_campaign, campaign_content: source.utm_content, campaign_term: source.utm_term,
    page_location: measurementUrl,
    page_referrer: referrerOrigin,
  });
  let loaded = false;
  const pending = [];
  const allowedEvents = new Set(['cta_click','job_interest_selected','demo_step','form_start','fit_note_submitted','speaking_request_submitted','luncheon_request_submitted','generate_lead','form_submit_error','scroll_depth','phone_click','email_click']);
  const allowedParams = new Set(['submission_id','form_id','request_kind','selected_interest','section_id','step','percent_scrolled','page_path','link_path','cta_source','phone_number_redacted','email_domain','page_referrer']);
  const ready = () => !!(window.google_tag_manager && window.google_tag_manager[GA4]);
  const send = (name, p) => window.gtag('event', name, { ...p, transport_type: 'beacon' });
  window.__bwmTrackEvent = (name, params = {}) => {
    if (!allowedEvents.has(name)) return;
    const p = { page_path: location.pathname };
    for (const [k,v] of Object.entries(params)) if (allowedParams.has(k) && ['string','number'].includes(typeof v)) p[k] = typeof v === 'string' ? v.slice(0,100) : v;
    if (p.submission_id && !/^[a-f0-9-]{36}$/i.test(p.submission_id)) delete p.submission_id;
    if (p.selected_interest && !interests.includes(p.selected_interest)) delete p.selected_interest;
    if (p.cta_source && !/^[a-z0-9-]{1,60}$/.test(p.cta_source)) delete p.cta_source;
    if (p.phone_number_redacted && !/^\d{4}$/.test(p.phone_number_redacted)) delete p.phone_number_redacted;
    if (p.email_domain && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(p.email_domain)) delete p.email_domain;
    if (p.page_referrer && !/^https?:\/\/[^/?#\s]+$/.test(p.page_referrer)) delete p.page_referrer;
    // Only this filtered payload enters vendors. Never form text, name, company or email.
    window.dataLayer.push({ event: name, ...p });
    if (ready()) send(name,p); else pending.push([name,p]);
  };
  const flush = () => { if (ready()) while (pending.length) send(...pending.shift()); };
  function load() {
    if (loaded) return;
    loaded = true;
    const g = document.createElement('script');g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
    let gtmLoaded = false;
    const loadGtm = () => {
      if (gtmLoaded) return;gtmLoaded = true;
      window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
      const t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtm.js?id='+GTM;document.head.appendChild(t);
    };
    g.addEventListener('load',loadGtm);g.addEventListener('error',loadGtm);document.head.appendChild(g);
    const poll=setInterval(flush,250);setTimeout(()=>{flush();clearInterval(poll);},20000);
  }
  ['pointerdown','keydown','touchstart','scroll'].forEach(e=>window.addEventListener(e,load,{once:true,passive:true}));
  setTimeout(load,5000);
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]');
    if(a){const u=new URL(a.href,location.href);const cta=a.getAttribute('data-cta-source');if(u.origin===location.origin && (cta||a.classList.contains('button')||a.classList.contains('header-cta'))) window.__bwmTrackEvent('cta_click',{link_path:u.pathname,cta_source:cta||'unspecified'});}
    const job=e.target.closest?.('[data-job]');if(job)window.__bwmTrackEvent('job_interest_selected',{selected_interest:job.dataset.job});
    const demo=e.target.closest?.('#demo-next,#demo-back');if(demo)window.__bwmTrackEvent('demo_step',{section_id:'lead-example',step:Number(document.querySelector('#demo-step')?.textContent.match(/\d+/)?.[0]||0)});
  });
  // Spec-Attribution-JS v2.10: tel and mailto clicks keep only the last four digits or the email domain.
  document.addEventListener('click',e=>{
    const href=e.target.closest?.('a[href]')?.getAttribute('href')||'';
    if(/^tel:/i.test(href)){const digits=href.replace(/\D/g,'');window.__bwmTrackEvent('phone_click',{phone_number_redacted:digits.length>=4?digits.slice(-4):'',page_referrer:referrerOrigin});}
    else if(/^mailto:/i.test(href)){const address=href.slice(7).split(/[?#]/)[0];window.__bwmTrackEvent('email_click',{email_domain:address.includes('@')?address.slice(address.lastIndexOf('@')+1).toLowerCase():'',page_referrer:referrerOrigin});}
  },true);
  document.querySelectorAll('[data-bob-inquiry]').forEach(form=>form.addEventListener('input',()=>window.__bwmTrackEvent('form_start',{form_id:'bob_'+form.dataset.kind,request_kind:form.dataset.kind}),{once:true}));
  const seen=new Set();window.addEventListener('scroll',()=>{
    const total=document.documentElement.scrollHeight-innerHeight;if(total<=0)return;
    const pct=scrollY/total*100;[25,50,75,90].forEach(n=>{if(pct>=n&&!seen.has(n)){seen.add(n);window.__bwmTrackEvent('scroll_depth',{percent_scrolled:n});}});
  },{passive:true});
})();
