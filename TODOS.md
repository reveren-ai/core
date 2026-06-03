# `@reveren-ai/core` — Engineering TODOs

> Package-scoped engineering backlog for the reveren CLI at `packages/core/`.
> Companion to workspace-level `DEV_TODOS.md` (cross-package eng) and `PRE_GO_LIVE_CHECKLIST.md` (launch-day gate).
>
> Non-engineering blockers (incorporate Reveren Pty Ltd, AU trademark, lawyer review of LICENSE files) live in `PRE_GO_LIVE_CHECKLIST.md` — not duplicated here. This file is engineering-only.
>
> _Created 2026-05-09. Maintainer: Innocent Muisha._

---

## Release 1 — npm publish `@reveren-ai/core@0.1.0-alpha.1` under `--tag alpha`

You picked dual-launch (site + CLI together) per the Selected Option in `PRE_GO_LIVE_CHECKLIST.md`. That means stub commands MUST be replaced before publish — a stub CLI under the `latest` tag would damage credibility on day one.

### CLI commands — must be real before publish

- [x] **`rvr init` — real interactive flow** — _shipped 2026-05-10 (PR #3)._
- [x] **`rvr run <protocol>` — real resolver + emitter** — _shipped 2026-05-10 (PR #3)._
- [x] **Storybook scaffolding writer** — _shipped 2026-05-10 (PR #3)._
- [x] **Pre-install config loadability fix** — generated `protocols.config.ts` no longer requires a runtime import; `rvr run` and `rvr check` fall back to defaults if the config can't load. _Shipped 2026-05-10 (PR #3)._
- [x] **Integration test harness** — 6 cases against the built `dist/cli.js` covering init / run / check / list. Separate `vitest.integration.config.ts` with `pretest:integration` build hook; unit suite stays clean of integration noise. _Shipped 2026-05-10 (PR #4)._

### DX / repo hardening

- [x] **`CONTRIBUTING.md`** — license split, DCO sign-off, conventional-commits, local dev setup, where new protocols go (canonical repo). _Shipped 2026-05-10 (PR #4)._
- [x] **`commit-msg` hook** — Husky 9 + commitlint conventional-config; rejects malformed messages locally before they reach `main`. _Shipped 2026-05-10 (PR #4)._
- [ ] **Changesets** — `@changesets/cli` + `.changeset/config.json` so `npm publish` is automated on merge to main. _Deferred to Release 2._

### Canonical source repos (created PRIVATE; flip to public after Reveren Pty Ltd is incorporated)

- [x] **`github.com/reveren-ai/protocols`** (private) — MIT-licensed canonical protocol library; seeded with the 14 protocols, LICENSE, README, CONTRIBUTING; tagged `v0.1.0`. _Created 2026-05-10._
- [x] **`github.com/reveren-ai/spec`** (private) — SDL2-licensed canonical SPEC mirror; seeded with SPEC.md, LICENSE (W3C SDL2), LICENSE.MIT, README; tagged `spec-1.0`. _Created 2026-05-10._
- [ ] **Flip both repos to PUBLIC** after Reveren Pty Ltd is incorporated. `gh repo edit reveren-ai/{protocols,spec} --visibility public --accept-visibility-change-consequences`.
- [ ] **Add a `published-at` link from each `@reveren-ai/core` LICENSE/SPEC reference to the canonical repo URL** once those repos are public.

### Publish mechanics

- [ ] **`git pull` core** — local `main` is 1 commit behind origin after the `rvr check` squash-merge.
- [ ] **`npm publish @reveren-ai/core@0.1.0-alpha.1 --tag alpha`** — NOT `latest`. Defensive `@reveren/core@0.0.1` stays untouched (per `docs/COMMERCIALISATION.md`).

---

## Release 2 — Pro / hosted orchestrator features

These all depend on the platform side (Phase 1 in `DEV_TODOS.md`) being live.

- [ ] **`rvr login` — device code flow** — exchange device code for `rv_live_xxx` token, store in `~/.reveren/credentials.json` with restrictive perms.
- [ ] **`rvr sync` — real implementation** (currently stub). Pull protocol updates from registry; respects auth token; respects org context.
- [ ] **`rvr push <protocol>` — Pro feature** — publish a custom or supplementary protocol to org-private registry (Team) or public registry (Pro+).
- [ ] **`rvr ci` — CI/CD integration** — runs configured pipelines against current diff; output formatted for GitHub Check Runs.
- [ ] **MCP server (read)** — Pro tier; bundled with CLI but only callable when authed.
- [ ] **MCP server (write)** — Team tier; gated by `requireTier('team')` on the hosted orchestrator side.

### User-driven supplementary protocols (per `plan-product` evaluation, 2026-05-09)

> A non-technical Lovable/v0/Bolt user describes what they're building; the CLI generates 1–3 supplementary protocols specific to their domain on top of the 14 core protocols. Increases relevance + creates Free → Pro upgrade story.

- [ ] **`init` extra prompt** — free-text "what are you building?" + optional domain chips (`fintech / healthcare / ecommerce / marketplace / dev-tools / consumer`). Skip prompt in `--non-interactive`.
- [ ] **Signal extractor** (`src/scaffold/supplementary.ts`) — free-text + chips → list of supplementary template names (e.g. mentions of Stripe → `payments-stripe`; PHI/PII flags → `compliance-healthcare`; multitenancy → `tenant-isolation`).
- [ ] **LLM-driven generator (BYOK)** — uses `ANTHROPIC_API_KEY` from env, calls Claude (Anthropic SDK), produces protocols in the same `*.protocol.md` schema. No hosted LLM dependency for v1 — ships as Free-tier feature.
- [ ] **Writer drops generated protocols in `.protocols/supplementary/`** with frontmatter `generated: true`, `generatorVersion: x.y`, `domain: <signal>` so they're identifiable and regeneratable.
- [ ] **`rvr regen --supplementary` subcommand** — re-runs the generator. Confirmation prompt if files have local edits.
- [ ] **Cap at 3 supplementary protocols per init** — more is overload for the no-code audience.
- [ ] **Hosted-generation Pro upgrade path** — once BYOK proves demand, offer "we'll handle the keys + use a tuned prompt" as a Pro feature. Keep the BYOK option on Free indefinitely.

---

## Done

- [x] **`rvr check` doctor command** — reports missing devDeps with copy-paste install line per configured packageManager; `--json` flag for agent harnesses — _shipped 2026-05-09 ([PR #2](https://github.com/reveren-ai/core/pull/2))._
- [x] **`requiredDeps()` helper** — pure config-to-deps mapper, ready for `rvr init` to consume — _shipped 2026-05-09._
- [x] **`rvr list`** — lists bundled protocols — _shipped pre-alpha._
- [x] **CLI scaffold** — TypeScript strict, Node ≥18, `commander`, `zod`, `picocolors`, `@clack/prompts`, `find-up`, `jiti` — _shipped pre-alpha._
- [x] **14 bundled protocols** in `protocols/` — _shipped post-rename 2026-05-07._
- [x] **`SPEC.md` v1.0**, BSL-1.1 + MIT + SDL2 license files — _shipped 2026-05-02._

---

_Update freely. Cross-reference items here in `PRE_GO_LIVE_CHECKLIST.md` when they cross the launch-gate threshold._
