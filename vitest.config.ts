import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/cli/index.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80
      }
    }
  }
})
