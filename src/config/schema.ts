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

export const BUNDLED_PLAYBOOKS = [
  'plan-product',
  'plan-engineering',
  'plan-ux',
  'review',
  'qa',
  'ship',
  'document',
  'cyber',
  'copywriter',
  'legal',
  'improve',
  'audit-skills',
  'capture-learnings',
  'storybook'
] as const

export const PlaybooksConfigSchema = z.object({
  $schemaVersion: z.literal(1).default(1),
  stack: StackEnum,
  agent: AgentEnum,
  language: LanguageEnum,
  packageManager: PackageManagerEnum,
  testing: TestingEnum,
  activePlaybooks: z.array(z.string()).default([...BUNDLED_PLAYBOOKS]),
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
    .optional()
})

export type PlaybooksConfig = z.infer<typeof PlaybooksConfigSchema>
export type Stack = z.infer<typeof StackEnum>
export type Agent = z.infer<typeof AgentEnum>
export type StorybookMode = z.infer<typeof StorybookModeEnum>
export type DeployTarget = z.infer<typeof DeployTargetEnum>

export function definePlaybooksConfig(config: PlaybooksConfig): PlaybooksConfig {
  return PlaybooksConfigSchema.parse(config)
}
