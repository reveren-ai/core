import type { ProtocolsConfig } from '../config/schema.js'
import type { ScanResult } from './scan-repo.js'

/**
 * Renderers for the two files `rvr init --preset vibe-coder` emits after the
 * deterministic scan:
 *
 *   1. VIBE-CODER-ONBOARDING.md — addressed to the user's AI agent. It carries
 *      the scan facts and tells the agent to author bespoke protocols and run
 *      approve/amend/reject WITH the user in chat. The CLI never calls a model.
 *   2. USING-REVEREN.md — addressed to the (non-technical) human. Plain-language
 *      breakdown of what was set up and how to ask their agent to use it.
 *
 * Both are produced from scan signals + config — no model, nothing leaves the
 * machine.
 */

export const ONBOARDING_FILENAME = 'VIBE-CODER-ONBOARDING.md'
export const GUIDE_FILENAME = 'USING-REVEREN.md'

interface RenderArgs {
  scan: ScanResult
  config: ProtocolsConfig
  version: string
}

const WHY: Record<string, string> = {
  'plan-product': 'every project should build the right thing before writing code',
  'plan-engineering': 'plans how to build it so it does not break later',
  'plan-ux': 'a UI surface was detected — keep screens usable and accessible',
  copywriter: 'on-screen copy needs to stay on-brand and honest',
  review: 'every change gets a second look for bugs',
  qa: 'features get clicked through, not just diffed',
  ship: 'a final checklist runs before anything goes live',
  document: 'changes get written down so nothing is lost',
  cyber: 'auth / data / payments / regulated domain detected — security matters here',
  'pre-production': 'deploy or migration signals detected — needs a safe release pass',
  improve: 'meta — lets the agent refine the protocol set over time',
  'audit-protocols': 'meta — keeps the just-generated set honest',
  'capture-learnings': 'meta — records decisions as the project evolves',
  'learn-from-users': 'analytics / feedback signals detected — close the loop with users',
  seo: 'a public web surface was detected — help people find this project'
}

function appTypeGuess(scan: ScanResult): string {
  switch (scan.signals.domain) {
    case 'finance':
      return 'fintech / payments app'
    case 'healthcare':
      return 'health app'
    case 'ai-product':
      return 'AI product'
    case 'consumer':
      return 'consumer web app'
    default:
      return scan.config.stack === 'generic' ? 'library / service' : 'web app'
  }
}

function bespokeSuggestions(scan: ScanResult): string[] {
  const out = ['domain-model — the entities, fields, and invariants specific to this project']
  if (scan.selectedProtocols.includes('plan-ux') || scan.selectedProtocols.includes('copywriter')) {
    out.push('brand-voice — this product’s tone, naming, and copy rules (extends copywriter)')
  }
  if (scan.signals.domain !== 'generic') {
    out.push(`compliance-${scan.signals.domain} — the domain rules and sensitive surfaces for a ${scan.signals.domain} product`)
  }
  out.push(`${appTypeGuess(scan).split(' ')[0]}-flows — the core user journeys unique to this app`)
  return out
}

