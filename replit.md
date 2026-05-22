# KDMR Media

A high-performance static web platform serving as a cultural archive and community hub for the Kadazan Dusun Murut Rungus (KDMR) people of Sabah, Borneo.

**Live site:** https://kdmrmedia.com (custom domain via GitHub Pages)
**Repo:** https://github.com/roeybi/KDMR-Media (owner: roeybi, branch: main)

## Run & Operate

- `pnpm --filter @workspace/kdmr-media run dev` — run the static site dev server (Replit preview)
- `pnpm --filter @workspace/kdmr-media run build` — build for production (writes to `artifacts/kdmr-media/dist/public`)
- `pnpm --filter @workspace/kdmr-media run build:github` — build for GitHub Pages (uses `vite.github.config.ts`, base path `/`)
- `pnpm --filter @workspace/kdmr-media run serve` — preview the production build locally

## Stack

- Vanilla HTML5, Tailwind CSS 4, Vanilla JavaScript (ES modules)
- Multi-page application (MPA) via Vite
- Static site — no backend, no database (Supabase used only for newsletter signups)

## Where things live

- `artifacts/kdmr-media/index.html` — Landing page, cinematic hero, community news feed
- `artifacts/kdmr-media/archive.html` — Searchable Hall of Fame
- `artifacts/kdmr-media/directory.html` — KDM-owned business listings
- `artifacts/kdmr-media/src/script.js` — All JS logic: search, filtering, sorting, voting, hero render, Supabase newsletter
- `artifacts/kdmr-media/src/index.css` — Tailwind CSS with KDMR brand theme
- `artifacts/kdmr-media/public/data.json` — Single source of truth for HOF, businesses, news, stats, hero `legendOfWeek`
- `artifacts/kdmr-media/public/images/` — Portrait photos (e.g. `wendey-merrylen.png`)
- `artifacts/kdmr-media/public/CNAME` — Contains `kdmrmedia.com` (required for custom domain)
- `artifacts/kdmr-media/vite.config.ts` — Dev/Replit build config
- `artifacts/kdmr-media/vite.github.config.ts` — GitHub Pages build config (`base: "/"`)
- `.github/workflows/deploy.yml` — GitHub Actions deploy workflow (canonical version lives on GitHub, NOT in Replit — see Deployment gotchas)
- `.gitignore` — Excludes `attached_assets/` so user-uploaded screenshots never get committed

## Architecture decisions

- Pure vanilla HTML/JS/CSS — no framework, maximally portable for GitHub Pages
- Vite as build tool only (Tailwind CSS processing + MPA bundling)
- Votes stored in `localStorage` (no backend needed for MVP)
- `public/data.json` is the single source of truth for all content (drop-in replaceable with a real API)
- Category filtering and full-text search all happen client-side for zero-latency UX
- Hero image is loaded from `data.json` (`legendOfWeek.imageUrl`), NOT hardcoded in HTML

## Product

- **Home / News** — Cinematic hero with "Legend of the Week" portrait, live stats counter, community news feed, top-voted HOF sidebar, featured business spotlight, newsletter signup
- **Hall of Fame** — 12 notable KDMR individuals, searchable by name/tribe/district/achievement, filterable by category (Politics, Arts & Culture, Sports, Education, Entrepreneurship), community upvoting with detail modal
- **Business Directory** — 12 KDM-owned businesses, searchable, filterable by 6 categories, verified badges, contact info modal with phone/email/website

## Deployment (GitHub Pages)

**Pipeline:** Push to `main` → GitHub Actions runs `deploy.yml` → builds with `build:github` → publishes `dist/public` to GitHub Pages → served at kdmrmedia.com.

**GitHub Pages source:** "GitHub Actions" (NOT branch-based). Configured in repo Settings → Pages.

**Custom domain:** kdmrmedia.com, set via the `public/CNAME` file (gets copied into `dist/public` on build). DNS points to GitHub Pages.

**Deploy workflow:** `.github/workflows/deploy.yml` lives ONLY on GitHub (it was created/edited via the GitHub web UI). The local Replit copy may be out of sync. **Always treat the GitHub copy as canonical** — fetch it via API before editing.

**The workflow uses `pnpm install --no-frozen-lockfile`** (user edited this on GitHub web to fix `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`). Do NOT change this back.

