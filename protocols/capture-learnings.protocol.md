# Protocol: Capture Learnings

> Cognitive mode: Technical educator / Pattern archaeologist
> Custom skill for this project.

---

## When to use

This skill is **on-demand, trigger-based** — not every feature produces a learning, and forcing it to run on every ship yields empty entries. Invoke it when a concrete trigger fires:

**Strong triggers (almost always capture):**
- A debugging session lasted >30 minutes and ended in a "aha — this library behaves differently than the docs suggest" moment
- A failed first attempt was abandoned in favour of a different architecture (capture the trade-off)
- A recurring `fix:` commit class shipped (e.g., three "mark as client component" fixes in a week → there's a principle hiding)
- A new library / directive / pattern was used for the first time in this codebase AND had a non-obvious gotcha
- An EVOLUTION.md amendment was triggered by a technical surprise — capture the surprise here as well

**Moderate triggers (capture if the _why_ is non-obvious):**
- A trade-off decision was made that future work should understand
- A pattern was established that should be reused (or avoided) in similar situations

**Skip triggers (do not capture):**
- Pure feature work with no surprises
- Bug fixes where the bug was an obvious typo / stale cache / missing await
- Anything that would just restate the official docs

After capturing, **Step 5 (Cross-reference) is mandatory, not optional** — a learning that doesn't flow back into the relevant skill, `MODELS.md`, or the feature doc will be forgotten. If the cross-reference would be trivial or unnecessary, the "learning" probably isn't worth capturing.

## How to think

You are a senior engineer writing notes for your future self six months from now.
The code shows _what_ was done. Your job is to capture _why_ — the reasoning,
trade-offs, constraints, and principles that the code alone doesn't convey.

You are NOT writing documentation (that's the document skill). You are building a
**knowledge base of development principles** — reusable mental models that transfer
across features.

### What makes a good learning

A learning is worth capturing when:

1. **It's non-obvious** — someone reading the code wouldn't immediately understand _why_
   this approach was chosen over alternatives
2. **It's transferable** — the principle applies to future work, not just this specific feature
3. **It cost something to learn** — it required debugging, research, trial-and-error, or
   a failed first attempt
4. **It's about _why_, not _how_** — the code shows how; the learning explains the reasoning

### What is NOT a learning

- API reference (read the docs)
- Step-by-step instructions (that's documentation)
- Code snippets without context (that's a template)
- Obvious patterns well-known in the ecosystem

## Workflow

### Step 1: Identify learnings from the feature

Review the git diff and implementation. For each file or decision, ask:

1. **Was this the first time this pattern was used?** (e.g., first Prisma query, first
   Server Component with DB access, first MUI styled component)
2. **Was there a failed attempt before the working approach?** (e.g., tried X, it broke
   because Y, switched to Z)
3. **Was a trade-off made?** (e.g., chose approach A over B because of constraint C)
4. **Was something surprising discovered?** (e.g., MUI v7's createTheme returns creation
   object, not resolved Theme type)

### Step 2: Categorise each learning

Assign a domain:

| Domain          | Examples                                                           |
| --------------- | ------------------------------------------------------------------ |
| React           | Server vs Client Components, Suspense patterns, hook rules         |
| Next.js         | App Router conventions, data fetching, caching, middleware          |
| TypeScript      | Type narrowing, generics, module augmentation, strict mode gotchas |
| MUI             | Theme API, styled() vs sx, component overrides, CSS variables      |
| Prisma / DB     | Query patterns, migrations, relations, driver adapters             |
| Testing         | Mock strategies, async testing, environment setup                  |
| Architecture    | Data flow, separation of concerns, error boundaries                |
| Performance     | Bundle size, rendering, caching, lazy loading                      |
| Accessibility   | ARIA patterns, keyboard navigation, screen reader behaviour        |
| DevOps / CI     | Build pipeline, deployment, environment configuration              |

### Step 3: Write the learning

Each learning follows this structure:

```markdown
### [Concise title — what the principle IS]

**Domain:** [category from Step 2]
**First used in:** [feature name + relevant file(s)]
**Date:** [YYYY-MM-DD]

**The principle:**
[1-3 sentences stating the principle clearly. This should be quotable — someone
should be able to read just this section and understand the takeaway.]

**Why this matters:**
[What goes wrong if you ignore this? What was the cost of learning it? What
constraint or behaviour makes this non-obvious?]

**Trade-offs considered:**
[What alternatives were evaluated? Why were they rejected? Under what conditions
might a different choice be better?]

**Example from this feature:**
[Brief concrete reference — file path, code pattern, or decision that demonstrates
the principle in action.]
```

### Step 4: Write to the knowledge base

Append learnings to `docs/Learnings/LEARNINGS.md`. Group by domain. If the file
doesn't exist, create it with a header:

```markdown
# Development Learnings — ${PROJECT_NAME}

> Living knowledge base of principles, patterns, and trade-offs discovered during
> development. Not documentation — these capture the _why_ behind decisions.
>
> Organised by domain. Each entry records a principle, why it matters, trade-offs
> considered, and a concrete example from the feature that introduced it.

---
```

### Step 5: Cross-reference

If the learning is significant enough to affect future planning or review:

- Add a note to `MODELS.md` → "Project-Specific API Surface Notes" if it's a
  library gotcha
- Update the relevant skill if it would improve future pipeline runs (e.g., a
  testing gotcha → update plan-engineering rules)
- Reference the learning in the feature's documentation

## Output format

```
## Learnings Captured: [Feature Name]

### New learnings
| # | Title | Domain | Transferable? |
|---|-------|--------|---------------|
| 1 | [title] | [domain] | [Yes/Partially/No] |

### Cross-references added
- [Where each learning was cross-referenced, if applicable]

### Skipped (not worth capturing)
- [Patterns/decisions reviewed but deemed too obvious or not transferable]
```

## Quality Signals

After this skill is used, observe these signals to determine if it performed well:

| Signal                       | Good                                                                                     | Poor                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Future reference rate**    | Learnings are actually consulted during later features                                   | Learnings are written but never read again                                    |
| **Principle clarity**        | A new team member could read a learning and immediately apply the principle               | Learnings are vague, context-dependent, or require reading the original code  |
| **Duplication prevention**   | Team avoids repeating the same mistake or rediscovering the same pattern                 | Same insight is rediscovered independently in a later feature                 |
| **Selective capture**        | Only non-obvious, transferable principles are captured (5-10 per major feature)          | Everything is captured (noise) or nothing is captured (missed value)          |
| **Cross-reference accuracy** | MODELS.md and skill updates from learnings are correct and useful                        | Cross-references are stale, wrong, or point to deleted code                   |

> If signals trend poor, use the **improve skill** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Capture the _why_, not the _how_ — if it's in the code, don't repeat it
- Be selective — 3-5 high-quality learnings per feature is better than 15 shallow ones
- Every learning must have a concrete example — abstract principles without grounding are useless
- Write for your future self — assume you've forgotten the context in 6 months
- Update existing learnings when new evidence refines the principle
- Don't capture library API details that are in the official docs — capture the gotchas and surprises
- Always include trade-offs — a principle without trade-offs is dogma, not engineering
