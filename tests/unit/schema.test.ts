import { describe, it, expect } from 'vitest'
import {
  ProtocolsConfigSchema,
  BUNDLED_PROTOCOLS,
  defineProtocolsConfig
} from '../../src/config/schema.js'
import { defaultConfig, noCodePreset } from '../../src/config/defaults.js'

describe('ProtocolsConfigSchema', () => {
  it('accepts the default config', () => {
    expect(() => ProtocolsConfigSchema.parse(defaultConfig())).not.toThrow()
  })

  it('accepts the no-code preset', () => {
    expect(() => ProtocolsConfigSchema.parse(noCodePreset())).not.toThrow()
  })

  it('rejects an unknown stack', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({ ...defaultConfig(), stack: 'angular' })
    ).toThrow()
  })

  it('rejects an unknown storybook mode', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({
        ...defaultConfig(),
        storybook: { mode: 'foo' }
      })
    ).toThrow()
  })

  it('rejects an unknown agent', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({ ...defaultConfig(), agent: 'gemini' })
    ).toThrow()
  })

  it('defaults storybook mode when omitted', () => {
    const parsed = ProtocolsConfigSchema.parse({
      stack: 'next',
      agent: 'claude',
      language: 'ts',
      packageManager: 'pnpm',
      testing: 'vitest'
    })
    expect(parsed.storybook.mode).toBe('full')
    expect(parsed.storybook.deployTarget).toBe('github-pages')
  })

  it('accepts an empty config (every field defaulted)', () => {
    // A real project (mrktable) adopted the protocols pattern before the full
    // schema existed. The CLI must accept partial / pre-existing configs and
    // fill defaults rather than rejecting them outright.
    const parsed = ProtocolsConfigSchema.parse({})
    expect(parsed.stack).toBe('next')
    expect(parsed.agent).toBe('claude')
    expect(parsed.language).toBe('ts')
    expect(parsed.packageManager).toBe('pnpm')
    expect(parsed.testing).toBe('vitest')
    expect(parsed.terminology.directory).toBe('.protocols')
  })

  it('accepts a mrktable-style minimal config (storybook only)', () => {
    const parsed = ProtocolsConfigSchema.parse({
      storybook: {
        mode: 'full',
        autoGenerateStories: false,
        deployTarget: 'none'
      }
    })
    expect(parsed.storybook.mode).toBe('full')
    expect(parsed.storybook.autoGenerateStories).toBe(false)
    expect(parsed.storybook.deployTarget).toBe('none')
    // Defaults still applied for the rest:
    expect(parsed.stack).toBe('next')
    expect(parsed.testing).toBe('vitest')
  })
})

describe('BUNDLED_PROTOCOLS', () => {
  it('lists all 14 v0.1.0 protocols', () => {
    expect(BUNDLED_PROTOCOLS).toHaveLength(14)
  })

  it('includes the new storybook protocol', () => {
    expect(BUNDLED_PROTOCOLS).toContain('storybook')
  })
})

describe('defineProtocolsConfig', () => {
  it('returns the parsed config', () => {
    const config = defineProtocolsConfig(defaultConfig())
    expect(config.stack).toBe('next')
  })
})

describe('terminology config', () => {
  it('defaults to "protocol"', () => {
    const parsed = ProtocolsConfigSchema.parse(defaultConfig())
    expect(parsed.terminology.singular).toBe('protocol')
    expect(parsed.terminology.plural).toBe('protocols')
    expect(parsed.terminology.directory).toBe('.protocols')
    expect(parsed.terminology.extension).toBe('.protocol.md')
  })

  it('accepts custom terminology (e.g. "playbook")', () => {
    const parsed = ProtocolsConfigSchema.parse({
      ...defaultConfig(),
      terminology: {
        singular: 'playbook',
        plural: 'playbooks',
        directory: '.playbooks',
        extension: '.playbook.md'
      }
    })
    expect(parsed.terminology.singular).toBe('playbook')
    expect(parsed.terminology.directory).toBe('.playbooks')
  })

  it('rejects an extension that does not start with a dot', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({
        ...defaultConfig(),
        terminology: { extension: 'protocol.md' }
      })
    ).toThrow()
  })

  it('rejects a directory with path separators', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({
        ...defaultConfig(),
        terminology: { directory: '.protocols/nested' }
      })
    ).toThrow()
  })
})
