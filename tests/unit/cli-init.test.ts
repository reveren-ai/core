import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerInit, runInit, renderConfigFile, detectPackageManager } from '../../src/cli/init.js'
import { noCodePreset } from '../../src/config/defaults.js'

// NOTE (2026-05-09): the original v0.1.0-alpha stub asserted "preview" JSON
// status and "Interactive scaffold not yet implemented" hint. The new
// contract emits line-delimited JSON progress under --non-interactive,
// scaffolds files, merges devDeps. Replaced cases below cover the new
// surface area.

describe('rvr init', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>
  const tempDirs: string[] = []

  beforeEach(() => {
    stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
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

  async function fixture(pkg?: object): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), 'rvr-init-'))
    tempDirs.push(dir)
    if (pkg) {
      await writeFile(
        path.join(dir, 'package.json'),
        JSON.stringify(pkg, null, 2),
        'utf8'
      )
    }
    return dir
  }

  function jsonLines(): Array<Record<string, unknown>> {
    const written = stdoutSpy.mock.calls.map((c) => String(c[0])).join('')
    return written
      .split('\n')
      .filter((l) => l.trim().startsWith('{'))
      .map((l) => JSON.parse(l) as Record<string, unknown>)
  }

  it('registers the init subcommand', () => {
    const program = new Command()
    registerInit(program)
    const init = program.commands.find((c) => c.name() === 'init')
    expect(init).toBeDefined()
    expect(init?.description()).toMatch(/scaffold/i)
  })

  it('--non-interactive writes config + protocols + deps and emits parseable JSON', async () => {
    const dir = await fixture({ name: 'fixture', version: '0.0.0' })

    await runInit({ cwd: dir, nonInteractive: true, force: false })

    // Config file written
    const cfgPath = path.join(dir, 'protocols.config.ts')
    expect(existsSync(cfgPath)).toBe(true)
    const cfgBody = await readFile(cfgPath, 'utf8')
    expect(cfgBody).toContain("@type {import('@reveren-ai/core').ProtocolsConfig}")
    expect(cfgBody).toContain('export default')
    expect(cfgBody).toContain('"stack": "next"')

    // .protocols/ directory populated with the bundled set
    const dirContents = await readdir(path.join(dir, '.protocols'))
    expect(dirContents.length).toBe(13)
    for (const entry of dirContents) {
      expect(entry.endsWith('.protocol.md')).toBe(true)
    }

    // package.json updated with vitest devDep + protocols script
    const pkg = JSON.parse(
      await readFile(path.join(dir, 'package.json'), 'utf8')
    ) as {
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
    expect(pkg.devDependencies).toBeDefined()
    expect(pkg.devDependencies!).toHaveProperty('vitest')
    expect(pkg.devDependencies!).toHaveProperty('@vitest/coverage-v8')
    expect(pkg.scripts!.protocols).toBe('rvr run')

    // JSON progress is line-delimited & parseable
    const events = jsonLines()
    const statuses = events.map((e) => e.status)
    expect(statuses).toContain('writing-config')
    expect(statuses).toContain('scaffolding-protocols')
    expect(statuses).toContain('merging-deps')
    expect(statuses).toContain('complete')
    const complete = events.find((e) => e.status === 'complete')
    expect(complete?.installCommand).toBe('pnpm install')
  })

  it('--preset=no-code matches noCodePreset() shape and writes config', async () => {
    const dir = await fixture({ name: 'fixture', version: '0.0.0' })

    await runInit({ cwd: dir, preset: 'no-code', nonInteractive: true, force: false })

    const cfgBody = await readFile(path.join(dir, 'protocols.config.ts'), 'utf8')
    const preset = noCodePreset()
    expect(cfgBody).toContain(`"stack": "${preset.stack}"`)
    expect(cfgBody).toContain(`"mode": "${preset.storybook.mode}"`)
    expect(cfgBody).toContain(`"packageManager": "${preset.packageManager}"`)
  })

  it('emits skipped-config when protocols.config.ts already exists and --force not set', async () => {
    const dir = await fixture({ name: 'fixture' })
    await writeFile(
      path.join(dir, 'protocols.config.ts'),
      '// existing\nexport default {}\n',
      'utf8'
    )

    await runInit({ cwd: dir, nonInteractive: true, force: false })

    const events = jsonLines()
    const skipped = events.find((e) => e.status === 'skipped-config')
    expect(skipped).toBeDefined()
    // Existing content preserved
    const body = await readFile(path.join(dir, 'protocols.config.ts'), 'utf8')
    expect(body).toContain('// existing')
  })

  it('--force overwrites existing config', async () => {
    const dir = await fixture({ name: 'fixture' })
    await writeFile(
      path.join(dir, 'protocols.config.ts'),
      '// existing\n',
      'utf8'
    )

    await runInit({ cwd: dir, nonInteractive: true, force: true })

    const body = await readFile(path.join(dir, 'protocols.config.ts'), 'utf8')
    expect(body).toContain("@type {import('@reveren-ai/core').ProtocolsConfig}")
    expect(body).toContain('export default')
    expect(body).not.toContain('// existing')
  })

  it('skips devDependency merge gracefully when package.json is missing', async () => {
    const dir = await fixture() // no package.json

    await runInit({ cwd: dir, nonInteractive: true, force: false })

    const events = jsonLines()
    const skipped = events.find((e) => e.status === 'skipped-deps')
    expect(skipped).toBeDefined()
    expect(process.exitCode).toBe(0)
  })

  it('errors with exit code 1 on unknown preset', async () => {
    const dir = await fixture({ name: 'fixture' })
    await runInit({
      cwd: dir,
      preset: 'totally-fake',
      nonInteractive: true,
      force: false
    })
    expect(process.exitCode).toBe(1)
    const printed = errorSpy.mock.calls
      .map((c) => c.map((arg) => String(arg)).join(' '))
      .join('\n')
    expect(printed).toMatch(/Unknown preset/)
    expect(warnSpy).toBeDefined()
    expect(logSpy).toBeDefined()
  })

  it('renderConfigFile produces a parseable TS body without a runtime import', () => {
    const body = renderConfigFile(noCodePreset())
    // No runtime import — keeps the config loadable before pnpm install runs.
    expect(body).not.toContain("import { defineProtocolsConfig }")
    expect(body).toContain("@type {import('@reveren-ai/core').ProtocolsConfig}")
    expect(body).toContain('export default')
    expect(body).toContain('"stack": "next"')
  })

  it('detectPackageManager picks pnpm when pnpm-lock.yaml is present', async () => {
    const dir = await fixture()
    await writeFile(path.join(dir, 'pnpm-lock.yaml'), '', 'utf8')
    expect(detectPackageManager(dir)).toBe('pnpm')
  })

  it('detectPackageManager picks bun when bun.lockb is present and others are not', async () => {
    const dir = await fixture()
    await writeFile(path.join(dir, 'bun.lockb'), '', 'utf8')
    expect(detectPackageManager(dir)).toBe('bun')
  })

  it('detectPackageManager defaults to pnpm with no lockfile', async () => {
    const dir = await fixture()
    expect(detectPackageManager(dir)).toBe('pnpm')
  })
})
