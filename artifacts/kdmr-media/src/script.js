/**
 * KDMR Media — script.js
 * Pages: / (index), /unduk-ngadau/, /mrk/, /sugandoi/, /winners.html
 */

const DATA_URL = import.meta.env.BASE_URL + 'data.json';
const VOTES_KEY = 'kdmr_votes';
let _data = null;

// ════════════════════════════════════════════════════════════════════════
// ─── API INTEGRATIONS ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// Supabase anon/public key — safe for client-side use (protected by RLS).
// Never put the service_role key here.

const API_CONFIG = {
  SUPABASE_URL:      'https://erbyhmliuqopwrspxbir.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg',
};

/** POST a row directly to a Supabase table via the REST API. */
async function supabaseInsert(table, row) {
  try {
    const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey':        API_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error(`[KDMR] Supabase insert to ${table} failed:`, err);
    return { ok: false, error: err.message };
  }
}

// Ensure dataLayer exists for GTM (safe no-op if GTM is not yet installed).
window.dataLayer = window.dataLayer || [];

/**
 * SHA-256 hash of a string (lowercase-trimmed) via the native Web Crypto API.
 * Used for Meta Conversion API (CAPI) — hashed email must be sent instead of
 * plaintext. Replace the placeholder webhook with your real CAPI endpoint.
 */
async function sha256(str) {
  const encoded = new TextEncoder().encode(str.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Map current pathname to an interest tag used by Make.com / Supabase. */
function getInterestTagFromPath() {
  const p = window.location.pathname;
  if (p.includes('unduk-ngadau')) return 'UN';
  if (p.includes('mrk'))          return 'MRK';
  if (p.includes('sugandoi'))     return 'SG';
  if (p.includes('winners'))      return 'Winners';
  return 'General';
}

/**
 * Submit a vote to the cloud → Supabase community_votes table.
 * Silently succeeds even if the table doesn't exist yet (non-blocking).
 */
async function submitVoteToCloud(entryId, meta = {}) {
  // Analytics — fire regardless so GTM/GA sees every vote.
  window.dataLayer.push({
    event:       'kdmr_vote',
    category:    'engagement',
    interestTag: getInterestTagFromPath(),
    entryId,
    page:        window.location.pathname,
  });
  return supabaseInsert('community_votes', {
    entry_id:    entryId,
    entry_name:  meta.name  || null,
    award:       meta.award || null,
    branch:      meta.branch || null,
    interest:    getInterestTagFromPath(),
    page:        window.location.pathname,
  });
}

/**
 * Submit a newsletter signup → Supabase newsletter_subscribers table.
 * Auto-tags the subscriber based on the page they signed up from.
 */
async function submitNewsletter(email, meta = {}) {
  const tag = getInterestTagFromPath();
  const hashedEmail = await sha256(email);

  // Analytics — send only hashed PII to dataLayer (safe for GTM → Meta CAPI).
  window.dataLayer.push({
    event:         'kdmr_lead',
    category:      'newsletter',
    interestTag:   tag,
    page:          window.location.pathname,
    em:            hashedEmail,
  });

  return supabaseInsert('newsletter_subscribers', {
    email,
    interest:  tag,
    page:      window.location.pathname,
  });
}

// ─── TOAST NOTIFICATIONS ────────────────────────────────────────────────

function ensureToastContainer() {
  let c = document.getElementById('kdmrToastContainer');
  if (c) return c;
  c = document.createElement('div');
  c.id = 'kdmrToastContainer';
  c.style.cssText = 'position:fixed;top:72px;right:16px;left:16px;display:flex;flex-direction:column;gap:8px;z-index:300;pointer-events:none;align-items:flex-end;';
  document.body.appendChild(c);
  return c;
}

/** Show a transient toast notification. type: 'success' | 'info' | 'error' */
function showToast(message, type = 'success') {
  const c = ensureToastContainer();
  const palette = {
    success: { bg:'#0f1f15', border:'#1f4a2e', text:'#4ade80', icon:'✓' },
    info:    { bg:'#0f1722', border:'#1f3a4a', text:'#60a5fa', icon:'ℹ' },
    error:   { bg:'#1f0f0f', border:'#4a1f1f', text:'#ff6b6b', icon:'✕' },
  };
  const p = palette[type] || palette.success;
  const t = document.createElement('div');
  t.style.cssText = `pointer-events:auto;display:flex;align-items:center;gap:10px;background:${p.bg};border:1px solid ${p.border};color:${p.text};padding:11px 16px;border-radius:3px;font-size:0.82rem;font-weight:600;font-family:Inter,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,0.6);max-width:340px;transform:translateY(-12px);opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;`;
  t.innerHTML = `<span style="font-size:0.95rem;flex-shrink:0;">${p.icon}</span><span>${message}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateY(-12px)';
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

// ─── NEWSLETTER FORM ────────────────────────────────────────────────────

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = form.querySelector('input[name="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const email = (emailInput.value || '').trim();
    if (!email) return;
    const originalText = btn.textContent;
    btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = 'Sending…';
    const result = await submitNewsletter(email);
    if (result.ok) {
      showToast('Welcome to the KDMR Pulse!', 'success');
      emailInput.value = '';
      btn.textContent = '✓ Subscribed';
      setTimeout(() => { btn.disabled = false; btn.style.opacity = '1'; btn.textContent = originalText; }, 2500);
    } else {
      showToast('Could not subscribe — try again later.', 'error');
      btn.disabled = false; btn.style.opacity = '1'; btn.textContent = originalText;
    }
  });
}
// ════════════════════════════════════════════════════════════════════════

// ─── Data ─────────────────────────────────────────────────────────────────

async function loadData() {
  if (_data) return _data;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  _data = await res.json();
  return _data;
}

// ─── Date-based Featured Picker ───────────────────────────────────────────
// Returns { featuredWinner, featuredSong } based on the current date so the
// homepage feels updated every time a user returns.
//   • Featured Winner  — rotates weekly through all voted winners
//   • Featured Song    — rotates daily through the songs catalogue
function pickFeatured(data, date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear   = Math.floor((date - startOfYear) / 864e5) + 1;
  const weekIndex   = Math.floor((dayOfYear - 1) / 7); // increments every 7 days

  // ── Featured Winner ──────────────────────────────────────────────────────
  // Prefer current-year winners with actual votes; fall back to all-time pool.
  const allW        = data.winners || [];
  const currentYear = date.getFullYear();
  const poolCurrent = allW.filter(w => w.year === currentYear && (w.votes || 0) > 0);
  const poolAll     = allW.filter(w => (w.votes || 0) > 0);
  const winnerPool  = poolCurrent.length >= 3 ? poolCurrent : poolAll;
  // Sort descending so week 0 always starts with the season champion
  const sorted      = [...winnerPool].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const featuredWinner = sorted[weekIndex % sorted.length] || sorted[0] || null;

  // ── Featured Song ────────────────────────────────────────────────────────
  // Changes daily (uses raw day index, offset by 3 so it doesn't sync with winner).
  const songs      = data.songs || [];
  const dayIndex   = dayOfYear - 1;
  const featuredSong = songs.length
    ? songs[(dayIndex + 3) % songs.length]
    : null;

  return { featuredWinner, featuredSong };
}

// ─── Votes ────────────────────────────────────────────────────────────────

function getVotes() { try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); } catch { return {}; } }
function hasVoted(id) { return !!getVotes()[id]; }
function castVote(id) {
  if (hasVoted(id)) return false;
  const v = getVotes(); v[id] = true;
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function initials(name) { return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-MY', { year:'numeric', month:'short', day:'numeric' }); }
function animateCount(id, target) {
  const el = document.getElementById(id); if (!el) return;
  let n = 0; const step = Math.ceil(target / 30);
  const iv = setInterval(() => { n = Math.min(n + step, target); el.textContent = n.toLocaleString(); if (n >= target) clearInterval(iv); }, 28);
}
function fadein(container) {
  container.querySelectorAll('[data-fade]').forEach((el, i) => {
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
function catCol(cat) { return CAT_COLORS[cat] || { bg:'rgba(240,168,32,0.08)', text:'#f0a820' }; }

// ─── Ticker ───────────────────────────────────────────────────────────────

function buildTicker(trackId, items) {
  const track = document.getElementById(trackId); if (!track || !items.length) return;
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
    if (q.length < 2) { resultsEl.style.display='none'; hintEl.style.display='block'; return; }
    hintEl.style.display = 'none'; resultsEl.style.display = 'block';
    const hofMatches = data.hallOfFame.filter(p =>
      p.name.toLowerCase().includes(q)||p.tribe.toLowerCase().includes(q)||p.district.toLowerCase().includes(q)||p.tags.some(t=>t.toLowerCase().includes(q))
    ).slice(0,4);
    const newsMatches = data.news.filter(n => n.headline.toLowerCase().includes(q)||n.summary.toLowerCase().includes(q)).slice(0,3);
    if (!hofMatches.length && !newsMatches.length) {
      resultsEl.innerHTML = `<div style="padding:32px;text-align:center;color:#444;font-size:0.8rem;">No results for "<strong style="color:#888;">${q}</strong>"</div>`;
      return;
    }
    let html = '';
    if (hofMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;">Hall of Fame</div>`;
      html += hofMatches.map(p=>`<a href="/winners.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"><div style="width:34px;height:34px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${initials(p.name)}</div><div><div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${p.name}</div><div style="font-size:0.72rem;color:#555;">${p.tribe} · ${p.category}</div></div></a>`).join('');
    }
    if (newsMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-top:1px solid #1e1e1e;border-bottom:1px solid #1e1e1e;">News</div>`;
      html += newsMatches.map(n=>`<div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;"><div style="font-size:0.62rem;font-weight:600;color:#f0a820;margin-bottom:4px;">${n.category.toUpperCase()} · ${formatDate(n.date)}</div><div style="font-size:0.82rem;font-weight:500;color:#f0f0f0;line-height:1.4;">${n.headline}</div></div>`).join('');
    }
    resultsEl.innerHTML = html;
  });
}

