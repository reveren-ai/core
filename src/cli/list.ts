import { Command } from 'commander'
import pc from 'picocolors'
import {
  BUNDLED_PROTOCOLS,
  BUNDLED_AGENTS,
  AGENT_POD,
  DEFAULT_TERMINOLOGY
} from '../config/schema.js'

export function registerList(program: Command): void {
  program
    .command('list')
    .description(`List bundled ${DEFAULT_TERMINOLOGY.plural} and agents shipped with this CLI`)
    .action(() => {
      console.log(pc.bold(`Bundled ${DEFAULT_TERMINOLOGY.plural} (v0.1.0-alpha):`))
      console.log()
      for (const name of BUNDLED_PROTOCOLS) {
        console.log(`  ${pc.cyan(name)}`)
      }
      console.log()
      console.log(pc.bold('Bundled agents (multi-step specialists):'))
      console.log()
      const AGENT_NOTES: Record<string, string> = {
        coordinator: 'pipeline orchestrator — dispatches the others',
        engineer: 'implements changes on a branch (plan-engineering)',
        reviewer: 'paranoid code review (review)',
        'qa-runner': 'end-to-end QA verification (qa)',
        'doc-writer': 'documentation as a deliverable (document)',
        'cyber-auditor': 'security auditing (cyber)',
        'self-improve': 'scheduled improvement loop — proposes protocol updates'
      }
      for (const name of BUNDLED_AGENTS) {
        const note = AGENT_NOTES[name] ? `  — ${AGENT_NOTES[name]}` : ''
        const pod = AGENT_POD[name]
        const tier = pod
          ? pc.dim(`  [${pod} pod · baseline free, current = subscription]`)
          : pc.dim('  [free]')
        console.log(`  ${pc.cyan(name)}${pc.dim(note)}${tier}`)
      }
      console.log(pc.dim('  Run one with `rvr run <name>` (e.g. `rvr run coordinator`).'))
      console.log()
      console.log(
        pc.dim(
          'Baseline agents are free and bundled. Maintained "current" pods need a'
        )
      )
      console.log(
        pc.dim(
          'subscription + registry token; pull them with `rvr sync` (Phase 2, mid-2026).'
        )
      )
      console.log(
        pc.dim(
          `Tip: terminology is configurable. Set \`terminology.singular\` in your config to use "playbook", "skill", or any term you prefer.`
        )
      )
    })
}
