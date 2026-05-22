// predict.js — Top 7 Prediction module
import html2canvas from 'html2canvas';

const RANKS = [1, 2, 3, 4, 5, 6, 7];
const PLACEHOLDER_IMG = '/images/placeholder-winner.png';
const SAMPLE_IMG = '/images/Sample UN Winner.png';

let allContestants = [];
let filteredContestants = [];
let slots = {};
let selectedContestant = null;

RANKS.forEach(r => { slots[r] = null; });

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch('./data.json');
    const data = await res.json();
    allContestants = (data.winners || [])
      .filter(w => w.year === 2026 && w.award === 'Unduk Ngadau')
      .sort((a, b) => {
        const aOut = a.branch !== 'KDCA Sabah';
        const bOut = b.branch !== 'KDCA Sabah';
        if (aOut !== bOut) return aOut ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    filteredContestants = [...allContestants];
    renderPool();
    setupSlotListeners();
    setupSearch();
    setupDownload();
    setupReset();
  } catch (e) {
    document.getElementById('poolGrid').innerHTML =
      '<div class="pool-empty" style="color:#c0160e;">Failed to load contestants. Please refresh.</div>';
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function isPlaceholder(imageUrl) {
  if (!imageUrl) return true;
  if (imageUrl === PLACEHOLDER_IMG) return true;
  if (imageUrl === SAMPLE_IMG) return true;
  return false;
}

function branchLabel(c) {
  return c.branch === 'KDCA Sabah' ? (c.district || 'Sabah') : c.branch;
}

// ─── POOL RENDERING ──────────────────────────────────────────────────────────

function renderPool() {
  const grid = document.getElementById('poolGrid');
  const count = document.getElementById('poolCount');

  count.textContent = `(${filteredContestants.length} of ${allContestants.length})`;

  if (filteredContestants.length === 0) {
    grid.innerHTML = '<div class="pool-empty">No contestants match your search.</div>';
    return;
  }

  const placedIds = new Set(Object.values(slots).filter(Boolean).map(c => c.id));
  const isSelected = (c) => selectedContestant && selectedContestant.id === c.id;

  grid.innerHTML = filteredContestants.map(c => {
    const placed = placedIds.has(c.id);
    const selected = isSelected(c);
    const classes = ['contestant-card', placed ? 'placed' : '', selected ? 'selected' : ''].filter(Boolean).join(' ');
    const imgHTML = isPlaceholder(c.imageUrl)
      ? `<div class="card-photo-placeholder">${getInitials(c.name)}</div>`
      : `<img class="card-photo" src="${c.imageUrl}" alt="${c.name}" loading="lazy" />`;

    return `<div class="${classes}" data-id="${c.id}" role="button" tabindex="0" aria-label="Select ${c.name}">
      ${imgHTML}
      <div class="card-info">
        <div class="card-name">${c.name}</div>
        <div class="card-branch">${branchLabel(c)}</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.contestant-card').forEach(card => {
    card.addEventListener('click', () => onCardClick(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onCardClick(card.dataset.id); });
  });
}

// ─── SELECTION ───────────────────────────────────────────────────────────────

function onCardClick(id) {
  const c = allContestants.find(w => w.id === id);
  if (!c) return;
  const placedIds = new Set(Object.values(slots).filter(Boolean).map(w => w.id));
  if (placedIds.has(id)) return;

  if (selectedContestant && selectedContestant.id === id) { deselect(); return; }

  selectedContestant = c;
  showSelectedIndicator(c);

  const nextEmpty = RANKS.find(r => !slots[r]);
  if (nextEmpty !== undefined) {
    placeInSlot(nextEmpty, c);
    deselect();
    return;
  }
  renderPool();
}

function deselect() {
  selectedContestant = null;
  hideSelectedIndicator();
  renderPool();
  RANKS.forEach(r => { const s = document.getElementById(`slot-${r}`); if (s) s.classList.remove('highlight'); });
}

function showSelectedIndicator(c) {
  const el = document.getElementById('selectedIndicator');
  document.getElementById('selectedLabel').textContent = `Selected: ${c.name}`;
  el.classList.add('visible');
  RANKS.forEach(r => { const s = document.getElementById(`slot-${r}`); if (s && !slots[r]) s.classList.add('highlight'); });
}

function hideSelectedIndicator() {
  document.getElementById('selectedIndicator').classList.remove('visible');
}

// ─── SLOT LOGIC ──────────────────────────────────────────────────────────────

function setupSlotListeners() {
  RANKS.forEach(r => {
    const slotEl = document.getElementById(`slot-${r}`);
    if (!slotEl) return;
    slotEl.addEventListener('click', (e) => {
      if (e.target.closest('.slot-remove')) return;
      onSlotClick(r);
    });
  });
  document.getElementById('deselectBtn').addEventListener('click', deselect);
}

function onSlotClick(rank) {
  if (selectedContestant) {
    if (slots[rank] && slots[rank].id === selectedContestant.id) { deselect(); return; }
    placeInSlot(rank, selectedContestant);
    deselect();
  } else {
    if (slots[rank]) {
      const c = slots[rank];
      removeFromSlot(rank);
      selectedContestant = c;
      showSelectedIndicator(c);
      renderPool();
    }
  }
}

function placeInSlot(rank, contestant) {
  RANKS.forEach(r => { if (slots[r] && slots[r].id === contestant.id) slots[r] = null; });
  slots[rank] = contestant;
  renderSlot(rank);
  renderPool();
}

function removeFromSlot(rank) {
  slots[rank] = null;
  renderSlot(rank);
  renderPool();
}

function renderSlot(rank) {
  const inner = document.getElementById(`slot-inner-${rank}`);
  const slotEl = document.getElementById(`slot-${rank}`);
  if (!inner || !slotEl) return;

  const c = slots[rank];
  const isTop3 = rank <= 3;
  const aspectRatio = isTop3 ? '3/4' : '2/3';
  const defaultIcons = { 1: '🏆', 2: '👑', 3: '🥉', 4: '✨', 5: '✨', 6: '✨', 7: '✨' };
  const defaultLabels = { 1: '1st — Champion', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th' };
  const rankBadgeClass = rank === 1 ? 'slot-rank-1' : rank === 2 ? 'slot-rank-2' : rank === 3 ? 'slot-rank-3' : 'slot-rank-other';
  const label = c ? branchLabel(c) : '';

  slotEl.classList.toggle('has-contestant', !!c);
  slotEl.classList.remove('highlight');

  if (c) {
    const imgHTML = isPlaceholder(c.imageUrl)
      ? `<div class="slot-photo-placeholder" style="aspect-ratio:${aspectRatio};font-size:${isTop3 ? '2rem' : '1.4rem'};">${getInitials(c.name)}</div>`
      : `<img class="slot-photo" src="${c.imageUrl}" alt="${c.name}" style="aspect-ratio:${aspectRatio};" loading="lazy" />`;

    inner.innerHTML = `
      <span class="slot-rank-badge ${rankBadgeClass}">${rank}</span>
      <button class="slot-remove" title="Remove" aria-label="Remove ${c.name}" onclick="(function(e){e.stopPropagation();window.__predictRemoveSlot(${rank});})(event)">×</button>
      ${imgHTML}
      <div class="slot-name-bar">
        <div class="slot-name">${c.name}</div>
        <div class="slot-branch">${label}</div>
      </div>`;
  } else {
    inner.innerHTML = `
      <div class="slot-empty-content" style="aspect-ratio:${aspectRatio};">
        <div class="slot-empty-icon">${defaultIcons[rank]}</div>
        <div class="slot-empty-label">${defaultLabels[rank]}</div>
      </div>`;
  }
}

window.__predictRemoveSlot = removeFromSlot;

// ─── SEARCH ──────────────────────────────────────────────────────────────────

function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    filteredContestants = q
      ? allContestants.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.branch || '').toLowerCase().includes(q) ||
          (c.district || '').toLowerCase().includes(q) ||
          (c.tribe || '').toLowerCase().includes(q))
      : [...allContestants];
    renderPool();
  });
}

// ─── RESET ───────────────────────────────────────────────────────────────────

function setupReset() {
  document.getElementById('resetBtn').addEventListener('click', () => {
    RANKS.forEach(r => { slots[r] = null; renderSlot(r); });
    deselect();
  });
}

// ─── SHARE CARD TEMPLATE — populate on demand ─────────────────────────────────
// Rank metadata for styling each row

const RANK_META = {
  1: { accent: '#f0a820', numColor: '#f0a820', label: 'CHAMPION', labelColor: '#5a3800', nameSize: '22px', branchColor: '#6a4800' },
  2: { accent: '#b8b8bc', numColor: '#b8b8bc', label: '2ND',      labelColor: '#404040', nameSize: '20px', branchColor: '#484848' },
  3: { accent: '#a07840', numColor: '#a07840', label: '3RD',      labelColor: '#4a3010', nameSize: '20px', branchColor: '#4a3010' },
  4: { accent: '#2e2e2e', numColor: '#3e3e3e', label: '4TH',      labelColor: '#2e2e2e', nameSize: '19px', branchColor: '#333' },
  5: { accent: '#2e2e2e', numColor: '#3e3e3e', label: '5TH',      labelColor: '#2e2e2e', nameSize: '19px', branchColor: '#333' },
  6: { accent: '#2e2e2e', numColor: '#3e3e3e', label: '6TH',      labelColor: '#2e2e2e', nameSize: '19px', branchColor: '#333' },
  7: { accent: '#2e2e2e', numColor: '#3e3e3e', label: '7TH',      labelColor: '#2e2e2e', nameSize: '19px', branchColor: '#333' },
};

const DEFAULT_NAMES = {
  1: 'Champion',       2: '2nd Runner-Up', 3: '3rd Runner-Up',
  4: '4th Place',      5: '5th Place',     6: '6th Place',     7: '7th Place',
};
const DEFAULT_ICONS = { 1: '🏆', 2: '👑', 3: '🥉', 4: '✦', 5: '✦', 6: '✦', 7: '✦' };

function populateShareTemplate() {
  RANKS.forEach(rank => {
    const c = slots[rank];
    const meta = RANK_META[rank];

    const row    = document.getElementById(`sc-row-${rank}`);
    const photoEl = document.getElementById(`sc-photo-${rank}`);
    const initEl  = document.getElementById(`sc-init-${rank}`);
    const nameEl  = document.getElementById(`sc-name-${rank}`);
    const branchEl = document.getElementById(`sc-branch-${rank}`);

    if (!row || !photoEl || !initEl || !nameEl || !branchEl) return;

    // Apply rank-specific accent and text colors
    row.style.borderLeftColor = meta.accent;
    nameEl.style.fontSize = meta.nameSize;
    branchEl.style.color = meta.branchColor;

    if (c) {
      if (!isPlaceholder(c.imageUrl)) {
        photoEl.src = c.imageUrl;
        photoEl.style.display = 'block';
        initEl.style.display = 'none';
      } else {
        photoEl.src = '';
        photoEl.style.display = 'none';
        initEl.textContent = getInitials(c.name);
        initEl.style.color = meta.accent;
        initEl.style.display = 'flex';
      }
      nameEl.textContent = c.name;
      branchEl.textContent = branchLabel(c);
    } else {
      photoEl.src = '';
      photoEl.style.display = 'none';
      initEl.textContent = DEFAULT_ICONS[rank];
      initEl.style.color = meta.numColor;
      initEl.style.display = 'flex';
      nameEl.textContent = DEFAULT_NAMES[rank];
      branchEl.textContent = '— empty —';
    }
  });
}

// ─── DOWNLOAD (html2canvas on #shareCardTemplate) ─────────────────────────────

function setupDownload() {
  document.getElementById('downloadBtn').addEventListener('click', downloadPrediction);
}

async function downloadPrediction() {
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"/></svg> Generating…`;

  // 1. Populate the template with current slot data
  populateShareTemplate();

  const template = document.getElementById('shareCardTemplate');

  // 2. Pre-fetch visible cross-origin photos as blob URLs (avoids canvas taint)
  const imgs = Array.from(template.querySelectorAll('img[crossorigin]'));
  const blobMap = new Map();

  await Promise.all(imgs.map(async img => {
    const src = img.getAttribute('src');
    if (!src || img.style.display === 'none') return;
    if (src.startsWith('data:') || src.startsWith('blob:')) return;
    if (src.endsWith('.svg')) return; // same-origin SVGs are safe
    try {
      const resp = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobMap.set(img, { original: src, blobUrl });
      img.src = blobUrl;
    } catch { /* leave as-is, html2canvas will try useCORS */ }
  }));

  try {
    // 3. Capture the template
    const canvas = await html2canvas(template, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      width: 1080,
      height: 1350,
      backgroundColor: '#0a0800',
      logging: false,
      imageTimeout: 12000,
    });

    // 4. Trigger download
    const link = document.createElement('a');
    link.download = 'my-kdmr-un2026-prediction.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    alert('Could not generate image. Please try again.');
    console.error('[predict] html2canvas error:', e);
  } finally {
    // Restore original src values and revoke blob URLs
    blobMap.forEach(({ original, blobUrl }, img) => {
      img.src = original;
      URL.revokeObjectURL(blobUrl);
    });

    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download My Prediction`;
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
init();