export function renderGenerationBrief(args: RenderArgs): string {
  const { scan, config, version } = args
  const t = config.terminology
  const s = scan.signals
  const project = s.projectName ?? 'this project'
  const runners = s.detectedRunners.length ? s.detectedRunners.join(', ') : config.testing
  const tells = s.domainTells.length ? s.domainTells.join(', ') : 'none'
  const triggers = s.triggerPaths.length ? s.triggerPaths.join(', ') : 'none'
  const bespoke = bespokeSuggestions(scan)

  const selectedRows = scan.selectedProtocols
    .map((p) => `| ${p} | \`${p}${t.extension}\` | ${WHY[p] ?? 'selected for this project'} |`)
    .join('\n')

  const skipped = scan.skippedProtocols.length ? scan.skippedProtocols.join(', ') : 'none'

  return `---
reveren: vibe-coder-onboarding
audience: ai-agent
do-not-show-raw-to-human: true
generated-by: rvr init --preset vibe-coder
cli-version: ${version}
status: AWAITING_AGENT_AUTHORING
---

# reveren — Generation Brief (read this first, agent)

**You are the AI agent the human is building with (v0 / Lovable / Bolt / Cursor / Claude, etc.).**
This file is addressed to **you**, not the person in the chat. They ran nothing —
**you** ran \`rvr init --preset vibe-coder\` on their behalf, the reveren CLI
scanned their repo locally and deterministically (no model, nothing left the
machine), and wrote this brief. Turn it into a working setup **in the chat, with
the human approving each step in plain language.**

> **The human never needs to open a terminal or run a command. Ever.** You run
> anything that needs running. They only ever approve, amend, or reject in chat.

## 1. What the scan detected

| Signal | Detected |
| --- | --- |
| Project | ${project} |
| Stack | ${config.stack} |
| Language | ${config.language} |
| Package manager | ${config.packageManager} |
| Test runner | ${config.testing}${s.detectedRunners.length > 1 ? ` (all: ${runners})` : ''} |
| Compliance domain | ${s.domain} |
| Domain tells | ${tells} |
| Sensitive paths (feed cyber/review) | ${triggers} |
| Best-guess app type | ${appTypeGuess(scan)} (low confidence — sanity-check) |

If the app-type guess is wrong, ask **one** plain question to correct it before
authoring anything.

## 2. Protocols already selected (and why)

The CLI copied the bundled protocols into \`${t.directory}/\` and set
\`activeProtocols\` to the set below. You did **not** write these — use them,
don't rewrite them.

| ${t.singular} | File | Why |
| --- | --- | --- |
${selectedRows}

Skipped for this project: ${skipped}.

## 3. YOUR JOB — author bespoke ${t.plural} for ${project}

The bundled ${t.plural} are generic. Author a few of this project's own, from
what you can see in the repo **and** from the human's own prompts in this chat.
The CLI did not write these (it calls no model) — you are the author.

Suggested (add, drop, or rename based on what they're really building):

${bespoke.map((b, i) => `${i + 1}. ${b}`).join('\n')}

### For each bespoke ${t.singular}: draft → approve/amend/reject IN CHAT → write

1. Match the format of any file in \`${t.directory}/\` exactly (use the project's
   noun "${t.singular}" and extension "${t.extension}").
2. Present the full draft in plain language and ask: *"Want me to **keep it**,
   **change something**, or **drop it**?"*
3. **Keep** → write to \`${t.directory}/<name>${t.extension}\`. **Amend** → revise,
   re-present, loop. **Reject** → discard. Never write an unapproved ${t.singular}.
4. When done, append the names you wrote to \`activeProtocols\` in
   \`protocols.config.ts\` (keep the bundled ones).

## 4. Finalise the usage guide

The CLI wrote a human-facing skeleton at \`${t.directory}/${GUIDE_FILENAME}\`.
Once the bespoke ${t.plural} are approved, fill its agent-fill markers so it
reflects *this* project. Keep it non-technical — they are a vibe coder.

## 5. Done check

- [ ] Every suggested bespoke ${t.singular} was approved / amended / rejected in chat — none written silently.
- [ ] Approved ones exist in \`${t.directory}/\` in the right format.
- [ ] \`activeProtocols\` lists the bundled + approved bespoke names.
- [ ] \`${GUIDE_FILENAME}\` has no remaining agent-fill markers.
- [ ] You never asked the human to run a command.

Then close out in plain language: *"reveren is set up for ${project}. From now on
I'll follow these rules automatically — there's a short guide at \`${GUIDE_FILENAME}\`."*
`
}

