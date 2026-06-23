import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scanRepo } from '../../src/scan/scan-repo.js'
import { renderGenerationBrief, renderUsingGuide } from '../../src/scan/vibe-coder.js'

const dirs: string[] = []

function fintech(): ReturnType<typeof scanRepo> {
  const dir = mkdtempSync(path.join(tmpdir(), 'rvr-vc-'))
  dirs.push(dir)
  mkdirSync(path.join(dir, 'app'), { recursive: true })
  writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'paywall',
      dependencies: { next: '15', react: '19', stripe: '16' },
      devDependencies: { vitest: '2', typescript: '5' }
    }),
    'utf8'
  )
  writeFileSync(path.join(dir, 'tsconfig.json'), '{}', 'utf8')
  return scanRepo(dir)
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

describe('renderGenerationBrief', () => {
  it('is addressed to the agent, carries scan facts, and lists every selected protocol', () => {
    const scan = fintech()
    const brief = renderGenerationBrief({ scan, config: scan.config, version: '0.1.0-test' })
    expect(brief).toContain('audience: ai-agent')
    expect(brief).toContain('cli-version: 0.1.0-test')
    expect(brief).toContain('Generation Brief')
    expect(brief).toContain('paywall')
    expect(brief).toContain(scan.config.stack)
    expect(brief).toContain('finance')
    // The approve/amend/reject loop must be spelled out.
    expect(brief.toLowerCase()).toContain('approve')
    expect(brief.toLowerCase()).toContain('reject')
    for (const p of scan.selectedProtocols) expect(brief).toContain(p)
    // It must tell the agent the human never runs commands.
    expect(brief.toLowerCase()).toContain('never')
  })
})

describe('renderUsingGuide', () => {
  it('is human-facing, names the agent roster, and leaves agent-fill markers', () => {
    const scan = fintech()
    const guide = renderUsingGuide({ scan, config: scan.config, version: '0.1.0-test' })
    expect(guide).toContain('How paywall works with reveren')
    for (const agent of ['coordinator', 'engineer', 'reviewer', 'qa-runner', 'cyber-auditor', 'doc-writer']) {
      expect(guide).toContain(agent)
    }
    expect(guide).toContain('agent-fill')
    expect(guide.toLowerCase()).toContain('never')
    // No raw config placeholders should survive into the human guide.
    expect(guide).not.toMatch(/\{\{[a-z]/i)
  })
})
