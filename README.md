# fit-analyzer

Resume × JD fit analyzer. A React SPA + Gemini-proxy API, **shipped as a single Cloudflare Worker** (Worker serves both the static SPA and the `/api/analyze` endpoint via the Workers Assets binding).

**Live:** https://fit-analyzer.jairukchan.com

Stateless. No database. The Worker holds the Gemini key; the browser never sees it. Same-origin between SPA and API means no CORS layer is required for normal use.

## What it does

Drop a resume PDF + paste a job description. The Worker calls `gemini-3.1-flash-lite` with a frozen response schema and returns a `FitReport` — a verdict (`strong | moderate | weak`), an overall score 0–100, four dimension scores (technical_skills · experience · education · domain_fit), strengths, gaps, and concrete suggestions.

Verdict thresholds: `strong` ≥ 75 · `moderate` 50–74 · `weak` < 50.

## Repo layout

```
worker/   Cloudflare Worker — POST /api/analyze · holds GEMINI_API_KEY
web/      Vite + React 18 + TS + Tailwind SPA
instruction/   Frozen spec, plan, todos, decision artifacts
```

Two independent folders. **Not a workspace** — install and build each separately.

## Local dev

```bash
# 1. worker (port 8787)
cd worker
npm install
echo 'GEMINI_API_KEY="AIzaSy..."' > .dev.vars      # gitignored
npm run dev

# 2. web (port 5173) — open another terminal
cd web
npm install
npm run dev                                         # uses VITE_API_BASE from .env
```

The web `.env` points at `http://127.0.0.1:8787` for local; flip to the deployed Worker URL to test against prod.

## Tests

```bash
# worker — vitest + miniflare · 4 specs
cd worker && npm test

# web — Playwright happy-path E2E
cd web && npx playwright test
```

## Deploy

The Worker serves both the static SPA and the API. There is no separate Pages project — `worker/wrangler.toml` has an `[assets]` binding that ships `web/dist/` along with the Worker code.

```bash
# 1. Build the SPA (output goes to web/dist/)
cd web && npm run build

# 2. Deploy the unified worker (uploads worker code + web/dist/ assets)
cd ../worker
echo "AIzaSy..." | npx wrangler secret put GEMINI_API_KEY    # one-time
npx wrangler deploy
```

That's it — one URL, one deploy target. `[vars] ALLOW_ORIGIN` in `wrangler.toml` is set to the Worker's own URL; same-origin requests don't need CORS but the header keeps non-browser callers honest.

## The frozen contract

`FitReport` JSON is the seam between Worker and frontend. Defined twice and the two must move together:

- `worker/src/prompt.ts` — `FIT_REPORT_SCHEMA` (Gemini `responseSchema`, uppercase type tokens)
- `web/src/lib/types.ts` — TypeScript interfaces

The `dimensions` field is an **ordered 4-tuple**: `technical_skills`, `experience`, `education`, `domain_fit`. Typed as `[Dimension, Dimension, Dimension, Dimension]` — a Worker drift fails the frontend at compile time.

## Prompt calibration

`worker/src/prompt.ts` SYSTEM_PROMPT uses a three-step algorithmic floor:

1. **Classify stack overlap** — FULL / NO / ADJACENT
2. **Set overallScore** from the classification before scoring dimensions
3. **Recruiter sanity check** — shortlist-worthy ⇒ at least moderate

The intent is "opportunity-mindset" scoring — junior candidates with the right stack and shipped work are surfaced as `strong`, not buried as `weak`. See `instruction/work/todos.html` TASK-005 note for the 3 smoke calibration rounds that led to this version.

## Spec & plan

`instruction/fit-analyzer-spec.html` is the frozen build spec. `instruction/work/plan.html` is the execution lens — § 00–§ 07 cover the original build (3 streams · 17 tasks), § 08 the execution-phase amendment that took it to live URL. `instruction/work/todos.html` is the live board.
