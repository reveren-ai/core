import { Command } from 'commander'
import { log } from '../util/log.js'

export function registerSync(program: Command): void {
  program
    .command('sync')
    .description('Pull protocol updates from the registry (Phase 2 — stub)')
    .action(() => {
      log.info(
        'Registry sync ships in Phase 2 (mid-2026). Active protocols are bundled with the CLI;'
      )
      log.hint(
        'upgrade to a newer @reveren-ai/core to receive base library updates.'
      )
    })
}
