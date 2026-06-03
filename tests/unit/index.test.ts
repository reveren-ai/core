import { describe, it, expect } from 'vitest'
import * as api from '../../src/index.js'

describe('@reveren-ai/core public API', () => {
  it('re-exports VERSION', () => {
    expect(api.VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('re-exports the schema, enums, and config helpers', () => {
    expect(api.ProtocolsConfigSchema).toBeDefined()
    expect(api.StackEnum).toBeDefined()
    expect(api.AgentEnum).toBeDefined()
    expect(api.StorybookModeEnum).toBeDefined()
    expect(api.DeployTargetEnum).toBeDefined()
    expect(api.TerminologySchema).toBeDefined()
    expect(api.DEFAULT_TERMINOLOGY).toBeDefined()
    expect(typeof api.defineProtocolsConfig).toBe('function')
  })

  it('re-exports the bundled protocol list and the default+no-code presets', () => {
    expect(Array.isArray(api.BUNDLED_PROTOCOLS)).toBe(true)
    expect(api.BUNDLED_PROTOCOLS.length).toBeGreaterThan(0)
    expect(typeof api.defaultConfig).toBe('function')
    expect(typeof api.noCodePreset).toBe('function')
    expect(api.defaultConfig().stack).toBe('next')
  })
})
