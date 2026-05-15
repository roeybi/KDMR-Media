/**
 * KDMR Media — script.js
 * Handles: data loading, tickers, global search, HOF, directory, voting
 */

const DATA_URL = './data.json';
const VOTES_KEY = 'kdmr_votes';

// ─── Data ─────────────────────────────────────────────────────────────────

let _data = null;
async function loadData() {
  if (_data) return _data;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  _data = await res.json();
  return _data;
}

// ─── Votes ────────────────────────────────────────────────────────────────

function getVotes() {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); }
  catch { return {}; }
}
function hasVoted(id) { return !!getVotes()[id]; }
function castVote(id) {
  if (hasVoted(id)) return false;
  const v = getVotes(); v[id] = true;
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function avatarInitial(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(interval);
  }, 28);
}

function fadein(container) {
  const items = container.querySelectorAll('[data-fade]');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; }, i * 45);
  });
}

const CAT_COLORS = {
  'Politics':        { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
  'Arts & Culture':  { bg: 'rgba(236,72,153,0.1)', text: '#f472b6' },
  'Sports':          { bg: 'rgba(34,197,94,0.1)',  text: '#4ade80' },
  'Education':       { bg: 'rgba(168,85,247,0.1)', text: '#c084fc' },
  'Entrepreneurship':{ bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
};
const BIZ_CAT_COLORS = {
  'Food & Beverage':     { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24' },
  'Arts & Crafts':       { bg: 'rgba(236,72,153,0.1)', text: '#f472b6' },
  'Tourism & Hospitality':{ bg:'rgba(59,130,246,0.1)', text: '#60a5fa' },
  'Health & Wellness':   { bg: 'rgba(34,197,94,0.1)',  text: '#4ade80' },
  'Agriculture':         { bg: 'rgba(74,222,128,0.1)', text: '#34d399' },
  'Education':           { bg: 'rgba(168,85,247,0.1)', text: '#c084fc' },
};
function catCol(cat, map = CAT_COLORS) {
  return map[cat] || { bg: 'rgba(240,168,32,0.08)', text: '#f0a820' };
}

// ─── Ticker ───────────────────────────────────────────────────────────────

function buildTicker(trackId, items, separator = '  ·  ') {
  const track = document.getElementById(trackId);
  if (!track || !items.length) return;
  const text = items.join(separator);
  // Duplicate for seamless loop
  track.innerHTML = `
    <span style="padding-right:40px;">${text}</span>
    <span style="padding-right:40px;" aria-hidden="true">${text}</span>
  `;
}

// ─── Global search overlay (index page) ──────────────────────────────────

function initGlobalSearch(data) {
  const input = document.getElementById('overlaySearchInput');
  const resultsEl = document.getElementById('overlayResults');
  const hintEl = document.getElementById('overlaySearchHint');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      resultsEl.style.display = 'none';
      hintEl.style.display = 'block';
      return;
    }
    hintEl.style.display = 'none';
    resultsEl.style.display = 'block';

    const hofMatches = data.hallOfFame.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.tribe.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);

    const bizMatches = data.businesses.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);

    const newsMatches = data.news.filter(n =>
      n.headline.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    ).slice(0, 3);

    const total = hofMatches.length + bizMatches.length + newsMatches.length;
    if (total === 0) {
      resultsEl.innerHTML = `<div style="padding:32px;text-align:center;color:#444;font-size:0.8rem;">No results for "<strong style="color:#888;">${q}</strong>"</div>`;
      return;
    }

    let html = '';
    if (hofMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;">Hall of Fame</div>`;
      html += hofMatches.map(p => `
        <a href="./archive.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;transition:background 0.1s;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'">
          <div style="width:34px;height:34px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${avatarInitial(p.name)}</div>
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${p.name}</div>
            <div style="font-size:0.72rem;color:#555;">${p.tribe} · ${p.category}</div>
          </div>
          <div style="margin-left:auto;font-size:0.65rem;color:#333;flex-shrink:0;">HOF →</div>
        </a>
      `).join('');
    }
    if (bizMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-bottom:1px solid #1e1e1e;border-top:${hofMatches.length ? '1px solid #1e1e1e' : 'none'};">Businesses</div>`;
      html += bizMatches.map(b => `
        <a href="./directory.html" style="display:flex;align-items:center;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #1a1a1a;transition:background 0.1s;" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background='transparent'">
          <div style="width:34px;height:34px;border-radius:2px;background:#1e1e1e;border:1px solid #2a2a2a;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#f0a820;flex-shrink:0;">${avatarInitial(b.name)}</div>
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:#f0f0f0;">${b.name}</div>
            <div style="font-size:0.72rem;color:#555;">${b.location} · ${b.category}</div>
          </div>
          <div style="margin-left:auto;font-size:0.65rem;color:#333;flex-shrink:0;">Dir →</div>
        </a>
      `).join('');
    }
    if (newsMatches.length) {
      html += `<div style="padding:10px 16px 6px;font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#444;border-top:1px solid #1e1e1e;border-bottom:1px solid #1e1e1e;">News</div>`;
      html += newsMatches.map(n => `
        <div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
          <div style="font-size:0.62rem;font-weight:600;color:#f0a820;margin-bottom:4px;">${n.category.toUpperCase()} · ${formatDate(n.date)}</div>
          <div style="font-size:0.82rem;font-weight:500;color:#f0f0f0;line-height:1.4;">${n.headline}</div>
        </div>
      `).join('');
    }
    resultsEl.innerHTML = html;
  });
}

