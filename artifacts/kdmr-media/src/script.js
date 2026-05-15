/**
 * KDMR Media — script.js
 * Handles: data loading, hero selector (archive), tickers, global search,
 * directory page, voting, and index page.
 */

const DATA_URL = './data.json';
const VOTES_KEY = 'kdmr_votes';
let _data = null;

// ─── Data ─────────────────────────────────────────────────────────────────

async function loadData() {
  if (_data) return _data;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  _data = await res.json();
  return _data;
}

// ─── Votes ────────────────────────────────────────────────────────────────

function getVotes() {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); } catch { return {}; }
}
function hasVoted(id) { return !!getVotes()[id]; }
function castVote(id) {
  if (hasVoted(id)) return false;
  const v = getVotes(); v[id] = true;
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let n = 0; const step = Math.ceil(target / 30);
  const iv = setInterval(() => { n = Math.min(n + step, target); el.textContent = n.toLocaleString(); if (n >= target) clearInterval(iv); }, 28);
}
function fadein(container) {
  const items = container.querySelectorAll('[data-fade]');
  items.forEach((el, i) => {
    el.style.opacity = '0'; el.style.transform = 'translateY(6px)';
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, i * 45);
  });
}

const CAT_COLORS = {
  'Politics':         { bg:'rgba(59,130,246,0.1)',  text:'#60a5fa' },
  'Arts & Culture':   { bg:'rgba(236,72,153,0.1)',  text:'#f472b6' },
  'Sports':           { bg:'rgba(34,197,94,0.1)',   text:'#4ade80' },
  'Education':        { bg:'rgba(168,85,247,0.1)',  text:'#c084fc' },
  'Entrepreneurship': { bg:'rgba(251,191,36,0.1)',  text:'#fbbf24' },
};
const BIZ_CAT_COLORS = {
  'Food & Beverage':      { bg:'rgba(251,191,36,0.1)',  text:'#fbbf24' },
  'Arts & Crafts':        { bg:'rgba(236,72,153,0.1)',  text:'#f472b6' },
  'Tourism & Hospitality':{ bg:'rgba(59,130,246,0.1)',  text:'#60a5fa' },
  'Health & Wellness':    { bg:'rgba(34,197,94,0.1)',   text:'#4ade80' },
  'Agriculture':          { bg:'rgba(74,222,128,0.1)',  text:'#34d399' },
  'Education':            { bg:'rgba(168,85,247,0.1)',  text:'#c084fc' },
};
const AWARD_COLORS = {
  'Unduk Ngadau': '#f0a820',
  'MRK':          '#4ade80',
};

function catCol(cat, map = CAT_COLORS) {
  return map[cat] || { bg:'rgba(240,168,32,0.08)', text:'#f0a820' };
}

// ─── Ticker ───────────────────────────────────────────────────────────────

function buildTicker(trackId, items) {
  const track = document.getElementById(trackId);
  if (!track || !items.length) return;
  const text = items.join('  ·  ');
  track.innerHTML = `<span style="padding-right:40px;">${text}</span><span style="padding-right:40px;" aria-hidden="true">${text}</span>`;
}

// ─── Global search overlay ────────────────────────────────────────────────

