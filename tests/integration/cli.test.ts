import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const cliPath = path.resolve(here, '..', '..', 'dist', 'cli.js')

interface RunResult {
  stdout: string
  stderr: string
  status: number | null
}

function runCli(args: string[], cwd: string): RunResult {
  const res: SpawnSyncReturns<string> = spawnSync(
    process.execPath,
    [cliPath, ...args],
    { cwd, encoding: 'utf8', timeout: 25_000 }
  )
  return {
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
    status: res.status
  }
}

function parseJsonLines(stdout: string): Array<{ status: string } & Record<string, unknown>> {
  return stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { status: string } & Record<string, unknown>)
}

describe('rvr CLI — integration (built dist/cli.js against tmp project)', () => {
  let dir: string

  beforeEach(() => {
    if (!existsSync(cliPath)) {
      throw new Error(
        `dist/cli.js not found at ${cliPath} — run \`pnpm build\` first (or use \`pnpm test:integration\` which builds via pretest:integration).`
      )
    }
    dir = mkdtempSync(path.join(tmpdir(), 'rvr-int-'))
    writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: 'rvr-integration-fixture', version: '0.0.0' }, null, 2),
      'utf8'
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('init --preset=no-code --non-interactive scaffolds the expected files and emits parseable JSON', () => {
    const res = runCli(['init', '--preset=no-code', '--non-interactive', '--cwd', dir], dir)
    expect(res.status).toBe(0)

    const events = parseJsonLines(res.stdout)
    const statuses = events.map((e) => e.status)
    expect(statuses).toContain('writing-config')
    expect(statuses).toContain('scaffolding-protocols')
    expect(statuses).toContain('merging-deps')
    expect(statuses).toContain('complete')

    expect(existsSync(path.join(dir, 'protocols.config.ts'))).toBe(true)
    const proto = readdirSync(path.join(dir, '.protocols'))
    // 15 bundled protocols + README.md + LICENSE
    expect(proto.length).toBe(17)
    const protocolEntries = proto.filter((f) => f.endsWith('.protocol.md'))
    expect(protocolEntries.length).toBe(15)
    expect(proto).toContain('README.md')
    expect(proto).toContain('LICENSE')

    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
    expect(pkg.devDependencies?.vitest).toBeDefined()
    expect(pkg.devDependencies?.['@vitest/coverage-v8']).toBeDefined()
    expect(pkg.scripts?.protocols).toBe('rvr run')
  })

  it('run <protocol> reads the local file and prints its body', () => {
    runCli(['init', '--preset=no-code', '--non-interactive', '--cwd', dir], dir)

    const res = runCli(['run', 'plan-product', '--cwd', dir], dir)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('# Protocol: Plan — Product Thinking')
    expect(res.stdout).toContain('Cognitive mode: Founder / Product lead')
  })

  it('run <unknown-protocol> exits 1 with a clear error', () => {
    runCli(['init', '--preset=no-code', '--non-interactive', '--cwd', dir], dir)

    const res = runCli(['run', 'totally-fake-protocol', '--cwd', dir], dir)
    expect(res.status).toBe(1)
    expect(res.stderr).toMatch(/not found/i)
  })

  it('check --json after init reports ok: true (deps were just merged)', () => {
    runCli(['init', '--preset=no-code', '--non-interactive', '--cwd', dir], dir)

    const res = runCli(['check', '--cwd', dir, '--json'], dir)
    expect(res.status).toBe(0)
    const report = JSON.parse(res.stdout) as {
      ok: boolean
      missing: unknown[]
      installCommand: string | null
    }
    expect(report.ok).toBe(true)
    expect(report.missing).toEqual([])
    expect(report.installCommand).toBeNull()
  })

  it('check --json on a project with no devDeps reports ok: false and an install command', () => {
    // No init — just the bare package.json fixture, missing every required dep.
    const res = runCli(['check', '--cwd', dir, '--json'], dir)
    expect(res.status).toBe(1)
    const report = JSON.parse(res.stdout) as {
      ok: boolean
      missing: Array<{ name: string }>
      installCommand: string | null
    }
    expect(report.ok).toBe(false)
    expect(report.missing.length).toBeGreaterThan(0)
    expect(report.installCommand).toMatch(/^pnpm add -D /)
  })

  it('list prints the bundled protocol set without needing init', () => {
    const res = runCli(['list'], dir)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('plan-product')
    expect(res.stdout).toContain('review')
    expect(res.stdout).toContain('ship')
    expect(res.stdout).toContain('coordinator')
  })

  it('run coordinator prints the bundled agent (path resolves in built dist)', () => {
    const res = runCli(['run', 'coordinator'], dir)
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('Dispatch Plan')
  })

  it('init --preset vibe-coder scans the repo and emits the brief + guide', () => {
    const res = runCli(
      ['init', '--preset=vibe-coder', '--non-interactive', '--cwd', dir],
      dir
    )
    expect(res.status).toBe(0)

    const statuses = parseJsonLines(res.stdout).map((e) => e.status)
    expect(statuses).toContain('vibe-coder-brief')

    const proto = readdirSync(path.join(dir, '.protocols'))
    expect(proto).toContain('VIBE-CODER-ONBOARDING.md')
    expect(proto).toContain('USING-REVEREN.md')

    // The generic fixture (no deps) selects a subset, so the config persists it.
    const cfg = readFileSync(path.join(dir, 'protocols.config.ts'), 'utf8')
    expect(cfg).toContain('activeProtocols')

    // The brief is addressed to the agent, not the human.
    const brief = readFileSync(
      path.join(dir, '.protocols', 'VIBE-CODER-ONBOARDING.md'),
      'utf8'
    )
    expect(brief).toContain('audience: ai-agent')
  })
})
