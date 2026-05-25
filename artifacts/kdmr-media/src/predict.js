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

// ─── THEMES ──────────────────────────────────────────────────────────────────

const THEMES = {
  Linangkit: {
    bg: '#F3EDDF', text: '#1C1B17',
    font: 'Georgia,"Times New Roman",serif',
    overlay: 'linear-gradient(to top,rgba(28,27,23,0.72),transparent)',
    swatch: '#F3EDDF',
  },
  Bobohizan: {
    bg: '#1A1612', text: '#F3EDDF',
    font: '"Helvetica Neue",Arial,sans-serif',
    overlay: 'linear-gradient(to top,rgba(0,0,0,0.80),transparent)',
    swatch: '#1A1612',
  },
  Sirih: {
    bg: '#8C2A26', text: '#F3EDDF',
    font: 'Georgia,"Times New Roman",serif',
    overlay: 'linear-gradient(to top,rgba(80,0,0,0.78),transparent)',
    swatch: '#8C2A26',
  },
  Padi: {
    bg: '#BE8E3C', text: '#1A1612',
    font: 'Georgia,"Times New Roman",serif',
    overlay: 'linear-gradient(to top,rgba(80,40,0,0.72),transparent)',
    swatch: '#BE8E3C',
  },
  Hutan: {
    bg: '#2E4234', text: '#F3EDDF',
    font: '"Helvetica Neue",Arial,sans-serif',
    overlay: 'linear-gradient(to top,rgba(0,20,8,0.80),transparent)',
    swatch: '#2E4234',
  },
};
let currentTheme = 'Bobohizan';

// ─── INIT ────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data.json');
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
    setupThemes();
    setupNameInput();
    setupDownload();
    setupReset();
    applyTheme('Bobohizan');
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
  const label = c ? branchLabel(c) : '';

  slotEl.classList.toggle('has-contestant', !!c);
  slotEl.classList.remove('highlight');

  if (c) {
    const t = THEMES[currentTheme];
    const overlayBg = t ? t.overlay : 'linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0.4) 50%,transparent)';
    const nameSize  = isTop3 ? '0.64rem' : '0.56rem';
    const branchSize = isTop3 ? '0.52rem' : '0.46rem';

    const mediaHTML = isPlaceholder(c.imageUrl)
      ? `<div class="slot-photo-placeholder" style="width:100%;height:100%;font-size:${isTop3 ? '2rem' : '1.4rem'};">${getInitials(c.name)}</div>`
      : `<img class="slot-photo" src="${c.imageUrl}" alt="${c.name}" style="width:100%;height:100%;" loading="lazy" crossorigin="anonymous" />`;

    inner.innerHTML = `
      <span class="slot-rank-badge ${rankBadgeClass}">${rank}</span>
      <button class="slot-remove" data-html2canvas-ignore="true" title="Remove" aria-label="Remove ${c.name}" onclick="(function(e){e.stopPropagation();window.__predictRemoveSlot(${rank});})(event)">×</button>
      <div style="position:relative;width:100%;aspect-ratio:${aspectRatio};overflow:hidden;border-radius:4px;border:1px solid rgba(255,255,255,0.08);">
        ${mediaHTML}
        <div style="position:absolute;bottom:0;left:0;right:0;padding:18px 5px 5px;background:${overlayBg};text-align:center;z-index:2;">
          <div style="font-size:${nameSize};font-weight:700;color:#fff;line-height:1.25;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,0.9);">${c.name}</div>
          <div style="font-size:${branchSize};color:rgba(255,255,255,0.72);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:0.07em;margin-top:1px;">${label}</div>
        </div>
      </div>`;
  } else {
    inner.innerHTML = `
      <div class="slot-empty-content" data-html2canvas-ignore="true" style="aspect-ratio:${aspectRatio};">
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

// ─── THEME ENGINE ─────────────────────────────────────────────────────────────

function applyTheme(themeName) {
  const t = THEMES[themeName];
  if (!t) return;
  currentTheme = themeName;

  const stage = document.getElementById('exportStage');
  if (stage) {
    stage.style.background = t.bg;
    stage.style.color = t.text;
    stage.style.fontFamily = t.font;
  }

  const tmpl = document.getElementById('renderTemplate');
  if (tmpl) {
    tmpl.style.background = t.bg;
    tmpl.style.color = t.text;
  }

  document.querySelectorAll('.theme-btn').forEach(btn => {
    const active = btn.dataset.theme === themeName;
    btn.style.borderColor = active ? '#f0a820' : '#2a2a2a';
    btn.style.background   = active ? 'rgba(240,168,32,0.1)' : 'transparent';
    btn.style.color        = active ? '#f0f0f0' : '#666';
    btn.style.boxShadow    = active ? '0 0 0 2px rgba(240,168,32,0.15)' : 'none';
  });

  const swatch = document.getElementById('themePreview');
  if (swatch) {
    swatch.style.background = t.bg;
    swatch.style.border = '1px solid rgba(255,255,255,0.1)';
  }
}

function setupThemes() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

// ─── NAME INPUT ───────────────────────────────────────────────────────────────

function setupNameInput() {
  const input = document.getElementById('predictionName');
  if (!input) return;
  input.addEventListener('input', () => {
    const name = input.value.trim();
    const titleEl = document.getElementById('posterTitle');
    if (titleEl) {
      titleEl.textContent = name ? `Predicted by ${name}` : 'My Top 7 Prediction';
    }
    const renderTitleEl = document.getElementById('renderTitle');
    if (renderTitleEl) {
      renderTitleEl.textContent = name ? `${name.toUpperCase()}'S TOP 7` : 'PREDICTION';
    }
  });
}

// ─── DOWNLOAD — html2canvas on #renderTemplate ────────────────────────────────

function setupDownload() {
  document.getElementById('downloadBtn').addEventListener('click', downloadPrediction);
}

async function downloadPrediction() {
  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"/></svg> Generating…`;

  try {
    // Populate the off-screen render template with current slot data
    RANKS.forEach(r => {
      const c = slots[r];
      const imgEl   = document.getElementById(`renderImg${r}`);
      const nameEl  = document.getElementById(`renderName${r}`);
      const distEl  = document.getElementById(`renderDist${r}`);
      const emptyEl = document.getElementById(`renderEmpty${r}`);

      if (imgEl) {
        if (c && !isPlaceholder(c.imageUrl)) {
          imgEl.src = c.imageUrl;
          imgEl.style.display = 'block';
          if (emptyEl) emptyEl.style.display = 'none';
        } else {
          imgEl.src = '';
          imgEl.style.display = 'none';
          if (emptyEl) emptyEl.style.display = 'flex';
        }
      }
      if (nameEl) nameEl.textContent = c ? c.name : '—';
      if (distEl) distEl.textContent = c ? branchLabel(c) : '—';
    });

    // Allow browser to paint updated images before capture
    await new Promise(resolve => setTimeout(resolve, 500));

    const target = document.getElementById('renderTemplate');
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
    });

    const link = document.createElement('a');
    link.download = 'my-kaamatan-prediction.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

  } catch (e) {
    console.error('[predict] download failed:', e);
    alert('Could not generate image.\n\n' + (e?.message || 'Unknown error') + '\n\nTip: screenshot the page as a fallback.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download My Prediction`;
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
init();
