import { defineConfig } from 'vitest/config'

// Integration tests spawn the BUILT CLI (`dist/cli.js`) against fixture
// projects in temporary directories. They are slow and they require a
// build first — `pretest:integration` runs `tsup` to ensure that.
//
// They live in `tests/integration/` and are excluded from the default
// `test:run` (unit) suite so the unit run stays fast.
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks'
  }
})
