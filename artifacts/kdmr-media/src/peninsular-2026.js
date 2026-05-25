// Peninsular Malaysia Champions 2026
// Renders branch sections with portrait cards — same style as Sabah grid

const PENINSULAR_BRANCHES = [
  'KDCA Klang Valley',
  'KDCA Putrajaya',
  'KDCA Selangor',
  'KDCA Johor',
  'KDCA Johor Bahru',
  'KDCA Pulau Pinang',
  'KDCA Perak',
  'KDCA Melaka',
  'KDCA WP Labuan'
];

const BRANCH_ORDER = {
  'KDCA Klang Valley': 1,
  'KDCA Putrajaya':    2,
  'KDCA Selangor':     3,
  'KDCA Johor':        4,
  'KDCA Johor Bahru':  5,
  'KDCA Pulau Pinang': 6,
  'KDCA Perak':        7,
  'KDCA Melaka':       8,
  'KDCA WP Labuan':    9
};

const AWARDS = [
  { key: 'Unduk Ngadau', cls: 'un',  short: 'UN',  label: 'Unduk Ngadau', page: '/unduk-ngadau/' },
  { key: 'MRK',          cls: 'mrk', short: 'MRK', label: 'Mr. Kaamatan', page: '/mrk/'          },
  { key: 'Sugandoi',     cls: 'sg',  short: 'SG',  label: 'Sugandoi',     page: '/sugandoi/'     }
];

function initials(name) {
  if (!name || /tba|coming soon/i.test(name)) return '--';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hasRealPhoto(url) {
  return url && !url.includes('placeholder') && !url.includes('Sample');
}

function cardHTML(winner, award) {
  const isTBA = !winner;
  const name    = isTBA ? 'Coming Soon' : winner.name;
  const tribe   = isTBA ? '' : (winner.tribe || '');
  const imgUrl  = isTBA ? null : (hasRealPhoto(winner.imageUrl) ? winner.imageUrl : null);
  const inits   = initials(name);
  const linkable = !isTBA && imgUrl !== null || (!isTBA && winner.name && !/tba|coming soon/i.test(winner.name));
  const href    = linkable ? `${award.page}?tab=${encodeURIComponent('Peninsular Malaysia')}` : null;

  const photoInner = imgUrl
    ? `<img src="${imgUrl}" alt="${name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
       <div class="pm-card-initials" style="display:none">${inits}</div>`
    : `<div class="pm-card-initials">${inits}</div>`;

  const cardClasses = ['pm-card', isTBA ? 'tba-card' : 'is-link'].filter(Boolean).join(' ');

  const inner = `
    <div class="pm-card-photo">
      ${photoInner}
      <div class="pm-card-award-badge ${award.cls}">${award.short}</div>
    </div>
    <div class="pm-card-info">
      <div class="pm-card-name${isTBA ? ' tba' : ''}">${name}</div>
      <div class="pm-card-award-label ${award.cls}">${award.label}</div>
      ${tribe ? `<div class="pm-card-tribe">${tribe}</div>` : ''}
    </div>`;

  if (href) {
    return `<a href="${href}" class="${cardClasses}" style="text-decoration:none;">${inner}</a>`;
  }
  return `<div class="${cardClasses}">${inner}</div>`;
}

function sectionHTML(branch, byAward) {
  const branchShort = branch.replace('KDCA ', '');
  const cards = AWARDS.map(a => cardHTML(byAward[a.key]?.[0] ?? null, a)).join('');
  return `
    <section class="pm-section">
      <div class="pm-section-header">
        <span class="pm-section-badge">KDCA</span>
        <h3 class="pm-section-title">${branchShort}</h3>
      </div>
      <div class="pm-cards-row">${cards}</div>
    </section>`;
}

async function init() {
  const grid = document.getElementById('pmGrid');
  if (!grid) return;

  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data.json');
    const data = await res.json();

    // Filter 2026 Peninsular winners
    const all = (data.winners || []).filter(w =>
      w.year === 2026 && PENINSULAR_BRANCHES.includes(w.branch)
    );

    // Group by branch → by award
    const byBranch = {};
    for (const w of all) {
      if (!byBranch[w.branch]) byBranch[w.branch] = {};
      if (!byBranch[w.branch][w.award]) byBranch[w.branch][w.award] = [];
      byBranch[w.branch][w.award].push(w);
    }

    // Render branches that have at least one confirmed winner
    const sortedBranches = Object.keys(byBranch)
      .sort((a, b) => (BRANCH_ORDER[a] || 99) - (BRANCH_ORDER[b] || 99));

    if (sortedBranches.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#555;padding:60px 0;">No 2026 Peninsular champions found.</p>';
      return;
    }

    grid.innerHTML = sortedBranches.map(b => sectionHTML(b, byBranch[b])).join('');

  } catch (err) {
    console.error('Peninsular 2026 init failed:', err);
    grid.innerHTML = '<p style="text-align:center;color:#555;padding:60px 0;">Unable to load champion data. Please refresh.</p>';
  }
}

init();