// ─── HERO SELECTOR ────────────────────────────────────────────────────────

// Branch tabs — grouped by region
const TABS = ['Peninsular Malaysia', 'Sarawak', 'Sabah (Central)'];
const TAB_LABELS = {};
const HERO_CUTOFF_YEAR = 2017; // 10-year rolling window: show hero carousel for this year and newer
const SABAH_GRID_THRESHOLD = 8; // Show district grid when Sabah has >= this many winners

const PENINSULAR_BRANCHES = ['KDCA Klang Valley', 'KDCA Putrajaya', 'KDCA Johor', 'KDCA Melaka', 'KDCA Pulau Pinang', 'KDCA Perak'];

function branchMatchesTab(branch, tab) {
  if (tab === 'Sabah (Central)') return branch === 'KDCA Sabah';
  if (tab === 'Peninsular Malaysia') return PENINSULAR_BRANCHES.includes(branch);
  if (tab === 'Sarawak') return branch === 'KDCA Sarawak';
  return false;
}

let hs = { allWinners:[], award:'', tab:'Peninsular Malaysia', list:[], index:0, transitioning:false };

function renderPortrait(entry) {
  // Hide empty-state overlay first — must happen before touching inner elements
  const overlay = document.getElementById('emptyStateOverlay');
  if (overlay) overlay.style.display = 'none';

  const acc = entry.accentColor || '#f0a820';
  const hex = acc.replace('#','');
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  const hasPhoto = !!entry.imageUrl;

  // ── Background: photo + cinematic glow, or solid dark gradient ────────────
  const bg = document.getElementById('portraitBg');
  if (bg) {
    if (hasPhoto) {
      // Photo base layer with accent-tinted glow on top
      bg.style.background =
        `linear-gradient(160deg, rgba(${r},${g},${b},0.38) 0%, rgba(${r},${g},${b},0.1) 45%, transparent 68%),` +
        `url('${entry.imageUrl}') center top / cover no-repeat`;
    } else {
      bg.style.background =
        `linear-gradient(160deg, rgba(${r},${g},${b},0.2) 0%, rgba(${r},${g},${b},0.07) 30%, #060606 70%)`;
    }
  }

  // ── Diagonal pattern: visible only when no photo ───────────────────────
  const pattern = document.getElementById('portraitPattern');
  if (pattern) pattern.style.opacity = hasPhoto ? '0' : '';

  // ── Large letter glyph: hide when photo is shown ───────────────────────
  const glyph = document.getElementById('portraitGlyph');
  if (glyph) {
    if (hasPhoto) {
      glyph.textContent = '';
    } else {
      glyph.textContent = initials(entry.name)[0] || '?';
      glyph.style.color = `rgba(${r},${g},${b},0.07)`;
    }
  }

  // ── Initials circle: hide when photo is shown ──────────────────────────
  const avatar = document.getElementById('portraitAvatar');
  if (avatar) {
    if (hasPhoto) {
      avatar.style.display = 'none';
    } else {
      avatar.textContent = initials(entry.name);
      avatar.style.background = acc;
      avatar.style.display = '';
    }
  }

  // ── Name plate elements ────────────────────────────────────────────────
  const badge = document.getElementById('portraitAwardBadge');
  if (badge) { badge.textContent = `${entry.award}  ${entry.year}`; badge.style.background = acc; badge.style.display = ''; }

  const nameEl = document.getElementById('portraitName');
  if (nameEl) { nameEl.textContent = entry.name; nameEl.style.display = ''; }

  const yearEl = document.getElementById('portraitYear');
  if (yearEl) { yearEl.textContent = `${entry.branch}  ·  ${entry.tribe}`; yearEl.style.display = ''; }

  // ── Ambient page glow ──────────────────────────────────────────────────
  const ambEl = document.getElementById('ambientBg');
  if (ambEl) ambEl.style.background =
    `radial-gradient(ellipse 70% 60% at 50% 55%, rgba(${r},${g},${b},${hasPhoto ? '0.14' : '0.1'}) 0%, transparent 70%)`;

  document.documentElement.style.setProperty('--hero-accent', acc);

  const accentLine = document.getElementById('portraitAccentLine');
  if (accentLine) accentLine.style.background = `linear-gradient(90deg,transparent,${acc},transparent)`;
}

