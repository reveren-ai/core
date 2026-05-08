import { describe, it, expect } from 'vitest'
import { VERSION } from '../../src/version.js'
import pkg from '../../package.json' with { type: 'json' }

describe('VERSION', () => {
  it('matches package.json version', () => {
    expect(VERSION).toBe(pkg.version)
  })

  it('is a v0.1.x release', () => {
    expect(VERSION).toMatch(/^0\.1\./)
  })
})
