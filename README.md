# reveren

> **One pipeline. Every agent.**
>
> Structured, versioned guardrails for AI coding agents. Works with Claude, Cursor, Copilot, Windsurf, Lovable, Bolt, and v0.

[![npm](https://img.shields.io/npm/v/@reveren-ai/core?label=%40reveren-ai%2Fcore)](https://www.npmjs.com/package/@reveren-ai/core)

---

## What reveren is

reveren is the **operating manual for AI agents**. It lives at the root of any repository and tells every AI agent that touches the codebase — Claude, Cursor, Copilot, Windsurf, Lovable, Bolt, v0 — exactly how that codebase wants to be worked on:

- which packages to use
- which conventions to follow
- which architectural patterns to respect
- which tests to write
- which guardrails to obey

It is **agent-agnostic, stack-agnostic, and CLI-first**.

ESLint and Prettier won the "code quality" layer for human engineers. **reveren is the equivalent layer for AI agents** — structured, versioned, shareable instructions that turn a generic assistant into a specialist that knows your project.

## Status

> **Pre-launch — v0.0.1 placeholder published. Real CLI v0.1.0 in build.**

The published `@reveren-ai/core` package on npm is a reserved-scope placeholder. The actual reveren CLI ships as v0.1.0 in mid-2026. This repository will fill in as the CLI is built.

## The shape of v0.1.0 (what's coming)

```bash
# Initialise reveren in any repo
npx @reveren-ai/core init

# Run a named skill against the current context
rvr run <skill>

# List active and available skills
rvr list

# Pull the latest skill updates
rvr sync

# Run a multi-step pipeline (Pro+)
rvr pipeline run <name>
```

After `rvr init`, your repo gets:

- A `skills.config.ts` at the root
- A `.skills/` directory with the active skill set
- A `SKILLS.md` operating guide
- A `"skills": "rvr run"` script in `package.json`

Every AI agent that touches the repo from then on reads from `.skills/`.

## Why this exists

Every team using AI coding agents in 2026 has the same problem: the agent is brilliant in isolation and blind in context. It doesn't know your stack, your conventions, or your decisions. So it guesses.

The result is code that technically works but breaks team conventions, uses the wrong library version, skips your test pattern, or ignores an architectural rule the team agreed on six months ago. Teams spend as much time correcting AI output as they would writing it themselves.

reveren fixes the input side. Once `.skills/` is in your repo, every agent — across every chat session, every IDE, every model — works from the same set of rules.

For the long-form argument, see [MANIFESTO.md](./MANIFESTO.md).

## Pricing (when v0.1.0 ships)

| Tier | USD | Included | Overage |
|---|---|---|---|
| **Free** | $0 | Full base skill library, CLI, single repo, 100 cloud pipeline runs/mo | Hard cap |
| **Pro** | $15/mo | + Custom skills, multi-step pipelines, unlimited repos, CI/CD, 1,000 runs/mo | $0.02/run |
| **Team** | $35/seat/mo | + Hosted dashboard, private registry, team sync, analytics, GitHub App, SSO, 5,000 runs/seat/mo (pooled) | $0.015/run |
| **Enterprise** | Custom | + Self-host, dedicated infra, SOC2, custom SLAs, dedicated CSM | Custom |

Local CLI runs are unlimited and free on every tier. Only **cloud-orchestrated** pipeline runs (those that hit the dashboard, registry, or CI integration) are metered.

## Compatible agents

| Agent | Status |
|---|---|
| Claude (CLI, Cursor, API) | ✓ |
| Cursor | ✓ |
| GitHub Copilot | ✓ |
| Windsurf (Codeium) | ✓ |
| Lovable | ✓ |
| Bolt | ✓ |
| v0 | ✓ |
| Any MCP-compatible agent | ✓ |

The `.skills/` file format is published as an open spec — any agent vendor or tool can read or write it.

## License

`@reveren-ai/core` v0.0.1 (this placeholder) is `UNLICENSED`.

`@reveren-ai/core` v0.1.0+ (the real CLI) will ship under **Business Source License 1.1 (BUSL-1.1)** — source-available, free for non-commercial and internal-evaluation use, automatic conversion to Apache 2.0 after four years. The skill library content is MIT-licensed.

The hosted dashboard (`app.reveren.ai`) is proprietary.

## Maintainer

Built and maintained by [Innocent Muisha](https://github.com/iminnocent98).

reveren is a product of **reveren.ai (Australia), under the Luanda Pty Ltd holding company group.

## Links

- Website: [reveren.ai](https://reveren.ai)
- npm (canonical): [@reveren-ai/core](https://www.npmjs.com/package/@reveren-ai/core)
- npm (defensive): [@reveren/core](https://www.npmjs.com/package/@reveren/core)
- Manifesto: [MANIFESTO.md](./MANIFESTO.md)
