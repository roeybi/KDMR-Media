// ── i18n Translation Engine ────────────────────────────────────────────────
// Dictionary keys match data-i18n attributes in the HTML.
// "ms" values are intentionally left empty — the HTML already contains the
// default Bahasa Malaysia text and will NOT be overwritten on load.
// Populate "en" values here when ready to add English translations.

const i18n = {
  en: {
    /* ── Navigation ── */
    nav_watch_live:    "Watch Live & Vote",
    nav_winners:       "Winners",
    nav_top7_predict:  "Top 7 Predict",
    nav_news:          "News",
    nav_follow_us:     "Follow us",

    /* ── Stats bar ── */
    stat_contestants:  "Contestants",
    stat_states:       "States & Territories",
    stat_districts:    "Districts",

    /* ── Prediction teaser ── */
    predict_eyebrow:   "Fan Prediction · Official Top 7",
    predict_title:     "Choose Your 2026 Unduk Ngadau",
    predict_subtitle:  "Choose your champions for the 2026 crown",
    predict_cta_btn:   "Start Predicting",
    predict_cta_sub:   "Official 2026 Prediction Engine",

    /* ── Countdown ── */
    countdown_eyebrow: "Hari Kaamatan 2026",
    countdown_sub:     "KDMR Diaspora · 53 Branches Nationwide",
    countdown_label:   "⏱ Countdown to Kaamatan",
    countdown_cta_btn: "Meet the Champions",

    /* ── Bento ── */
    bento_discover:    "Discover",
  },
  ms: {
    /* Bahasa Malaysia — source of truth is the HTML; leave all empty */
  },
};

let currentLang = "ms";

document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("langToggleBtn");
  if (!langBtn) return;

  langBtn.addEventListener("click", () => {
    currentLang = currentLang === "ms" ? "en" : "ms";

    // Button shows the OTHER language the user can switch TO
    langBtn.textContent = currentLang === "ms" ? "EN" : "BM";

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = i18n[currentLang][key];
      if (val !== undefined && val !== "") {
        // Use innerHTML when the translation contains markup, textContent otherwise
        if (val.includes("<")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
      // If val is undefined or "" (ms keys are empty), the element's
      // existing HTML text is left untouched — BM is always the fallback.
    });
  });
});
