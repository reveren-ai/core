import type { ProtocolsConfig } from '../config/schema.js'

export interface RequiredDep {
  /** npm package name */
  name: string
  /** Human-friendly justification, shown in dim text by `rvr check`. */
  reason: string
  /** All deps reported here are devDependencies. */
  dev: true
}

/**
 * Map a `ProtocolsConfig` to the npm packages it implies.
 *
 * Used by `rvr check` (the doctor command) and, in a later release, by
 * `rvr init` when it gains the ability to write a stubbed `package.json`.
 *
 * The mappings are intentionally conservative — only the well-known runtime
 * packages, never plugins or test-helper libraries that vary by project.
 *
 * Output order is stable: first occurrence wins. Duplicates by `name` are
 * removed so the install line we emit is paste-ready.
 */
export function requiredDeps(config: ProtocolsConfig): RequiredDep[] {
  const deps: RequiredDep[] = []

  // --- testing runner ---
  switch (config.testing) {
    case 'vitest':
      deps.push(
        {
          name: 'vitest',
          reason: 'vitest is configured as the test runner',
          dev: true
        },
        {
          name: '@vitest/coverage-v8',
          reason: 'coverage provider for vitest',
          dev: true
        }
      )
      break
    case 'jest':
      deps.push(
        {
          name: 'jest',
          reason: 'jest is configured as the test runner',
          dev: true
        },
        {
          name: '@types/jest',
          reason: 'TypeScript types for jest',
          dev: true
        }
      )
      break
    case 'playwright':
      deps.push({
        name: '@playwright/test',
        reason: 'playwright is configured as the test runner',
        dev: true
      })
      break
    case 'none':
      // no testing deps
      break
  }

  // --- storybook ---
  const sbMode = config.storybook.mode
  if (sbMode === 'full' || sbMode === 'hosted-gallery') {
    deps.push(
      {
        name: 'storybook',
        reason: `storybook mode is "${sbMode}"`,
        dev: true
      },
      {
        name: '@storybook/react',
        reason: 'storybook React renderer',
        dev: true
      }
    )

    if (config.stack === 'next') {
      deps.push({
        name: '@storybook/nextjs',
        reason: 'storybook framework for Next.js',
        dev: true
      })
    } else if (config.stack === 'vite-react') {
      deps.push({
        name: '@storybook/react-vite',
        reason: 'storybook framework for Vite + React',
        dev: true
      })
    }

    if (config.storybook.deployTarget === 'chromatic') {
      deps.push({
        name: 'chromatic',
        reason: 'storybook is configured to deploy to Chromatic',
        dev: true
      })
    }
  }

  // dedupe by name, first-seen wins for stable output
  const seen = new Set<string>()
  const out: RequiredDep[] = []
  for (const dep of deps) {
    if (seen.has(dep.name)) continue
    seen.add(dep.name)
    out.push(dep)
  }
  return out
}
