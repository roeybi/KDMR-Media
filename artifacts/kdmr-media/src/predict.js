// predict.js — Top 7 Prediction module
import html2canvas from 'html2canvas';

const RANKS = [1, 2, 3, 4, 5, 6, 7];
const RANK_LABELS = { 1: 'Champion', 2: '2nd Runner-Up', 3: '3rd Runner-Up', 4: '4th', 5: '5th', 6: '6th', 7: '7th' };
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
    updateShareCard();
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
  updateShareCard();
}

function removeFromSlot(rank) {
  slots[rank] = null;
  renderSlot(rank);
  renderPool();
  updateShareCard();
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
    updateShareCard();
  });
}

// ─── SHARE CARD (html2canvas target) ─────────────────────────────────────────
// Fixed 1080×1350px (4:5) container, always mirrors live slots.
// Positioned off-screen; html2canvas renders it for download.

function scSlotHTML(rank, topRow) {
  const c = slots[rank];
  const label = c ? branchLabel(c) : '';

  // Dimensions per position
  const dims = {
    1: { photoH: 308, nameH: 60, fontSize: 15, subSize: 12 },
    2: { photoH: 268, nameH: 60, fontSize: 14, subSize: 11 },
    3: { photoH: 268, nameH: 60, fontSize: 14, subSize: 11 },
  };
  const d = dims[rank] || { photoH: 216, nameH: 56, fontSize: 13, subSize: 11 };
  const totalH = d.photoH + d.nameH;

  const badgeColors = { 1: '#f0a820', 2: '#d4d4d8', 3: '#a87239' };
  const badgeBg = badgeColors[rank] || '#1e1e1e';
  const badgeFg = badgeColors[rank] ? '#0a0a0a' : '#666';
  const badgeSize = rank <= 3 ? 24 : 20;

  let photoSection;
  if (c && !isPlaceholder(c.imageUrl)) {
    photoSection = `<div style="width:100%;height:${d.photoH}px;overflow:hidden;position:relative;background:#0d0800;">
      <img src="${c.imageUrl}" crossorigin="anonymous"
        style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;" />
    </div>`;
  } else if (c) {
    photoSection = `<div style="width:100%;height:${d.photoH}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#1a1000,#0d0800);">
      <span style="font-size:${Math.round(d.photoH * 0.22)}px;font-weight:900;color:#f0a820;">${getInitials(c.name)}</span>
    </div>`;
  } else {
    const icons = { 1: '🏆', 2: '👑', 3: '🥉', 4: '✨', 5: '✨', 6: '✨', 7: '✨' };
    const labels = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th' };
    photoSection = `<div style="width:100%;height:${d.photoH}px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d0d0d;gap:8px;">
      <span style="font-size:${rank <= 3 ? 28 : 22}px;opacity:0.4;">${icons[rank]}</span>
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2a2a2a;">${labels[rank]}</span>
    </div>`;
  }

  const nameSection = c
    ? `<div style="padding:10px 10px 12px;background:#111;border-top:1px solid #1e1e1e;">
        <div style="font-size:${d.fontSize}px;font-weight:700;color:#e8e8e8;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;">${c.name}</div>
        <div style="font-size:${d.subSize}px;color:#555;margin-top:3px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${label}</div>
      </div>`
    : `<div style="padding:10px 10px 12px;background:#0d0d0d;border-top:1px solid #181818;">
        <div style="font-size:${d.subSize}px;font-weight:600;color:#222;letter-spacing:0.06em;text-transform:uppercase;">Empty</div>
      </div>`;

  const marginTop = topRow ? (rank === 1 ? '0' : `${308 - d.photoH}px`) : '0';

  return `<div style="flex:1;margin-top:${marginTop};position:relative;border-radius:5px;overflow:hidden;border:1px solid ${c ? '#1e1e1e' : '#161616'};">
    <div style="position:absolute;top:8px;left:8px;z-index:2;width:${badgeSize}px;height:${badgeSize}px;border-radius:50%;background:${badgeBg};display:flex;align-items:center;justify-content:center;font-size:${Math.round(badgeSize * 0.52)}px;font-weight:900;color:${badgeFg};box-shadow:0 2px 8px rgba(0,0,0,0.6);">${rank}</div>
    ${photoSection}
    ${nameSection}
  </div>`;
}

