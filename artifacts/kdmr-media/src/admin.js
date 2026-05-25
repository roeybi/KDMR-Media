/**
 * KDMR Media — Admin Dashboard (Upload Queue + Feedback)
 * Views and manages contributor photo submissions and user feedback.
 */

const SUPABASE_URL = 'https://erbyhmliuqopwrspxbir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg';
const UPLOAD_TABLE = 'contributor_uploads';
const FEEDBACK_TABLE = 'feedback';
const BUCKET = 'contributor-uploads';
const ADMIN_HASH = '64e48f3bf07307f751c02213b95e0b5e1e8351597dfbe12bce5cbf115591ce3f';

let allRows = [];
let currentFilter = 'all';
let winnerMap = {};

let allFeedback = [];
let currentFbFilter = 'all';
let currentTab = 'uploads';

// ── PASSCODE GATE ──────────────────────────────────────────────────────────────────────────────────

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
    loadFeedback();
  } else {
    document.getElementById('adminGateError').textContent = 'Invalid passcode.';
    document.getElementById('adminPasscode').value = '';
  }
}

// ── WINNER MAP ──────────────────────────────────────────────────────────────────────────────────

async function buildWinnerMap() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data.json');
    const data = await res.json();
    (data.winners || []).forEach(w => {
      winnerMap[w.id] = {
        name: w.name,
        branch: w.branch,
        district: w.district || w.branch,
      };
    });
  } catch {
    // non-fatal
  }
}

function resolveBranch(raw) {
  if (!raw) return '-';
  if (/^win-\d+$/i.test(raw)) {
    const entry = winnerMap[raw];
    if (entry) {
      return entry.branch === 'KDCA Sabah'
        ? entry.district
        : entry.branch;
    }
    return raw;
  }
  return raw;
}

// ── UPLOAD QUEUE ──────────────────────────────────────────────────────────────────────────────────

async function loadQueue() {
  const tbody = document.getElementById('queueBody');
  tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Loading submissions...</td></tr>';

  try {
    await buildWinnerMap();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${UPLOAD_TABLE}?select=*&order=uploaded_at.desc`, {
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
    const branchDisplay = resolveBranch(row.branch);
    return `
      <tr data-id="${row.id}">
        <td><img src="${thumbUrl}" class="thumb" alt="" loading="lazy" onerror="this.style.display='none'"></td>
        <td><strong>${branchDisplay}</strong></td>
        <td>${row.winner_name || '-'}</td>
        <td style="font-family:monospace;font-size:0.75rem;color:#888;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.filename}</td>
        <td>${row.uploaded_by || '-'}</td>
        <td style="font-size:0.75rem;color:#888;">${date}</td>
        <td><span class="status-badge status-${row.status || 'pending'}">${row.status || 'pending'}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <button class="copy-btn" data-url="${thumbUrl}" onclick="copyUrl(this)">Copy URL</button>
          <button class="copy-btn agent-btn" data-text="${branchDisplay} | ${row.winner_name} | ${thumbUrl}" onclick="copyForAgent(this)" title="Copy formatted string to send to agent">📋 Copy for Agent</button>
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

// ── FEEDBACK MANAGEMENT ────────────────────────────────────────────────────────────────────────────────

async function loadFeedback() {
  const tbody = document.getElementById('feedbackBody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading feedback...</td></tr>';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${FEEDBACK_TABLE}?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.code === '42P01' || res.status === 404) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="color:#f0a820;">Feedback table not set up yet. Run the SQL in Supabase to create it.</td></tr>';
        return;
      }
      throw new Error(err.message || `Failed to load feedback (${res.status})`);
    }

    allFeedback = await res.json();
    renderFeedback();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#ef4444;">${err.message}</td></tr>`;
  }
}

