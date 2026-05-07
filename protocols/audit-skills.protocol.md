# Protocol: Audit Skills

> Cognitive mode: Systems auditor / Internal consultant
> Orchestrator skill that sweeps the entire skills + agents + workflow ecosystem,
> surfaces drift and missed signals, and produces a prioritised amendment queue
> for the **improve** skill to action.

---

## When to use

- On request: "audit our skills", "are our skills still relevant?", "health-check the pipeline"
- Periodically: every ~10 feature cycles, or monthly, whichever comes first
- After a noticeable incident the current skills should have caught (reviewer green, QA green, but prod/UX still broken)
- When adding a new agent, hook, or script — check whether the skills that reference them are still accurate
- Before extracting the skills to a portable npm package

This skill is **upstream** of `improve`. `improve` amends one skill based on one observation; `audit-skills` scans everything and hands `improve` a ranked list of what to look at next.

## How to think

You are an internal consultant auditing a toolkit that has been evolving for a few weeks. Your job is not to rewrite — it is to **find the quiet rot**:

- Skills that no one runs anymore
- Agents whose instructions drifted from the skill they reference
- Workflows that mention commands that no longer exist
- Learnings that were captured but never lifted into skills
- Review/QA/cyber findings that recurred — meaning the skill should have evolved to catch them
- Conventions in MODELS.md that the skills haven't absorbed yet

Bias to **evidence**. A skill is not stale because it "feels" stale; it is stale because the evolution log is silent while the symptom keeps recurring in commits, TODOS.md, or incident notes.

---

## Signal sources (read these, in this order)

1. **`.protocols/EVOLUTION.md`** — last amendment date per skill, rejection reasons, repeated triggers
2. **`docs/Learnings/LEARNINGS.md`** — captured principles that should have been cross-referenced into a skill (per capture-learnings Step 5) but weren't
3. **`TODOS.md`** (and `TODOS-TERMINAL.md`, `TODOS-BUSINESS.md` if present) — count `[review finding]` / `[cyber finding]` / `[bug]` labels; repeated themes = missed coverage in review/cyber
4. **`git log --oneline --since="30 days ago"`** — look for `docs(skills):`, `fix:` clusters on the same subsystem, and *especially* `fix:` commits that a skill should have prevented
5. **`MODELS.md`** — the Skills table, Agents table, Hooks table, Pipeline. Every row must resolve to an actual file / script / command
6. **`.claude/agents/*.md`** — each agent's `skills:` frontmatter (if present) and its body must match the skill it references
7. **`.claude/settings.json` + `.claude/hooks/*.sh`** — verify every hook path exists, every permission is still needed, every skill the Stop hook tests is still accurate
8. **`scripts/pipeline.sh`, `scripts/background.sh`, `scripts/hardcore-auto.sh`** — pipeline step ordering must match the MODELS.md "Skills System" ordering
9. **`templates/protocols/`** — for every `[generic]` amendment in EVOLUTION.md, confirm `templates/skills/<skill>.md` received the same change
10. **`.claude/settings.json` + `.claude/settings.local.json` `permissions.allow`** — diff every command each skill / agent names in its workflow against the allow-list. Gaps cause interactive approval prompts mid-run and fracture the audit trail. Commands like `pkill`, `timeout`, `curl`, `gh`, and ecosystem auditors are the usual missing entries.

If a signal source is missing, note it — that itself is a finding (e.g., LEARNINGS.md absent means capture-learnings is dead).

---

## Workflow

### Step 1 — Inventory

Produce a single table of every skill, agent, hook, and script, with the columns:
`Name | File | Last touched (git) | Last amended (EVOLUTION.md) | Referenced by | Status`.

"Referenced by" lists *everywhere* the name appears across MODELS.md, other skills, agents, and scripts. A skill that no one references is either foundational-and-silent (improve, capture-learnings) or orphaned.

### Step 2 — Staleness pass

For each skill:
- Days since last amendment. Flag >60 days without amendment **AND** >5 pipeline runs in that window as **stale-candidate**.
- If the skill references a file path, command, or script, verify each exists verbatim.
- If the skill references another skill, verify that skill still exists under the claimed name.

### Step 3 — Drift pass

- **Agent ↔ skill drift**: open each agent and the skill it delegates to; the agent's instructions must not contradict the skill. Common drift: mandatory steps added to the skill that the agent doesn't repeat, tools listed in the agent that the skill doesn't use, severity scales that disagree.
- **Skill ↔ script drift**: each script step must map to a skill; each skill listed in MODELS.md's pipeline must have a matching script step.
- **Skill ↔ MODELS.md drift**: the Skills System table, Agents table, and Hooks table each row must resolve.
- **Skill ↔ templates/ drift**: every EVOLUTION.md entry tagged `[generic]` or `[generic+example]` must have a matching change in `templates/skills/<skill>.md`.
- **Permissions drift**: for each skill / agent that names shell commands in its workflow, verify each command is covered by `permissions.allow` in `.claude/settings.json` or `.claude/settings.local.json`. Missing non-destructive commands are amendment candidates; missing destructive commands (force-push, DB drops, `rm -rf /`) should **not** be added — flag as "keep interactive" findings.

### Step 4 — Coverage pass (the high-value one)

For each recent signal (TODOS.md findings in the last month, LEARNINGS.md entries, fix commits), ask:
- Which skill **should** have caught this?
- Did it? If yes → note as a win (do not propose an amendment).
- If no → is the gap in the skill's checklist, its "when to use", or its cognitive framing? Draft a specific amendment proposal.

