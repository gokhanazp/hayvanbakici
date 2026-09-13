import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    // Kimlik testleri ayni e-posta adresine yaziyor; paralel calisirsa
    // yaris kosulu olusur.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
