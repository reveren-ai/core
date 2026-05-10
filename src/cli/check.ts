import { Command } from 'commander'
import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pc from 'picocolors'
import {
  ProtocolsConfigSchema,
  type ProtocolsConfig
} from '../config/schema.js'
import { defaultConfig } from '../config/defaults.js'
import { log } from '../util/log.js'
import { requiredDeps, type RequiredDep } from '../util/required-deps.js'

interface CheckOptions {
  cwd?: string
  json?: boolean
  verbose?: boolean
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface CheckReport {
  ok: boolean
  missing: RequiredDep[]
  present: RequiredDep[]
  installCommand: string | null
}

export function registerCheck(program: Command): void {
  program
    .command('check')
    .description(
      'Audit package.json for devDependencies implied by protocols.config.ts'
    )
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .option(
      '--json',
      'Emit machine-readable JSON instead of human output (for web/agent harnesses)'
    )
    .option('--verbose', 'Also print packages that are already installed')
    .action(async (options: CheckOptions) => {
      const cwd = options.cwd
        ? path.resolve(options.cwd)
        : process.cwd()

      await runCheck({ cwd, json: !!options.json, verbose: !!options.verbose })
    })
}

interface ResolvedConfig {
  config: ProtocolsConfig
  /** Directory the config (or fallback) is anchored to. */
  rootDir: string
  /** Whether we used defaults because no config was found. */
  usedDefaults: boolean
}

async function loadConfig(cwd: string): Promise<ResolvedConfig> {
  const found = await findUp('protocols.config.ts', { cwd })
  if (!found) {
    return {
      config: defaultConfig(),
      rootDir: cwd,
      usedDefaults: true
    }
  }

  const jiti = createJiti(cwd, { interopDefault: true })
  try {
    const mod = (await jiti.import(found, { default: true })) as unknown
    const parsed = ProtocolsConfigSchema.parse(mod)
    return {
      config: parsed,
      rootDir: path.dirname(found),
      usedDefaults: false
    }
  } catch (err) {
    // Pre-install case: imports inside the config can fail before deps land.
    // Fall back to defaults so `rvr check` still gives a useful gap report.
    const message = err instanceof Error ? err.message : String(err)
    log.warn(`Could not load ${path.relative(cwd, found)}: ${message}`)
    log.hint('Falling back to defaults for this check.')
    return {
      config: defaultConfig(),
      rootDir: path.dirname(found),
      usedDefaults: true
    }
  }
}

async function readPackageJson(rootDir: string): Promise<PackageJson | null> {
  try {
    const raw = await readFile(path.join(rootDir, 'package.json'), 'utf8')
    return JSON.parse(raw) as PackageJson
  } catch {
    return null
  }
}

function buildInstallCommand(
  packageManager: ProtocolsConfig['packageManager'],
  pkgs: string[]
): string | null {
  if (pkgs.length === 0) return null
  const list = pkgs.join(' ')
  switch (packageManager) {
    case 'pnpm':
      return `pnpm add -D ${list}`
    case 'npm':
      return `npm install -D ${list}`
    case 'yarn':
      return `yarn add -D ${list}`
    case 'bun':
      return `bun add -d ${list}`
  }
}

function partition(
  required: RequiredDep[],
  installed: Set<string>
): { missing: RequiredDep[]; present: RequiredDep[] } {
  const missing: RequiredDep[] = []
  const present: RequiredDep[] = []
  for (const dep of required) {
    if (installed.has(dep.name)) present.push(dep)
    else missing.push(dep)
  }
  return { missing, present }
}

export async function runCheck(opts: {
  cwd: string
  json: boolean
  verbose: boolean
}): Promise<void> {
  const { cwd, json, verbose } = opts

  const { config, rootDir, usedDefaults } = await loadConfig(cwd)
  const pkg = await readPackageJson(rootDir)

  if (!pkg) {
    if (json) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            error: `No package.json found in ${rootDir}`,
            missing: [],
            present: [],
            installCommand: null
          },
          null,
          2
        )
      )
    } else {
      log.error(`No package.json found in ${rootDir}`)
      log.hint(
        'rvr check needs a package.json next to your protocols.config.ts (or in --cwd) to compare against.'
      )
    }
    process.exitCode = 1
    return
  }

  const installed = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {})
  ])

  const required = requiredDeps(config)
  const { missing, present } = partition(required, installed)
  const installCommand = buildInstallCommand(
    config.packageManager,
    missing.map((d) => d.name)
  )

  const report: CheckReport = {
    ok: missing.length === 0,
    missing,
    present,
    installCommand
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    process.exitCode = report.ok ? 0 : 1
    return
  }

  // human output
  if (usedDefaults) {
    log.info(
      'No protocols.config.ts found — checking against the default config.'
    )
  }

  if (verbose) {
    for (const dep of present) {
      console.log(`${pc.green('✓')} ${dep.name} ${pc.dim(`(${dep.reason})`)}`)
    }
  }

  for (const dep of missing) {
    console.log(`${pc.red('✗')} ${dep.name} ${pc.dim(`(${dep.reason})`)}`)
  }

  if (report.ok) {
    log.success(
      `All ${required.length} required devDependencies are installed.`
    )
    process.exitCode = 0
    return
  }

  console.log()
  log.warn(
    `${missing.length} ${
      missing.length === 1 ? 'package is' : 'packages are'
    } missing.`
  )
  console.log()
  console.log(pc.bold('Copy-paste to install:'))
  console.log()
  console.log(`  ${pc.cyan(installCommand!)}`)
  console.log()
  log.hint(
    'Paste this line back into your AI agent (Lovable, v0, Bolt, Cursor, Claude Code) and ask it to run the command.'
  )
  process.exitCode = 1
}