function renderFeedback() {
  const tbody = document.getElementById('feedbackBody');
  const rows = currentFbFilter === 'all'
    ? allFeedback
    : allFeedback.filter(r => (r.status || 'new') === currentFbFilter);

  if (rows.length === 0) {
    const msg = allFeedback.length === 0
      ? 'No feedback yet.'
      : `No ${currentFbFilter} feedback.`;
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${msg}</td></tr>`;
    updateFbStats(0, 0, 0, 0, 0);
    return;
  }

  const newCount = allFeedback.filter(r => (r.status || 'new') === 'new').length;
  const validCount = allFeedback.filter(r => r.status === 'valid').length;
  const kivCount = allFeedback.filter(r => r.status === 'kiv').length;
  const spamCount = allFeedback.filter(r => r.status === 'spam').length;
  const githubCount = allFeedback.filter(r => r.github_issue_url).length;
  updateFbStats(allFeedback.length, newCount, validCount, kivCount, spamCount, githubCount);

  tbody.innerHTML = rows.map(row => {
    const date = row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';
    const status = row.status || 'new';
    const labelClass = `label-${status}`;
    const issueLink = row.github_issue_url
      ? `<a href="${row.github_issue_url}" target="_blank" rel="noopener" style="color:#4ade80;font-size:0.7rem;text-decoration:none;">Issue →</a>`
      : '';
    return `
      <tr data-fbid="${row.id}">
        <td style="font-size:0.75rem;color:#888;">${date}</td>
        <td><strong>${escapeHtml(row.name)}</strong></td>
        <td style="font-size:0.75rem;color:#888;">${row.email ? escapeHtml(row.email) : '-'}</td>
        <td style="font-size:0.75rem;color:#888;">${row.page || '-'}</td>
        <td>
          <div class="feedback-msg" onclick="this.classList.toggle('expanded')" title="Click to expand">
            ${escapeHtml(row.message)}
          </div>
          ${issueLink}
        </td>
        <td><span class="status-badge ${labelClass}">${status}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <button class="action-btn github-btn" onclick="createGitHubIssue('${row.id}',this)">
            ${row.github_issue_url ? '✅ On GitHub' : 'Add to GitHub'}
          </button>
          <select onchange="updateFeedbackLabel('${row.id}',this.value,this)" style="background:#111;border:1px solid #333;color:#aaa;padding:3px 6px;font-size:0.7rem;border-radius:2px;cursor:pointer;">
            <option value="new" ${status === 'new' ? 'selected' : ''}>New</option>
            <option value="valid" ${status === 'valid' ? 'selected' : ''}>Valid</option>
            <option value="kiv" ${status === 'kiv' ? 'selected' : ''}>KIV</option>
            <option value="spam" ${status === 'spam' ? 'selected' : ''}>Spam</option>
          </select>
          <button class="action-btn dismiss-btn" onclick="dismissFeedback('${row.id}',this)">✗ Dismiss</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateFbStats(total, nNew, valid, kiv, spam, github) {
  document.getElementById('feedbackStats').innerHTML = `
    Total: <strong>${total}</strong> &nbsp;·&nbsp;
    New: <span style="color:#c084fc">${nNew}</span> &nbsp;·&nbsp;
    Valid: <span style="color:#4ade80">${valid}</span> &nbsp;·&nbsp;
    KIV: <span style="color:#f0a820">${kiv}</span> &nbsp;·&nbsp;
    Spam: <span style="color:#f87171">${spam}</span> &nbsp;·&nbsp;
    On GitHub: <span style="color:#aaa">${github}</span>
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.createGitHubIssue = async function(id, btn) {
  const row = allFeedback.find(r => r.id === id);
  if (!row) return;

  const pat = document.getElementById('githubPatInput').value.trim();
  if (!pat) {
    alert('Please enter your GitHub PAT in the header field first.');
    document.getElementById('githubPatInput').focus();
    return;
  }

  const originalText = btn.textContent;
  btn.textContent = 'Creating...';
  btn.disabled = true;

  const title = `[Feedback] ${row.name} — ${row.page || 'General'}`;
  const body = `**From:** ${row.name}  \n**Email:** ${row.email || 'N/A'}  \n**Page:** ${row.page || 'N/A'}  \n**Date:** ${row.created_at ? new Date(row.created_at).toISOString() : 'N/A'}  \n\n---\n\n${row.message}`;

  try {
    const res = await fetch('https://api.github.com/repos/roeybi/KDMR-Media/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels: ['feedback'] }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub error (${res.status})`);
    }

    const issue = await res.json();

    // Update Supabase with github_issue_url
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/${FEEDBACK_TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ github_issue_url: issue.html_url }),
    });

    if (!patchRes.ok) throw new Error('Created issue but failed to save URL to Supabase.');

    // Update local data
    const idx = allFeedback.findIndex(r => r.id === id);
    if (idx !== -1) allFeedback[idx].github_issue_url = issue.html_url;
    renderFeedback();
  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;
    alert(`GitHub issue creation failed: ${err.message}`);
  }
};

window.updateFeedbackLabel = async function(id, newStatus, select) {
  select.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${FEEDBACK_TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error('Update failed');

    const idx = allFeedback.findIndex(r => r.id === id);
    if (idx !== -1) allFeedback[idx].status = newStatus;
    renderFeedback();
  } catch (err) {
    select.disabled = false;
    alert(`Could not update label: ${err.message}`);
  }
};

window.dismissFeedback = async function(id, btn) {
  if (!confirm('Delete this feedback entry permanently?')) return;

  const originalText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${FEEDBACK_TABLE}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
    });

    if (!res.ok) throw new Error('Delete failed');

    allFeedback = allFeedback.filter(r => r.id !== id);
    renderFeedback();
  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;
    alert(`Could not delete: ${err.message}`);
  }
};

// ── ACTIONS (Upload Queue) ────────────────────────────────────────────────────────────────────────────────

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

window.copyForAgent = async function(btn) {
  const text = btn.dataset.text;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  btn.textContent = '✓ Copied!';
  btn.style.borderColor = '#f0a820';
  btn.style.color = '#f0a820';
  setTimeout(() => { btn.textContent = '📋 Copy for Agent'; btn.style.borderColor = ''; btn.style.color = ''; }, 2000);
};

window.updateStatus = async function(id, newStatus, btn) {
  const originalText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${UPLOAD_TABLE}?id=eq.${id}`, {
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

    const rowIndex = allRows.findIndex(r => r.id === id);
    if (rowIndex !== -1) allRows[rowIndex].status = newStatus;
    renderQueue();
  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;
    alert(`Could not update status: ${err.message}`);
  }
};

// ── TAB SWITCHING ─────────────────────────────────────────────────────────────────────────────────────

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  document.getElementById('uploadsPanel').style.display = tabName === 'uploads' ? '' : 'none';
  document.getElementById('feedbackPanel').style.display = tabName === 'feedback' ? '' : 'none';
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────────────────────────────────────────

document.getElementById('adminGateBtn').addEventListener('click', checkAdminPasscode);
document.getElementById('adminPasscode').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAdminPasscode();
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  if (currentTab === 'uploads') loadQueue();
  else loadFeedback();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.filter) {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderQueue();
    } else if (btn.dataset.fbfilter) {
      document.querySelectorAll('.filter-btn[data-fbfilter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFbFilter = btn.dataset.fbfilter;
      renderFeedback();
    }
  });
});
