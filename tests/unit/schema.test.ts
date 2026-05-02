import { describe, it, expect } from 'vitest'
import {
  PlaybooksConfigSchema,
  BUNDLED_PLAYBOOKS,
  definePlaybooksConfig
} from '../../src/config/schema.js'
import { defaultConfig, noCodePreset } from '../../src/config/defaults.js'

describe('PlaybooksConfigSchema', () => {
  it('accepts the default config', () => {
    expect(() => PlaybooksConfigSchema.parse(defaultConfig())).not.toThrow()
  })

  it('accepts the no-code preset', () => {
    expect(() => PlaybooksConfigSchema.parse(noCodePreset())).not.toThrow()
  })

  it('rejects an unknown stack', () => {
    expect(() =>
      PlaybooksConfigSchema.parse({ ...defaultConfig(), stack: 'angular' })
    ).toThrow()
  })

  it('rejects an unknown storybook mode', () => {
    expect(() =>
      PlaybooksConfigSchema.parse({
        ...defaultConfig(),
        storybook: { mode: 'foo' }
      })
    ).toThrow()
  })

  it('rejects an unknown agent', () => {
    expect(() =>
      PlaybooksConfigSchema.parse({ ...defaultConfig(), agent: 'gemini' })
    ).toThrow()
  })

  it('defaults storybook mode when omitted', () => {
    const parsed = PlaybooksConfigSchema.parse({
      stack: 'next',
      agent: 'claude',
      language: 'ts',
      packageManager: 'pnpm',
      testing: 'vitest'
    })
    expect(parsed.storybook.mode).toBe('full')
    expect(parsed.storybook.deployTarget).toBe('github-pages')
  })
})

describe('BUNDLED_PLAYBOOKS', () => {
  it('lists all 14 v0.1.0 playbooks', () => {
    expect(BUNDLED_PLAYBOOKS).toHaveLength(14)
  })

  it('includes the new storybook playbook', () => {
    expect(BUNDLED_PLAYBOOKS).toContain('storybook')
  })
})

describe('definePlaybooksConfig', () => {
  it('returns the parsed config', () => {
    const config = definePlaybooksConfig(defaultConfig())
    expect(config.stack).toBe('next')
  })
})
