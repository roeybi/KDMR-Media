/**
 * KDMR Media — script.js
 * Pages: / (index), /unduk-ngadau/, /mrk/, /sugandoi/, /winners.html, /directory.html
 */

const DATA_URL = import.meta.env.BASE_URL + 'data.json';
const VOTES_KEY = 'kdmr_votes';
let _data = null;

// ════════════════════════════════════════════════════════════════════════
// ─── API INTEGRATIONS ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// Placeholder configuration. Replace the placeholder strings with your real
// Supabase project + Make.com webhook URLs, then flip ENABLED to `true`.
// While ENABLED is false, all submissions are mocked locally (console only)
// so the UI can be tested end-to-end without external dependencies.

const API_CONFIG = {
  // Supabase (REST/Realtime)
  SUPABASE_URL:       'https://<YOUR-PROJECT>.supabase.co',
  SUPABASE_ANON_KEY:  '<YOUR-SUPABASE-ANON-KEY>',

  // Make.com webhook scenarios
  WEBHOOK_VOTES:      'https://hook.eu2.make.com/<YOUR-VOTE-WEBHOOK-ID>',
  WEBHOOK_NEWSLETTER: 'https://hook.eu2.make.com/<YOUR-NEWSLETTER-WEBHOOK-ID>',

  // Master switch — keep false until real endpoints are wired up.
  ENABLED: false,
};

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
  if (p.includes('directory'))    return 'Directory';
  if (p.includes('winners'))      return 'Winners';
  return 'General';
}

/**
 * Submit a vote to the cloud (Make.com webhook → Supabase row).
 * Falls back to a mock when API_CONFIG.ENABLED is false.
 */
