import { Command } from 'commander'
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  ProtocolsConfigSchema,
  BUNDLED_PROTOCOLS,
  type ProtocolsConfig,
  type Stack,
  type Agent
} from '../config/schema.js'
import { defaultConfig, noCodePreset } from '../config/defaults.js'
import { requiredDeps } from '../util/required-deps.js'
import { bundledProtocolsDir } from '../util/package-root.js'
import { scaffoldStorybook } from '../scaffold/storybook.js'
import { log } from '../util/log.js'
import { scanRepo, type ScanResult } from '../scan/scan-repo.js'
import {
  renderGenerationBrief,
  renderUsingGuide,
  ONBOARDING_FILENAME,
  GUIDE_FILENAME
} from '../scan/vibe-coder.js'
import { VERSION } from '../version.js'

interface InitOptions {
  cwd?: string
  preset?: string
  nonInteractive?: boolean
  force?: boolean
}

type Language = ProtocolsConfig['language']
type PackageManager = ProtocolsConfig['packageManager']
type Testing = ProtocolsConfig['testing']
type StorybookMode = ProtocolsConfig['storybook']['mode']

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Scaffold protocols.config.ts and the .protocols/ directory')
    .option('--preset <name>', 'Preset to apply ("no-code" or "vibe-coder")')
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .option(
      '--non-interactive',
      'Disable prompts; emit JSON progress on stdout'
    )
    .option(
      '--force',
      'Overwrite protocols.config.ts and host package.json deps without prompting'
    )
    .action(async (options: InitOptions) => {
      const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()
      await runInit({
        cwd,
        preset: options.preset,
        nonInteractive: !!options.nonInteractive,
        force: !!options.force
      })
    })
}

export interface RunInitArgs {
  cwd: string
  preset?: string
  nonInteractive: boolean
  force: boolean
}

export async function runInit(args: RunInitArgs): Promise<void> {
  const { cwd, preset, nonInteractive, force } = args

  // 1) Resolve config: --preset short-circuit, --non-interactive default, or interactive prompts.
  let config: ProtocolsConfig
  let vibeScan: ScanResult | undefined
  if (preset === 'no-code') {
    config = noCodePreset()
  } else if (preset === 'vibe-coder') {
    // Deterministic, local repo scan — no model, nothing leaves the machine.
    vibeScan = scanRepo(cwd)
    config = vibeScan.config
  } else if (preset !== undefined) {
    log.error(`Unknown preset "${preset}". Supported: "no-code", "vibe-coder".`)
    process.exitCode = 1
    return
  } else if (nonInteractive) {
    config = defaultConfig()
  } else {
    const result = await promptForConfig(cwd)
    if (!result) {
      // User cancelled.
      process.exitCode = 1
      return
    }
    config = result
  }

  // 2) Run side effects in order.
  await applySideEffects({ config, cwd, nonInteractive, force, vibeScan })
}

interface ApplyArgs {
  config: ProtocolsConfig
  cwd: string
  nonInteractive: boolean
  force: boolean
  /** Present only for `--preset vibe-coder`: triggers the brief + guide emit. */
  vibeScan?: ScanResult
}

