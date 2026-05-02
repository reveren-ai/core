import { Command } from 'commander'
import { noCodePreset } from '../config/defaults.js'
import { log } from '../util/log.js'

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Scaffold playbooks.config.ts and the .playbooks/ directory')
    .option('--preset <name>', 'Preset to apply (currently: "no-code")')
    .option('--cwd <path>', 'Target directory (default: process.cwd())')
    .option('--non-interactive', 'Disable prompts; emit JSON progress on stdout')
    .action((options: { preset?: string; cwd?: string; nonInteractive?: boolean }) => {
      if (options.preset === 'no-code') {
        const config = noCodePreset()
        const payload = {
          status: 'preview',
          message:
            'rvr init --preset=no-code: scaffold writer not yet implemented in v0.1.0-alpha. The locked Phase 3b config shape is below.',
          config
        }
        console.log(JSON.stringify(payload, null, 2))
        return
      }

      log.info('rvr init')
      log.hint(
        'Interactive scaffold not yet implemented in v0.1.0-alpha. Pass --preset=no-code to see the locked Phase 3b config shape.'
      )
      log.hint(
        'Real interactive flow ships in v0.1.0 final. Track: https://github.com/reveren-ai/core/issues'
      )
    })
}
