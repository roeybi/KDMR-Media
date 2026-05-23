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
    nav_watch_live:      "Siaran Langsung & Undi",
    nav_winners:         "Juara-Juara",
    nav_winners_menu_label:"Pemenang",
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
    bento_sound:         "Irama Musim Ini",
    bento_costume:       "Busana Kemenangan",
    bento_countdown:     "Kira Detik Langsung",
    bento_view_schedule: "Lihat Jadual ↓",
    bento_days_to_final: "Hari ke Acara Akhir Negeri",
    bento_event_date:    "Hari Kaamatan · 30–31 Mei 2026<br>Penampang, Sabah",
    bento_winners_hub:   "Hab Pemenang",
    bento_hall_of_fame:  "Dewan Kemasyhuran",
    bento_kdmr_icons:    "Ikon KDMR",
    bento_nominate_figure:"Calonkan Tokoh",
    bento_browse_winners:"Lihat semua pemenang →",

    /* ── Search overlay ── */
    search_placeholder:  "Cari pemenang, nama, daerah, tahun…",
    button_esc:          "ESC",
    search_hint:         "Mula menaip untuk mencari dalam senarai Pemenang, Nama, Daerah, dan Tahun…",

    /* ── Schedule drawer ── */
    sched_title:         "Jadual Peringkat Negeri KDCA · Mei 2026",
    button_close:        "Tutup ×",
    sched_footer:        "Semua masa mengikut MYT (UTC+8) · Lokasi: Kompleks KDCA, Penampang, Sabah · Jadual tertakluk kepada pengesahan rasmi KDCA",

    /* ── Join section ── */
    label_community:     "Komuniti",
    join_title:          "Bersama Para Pemenang",
    join_desc:           "Calonkan ikon KDM atau kongsi berita terkini. KDMR Media dibina oleh komuniti.",
    button_nominate:     "Calonkan Tokoh",
    button_read_news:    "Baca Berita",

    /* ── Newsletter ── */
    label_the_pulse:     "Nadi KDMR",
    newsletter_title:    "Sertai Nadi KDMR",
    newsletter_desc:     "Dapatkan Panduan Acara Akhir 2026 & Berita Eksklusif Di Sebalik Tabir. Sertai Nadi KDMR.",
    newsletter_desc_short:"Dapatkan Panduan Acara Akhir 2026 & Berita Eksklusif Di Sebalik Tabir.",
    email_placeholder:   "emel@anda.com",
    button_subscribe:    "Langgan →",
    newsletter_spam_note:"Kami tidak akan menghantar spam — batal langganan pada bila-bila masa.",

    /* ── Footer ── */
    footer_about:        "Arkib budaya untuk masyarakat Kadazan, Dusun, Murut & Rungus di Sabah, Borneo.",
    footer_about_long:   "Arkib budaya dan hab komuniti untuk masyarakat Kadazan Dusun Murut Rungus (KDMR) di Sabah, Borneo.",
    footer_pages:        "Halaman",
    footer_explore:      "Terokai",
    footer_copyright:    "© 2026 KDMR Media. Dibina untuk komuniti, oleh komuniti.",
    footer_logo:         "KDMR·MEDIA",
    footer_location:     "Sabah, Borneo",
    footer_tagline:      "Meraikan warisan Kadazan Dusun Murut Rungus di Sabah, Borneo",
    footer_heritage_note:"Semua juara mewakili kekayaan warisan hidup masyarakat Kadazan, Dusun, Murut dan Rungus di Sabah, Borneo.",
    footer_data_note:    "Data mencerminkan pertandingan cawangan KDCA yang diadakan setiap tahun semasa Hari Kaamatan (Mei).",

    /* ── Winners page ── */
    winners_eyebrow:     "Pemenang",
    winners_title_accent:"Juara-Juara",
    winners_desc_1:      "Tiga pertandingan. Satu keraian warisan Kadazan Dusun Murut Rungus.",
    winners_desc_2:      "Pilih kategori untuk melihat senarai juara lalu di semua cawangan KDCA.",
    un_eyebrow:          "Ratu Cantik Budaya",
    un_title:            "Unduk Ngadau",
    un_description:      "Ratu pesta menuai — meraikan keanggunan, pengetahuan budaya & warisan",
    button_explore_champions:"Terokai Juara",
    label_kdca_sabah:    "KDCA Sabah",
    label_more:          "+ lagi",
    mrk_eyebrow:         "Pahlawan Warisan Budaya",
    mrk_title:           "Mr. Kaamatan (MRK)",
    mrk_description:     "Momogun Rungus Kadazan — memberi penghormatan kepada penjaga ilmu & pahlawan budaya peribumi",
    sg_eyebrow:          "Nyanyian Tradisional",
    sg_title:            "Sugandoi",
    sg_description:      "Pertandingan vokal tradisional KDM — memelihara lagu peribumi dan warisan lisan",

    /* ── News page ── */
    news_title:          "Berita & Cerita",
    news_description:    "Kemas kini terkini tentang budaya, warisan, dan acara komuniti KDMR dari seluruh Sabah, Borneo dan diaspora.",

    /* ── Peninsular 2026 ── */
    pm_eyebrow:          "Hari Kaamatan 2026",
    pm_title_accent:     "Juara Diaspora",
    pm_description:      "Juara cawangan diaspora KDCA 2026 di seluruh semenanjung. Tiga pertandingan, satu warisan — dirai oleh komuniti Kadazan Dusun Murut Rungus di setiap pelosok Semenanjung Malaysia.",

    /* ── Live / Gate ── */
    gate_pdpa_label:     "Pas Laluan Budaya · PDPA 2010",
    gate_state_final:    "Peringkat Akhir Negeri Hari Kaamatan 2026",
    gate_title:          "Sertai Arena — aktifkan undian & sembang langsung",
    gate_hint:           "Daftar sekali untuk mengundi dalam masa nyata bagi setiap kategori dan bersembang terus dengan komuniti.",
    gate_label_name:     "Nama Penuh",
    gate_label_username: "Nama Pengguna · Paparan awam",
    gate_label_email:    "Emel",
    gate_label_phone:    "Nombor Telefon",
    gate_label_ethnicity:"Etnik",
    gate_label_origin:   "Asal / Daerah",
    gate_placeholder_name:     "cth. Sarah Binti Majin",
    gate_placeholder_username: "sarah_dusun_88",
    gate_placeholder_email:    "emel@anda.com",
    gate_placeholder_phone:    "+60 12-345 6789",
    gate_placeholder_origin:   "cth. Penampang, KK",
    gate_select_tribe:   "Pilih suku kaum",
    tribe_kadazan:       "Kadazan",
    tribe_dusun:         "Dusun",
    tribe_murut:         "Murut",
    tribe_rungus:        "Rungus",
    tribe_other:         "Lain-lain / Campuran",
    gate_consent_text:   "Saya bersetuju membenarkan KDMR Media mengumpul data profil saya mengikut Akta PDPA 2010 Malaysia. Data disimpan 30 hari selepas acara, kemudian dipadamkan nama.",
    gate_disclaimer:     "Penafian: Undian popular komuniti KDMR Media tiada kesan ke atas pemarkahan rasmi Hongkod Koisaan.",
    gate_button_submit:  "Masuk ke Arena Langsung →",

    /* ── Chat ── */
    chat_title:          "Sembang Global",
    chat_online_count:   "1 dalam talian",
    chat_welcome_msg:    "Selamat datang ke Arena Langsung. Sila bertatasusila dan raikan warisan bersama kita.",
    chat_input_placeholder:"Taip komen di sini…",
    button_send:         "Hantar",

    /* ── Leaderboard ── */
    label_rankings:      "Kedudukan",
    lb_title:            "Unduk Ngadau 2026",
    lb_search_placeholder:"Cari peserta...",
    sort_highest_vote:   "Susunan: Undian Tertinggi",
    sort_default:        "Susunan: Asal",
    sort_name_az:        "Susunan: Nama A–Z",
    sort_district:       "Susunan: Daerah",
    vote_note:           "Nota: Undian popular komuniti hanya untuk penglibatan peminat. Tiada pengaruh ke atas pemarkahan rasmi Hongkod Koisaan.",

    /* ── Predict page ── */
    predict_page_title:  "Ramalan Top 7 — Unduk Ngadau 2026 | KDMR Media",
    predict_page_desc:   "Bina kad ramalan rasmi peminat 2026 anda.",
    predict_panel_title: "Ramalan Top 7",
    predict_panel_desc:  "Pilih juara & Top 7 anda untuk Unduk Ngadau 2026. Kad dikemas kini secara langsung.",
    predict_label_name:  "Nama anda (dipaparkan pada tajuk)",
    predict_label_theme: "Tema warna",
    theme_hutan:         "Hutan",
    theme_bobohizan:     "Bobohizan",
    theme_linangkit:     "Linangkit",
    theme_sirih:         "Sirih",
    theme_padi:          "Padi",
    predict_picking_rank:'Sedang memilih kedudukan <span class="active-rank-badge" id="activeRankBadge">1</span>',
    predict_search_placeholder:"Cari mengikut nama atau daerah…",
    predict_loading:     "Memuatkan peserta…",
    button_download_png: "↓ Muat Turun PNG",
    button_facebook:     "Facebook",
    button_ig_story:     "IG Story",
    predict_card_eyebrow:"RAMALAN PEMINAT · TOP 7 RASMI",
    predict_card_title:  'Diramal oleh <em data-bind="user">anda</em>',
    rank_champion:       "Juara",
    caption_champion:    "Juara",
    rank_2nd_runner_up:  "Tempat Ke-3",
    caption_2nd_runner_up:"Tempat Ketiga",
    rank_1st_runner_up:  "Tempat Ke-2",
    caption_1st_runner_up:"Naib Juara",
    rank_4th:            "Tempat Ke-4",
    rank_5th:            "Tempat Ke-5",
    rank_6th:            "Tempat Ke-6",
    rank_7th:            "Tempat Ke-7",
    caption_top7:        "Top 7",
    card_follow:         "Ikuti @KDMRMEDIA",
    card_url:            'Cipta milik anda · <span class="bold">KDMRMEDIA.COM/PREDICT</span>',
    card_cta:            "Ramal Pilihan Anda",

    /* ── Unduk Ngadau page ── */
    un_header_label:     "Unduk Ngadau — Juara Budaya Hari Kaamatan",
    un_locator_label:    "◉ Lokasi Unduk · Cawangan Diaspora",
    tab_peninsular:      "Semenanjung Malaysia",
    tab_sarawak:         "Sarawak",
    tab_sabah:           "Sabah",
    count_peninsula_branches:"6 cawangan diaspora",
    count_sarawak_branches:"1 cawangan",

    /* ── Sugandoi page ── */
    sg_header_label:     "Sugandoi — Pertandingan Nyanyian Tradisional KDM",

    /* ── MRK page ── */
    mrk_header_label:    "Momogun Rungus Kadazan — Pahlawan Warisan Budaya",
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
