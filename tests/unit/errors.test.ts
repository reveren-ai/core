import { describe, it, expect } from 'vitest'
import {
  CliError,
  ConfigNotFoundError,
  ProtocolNotFoundError
} from '../../src/util/errors.js'

describe('CliError', () => {
  it('defaults to exit code 1', () => {
    const err = new CliError('boom')
    expect(err).toBeInstanceOf(Error)
    expect(err.exitCode).toBe(1)
    expect(err.name).toBe('CliError')
    expect(err.message).toBe('boom')
  })

  it('accepts an explicit exit code', () => {
    const err = new CliError('fatal', 2)
    expect(err.exitCode).toBe(2)
  })
})

describe('ConfigNotFoundError', () => {
  it('extends CliError and includes the cwd in the message', () => {
    const err = new ConfigNotFoundError('/tmp/project')
    expect(err).toBeInstanceOf(CliError)
    expect(err.name).toBe('ConfigNotFoundError')
    expect(err.message).toContain('/tmp/project')
    expect(err.message).toContain('rvr init')
    expect(err.exitCode).toBe(1)
  })
})

describe('ProtocolNotFoundError', () => {
  it('extends CliError and lists available protocols', () => {
    const err = new ProtocolNotFoundError('plan-product', ['ship', 'review', 'qa'])
    expect(err).toBeInstanceOf(CliError)
    expect(err.name).toBe('ProtocolNotFoundError')
    expect(err.message).toContain('plan-product')
    expect(err.message).toContain('ship, review, qa')
  })

  it('handles an empty available list gracefully', () => {
    const err = new ProtocolNotFoundError('x', [])
    expect(err.message).toContain('Protocol "x" not found')
  })
})
