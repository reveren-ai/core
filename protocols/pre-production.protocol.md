# Protocol: Pre-Production

> Cognitive mode: Platform engineer + release operations
>
> Custom protocol for this stack. Companion to `ship.protocol.md`
> (per-feature release hygiene). This protocol is per-PROJECT, not
> per-feature — runs once when bringing a new project up to a
> production-ready posture, and again whenever launching a new
> environment (e.g. adding a `staging` lane).

---

## When to use

- A new project has just been scaffolded and needs Vercel + DNS + DB +
  observability set up before any feature work ships
- Migrating an existing project off shared infra into its own
  Vercel/Neon/PostHog projects
- Adding a new long-lived environment (staging, demo, geo-specific
  regions) to a project that's already on this stack
- Auditing an existing project to make sure it follows the canonical
  pre-prod posture (drift check)

**Don't use** for routine feature ships — that's `ship.protocol.md`.
**Don't use** for incident response — that's a separate runbook.

---

## How to think

You are a platform engineer who treats environments as durable assets.
Your job is to leave the project with:

- A clear path from `git push` to "deployed at the right URL with the
  right env vars"
- Pre-launch / pre-feature-flag affordances that turn on and off via
  env-var, never via code change at the wrong moment
- A canonical playbook (`docs/PRE_PRODUCTION.md`) so the next person
  bringing up a project doesn't re-derive the order of operations from
  shell history
- An observability layer where every conversion-grade interaction has
  an event you can query the next morning

Order of operations matters. DNS blocks Vercel; Vercel blocks env vars;
env vars block the database; the database blocks the route handler.
Skipping ahead leads to "alias_conflict" / "DATABASE_URL is not set" /
"prisma migrate failed" — all symptoms of doing things in the wrong
order, all costing more time to unwind than to do correctly the first time.

---

## Reference points

Before starting, read:

- `docs/PRE_PRODUCTION.md` — the canonical step-by-step playbook for
  this stack. This protocol is the "when + why"; the playbook is the
  "what + how".
- `docs/NEON.md` — Neon migration cadence + branch model
- Any existing `PRE_GO_LIVE_CHECKLIST.md` for the project — the launch
  gate this protocol's output feeds into

If those three files don't exist in the project, this protocol is the
moment you create them (copy from the canonical reveren copies and
adapt project-specific values).

---

## Workflow

### Phase 0 — Decide the topology

Before touching any infrastructure, lock these decisions in writing
(in `PRE_GO_LIVE_CHECKLIST.md` or equivalent):

| Decision | Default | When to deviate |
|---|---|---|
| Hosting | Vercel | Need region we don't have, want non-Node runtime, custom build infra |
| Frontend framework | Next.js App Router | Existing project on a different framework |
| Database | Neon Postgres 17 | Need MySQL/MongoDB/etc.; need realtime (Supabase is canonical there); existing investment elsewhere |
| Auth | Auth.js v5 (when we get there) | Need enterprise SSO (consider Clerk); need Neon-native (Stack Auth) |
| Analytics | PostHog | Strict no-third-party (use Plausible self-hosted); already on Mixpanel/Amplitude |
| DNS | Vercel-managed (Option B in playbook) | Email is heavily configured at registrar and you don't want to migrate records |
| Pre-launch gate | env-var coming-soon (LAUNCH_MODE) | Launching publicly day one (skip the gate entirely) |
| Long-lived branches | `main` + `uat` + `develop` | Solo project pre-PMF — `main` only is fine |

Write the choices down. The playbook assumes the defaults; if you
deviate, the rest of this protocol still applies but specific commands
in §10 will need adapting.

### Phase 1 — Provision in dependency order

Follow `docs/PRE_PRODUCTION.md` §1–§9 in sequence. Don't parallelise
the steps that depend on DNS propagation. Each step has a
verification block at the bottom of the playbook — run those
before declaring the step done.

The dependency chain is:
```
GitHub repo → DNS authority → Vercel project → Custom domains
                                    ↓
                              Branch deploys
                                    ↓
                              Env vars per scope
                                    ↓
                              Neon branches
                                    ↓
                              Prisma migrations
                                    ↓
                              Route handler wiring
                                    ↓
                              PostHog (last — observability sits on top
                                      of working app)
```

### Phase 2 — Verify end-to-end

After all phases, run the smoke block from `PRE_PRODUCTION.md` §10:

- DNS resolves on all four hosts (apex, www, uat, dev)
- HTTP returns expected status (200 / 308) on each
- Robots `noindex` only on non-prod hosts
- JSON-LD schemas render on the right pages
- DB inserts succeed (3-row smoke)
- API routes respond through the gate where allowlisted

Don't sign off on the protocol until all smokes pass on the live URLs.
A passing local build is not a passing deployment.

### Phase 3 — Document the state

Update or create:

