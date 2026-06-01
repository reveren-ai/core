# Protocol: Plan — Engineering

> Cognitive mode: Tech lead / Engineering manager

---

## When to use

After product direction is locked (via plan-product or explicit requirements).
Before writing any code. Use this to nail the technical plan.

## How to think

You are the engineering lead. Your job is to make the product vision **buildable**.

Stop ideating. Start engineering.

1. **Architecture**: What components, services, and data models are needed?
2. **Data flow**: How does data move through the system? Draw it.
3. **State management**: What state lives where? Server vs client? URL vs context vs local?
4. **Boundaries**: Where are the trust boundaries? API boundaries? Module boundaries?
5. **Failure modes**: What happens when things break? Network errors, empty states, race conditions?
6. **Edge cases**: What inputs are weird? What happens with 0 items? 10,000 items?
7. **Testing strategy**: What gets unit tested? What needs E2E? What's the test matrix?

## Output format

```
## Engineering Plan: [Feature Name]

### Architecture
[Component diagram — which files, which modules, how they connect]

### Data Flow
[Step-by-step: user action → component → API → database → response → UI update]

### File Plan
[Exact files to create or modify, with purpose]
- `app/[route]/page.tsx` — [purpose]

### Acceptance: live smoke is non-negotiable

Every engineering plan must include, in its acceptance criteria, a live-server smoke step: boot `pnpm dev`, hit every route touched by this feature **plus every public route that could have been affected by shared components or layouts**, verify each returns `200` (or expected redirect), and confirm the dev log has zero `⨯|Error` lines. Plans that stop at "`pnpm build` succeeds" have shipped known-broken pages before. Use **Playwright** (already in devDeps) for any browser-level automation — not Puppeteer. Canonical commands live in `.protocols/ship.protocol.md` → "Live Server & Route Verification".

### Acceptance: dark mode + mobile breakpoints are non-negotiable

Any plan that touches a UI surface MUST include, in its acceptance criteria, a colour-scheme + breakpoint validation pass before declaring the work done:

1. **Both colour schemes.** If the host project ships dark mode, toggle the system colour scheme (or use the in-app theme toggle) and confirm every section the plan touches renders correctly in BOTH light and dark. The most common regression: using a theme token for the background of a section that is intended to stay dark in both schemes — the token flips to light under `.dark`, the hardcoded light foreground stays light, and the section becomes invisible. **Invariant-dark plates** (hero band, terminal-window mock, dark CTA, featured pricing card) MUST use literal hex constants at file top — `const DARK_BG = '#1c1412'`, `const DARK_FG = '#f2ece6'` — not theme tokens. **Theme-following sections** use the project's theme tokens which flip correctly via the theme machinery.
2. **Three breakpoints.** View the affected route at ~375px (mobile), ~768px (tablet), and ~1280px (desktop). Confirm: no horizontal overflow, no broken grids, no truncated copy that breaks meaning, touch targets ≥ 44×44px on mobile, and tap-state visuals work on any marquee / animated surfaces.
3. **Code-smell check.** Any element where `backgroundColor` comes from a theme token and `color` is a hardcoded literal (or vice versa) is wrong and must be reconciled — either both from tokens or both from literals. CI doesn't catch this; the engineer must.
4. **If you can't visually validate**, say so explicitly in the completion report — don't imply validation happened. Sandbox sessions, headless CI, etc. count as "can't" — the user takes the visual verification step in those cases.

This gate is non-negotiable. Visual-regression screenshot diffs (Playwright, Chromatic, percy) are the right long-term safeguard; the rationale comments at the top of invariant-dark components + this plan gate are the load-bearing controls in the meantime.
- `components/[Name]/index.tsx` — [purpose] (single component)
- `components/[Name]/index.styled.tsx` — [purpose] (styled wrappers)
- `components/[Name]/index.test.tsx` — [purpose] (colocated test)
- `components/[Group]/ComponentA.tsx` — [purpose] (multi-component folder)
- `components/[Group]/ComponentA.styled.tsx` — styled wrappers
- `components/[Group]/ComponentA.test.tsx` — colocated test
- `components/[Group]/ComponentA.stories.tsx` — colocated Storybook story (see the stories convention in your project conventions file; required when Storybook mode is `full` or `hosted-gallery`, skipped when `disabled`)
- `components/[Group]/index.tsx` — barrel re-exports
- `lib/[util].ts` — [purpose]
- `e2e/[flow].spec.ts` — [purpose]

### State Design
[What state, where it lives, how it updates]

### API Design (if applicable)
[Routes, methods, request/response shapes]

### Edge Cases & Failure Modes
[List each one and how we handle it]

### Test Matrix
| Scenario | Type | File |
|----------|------|------|
| [scenario] | unit/e2e | [file] |

### Dependencies
[New packages needed, if any]

### Permissions
[New CLI commands or tools this feature requires that are not already in `.claude/settings.json` permissions.allow. For each, add to the project settings before implementation begins so the developer is not interrupted by approval prompts. Only add non-destructive, non-harmful commands (e.g., a new linter, a build tool, a CLI query). Never auto-approve commands that delete data, push to remotes, or modify shared infrastructure.]

### Open Risks
[Things that could go wrong during implementation]
```

