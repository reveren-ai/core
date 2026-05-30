# Protocol: Document

> Cognitive mode: Technical writer + documentation maintainer
> This is a custom protocol unique to this project.

---

## When to use

- After implementing or modifying any feature
- When asked to "document this" or "update docs"
- As part of the ship protocol checklist

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this protocol runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the run with approval prompts.

- Typical commands used here: `git diff`, `git log`, `git status`, file
  read/write for `docs/`, `MODELS.md`, `README.md`, `CHANGELOG.md`, `TODOS.md`.
- If prompts fire, run the **`/fewer-permission-prompts`** protocol to bulk-grant.
- Never auto-approve destructive commands — doc updates should never need
  them; if one shows up, stop and investigate.

## How to think

Documentation is a **first-class deliverable**. Every feature ships with docs.
You are responsible for keeping the project's documentation accurate and current.

## Workflow

### Step 1: Identify what changed

Run or check `git diff main --name-only` (or `git diff HEAD~N --name-only`) to see which files changed.

Classify changes:

- **New feature**: Needs a new doc file in `docs/[feature_group]/`
- **Modified feature**: Needs an update to the existing doc
- **Refactor/internal change**: May need `ARCHITECTURE.md` update
- **Bug fix**: May need doc correction if the fix changes behavior

### Step 2: Create or update feature documentation

**For new features**, create:

```
docs/[FeatureGroup]/FEATURE_NAME.md
```

Example folder structure:

```
docs/
├── Overview/
│   └── PROJECT.md
├── Newsletter/
│   └── WEEKLY_ROUNDUP.md
├── ArticleTabs/
│   └── ARTICLETABS.md
├── Sentiment/
│   └── SENTIMENT_METER.md
├── Products/
│   └── TOP_TEN_PRODUCTS.md
└── Auth/
    └── WHOP_INTEGRATION.md
```

**Feature doc template:**

```markdown
# [Feature Name]

## Overview

[Brief description: what it does, why it exists, who it's for]

## Implementation

- **Key files**: List the primary files involved
- **Architecture decisions**: Why things were built this way
- **Dependencies**: Any new packages or services added

## Usage

[How to use this feature — UI flow, API endpoints, configuration]

## Testing

- **Unit tests**: [list test files and what they cover]
- **E2E tests**: [list spec files and what flows they cover]
- **Manual testing**: [any steps that require manual verification]

## Status

[In Progress | Complete | Needs Review]

## Changelog

| Date       | Change                 | Author |
| ---------- | ---------------------- | ------ |
| YYYY-MM-DD | Initial implementation | [name] |
```

### Step 3: Update PROJECT.md

Check `docs/overview/PROJECT.md` and update it if:

- A new feature was added that isn't listed
- An existing feature's scope changed
- A release phase shifted
- The subscription tier access changed

**Specifically, update the Implementation Status section** at the bottom of PROJECT.md:

- Mark features as `Complete`, `Partial`, or `Not Started`
- Add the routes, components, and data layer functions that power each feature
- Note any schema-ready models that don't have UI yet
- Update the "What's Live" summary to reflect current state

This section is the single source of truth for "what have we actually built vs. what's still planned." Keep it factual and concise — link to feature docs in `docs/` for detail.

**Do not rewrite PROJECT.md** — make targeted updates to the relevant sections.

### Step 4: Update ARCHITECTURE.md

If the change introduced:

- New system components or services
- Changed data flow or state management patterns
- New API routes or integrations
- Infrastructure changes

Then update `ARCHITECTURE.md` with the new information.

### Step 5: Update UX Documentation

If the change involved UI/UX decisions (new components, layout changes, interaction patterns, responsive behaviour), document the UX rationale:

**For features with a UX plan** (from plan-ux protocol):

Add a `## UX Decisions` section to the feature doc in `docs/[FeatureGroup]/` with:

```markdown
## UX Decisions

### Design Rationale
[Why this approach was chosen — link to the UX principle or user scenario that drove it]

### Information Hierarchy
[What's primary, secondary, tertiary — and why]

### Interaction Patterns
[Key interactions: what triggers them, how the UI responds, how to reverse]

### Responsive Behaviour
[Layout shifts across desktop/tablet/mobile — what collapses, stacks, or hides]

### Accessibility
[Specific a11y decisions: keyboard nav, screen reader flow, colour independence]

### Design Pattern Established
[If this feature establishes a reusable pattern, name it and describe when to reuse it.
Example: "Card-with-rank pattern — used whenever content has a numeric ranking.
Rank badge (h5, primary colour) left-aligned, title (h4) adjacent."]
```

