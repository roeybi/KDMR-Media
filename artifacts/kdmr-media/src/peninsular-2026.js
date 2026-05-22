// Peninsular Malaysia Champions 2026 — page script
// Groups 2026 diaspora winners by KDCA branch, showing all 3 award categories

const PENINSULAR_BRANCHES = [
  'KDCA Klang Valley',
  'KDCA Putrajaya',
  'KDCA Johor',
  'KDCA Johor Bahru',
  'KDCA Melaka',
  'KDCA WP Labuan',
  'KDCA Pulau Pinang',
  'KDCA Perak',
  'KDCA Selangor'
];

const BRANCH_ORDER = {
  'KDCA Klang Valley': 1,
  'KDCA Putrajaya': 2,
  'KDCA Selangor': 3,
  'KDCA Johor': 4,
  'KDCA Johor Bahru': 5,
  'KDCA Pulau Pinang': 6,
  'KDCA Perak': 7,
  'KDCA Melaka': 8,
  'KDCA WP Labuan': 9
};

const AWARD_META = {
  'Unduk Ngadau':  { key: 'un',  color: '#f0a820', label: 'Unduk Ngadau', page: '/unduk-ngadau/' },
  'MRK':           { key: 'mrk', color: '#4ade80', label: 'MRK',          page: '/mrk/' },
  'Sugandoi':      { key: 'sg',  color: '#60a5fa', label: 'Sugandoi',     page: '/sugandoi/' }
};

function initials(name) {
  if (!name || name.toLowerCase().includes('tba') || name.toLowerCase().includes('coming soon')) return '--';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isPlaceholder(url) {
  return !url || url.includes('placeholder') || url.includes('Sample');
}

function avatarHTML(winner) {
  if (isPlaceholder(winner.imageUrl)) {
    return `<div class="pm-avatar-placeholder">${initials(winner.name)}</div>`;
  }
  return `<img class="pm-avatar" src="${winner.imageUrl}" alt="${winner.name}" loading="lazy" />`;
}

function champCellHTML(winner, awardKey) {
  const meta = AWARD_META[Object.keys(AWARD_META).find(k => AWARD_META[k].key === awardKey)];
  if (!winner) {
    return `
      <div class="pm-champ-cell">
        <span class="pm-award-label ${awardKey}">${meta.label}</span>
        <div class="pm-avatar-placeholder">--</div>
        <p class="pm-name tba">TBA</p>
        <p class="pm-tribe">Coming Soon</p>
      </div>`;
  }
  const isTBA = !winner.name || winner.name.toLowerCase().includes('coming soon') || winner.name.toLowerCase().includes('tba');
  const page = isTBA ? '#' : meta.page + `?tab=${encodeURIComponent('Peninsular Malaysia')}`;
  const disabled = isTBA ? ' disabled' : '';
  const nameClass = isTBA ? 'pm-name tba' : 'pm-name';
  const displayName = isTBA ? 'TBA — Coming Soon' : winner.name;
  return `
    <div class="pm-champ-cell">
      <span class="pm-award-label ${awardKey}">${meta.label}</span>
      <a href="${page}" class="pm-link${disabled}">
        ${avatarHTML(winner)}
        <p class="${nameClass}">${displayName}</p>
      </a>
      <p class="pm-tribe">${winner.tribe || 'KDMR'}</p>
    </div>`;
}

function renderCard(branch, winnersByAward) {
  const awards = ['Unduk Ngadau', 'MRK', 'Sugandoi'];
  const branchShort = branch.replace('KDCA ', '');
  const cells = awards.map(a => {
    const w = winnersByAward[a]?.[0];
    const key = AWARD_META[a].key;
    return champCellHTML(w, key);
  }).join('');

  return `
    <div class="pm-card">
      <div class="pm-title-row">
        <span class="pm-badge">KDCA</span>
        <h3>${branchShort}</h3>
        <span class="pm-branch">${branch}</span>
      </div>
      <div class="pm-champ-grid">
        ${cells}
      </div>
    </div>`;
}

async function init() {
  try {
    const res = await fetch('./data.json');
    const data = await res.json();

    // Filter 2026 Peninsular winners
    const all = data.winners.filter(w =>
      w.year === 2026 && PENINSULAR_BRANCHES.includes(w.branch)
    );

    // Group by branch, then by award
    const byBranch = {};
    for (const w of all) {
      if (!byBranch[w.branch]) byBranch[w.branch] = {};
      if (!byBranch[w.branch][w.award]) byBranch[w.branch][w.award] = [];
      byBranch[w.branch][w.award].push(w);
    }

    // Sort branches by defined order
    const sortedBranches = Object.keys(byBranch).sort((a, b) =>
      (BRANCH_ORDER[a] || 99) - (BRANCH_ORDER[b] || 99)
    );

    const grid = document.getElementById('pmGrid');
    if (!grid) return;

    grid.innerHTML = sortedBranches.map(b => renderCard(b, byBranch[b])).join('');

    // Toast helper
    window.showToast = (msg) => {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(() => { t.style.opacity = '0'; }, 2200);
    };

  } catch (err) {
    console.error('Peninsular 2026 init failed:', err);
    const grid = document.getElementById('pmGrid');
    if (grid) {
      grid.innerHTML = '<p style="text-align:center;color:#555;padding:40px;">Unable to load champion data. Please refresh.</p>';
    }
  }
}

init();
