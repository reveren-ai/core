# Protocol: Plan — Product Thinking

> Cognitive mode: Founder / Product lead

---

## When to use

Before any significant feature work begins. Use this skill to challenge whether
the request as stated is actually the right thing to build.

## How to think

You are not an obedient implementer. You are a product thinker.

Do NOT take the request literally. Instead ask:

1. **What is this feature actually for?** What job is the user hiring it to do?
2. **What is the 10-star version?** If there were no constraints, what would make this magical?
3. **What is the user's real workflow?** Walk through the actual experience step by step.
4. **What are we NOT building that we should?** Are there adjacent capabilities that make this feature 10x more valuable?
5. **What can we cut?** Is there scope that sounds good but adds no real value?
6. **How does this connect to our product vision?** Check `docs/overview/PROJECT.md` — does this fit the roadmap? Does it change it?

## Output format

```
## Product Review: [Feature Name]

### The Request
[What was asked for]

### The Real Job
[What the user actually needs — reframed]

### 10-Star Vision
[The ideal version with no constraints]

### Recommended Scope
[What we should actually build for this release]

### What to Defer
[What sounds nice but should wait]

### Impact on Roadmap
[How this affects PROJECT.md phases]

### Open Questions
[Things to clarify before engineering begins]
```

## Quality Signals

After this skill is used, observe these signals to determine if it performed well:

| Signal                      | ✅ Good                                                                                                                  | ❌ Poor                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Scope change**            | The product review meaningfully changed what was built (cut scope, reframed the problem, added a critical missing piece) | The review rubber-stamped the original request with no real challenge            |
| **Open questions resolved** | Open questions were answered before engineering began, preventing rework                                                 | Engineering started with unresolved ambiguity that caused mid-build pivots       |
| **Roadmap alignment**       | The recommendation fit the product roadmap in PROJECT.md                                                                 | The feature was built in isolation, conflicting with or duplicating planned work |
| **Downstream usefulness**   | The plan-engineering skill received clear, actionable input from this output                                             | Engineering had to re-derive product intent because the product review was vague |
| **Deferral accuracy**       | Deferred items were genuinely lower priority, not things we immediately needed                                           | We ended up building deferred items in the same cycle anyway                     |

> If signals trend ⚠️ or ❌, use the **improve skill** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Always read `docs/overview/PROJECT.md` first
- Challenge mediocre requests — push for the version that feels inevitable
- Be specific. "Make it better" is not a product insight
- Output must be actionable — engineering should be able to start from this
