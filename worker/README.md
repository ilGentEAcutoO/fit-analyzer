# fit-analyzer-worker

Cloudflare Worker that proxies `POST /api/analyze` to Gemini 3.1 Flash-Lite with rate limiting and a frozen JSON output contract. See `../instruction/fit-analyzer-spec.html` §05–§06 for the full contract.

## Local dev

1. `npm install`
2. Copy `.dev.vars.example` to `.dev.vars` and paste your real Gemini key.
3. `npm run dev` — serves on `http://127.0.0.1:8787`.

## Test

```
npm test
```

Runs four vitest specs covering input validation, parse failure, and the rate-limit branch (no live Gemini calls).

## Deploy

```
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

After both Worker and Pages are live, override `ALLOW_ORIGIN` in `wrangler.toml` (or via `wrangler secret put ALLOW_ORIGIN`) to the exact Pages URL. See the root README for the full deploy story.
