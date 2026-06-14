# Protocol: Review

> Cognitive mode: Paranoid staff engineer

---

## When to use

After implementing a feature, before shipping. This is a structural audit,
not a style nitpick pass.

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this protocol runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the run with approval prompts and fracture the audit trail.

- Typical commands used here: `git diff`, `gh pr *`, `pnpm lint`, `pnpm test:run`,
  `pnpm build`, `pnpm exec tsc --noEmit`, `curl`, `grep`, `pkill`, `timeout`.
- If prompts keep firing, invoke the **`/fewer-permission-prompts`** protocol to
  batch-grant the common ones from a recent transcript.
- Never auto-approve destructive commands (force-push, `rm -rf` outside `.next`,
  DB drops, edits to shared infrastructure) — those should always prompt.

## How to think

You are the engineer who has been burned by production incidents.
Tests pass. CI is green. You still don't trust it.

Look for:

### Performance

- [ ] N+1 queries (check any data fetching loops)
- [ ] Missing `loading.tsx` / `Suspense` boundaries
- [ ] Unnecessary client components (should this be a Server Component?)
- [ ] Large bundle imports that could be lazy-loaded
- [ ] Missing `key` props in lists

### Security & Trust

- [ ] User input sanitized before rendering or storing?
- [ ] API routes validate and sanitize inputs?
- [ ] Auth checks on protected routes/endpoints?
- [ ] Sensitive data exposed to the client?
- [ ] CORS / CSP issues?
- [ ] **Live server still boots cleanly?** See "Live smoke after review" below.

## Compliance & sensitive copy (triggered)

> **Not a substitute for professional advice.** When a change touches a
> regulated, legal, or trust-sensitive surface, this subsection flags
> potential issues for human review by a qualified domain expert. Never
> declare anything "compliant" — only "no issues found by this review".

Run this subsection ONLY when the diff touches a trigger surface. Skipping
it on unrelated changes is correct — running it on every change erodes
signal. Each project maintaining this register should keep its own list of
trigger surfaces (the paths and copy that carry legal, regulatory, privacy,
or consent weight).

**Trigger surfaces (examples — projects substitute their own)**

- Pages carrying legal or regulatory copy (terms, privacy, disclosures).
- Pricing, billing, refund, or auto-renewal terms.
- Consent, sign-up, or age-gating language.
- Copy describing external organisations or relationships.
- Any content that could be construed as professional advice.
- Pipeline changes that add a new third-party data processor.

**What to check**

- [ ] **Disclaimers present** where the domain requires them, with the
      required text intact.
- [ ] **No overstated claims** — no guaranteed outcomes, no "risk-free",
      no misleading superlatives.
- [ ] **Generated content disclosed** — AI- or machine-generated content is
      clearly labelled as such.
- [ ] **Consent language clear** — purpose stated when collecting data.
- [ ] **Anonymisation claims accurate** — prefer "aggregated" unless data
      truly cannot be re-identified.
- [ ] **Third-party sharing disclosed** — every processor the data reaches
      (and any cross-border transfer) is named in the relevant context.
- [ ] **Opt-out available** for non-essential processing.
- [ ] **"Coming soon" for unbuilt features** — never present planned
      features as currently available.
- [ ] **External-relationship descriptions accurate** — don't overstate.

**Severity ladder**

- **HIGH** — must fix before shipping. Legal/regulatory risk or misleading
      content.
- **MEDIUM** — should fix. Not immediately dangerous but could create
      issues at scale or in specific jurisdictions.
- **LOW** — best-practice improvement, no immediate risk.
- **ESCALATE** — cannot determine risk level. Routes to a human expert,
      never resolved by AI.

## Stack-aware false-positive register (MUI v7 / Next 16 / RSC)

> A bleeding-edge stack — Next.js 16 App Router + React 19 + React
> Compiler + MUI v7 + RSC — means generic React linters, third-party
> scanners (react-doctor, sonarqube React rules, etc.) and even some
> LLM agents reach for patterns that look like antipatterns in a
> Next 14 / React 18 mental model but are correct or deliberately
> chosen here. Don't manufacture findings against these.

This register lists the *pattern shapes* a reviewer should NOT flag.
Each project that adopts the register SHOULD maintain its own
"canonical sites" annex — concrete `file:line` anchors that prove the
pattern is in use intentionally — so novel sites still trigger
investigation. Without canonical anchors, the register turns into a
blanket suppression and loses its safety.

Skip flagging the following unless the diff actually breaks behaviour:

### React Compiler & hooks

- **`set-state-in-effect` inside a `motionValue.on('change', ...)`
  callback** — external-state-sync pattern explicitly permitted by
  `react-hooks/set-state-in-effect`. The effect subscribes, the
  listener writes to state — that is not "calling setState in render".
- **`set-state-in-effect` for reduced-motion one-shot sync** — when
  an `useEffect` collapses to `motionValue.set(target)` +
  `setValue(target)` under `useReducedMotion()`, that's a deliberate
  sync of an external animation source to React state.