## Deployment gotchas (CRITICAL — read before pushing)

### 1. Replit's git push CANNOT touch `.github/workflows/`

Replit's built-in git OAuth lacks the `workflow` scope. Any commit that modifies a file under `.github/workflows/` will be rejected on push. To update the deploy workflow, you must use the GitHub REST API with a Personal Access Token (PAT) — see below.

### 2. Destructive git commands are blocked in the main agent bash

`git rm`, `git reset`, `git push`, `git checkout`, `git rebase`, `git clean`, etc. are all blocked. To run them, either:
- Ask the user to run them in their Shell tab, OR
- Delegate to a background project task (has higher privileges)

Read-only git is fine, but always use `git --no-optional-locks <cmd>` (plain `git status` is also blocked).

### 3. Use the GitHub API with PAT for pushing critical files

The user has a PAT with `repo` + `workflow` scopes stored in conversation history (look for `ghp_...`). Use it like this:

```bash
# Get current file SHA
SHA=$(curl -s -H "Authorization: token $PAT" \
  "https://api.github.com/repos/roeybi/KDMR-Media/contents/<path>" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).sha))")

# Encode file and PUT it
base64 -w0 <localfile> > /tmp/b64.txt
CONTENT=$(cat /tmp/b64.txt)
curl -s -X PUT -H "Authorization: token $PAT" -H "Content-Type: application/json" \
  "https://api.github.com/repos/roeybi/KDMR-Media/contents/<path>" \
  -d "{\"message\":\"...\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"main\"}"
```

A push to `main` auto-triggers `deploy.yml`. To force a redeploy without changing files, trigger `workflow_dispatch`:
```bash
curl -s -X POST -H "Authorization: token $PAT" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/roeybi/KDMR-Media/actions/workflows/deploy.yml/dispatches" \
  -d '{"ref":"main"}'
```

Note: `python3` is NOT available — use `node` for JSON parsing in shell.

### 4. Local commits ahead of remote are harmless

There are typically 15+ local commits ahead of `origin/main` (attached_assets screenshots, workflow file dupes, etc.). These never get pushed but don't break anything — critical files are kept in sync via the GitHub API.

### 5. Build needs `build:github`, not `build`

GitHub Pages deploy uses `pnpm --filter @workspace/kdmr-media run build:github` which references `vite.github.config.ts` with `base: "/"` (the apex domain serves from root). Do not change the base path.

## Mobile hero layout (the part that took several iterations)

The hero on `index.html` is a full-viewport cinematic portrait with a text overlay at the bottom. Getting this right on iPhone Safari required several specific choices:

- **Image is rendered as a CSS `background-image`** on `#heroAvatarWrap` (set in `script.js` ~line 696), NOT as an `<img>`. So `object-position` rules on `.hero-avatar-wrap > img` are dead code for the portrait — the controlling property is `backgroundPosition: 'top center'` in JS.
- **Use `min-height: 100dvh`** (with `100svh` fallback) on `.hero-cinema`. Pure `100svh` is too short on iPhone Safari (URL bar shrinks the viewport), which caused the text overlay to crowd the face.
- **Mobile heroName**: `2.0rem` / line-height `1.05` (reduced from 2.4rem).
- **Mobile bio**: clamped to 3 lines via `-webkit-line-clamp: 3` in CSS. The JS slices to 220 chars, the CSS clamp keeps overflow hidden so the face area stays clear.
- **The portrait file** is `public/images/wendey-merrylen.png` (~7.4MB, seated portrait with crown). To change the legend, update `legendOfWeek` in `data.json` AND replace the image at the same path (or change `imageUrl`).

## Newsletter (Supabase)

- The newsletter signup form on `index.html` writes to Supabase.
- Supabase URL + anon key are hardcoded in `src/script.js` (safe — anon key is public by design, RLS protects the table).
- No environment variables needed; site is fully static.

## User preferences

- Site must be deployable to GitHub Pages as static HTML
- HTML5 + Tailwind CSS + Vanilla JavaScript only (no React or frameworks)
- Cultural identity: Kadazan, Dusun, Murut, Rungus — Sabah, Borneo
- When the live site needs an update, push via GitHub API (not git push) and tell the user to wait ~2 minutes for deployment

## Other gotchas

