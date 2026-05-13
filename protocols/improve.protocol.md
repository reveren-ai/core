# Protocol: Improve

> Cognitive mode: Meta-learning systems engineer
> Inspired by the Observe → Amend → Evaluate loop from better-skills.dev and cognee

---

## When to use

- After any protocol produces a suboptimal result
- When a pattern of protocol failure is noticed (false positives, missed issues, stale conventions)
- Periodically (e.g., after every 5–10 feature cycles) as a hygiene check
- When the project's stack, conventions, or structure changes significantly
- When asked to "improve protocols", "update protocols", or "the [X] protocol missed something"

## How to think

You are a meta-learning engineer. Your job is not to build features — it's to make
the system that builds features better. Static protocols silently degrade. Protocols that
were written for yesterday's codebase produce worse results on today's codebase
without throwing a single error.

The failure mode is **not** obvious breakage. It's **quiet degradation** — a protocol
that still runs, still produces output, but the output is less useful, less accurate,
or less relevant than it should be.

Your weapon against this is the **Observe → Classify → Amend → Evaluate** loop.

---

## The Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐  │
│   │ OBSERVE  │──▸│ CLASSIFY │──▸│  AMEND   │──▸│  EVALUATE    │  │
│   │          │   │          │   │          │   │              │  │
│   │ Capture  │   │ Generic  │   │ Propose  │   │ Test change  │  │
│   │ signals  │   │ or       │   │ targeted │   │ Human review │  │
│   │ after    │   │ project- │   │ edits to │   │ Accept or    │  │
│   │ protocol │   │ specific │   │ the      │   │ reject       │  │
│   │ runs     │   │ ?        │   │ protocol │   │              │  │
│   └──────────┘   └──────────┘   └──────────┘   └──────┬───────┘  │
│        ▴                                               │          │
│        └───────────────────────────────────────────────┘          │
│                    (loop on next protocol use)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Observe

After a protocol is used, capture structured observations. **This is the most critical
step** — garbage observations produce garbage amendments.

### What to observe

| Signal                | Question                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| **Usefulness**        | Did the output directly help the developer? Was anything ignored?       |
| **Accuracy**          | Were the findings correct? Any false positives or false negatives?      |
| **Coverage**          | Did the checklist cover all relevant areas? Anything missing?           |
| **Relevance**         | Are examples, file paths, and patterns still current?                   |
| **Efficiency**        | Were any steps redundant? Did the protocol waste time on low-value checks? |
| **Convention drift**  | Does the protocol match current project conventions in MODELS.md?          |
| **Output quality**    | Was the report format useful? Did it need restructuring?                |
| **Downstream impact** | Did the next protocol in the pipeline get good input from this one?        |

### Per-protocol quality signals

Each protocol has specific quality signals defined in its own file (see "Quality Signals"
section in each protocol). Use those as your observation framework.

### Observation format

```markdown
## Observation: [protocol-name] — YYYY-MM-DD

### Context

[What feature/task was the protocol used for?]

### Signals

| Signal           | Rating                       | Notes     |
| ---------------- | ---------------------------- | --------- |
| Usefulness       | ✅ Good / ⚠️ Mixed / ❌ Poor | [details] |
| Accuracy         | ✅ / ⚠️ / ❌                 | [details] |
| Coverage         | ✅ / ⚠️ / ❌                 | [details] |
| Relevance        | ✅ / ⚠️ / ❌                 | [details] |
| Efficiency       | ✅ / ⚠️ / ❌                 | [details] |
| Convention drift | ✅ / ⚠️ / ❌                 | [details] |

### Specific Issues

1. [Concrete issue: what the protocol got wrong or missed]
2. [Another issue]

### What Worked Well

1. [What the protocol got right — don't lose this in the amendment]
```

---

## Step 2: Classify

