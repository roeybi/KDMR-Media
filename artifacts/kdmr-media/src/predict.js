// predict.js — Top 7 Prediction module

const RANKS = [1, 2, 3, 4, 5, 6, 7];
const RANK_LABELS = { 1: 'Champion', 2: '2nd Runner-Up', 3: '3rd Runner-Up', 4: '4th', 5: '5th', 6: '6th', 7: '7th' };
const PLACEHOLDER_IMG = '/images/placeholder-winner.png';
const SAMPLE_IMG = '/images/Sample UN Winner.png';

let allContestants = [];
let filteredContestants = [];
let slots = {}; // rank → contestant object or null
let selectedContestant = null; // currently picked from pool

RANKS.forEach(r => { slots[r] = null; });

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch('./data.json');
    const data = await res.json();
    allContestants = (data.winners || [])
      .filter(w => w.year === 2026 && w.award === 'Unduk Ngadau')
      .sort((a, b) => {
        // Outstation first, then Sabah districts alphabetically
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

// ─── POOL RENDERING ──────────────────────────────────────────────────────────

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function isPlaceholder(imageUrl) {
  if (!imageUrl) return true;
  if (imageUrl === PLACEHOLDER_IMG) return true;
  if (imageUrl === SAMPLE_IMG) return true;
  return false;
}

function photoHTML(imageUrl, name, cssClass, styleAttr = '') {
  if (!isPlaceholder(imageUrl) && imageUrl) {
    return `<img class="${cssClass}" src="${imageUrl}" alt="${name}" style="${styleAttr}" loading="lazy" />`;
  }
  return `<div class="${cssClass}" style="${styleAttr}"><span>${getInitials(name)}</span></div>`;
}

function renderPool() {
  const grid = document.getElementById('poolGrid');
  const count = document.getElementById('poolCount');

  const visible = filteredContestants;
  count.textContent = `(${visible.length} of ${allContestants.length})`;

  if (visible.length === 0) {
    grid.innerHTML = '<div class="pool-empty">No contestants match your search.</div>';
    return;
  }

  // Figure out which IDs are already placed
  const placedIds = new Set(Object.values(slots).filter(Boolean).map(c => c.id));
  const isSelected = (c) => selectedContestant && selectedContestant.id === c.id;

  grid.innerHTML = visible.map(c => {
    const placed = placedIds.has(c.id);
    const selected = isSelected(c);
    const classes = ['contestant-card', placed ? 'placed' : '', selected ? 'selected' : ''].filter(Boolean).join(' ');
    const imgHTML = photoHTML(c.imageUrl, c.name, isPlaceholder(c.imageUrl) ? 'card-photo-placeholder' : 'card-photo');
    const branchLabel = c.branch === 'KDCA Sabah' ? (c.district || 'Sabah') : c.branch;

    return `<div class="${classes}" data-id="${c.id}" role="button" tabindex="0" aria-label="Select ${c.name}">
      ${imgHTML}
      <div class="card-info">
        <div class="card-name">${c.name}</div>
        <div class="card-branch">${branchLabel}</div>
      </div>
    </div>`;
  }).join('');

  // Bind click events
  grid.querySelectorAll('.contestant-card').forEach(card => {
    card.addEventListener('click', () => onCardClick(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onCardClick(card.dataset.id); });
  });
}

// ─── SELECTION LOGIC ─────────────────────────────────────────────────────────

function onCardClick(id) {
  const c = allContestants.find(w => w.id === id);
  if (!c) return;

  // If already placed, do nothing
  const placedIds = new Set(Object.values(slots).filter(Boolean).map(w => w.id));
  if (placedIds.has(id)) return;

  // Toggle selection
  if (selectedContestant && selectedContestant.id === id) {
    deselect();
    return;
  }

  selectedContestant = c;
  showSelectedIndicator(c);

  // Auto-place into next empty slot
  const nextEmpty = RANKS.find(r => !slots[r]);
  if (nextEmpty !== undefined) {
    placeInSlot(nextEmpty, c);
    deselect();
    return;
  }

  // All slots full — keep selected so user can pick a slot to swap
  renderPool();
}

function deselect() {
  selectedContestant = null;
  hideSelectedIndicator();
  renderPool();
  // Remove all slot highlights
  RANKS.forEach(r => {
    const slot = document.getElementById(`slot-${r}`);
    if (slot) slot.classList.remove('highlight');
  });
}

function showSelectedIndicator(c) {
  const el = document.getElementById('selectedIndicator');
  const label = document.getElementById('selectedLabel');
  label.textContent = `Selected: ${c.name}`;
  el.classList.add('visible');

  // Highlight empty slots
  RANKS.forEach(r => {
    const slot = document.getElementById(`slot-${r}`);
    if (slot && !slots[r]) slot.classList.add('highlight');
  });
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
      // Don't trigger if clicking the remove button
      if (e.target.closest('.slot-remove')) return;
      onSlotClick(r);
    });
  });

  document.getElementById('deselectBtn').addEventListener('click', deselect);
}