function initGlobalSearch(data) {
  const input = document.getElementById('overlaySearchInput');
  const resultsEl = document.getElementById('overlayResults');
  const hintEl = document.getElementById('overlaySearchHint');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { resultsEl.style.display = 'none'; hintEl.style.display = 'block'; return; }
    hintEl.style.display = 'none'; resultsEl.style.display = 'block';

    const hofMatches = data.hallOfFame.filter(p =>
      p.name.toLowerCase().includes(q) || p.tribe.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);
    const bizMatches = data.businesses.filter(b =>
      b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.location.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);
    const newsMatches = data.news.filter(n =>
      n.headline.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)
    ).slice(0, 3);

    if (!hofMatches.length && !bizMatches.length && !newsMatches.length) {
      resultsEl.innerHTML = `<div style="padding:32px;text-align:center;color:#444;font-size:0.8rem;">No results for "<strong style="color:#888;">${q}</strong>"</div>`;
      return;
    }
    let html = '';
    if (hofMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;">Hall of Fame</div>`;
      html += hofMatches.map(p => `<a href="./archive.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"><div style="width:34px;height:34px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${initials(p.name)}</div><div><div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${p.name}</div><div style="font-size:0.72rem;color:#555;">${p.tribe} · ${p.category}</div></div><div style="margin-left:auto;font-size:0.65rem;color:#333;flex-shrink:0;">HOF →</div></a>`).join('');
    }
    if (bizMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;border-top:${hofMatches.length ? '1px solid #1e1e1e' : 'none'};">Businesses</div>`;
      html += bizMatches.map(b => `<a href="./directory.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"><div style="width:34px;height:34px;border-radius:2px;background:#1e1e1e;border:1px solid #2a2a2a;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#f0a820;flex-shrink:0;">${initials(b.name)}</div><div><div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${b.name}</div><div style="font-size:0.72rem;color:#555;">${b.location} · ${b.category}</div></div><div style="margin-left:auto;font-size:0.65rem;color:#333;flex-shrink:0;">Dir →</div></a>`).join('');
    }
    if (newsMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-top:1px solid #1e1e1e;border-bottom:1px solid #1e1e1e;">News</div>`;
      html += newsMatches.map(n => `<div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;"><div style="font-size:0.62rem;font-weight:600;color:#f0a820;margin-bottom:4px;">${n.category.toUpperCase()} · ${formatDate(n.date)}</div><div style="font-size:0.82rem;font-weight:500;color:#f0f0f0;line-height:1.4;">${n.headline}</div></div>`).join('');
    }
    resultsEl.innerHTML = html;
  });
}

// ─── HERO SELECTOR ────────────────────────────────────────────────────────

const BRANCHES = ['KDCA Sabah', 'KDCA Klang Valley', 'KDCA Putrajaya', 'KDCA Selangor', 'KDCA Johor Bahru'];

let hs = {
  allWinners: [],
  branch: 'KDCA Sabah',
  list: [],
  index: 0,
  transitioning: false,
};

function herosByBranch(branch) {
  return hs.allWinners.filter(w => w.branch === branch);
}

function accentForEntry(entry) {
  return AWARD_COLORS[entry.award] || entry.accentColor || '#f0a820';
}

// Build portrait card content
function renderPortrait(entry) {
  const acc = accentForEntry(entry);
  const ini = initials(entry.name);
  // Background gradient — subtle color from accent
  const hex = acc.replace('#', '');
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  document.getElementById('portraitBg').style.background =
    `linear-gradient(160deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.06) 30%, #080808 70%)`;
  document.getElementById('portraitGlyph').textContent = ini[0] || '?';
  document.getElementById('portraitGlyph').style.color = `rgba(${r},${g},${b},0.06)`;
  document.getElementById('portraitAvatar').textContent = ini;
  document.getElementById('portraitAvatar').style.background = acc;
  document.getElementById('portraitAvatar').style.color = '#0a0a0a';
  document.getElementById('portraitAwardBadge').textContent = `${entry.award}  ${entry.year}`;
  document.getElementById('portraitAwardBadge').style.background = acc;
  document.getElementById('portraitName').textContent = entry.name;
  document.getElementById('portraitYear').textContent = `${entry.branch}  ·  ${entry.tribe}`;
  // Ambient background
  document.getElementById('ambientBg').style.background =
    `radial-gradient(ellipse 70% 60% at 50% 55%, rgba(${r},${g},${b},0.09) 0%, transparent 70%)`;
  // CSS accent var
  document.documentElement.style.setProperty('--accent', acc);
}

