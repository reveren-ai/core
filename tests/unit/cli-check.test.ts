import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerCheck } from '../../src/cli/check.js'

async function makeFixture(
  pkgJson: object,
  configSource?: string
): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'rvr-check-'))
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify(pkgJson, null, 2),
    'utf8'
  )
  if (configSource) {
    await writeFile(path.join(dir, 'protocols.config.ts'), configSource, 'utf8')
  }
  return dir
}

describe('rvr check', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  const tempDirs: string[] = []

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    process.exitCode = 0
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    process.exitCode = 0
    while (tempDirs.length) {
      const dir = tempDirs.pop()!
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('registers the check subcommand with a sensible description', () => {
    const program = new Command()
    registerCheck(program)
    const check = program.commands.find((c) => c.name() === 'check')
    expect(check).toBeDefined()
    expect(check?.description()).toMatch(/devDependenc|package\.json|protocols\.config/i)
  })

  it('emits valid JSON with ok / missing / installCommand keys when --json is set', async () => {
    const dir = await makeFixture({
      name: 'fixture',
      devDependencies: {} // nothing installed
    })
    tempDirs.push(dir)

    const program = new Command()
    program.exitOverride()
    registerCheck(program)
    await program.parseAsync(['node', 'rvr', 'check', '--cwd', dir, '--json'])

    const calls = logSpy.mock.calls.map((c) => String(c[0]))
    const jsonCall = calls.find((line) => line.startsWith('{'))
    expect(jsonCall).toBeDefined()
    const payload = JSON.parse(jsonCall!) as {
      ok: boolean
      missing: { name: string }[]
      present: { name: string }[]
      installCommand: string | null
    }
    expect(payload).toHaveProperty('ok')
    expect(payload).toHaveProperty('missing')
    expect(payload).toHaveProperty('installCommand')
    expect(payload.ok).toBe(false)
    // default config = vitest + storybook full + next, so we expect at least vitest
    expect(payload.missing.map((m) => m.name)).toContain('vitest')
    expect(payload.installCommand).toMatch(/^pnpm add -D /)
    expect(process.exitCode).toBe(1)
  })

  it('prints a success line and exits 0 when all required deps are installed', async () => {
    // Stack the package.json with everything the default config requires.
    const dir = await makeFixture({
      name: 'fixture',
      devDependencies: {
        vitest: '^2.0.0',
        '@vitest/coverage-v8': '^2.0.0',
        storybook: '^8.0.0',
        '@storybook/react': '^8.0.0',
        '@storybook/nextjs': '^8.0.0'
      }
    })
    tempDirs.push(dir)

    const program = new Command()
    program.exitOverride()
    registerCheck(program)
    await program.parseAsync(['node', 'rvr', 'check', '--cwd', dir])

    const printed = logSpy.mock.calls
      .map((c) => c.map((arg) => String(arg)).join(' '))
      .join('\n')
    expect(printed).toMatch(/All \d+ required devDependencies are installed/)
    expect(process.exitCode).toBe(0)
  })

  it('prints an install command using the configured packageManager when deps are missing', async () => {
    const configSrc = `
import { defineProtocolsConfig } from '${path
      .resolve(
        __dirname,
        '../../src/index.ts'
      )
      .replace(/\\/g, '/')}'

export default defineProtocolsConfig({
  stack: 'next',
  agent: 'claude',
  language: 'ts',
  packageManager: 'bun',
  testing: 'vitest',
  storybook: { mode: 'disabled', autoGenerateStories: false, deployTarget: 'none' }
})
`
    const dir = await makeFixture(
      { name: 'fixture', devDependencies: {} },
      configSrc
    )
    tempDirs.push(dir)

    const program = new Command()
    program.exitOverride()
    registerCheck(program)
    await program.parseAsync(['node', 'rvr', 'check', '--cwd', dir])

    const printed = logSpy.mock.calls
      .map((c) => c.map((arg) => String(arg)).join(' '))
      .join('\n')
    // bun uses lowercase -d
    expect(printed).toMatch(/bun add -d .*vitest/)
    expect(process.exitCode).toBe(1)
  })

  it('errors with exit code 1 when no package.json is present', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'rvr-check-nopkg-'))
    tempDirs.push(dir)

    const program = new Command()
    program.exitOverride()
    registerCheck(program)
    await program.parseAsync(['node', 'rvr', 'check', '--cwd', dir])

    const printed = errorSpy.mock.calls
      .map((c) => c.map((arg) => String(arg)).join(' '))
      .join('\n')
    expect(printed).toMatch(/No package\.json found/)
    expect(process.exitCode).toBe(1)
    // silence unused-var lints
    expect(warnSpy).toBeDefined()
  })

  it('emits JSON error payload with ok=false when package.json is missing under --json', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'rvr-check-nopkg-json-'))
    tempDirs.push(dir)

    const program = new Command()
    program.exitOverride()
    registerCheck(program)
    await program.parseAsync(['node', 'rvr', 'check', '--cwd', dir, '--json'])

    const jsonCall = logSpy.mock.calls
      .map((c) => String(c[0]))
      .find((line) => line.startsWith('{'))
    expect(jsonCall).toBeDefined()
    const payload = JSON.parse(jsonCall!) as {
      ok: boolean
      error?: string
      installCommand: string | null
    }
    expect(payload.ok).toBe(false)
    expect(payload.error).toMatch(/No package\.json found/)
    expect(payload.installCommand).toBeNull()
    expect(process.exitCode).toBe(1)
  })
})
