// ── i18n Translation Engine ────────────────────────────────────────────────
// Both "en" and "ms" dictionaries are populated.
// The engine swaps text using data-i18n attributes on elements.
// HTML default text is in Bahasa Malaysia — matches the ms dictionary.

const i18n = {
  en: {
    /* ── Navigation ── */
    nav_watch_live:    "Watch Live & Vote",
    nav_winners:       "Champions",
    nav_top7_predict:  "Predict Top 7",
    nav_news:          "Latest News",
    nav_follow_us:     "Follow Us",

    /* ── Stats bar ── */
    stat_contestants:  "Contestants",
    stat_states:       "States & Territories",
    stat_districts:    "Districts",

    /* ── Prediction teaser ── */
    predict_eyebrow:   "Fan Prediction · Official Top 7",
    predict_title:     "Choose Your 2026 Unduk Ngadau",
    predict_subtitle:  "Select your champions for the 2026 crown.",
    predict_cta_btn:   "Start Predicting",
    predict_cta_sub:   "Official 2026 Prediction Engine",

    /* ── Countdown ── */
    countdown_eyebrow: "Kaamatan Festival 2026",
    countdown_sub:     "KDMR Diaspora · 53 Branches Nationwide",
    countdown_label:   "⏱ Countdown to Kaamatan",
    countdown_cta_btn: "Meet the Champions",

    /* ── Bento ── */
    bento_discover:    "Discover",
  },
  ms: {
    /* ── Navigation ── */
    nav_watch_live:    "Saksi Langsung & Undi",
    nav_winners:       "Senarai Pemenang",
    nav_top7_predict:  "Ramalan Top 7",
    nav_news:          "Berita Terkini",
    nav_follow_us:     "Ikuti Kami",

    /* ── Stats bar ── */
    stat_contestants:  "Peserta",
    stat_states:       "Negeri & Wilayah",
    stat_districts:    "Daerah",

    /* ── Prediction teaser ── */
    predict_eyebrow:   "Ramalan Peminat · Top 7 Rasmi",
    predict_title:     "Pilih Unduk Ngadau 2026 Anda",
    predict_subtitle:  "Pilih calon pilihan anda untuk mahkota 2026.",
    predict_cta_btn:   "Mula Meramal",
    predict_cta_sub:   "Enjin Ramalan Rasmi 2026",

    /* ── Countdown ── */
    countdown_eyebrow: "Hari Kaamatan 2026",
    countdown_sub:     "Diaspora KDMR · 53 Cawangan Seluruh Negara",
    countdown_label:   "⏱ Kira Detik Kaamatan",
    countdown_cta_btn: "Kenali Para Juara",

    /* ── Bento ── */
    bento_discover:    "Terokai",
  },
};

let currentLang = "ms";

document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("langToggleBtn");
  if (!langBtn) return;

  langBtn.addEventListener("click", () => {
    currentLang = currentLang === "ms" ? "en" : "ms";

    // Button always shows the OTHER language the user can switch TO
    langBtn.textContent = currentLang === "ms" ? "EN" : "BM";

    const dict = i18n[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (val !== undefined && val !== "") {
        // Use innerHTML when the translation contains markup, textContent otherwise
        if (val.includes("<")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });
  });
});