// Build stats panel content
function renderStats(entry, panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const acc = accentForEntry(entry);
  const voted = hasVoted(entry.id);

  panel.innerHTML = `
    <!-- Header -->
    <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:6px;">KDCA Champion Profile</div>
      <div style="font-size:1rem;font-weight:800;color:#f0f0f0;letter-spacing:-0.02em;line-height:1.2;">${entry.name}</div>
    </div>

    <!-- Stats -->
    <div class="stat-row">
      <div class="stat-label">Category</div>
      <div class="stat-value">${entry.award}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">Year</div>
      <div class="stat-value">${entry.year}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">District / Origin</div>
      <div class="stat-value">${entry.district}</div>
      <div class="stat-sub">${entry.origin}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">Heritage</div>
      <div class="stat-value">${entry.heritage.group}</div>
      <div class="stat-sub">${entry.heritage.costume}</div>
    </div>
    <div class="stat-row">
      <div class="stat-label">Language</div>
      <div class="stat-value">${entry.heritage.language}</div>
    </div>

    <!-- Achievements -->
    <div class="stat-row">
      <div class="stat-label">Achievements</div>
      <ul style="margin:6px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;">
        ${entry.achievements.map(a => `<li style="display:flex;gap:6px;font-size:0.78rem;color:rgba(255,255,255,0.5);"><span style="color:${acc};flex-shrink:0;margin-top:2px;">✦</span>${a}</li>`).join('')}
      </ul>
    </div>

    <!-- Bio -->
    <div class="stat-row" style="border-bottom:none;">
      <div class="stat-label">About</div>
      <div id="bioText" class="stat-sub" style="font-size:0.78rem;color:rgba(255,255,255,0.4);line-height:1.7;">${entry.bio}</div>
    </div>

    <!-- Vote -->
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
      <button id="${panelId === 'statsPanel' ? 'voteBtn' : 'voteBtnMobile'}" class="vote-btn ${voted ? 'voted' : ''}" data-id="${entry.id}">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:inline;margin-right:4px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/>
        </svg>
        ${voted ? `Voted · ${entry.votes}` : `Upvote · ${entry.votes}`}
      </button>
    </div>
  `;

  // Attach vote handler
  const btnId = panelId === 'statsPanel' ? 'voteBtn' : 'voteBtnMobile';
  document.getElementById(btnId)?.addEventListener('click', function() {
    const id = this.dataset.id;
    const w = hs.allWinners.find(x => x.id === id);
    if (!w) return;
    if (castVote(id)) {
      w.votes++;
      this.textContent = `✦ Voted · ${w.votes}`;
      this.classList.add('voted');
    }
  });
}

// Render dot indicators
function renderDots() {
  const row = document.getElementById('dotRow');
  if (!row) return;
  row.innerHTML = hs.list.map((_, i) =>
    `<div class="dot ${i === hs.index ? 'active' : ''}" data-i="${i}"></div>`
  ).join('');
  row.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => switchTo(parseInt(dot.dataset.i)));
  });
}

// Update branch tabs
function renderBranches() {
  const tabs = document.getElementById('branchTabs');
  if (!tabs) return;
  tabs.innerHTML = BRANCHES.map(b =>
    `<button class="branch-tab ${b === hs.branch ? 'active' : ''}" data-branch="${b}">${b}</button>`
  ).join('');
  tabs.querySelectorAll('.branch-tab').forEach(tab => {
    tab.addEventListener('click', () => switchBranch(tab.dataset.branch));
  });
}

// Fade transition then render
function switchTo(idx, immediate = false) {
  if (hs.transitioning && !immediate) return;
  hs.index = ((idx % hs.list.length) + hs.list.length) % hs.list.length;
  hs.transitioning = true;
  const card = document.getElementById('portraitCard');
  const panel = document.getElementById('statsPanel');
  const mobile = document.getElementById('mobileStats');

  // Fade out
  card?.classList.add('fading');
  panel?.classList.add('fading');

  setTimeout(() => {
    const entry = hs.list[hs.index];
    if (!entry) return;
    renderPortrait(entry);
    renderStats(entry, 'statsPanel');
    if (mobile?.style.display !== 'none') renderStats(entry, 'mobileStats');
    renderDots();
    // Fade back in
    card?.classList.remove('fading');
    panel?.classList.remove('fading');
    hs.transitioning = false;
  }, 300);
}

function switchBranch(branch) {
  hs.branch = branch;
  hs.list = herosByBranch(branch);
  hs.index = 0;
  renderBranches();
  switchTo(0, true);
}