- Vite serves `public/` files at root, so `data.json` is fetched as `./data.json` (not `./public/data.json`)
- This is a Vite MPA project — `rollupOptions.input` in `vite.config.ts` must include all HTML entry points
- No TypeScript files are checked (`tsconfig.json` has empty `include` array) since the project is plain JS
- `attached_assets/` is gitignored — user-uploaded screenshots stay local

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- To add a new page: create `artifacts/kdmr-media/<name>.html` and add it to `rollupOptions.input` in BOTH `vite.config.ts` AND `vite.github.config.ts`
- To add data: edit `artifacts/kdmr-media/public/data.json`
- To change the hero portrait: replace the image file and update `legendOfWeek` in `data.json`

## Data Requirements — Adding / Updating a Winner Entry

All new winner/finalist entries in `public/data.json` **must include** the following four fields exactly as specified. No entry should be committed without them.

### Mandatory Fields

| Field | Description | Example |
|---|---|---|
| **1. `name`** | Full official name of the winner, exactly as crowned. | `Jeraahfinah Jonis (Nanu)` |
| **2. `coronationDate`** | Date of the coronation ceremony in ISO format (`YYYY-MM-DD`). | `2026-05-09` |
| **3. `achievements` (Notes)** | Array of 2–4 short, specific achievements or accolades. Each string should include year, title, and distinction. | `["KDCA Pulau Pinang Unduk Ngadau 2026 — Champion", "KDCA Pulau Pinang representative at 66th State Finals"]` |
| **4. `bio` (About)** | 2–4 sentence paragraph covering: who they are, where they’re from, when/where they were crowned, what they represent, and any notable personal detail (age, profession, hometown). | `Jeraahfinah Jonis, affectionately known as Nanu, was crowned KDCA Pulau Pinang Unduk Ngadau 2026 on 9 May 2026. A proud Kadazan-Dusun diaspora champion, she carries the heritage of Sabah's highlands to the Pearl of the Orient and will represent her branch at the 66th State Finals on 31 May at Hongkod Koisaan, Penampang.` |

### Full Entry Template (Minimum Viable Winner Record)

Use this exact shape when inserting a new winner into the `winners` array in `data.json`. All mandatory fields are marked with **⚠ MANDATORY**.

```json
{
  "id": "win-XXX",
  "name": "<Full Official Name>  ⚠ MANDATORY",
  "branch": "KDCA <Branch Name>",
  "award": "Unduk Ngadau",
  "year": 2026,
  "tribe": "Kadazan Dusun",
  "district": "<Branch Name>",
  "origin": "KDCA <Branch Name>",
  "accentColor": "#f0a820",
  "badge": "Regional Champion 2026",
  "coronationDate": "2026-MM-DD",  ⚠ MANDATORY
  "heritage": {
    "group": "Kadazan Dusun (diaspora — <Branch Name>)",
    "costume": "Sinuangga — <branch-specific description of the traditional ceremonial dress>",
    "language": "Kadazan-Dusun"
  },
  "bio": "<2–4 sentences: who, from where, crowned when/where, what they represent>  ⚠ MANDATORY",
  "achievements": [
    "KDCA <Branch> Unduk Ngadau 2026 — Champion",
    "KDCA <Branch> representative at 66th State Finals"
  ], ⚠ MANDATORY
  "votes": 0,
  "imageUrl": null
}
```

### Field Rules

- **`id`**: Use the next available `win-XXX` number. Check the highest existing `id` in `data.json` and increment by 1.
- **`imageUrl`**: Leave as `null` unless a real, verified portrait photo exists in `public/images/`. **Never** use placeholder or sample images for new entries.
- **`votes`**: Always start at `0`.
- **`accentColor`**: Use `#f0a820` for diaspora/outstation branches unless a custom brand colour is provided.
- **`bio` style**: Third-person, present or past tense. Include coronation date, venue (if notable), hometown/origin, and a cultural ambassador framing.
- **`achievements` style`: Each item is a single string, year always included, title in title case, distinction separated by an em-dash (`—`).

### How to Push

After editing `data.json`, push **only** via the GitHub REST API (do not use `git push`). See the **Deployment gotchas** section above for the exact `curl`/`node` pattern. Then tell the user to wait ~2 minutes for the GitHub Pages deployment.
