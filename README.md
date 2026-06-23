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

# Print a named protocol for the current agent to ingest
rvr run <protocol>

# Orchestrate a multi-step pipeline via the bundled coordinator agent
rvr run coordinator

# List the bundled protocols and agents
rvr list

# Check that the required dev-dependencies are installed
rvr check

# Pull protocol updates from the registry (Phase 2)
rvr sync
```

**Pipeline orchestration is an agent, not a separate command.** The bundled
`coordinator` agent reads your backlog and chains protocols into
design → implement → review → QA → document → ship, dispatching each step to the
right specialist with explicit handoffs. It ships inside the core; invoke it
with `rvr run coordinator`. There is no `rvr pipeline` runner — orchestration is
the coordinator.

## Bundled agents

reveren ships six specialist agents in `agents/` — each a multi-step operator
that maps to a protocol. They're agent-agnostic Markdown; run any with
`rvr run <name>`:

| Agent | Role | Protocol |
|---|---|---|
| `coordinator` | Pipeline orchestrator — dispatches the others | — |
| `engineer` | Implements changes on an isolated branch | `plan-engineering` |
| `reviewer` | Paranoid staff-engineer code review | `review` |
| `qa-runner` | End-to-end QA verification | `qa` |
| `doc-writer` | Documentation as a first-class deliverable | `document` |
| `cyber-auditor` | Security / vulnerability auditing | `cyber` |
| `self-improve` | Scheduled improvement loop — proposes protocol updates | `capture-learnings` / `improve` |

## Vibe-coder onboarding

```bash
npx @reveren-ai/core init --preset vibe-coder
```

For founders shipping with v0 / Lovable / Bolt / Cursor, the **vibe-coder
preset** means you never touch the terminal — your AI agent runs the one command
and drives the rest. The CLI **scans your repo locally and deterministically**
(no model, nothing leaves your machine), infers your config, selects the
protocols that fit, and writes a `VIBE-CODER-ONBOARDING.md` brief for your agent
plus a plain-language `USING-REVEREN.md` guide for you. Your agent then authors a
few protocols specific to your project and walks you through approve / amend /
reject in chat. Generation runs on **your** agent — reveren stays bring-your-own-model.

## The self-improvement loop

The bundled `self-improve` agent closes the feedback loop: on a cadence you
choose (every 4/8/12h, **daily** by default, or weekly), it reviews what changed
since its last run, distils durable learnings, and **opens a PR** proposing
amendments to your protocols and operating manual — never auto-merged, and quiet
when nothing material was learned. Your operating manual sharpens itself over
time, with an auditable trail of why.

reveren runs **no daemon** (see [Security](https://reveren.ai/security)) — you
wire the cadence into your own scheduler (a Claude Code `/schedule` routine or a
cron job) and declare intent in `protocols.config.ts`:

```ts
export default defineProtocolsConfig({
  // ...
  selfImprove: { enabled: true, schedule: "daily" } // 4h | 8h | 12h | daily | weekly
})
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

reveren is built for individuals, small teams, and vibe coders, and it is **bring-your-own-model** throughout — your keys, your agent, your machine. The line is drawn on **artifact vs upkeep**: everything that spreads the standard is free; what you pay for is the *ongoing maintenance* that keeps the pods current — never access.

| | What you get | Price |
|---|---|---|
| **Free core** | The `rvr` CLI, the vibe-coder onboarding, the full base protocol library, the open `.protocols/` spec, and a **working baseline of every specialist agent** (the roster above, including the self-improvement loop) — bundled, frozen at each release, run locally on your own model. Unlimited use on any number of repos. | $0 |
| **Maintained pod channel** *(Engineering Pod first)* | The same agents kept **current and stack-tuned between releases**, pulled via authenticated `rvr sync`. You buy **currency, not access**. Agent-agnostic; bring your own model and key. | Subscription (indicative, finalising) |
| **Marketplace** | Community and reveren-published pods, the private registry, and authenticated `rvr sync`. | Subscription (indicative, finalising) |

The paywall is the **sync entitlement**, never local execution — no DRM, no daemon. Not entitled? `rvr run` falls back to the free frozen baseline, so nothing degrades; you just miss the between-release updates. There is no enterprise sales motion at this stage.

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

"Compatible" means the open `.protocols/` Markdown is loaded into the agent's context — through its rules file, an MCP server, or a direct `rvr run` paste. reveren does **not** yet compile protocols into each vendor's native format. Per-agent compilers and a Claude Skills cross-publisher are on the roadmap; until then the format is deliberately plain Markdown, so every agent ingests the same file today without one.

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

## Acknowledgements

reveren was inspired by **[gstack](https://github.com/garrytan/gstack)** by Garry Tan — the open-source (MIT) "software factory" that turns Claude Code into a virtual engineering team. gstack's sprint cycle (think → plan → build → review → test → ship → reflect) and its roster of specialist agent skills shaped how reveren thinks about protocols and the agent pipeline. Where gstack is a Claude-Code-native toolkit, reveren generalises the idea into an agent-agnostic, versioned format that travels across every agent. Thank you, Garry.

## Maintainer

Built and maintained by [Innocent Muisha](https://github.com/iminnocent98).

reveren is operated as a trading name under **Cadere Pty Ltd** (Australia, primary website [reveren.ai](https://reveren.ai)). The reveren name, marks, and software are owned personally by Innocent Muisha and licensed to Cadere Pty Ltd.

## Links

- Website: [reveren.ai](https://reveren.ai)
- npm (canonical): [@reveren-ai/core](https://www.npmjs.com/package/@reveren-ai/core)
- npm (defensive): [@reveren/core](https://www.npmjs.com/package/@reveren/core)
- Manifesto: [MANIFESTO.md](./MANIFESTO.md)
