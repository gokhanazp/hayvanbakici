import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/havre',
  },
  // Veri yerlesimi: birincil veri deposu Kanada bolgesinde olmali
  // (ca-central-1 / northamerica-northeast1) — Quebec Law 25 PIA yukunu azaltir.
} satisfies Config;