async function submitVoteToCloud(entryId, meta = {}) {
  const payload = {
    type: 'vote',
    entryId,
    interestTag: getInterestTagFromPath(),
    page: window.location.pathname,
    ts: new Date().toISOString(),
    ...meta,
  };
  // Analytics — fire regardless of ENABLED flag so GTM/GA sees every vote.
  window.dataLayer.push({
    event:       'kdmr_vote',
    category:    'engagement',
    interestTag: payload.interestTag,
    entryId:     payload.entryId,
    page:        payload.page,
  });

  if (!API_CONFIG.ENABLED) {
    console.info('[KDMR][mock vote]', payload);
    return { ok: true, mock: true };
  }
  try {
    const res = await fetch(API_CONFIG.WEBHOOK_VOTES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok };
  } catch (err) {
    console.error('[KDMR] Vote submission failed:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Submit a newsletter signup. Auto-tags the subscriber based on the page
 * they submitted from (e.g. "Interest: UN", "Interest: MRK").
 */
async function submitNewsletter(email, meta = {}) {
  const tag = getInterestTagFromPath();

  // ── Meta CAPI preparation ─────────────────────────────────────────
  // Hash the email with SHA-256 before it leaves the browser.
  // Pass `hashedEmail` to your CAPI-compliant webhook endpoint.
  // Never send plaintext PII to third-party pixels directly.
  const hashedEmail = await sha256(email);

  const payload = {
    type: 'newsletter',
    email,
    hashedEmail,          // SHA-256 normalised — ready for Meta CAPI
    interestTag: tag,
    interestLabel: `Interest: ${tag}`,
    page: window.location.pathname,
    referrer: document.referrer || null,
    ts: new Date().toISOString(),
    ...meta,
  };

  // Analytics — fire before the async network call so GTM receives it even
  // if the webhook times out. Send only hashed PII to the dataLayer.
  window.dataLayer.push({
    event:        'kdmr_lead',
    category:     'newsletter',
    interestTag:  tag,
    interestLabel: payload.interestLabel,
    page:         payload.page,
    em:           hashedEmail,   // hashed — safe for GTM → Meta CAPI bridge
  });

  if (!API_CONFIG.ENABLED) {
    console.info('[KDMR][mock newsletter]', payload);
    return { ok: true, mock: true };
  }
  try {
    const res = await fetch(API_CONFIG.WEBHOOK_NEWSLETTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok };
  } catch (err) {
    console.error('[KDMR] Newsletter submission failed:', err);
    return { ok: false, error: err.message };
  }
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
const BIZ_CAT_COLORS = {
  'Food & Beverage':       { bg:'rgba(251,191,36,0.1)',  text:'#fbbf24' },
  'Arts & Crafts':         { bg:'rgba(236,72,153,0.1)',  text:'#f472b6' },
  'Tourism & Hospitality': { bg:'rgba(59,130,246,0.1)',  text:'#60a5fa' },
  'Health & Wellness':     { bg:'rgba(34,197,94,0.1)',   text:'#4ade80' },
  'Agriculture':           { bg:'rgba(74,222,128,0.1)',  text:'#34d399' },
  'Education':             { bg:'rgba(168,85,247,0.1)',  text:'#c084fc' },
};
function catCol(cat, map = CAT_COLORS) { return map[cat] || { bg:'rgba(240,168,32,0.08)', text:'#f0a820' }; }

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
    const bizMatches = data.businesses.filter(b =>
      b.name.toLowerCase().includes(q)||b.description.toLowerCase().includes(q)||b.location.toLowerCase().includes(q)||b.tags.some(t=>t.toLowerCase().includes(q))
    ).slice(0,4);
    const newsMatches = data.news.filter(n => n.headline.toLowerCase().includes(q)||n.summary.toLowerCase().includes(q)).slice(0,3);
    if (!hofMatches.length && !bizMatches.length && !newsMatches.length) {
      resultsEl.innerHTML = `<div style="padding:32px;text-align:center;color:#444;font-size:0.8rem;">No results for "<strong style="color:#888;">${q}</strong>"</div>`;
      return;
    }
    let html = '';
    if (hofMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;">Hall of Fame</div>`;
      html += hofMatches.map(p=>`<a href="/winners.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"><div style="width:34px;height:34px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${initials(p.name)}</div><div><div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${p.name}</div><div style="font-size:0.72rem;color:#555;">${p.tribe} · ${p.category}</div></div></a>`).join('');
    }
    if (bizMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;border-top:${hofMatches.length?'1px solid #1e1e1e':'none'};">Businesses</div>`;
      html += bizMatches.map(b=>`<a href="/directory.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'"><div style="width:34px;height:34px;border-radius:2px;background:#1e1e1e;border:1px solid #2a2a2a;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#f0a820;flex-shrink:0;">${initials(b.name)}</div><div><div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${b.name}</div><div style="font-size:0.72rem;color:#555;">${b.location} · ${b.category}</div></div></a>`).join('');
    }
    if (newsMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-top:1px solid #1e1e1e;border-bottom:1px solid #1e1e1e;">News</div>`;
      html += newsMatches.map(n=>`<div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;"><div style="font-size:0.62rem;font-weight:600;color:#f0a820;margin-bottom:4px;">${n.category.toUpperCase()} · ${formatDate(n.date)}</div><div style="font-size:0.82rem;font-weight:500;color:#f0f0f0;line-height:1.4;">${n.headline}</div></div>`).join('');
    }
    resultsEl.innerHTML = html;
  });
}

// ─── HERO SELECTOR ────────────────────────────────────────────────────────

// Tabs: Sabah | Klang Valley | Putrajaya | Other
const TABS = ['Sabah', 'Klang Valley', 'Putrajaya', 'Other'];
const PRIMARY_BRANCHES = ['KDCA Sabah', 'KDCA Klang Valley', 'KDCA Putrajaya'];

function branchMatchesTab(branch, tab) {
  if (tab === 'Sabah')         return branch === 'KDCA Sabah';
  if (tab === 'Klang Valley')  return branch === 'KDCA Klang Valley';
  if (tab === 'Putrajaya')     return branch === 'KDCA Putrajaya';
  if (tab === 'Other')         return !PRIMARY_BRANCHES.includes(branch);
  return false;
}

let hs = { allWinners:[], award:'', tab:'Sabah', list:[], index:0, transitioning:false };

function renderPortrait(entry) {
  const acc = entry.accentColor || '#f0a820';
  const hex = acc.replace('#','');
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  document.getElementById('portraitBg').style.background =
    `linear-gradient(160deg, rgba(${r},${g},${b},0.2) 0%, rgba(${r},${g},${b},0.07) 30%, #060606 70%)`;
  document.getElementById('portraitGlyph').textContent = initials(entry.name)[0] || '?';
  document.getElementById('portraitGlyph').style.color = `rgba(${r},${g},${b},0.07)`;
  document.getElementById('portraitAvatar').textContent = initials(entry.name);
  document.getElementById('portraitAvatar').style.background = acc;
  document.getElementById('portraitAwardBadge').textContent = `${entry.award}  ${entry.year}`;
  document.getElementById('portraitAwardBadge').style.background = acc;
  document.getElementById('portraitName').textContent = entry.name;
  document.getElementById('portraitYear').textContent = `${entry.branch}  ·  ${entry.tribe}`;
  document.getElementById('ambientBg').style.background =
    `radial-gradient(ellipse 70% 60% at 50% 55%, rgba(${r},${g},${b},0.1) 0%, transparent 70%)`;
  document.documentElement.style.setProperty('--hero-accent', acc);
  // Top accent line on portrait
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
      <button id="${btnId}" class="vote-hero-btn ${voted?'voted':''}" data-id="${entry.id}">
        ↑ ${voted ? `Voted · ${entry.votes}` : `Upvote · ${entry.votes}`}
      </button>
    </div>
  `;
  document.getElementById(btnId)?.addEventListener('click', async function() {
    const id = this.dataset.id; const w = hs.allWinners.find(x=>x.id===id); if (!w) return;
    if (!castVote(id)) return;
    w.votes++;
    this.textContent = `✦ Voted · ${w.votes}`;
    this.classList.add('voted');
    const result = await submitVoteToCloud(id, { name: w.name, award: w.award, branch: w.branch });
    showToast(result.ok ? 'Vote Recorded!' : 'Vote saved locally', result.ok ? 'success' : 'info');
  });
}

function renderDots() {
  const row = document.getElementById('dotRow'); if (!row) return;
  row.innerHTML = hs.list.map((_,i)=>`<div class="dot ${i===hs.index?'active':''}" data-i="${i}"></div>`).join('');
  row.querySelectorAll('.dot').forEach(d => d.addEventListener('click', ()=>switchTo(parseInt(d.dataset.i))));
}

function renderTabs() {
  const el = document.getElementById('branchTabs'); if (!el) return;
  // Only show tabs that have entries
  const activeTabs = TABS.filter(t => hs.allWinners.filter(w=>w.award===hs.award && branchMatchesTab(w.branch,t)).length > 0);
  el.innerHTML = activeTabs.map(t =>
    `<button class="branch-tab ${t===hs.tab?'active':''}" data-tab="${t}">${t}</button>`
  ).join('');
  el.querySelectorAll('.branch-tab').forEach(btn => btn.addEventListener('click', ()=>switchTab(btn.dataset.tab)));
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
    card?.classList.remove('fading'); panel?.classList.remove('fading');
    hs.transitioning = false;
  }, 300);
}

function switchTab(tab) {
  hs.tab = tab;
  hs.list = hs.allWinners.filter(w => w.award===hs.award && branchMatchesTab(w.branch,tab));
  hs.index = 0;
  renderTabs();
  if (!hs.list.length) {
    // Show empty state
    const card = document.getElementById('portraitCard');
    if (card) card.innerHTML = `<div style="padding-top:150%;position:relative;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;"><div style="font-size:2rem;opacity:0.2;">✦</div><div style="font-size:0.78rem;color:#444;text-align:center;">No entries for ${tab}<br>yet</div></div></div>`;
    document.getElementById('statsPanel').innerHTML = '';
    document.getElementById('dotRow').innerHTML = '';
    return;
  }
  switchTo(0, true);
}

function initHeroSelector(data, award) {
  hs.allWinners = data.winners || [];
  hs.award = award;
  // Pick first tab that has entries
  hs.tab = TABS.find(t => hs.allWinners.some(w=>w.award===award && branchMatchesTab(w.branch,t))) || 'Sabah';
  hs.list = hs.allWinners.filter(w=>w.award===award && branchMatchesTab(w.branch,hs.tab));
  hs.index = 0;

  renderTabs();
  if (hs.list.length) switchTo(0, true);

  // Layout
  const heroMain=document.getElementById('heroMain');
  const statsPanel=document.getElementById('statsPanel');
  const mobileStats=document.getElementById('mobileStats');
  const portraitRegion=document.getElementById('portraitRegion');

  function applyLayout() {
    const d = window.innerWidth >= 768;
    heroMain.style.flexDirection = d ? 'row' : 'column';
    statsPanel.style.display = d ? 'flex' : 'none';
    mobileStats.style.display = d ? 'none' : 'block';
    portraitRegion.style.padding = d ? '20px 48px' : '12px 48px 0';
    if (!d && hs.list[hs.index]) renderStats(hs.list[hs.index], 'mobileStats');
  }
  applyLayout();
  window.addEventListener('resize', applyLayout);

  // Arrow navigation
  document.getElementById('prevBtn')?.addEventListener('click', ()=>switchTo(hs.index-1));
  document.getElementById('nextBtn')?.addEventListener('click', ()=>switchTo(hs.index+1));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key==='ArrowLeft')  switchTo(hs.index-1);
    if (e.key==='ArrowRight') switchTo(hs.index+1);
  });

  // Touch swipe
  let tx=0;
  document.getElementById('portraitCard')?.addEventListener('touchstart', e=>{ tx=e.touches[0].clientX; },{passive:true});
  document.getElementById('portraitCard')?.addEventListener('touchend', e=>{
    const dx=e.changedTouches[0].clientX-tx;
    if (Math.abs(dx)>40) switchTo(dx<0?hs.index+1:hs.index-1);
  },{passive:true});
}

// ─── INDEX PAGE ───────────────────────────────────────────────────────────

async function initIndex(data) {
  animateCount('statHof', data.stats.hofEntries);
  animateCount('statBiz', data.stats.businesses);
  animateCount('statTribes', data.stats.tribesRepresented);
  animateCount('statDistricts', data.stats.districtsRepresented);

  buildTicker('breakingTicker', data.news.map(n=>n.headline));
  buildTicker('newsTicker', data.news.map(n=>`${n.category.toUpperCase()}: ${n.headline} (${n.source})`));

  const feedEl=document.getElementById('newsFeed');
  if (feedEl) {
    feedEl.innerHTML=data.news.map(item=>`
      <article data-fade style="background:#111;border:1px solid #1e1e1e;padding:16px;display:flex;flex-direction:column;gap:8px;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f0a820;">${item.category}</span>
          <span style="color:#252525;">·</span><span style="font-size:0.72rem;color:#444;">${formatDate(item.date)}</span>
          <span style="color:#252525;">·</span><span style="font-size:0.72rem;color:#333;">${item.source}</span>
        </div>
        <h3 style="font-size:0.95rem;font-weight:700;color:#f0f0f0;line-height:1.4;margin:0;letter-spacing:-0.01em;">${item.headline}</h3>
        <p style="font-size:0.8rem;color:#555;line-height:1.65;margin:0;">${item.summary}</p>
      </article>
    `).join(''); fadein(feedEl);
  }

  const topEl=document.getElementById('topVoted');
  if (topEl) {
    const sorted=[...data.hallOfFame].sort((a,b)=>b.votes-a.votes).slice(0,5);
    topEl.innerHTML=sorted.map((p,i)=>`
      <div data-fade style="display:flex;align-items:center;gap:10px;padding:10px;background:#111;border:1px solid #1e1e1e;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <span style="font-size:0.75rem;font-weight:800;color:#333;width:16px;text-align:center;flex-shrink:0;">${i+1}</span>
        <div style="width:32px;height:32px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${initials(p.name)}</div>
        <div style="min-width:0;flex:1;"><div style="font-size:0.82rem;font-weight:600;color:#f0f0f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div><div style="font-size:0.7rem;color:#444;">${p.tribe} · ${p.category}</div></div>
        <span style="font-size:0.72rem;font-weight:700;color:#f0a820;flex-shrink:0;">${p.votes}</span>
      </div>
    `).join(''); fadein(topEl);
  }

  const bizEl=document.getElementById('featuredBusiness');
  if (bizEl) {
    const featured=data.businesses.filter(b=>b.featured);
    const biz=featured[Math.floor(Math.random()*featured.length)];
    if (biz) {
      const col=catCol(biz.category,BIZ_CAT_COLORS);
      bizEl.innerHTML=`<div data-fade style="background:#111;border:1px solid #1e1e1e;border-left:2px solid #f0a820;padding:16px;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;"><div><span style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;color:${col.text};text-transform:uppercase;">${biz.category}</span><h3 style="font-size:1rem;font-weight:800;color:#f0f0f0;margin:4px 0 0;letter-spacing:-0.01em;">${biz.name}</h3></div>${biz.verified?'<span style="font-size:0.6rem;font-weight:700;padding:2px 8px;background:#1a3a26;color:#4ade80;border-radius:2px;letter-spacing:0.08em;flex-shrink:0;">✓ VERIFIED</span>':''}</div><p style="font-size:0.72rem;color:#444;margin:0 0 8px;">📍 ${biz.location}</p><p style="font-size:0.8rem;color:#666;line-height:1.6;margin:0;">${biz.description.slice(0,140)}…</p><a href="/directory.html" style="display:inline-block;margin-top:14px;font-size:0.72rem;font-weight:600;color:#f0a820;text-decoration:none;">View in directory →</a></div>`;
      fadein(bizEl);
    }
  }

  const hofEl=document.getElementById('hofPreview');
  if (hofEl) {
    const preview=[...data.hallOfFame].sort((a,b)=>b.votes-a.votes).slice(0,3);
    hofEl.innerHTML=preview.map(p=>{const col=catCol(p.category);return`<article data-fade style="background:#111;border:1px solid #1e1e1e;padding:14px 16px;display:flex;align-items:flex-start;gap:14px;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'"><div style="width:44px;height:44px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;font-weight:800;color:#0a0a0a;">${initials(p.name)}</div><div style="flex:1;min-width:0;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;"><div><h3 style="font-size:0.9rem;font-weight:700;color:#f0f0f0;margin:0 0 2px;letter-spacing:-0.01em;">${p.name}</h3><span style="font-size:0.68rem;color:#444;">${p.tribe} · ${p.district}</span></div><span style="font-size:0.6rem;font-weight:700;padding:3px 8px;border-radius:2px;flex-shrink:0;background:${col.bg};color:${col.text};white-space:nowrap;">${p.category}</span></div><p style="font-size:0.78rem;color:#555;margin:6px 0 10px;line-height:1.6;">${p.bio.slice(0,120)}…</p><div style="font-size:0.7rem;color:#f0a820;font-weight:600;">${hasVoted(p.id)?`✦ ${p.votes} votes`:`↑ ${p.votes} votes`}</div></div></article>`;}).join('');
    fadein(hofEl);
  }

  initGlobalSearch(data);
}

