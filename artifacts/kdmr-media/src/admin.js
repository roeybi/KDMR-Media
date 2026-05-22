/**
 * KDMR Media — Admin Upload Queue Dashboard
 * Views and manages contributor photo submissions from Supabase.
 */

const SUPABASE_URL = 'https://erbyhmliuqopwrspxbir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg';
const TABLE = 'contributor_uploads';
const BUCKET = 'contributor-uploads';

// ⚠️  CHANGE THIS: admin passcode (SHA-256 hash of your chosen passcode)
//    Default hash below is for "ADMIN2026". To change, tell me the new passcode.
const ADMIN_HASH = '64e48f3bf07307f751c02213b95e0b5e1e8351597dfbe12bce5cbf115591ce3f';

let allRows = [];
let currentFilter = 'all';

// ─── PASSCODE GATE ─────────────────────────────────────────────────────────

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkAdminPasscode() {
  const input = document.getElementById('adminPasscode').value.trim();
  const hash = await sha256(input);
  if (hash === ADMIN_HASH) {
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('queueContainer').style.display = '';
    loadQueue();
  } else {
    document.getElementById('adminGateError').textContent = 'Invalid passcode.';
    document.getElementById('adminPasscode').value = '';
  }
}

// ─── QUEUE LOADING ─────────────────────────────────────────────────────────

async function loadQueue() {
  const tbody = document.getElementById('queueBody');
  tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Loading submissions...</td></tr>';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=uploaded_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.code === '42P01' || res.status === 404) {
        throw new Error('Table "contributor_uploads" not found. Ask your developer to set up the Supabase database.');
      }
      throw new Error(err.message || `Failed to load queue (${res.status})`);
    }

    allRows = await res.json();
    renderQueue();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color:#ef4444;">${err.message}</td></tr>`;
  }
}

function renderQueue() {
  const tbody = document.getElementById('queueBody');
  const rows = currentFilter === 'all'
    ? allRows
    : allRows.filter(r => r.status === currentFilter);

  if (rows.length === 0) {
    const msg = allRows.length === 0
      ? 'No submissions yet. Share the upload portal link with contributors.'
      : `No ${currentFilter} submissions.`;
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">${msg}</td></tr>`;
    updateStats(0, 0, 0, 0);
    return;
  }

  const pending = allRows.filter(r => r.status === 'pending').length;
  const approved = allRows.filter(r => r.status === 'approved').length;
  const rejected = allRows.filter(r => r.status === 'rejected').length;
  updateStats(allRows.length, pending, approved, rejected);

  tbody.innerHTML = rows.map(row => {
    const date = row.uploaded_at
      ? new Date(row.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';
    const thumbUrl = row.public_url || `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${row.filename}`;
    return `
      <tr data-id="${row.id}">
        <td><img src="${thumbUrl}" class="thumb" alt="" loading="lazy" onerror="this.style.display='none'"></td>
        <td><strong>${row.branch || '-'}</strong></td>
        <td>${row.winner_name || '-'}</td>
        <td style="font-family:monospace;font-size:0.75rem;color:#888;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.filename}</td>
        <td>${row.uploaded_by || '-'}</td>
        <td style="font-size:0.75rem;color:#888;">${date}</td>
        <td><span class="status-badge status-${row.status || 'pending'}">${row.status || 'pending'}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <button class="copy-btn" data-url="${thumbUrl}" onclick="copyUrl(this)">Copy URL</button>
          ${row.status !== 'approved' ? `<button class="action-btn approve-btn" onclick="updateStatus('${row.id}','approved',this)">✓ Approve</button>` : ''}
          ${row.status !== 'rejected' ? `<button class="action-btn reject-btn" onclick="updateStatus('${row.id}','rejected',this)">✗ Reject</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function updateStats(total, pending, approved, rejected) {
  document.getElementById('queueStats').innerHTML = `
    Total: <strong>${total}</strong> &nbsp;·&nbsp; Pending: <span style="color:#f0a820">${pending}</span> &nbsp;·&nbsp;
    Approved: <span style="color:#4ade80">${approved}</span> &nbsp;·&nbsp;
    Rejected: <span style="color:#f87171">${rejected}</span>
  `;
}

// ─── ACTIONS ──────────────────────────────────────────────────────────

window.copyUrl = async function(btn) {
  const url = btn.dataset.url;
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy URL'; btn.classList.remove('copied'); }, 2000);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy URL', 2000);
  }
};

window.updateStatus = async function(id, newStatus, btn) {
  const originalText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Update failed (${res.status})`);
    }

    // Update local data and re-render
    const rowIndex = allRows.findIndex(r => r.id === id);
    if (rowIndex !== -1) allRows[rowIndex].status = newStatus;
    renderQueue();
  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;
    alert(`Could not update status: ${err.message}`);
  }
};

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────

document.getElementById('adminGateBtn').addEventListener('click', checkAdminPasscode);
document.getElementById('adminPasscode').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAdminPasscode();
});

document.getElementById('refreshBtn').addEventListener('click', loadQueue);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderQueue();
  });
});
