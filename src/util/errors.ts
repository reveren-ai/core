export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

export class ConfigNotFoundError extends CliError {
  constructor(cwd: string) {
    super(
      `No protocols.config.ts found in ${cwd} or any parent directory.\n` +
        `  → Run \`rvr init\` to create one, or \`cd\` into a project that has one.`
    )
    this.name = 'ConfigNotFoundError'
  }
}

export class ProtocolNotFoundError extends CliError {
  constructor(name: string, available: readonly string[]) {
    super(
      `Protocol "${name}" not found.\n` +
        `  → Available: ${available.join(', ')}`
    )
    this.name = 'ProtocolNotFoundError'
  }
}