// ─── DIRECTORY PAGE ───────────────────────────────────────────────────────

async function initDirectory(data) {
  let currentCat='all', currentSort='featured', searchQuery='';
  const urlParams=new URLSearchParams(window.location.search);
  const urlCat=urlParams.get('category');
  if (urlCat) { currentCat=urlCat; document.querySelectorAll('.biz-filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.cat===urlCat)); }

  function render() {
    let list=[...data.businesses];
    if (currentCat!=='all') list=list.filter(b=>b.category===currentCat);
    if (searchQuery) { const q=searchQuery.toLowerCase(); list=list.filter(b=>b.name.toLowerCase().includes(q)||b.description.toLowerCase().includes(q)||b.location.toLowerCase().includes(q)||b.owner.toLowerCase().includes(q)||b.tags.some(t=>t.toLowerCase().includes(q))); }
    if (currentSort==='featured') list.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));
    else if (currentSort==='nameAsc') list.sort((a,b)=>a.name.localeCompare(b.name));
    else if (currentSort==='newest') list.sort((a,b)=>b.founded-a.founded);
    else if (currentSort==='oldest') list.sort((a,b)=>a.founded-b.founded);
    const grid=document.getElementById('bizGrid'), empty=document.getElementById('bizEmpty'), count=document.getElementById('bizResultsCount');
    if (count) count.textContent=`${list.length} business${list.length===1?'':'es'} found`;
    if (!list.length) { grid.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    grid.innerHTML=list.map(b=>{const col=catCol(b.category,BIZ_CAT_COLORS);return`<article class="biz-card" data-id="${b.id}" data-fade style="background:#111;border:1px solid #1e1e1e;${b.featured?'border-left:2px solid #f0a820;':''}padding:14px 16px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='${b.featured?'#f0a820':'#1e1e1e'}'"><div style="width:44px;height:44px;border-radius:2px;background:#1a1a1a;border:1px solid #252525;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#f0a820;flex-shrink:0;">${initials(b.name)}</div><div style="flex:1;min-width:0;"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:2px;"><div style="min-width:0;"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px;">${b.featured?'<span style="font-size:0.58rem;font-weight:700;color:#f0a820;letter-spacing:0.08em;">★ FEATURED</span>':''}<span style="font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${b.category}</span>${b.verified?'<span style="font-size:0.58rem;font-weight:700;padding:2px 7px;background:#1a3a26;color:#4ade80;border-radius:2px;letter-spacing:0.06em;">✓ VERIFIED</span>':''}</div><h3 style="font-size:0.9rem;font-weight:700;color:#f0f0f0;margin:0;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.name}</h3></div><span style="font-size:0.68rem;color:#333;flex-shrink:0;white-space:nowrap;">Est. ${b.founded}</span></div><p style="font-size:0.7rem;color:#444;margin:4px 0 6px;">📍 ${b.location}</p><p style="font-size:0.78rem;color:#555;margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${b.description}</p></div></article>`;}).join('');
    attachBizListeners(data.businesses); fadein(grid);
  }

  document.querySelectorAll('.biz-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{ currentCat=btn.dataset.cat; document.querySelectorAll('.biz-filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===currentCat)); render(); }));
  document.getElementById('bizSearch')?.addEventListener('input',e=>{ searchQuery=e.target.value.trim(); render(); });
  document.getElementById('bizSort')?.addEventListener('change',e=>{ currentSort=e.target.value; render(); });
  render(); initBizModal(data.businesses);
}

