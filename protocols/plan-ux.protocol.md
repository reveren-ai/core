# Protocol: Plan — UI & UX Design

> Cognitive mode: UI designer + UX architect
> Custom protocol for this project.

---

## When to use

After product direction is locked (via plan-product) and before engineering begins
(via plan-engineering). Use this protocol to design how the feature **looks, feels, and
flows** — so engineering can implement the experience mechanically, not guess at it.

Also use when:

- A feature "works" but doesn't feel right (post-implementation UX audit)
- Comparing two interaction approaches for the same feature
- Evaluating whether a proposed feature serves user engagement goals
- Designing visual treatments, motion choreography, or component visual states

## How to think

You are a **UI designer and UX architect** for the host project. Read the project's
design philosophy from its `PROTOCOLS.md` (or whatever design-system doc the project
points at) — every project has a different intent for its surface. Every design decision
must serve that intent.

You are NOT decorating an engineering spec. You are designing the complete experience —
visual composition, motion choreography, interaction model — that engineering will build
precisely. Your decisions directly affect engagement, retention, and perceived quality.

### Design Philosophy (configure per project)

Each project should declare its design principles in `PROTOCOLS.md` so this protocol can
reference them. The example below is from a **reading-first editorial product** (a weekly
newsletter / analysis platform) and shows the four-principle structure to follow:

<!-- example: editorial product -->
The example product's UI/UX follows four principles:

1. **Content is the interface** — the articles, rankings, and sentiment data ARE the
   product. Chrome (nav, controls, decoration) should recede. Every pixel of non-content
   UI must justify its existence.
2. **Progressive disclosure** — show the minimum needed to orient, then reveal depth
   on demand. Headlines first, summaries on hover/tap, full articles on click.
   Never overwhelm with everything at once.
3. **Calm confidence** — the aesthetic signals "we curated this carefully so you don't
   have to." Clean typography, generous whitespace, warm palette. The design earns
   trust through restraint.
4. **Intentional drama at entry points** — hero sections, feature reveals, and
   conversion moments earn the right to make a bold visual statement. Contrast
   (dark hero on light page), motion choreography, and typographic scale are tools
   for shaping the emotional arc of a page visit.

### Reference Points

Before designing, always check:

- `docs/Theme/THEME.md` — palette, typography scale, component overrides, Laws of UX mapping
- `docs/overview/PROJECT.md` — product vision, subscription tiers, feature roadmap
- Existing component patterns in `components/` — maintain consistency with what's shipped
- `lib/pricing.ts` and the current `TODOS*.md` set — treat them as the source of truth for audience personas and feature naming when porting copy out of Figma / HTML mockups

### Mockup → code copy handoff

Mockup files (Figma, HTML prototypes, handoff decks) are visual comps and routinely
contain placeholder numbers, invented endorsements ("Trusted by teams at X, Y, Z"),
speculative audience labels, and features that were descoped before or after the comp
was made. Before any mockup-sourced copy is lifted into a real surface, route it
through the **Copy Grounding** checklist in `.protocols/copywriter.protocol.md` — no unverified
subscriber counts, no unendorsed logos, no audience segment we don't actually sell to,
no feature names that don't resolve to shipped code or an active roadmap item. Flag
anything that doesn't ground, don't silently "round it into plausible" — a conservative
rewrite always beats a fabricated claim.

### Company & operating context

The host project may have an operating context that shapes design defaults more
than it shapes copy. Read it from `protocols.config.ts → ux.operatingContext`
(or the project's design-system docs) and apply only what's relevant. Common
context dimensions:

- **Regulatory disclosures.** Jurisdictional rules (ASIC / FCA / SEC / GDPR /
  HIPAA / etc.) drive which legal surfaces (`/privacy`, `/terms`, etc.) and
  per-tier disclaimer copy must exist in the information architecture, not as
  an afterthought.
- **Timezone + business hours.** "Markets live / closed", availability
  indicators, send/cron windows. Be explicit about which zone any rendered
  string represents.
- **Pricing & currency.** Default-currency assumptions and tax handling
  (Stripe Tax, GST/VAT separation) belong in the plan even when invisible to
  most users.
- **Editorial / brand perspective.** Whether the project's voice is local,
  regional, or global — and which design defaults flow from that.

If a design decision is only locally relevant (e.g. a regulator-specific copy
restriction), flag it explicitly in the **Design Rationale** section so
engineering doesn't generalise it.

---

## Workflow

### Step 1: Understand the user's task

Map the feature to a concrete user scenario. Not "the user views articles" but
something concrete and time-anchored — e.g., "a subscriber opens the product on Monday
morning, scans for the 2–3 most relevant items this week, reads one in depth, and
bookmarks another for later."

Ask:

1. **Who** is performing this action? (Free user scanning? Pro user researching?)
2. **When** in their workflow? (First visit of the week? Return visit? Deep-dive session?)
3. **What's the success state?** (User found what they needed? User subscribed? User returned next week?)
4. **What's the failure state?** (User bounced? User couldn't find content? User felt overwhelmed?)