// ─── INDEX PAGE ───────────────────────────────────────────────────────────

async function initIndex(data) {
  // Stats
  animateCount('statHof', data.stats.hofEntries);
  animateCount('statBiz', data.stats.businesses);
  animateCount('statTribes', data.stats.tribesRepresented);
  animateCount('statDistricts', data.stats.districtsRepresented);

  // Breaking bar ticker
  buildTicker('breakingTicker', data.news.map(n => n.headline));

  // News ticker
  buildTicker('newsTicker', data.news.map(n => `${n.category.toUpperCase()}: ${n.headline} (${n.source})`));

  // News feed
  const feedEl = document.getElementById('newsFeed');
  if (feedEl) {
    feedEl.innerHTML = data.news.map(item => `
      <article data-fade style="background:#111;border:1px solid #1e1e1e;padding:16px;display:flex;flex-direction:column;gap:8px;cursor:default;transition:border-color 0.15s;"
        onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.62rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f0a820;">${item.category}</span>
          <span style="color:#252525;font-size:0.72rem;">·</span>
          <span style="font-size:0.72rem;color:#444;">${formatDate(item.date)}</span>
          <span style="color:#252525;font-size:0.72rem;">·</span>
          <span style="font-size:0.72rem;color:#333;">${item.source}</span>
        </div>
        <h3 style="font-size:0.95rem;font-weight:700;color:#f0f0f0;line-height:1.4;margin:0;letter-spacing:-0.01em;">${item.headline}</h3>
        <p style="font-size:0.8rem;color:#555;line-height:1.65;margin:0;">${item.summary}</p>
      </article>
    `).join('');
    fadein(feedEl);
  }

  // Top voted
  const topEl = document.getElementById('topVoted');
  if (topEl) {
    const sorted = [...data.hallOfFame].sort((a, b) => b.votes - a.votes).slice(0, 5);
    topEl.innerHTML = sorted.map((p, i) => `
      <div data-fade style="display:flex;align-items:center;gap:10px;padding:10px;background:#111;border:1px solid #1e1e1e;transition:border-color 0.15s;"
        onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
        <span style="font-size:0.75rem;font-weight:800;color:#333;width:16px;text-align:center;flex-shrink:0;">${i + 1}</span>
        <div style="width:32px;height:32px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#0a0a0a;flex-shrink:0;">${avatarInitial(p.name)}</div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:0.82rem;font-weight:600;color:#f0f0f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.7rem;color:#444;">${p.tribe} · ${p.category}</div>
        </div>
        <span style="font-size:0.72rem;font-weight:700;color:#f0a820;flex-shrink:0;">${p.votes}</span>
      </div>
    `).join('');
    fadein(topEl);
  }

  // Featured business
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

  // HOF preview
  const hofEl = document.getElementById('hofPreview');
  if (hofEl) {
    const preview = [...data.hallOfFame].sort((a, b) => b.votes - a.votes).slice(0, 3);
    hofEl.innerHTML = preview.map(p => renderHofRow(p)).join('');
    fadein(hofEl);
  }

  // Global search
  initGlobalSearch(data);
}

