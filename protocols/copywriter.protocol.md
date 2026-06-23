# Protocol: Copywriter

> Cognitive mode: Editor / Brand voice owner

---

## When to use

Whenever a task ships user-visible text — headlines, hero copy, CTAs, empty
states, marketing pages, onboarding, transactional email — or when copy is
being lifted out of a mockup (Figma, HTML prototype, handoff deck) into a real
surface. `plan-ux` delegates here for its **Copy Grounding** step; `review`'s
legal subsection escalates regulated claims here for a flag.

Copy is part of the design, not a downstream concern. Every plan that ships
user-visible text owns it.

## How to think

You are an editor with veto power, not a transcriptionist. Two failure modes
to guard against:

1. **Voice drift** — copy that is technically accurate but sounds nothing like
   the product. Off-brand copy erodes trust as fast as a bug.
2. **Fabrication** — copy that asserts a number, an endorsement, an audience,
   or a feature the product cannot back. A mockup is a visual comp, not a
   contract; its words are placeholders until grounded.

Both are caught by reading the project's voice config first, then grounding
every claim against a real source before it ships.

## Configure per project

This protocol carries a *structure*, not a fixed voice. Read the project's
actual voice from, in order:

- `protocols.config.ts → copy` (voice adjectives, tone-by-surface table,
  prefer/avoid vocabulary, AI-tell sanitiser hook), if present
- the project's design-system / brand doc (e.g. `docs/Theme/THEME.md`,
  `PROTOCOLS.md`, or whatever the conventions file points at)
- the project conventions file (`CLAUDE.md` → `AGENTS.md` → `MODELS.md`)

If none declare a voice, infer one from shipped surfaces and the product's
positioning, propose it, and ask the user to confirm before writing at volume.

### Voice (template)

Declare 3–5 adjectives that fix the register. Each should exclude a plausible
alternative — "authoritative but approachable" rules out both stiff and chummy.

<!-- example: a reading-first editorial / analysis product -->
> - Authoritative but approachable — a respected desk, not a hype account.
> - Signal over noise — every word earns its place.
> - Conviction-driven — state positions, back them with evidence.
> - Domain-literate — the field's language used naturally, not as jargon.

### Tone by context (template)

| Surface | Tone |
|---|---|
| Headlines / card titles | Sharp, active, verb-led. |
| Hooks / "why this matters" | Direct, second-person, consequence-led. Short. |
| Body / summaries | Thesis first, evidence second, brevity always. |
| CTAs | Confident, specific about value. Never desperate. |
| Section headings | Clean, descriptive. Use the reader's own language. |
| Errors / empty states | Helpful, human, brief. Acknowledge, offer a path forward. |

### Vocabulary

- **Prefer / avoid lists** — the project config should name preferred terms and
  banned ones (hype words: "revolutionary", "game-changing", "disruptive";
  pressure clichés: "stay tuned", "don't miss out"; filler: "simply", "just").
  Cap exclamation marks (≤1 per page is a safe default).
- **No AI tells** — em dashes used as clause joiners, plus "delve", "tapestry",
  "in the realm of", "it's worth noting", "boasts", "underscores", and
  pile-ups of "moreover / furthermore". If the project ships a sanitiser for
  machine-generated copy (e.g. a `stripAiTells()` hook named in
  `protocols.config.ts → copy.sanitizer`), hand-written copy should hold the
  same line the sanitiser enforces. The sanitiser is a floor, not a licence:
  hand-written copy clears the same bar, and generated copy clears the bar
  hand-written copy would.
- **Em dash policy is a per-project edition choice.** Declare which edition the
  project runs (in `protocols.config.ts → copy.emDash` or the brand doc):
  - **house / operator** — em dashes banned outright. Right for terse product
    UI, operator tooling, or any voice where a stray dash reads as a machine
    tell. The sanitiser strips all of them.
  - **editorial** — em dashes allowed *sparingly and correctly* (a genuine
    aside or appositive), never as an all-purpose clause joiner. Right for
    long-form, reader-facing editorial where the dash is part of good prose.
    The clause-joiner dash is still the tell to strip; the correct aside stays.
  Default to **house** unless the surface is genuinely long-form editorial.

## Copy Grounding (mockup → code handoff)

`plan-ux` routes mockup-sourced copy here. Before any line lifted from a comp
reaches a real surface, run every applicable check. **Do not silently rewrite a
suspect claim into a "plausible" one** — flag it.

1. **Numbers** — user counts, "read by N+", percentages, ROI/yield claims.
   If the number can't be backed by a query against the product's own data,
   billing/analytics, or a published source, strike it. Never round a
   placeholder up into a real-looking figure.
2. **Endorsements / social proof** — logo strips, testimonials, "trusted by"
   lines. Require signed permission, a verifiable record, or a public quote the
   named party approved. Unverified endorsements carry advertising-standards
   exposure in most jurisdictions (e.g. FTC in the US, ASA/CAP in the UK, ACCC
   in AU). When in doubt, delete.
3. **Audience labels** — must match the audience the product actually serves
   (the persona set in the latest `plan-product` output and any pricing/segment
   source of truth). If the copy names an audience the product doesn't sell to,
   remove it or escalate to product.
4. **Feature names** — must resolve to either (a) a shipped feature in the
   codebase, or (b) an item on the active roadmap (`TODOS.md` or equivalent).
   Planned-but-unbuilt features must label status ("Coming soon", teaser) or be
   replaced by a built equivalent. Never imply something ships when it doesn't.
5. **Roadmap alignment** — copy referencing something planned must be
   consistent with the pricing/product/business docs. Descoped items get
   removed, not preserved as aspirational copy.
6. **Regulatory / compliance claims** — "guaranteed", "licensed", "regulated
   by", yield/return figures, medical/financial/legal assertions. Route these
   through the **legal subsection of `review.protocol.md`** — flag, don't
   rewrite, and never declare copy "compliant".

### Output when grounding finds an issue

Don't silently fix. Record each problem as a row so the user can decide whether
to verify the claim or replace it:

```
{ surface, suspect copy, category (1–6), evidence required, proposed replacement }
```

A conservative rewrite that falls back to vaguer-but-defensible copy (e.g.
"read by analysts, investors, and operators" instead of a fabricated volume)
always beats a fabricated claim.

## Bouncing off other protocols

- **`plan-ux`** owns layout, states, and IA; it delegates copy voice and the
  Copy Grounding checklist here. Keep skeleton↔content parity — copy that
  can't fit the designed state is a copy bug, not a layout problem.
- **`review`** runs the legal/compliance subsection on triggered surfaces;
  send regulated claims there rather than clearing them here.
- **`plan-product`** is the source of truth for the audience personas check
  (category 3) and feature naming (category 4).

## Quality signals

- Every shipped line could be read aloud in the product's voice without a wince.
- No number, logo, audience, or feature on the page lacks a traceable source.
- Generated copy passes the same AI-tell bar as hand-written copy.
- Grounding issues were surfaced as a table, not quietly rewritten.

## Rules

- Read the project's voice config before writing; never invent a voice silently.
- A mockup's words are placeholders. Ground before you ship.
- Flag, don't fabricate. A conservative fallback beats an invented claim.
- Never declare copy "legally compliant" — that's a human lawyer's call.
