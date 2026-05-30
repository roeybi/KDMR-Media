/**
 * KDMR Media — live.js
 * Live Arena: YouTube stream · dual ticker · chat intercept · leaderboard
 * Completely isolated from script.js.
 *
 * Gate model: everything visible on load.
 * Unauthenticated vote/chat actions → registration modal → pending action executes on unlock.
 */

import { createClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────────
//  CONFIG
// ────────────────────────────────────────────────

const DATA_URL = import.meta.env.BASE_URL + 'data.json';

const API_CONFIG = {
  ENABLED: true,
  SUPABASE_URL: 'https://erbyhmliuqopwrspxbir.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg',
};

// TV Sabah YouTube live stream embed URL.
// Replace CHANNEL_ID with the actual TV Sabah YouTube channel ID when stream goes live.
// Example: https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxxxxxxxxxx&autoplay=1&mute=1
const TV_SABAH_STREAM_URL = '';

const SESSION_KEY   = 'kdmr_live_session';
const VOTE_PREFIX   = 'kdmr_live_voted_';
const POLL_INTERVAL = 5000;

const CAT_ACCENT = { UN: '#f0a820', MRK: '#4ade80', SG: '#60a5fa' };
const CAT_LABEL  = { UN: 'Unduk Ngadau', MRK: 'MRK', SG: 'Sugandoi' };

const RANK_BADGE = [
  { label: '1st', bg: '#f0a820', color: '#0a0a0a' },
  { label: '2nd', bg: '#9ca3af', color: '#0a0a0a' },
  { label: '3rd', bg: '#a16207', color: '#fff' },
];

// ────────────────────────────────────────────────
//  STATE
// ────────────────────────────────────────────────

let _data              = null;
let _session           = null;
let _liveEvent         = null;
let _pollTimer         = null;
let _chatMessages      = [];
let _chatOnline        = 1;
let _pendingAction     = null; // { type:'vote', candidateId } | { type:'chat', text }
let _unCandidates      = [];   // all 2026 UN winners with liveVotes
let _filterState       = { search: '', sort: 'votes' };
let _supabase          = null; // Supabase JS client (used for Realtime)
const _pendingLocalVotes = new Set(); // IDs voted locally — dedup against Realtime events

// ────────────────────────────────────────────────
//  UTILITIES
// ────────────────────────────────────────────────

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch { return '--:--'; }
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ────────────────────────────────────────────────
//  SESSION
// ────────────────────────────────────────────────

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || !s.token || !s.username || !s.joinedAt) return null;
    return s;
  } catch { return null; }
}

