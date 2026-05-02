import {
  BUNDLED_PLAYBOOKS,
  PlaybooksConfigSchema,
  type PlaybooksConfig
} from './schema.js'

export function defaultConfig(): PlaybooksConfig {
  return PlaybooksConfigSchema.parse({
    stack: 'next',
    agent: 'claude',
    language: 'ts',
    packageManager: 'pnpm',
    testing: 'vitest',
    activePlaybooks: [...BUNDLED_PLAYBOOKS],
    storybook: {
      mode: 'full',
      autoGenerateStories: true,
      deployTarget: 'github-pages'
    },
    compliance: {
      domain: 'generic',
      triggerPaths: [],
      jurisdictions: []
    }
  })
}

/**
 * Locked Phase 3b contract for the no-code init preset (web UI / Lovable / Bolt / v0).
 *
 * IMPORTANT: This shape is part of the public API. Changing it is a breaking change
 * — bump the major version and add a Changeset. The web UI at reveren.ai/start
 * depends on this exact shape, and the snapshot test in tests/unit/presets.test.ts
 * locks it in.
 */
export function noCodePreset(): PlaybooksConfig {
  return PlaybooksConfigSchema.parse({
    stack: 'next',
    agent: 'claude',
    language: 'ts',
    packageManager: 'pnpm',
    testing: 'vitest',
    activePlaybooks: [...BUNDLED_PLAYBOOKS],
    storybook: {
      mode: 'hosted-gallery',
      autoGenerateStories: true,
      deployTarget: 'github-pages'
    },
    compliance: {
      domain: 'generic',
      triggerPaths: [],
      jurisdictions: []
    }
  })
}