## Quality Signals

After this protocol is used, observe these signals to determine if it performed well:

| Signal                       | ✅ Good                                                              | ❌ Poor                                                                                |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **File plan accuracy**       | Files created during implementation matched the plan (±1–2 files)    | Significant files were missing from the plan, or planned files turned out unnecessary  |
| **Edge case coverage**       | Edge cases listed were encountered during implementation and handled | Bugs found during QA or review that the plan should have anticipated                   |
| **Test matrix completeness** | All test scenarios from the matrix were implemented and passed       | Tests had to be added ad hoc during review/QA because the matrix missed scenarios      |
| **Architecture fit**         | The proposed architecture worked without mid-build redesign          | A structural change was needed mid-implementation because the plan missed a constraint |
| **Implementation velocity**  | Implementation was "mechanical" — no ambiguity about what to build   | Developer had to stop and re-think architecture during implementation                  |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Always check existing code patterns before proposing new ones
- Use our stack: Next.js App Router, MUI v7, Vitest, Playwright
- Prefer Server Components unless client interactivity is required
- Every feature must include test files in the plan
- **Every new component must include a colocated `*.stories.tsx`** in the file plan, unless `protocols.config.ts` sets Storybook mode to `disabled`. The stories convention lives in your project conventions file; the engineering plan only needs to enumerate the file. In `hosted-gallery` mode the story is auto-generated from prop types — still list it so reviewers see the artefact will exist.
- Output must be precise enough that implementation is mechanical
- **Design migrations: no dead CTAs.** When porting a design (Figma, HTML mockup, prototype) into shipped code, every visible CTA, link, button, sort/filter control, save/bookmark icon, "see all" footer, or interactive feature must be either (a) wired to a real route or backing data source, or (b) **removed from the surface entirely** — not left as a placeholder. A button that does nothing is worse than a missing button: it actively undoes prior wiring work, breaks reader trust, and silently re-introduces tech debt the codebase had already retired. Engineering plans for a design-migration task must enumerate, for every interactive element in the comp: (i) the destination route or handler, (ii) the data field that backs it (adding to the seed/schema if missing — see `lib/home-data.ts` and Prisma seeds), or (iii) an explicit "remove from this migration" decision with the reason. Adapt the mockup to the codebase's actual capabilities, not the other way around. If a feature isn't ready, hide it; don't ship a placeholder.
- **Know the API surface you're testing**: When planning tests for library config objects (e.g., MUI `createTheme()`), verify what the function _actually returns_ vs what it resolves at runtime. For MUI v7, `createTheme()` returns the **creation object** (colorSchemes, cssVariables config), not the fully resolved theme. Plan test assertions against the real shape, not assumed resolved properties.
- **No deprecated APIs. No assumed types.** Every plan must satisfy two non-negotiables before it leaves the protocol:
  1. **Deprecation check** — confirm every browser / runtime API named in the plan is current. `document.execCommand`, `KeyboardEvent.keyCode`, `Node.NodeFilter` constants, synchronous XHR, `findDOMNode`, `componentWillReceiveProps`, `Buffer()` constructor, etc. are deprecated and must not be planned in. If a plan needs a fallback for an older API, the plan owns naming what triggers the fallback and how it's verified — silently chaining a deprecated call as a "just in case" is forbidden because it ships dead-on-arrival code and earns a CI deprecation warning the team will then have to chase.
  2. **Typing check** — the plan must reference real types from the language / framework in use (TypeScript `strict`, Python type hints, Go interfaces, etc.). No `any`, no untyped `Record<string, unknown>` standing in for a known shape, no "we'll figure out the type during implementation." If a third-party module is missing types, the plan calls out where the augmenting `.d.ts` lives and what shape it commits to. The same rule applies to event handlers — `MouseEvent<HTMLAnchorElement>` not `any`, `KeyboardEvent` not `Event`.
   Reviewers must reject a plan that names an API without proving (in the plan's File Plan or Test Matrix) that it is current and typed. The expectation is "compile / type-check clean on first run", not "we'll fix it in the PR."
- **Re-key motion containers that recycle across tab / filter / page changes.** Any `motion.*` element using `viewport={{ once: true }}` with stagger children (or any `initial → animate` cycle that should re-fire when the children swap) MUST carry a `key` tied to the discriminator (active tab, active filter, page number). Without it, the parent's entry animation only fires on first mount; later children inherit `animate='visible'` but stay frozen at `initial='hidden'` (opacity 0) — DOM looks correct, screen looks empty, no console error. Plans that introduce a motion-staggered list inside a tabbed / paginated / filtered surface must enumerate the re-key strategy in the File Plan, and the Test Matrix must include a post-interaction opacity assertion (Playwright `getComputedStyle(...).opacity > 0.9` after a tab click, with `scrollIntoViewIfNeeded()` to force viewport entry) — element-count checks pass silently while this bug is live.
- **Worktree-ready**: Engineering plans should be implementable in isolation. If parallel workstreams are viable (e.g., independent components), note them — they can run as parallel agents in git worktrees.
