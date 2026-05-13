import { describe, it, expect } from 'vitest'
import { noCodePreset, defaultConfig } from '../../src/config/defaults.js'

describe('noCodePreset', () => {
  it('returns the locked Phase 3b contract shape', () => {
    const preset = noCodePreset()

    // These fields are the public contract that reveren.ai/start (Phase 3b)
    // calls into. Changing them is a breaking change. Bump major + add a Changeset.
    expect(preset.storybook.mode).toBe('hosted-gallery')
    expect(preset.storybook.autoGenerateStories).toBe(true)
    expect(preset.storybook.deployTarget).toBe('github-pages')

    expect(preset.stack).toBe('next')
    expect(preset.agent).toBe('claude')
    expect(preset.language).toBe('ts')
    expect(preset.packageManager).toBe('pnpm')
    expect(preset.testing).toBe('vitest')
  })

  it('has $schemaVersion: 1', () => {
    expect(noCodePreset().$schemaVersion).toBe(1)
  })

  it('snapshots the full preset shape', () => {
    expect(noCodePreset()).toMatchInlineSnapshot(`
      {
        "$schemaVersion": 1,
        "activeProtocols": [
          "plan-product",
          "plan-engineering",
          "plan-ux",
          "review",
          "qa",
          "ship",
          "document",
          "cyber",
          "pre-production",
          "improve",
          "audit-protocols",
          "capture-learnings",
          "learn-from-users",
        ],
        "agent": "claude",
        "compliance": {
          "domain": "generic",
          "jurisdictions": [],
          "triggerPaths": [],
        },
        "language": "ts",
        "packageManager": "pnpm",
        "stack": "next",
        "storybook": {
          "autoGenerateStories": true,
          "deployTarget": "github-pages",
          "mode": "hosted-gallery",
        },
        "terminology": {
          "directory": ".protocols",
          "extension": ".protocol.md",
          "plural": "protocols",
          "singular": "protocol",
        },
        "testing": "vitest",
      }
    `)
  })
})

describe('defaultConfig', () => {
  it('uses storybook mode "full" by default (engineering teams)', () => {
    const config = defaultConfig()
    expect(config.storybook.mode).toBe('full')
  })

  it('lists all 13 bundled protocols as active', () => {
    const config = defaultConfig()
    expect(config.activeProtocols).toHaveLength(13)
  })
})
