# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: fit-analyzer

**Resume × JD fit analyzer.** A single-page React app plus one Cloudflare Worker that proxies Google Gemini structured-output calls. Stateless — no database. The 1-day MVP build is specified by `instruction/fit-analyzer-spec.html` (frozen). The execution lens — with three spec corrections — lives in `instruction/work/plan.html`. When the spec and plan disagree, the plan wins on the three explicitly flagged deviations only; spec wins everywhere else.

### Layout

Two independent folders. **Not a workspace** — install and build each separately.

```
worker/   Cloudflare Worker — POST /api/analyze · holds GEMINI_API_KEY
  src/index.ts     handler: CORS → rate-limit → validate → Gemini → parse → JSON
  src/prompt.ts    SYSTEM_PROMPT + buildUserTurn + FIT_REPORT_SCHEMA
  wrangler.toml    compatibility_date, ALLOW_ORIGIN var, [[ratelimits]] block

web/      Vite + React 18 + TS + Tailwind SPA
  src/lib/types.ts    FitReport types — must stay in lockstep with worker schema
  src/lib/pdf.ts      pdfjs-dist v5 worker setup (see "pdfjs gotcha" below)
  src/lib/api.ts      analyze() returns a typed discriminated Result
  src/components/     ScoreGauge · DimensionBar · FindingList · ResultPanel · InputPanel
  src/App.tsx         owns the 5-state discriminated union (AppState)

instruction/
  fit-analyzer-spec.html        the frozen spec (source of truth)
  work/plan.html                execution plan with the 3 spec deviations
  work/requirements.html        user's request + build-time decisions
  work/todos.html               live kanban board (JSON island in <script id="workflow-state">)
```

### Commands

Run from the **sub-folder** the command applies to. There is no root `package.json`.

`worker/`:

| Task | Command |
|---|---|
| Install | `npm install` |
| Local dev (port 8787) | `npm run dev` |
| All unit tests | `npm test` |
| **Single test by name** | `npx vitest run -t "rate_limited"` |
| Typecheck | `npm run typecheck` |
| Set prod secret | `npx wrangler secret put GEMINI_API_KEY` |
| Deploy | `npm run deploy` |

`web/`:

| Task | Command |
|---|---|
| Install | `npm install` |
| Local dev (port 5173) | `npm run dev` |
| Build for prod | `npm run build` |
| Preview built bundle | `npm run preview` |
| Typecheck | `npm run typecheck` |
| Deploy | `npx wrangler pages deploy ./dist --project-name=fit-analyzer` |

**Local end-to-end** needs both servers running concurrently. `web/.env` sets `VITE_API_BASE=http://127.0.0.1:8787` to reach the local Worker.

### The frozen contract

`FitReport` JSON is the seam between Worker and frontend. It is defined **twice** and the two must move together:

- `worker/src/prompt.ts` → `FIT_REPORT_SCHEMA` (Gemini `responseSchema`, **uppercase** type tokens: `OBJECT` / `STRING` / `INTEGER` / `ARRAY`)
- `web/src/lib/types.ts` → TypeScript interfaces

The `dimensions` field is an **ordered 4-tuple** — `technical_skills`, `experience`, `education`, `domain_fit`, always in that order — typed as `[Dimension, Dimension, Dimension, Dimension]` so a Worker drift fails the frontend at compile time. Verdict thresholds: `strong` ≥ 75, `moderate` 50–74, `weak` < 50.

### Non-obvious constraints

- **`wrangler.toml` rate-limit syntax is updated from the spec.** Uses `name = "RATE_LIMITER"` (NOT `binding =`) and a `[ratelimits.simple]` sub-table (NOT inline `simple = { ... }`). Requires Wrangler ≥ 4.36.0. The spec snippet at §06 is outdated — do not "fix" the TOML back to that form.

- **pdfjs gotcha.** `GlobalWorkerOptions.workerSrc = workerUrl` must live in `web/src/lib/pdf.ts` — the same module that calls `getDocument`. Vite emits the worker via the `?url` import; moving the assignment to a separate init file silently breaks PDF extraction. Pinned to `pdfjs-dist@^5`.

