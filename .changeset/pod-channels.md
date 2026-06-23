---
'@reveren-ai/core': minor
---

Add pod channels to the config + CLI: every bundled agent's `baseline` stays free
and frozen in the CLI, while a maintained `current` channel (the Engineering Pod
first) is gated behind an authenticated `rvr sync` (`registry.token`). Adds the
`pods` config field, `PodChannelEnum`, `POD_AGENTS`/`AGENT_POD`, and the
`podChannel` / `isCurrentChannelEntitled` helpers; `rvr list` now labels each agent
as free-baseline or pod, and `rvr sync` blocks unentitled `current` pods with a
clear subscription message. The paywall lives only on the registry entitlement —
local execution stays bring-your-own-model with no daemon.