async function applySideEffects(args: ApplyArgs): Promise<void> {
  const { config, cwd, nonInteractive, force, vibeScan } = args
  const emit = makeEmitter(nonInteractive)

  // Step 1 — write protocols.config.ts
  const configPath = path.join(cwd, 'protocols.config.ts')
  const configExists = existsSync(configPath)
  if (configExists && !force) {
    if (nonInteractive) {
      emit({
        status: 'skipped-config',
        path: 'protocols.config.ts',
        reason: 'already exists; pass --force to overwrite'
      })
    } else {
      const overwrite = await p.confirm({
        message: 'protocols.config.ts already exists — overwrite?',
        initialValue: false
      })
      if (p.isCancel(overwrite) || !overwrite) {
        emit({ status: 'skipped-config', path: 'protocols.config.ts' })
      } else {
        await writeFile(configPath, renderConfigFile(config), 'utf8')
        emit({ status: 'writing-config', path: 'protocols.config.ts' })
      }
    }
  } else {
    await writeFile(configPath, renderConfigFile(config), 'utf8')
    emit({ status: 'writing-config', path: 'protocols.config.ts' })
  }

  // Step 2 — copy bundled protocols into <terminology.directory>/
  const protoDir = path.join(cwd, config.terminology.directory)
  await mkdir(protoDir, { recursive: true })
  const copied = await copyBundledProtocols({
    targetDir: protoDir,
    config,
    force
  })
  emit({
    status: 'scaffolding-protocols',
    directory: config.terminology.directory,
    count: copied.length
  })

  // Step 2b — vibe-coder mode: emit the agent-addressed generation brief and the
  // human-facing usage guide. Both are rendered from the deterministic scan; no
  // model is called.
  if (vibeScan) {
    const brief = renderGenerationBrief({ scan: vibeScan, config, version: VERSION })
    const guide = renderUsingGuide({ scan: vibeScan, config, version: VERSION })
    const briefPath = path.join(protoDir, ONBOARDING_FILENAME)
    const guidePath = path.join(protoDir, GUIDE_FILENAME)
    if (!existsSync(briefPath) || force) await writeFile(briefPath, brief, 'utf8')
    if (!existsSync(guidePath) || force) await writeFile(guidePath, guide, 'utf8')
    emit({
      status: 'vibe-coder-brief',
      files: [ONBOARDING_FILENAME, GUIDE_FILENAME],
      selected: vibeScan.selectedProtocols,
      domain: vibeScan.signals.domain
    })
  }

  // Step 3 — merge devDependencies into host package.json
  const pkgPath = path.join(cwd, 'package.json')
  let added: string[] = []
  if (!existsSync(pkgPath)) {
    if (!nonInteractive) {
      log.warn(
        'No package.json found — skipping devDependency merge. Run `npm init` first, then `rvr check`.'
      )
    }
    emit({ status: 'skipped-deps', reason: 'no package.json' })
  } else {
    added = await mergeDevDependencies({ pkgPath, config, force })
    emit({ status: 'merging-deps', added })

    // Add the protocols script entry too.
    await addProtocolsScript({ pkgPath, scriptName: scriptKey(config) })
  }

  // Step 4 — Storybook scaffolding
  if (config.storybook.mode !== 'disabled') {
    const sb = await scaffoldStorybook(config, cwd, { force })
    emit({
      status: 'scaffolding-storybook',
      files: sb.written.map((f) => path.relative(cwd, f))
    })
  }

  // Step 5 — final summary / installCommand
  const installCommand = buildInstallCommand(config.packageManager)
  emit({ status: 'complete', installCommand })

  if (!nonInteractive) {
    p.outro(pc.green('reveren ready.'))
    if (vibeScan) {
      console.log(
        `  ${pc.bold('Agent:')} read ${pc.cyan(`${config.terminology.directory}/${ONBOARDING_FILENAME}`)} and follow it — author the bespoke ${config.terminology.plural}, run approve/amend/reject with the user in chat, then finalise ${pc.cyan(GUIDE_FILENAME)}. The user never needs to run a command.`
      )
      console.log(
        `  ${pc.bold('Next:')} run ${pc.cyan(installCommand)} to install ${added.length} new devDependencies.`
      )
    } else {
      console.log(
        `  ${pc.bold('Next:')} run ${pc.cyan(installCommand)} to install ${added.length} new devDependencies.`
      )
      console.log(
        `  Then try ${pc.cyan(`rvr run ${config.activeProtocols[0] ?? 'plan-product'}`)} to print a protocol.`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ProgressEvent =
  | { status: 'writing-config'; path: string }
  | { status: 'skipped-config'; path: string; reason?: string }
  | { status: 'scaffolding-protocols'; directory: string; count: number }
  | { status: 'merging-deps'; added: string[] }
  | { status: 'skipped-deps'; reason: string }
  | { status: 'scaffolding-storybook'; files: string[] }
  | {
      status: 'vibe-coder-brief'
      files: string[]
      selected: string[]
      domain: string
    }
  | { status: 'complete'; installCommand: string }

function makeEmitter(nonInteractive: boolean): (e: ProgressEvent) => void {
  if (nonInteractive) {
    return (e) => process.stdout.write(`${JSON.stringify(e)}\n`)
  }
  return (e) => {
    switch (e.status) {
      case 'writing-config':
        log.success(`wrote ${e.path}`)
        break
      case 'skipped-config':
        log.info(`skipped ${e.path}${e.reason ? ` (${e.reason})` : ''}`)
        break
      case 'scaffolding-protocols':
        log.success(`copied ${e.count} protocols to ${e.directory}/`)
        break
      case 'merging-deps':
        if (e.added.length === 0) {
          log.info('devDependencies already up to date')
        } else {
          log.success(`added ${e.added.length} devDependencies: ${e.added.join(', ')}`)
        }
        break
      case 'skipped-deps':
        log.warn(`skipped devDependency merge (${e.reason})`)
        break
      case 'scaffolding-storybook':
        log.success(`scaffolded Storybook (${e.files.length} files)`)
        break
      case 'vibe-coder-brief':
        log.success(
          `vibe-coder: scanned repo (domain: ${e.domain}), selected ${e.selected.length} protocols, wrote ${e.files.join(' + ')}`
        )
        break
      case 'complete':
        // Final outro is handled outside.
        break
    }
  }
}

async function promptForConfig(cwd: string): Promise<ProtocolsConfig | null> {
  p.intro(pc.bold('reveren init'))

  const stack = (await p.select<{ value: Stack; label: string }[], Stack>({
    message: 'Which stack are you on?',
    options: [
      { value: 'next', label: 'Next.js' },
      { value: 'vite-react', label: 'Vite + React' },
      { value: 'remix', label: 'Remix' },
      { value: 'sveltekit', label: 'SvelteKit' },
      { value: 'astro', label: 'Astro' },
      { value: 'generic', label: 'Generic / other' }
    ],
    initialValue: 'next'
  })) as Stack | symbol
  if (p.isCancel(stack)) {
    p.cancel('init cancelled')
    return null
  }

  const agent = (await p.select<{ value: Agent; label: string }[], Agent>({
    message: 'Which AI agent will you use?',
    options: [
      { value: 'claude', label: 'Claude (Code / Cline)' },
      { value: 'cursor', label: 'Cursor' },
      { value: 'copilot', label: 'GitHub Copilot' },
      { value: 'windsurf', label: 'Windsurf' },
      { value: 'multiple', label: 'Multiple / not sure yet' }
    ],
    initialValue: 'claude'
  })) as Agent | symbol
  if (p.isCancel(agent)) {
    p.cancel('init cancelled')
    return null
  }

  const language = (await p.select<{ value: Language; label: string }[], Language>({
    message: 'TypeScript or JavaScript?',
    options: [
      { value: 'ts', label: 'TypeScript' },
      { value: 'js', label: 'JavaScript' }
    ],
    initialValue: 'ts'
  })) as Language | symbol
  if (p.isCancel(language)) {
    p.cancel('init cancelled')
    return null
  }

  const packageManager = (await p.select<
    { value: PackageManager; label: string }[],
    PackageManager
  >({
    message: 'Package manager?',
    options: [
      { value: 'pnpm', label: 'pnpm' },
      { value: 'npm', label: 'npm' },
      { value: 'yarn', label: 'yarn' },
      { value: 'bun', label: 'bun' }
    ],
    initialValue: detectPackageManager(cwd)
  })) as PackageManager | symbol
  if (p.isCancel(packageManager)) {
    p.cancel('init cancelled')
    return null
  }

  const testing = (await p.select<{ value: Testing; label: string }[], Testing>({
    message: 'Test runner?',
    options: [
      { value: 'vitest', label: 'Vitest' },
      { value: 'jest', label: 'Jest' },
      { value: 'playwright', label: 'Playwright (E2E)' },
      { value: 'none', label: 'None' }
    ],
    initialValue: 'vitest'
  })) as Testing | symbol
  if (p.isCancel(testing)) {
    p.cancel('init cancelled')
    return null
  }

  const sbMode = (await p.select<
    { value: StorybookMode; label: string }[],
    StorybookMode
  >({
    message: 'Storybook?',
    options: [
      { value: 'full', label: 'Full (build + autodoc stories)' },
      { value: 'hosted-gallery', label: 'Hosted gallery only' },
      { value: 'disabled', label: 'Disabled' }
    ],
    initialValue: 'full'
  })) as StorybookMode | symbol
  if (p.isCancel(sbMode)) {
    p.cancel('init cancelled')
    return null
  }

  return ProtocolsConfigSchema.parse({
    stack,
    agent,
    language,
    packageManager,
    testing,
    storybook: {
      mode: sbMode,
      autoGenerateStories: sbMode !== 'disabled',
      deployTarget: sbMode === 'disabled' ? 'none' : 'github-pages'
    }
  })
}

export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(path.join(cwd, 'package-lock.json'))) return 'npm'
  if (existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(path.join(cwd, 'bun.lockb'))) return 'bun'
  return 'pnpm'
}

export function renderConfigFile(config: ProtocolsConfig): string {
  // Strip schema defaults and stable-emit only fields the user picked.
  const out: Record<string, unknown> = {
    stack: config.stack,
    agent: config.agent,
    language: config.language,
    packageManager: config.packageManager,
    testing: config.testing,
    storybook: {
      mode: config.storybook.mode,
      autoGenerateStories: config.storybook.autoGenerateStories,
      deployTarget: config.storybook.deployTarget
    }
  }
  // Persist a non-default protocol selection (e.g. the vibe-coder scan picked a
  // subset). The full default set is implied by the schema, so omit it then to
  // keep default/no-code output stable.
  const isFullSet =
    config.activeProtocols.length === BUNDLED_PROTOCOLS.length &&
    BUNDLED_PROTOCOLS.every((p) => config.activeProtocols.includes(p))
  if (!isFullSet) {
    out.activeProtocols = config.activeProtocols
  }
  // Persist an inferred compliance domain so cyber/review know the surface.
  if (
    config.compliance.domain !== 'generic' ||
    config.compliance.triggerPaths.length > 0
  ) {
    out.compliance = {
      domain: config.compliance.domain,
      triggerPaths: config.compliance.triggerPaths,
      jurisdictions: config.compliance.jurisdictions
    }
  }
  const body = JSON.stringify(out, null, 2)
  // No runtime import — keeps the config loadable before `pnpm install` runs.
  // The JSDoc annotation gives the user IDE-side type checking once they
  // install @reveren-ai/core; the runtime is plain JSON-shaped data.
  return `/** @type {import('@reveren-ai/core').ProtocolsConfig} */
export default ${body}
`
}

interface CopyArgs {
  targetDir: string
  config: ProtocolsConfig
  force: boolean
}

async function copyBundledProtocols(args: CopyArgs): Promise<string[]> {
  const { targetDir, config, force } = args
  const src = bundledProtocolsDir()
  const entries = await readdir(src)
  const copied: string[] = []
  for (const entry of entries) {
    let destName: string
    if (entry.endsWith('.protocol.md')) {
      const baseName = entry.slice(0, -'.protocol.md'.length)
      destName = `${baseName}${config.terminology.extension}`
    } else if (entry === 'README.md' || entry === 'LICENSE') {
      // Ship the bundled README + LICENSE verbatim so downstream projects
      // always have the reveren workflow doc + protocol license alongside
      // the format specs.
      destName = entry
    } else {
      continue
    }
    const destPath = path.join(targetDir, destName)
    if (existsSync(destPath) && !force) continue
    await copyFile(path.join(src, entry), destPath)
    copied.push(destName)
  }
  return copied
}

interface MergeDepsArgs {
  pkgPath: string
  config: ProtocolsConfig
  force: boolean
}

async function mergeDevDependencies(args: MergeDepsArgs): Promise<string[]> {
  const { pkgPath, config, force } = args
  const raw = await readFile(pkgPath, 'utf8')
  const pkg = JSON.parse(raw) as {
    devDependencies?: Record<string, string>
    dependencies?: Record<string, string>
  }
  const dev = { ...(pkg.devDependencies ?? {}) }
  const installed = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(dev)
  ])
  const required = requiredDeps(config)
  const added: string[] = []
  for (const dep of required) {
    if (installed.has(dep.name) && !force) continue
    if (dev[dep.name] && !force) continue
    dev[dep.name] = defaultRangeFor(dep.name)
    added.push(dep.name)
  }
  if (added.length === 0) return []
  pkg.devDependencies = sortKeys(dev)
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  return added
}

