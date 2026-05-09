import { describe, it, expect } from 'vitest'
import { requiredDeps } from '../../src/util/required-deps.js'
import {
  ProtocolsConfigSchema,
  type ProtocolsConfig
} from '../../src/config/schema.js'

function makeConfig(overrides: Partial<ProtocolsConfig> = {}): ProtocolsConfig {
  return ProtocolsConfigSchema.parse({
    stack: 'next',
    agent: 'claude',
    language: 'ts',
    packageManager: 'pnpm',
    testing: 'vitest',
    storybook: {
      mode: 'full',
      autoGenerateStories: true,
      deployTarget: 'github-pages'
    },
    ...overrides
  })
}

describe('requiredDeps()', () => {
  it('returns vitest + coverage when testing=vitest', () => {
    const deps = requiredDeps(
      makeConfig({ testing: 'vitest', storybook: { mode: 'disabled' } })
    )
    const names = deps.map((d) => d.name)
    expect(names).toContain('vitest')
    expect(names).toContain('@vitest/coverage-v8')
  })

  it('returns jest + @types/jest when testing=jest', () => {
    const deps = requiredDeps(
      makeConfig({ testing: 'jest', storybook: { mode: 'disabled' } })
    )
    const names = deps.map((d) => d.name)
    expect(names).toContain('jest')
    expect(names).toContain('@types/jest')
    expect(names).not.toContain('vitest')
  })

  it('returns @playwright/test when testing=playwright', () => {
    const deps = requiredDeps(
      makeConfig({ testing: 'playwright', storybook: { mode: 'disabled' } })
    )
    expect(deps.map((d) => d.name)).toEqual(['@playwright/test'])
  })

  it('returns storybook + @storybook/react + @storybook/nextjs for stack=next + mode=full', () => {
    const deps = requiredDeps(
      makeConfig({ stack: 'next', testing: 'none', storybook: { mode: 'full' } })
    )
    const names = deps.map((d) => d.name)
    expect(names).toContain('storybook')
    expect(names).toContain('@storybook/react')
    expect(names).toContain('@storybook/nextjs')
    expect(names).not.toContain('@storybook/react-vite')
  })

  it('returns @storybook/react-vite for stack=vite-react + mode=hosted-gallery', () => {
    const deps = requiredDeps(
      makeConfig({
        stack: 'vite-react',
        testing: 'none',
        storybook: { mode: 'hosted-gallery' }
      })
    )
    const names = deps.map((d) => d.name)
    expect(names).toContain('@storybook/react-vite')
    expect(names).not.toContain('@storybook/nextjs')
  })

  it('emits no storybook deps when storybook.mode=disabled', () => {
    const deps = requiredDeps(
      makeConfig({
        testing: 'none',
        storybook: { mode: 'disabled' }
      })
    )
    expect(deps).toEqual([])
  })

  it('adds chromatic when deployTarget=chromatic', () => {
    const deps = requiredDeps(
      makeConfig({
        testing: 'none',
        storybook: { mode: 'full', deployTarget: 'chromatic' }
      })
    )
    expect(deps.map((d) => d.name)).toContain('chromatic')
  })

  it('does NOT add chromatic when storybook is disabled, even if deployTarget=chromatic', () => {
    const deps = requiredDeps(
      makeConfig({
        testing: 'none',
        storybook: { mode: 'disabled', deployTarget: 'chromatic' }
      })
    )
    expect(deps.map((d) => d.name)).not.toContain('chromatic')
  })

  it('returns an empty list when testing=none and storybook=disabled', () => {
    const deps = requiredDeps(
      makeConfig({
        testing: 'none',
        storybook: { mode: 'disabled' }
      })
    )
    expect(deps).toEqual([])
  })

  it('marks every entry as a devDependency', () => {
    const deps = requiredDeps(makeConfig())
    expect(deps.every((d) => d.dev === true)).toBe(true)
  })

  it('produces stable, deduplicated output', () => {
    const deps = requiredDeps(makeConfig())
    const names = deps.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
