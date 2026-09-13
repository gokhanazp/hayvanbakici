/**
 * Next CLI sarmalayicisi — monorepo kokundeki .env'i yuklemek icin.
 *
 * NEDEN GEREKLI: Next yalnizca UYGULAMA dizinindeki .env'i okur. Kokteki .env'i
 * next.config.ts icinden yuklemek YETMIYOR: Next sayfa verisini ayri worker
 * sureclerinde toplar ve kendi env yuklemesi config'in yazdigini eziyor.
 * Cozum: env'i Next baslamadan ONCE, node'un --env-file-if-exists bayragiyla
 * yuklemek. Bu sarmalayici tam olarak bunu mumkun kiliyor.
 *
 * Kullanim (package.json): node --env-file-if-exists=../../.env scripts/next.mjs dev
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bin = require.resolve('next/dist/bin/next');

// Next argv[1]'i kendi yolu sanar; duzeltmezsek komutu yanlis ayristirir.
process.argv[1] = bin;

await import(`file://${bin}`);
