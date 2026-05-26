---
name: workflow-plan
description: TDD-based planning with agent teams. Use when user says "วางแผน", "plan", "อยากทำ...", "เพิ่มฟีเจอร์", or on a change request during workflow-work (amendment mode). Produces an HTML plan artifact and populates todos.html with actionable tasks, then opens them in the browser. If an existing plan hasn't been archived, ADDS to it — never overwrites. Ends at plan approval — does NOT start implementation.
---

# Workflow Plan

Create TDD-based development plans as **visual HTML artifacts**. Additive by
default. Ends when the plan is approved. All output goes through the
**html-doc** skill — read it first.

## Output is a visual artifact, not a document

Do NOT produce a one-column wall of text, and do NOT reach for a fixed layout.
Via **html-doc**, build a view that previews the actual work and lets the user
decide at a glance — approve, or open a conversation about one part. End plans
and proposals with an `<div class="approve">` bar.

What that view is depends entirely on the work:

- Proposing a UI -> render the screen the way it will look.
- A real fork -> the candidate approaches side by side, each a true sketch.
- Logic or behaviour -> an annotated `<svg>` flow.
- A data shape or API -> the shape itself.

There is no catalogue — see **html-doc**. A larger plan composes several of
these: a mocked screen here, a comparison for one open decision there, a flow
diagram for the tricky part. Edge cases and rejected options fold into
`<details class="fold">`.

## Additive rule

If `./instruction/work/plan.html` exists and is NOT archived:

- **APPEND** a new `<section>` (with a matching TOC entry) — never overwrite.
  Stamp it with `YYYY-MM-DD HH:mm`.
- **APPEND** new tasks to the `tasks` array in `todos.html`; existing tasks are
  untouched. Number sequentially after the last task.

Only `workflow-end` archives a plan. Until then, plans accumulate.

## Workflow

### 1. Research (agent team)

Spawn a team for parallel research — teammates communicate directly:

```
Team: research-team
- Teammate A: Context7 for framework docs (resolve-library-id -> get-library-docs)
- Teammate B: Scan the codebase for patterns, conventions, related code
- Teammate C: Check available MCP tools and .claude/skills/
- Lead (Opus 4.6): Synthesize into coherent context
```

Fallback: web search, llms.txt, node_modules README. Tell the user if MCP tools
(Storybook, Playwright) are missing, but continue.

### 2. Discuss details (Q&A)

Clarify exact behavior, edge cases, UI/UX, performance, security.

### 3. Save the original request -> requirements.html

Via **html-doc**: a short artifact preserving the user's **exact wording** in a
`<blockquote>` — never paraphrase. Add a one-line restated goal and any agreed
constraints as a small list or table. Keep it brief; this is a record.

### 4. Build the plan -> plan.html

Via **html-doc**, compose the views that preview this work (see the mindset
above). Whichever views you build, the plan must convey:

- **What and why** — the concrete, testable requirement.
- **Architecture** — a real inline `<svg>` data-flow diagram, not prose, not
  ASCII.
- **Security** — concrete attack vectors + mitigations in a
  `<div class="note danger">`.
- **Test specs (TDD)** — Unit / UI (Storybook) / E2E (Playwright) as a table.
- **The work** — the task list. Keep each task one scannable line with its
  relevant skills noted; detail lives in the plan body, not repeated per task.

### 5. Approval

- No draft requested -> plan is final; populate todos.html now.
- Draft requested (`ฉบับร่าง`) -> keep the plan visibly marked draft; wait for
  approval before populating todos.html.

When final, populate the `tasks` array in todos.html via **html-doc** (append
if tasks exist). Each task object:

```json
{ "id":"TASK-001", "name":"short scannable name", "status":"pending",
  "priority":"high|medium|low", "assigned":"unassigned",
  "skills":["env-sync"], "files":["server/api/auth.ts"] }
```

### 6. Open everything

Open requirements.html, plan.html, and todos.html so the user reviews the plan
visually.

### 7. STOP HERE

The plan skill ends here. Do NOT start implementation — the user must trigger
**workflow-work**.

## Amendment mode

On a change request during workflow-work:

1. Pause current work.
2. Review change impact.
3. Append an amendment `<section>` to plan.html (additive) + update tests.
4. Check consistency with existing work.
5. Append new tasks to todos.html.
6. Open the updated artifacts; resume after approval.

## Task design principles

- **Parallel-friendly** — design for concurrent agent-team execution.
- **Self-contained** — clear inputs/outputs per task.
- **Two-level done** — implement + test = done.
- **Security-first** — consider attack vectors early.
- **Skill-aware** — every task names the skills that apply.