function renderStats(entry, panelId) {
  const panel = document.getElementById(panelId); if (!panel) return;
  const acc = entry.accentColor || '#f0a820';
  const voted = hasVoted(entry.id);
  const btnId = panelId === 'statsPanel' ? 'voteBtn' : 'voteBtnMobile';
  panel.innerHTML = `
    <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <div style="font-size:0.58rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${acc};margin-bottom:6px;">KDCA Champion Profile</div>
      <div style="font-size:1rem;font-weight:800;color:#f0f0f0;letter-spacing:-0.02em;line-height:1.2;margin-bottom:${entry.badge ? '7px' : '0'};">${entry.name}</div>
      ${entry.badge ? `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(240,168,32,0.1);border:1px solid rgba(240,168,32,0.28);color:#f0a820;font-size:0.55rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:3px 9px;border-radius:2px;">✦ ${entry.badge}</div>` : ''}
    </div>
    <div class="stat-row"><div class="stat-label">Category</div><div class="stat-value">${entry.award}</div></div>
    <div class="stat-row"><div class="stat-label">Year</div><div class="stat-value">${entry.year}</div></div>
    <div class="stat-row"><div class="stat-label">District / Origin</div><div class="stat-value">${entry.district}</div><div class="stat-sub">${entry.origin}</div></div>
    <div class="stat-row"><div class="stat-label">Heritage</div><div class="stat-value">${entry.heritage.group}</div><div class="stat-sub">${entry.heritage.costume}</div></div>
    <div class="stat-row"><div class="stat-label">Language</div><div class="stat-value">${entry.heritage.language}</div></div>
    <div class="stat-row">
      <div class="stat-label">Achievements</div>
      <ul style="margin:6px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;">
        ${entry.achievements.map(a=>`<li style="display:flex;gap:6px;font-size:0.78rem;color:rgba(255,255,255,0.5);"><span style="color:${acc};flex-shrink:0;margin-top:2px;">✦</span>${a}</li>`).join('')}
      </ul>
    </div>
    <div class="stat-row" style="border-bottom:none;">
      <div class="stat-label">About</div>
      <div style="font-size:0.78rem;color:rgba(255,255,255,0.4);line-height:1.7;margin-top:4px;">${entry.bio}</div>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
      <button id="${btnId}" class="vote-hero-btn" data-id="${entry.id}">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 5px #ef4444;flex-shrink:0;"></span>
        Vote in Live Arena →
      </button>
    </div>
  `;
  document.getElementById(btnId)?.addEventListener('click', function() {
    window.location.href = import.meta.env.BASE_URL + 'live.html';
  });
}

function renderDots() {
  const row = document.getElementById('dotRow'); if (!row) return;
  row.innerHTML = hs.list.map((_,i)=>`<div class="dot ${i===hs.index?'active':''}" data-i="${i}"></div>`).join('');
  // Event delegation — one listener on container avoids accumulation on re-render
  row.onclick = e => {
    const dot = e.target.closest('.dot');
    if (dot) switchTo(parseInt(dot.dataset.i));
  };
}

function renderTabs() {
  // Only update the active class — never re-attach listeners (avoids accumulation)
  document.querySelectorAll('#branchTabs .branch-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === hs.tab);
  });
}

/* ─── Sabah District Grid helpers ─── */

function isSabahGridMode() {
  // Only show district grid for Unduk Ngadau Sabah tab (not MRK or Sugandoi)
  return hs.award === 'Unduk Ngadau' && hs.tab === 'Sabah (Central)' && hs.list.length >= SABAH_GRID_THRESHOLD;
}

function isPeninsularGridMode() {
  // Show compact branch grid for Peninsular Malaysia tab on all award pages
  return hs.tab === 'Peninsular Malaysia' && hs.list.length >= 2;
}

function renderSabahGrid() {
  const grid = document.getElementById('sabahGrid');
  if (!grid) return;
  const acc = '#f0a820';
  // Sort alphabetically by district for the grid
  const sorted = [...hs.list].sort((a, b) => a.district.localeCompare(b.district));
  grid.innerHTML = sorted.map(w => {
    const hasPhoto = w.imageUrl && !w.imageUrl.includes('placeholder');
    const inits = initials(w.name);
    return `
      <div class="sabah-card" data-id="${w.id}" title="${w.name} — ${w.district}">
        <div class="sabah-card-photo">
          ${hasPhoto ? `<img src="${w.imageUrl}" alt="${w.name}" loading="eager" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
          <div class="sabah-card-initials" style="display:${hasPhoto ? 'none' : 'flex'}">${inits}</div>
        </div>
        <div class="sabah-card-info">
          <div class="sabah-card-name">${w.name}</div>
          <div class="sabah-card-district">${w.district}</div>
          <div class="sabah-card-tribe">${w.tribe}</div>
        </div>
      </div>`;
  }).join('');
  // Event delegation for card clicks
  grid.onclick = e => {
    const card = e.target.closest('.sabah-card');
    if (!card) return;
    const id = card.dataset.id;
    const idx = hs.list.findIndex(w => w.id === id);
    if (idx >= 0) enterCarousel(idx);
  };
}

