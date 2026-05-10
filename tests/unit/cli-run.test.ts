import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerRun } from '../../src/cli/run.js'

// NOTE (2026-05-09): the original v0.1.0-alpha stub asserted "not yet
// implemented". That contract is gone — `rvr run` now resolves either a
// local `.protocols/<name>${ext}` file, or the bundled snapshot at
// `<package-root>/protocols/<name>.protocol.md`, or exits 1 with a clear
// error. The replaced test cases below cover the new contract.

describe('rvr run <protocol>', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let originalExitCode: number | string | undefined
  const tempDirs: string[] = []

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    originalExitCode = process.exitCode
    process.exitCode = 0
  })

  afterEach(async () => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
    while (tempDirs.length) {
      const dir = tempDirs.pop()!
      await rm(dir, { recursive: true, force: true })
    }
  })

  async function fixture(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), 'rvr-run-'))
    tempDirs.push(dir)
    return dir
  }

  it('registers the run subcommand', () => {
    const program = new Command()
    registerRun(program)
    const run = program.commands.find((c) => c.name() === 'run')
    expect(run).toBeDefined()
    expect(run?.description()).toMatch(/protocol/i)
  })

  it('prints the local protocol body when one exists in .protocols/', async () => {
    const dir = await fixture()
    await mkdir(path.join(dir, '.protocols'), { recursive: true })
    const body = '# Protocol: Custom\n\nLocal override.\n'
    await writeFile(path.join(dir, '.protocols', 'plan-product.protocol.md'), body, 'utf8')

    const program = new Command()
    program.exitOverride()
    registerRun(program)
    await program.parseAsync(['node', 'rvr', 'run', 'plan-product', '--cwd', dir])

    const written = stdoutSpy.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('# Protocol: Custom')
    expect(written).toContain('Local override.')
    expect(process.exitCode).toBe(0)
  })

  it('falls back to the bundled snapshot when the local file is absent', async () => {
    const dir = await fixture()
    await writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'fixture' }),
      'utf8'
    )

    const program = new Command()
    program.exitOverride()
    registerRun(program)
    await program.parseAsync(['node', 'rvr', 'run', 'plan-engineering', '--cwd', dir])

    const written = stdoutSpy.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('# Protocol: Plan')
    expect(process.exitCode).toBe(0)
  })

  it('exits 1 with a clear error when the protocol is unknown', async () => {
    const dir = await fixture()

    const program = new Command()
    program.exitOverride()
    registerRun(program)
    await program.parseAsync(['node', 'rvr', 'run', 'totally-fake-name', '--cwd', dir])

    const printed = errorSpy.mock.calls
      .map((c) => c.map((arg) => String(arg)).join(' '))
      .join('\n')
    expect(printed).toMatch(/totally-fake-name/)
    expect(printed).toMatch(/not found/)
    expect(printed).toMatch(/rvr list/)
    expect(process.exitCode).toBe(1)

    // Silence unused-var lints.
    expect(logSpy).toBeDefined()
  })
})