Before proposing an amendment, determine whether the improvement is **generic** (would benefit any project using the protocols kit) or **project-specific** (only relevant to this project's stack, conventions, or domain).

### Classification criteria

| Signal | Generic | Project-Specific |
| ------ | ------- | ---------------- |
| **References a library/framework?** | No — applies to any stack | Yes — mentions MUI, Prisma, Next.js, etc. |
| **References a file path or naming convention?** | No — or uses the pattern abstractly | Yes — cites `components/ArticleTabs/` or `pnpm test:run` |
| **Is it about the cognitive mode itself?** | Yes — how to think about reviews, QA, planning | No — it's about what to check for in a specific context |
| **Would a Rails/Go/Python project benefit?** | Yes | No |
| **Is it a new quality signal or checklist pattern?** | Usually generic | Depends on specificity |
| **Is it about tool integration?** | Usually generic (Chrome extension, worktrees) | Project-specific if it names a particular MCP or service |

### Edge cases

Some amendments have both a generic core and a project-specific example:
- **Generic core**: "When planning tests for library config objects, verify what the function returns vs. what it resolves at runtime."
- **Project-specific example**: "For MUI v7, `createTheme()` returns the creation object, not the resolved theme."

In this case, classify as **generic** and note the project-specific example separately. The generic rule goes to the template protocol. The specific example stays in the project's protocol and/or MODELS.md.

### Classification output

Tag every amendment in the observation and in EVOLUTION.md:

- `[generic]` — applies to any project. Update `templates/protocols/` when accepted.
- `[project-specific]` — only relevant here. Update `.protocols/` only.
- `[generic+example]` — generic core with a project-specific example. Update both.

---

## Step 3: Amend

> Previously Step 2 — renumbered after Classify was added.

Based on accumulated observations, propose **targeted** changes to the protocol file.

### Amendment principles

1. **Targeted, not total rewrites** — change only what the observations justify
2. **Preserve what works** — if a section is producing good results, don't touch it
3. **Be specific** — "improve the checklist" is not an amendment. "Add a check for missing Suspense boundaries around async components" is.
4. **One concern per amendment** — don't bundle unrelated fixes
5. **Version the change** — every amendment gets logged in `.protocols/EVOLUTION.md`

### What can be amended

- **Checklist items**: Add missing checks, remove redundant ones, reorder by priority
- **Examples**: Update file paths, patterns, and code snippets to match current conventions
- **"How to think" guidance**: Refine based on what actually matters in practice
- **Output format**: Restructure if the current format isn't useful downstream
- **Quality signals**: Add new signals discovered during use, remove unhelpful ones
- **Edge cases**: Add scenarios the protocol didn't anticipate

### Amendment format

```markdown
## Proposed Amendment: [protocol-name] [generic|project-specific|generic+example]

### Triggered by

[Link to observation or describe the pattern]

### Classification

[generic / project-specific / generic+example] — [one-line justification]

### Current behavior

[What the protocol does now that's suboptimal]

### Proposed change

[Exact changes to make — cite specific sections]
- If [generic]: also update templates/protocols/[protocol].protocol.md
- If [generic+example]: update templates/protocols/ with generic core, keep example in .protocols/ and/or MODELS.md

### Expected improvement

[What should get better after this change]

### Risk

[What could get worse — protocols can regress too]
```

---

## Step 4: Evaluate

Before accepting an amendment, evaluate it. **Protocol drift from accumulated small
changes that individually look fine but collectively degrade is the #1 risk.**

### Evaluation checklist

- [ ] **Human review**: Developer reviews the proposed amendment and approves
- [ ] **Convention check**: Amendment is consistent with current `MODELS.md` conventions
- [ ] **No regression**: Change doesn't break existing workflow or remove checks that catch real issues
- [ ] **Cross-protocol consistency**: If the change affects the pipeline, other protocols still chain correctly
- [ ] **Evidence-based**: The amendment is backed by concrete observations, not hypothetical improvements
- [ ] **Scope-appropriate**: The change addresses what was observed, not a kitchen-sink rewrite
- [ ] **Classification correct**: Generic amendments truly apply to any project; project-specific ones reference this project's stack/conventions

### Evaluation modes

| Mode                       | When to use                       | How it works                                                   |
| -------------------------- | --------------------------------- | -------------------------------------------------------------- |
| **Human review**           | Always (default)                  | Developer reads the diff and accepts/rejects                   |
| **Before/after**           | For significant changes           | Run the protocol on the same input before and after the amendment |
| **Protocol-specific signals** | For protocols with measurable output | Compare quality signals before and after                       |

### After evaluation

If **accepted**:

1. Apply the change to the project protocol file (`.protocols/[protocol].protocol.md`)
2. **Templates sync (mandatory for `[generic]` and `[generic+example]`):**
   - If `templates/protocols/[protocol].protocol.md` exists → apply the generic core to it.
   - If it does not exist → create it now with the generic core (strip project-specific file paths, commands, and examples; keep only what transfers to any stack).
   - If the classification is `[generic+example]` → the project-specific example stays in `.protocols/` and/or `MODELS.md`; only the generic rule/checklist item moves to `templates/`.
   - Verify: after sync, `ls templates/protocols/` should contain every protocol tagged `[generic]` or `[generic+example]` in EVOLUTION.md. If the verification fails, the amendment is not complete — fix the sync before moving on.
3. Log the amendment in `.protocols/EVOLUTION.md` with the classification tag, and state explicitly whether `templates/protocols/` was touched (e.g., `Templates: synced` / `Templates: n/a (project-specific)` / `Templates: created`).
4. Commit with `docs(protocols): amend [protocol-name] — [brief description]`. Include both the `.protocols/` and `templates/protocols/` changes in the same commit so the log ties them together.

If **rejected**:

1. Log the rejection in `.protocols/EVOLUTION.md` with the reason and classification
2. The observation is preserved — it may inform a future amendment

---

## Periodic Health Check

The health-check orchestration lives in its own protocol: **`audit-protocols`** (`.protocols/audit-protocols.protocol.md`).
That protocol sweeps the ecosystem, ranks findings, and hands this protocol a queue. Run `audit-protocols`
every ~10 feature cycles (or when prompted); run `improve` on each queue item. Do not re-implement
the ecosystem sweep inline here — if the audit logic needs to change, change `audit-protocols`.

---

## Rules

- **Never amend a protocol without an observation to justify it.** Hypothetical improvements are how protocols drift.
- **Human-in-the-loop by default.** The developer must approve every protocol amendment. Auto-amendments are not allowed.
- **Log everything in `.protocols/EVOLUTION.md`.** Accepted amendments, rejected amendments, health checks — all logged.
- **Small, targeted changes beat big rewrites.** If you feel the urge to rewrite a protocol from scratch, you've waited too long to run the improve loop.
- **Quality signals are the soul of the loop.** Without them, observe produces nothing useful and amend produces random changes.
- **Protocols that improve protocols can also degrade.** The improve protocol itself is subject to the loop. Check its own quality signals.
- **Git is your version control.** Every protocol amendment is a commit. Rollback is `git revert`. No separate versioning system needed.
