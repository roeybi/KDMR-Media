// predict.js — Top 7 Prediction module
// No external screenshot library — card drawn directly with Canvas 2D API

const RANKS = [1, 2, 3, 4, 5, 6, 7];
const PLACEHOLDER_IMG = '/images/placeholder-winner.png';
const SAMPLE_IMG = '/images/Sample UN Winner.png';
// No html2canvas dependency — card is drawn with Canvas 2D API

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

// ─── DOWNLOAD — pure Canvas 2D (no html2canvas, bulletproof on iOS) ──────────

function setupDownload() {
  document.getElementById('downloadBtn').addEventListener('click', downloadPrediction);
}

async function downloadPrediction() {
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"/></svg> Generating…`;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1350;

    // ── Helpers ──────────────────────────────────────────
    const FONT = '"SF Pro Display", "Helvetica Neue", Arial, sans-serif';
    const fitText = (text, maxWidth, font) => {
      ctx.font = font;
      if (ctx.measureText(text).width <= maxWidth) return text;
      let truncated = text;
      while (truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth) truncated = truncated.slice(0, -1);
      return truncated + '…';
    };

    // ── Background ────────────────────────────────────────
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(0, 0, W, H);
    // Subtle grain (simplified for canvas)
    ctx.globalAlpha = 0.02;
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = '#f0a820';
      const x = Math.random() * W, y = Math.random() * H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 80, y + 60); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Top gold bar ───────────────────────────────────────
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, '#c07800');
    goldGrad.addColorStop(0.28, '#f0a820');
    goldGrad.addColorStop(0.5, '#ffd060');
    goldGrad.addColorStop(0.72, '#f0a820');
    goldGrad.addColorStop(1, '#c07800');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, W, 5);

    // ── Load assets ──────────────────────────────────────────────
    const loadImg = (src, useCors) => new Promise((resolve) => {
      const img = new Image();
      if (useCors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

    // Logo (same-origin SVG — no crossOrigin)
    const logoImg = await loadImg('/mark-color.svg', false);

    // Pre-load all contestant photos in parallel
    const photoPromises = RANKS.map(async rank => {
      const c = slots[rank];
      if (!c || isPlaceholder(c.imageUrl)) return { rank, img: null };
      const img = await loadImg(c.imageUrl, true);
      return { rank, img };
    });
    const photoMap = new Map((await Promise.all(photoPromises)).map(p => [p.rank, p.img]));

    // ── Header (86px) ────────────────────────────────────────────
    if (logoImg) {
      ctx.drawImage(logoImg, 60, 22, 42, 42);
    } else {
      ctx.save();
      ctx.translate(81, 43); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f0a820'; ctx.fillRect(-14, -14, 28, 28);
      ctx.restore();
    }
    ctx.fillStyle = '#f0f0f0';
    ctx.font = `900 19px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('KDMR·MEDIA', 116, 43);
    ctx.fillStyle = '#2c1e00';
    ctx.font = `700 9px ${FONT}`;
    ctx.fillText('CULTURAL ARCHIVE · SABAH', 116, 58);
    ctx.fillStyle = '#2c1e00';
    ctx.textAlign = 'right';
    ctx.font = `800 10px ${FONT}`;
    ctx.fillText('UNDUK NGADAU 2026', 1020, 43);
    ctx.textAlign = 'left';

    // Gold divider
    ctx.fillStyle = goldGrad;
    ctx.fillRect(60, 86, 960, 3);

    // ── Title block (135px) ───────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0a820';
    ctx.font = `800 11px ${FONT}`;
    ctx.fillText('My Top 7', 540, 117);
    ctx.fillStyle = '#f0f0f0';
    ctx.font = `900 52px ${FONT}`;
    ctx.fillText('PREDICTION', 540, 158);
    ctx.fillStyle = '#2c1e00';
    ctx.font = `11px ${FONT}`;
    ctx.fillText('Unduk Ngadau 2026 State Finals · kdmrmedia.com', 540, 192);

    // Thin separator
    ctx.fillStyle = '#1e1200';
    ctx.fillRect(60, 221, 960, 1);

    // ── Rows (7×148 + 6×1 = 1042px) ─────────────────────────
    const ROW_META = {
      1: { accent: '#f0a820', num: '#f0a820', label: 'CHAMP', labelColor: '#5a3800', name: 22, branch: '#6a4800', bg: '#1a1000' },
      2: { accent: '#b8b8bc', num: '#b8b8bc', label: '2ND',   labelColor: '#404040', name: 20, branch: '#484848', bg: '#111111' },
      3: { accent: '#a07840', num: '#a07840', label: '3RD',   labelColor: '#4a3010', name: 20, branch: '#4a3010', bg: '#131008' },
      4: { accent: '#2e2e2e', num: '#3e3e3e', label: '4TH',   labelColor: '#2e2e2e', name: 19, branch: '#333',     bg: '#0e0e0e' },
      5: { accent: '#2e2e2e', num: '#3e3e3e', label: '5TH',   labelColor: '#2e2e2e', name: 19, branch: '#333',     bg: '#0e0e0e' },
      6: { accent: '#2e2e2e', num: '#3e3e3e', label: '6TH',   labelColor: '#2e2e2e', name: 19, branch: '#333',     bg: '#0e0e0e' },
      7: { accent: '#2e2e2e', num: '#3e3e3e', label: '7TH',   labelColor: '#2e2e2e', name: 19, branch: '#333',     bg: '#0e0e0e' },
    };
    const DEFAULT_NAMES = {
      1: 'Champion', 2: '2nd Runner-Up', 3: '3rd Runner-Up',
      4: '4th Place', 5: '5th Place', 6: '6th Place', 7: '7th Place',
    };
    const DEFAULT_ICONS = { 1: '🏆', 2: '👑', 3: '🥉', 4: '✦', 5: '✦', 6: '✦', 7: '✦' };

    let y = 222;
    const maxNameWidth = 1080 - 88 - 112 - 20 - 56 - 18;

    for (const rank of RANKS) {
      const c = slots[rank];
      const m = ROW_META[rank];
      const rowH = 148;

      // Left accent
      ctx.fillStyle = m.accent;
      ctx.fillRect(0, y, 4, rowH);

      // Rank number
      ctx.fillStyle = m.num;
      ctx.font = `900 38px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(rank), 48, y + rowH / 2);

      // Rank label
      ctx.fillStyle = m.labelColor;
      ctx.font = `800 8px ${FONT}`;
      ctx.textBaseline = 'top';
      ctx.fillText(m.label, 48, y + rowH / 2 + 14);

      // Photo box
      const px = 88, py = y + 18, pSize = 112;
      ctx.fillStyle = m.bg;
      ctx.fillRect(px, py, pSize, pSize);

      const photoImg = photoMap.get(rank);
      if (photoImg) {
        // Crop to square top-center
        const s = Math.min(photoImg.width, photoImg.height);
        const sx = (photoImg.width - s) / 2;
        const sy = 0;
        ctx.drawImage(photoImg, sx, sy, s, s, px, py, pSize, pSize);
      } else {
        // Initials / emoji fallback
        const fallback = c ? getInitials(c.name) : DEFAULT_ICONS[rank];
        ctx.fillStyle = c ? m.accent : m.num;
        ctx.font = `800 ${c ? 36 : 24}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallback, px + pSize / 2, py + pSize / 2 + 2);
      }

      // Name
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#f0f0f0';
      const nameText = fitText(c ? c.name : DEFAULT_NAMES[rank], maxNameWidth, `800 ${m.name}px ${FONT}`);
      ctx.font = `800 ${m.name}px ${FONT}`;
      ctx.fillText(nameText, px + pSize + 20, y + 20);

      // Branch
      ctx.fillStyle = m.branch;
      ctx.font = `500 13px ${FONT}`;
      ctx.fillText(c ? branchLabel(c) : '— empty —', px + pSize + 20, y + 20 + m.name + 7);

      // Separator
      if (rank < 7) {
        ctx.fillStyle = '#160e00';
        ctx.fillRect(4, y + rowH, 1076, 1);
      }

      y += rowH + 1;
    }

    // Bottom gold divider
    ctx.fillStyle = goldGrad;
    ctx.fillRect(60, y, 960, 3);

    // ── Footer (80px) ─────────────────────────────────────────────
    const fy = y + 3 + 40;
    if (logoImg) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(logoImg, 60, fy - 14, 28, 28);
      ctx.globalAlpha = 1;
    } else {
      ctx.save(); ctx.translate(74, fy); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f0a820'; ctx.fillRect(-9, -9, 18, 18); ctx.restore();
    }
    ctx.fillStyle = '#f0a820';
    ctx.font = `900 14px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('KDMR MEDIA', 98, fy);
    ctx.fillStyle = '#2c1e00';
    ctx.font = `9px ${FONT}`;
    ctx.fillText('Cultural Archive · Sabah, Borneo', 98, fy + 16);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2c1e00';
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText('kdmrmedia.com', 1020, fy);

    // ── Download ───────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = 'my-kdmr-un2026-prediction.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (e) {
    console.error('[predict] canvas draw failed:', e);
    alert('Could not generate image: ' + (e?.message || 'unknown error') + '\n\nPlease screenshot the page as a fallback.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download My Prediction`;
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
init();
