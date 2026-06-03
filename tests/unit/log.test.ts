import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { log } from '../../src/util/log.js'

describe('log', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('info → console.log with the cyan ℹ glyph and the message', () => {
    log.info('hello')
    expect(infoSpy).toHaveBeenCalledOnce()
    const args = infoSpy.mock.calls[0]
    expect(args[1]).toBe('hello')
    expect(String(args[0])).toContain('ℹ')
  })

  it('success → console.log with the green ✓ glyph', () => {
    log.success('done')
    const args = infoSpy.mock.calls[0]
    expect(args[1]).toBe('done')
    expect(String(args[0])).toContain('✓')
  })

  it('warn → console.warn with the ⚠ glyph', () => {
    log.warn('careful')
    expect(warnSpy).toHaveBeenCalledOnce()
    const args = warnSpy.mock.calls[0]
    expect(args[1]).toBe('careful')
    expect(String(args[0])).toContain('⚠')
  })

  it('error → console.error with the ✗ glyph', () => {
    log.error('boom')
    expect(errorSpy).toHaveBeenCalledOnce()
    const args = errorSpy.mock.calls[0]
    expect(args[1]).toBe('boom')
    expect(String(args[0])).toContain('✗')
  })

  it('hint → console.log with an indented arrow prefix', () => {
    log.hint('next step')
    const arg = String(infoSpy.mock.calls[0][0])
    expect(arg).toContain('→')
    expect(arg).toContain('next step')
  })
})