function renderPeninsularGrid() {
  const grid = document.getElementById('peninsularGrid');
  if (!grid) return;
  // Sort alphabetically by branch name for the grid
  const sorted = [...hs.list].sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));
  const currentId = hs.list[hs.index]?.id;
  grid.innerHTML = sorted.map(w => {
    const hasPhoto = w.imageUrl && !w.imageUrl.includes('placeholder');
    const inits = initials(w.name);
    const isActive = w.id === currentId;
    const branchShort = (w.branch || '').replace('KDCA ', '');
    return `
      <div class="peninsular-card ${isActive ? 'active' : ''}" data-id="${w.id}" title="${w.name} — ${branchShort}">
        <div class="peninsular-card-photo">
          ${hasPhoto ? `<img src="${w.imageUrl}" alt="${w.name}" loading="eager" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
          <div class="peninsular-card-initials" style="display:${hasPhoto ? 'none' : 'flex'}">${inits}</div>
        </div>
        <div class="peninsular-card-info">
          <div class="peninsular-card-name">${w.name}</div>
          <div class="peninsular-card-district">${branchShort}</div>
          <div class="peninsular-card-tribe">${w.tribe}</div>
        </div>
      </div>`;
  }).join('');
  // Event delegation: clicking a card switches the main portrait to that winner
  grid.onclick = e => {
    const card = e.target.closest('.peninsular-card');
    if (!card) return;
    const id = card.dataset.id;
    const idx = hs.list.findIndex(w => w.id === id);
    if (idx >= 0) {
      hs.index = idx;
      switchTo(idx, true);
    }
  };
}

function showPeninsularGrid() {
  const grid = document.getElementById('peninsularGrid');
  if (grid) { grid.style.display = ''; renderPeninsularGrid(); }
  // Expand heroContainer to natural height so the page itself scrolls
  const hc = document.getElementById('heroContainer');
  if (hc) { hc.style.height = 'auto'; hc.style.overflow = 'visible'; }
}

function hidePeninsularGrid() {
  const grid = document.getElementById('peninsularGrid');
  if (grid) grid.style.display = 'none';
  // Restore heroContainer to viewport-locked mode
  const hc = document.getElementById('heroContainer');
  if (hc) { hc.style.height = 'calc(100vh - 52px)'; hc.style.overflow = 'hidden'; }
}

function enterCarousel(idx) {
  // Switch from grid view to single-winner carousel view
  const grid = document.getElementById('sabahGrid');
  const penGrid = document.getElementById('peninsularGrid');
  const wrap = document.getElementById('carouselWrap');
  const dots = document.getElementById('dotRow');
  const backBtn = document.getElementById('gridBackBtn');
  const statsPanel = document.getElementById('statsPanel');
  if (grid) grid.style.display = 'none';
  if (penGrid) penGrid.style.display = 'none';
  if (wrap) wrap.style.display = '';
  if (dots) dots.style.display = '';
  if (backBtn) backBtn.style.display = '';
  // Show arrows
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.style.display = '';
  if (next) next.style.display = '';
  // Render the selected winner
  hs.index = ((idx % hs.list.length) + hs.list.length) % hs.list.length;
  const entry = hs.list[hs.index];
  if (entry) {
    renderPortrait(entry);
    renderStats(entry, 'statsPanel');
    const mob = document.getElementById('mobileStats');
    if (mob?.style.display !== 'none') renderStats(entry, 'mobileStats');
    renderDots();
  }
  // Re-apply layout so stats panel re-appears and container locks back to viewport height
  if (typeof window.__applyHeroLayout === 'function') window.__applyHeroLayout();
}

function enterGrid() {
  // Switch from carousel view back to district grid view
  const grid = document.getElementById('sabahGrid');
  const wrap = document.getElementById('carouselWrap');
  const dots = document.getElementById('dotRow');
  const backBtn = document.getElementById('gridBackBtn');
  const statsPanel = document.getElementById('statsPanel');
  if (grid) { grid.style.display = ''; renderSabahGrid(); }
  if (wrap) wrap.style.display = 'none';
  if (dots) dots.style.display = 'none';
  if (backBtn) backBtn.style.display = 'none';
  // Hide arrows
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  if (prev) prev.style.display = 'none';
  if (next) next.style.display = 'none';
  // Clear stats panel or show "select a district" hint
  if (statsPanel) {
    statsPanel.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:14px;text-align:center;padding:20px;">
        <div style="font-size:2rem;color:rgba(240,168,32,0.08);line-height:1;">✖</div>
        <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(240,168,32,0.35);">Sabah Districts</div>
        <div style="font-size:0.72rem;color:#444;max-width:200px;line-height:1.6;">Click any district champion to view their full profile and upvote.</div>
      </div>`;
  }
  const mob = document.getElementById('mobileStats');
  if (mob) mob.innerHTML = '';
  // Re-apply layout so stats panel hides and container expands for the grid
  if (typeof window.__applyHeroLayout === 'function') window.__applyHeroLayout();
}

function initBranchTabs() {
  // Called once from initHeroSelector — sets up tabs + single event-delegated listener
  const el = document.getElementById('branchTabs'); if (!el) return;
  el.innerHTML = TABS.map(t =>
    `<button class="branch-tab ${t===hs.tab?'active':''}" data-tab="${t}">${TAB_LABELS[t]||t}</button>`
  ).join('');
  el.onclick = e => {
    const btn = e.target.closest('.branch-tab');
    if (btn) switchTab(btn.dataset.tab);
  };
}

function switchTo(idx, immediate=false) {
  if (hs.transitioning && !immediate) return;
  if (!hs.list.length) return;
  hs.index = ((idx % hs.list.length) + hs.list.length) % hs.list.length;
  hs.transitioning = true;
  const card = document.getElementById('portraitCard');
  const panel = document.getElementById('statsPanel');
  card?.classList.add('fading'); panel?.classList.add('fading');
  setTimeout(() => {
    const entry = hs.list[hs.index]; if (!entry) return;
    renderPortrait(entry);
    renderStats(entry, 'statsPanel');
    const mob = document.getElementById('mobileStats');
    if (mob?.style.display !== 'none') renderStats(entry, 'mobileStats');
    renderDots();
    // Update active highlight in Peninsular grid
    document.querySelectorAll('#peninsularGrid .peninsular-card').forEach(c => {
      c.classList.toggle('active', c.dataset.id === entry.id);
    });
    card?.classList.remove('fading'); panel?.classList.remove('fading');
    hs.transitioning = false;
  }, 300);
}

function renderLegacyRoll(tab) {
  const el = document.getElementById('legacyRoll');
  if (!el) return;
  const legacy = hs.allWinners
    .filter(w => w.award === hs.award && branchMatchesTab(w.branch, tab) && w.year < HERO_CUTOFF_YEAR)
    .sort((a, b) => b.year - a.year);
  if (!legacy.length) { el.style.display = 'none'; return; }
  const branchLabel = TAB_LABELS[tab] || tab;
  el.style.display = 'block';
  el.innerHTML = `
    <div style="max-width:960px;margin:0 auto;padding:36px 16px 52px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
        <span style="display:inline-block;width:3px;height:16px;background:#3a3a3a;border-radius:1px;"></span>
        <h2 style="font-size:0.65rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin:0;">The Legacy Roll</h2>
        <span style="font-size:0.58rem;color:#383838;margin-left:auto;letter-spacing:0.06em;">${branchLabel} · ${HERO_CUTOFF_YEAR - 1} &amp; earlier</span>
      </div>
      <p style="font-size:0.68rem;color:#3a3a3a;margin:4px 0 18px;padding-left:13px;line-height:1.6;">Honouring every champion who came before the active decade.</p>
      <div style="border:1px solid #1e1e1e;overflow:hidden;">
        <div style="display:grid;grid-template-columns:60px 1fr 1fr 120px;background:#0e0e0e;padding:8px 16px;border-bottom:1px solid #1e1e1e;">
          <span style="font-size:0.52rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#3c3c3c;">Year</span>
          <span style="font-size:0.52rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#3c3c3c;">Champion</span>
          <span style="font-size:0.52rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#3c3c3c;">Origin</span>
          <span style="font-size:0.52rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#3c3c3c;">Tribe</span>
        </div>
        ${legacy.map((w, i) => `
          <div style="display:grid;grid-template-columns:60px 1fr 1fr 120px;padding:10px 16px;border-bottom:${i < legacy.length - 1 ? '1px solid #161616' : 'none'};transition:background 0.15s;" onmouseover="this.style.background='#0d0d0d'" onmouseout="this.style.background='transparent'">
            <span style="font-size:0.8rem;font-weight:800;color:#585858;font-variant-numeric:tabular-nums;">${w.year}</span>
            <span style="font-size:0.8rem;font-weight:600;color:#909090;">${w.name}</span>
            <span style="font-size:0.75rem;color:#585858;">${w.origin || w.district}</span>
            <span style="font-size:0.7rem;color:#484848;">${w.tribe}</span>
          </div>`).join('')}
      </div>
    </div>
  `;
}

