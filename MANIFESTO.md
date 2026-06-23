# Guardrails for an agentic world

### Why AI agents need an operating manual

*Innocent Muisha · May 2026 · v0 draft*

---

In 2026, every engineering team has at least one AI coding agent. None of them know what your team actually decided last quarter.

Drop Claude into your codebase, or Cursor, or Copilot, or Windsurf — and the agent immediately starts making decisions. Which library version to pull. Which folder layout to follow. Whether to write tests before the implementation or after. What "your" error-handling pattern looks like. What `lint` actually means here.

The agent has no idea. It guesses. Sometimes well. Often not.

This is the agent-context problem, and it is the unglamorous bottleneck of AI-assisted software in 2026.

---

## The diagnosis

The "AI coding agent" category has shipped agents and forgotten to ship the manual.

`.cursorrules`, `.github/copilot-instructions.md`, Windsurf's settings, the system-prompt boxes in every IDE — all of these exist. None of them are versioned, shareable, or governed. They are the per-agent equivalent of a sticky note on a developer's monitor: useful for the person who wrote it, invisible to everyone else, lost the moment the project changes hands.

The result is a class of failure that anyone working with AI agents inside a real team has felt:

- Code that "works" but breaks team conventions you've enforced for years
- The wrong library version used confidently, and at scale
- Tests written in a pattern your codebase abandoned three months ago
- Backwards-compat hacks introduced silently because the agent didn't know there was no backwards to be compatible with
- Half-finished implementations the agent thought were complete because nobody told it what "complete" means here
- No clarification loop: when the implementation uncovers a gap in the product or design decisions, the agent ploughs on instead of stopping to ask — and has no idea who on the team it would even ask

Teams spend as much time correcting AI output as they would have spent writing the code themselves. The compounding cost isn't the bad code. It's the broken trust — engineers learning, slowly and without saying it out loud, that the agent is not a colleague. It's a confident intern with amnesia.

## The shift everyone keeps missing

The reflexive response, when an AI agent gets things wrong, is to ask for a bigger context window.

This was the right answer in 2023. It is no longer the answer in 2026.

Context windows have crossed the million-token mark. The bottleneck has moved. Pasting your entire codebase into a chat doesn't fix the agent's behaviour, because *information* and *instruction* are not the same thing. An agent reading your codebase still has to *infer* your conventions from what it sees. It still has to guess which patterns are aspirational and which are vestigial. It still has no idea which decisions you made deliberately and which leaked in by accident.

The shift the category needs is not bigger context. It is **structured, versioned, retrievable instruction** — the difference between handing an engineer your repo and handing them an onboarding doc.

The data agrees. Memory and persistence research is exiting the lab — Karpathy has been writing about agent cognitive architecture and working memory for the last six months; the Large Memory Model line of work is moving from preprint to product; Garry Tan's most recent YC batches keep funnelling startups working on agent context as the unsolved infrastructure problem. The category is converging on the same answer: agents need an operating system, not a bigger window.

## The reframe

Stop thinking about what to *give* the agent. Start thinking about how to *direct* it.

The right mental model is not "feed the agent more information." It is "give every agent that touches the codebase the same operating manual, versioned and shared like code." That manual lives at the root of the repository. It is markdown. It is checked in. It is reviewed in pull requests. It is the artefact every agent reads first, before it touches a single file.

That is what ESLint and Prettier did for human engineers — they put the team's standards into a file the toolchain enforces, so nobody had to argue about formatting or style at code review again. The standards moved from human memory to executable rules.

reveren is that for AI agents.

## What this looks like in practice

A `.protocols/` directory at the root of your repository, containing markdown instruction files. Each protocol is a cognitive mode the agent can be loaded into: *plan-product*, *plan-engineering*, *review*, *cyber*, *qa*, *ship*, and so on. Each protocol has its own checklist, its own quality signals, its own contract with the next protocol in the chain.

A `protocols.config.ts` that tells the runtime which protocols are active for this repo, which agents to use them with, and which parts of your architecture documentation to inject as additional context.

A coordinator agent that chains protocols into multi-step workflows: design → implement → test → review → ship — dispatching each step to the right specialist, with explicit gates between stages and an audit trail of what ran. It ships inside the core; you invoke it with `rvr run coordinator`.

A private registry that lets your team encode "the way we work with AI" as versioned, internal-only protocols nobody else can see — your architecture decisions, your naming conventions, your compliance requirements, your hard-won institutional memory, all in one place that travels with the codebase.

A CI gate that runs the same protocols against every pull request, catching the AI-generated mistakes that humans would catch in review but agents would not catch in chat.

The result is an AI agent that stops being an intern with amnesia and starts behaving like the team's most consistent engineer.

## The bigger arc

AI agents are not getting less powerful. The teams that win the next decade are not going to be the ones with the biggest models or the cleverest prompts. They are going to be the teams that direct their agents intentionally — not the ones that correct them after the fact.

Guardrails are not a constraint on AI. They are the only way to scale it past *one founder + one chat window*. Every team beyond a single person needs a shared way of working. Every codebase beyond a single feature needs conventions that survive the next chat session. Every regulated industry needs an audit trail that explains why a deployed AI-generated change made it past review.

This is infrastructure work. It is unglamorous. It is exactly the kind of layer the loudest AI vendors will not build, because the loudest AI vendors are competing for agent lock-in, and an agent-agnostic standards layer is the opposite of lock-in. It will be built by someone whose interest aligns with the team using the agent, not with the agent vendor selling them.

## The reveal

reveren is what we built to solve this for ourselves.

Specifically: it is the system [mrktable.com](https://mrktable.com) — a financial-media and analysis platform — was built with. Thirteen protocols. Six specialist agents. Automated pipeline orchestration. Three lifecycle hooks. An auditable evolution log of every amendment since March 2026. Six hundred and ten unit tests, fifteen end-to-end tests, twenty-five database models, regulated-product compliance surface, full CI/CD — all maintained by one founder.

Without reveren, that codebase does not exist. With it, the artefact surface looks like the output of a small engineering team.

We are shipping reveren as `@reveren-ai/core` because it should be infrastructure, not a private advantage.

## With thanks

reveren stands on the shoulders of **[gstack](https://github.com/garrytan/gstack)** by Garry Tan — the open-source software factory that first showed what a disciplined, multi-agent Claude Code workflow could do: think, plan, build, review, test, ship, reflect. reveren takes that idea and generalises it into an agent-agnostic, versioned operating manual that travels across every agent, not just Claude Code. The debt is gladly acknowledged.

## Try it

The CLI lands as `@reveren-ai/core` v0.1.0 in mid-2026. The placeholder is published; the real release is in build.

When v0.1.0 ships:

```
npx @reveren-ai/core init
```

That's the entire onboarding flow. Forty seconds. Your AI agents now know how to work with this codebase.

For updates: [reveren.ai](https://reveren.ai).

---

*reveren is structured, versioned guardrails for AI coding agents. One pipeline. Every agent.*

*Built and maintained by [Innocent Muisha](https://github.com/iminnocent98).*
