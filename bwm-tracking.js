/* ============================================
   BWM Conversion Tracking — Shared Analytics
   Spec: specs/Spec-BWM-Conversion-Tracking.md
   Architecture: dataLayer-only. GTM handles
   GA4, Meta Pixel, and CAPI downstream.
   ============================================ */

/* --- UTM Preservation (all pages) ---
   Canonical pattern from SOP: UTM Tracking & Campaign Attribution.
   Stores as single JSON object in sessionStorage under 'bwm_utm'. */
(function() {
  var params = new URLSearchParams(window.location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  var hasUtm = utmKeys.some(function(key) { return params.has(key); });

  if (hasUtm) {
    var utmData = {};
    utmKeys.forEach(function(key) {
      utmData[key] = params.get(key) || (key === 'utm_source' ? 'direct' : 'none');
    });
    sessionStorage.setItem('bwm_utm', JSON.stringify(utmData));
  }

  if (!hasUtm && !sessionStorage.getItem('bwm_utm')) {
    sessionStorage.setItem('bwm_utm', JSON.stringify({
      utm_source: 'direct',
      utm_medium: 'none',
      utm_campaign: 'none',
      utm_content: 'none',
      utm_term: 'none'
    }));
  }
})();


/* --- CTA Click Tracking (all pages — Tier 2) ---
   Fires: GA4 cta_click + Meta ViewContent (via GTM CAPI tag) */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href*="/book"]').forEach(function(link) {
    link.addEventListener('click', function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'cta_click',
        client_id: 'buildwise-media',
        cta_text: link.textContent.trim(),
        cta_location: (link.closest('section') && link.closest('section').id) || 'unknown',
        journey_stage: 'contact_intent',
        page_path: window.location.pathname
      });
    });
  });


  /* --- Phone Click Tracking (all pages — Tier 1) ---
     Fires: GA4 phone_click + Meta Contact (via GTM CAPI tag) */
  document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'phone_click',
        client_id: 'buildwise-media',
        phone_number: link.getAttribute('href').replace('tel:', ''),
        journey_stage: 'contact_intent',
        page_path: window.location.pathname
      });
    });
  });
});