function updateShareCard() {
  const card = document.getElementById('shareCard');
  if (!card) return;

  const platformColors = { 1: '#f0a820', 2: '#c8c8cc', 3: '#a07040' };
  const platformH = { 1: 50, 2: 36, 3: 26 };
  const platformLabel = { 1: 'CHAMPION', 2: '2ND RUNNER-UP', 3: '3RD RUNNER-UP' };

  // Top 3 platform bars (rendered as flex row matching the slot order: 2,1,3)
  const platformsHTML = [2, 1, 3].map(r => {
    const col = platformColors[r];
    const h = platformH[r];
    const lbl = platformLabel[r];
    return `<div style="flex:1;height:${h}px;background:#141414;border-top:3px solid ${col};display:flex;align-items:center;justify-content:center;align-self:flex-end;">
      <span style="font-size:10px;font-weight:800;letter-spacing:0.1em;color:${col};">${lbl}</span>
    </div>`;
  }).join('<div style="width:10px;flex-shrink:0;"></div>');

  // Bottom 4 slots
  const bottomHTML = [4, 5, 6, 7].map(r => scSlotHTML(r, false)).join('');

  card.innerHTML = `
    <div style="position:relative;width:1080px;height:1350px;overflow:hidden;font-family:Inter,'Helvetica Neue',Arial,sans-serif;background:#0a0a0a;box-sizing:border-box;">

      <!-- Diagonal grid texture -->
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent,transparent 52px,rgba(240,168,32,0.014) 52px,rgba(240,168,32,0.014) 53px);pointer-events:none;"></div>

      <!-- Radial glow -->
      <div style="position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:900px;height:700px;background:radial-gradient(ellipse,rgba(240,168,32,0.10) 0%,transparent 65%);pointer-events:none;"></div>

      <!-- Bottom vignette -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(transparent,rgba(0,0,0,0.5));pointer-events:none;"></div>

      <!-- Gold top accent bar -->
      <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#c07800,#f0a820 30%,#ffd060 50%,#f0a820 70%,#c07800);"></div>

      <!-- Header -->
      <div style="position:relative;z-index:1;padding:54px 64px 0 64px;">

        <!-- Logo row -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <img src="/mark-color.svg" width="38" height="38" crossorigin="anonymous" style="display:block;flex-shrink:0;" />
          <span style="font-size:19px;font-weight:800;color:#f0f0f0;letter-spacing:-0.01em;">KDMR<span style="color:#f0a820;">·</span>MEDIA</span>
          <div style="flex:1;"></div>
          <span style="font-size:11px;font-weight:600;color:#2a2a2a;letter-spacing:0.06em;">kdmrmedia.com</span>
        </div>

        <!-- Eyebrow + title -->
        <div style="font-size:12px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#f0a820;margin-bottom:10px;">Unduk Ngadau 2026 — Top 7 Prediction</div>
        <div style="font-size:50px;font-weight:900;color:#f0f0f0;letter-spacing:-0.04em;line-height:1.0;margin-bottom:6px;">My Prediction</div>
        <div style="font-size:13px;color:#383838;font-weight:500;letter-spacing:0.02em;">Pick your champions. Share your prediction.</div>
      </div>

      <!-- Gold divider -->
      <div style="position:relative;z-index:1;margin:24px 64px 26px;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(240,168,32,0.6) 15%,rgba(240,168,32,0.6) 85%,transparent);"></div>
      </div>

      <!-- Podium — top 3 (order: 2nd | 1st | 3rd) -->
      <div style="position:relative;z-index:1;display:flex;align-items:flex-end;gap:10px;padding:0 64px;">
        ${scSlotHTML(2, true)}
        ${scSlotHTML(1, true)}
        ${scSlotHTML(3, true)}
      </div>

      <!-- Platform bars -->
      <div style="position:relative;z-index:1;display:flex;align-items:flex-end;gap:10px;padding:0 64px;margin-bottom:18px;">
        ${platformsHTML}
      </div>

      <!-- Bottom 4 -->
      <div style="position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:0 64px;margin-bottom:0;">
        ${bottomHTML}
      </div>

      <!-- Footer -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:68px;background:#080808;border-top:1px solid #141414;display:flex;align-items:center;justify-content:space-between;padding:0 64px;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="/mark-color.svg" width="22" height="22" crossorigin="anonymous" style="display:block;opacity:0.7;" />
          <span style="font-size:13px;font-weight:800;color:#f0a820;letter-spacing:0.02em;">KDMR MEDIA</span>
          <span style="font-size:12px;color:#2a2a2a;margin-left:4px;">· The Voice of Borneo's Indigenous Peoples</span>
        </div>
        <span style="font-size:12px;color:#2a2a2a;letter-spacing:0.04em;">kdmrmedia.com</span>
      </div>
    </div>`;
}

// ─── DOWNLOAD (html2canvas) ───────────────────────────────────────────────────

function setupDownload() {
  document.getElementById('downloadBtn').addEventListener('click', downloadPrediction);
}

async function downloadPrediction() {
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"/></svg> Generating…`;

  const card = document.getElementById('shareCard');

  // Pre-load all cross-origin images as blob object URLs
  // so html2canvas sees same-origin URLs and doesn't hit CORS issues.
  const imgs = card.querySelectorAll('img[crossorigin]');
  const blobMap = new Map(); // original src → blob URL

  await Promise.all(Array.from(imgs).map(async img => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    // Skip same-origin SVG (mark-color.svg) — html2canvas handles these fine
    if (src.endsWith('.svg')) return;
    try {
      const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) return;
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      blobMap.set(src, blobUrl);
      img.src = blobUrl;
    } catch {
      // If CORS fetch fails, leave as-is — html2canvas will use allowTaint
    }
  }));

  try {
    const canvas = await html2canvas(card.firstElementChild, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      width: 1080,
      height: 1350,
      backgroundColor: '#0a0a0a',
      logging: false,
      imageTimeout: 10000,
      onclone: (_doc, el) => {
        el.style.display = 'block';
      },
    });

    const link = document.createElement('a');
    link.download = 'my-unduk-ngadau-top7.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    alert('Could not generate image. Please try again.');
    console.error(e);
  } finally {
    // Restore original src values and revoke blob URLs
    imgs.forEach(img => {
      const blobUrl = blobMap.get(img.dataset.originalSrc || '');
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    });
    blobMap.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));

    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download My Prediction`;
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
init();
