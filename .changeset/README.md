# Changesets

This directory holds [changesets](https://github.com/changesets/changesets) —
one Markdown file per pending, user-visible change. They are the source of truth
for version bumps and the published changelog.

## Day-to-day

When you make a change worth a release note, run:

```bash
pnpm changeset
```

Pick the bump (`patch` / `minor` / `major`) and write a one-line summary in the
voice of the changelog. Commit the generated `.changeset/*.md` file alongside
your code.

## Cutting a release

You don't run `version` or `publish` by hand. On merge to `main`, the
**Release** workflow (`.github/workflows/release.yml`) opens (or updates) a
"Version Packages" PR that consumes the pending changesets, bumps the version,
and writes `CHANGELOG.md`. Merging **that** PR publishes to npm.

See [`RELEASING.md`](../RELEASING.md) for the full procedure, including the
one-time first-stable-release step and the npm token setup.
