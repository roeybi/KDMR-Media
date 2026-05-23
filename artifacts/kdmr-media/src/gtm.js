/**
 * src/gtm.js — Self-injecting Google Tag Manager
 *
 * Place in <head> of any page:
 *   <script type="module" src="./src/gtm.js"></script>
 *
 * This module automatically injects:
 *   1. The GTM loader <script>  (into <head>)
 *   2. The <noscript><iframe>    (into <body> as first child)
 *
 * If the tags already exist (e.g. from inline copy-paste), it skips injection
 * so there are never duplicates.
 */

(function () {
  const GTM_ID = 'GTM-WMLPZJ9D';

  /* ── 1. Inject GTM script into <head> if missing ──────────────────────────────── */
  const head = document.head;
  if (!head.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
    const s = document.createElement('script');
    s.textContent =
      "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':" +
      "new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0]," +
      "j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=" +
      "'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
      "})(window,document,'script','dataLayer','" + GTM_ID + "');";
    head.insertBefore(s, head.firstChild);
  }

  /* ── 2. Inject noscript iframe into <body> as first child if missing ──────────── */
  function injectBodyTag() {
    if (!document.querySelector('noscript iframe[src*="googletagmanager.com/ns.html"]')) {
      const noscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID;
      iframe.height = '0';
      iframe.width  = '0';
      iframe.style.cssText = 'display:none;visibility:hidden';
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }
  }
  // Script runs in <head> before <body> exists — defer until DOM is ready
  if (document.body) {
    injectBodyTag();
  } else {
    document.addEventListener('DOMContentLoaded', injectBodyTag);
  }
})();
