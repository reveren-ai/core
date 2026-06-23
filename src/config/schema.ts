import { z } from 'zod'

export const StackEnum = z.enum([
  'next',
  'vite-react',
  'remix',
  'sveltekit',
  'astro',
  'generic'
])

export const AgentEnum = z.enum([
  'claude',
  'cursor',
  'copilot',
  'windsurf',
  'multiple'
])

export const LanguageEnum = z.enum(['ts', 'js'])

export const PackageManagerEnum = z.enum(['pnpm', 'npm', 'yarn', 'bun'])

export const TestingEnum = z.enum(['vitest', 'jest', 'playwright', 'none'])

export const StorybookModeEnum = z.enum(['full', 'hosted-gallery', 'disabled'])

export const DeployTargetEnum = z.enum([
  'github-pages',
  'chromatic',
  'none'
])

export const BUNDLED_PROTOCOLS = [
  'plan-product',
  'plan-engineering',
  'plan-ux',
  'copywriter',
  'review',
  'qa',
  'ship',
  'document',
  'cyber',
  'pre-production',
  'improve',
  'audit-protocols',
  'capture-learnings',
  'learn-from-users',
  'seo'
] as const

// Bundled specialist agents shipped inside the CLI. Unlike protocols (single
// cognitive modes loaded one at a time), an agent is a multi-step operator.
// `coordinator` is the pipeline orchestrator — it chains the others into
// design → implement → review → QA → document → ship. Each maps to a bundled
// protocol. Runnable via `rvr run <name>`; files live at `agents/<name>.agent.md`.
export const BUNDLED_AGENTS = [
  'coordinator',
  'engineer',
  'reviewer',
  'qa-runner',
  'doc-writer',
  'cyber-auditor',
  'self-improve'
] as const

// Channels an agent can resolve from. The `baseline` of every agent ships free
// and frozen inside the CLI — it runs forever, offline, on the user's own
// model. The `current` channel is the *maintained* tier: kept sharp and
// stack-tuned between CLI releases, pulled via authenticated `rvr sync` and
// gated on `registry.token`. Selling currency, not access. See
// `reveren_monetization_model.md` at the workspace root.
export const PodChannelEnum = z.enum(['baseline', 'current'])
export type PodChannel = z.infer<typeof PodChannelEnum>

// Pods group bundled agents that have a paid, maintained `current` channel.
// The Engineering Pod is the first paid pod; its baseline agents stay free.
// Agents not in any pod (e.g. `self-improve`) are free-only — their currency
// rides on the open protocol library, not a subscription.
export const POD_AGENTS = {
  engineering: [
    'coordinator',
    'engineer',
    'reviewer',
    'qa-runner',
    'doc-writer',
    'cyber-auditor'
  ]
} as const

export type PodName = keyof typeof POD_AGENTS

// Reverse index: agent name -> the pod it belongs to (if any).
export const AGENT_POD: Readonly<Record<string, PodName>> = Object.freeze(
  Object.fromEntries(
    Object.entries(POD_AGENTS).flatMap(([pod, agents]) =>
      agents.map((agent) => [agent, pod as PodName])
    )
  )
)

// Cadences the self-improve loop can be scheduled on. The CLI doesn't run a
// daemon (see the Security posture) — this is declarative intent the user wires
// into their own scheduler (a Claude Code /schedule routine or a cron job).
export const SELF_IMPROVE_SCHEDULES = ['4h', '8h', '12h', 'daily', 'weekly'] as const

// Default terminology — projects can override (e.g. "playbook", "skill", "rule").
// The reference CLI uses the configured noun in user-facing output and the
// configured directory/extension when scaffolding via `init`.
export const DEFAULT_TERMINOLOGY = {
  singular: 'protocol',
  plural: 'protocols',
  directory: '.protocols',
  extension: '.protocol.md'
} as const