function renderEmptyState(tab) {
  const card = document.getElementById('portraitCard');
  if (!card) return;
  const branchLabel = TAB_LABELS[tab] || tab;
  // Preserve all inner element IDs so renderPortrait() works after switching back to a data tab
  card.innerHTML = `
    <div id="portraitInner">
      <div id="portraitBg" style="background:linear-gradient(160deg,rgba(240,168,32,0.04) 0%,transparent 60%);position:absolute;inset:0;"></div>
      <div id="portraitPattern" style="position:absolute;inset:0;"></div>
      <div id="portraitAccentLine" style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(240,168,32,0.18),transparent);opacity:0.7;"></div>
      <div id="portraitGlyph" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-55%);font-size:clamp(7rem,28vw,11rem);font-weight:900;opacity:0.035;color:#f0a820;user-select:none;pointer-events:none;"></div>
      <div id="portraitAvatar"></div>
      <div id="portraitVignette" style="position:absolute;inset:0;background:radial-gradient(ellipse at center 80%,transparent 30%,rgba(6,6,6,0.7) 100%);pointer-events:none;"></div>
      <div id="portraitGradient" style="position:absolute;bottom:0;left:0;right:0;height:55%;background:linear-gradient(transparent,rgba(6,6,6,0.95));pointer-events:none;"></div>
      <div id="portraitNameWrap" style="position:absolute;bottom:0;left:0;right:0;padding:20px 18px 18px;">
        <div id="portraitAwardBadge"></div>
        <div id="portraitName"></div>
        <div id="portraitYear"></div>
      </div>
    </div>
    <div id="emptyStateOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:11px;padding:28px;text-align:center;pointer-events:none;">
      <div style="font-size:2.6rem;opacity:0.09;color:#f0a820;line-height:1;user-select:none;">✦</div>
      <div style="font-size:0.52rem;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;color:rgba(240,168,32,0.28);">KDCA ${branchLabel}</div>
      <div style="width:18px;height:1px;background:rgba(240,168,32,0.14);"></div>
      <div style="font-size:0.88rem;font-weight:700;color:rgba(255,255,255,0.16);line-height:1.55;letter-spacing:-0.01em;">Archive<br>in Progress</div>
      <div style="font-size:0.6rem;color:rgba(255,255,255,0.11);line-height:1.85;max-width:165px;letter-spacing:0.01em;">We are currently verifying historical data for this branch.</div>
    </div>`;
}

function switchTab(tab) {
  if (hs.transitioning) return; // block all clicks during animation
  if (hs.tab === tab) return;   // re-clicking the active tab — no-op

  hs.tab = tab;
  // Sync URL query param for shareable links
  const url = new URL(window.location);
  url.searchParams.set('tab', tab);
  window.history.replaceState({}, '', url);

  hs.list = hs.allWinners
    .filter(w => w.award===hs.award && branchMatchesTab(w.branch,tab) && (tab === 'Peninsular Malaysia' ? w.year === 2026 : w.year >= HERO_CUTOFF_YEAR))
    .sort((a,b) => b.year - a.year);
  hs.index = 0;

  // ── 1. Update tab highlight IMMEDIATELY ────────────────────────────────
  renderTabs();

  // ── 2. Fade out portrait + stats + legacy roll ─────────────────────────
  const card    = document.getElementById('portraitCard');
  const panel   = document.getElementById('statsPanel');
  const dotRow  = document.getElementById('dotRow');
  const legacyEl = document.getElementById('legacyRoll');
  const grid    = document.getElementById('sabahGrid');
  const wrap    = document.getElementById('carouselWrap');
  const backBtn = document.getElementById('gridBackBtn');
  hs.transitioning = true;
  if (grid) grid.classList.add('fading');
  card?.classList.add('fading');
  panel?.classList.add('fading');
  if (legacyEl) legacyEl.classList.add('fading');

  // ── 3. After 300ms: render new content and fade back in ─────────────────
  setTimeout(() => {
    const penGrid = document.getElementById('peninsularGrid');
    if (!hs.list.length) {
      // ─ Cinematic "Archive in Progress" placeholder ─
      renderEmptyState(tab);
      if (grid) grid.style.display = 'none';
      if (wrap) wrap.style.display = '';
      if (backBtn) backBtn.style.display = 'none';
      if (panel)  panel.innerHTML  = '';
      if (dotRow) dotRow.innerHTML = '';
      if (penGrid) penGrid.style.display = 'none';
    } else if (isSabahGridMode()) {
      // ─ Sabah: show district grid instead of carousel ─
      enterGrid();
      if (card) card.classList.remove('fading');
      if (penGrid) penGrid.style.display = 'none';
    } else {
      // ─ Standard: single-winner carousel ─
      if (grid) grid.style.display = 'none';
      if (wrap) wrap.style.display = '';
      if (backBtn) backBtn.style.display = 'none';
      // Show arrows + dots
      const prev = document.getElementById('prevBtn');
      const next = document.getElementById('nextBtn');
      if (prev) prev.style.display = '';
      if (next) next.style.display = '';
      if (dotRow) dotRow.style.display = '';
      const entry = hs.list[0];
      renderPortrait(entry);
      renderStats(entry, 'statsPanel');
      const mob = document.getElementById('mobileStats');
      if (mob?.style.display !== 'none') renderStats(entry, 'mobileStats');
      renderDots();
      // Peninsular Malaysia: show compact branch grid below portrait
      if (isPeninsularGridMode()) {
        showPeninsularGrid();
      } else if (penGrid) {
        penGrid.style.display = 'none';
      }
    }
    if (grid) grid.classList.remove('fading');
    card?.classList.remove('fading');
    panel?.classList.remove('fading');
    if (legacyEl) legacyEl.classList.remove('fading');
    hs.transitioning = false;

    // Re-run hero layout to honor new grid/carousel mode
    if (typeof window.__applyHeroLayout === 'function') window.__applyHeroLayout();

    // Legacy Roll updates after content is revealed
    renderLegacyRoll(tab);
  }, 300);
}

