import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    // Gercek veritabanina yaziyorlar; paralel calisirlarsa birbirlerinin
    // satirlarini siliyorlar.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
