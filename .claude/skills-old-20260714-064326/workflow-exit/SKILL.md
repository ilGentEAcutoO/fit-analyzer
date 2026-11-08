---
name: workflow-exit
description: Emergency save before closing session. Use when user says "save", "บันทึก", "หยุดก่อน", "ปิดเครื่อง", "เดี๋ยวกลับมา", or needs to interrupt work unexpectedly. Saves all sub-agent states into todos.html so work can resume later via workflow-todo.
---

# Workflow Exit

Emergency save for session interruption. State is written into the `resume`
field of the `todos.html` JSON island via the **html-doc** skill.

## Tell the user: "อย่าปิด terminal จนกว่าจะเสร็จ!"

## Workflow

### 1. Signal all sub-agents to save

Each teammate records: progress %, last action, modified files (staged /
unstaged), current state, next steps, blockers.

### 2. Write the resume context into todos.html

Via **html-doc**: set the `resume` object in the JSON island (do NOT touch the
rendered markup). The dashboard renders a Resume Context panel from it:

```json
"resume": {
  "exitTime": "YYYY-MM-DD HH:mm",
  "reason": "user requested save",
  "agents": [
    { "name": "Teammate A", "task": "TASK-003",
      "nextStep": "wire validation + submit handler" }
  ]
}
```

Also update each affected task's `status`, set `progress`, add a short `note`
for carry-over context, and refresh `updated`.

### 3. Stage uncommitted changes

```bash
git add -A
git stash save "workflow-exit: $(date +%Y%m%d-%H%M)"
# or: git commit -m "WIP: [summary]"
```

### 4. Confirm and open

Open `todos.html` so the user sees the saved Resume Context, then confirm it is
safe to close the terminal.

## Resume

The user returns → **workflow-todo** detects a non-null `resume` → shows the
Resume Context panel → user confirms → **workflow-work** picks up. After a
successful resume, set `resume` back to `null`.