function initHeroSelector(data) {
  hs.allWinners = data.winners || [];
  hs.branch = 'KDCA Sabah';
  hs.list = herosByBranch(hs.branch);
  hs.index = 0;

  renderBranches();
  switchTo(0, true);

  // Layout: desktop side-by-side, mobile stacked
  const heroMain = document.getElementById('heroMain');
  const statsPanel = document.getElementById('statsPanel');
  const mobileStats = document.getElementById('mobileStats');
  const portraitRegion = document.getElementById('portraitRegion');

  function applyLayout() {
    const isDesktop = window.innerWidth >= 768;
    if (isDesktop) {
      heroMain.style.flexDirection = 'row';
      statsPanel.style.display = 'flex';
      mobileStats.style.display = 'none';
      portraitRegion.style.padding = '20px 48px';
    } else {
      heroMain.style.flexDirection = 'column';
      statsPanel.style.display = 'none';
      mobileStats.style.display = 'block';
      portraitRegion.style.padding = '12px 48px 0';
      // Render stats into mobile panel
      const entry = hs.list[hs.index];
      if (entry) renderStats(entry, 'mobileStats');
    }
  }
  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Arrows
  document.getElementById('prevBtn').addEventListener('click', () => switchTo(hs.index - 1));
  document.getElementById('nextBtn').addEventListener('click', () => switchTo(hs.index + 1));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  switchTo(hs.index - 1);
    if (e.key === 'ArrowRight') switchTo(hs.index + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  const portrait = document.getElementById('portraitCard');
  portrait?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  portrait?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) switchTo(dx < 0 ? hs.index + 1 : hs.index - 1);
  }, { passive: true });
}

// ─── INDEX PAGE ───────────────────────────────────────────────────────────

async function initIndex(data) {
  animateCount('statHof', data.stats.hofEntries);
  animateCount('statBiz', data.stats.businesses);
  animateCount('statTribes', data.stats.tribesRepresented);
  animateCount('statDistricts', data.stats.districtsRepresented);

  buildTicker('breakingTicker', data.news.map(n => n.headline));
  buildTicker('newsTicker', data.news.map(n => `${n.category.toUpperCase()}: ${n.headline} (${n.source})`));

  const feedEl = document.getElementById('newsFeed');
  if (feedEl) {
    feedEl.innerHTML = data.news.map(item => `
      <article data-fade style="background:#111;border:1px solid #1e1e1e;padding:16px;display:flex;flex-direction:column;gap:8px;transition:border-color 0.15s;"
        onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f0a820;">${item.category}</span>
          <span style="color:#252525;">·</span>
          <span style="font-size:0.72rem;color:#444;">${formatDate(item.date)}</span>
          <span style="color:#252525;">·</span>
          <span style="font-size:0.72rem;color:#333;">${item.source}</span>
        </div>
        <h3 style="font-size:0.95rem;font-weight:700;color:#f0f0f0;line-height:1.4;margin:0;letter-spacing:-0.01em;">${item.headline}</h3>
        <p style="font-size:0.8rem;color:#555;line-height:1.65;margin:0;">${item.summary}</p>
      </article>
    `).join('');
    fadein(feedEl);
  }

  const topEl = document.getElementById('topVoted');
  if (topEl) {
    const sorted = [...data.hallOfFame].sort((a, b) => b.votes - a.votes).slice(0, 5);
    topEl.innerHTML = sorted.map((p, i) => `
      <div data-fade style="display:flex;align-items:center;gap:10px;padding:10px;background:#111;border:1px solid #1e1e1e;transition:border-color 0.15s;"
        onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <span style="font-size:0.75rem;font-weight:800;color:#333;width:16px;text-align:center;flex-shrink:0;">${i + 1}</span>
        <div style="width:32px;height:32px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${initials(p.name)}</div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:0.82rem;font-weight:600;color:#f0f0f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.7rem;color:#444;">${p.tribe} · ${p.category}</div>
        </div>
        <span style="font-size:0.72rem;font-weight:700;color:#f0a820;flex-shrink:0;">${p.votes}</span>
      </div>
    `).join('');
    fadein(topEl);
  }

  const bizEl = document.getElementById('featuredBusiness');
  if (bizEl) {
    const featured = data.businesses.filter(b => b.featured);
    const biz = featured[Math.floor(Math.random() * featured.length)];
    if (biz) {
      const col = catCol(biz.category, BIZ_CAT_COLORS);
      bizEl.innerHTML = `
        <div data-fade style="background:#111;border:1px solid #1e1e1e;border-left:2px solid #f0a820;padding:16px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
            <div>
              <span style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;color:${col.text};text-transform:uppercase;">${biz.category}</span>
              <h3 style="font-size:1rem;font-weight:800;color:#f0f0f0;margin:4px 0 0;letter-spacing:-0.01em;">${biz.name}</h3>
            </div>
            ${biz.verified ? '<span style="font-size:0.6rem;font-weight:700;padding:2px 8px;background:#1a3a26;color:#4ade80;border-radius:2px;letter-spacing:0.08em;flex-shrink:0;">✓ VERIFIED</span>' : ''}
          </div>
          <p style="font-size:0.72rem;color:#444;margin:0 0 8px;">📍 ${biz.location}</p>
          <p style="font-size:0.8rem;color:#666;line-height:1.6;margin:0;">${biz.description.slice(0, 140)}…</p>
          <a href="./directory.html" style="display:inline-block;margin-top:14px;font-size:0.72rem;font-weight:600;color:#f0a820;text-decoration:none;">View in directory →</a>
        </div>
      `;
      fadein(bizEl);
    }
  }

  const hofEl = document.getElementById('hofPreview');
  if (hofEl) {
    const preview = [...data.hallOfFame].sort((a, b) => b.votes - a.votes).slice(0, 3);
    hofEl.innerHTML = preview.map(p => {
      const col = catCol(p.category);
      const voted = hasVoted(p.id);
      return `
        <article data-fade style="background:#111;border:1px solid #1e1e1e;padding:14px 16px;display:flex;align-items:flex-start;gap:14px;transition:border-color 0.15s;"
          onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
          <div style="width:44px;height:44px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;font-weight:800;color:#0a0a0a;">${initials(p.name)}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
              <div>
                <h3 style="font-size:0.9rem;font-weight:700;color:#f0f0f0;margin:0 0 2px;letter-spacing:-0.01em;">${p.name}</h3>
                <span style="font-size:0.68rem;color:#444;">${p.tribe} · ${p.district} · ${p.era}</span>
              </div>
              <span style="font-size:0.6rem;font-weight:700;padding:3px 8px;border-radius:2px;flex-shrink:0;background:${col.bg};color:${col.text};white-space:nowrap;">${p.category}</span>
            </div>
            <p style="font-size:0.78rem;color:#555;margin:6px 0 10px;line-height:1.6;">${p.bio.slice(0, 120)}…</p>
            <div style="font-size:0.7rem;color:#f0a820;font-weight:600;">${voted ? `✦ ${p.votes} votes (you voted)` : `↑ ${p.votes} votes`}</div>
          </div>
        </article>
      `;
    }).join('');
    fadein(hofEl);
  }

  initGlobalSearch(data);
}

