/**
 * KDMR Media — script.js
 * Handles: data loading, search, filtering, sorting, voting, and rendering
 * for all three pages (index, archive, directory).
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const DATA_URL = './data.json';
const VOTES_KEY = 'kdmr_votes';

// ─── Data loading ────────────────────────────────────────────────────────────

async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('Failed to load data.json');
  return res.json();
}

// ─── Vote helpers (localStorage) ─────────────────────────────────────────────

function getVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

function hasVoted(id) {
  return !!getVotes()[id];
}

function castVote(id) {
  if (hasVoted(id)) return false;
  const votes = getVotes();
  votes[id] = true;
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  return true;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Politics':       { bg: '#dbeafe', text: '#1e40af' },
  'Arts & Culture': { bg: '#fce7f3', text: '#9d174d' },
  'Sports':         { bg: '#d1fae5', text: '#065f46' },
  'Education':      { bg: '#ede9fe', text: '#5b21b6' },
  'Entrepreneurship': { bg: '#fef3c7', text: '#92400e' },
};

const BIZ_CATEGORY_COLORS = {
  'Food & Beverage':     { bg: '#fef3c7', text: '#92400e' },
  'Arts & Crafts':       { bg: '#fce7f3', text: '#9d174d' },
  'Tourism & Hospitality': { bg: '#dbeafe', text: '#1e40af' },
  'Health & Wellness':   { bg: '#d1fae5', text: '#065f46' },
  'Agriculture':         { bg: '#dcfce7', text: '#166534' },
  'Education':           { bg: '#ede9fe', text: '#5b21b6' },
};

function catStyle(cat, map = CATEGORY_COLORS) {
  return map[cat] || { bg: '#f0e8d8', text: '#1c0f00' };
}

function avatarInitial(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Page detection ───────────────────────────────────────────────────────────

const PAGE = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

// ─── INDEX PAGE ──────────────────────────────────────────────────────────────

async function initIndex(data) {
  // Stats
  const s = data.stats;
  animateCount('statHof', s.hofEntries);
  animateCount('statBiz', s.businesses);
  animateCount('statTribes', s.tribesRepresented);
  animateCount('statDistricts', s.districtsRepresented);

  // News feed
  const feed = document.getElementById('newsFeed');
  if (feed) {
    feed.innerHTML = data.news.map(item => `
      <article class="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow" style="border-color:#e8d9c4;" data-fade>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold" style="background:#f0e8d8;color:#1c0f00;">${item.category}</span>
          <span class="text-xs text-gray-400">${formatDate(item.date)}</span>
          <span class="text-xs text-gray-300">·</span>
          <span class="text-xs text-gray-400">${item.source}</span>
        </div>
        <h3 class="font-semibold text-base leading-snug mb-1" style="font-family:'Playfair Display',serif;">${item.headline}</h3>
        <p class="text-sm text-gray-600 leading-relaxed">${item.summary}</p>
      </article>
    `).join('');
    animateFadeIn(feed);
  }

  // Top voted HOF
  const topVotedEl = document.getElementById('topVoted');
  if (topVotedEl) {
    const sorted = [...data.hallOfFame].sort((a, b) => b.votes - a.votes).slice(0, 4);
    topVotedEl.innerHTML = sorted.map((p, i) => `
      <div class="flex items-center gap-3 p-3 rounded-lg bg-white border hover:shadow-sm transition-shadow" style="border-color:#e8d9c4;" data-fade>
        <span class="text-sm font-bold w-5 text-center flex-shrink-0" style="color:#d4890a;">${i + 1}</span>
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style="background:#1a4436;">${avatarInitial(p.name)}</div>
        <div class="min-w-0">
          <div class="text-sm font-semibold truncate">${p.name}</div>
          <div class="text-xs text-gray-400">${p.tribe} · ${p.votes} votes</div>
        </div>
      </div>
    `).join('');
    animateFadeIn(topVotedEl);
  }

  // Featured business (random featured)
  const featured = data.businesses.filter(b => b.featured);
  const biz = featured[Math.floor(Math.random() * featured.length)];
  const featuredEl = document.getElementById('featuredBusiness');
  if (featuredEl && biz) {
    const col = catStyle(biz.category, BIZ_CATEGORY_COLORS);
    featuredEl.innerHTML = `
      <div class="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow" style="border-color:#e8d9c4;" data-fade>
        <div class="h-2" style="background:#b84c28;"></div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2" style="background:${col.bg};color:${col.text};">${biz.category}</span>
              <h3 class="font-bold text-base" style="font-family:'Playfair Display',serif;">${biz.name}</h3>
            </div>
            ${biz.verified ? '<span class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full" style="background:#d4f0e4;color:#1a6640;">✓ Verified</span>' : ''}
          </div>
          <p class="text-xs text-gray-500 mb-2">📍 ${biz.location}</p>
          <p class="text-sm text-gray-600 leading-relaxed">${biz.description.slice(0, 130)}…</p>
        </div>
      </div>
    `;
    animateFadeIn(featuredEl);
  }

  // HOF preview (top 3 by votes, excluding top-voted-sidebar ones)
  const hofPreviewEl = document.getElementById('hofPreview');
  if (hofPreviewEl) {
    const preview = [...data.hallOfFame]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 6)
      .slice(0, 3);
    hofPreviewEl.innerHTML = preview.map(p => renderHofCard(p)).join('');
    attachHofCardListeners(data.hallOfFame, data);
    animateFadeIn(hofPreviewEl);
  }
}

// ─── HALL OF FAME PAGE ────────────────────────────────────────────────────────

async function initArchive(data) {
  let currentCategory = 'all';
  let currentSort = 'votes';
  let searchQuery = '';

  // Pre-populate category from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  if (urlCat) {
    currentCategory = urlCat;
    document.querySelectorAll('.filter-pill').forEach(btn => {
      const active = btn.dataset.cat === urlCat;
      btn.style.background = active ? '#1a4436' : '#f0e8d8';
      btn.style.color = active ? '#fff' : '#1c0f00';
    });
  }

  function render() {
    let list = [...data.hallOfFame];

    // Filter by category
    if (currentCategory !== 'all') {
      list = list.filter(p => p.category === currentCategory);
    }

    // Filter by search
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

    // Sort
    if (currentSort === 'votes') {
      list.sort((a, b) => b.votes - a.votes);
    } else if (currentSort === 'nameAsc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'nameDesc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    }

    const grid = document.getElementById('hofGrid');
    const empty = document.getElementById('hofEmpty');
    const count = document.getElementById('resultsCount');

    if (count) count.textContent = `${list.length} entr${list.length === 1 ? 'y' : 'ies'} found`;

    if (list.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = list.map(p => renderHofCard(p)).join('');
    attachHofCardListeners(data.hallOfFame, data);
    animateFadeIn(grid);
  }

  // Category pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.cat;
      document.querySelectorAll('.filter-pill').forEach(b => {
        const active = b.dataset.cat === currentCategory;
        b.style.background = active ? '#1a4436' : '#f0e8d8';
        b.style.color = active ? '#fff' : '#1c0f00';
      });
      render();
    });
  });

  // Search
  const searchEl = document.getElementById('hofSearch');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      render();
    });
  }

  // Sort
  const sortEl = document.getElementById('hofSort');
  if (sortEl) {
    sortEl.addEventListener('change', e => {
      currentSort = e.target.value;
      render();
    });
  }

  render();

  // Modal
  initHofModal(data.hallOfFame);
}

function renderHofCard(p) {
  const col = catStyle(p.category);
  const voted = hasVoted(p.id);
  return `
    <article class="hof-card bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer group" style="border-color:#e8d9c4;" data-id="${p.id}" data-fade>
      <div class="h-1.5" style="background:#1a4436;"></div>
      <div class="p-5">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm group-hover:scale-105 transition-transform" style="background:#1a4436;">${avatarInitial(p.name)}</div>
          <div class="min-w-0">
            <h3 class="font-bold text-base leading-snug" style="font-family:'Playfair Display',serif;">${p.name}</h3>
            <p class="text-xs text-gray-400 mt-0.5">${p.tribe} · ${p.district}</p>
          </div>
        </div>
        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3" style="background:${col.bg};color:${col.text};">${p.category}</span>
        <p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">${p.bio}</p>
        <div class="flex items-center justify-between pt-3 border-t" style="border-color:#f0e8d8;">
          <span class="text-xs text-gray-400">${p.era}</span>
          <button class="vote-inline-btn flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" data-id="${p.id}"
            style="${voted ? 'background:#d4890a;color:#fff;' : 'background:#f0e8d8;color:#1c0f00;'}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/>
            </svg>
            <span class="vote-count-${p.id}">${p.votes}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function attachHofCardListeners(allEntries, data) {
  // Open modal on card click
  document.querySelectorAll('.hof-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.vote-inline-btn')) return;
      const id = card.dataset.id;
      const entry = allEntries.find(p => p.id === id);
      if (entry) openHofModal(entry);
    });
  });

  // Inline vote button
  document.querySelectorAll('.vote-inline-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const entry = allEntries.find(p => p.id === id);
      if (!entry) return;
      if (castVote(id)) {
        entry.votes++;
        const countEl = document.querySelector(`.vote-count-${id}`);
        if (countEl) countEl.textContent = entry.votes;
        btn.style.background = '#d4890a';
        btn.style.color = '#fff';
        // Update modal if open
        const modalVoteCount = document.getElementById('modalVoteCount');
        if (modalVoteCount && document.getElementById('hofModal').dataset.openId === id) {
          modalVoteCount.textContent = entry.votes;
          updateModalVoteBtn(id);
        }
      }
    });
  });
}

let currentModalEntry = null;

function initHofModal(allEntries) {
  const modal = document.getElementById('hofModal');
  if (!modal) return;

  document.getElementById('modalClose')?.addEventListener('click', () => closeHofModal());
  modal.addEventListener('click', e => {
    if (e.target === modal) closeHofModal();
  });

  document.getElementById('modalVoteBtn')?.addEventListener('click', () => {
    if (!currentModalEntry) return;
    if (castVote(currentModalEntry.id)) {
      currentModalEntry.votes++;
      document.getElementById('modalVoteCount').textContent = currentModalEntry.votes;
      updateModalVoteBtn(currentModalEntry.id);
      // Update inline card if visible
      const countEl = document.querySelector(`.vote-count-${currentModalEntry.id}`);
      if (countEl) countEl.textContent = currentModalEntry.votes;
      const inlineBtn = document.querySelector(`.vote-inline-btn[data-id="${currentModalEntry.id}"]`);
      if (inlineBtn) {
        inlineBtn.style.background = '#d4890a';
        inlineBtn.style.color = '#fff';
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeHofModal();
  });
}

function openHofModal(entry) {
  currentModalEntry = entry;
  const modal = document.getElementById('hofModal');
  const col = catStyle(entry.category);

  modal.dataset.openId = entry.id;
  document.getElementById('modalCategory').textContent = `${entry.category} · ${entry.subcategory}`;
  document.getElementById('modalName').textContent = entry.name;
  document.getElementById('modalMeta').textContent = `${entry.tribe} · ${entry.district} · ${entry.era}`;
  document.getElementById('modalBio').textContent = entry.bio;
  document.getElementById('modalVoteCount').textContent = entry.votes;
  document.getElementById('modalAvatar').textContent = avatarInitial(entry.name);

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = entry.tags.map(t =>
    `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium" style="background:${col.bg};color:${col.text};">${t}</span>`
  ).join('');

  const achEl = document.getElementById('modalAchievements');
  achEl.innerHTML = entry.achievements.map(a =>
    `<li class="flex items-start gap-2 text-sm"><span style="color:#d4890a;" class="flex-shrink-0 mt-0.5">✦</span>${a}</li>`
  ).join('');

  updateModalVoteBtn(entry.id);
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function updateModalVoteBtn(id) {
  const btn = document.getElementById('modalVoteBtn');
  const txt = document.getElementById('modalVoteBtnText');
  if (!btn || !txt) return;
  if (hasVoted(id)) {
    btn.style.background = '#d4890a';
    btn.style.color = '#fff';
    txt.textContent = 'Voted';
    btn.disabled = true;
  } else {
    btn.style.background = '#1a4436';
    btn.style.color = '#fff';
    txt.textContent = 'Vote';
    btn.disabled = false;
  }
}

function closeHofModal() {
  const modal = document.getElementById('hofModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.dataset.openId = '';
    document.body.style.overflow = '';
    currentModalEntry = null;
  }
}

// ─── DIRECTORY PAGE ───────────────────────────────────────────────────────────

async function initDirectory(data) {
  let currentCategory = 'all';
  let currentSort = 'featured';
  let searchQuery = '';

  // Pre-populate from URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('category');
  if (urlCat) {
    currentCategory = urlCat;
    document.querySelectorAll('.biz-filter-pill').forEach(btn => {
      const active = btn.dataset.cat === urlCat;
      btn.style.background = active ? '#b84c28' : '#f0e8d8';
      btn.style.color = active ? '#fff' : '#1c0f00';
    });
  }

  function render() {
    let list = [...data.businesses];

    if (currentCategory !== 'all') {
      list = list.filter(b => b.category === currentCategory);
    }

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

    if (currentSort === 'featured') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (currentSort === 'nameAsc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'newest') {
      list.sort((a, b) => b.founded - a.founded);
    } else if (currentSort === 'oldest') {
      list.sort((a, b) => a.founded - b.founded);
    }

    const grid = document.getElementById('bizGrid');
    const empty = document.getElementById('bizEmpty');
    const count = document.getElementById('bizResultsCount');

    if (count) count.textContent = `${list.length} business${list.length === 1 ? '' : 'es'} found`;

    if (list.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = list.map(b => renderBizCard(b)).join('');
    attachBizCardListeners(data.businesses);
    animateFadeIn(grid);
  }

  document.querySelectorAll('.biz-filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.cat;
      document.querySelectorAll('.biz-filter-pill').forEach(b => {
        const active = b.dataset.cat === currentCategory;
        b.style.background = active ? '#b84c28' : '#f0e8d8';
        b.style.color = active ? '#fff' : '#1c0f00';
      });
      render();
    });
  });

  const searchEl = document.getElementById('bizSearch');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      render();
    });
  }

  const sortEl = document.getElementById('bizSort');
  if (sortEl) {
    sortEl.addEventListener('change', e => {
      currentSort = e.target.value;
      render();
    });
  }

  render();
  initBizModal(data.businesses);
}

function renderBizCard(b) {
  const col = catStyle(b.category, BIZ_CATEGORY_COLORS);
  return `
    <article class="biz-card bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer group" style="border-color:#e8d9c4;${b.featured ? 'border-top:3px solid #d4890a;' : ''}" data-id="${b.id}" data-fade>
      ${b.featured ? '<div class="px-5 pt-3 pb-0"><span class="text-xs font-semibold" style="color:#d4890a;">★ Featured</span></div>' : '<div class="h-1.5" style="background:#b84c28;"></div>'}
      <div class="p-5">
        <div class="flex items-start justify-between gap-2 mb-1">
          <h3 class="font-bold text-base leading-snug" style="font-family:'Playfair Display',serif;">${b.name}</h3>
          ${b.verified ? '<span class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full" style="background:#d4f0e4;color:#1a6640;">✓</span>' : ''}
        </div>
        <p class="text-xs text-gray-400 mb-3">📍 ${b.location}</p>
        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3" style="background:${col.bg};color:${col.text};">${b.category}</span>
        <p class="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">${b.description}</p>
        <div class="flex items-center justify-between pt-3 border-t text-xs text-gray-400" style="border-color:#f0e8d8;">
          <span>Est. ${b.founded}</span>
          <span class="text-[#b84c28] font-semibold group-hover:underline">View details →</span>
        </div>
      </div>
    </article>
  `;
}

function attachBizCardListeners(allBiz) {
  document.querySelectorAll('.biz-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const biz = allBiz.find(b => b.id === id);
      if (biz) openBizModal(biz);
    });
  });
}

function initBizModal(allBiz) {
  const modal = document.getElementById('bizModal');
  if (!modal) return;

  document.getElementById('bizModalClose')?.addEventListener('click', () => closeBizModal());
  modal.addEventListener('click', e => {
    if (e.target === modal) closeBizModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeBizModal();
  });
}

function openBizModal(biz) {
  const modal = document.getElementById('bizModal');
  const col = catStyle(biz.category, BIZ_CATEGORY_COLORS);

  document.getElementById('bizModalCategory').textContent = `${biz.category} · ${biz.subcategory}`;
  document.getElementById('bizModalName').textContent = biz.name;
  document.getElementById('bizModalMeta').textContent = `${biz.tribe}-owned · Est. ${biz.founded} · ${biz.owner}`;
  document.getElementById('bizModalDesc').textContent = biz.description;

  const verifiedEl = document.getElementById('bizModalVerified');
  if (biz.verified) {
    verifiedEl.classList.remove('hidden');
    verifiedEl.classList.add('flex');
  } else {
    verifiedEl.classList.add('hidden');
  }

  // Phone
  const phoneWrap = document.getElementById('bizModalPhone');
  if (biz.phone) {
    phoneWrap.classList.remove('hidden');
    phoneWrap.classList.add('flex');
    const phoneLink = document.getElementById('bizModalPhoneLink');
    phoneLink.href = `tel:${biz.phone.replace(/\s/g, '')}`;
    phoneLink.textContent = biz.phone;
  } else {
    phoneWrap.classList.add('hidden');
  }

  // Email
  const emailWrap = document.getElementById('bizModalEmail');
  if (biz.email) {
    emailWrap.classList.remove('hidden');
    emailWrap.classList.add('flex');
    const emailLink = document.getElementById('bizModalEmailLink');
    emailLink.href = `mailto:${biz.email}`;
    emailLink.textContent = biz.email;
  } else {
    emailWrap.classList.add('hidden');
  }

  // Location
  const locWrap = document.getElementById('bizModalLocation');
  if (biz.location) {
    locWrap.classList.remove('hidden');
    locWrap.classList.add('flex');
    document.getElementById('bizModalLocationText').textContent = biz.location;
  }

  // Hours
  const hoursWrap = document.getElementById('bizModalHours');
  if (biz.hours) {
    hoursWrap.classList.remove('hidden');
    hoursWrap.classList.add('flex');
    document.getElementById('bizModalHoursText').textContent = biz.hours;
  }

  // Tags
  const tagsEl = document.getElementById('bizModalTags');
  tagsEl.innerHTML = biz.tags.map(t =>
    `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium" style="background:${col.bg};color:${col.text};">${t}</span>`
  ).join('');

  // Website
  const websiteWrap = document.getElementById('bizModalWebsiteWrap');
  const websiteLink = document.getElementById('bizModalWebsite');
  if (biz.website) {
    websiteWrap.classList.remove('hidden');
    websiteLink.href = `https://${biz.website}`;
    websiteLink.querySelector('span') && (websiteLink.querySelector('span').textContent = 'Visit Website');
  } else {
    websiteWrap.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBizModal() {
  const modal = document.getElementById('bizModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(interval);
  }, 30);
}

function animateFadeIn(container) {
  const items = container.querySelectorAll('[data-fade]');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 60);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

(async function init() {
  try {
    const data = await loadData();
    const page = window.location.pathname;

    if (page.includes('archive')) {
      await initArchive(data);
    } else if (page.includes('directory')) {
      await initDirectory(data);
    } else {
      // Default to index
      await initIndex(data);
    }
  } catch (err) {
    console.error('KDMR Media: Failed to initialise —', err);
  }
})();
