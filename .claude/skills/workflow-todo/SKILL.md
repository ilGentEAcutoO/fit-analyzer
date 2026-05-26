---
name: workflow-todo
description: Check and load pending tasks. Use this skill at session start, when user asks about task status, says "มีงานค้างไหม", "status", "ทำอะไรอยู่", "continue", or any indication they want to know what's pending. Also triggers when resuming interrupted work. Opens the HTML task dashboard.
---

# Workflow Todo

Load `./instruction/work/todos.html` and present task status by **opening the
dashboard** in the browser.

## Workflow

### 1. Read the dashboard state

Read the JSON state island from `todos.html`:

```bash
cat ./instruction/work/todos.html 2>/dev/null
```

Parse the JSON inside `<script type="application/json" id="workflow-state">`.
If the file does not exist yet → no active work.

### 2. Open the dashboard for the user

Use the **html-doc** skill's `open_doc` helper to open `todos.html`. The user
reads status visually — do not re-type the whole list as chat text. Give a
one-line summary and let the dashboard speak.

### 3. If tasks exist

Summarize counts (pending / in-progress / done / blocked) and ask:

- Continue pending tasks → **workflow-work**
- Start fresh (archive old) → **workflow-end** then **workflow-plan**
- Inspect a task → point them at the open dashboard

### 4. If `resume` is set (not null)

The previous session was interrupted by **workflow-exit**. The dashboard shows a
Resume Context panel at the top with exit time, per-agent progress, and next
steps. Confirm with the user, then hand off to **workflow-work**.

### 5. If no tasks and no resume

Dashboard shows the empty state. Guide the user to **workflow-plan**.

## Status Reference

| JSON `status` | Dashboard label | Meaning |
|---------------|-----------------|---------|
| `pending`  | Pending      | not started |
| `progress` | In progress  | being worked |
| `impl`     | Implemented  | code done, needs test |
| `done`     | Tested       | implement + test complete |
| `blocked`  | Blocked      | stuck, needs decision |

Updating state → see **html-doc** (edit the JSON island only).