async function addProtocolsScript(args: {
  pkgPath: string
  scriptName: string
}): Promise<void> {
  const { pkgPath, scriptName } = args
  const raw = await readFile(pkgPath, 'utf8')
  const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }
  const scripts = { ...(pkg.scripts ?? {}) }
  if (scripts[scriptName]) return
  scripts[scriptName] = 'rvr run'
  pkg.scripts = scripts
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

function scriptKey(config: ProtocolsConfig): string {
  const singular = config.terminology.singular
  // Default config uses "protocol" — the host-facing script is plural-ish.
  if (singular === 'protocol') return 'protocols'
  return singular
}

/**
 * Conservative caret ranges. The user's package manager resolves the exact
 * version on install — we just declare the major and let lockfiles record
 * what landed.
 */
function defaultRangeFor(name: string): string {
  const ranges: Record<string, string> = {
    vitest: '^2.1.0',
    '@vitest/coverage-v8': '^2.1.0',
    jest: '^29.7.0',
    '@types/jest': '^29.5.0',
    '@playwright/test': '^1.47.0',
    storybook: '^8.3.0',
    '@storybook/react': '^8.3.0',
    '@storybook/nextjs': '^8.3.0',
    '@storybook/react-vite': '^8.3.0',
    chromatic: '^11.10.0'
  }
  return ranges[name] ?? '^1.0.0'
}

function sortKeys<T extends Record<string, string>>(obj: T): T {
  const sorted = {} as Record<string, string>
  for (const k of Object.keys(obj).sort()) sorted[k] = obj[k]!
  return sorted as T
}

function buildInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case 'pnpm':
      return 'pnpm install'
    case 'npm':
      return 'npm install'
    case 'yarn':
      return 'yarn install'
    case 'bun':
      return 'bun install'
  }
}
