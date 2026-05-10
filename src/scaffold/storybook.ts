import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProtocolsConfig } from '../config/schema.js'

export interface ScaffoldStorybookOptions {
  /** Overwrite existing files if true. Default false (idempotent). */
  force?: boolean
}

export interface ScaffoldStorybookResult {
  /** Absolute paths of files actually written. Skipped/no-op stays empty. */
  written: string[]
  /** Absolute paths skipped because they already existed. */
  skipped: string[]
}

const MAIN_NEXT = `import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [],
  framework: { name: '@storybook/nextjs', options: {} }
}

export default config
`

const MAIN_VITE = `import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [],
  framework: { name: '@storybook/react-vite', options: {} }
}

export default config
`

const PREVIEW_TS = `import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ }
    }
  }
}

export default preview
`

const GH_PAGES_WORKFLOW = `name: storybook

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: storybook
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build-storybook -o storybook-static
      - uses: actions/upload-pages-artifact@v3
        with:
          path: storybook-static

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
`

function mainContents(stack: ProtocolsConfig['stack']): string {
  if (stack === 'next') return MAIN_NEXT
  // vite-react and any non-Next stack get the Vite framework as a sane default.
  return MAIN_VITE
}

/**
 * Scaffold a minimal Storybook setup for the host project.
 *
 * - `.storybook/main.ts` — framework adapter chosen from `config.stack`.
 * - `.storybook/preview.ts` — minimal preview with action argType regex.
 * - `.github/workflows/storybook.yml` — only when `deployTarget === 'github-pages'`.
 *
 * No-op when `config.storybook.mode === 'disabled'`.
 *
 * Existing files are NOT overwritten unless `opts.force === true`.
 */
export async function scaffoldStorybook(
  config: ProtocolsConfig,
  cwd: string,
  opts: ScaffoldStorybookOptions = {}
): Promise<ScaffoldStorybookResult> {
  const written: string[] = []
  const skipped: string[] = []

  if (config.storybook.mode === 'disabled') {
    return { written, skipped }
  }

  const sbDir = path.join(cwd, '.storybook')
  await mkdir(sbDir, { recursive: true })

  const mainPath = path.join(sbDir, 'main.ts')
  const previewPath = path.join(sbDir, 'preview.ts')

  await writeIfMissing(mainPath, mainContents(config.stack), opts.force ?? false, written, skipped)
  await writeIfMissing(previewPath, PREVIEW_TS, opts.force ?? false, written, skipped)

  if (config.storybook.deployTarget === 'github-pages') {
    const wfDir = path.join(cwd, '.github', 'workflows')
    await mkdir(wfDir, { recursive: true })
    const wfPath = path.join(wfDir, 'storybook.yml')
    await writeIfMissing(wfPath, GH_PAGES_WORKFLOW, opts.force ?? false, written, skipped)
  }

  return { written, skipped }
}

async function writeIfMissing(
  filePath: string,
  body: string,
  force: boolean,
  written: string[],
  skipped: string[]
): Promise<void> {
  if (existsSync(filePath) && !force) {
    skipped.push(filePath)
    return
  }
  await writeFile(filePath, body, 'utf8')
  written.push(filePath)
}