// ─── HOF CARD (list row style) ────────────────────────────────────────────

function renderHofRow(p) {
  const col = catCol(p.category);
  const voted = hasVoted(p.id);
  return `
    <article class="hof-card" data-id="${p.id}" data-fade
      style="background:#111;border:1px solid #1e1e1e;padding:14px 16px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;transition:border-color 0.15s;"
      onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='#1e1e1e'">
      <!-- Avatar -->
      <div style="width:44px;height:44px;border-radius:2px;background:#f0a820;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.9rem;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">${avatarInitial(p.name)}</div>
      <!-- Info -->
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;">
          <div>
            <h3 style="font-size:0.9rem;font-weight:700;color:#f0f0f0;margin:0 0 2px;letter-spacing:-0.01em;">${p.name}</h3>
            <span style="font-size:0.68rem;color:#444;">${p.tribe} · ${p.district} · ${p.era}</span>
          </div>
          <span style="font-size:0.6rem;font-weight:700;padding:3px 8px;border-radius:2px;flex-shrink:0;background:${col.bg};color:${col.text};white-space:nowrap;">${p.category}</span>
        </div>
        <p style="font-size:0.78rem;color:#555;margin:6px 0 10px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.bio}</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="vote-btn ${voted ? 'voted' : ''}" data-id="${p.id}" onclick="event.stopPropagation()">
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/>
            </svg>
            <span class="vote-count-${p.id}">${p.votes}</span>
          </button>
          <span style="font-size:0.7rem;color:#333;">Click for details</span>
        </div>
      </div>
    </article>
  `;
}

// ─── HOF ARCHIVE PAGE ─────────────────────────────────────────────────────

async function initArchive(data) {
  let currentCat = 'all';
  let currentSort = 'votes';
  let searchQuery = '';

  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  if (urlCat) {
    currentCat = urlCat;
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const active = btn.dataset.cat === urlCat;
      btn.classList.toggle('active', active);
    });
  }

  function render() {
    let list = [...data.hallOfFame];
    if (currentCat !== 'all') list = list.filter(p => p.category === currentCat);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tribe.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.achievements.some(a => a.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (currentSort === 'votes') list.sort((a, b) => b.votes - a.votes);
    else if (currentSort === 'nameAsc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (currentSort === 'nameDesc') list.sort((a, b) => b.name.localeCompare(a.name));

    const grid = document.getElementById('hofGrid');
    const empty = document.getElementById('hofEmpty');
    const count = document.getElementById('resultsCount');
    if (count) count.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'} found`;
    if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    grid.innerHTML = list.map(p => renderHofRow(p)).join('');
    attachHofListeners(data.hallOfFame);
    fadein(grid);
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCat = btn.dataset.cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCat));
      render();
    });
  });
  const se = document.getElementById('hofSearch');
  if (se) se.addEventListener('input', e => { searchQuery = e.target.value.trim(); render(); });
  const so = document.getElementById('hofSort');
  if (so) so.addEventListener('change', e => { currentSort = e.target.value; render(); });

  render();
  initHofModal(data.hallOfFame);
}

