---
"@reveren-ai/core": minor
---

Add the `self-improve` agent — a scheduled improvement loop that reviews what
changed since its last run, distils durable learnings, and opens a PR proposing
protocol / operating-manual amendments (never auto-merged; quiet when nothing
material was learned). Adds an optional `selfImprove` config block with a
cadence of `4h` / `8h` / `12h` / `daily` / `weekly` (default `daily`). reveren
runs no daemon — wire the cadence into your own scheduler. The agent also runs
coordinator-triggered (after a major workflow or a painpoint) or manually, and
accepts optional **issues** and a **focus scope** to target the learning; the
coordinator now dispatches it at those high-signal moments and passes them
through.
