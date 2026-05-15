# KDMR Media

A high-performance static web platform serving as a cultural archive and community hub for the Kadazan Dusun Murut Rungus (KDMR) people of Sabah, Borneo.

## Run & Operate

- `pnpm --filter @workspace/kdmr-media run dev` — run the static site dev server
- `pnpm --filter @workspace/kdmr-media run build` — build for production (GitHub Pages)
- `pnpm --filter @workspace/kdmr-media run serve` — preview the production build locally

## Stack

- Vanilla HTML5, Tailwind CSS 4, Vanilla JavaScript (ES modules)
- Multi-page application (MPA) via Vite
- Static site — no backend, no database

## Where things live

- `artifacts/kdmr-media/index.html` — Landing page & community news feed
- `artifacts/kdmr-media/archive.html` — Searchable Hall of Fame
- `artifacts/kdmr-media/directory.html` — KDM-owned business listings
- `artifacts/kdmr-media/src/script.js` — All JS logic: search, filtering, sorting, voting
- `artifacts/kdmr-media/src/index.css` — Tailwind CSS with KDMR brand theme
- `artifacts/kdmr-media/public/data.json` — Local mock data (HOF, businesses, news, stats)

## Architecture decisions

- Pure vanilla HTML/JS/CSS — no framework, maximally portable for GitHub Pages
- Vite as build tool only (Tailwind CSS processing + MPA bundling)
- Votes stored in `localStorage` (no backend needed for MVP)
- `public/data.json` is the single source of truth for all content (drop-in replaceable with a real API)
- Category filtering and full-text search all happen client-side for zero-latency UX

## Product

- **Home / News** — Hero banner, live stats counter, community news feed, top-voted HOF sidebar, featured business spotlight
- **Hall of Fame** — 12 notable KDMR individuals, searchable by name/tribe/district/achievement, filterable by category (Politics, Arts & Culture, Sports, Education, Entrepreneurship), community upvoting with detail modal
- **Business Directory** — 12 KDM-owned businesses, searchable, filterable by 6 categories, verified badges, contact info modal with phone/email/website

## User preferences

- Site must be deployable to GitHub Pages as static HTML
- HTML5 + Tailwind CSS + Vanilla JavaScript only (no React or frameworks)
- Cultural identity: Kadazan, Dusun, Murut, Rungus — Sabah, Borneo

## Gotchas

- Vite serves `public/` files at root, so `data.json` is fetched as `./data.json` (not `./public/data.json`)
- This is a Vite MPA project — `rollupOptions.input` in `vite.config.ts` must include all HTML entry points
- No TypeScript files are checked (`tsconfig.json` has empty `include` array) since the project is plain JS

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- To add a new page: create `artifacts/kdmr-media/<name>.html` and add it to `rollupOptions.input` in `vite.config.ts`
- To add data: edit `artifacts/kdmr-media/public/data.json`