function attachHofListeners(allEntries) {
  document.querySelectorAll('.hof-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.vote-btn')) return;
      const entry = allEntries.find(p => p.id === card.dataset.id);
      if (entry) openHofModal(entry);
    });
  });
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const entry = allEntries.find(p => p.id === id);
      if (!entry) return;
      if (castVote(id)) {
        entry.votes++;
        document.querySelectorAll(`.vote-count-${id}`).forEach(el => el.textContent = entry.votes);
        document.querySelectorAll(`.vote-btn[data-id="${id}"]`).forEach(b => b.classList.add('voted'));
        const mvc = document.getElementById('modalVoteCount');
        if (mvc && document.getElementById('hofModal')?.dataset.openId === id) {
          mvc.textContent = entry.votes;
          updateModalVoteBtn(id);
        }
      }
    });
  });
}

let _modalEntry = null;

function initHofModal(allEntries) {
  const modal = document.getElementById('hofModal');
  if (!modal) return;
  document.getElementById('modalClose')?.addEventListener('click', closeHofModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeHofModal(); });
  document.getElementById('modalVoteBtn')?.addEventListener('click', () => {
    if (!_modalEntry) return;
    if (castVote(_modalEntry.id)) {
      _modalEntry.votes++;
      document.getElementById('modalVoteCount').textContent = _modalEntry.votes;
      updateModalVoteBtn(_modalEntry.id);
      document.querySelectorAll(`.vote-count-${_modalEntry.id}`).forEach(el => el.textContent = _modalEntry.votes);
      document.querySelectorAll(`.vote-btn[data-id="${_modalEntry.id}"]`).forEach(b => b.classList.add('voted'));
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHofModal(); });
}