// ─── DIRECTORY PAGE ───────────────────────────────────────────────────────

async function initDirectory(data) {
  let currentCat = 'all', currentSort = 'featured', searchQuery = '';

  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  if (urlCat) {
    currentCat = urlCat;
    document.querySelectorAll('.biz-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === urlCat));
  }

  function render() {
    let list = [...data.businesses];
    if (currentCat !== 'all') list = list.filter(b => b.category === currentCat);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.location.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (currentSort === 'featured') list.sort((a, b) => (b.featured?1:0) - (a.featured?1:0));
    else if (currentSort === 'nameAsc') list.sort((a,b) => a.name.localeCompare(b.name));
    else if (currentSort === 'newest') list.sort((a,b) => b.founded - a.founded);
    else if (currentSort === 'oldest') list.sort((a,b) => a.founded - b.founded);

    const grid = document.getElementById('bizGrid');
    const empty = document.getElementById('bizEmpty');
    const count = document.getElementById('bizResultsCount');
    if (count) count.textContent = `${list.length} business${list.length===1?'':'es'} found`;
    if (!list.length) { grid.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display = 'none';
    grid.innerHTML = list.map(b => {
      const col = catCol(b.category, BIZ_CAT_COLORS);
      return `<article class="biz-card" data-id="${b.id}" data-fade
        style="background:#111;border:1px solid #1e1e1e;${b.featured ? 'border-left:2px solid #f0a820;' : ''}padding:14px 16px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;transition:border-color 0.15s;"
        onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='${b.featured ? '#f0a820' : '#1e1e1e'}'">
        <div style="width:44px;height:44px;border-radius:2px;background:#1a1a1a;border:1px solid #252525;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#f0a820;flex-shrink:0;">${initials(b.name)}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:2px;">
            <div style="min-width:0;">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px;">
                ${b.featured ? '<span style="font-size:0.58rem;font-weight:700;color:#f0a820;letter-spacing:0.08em;">★ FEATURED</span>' : ''}
                <span style="font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${b.category}</span>
                ${b.verified ? '<span style="font-size:0.58rem;font-weight:700;padding:2px 7px;background:#1a3a26;color:#4ade80;border-radius:2px;letter-spacing:0.06em;">✓ VERIFIED</span>' : ''}
              </div>
              <h3 style="font-size:0.9rem;font-weight:700;color:#f0f0f0;margin:0;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.name}</h3>
            </div>
            <span style="font-size:0.68rem;color:#333;flex-shrink:0;white-space:nowrap;">Est. ${b.founded}</span>
          </div>
          <p style="font-size:0.7rem;color:#444;margin:4px 0 6px;">📍 ${b.location}</p>
          <p style="font-size:0.78rem;color:#555;margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${b.description}</p>
        </div>
      </article>`;
    }).join('');
    attachBizListeners(data.businesses);
    fadein(grid);
  }

  document.querySelectorAll('.biz-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.cat;
      document.querySelectorAll('.biz-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
      render();
    });
  });
  document.getElementById('bizSearch')?.addEventListener('input', e => { searchQuery = e.target.value.trim(); render(); });
  document.getElementById('bizSort')?.addEventListener('change', e => { currentSort = e.target.value; render(); });
  render();
  initBizModal(data.businesses);
}