function onSlotClick(rank) {
  if (selectedContestant) {
    // Place selected contestant here, possibly swapping
    const existing = slots[rank];
    if (existing && existing.id === selectedContestant.id) {
      // Clicking the same person's slot — deselect
      deselect();
      return;
    }
    // If slot is occupied, move existing back to pool (remove placed state)
    placeInSlot(rank, selectedContestant);
    deselect();
  } else {
    // No selection: clicking occupied slot selects that person to reorder
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
  // If contestant is already in another slot, clear that slot first
  RANKS.forEach(r => {
    if (slots[r] && slots[r].id === contestant.id) {
      slots[r] = null;
    }
  });
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
  const branchLabel = c ? (c.branch === 'KDCA Sabah' ? (c.district || 'Sabah') : c.branch) : '';

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
        <div class="slot-branch">${branchLabel}</div>
      </div>`;
  } else {
    inner.innerHTML = `
      <div class="slot-empty-content" style="aspect-ratio:${aspectRatio};">
        <div class="slot-empty-icon">${defaultIcons[rank]}</div>
        <div class="slot-empty-label">${defaultLabels[rank]}</div>
      </div>`;
  }
}

// Expose remove handler for inline onclick
window.__predictRemoveSlot = removeFromSlot;

// ─── SEARCH ──────────────────────────────────────────────────────────────────

function setupSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      filteredContestants = [...allContestants];
    } else {
      filteredContestants = allContestants.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.branch || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q) ||
        (c.tribe || '').toLowerCase().includes(q)
      );
    }
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

// ─── DOWNLOAD (Canvas API) ───────────────────────────────────────────────────

function setupDownload() {
  document.getElementById('downloadBtn').addEventListener('click', downloadPrediction);
}

async function downloadPrediction() {
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.textContent = 'Generating…';

  try {
    const canvas = document.createElement('canvas');
    const W = 1080, H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Gold top accent bar
    ctx.fillStyle = '#f0a820';
    ctx.fillRect(0, 0, W, 6);

    // Subtle radial glow at top
    const grd = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 480);
    grd.addColorStop(0, 'rgba(240,168,32,0.09)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#f0a820';
    ctx.font = '600 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNDUK NGADAU 2026', W / 2, 68);

    ctx.fillStyle = '#f0f0f0';
    ctx.font = '900 72px Inter, sans-serif';
    ctx.fillText('MY TOP 7', W / 2, 152);

    ctx.fillStyle = '#2a2a2a';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText('kdmrmedia.com', W / 2, 192);

    // Divider
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 215);
    ctx.lineTo(W - 60, 215);
    ctx.stroke();

    // Load images for placed slots (with CORS fallback)
    const slotData = await Promise.all(RANKS.map(async r => {
      const c = slots[r];
      if (!c) return { rank: r, contestant: null, img: null };
      let img = null;
      if (!isPlaceholder(c.imageUrl) && c.imageUrl) {
        img = await loadImage(c.imageUrl).catch(() => null);
      }
      return { rank: r, contestant: c, img };
    }));

    // Layout constants
    const PAD = 40;
    const TOP3_Y = 230;
    const TOP3_H = 360; // card photo height
    const TOP3_W = 270;
    const BOTTOM_Y = TOP3_Y + TOP3_H + 110;
    const BOTTOM_H = 240;
    const BOTTOM_W = (W - PAD * 2 - 12 * 3) / 4;

    // Positions for top 3: [2nd, 1st, 3rd]
    const top3Layout = [
      { rank: 2, x: PAD,                          w: TOP3_W - 20, h: TOP3_H - 30 },
      { rank: 1, x: PAD + TOP3_W - 20 + 12,       w: TOP3_W + 40, h: TOP3_H },
      { rank: 3, x: PAD + TOP3_W - 20 + 12 + TOP3_W + 40 + 12, w: TOP3_W - 20, h: TOP3_H - 30 },
    ];

    // Draw top 3
    for (const layout of top3Layout) {
      const entry = slotData.find(s => s.rank === layout.rank);
      drawSlotCard(ctx, layout.x, TOP3_Y + (TOP3_H - layout.h), layout.w, layout.h, layout.rank, entry);
    }

    // Podium platforms under top 3
    const platformColors = { 1: '#f0a820', 2: '#d4d4d8', 3: '#a87239' };
    for (const layout of top3Layout) {
      const col = platformColors[layout.rank] || '#222';
      const ph = layout.rank === 1 ? 52 : layout.rank === 2 ? 38 : 28;
      const py = TOP3_Y + TOP3_H + 8;
      ctx.fillStyle = '#141414';
      ctx.fillRect(layout.x, py, layout.w, ph);
      ctx.fillStyle = col;
      ctx.fillRect(layout.x, py, layout.w, 4);
      ctx.fillStyle = col;
      ctx.font = '800 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = layout.rank === 1 ? 'CHAMPION' : layout.rank === 2 ? '2ND' : '3RD';
      ctx.fillText(label, layout.x + layout.w / 2, py + ph / 2 + 6);
    }

    // Draw bottom 4
    for (let i = 0; i < 4; i++) {
      const rank = i + 4;
      const x = PAD + i * (BOTTOM_W + 12);
      const entry = slotData.find(s => s.rank === rank);
      drawSlotCard(ctx, x, BOTTOM_Y, BOTTOM_W, BOTTOM_H, rank, entry);
    }

    // Footer
    const footerY = BOTTOM_Y + BOTTOM_H + 48;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, footerY, W, H - footerY);

    ctx.fillStyle = '#f0a820';
    ctx.font = '800 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KDMR MEDIA', W / 2, footerY + 44);

    ctx.fillStyle = '#333';
    ctx.font = '500 20px Inter, sans-serif';
    ctx.fillText('The Voice of Borneo\'s Indigenous Peoples', W / 2, footerY + 76);

    ctx.fillStyle = '#222';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillText('kdmrmedia.com  ·  Unduk Ngadau 2026', W / 2, footerY + 108);

    // Download
    const link = document.createElement('a');
    link.download = 'my-top7-prediction-unduk-ngadau-2026.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    alert('Could not generate image. Please try again.');
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download My Prediction`;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawSlotCard(ctx, x, y, w, h, rank, entry) {
  const c = entry ? entry.contestant : null;
  const img = entry ? entry.img : null;
  const radius = 6;

  // Card background
  ctx.save();
  roundRect(ctx, x, y, w, h);
  ctx.fillStyle = c ? '#111' : '#0d0d0d';
  ctx.fill();
  ctx.strokeStyle = c ? '#222' : '#181818';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (c) {
    // Photo / initials area
    const photoH = Math.round(h * 0.72);
    ctx.save();
    roundRect(ctx, x, y, w, photoH, radius, 0); // clip top corners only
    ctx.clip();

    if (img) {
      // Draw image, cover-fit
      const srcRatio = img.naturalWidth / img.naturalHeight;
      const dstRatio = w / photoH;
      let sw, sh, sx, sy;
      if (srcRatio > dstRatio) {
        sh = img.naturalHeight;
        sw = sh * dstRatio;
        sy = 0;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sw = img.naturalWidth;
        sh = sw / dstRatio;
        sx = 0;
        sy = 0; // top-align (face at top)
      }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, photoH);
    } else {
      // Initials
      const grad = ctx.createLinearGradient(x, y, x, y + photoH);
      grad.addColorStop(0, '#1a1000');
      grad.addColorStop(1, '#0f0800');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, photoH);
      ctx.fillStyle = '#f0a820';
      ctx.font = `900 ${Math.round(w * 0.28)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getInitials(c.name), x + w / 2, y + photoH / 2);
    }
    ctx.restore();

    // Rank badge
    const badgeColors = { 1: '#f0a820', 2: '#d4d4d8', 3: '#a87239' };
    const badgeBg = badgeColors[rank] || '#1e1e1e';
    const badgeText = badgeColors[rank] ? '#0a0a0a' : '#888';
    const badgeR = Math.round(w * 0.11);
    ctx.save();
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.arc(x + 14 + badgeR, y + 14 + badgeR, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = badgeText;
    ctx.font = `900 ${Math.round(badgeR * 1.0)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rank), x + 14 + badgeR, y + 14 + badgeR);
    ctx.restore();

    // Name / branch text area
    const textY = y + photoH + 8;
    ctx.fillStyle = '#e0e0e0';
    ctx.font = `700 ${Math.round(w * 0.09)}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const nameFontSize = Math.round(w * 0.09);
    const maxNameW = w - 16;
    let name = c.name;
    // Truncate if too wide
    while (ctx.measureText(name).width > maxNameW && name.length > 4) {
      name = name.slice(0, -1);
    }
    if (name !== c.name) name += '…';
    ctx.fillText(name, x + 8, textY);

    const branchLabel = c.branch === 'KDCA Sabah' ? (c.district || 'Sabah') : c.branch;
    ctx.fillStyle = '#555';
    ctx.font = `500 ${Math.round(w * 0.075)}px Inter, sans-serif`;
    let branch = branchLabel;
    while (ctx.measureText(branch).width > maxNameW && branch.length > 4) {
      branch = branch.slice(0, -1);
    }
    if (branch !== branchLabel) branch += '…';
    ctx.fillText(branch, x + 8, textY + nameFontSize + 4);
  } else {
    // Empty slot
    ctx.fillStyle = '#222';
    ctx.font = `700 ${Math.round(w * 0.09)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(RANK_LABELS[rank] || String(rank), x + w / 2, y + h / 2 - 10);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `500 ${Math.round(w * 0.08)}px Inter, sans-serif`;
    ctx.fillText('Empty', x + w / 2, y + h / 2 + 16);
  }
}

function roundRect(ctx, x, y, w, h, trRadius = 6, brRadius = 6) {
  const r = trRadius;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - brRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - brRadius, y + h);
  ctx.lineTo(x + brRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - brRadius);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── START ───────────────────────────────────────────────────────────────────
init();
