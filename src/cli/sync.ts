import { Command } from 'commander'
import path from 'node:path'
import {
  POD_AGENTS,
  podChannel,
  type ProtocolsConfig,
  type PodName
} from '../config/schema.js'
import { loadConfig } from '../config/load.js'
import { log } from '../util/log.js'

interface SyncOptions {
  cwd?: string
}

export interface SyncPlan {
  /** Pods opted into `current` and backed by a registry token. */
  entitledPods: PodName[]
  /** Pods opted into `current` but missing a registry token (paywalled). */
  blockedPods: PodName[]
}

/**
 * Pure decision: split the pods requested on the maintained `current` channel
 * into entitled (token present) and blocked (no token). Baseline agents are
 * free and never appear here — the paywall is only on the `current` channel.
 */
export function planSync(config: ProtocolsConfig): SyncPlan {
  const current = (Object.keys(POD_AGENTS) as PodName[]).filter(
    (pod) => podChannel(config, pod) === 'current'
  )
  const hasToken = !!config.registry?.token
  return {
    entitledPods: hasToken ? current : [],
    blockedPods: hasToken ? [] : current
  }
}

export function registerSync(program: Command): void {
  program
    .command('sync')
    .description('Pull protocol + pod updates from the registry (Phase 2 — stub)')
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .action(async (options: SyncOptions) => {
      const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()
      const { config } = await loadConfig(cwd)
      const plan = planSync(config)

      if (plan.blockedPods.length > 0) {
        const label = plan.blockedPods.join(', ')
        const plural = plan.blockedPods.length > 1
        log.warn(
          `The ${label} pod${plural ? 's are' : ' is'} set to the maintained "current" channel, which requires a subscription.`
        )
        log.hint(
          'Add your registry token to protocols.config.ts (`registry.token`) to receive maintained pod updates. Baseline agents stay free and bundled.'
        )
        process.exitCode = 1
        return
      }

      log.info(
        'Registry sync ships in Phase 2 (mid-2026). Active protocols and baseline agents are bundled with the CLI;'
      )
      if (plan.entitledPods.length > 0) {
        log.hint(
          `Entitled for maintained pods: ${plan.entitledPods.join(', ')}. Pod fetch lands with the Phase 2 registry.`
        )
      } else {
        log.hint(
          'upgrade to a newer @reveren-ai/core to receive base library updates.'
        )
      }
    })
}
