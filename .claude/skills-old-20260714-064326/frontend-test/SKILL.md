---
name: frontend-test
description: Comprehensive cross-functional frontend testing via MCP Playwright — always opens a real browser, clicks, and interacts. Use when user says "test frontend", "ทดสอบหน้าเว็บ", "เทส UI", "check the page", "เช็ค console", or after making frontend changes. This skill has TWO phases. Phase 1 (plan): generates test scenarios and ADDS them as tasks to plan.html and todos.html via workflow-plan — then waits for user approval. Phase 2 (execute): after approval, runs all test tasks via MCP Playwright with a PDCA cycle until zero errors and zero warnings, then writes test-report.html. All temp files go in ./agent-temp/.
---

# Frontend Test

Comprehensive frontend testing via **MCP Playwright** — always real browser
interaction. Two phases, same plan → approve → work cycle as the rest of the
workflow system. All documents are HTML via the **html-doc** skill.

## Phase 1: Plan Test Scenarios

This phase uses **workflow-plan** — it ADDS test scenarios to the existing plan.

### 1. Ask test environment (if unknown)

> ทดสอบที่ไหนครับ? (local / staging / production)

- **local** → `http://localhost:3000`
- **staging** → staging URL (commit + push + wait for deploy first)
- **production** → production URL (commit + push + wait for GitHub Actions)

### 2. Read context

```bash
cat ./instruction/work/plan.html ./instruction/work/todos.html 2>/dev/null
ls .claude/skills/
```

### 3. Generate test scenarios (use Agent Team)

```
Team: test-scenario-planning
Lead (Opus 4.6) — synthesize into a test plan section + tasks
├── Teammate A: Analyze plan/tasks -> list all changed/added features
├── Teammate B: Analyze codebase -> identify cross-functional impacts
└── Teammate C: Check .claude/skills/ -> note skills for potential fixes
```

Cover **every case at every level**:

| Scenario Type | What to Test |
|---------------|--------------|
| Happy path | Feature works as the requirement states |
| Edge cases | Empty states, long inputs, special chars, boundaries |
| Error handling | Invalid inputs, permissions, failures |
| Cross-function | Feature A's changes don't break Feature B |
| Regression | Unchanged systems still function |
| State transitions | Multi-step flows complete correctly |

Prioritize: critical paths → changed code paths → adjacent features →
peripheral spot-checks.

### 4. Add to plan and todos (via workflow-plan + html-doc)

**Append** a new `<section>` to `plan.html` (with a TOC entry) listing the test
environment, base URL, and the numbered scenario list.

**Append** test tasks to the `tasks` array in `todos.html`, each with
`skills: ["frontend-test"]` — one task per scenario or scenario group.

### 5. STOP — open the documents, wait for approval

Open `plan.html` and `todos.html`. The user may approve → Phase 2; request
changes → revise and re-present; or close the session → state is saved.

## Phase 2: Execute Tests

Triggered when the user approves ("ลุย", "เทสเลย", "go"), calls `/frontend-test`
again, or calls `/workflow-work` (which picks up the test tasks).

### 1. Setup

```bash
mkdir -p ./agent-temp
```

All screenshots, logs, and temp files → `./agent-temp/`. Never leave them at the
project root.

### 2. Ensure environment ready

```bash
lsof -i :3000 || npm run dev &   # local
sleep 3
# staging/prod: deploy via git-commit -> git-push, wait for deploy
```

### 3. Execute test tasks (PDCA cycle)

For each test task in `todos.html`:

```
PLAN  : read the test scenario from the task
DO    : execute via MCP Playwright
        navigate -> screenshot (./agent-temp/) -> click/fill -> screenshot
        -> read console
CHECK : result correct? console clean?
ACT   : if not -> identify source file, read the relevant .claude/skills/,
        apply fix; if staging/prod: commit -> push -> wait for deploy;
        re-test (back to DO)
done  : mark the task status "done" in todos.html, open it, next task
```

Keep the `todos.html` JSON island current as tasks pass (via **html-doc**).

**Zero tolerance:** 0 errors AND 0 warnings in the browser console after all
tests complete. No artificial retry limit — keep fixing until truly resolved;
if fundamentally stuck, report to the user with detailed findings.

### 4. Console severity

| Level | Action |
|-------|--------|
| `error` | MUST FIX — do not proceed |
| `warning` | MUST FIX — no warnings allowed |
| `log` | Review if relevant |

### 5. Pre-fix: check skills

```bash
ls .claude/skills/
```

Always read the relevant `SKILL.md` (`nuxt/`, `nuxt-ui/`, `vue/`, `tailwind/`,
etc.) before making any fix.

### 6. Common fixes

| Console Message | Likely Fix |
|-----------------|-----------|
| `[Vue warn]: ...` | Check props, refs, lifecycle |
| `hydration mismatch` | `<ClientOnly>`, check `onMounted` |
| `404 (Not Found)` | Check paths, routes |
| `TypeError: Cannot read` | Null checks, optional chaining |

## Test Report -> `test-report.html`

After all test tasks complete, build `test-report.html` via **html-doc** — verdict first, no fixed
layout (see html-doc for the mindset):

- Lead with a `stats` row: scenarios passed / failed / fixed.
- Console status up top: a `note danger` for anything that broke, a `note ok`
  once errors and warnings are both at 0.
- For each issue found and fixed: source file, what broke, the fix, re-test
  result, commit hash (if staging/prod) — shown for issues only, not clean runs.
- The full passing-scenario list and the category breakdown go inside
  `<details class="fold">`.
- Embed key screenshots from `./agent-temp/` where they make a point.

Open `test-report.html` for the user when done.