function attachBizListeners(allBiz) {
  document.querySelectorAll('.biz-card').forEach(card=>card.addEventListener('click',()=>{ const b=allBiz.find(x=>x.id===card.dataset.id); if(b) openBizModal(b); }));
}
function initBizModal(allBiz) {
  const modal=document.getElementById('bizModal'); if (!modal) return;
  document.getElementById('bizModalClose')?.addEventListener('click',closeBizModal);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeBizModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeBizModal(); });
}
function openBizModal(biz) {
  const modal=document.getElementById('bizModal');
  const col=catCol(biz.category,BIZ_CAT_COLORS);
  document.getElementById('bizModalCategory').textContent=`${biz.category} · ${biz.subcategory}`;
  document.getElementById('bizModalName').textContent=biz.name;
  document.getElementById('bizModalMeta').textContent=`${biz.tribe}-owned · Est. ${biz.founded} · ${biz.owner}`;
  document.getElementById('bizModalDesc').textContent=biz.description;
  document.getElementById('bizModalVerified').style.display=biz.verified?'inline-block':'none';
  function contact(wrapId,linkId,href,text){ const w=document.getElementById(wrapId); if(!w)return; if(text){w.style.display='flex';const l=document.getElementById(linkId);if(l){l.href=href;l.textContent=text;}}else w.style.display='none'; }
  contact('bizModalPhone','bizModalPhoneLink',`tel:${(biz.phone||'').replace(/\s/g,'')}`,biz.phone);
  contact('bizModalEmail','bizModalEmailLink',`mailto:${biz.email||''}`,biz.email);
  const loc=document.getElementById('bizModalLocation'); if(loc){loc.style.display=biz.location?'flex':'none';const t=document.getElementById('bizModalLocationText');if(t)t.textContent=biz.location;}
  const hrs=document.getElementById('bizModalHours'); if(hrs){hrs.style.display=biz.hours?'flex':'none';const t=document.getElementById('bizModalHoursText');if(t)t.textContent=biz.hours;}
  document.getElementById('bizModalTags').innerHTML=biz.tags.map(t=>`<span style="font-size:0.62rem;font-weight:600;padding:3px 8px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${t}</span>`).join('');
  const webW=document.getElementById('bizModalWebsiteWrap'),webL=document.getElementById('bizModalWebsite');
  if(biz.website){webW.style.display='block';webL.href=`https://${biz.website}`;}else webW.style.display='none';
  modal.style.display='flex'; document.body.style.overflow='hidden';
}
function closeBizModal() { const m=document.getElementById('bizModal'); if(m){m.style.display='none';document.body.style.overflow='';} }

// ─── Bootstrap ────────────────────────────────────────────────────────────

(async function init() {
  try {
    const data = await loadData();
    const path = window.location.pathname;
    if      (path.includes('unduk-ngadau')) initHeroSelector(data, 'Unduk Ngadau');
    else if (path.includes('mrk'))          initHeroSelector(data, 'MRK');
    else if (path.includes('sugandoi'))     initHeroSelector(data, 'Sugandoi');
    else if (path.includes('directory'))    await initDirectory(data);
    else if (!path.includes('winners'))     await initIndex(data);
    initNewsletter();
  } catch(err) { console.error('KDMR Media:', err); }
})();