- **Gemini key never leaves the Worker.** Frontend talks only to `/api/analyze`; key is `wrangler secret put GEMINI_API_KEY` (prod) or `worker/.dev.vars` (local — gitignored). Send via the `x-goog-api-key` header, never `?key=` URL params.

- **`rateLimited` is a distinct UI state, not an error.** The 5 states (`idle | loading | done | error | rateLimited`) form a discriminated union; `AppState` is defined in `web/src/components/ResultPanel.tsx` and re-imported by `App.tsx`. `lib/api.ts` maps HTTP 429 → `{ ok: false, kind: 'rate_limited' }`.

- **Worker error responses are short opaque codes only** — `{"error":"bad_input" | "rate_limited" | "upstream" | "parse"}`. Never echo Gemini's response body.

- **Tests are Worker-side only (vitest + miniflare) plus one Playwright happy-path E2E** with a mocked `/api/analyze`. No Storybook, no per-component tests. See plan §05 for the four mandatory worker tests.

- **Stretch items are out of scope per spec §09:** no response streaming, no D1 history, no keyword highlighting. Don't add them without amending `instruction/work/requirements.html` first.

### Deployment sequence

Three steps, in this order:

1. `cd worker && npx wrangler secret put GEMINI_API_KEY && npm run deploy` → captures `https://fit-analyzer-worker.<sub>.workers.dev`.
2. `cd web` → set `VITE_API_BASE` in `.env` to the Worker URL → `npm run build` → `npx wrangler pages deploy ./dist --project-name=fit-analyzer` → captures `https://fit-analyzer.pages.dev`.
3. Lock down: `cd worker && npx wrangler secret put ALLOW_ORIGIN` with the **exact** Pages URL, then in Google AI Studio restrict the API key to *Generative Language API* only.

`--project-name=fit-analyzer` is **required** on first non-interactive Pages deploy or Wrangler will prompt and the script will block.

---

## Workflow Skills

Detect intent จากคำพูดของ user แล้วทำตาม skill ที่เหมาะสม

### Global Rules

#### 1. ใช้ Skill เสมอเมื่อทำได้

ก่อนทำอะไรให้ตรวจสอบ `.claude/skills/` ว่ามี skill ที่เกี่ยวข้องไหม — ถ้ามี ให้อ่านแล้วทำตาม skill นั้น อย่าทำเองโดยไม่ผ่าน skill เด็ดขาด ถ้าทำงานแล้วพบว่ามี skill ที่ช่วยได้ (เช่น กำลัง commit อยู่แล้วมี git-commit skill) ให้สลับไปใช้ skill ทันที

#### 2. ใช้ Agent Team หรือ Sub-Agent เสมอ

**อย่าทำงานคนเดียว** — เลือกใช้ตามความเหมาะสม:

- **Agent Team** — เมื่อ teammates ต้องสื่อสาร แชร์ข้อมูล ท้าทายแนวคิดกัน หรือ coordinate ข้าม concern (frontend + backend + tests)
- **Sub-Agent** — เมื่อต้องการ worker ที่ทำงานเร็ว รายงานกลับ ไม่ต้องคุยกับ agent อื่น

ใช้ทั้งสองแบบร่วมกันได้ในงานเดียว

**Model Selection:**

| Role | Model | หมายเหตุ |
|------|-------|----------|
| Main Agent / Team Lead | **Opus 4.6** | เสมอ — ตัดสินใจ, ประสานงาน, review |
| Teammate / Sub-Agent (default) | **Opus 4.6** | ใช้เป็น default ทุกงาน |
| Teammate / Sub-Agent (lightweight) | **Sonnet 4.6** | เฉพาะงานง่ายที่มั่นใจว่า Sonnet ทำได้ดี เช่น format, lint, simple lookup |

**หลักการ:** ใช้ Opus 4.6 เป็น default สำหรับทุก agent — ลดไปใช้ Sonnet 4.6 เฉพาะเมื่อมั่นใจว่างานนั้นง่ายจริงๆ และไม่ต้องการ reasoning ลึก

