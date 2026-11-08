---
name: workflow-end
description: Complete session with security review and archiving. Use when user says "ตรวจสอบ", "จบงาน", "done", "เสร็จแล้ว", or when all tasks show tested status. Runs security checks, generates an HTML session summary, and archives completed work.
---

# Workflow End

Complete a work session with security review and archiving. The session summary
is an HTML document produced via the **html-doc** skill.

## Workflow

### 1. Verify all tasks complete

Parse the `tasks` JSON island in `todos.html`. Every task must have
`status: "done"`. If any are incomplete → tell the user, suggest **workflow-work**.

### 2. Final test suite (use agent team)

Spawn an agent team for parallel final checks:

- **Teammate A (Opus 4.6):** Run `npm run test`, `npm run lint`, `npx tsc --noEmit`
- **Teammate B (Opus 4.6):** Security review (below)
- **Teammate C (Opus 4.6):** Run **frontend-test** skill on changed pages
- **Teammate D (Opus 4.6):** Run **env-sync** skill if env vars changed

### 3. Security review

```bash
npm audit
grep -rn "password\|secret\|api_key\|token" src/ --include="*.ts" --include="*.vue" --include="*.js"
cat .gitignore | grep -E "\.env"
```

If issues found → append fix tasks to `todos.html`, return to **workflow-work**.

### 4. Build the session summary -> `session-summary.html`

Via **html-doc**, build a verdict-first artifact — no fixed
layout (see html-doc for the mindset):

- Lead with a `stats` row: tasks completed, tests passed, issues fixed.
- A `note ok` / `note danger` callout carrying the security verdict.
- A `table` of completed tasks (id + name + result) and a `table` of files
  changed (path + change summary).
- Keep what matters visible; routine detail (the full passing-test list, raw
  audit output) goes inside `<details class="fold">`.

### 5. Archive

```bash
NEXT=$(ls ./instruction/archive/ 2>/dev/null | grep -oE "^[0-9]+" | sort -rn | head -1 || echo 0)
DIR=$(printf "%03d" $((NEXT + 1)))-[plan-name]
mkdir -p ./instruction/archive/$DIR
cp ./instruction/work/requirements.html \
   ./instruction/work/plan.html \
   ./instruction/work/todos.html \
   ./instruction/work/test-report.html \
   ./instruction/work/session-summary.html \
   ./instruction/archive/$DIR/ 2>/dev/null
```

The archived `.html` files stay openable as a permanent, shareable record.

### 6. Reset active work

Reset `todos.html` to the empty-state JSON island (`session:"empty"`,
`updated:"-"`, empty `tasks`/`fileLocks`, `resume:null`) — copy fresh from
`html-doc` `references/todos.template.html`. Remove `plan.html`,
`requirements.html`, `test-report.html`, and `session-summary.html` from
`work/` (they now live in `archive/`).

### 7. Report completion

Open `session-summary.html` for the user and state the archive location.