export const TerminologySchema = z
  .object({
    singular: z.string().min(1).default(DEFAULT_TERMINOLOGY.singular),
    plural: z.string().min(1).default(DEFAULT_TERMINOLOGY.plural),
    directory: z
      .string()
      .min(1)
      .regex(/^\.?[a-zA-Z0-9_-]+$/)
      .default(DEFAULT_TERMINOLOGY.directory),
    extension: z
      .string()
      .regex(/^\.[a-zA-Z0-9.]+$/, 'extension must start with "."')
      .default(DEFAULT_TERMINOLOGY.extension)
  })
  .default({})

export type Terminology = z.infer<typeof TerminologySchema>

export const ProtocolsConfigSchema = z.object({
  $schemaVersion: z.literal(1).default(1),
  // Defaults below mean a project can ship a partial config (e.g. only
  // `{ storybook: {...} }`) and have it validate. This is intentional: real
  // projects (like mrktable) adopted the protocols pattern before the full
  // schema existed and only declare the fields they actually consume. The
  // CLI fills in sensible defaults for everything else. The full shape is
  // still emitted by `noCodePreset()` for the web UI / Lovable / Bolt / v0
  // path — that contract is unchanged.
  stack: StackEnum.default('next'),
  agent: AgentEnum.default('claude'),
  language: LanguageEnum.default('ts'),
  packageManager: PackageManagerEnum.default('pnpm'),
  testing: TestingEnum.default('vitest'),
  terminology: TerminologySchema,
  activeProtocols: z.array(z.string()).default([...BUNDLED_PROTOCOLS]),
  storybook: z
    .object({
      mode: StorybookModeEnum.default('full'),
      autoGenerateStories: z.boolean().default(true),
      deployTarget: DeployTargetEnum.default('github-pages')
    })
    .default({}),
  compliance: z
    .object({
      domain: z
        .enum(['finance', 'healthcare', 'ai-product', 'consumer', 'generic'])
        .default('generic'),
      triggerPaths: z.array(z.string()).default([]),
      jurisdictions: z.array(z.string()).default([])
    })
    .default({}),
  registry: z
    .object({
      url: z.string().url().optional(),
      token: z.string().optional()
    })
    .optional(),
  // Pod channels. The baseline of every agent is free and bundled; opting a pod
  // into the `current` channel selects the maintained tier pulled via
  // authenticated `rvr sync` (requires `registry.token`). Optional with no
  // default so default and no-code configs stay byte-stable.
  pods: z
    .record(
      z.object({ channel: PodChannelEnum.default('baseline') })
    )
    .optional(),
  // Opt-in self-improvement loop. Declarative only — the user schedules it.
  // Optional (no default) so default/no-code configs stay byte-stable.
  selfImprove: z
    .object({
      enabled: z.boolean().default(false),
      schedule: z.enum(SELF_IMPROVE_SCHEDULES).default('daily')
    })
    .optional()
})

export type ProtocolsConfig = z.infer<typeof ProtocolsConfigSchema>
export type Stack = z.infer<typeof StackEnum>
export type Agent = z.infer<typeof AgentEnum>
export type StorybookMode = z.infer<typeof StorybookModeEnum>
export type DeployTarget = z.infer<typeof DeployTargetEnum>

export function defineProtocolsConfig(config: ProtocolsConfig): ProtocolsConfig {
  return ProtocolsConfigSchema.parse(config)
}

// The effective channel for a pod, defaulting to the free `baseline` when the
// pod is unset in config.
export function podChannel(config: ProtocolsConfig, pod: PodName): PodChannel {
  return config.pods?.[pod]?.channel ?? 'baseline'
}

// A maintained (`current`) pull is entitled only when the pod is opted in AND a
// registry token is present. No token => baseline, which is always free. The
// paywall lives on the registry/sync entitlement, never on local execution.
export function isCurrentChannelEntitled(
  config: ProtocolsConfig,
  pod: PodName
): boolean {
  return podChannel(config, pod) === 'current' && !!config.registry?.token
}