- **`set-state-in-effect` for async-derived status reset** — debounced
  network round-trips that reset status to `'idle'` on empty input
  belong in an effect because they can't be computed in render.
- **`purity` rule firing on `Date.now()` in a server component** —
  RSCs render once per request and `Date.now()` is stable within a
  single SSR render. Window-bounded gates (`now - WINDOW_MS`) are the
  canonical use case.
- **Manual memoization warnings** from React Compiler scanners —
  React Compiler 19 handles memoization automatically; manual
  `useMemo` / `useCallback` adds noise without measurable benefit on
  Next 16 + Compiler enabled. Only flag if there's a measured
  re-render cost.

### Server actions & module state

- **Module-scoped `const Set<>`, `Record<>`, `as const` arrays** are
  read-only validation/label lookups, NOT mutable shared state. The
  `server-no-mutable-module-state` family of rules fires on
  declaration shape (`new Set()`, `new Map()`, `{}`, `[]`) without
  checking mutation. If the value is genuinely never written to after
  declaration, it is safe across requests. Encode the intent with
  `ReadonlySet<>` / `as const satisfies …` / `readonly [X, ...X[]]`
  so the type system enforces the read-only contract.
- **Actively-mutated `Map<>` rate-limit stores** ARE a real concern
  under Fluid Compute (cross-instance leak, cold-restart bypass).
  The current posture should be documented inline at the
  declaration site with a defined migration trigger. Don't re-raise
  as a finding unless one of the migration triggers (audit signal /
  observed scrape volume / instance memory pressure) has actually
  fired — track via the project's existing "graduate in-memory
  rate-limit" backlog item, not via duplicate review findings.

### SSR hydration safety

- **Animating CSS `width` instead of `transform` / `scale`** is
  sometimes the deliberate choice when the SSR-emitted style and the
  client's motion `initial` must agree byte-for-byte. Mismatched
  `width: 0%` (server) vs `transform: scaleX(0)` (client) breaks
  hydration on motion-on. The "use transform for perf" advice is
  correct in general, wrong here.
- **Literal-hex constants on invariant-dark plates** are required,
  not a smell. Brand tokens flip under `.dark`; surfaces that must
  stay dark in both schemes (hero band, terminal mock, dark CTA,
  featured pricing card) hard-code their colours.

### MUI v7 specifics

- **`Stack divider={<Box />}`, function-form `sx={(theme) => …}`,
  and ambient `Link` types** can crash hydration silently. If the
  diff introduces any of these in a Server Component or layout,
  flag as HIGH. If it's in a Client Component, flag as MEDIUM with
  a request to verify against dev-log + browser hydration warnings.
- **`createTheme()` returns the creation object, not the resolved
  theme.** Tests asserting `theme.palette.X` against `createTheme()`
  output are wrong on MUI v7 — they must assert against
  `colorSchemes` config. Reject reviews that ship resolved-theme
  assertions.

### How to use this register

When a scanner / linter / agent surfaces one of the above, the
correct action is:

1. **Verify** the canonical pattern matches the flagged code (file +
   line + surrounding context against the project's canonical-sites
   annex).
2. **Suppress** with `// eslint-disable-next-line <rule> -- <reason>`
   referencing the canonical pattern by name — NOT by ad-hoc
   rationale.
3. **Do NOT** open a finding, do NOT rewrite working code, do NOT
   register it in the project backlog as "scanner false positive"
   follow-up (noise — there is no follow-up).

If the pattern is novel and doesn't match a canonical site listed
here, treat it as a real finding and investigate. Add a new entry
to this register only after a maintainer-level decision (capture via
`capture-learnings.protocol.md`).

## MANDATORY: Live smoke after review

A code review that only reads the diff misses runtime regressions.
Before producing the review report:

1. `pkill -f "next dev"`; start `pnpm dev` fresh (`rm -rf .next` if the last run crashed).
2. Wait for `http://localhost:3000/` → `200`.
3. Probe every public route + any route the diff touched. Each must return `200` / expected redirect.
4. `grep -cE "⨯|Error|Functions cannot be passed" /tmp/${project}-dev.log` must be `0`.
5. For UI-touching reviews, load the changed routes in Playwright's bundled Chromium (no Puppeteer — `@playwright/test` is already installed) and assert no `pageerror` fires and no `Something went wrong` in the rendered body.
6. Any failure is a review finding, not a footnote.

See `.protocols/ship.protocol.md` → "Live Server & Route Verification" for the canonical copy-paste commands.

### Correctness

- [ ] Race conditions (multiple rapid clicks, concurrent requests)
- [ ] Stale closures in effects or callbacks
- [ ] Missing error boundaries
- [ ] Empty states handled (0 items, null data, loading)
- [ ] Edge case inputs (empty string, very long string, special chars)

### Dead CTAs (design-migration audit)

