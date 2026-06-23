# Releasing `@reveren-ai/core`

How a change becomes a published version. The mechanics are
[changesets](https://github.com/changesets/changesets) + two GitHub Actions
workflows (`ci.yml`, `release.yml`); the policy below is what we point the
machinery at.

## Versioning policy

- **Semver.** `MAJOR.MINOR.PATCH`.
  - **patch** — bug fixes, doc-only protocol edits, internal refactors with no
    behavioural change to the CLI or the bundled library.
  - **minor** — new protocols, new bundled agents, new commands or flags,
    additive config fields. Anything a user would notice and benefit from.
  - **major** — a breaking change to the CLI surface, the `protocols.config.ts`
    schema, or the `.protocols/` file format. Reserved; avoid until 1.0.
- **Pre-1.0 caveat.** While we are `0.x`, a breaking change is a **minor** bump,
  per semver's `0.x` convention. Treat `0.y.0` as the line where breakage is
  allowed and call it out loudly in the changeset.
- **One changelog, two audiences.** The changeset summary is the npm
  `CHANGELOG.md` entry *and* the source for the site's
  [`/changelog`](https://reveren.ai/changelog) page. Write it so a user — not
  just a maintainer — understands what changed.

## Day-to-day: add a changeset

Every PR that changes user-visible behaviour ships with a changeset:

```bash
pnpm changeset      # pick the bump, write the one-line summary
git add .changeset
```

No changeset is needed for changes that never reach a user (CI config, tests,
this doc). If in doubt, add one — an empty release is cheaper than a missing
note.

## Cutting a release (automated)

You never run `version` or `publish` by hand on a normal release.

1. PRs merge to `main`, each carrying its changeset(s).
2. The **Release** workflow opens (or refreshes) a **"Version Packages"** PR.
   That PR consumes the pending changesets, bumps `package.json`, and rewrites
   `CHANGELOG.md`.
3. Review the version PR. When it looks right, **merge it**.
4. Merging triggers the Release workflow again — this time with no pending
   changesets — so it runs `pnpm release` (`build` + `changeset publish`) and
   pushes the new version to npm.
5. **Update the site.** Add the same release entry to
   `packages/site/lib/changelog.ts` so [`/changelog`](https://reveren.ai/changelog)
   reflects the published version. (Cross-repo, so it is a deliberate manual
   step — the site and the CLI are separate git repos.)

Publishing is gated twice: the version PR must be merged **and** the `NPM_TOKEN`
secret must exist on the repo. Until both are true, the workflow only ever opens
version PRs — it cannot publish.

## One-time setup before the first publish

The package currently sits at `0.1.0-alpha.1` (unpublished locally) while npm
serves the `0.0.1` reserved-scope placeholder.

1. **npm token.** Create an automation token on the npm account that owns
   `@reveren-ai/core` (2FA-enabled) and add it as the repo secret `NPM_TOKEN`.
2. **First stable version.** The inaugural changeset is a `minor`. Because the
   working version is a `-alpha` prerelease, set `version` in `package.json` to
   the intended `0.1.0` **before** the first `Version Packages` PR is merged, so
   the inaugural publish lands as a clean `0.1.0` rather than a computed
   prerelease bump. Every release after this is fully automated.
3. **Provenance (optional, recommended).** The Release workflow requests
   `id-token: write`; add `--provenance` to the publish step once the npm
   account is on a plan that supports it, to match the supply-chain posture
   promised on the site's Security page.

## What CI guarantees

`ci.yml` runs `typecheck → unit tests → build → integration tests` on Node 18,
20, and 22 for every push and PR to `main`. The local `.husky/pre-push` hook
runs the same `typecheck + test` gate so failures surface before they reach
origin. A red `ci.yml` blocks the release path.
