import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import path from 'node:path'
import { ProtocolsConfigSchema, type ProtocolsConfig } from './schema.js'
import { defaultConfig } from './defaults.js'
import { log } from '../util/log.js'

export interface ResolvedConfig {
  config: ProtocolsConfig
  /** Directory the config (or fallback) is anchored to. */
  rootDir: string
}

/**
 * Resolve the nearest `protocols.config.ts` from `cwd` upward. Falls back to
 * defaults — never throws — so the CLI stays usable before `pnpm install`
 * runs or when the config has an unresolved import. Shared by `run` and `sync`.
 */
export async function loadConfig(cwd: string): Promise<ResolvedConfig> {
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
    log.hint(
      'Falling back to defaults. Run your package manager to install deps, then retry.'
    )
    return { config: defaultConfig(), rootDir: path.dirname(found) }
  }
}
