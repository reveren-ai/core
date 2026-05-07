import { Command } from 'commander'
import pc from 'picocolors'
import { BUNDLED_PROTOCOLS, DEFAULT_TERMINOLOGY } from '../config/schema.js'

export function registerList(program: Command): void {
  program
    .command('list')
    .description(`List bundled ${DEFAULT_TERMINOLOGY.plural} shipped with this CLI`)
    .action(() => {
      console.log(pc.bold(`Bundled ${DEFAULT_TERMINOLOGY.plural} (v0.1.0-alpha):`))
      console.log()
      for (const name of BUNDLED_PROTOCOLS) {
        console.log(`  ${pc.cyan(name)}`)
      }
      console.log()
      console.log(
        pc.dim(
          'Run `rvr sync` to fetch updates from the registry (Phase 2, mid-2026).'
        )
      )
      console.log(
        pc.dim(
          `Tip: terminology is configurable. Set \`terminology.singular\` in your config to use "playbook", "skill", or any term you prefer.`
        )
      )
    })
}
