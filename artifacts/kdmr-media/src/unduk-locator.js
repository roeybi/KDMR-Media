/**
 * src/unduk-locator.js
 * Self-contained embeddable Unduk Ngadau locator hero.
 * Export: mountLocatorHero(sectionEl)
 */

export function mountLocatorHero(section) {
  if (!section) return;
  section.dataset.hero = 'locator';

  /* ── styles ──────────────────────────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .ul-hero {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      min-height: 100svh;
      background: #080808;
      overflow: hidden;
      padding: 0;
    }
    .ul-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 30% 55%, rgba(240,168,32,0.055) 0%, transparent 70%);
      pointer-events: none;
    }
    .ul-layout {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 32px;
      gap: 0;
    }
    .ul-map-col {
      flex: 1 1 55%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 24px 40px 0;
    }
    .ul-map-inner {
      position: relative;
      width: 100%;
      max-width: 560px;
    }
    .ul-panel-col {
      flex: 0 0 380px;
      padding: 40px 0 40px 32px;
      border-left: 1px solid rgba(240,168,32,0.1);
    }
    .ul-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.56rem;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #f0a820;
      margin-bottom: 18px;
    }
    .ul-eyebrow-dot {
      width: 6px; height: 6px;
      background: #f0a820;
      border-radius: 50%;
      box-shadow: 0 0 6px #f0a820;
      animation: ul-pulse 1.8s ease-in-out infinite;
    }
    @keyframes ul-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.75); }
    }
    .ul-title {
      font-size: clamp(2rem, 3.6vw, 3rem);
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.05;
      color: #f0f0f0;
      margin: 0 0 8px;
    }
    .ul-title span { color: #f0a820; }
    .ul-sub {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(240,168,32,0.55);
      margin: 0 0 28px;
    }
    .ul-countdown {
      display: flex;
      gap: 10px;
      margin-bottom: 32px;
    }
    .ul-cd-unit {
      text-align: center;
      min-width: 52px;
    }
    .ul-cd-num {
      font-size: 1.6rem;
      font-weight: 900;
      color: #f0a820;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .ul-cd-label {
      font-size: 0.48rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #3a3a3a;
      margin-top: 4px;
    }
    .ul-cd-sep {
      font-size: 1.4rem;
      font-weight: 900;
      color: rgba(240,168,32,0.3);
      align-self: flex-start;
      padding-top: 2px;
    }
    .ul-cd-label-main {
      font-size: 0.52rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #333;
      margin-bottom: 10px;
    }
    .ul-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f0a820;
      color: #0a0a0a;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 12px 24px;
      border-radius: 2px;
      text-decoration: none;
      transition: background 0.18s, transform 0.18s;
    }
    .ul-cta:hover { background: #f5c040; transform: translateY(-1px); }
    .ul-branches {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 24px;
    }
    .ul-branch-chip {
      font-size: 0.54rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #444;
      border: 1px solid #222;
      padding: 4px 10px;
      border-radius: 2px;
      white-space: nowrap;
    }
    .ul-scroll-hint {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      pointer-events: none;
      z-index: 2;
    }
    .ul-scroll-hint span {
      font-size: 0.48rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #2a2a2a;
    }
    .ul-scroll-hint div {
      width: 1px; height: 32px;
      background: linear-gradient(to bottom, #2a2a2a, transparent);
    }
    /* map label */
    .ul-map-label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .ul-map-label-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, #1e1e1e); }
    .ul-map-label-text {
      font-size: 0.52rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #2a2a2a;
      white-space: nowrap;
    }
    /* Mobile */
    @media (max-width: 768px) {
      .ul-layout {
        flex-direction: column;
        padding: 28px 16px 16px;
        gap: 0;
      }
      .ul-map-col {
        flex: none;
        width: 100%;
        padding: 0 0 20px;
      }
      .ul-panel-col {
        flex: none;
        width: 100%;
        padding: 20px 0 0;
        border-left: none;
        border-top: 1px solid rgba(240,168,32,0.1);
      }
      .ul-title { font-size: clamp(1.6rem, 7vw, 2.4rem); }
      .ul-countdown { gap: 8px; }
      .ul-cd-num { font-size: 1.2rem; }
      .ul-cd-unit { min-width: 40px; }
    }
    /* Preserve SVG node styles */
    .un-node { cursor: pointer; }
    .un-node-body {
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      transform-box: fill-box;
      transform-origin: center;
    }
    .un-node:hover .un-node-body { transform: scale(1.28); filter: drop-shadow(0 0 8px #f0a820aa); }
    .un-node-pulse { opacity: 0; transition: opacity 0.2s; }
    .un-node:hover .un-node-pulse { opacity: 1; }
    /* Map tabs */
    .map-tab-btn { background:none; border:none; cursor:pointer; font-family:Inter,sans-serif; font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#444; padding:10px 18px; border-bottom:2px solid transparent; transition:color 0.15s,border-color 0.15s; white-space:nowrap; }
          .map-tab-btn:hover { color:#888; }
          .map-tab-btn.active { color:#f0a820; border-bottom-color:#f0a820; }
          .map-panel { display:none; background:#0d0d0d; border:1px solid #1e1e1e; border-radius:3px; overflow:visible; }
          .map-panel.active { display:block; }
          .map-panel-header { padding:8px 14px 6px; border-bottom:1px solid #161616; }
          .map-panel-title { font-size:0.6rem; font-weight:800; color:#f0a820; letter-spacing:0.14em; text-transform:uppercase; }
          .map-panel-sub { font-size:0.52rem; color:#3a3a3a; margin-top:1px; letter-spacing:0.06em; }
  `;
  document.head.appendChild(styleEl);

  /* ── tooltip ──────────────────────────────────────────────────── */
  const ttEl = document.createElement('div');
  ttEl.id = 'undukTooltip';
  ttEl.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;display:none;perspective:1200px;opacity:0;transition:opacity 0.18s ease;';
  ttEl.innerHTML = `
    <div id="undukTtCard" style="position:relative;width:200px;background:linear-gradient(160deg,rgba(32,24,10,0.96) 0%,rgba(14,11,6,0.97) 60%,rgba(8,6,3,0.98) 100%);border-radius:14px;padding:14px 14px 14px;border:1px solid rgba(240,168,32,0.32);box-shadow:0 30px 60px -16px rgba(0,0,0,0.95),0 20px 40px -10px rgba(240,168,32,0.22),0 2px 0 rgba(255,255,255,0.04) inset,0 -2px 0 rgba(240,168,32,0.14) inset;transform-style:preserve-3d;transform:rotateX(10deg) rotateY(-8deg);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);overflow:visible;">
      <div style="position:absolute;top:-1px;left:18%;right:18%;height:2px;background:linear-gradient(90deg,transparent,#f0a820,transparent);border-radius:2px;box-shadow:0 0 8px rgba(240,168,32,0.6);"></div>
      <div style="position:absolute;top:7px;right:9px;font-size:0.5rem;font-weight:800;background:linear-gradient(135deg,#f5b830,#a06810);color:#0a0a0a;padding:2px 6px;border-radius:3px;letter-spacing:0.08em;box-shadow:0 2px 4px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.1) inset;">UN</div>
      <div style="position:relative;height:118px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:10px;">
        <div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:78%;height:14px;background:radial-gradient(ellipse,rgba(240,168,32,0.4),transparent 70%);filter:blur(6px);"></div>
        <img id="undukTtImg" src="" alt="" style="position:relative;max-width:120px;max-height:118px;width:auto;height:100%;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,0.7)) drop-shadow(0 0 18px rgba(240,168,32,0.28));"/>
      </div>
      <div id="undukTtWinner" style="font-size:0.78rem;font-weight:800;color:#f5f1e8;letter-spacing:-0.01em;text-align:center;margin-bottom:3px;text-shadow:0 1px 2px rgba(0,0,0,0.8);line-height:1.15;"></div>
      <div id="undukTtBranch" style="font-size:0.58rem;font-weight:700;color:#f0a820;letter-spacing:0.08em;text-transform:uppercase;text-align:center;margin-bottom:2px;"></div>
      <div id="undukTtSub" style="font-size:0.54rem;color:#777;letter-spacing:0.04em;text-align:center;"></div>
      <div style="position:absolute;bottom:6px;left:7px;width:6px;height:6px;border-left:1px solid rgba(240,168,32,0.45);border-bottom:1px solid rgba(240,168,32,0.45);"></div>
      <div style="position:absolute;bottom:6px;right:7px;width:6px;height:6px;border-right:1px solid rgba(240,168,32,0.45);border-bottom:1px solid rgba(240,168,32,0.45);"></div>
    </div>`;
  document.body.appendChild(ttEl);

  /* ── hero HTML ────────────────────────────────────────────────── */
  section.className = 'ul-hero';
  section.innerHTML = `
    <div class="ul-layout">
      <div class="ul-map-col">
        <div class="ul-map-inner">
          <div class="ul-map-label">
            <span class="ul-map-label-line"></span>
            <span class="ul-map-label-text">◉ Unduk Locator · Diaspora Branches</span>
            <span class="ul-map-label-line" style="background:linear-gradient(to left,transparent,#1e1e1e);"></span>
          </div>
          <div style="width:100%;max-width:560px;">
            <!-- Tab nav -->
        <div style="display:flex;border-bottom:1px solid #1a1a1a;margin-bottom:0;overflow-x:auto;-webkit-overflow-scrolling:touch;">
          <button class="map-tab-btn active" data-panel="peninsula" onclick="switchMapPanel(this,'peninsula')">Peninsular Malaysia</button>
          <button class="map-tab-btn" data-panel="sarawak" onclick="switchMapPanel(this,'sarawak')">Sarawak</button>
          <button class="map-tab-btn" data-panel="sabah" onclick="switchMapPanel(this,'sabah')">Sabah</button>
        </div>
            <!-- Panel 1: Peninsular Malaysia -->
        <div id="mapPanel-peninsula" class="map-panel active">
          <div class="map-panel-header">
            <div class="map-panel-title">Peninsular Malaysia</div>
            <div class="map-panel-sub">6 diaspora branches</div>
          </div>
          <svg id="peninsulaSvg" class="map-svg" viewBox="0 38 130 158" style="display:block;overflow:visible;max-width:380px;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="ngP" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.66  0 0 0 0 0.13  0 0 0 0.65 0" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <clipPath id="cpPP"><circle cx="20" cy="58" r="8"/></clipPath>
              <clipPath id="cpPK"><circle cx="55" cy="82" r="7"/></clipPath>
              <clipPath id="cpKV"><circle cx="94" cy="100" r="9"/></clipPath>
              <clipPath id="cpPJY"><circle cx="108" cy="113" r="7"/></clipPath>
              <clipPath id="cpM"><circle cx="108" cy="142" r="7"/></clipPath>
              <clipPath id="cpJB"><circle cx="112" cy="164" r="9"/></clipPath>
              <style>
                .un-node { cursor:pointer; }
                .un-node-body { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); transform-box:fill-box; transform-origin:center; }
                .un-node:hover .un-node-body { transform:scale(1.22); filter:drop-shadow(0 0 8px #f0a820aa); }
                .un-node-pulse { opacity:0; transition:opacity 0.2s; }
                .un-node:hover .un-node-pulse { opacity:1; }
              </style>
            </defs>
            <image href="/map-peninsula.svg" x="18" y="55" width="92" height="118" preserveAspectRatio="none"/>
            <!-- compass -->
            <g transform="translate(104,61)">
              <circle cx="0" cy="0" r="5" fill="none" stroke="#222" stroke-width="0.6"/>
              <polygon points="0,-3.5 1,0 0,1.5 -1,0" fill="#2e2e2e"/>
              <polygon points="0,3.5 1,0 0,-1.5 -1,0" fill="#1e1e1e"/>
              <text x="0" y="-6" text-anchor="middle" font-size="3.5" fill="#2e2e2e" font-family="Inter,sans-serif" font-weight="700">N</text>
            </g>
            <!-- Pulau Pinang -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Pulau Pinang" data-sub="KDCA Pulau Pinang · 2026" data-winner="Jeraahfinah Jonis (Nanu)" data-img="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-pulau-pinang_jeraahfinah-jonis-nanu_2026-05-22T16-04-30.png">
              <circle cx="42" cy="77" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="42" y1="77" x2="20" y2="58" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="20" cy="58" r="12" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="20" cy="58" r="8.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-pulau-pinang_jeraahfinah-jonis-nanu_2026-05-22T16-04-30.png" x="12" y="50" width="16" height="16" clip-path="url(#cpPP)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="20" cy="58" r="8" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
            <!-- Perak -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Perak" data-sub="KDCA Perak · 2026" data-winner="Valeriena Karen Aldrin" data-img="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-perak_valeriena-karen-aldrin_2026-05-22T16-26-06.png">
              <circle cx="50" cy="93" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="50" y1="93" x2="55" y2="82" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="55" cy="82" r="11" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="55" cy="82" r="7.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-perak_valeriena-karen-aldrin_2026-05-22T16-26-06.png" x="48" y="75" width="14" height="14" clip-path="url(#cpPK)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="55" cy="82" r="7" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
            <!-- Klang Valley -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Klang Valley" data-sub="KDCA Klang Valley · 2026" data-winner="Finafayena Primus" data-img="finafayena-primus_nobg.png">
              <circle cx="68" cy="117" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="68" y1="117" x2="94" y2="100" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="94" cy="100" r="13" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="94" cy="100" r="9.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="/images/finafayena-primus_nobg.png" x="85" y="91" width="18" height="18" clip-path="url(#cpKV)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="94" cy="100" r="9" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
            <!-- Putrajaya -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Putrajaya" data-sub="KDCA Putrajaya · 2026" data-winner="Wendey Merrylen S. Jasmine" data-img="wendey-merrylen_nobg.png">
              <circle cx="79" cy="124" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="79" y1="124" x2="108" y2="113" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="108" cy="113" r="11" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="108" cy="113" r="7.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="/images/wendey-merrylen_nobg.png" x="101" y="106" width="14" height="14" clip-path="url(#cpPJY)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="108" cy="113" r="7" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
            <!-- Melaka -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Melaka" data-sub="KDCA Melaka · 2026" data-winner="Clarissa Jane Ahap Fred Michael" data-img="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-melaka_clarissa-jane-ahap-fred-michae_2026-05-22T16-24-29.png">
              <circle cx="78" cy="134" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="78" y1="134" x2="108" y2="142" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="108" cy="142" r="11" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="108" cy="142" r="7.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-melaka_clarissa-jane-ahap-fred-michae_2026-05-22T16-24-29.png" x="101" y="135" width="14" height="14" clip-path="url(#cpM)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="108" cy="142" r="7" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
            <!-- Johor -->
            <g class="un-node" data-tab="Peninsular Malaysia" data-name="Johor" data-sub="KDCA Johor · 2026" data-winner="Josephine Magdeline Joseph" data-img="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-johor_josephine-magdeline-joseph_2026-05-22T16-24-00.png">
              <circle cx="91" cy="147" r="2" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="91" y1="147" x2="112" y2="164" stroke="#f0a820" stroke-width="0.6" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="112" cy="164" r="13" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="112" cy="164" r="9.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.6" filter="url(#ngP)"/>
                <image href="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-johor_josephine-magdeline-joseph_2026-05-22T16-24-00.png" x="103" y="155" width="18" height="18" clip-path="url(#cpJB)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="112" cy="164" r="9" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
          </svg>
        </div><!-- /mapPanel-peninsula -->
            <!-- Panel 2: Sarawak -->
        <div id="mapPanel-sarawak" class="map-panel">
          <div class="map-panel-header">
            <div class="map-panel-title">Sarawak</div>
            <div class="map-panel-sub">1 branch</div>
          </div>
          <svg id="sarawakSvg" class="map-svg" viewBox="114 72 152 128" style="display:block;overflow:visible;max-width:440px;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="ngS" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.66  0 0 0 0 0.13  0 0 0 0.65 0" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <clipPath id="cpSWK"><circle cx="158" cy="96" r="11"/></clipPath>
            </defs>
            <image href="/map-sarawak.svg" x="132" y="90" width="115" height="92" preserveAspectRatio="none"/>
            <!-- compass -->
            <g transform="translate(240,97)">
              <circle cx="0" cy="0" r="5" fill="none" stroke="#222" stroke-width="0.6"/>
              <polygon points="0,-3.5 1,0 0,1.5 -1,0" fill="#2e2e2e"/>
              <polygon points="0,3.5 1,0 0,-1.5 -1,0" fill="#1e1e1e"/>
              <text x="0" y="-6" text-anchor="middle" font-size="3.5" fill="#2e2e2e" font-family="Inter,sans-serif" font-weight="700">N</text>
            </g>
            <!-- Sarawak pin -->
            <g class="un-node" data-tab="Sarawak" data-name="Sarawak" data-sub="KDCA Sarawak · 2026" data-winner="Deanera Clarissa Jamdin" data-img="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-sarawak_deanera-clarissa-jamdin_2026-05-22T16-25-19.png">
              <circle cx="183" cy="136" r="2.5" fill="#f0a820" opacity="0.75" style="pointer-events:none;"/>
              <line x1="183" y1="136" x2="158" y2="96" stroke="#f0a820" stroke-width="0.8" opacity="0.45" style="pointer-events:none;"/>
              <circle class="un-node-pulse" cx="158" cy="96" r="15" fill="none" stroke="#f0a820" stroke-width="0.8" stroke-dasharray="2.5,2.5"/>
              <g class="un-node-body">
                <circle cx="158" cy="96" r="11" fill="#0a0a0a" stroke="#f0a820" stroke-width="1.8" filter="url(#ngS)"/>
                <image href="https://erbyhmliuqopwrspxbir.supabase.co/storage/v1/object/public/contributor-uploads/kdca-sarawak_deanera-clarissa-jamdin_2026-05-22T16-25-19.png" x="147" y="85" width="22" height="22" clip-path="url(#cpSWK)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                <circle cx="158" cy="96" r="11" fill="none" stroke="#f0a820" stroke-width="1.4"/>
              </g>
            </g>
          </svg>
        </div><!-- /mapPanel-sarawak -->
            <!-- Panel 3: Sabah — individual winners -->
        <div id="mapPanel-sabah" class="map-panel">
          <div class="map-panel-header">
            <div class="map-panel-title">Sabah</div>
            <div class="map-panel-sub">45 district winners · click a pin to view</div>
          </div>
          <svg id="sabahSvg" class="map-svg" viewBox="214 16 120 112" style="display:block;overflow:visible;max-width:440px;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="ngSB" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.66  0 0 0 0 0.13  0 0 0 0.65 0" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
                <clipPath id="cpSB0"><circle cx="262" cy="30.6" r="3.5"/></clipPath>
                <clipPath id="cpSB1"><circle cx="254.3" cy="27" r="3.5"/></clipPath>
                <clipPath id="cpSB2"><circle cx="281.2" cy="36.6" r="3.5"/></clipPath>
                <clipPath id="cpSB3"><circle cx="266.7" cy="37.7" r="3.5"/></clipPath>
                <clipPath id="cpSB4"><circle cx="273.6" cy="32.7" r="3.5"/></clipPath>
                <clipPath id="cpSB5"><circle cx="230.3" cy="64.7" r="3.5"/></clipPath>
                <clipPath id="cpSB6"><circle cx="225.1" cy="71.5" r="3.5"/></clipPath>
                <clipPath id="cpSB7"><circle cx="234.1" cy="57.2" r="3.5"/></clipPath>
                <clipPath id="cpSB8"><circle cx="238.3" cy="49.7" r="3.5"/></clipPath>
                <clipPath id="cpSB9"><circle cx="225.7" cy="57.1" r="3.5"/></clipPath>
                <clipPath id="cpSB10"><circle cx="239.2" cy="64" r="3.5"/></clipPath>
                <clipPath id="cpSB11"><circle cx="237.7" cy="72.4" r="3.5"/></clipPath>
                <clipPath id="cpSB12"><circle cx="231" cy="77.6" r="3.5"/></clipPath>
                <clipPath id="cpSB13"><circle cx="241.8" cy="42" r="3.5"/></clipPath>
                <clipPath id="cpSB14"><circle cx="257.7" cy="38.3" r="3.5"/></clipPath>
                <clipPath id="cpSB15"><circle cx="249.2" cy="37.8" r="3.5"/></clipPath>
                <clipPath id="cpSB16"><circle cx="224.5" cy="83.2" r="3.5"/></clipPath>
                <clipPath id="cpSB17"><circle cx="235.3" cy="94.1" r="3.5"/></clipPath>
                <clipPath id="cpSB18"><circle cx="232.5" cy="86.1" r="3.5"/></clipPath>
                <clipPath id="cpSB19"><circle cx="226.7" cy="100.6" r="3.5"/></clipPath>
                <clipPath id="cpSB20"><circle cx="226.3" cy="92" r="3.5"/></clipPath>
                <clipPath id="cpSB21"><circle cx="234.7" cy="103.3" r="3.5"/></clipPath>
                <clipPath id="cpSB22"><circle cx="255.1" cy="46.6" r="3.5"/></clipPath>
                <clipPath id="cpSB23"><circle cx="244.3" cy="56.2" r="3.5"/></clipPath>
                <clipPath id="cpSB24"><circle cx="244.1" cy="90.9" r="3.5"/></clipPath>
                <clipPath id="cpSB25"><circle cx="256.7" cy="99.2" r="3.5"/></clipPath>
                <clipPath id="cpSB26"><circle cx="239.1" cy="80.7" r="3.5"/></clipPath>
                <clipPath id="cpSB27"><circle cx="242.2" cy="99.2" r="3.5"/></clipPath>
                <clipPath id="cpSB28"><circle cx="242.7" cy="108.8" r="3.5"/></clipPath>
                <clipPath id="cpSB29"><circle cx="249.4" cy="103.6" r="3.5"/></clipPath>
                <clipPath id="cpSB30"><circle cx="256.3" cy="108.7" r="3.5"/></clipPath>
                <clipPath id="cpSB31"><circle cx="261.9" cy="115.3" r="3.5"/></clipPath>
                <clipPath id="cpSB32"><circle cx="300.6" cy="46.1" r="3.5"/></clipPath>
                <clipPath id="cpSB33"><circle cx="294.2" cy="51.7" r="3.5"/></clipPath>
                <clipPath id="cpSB34"><circle cx="290.1" cy="41" r="3.5"/></clipPath>
                <clipPath id="cpSB35"><circle cx="292.2" cy="60.4" r="3.5"/></clipPath>
                <clipPath id="cpSB36"><circle cx="298.9" cy="75" r="3.5"/></clipPath>
                <clipPath id="cpSB37"><circle cx="307" cy="63.5" r="3.5"/></clipPath>
                <clipPath id="cpSB38"><circle cx="310.4" cy="72.2" r="3.5"/></clipPath>
                <clipPath id="cpSB39"><circle cx="311.1" cy="80.7" r="3.5"/></clipPath>
                <clipPath id="cpSB40"><circle cx="314.1" cy="88.6" r="3.5"/></clipPath>
                <clipPath id="cpSB41"><circle cx="317.8" cy="96.3" r="3.5"/></clipPath>
                <clipPath id="cpSB42"><circle cx="321.8" cy="103.8" r="3.5"/></clipPath>
                <clipPath id="cpSB43"><circle cx="312.8" cy="103.2" r="3.5"/></clipPath>
                <clipPath id="cpSB44"><circle cx="308.2" cy="95.8" r="3.5"/></clipPath>
                <clipPath id="cpSB45"><circle cx="292" cy="82" r="3.5"/></clipPath>
            </defs>
            <image href="/map-sabah.svg" x="244" y="32" width="66" height="76" preserveAspectRatio="none"/>
            <!-- compass -->
            <g transform="translate(307,36)">
              <circle cx="0" cy="0" r="4" fill="none" stroke="#222" stroke-width="0.6"/>
              <polygon points="0,-2.8 0.8,0 0,1.2 -0.8,0" fill="#2e2e2e"/>
              <polygon points="0,2.8 0.8,0 0,-1.2 -0.8,0" fill="#1e1e1e"/>
              <text x="0" y="-5" text-anchor="middle" font-size="3" fill="#2e2e2e" font-family="Inter,sans-serif" font-weight="700">N</text>
            </g>

<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-055" data-name="Kudat" data-sub="KDCA Kudat · 2026" data-winner="Feyrashandy Hanlin Hanis" data-img="placeholder-winner_nobg.png">
                <circle cx="264" cy="52" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="264" y1="52" x2="262" y2="30.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="262" cy="30.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="262" cy="30.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="258.5" y="27.1" width="7.0" height="7.0" clip-path="url(#cpSB0)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="262" cy="30.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-056" data-name="Banggi" data-sub="KDCA Banggi · 2026" data-winner="Lora Derlina Lisa Jusley" data-img="placeholder-winner_nobg.png">
                <circle cx="261" cy="49" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="261" y1="49" x2="254.3" y2="27" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="254.3" cy="27" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="254.3" cy="27" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="250.8" y="23.5" width="7.0" height="7.0" clip-path="url(#cpSB1)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="254.3" cy="27" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-057" data-name="Pitas" data-sub="KDCA Pitas · 2026" data-winner="Jean Christzabeth Yusevender" data-img="placeholder-winner_nobg.png">
                <circle cx="273" cy="57" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="273" y1="57" x2="281.2" y2="36.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="281.2" cy="36.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="281.2" cy="36.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="277.7" y="33.1" width="7.0" height="7.0" clip-path="url(#cpSB2)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="281.2" cy="36.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-058" data-name="Kota Marudu" data-sub="KDCA Kota Marudu · 2026" data-winner="Aelvereny Vahidin" data-img="placeholder-winner_nobg.png">
                <circle cx="267" cy="59" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="267" y1="59" x2="266.7" y2="37.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="266.7" cy="37.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="266.7" cy="37.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="263.2" y="34.2" width="7.0" height="7.0" clip-path="url(#cpSB3)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="266.7" cy="37.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-059" data-name="Matunggong" data-sub="KDCA Matunggong · 2026" data-winner="Criszelbellkah Lorris" data-img="placeholder-winner_nobg.png">
                <circle cx="270" cy="55" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="270" y1="55" x2="273.6" y2="32.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="273.6" cy="32.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="273.6" cy="32.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="270.1" y="29.2" width="7.0" height="7.0" clip-path="url(#cpSB4)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="273.6" cy="32.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-036" data-name="Kota Kinabalu" data-sub="KDCA Kota Kinabalu · 2026" data-winner="Liane Melve Grace Lias" data-img="placeholder-winner_nobg.png">
                <circle cx="252" cy="69" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="252" y1="69" x2="230.3" y2="64.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="230.3" cy="64.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="230.3" cy="64.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="226.8" y="61.2" width="7.0" height="7.0" clip-path="url(#cpSB5)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="230.3" cy="64.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-037" data-name="Tanjung Aru" data-sub="KDCA Tanjung Aru · 2026" data-winner="Joyce Nia David" data-img="placeholder-winner_nobg.png">
                <circle cx="252" cy="72" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="252" y1="72" x2="225.1" y2="71.5" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="225.1" cy="71.5" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="225.1" cy="71.5" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="221.6" y="68.0" width="7.0" height="7.0" clip-path="url(#cpSB6)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="225.1" cy="71.5" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-038" data-name="Inanam" data-sub="KDCA Inanam · 2026" data-winner="Essmerrellda Cafry" data-img="placeholder-winner_nobg.png">
                <circle cx="254" cy="66" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="254" y1="66" x2="234.1" y2="57.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="234.1" cy="57.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="234.1" cy="57.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="230.6" y="53.7" width="7.0" height="7.0" clip-path="url(#cpSB7)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="234.1" cy="57.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-039" data-name="Karambunai" data-sub="KDCA Karambunai · 2026" data-winner="Natalie Ally Hepeni" data-img="placeholder-winner_nobg.png">
                <circle cx="256" cy="64" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="256" y1="64" x2="238.3" y2="49.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="238.3" cy="49.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="238.3" cy="49.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="234.8" y="46.2" width="7.0" height="7.0" clip-path="url(#cpSB8)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="238.3" cy="49.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-040" data-name="KDCA Bandaraya" data-sub="KDCA KDCA Bandaraya · 2026" data-winner="Felecity Chen Sing Yee" data-img="placeholder-winner_nobg.png">
                <circle cx="251" cy="68" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="251" y1="68" x2="225.7" y2="57.1" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="225.7" cy="57.1" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="225.7" cy="57.1" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="222.2" y="53.6" width="7.0" height="7.0" clip-path="url(#cpSB9)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="225.7" cy="57.1" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-041" data-name="Penampang" data-sub="KDCA Penampang · 2026" data-winner="Gadrette Gregory" data-img="placeholder-winner_nobg.png">
                <circle cx="256" cy="71" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="256" y1="71" x2="239.2" y2="64" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="239.2" cy="64" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="239.2" cy="64" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="235.7" y="60.5" width="7.0" height="7.0" clip-path="url(#cpSB10)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="239.2" cy="64" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-042" data-name="Kapayan" data-sub="KDCA Kapayan · 2026" data-winner="Viviyana Jenny" data-img="placeholder-winner_nobg.png">
                <circle cx="257" cy="73" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="257" y1="73" x2="237.7" y2="72.4" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="237.7" cy="72.4" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="237.7" cy="72.4" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="234.2" y="68.9" width="7.0" height="7.0" clip-path="url(#cpSB11)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="237.7" cy="72.4" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-043" data-name="Putatan" data-sub="KDCA Putatan · 2026" data-winner="Amber Weysha Walter John" data-img="placeholder-winner_nobg.png">
                <circle cx="253" cy="75" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="253" y1="75" x2="231" y2="77.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="231" cy="77.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="231" cy="77.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="227.5" y="74.1" width="7.0" height="7.0" clip-path="url(#cpSB12)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="231" cy="77.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-044" data-name="Tuaran" data-sub="KDCA Tuaran · 2026" data-winner="Juje Elor Francis" data-img="placeholder-winner_nobg.png">
                <circle cx="256" cy="62" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="256" y1="62" x2="241.8" y2="42" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="241.8" cy="42" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="241.8" cy="42" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="238.3" y="38.5" width="7.0" height="7.0" clip-path="url(#cpSB13)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="241.8" cy="42" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-045" data-name="Tamparuli" data-sub="KDCA Tamparuli · 2026" data-winner="Evyanarrey Larry" data-img="placeholder-winner_nobg.png">
                <circle cx="263" cy="60" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="263" y1="60" x2="257.7" y2="38.3" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="257.7" cy="38.3" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="257.7" cy="38.3" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="254.2" y="34.8" width="7.0" height="7.0" clip-path="url(#cpSB14)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="257.7" cy="38.3" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-060" data-name="Kota Belud" data-sub="KDCA Kota Belud · 2026" data-winner="Althea Tan Pin Yan" data-img="placeholder-winner_nobg.png">
                <circle cx="259" cy="57" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="259" y1="57" x2="249.2" y2="37.8" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="249.2" cy="37.8" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="249.2" cy="37.8" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="245.7" y="34.3" width="7.0" height="7.0" clip-path="url(#cpSB15)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="249.2" cy="37.8" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-020" data-name="Papar" data-sub="KDCA Papar · 2026" data-winner="Gelvia Vanessa Jenny" data-img="placeholder-winner_nobg.png">
                <circle cx="251" cy="77" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="251" y1="77" x2="224.5" y2="83.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="224.5" cy="83.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="224.5" cy="83.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="221.0" y="79.7" width="7.0" height="7.0" clip-path="url(#cpSB16)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="224.5" cy="83.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-072" data-name="Beaufort" data-sub="KDCA Beaufort · 2026" data-winner="Fedelia Viviana Venchin" data-img="placeholder-winner_nobg.png">
                <circle cx="251" cy="82" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="251" y1="82" x2="235.3" y2="94.1" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="235.3" cy="94.1" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="235.3" cy="94.1" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="231.8" y="90.6" width="7.0" height="7.0" clip-path="url(#cpSB17)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="235.3" cy="94.1" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-073" data-name="Membakut" data-sub="KDCA Membakut · 2026" data-winner="Dorna Mayra Michael" data-img="placeholder-winner_nobg.png">
                <circle cx="251" cy="79" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="251" y1="79" x2="232.5" y2="86.1" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="232.5" cy="86.1" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="232.5" cy="86.1" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="229.0" y="82.6" width="7.0" height="7.0" clip-path="url(#cpSB18)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="232.5" cy="86.1" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-074" data-name="Kuala Penyu" data-sub="KDCA Kuala Penyu · 2026" data-winner="Lorna Breetney Johnny" data-img="placeholder-winner_nobg.png">
                <circle cx="249" cy="85" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="249" y1="85" x2="226.7" y2="100.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="226.7" cy="100.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="226.7" cy="100.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="223.2" y="97.1" width="7.0" height="7.0" clip-path="url(#cpSB19)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="226.7" cy="100.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-075" data-name="Menumbok" data-sub="KDCA Menumbok · 2026" data-winner="Hyzlensiska Verron Johnny" data-img="placeholder-winner_nobg.png">
                <circle cx="248" cy="83" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="248" y1="83" x2="226.3" y2="92" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="226.3" cy="92" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="226.3" cy="92" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="222.8" y="88.5" width="7.0" height="7.0" clip-path="url(#cpSB20)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="226.3" cy="92" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-076" data-name="Sipitang" data-sub="KDCA Sipitang · 2026" data-winner="Hilda Jaynissa Godwin" data-img="placeholder-winner_nobg.png">
                <circle cx="249" cy="88" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="249" y1="88" x2="234.7" y2="103.3" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="234.7" cy="103.3" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="234.7" cy="103.3" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="231.2" y="99.8" width="7.0" height="7.0" clip-path="url(#cpSB21)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="234.7" cy="103.3" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-035" data-name="Ranau" data-sub="KDCA Ranau · 2026" data-winner="Christebelle Masius" data-img="placeholder-winner_nobg.png">
                <circle cx="264" cy="66" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="264" y1="66" x2="255.1" y2="46.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="255.1" cy="46.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="255.1" cy="46.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="251.6" y="43.1" width="7.0" height="7.0" clip-path="url(#cpSB22)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="255.1" cy="46.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-046" data-name="Kiulu" data-sub="KDCA Kiulu · 2026" data-winner="Catsween Su Sun Ping" data-img="placeholder-winner_nobg.png">
                <circle cx="260" cy="68" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="260" y1="68" x2="244.3" y2="56.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="244.3" cy="56.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="244.3" cy="56.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="240.8" y="52.7" width="7.0" height="7.0" clip-path="url(#cpSB23)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="244.3" cy="56.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-047" data-name="Keningau" data-sub="KDCA Keningau · 2026" data-winner="Edreen Lynn Edward" data-img="placeholder-winner_nobg.png">
                <circle cx="260" cy="79" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="260" y1="79" x2="244.1" y2="90.9" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="244.1" cy="90.9" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="244.1" cy="90.9" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="240.6" y="87.4" width="7.0" height="7.0" clip-path="url(#cpSB24)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="244.1" cy="90.9" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-048" data-name="Bingkor" data-sub="KDCA Bingkor · 2026" data-winner="Alysheron Maunsiong" data-img="placeholder-winner_nobg.png">
                <circle cx="263" cy="81" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="263" y1="81" x2="256.7" y2="99.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="256.7" cy="99.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="256.7" cy="99.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="253.2" y="95.7" width="7.0" height="7.0" clip-path="url(#cpSB25)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="256.7" cy="99.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-049" data-name="Tambunan" data-sub="KDCA Tambunan · 2026" data-winner="Natalia Jinui" data-img="placeholder-winner_nobg.png">
                <circle cx="259" cy="74" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="259" y1="74" x2="239.1" y2="80.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="239.1" cy="80.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="239.1" cy="80.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="235.6" y="77.2" width="7.0" height="7.0" clip-path="url(#cpSB26)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="239.1" cy="80.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-050" data-name="Tenom" data-sub="KDCA Tenom · 2026" data-winner="Radila Ifa Yanie" data-img="placeholder-winner_nobg.png">
                <circle cx="258" cy="84" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="258" y1="84" x2="242.2" y2="99.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="242.2" cy="99.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="242.2" cy="99.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="238.7" y="95.7" width="7.0" height="7.0" clip-path="url(#cpSB27)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="242.2" cy="99.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-051" data-name="Kemabong" data-sub="KDCA Kemabong · 2026" data-winner="Venica Tuboh" data-img="placeholder-winner_nobg.png">
                <circle cx="257" cy="87" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="257" y1="87" x2="242.7" y2="108.8" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="242.7" cy="108.8" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="242.7" cy="108.8" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="239.2" y="105.3" width="7.0" height="7.0" clip-path="url(#cpSB28)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="242.7" cy="108.8" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-052" data-name="Sook" data-sub="KDCA Sook · 2026" data-winner="Myra Evana Robert" data-img="placeholder-winner_nobg.png">
                <circle cx="261" cy="83" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="261" y1="83" x2="249.4" y2="103.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="249.4" cy="103.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="249.4" cy="103.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="245.9" y="100.1" width="7.0" height="7.0" clip-path="url(#cpSB29)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="249.4" cy="103.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-053" data-name="Nabawan" data-sub="KDCA Nabawan · 2026" data-winner="Sahira Samson" data-img="placeholder-winner_nobg.png">
                <circle cx="263" cy="89" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="263" y1="89" x2="256.3" y2="108.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="256.3" cy="108.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="256.3" cy="108.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="252.8" y="105.2" width="7.0" height="7.0" clip-path="url(#cpSB30)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="256.3" cy="108.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-054" data-name="Pagalungan" data-sub="KDCA Pagalungan · 2026" data-winner="Kerishine Danil" data-img="placeholder-winner_nobg.png">
                <circle cx="264" cy="92" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="264" y1="92" x2="261.9" y2="115.3" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="261.9" cy="115.3" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="261.9" cy="115.3" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="258.4" y="111.8" width="7.0" height="7.0" clip-path="url(#cpSB31)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="261.9" cy="115.3" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-034" data-name="Sandakan" data-sub="KDCA Sandakan · 2026" data-winner="Ceelecia Reeka Mosungin" data-img="placeholder-winner_nobg.png">
                <circle cx="287" cy="57" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="287" y1="57" x2="300.6" y2="46.1" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="300.6" cy="46.1" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="300.6" cy="46.1" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="297.1" y="42.6" width="7.0" height="7.0" clip-path="url(#cpSB32)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="300.6" cy="46.1" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-015" data-name="Beluran" data-sub="KDCA Beluran · 2026" data-winner="Dyann Dharlla Dominic" data-img="placeholder-winner_nobg.png">
                <circle cx="281" cy="62" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="281" y1="62" x2="294.2" y2="51.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="294.2" cy="51.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="294.2" cy="51.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="290.7" y="48.2" width="7.0" height="7.0" clip-path="url(#cpSB33)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="294.2" cy="51.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-061" data-name="Paitan" data-sub="KDCA Paitan · 2026" data-winner="Candycyci Liakim" data-img="placeholder-winner_nobg.png">
                <circle cx="280" cy="55" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="280" y1="55" x2="290.1" y2="41" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="290.1" cy="41" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="290.1" cy="41" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="286.6" y="37.5" width="7.0" height="7.0" clip-path="url(#cpSB34)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="290.1" cy="41" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-062" data-name="Telupid" data-sub="KDCA Telupid · 2026" data-winner="Raraa Cyra Eva Bella Stephen" data-img="placeholder-winner_nobg.png">
                <circle cx="277" cy="68" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="277" y1="68" x2="292.2" y2="60.4" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="292.2" cy="60.4" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="292.2" cy="60.4" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="288.7" y="56.9" width="7.0" height="7.0" clip-path="url(#cpSB35)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="292.2" cy="60.4" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-063" data-name="Sungai Manila" data-sub="KDCA Sungai Manila · 2026" data-winner="Dovena Jessie Isabell Daniel" data-img="placeholder-winner_nobg.png">
                <circle cx="283" cy="74" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="283" y1="74" x2="298.9" y2="75" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="298.9" cy="75" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="298.9" cy="75" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="295.4" y="71.5" width="7.0" height="7.0" clip-path="url(#cpSB36)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="298.9" cy="75" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-064" data-name="Kinabatangan" data-sub="KDCA Kinabatangan · 2026" data-winner="Vrenda Joan Taji" data-img="placeholder-winner_nobg.png">
                <circle cx="288" cy="68" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="288" y1="68" x2="307" y2="63.5" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="307" cy="63.5" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="307" cy="63.5" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="303.5" y="60.0" width="7.0" height="7.0" clip-path="url(#cpSB37)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="307" cy="63.5" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-065" data-name="Sukau" data-sub="KDCA Sukau · 2026" data-winner="Ally Denis" data-img="placeholder-winner_nobg.png">
                <circle cx="291" cy="73" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="291" y1="73" x2="310.4" y2="72.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="310.4" cy="72.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="310.4" cy="72.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="306.9" y="68.7" width="7.0" height="7.0" clip-path="url(#cpSB38)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="310.4" cy="72.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-078" data-name="Tongod" data-sub="KDCA Tongod · 2026" data-winner="Anne Theresse Justin Sentian" data-img="placeholder-winner_nobg.png">
                <circle cx="281" cy="72" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="281" y1="72" x2="292" y2="82" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="292" cy="82" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="292" cy="82" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="288.5" y="78.5" width="7.0" height="7.0" clip-path="url(#cpSB45)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="292" cy="82" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-068" data-name="Lahad Datu" data-sub="KDCA Lahad Datu · 2026" data-winner="Caesyzizi Liakim" data-img="placeholder-winner_nobg.png">
                <circle cx="292" cy="80" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="292" y1="80" x2="311.1" y2="80.7" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="311.1" cy="80.7" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="311.1" cy="80.7" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="307.6" y="77.2" width="7.0" height="7.0" clip-path="url(#cpSB39)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="311.1" cy="80.7" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-069" data-name="Tungku" data-sub="KDCA Tungku · 2026" data-winner="Mary-An P. Calica" data-img="placeholder-winner_nobg.png">
                <circle cx="294" cy="83" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="294" y1="83" x2="314.1" y2="88.6" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="314.1" cy="88.6" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="314.1" cy="88.6" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="310.6" y="85.1" width="7.0" height="7.0" clip-path="url(#cpSB40)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="314.1" cy="88.6" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-070" data-name="Kunak" data-sub="KDCA Kunak · 2026" data-winner="Rachel Justin" data-img="placeholder-winner_nobg.png">
                <circle cx="296" cy="86" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="296" y1="86" x2="317.8" y2="96.3" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="317.8" cy="96.3" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="317.8" cy="96.3" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="314.3" y="92.8" width="7.0" height="7.0" clip-path="url(#cpSB41)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="317.8" cy="96.3" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-071" data-name="Semporna" data-sub="KDCA Semporna · 2026" data-winner="Adylee Arisen" data-img="placeholder-winner_nobg.png">
                <circle cx="298" cy="89" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="298" y1="89" x2="321.8" y2="103.8" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="321.8" cy="103.8" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="321.8" cy="103.8" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="318.3" y="100.3" width="7.0" height="7.0" clip-path="url(#cpSB42)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="321.8" cy="103.8" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-066" data-name="Tawau" data-sub="KDCA Tawau · 2026" data-winner="Elvisa Edna Robert" data-img="placeholder-winner_nobg.png">
                <circle cx="297" cy="91" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="297" y1="91" x2="312.8" y2="103.2" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="312.8" cy="103.2" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="312.8" cy="103.2" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="309.3" y="99.7" width="7.0" height="7.0" clip-path="url(#cpSB43)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="312.8" cy="103.2" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
<g class="un-node un-sabah-ind" data-tab="Sabah (Central)" data-winid="win-067" data-name="Kalabakan" data-sub="KDCA Kalabakan · 2026" data-winner="Christine Dionysius" data-img="placeholder-winner_nobg.png">
                <circle cx="290" cy="85" r="1.2" fill="#f0a820" opacity="0.8" style="pointer-events:none;"/>
                <line x1="290" y1="85" x2="308.2" y2="95.8" stroke="#f0a820" stroke-width="0.35" opacity="0.5" style="pointer-events:none;"/>
                <circle class="un-node-pulse" cx="308.2" cy="95.8" r="5.5" fill="none" stroke="#f0a820" stroke-width="0.5" stroke-dasharray="1.2,1.2"/>
                <g class="un-node-body">
                  <circle cx="308.2" cy="95.8" r="3.5" fill="#0a0a0a" stroke="#f0a820" stroke-width="0.8" filter="url(#ngSB)"/>
                  <image href="/images/placeholder-winner_nobg.png" x="304.7" y="92.3" width="7.0" height="7.0" clip-path="url(#cpSB44)" preserveAspectRatio="xMidYMid slice" style="pointer-events:none;"/>
                  <circle cx="308.2" cy="95.8" r="3.5" fill="none" stroke="#f0a820" stroke-width="0.6"/>
                </g>
              </g>
          </svg>
        </div><!-- /mapPanel-sabah -->
          </div>
        </div>
      </div>
      <div class="ul-panel-col">
        <div class="ul-eyebrow">
          <span class="ul-eyebrow-dot"></span>
          <span>Hari Kaamatan 2026</span>
        </div>
        <h1 class="ul-title">Unduk<br><span>Ngadau</span><br>2026</h1>
        <div class="ul-sub">KDMR Diaspora · 53 Branches Nationwide</div>
        <div class="ul-cd-label-main">⏱ Countdown to Kaamatan</div>
        <div class="ul-countdown">
          <div class="ul-cd-unit"><div class="ul-cd-num" id="ulCdD">--</div><div class="ul-cd-label">Days</div></div>
          <div class="ul-cd-sep">:</div>
          <div class="ul-cd-unit"><div class="ul-cd-num" id="ulCdH">--</div><div class="ul-cd-label">Hours</div></div>
          <div class="ul-cd-sep">:</div>
          <div class="ul-cd-unit"><div class="ul-cd-num" id="ulCdM">--</div><div class="ul-cd-label">Mins</div></div>
          <div class="ul-cd-sep">:</div>
          <div class="ul-cd-unit"><div class="ul-cd-num" id="ulCdS">--</div><div class="ul-cd-label">Secs</div></div>
        </div>
        <a href="/unduk-ngadau/" class="ul-cta">
          Meet the Champions
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <div class="ul-branches">
          <span class="ul-branch-chip">Pulau Pinang</span>
          <span class="ul-branch-chip">Klang Valley</span>
          <span class="ul-branch-chip">Putrajaya</span>
          <span class="ul-branch-chip">Melaka</span>
          <span class="ul-branch-chip">Johor</span>
          <span class="ul-branch-chip">Sarawak</span>
          <span class="ul-branch-chip">53 Sabah Districts</span>
        </div>
      </div>
    </div>
    <div class="ul-scroll-hint"><span>Scroll</span><div></div></div>
  `;

  /* ── countdown ────────────────────────────────────────────────── */
  const TARGET = new Date('2026-05-30T08:00:00+08:00');
  function pad(n) { return String(n).padStart(2, '0'); }
  function tickCountdown() {
    const diff = TARGET - Date.now();
    if (diff <= 0) {
      const dEl = document.getElementById('ulCdD');
      if (dEl) dEl.closest('.ul-countdown').innerHTML = '<span style="font-size:0.9rem;font-weight:700;color:#f0a820;letter-spacing:0.04em;">🎉 Kaamatan is here!</span>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);
    const dEl = document.getElementById('ulCdD');
    const hEl = document.getElementById('ulCdH');
    const mEl = document.getElementById('ulCdM');
    const sEl = document.getElementById('ulCdS');
    if (dEl) dEl.textContent = pad(d);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ── map tab switcher */
  function switchMapPanel(btn, panelId) {
            document.querySelectorAll('.map-tab-btn').forEach(function(b){ b.classList.remove('active'); });
            document.querySelectorAll('.map-panel').forEach(function(p){ p.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById('mapPanel-' + panelId).classList.add('active');
          }
  window.switchMapPanel = switchMapPanel;

  /* ── tooltip interaction ──────────────────────────────────────── */
  const tooltip  = ttEl;
  const ttCard   = document.getElementById('undukTtCard');
  const ttImg    = document.getElementById('undukTtImg');
  const ttWinner = document.getElementById('undukTtWinner');
  const ttBranch = document.getElementById('undukTtBranch');
  const ttSub    = document.getElementById('undukTtSub');
  const nodes    = section.querySelectorAll('.un-node');
  // re-attach after innerHTML


  function positionTooltip(e) {
    var TW = 232, TH = 240;
    var x = e.clientX + 22;
    var y = e.clientY - TH / 2;
    if (x + TW > window.innerWidth  - 8) x = e.clientX - TW - 18;
    if (y < 8)                            y = 8;
    if (y + TH > window.innerHeight - 8)  y = window.innerHeight - TH - 8;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
    if (ttCard) {
      var dx  = (e.clientX - (x + TW / 2)) / (TW / 2);
      var dy  = (e.clientY - (y + TH / 2)) / (TH / 2);
      var rotY = Math.max(-14, Math.min(14, -dx * 10));
      var rotX = Math.max(-12, Math.min(12,  dy * 8));
      ttCard.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
    }
  }

  nodes.forEach(function(node) {
    node.addEventListener('mouseenter', function(e) {
      ttWinner.textContent = this.dataset.winner || '';
      ttBranch.textContent = this.dataset.name   || '';
      ttSub.textContent    = this.dataset.sub    || '';
      ttImg.src = this.dataset.img ? '/images/' + this.dataset.img : '';
      tooltip.style.display = 'block';
      positionTooltip(e);
      requestAnimationFrame(function() { tooltip.style.opacity = '1'; });
    });
    node.addEventListener('mousemove', positionTooltip);
    node.addEventListener('mouseleave', function() {
      tooltip.style.opacity = '0';
      setTimeout(function() { tooltip.style.display = 'none'; }, 180);
    });
    node.addEventListener('click', function() {
      window.location.href = '/unduk-ngadau/';
    });
    node.addEventListener('touchstart', function(e) {
      e.preventDefault();
      ttWinner.textContent = this.dataset.winner || '';
      ttBranch.textContent = this.dataset.name   || '';
      ttSub.textContent    = this.dataset.sub    || '';
      ttImg.src = this.dataset.img ? '/images/' + this.dataset.img : '';
      var touch = e.touches[0];
      var x = touch.clientX + 12;
      var y = touch.clientY - 130;
      if (x + 232 > window.innerWidth - 8) x = touch.clientX - 244;
      if (y < 8) y = touch.clientY + 18;
      tooltip.style.left = x + 'px';
      tooltip.style.top  = y + 'px';
      tooltip.style.display = 'block';
      requestAnimationFrame(function() { tooltip.style.opacity = '1'; });
      setTimeout(function() {
        tooltip.style.opacity = '0';
        setTimeout(function() { tooltip.style.display = 'none'; }, 180);
        window.location.href = '/unduk-ngadau/';
      }, 900);
    }, { passive: false });
  });
}
