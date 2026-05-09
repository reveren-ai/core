import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Resolve the @reveren-ai/core package root.
 *
 * Strategy: start from this module's URL and walk up until we find a
 * directory that contains a `package.json` AND a sibling `protocols/`
 * directory. That uniquely identifies the package root in both source
 * (running via vitest from `src/`) and built (`dist/`) contexts.
 *
 * Falls back to the directory containing this module's parent's parent
 * if the walk-up fails — same effective layout as `dist/cli.js` →
 * `<root>/dist/cli.js` → root.
 */
export function packageRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  let dir = here
  // Walk up at most 6 levels — the package root is always close.
  for (let i = 0; i < 6; i++) {
    if (
      existsSync(path.join(dir, 'package.json')) &&
      existsSync(path.join(dir, 'protocols'))
    ) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // Fallback: assume `<root>/dist/cli.js` layout.
  return path.resolve(here, '..')
}

/**
 * Absolute path to the bundled `protocols/` directory shipped inside this
 * package. Used by `rvr run` as the fallback source when the host project
 * doesn't have a local `.protocols/<name>` file.
 */
export function bundledProtocolsDir(): string {
  return path.join(packageRoot(), 'protocols')
}