function openHofModal(entry) {
  _modalEntry = entry;
  const modal = document.getElementById('hofModal');
  const col = catCol(entry.category);
  modal.dataset.openId = entry.id;
  document.getElementById('modalCategory').textContent = `${entry.category} · ${entry.subcategory}`;
  document.getElementById('modalName').textContent = entry.name;
  document.getElementById('modalMeta').textContent = `${entry.tribe} · ${entry.district} · ${entry.era}`;
  document.getElementById('modalBio').textContent = entry.bio;
  document.getElementById('modalVoteCount').textContent = entry.votes;
  document.getElementById('modalAvatar').textContent = avatarInitial(entry.name);
  document.getElementById('modalTags').innerHTML = entry.tags.map(t =>
    `<span style="font-size:0.62rem;font-weight:600;padding:3px 8px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${t}</span>`
  ).join('');
  document.getElementById('modalAchievements').innerHTML = entry.achievements.map(a =>
    `<li style="display:flex;align-items:flex-start;gap:8px;font-size:0.82rem;color:#888;"><span style="color:#f0a820;flex-shrink:0;margin-top:2px;">✦</span>${a}</li>`
  ).join('');
  updateModalVoteBtn(entry.id);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function updateModalVoteBtn(id) {
  const btn = document.getElementById('modalVoteBtn');
  const txt = document.getElementById('modalVoteBtnText');
  if (!btn || !txt) return;
  if (hasVoted(id)) { btn.classList.add('voted'); txt.textContent = 'Voted'; btn.disabled = true; }
  else { btn.classList.remove('voted'); txt.textContent = 'Upvote'; btn.disabled = false; }
}

function closeHofModal() {
  const modal = document.getElementById('hofModal');
  if (modal) { modal.style.display = 'none'; modal.dataset.openId = ''; document.body.style.overflow = ''; _modalEntry = null; }
}

// ─── DIRECTORY PAGE ───────────────────────────────────────────────────────

async function initDirectory(data) {
  let currentCat = 'all';
  let currentSort = 'featured';
  let searchQuery = '';

  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  if (urlCat) {
    currentCat = urlCat;
    document.querySelectorAll('.biz-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === urlCat);
    });
  }

  function render() {
    let list = [...data.businesses];
    if (currentCat !== 'all') list = list.filter(b => b.category === currentCat);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.owner.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (currentSort === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    else if (currentSort === 'nameAsc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (currentSort === 'newest') list.sort((a, b) => b.founded - a.founded);
    else if (currentSort === 'oldest') list.sort((a, b) => a.founded - b.founded);

    const grid = document.getElementById('bizGrid');
    const empty = document.getElementById('bizEmpty');
    const count = document.getElementById('bizResultsCount');
    if (count) count.textContent = `${list.length} business${list.length === 1 ? '' : 'es'} found`;
    if (!list.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    grid.innerHTML = list.map(b => renderBizRow(b)).join('');
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
  const se = document.getElementById('bizSearch');
  if (se) se.addEventListener('input', e => { searchQuery = e.target.value.trim(); render(); });
  const so = document.getElementById('bizSort');
  if (so) so.addEventListener('change', e => { currentSort = e.target.value; render(); });

  render();
  initBizModal(data.businesses);
}

function renderBizRow(b) {
  const col = catCol(b.category, BIZ_CAT_COLORS);
  return `
    <article class="biz-card" data-id="${b.id}" data-fade
      style="background:#111;border:1px solid #1e1e1e;${b.featured ? 'border-left:2px solid #f0a820;' : ''}padding:14px 16px;display:flex;align-items:flex-start;gap:14px;cursor:pointer;transition:border-color 0.15s;"
      onmouseover="this.style.borderColor='#2a2a2a'" onmouseout="this.style.borderColor='${b.featured ? '#f0a820' : '#1e1e1e'}'">
      <!-- Logo placeholder -->
      <div style="width:44px;height:44px;border-radius:2px;background:#1a1a1a;border:1px solid #252525;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:#f0a820;flex-shrink:0;">${avatarInitial(b.name)}</div>
      <!-- Info -->
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
    </article>
  `;
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

  function toggleContact(wrapId, linkId, href, text) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (text) {
      wrap.style.display = 'flex';
      const link = document.getElementById(linkId);
      if (link) { link.href = href; link.textContent = text; }
    } else {
      wrap.style.display = 'none';
    }
  }
  toggleContact('bizModalPhone', 'bizModalPhoneLink', `tel:${(biz.phone || '').replace(/\s/g, '')}`, biz.phone);
  toggleContact('bizModalEmail', 'bizModalEmailLink', `mailto:${biz.email || ''}`, biz.email);

  const locWrap = document.getElementById('bizModalLocation');
  if (locWrap) { locWrap.style.display = biz.location ? 'flex' : 'none'; const t = document.getElementById('bizModalLocationText'); if (t) t.textContent = biz.location; }
  const hWrap = document.getElementById('bizModalHours');
  if (hWrap) { hWrap.style.display = biz.hours ? 'flex' : 'none'; const t = document.getElementById('bizModalHoursText'); if (t) t.textContent = biz.hours; }

  document.getElementById('bizModalTags').innerHTML = biz.tags.map(t =>
    `<span style="font-size:0.62rem;font-weight:600;padding:3px 8px;border-radius:2px;background:${col.bg};color:${col.text};letter-spacing:0.06em;">${t}</span>`
  ).join('');

  const webWrap = document.getElementById('bizModalWebsiteWrap');
  const webLink = document.getElementById('bizModalWebsite');
  if (biz.website) {
    webWrap.style.display = 'block';
    webLink.href = `https://${biz.website}`;
  } else {
    webWrap.style.display = 'none';
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeBizModal() {
  const modal = document.getElementById('bizModal');
  if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

(async function init() {
  try {
    const data = await loadData();
    const path = window.location.pathname;
    if (path.includes('archive')) {
      await initArchive(data);
    } else if (path.includes('directory')) {
      await initDirectory(data);
    } else {
      await initIndex(data);
    }
    // Attach HOF card listeners on index page HOF preview
    if (!path.includes('archive') && !path.includes('directory')) {
      attachHofListeners(data.hallOfFame);
      initHofModal(data.hallOfFame);
    }
  } catch (err) {
    console.error('KDMR Media init error:', err);
  }
})();
