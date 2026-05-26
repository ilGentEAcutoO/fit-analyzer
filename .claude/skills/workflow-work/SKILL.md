---
name: workflow-work
description: Implementation with agent teams and sub-agents. Use when user approves plan, says "ลุย", "ทำเลย", "โอเคกับแพลน", "เริ่มเลย", "approved", "go ahead". Always use agent teams or sub-agents — never work alone. Reads plan.html and todos.html then executes all tasks, invoking relevant skills as specified in each task, and keeps the HTML dashboard live.
---

# Workflow Work

Implement the plan using **agent teams** or **sub-agents**. Never work alone.
All progress is reflected in `todos.html` via the **html-doc** skill.

## Choosing: Agent Team vs Sub-Agent

| Use | When |
|-----|------|
| **Agent Team** | Tasks span multiple concerns, teammates need to share findings, coordinate on shared files, or challenge each other's approaches |
| **Sub-Agent** | Quick focused task that reports back — no inter-agent communication needed (e.g. lint check, simple lookup) |

Both can be used in the same workflow. Default to agent teams for main work.

## Agent Team Assembly

The main agent (Opus 4.6) acts as **team lead** — coordinates, assigns tasks,
synthesizes results. Teammates work independently, each in its own context, and
communicate **directly with each other**.

### Model Selection

Opus 4.6 is the default for every agent — drop to Sonnet 4.6 only for work that
is definitively simple (formatting, linting, simple lookup/copy).

### Example: Agent Team

```
Plan has 4 tasks: auth API, login form, tests, DB migration

Team: feature-impl
Lead (Opus 4.6) — coordinator, does NOT implement directly
├── Teammate A (Opus 4.6) — TASK-001: auth API + DB migration
├── Teammate B (Opus 4.6) — TASK-002: login form component
├── Teammate C (Opus 4.6) — TASK-003: write tests (after A & B signal done)
└── Teammate D (Opus 4.6) — cross-review: test A's API, test B's form

A finishes types -> messages B: "Auth types ready at src/types/auth.ts"
B finishes form  -> messages C: "Login form done, ready for tests"
C writes tests   -> messages D: "Tests written, ready for review"
```

## Workflow

### 1. Load plan and tasks

```bash
cat ./instruction/work/plan.html ./instruction/work/todos.html
```

Read the plan sections and parse the `tasks` JSON island from `todos.html`.

### 2. Check skills per task

Each task lists `skills` — ensure teammates read those skill files before
starting work.

### 3. Analyze parallelization

Group independent tasks → spawn as teammates simultaneously. Identify
dependencies → teammates wait and message each other. Plan cross-review.

### 4. Spawn the agent team

Each teammate receives: assigned task(s), files to work on, **skills to read
first**, file-lock instructions, and who to message when done.

### 5. Keep the dashboard live (via html-doc)

As work proceeds, update the JSON island in `todos.html` — edit JSON only,
never the rendered markup:

- Move `status`: `pending` → `progress` → `impl` → `done` (or `blocked`)
- Set `assigned` to the teammate
- Set `progress` (0–100) on in-flight tasks; add a short `note` only when a task
  is blocked or needs carry-over context
- Add/remove `fileLocks` rows on edit start/finish
- Refresh `updated` every change

Keep the board scannable — heavy detail (subtask breakdowns, long logs) belongs
in `plan.html`, not in the task JSON.

After a batch of updates, **open `todos.html`** so the user sees progress.

### 6. Team rules

- Use skills — check `.claude/skills/` and each task's `skills` before working
- Lock files in `fileLocks` before editing; unlock when done
- Teammates communicate directly for coordination
- Sub-agents cannot ask the user → return to the team lead
- Run tests after implementation

### 7. Change detection

If the user requests changes mid-work → the team lead pauses teammates, saves
progress to `todos.html`, switches to **workflow-plan** amendment mode
(additive), and resumes after approval.

## Cross-Review Pattern

Teammate A implements → Teammate B reviews + tests A's code (messages A with
feedback), and vice versa. If review finds issues → fix directly, no round-trip
through the lead.

## Task Status Flow

```
pending -> progress -> impl -> done
                                ^
                        (impl + review both pass)
```

## Error Handling

- Test failures: max 3 retries → mark `blocked`, team lead decides
- Teammate crash: save partial progress, unlock files, spawn replacement
- Dependency conflict: team lead resolves

## Integration Phase (after all tasks)

The team lead coordinates final checks:

1. Full test suite
2. **frontend-test** skill on changed pages
3. **env-sync** skill if env vars changed
4. Cross-teammate consistency check
5. Security quick-check
6. All tasks → `done`; open `todos.html` to confirm
