/**
 * BWM Conversion Tracking — GA4 + Meta Pixel
 * Universal events: cta_click, phone_click, UTM capture
 * Loaded on all pages.
 */

// ---- UTM Preservation ----
(function () {
  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
    var val = params.get(key);
    if (val) sessionStorage.setItem(key, val);
  });
})();

// ---- CTA Click Tracking (Event 3) ----
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href*="/book"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'cta_click', {
          client_id: 'buildwise-media',
          cta_text: link.textContent.trim(),
          cta_location: link.closest('section')?.id || 'unknown',
          page_path: window.location.pathname
        });
      }
      if (typeof fbq === 'function') {
        fbq('track', 'ViewContent', {
          content_name: link.textContent.trim()
        });
      }
    });
  });

  // ---- Phone Click Tracking (Event 4) ----
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'phone_click', {
          client_id: 'buildwise-media',
          phone_number: link.getAttribute('href').replace('tel:', ''),
          page_path: window.location.pathname
        });
      }
      if (typeof fbq === 'function') {
        fbq('track', 'Contact');
      }
    });
  });
});
