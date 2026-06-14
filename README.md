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

# Run a multi-step pipeline (paid)
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

## What's free and what's paid

reveren is built for individuals, small teams, and vibe coders. The CLI and the base protocol library are free to use. The commercial layer is the specialist agents ("pods") and the protocol marketplace.

| | What you get | Price |
|---|---|---|
| **Free** | The `rvr` CLI, the full base protocol library, and the open `.protocols/` format spec. Local use is unlimited; author and run your own protocols and agents on any number of repos. | $0 |
| **Pods** | reveren's own maintained specialist agents that run inside the core (review, QA, security, planning, and more), kept current as models and practice move. | Subscription (indicative, finalising) |
| **Marketplace** | The Protocol Marketplace: install community and reveren-published protocol packs, with the private registry and `rvr sync` against it. | Subscription (indicative, finalising) |

Local CLI use is always free. Only the pods and the marketplace subscription are paid. There is no enterprise sales motion at this stage.

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

`@reveren-ai/core` v0.1.0+ (the real CLI) will ship under **Business Source License 1.1** with a bespoke Additional Use Grant: source-available; permissive for any internal commercial use; restricts repackaging reveren's pods or marketplace as a competing hosted service. The protocol library content is MIT-licensed (DCO required for contributions); the open `.protocols/` file format spec is published under W3C SDL2 (text) + MIT (schemas).

reveren's specialist agents ("pods") and the hosted Protocol Marketplace are proprietary, commercial components.

## Maintainer

Built and maintained by [Innocent Muisha](https://github.com/iminnocent98).

reveren is operated as a trading name under **Cadere Pty Ltd** (Australia, primary website [reveren.ai](https://reveren.ai)). The reveren name, marks, and software are owned personally by Innocent Muisha and licensed to Cadere Pty Ltd.

## Links

- Website: [reveren.ai](https://reveren.ai)
- npm (canonical): [@reveren-ai/core](https://www.npmjs.com/package/@reveren-ai/core)
- npm (defensive): [@reveren/core](https://www.npmjs.com/package/@reveren/core)
- Manifesto: [MANIFESTO.md](./MANIFESTO.md)