function saveSession(token, username) {
  const s = { token, username, joinedAt: new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  _session = s;
}

function hasVoted(id) { return !!localStorage.getItem(VOTE_PREFIX + id); }
function markVoted(id) { localStorage.setItem(VOTE_PREFIX + id, '1'); }

// ────────────────────────────────────────────────
//  TOAST
// ────────────────────────────────────────────────

function ensureToastContainer() {
  let c = document.getElementById('liveToastContainer');
  if (c) return c;
  c = document.createElement('div');
  c.id = 'liveToastContainer';
  c.style.cssText = 'position:fixed;top:60px;right:14px;left:14px;display:flex;flex-direction:column;gap:7px;z-index:8000;pointer-events:none;align-items:flex-end;';
  document.body.appendChild(c);
  return c;
}

function showToast(msg, type = 'success') {
  const c = ensureToastContainer();
  const p = {
    success: { bg: '#0f1f15', border: '#1f4a2e', text: '#4ade80', icon: '✓' },
    info:    { bg: '#0f1722', border: '#1f3a4a', text: '#60a5fa', icon: 'ℹ' },
    error:   { bg: '#1f0f0f', border: '#4a1f1f', text: '#ff6b6b', icon: '✕' },
  };
  const s = p[type] || p.success;
  const t = document.createElement('div');
  t.style.cssText = `pointer-events:auto;display:flex;align-items:center;gap:9px;background:${s.bg};border:1px solid ${s.border};color:${s.text};padding:10px 14px;border-radius:3px;font-size:0.8rem;font-weight:600;font-family:Inter,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,0.6);max-width:320px;transform:translateY(-10px);opacity:0;transition:opacity 0.22s,transform 0.22s;`;
  t.innerHTML = `<span>${s.icon}</span><span>${msg}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
  setTimeout(() => {
    t.style.opacity = '0'; t.style.transform = 'translateY(-10px)';
    setTimeout(() => t.remove(), 260);
  }, 3000);
}

// ────────────────────────────────────────────────
//  SUPABASE
// ────────────────────────────────────────────────

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(API_CONFIG.SUPABASE_URL, API_CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return _supabase;
}

async function sbInsert(table, row) {
  try {
    const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': API_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[KDMR Live] Supabase insert failed:', err);
    return { ok: false };
  }
}

async function sbFetch(table, params = '') {
  try {
    const res = await fetch(`${API_CONFIG.SUPABASE_URL}/rest/v1/${table}${params}`, {
      headers: {
        'apikey': API_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[KDMR Live] Supabase fetch failed:', err);
    return null;
  }
}

async function loadInitialChat() {
  if (!API_CONFIG.ENABLED) return;
  const rows = await sbFetch('live_chat',
    '?select=message_id,session_token,username,text,sent_at&order=sent_at.asc&limit=60');
  if (!rows || !rows.length) return;
  _chatMessages = rows.map(r => ({
    id: r.message_id, token: r.session_token,
    username: r.username, text: r.text, sentAt: r.sent_at,
  }));
  renderChat();
}

async function syncVoteCounts() {
  if (!API_CONFIG.ENABLED || !_unCandidates.length) return;
  const rows = await sbFetch('live_votes', '?select=candidate_id');
  if (!rows) return;
  const counts = {};
  rows.forEach(r => { counts[r.candidate_id] = (counts[r.candidate_id] || 0) + 1; });
  _unCandidates.forEach(c => { c.liveVotes = counts[c.id] || 0; });
  renderLeaderboard();
  updateRankingTicker();
}

// ────────────────────────────────────────────────
//  GATE MODAL
// ────────────────────────────────────────────────

function openGateModal(hint) {
  const modal = document.getElementById('gateModal');
  if (!modal) return;
  if (hint) {
    const hintEl = document.getElementById('gateHint');
    if (hintEl) hintEl.textContent = hint;
  }
  modal.classList.add('open');
  setTimeout(() => {
    const first = modal.querySelector('input[name="fullName"]');
    if (first) first.focus();
  }, 230);
}

function closeGateModal() {
  const modal = document.getElementById('gateModal');
  if (!modal) return;
  modal.classList.remove('open');
  const form  = document.getElementById('gateForm');
  const btn   = document.getElementById('gateSubmitBtn');
  const errEl = document.getElementById('gateError');
  if (form)  form.reset();
  if (btn)   { btn.disabled = false; btn.textContent = 'Enter the Live Arena →'; }
  if (errEl) errEl.style.display = 'none';
}

function initGate() {
  const existing = loadSession();
  if (existing) { _session = existing; showUserPill(); return; }

  const modal    = document.getElementById('gateModal');
  const form     = document.getElementById('gateForm');
  const closeBtn = document.getElementById('gateCloseBtn');
  if (!modal || !form) return;

  modal.addEventListener('click', e => { if (e.target === modal) closeGateModal(); });
  if (closeBtn) closeBtn.addEventListener('click', closeGateModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeGateModal();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errEl = document.getElementById('gateError');
    const btn   = document.getElementById('gateSubmitBtn');
    errEl.style.display = 'none';

    const fd        = new FormData(form);
    const fullName  = (fd.get('fullName')  || '').trim();
    const username  = (fd.get('username')  || '').trim();
    const email     = (fd.get('email')     || '').trim();
    const phone     = (fd.get('phone')     || '').trim();
    const ethnicity = (fd.get('ethnicity') || '').trim();
    const origin    = (fd.get('origin')    || '').trim();
    const consent   = fd.get('consent') === 'on';

    if (!fullName || !username || !email || !phone || !ethnicity || !origin || !consent) {
      errEl.textContent = 'Please complete all fields and confirm consent.';
      errEl.style.display = 'block'; return;
    }
    if (username.length < 3 || username.length > 20) {
      errEl.textContent = 'Username must be 3–20 characters.';
      errEl.style.display = 'block'; return;
    }

    btn.disabled = true;
    btn.textContent = 'Securing your session…';
    const token = uuid();

    if (API_CONFIG.ENABLED) {
      const result = await sbInsert('live_sessions', {
        token, username, full_name: fullName, email, phone, ethnicity, origin,
        consented: true, consented_at: new Date().toISOString(),
        user_agent: navigator.userAgent, page: window.location.pathname,
      });
      if (!result.ok) {
        errEl.textContent = 'Connection error — please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Enter the Live Arena →';
        return;
      }
    }

    saveSession(token, username);
    closeGateModal();
    showUserPill();
    showToast(`Welcome, ${username}! Your vote counts.`, 'success');

    // Execute the action that triggered the gate
    const pending = _pendingAction;
    _pendingAction = null;
    if (pending?.type === 'vote')                       await handleVote(pending.candidateId);
    else if (pending?.type === 'chat' && pending.text)  await sendChat(pending.text);
  });
}

function showUserPill() {
  const pill   = document.getElementById('userPill');
  const nameEl = document.getElementById('userPillName');
  if (pill && nameEl && _session) {
    nameEl.textContent = _session.username;
    pill.style.display = 'inline-flex';
  }
}

// ────────────────────────────────────────────────
//  DATA
// ────────────────────────────────────────────────

async function loadData() {
  if (_data) return _data;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  _data         = await res.json();
  _liveEvent    = _data.liveEvent || null;
  _unCandidates = (_data.winners || [])
    .filter(w => w.year === 2026 && w.award === 'Unduk Ngadau')
    .map(w => ({ ...w, category: 'UN', liveVotes: 0 }));
  return _data;
}

// ────────────────────────────────────────────────
//  BLOCK 1 — STREAM PLAYER
// ────────────────────────────────────────────────

// Click-to-load Facebook player.
// We render our OWN play button (plain HTML — always tappable on mobile,
// unlike Facebook's in-player button or the SDK player). On tap we inject
// the Facebook iframe with autoplay enabled. Because the iframe is created
// synchronously inside the tap gesture, the browser's user-activation lets
// it start playing right away — no second tap on Facebook's controls needed.
function mountFacebookVideo(wrap, videoUrl) {
  wrap.innerHTML = `
    <button id="fbPlayBtn" type="button" aria-label="Play live broadcast"
      style="position:absolute;inset:0;width:100%;height:100%;border:none;cursor:pointer;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0;font-family:Inter,sans-serif;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(24,119,242,0.14) 0%,transparent 65%);"></div>
      <div style="position:relative;z-index:1;width:74px;height:74px;border-radius:50%;background:rgba(255,255,255,0.96);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 28px rgba(0,0,0,0.45);">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#0a0a0a" style="margin-left:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
      <div style="position:relative;z-index:1;text-align:center;">
        <div style="font-size:clamp(0.85rem,2vw,1.05rem);font-weight:800;color:#f0f0f0;letter-spacing:-0.02em;">Hari Kaamatan 2026 — Live</div>
        <div style="font-size:0.68rem;color:#999;margin-top:4px;">Tap to start the live broadcast</div>
      </div>
    </button>`;

  const btn = wrap.querySelector('#fbPlayBtn');
  btn.addEventListener('click', () => {
    const fbSrc = 'https://www.facebook.com/plugins/video.php'
      + '?href=' + encodeURIComponent(videoUrl)
      + '&show_text=false&width=1280&autoplay=true&allowfullscreen=true';
    const frame = document.createElement('iframe');
    frame.src = fbSrc;
    frame.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;display:block;';
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('frameborder', '0');
    frame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen';
    frame.allowFullscreen = true;
    frame.title = 'Hari Kaamatan 2026 Live Stream';
    wrap.innerHTML = '';
    wrap.appendChild(frame);

    // Subtle recovery bar — if the player ever stalls/freezes, the viewer can
    // reload it in place or, as a last resort, open the broadcast on Facebook.
    const bar = document.createElement('div');
    bar.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:5;display:flex;gap:6px;font-family:Inter,sans-serif;';
    bar.innerHTML = `
      <button type="button" id="fbReloadBtn" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.18);color:#ddd;font-size:0.62rem;font-weight:600;padding:4px 9px;border-radius:999px;cursor:pointer;">↻ Reload</button>
      <a href="${videoUrl}" target="_blank" rel="noopener" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.18);color:#ddd;font-size:0.62rem;font-weight:600;padding:4px 9px;border-radius:999px;text-decoration:none;">Open on Facebook ↗</a>`;
    wrap.appendChild(bar);
    bar.querySelector('#fbReloadBtn').addEventListener('click', () => mountFacebookVideo(wrap, videoUrl));
  }, { once: true });
}

