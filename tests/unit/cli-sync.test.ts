import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerSync, planSync } from '../../src/cli/sync.js'
import { ProtocolsConfigSchema } from '../../src/config/schema.js'
import { defaultConfig } from '../../src/config/defaults.js'

describe('rvr sync', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the sync subcommand', () => {
    const program = new Command()
    registerSync(program)
    const sync = program.commands.find((c) => c.name() === 'sync')
    expect(sync).toBeDefined()
    expect(sync?.description()).toMatch(/registry|sync|stub/i)
  })

  it('prints the Phase 2 stub message when invoked', async () => {
    const program = new Command()
    program.exitOverride()
    registerSync(program)
    await program.parseAsync(['node', 'rvr', 'sync'])

    const printed = logSpy.mock.calls.map((c) => String(c[1] ?? c[0])).join('\n')
    expect(printed).toMatch(/Phase 2/)
  })
})

describe('planSync', () => {
  it('returns no pods for a default config (everything baseline)', () => {
    expect(planSync(defaultConfig())).toEqual({
      entitledPods: [],
      blockedPods: []
    })
  })

  it('blocks a current-channel pod when no registry token is present', () => {
    const config = ProtocolsConfigSchema.parse({
      ...defaultConfig(),
      pods: { engineering: { channel: 'current' } }
    })
    expect(planSync(config)).toEqual({
      entitledPods: [],
      blockedPods: ['engineering']
    })
  })

  it('entitles a current-channel pod when a registry token is present', () => {
    const config = ProtocolsConfigSchema.parse({
      ...defaultConfig(),
      registry: { token: 'rvr_live_xxx' },
      pods: { engineering: { channel: 'current' } }
    })
    expect(planSync(config)).toEqual({
      entitledPods: ['engineering'],
      blockedPods: []
    })
  })
})
