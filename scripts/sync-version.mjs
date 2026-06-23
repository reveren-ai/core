// Keeps src/version.ts in lockstep with package.json. Run as part of
// `version-packages` (after `changeset version` bumps package.json) so the
// VERSION constant the CLI reports never drifts from the published version.
// (src/version.ts can't import package.json directly — tsconfig rootDir is
// "src", so the manifest is out of scope for the build.)
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const target = path.join(root, 'src', 'version.ts')
writeFileSync(target, `export const VERSION = '${pkg.version}'\n`, 'utf8')
console.log(`synced src/version.ts → ${pkg.version}`)
