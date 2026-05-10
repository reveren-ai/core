# Contributing to `@reveren-ai/core`

Thanks for considering a contribution. Two things up front:

1. The CLI itself (everything compiled into `dist/`) is **source-available**, not open-source. It's licensed under [Business Source License 1.1](./LICENSE) with a 4-year Change Date and four named grant clauses (see [LICENSE-ADDITIONAL-GRANT.txt](./LICENSE-ADDITIONAL-GRANT.txt)).
2. The protocol library (everything in `protocols/`) is **MIT-licensed** ([LICENSE.protocols](./LICENSE.protocols)). The format spec is W3C SDL2-licensed (see `docs/SPEC.md`).

The split is deliberate. Code that competes with us commercially is governed; cognitive-mode definitions and the file format are open.

If you're contributing a **protocol** (cognitive-mode markdown), please prefer sending the PR to the canonical home at [reveren-ai/protocols](https://github.com/reveren-ai/protocols) — that's where new protocols land first. The bundled snapshot in this repo is regenerated from there on each release.

If you're contributing **CLI code**, you're in the right place. Read on.

## Quick checklist

- [ ] DCO sign-off on every commit: `git commit -s`. See [Developer Certificate of Origin](https://developercertificate.org/).
- [ ] [Conventional Commits](https://www.conventionalcommits.org/) for the message: `feat(cli): ...`, `fix: ...`, `docs: ...`, `chore: ...`. The repo's commit-msg hook enforces this.
- [ ] Tests pass: `pnpm test:run`.
- [ ] Typecheck passes: `pnpm typecheck`.
- [ ] Build is clean: `pnpm build`.
- [ ] One change per PR. Smaller is faster to land.

## Local development

```bash
git clone https://github.com/reveren-ai/core.git
cd core
pnpm install
pnpm test       # vitest in watch mode
pnpm test:run   # one-shot
pnpm typecheck
pnpm build      # tsup → dist/
```

The first `pnpm install` activates the Husky hooks via the `prepare` script. If hooks aren't firing, run `pnpm exec husky` once to re-link them.

## Adding a protocol

Protocols are Markdown files under `protocols/<slug>.protocol.md`, written in the format documented at [reveren-ai/spec](https://github.com/reveren-ai/spec). The bundled set ships as a versioned snapshot — do not edit `protocols/` here directly for new protocol contributions; open a PR against [reveren-ai/protocols](https://github.com/reveren-ai/protocols) and the next release pulls it in.

Editorial fixes to existing protocols (typos, broken links, clarifying language that doesn't change the cognitive frame) are fine to send here directly.

## Releasing

The release process is currently manual: `pnpm build` → `pnpm test:run` → `npm publish --tag alpha`. Automated releases via Changesets are tracked in [TODOS.md](./TODOS.md) under Release 2.

The `0.1.0-alpha` line ships under `--tag alpha` deliberately — the `latest` tag remains unset until the v0.1.0 final ships with the hosted orchestrator gating. Don't tag a publish as `latest` without a release captain's sign-off.

## DCO sign-off

Every commit must be signed off. The DCO is included verbatim:

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off)
    is maintained indefinitely and may be redistributed consistent
    with this project or the open source license(s) involved.
```

Use `git commit -s` to add the sign-off automatically. Without it, the PR will be blocked.

## Reporting issues

GitHub Issues. Please include:

- The version of `@reveren-ai/core` you're running (`rvr -v`)
- The command you ran and the full error
- Your `protocols.config.ts` if it's relevant
- The agent / IDE you were using when the issue surfaced

## Licensing summary

| What | License | Where |
|---|---|---|
| CLI code (`src/`, `dist/`) | BUSL-1.1 with 4-year change date + 4 named grants | [LICENSE](./LICENSE), [LICENSE-ADDITIONAL-GRANT.txt](./LICENSE-ADDITIONAL-GRANT.txt) |
| Protocol library (`protocols/`) | MIT | [LICENSE.protocols](./LICENSE.protocols) |
| File format spec (`docs/SPEC.md`) | W3C SDL2 (text) + MIT (code examples) | inline header in `SPEC.md` |

If you're unsure which applies to your contribution, ask in the PR description. We'll work it out.