#### 3. เอกสารทั้งหมดเป็น HTML — สร้างเป็น "artifact" ไม่ใช่กระดาษ

แผน, todos, requirements, รายงานทดสอบ, session summary — **ทุกอย่างเป็นไฟล์ `.html`** ใน `./instruction/work/` ไม่มี `.md` deliverable อีกต่อไป

HTML ไม่ใช่แค่ Markdown ที่เปลี่ยนนามสกุล — มันคือ **artifact ที่ออกแบบมาเพื่องานนั้นๆ** ก่อนสร้างให้ถามตัวเองว่า *"แบบไหน user ถึงจะเห็นภาพ?"* แล้วเลือก format ให้ตรง (comparison grid / spec page / interactive prototype / board / report) — โชว์ด้วย mockup, diagram, ปุ่ม/slider จริง แทนการบรรยายเป็นข้อความ และพับ detail ที่ไม่จำเป็นเก็บไว้ใน `<details>` สร้าง/แก้ผ่าน skill **html-doc** เสมอ และ **เปิดไฟล์ขึ้นมาเสนอ user ทุกครั้ง** ที่มีการสร้างหรืออัปเดต

(ข้อยกเว้น: ไฟล์ `SKILL.md` และ `CLAUDE.md` ยังเป็น Markdown เพราะเป็นไฟล์ config ไม่ใช่ deliverable)

#### 4. อัปเดต todos.html ทุกครั้ง

อัปเดต `./instruction/work/todos.html` ทุกครั้งที่มีการเปลี่ยนแปลง — แก้เฉพาะ JSON ใน `<script id="workflow-state">` (ดู skill html-doc) อย่าแก้ markup ที่ render แล้ว ใส่ timestamp `YYYY-MM-DD HH:mm` ที่ field `updated`

#### 5. Project-level path เท่านั้น

`./instruction/work/` — ห้ามใช้ `~/.claude/` หรือ user-level path

#### 6. Sub-agents ห้ามถาม user

ให้ return กลับ main agent เพื่อตัดสินใจ

#### 7. File Lock Registry

เช็คก่อน edit, ปลดล็อคเมื่อเสร็จ — เก็บใน `fileLocks` ของ todos.html

#### 8. ห้ามใส่ AI signature

git commits ห้ามมี "Generated by Claude" เด็ดขาด

### Intent Detection

| User says | Skill |
|-----------|-------|
| "มีงานค้างไหม", "status", "continue" | **workflow-todo** |
| "วางแผน", "plan", "อยากทำ...", "เพิ่มฟีเจอร์..." | **workflow-plan** |
| "ลุย", "ทำเลย", "โอเคกับแพลน", "เริ่มเลย" | **workflow-work** |
| "ตรวจสอบ", "จบงาน", "done", "เสร็จแล้ว" | **workflow-end** |
| "save", "บันทึก", "หยุดก่อน", "ปิดเครื่อง" | **workflow-exit** |
| "commit", "commit and push" | **git-commit** |
| "push", "merge", "merge to [branch]" | **git-push** |
| "deploy", "ship it", "ส่งขึ้น production" | **deploy** |
| "test frontend", "เทส UI", "ดูหน้าเว็บ" | **frontend-test** |
| Creating any Cloudflare resource | **cloudflare-naming** |
| "sync env", "อัปเดต example", adding/changing env vars | **env-sync** |
| Creating / updating / showing any plan, todo, or report | **html-doc** |

`html-doc` มักไม่ถูกเรียกตรงๆ — workflow skills อื่นเรียกใช้มันเพื่อสร้างและเปิดไฟล์ HTML

### Work Directory

```
./instruction/
├── work/           # Active (HTML): todos.html, plan.html, requirements.html,
│                   #                test-report.html, session-summary.html
└── archive/        # Completed: [no]-[name]/*.html

./agent-temp/       # Temp files: screenshots, logs — never commit, never leave at project root
```

ทุกไฟล์ใน `work/` เป็น HTML ที่ self-contained — เปิดจาก disk ได้เลย แชร์ได้ทันที
