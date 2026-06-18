# Protocols (reveren)

This directory was scaffolded by [reveren](https://reveren.ai) (`rvr init`). The `*.protocol.md` files are MIT-licensed (`LICENSE` alongside this README) and are intentionally independent of reveren's CLI/SDK license (BUSL).

Re-sync to the latest bundled set at any time with `rvr sync` (Phase 2) or by re-running `rvr init --force`.

---

## AI-Assisted Workflow (reveren)

reveren is the workflow system for AI-assisted development. Every AI tool (Claude Code, Copilot, Cursor, Windsurf, etc.) in this repo follows the same conventions, defined by the protocol format specs below.

### Protocols

| Protocol               | File                                  | Purpose                                                       |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------- |
| Plan: Product          | `plan-product.protocol.md`            | Product thinking — challenge the request, find scope          |
| Plan: Engineering      | `plan-engineering.protocol.md`        | Technical blueprint — architecture, file plan, tests          |
| Plan: UX               | `plan-ux.protocol.md`                 | UX/IA blueprint — flows, states, accessibility                |
| Copywriter             | `copywriter.protocol.md`              | Brand voice + Copy Grounding — no fabricated claims           |
| Review                 | `review.protocol.md`                  | Paranoid code review — find bugs CI misses                    |
| QA                     | `qa.protocol.md`                      | QA testing — diff-aware Playwright validation                 |
| Cyber                  | `cyber.protocol.md`                   | Security audit — vulnerability + hardening pass               |
| Document               | `document.protocol.md`                | Documentation — feature docs, changelog, README               |
| Ship                   | `ship.protocol.md`                    | Release checklist — lint, test, docs, PR                      |
| Pre-Production         | `pre-production.protocol.md`          | Pre-prod readiness — env parity, smoke, rollback              |
| Audit Protocols        | `audit-protocols.protocol.md`         | Audit the protocols themselves                                |
| Improve                | `improve.protocol.md`                 | Self-improvement — observe, amend, evaluate protocols         |
| Learn From Users       | `learn-from-users.protocol.md`        | Capture user signals into protocol/feature updates            |
| Capture Learnings      | `capture-learnings.protocol.md`       | Turn incidents/wins into durable rules                        |

> The filename suffix here is `.protocol.md` (the default). Your project may rename it via `protocols.config.ts` (`terminology.extension`) — the workflow is identical.

### Working principle: resolving issues

When you hit an issue, blocker, or ambiguity, reach for the relevant protocol above and apply its principles to resolve it yourself **before** escalating. Always come back with at least one concrete proposed resolution and a recommendation — never surface a bare problem. Only ask for input when the protocols genuinely cannot resolve it **and** the decision is the user's to make (destructive, public-facing, spend, or architectural).

### Agents (optional, host-side)

reveren ships protocols. Specialist agents that consume them live in your repo under `.claude/agents/` (or your tool's equivalent). The canonical roster:

| Agent          | Role                                                                |
| -------------- | ------------------------------------------------------------------- |
| coordinator    | Scans `TODOS.md` + git state, dispatches the right specialist agent |
| engineer       | Implementation — feature work, bug fixes, review findings           |
| reviewer       | Read-only paranoid code review                                      |
| qa-runner      | QA testing in an isolated git worktree                              |
| cyber-auditor  | Security hardening tasks (vulns, secrets, deps)                     |
| doc-writer     | Documentation updates (feature docs, README, CHANGELOG)             |

### Hooks (optional, host-side)

| Hook                                      | Trigger    | Purpose                                                |
| ----------------------------------------- | ---------- | ------------------------------------------------------ |
| `.claude/hooks/validate-commit-msg.sh`    | PreToolUse | Enforces conventional commit format on git commit      |
| `.husky/pre-push` → `scripts/pre-push.sh` | git push   | Branch-aware parity gate (typecheck + lint + tests)    |

Recommended pre-push behaviour: pushes to `main` run the full gate; pushes elsewhere run a scoped gate (full typecheck, lint on changed files only, `vitest --changed` if the touched workspace supports it). Escape hatches: `PRE_PUSH_SKIP=1 git push` (logged) or `git push --no-verify` (emergency).

### Pipeline

```
Plan: Product → Plan: Engineering → Implement → Review → QA → Cyber → Document → Ship
                                                  ↕        ↕     ↕         ↕
                                              (agent)  (agent) (agent)  (agent)
                                                                              ↕
                                                                         Improve (loop)
```

The pipeline script orchestrates the full workflow for one feature. The background processor uses the coordinator agent to pick non-disruptive work off `TODOS.md` and dispatch it to specialist agents. Hardcore-auto batch-processes the entire "Next Up" list.

### Pipeline Commands

If your project ships the reference `scripts/pipeline.sh`, `scripts/background.sh`, and `scripts/hardcore-auto.sh`, wire these to `package.json` so they're discoverable from `pnpm run`:

| Command                       | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `pnpm pipeline`               | Full pipeline for a feature (interactive)                         |
| `pnpm pipeline:next`          | Auto-pick next item from `TODOS.md` and run the pipeline          |
| `pnpm pipeline:semi-auto`     | Semi-autonomous: approve plan, hands-off until push               |
| `pnpm pipeline:full-auto`     | Full autonomous: skip plan, hands-off until push                  |
| `pnpm pipeline:hardcore`      | Batch-process all "Next Up" items from `TODOS.md`                 |
| `pnpm pipeline:hardcore:dry`  | Preview what hardcore mode would process                          |
| `pnpm pipeline:pre-merge`     | Review + QA + Cyber + Ship only                                   |
| `pnpm pipeline:review-qa`     | Review + QA in parallel only                                      |
| `pnpm background`             | Coordinator picks non-disruptive tasks, dispatches agents         |
| `pnpm background:auto`        | Auto-approve dispatch plan (still pauses before push)             |
| `pnpm background:security`    | Background-process only security hardening tasks                  |
| `pnpm background:bugs`        | Background-process only bug fixes / review findings               |
| `pnpm background:dry`         | Preview what the background processor would dispatch              |

### Pipeline Modes

| Mode           | Planning       | Implementation | Review + QA      | Ship          | Push          |
| -------------- | -------------- | -------------- | ---------------- | ------------- | ------------- |
| `(default)`    | Human approves | Interactive    | Parallel agents  | Interactive   | Interactive   |
| `--semi-auto`  | Human approves | Autonomous     | Parallel agents  | Autonomous    | **Human gate**|
| `--full-auto`  | Skipped        | Autonomous     | Parallel agents  | Autonomous    | **Human gate**|
| `--skip-plan`  | Skipped        | Interactive    | Parallel agents  | Interactive   | Interactive   |
| `--pre-merge`  | —              | —              | Parallel agents  | Interactive   | Interactive   |

### Autonomous Safety Rails

Autonomous modes (`--semi-auto`, `--full-auto`) include built-in safety:

- **Feature branch** — always creates a branch, never commits to `main` directly
- **Safety gates** — typecheck, lint, tests, and build must pass or the pipeline aborts
- **Critical issue pause** — if the reviewer or cyber-auditor finds critical issues, pauses for human review
- **Deployment gate** — always pauses before `git push` and PR creation (human approval required)

You can pause at any step and resume later with `--pre-merge` or `--skip-plan`.

### Hardcore Autonomous Mode

Batch-process multiple features from the `TODOS.md` "Next Up" list. Each feature gets its own branch and PR. A failing feature does not cascade to the next — the runner returns to `main` and continues. All logs go to `.pipeline/hardcore/` (gitignored).

### Background Processor

The background processor is the smartest automation layer — the **coordinator agent** analyzes the backlog, identifies what's safe to work on, and dispatches the right specialist for each task:

1. **Coordinator plans** — scans `TODOS.md` + git state, identifies non-disruptive tasks, routes to the right agent
2. **You approve** — review the dispatch plan (or `--auto` to skip)
3. **Agents execute** — each task: implementation agent → typecheck/lint/test gates → reviewer + QA (parallel) → cyber-auditor (if relevant) → doc-writer
4. **You push** — human approval always required before push/PR, even in `--auto`

**Task routing:** Security → `cyber-auditor`. Bugs / review findings → `engineer`. Docs → `doc-writer`.

**Key difference from hardcore mode:** Hardcore runs the FULL pipeline (including product + engineering planning) for each task. Background processor skips planning and routes directly to specialist agents — designed for small, well-scoped tasks that don't need product/UX decisions.

### Automation (Loops)

Inside any Claude Code session, use `/loop` for recurring tasks:

```bash
/loop 30m use the reviewer agent on any open PR
/loop 1h use the qa-runner agent in quick smoke mode
/loop 5m check CI status, address any review comments
```

### Project Conventions File

The pipeline and agents resolve the project conventions file at runtime in this order: `CLAUDE.md` → `AGENTS.md` → `MODELS.md`. If none exist, agents fall back to the repo `README.md` plus `TODOS.md`. Add one when you want to pin project-specific rules — the scripts will pick it up without any wiring changes.

---

## Reference Implementations

- The reference `scripts/pipeline.sh`, `scripts/background.sh`, `scripts/hardcore-auto.sh`, and `.claude/agents/*.md` files live in the reveren repo under `packages/core/docs/reference/`.
- See [reveren.ai](https://reveren.ai) for the canonical docs.