const HUMAN_PROTOCOL_BLURB: Record<string, string> = {
  'plan-product': 'Makes sure we build the *right* thing before writing any code.',
  'plan-engineering': 'Plans *how* to build it so it does not break later.',
  'plan-ux': 'Makes screens easy and pleasant to use (and accessible).',
  copywriter: 'Keeps the words on screen on-brand and honest — no made-up claims.',
  review: 'Double-checks the work for bugs before it goes anywhere.',
  qa: 'Actually clicks through the app to make sure it works.',
  cyber: 'Checks for security problems and keeps your users’ data safe.',
  document: 'Writes down what changed so nothing gets lost.',
  ship: 'Runs the final checklist before anything goes live.',
  'pre-production': 'A last safety pass before your real users see a change.',
  seo: 'Helps people find this project on Google.',
  improve: 'Lets your assistant sharpen these rules over time.',
  'audit-protocols': 'Keeps the rule set itself honest and consistent.',
  'capture-learnings': 'Remembers the decisions you make as you go.',
  'learn-from-users': 'Turns user feedback and analytics into improvements.'
}

const AGENT_ROSTER: Array<[string, string]> = [
  ['coordinator', "When you're not sure what to do next — it looks at the project and picks the right next step and specialist. Start here when in doubt."],
  ['engineer', 'When you want something **built, changed, or fixed**.'],
  ['reviewer', 'When you want a **careful second look** for bugs before trusting a change.'],
  ['qa-runner', 'When you want someone to **actually test** that a feature works.'],
  ['cyber-auditor', "When you're worried about **security or user data**."],
  ['doc-writer', 'When you want **what changed written down** clearly.']
]

export function renderUsingGuide(args: RenderArgs): string {
  const { scan, config } = args
  const t = config.terminology
  const project = scan.signals.projectName ?? 'your project'

  const ruleRows = scan.selectedProtocols
    .filter((p) => HUMAN_PROTOCOL_BLURB[p])
    .map((p) => `| ${p} | ${HUMAN_PROTOCOL_BLURB[p]} |`)
    .join('\n')

  const rosterRows = AGENT_ROSTER.map(([name, when]) => `| **${name}** | ${when} |`).join('\n')

  return `# How ${project} works with reveren

You don't have to read this to use it — your AI assistant already follows
everything below automatically. This is just here so you can peek under the hood
whenever you're curious.

**The one thing to remember:** you never have to run anything or open a terminal.
Just describe what you want in plain words, and your AI assistant does the rest
using the rules set up here.

## What reveren just set up

reveren added a set of **working rules** ("${t.plural}") for ${project}. Think of
them as a checklist your assistant follows so it plans, builds, reviews, tests,
and ships carefully and consistently — the way a good team would, every time.
They live in \`${t.directory}/\`. You don't need to edit them.

## The rules that are active (and what each is for)

**Rules that come with reveren:**

| Rule | What it does for you |
| --- | --- |
${ruleRows}

**Rules written specifically for ${project}:**

<!-- agent-fill: list the bespoke ${t.plural} you authored, one row each:
| <name> | <plain-language purpose> | -->

## Who does what — your AI helpers

reveren gives your assistant a small **team of specialists** it can switch into.
You don't pick them yourself, but it helps to know they exist.

| Helper | When it's the right one to ask for |
| --- | --- |
${rosterRows}

## How to ask your AI assistant to use all this

Just talk normally — your assistant already knows the rules. Examples:

- **Start something new:** "Add a way for users to save their favourite items."
- **When unsure what's next:** "Use the coordinator to pick the best next thing to do."
- **Before trusting a change:** "Review and QA this before we go further."
- **Worried about safety:** "Run the security check (the 'cyber' ${t.singular}) over what we just built."

<!-- agent-fill: replace the examples above with one or two tailored to ${project}. -->

You can always just say **"follow the reveren rules"** and your assistant will
apply the right ones for whatever you're doing.

---

*Set up by reveren. Nothing ran in the cloud — it was all configured locally on
your machine, and your code never left it.*
`
}
