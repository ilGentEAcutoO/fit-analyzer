---
name: html-doc
description: Build workflow output as visual HTML artifacts that preview the actual work. Use whenever a plan, proposal, exploration, question, task tracker, or report needs to be created, updated, or shown. Other workflow skills (workflow-plan, workflow-todo, workflow-work, workflow-end, workflow-exit, frontend-test) invoke this skill instead of writing Markdown. There is NO template and NO catalogue of layouts — the agent looks at the work and composes the view that lets the user decide at a glance. Every artifact is a single self-contained .html file under ./instruction/work/, opened in the browser the moment it is written.
---

# HTML Doc

Workflow output is a **visual artifact that previews the actual work** — not a
document, and not a form to fill in. When you plan, propose, or ask something,
build the thing that lets the user *see* it and respond: "yes, do that" or
"wait, let's talk about one part."

Read `references/examples.html` once before building — but read it as range,
not as a menu.

## The mindset

Before building, ask two questions:

1. **What is the work, concretely?** A screen, a behaviour, a choice, a refactor,
   a data shape, a piece of copy.
2. **What would let the user see it and decide in one glance?**

Then compose that. Some honest examples of where the second answer leads —
these are illustrations of the range, **not options to pick from**:

- Proposing a UI → render the screen itself, the way it will look.
- A feel that words can't carry (timing, spacing, colour) → an interactive
  prototype with real controls and a "copy as prompt" button.
- A real fork in the road → the candidates side by side, each a true sketch
  with its trade-offs.
- Logic or behaviour → an annotated `<svg>` flow of what happens.
- A data shape, an API, a config → show the shape, not a description of it.

If the work doesn't match any of these, invent the view that fits. The point is
never "which pattern" — it is "what makes this obvious."

## Principles

- **Preview the real thing.** Show the artifact of the work, not a list of its
  parts. A plan for a search panel contains a search panel.
- **Built to be approved.** Shape every plan/proposal so the user can glance and
  act. End it with an approve affordance (`<div class="approve">` — a question,
  a "go" button, a "let's discuss" button).
- **Show, don't tell.** A mockup, a diagram, a working control beats a
  paragraph. If it can be drawn or made interactive, don't write a sentence
  about it.
- **Fold the noise.** The screen shows the essence. Edge cases, rejected
  options, raw detail go inside `<details class="fold">` or stay with the agent.
- **Consistent skin, free layout.** The design system makes every artifact look
  like family. It never dictates structure — compose freely within it.

## Hard rules (these are fixed)

1. **HTML only.** Every plan / proposal / record / report is one `.html` file.
   No `.md` deliverables. (`SKILL.md` and `CLAUDE.md` stay Markdown — config.)
2. **Self-contained.** Inline `references/design-system.css` inside a `<style>`
   tag. No CDN, no external assets. Works opened from disk, shares as one file.
3. **Open after every write.** Created or updated → open it in the browser
   (`open_doc` below). Presenting = opening.
4. **`todos.html` keeps its JSON island.** It is the one file with a steady
   shape, because agents edit it constantly — see the last section.

## References

`references/` holds, instead of templates:

- **`design-system.css`** — the Birchline design system. Inline it verbatim
  into every artifact. Tokens, window chrome, cards, pills, toggles, sliders,
  diff rows, collapsible blocks, tabs, stat callouts, approve bar, product-
  screen surface, charts, task board.
- **`examples.html`** — a gallery of varied artifacts built with the system.
  Read it for the design language and to lift component markup. It shows the
  *range*; it is not a set of layouts to choose between.
- **`todos.template.html`** — the only real template (JSON-island board).

## Procedure

### Build a new artifact

1. Answer the two mindset questions — decide what view previews this work.
2. Lift components from `examples.html`; inline `design-system.css`.
3. Wrap the content in a `<div class="window">` browser frame titled with the
   filename. End plans/proposals with an `<div class="approve">` bar.
4. Save to `./instruction/work/<name>.html`, then **open it**.

### Update an existing artifact

- **`todos.html`** — edit ONLY the JSON in
  `<script type="application/json" id="workflow-state">`. The page re-renders
  itself; never touch generated markup. Always refresh `updated`.
- **A plan** — append; never overwrite earlier content. Stamp it with a date.
- **Reports** — regenerate fully; they are point-in-time.

### Open in the browser (every time)

```bash
open_doc() {
  f="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  if command -v open >/dev/null 2>&1; then open "$f"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$f"
  elif command -v wslview >/dev/null 2>&1; then wslview "$f"
  else echo "Open in a browser: file://$f"; fi
}
open_doc ./instruction/work/plan.html
```

## todos.html — the JSON state island

`todos.html` carries live workflow state as JSON so updates stay reliable while
the view stays readable. The renderer in the template rebuilds the board on
load. Schema:

```json
{
  "session": "feature / debounced-search",
  "updated": "YYYY-MM-DD HH:mm",
  "tasks": [
    {
      "id": "TASK-001",
      "name": "AbortController search wiring",
      "status": "progress",
      "priority": "high",
      "assigned": "Teammate A",
      "skills": ["frontend-test"],
      "files": ["search.ts"],
      "progress": 60,
      "note": "optional one-line note"
    }
  ],
  "fileLocks": [
    { "file": "search.ts", "by": "Teammate A", "since": "HH:mm" }
  ],
  "resume": null
}
```

- `status`: `pending` / `progress` / `impl` / `done` / `blocked`.
- `priority`: `high` / `medium` / `low` (optional).
- `progress`: 0-100 (optional, drawn as a bar on non-done tasks).
- `resume` is `null` normally. `workflow-exit` sets it to pause context:

```json
"resume": {
  "exitTime": "YYYY-MM-DD HH:mm",
  "reason": "user requested save",
  "agents": [
    { "name": "Teammate A", "task": "TASK-003", "nextStep": "wire validation" }
  ]
}
```

Keep tasks scannable — heavy detail belongs in `plan.html`, not the board.
