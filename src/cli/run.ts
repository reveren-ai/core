import { Command } from 'commander'
import { log } from '../util/log.js'

export function registerRun(program: Command): void {
  program
    .command('run <protocol>')
    .description('Print a protocol to stdout for the current agent to ingest')
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .action((_protocol: string) => {
      log.warn('rvr run: not yet implemented in v0.1.0-alpha.')
      log.hint(
        'Ships in v0.1.0 final. For now, copy the protocol content from protocols/<name>.protocol.md directly.'
      )
      process.exitCode = 1
    })
}
