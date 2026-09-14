import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Web uygulamasinin birim testleri.
 *
 * NE TEST EDILIYOR: tarayici olmadan calisabilen, yanlis oldugunda
 * GUVENLIK sorunu olan parcalar — yuklenen dosyanin dogrulanmasi ve
 * depolama anahtarinin temizlenmesi. Sayfalarin kendisi tarayicida
 * deneniyor; burada onlarin taklidini kurmuyoruz.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20_000,
  },
  resolve: {
    alias: { '@': path.join(import.meta.dirname, 'src') },
  },
});
