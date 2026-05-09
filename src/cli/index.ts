import { Command } from 'commander'
import { VERSION } from '../version.js'
import { CliError } from '../util/errors.js'
import { log } from '../util/log.js'
import { registerCheck } from './check.js'
import { registerInit } from './init.js'
import { registerRun } from './run.js'
import { registerList } from './list.js'
import { registerSync } from './sync.js'

const program = new Command()

program
  .name('rvr')
  .description(
    'reveren — structured, versioned guardrails for AI coding agents.\nOne pipeline. Every agent.'
  )
  .version(VERSION, '-v, --version', 'Print the rvr version')

registerCheck(program)
registerInit(program)
registerList(program)
registerRun(program)
registerSync(program)

program.exitOverride((err) => {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0)
  }
  process.exit(err.exitCode ?? 1)
})

try {
  await program.parseAsync(process.argv)
} catch (err) {
  if (err instanceof CliError) {
    log.error(err.message)
    process.exit(err.exitCode)
  }
  throw err
}