| File | What goes in |
|---|---|
| `PRE_GO_LIVE_CHECKLIST.md` | Tick the items this protocol just shipped. Note any decisions deferred (e.g. "PostHog provisioned but per-env keys not yet split") |
| `docs/PRE_PRODUCTION.md` | If this project's setup deviated from the canonical playbook, add a "Project-specific notes" section at the bottom |
| `docs/NEON.md` | Project-specific notes go in a "This project's specifics" section (region, plan tier, retention overrides) |
| `TODOS.md` (project-scoped) | Add the post-pre-prod follow-ups: defensive domains, OG cards, lawyer review of legal pages, analytics splits |

### Phase 4 — Hand off

Pre-prod is done when:

1. Every smoke in §10 passes on live URLs
2. Every checklist item in `PRE_GO_LIVE_CHECKLIST.md`'s 🔴 Infrastructure
   section is ticked
3. The launch gate (`LAUNCH_MODE=coming-soon`) is verified working AND
   verified reversible (you've turned it on, off, and back on at least once)
4. The team can find the playbook from the project root in <60 seconds

---

## Output format

```
## Pre-Production Setup: [Project Name]

### Topology Decisions
[List the deviations from defaults in Phase 0 — or "all defaults" if none]

### Provisioned
- GitHub repo: <url>
- Vercel project: <slug> (<projectId>)
- Domains: <apex>, <www>, <uat>, <dev>
- Neon project: <name> (region <region>, branches: main / uat / develop)
- PostHog projects: <prod-id>, <uat-id>, <dev-id> (or note: single project tagged by env)

### Verification
[paste output of the §10 smoke block — DNS lines, HTTP statuses, schema-type list, db smoke counts]

### Open Items
[anything that's blocked on external action — registrar transfer, lawyer review, partner credentials]

### Handoff Notes
[anything project-specific the next person needs to know — e.g. "Production Neon is on Free tier autosuspend; compute is paused after 5 min idle"]
```

---

## Bouncing off other protocols

```
plan-product           plan-ux            plan-engineering
       │                  │                       │
       └─────── feature work ──────────────────────┘
                          │
                          ▼
                       ship.protocol.md
                          │
                          ▼
                     deploy via Vercel
                          ▲
                          │
              pre-production.protocol.md  ◄── YOU ARE HERE (one-time per project / per env)
                          │
                          ▼
                  Vercel + Neon + PostHog ready to receive ships
```

This protocol is upstream of everything in the feature pipeline. It
runs once (or once per environment), and the output is "you can now
run ship.protocol.md and the deploy will land somewhere real."

---

## Quality signals

| Signal | ✅ Good | ❌ Poor |
|---|---|---|
| Time from `git push` to "rendered on the right URL" | Under 90s for any branch | Manual steps required between push and deploy |
| Env-var sync | `.env.local` (DEV) and Vercel env vars (PROD/UAT/DEV scopes) match the playbook table exactly | Missing keys, wrong scope assignment, secrets in committed files |
| Robots posture | Production indexable; uat/dev/PR previews `noindex/nofollow` | Production accidentally `noindex`; previews accidentally `index` |
| Coming-soon gate | One env var flip → site swaps; no code change required at launch | Launch requires editing files + redeploying |
| DB migrations | `prisma migrate deploy` runs in Vercel build for every push; no manual migration commands needed | Migrations applied via local CLI hits to prod |
| Observability | Every conversion CTA has a PostHog event; events visible in PostHog dashboard within minutes of a smoke POST | Autocapture only; no funnel attribution; "did the user click" requires reading server logs |
| Documentation | The next engineer can run this protocol on a new project from `PRE_PRODUCTION.md` alone | Setup is undocumented or split across chat history / Slack pins |
| Smoke verification | All §10 smokes return expected output on live URLs | "It worked locally" — no live verification |

> If signals trend ⚠️ or ❌, use the **improve protocol**
> (`improve.protocol.md`) to amend this protocol or the playbook docs.

---

## Rules

- **Always read `docs/PRE_PRODUCTION.md` first.** This protocol assumes
  you have the playbook open. Don't try to derive the order of
  operations from shell history.
- **Never paste production credentials in chat / issue trackers /
  screen-share.** If it happens, immediately rotate per `NEON.md`
  §"Credential rotation".
- **DNS first, Vercel second, env vars third, DB fourth.** Skipping ahead
  produces `alias_conflict` and "connection string not set" errors that
  are 10× more annoying to unwind than to do in order.
- **Verify on live URLs, not local builds.** A green local build proves
  the code compiles, not that the deploy works.
- **Document deviations.** If this project skips the coming-soon gate,
  uses GoDaddy DNS instead of Vercel DNS, runs on Pro plan, etc. —
  note it in `PRE_GO_LIVE_CHECKLIST.md` so the next person doesn't
  spend an hour reverse-engineering "why is this different".
- **Don't over-provision.** Hobby plan is fine until you have real
  users; Free Neon is fine until you have real query volume; one
  PostHog project tagged by env is fine until you have noisy uat
  signal polluting prod analytics.
- **Tear-down equals stand-up.** If you're decommissioning an env
  (e.g. removing `staging`), do it in reverse: PostHog → Neon → env
  vars → Vercel domain → DNS → branch. Don't leave orphans.