// Parse a YouTube video ID from any common URL shape:
// watch?v=ID, youtu.be/ID, /live/ID, /embed/ID, /shorts/ID.
function parseYouTubeId(url) {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#/]+)/,
    /\/live\/([^?&#/]+)/,
    /\/embed\/([^?&#/]+)/,
    /\/shorts\/([^?&#/]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

function mountYouTubeVideo(wrap, videoUrl) {
  const vidId = parseYouTubeId(videoUrl);

  // If it's a channel "/live" URL with no resolvable video id, embed the
  // channel live feed via the live_stream player; otherwise embed by id.
  let src;
  if (vidId) {
    src = `https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`;
  } else {
    const chanMatch = videoUrl.match(/youtube\.com\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+)/);
    if (chanMatch) {
      // channel handle/live page — fall back to a watch link, can't embed reliably
      src = null;
    }
  }

  if (!src) {
    wrap.innerHTML = `
      <div style="position:absolute;inset:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;">
        <div>
          <div style="font-size:0.85rem;font-weight:800;color:#f0f0f0;margin-bottom:6px;">Hari Kaamatan 2026 — Live</div>
          <div style="font-size:0.7rem;color:#888;margin-bottom:18px;">Tap below to watch the live broadcast on YouTube.</div>
          <a href="${videoUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#ff0000;color:#fff;font-size:0.82rem;font-weight:700;padding:12px 22px;border-radius:4px;text-decoration:none;">Watch Live on YouTube →</a>
        </div>
      </div>`;
    return;
  }

  const frame = document.createElement('iframe');
  frame.src = src;
  frame.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;display:block;';
  frame.setAttribute('frameborder', '0');
  frame.setAttribute('scrolling', 'no');
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  frame.title = 'Hari Kaamatan 2026 Live Stream';
  wrap.innerHTML = '';
  wrap.appendChild(frame);

  // Subtle recovery affordance — reload in place or open on YouTube.
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:5;display:flex;gap:6px;font-family:Inter,sans-serif;';
  bar.innerHTML = `
    <button type="button" id="ytReloadBtn" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.18);color:#ddd;font-size:0.62rem;font-weight:600;padding:4px 9px;border-radius:999px;cursor:pointer;">↻ Reload</button>
    <a href="${videoUrl}" target="_blank" rel="noopener" style="background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.18);color:#ddd;font-size:0.62rem;font-weight:600;padding:4px 9px;border-radius:999px;text-decoration:none;">Open on YouTube ↗</a>`;
  wrap.appendChild(bar);
  bar.querySelector('#ytReloadBtn').addEventListener('click', () => mountYouTubeVideo(wrap, videoUrl));
}

function initStream(streamUrl) {
  const wrap = document.getElementById('streamWrap');
  if (!wrap) return;

  // Determine if we have a real stream URL
  const isLive = TV_SABAH_STREAM_URL ||
                 (streamUrl && !streamUrl.includes('placeholder'));
  const embedUrl = TV_SABAH_STREAM_URL || streamUrl;

  if (isLive) {
    const isFacebook = embedUrl.includes('facebook.com');
    const isYouTube  = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');

    if (isFacebook) {
      // Facebook LIVE embed via a click-to-load player (see mountFacebookVideo):
      // our own tappable play button -> on tap, inject the plugins/video.php
      // iframe with autoplay inside the gesture so it starts playing inline
      // without relying on Facebook's own (hard-to-tap on mobile) play button.
      mountFacebookVideo(wrap, embedUrl);

    } else if (isYouTube) {
      // YouTube LIVE — true inline embed. YouTube's player handles live
      // playback and mobile reliably (unlike Facebook), so we embed it
      // directly with autoplay (muted, required for mobile autoplay) and
      // playsinline so iOS plays it in place instead of going fullscreen.
      mountYouTubeVideo(wrap, embedUrl);
    }
  } else {
    // Countdown fallback
    wrap.innerHTML = `
      <div style="position:absolute;inset:0;background:linear-gradient(160deg,#0d0808 0%,#1a0808 50%,#0d0d0d 100%);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,rgba(255,59,59,0.07) 0%,transparent 65%);pointer-events:none;"></div>
        <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,59,59,0.07);border:1px solid rgba(255,59,59,0.18);display:flex;align-items:center;justify-content:center;z-index:1;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff3b3b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div style="text-align:center;z-index:1;">
          <div style="font-size:0.85rem;font-weight:700;color:#f0f0f0;margin-bottom:4px;">Broadcast begins 30 May 2026 · 6:00 PM (MYT)</div>
          <div style="font-size:0.65rem;color:#444;">TV Sabah · YouTube Live Stream</div>
        </div>
        <div style="display:flex;gap:20px;z-index:1;">
          <div style="text-align:center;"><div id="cdDays" style="font-size:2rem;color:#f0a820;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-0.03em;">00</div><div style="font-size:0.52rem;color:#444;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">Days</div></div>
          <div style="text-align:center;"><div id="cdHours" style="font-size:2rem;color:#f0a820;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-0.03em;">00</div><div style="font-size:0.52rem;color:#444;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">Hours</div></div>
          <div style="text-align:center;"><div id="cdMins" style="font-size:2rem;color:#f0a820;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-0.03em;">00</div><div style="font-size:0.52rem;color:#444;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">Mins</div></div>
          <div style="text-align:center;"><div id="cdSecs" style="font-size:2rem;color:#f0a820;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:-0.03em;">00</div><div style="font-size:0.52rem;color:#444;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">Secs</div></div>
        </div>
      </div>
    `;
    initCountdown(_liveEvent?.startDate || '2026-05-30T18:00:00+08:00');
  }
}

function initCountdown(targetDateStr) {
  const target = new Date(targetDateStr);
  function tick() {
    const diff = target - new Date();
    const dEl = document.getElementById('cdDays');
    const hEl = document.getElementById('cdHours');
    const mEl = document.getElementById('cdMins');
    const sEl = document.getElementById('cdSecs');
    if (!dEl) return;
    if (diff <= 0) { dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = '00'; return; }
    dEl.textContent = String(Math.floor(diff / 864e5)).padStart(2, '0');
    hEl.textContent = String(Math.floor((diff % 864e5) / 36e5)).padStart(2, '0');
    mEl.textContent = String(Math.floor((diff % 36e5) / 6e4)).padStart(2, '0');
    sEl.textContent = String(Math.floor((diff % 6e4) / 1e3)).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

// ────────────────────────────────────────────────
//  BLOCK 2 — DUAL TICKER
// ────────────────────────────────────────────────

function buildTickerHTML(items, separator = '  ·  ') {
  // Duplicate for seamless loop (ticker-track animates -50%)
  const text = items.join(separator) + separator;
  const doubled = text + text;
  return `<span style="font-size:0.58rem;font-weight:600;color:#888;letter-spacing:0.04em;padding-right:0;">${doubled}</span>`;
}

function initRankingTicker() {
  const track = document.getElementById('rankingTrack');
  if (!track || !_unCandidates.length) return;

  const totalVotes = _unCandidates.reduce((sum, c) => sum + (c.liveVotes || 0), 0);
  const acc = '#f0a820';

  // If any votes exist, show top 5 only; otherwise show all names (0 votes each)
  const sorted = [..._unCandidates]
    .sort((a, b) => (b.liveVotes || 0) - (a.liveVotes || 0));
  const display = totalVotes > 0 ? sorted.slice(0, 5) : sorted;

  const items = display.map((c, i) => {
    const medal = ['🥇','🥈','🥉'][i] || `${i + 1}.`;
    const voteText = totalVotes > 0 ? ` ${(c.liveVotes||0).toLocaleString()} vote${(c.liveVotes||0)===1?'':'s'}` : ' 0 votes';
    return `<span style="color:#f0f0f0;font-weight:700;">${medal} ${c.name}</span><span style="color:${acc};font-weight:800;">${voteText}</span>`;
  });

  // Build doubled text nodes for seamless loop
  const half = document.createElement('span');
  const sep  = '<span style="color:#2a2a2a;padding:0 12px;">·</span>';
  half.style.cssText = 'display:inline-flex;align-items:center;white-space:nowrap;gap:0;';
  half.innerHTML = items.map(h => `<span style="display:inline-flex;align-items:center;gap:4px;padding:0 2px;">${h}</span>`).join(sep);

  track.innerHTML = '';
  track.appendChild(half);
  track.appendChild(half.cloneNode(true)); // duplicate for seamless scroll
}

function updateRankingTicker() {
  initRankingTicker();
}

const ACTIVITY_PHRASES = [
  (u) => `${u} just joined!`,
  (u) => `${u} cast a vote!`,
  (u) => `${u} is watching live`,
  (u) => `${u} just joined the arena`,
  (u) => `${u} voted for their champion`,
];
const ACTIVITY_NAMES = [
  'Sarah_KK','MurutWarrior','DusunPride','KadazanFan99','RungusHeart',
  'SabahBorn88','Penampang_Girl','TamparuliFan','KKLocal','BoheiDusun',
  'NativeOfSabah','LotudWarrior','LegendWatcher','HongkodFan',
];

function initActivityTicker() {
  const track = document.getElementById('activityTrack');
  if (!track) return;

  function pickItem() {
    const name = ACTIVITY_NAMES[Math.floor(Math.random() * ACTIVITY_NAMES.length)];
    const phrase = ACTIVITY_PHRASES[Math.floor(Math.random() * ACTIVITY_PHRASES.length)];
    return phrase(name);
  }

  const items = Array.from({ length: 8 }, pickItem);
  const sep   = '  ·  ';
  const text  = items.join(sep) + sep;
  const doubled = text + text;

  const span = document.createElement('span');
  span.style.cssText = 'font-size:0.58rem;font-weight:500;color:#555;letter-spacing:0.03em;white-space:nowrap;';
  span.textContent = doubled;
  track.innerHTML = '';
  track.appendChild(span);

  // Refresh activity text every 30s
  setInterval(() => {
    const newItems = Array.from({ length: 8 }, pickItem);
    const newText  = newItems.join(sep) + sep;
    span.textContent = newText + newText;
  }, 30000);
}

// ────────────────────────────────────────────────
//  BLOCK 3 — LIVE CHAT
// ────────────────────────────────────────────────

function renderChat() {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;
  if (!_chatMessages.length) {
    feed.innerHTML = `<div style="padding:14px;text-align:center;"><span style="font-size:0.62rem;color:#2a2a2a;">Welcome to the Live Arena. Be respectful and celebrate our shared heritage.</span></div>`;
    return;
  }
  feed.innerHTML = _chatMessages.map(m => {
    const isMe = m.token === _session?.token;
    return `
      <div class="chat-msg" style="${isMe ? 'background:rgba(240,168,32,0.02);' : ''}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="font-size:0.58rem;font-weight:700;color:${isMe ? '#f0a820' : '#555'};">${escapeHtml(m.username)}</span>
          <span style="font-size:0.48rem;color:#2a2a2a;">${formatTime(m.sentAt)}</span>
        </div>
        <div style="font-size:0.78rem;color:#bbb;line-height:1.45;word-break:break-word;">${escapeHtml(m.text)}</div>
      </div>
    `;
  }).join('');
  feed.scrollTop = feed.scrollHeight;
}

async function sendChat(text) {
  if (!text || !text.trim()) return;

  if (!loadSession()) {
    _pendingAction = { type: 'chat', text: text.trim() };
    openGateModal('Register to post your comment — it sends instantly after sign-up.');
    return;
  }

  const msg = {
    id: uuid(), token: _session.token, username: _session.username,
    text: text.trim().slice(0, 140), sentAt: new Date().toISOString(),
  };
  _chatMessages.push(msg);
  renderChat();

  if (API_CONFIG.ENABLED) {
    await sbInsert('live_chat', {
      message_id: msg.id, session_token: msg.token,
      username: msg.username, text: msg.text, sent_at: msg.sentAt,
    });
  }
}

function initChat() {
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('chatSendBtn');
  if (!input || !btn) return;

  function dispatch() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendChat(text);
    input.focus();
  }

  btn.addEventListener('click', dispatch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dispatch(); }
  });
}

// ────────────────────────────────────────────────
//  BLOCK 4 — LIVE LEADERBOARD ENGINE
// ────────────────────────────────────────────────

function renderLbStats() {
  const el = document.getElementById('lbStats');
  if (!el || !_unCandidates.length) return;
  const branches = new Set(_unCandidates.map(c => c.branch)).size;
  const areas    = new Set(_unCandidates.map(c => c.district || c.branch)).size;
  const stats = [
    { value: _unCandidates.length, label: 'Contestants' },
    { value: branches,             label: 'Branches'    },
    { value: areas,                label: 'Areas'       },
    { value: '2026',               label: 'Year', gold: true },
  ];
  el.innerHTML = stats.map(s => `
    <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:3px;padding:14px 10px;text-align:center;">
      <div style="font-size:1.4rem;font-weight:900;color:${s.gold ? '#f0a820' : '#f0f0f0'};letter-spacing:-0.03em;font-variant-numeric:tabular-nums;">${s.value}</div>
      <div style="font-size:0.48rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#444;margin-top:5px;">${s.label}</div>
    </div>`).join('');
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) return;

  const { search, sort } = _filterState;
  const q = search.trim().toLowerCase();

  let visible = q
    ? _unCandidates.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q))
    : [..._unCandidates];

  if (sort === 'name') {
    visible.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'district') {
    visible.sort((a, b) => (a.district || a.branch).localeCompare(b.district || b.branch));
  } else if (sort === 'default') {
    // original data.json order — already preserved in _unCandidates
  } else {
    // 'votes' — most supported first, tie-break by name
    visible.sort((a, b) => (b.liveVotes || 0) - (a.liveVotes || 0) || a.name.localeCompare(b.name));
  }

  if (!visible.length) {
    list.innerHTML = `<div style="padding:32px;text-align:center;color:#444;font-size:0.8rem;">No contestants found.</div>`;
    return;
  }

  const maxVotes = Math.max(...visible.map(c => c.liveVotes || 0), 1);
  const baseUrl  = import.meta.env.BASE_URL.replace(/\/$/, '');
  const acc      = '#f0a820';

  list.innerHTML = visible.map((c, i) => {
    const badge  = RANK_BADGE[i] || { label: ordinal(i + 1), bg: '#1a1a1a', color: '#555' };
    const voted  = hasVoted(c.id);
    const pct    = ((c.liveVotes || 0) / maxVotes * 100).toFixed(1);
    const imgUrl = c.imageUrl ? baseUrl + c.imageUrl : null;

    return `
      <div class="lb-row ${voted ? 'lb-voted' : ''}" id="lb-row-${c.id}">
        <div style="flex-shrink:0;width:34px;text-align:center;">
          <span style="display:inline-block;background:${badge.bg};color:${badge.color};font-size:0.58rem;font-weight:900;letter-spacing:0.04em;padding:3px 6px;border-radius:2px;white-space:nowrap;">${badge.label}</span>
        </div>
        <div style="flex-shrink:0;width:44px;height:60px;border-radius:2px;overflow:hidden;background:#0a0a0a;border:1px solid #1a1a1a;">
          ${imgUrl ? `<img src="${imgUrl}" alt="${c.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:top center;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ''}
          <div style="display:${imgUrl ? 'none' : 'flex'};width:100%;height:100%;align-items:center;justify-content:center;background:${acc}11;">
            <span style="font-size:0.72rem;font-weight:900;color:${acc};">${initials(c.name)}</span>
          </div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
            <span style="font-size:0.85rem;font-weight:800;color:#f0f0f0;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${c.name}</span>
            <span style="font-size:0.48rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:${acc}15;color:${acc};border:1px solid ${acc}30;padding:1px 6px;border-radius:1px;flex-shrink:0;">Unduk Ngadau</span>
          </div>
          <div style="font-size:0.62rem;color:#555;margin-bottom:7px;">${c.branch} · ${c.district || ''}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="vote-bar" style="flex:1;"><div class="vote-bar-fill" id="lb-bar-${c.id}" style="width:${pct}%;background:${acc};"></div></div>
            <span id="lb-votes-${c.id}" style="font-size:0.65rem;font-weight:700;color:${acc};font-variant-numeric:tabular-nums;min-width:40px;text-align:right;">${(c.liveVotes || 0).toLocaleString()}</span>
          </div>
        </div>
        <button class="cast-vote-btn vote-btn-live" id="lb-btn-${c.id}" data-id="${c.id}"
          style="background:${voted ? 'rgba(74,222,128,0.08)' : acc + '18'};color:${voted ? '#4ade80' : acc};border:1px solid ${voted ? 'rgba(74,222,128,0.3)' : acc + '35'};"
          ${voted ? 'disabled' : ''}>
          ${voted ? '✓ Voted' : 'Cast Vote'}
        </button>
      </div>`;
  }).join('');

  const updEl = document.getElementById('voteUpdatedAt');
  if (updEl) updEl.textContent = `Updated ${new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

// ── FLIP-animated leaderboard re-sort ──────────────────────────────────────
// Uses First/Last/Invert/Play: snapshot old Y positions → re-render → compute
// delta → apply instant inverse transform → animate to 0. Smooth ~500ms reorder.
function animatedRenderLeaderboard() {
  const list = document.getElementById('leaderboardList');
  if (!list) { renderLeaderboard(); return; }

  // FIRST: snapshot current top positions of all visible rows
  const firstPos = {};
  list.querySelectorAll('.lb-row[id^="lb-row-"]').forEach(el => {
    firstPos[el.id] = el.getBoundingClientRect().top;
  });

  // UPDATE: full re-render (new sorted order in DOM)
  renderLeaderboard();

  // LAST → INVERT → PLAY: animate each row from old position to new
  list.querySelectorAll('.lb-row[id^="lb-row-"]').forEach(el => {
    const first = firstPos[el.id];
    if (first === undefined) return; // new element — no animation needed
    const last  = el.getBoundingClientRect().top;
    const delta = first - last;
    if (Math.abs(delta) < 1) return; // no meaningful movement

    // Snap element back to its old visual position (no transition)
    el.style.transition = 'none';
    el.style.transform  = `translateY(${delta}px)`;

    // On next two frames: enable transition and release to natural position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform  = '';
        // Clean up inline styles after animation finishes
        el.addEventListener('transitionend', () => {
          el.style.transition = '';
          el.style.transform  = '';
        }, { once: true });
      });
    });
  });
}

function initLeaderboard() {
  const list    = document.getElementById('leaderboardList');
  const search  = document.getElementById('lbSearch');
  const sortSel = document.getElementById('lbSort');

  if (list) {
    list.addEventListener('click', e => {
      const btn = e.target.closest('.vote-btn-live');
      if (!btn || btn.disabled) return;
      handleVote(btn.dataset.id);
    });
  }
  if (search) {
    search.addEventListener('input', () => {
      _filterState.search = search.value;
      renderLeaderboard();
    });
  }
  if (sortSel) {
    sortSel.addEventListener('change', () => {
      _filterState.sort = sortSel.value;
      renderLeaderboard();
    });
  }
}

function refreshLeaderboardRow(candidateId) {
  const c = _unCandidates.find(x => x.id === candidateId);
  if (!c) return;

  const acc = '#f0a820';
  const max = Math.max(..._unCandidates.map(x => x.liveVotes || 0), 1);

  const bar    = document.getElementById(`lb-bar-${candidateId}`);
  const voteEl = document.getElementById(`lb-votes-${candidateId}`);
  const btn    = document.getElementById(`lb-btn-${candidateId}`);
  const row    = document.getElementById(`lb-row-${candidateId}`);

  if (bar)    bar.style.width = ((c.liveVotes || 0) / max * 100).toFixed(1) + '%';
  if (voteEl) { voteEl.textContent = (c.liveVotes || 0).toLocaleString(); voteEl.classList.add('vote-pop'); setTimeout(() => voteEl.classList.remove('vote-pop'), 500); }
  if (btn)    { btn.innerHTML = '✓ Voted'; btn.style.cssText = `background:rgba(74,222,128,0.08);color:#4ade80;border:1px solid rgba(74,222,128,0.3);`; btn.disabled = true; }
  if (row)    row.classList.add('lb-voted');

  // Recalculate all visible bars
  _unCandidates.forEach(x => {
    const b = document.getElementById(`lb-bar-${x.id}`);
    if (b) b.style.width = ((x.liveVotes || 0) / max * 100).toFixed(1) + '%';
  });

  // Re-sort leaderboard if sorted by votes (with animation)
  if (_filterState.sort === 'votes') setTimeout(animatedRenderLeaderboard, 600);

  updateRankingTicker();
}

// ────────────────────────────────────────────────
//  VOTE HANDLER
// ────────────────────────────────────────────────

async function handleVote(candidateId) {
  if (!loadSession()) {
    _pendingAction = { type: 'vote', candidateId };
    openGateModal('Register to cast your vote — takes 30 seconds and unlocks live chat too.');
    return;
  }
  if (hasVoted(candidateId)) {
    showToast('You already voted for this candidate.', 'info');
    return;
  }

  const c = _unCandidates.find(x => x.id === candidateId);
  if (!c) return;

  // Disable the button immediately to prevent double-clicks
  const btn = document.getElementById(`lb-btn-${candidateId}`);
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  // Track local vote so the Realtime INSERT event doesn't double-count it
  _pendingLocalVotes.add(candidateId);

  // Supabase-first: only mark voted after server confirms
  if (API_CONFIG.ENABLED) {
    const result = await sbInsert('live_votes', {
      candidate_id: candidateId, candidate_name: c.name,
      category: 'UN', session_token: _session?.token,
      voted_at: new Date().toISOString(),
    });
    if (!result.ok) {
      // Insert failed — remove from pending so Realtime doesn't skip a future real event
      _pendingLocalVotes.delete(candidateId);
      // Restore button so user can retry
      if (btn) { btn.disabled = false; btn.textContent = 'Cast Vote'; }
      if (result.status === 409) {
        // Unique constraint — already voted on another device/browser
        markVoted(candidateId);
        showToast('Your vote was already recorded for this candidate.', 'info');
        if (btn) { btn.innerHTML = '✓ Voted'; btn.style.cssText = 'background:rgba(74,222,128,0.08);color:#4ade80;border:1px solid rgba(74,222,128,0.3);'; btn.disabled = true; }
      } else {
        showToast('Could not record your vote — please try again.', 'error');
      }
      return;
    }
  }

  // Only mark locally and update UI after server confirms
  markVoted(candidateId);
  c.liveVotes = (c.liveVotes || 0) + 1;
  refreshLeaderboardRow(candidateId);
  showToast(`Vote cast for ${c.name}!`, 'success');
}

// ────────────────────────────────────────────────
//  POLLING (fallback — used if Realtime unavailable)
// ────────────────────────────────────────────────

function startPolling() {
  if (!API_CONFIG.ENABLED) return;
  if (_pollTimer) clearInterval(_pollTimer);

  _pollTimer = setInterval(async () => {
    // Poll for new chat messages since the last one we have
    const lastMsg  = _chatMessages[_chatMessages.length - 1];
    const since    = lastMsg ? lastMsg.sentAt : new Date(0).toISOString();
    const rows = await sbFetch('live_chat',
      `?select=message_id,session_token,username,text,sent_at&sent_at=gt.${encodeURIComponent(since)}&order=sent_at.asc&limit=20`);
    if (rows && rows.length) {
      const incoming = rows
        .map(r => ({ id: r.message_id, token: r.session_token, username: r.username, text: r.text, sentAt: r.sent_at }))
        .filter(m => !_chatMessages.find(x => x.id === m.id));
      if (incoming.length) {
        _chatMessages.push(...incoming);
        if (_chatMessages.length > 100) _chatMessages = _chatMessages.slice(-100);
        renderChat();
      }
    }
  }, POLL_INTERVAL);
}

// ────────────────────────────────────────────────
//  REALTIME (Supabase WebSocket subscriptions)
//
//  Requires Realtime to be enabled on the Supabase project for
//  the `live_votes` and `live_chat` tables. If the subscription
//  fails to connect, `startPolling()` runs as fallback.
// ────────────────────────────────────────────────

function startRealtime() {
  if (!API_CONFIG.ENABLED) return;

  const sb = getSupabase();
  let realtimeConnected = false;

  // ── Live votes → instant leaderboard re-sort with FLIP animation ──
  sb.channel('kdmr_live_votes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_votes' },
      payload => {
        const { candidate_id } = payload.new;

        // Skip if this INSERT came from our own local vote (already counted optimistically)
        if (_pendingLocalVotes.has(candidate_id)) {
          _pendingLocalVotes.delete(candidate_id);
          return;
        }

        const c = _unCandidates.find(x => x.id === candidate_id);
        if (c) {
          c.liveVotes = (c.liveVotes || 0) + 1;
          if (_filterState.sort === 'votes') {
            animatedRenderLeaderboard();
          } else {
            // Just refresh the affected row's bar + count without resorting
            const max    = Math.max(..._unCandidates.map(x => x.liveVotes || 0), 1);
            const bar    = document.getElementById(`lb-bar-${candidate_id}`);
            const voteEl = document.getElementById(`lb-votes-${candidate_id}`);
            if (bar)    bar.style.width = ((c.liveVotes || 0) / max * 100).toFixed(1) + '%';
            if (voteEl) voteEl.textContent = (c.liveVotes || 0).toLocaleString();
            // Recalculate all other bars too (max may have changed)
            _unCandidates.forEach(x => {
              const b = document.getElementById(`lb-bar-${x.id}`);
              if (b) b.style.width = ((x.liveVotes || 0) / max * 100).toFixed(1) + '%';
            });
          }
          updateRankingTicker();
        }
      })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        realtimeConnected = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (!realtimeConnected) startPolling(); // fall back if we never connected
      }
    });

  // ── Live chat → instant message append ──
  sb.channel('kdmr_live_chat')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_chat' },
      payload => {
        const r = payload.new;
        const msg = {
          id: r.message_id, token: r.session_token,
          username: r.username, text: r.text, sentAt: r.sent_at,
        };
        if (!_chatMessages.find(x => x.id === msg.id)) {
          _chatMessages.push(msg);
          if (_chatMessages.length > 100) _chatMessages = _chatMessages.slice(-100);
          renderChat();
        }
      })
    .subscribe();

  // Safety net: start polling for chat anyway as belt-and-suspenders
  // (Realtime deduplication in renderChat already prevents double-rendering)
  startPolling();
}

