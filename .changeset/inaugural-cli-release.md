---
"@reveren-ai/core": minor
---

First real CLI release. `rvr init` scaffolds `protocols.config.ts`, the
`.protocols/` library, and the host package.json wiring; `rvr run <name>` prints
any protocol — or the bundled **coordinator** agent — to stdout for the active
agent to ingest; `rvr list` and `rvr check` round out the surface. Ships the
bundled protocol library, the coordinator agent, and the open `.protocols/`
format spec. Replaces the `v0.0.1` reserved-scope placeholder.