When the diff ports a mockup or design comp into shipped code, every interactive
element on every changed surface must resolve to a real action. This is **critical**
severity — placeholder UI silently undoes prior wiring work and erodes reader trust.

- [ ] Every `<Button>`, `<Link>`, `<a>`, `IconButton`, and clickable `Box` on a
      migrated surface has either an `href`/`onClick` that routes to a real
      destination, or it has been removed.
- [ ] Sort, filter, save, bookmark, and "see all" controls actually mutate state
      or navigate — not no-ops left in from the mockup.
- [ ] Source/citation/chart/methodology buttons are backed by a data field
      (e.g., `sourceUrl`, `chartTicker`) — if the field is empty, the control
      is conditionally hidden, not rendered inert.
- [ ] "Read full article" / "View details" CTAs route somewhere readable today
      (issue page, article detail, archive) — never to `#`, `void`, or the
      page they're already on.
- [ ] Any control kept as "future work" is either gated behind a feature flag
      or removed from the surface; no exceptions for "we'll wire it later."

If you find a dead CTA, the suggested fix in your review is one of:
**wire** (name the route/handler/data field), **remove** (drop from this
surface), or **redirect** (relabel + retarget to a real capability).

### Testing

- [ ] Do the tests actually test the right thing?
- [ ] Are failure cases tested, not just happy paths?
- [ ] Would these tests catch a regression?
- [ ] E2E coverage for critical user flows?

### MUI / Styling

- [ ] Responsive design — does it work on mobile?
- [ ] Theme tokens used instead of hardcoded colors/spacing?
- [ ] Accessibility: proper labels, roles, keyboard nav?

### Component Structure

- [ ] Component folder is PascalCase under `components/`?
- [ ] Single-component folder uses `index.tsx`, `index.styled.tsx`, `index.test.tsx`?
- [ ] Multi-component folder uses `ComponentName.tsx` + barrel `index.tsx`?
- [ ] Every component file has a colocated `.test.tsx`?
- [ ] Styled wrappers in `*.styled.tsx`, not inline `styled()` calls scattered in the component?

## Output format

```
## Review: [Feature/Branch Name]

### Critical Issues (must fix before merge)
1. [Issue description + file:line + suggested fix]

### Important Issues (should fix)
1. [Issue description + file:line + suggested fix]

### Minor Notes (nice to have)
1. [Note]

### What Looks Good
[Specific praise for well-done aspects]

### Test Coverage Assessment
[Are the tests sufficient? What's missing?]
```

## Findings Tracking (required)

Every review finding must be tracked — nothing falls through the cracks.

| Severity      | Where to track                                                                 |
| ------------- | ------------------------------------------------------------------------------ |
| **Critical**  | TODOS.md → "In Progress" (block merge until fixed)                             |
| **Important** | TODOS.md → "Next Up" (fix in the next cycle; include `[review finding]` label) |
| **Minor**     | Relevant doc in `docs/` or `ARCHITECTURE.md` (logged as an operational note)   |

### Rules

- **Critical issues** are added to TODOS.md "In Progress" immediately and must be resolved before the ship protocol runs.
- **Important issues** are added to TODOS.md "Next Up" with a clear description and a `[review finding]` label so they're distinguishable from feature work.
- **Minor notes** (design-choice documentation, operational caveats, "nice to have" observations) are appended to the relevant feature doc or architecture doc, not silently dropped.
- The review output itself should state where each finding was tracked (e.g., "→ Added to TODOS.md", "→ Logged in DATABASE.md").

## Quality Signals

After this protocol is used, observe these signals to determine if it performed well:

| Signal                   | ✅ Good                                                                                | ❌ Poor                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **False positive rate**  | Flagged issues were real — developer agreed with ≥80% of findings                      | Many flagged items were non-issues or nitpicks, wasting developer time           |
| **False negative rate**  | No bugs found post-merge that the review should have caught                            | A production/QA bug was found in code the review examined but didn't flag        |
| **Fix accuracy**         | Suggested fixes were correct and directly applicable                                   | Fixes were wrong, incomplete, or required significant rework                     |
| **Priority calibration** | Critical/Important/Minor classifications matched actual severity                       | Critical items turned out to be minor, or minor items caused real issues         |
| **Coverage balance**     | Review covered performance, security, correctness, testing, and styling proportionally | Review over-indexed on one area (e.g., all styling nitpicks, no security checks) |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Automation

- **As an agent**: Run `claude --agent=reviewer` for isolated, read-only review with tool restrictions
- **In a worktree**: Use `claude -w` or the reviewer agent (which uses worktree isolation) to review without affecting the working tree
- **On a loop**: Use `/loop 30m` to continuously monitor open PRs for review

## Rules

- Be specific. Cite file paths and line numbers.
- Every critical issue must include a suggested fix
- Don't just find bugs — find the bugs that CI misses
- If everything looks good, say so. Don't manufacture issues.