**For features without a formal UX plan** (bug fixes, small changes):

If the change affected visual appearance or interaction, add a brief note to the
feature doc's Implementation section explaining the UX reasoning (1-2 sentences).

**Maintaining the UX pattern library:**

Check if this feature introduces a new reusable interaction or layout pattern. If so,
ensure it's documented under "Design Pattern Established" so future features can
reference and reuse it rather than inventing a new approach.

### Step 6: Update README.md

Check if the change affects anything visible in the project README:

- **New scripts** added to `package.json` → update the Scripts table
- **New stack components** (e.g., new database, auth provider) → update the Tech Stack section
- **Changed setup steps** (e.g., new env vars, new install steps) → update Getting Started
- **New top-level directories** with distinct purpose → update Project Structure
- **Changed project description or scope** → update the project overview

**Do not rewrite README.md** — make targeted updates to the relevant sections only.

If none of the above apply, skip this step.

### Step 7: Update TODOS.md

After a feature is completed (or its scope changes), update `TODOS.md`:

- **Move completed items** from "In Progress" or "Next Up" to "Done" with a brief summary of what shipped
- **Add new follow-up tasks** discovered during implementation to "Next Up" or "Backlog"
- **Remove or update items** whose scope changed during the work
- **Cross-check the Backlog** — scan all Backlog sections (including "Security hardening") for items that were incidentally resolved by this work. For example, implementing Auth.js would resolve the "Admin dashboard auth protection" cyber finding, or adding middleware would resolve the "Create middleware.ts" item. For each resolved Backlog item:
  - Mark it as `[x]` with a brief note of how/when it was resolved
  - If it's in the "Security hardening" section, move it to the "Resolved incidentally" subsection with `[severity, fix-type]`

#### TODOS.md structure rules

The file must always follow this top-level order:

```
## In Progress
## Next Up
## Backlog
### General            ← ALWAYS the first Backlog subsection, even when empty
### (other categories, any order)
## Done
### General            ← ALWAYS the first Done subsection, even when empty
### (feature/sprint/category subsections, reverse-chronological)
### Earlier batches    ← catch-all for legacy flat entries
```

- **"General" is always the first subsection under both Backlog and Done**, even if empty. If empty, leave a placeholder comment (`<!-- no general items yet -->`) or just the heading.
- **No top-level `## Shipped (...)` sections.** Completed sprint/batch work belongs under `## Done` as a `###` subsection titled by category or sprint (e.g. `### Design refresh (2026-04-23)`).
- **Categories must match between Backlog and Done** when possible (e.g. Backlog "Content & engagement" → Done "Content & engagement"). Shipping a Content & engagement item moves it to the matching Done subsection, not to a flat list.

#### Cleanup pass (run on every document invocation)

Before finishing this step, sweep the whole file for misplaced `[x]` items:

1. **Scan every section** (not just Next Up). Any `[x]` item outside `## Done` is misplaced.
2. **Move each misplaced `[x]` item** into the matching `## Done` subsection, creating the subsection if it doesn't exist yet (use the Backlog category name).
3. **Preserve the original item text** — including shipped dates, commit hashes, and resolution notes.
4. **Verify General is first** under both Backlog and Done after the sweep.
5. **Collapse duplicate Done entries** — if the same ship appears both as a flat Done item and a subsection entry, keep the richer version.

This keeps the task board scannable: anything still `[ ]` is open work, and completed items are grouped by the area of the product they touched.

### Step 8: Update Pitch Context

If the change affects any business-facing positioning — partners, revenue model, platform capabilities, or deal flow — check and update the pitch context files so investor/partner-facing materials stay aligned with the codebase:

**Source-of-truth files to check:**

| What changed | File(s) to update |
|---|---|
| Partners added/removed/renamed, roles changed | `components/Partners/index.tsx` (PARTNERS array) |
| Revenue streams, pricing, monetisation model | `docs/overview/MONETISATION.md` |
| Pitch submission flow, stages, validation | `lib/pitch.ts`, `lib/pitchAdmin.ts`, `lib/pitchGallery.ts` |
| Pitch page copy or metadata | `app/(public)/pitch/page.tsx` |
| Deal flow / advisory referral mechanics | `docs/overview/MONETISATION.md` §7 |
| Subscription tiers or feature gating | `docs/overview/MONETISATION.md` §1, §3 |
| Platform scope, target market, positioning | `docs/overview/PROJECT.md` |

**When to trigger this step:**

