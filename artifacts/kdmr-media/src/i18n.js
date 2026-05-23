// ── i18n Translation Engine ───────────────────────────────────────────────────
// Both "en" and "ms" dictionaries are populated.
// The engine swaps text using data-i18n attributes on elements.
// HTML default text is in English — matches the en dictionary.

const i18n = {
  en: {
    /* ── Navigation ── */
    nav_watch_live:      "Watch Live & Vote",
    nav_winners:           "Champions",
    nav_winners_menu_label:"Winners",
    nav_unduk_ngadau:      "Unduk Ngadau",
    nav_mr_kaamatan:       "Mr. Kaamatan",
    nav_sugandoi:          "Sugandoi",
    nav_news:              "News",
    nav_follow_us:         "Follow us",
    nav_home:              "Home",
    nav_news_current:      "News",

    /* ── Stats bar ── */
    stat_contestants:      "Contestants",
    stat_states:           "States & Territories",
    stat_districts:        "Districts",

    /* ── Prediction teaser (index) ── */
    predict_eyebrow:       "Fan Prediction · Official Top 7",
    predict_title:         "Choose Your 2026 Unduk Ngadau",
    predict_subtitle:      "Select your champions for the 2026 crown.",
    predict_cta_btn:       "Start Predicting",
    predict_cta_sub:       "Official 2026 Prediction Engine",

    /* ── Countdown ── */
    countdown_eyebrow:     "Kaamatan Festival 2026",
    countdown_sub:         "KDMR Diaspora · 53 Branches Nationwide",
    countdown_label:       "⏱ Countdown to Kaamatan",
    countdown_cta_btn:     "Meet the Champions",

    /* ── Bento grid ── */
    bento_discover:        "Discover",
    bento_sound:           "This Season's Sound",
    bento_costume:         "Winning Costume",
    bento_countdown:       "Live Countdown",
    bento_view_schedule:   "View Schedule ↓",
    bento_days_to_final:   "Days to State Final",
    bento_event_date:      "Hari Kaamatan · 30–31 May 2026<br>Penampang, Sabah",
    bento_winners_hub:     "Winners Hub",
    bento_hall_of_fame:    "Hall of Fame",
    bento_kdmr_icons:      "KDMR Icons",
    bento_nominate_figure: "Nominate a figure",
    bento_browse_winners:  "Browse all winners →",

    /* ── Search overlay ── */
    search_placeholder:    "Search winners, names, districts, years…",
    button_esc:            "ESC",
    search_hint:           "Start typing to search across Winners, Names, Districts, and Years…",

    /* ── Schedule drawer ── */
    sched_title:           "KDCA State-Level Schedule · May 2026",
    button_close:          "Close ×",
    sched_footer:          "All times MYT (UTC+8) · Venue: KDCA Complex, Penampang, Sabah · Schedule subject to official KDCA confirmation",

    /* ── Join section ── */
    label_community:       "Community",
    join_title:            "Be part of the Winners",
    join_desc:             "Nominate a KDM icon or submit a news story. KDMR Media is built by the community.",
    button_nominate:       "Nominate a Figure",
    button_read_news:      "Read News",

    /* ── Newsletter ── */
    label_the_pulse:       "The Pulse",
    newsletter_title:      "Join the KDMR Pulse",
    newsletter_desc:         "Get the 2026 State Final Survival Guide & Exclusive Behind-the-Scenes Updates. Join the Pulse.",
    newsletter_desc_short: "Get the 2026 State Final Survival Guide & Exclusive Behind-the-Scenes Updates.",
    email_placeholder:     "your@email.com",
    button_subscribe:      "Subscribe →",
    newsletter_spam_note:  "We'll never spam — unsubscribe anytime.",

    /* ── Footer ── */
    footer_about:          "Cultural archive for the Kadazan, Dusun, Murut & Rungus peoples of Sabah, Borneo.",
    footer_about_long:     "A cultural archive and community hub for the Kadazan Dusun Murut Rungus (KDMR) people of Sabah, Borneo.",
    footer_pages:          "Pages",
    footer_explore:        "Explore",
    footer_copyright:        "© 2026 KDMR Media. Built for the community, by the community.",
    footer_logo:           "KDMR·MEDIA",
    footer_location:       "Sabah, Borneo",
    footer_tagline:        "Celebrating the Kadazan Dusun Murut Rungus heritage of Sabah, Borneo",
    footer_heritage_note:  "All champions represent the rich living heritage of the Kadazan, Dusun, Murut and Rungus peoples of Sabah, Borneo.",
    footer_data_note:      "Data reflects KDCA branch competitions held annually during Hari Kaamatan (May).",

    /* ── Winners page ── */
    winners_eyebrow:       "The Winners",
    winners_title_accent:  "Champions",
    winners_desc_1:        "Three competitions. One celebration of Kadazan Dusun Murut Rungus heritage.",
    winners_desc_2:        "Select a category to explore past champions across all KDCA branches.",
    un_eyebrow:            "Cultural Beauty Queen",
    un_title:              "Unduk Ngadau",
    un_description:        "The harvest festival queen — celebrating grace, cultural knowledge & heritage",
    button_explore_champions:"Explore champions",
    label_kdca_sabah:      "KDCA Sabah",
    label_more:            "+ more",
    mrk_eyebrow:           "Cultural Heritage Warrior",
    mrk_title:             "Mr. Kaamatan (MRK)",
    mrk_description:       "Momogun Rungus Kadazan — honouring indigenous knowledge keepers & cultural warriors",
    sg_eyebrow:            "Traditional Singing",
    sg_title:              "Sugandoi",
    sg_description:        "Traditional KDM vocal competition — preserving indigenous songs and oral heritage",

    /* ── News page ── */
    news_title:            "News & Stories",
    news_description:      "Latest updates on KDMR culture, heritage, and community events from across Sabah, Borneo and the diaspora.",

    /* ── Peninsular 2026 ── */
    pm_eyebrow:            "Hari Kaamatan 2026",
    pm_title_accent:       "Diaspora Champions",
    pm_description:        "2026 KDCA diaspora branch champions across the peninsula. Three competitions, one heritage — celebrated by Kadazan Dusun Murut Rungus communities in every corner of Peninsular Malaysia.",

    /* ── Live / Gate ── */
    gate_pdpa_label:       "Cultural Gate Pass · PDPA 2010",
    gate_state_final:      "Hari Kaamatan 2026 State Final",
    gate_title:            "Join the Arena — unlock votes & live chat",
    gate_hint:             "Register once to cast real-time votes for every category and chat live with the community.",
    gate_label_name:       "Full Name",
    gate_label_username:   "Username · Public name",
    gate_label_email:      "Email",
    gate_label_phone:      "Phone Number",
    gate_label_ethnicity:  "Ethnicity",
    gate_label_origin:     "Origin / District",
    gate_placeholder_name:      "e.g. Sarah Binti Majin",
    gate_placeholder_username:  "sarah_dusun_88",
    gate_placeholder_email:     "your@email.com",
    gate_placeholder_phone:     "+60 12-345 6789",
    gate_placeholder_origin:    "e.g. Penampang, KK",
    gate_select_tribe:     "Select tribe",
    tribe_kadazan:         "Kadazan",
    tribe_dusun:           "Dusun",
    tribe_murut:           "Murut",
    tribe_rungus:          "Rungus",
    tribe_other:           "Other / Mixed",
    gate_consent_text:     "I consent to KDMR Media collecting my profile data under Malaysia's PDPA 2010. Data retained 30 days post-event, then anonymised.",
    gate_disclaimer:       "Disclaimer: The KDMR Media popular vote has no bearing on official Hongkod Koisaan scoring.",
    gate_button_submit:    "Enter the Live Arena →",

    /* ── Chat ── */
    chat_title:            "Global Chat",
    chat_online_count:     "1 online",
    chat_welcome_msg:      "Welcome to the Live Arena. Be respectful and celebrate our shared heritage.",
    chat_input_placeholder:"Type comment here…",
    button_send:           "Send",

    /* ── Leaderboard ── */
    label_rankings:        "Rankings",
    lb_title:              "Unduk Ngadau 2026",
    lb_search_placeholder: "Search contestant...",
    sort_highest_vote:     "Sort: Highest Vote",
    sort_default:          "Sort: Default",
    sort_name_az:          "Sort: Name A–Z",
    sort_district:         "Sort: District",
    vote_note:             "Note: Community-driven popular vote for fan engagement only. Zero influence on official Hongkod Koisaan scoring.",

    /* ── Predict page ── */
    predict_page_title:    "Predict Top 7 — Unduk Ngadau 2026 | KDMR Media",
    predict_page_desc:     "Build your 2026 official fan prediction card.",
    predict_panel_title:   "Predict Top 7",
    predict_panel_desc:    "Pick your champion & Top 7 for Unduk Ngadau 2026. Card updates live.",
    predict_label_name:    "Your name (appears in title)",
    predict_label_theme:   "Color theme",
    theme_hutan:           "Hutan",
    theme_bobohizan:       "Bobohizan",
    theme_linangkit:       "Linangkit",
    theme_sirih:           "Sirih",
    theme_padi:            "Padi",
    predict_picking_rank:  'Picking rank <span class="active-rank-badge" id="activeRankBadge">1</span>',
    predict_search_placeholder: "Search by name or region…",
    predict_loading:       "Loading contestants…",
    button_download_png:   "↓ Download PNG",
    button_facebook:       "Facebook",
    button_ig_story:       "IG Story",
    predict_card_eyebrow:  "FAN PREDICTION · OFFICIAL TOP 7",
    predict_card_title:    'Predicted by <em data-bind="user">you</em>',
    rank_champion:         "Champion",
    caption_champion:      "Champion",
    rank_2nd_runner_up:  "2nd Place",
    caption_2nd_runner_up:"2nd Runner-up",
    rank_1st_runner_up:  "3rd Place",
    caption_1st_runner_up:"1st Runner-up",
    rank_4th:              "4th Place",
    rank_5th:              "5th Place",
    rank_6th:              "6th Place",
    rank_7th:              "7th Place",
    caption_top7:          "Top 7",
    card_follow:           "Follow @KDMRMEDIA",
    card_url:              'Make yours · <span class="bold">KDMRMEDIA.COM/PREDICT</span>',
    card_cta:              "Predict Yours",

    /* ── Unduk Ngadau page ── */
    un_header_label:       "Unduk Ngadau — Hari Kaamatan Cultural Champion",
    un_locator_label:      "◉ Unduk Locator · Diaspora Branches",
    tab_peninsular:        "Peninsular Malaysia",
    tab_sarawak:           "Sarawak",
    tab_sabah:             "Sabah",
    count_peninsula_branches:"6 diaspora branches",
    count_sarawak_branches:"1 branch",

    /* ── Sugandoi page ── */
    sg_header_label:       "Sugandoi — Traditional KDM Singing Competition",

    /* ── MRK page ── */
    mrk_header_label:      "Momogun Rungus Kadazan — Cultural Heritage Warrior",
  },

  ms: {
    /* ── Navigation ── */
    nav_watch_live:      "Saksi Langsung & Undi",
    nav_winners:         "Senarai Pemenang",
    nav_winners_menu_label: "Pemenang",
    nav_unduk_ngadau:    "Unduk Ngadau",
    nav_mr_kaamatan:     "Mr. Kaamatan",
    nav_sugandoi:        "Sugandoi",
    nav_news:            "Berita Terkini",
    nav_follow_us:       "Ikuti Kami",
    nav_home:            "Laman Utama",
    nav_news_current:    "Berita",

    /* ── Stats bar ── */
    stat_contestants:    "Peserta",
    stat_states:         "Negeri & Wilayah",
    stat_districts:      "Daerah",

    /* ── Prediction teaser (index) ── */
    predict_eyebrow:     "Ramalan Peminat · Top 7 Rasmi",
    predict_title:       "Pilih Unduk Ngadau 2026 Anda",
    predict_subtitle:    "Pilih calon pilihan anda untuk mahkota 2026.",
    predict_cta_btn:     "Mula Meramal",
    predict_cta_sub:     "Enjin Ramalan Rasmi 2026",

    /* ── Countdown ── */
    countdown_eyebrow:   "Hari Kaamatan 2026",
    countdown_sub:       "Diaspora KDMR · 53 Cawangan Seluruh Negara",
    countdown_label:     "⏱ Kira Detik Kaamatan",
    countdown_cta_btn:   "Kenali Para Juara",

    /* ── Bento grid ── */
    bento_discover:      "Terokai",
    bento_sound:         "",
    bento_costume:       "",
    bento_countdown:     "",
    bento_view_schedule: "",
    bento_days_to_final: "",
    bento_event_date:    "",
    bento_winners_hub:   "",
    bento_hall_of_fame:  "",
    bento_kdmr_icons:    "",
    bento_nominate_figure:"",
    bento_browse_winners:"",

    /* ── Search overlay ── */
    search_placeholder:  "",
    button_esc:          "",
    search_hint:         "",

    /* ── Schedule drawer ── */
    sched_title:         "",
    button_close:        "",
    sched_footer:        "",

    /* ── Join section ── */
    label_community:     "",
    join_title:          "",
    join_desc:           "",
    button_nominate:     "",
    button_read_news:    "",

    /* ── Newsletter ── */
    label_the_pulse:     "",
    newsletter_title:    "",
    newsletter_desc:     "",
    newsletter_desc_short:"",
    email_placeholder:   "",
    button_subscribe:    "",
    newsletter_spam_note:"",

    /* ── Footer ── */
    footer_about:        "",
    footer_about_long:   "",
    footer_pages:        "",
    footer_explore:      "",
    footer_copyright:    "",
    footer_logo:         "",
    footer_location:     "",
    footer_tagline:      "",
    footer_heritage_note:"",
    footer_data_note:    "",

    /* ── Winners page ── */
    winners_eyebrow:     "",
    winners_title_accent:"",
    winners_desc_1:      "",
    winners_desc_2:      "",
    un_eyebrow:          "",
    un_title:            "",
    un_description:      "",
    button_explore_champions:"",
    label_kdca_sabah:    "",
    label_more:          "",
    mrk_eyebrow:         "",
    mrk_title:           "",
    mrk_description:     "",
    sg_eyebrow:          "",
    sg_title:            "",
    sg_description:      "",

    /* ── News page ── */
    news_title:          "",
    news_description:    "",

    /* ── Peninsular 2026 ── */
    pm_eyebrow:          "",
    pm_title_accent:     "",
    pm_description:      "",

    /* ── Live / Gate ── */
    gate_pdpa_label:     "",
    gate_state_final:    "",
    gate_title:          "",
    gate_hint:           "",
    gate_label_name:     "",
    gate_label_username: "",
    gate_label_email:    "",
    gate_label_phone:    "",
    gate_label_ethnicity:"",
    gate_label_origin:   "",
    gate_placeholder_name:      "",
    gate_placeholder_username:  "",
    gate_placeholder_email:     "",
    gate_placeholder_phone:     "",
    gate_placeholder_origin:    "",
    gate_select_tribe:   "",
    tribe_kadazan:       "",
    tribe_dusun:         "",
    tribe_murut:         "",
    tribe_rungus:        "",
    tribe_other:         "",
    gate_consent_text:   "",
    gate_disclaimer:     "",
    gate_button_submit:  "",

    /* ── Chat ── */
    chat_title:          "",
    chat_online_count:   "",
    chat_welcome_msg:    "",
    chat_input_placeholder:"",
    button_send:         "",

    /* ── Leaderboard ── */
    label_rankings:      "",
    lb_title:            "",
    lb_search_placeholder:"",
    sort_highest_vote:   "",
    sort_default:        "",
    sort_name_az:        "",
    sort_district:       "",
    vote_note:           "",

    /* ── Predict page ── */
    predict_page_title:  "",
    predict_page_desc:   "",
    predict_panel_title: "",
    predict_panel_desc:  "",
    predict_label_name:  "",
    predict_label_theme: "",
    theme_hutan:         "",
    theme_bobohizan:     "",
    theme_linangkit:     "",
    theme_sirih:         "",
    theme_padi:          "",
    predict_picking_rank:'',
    predict_search_placeholder:"",
    predict_loading:     "",
    button_download_png: "",
    button_facebook:     "",
    button_ig_story:     "",
    predict_card_eyebrow:"",
    predict_card_title:  '',
    rank_champion:       "",
    caption_champion:    "",
    rank_2nd_runner_up:"",
    caption_2nd_runner_up:"",
    rank_1st_runner_up:"",
    caption_1st_runner_up:"",
    rank_4th:            "",
    rank_5th:            "",
    rank_6th:            "",
    rank_7th:            "",
    caption_top7:        "",
    card_follow:         "",
    card_url:            '',
    card_cta:            "",

    /* ── Unduk Ngadau page ── */
    un_header_label:     "",
    un_locator_label:    "",
    tab_peninsular:      "",
    tab_sarawak:         "",
    tab_sabah:           "",
    count_peninsula_branches:"",
    count_sarawak_branches:"",

    /* ── Sugandoi page ── */
    sg_header_label:     "",

    /* ── MRK page ── */
    mrk_header_label:    "",
  },
};

let currentLang = "en";

document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("langToggleBtn");
  if (!langBtn) return;

  // Detect default from <html lang>
  const htmlLang = document.documentElement.lang;
  if (htmlLang === "ms") currentLang = "ms";

  // Set initial button label
  langBtn.textContent = currentLang === "ms" ? "EN" : "BM";

  const apply = () => {
    const dict = i18n[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (val !== undefined && val !== "") {
        if (val.includes("<")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });
  };

  langBtn.addEventListener("click", () => {
    currentLang = currentLang === "ms" ? "en" : "ms";
    langBtn.textContent = currentLang === "ms" ? "EN" : "BM";
    apply();
  });

  // Apply on load if currentLang != "en" (default HTML is English)
  if (currentLang !== "en") apply();
});