function attachBizListeners(allBiz) {
  document.querySelectorAll('.biz-card').forEach(card => {
    card.addEventListener('click', () => {
      const biz = allBiz.find(b => b.id === card.dataset.id);
      if (biz) openBizModal(biz);
    });
  });
}

function initBizModal(allBiz) {
  const modal = document.getElementById('bizModal');
  if (!modal) return;
  document.getElementById('bizModalClose')?.addEventListener('click', closeBizModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeBizModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBizModal(); });
}

function openBizModal(biz) {
  const modal = document.getElementById('bizModal');
  const col = catCol(biz.category, BIZ_CAT_COLORS);
  document.getElementById('bizModalCategory').textContent = `${biz.category} · ${biz.subcategory}`;
  document.getElementById('bizModalName').textContent = biz.name;
  document.getElementById('bizModalMeta').textContent = `${biz.tribe}-owned · Est. ${biz.founded} · ${biz.owner}`;
  document.getElementById('bizModalDesc').textContent = biz.description;
  const verified = document.getElementById('bizModalVerified');
  verified.style.display = biz.verified ? 'inline-block' : 'none';

  function contact(wrapId, linkId, href, text) {
    const w = document.getElementById(wrapId);
    if (!w) return;
    if (text) { w.style.display='flex'; const l = document.getElementById(linkId); if (l) { l.href=href; l.textContent=text; } }
    else w.style.display='none';
  }
  contact('bizModalPhone','bizModalPhoneLink', `tel:${(biz.phone||'').replace(/\s/g,'')}`, biz.phone);
  contact('bizModalEmail','bizModalEmailLink', `mailto:${biz.email||''}`, biz.email);

  const loc = document.getElementById('bizModalLocation');
  if (loc) { loc.style.display=biz.location?'flex':'none'; const t=document.getElementById('bizModalLocationText'); if(t) t.textContent=biz.location; }
  const hrs = document.getElementById('bizModalHours');
  if (hrs) { hrs.style.display=biz.hours?'flex':'none'; const t=document.getElementById('bizModalHoursText'); if(t) t.textContent=biz.hours; }

  document.getElementById('bizModalTags').innerHTML = biz.tags.map(t =>
    `<span style="font-size:0.62rem;font-weight:600;padding:3px 8px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${t}</span>`
  ).join('');

  const webW = document.getElementById('bizModalWebsiteWrap');
  const webL = document.getElementById('bizModalWebsite');
  if (biz.website) { webW.style.display='block'; webL.href=`https://${biz.website}`; }
  else webW.style.display='none';

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeBizModal() {
  const modal = document.getElementById('bizModal');
  if (modal) { modal.style.display='none'; document.body.style.overflow=''; }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

(async function init() {
  try {
    const data = await loadData();
    const path = window.location.pathname;
    if (path.includes('archive')) {
      initHeroSelector(data);
    } else if (path.includes('directory')) {
      await initDirectory(data);
    } else {
      await initIndex(data);
    }
  } catch (err) {
    console.error('KDMR Media:', err);
  }
})();