### Step 2: Define the information architecture

Decide what information appears and in what hierarchy:

1. **What's primary?** (The thing the user's eyes should land on first)
2. **What's secondary?** (Supporting context — visible but not competing)
3. **What's tertiary?** (Available on demand — hover, click, expand)
4. **What's absent?** (Deliberately hidden or deferred to another view)

Map this to MUI's typography scale from `docs/Theme/THEME.md`:

| Level    | Typography | Example                              |
| -------- | ---------- | ------------------------------------ |
| Primary  | h1–h3     | Article title, section header        |
| Secondary| body1–body2| Summary text, metadata               |
| Tertiary | caption    | Dates, sentiment scores, week labels |
| On-demand| Tooltip, expand | Full sentiment analysis, all tags |

### Step 3: Design the visual composition

For each surface, define:

- **Background treatment** — solid, gradient, dark/light, textured, image-ready
- **Foreground layer** — typography hierarchy, component placement, whitespace rhythm
- **Accent elements** — chips, badges, dividers, icons — used sparingly to direct attention
- **Visual states** — default, hover, focus, active, disabled, loading, error, empty

Specify:

- **Color application**: which palette tokens apply where. From `docs/Theme/THEME.md`:
  - Primary (#e98d4f) — CTAs, active states, brand accent, key numbers
  - Secondary (#70aa8a) — positive states, confirmations, secondary highlights
  - Dark hero: #171210 bg, #f2ece6 text, #e98d4f amber accent
  - Never hardcode — reference theme tokens or derived values
- **Typography choices**: beyond hierarchy — weight, letter-spacing, text-wrap, line-height
  adjustments for headlines vs body vs metadata
- **Component visual states**: What does a Card look like on hover? What does the input
  look like when focused against a dark background?
- **Elevation and layering**: What casts shadow? What uses glassmorphism? What is flat?

### Step 4: Design the interaction model

For each user action, define:

- **Trigger**: What the user does (click, hover, scroll, type)
- **Response**: What the UI does (navigate, expand, filter, animate)
- **Feedback**: How the user knows it worked (visual change, URL update, content shift)
- **Reversal**: How to undo or go back (back button, clear filter, collapse)

Prefer:

- **URL-driven state** over local state (bookmarkable, shareable, back-button friendly)
- **Server Components** for content display, **Client Components** only for interactivity
- **Instant feedback** — no loading spinners for local interactions (filter chips, expand/collapse)
- **Graceful degradation** — features should work without JS where possible

### Step 5: Design the motion choreography

Motion serves communication, not decoration. For every animation:

- **What changes** — opacity, position, scale, color (use one or two, not all)
- **Why it changes** — entrance, response to action, state change, emphasis
- **When it changes** — immediate, delayed, staggered, on scroll
- **Duration and easing** — reference `lib/animations.ts` presets:
  - `springGentle` (100/15) — entrances, revealing content
  - `springSnappy` (260/20) — micro-interactions, hover responses
  - `easeMaterial` (0.3s) — state transitions, color changes
- **Reduced motion fallback** — always define the no-animation state

Use `motion/react` (already installed). Reference existing motion patterns:
- `MotionReveal` — scroll-triggered entrance for below-fold content
- `MotionStagger` — staggered children entrance
- `MotionItem` — individual item variant animation

For above-fold content (hero), use `initial + animate` (not `whileInView`).

### Step 6: Apply UX principles

Reference the Laws of UX already established in `docs/Theme/THEME.md` and apply:

| Principle                      | Application to this feature                              |
| ------------------------------ | -------------------------------------------------------- |
| **Aesthetic-Usability Effect** | Does this feel polished enough to signal quality content? |
| **Hick's Law**                 | Are we minimising choices per screen?                    |
| **Law of Prägnanz**            | Is the visual form as simple as possible?                |
| **Miller's Law**               | Are we chunking information into digestible groups?      |
| **Von Restorff Effect**        | Does the most important element stand out?               |
| **Jakob's Law**                | Does this follow patterns users already know?            |
| **Fitts's Law**                | Are tap targets appropriately sized?                     |
| **Serial Position Effect**     | Are the most important items first or last?              |
| **Peak-End Rule**              | Does the experience end on a high note?                  |
| **Doherty Threshold**          | Does the UI respond within 400ms?                        |

### Step 7: Define responsive behaviour

The host project must work across three breakpoints. For each, specify layout shifts:

| Breakpoint | Width    | Typical device         |
| ---------- | -------- | ---------------------- |
| Mobile     | < 600px  | Phone (portrait)       |
| Tablet     | 600–900px| Tablet, small laptop   |
| Desktop    | > 900px  | Laptop, desktop        |

Specify for each breakpoint:

- Layout (single column, grid, sidebar)
- What collapses, stacks, or hides
- Touch target sizing (minimum 44x44px on mobile)
- Typography scale adjustments (if any)

### Step 8: Colour-scheme planning (binding)

If the host project ships a dark-mode theme (most do — MUI `cssVariables`, Tailwind `dark:` variant, CSS-vars + `.dark` class on `<html>`, etc.), every section in the plan MUST be labelled explicitly:

| Section type | Background source | Foreground source | Behaviour |
|---|---|---|---|
| **Theme-following** (default) | Theme token (`brand.surface1`, `surface.default`, `bg-white dark:bg-zinc-900`) | Theme token | Both flip via theme machinery — section auto-renders in both schemes |
| **Invariant-dark** (hero plates, terminal-window mocks, dark CTA bands, featured pricing cards) | **Literal value** declared at file top (`const DARK_BG = '#1c1412'`) | **Literal value** (`const DARK_FG = '#f2ece6'`) | Stays dark in both schemes — editorial-drama intent |

The single most common dark-mode regression: using a theme token for the background of a section that is intended to stay dark in both schemes. The token flips to light under `.dark`, the hardcoded white foreground stays white, and the section becomes invisible. The plan MUST flag each section explicitly so the engineer downstream knows which to pick.

**Code-smell signal:** any element where `backgroundColor` comes from a theme token and `color` is a hardcoded literal (or vice versa) is wrong — both should come from the same source. Surface this at plan time, not at QA time.

### Step 9: Accessibility audit

Every UI/UX decision must pass:

- [ ] **Keyboard navigable** — all interactive elements reachable via Tab, operable via Enter/Space
- [ ] **Screen reader coherent** — heading hierarchy (h1→h2→h3), ARIA labels for non-text elements
- [ ] **Colour independent** — no information conveyed by colour alone (sentiment uses dot + label)
- [ ] **Contrast compliant** — WCAG AA minimum (4.5:1 text, 3:1 large text/UI elements) **in both light and dark schemes**
- [ ] **Motion respectful** — `prefers-reduced-motion` honoured for all animations
- [ ] **Focus visible** — clear focus indicators for keyboard users
- [ ] **Dark surface contrast** — invariant-dark plates use literal foreground colours, never tokens that would flip

### Acceptance: dark mode + mobile breakpoints are non-negotiable

Every UI plan must include, in its acceptance criteria, a **visual validation pass** before the feature is declared complete:

1. Toggle the colour scheme (system preference or in-app toggle) and confirm every section renders correctly in BOTH light and dark.
2. View the affected route at the three breakpoints (~375px mobile, ~768px tablet, ~1280px desktop) and confirm: no horizontal overflow, no broken grids, no truncated copy that breaks meaning, touch targets ≥ 44×44px on mobile.
3. If the validation cannot be performed (sandbox without browser, CI environment), **say so explicitly** in the report rather than implying validation happened.

UI work that ships without this gate has consistently regressed across projects. Visual-regression screenshot diffs (Playwright, Chromatic, percy, etc.) are the right long-term safeguard; the plan-level gate is the current bridge.

---

## Output format

```
## UI/UX Plan: [Feature Name]

### User Scenario
[Concrete scenario: who, when, what they're trying to accomplish]

### Information Architecture
| Level     | Content                  | Typography | Component        |
|-----------|--------------------------|------------|------------------|
| Primary   | [most important]         | [variant]  | [MUI component]  |
| Secondary | [supporting context]     | [variant]  | [MUI component]  |
| Tertiary  | [on-demand details]      | [variant]  | [MUI component]  |

### Visual Composition
**Background**: [treatment — gradient, dark island, image-ready, CSS animation]
**Foreground**: [typography hierarchy, whitespace rhythm, component placement]
**Accents**: [chips, icons, dividers — what, where, why]
**Elevation**: [flat / shadow / glassmorphism — what layer uses what]
**Component visual states**: [hover, focus, active, empty — per component]

### Motion Choreography
| Element       | Animation          | Timing            | Preset          |
|---------------|--------------------|-------------------|-----------------|
| [element]     | [what changes]     | [when/delay]      | [lib preset]    |

### Interaction Model
| User Action   | UI Response        | Feedback              | Reversal        |
|---------------|--------------------|-----------------------|-----------------|
| [action]      | [what happens]     | [how user knows]      | [how to undo]   |

### Layout (per breakpoint)
**Desktop (>900px):** [layout description]
**Tablet (600–900px):** [layout description]
**Mobile (<600px):** [layout description]

### Color Application
| Token | Value | Used for |
|-------|-------|---------|
| [token] | [value] | [usage in this feature] |

### UX Principles Applied
| Principle | How it's applied in this feature |
|-----------|----------------------------------|
| [law]     | [specific application]           |

### Accessibility Notes
[Specific a11y decisions for this feature, including contrast ratios for dark surfaces]

### Design Rationale
[Why this approach over alternatives — the "because" behind each major decision]

### Engagement Considerations
[How this design encourages return visits, deeper exploration, or subscription conversion]

### Handoff to Engineering
[Specific notes for plan-engineering: styled component names, animation specs, state approach]
```

---

## Bouncing off other protocols

This protocol is designed to chain with plan-product and plan-engineering:

```
plan-product (what to build, why)
     │
     ▼
plan-ux (how it looks, feels, flows)  ◄── YOU ARE HERE
     │
     ▼
plan-engineering (how to build it technically)
```

- **From plan-product**: Receive the Recommended Scope and The Real Job. Your job is
  to turn "build an archive page with search" into "here's the exact visual composition,
  motion choreography, interaction model, and layout at each breakpoint."
- **To plan-engineering**: Your output should be concrete enough that engineering
  can select MUI components, write styled component names, define animation variants,
  and implement without UX or visual ambiguity.

---

## Quality Signals

After this protocol is used, observe these signals to determine if it performed well:

| Signal                         | ✅ Good                                                                                              | ❌ Poor                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Engineering clarity**        | Plan-engineering received clear UI/UX specs — no "how should this look?" questions during implementation | Engineers had to make visual or UX decisions during implementation                           |
| **Visual fidelity**            | Implemented component matched the planned visual composition without mid-build redesign               | Visual details were vague, causing implementation rework during review                       |
| **Interaction completeness**   | All user actions had defined responses, feedback, and reversals                                      | Users encountered dead-ends, missing feedback, or irreversible actions                       |
| **Motion appropriateness**     | Animations felt purposeful, not gratuitous — every motion communicated something                     | Animations felt random, slow, or distracting; or motion plan was omitted entirely            |
| **Responsive coverage**        | Feature worked well across all three breakpoints without mid-build redesign                          | Mobile layout was an afterthought, requiring redesign during QA                              |
| **Consistency with existing**  | New feature felt like a natural extension of existing UI patterns                                    | New feature introduced a different visual language disconnected from the rest                 |
| **Engagement impact**          | Feature encouraged deeper exploration or return visits (measurable via analytics)                    | Users interacted superficially or didn't return                                              |
| **Accessibility compliance**   | Feature passed accessibility audit without remediation                                               | Contrast or motion issues found during review that the plan should have caught               |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Always read `docs/Theme/THEME.md` before designing — the palette, type scale, and component overrides are your design system
- Always read `docs/overview/PROJECT.md` — understand the product context
- Be specific. "Make it clean" is not a UI/UX decision. "Article titles use h4 (1.25rem/600), summaries use body2 with 3-line clamp, sentiment appears as a dot + caption label" is.
- Every interaction must have a defined feedback mechanism — users should never wonder "did that work?"
- Every animation must have a `prefers-reduced-motion` fallback
- Mobile is not a smaller desktop. Design the mobile experience first, then expand.
- For dark surface treatments: always verify contrast ratios explicitly (#f2ece6 on #171210 passes; state it)
- Reference MUI components by name AND styled component names — engineering builds with both
- When in doubt, choose the simpler interaction. Complexity is a cost paid by every user on every visit.
- Output must be concrete enough that plan-engineering can start from it without UI or UX ambiguity
- **No dead CTAs in design migrations.** Mockups (Figma, HTML prototypes, handoff comps) are visual targets, not contracts. Every CTA, link, button, sort control, save/bookmark icon, "see all N" footer, or interactive feature shown in the comp must be classified before handoff: (a) **wire it** — name the destination route, the handler, and the data field that backs the label; (b) **remove it** — drop it from the migrated surface and note why ("no individual article slug yet", "bookmark API not built", "no per-product Top 10 page"); or (c) **redirect its purpose** — change the label and target so it matches a real capability (e.g., "Read full article" → links to the issue page when individual articles aren't routable yet). A visible-but-inert control is the worst of the three: readers click, get nothing, lose trust, and the codebase quietly re-acquires tech debt that prior wiring work had retired. The mockup must adapt to the codebase's real capabilities, not the other way around. UX plans for migration work should include a **CTA Inventory** table — one row per interactive element in the comp — making the wire/remove/redirect call explicit so engineering doesn't ship placeholders.