function initHeroSelector(data, award) {
  hs.allWinners = data.winners || [];
  hs.award = award;
  // Check URL query param for tab override
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  if (urlTab && TABS.includes(urlTab)) {
    hs.tab = urlTab;
  } else {
    // Pick first tab that has entries
    hs.tab = TABS.find(t => hs.allWinners.some(w=>w.award===award && branchMatchesTab(w.branch,t))) || 'Sabah (Central)';
  }
  hs.list = hs.allWinners
    .filter(w=>w.award===award && branchMatchesTab(w.branch,hs.tab) && (hs.tab === 'Peninsular Malaysia' ? w.year === 2026 : w.year >= HERO_CUTOFF_YEAR))
    .sort((a,b) => b.year - a.year);
  hs.index = 0;

  initBranchTabs(); // builds tabs + attaches one delegated listener
  // Check URL ?winner= param (set by homepage locator to select a specific person)
  const urlWinner = new URLSearchParams(window.location.search).get('winner');
  if (hs.list.length) {
    if (isSabahGridMode()) {
      enterGrid();
    } else {
      // If a specific winner was requested, find and select them; otherwise default to index 0
      const winnerIdx = urlWinner
        ? hs.list.findIndex(w => w.name === urlWinner)
        : -1;
      const startIdx = winnerIdx >= 0 ? winnerIdx : 0;
      hs.index = startIdx;
      switchTo(startIdx, true);
      if (isPeninsularGridMode()) showPeninsularGrid();
    }
  } else {
    renderEmptyState(hs.tab);
  }
  renderLegacyRoll(hs.tab);

  // Layout
  const heroMain=document.getElementById('heroMain');
  const statsPanel=document.getElementById('statsPanel');
  const mobileStats=document.getElementById('mobileStats');
  const portraitRegion=document.getElementById('portraitRegion');

  window.__applyHeroLayout = applyLayout;
  // Called by the map node click handler to jump to a specific winner by name within the current tab
  window.__navigateToPeninsularWinner = function(winnerName) {
    const idx = hs.list.findIndex(w => w.name === winnerName);
    if (idx >= 0) {
      hs.index = idx;
      switchTo(idx, true);
      renderPeninsularGrid(); // re-render grid to update active highlight
    }
  };
  function applyLayout() {
    const d = window.innerWidth >= 768;
    const heroContainer = document.getElementById('heroContainer');
    const penGrid = document.getElementById('peninsularGrid');
    const penGridVisible = penGrid && penGrid.style.display !== 'none';
    // Derive grid visibility from actual DOM (not just tab/data) so it stays correct
    // after the user clicks a Sabah card and enters carousel mode within the same tab.
    const sabahGridEl = document.getElementById('sabahGrid');
    const sabahGridActive = !!(sabahGridEl && sabahGridEl.style.display !== 'none');
    // Either grid view should let the page expand and scroll naturally
    const gridFlow = penGridVisible || sabahGridActive;
    if (heroContainer) {
      heroContainer.style.height   = (d && !gridFlow) ? 'calc(100vh - 52px)' : 'auto';
      heroContainer.style.overflow = (d && !gridFlow) ? 'hidden' : 'visible';
    }
    heroMain.style.flex          = d ? '1' : 'none';
    heroMain.style.flexDirection = d ? 'row' : 'column';
    heroMain.style.overflow      = d ? 'hidden' : 'visible';
    // Cap heroMain only for peninsular (carousel + tall stats panel) — Sabah grid hides stats so it doesn't need capping
    heroMain.style.maxHeight     = (d && penGridVisible) ? '560px' : '';
    // Hide stats panel in Sabah grid mode on desktop so the grid spans full width (matches mobile)
    statsPanel.style.display     = (d && !sabahGridActive) ? 'flex' : 'none';
    mobileStats.style.display    = d ? 'none' : 'block';
    portraitRegion.style.flex    = d ? '1' : 'none';
    portraitRegion.style.overflow= d ? 'hidden' : 'visible';
    // Use roomier padding for Sabah grid, normal padding for carousel
    portraitRegion.style.padding = d ? (sabahGridActive ? '20px 24px 32px' : '20px 48px') : '12px 20px 0';
    // Align portrait/grid to top (not centered) when a grid is visible
    portraitRegion.style.justifyContent = (d && gridFlow) ? 'flex-start' : 'center';
    if (!d && hs.list[hs.index] && !sabahGridActive) renderStats(hs.list[hs.index], 'mobileStats');
  }
  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Arrow navigation (only active in carousel mode, not grid mode)
  document.getElementById('prevBtn')?.addEventListener('click', ()=>{ if (!isSabahGridMode()) switchTo(hs.index-1); });
  document.getElementById('nextBtn')?.addEventListener('click', ()=>{ if (!isSabahGridMode()) switchTo(hs.index+1); });

  // Keyboard (skip in grid mode — allow Escape to go back to grid)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const backBtn = document.getElementById('gridBackBtn');
      if (backBtn && backBtn.style.display !== 'none') { enterGrid(); e.preventDefault(); }
      return;
    }
    if (isSabahGridMode()) return;
    if (e.key==='ArrowLeft')  switchTo(hs.index-1);
    if (e.key==='ArrowRight') switchTo(hs.index+1);
  });

  // Touch swipe (skip in grid mode)
  let tx=0;
  document.getElementById('portraitCard')?.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; },{passive:true});
  document.getElementById('portraitCard')?.addEventListener('touchend', e=>{
    if (isSabahGridMode()) return;
    const dx=e.changedTouches[0].clientX-tx;
    if (Math.abs(dx)>40) switchTo(dx<0?hs.index+1:hs.index-1);
  },{passive:true});

  // Back-to-grid button
  document.getElementById('gridBackBtn')?.addEventListener('click', enterGrid);
}

// ─── INDEX PAGE ───────────────────────────────────────────────────────────

