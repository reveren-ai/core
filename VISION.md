# Reveren: vision and roadmap

Reveren is an open standard for **protocols in agentic development**, with a
source-available reference implementation: a way to define, share, and enforce
the guardrails and cognitive modes that AI agents operate under.

In practice it is a small CLI (`rvr`), a library of protocols (Markdown files in
an open format), and an open spec for that format. You point an agent or editor
at a project, Reveren gives it the right protocols, and the agent works inside
them.

## Why

Agentic development is spreading fast and is mostly ungoverned. Without a defined
protocol, the same prompt yields different behaviour across runs, people, and
tools, and teams reinvent the same guardrails (review, QA, security, planning,
documentation) ad hoc with no shared format and no way to version or share them.

There is no agreed format for "here is how an agent should operate on this
codebase", the way there are shared standards for so much else in development.
Reveren gives that a format, a CLI to run it, a library to start from, and a spec
so anyone can build on it. The format and the protocol library are open; the CLI
is source-available and free to use.

## How it works

- **`rvr` CLI (`@reveren-ai/core`)**: the reference implementation (TypeScript,
  Node). Commands: `init` (scaffold protocols into a repo), `run` (execute a
  protocol against the current context), `list`, and `sync` (pull updates).
- **Protocol format**: Markdown files (`*.protocol.md`) in an open, documented
  format. Each defines a cognitive mode or guardrail an agent runs inside.
- **Protocol library**: a bundled base set (review, QA, security, planning,
  documentation, and more), with a canonical home at
  [reveren-ai/protocols](https://github.com/reveren-ai/protocols).
- **The spec**: the format specification in [`docs/SPEC.md`](./docs/SPEC.md),
  published under open terms so anyone can implement or extend it.

An optional hosted layer (accounts, run analytics, a private registry, CI
integration) is planned as a separate product built on top of the
source-available core. The CLI runs fully locally without it.

## Licensing and what's paid

Reveren is built for individuals, small teams, and vibe coders. The CLI and the
base protocol library are free to use; the commercial layer is the specialist
agents ("pods") and the protocol marketplace.

| What | Terms |
|---|---|
| Core / CLI | Business Source License 1.1 (source-available, free to use; converts to Apache-2.0 on its Change Date) |
| Protocol library | MIT |
| Format spec | Open (W3C SDL2 text + MIT examples) |
| Pods (reveren's in-core specialist agents) | Commercial (subscription) |
| Protocol Marketplace | Commercial (subscription) |

The Reveren name and marks are owned and are not granted by the code licence.
Local CLI use is always free; only the pods and the marketplace subscription are
paid.

## Roadmap

Direction, not promises. Dates are targets.

- **Now (v0.1):** the CLI (`init`, `run`, `list`, `sync`), the bundled protocol
  library, the open format spec, test coverage, and a clean release workflow.
- **Next:** a low-friction onboarding flow for vibe coders (connect a repo, get a
  tailored protocol set and a short guide, no CLI required), plus the first
  reveren pods.
- **Then:** the Protocol Marketplace and private registry with `rvr sync`; a
  GitHub App and CI integration that runs protocols against a pull request and
  posts results as checks.
- **Research:** protocol intelligence (AI-assisted authoring, then gap and
  conflict detection), a structured substrate for protocols that understand a
  codebase, and vertical protocol packs.

## Contributing

Protocol contributions are the easiest high-value way to help, and the protocol
library is MIT-licensed: send new cognitive modes and guardrails to
[reveren-ai/protocols](https://github.com/reveren-ai/protocols). Improvements to
the CLI, the spec, the docs, and issue triage are welcome too. Start with
[`CONTRIBUTING.md`](./CONTRIBUTING.md), which sets out the licence split and the
DCO sign-off.

If you have a workflow you already trust an agent with, it can probably be a
protocol. We would love to see it.
