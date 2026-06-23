import { Command } from 'commander'
import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  ProtocolsConfigSchema,
  type ProtocolsConfig
} from '../config/schema.js'
import { defaultConfig } from '../config/defaults.js'
import { log } from '../util/log.js'
import { bundledProtocolsDir, bundledAgentsDir } from '../util/package-root.js'

interface RunOptions {
  cwd?: string
}

export function registerRun(program: Command): void {
  program
    .command('run <protocol>')
    .description('Print a protocol to stdout for the current agent to ingest')
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .action(async (protocol: string, options: RunOptions) => {
      const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()
      await runProtocol(protocol, cwd)
    })
}

interface ResolvedConfig {
  config: ProtocolsConfig
  /** Directory the config (or fallback) is anchored to. */
  rootDir: string
}

async function loadConfig(cwd: string): Promise<ResolvedConfig> {
  const found = await findUp('protocols.config.ts', { cwd })
  if (!found) {
    return { config: defaultConfig(), rootDir: cwd }
  }
  const jiti = createJiti(cwd, { interopDefault: true })
  try {
    const mod = (await jiti.import(found, { default: true })) as unknown
    const parsed = ProtocolsConfigSchema.parse(mod)
    return { config: parsed, rootDir: path.dirname(found) }
  } catch (err) {
    // Common case: `pnpm install` hasn't run yet so an import inside the
    // config file resolves to nothing. Fall back to defaults so the rest
    // of the CLI stays usable, but keep the rootDir anchored where the
    // config was found so the local .protocols/ lookup still works.
    const message = err instanceof Error ? err.message : String(err)
    log.warn(`Could not load ${path.relative(cwd, found)}: ${message}`)
    log.hint('Falling back to defaults. Run your package manager to install deps, then retry.')
    return { config: defaultConfig(), rootDir: path.dirname(found) }
  }
}

export async function runProtocol(name: string, cwd: string): Promise<void> {
  const { config, rootDir } = await loadConfig(cwd)
  const dir = config.terminology.directory
  const ext = config.terminology.extension

  const localPath = path.join(rootDir, dir, `${name}${ext}`)
  if (existsSync(localPath)) {
    const body = await readFile(localPath, 'utf8')
    process.stdout.write(body)
    if (!body.endsWith('\n')) process.stdout.write('\n')
    process.exitCode = 0
    return
  }

  // Fall back to the bundled snapshot. Bundled files always use `.protocol.md`.
  const bundledPath = path.join(bundledProtocolsDir(), `${name}.protocol.md`)
  if (existsSync(bundledPath)) {
    const body = await readFile(bundledPath, 'utf8')
    process.stdout.write(body)
    if (!body.endsWith('\n')) process.stdout.write('\n')
    process.exitCode = 0
    return
  }

  // Finally, fall back to a bundled agent (e.g. `coordinator`, the pipeline
  // orchestrator). Agents are multi-step operators rather than single
  // cognitive modes, but `run` ingests them the same way: print to stdout.
  const bundledAgentPath = path.join(bundledAgentsDir(), `${name}.agent.md`)
  if (existsSync(bundledAgentPath)) {
    const body = await readFile(bundledAgentPath, 'utf8')
    process.stdout.write(body)
    if (!body.endsWith('\n')) process.stdout.write('\n')
    process.exitCode = 0
    return
  }

  log.error(
    `"${name}" not found in ${dir}, the bundled protocol library, or the bundled agents. Run \`rvr list\` to see what's available.`
  )
  process.exitCode = 1
}
