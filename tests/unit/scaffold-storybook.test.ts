import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { scaffoldStorybook } from '../../src/scaffold/storybook.js'
import { defaultConfig, noCodePreset } from '../../src/config/defaults.js'
import { ProtocolsConfigSchema } from '../../src/config/schema.js'

describe('scaffoldStorybook', () => {
  const tempDirs: string[] = []

  beforeEach(async () => {
    // nothing
  })

  afterEach(async () => {
    while (tempDirs.length) {
      const dir = tempDirs.pop()!
      await rm(dir, { recursive: true, force: true })
    }
  })

  async function fixture(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), 'rvr-sb-'))
    tempDirs.push(dir)
    return dir
  }

  it('writes .storybook/main.ts and preview.ts under default (Next) config', async () => {
    const dir = await fixture()
    const result = await scaffoldStorybook(defaultConfig(), dir)

    const main = path.join(dir, '.storybook', 'main.ts')
    const preview = path.join(dir, '.storybook', 'preview.ts')
    expect(existsSync(main)).toBe(true)
    expect(existsSync(preview)).toBe(true)
    expect(result.written).toContain(main)
    expect(result.written).toContain(preview)

    const mainBody = await readFile(main, 'utf8')
    expect(mainBody).toContain("@storybook/nextjs")
    expect(mainBody).toContain("framework:")
    const previewBody = await readFile(preview, 'utf8')
    expect(previewBody).toContain("argTypesRegex: '^on[A-Z].*'")
  })

  it('writes the github-pages workflow when deployTarget=github-pages', async () => {
    const dir = await fixture()
    await scaffoldStorybook(defaultConfig(), dir)

    const wf = path.join(dir, '.github', 'workflows', 'storybook.yml')
    expect(existsSync(wf)).toBe(true)
    const body = await readFile(wf, 'utf8')
    expect(body).toContain('build-storybook')
    expect(body).toContain('actions/deploy-pages')
  })

  it('uses @storybook/react-vite for vite-react stack', async () => {
    const dir = await fixture()
    const config = ProtocolsConfigSchema.parse({
      stack: 'vite-react',
      agent: 'cursor',
      language: 'ts',
      packageManager: 'pnpm',
      testing: 'vitest',
      storybook: { mode: 'full', autoGenerateStories: true, deployTarget: 'none' }
    })
    await scaffoldStorybook(config, dir)
    const main = await readFile(path.join(dir, '.storybook', 'main.ts'), 'utf8')
    expect(main).toContain('@storybook/react-vite')
    // No github-pages workflow when deployTarget=none.
    expect(existsSync(path.join(dir, '.github', 'workflows', 'storybook.yml'))).toBe(false)
  })

  it('is a no-op when storybook.mode === "disabled"', async () => {
    const dir = await fixture()
    const config = ProtocolsConfigSchema.parse({
      stack: 'next',
      agent: 'claude',
      language: 'ts',
      packageManager: 'pnpm',
      testing: 'vitest',
      storybook: { mode: 'disabled', autoGenerateStories: false, deployTarget: 'none' }
    })
    const result = await scaffoldStorybook(config, dir)
    expect(result.written).toEqual([])
    expect(existsSync(path.join(dir, '.storybook'))).toBe(false)
  })

  it('does not overwrite existing files without force', async () => {
    const dir = await fixture()
    await mkdir(path.join(dir, '.storybook'), { recursive: true })
    const mainPath = path.join(dir, '.storybook', 'main.ts')
    await writeFile(mainPath, '// custom user content', 'utf8')

    const result = await scaffoldStorybook(defaultConfig(), dir)
    expect(result.skipped).toContain(mainPath)
    const body = await readFile(mainPath, 'utf8')
    expect(body).toBe('// custom user content')
  })

  it('overwrites existing files when force is true', async () => {
    const dir = await fixture()
    await mkdir(path.join(dir, '.storybook'), { recursive: true })
    const mainPath = path.join(dir, '.storybook', 'main.ts')
    await writeFile(mainPath, '// custom user content', 'utf8')

    const result = await scaffoldStorybook(defaultConfig(), dir, { force: true })
    expect(result.written).toContain(mainPath)
    const body = await readFile(mainPath, 'utf8')
    expect(body).toContain('@storybook/nextjs')
  })

  it('hosted-gallery mode (no-code preset) still scaffolds files', async () => {
    const dir = await fixture()
    const result = await scaffoldStorybook(noCodePreset(), dir)
    expect(result.written.length).toBeGreaterThan(0)
    expect(existsSync(path.join(dir, '.storybook', 'main.ts'))).toBe(true)
  })
})