async function initIndex(data) {
  // ── Stats counter ────────────────────────────────────────────────────────
  const un2026 = (data.winners || []).filter(w => w.year === 2026 && w.award === 'Unduk Ngadau');
  const contestantCount = un2026.length;
  const branchCount     = new Set(un2026.map(w => w.branch)).size;
  const districtCount   = new Set(un2026.map(w => w.district || w.branch)).size;
  animateCount('statContestants', contestantCount);
  animateCount('statStates', branchCount);
  animateCount('statDistricts', districtCount);

  // ── Date-based Featured picks ────────────────────────────────────────────
  const { featuredWinner, featuredSong } = pickFeatured(data);
  const allWinners = data.winners || [];

  // ── Bento Box 1: This Season's Sound ────────────────────────────────────
  if (featuredSong) {
    const titleEl = document.getElementById('bentoSongTitle');
    const metaEl  = document.getElementById('bentoSongMeta');
    const quoteEl = document.getElementById('bentoSongQuote');
    if (titleEl) titleEl.textContent = featuredSong.title;
    if (metaEl)  metaEl.textContent  = `${featuredSong.category} · ${featuredSong.artist} · ${featuredSong.meta}`;
    if (quoteEl) quoteEl.textContent = `"${featuredSong.quote}"`;
  }

  // ── Cinematic Hero — Legend of the Week ─────────────────────────────────
  // Skipped when unduk-locator hero is mounted (date-gated until 2026-06-01)
  const heroSection = document.getElementById('heroSection');
  if (heroSection?.dataset.hero === 'locator') {
    // locator hero already mounted — skip portrait rendering
  } else {
  const legend = featuredWinner;

  if (legend) {
    const ini = document.getElementById('heroInitials');
    const nameEl = document.getElementById('heroName');
    const subtitleEl = document.getElementById('heroSubtitle');
    const bioEl = document.getElementById('heroBioText');
    const ctaBtn = document.getElementById('heroCtaBtn');
    const badgeChip = document.getElementById('heroBadgeChip');
    const votesEl = document.getElementById('heroVotes');
    const yearBadge = document.getElementById('heroYearBadge');

    // If a portrait photo exists, show it; otherwise fall back to initials
    const avatarWrap = document.getElementById('heroAvatarWrap');
    if (avatarWrap && legend.imageUrl) {
      avatarWrap.innerHTML = '';
      const photoUrl = import.meta.env.BASE_URL.replace(/\/$/, '') + legend.imageUrl;
      // Use background-image so transparent PNG areas reveal the container's dark background.
      // Must also set backgroundColor so transparent pixels show dark, not transparent.
      avatarWrap.style.backgroundColor = '#0c0800';
      avatarWrap.style.backgroundImage = `url('${photoUrl}')`;
      avatarWrap.style.backgroundSize = 'cover';
      avatarWrap.style.backgroundPosition = 'top center';
      avatarWrap.style.backgroundRepeat = 'no-repeat';
      // Invisible img for onerror fallback only
      const probe = document.createElement('img');
      probe.src = photoUrl;
      probe.style.cssText = 'display:none;position:absolute;';
      probe.onerror = () => {
        avatarWrap.style.backgroundImage = '';
        avatarWrap.innerHTML = `<span id="heroInitials" style="font-size:3.8rem;font-weight:900;color:#f0a820;letter-spacing:-0.06em;line-height:1;">${initials(legend.name)}</span>`;
      };
      avatarWrap.appendChild(probe);
    } else if (ini) {
      ini.textContent = initials(legend.name);
    }
    if (nameEl) nameEl.textContent = legend.name;
    if (subtitleEl) subtitleEl.textContent = `${legend.award} · ${legend.origin} · ${legend.year}`;
    if (bioEl) bioEl.textContent = legend.bio.slice(0, 220) + '…';
    if (yearBadge) yearBadge.textContent = `${legend.year} Season`;
    if (votesEl) votesEl.textContent = `✦ ${legend.votes.toLocaleString()} community votes`;
    if (badgeChip && legend.badge) {
      badgeChip.style.display = 'inline-flex';
      badgeChip.textContent = `✦ ${legend.badge}`;
    }
    const awardSlug = import.meta.env.BASE_URL.replace(/\/$/, '') + '/winners.html';
    if (ctaBtn) {
      ctaBtn.href = awardSlug;
      ctaBtn.textContent = legend.award === 'MRK' ? 'Explore His Story →' : 'Explore Her Story →';
    }

    // ── Vote button — redirects to Live Arena ─────────────────────────────
    const voteBtn = document.getElementById('heroVoteBtn');
    if (votesEl) {
      votesEl.innerHTML = `✦ <span style="font-variant-numeric:tabular-nums;">${(legend.votes || 0).toLocaleString()}</span> community votes`;
    }
    if (voteBtn) {
      voteBtn.addEventListener('click', () => {
        window.location.href = import.meta.env.BASE_URL + 'live.html';
      });
    }

    // ── Share button ─────────────────────────────────────────────────────────
    const shareBtn   = document.getElementById('heroShareBtn');
    const shareLabel = document.getElementById('heroShareLabel');
    if (shareBtn) {
      shareBtn.style.display = 'inline-flex';

      const shareTitle = `${legend.name} · KDMR Media`;
      const shareText  = `Check out ${legend.name}, ${legend.award} ${legend.year} from ${legend.district}! Cast your community vote on KDMR Media.`;
      const shareUrl   = window.location.origin + (awardSlug.startsWith('/') ? awardSlug : '/' + awardSlug);

      shareBtn.addEventListener('click', async () => {
        // Web Share API — works natively on mobile (WhatsApp, Telegram, etc.)
        if (navigator.share) {
          try {
            await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          } catch (e) {
            // User cancelled share sheet — do nothing
          }
          return;
        }

        // Desktop fallback: copy link to clipboard + brief tooltip
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          // Last resort — prompt
          window.prompt('Copy this link:', shareUrl);
          return;
        }

        // Flash "Copied!" feedback
        shareBtn.classList.add('share-active');
        shareBtn.style.color        = '#4ade80';
        shareBtn.style.borderColor  = 'rgba(74,222,128,0.35)';
        shareBtn.style.background   = 'rgba(74,222,128,0.06)';
        if (shareLabel) shareLabel.textContent = 'Copied!';
        setTimeout(() => {
          shareBtn.classList.remove('share-active');
          shareBtn.style.color        = '#444';
          shareBtn.style.borderColor  = 'rgba(255,255,255,0.07)';
          shareBtn.style.background   = 'none';
          if (shareLabel) shareLabel.textContent = 'Share';
        }, 2000);
      });
    }
  }
  } // end else (locator not active — portrait hero was rendered above)

  // ── Bento Box 2: Winning Costume ────────────────────────────────────────
  const costume2026 = [...allWinners].filter(w => w.year === 2026 && w.award === 'Unduk Ngadau')
    .sort((a, b) => b.votes - a.votes)[0];
  if (costume2026) {
    const nameEl = document.getElementById('bentoCostumeName');
    const descEl = document.getElementById('bentoCostumeDesc');
    const ctaEl  = document.getElementById('bentoCostumeCta');
    if (nameEl) nameEl.textContent = `${costume2026.name} — ${costume2026.origin}`;
    if (descEl) descEl.textContent = costume2026.heritage?.costume || '—';
    if (ctaEl)  ctaEl.href = '/unduk-ngadau/';
  }

  // ── Bento Box 3: Countdown + Schedule Drawer ────────────────────────────
  const countdownEl = document.getElementById('countdownNum');
  if (countdownEl) {
    const target = new Date('2026-05-30T00:00:00+08:00');
    const now = new Date();
    const diffMs = target - now;
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    countdownEl.textContent = diffDays > 0 ? diffDays : '🎉';
    if (diffDays === 0) {
      countdownEl.style.fontSize = '2rem';
      countdownEl.textContent = 'Today!';
    }
  }

  // Schedule events May 20–31 2026
  const SCHEDULE = [
    { date:'2026-05-20', day:'Wed · 20 May', title:'District Preliminaries Close',       desc:'All KDCA branches — final deadline for contest entries',                          type:'deadline'  },
    { date:'2026-05-22', day:'Fri · 22 May', title:'Branch Winners Announced',            desc:'Official results published by all KDCA district branches',                       type:'announce'  },
    { date:'2026-05-24', day:'Sun · 24 May', title:'State-Level Arrival & Registration',  desc:'Unduk Ngadau, MRK & Sugandoi state contestants arrive · Penampang',              type:'event'     },
    { date:'2026-05-25', day:'Mon · 25 May', title:'Open Rehearsal',                      desc:'MRK & Sugandoi open rehearsal · KDCA Hall · Public welcome',                     type:'event'     },
    { date:'2026-05-26', day:'Tue · 26 May', title:'Cultural Night & Costume Showcase',   desc:'Traditional attire parade · Public gallery open from 7:00 PM',                  type:'event'     },
    { date:'2026-05-27', day:'Wed · 27 May', title:'Sugandoi Semi-Finals',                desc:'Vocal competition semi-finals · KDCA Auditorium · 8:00 PM',                      type:'final'     },
    { date:'2026-05-28', day:'Thu · 28 May', title:'MRK State Final',                     desc:'Raja Kaamatan crowning night · KDCA Hall · 8:00 PM',                             type:'final'     },
    { date:'2026-05-29', day:'Fri · 29 May', title:'Cultural Address & Sumazau',          desc:'Traditional dance showcase & cultural address — Unduk Ngadau contestants',       type:'event'     },
    { date:'2026-05-30', day:'Sat · 30 May', title:'Hari Kaamatan — Day 1  ✦',           desc:'Unduk Ngadau & Sugandoi State Finals · Live broadcast · KDCA Complex',           type:'highlight' },
    { date:'2026-05-31', day:'Sun · 31 May', title:'Hari Kaamatan — Day 2  ✦',           desc:'Coronation Ceremony · Grand Closing · Cultural Performances · All day',          type:'highlight' },
  ];

  const TYPE_STYLE = {
    deadline:  { dot:'#f0a820', label:'Deadline',      labelColor:'rgba(240,168,32,0.18)',  textColor:'#f0a820' },
    announce:  { dot:'#60a5fa', label:'Announcement',  labelColor:'rgba(96,165,250,0.14)',  textColor:'#60a5fa' },
    event:     { dot:'#818cf8', label:'Event',         labelColor:'rgba(129,140,248,0.12)', textColor:'#818cf8' },
    final:     { dot:'#4ade80', label:'Final',         labelColor:'rgba(74,222,128,0.12)',  textColor:'#4ade80' },
    highlight: { dot:'#f0a820', label:'Main Event',    labelColor:'rgba(240,168,32,0.22)',  textColor:'#f0a820' },
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const rowsEl   = document.getElementById('scheduleRows');
  if (rowsEl) {
    rowsEl.innerHTML = SCHEDULE.map(ev => {
      const s       = TYPE_STYLE[ev.type] || TYPE_STYLE.event;
      const isPast  = ev.date < todayStr;
      const isToday = ev.date === todayStr;
      const rowBg   = isToday ? 'background:rgba(129,140,248,0.06);' : '';
      const opacity = isPast  ? 'opacity:0.4;' : '';
      const todayPill = isToday
        ? `<span style="margin-left:8px;font-size:0.5rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:rgba(129,140,248,0.2);color:#818cf8;padding:2px 7px;border-radius:2px;">TODAY</span>`
        : '';
      return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:11px 20px;border-bottom:1px solid #080818;${rowBg}${opacity}transition:background 0.15s;" onmouseover="if('${isPast}'!=='true')this.style.background='rgba(129,140,248,0.04)'" onmouseout="this.style.background='${isToday ? 'rgba(129,140,248,0.06)' : ''}'">
          <div style="flex-shrink:0;padding-top:3px;">
            <div style="width:7px;height:7px;border-radius:50%;background:${s.dot};${isToday ? 'box-shadow:0 0 6px 2px ' + s.dot + '55;' : ''}"></div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.58rem;color:#3a3a6a;letter-spacing:0.06em;margin-bottom:3px;">${ev.day}${todayPill}</div>
            <div style="font-size:0.78rem;font-weight:700;color:${isPast ? '#404050' : '#d0d0d8'};line-height:1.25;margin-bottom:3px;">${ev.title}</div>
            <div style="font-size:0.62rem;color:${isPast ? '#252535' : '#2a2a48'};line-height:1.55;">${ev.desc}</div>
          </div>
          <div style="flex-shrink:0;">
            <span style="font-size:0.5rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:${s.labelColor};color:${s.textColor};padding:3px 8px;border-radius:2px;">${s.label}</span>
          </div>
        </div>`;
    }).join('');
  }

  // Toggle open/close
  const countdownBox  = document.getElementById('countdownBox');
  const schedDrawer   = document.getElementById('scheduleDrawer');
  const toggleIcon    = document.getElementById('schedToggleIcon');
  if (countdownBox && schedDrawer) {
    countdownBox.addEventListener('click', () => {
      const isOpen = countdownBox.classList.toggle('sched-open');
      if (isOpen) {
        schedDrawer.style.maxHeight  = schedDrawer.scrollHeight + 'px';
        schedDrawer.style.opacity    = '1';
        schedDrawer.style.marginTop  = '0';
        countdownBox.style.borderColor = 'rgba(129,140,248,0.45)';
        countdownBox.style.boxShadow   = '0 0 22px 4px rgba(129,140,248,0.10)';
        if (toggleIcon) { toggleIcon.textContent = 'Hide Schedule ↑'; toggleIcon.style.color = '#818cf8'; }
      } else {
        schedDrawer.style.maxHeight = '0';
        schedDrawer.style.opacity   = '0';
        countdownBox.style.borderColor = '#08082a';
        countdownBox.style.boxShadow   = '';
        if (toggleIcon) { toggleIcon.textContent = 'View Schedule ↓'; toggleIcon.style.color = '#3a3a6a'; }
      }
    });
  }

  // ── News Marquee Ticker ──────────────────────────────────────────────────
  const tickerTrack = document.getElementById('tickerTrack');
  if (tickerTrack && data.news.length) {
    const items = data.news.map(n => `${n.category.toUpperCase()}: ${n.headline}`);
    // Duplicate items so the seamless loop works (CSS animates -50%)
    const all = [...items, ...items];
    tickerTrack.innerHTML = all.map(text =>
      `<span class="ticker-item">${text}</span><span class="ticker-sep">◆</span>`
    ).join('');
  }

  // ── News Feed ─────────────────────────────────────────────────────────────
  const feedEl = document.getElementById('newsFeed');
  if (feedEl) {
    feedEl.innerHTML = data.news.map(item => `
      <article class="reveal" style="background:#111;border:1px solid #1a1a1a;padding:18px 20px;display:flex;flex-direction:column;gap:10px;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1a1a1a'">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.58rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#f0a820;background:rgba(240,168,32,0.07);padding:2px 8px;border-radius:2px;">${item.category}</span>
          <span style="font-size:0.68rem;color:#333;">${formatDate(item.date)}</span>
          <span style="font-size:0.68rem;color:#2a2a2a;">· ${item.source}</span>
        </div>
        <h3 style="font-size:0.92rem;font-weight:700;color:#f0f0f0;line-height:1.45;margin:0;letter-spacing:-0.01em;">${item.headline}</h3>
        <p style="font-size:0.78rem;color:#444;line-height:1.7;margin:0;">${item.summary}</p>
      </article>
    `).join('');
  }

  // ── Scroll reveal via IntersectionObserver ───────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  initGlobalSearch(data);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

(async function init() {
  try {
    const data = await loadData();
    const path = window.location.pathname;
    if      (path.includes('unduk-ngadau')) initHeroSelector(data, 'Unduk Ngadau');
    else if (path.includes('mrk'))          initHeroSelector(data, 'MRK');
    else if (path.includes('sugandoi'))     initHeroSelector(data, 'Sugandoi');
    else if (!path.includes('winners'))     await initIndex(data);
    initNewsletter();
  } catch(err) { console.error('KDMR Media:', err); }
})();
