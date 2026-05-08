import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    target: 'node18',
    outDir: 'dist',
    clean: true,
    dts: false,
    splitting: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
    onSuccess: 'chmod +x dist/cli.js'
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'node18',
    outDir: 'dist',
    clean: false,
    dts: true,
    splitting: false,
    sourcemap: true
  }
])
