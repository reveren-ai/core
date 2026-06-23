import { describe, it, expect } from 'vitest'
import {
  ProtocolsConfigSchema,
  BUNDLED_PROTOCOLS,
  POD_AGENTS,
  AGENT_POD,
  podChannel,
  isCurrentChannelEntitled,
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

  it('omits selfImprove unless set, and defaults its schedule to daily', () => {
    expect(
      ProtocolsConfigSchema.parse(defaultConfig()).selfImprove
    ).toBeUndefined()
    const parsed = ProtocolsConfigSchema.parse({
      ...defaultConfig(),
      selfImprove: {}
    })
    expect(parsed.selfImprove).toEqual({ enabled: false, schedule: 'daily' })
  })

  it('rejects an unknown self-improve schedule', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({
        ...defaultConfig(),
        selfImprove: { schedule: 'hourly' }
      })
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
  it('lists the canonical 15 protocols', () => {
    expect(BUNDLED_PROTOCOLS).toHaveLength(15)
  })

  it('includes the copywriter protocol', () => {
    expect(BUNDLED_PROTOCOLS).toContain('copywriter')
  })

  it('includes the learn-from-users protocol', () => {
    expect(BUNDLED_PROTOCOLS).toContain('learn-from-users')
  })

  it('includes the pre-production protocol', () => {
    expect(BUNDLED_PROTOCOLS).toContain('pre-production')
  })

  it('includes the seo protocol', () => {
    expect(BUNDLED_PROTOCOLS).toContain('seo')
  })
})

describe('pods (channels)', () => {
  it('omits pods by default so default/no-code configs stay byte-stable', () => {
    expect(ProtocolsConfigSchema.parse(defaultConfig()).pods).toBeUndefined()
    expect(noCodePreset().pods).toBeUndefined()
  })

  it('accepts a pod opted into the current channel and defaults channel to baseline', () => {
    const parsed = ProtocolsConfigSchema.parse({
      ...defaultConfig(),
      pods: { engineering: { channel: 'current' }, foo: {} }
    })
    expect(parsed.pods?.engineering?.channel).toBe('current')
    expect(parsed.pods?.foo?.channel).toBe('baseline')
  })

  it('rejects an unknown channel', () => {
    expect(() =>
      ProtocolsConfigSchema.parse({
        ...defaultConfig(),
        pods: { engineering: { channel: 'beta' } }
      })
    ).toThrow()
  })

  it('podChannel defaults to baseline when unset', () => {
    expect(podChannel(defaultConfig(), 'engineering')).toBe('baseline')
  })

  it('entitlement requires both current channel and a registry token', () => {
    const base = defaultConfig()
    // current but no token -> not entitled (falls back to free baseline)
    expect(
      isCurrentChannelEntitled(
        ProtocolsConfigSchema.parse({
          ...base,
          pods: { engineering: { channel: 'current' } }
        }),
        'engineering'
      )
    ).toBe(false)
    // current + token -> entitled
    expect(
      isCurrentChannelEntitled(
        ProtocolsConfigSchema.parse({
          ...base,
          registry: { token: 'rvr_live_xxx' },
          pods: { engineering: { channel: 'current' } }
        }),
        'engineering'
      )
    ).toBe(true)
    // token but baseline channel -> not entitled (nothing to pull)
    expect(
      isCurrentChannelEntitled(
        ProtocolsConfigSchema.parse({
          ...base,
          registry: { token: 'rvr_live_xxx' }
        }),
        'engineering'
      )
    ).toBe(false)
  })
})

describe('POD_AGENTS', () => {
  it('defines the engineering pod over the build/review/qa/ship specialists', () => {
    expect(POD_AGENTS.engineering).toEqual([
      'coordinator',
      'engineer',
      'reviewer',
      'qa-runner',
      'doc-writer',
      'cyber-auditor'
    ])
  })

  it('maps each pod agent back to its pod, and leaves self-improve free-only', () => {
    expect(AGENT_POD.reviewer).toBe('engineering')
    expect(AGENT_POD.coordinator).toBe('engineering')
    expect(AGENT_POD['self-improve']).toBeUndefined()
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
