/**
 * KDMR Media — Public Feedback Form
 * Injects a feedback form into any element with [data-feedback-form]
 * Submits to Supabase `feedback` table via anon REST API.
 */

const SUPABASE_URL = 'https://erbyhmliuqopwrspxbir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYnlobWxpdXFvcHdyc3B4YmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzUzOTcsImV4cCI6MjA5NDQxMTM5N30.bm7hJBTa5eN1KX8MYp4aSCpHqiZPrxkb8k_t3VNIAMg';
const TABLE = 'feedback';

function getSrcPath() {
  // When this module is imported from a subdirectory page, adjust the base
  const script = document.currentScript;
  if (script && script.src) {
    const srcDir = script.src.split('/').slice(0, -1).join('/');
    if (srcDir.endsWith('/src')) return srcDir + '/';
  }
  // Fallback: detect if we're in a subdirectory
  const path = location.pathname;
  if (path.includes('/unduk-ngadau/') || path.includes('/mrk/') || path.includes('/sugandoi/') || path.includes('/live/') || path.includes('/predict/')) {
    return location.origin + '/src/';
  }
  return './src/';
}

function mountFeedbackForm(container) {
  if (!container) return;
  const page = container.dataset.page || location.pathname;

  container.innerHTML = `
    <div style="max-width:560px;margin:0 auto;">
      <div style="font-size:0.62rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f0a820;margin-bottom:12px;text-align:center;">
        Help Us Improve
      </div>
      <h3 style="font-size:clamp(1.1rem,3vw,1.4rem);font-weight:900;color:#f0f0f0;margin:0 0 8px;text-align:center;letter-spacing:-0.02em;">
        Share Your Feedback
      </h3>
      <p style="font-size:0.82rem;color:#555;margin:0 0 20px;text-align:center;line-height:1.6;">
        Found a bug? Have an idea? Tell us what you'd like to see on KDMR Media.
      </p>
      <form id="feedbackForm" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <input type="text" name="name" required placeholder="Your name" maxlength="60"
            style="flex:1;min-width:160px;background:#0a0a0a;border:1px solid #252525;color:#f0f0f0;padding:11px 14px;font-size:0.85rem;border-radius:2px;font-family:Inter,sans-serif;outline:none;" />
          <input type="email" name="email" placeholder="your@email.com (optional)" maxlength="120"
            style="flex:1;min-width:200px;background:#0a0a0a;border:1px solid #252525;color:#f0f0f0;padding:11px 14px;font-size:0.85rem;border-radius:2px;font-family:Inter,sans-serif;outline:none;" />
        </div>
        <input type="hidden" name="page" value="${page}" />
        <textarea name="message" required placeholder="What's on your mind?" rows="4" maxlength="2000"
          style="background:#0a0a0a;border:1px solid #252525;color:#f0f0f0;padding:11px 14px;font-size:0.85rem;border-radius:2px;font-family:Inter,sans-serif;outline:none;resize:vertical;"></textarea>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <p id="feedbackStatus" style="font-size:0.72rem;color:#555;margin:0;min-height:1.4em;"></p>
          <button type="submit" id="feedbackSubmitBtn"
            style="background:#f0a820;color:#0a0a0a;border:none;font-size:0.78rem;font-weight:700;padding:11px 28px;border-radius:2px;cursor:pointer;letter-spacing:0.04em;font-family:Inter,sans-serif;white-space:nowrap;">
            Submit Feedback →
          </button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('#feedbackForm');
  const statusEl = container.querySelector('#feedbackStatus');
  const submitBtn = container.querySelector('#feedbackSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    const fd = new FormData(form);
    const payload = {
      name: (fd.get('name') || '').trim(),
      email: (fd.get('email') || '').trim() || null,
      message: (fd.get('message') || '').trim(),
      page: (fd.get('page') || location.pathname).trim(),
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error (${res.status})`);
      }

      form.reset();
      statusEl.textContent = 'Thank you! Your feedback has been received.';
      statusEl.style.color = '#4ade80';
    } catch (err) {
      statusEl.textContent = 'Could not send: ' + err.message;
      statusEl.style.color = '#ef4444';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Feedback →';
    }
  });
}

// Auto-mount on any element with data-feedback-form
document.querySelectorAll('[data-feedback-form]').forEach(mountFeedbackForm);
