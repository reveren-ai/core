import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerSync } from '../../src/cli/sync.js'

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
