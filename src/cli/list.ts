import { Command } from 'commander'
import pc from 'picocolors'
import { BUNDLED_PLAYBOOKS } from '../config/schema.js'

export function registerList(program: Command): void {
  program
    .command('list')
    .description('List bundled playbooks shipped with this CLI')
    .action(() => {
      console.log(pc.bold('Bundled playbooks (v0.1.0-alpha):'))
      console.log()
      for (const name of BUNDLED_PLAYBOOKS) {
        console.log(`  ${pc.cyan(name)}`)
      }
      console.log()
      console.log(
        pc.dim(
          'Run `rvr sync` to fetch updates from the registry (Phase 2, mid-2026).'
        )
      )
    })
}
