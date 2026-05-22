/**
 * KDMR Media — Contributor Upload Portal
 * Uploads winner portraits to Supabase Storage and records metadata.
 */

const SUPABASE_URL = 'https://erbyhmliuqopwrspxbir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg';
const BUCKET = 'contributor-uploads';
const TABLE = 'contributor_uploads';

// ⚠️  CHANGE THIS: contributor passcode (SHA-256 hash of your chosen passcode)
//    Default hash below is for "KDMR2026". To change, tell me the new passcode.
const CONTRIBUTOR_HASH = '1f73941a4139a60c2c05af43e42d045ebf146972ac7b1fd41c69731d47049d0d';

// State
let selectedFile = null;
let winnersData = [];

// ─── PASSCODE GATE ─────────────────────────────────────────────────────────

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPasscode() {
  const input = document.getElementById('passcodeInput').value.trim();
  const hash = await sha256(input);
  if (hash === CONTRIBUTOR_HASH) {
    document.getElementById('gateOverlay').style.display = 'none';
    document.getElementById('uploadContainer').style.display = '';
    loadBranches();
  } else {
    document.getElementById('gateError').textContent = 'Invalid passcode. Please try again.';
    document.getElementById('passcodeInput').value = '';
  }
}

// ─── BRANCH LOADING ─────────────────────────────────────────────────────────

async function loadBranches() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data.json');
    const data = await res.json();
    winnersData = (data.winners || []).filter(w => w.year === 2026 && w.award === 'Unduk Ngadau');

    const select = document.getElementById('branchSelect');
    const branches = [...new Set(winnersData.map(w => w.branch))].sort();
    branches.forEach(branch => {
      const opt = document.createElement('option');
      opt.value = branch;
      opt.textContent = branch;
      select.appendChild(opt);
    });
  } catch (e) {
    showStatus('Failed to load branch data. Please refresh.', 'error');
  }
}

function onBranchChange() {
  const branch = document.getElementById('branchSelect').value;
  const winner = winnersData.find(w => w.branch === branch);
  document.getElementById('winnerName').value = winner ? winner.name : '';
}

// ─── FILE HANDLING ─────────────────────────────────────────────────────────

function handleFile(file) {
  if (!file) return;
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showStatus('File too large. Max 5MB allowed.', 'error');
    return;
  }
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showStatus('Only PNG, JPEG, or WebP images are accepted.', 'error');
    return;
  }
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = e => {
    const area = document.getElementById('previewArea');
    area.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

// ─── UPLOAD FLOW ─────────────────────────────────────────────────────────

async function uploadPhoto() {
  const branch = document.getElementById('branchSelect').value;
  const winnerName = document.getElementById('winnerName').value;
  const contributor = document.getElementById('contributorName').value.trim();
  const notes = document.getElementById('notes').value.trim();

  if (!branch) { showStatus('Please select a branch.', 'error'); return; }
  if (!selectedFile) { showStatus('Please select a photo to upload.', 'error'); return; }
  if (!contributor) { showStatus('Please enter your name.', 'error'); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  showProgress(true);

  try {
    // 1. Build filename: branch-kebab_winner-kebab_timestamp.png
    const branchKebab = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const winnerKebab = winnerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const filename = `${branchKebab}_${winnerKebab}_${ts}.${ext}`;

    setProgress(20, 'Requesting upload URL...');

    // 2. Get signed upload URL from Supabase Storage
    const signRes = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!signRes.ok) {
      const err = await signRes.json().catch(() => ({}));
      if (err.error === 'Bucket not found' || signRes.status === 404) {
        throw new Error('Storage bucket not found. The admin needs to create the "contributor-uploads" bucket in Supabase first.');
      }
      throw new Error(err.message || `Upload sign failed (${signRes.status})`);
    }

    const signData = await signRes.json();
    // Supabase returns { url: "/object/upload/sign/...", token: "..." }
    const relativeUrl = signData?.url;
    if (!relativeUrl) throw new Error('No signed URL returned from Supabase');
    const signedUrl = `${SUPABASE_URL}/storage/v1${relativeUrl}`;

    setProgress(40, 'Uploading file...');

    // 3. Upload file bytes to signed URL
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': selectedFile.type, 'x-upsert': 'true' },
      body: selectedFile,
    });

    if (!uploadRes.ok) {
      throw new Error(`File upload failed (${uploadRes.status})`);
    }

    setProgress(70, 'Recording metadata...');

    // 4. Record metadata in Supabase table
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
    const metaRes = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        branch,
        winner_name: winnerName,
        filename,
        uploaded_by: contributor,
        uploaded_at: new Date().toISOString(),
        status: 'pending',
        notes: notes || null,
        public_url: publicUrl,
      }),
    });

    if (!metaRes.ok && metaRes.status !== 409) {
      const err = await metaRes.json().catch(() => ({}));
      if (err.code === '42P01' || metaRes.status === 404) {
        throw new Error('Database table not found. Please contact the admin.');
      }
      throw new Error(`Metadata save failed (${metaRes.status}): ${err.message || err.code || 'Unknown error'}`);
    }

    setProgress(100, 'Done!');

    showStatus(
      `Upload successful! Your photo for <strong>${winnerName}</strong> (${branch}) has been submitted. ` +
      `It will be reviewed before appearing on the site.`,
      'success'
    );

    // Reset form
    selectedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('previewArea').innerHTML = '';
    document.getElementById('notes').value = '';
    setTimeout(() => showProgress(false), 2000);

  } catch (err) {
    console.error('Upload error:', err);
    showStatus(err.message || 'Upload failed. Please try again.', 'error');
    setProgress(false);
  } finally {
    btn.disabled = false;
  }
}

// ─── UI HELPERS ─────────────────────────────────────────────────────────

function showStatus(msg, type) {
  const area = document.getElementById('statusArea');
  area.innerHTML = `<div class="status-msg status-${type}">${msg}</div>`;
}

function showProgress(show) {
  document.getElementById('progressWrap').style.display = show ? 'block' : 'none';
  if (!show) setProgress(0, '');
}

function setProgress(pct, text) {
  document.getElementById('progressFill').style.width = pct + '%';
  if (text) document.getElementById('progressText').textContent = text;
}

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────

document.getElementById('gateBtn').addEventListener('click', checkPasscode);
document.getElementById('passcodeInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPasscode();
});

document.getElementById('branchSelect').addEventListener('change', onBranchChange);

document.getElementById('dropZone').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', e => {
  handleFile(e.target.files[0]);
});

const dz = document.getElementById('dropZone');
dz.addEventListener('dragover', e => {
  e.preventDefault();
  dz.classList.add('drag-over');
});
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

document.getElementById('submitBtn').addEventListener('click', uploadPhoto);
