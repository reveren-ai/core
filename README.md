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

The CLI binary is `rvr` (npm-style short command). The brand is reveren; `rvr` is what you type.

```bash
# Initialise reveren in any repo
npx @reveren-ai/core init

# Run a named protocol against the current context
rvr run <protocol>

# List active and available protocols
rvr list

# Pull the latest protocol updates
rvr sync

# Run a multi-step pipeline (Pro+)
rvr pipeline run <name>
```

After `rvr init`, your repo gets:

- A `protocols.config.ts` at the root
- A `.protocols/` directory with the active protocol set, a `README.md` operating guide, and the MIT `LICENSE` covering the protocol files
- A `"protocols": "rvr run"` script in `package.json`

Every AI agent that touches the repo from then on reads from `.protocols/`.

## Why this exists

Every team using AI coding agents in 2026 has the same problem: the agent is brilliant in isolation and blind in context. It doesn't know your stack, your conventions, or your decisions. So it guesses.

The result is code that technically works but breaks team conventions, uses the wrong library version, skips your test pattern, or ignores an architectural rule the team agreed on six months ago. Teams spend as much time correcting AI output as they would writing it themselves.

reveren fixes the input side. Once `.protocols/` is in your repo, every agent — across every chat session, every IDE, every model — works from the same set of rules.

For the long-form argument, see [MANIFESTO.md](./MANIFESTO.md).

## Pricing (when v0.1.0 ships)

| Tier | USD | Included | Overage |
|---|---|---|---|
| **Free** | $0 | Full base protocol library, CLI, single repo, 200 cloud pipeline runs/mo | Hard cap |
| **Pro** | $19/mo | + Custom protocols, multi-step pipelines, unlimited repos, CI/CD, MCP server (read), 2,000 runs/mo | $0.015/run |
| **Team** | $39/seat/mo | + Hosted dashboard, private registry, team sync, analytics, GitHub App, SSO, MCP server (read+write), 6,000 runs/seat/mo (pooled) | $0.012/run |
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

The `.protocols/` file format is published as an open spec — any agent vendor or tool can read or write it.

## Naming is configurable

reveren defaults to **protocol** as the noun (directory `.protocols/`, extension `.protocol.md`), but the term is just a label. If your team prefers `playbook`, `skill`, `rule`, or anything else, set `terminology` in `protocols.config.ts`:

```ts
export default defineProtocolsConfig({
  // ...
  terminology: {
    singular: "playbook",
    plural: "playbooks",
    directory: ".playbooks",
    extension: ".playbook.md"
  }
})
```

The CLI honours your choice when scaffolding files and in user-facing output; the wire format stays the same so cross-project tooling keeps working.

## License

`@reveren-ai/core` v0.0.1 (this placeholder) is `UNLICENSED`.

`@reveren-ai/core` v0.1.0+ (the real CLI) will ship under **Business Source License 1.1** with a bespoke Additional Use Grant — source-available; permissive for any internal commercial use; restricts repackaging as a competing hosted service. The protocol library content is MIT-licensed (DCO required for contributions); the open `.protocols/` file format spec is published under W3C SDL2 (text) + MIT (schemas).

The hosted dashboard (`app.reveren.ai`) is proprietary.

## Maintainer

Built and maintained by [Innocent Muisha](https://github.com/iminnocent98).

reveren is a product of **Reveren Pty Ltd** (Australia, trading as **reveren**, primary website [reveren.ai](https://reveren.ai)), under the Luanda Pty Ltd holding company group.

## Links

- Website: [reveren.ai](https://reveren.ai)
- npm (canonical): [@reveren-ai/core](https://www.npmjs.com/package/@reveren-ai/core)
- npm (defensive): [@reveren/core](https://www.npmjs.com/package/@reveren/core)
- Manifesto: [MANIFESTO.md](./MANIFESTO.md)