- A partner is added, removed, or changes role/URL
- A new revenue stream is implemented or an existing one goes live
- Pitch form fields, stages, or admin curation workflow change
- Subscription tiers or pricing change
- Any copy on the pitch page or partners section is updated

**Cross-check:** Ensure the partner list in `components/Partners/index.tsx` matches what's described in `docs/overview/MONETISATION.md` (especially §5 broker share and §7 advisory referrals). If a partner's role changes, both must be updated together.

### Step 9: Verify Storybook stories (if applicable)

If the diff added or modified any component file, and `protocols.config.ts`
has Storybook in `full` or `hosted-gallery` mode, confirm a colocated
`*.stories.tsx` exists for every changed component, refresh stories whose
prop API changed, and run the Storybook build (e.g. `pnpm build-storybook`)
as a smoke check before declaring this protocol complete. The stories
convention is documented in your project conventions file (`CLAUDE.md` /
`AGENTS.md` / `MODELS.md`).

### Step 10: Update CHANGELOG.md

Add an entry under the `[Unreleased]` section:

```markdown
### Added

- [feature description]

### Changed

- [change description]

### Fixed

- [fix description]
```

## Git Diff Documentation Audit

When reviewing a git diff to update docs, follow this checklist:

1. **New files in `app/`** → Likely a new route/page → needs feature doc
2. **New component folder in `components/`** → New UI component → document in the relevant feature doc. Check for `index.tsx` (single) or `ComponentName.tsx` (multi) pattern. **Also verify a colocated `*.stories.tsx` exists** (per the Storybook stories convention in your project conventions file); if Storybook mode is `full` or `hosted-gallery` and the story is missing, add or refresh it before declaring this protocol complete.
3. **New `*.styled.tsx` files** → Styled wrappers added → mention in feature doc's Implementation section
4. **New `*.test.tsx` files in component folders** → Colocated tests → list in feature doc's Testing section
5. **Changes to `lib/`** → Utility changes → check if API or behavior changed in docs
6. **Changes to `package.json`** → New dependency → document in the relevant feature doc's "Dependencies" section
7. **Changes to config files** → May need ARCHITECTURE.md update
8. **Changes to scripts in `package.json`** → Update README.md Scripts table if new/changed scripts
9. **Changes to existing `docs/` files** → Validate they're still accurate
10. **Changes to stack/setup** → Update README.md Tech Stack or Getting Started sections
11. **Feature completed or scope changed** → Update TODOS.md (move items to Done, add follow-ups)
12. **UI/UX changes** (new components, layout changes, interaction patterns) → Add UX Decisions section to feature doc, document any new design patterns established
13. **Any code change** → Cross-check TODOS.md Backlog (all sections including "Security hardening") for items incidentally resolved by this work. Mark resolved items as `[x]` with context.
14. **Business-facing changes** (partners, revenue, pricing, pitch flow, subscription tiers) → Update pitch context files (Partners component, MONETISATION.md, pitch page copy) per Step 8. Cross-check partner list consistency across code and docs.

## Quality Signals

After this protocol is used, observe these signals to determine if it performed well:

| Signal                      | ✅ Good                                                                                     | ❌ Poor                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Doc accuracy**            | Documentation matched the actual implementation after landing                               | Docs described behavior that didn't match the code                         |
| **Completeness**            | All sections (Overview, Implementation, Usage, Testing, Status) were filled in meaningfully | Sections were empty, placeholder-filled, or missing                        |
| **Discoverability**         | New team members or AI agents could find relevant docs without asking                       | Someone had to ask a question that should have been documented             |
| **README freshness**        | README reflected current scripts, stack, and setup after the change                         | README was stale — new scripts, stack changes, or setup steps were missing |
| **Diff audit thoroughness** | Git diff checklist caught all files that needed doc updates                                 | A changed file was missed in the audit, leading to stale docs              |
| **Pitch context alignment** | Partners, revenue model, and pitch copy match across code and docs after the change        | Partner list or revenue details diverged between code and MONETISATION.md  |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Use **PascalCase** for feature group folder names (e.g., `ArticleTabs/`, `Newsletter/`)
- Use **UPPER_CASE.md** for doc file names (e.g., `ARTICLETABS.md`)
- Every doc must have the Overview, Implementation, Usage, Testing, and Status sections
- Link to related docs when features connect (e.g., Products doc links to Newsletter doc)
- Dates in changelog use ISO format: `YYYY-MM-DD`
- Never delete doc files — mark features as `[Deprecated]` if removed
