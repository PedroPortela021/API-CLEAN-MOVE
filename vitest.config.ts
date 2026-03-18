import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'test/**/*.test.ts',
      'test/**/*.spec.ts',
    ],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
    clearMocks: true,
    restoreMocks: true,
  },
})
