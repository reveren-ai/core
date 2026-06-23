import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scanRepo } from '../../src/scan/scan-repo.js'
import { BUNDLED_PROTOCOLS } from '../../src/config/schema.js'

const dirs: string[] = []

function fixture(files: Record<string, string>, makeDirs: string[] = []): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'rvr-scan-'))
  dirs.push(dir)
  for (const d of makeDirs) mkdirSync(path.join(dir, d), { recursive: true })
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel)
    mkdirSync(path.dirname(full), { recursive: true })
    writeFileSync(full, content, 'utf8')
  }
  return dir
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

describe('scanRepo', () => {
  it('no package.json → full protocol set with next/ts defaults', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rvr-scan-'))
    dirs.push(dir)
    const r = scanRepo(dir)
    expect(r.config.stack).toBe('next')
    expect(r.config.language).toBe('ts')
    expect(r.selectedProtocols.length).toBe(BUNDLED_PROTOCOLS.length)
    expect(r.skippedProtocols).toEqual([])
  })

  it('detects a Next.js + Stripe + Prisma TypeScript fintech repo', () => {
    const dir = fixture(
      {
        'package.json': JSON.stringify({
          name: 'shop',
          dependencies: {
            next: '15',
            react: '19',
            'react-dom': '19',
            stripe: '16',
            '@prisma/client': '5'
          },
          devDependencies: { vitest: '2', typescript: '5' }
        }),
        'tsconfig.json': '{}',
        '.cursorrules': '# house rules'
      },
      ['app']
    )
    const r = scanRepo(dir)
    expect(r.config.stack).toBe('next')
    expect(r.config.language).toBe('ts')
    expect(r.config.testing).toBe('vitest')
    expect(r.config.agent).toBe('cursor')
    expect(r.config.compliance.domain).toBe('finance')
    expect(r.selectedProtocols).toContain('cyber')
    expect(r.selectedProtocols).toContain('plan-ux')
    expect(r.selectedProtocols).toContain('seo')
    expect(r.selectedProtocols).toContain('pre-production')
    expect(r.signals.projectName).toBe('shop')
    expect(r.signals.hasPayments).toBe(true)
  })

  it('a generic library repo → baseline subset, no UI/SEO protocols', () => {
    const dir = fixture({
      'package.json': JSON.stringify({ name: 'util', dependencies: { lodash: '4' } })
    })
    const r = scanRepo(dir)
    expect(r.config.stack).toBe('generic')
    expect(r.config.language).toBe('js')
    expect(r.selectedProtocols).toContain('plan-product')
    expect(r.selectedProtocols).toContain('audit-protocols')
    expect(r.selectedProtocols).not.toContain('plan-ux')
    expect(r.selectedProtocols).not.toContain('seo')
    expect(r.selectedProtocols.length).toBeLessThan(BUNDLED_PROTOCOLS.length)
  })

  it('two agent-rule families resolve to "multiple"', () => {
    const dir = fixture({
      'package.json': JSON.stringify({ name: 'x', dependencies: { next: '15' } }),
      '.cursorrules': 'x',
      'CLAUDE.md': 'y'
    })
    expect(scanRepo(dir).config.agent).toBe('multiple')
  })

  it('infers ai-product domain from an LLM SDK dependency', () => {
    const dir = fixture({
      'package.json': JSON.stringify({
        name: 'bot',
        dependencies: { next: '15', '@anthropic-ai/sdk': '0.30' }
      })
    })
    const r = scanRepo(dir)
    expect(r.config.compliance.domain).toBe('ai-product')
    expect(r.selectedProtocols).toContain('learn-from-users')
  })
})
