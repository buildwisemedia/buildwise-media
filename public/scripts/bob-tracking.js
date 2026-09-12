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
  const source = { page_url: current, landing_page: current, referrer: clean(document.referrer) };
  const params = new URL(current || location.href).searchParams;
  keys.forEach(k => { if (params.has(k)) source[k] = params.get(k); });
  clickKeys.forEach(k => { const v=clickValue(visitParams.get(k));if(v)source[k]=v; });
  if (production && !optedOut) {
    try {
      const legacy=JSON.parse(localStorage.getItem('_bwm_attribution')||'null');
      const old=legacy?.last_touch?.utm||legacy?.first_touch?.utm||{};
      keys.forEach(k=>{if(!source[k]&&typeof old[k]==='string'&&!/[@\r\n]/.test(old[k]))source[k]=old[k].slice(0,160);});
      clickKeys.forEach(k=>{if(!source[k]&&clickValue(old[k]))source[k]=old[k];});
      const prior = JSON.parse(sessionStorage.getItem('bob_visit_source') || 'null');
      if (prior && typeof prior === 'object') {
        source.landing_page = clean(prior.landing_page) || current;
        clickKeys.forEach(k=>{if(!source[k]&&clickValue(prior[k]))source[k]=prior[k];});
        source.referrer = clean(prior.referrer);
        keys.forEach(k => { if (!source[k] && typeof prior[k] === 'string' && !/[@\r\n]/.test(prior[k])) source[k] = prior[k].slice(0,160); });
      }
      sessionStorage.setItem('bob_visit_source', JSON.stringify(source));
    } catch { /* A blocked store must not prevent a request. */ }
  }
  window.__bobSourceDetails = () => {
    const result={...source,page_url:clean(location.href)};
    if(production&&!optedOut){
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
  window.gtag('config', GA4, {
    send_page_view: true,
    campaign_source: source.utm_source, campaign_medium: source.utm_medium,
    campaign_name: source.utm_campaign, campaign_content: source.utm_content, campaign_term: source.utm_term,
    page_location: measurementUrl,
    page_referrer: source.referrer ? new URL(source.referrer).origin : '',
  });
  let loaded = false;
  const pending = [];
  const allowedEvents = new Set(['cta_click','job_interest_selected','demo_step','form_start','fit_note_submitted','speaking_request_submitted','luncheon_request_submitted','generate_lead','form_submit_error','scroll_depth']);
  const allowedParams = new Set(['submission_id','form_id','request_kind','selected_interest','section_id','step','percent_scrolled','page_path','link_path']);
  const ready = () => !!(window.google_tag_manager && window.google_tag_manager[GA4]);
  const send = (name, p) => window.gtag('event', name, { ...p, transport_type: 'beacon' });
  window.__bwmTrackEvent = (name, params = {}) => {
    if (!allowedEvents.has(name)) return;
    const p = { page_path: location.pathname };
    for (const [k,v] of Object.entries(params)) if (allowedParams.has(k) && ['string','number'].includes(typeof v)) p[k] = typeof v === 'string' ? v.slice(0,100) : v;
    if (p.submission_id && !/^[a-f0-9-]{36}$/i.test(p.submission_id)) delete p.submission_id;
    if (p.selected_interest && !interests.includes(p.selected_interest)) delete p.selected_interest;
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
    if(a){const u=new URL(a.href,location.href);if(u.origin===location.origin && (a.classList.contains('button')||a.classList.contains('header-cta'))) window.__bwmTrackEvent('cta_click',{link_path:u.pathname});}
    const job=e.target.closest?.('[data-job]');if(job)window.__bwmTrackEvent('job_interest_selected',{selected_interest:job.dataset.job});
    const demo=e.target.closest?.('#demo-next,#demo-back');if(demo)window.__bwmTrackEvent('demo_step',{section_id:'lead-example',step:Number(document.querySelector('#demo-step')?.textContent.match(/\d+/)?.[0]||0)});
  });
  document.querySelectorAll('[data-bob-inquiry]').forEach(form=>form.addEventListener('input',()=>window.__bwmTrackEvent('form_start',{form_id:'bob_'+form.dataset.kind,request_kind:form.dataset.kind}),{once:true}));
  const seen=new Set();window.addEventListener('scroll',()=>{
    const total=document.documentElement.scrollHeight-innerHeight;if(total<=0)return;
    const pct=scrollY/total*100;[25,50,75,90].forEach(n=>{if(pct>=n&&!seen.has(n)){seen.add(n);window.__bwmTrackEvent('scroll_depth',{percent_scrolled:n});}});
  },{passive:true});
})();