A repeated finding across cycles is the loudest signal — e.g., three "RSC Client boundary" incidents all caught by `curl` but not by `pnpm build` was the evidence that promoted the live-smoke mandate on 2026-04-24. Look for the same shape.

### Step 5 — Orphan pass

Anything in `.protocols/`, `.claude/agents/`, or `scripts/` that:
- is not listed in MODELS.md, **and**
- is not invoked by any pipeline/background script, **and**
- was not read or edited in the last 60 days

is a candidate for removal or promotion. Decide per-item — do not blanket-delete.

### Step 6 — Produce the audit report

Use the output format below. The final section is the **Amendment Queue** — a ranked list the `improve` skill can work through. Every item must cite evidence (signal source + specific line / commit / TODO id).

### Step 7 — Hand off

- For each amendment queue item, mark whether it should be actioned now (user agrees in-session), deferred to the next improve cycle, or rejected with reasoning.
- Accepted items that are in-session → run `improve` on them immediately.
- Deferred items → append to `.protocols/EVOLUTION.md` under a `## Pending Amendments — YYYY-MM-DD` section (not as accepted amendments — as a queue).

---

## Output format

```markdown
## Skills Audit — YYYY-MM-DD

### Overall health: [Healthy / Needs attention / Stale]

### Inventory
| Item | Type | File | Last amended | Status |
|------|------|------|--------------|--------|
| [name] | skill / agent / hook / script | [path] | YYYY-MM-DD | [OK / stale / drift / orphan] |

### Drift findings
1. **[severity] [one-line description]**
   - Evidence: [file:line or commit sha]
   - Impact: [what goes wrong if unfixed]
   - Proposed fix: [targeted change, classified as generic / project-specific / generic+example]

### Coverage gaps
1. **[severity] [the pattern / class of issue]**
   - Signal: [e.g. "3× `[review finding]` in TODOS.md for RSC Client boundary"]
   - Skill that should have caught it: [name]
   - Why it missed: [checklist gap / framing gap / out-of-scope gap]
   - Proposed amendment: [specific addition, with classification tag]

### Orphans
- [item] — last touched [date]; not referenced by [MODELS.md / scripts / agents]. Recommendation: [remove / promote / keep-as-silent].

### Wins (what's working — do not touch)
- [skill] — [evidence that it's pulling its weight]

### Amendment queue (ranked)
| # | Skill | Amendment | Evidence | Classification | Priority |
|---|-------|-----------|----------|----------------|----------|
| 1 | [skill] | [one-line] | [source] | generic / project-specific / generic+example | high / medium / low |

### Recommended immediate actions
- [what to run right now via `improve`]

### Deferred to next cycle
- [what to park in EVOLUTION.md's pending section]
```

---

## Quality Signals

After this skill is used, observe these signals to determine if it performed well:

| Signal | Good | Poor |
|---|---|---|
| **Evidence density** | Every finding cites a specific file, commit, or TODO id | Findings are vague ("skill feels stale") |
| **Amendment acceptance rate** | >70% of queued amendments were accepted by `improve` in the following cycle | Audit produces noise that gets rejected |
| **Drift catch rate** | Drift found by the audit matched drift the developer noticed independently | Developer found drift the audit missed, or audit invented drift |
| **Orphan calibration** | Orphans flagged were genuinely dead; wins flagged were genuinely valuable | Orphans were load-bearing silent skills; wins were rubber-stamps |
| **Coverage-gap precision** | Proposed amendments address the real reason the skill missed the class of issue | Amendments are cosmetic — they would not have prevented the incident |
| **Time to next audit** | Cadence (every ~10 cycles / monthly) holds without the audit having to be manually remembered | Audits only happen when something breaks |

> If signals trend poor, use the **improve skill** — this skill is itself subject to the observe/amend loop.

---

## Rules

- **Evidence or it didn't happen.** No finding without a concrete source.
- **Small queues beat big queues.** 3–5 high-confidence amendments > 20 speculative ones.
- **Never amend in this skill.** Audit-skills produces the queue; `improve` applies the changes. Keep the responsibilities separate so the audit trail stays clean.
- **Wins matter.** Silent successes (skills that are pulling their weight) are the thing keeping the system stable — call them out so no one "simplifies" them away.
- **Prefer amendment over creation.** A new skill is the last resort. Most "we need a new skill" signals are actually coverage gaps in an existing one.
- **Classify every proposed amendment** with `[generic]` / `[project-specific]` / `[generic+example]` so the amendment queue hands `improve` something it can immediately run.
- **Respect the human-in-the-loop rule** — audit-skills proposes; the human approves before `improve` applies.

---

## Relationship to other meta-skills

| Skill | Purpose | Input | Output |
|-------|---------|-------|--------|
| **capture-learnings** | Capture the _why_ behind a one-off decision | Git diff + debugging session | An entry in `docs/Learnings/LEARNINGS.md` |
| **audit-skills** (this) | Sweep the ecosystem, rank what needs attention | EVOLUTION.md, LEARNINGS.md, TODOS.md, git log, MODELS.md | A prioritised amendment queue |
| **improve** | Apply one targeted amendment to one skill | A single queue item + evidence | An accepted amendment logged in EVOLUTION.md |

If the audit queue is empty and no coverage gaps surface, the system is healthy — do not manufacture work.
