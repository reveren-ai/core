import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerList } from '../../src/cli/list.js'
import { BUNDLED_PROTOCOLS, BUNDLED_AGENTS } from '../../src/config/schema.js'

describe('rvr list', () => {
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the list subcommand on a Commander instance', () => {
    const program = new Command()
    registerList(program)
    const list = program.commands.find((c) => c.name() === 'list')
    expect(list).toBeDefined()
    expect(list?.description()).toMatch(/protocols/i)
  })

  it('prints every bundled protocol when invoked', async () => {
    const program = new Command()
    program.exitOverride()
    registerList(program)
    await program.parseAsync(['node', 'rvr', 'list'])

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n')
    for (const name of BUNDLED_PROTOCOLS) {
      expect(printed).toContain(name)
    }
  })

  it('prints every bundled agent, including the coordinator orchestrator', async () => {
    const program = new Command()
    program.exitOverride()
    registerList(program)
    await program.parseAsync(['node', 'rvr', 'list'])

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n')
    for (const name of BUNDLED_AGENTS) {
      expect(printed).toContain(name)
    }
    expect(printed).toMatch(/agents/i)
    expect(printed).toMatch(/orchestrator/i)
  })

  it('mentions the registry sync hint and configurable terminology', async () => {
    const program = new Command()
    program.exitOverride()
    registerList(program)
    await program.parseAsync(['node', 'rvr', 'list'])
    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n')
    expect(printed).toMatch(/rvr sync/)
    expect(printed).toMatch(/terminology/)
  })
})