// ────────────────────────────────────────────────
//  BOOTSTRAP
// ────────────────────────────────────────────────

(async function init() {
  try {
    // ?reset — clear session + all vote markers for fresh testing
    if (new URLSearchParams(window.location.search).get('reset') !== null) {
      localStorage.removeItem(SESSION_KEY);
      Object.keys(localStorage)
        .filter(k => k.startsWith(VOTE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
      // Strip the ?reset param from the URL without reloading
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }

    // 1. Gate — restore session if exists, wire up modal if not
    initGate();

    // 2. Load event data
    await loadData();

    // 3. Title overlay
    if (_liveEvent) {
      const titleEl = document.getElementById('liveTitle');
      if (titleEl) titleEl.textContent = _liveEvent.title;
    }

    // 4. Block 1 — stream player or countdown
    initStream(_liveEvent?.streamUrl);

    // 5. Block 2 — dual ticker (UN candidates drive the ranking ticker)
    initRankingTicker();
    initActivityTicker();

    // 6. Block 4 — leaderboard: stats + all 52 UN candidates
    initLeaderboard();
    renderLbStats();
    renderLeaderboard();

    // 7. Block 3 — chat input listeners + load real messages
    initChat();
    await loadInitialChat();
    renderChat();

    // 8. Sync live vote counts from Supabase
    await syncVoteCounts();

    // 9. Start Supabase Realtime (votes + chat); falls back to polling if unavailable
    startRealtime();

  } catch (err) {
    console.error('[KDMR Live] Bootstrap error:', err);
  }
})();
