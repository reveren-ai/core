# Protocol: Learn from Users

> Cognitive mode: Product researcher / Signal listener

---

## When to use

Use this protocol whenever a meaningful user signal arrives — and *only*
then. Manufactured "user research" is noise. Real signal sources include:

- Support / inbox replies that describe friction in concrete terms
- Sales calls or demo conversations where prospects flag a deal-blocker
- Analytics anomalies — drop-offs, unexpected paths, sudden retention dips
- Direct feedback from a paying user or design-partner conversation
- Public posts (LinkedIn, X, HN) where someone describes our product or
  an alternative they're using instead
- Cancellations and downgrades — the *reason* given, when given

The trigger is **a signal showed up**, not a calendar. If nothing has
landed, don't run the protocol.

---

## How to think

You are a product researcher whose job is to convert raw signal into
durable decisions. Most user feedback is one of three things:

1. **A symptom** — the user describes pain but misdiagnoses the cause.
   Honour the pain; investigate the cause separately.
2. **A feature request** — the user proposes a solution. The solution is
   data, not an instruction. Trace it back to the job they're trying to
   do.
3. **A signal we already had** — a confirming instance of something we'd
   heard before. The interesting question is whether the *cumulative*
   evidence has crossed a threshold that changes a decision.

Avoid:

- Acting on a single data point as if it were a trend.
- Discarding a single data point because "it's just one user" — first
  check whether it's the third instance of the same thing.
- Letting the loudest user shape the roadmap. Frequency matters; so
  does whether the speaker is in the target segment.

---

## Workflow

### Step 1 — Capture the signal verbatim

Quote the user's words. Don't paraphrase yet. If it's a conversation,
note who said it, when, and the segment they belong to (role, plan tier,
geography — whatever segmentation the product uses).

If it's an analytics anomaly, capture the chart, the surface, the time
window, and the metric definition.

### Step 2 — Classify

Tag the signal:

- **Type**: friction / feature-request / cancellation / confirmation /
  competitive / discovery (they didn't know we did X)
- **Surface**: which protocol or product surface it touches
- **Strength**: 1 instance / 2-3 instances / pattern (≥4 instances of
  the same thing or one severe instance from a target-segment user)
- **Recency**: when the signal arrived; older signals decay unless
  they keep recurring

### Step 3 — Trace to a job

What was the user trying to do? Write it as a one-liner: "When I [context],
I want to [goal], so I can [outcome]." If you can't fill in the blanks
from the signal, the signal isn't actionable yet — capture it, but go
back and ask.

### Step 4 — Cross-reference

Has this signal showed up before? Check:

- The learnings log (`docs/Learnings/LEARNINGS.md` or project equivalent)
- The TODO board(s) for related entries
- Past entries in this protocol's output file (if maintained)
- The product plan for whether this is already on the roadmap or was
  explicitly descoped

Cumulative evidence often crosses a threshold that a single instance
wouldn't.

### Step 5 — Recommend an action

One of:

- **Act now** — a protocol or surface needs a change this cycle. Open
  a TODO with the user-quote as evidence; route to `plan-product` or
  `plan-ux` as appropriate.
- **Watch** — add to a watch list with a counter; revisit when the
  count crosses a threshold (typically 3 of the same).
- **Decline (with reason)** — out of scope, off-segment, contradicts a
  stronger signal. Record the decline so the same conversation doesn't
  repeat.
- **Escalate** — needs the user's owner (founder, lead) to weigh in
  because it could change the roadmap.

### Step 6 — Close the loop

If the user reported the signal directly, reply. Tell them what we
heard, what we're doing (or not), and why. A "we heard you, here's
what we decided" reply preserves the relationship better than silence
or a promise we can't keep.

---

## Output format

```markdown
## User Signal — YYYY-MM-DD

### Source
[who / where / when / segment]

### Signal (verbatim)
> [user's exact words, or the anomaly described concretely]

### Classification
- Type: [friction / feature-request / cancellation / confirmation / competitive / discovery]
- Surface: [protocol / product surface]
- Strength: [single / 2-3 / pattern]

### Job-to-be-done
When I [context], I want to [goal], so I can [outcome].

### Prior evidence
- [related LEARNINGS.md entry / TODO / prior signal]
- Cumulative count: [n]

### Recommendation
- [Act now / Watch / Decline / Escalate] — [one-line reasoning]

### Owner & next step
- [who picks this up, what they do next, by when]

### Loop closed?
- Replied to user: [yes / no / n/a]
```

---

## Quality signals

| Signal | ✅ Good | ❌ Poor |
|---|---|---|
| **Conversion to action** | Acted-on signals produce a visible product or copy change within one cycle | Acted-on signals accumulate in TODOs without resolution |
| **Decline integrity** | Declined signals stay declined unless new evidence arrives — same conversation doesn't loop | The same signal is re-debated every time a new instance lands |
| **Recurring-signal capture** | Patterns (≥3 instances) get caught and elevated quickly | Patterns are missed because each instance was reviewed in isolation |
| **Loop closure** | Direct reporters receive a reply that names what changed (or didn't) and why | Reporters hear nothing; they stop reporting |
| **Roadmap influence** | The product plan reflects user signal, not just internal taste | The plan and the signal log drift apart with no reconciliation |

> If signals trend poor, use the **improve protocol** to amend.

---

## Rules

- **No signal, no protocol run.** Don't manufacture research to look busy.
- **Quote first, interpret second.** The user's words are the artefact; your
  framing is the interpretation. Keep them separated.
- **One instance is one instance.** Don't generalise from a single user
  unless they sit precisely in the target segment AND describe a severe
  blocker.
- **Decline visibly, not silently.** A declined signal that isn't logged
  comes back as the same argument three weeks later.
- **Close the loop when the source is known.** "We heard, here's what we
  did" — even when the answer is "not now."
- **Cross-reference is mandatory.** A signal in isolation lies; a signal
  in context tells the truth.

---

## Relationship to other protocols

| Upstream | This protocol | Downstream |
|---|---|---|
| Inbox / sales / analytics / public posts | learn-from-users | plan-product (if it changes scope), plan-ux (if it changes a surface), capture-learnings (if the insight is durable), improve (if a protocol itself needs to absorb the lesson) |

`learn-from-users` is the input edge of the product side of the system,
the same way `audit-protocols` is the input edge of the process side.
Both feed `improve` when the lesson belongs in a protocol; both feed
`plan-product` when the lesson belongs in the roadmap.
