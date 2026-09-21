/**
 * HATA IZLEME (Sentry) — DSN YOKSA TAMAMEN ETKISIZ.
 *
 * Bu dosya Next'in `instrumentation` kancasi: sunucu ayaga kalkarken bir
 * kez calisiyor. Dort kural:
 *
 * 1. `SENTRY_DSN` tanimli degilse HICBIR SEY yuklenmiyor — `import()`
 *    kosulun icinde, paket okunmuyor bile. Gelistirmede ve testte
 *    Sentry yokmus gibi calisiyoruz.
 * 2. SDK YALNIZCA SUNUCUDA. Kurulum ve yakalama `nodejs` calisma
 *    zamaninda; tarayiciya tek bayt gitmiyor, paylasilan JS 103 kB.
 * 3. Asil is AYRI BIR DOSYADA (`instrumentation.node.ts`). Bu dosya
 *    KENAR (edge) calisma zamani icin de derleniyor ve @sentry/node
 *    orada derlenemiyor; ayirmak tek calisan yol.
 * 4. Giden her olay `scrubEvent`'ten geciyor (lib/observability.ts).
 *
 * BILEREK EKSIK: TARAYICI TARAFI.
 * Sentry'nin istemci SDK'si paylasilan pakete ~30 kB ekliyor: her sayfa,
 * her ziyaretci icin yavaslar ve karsiliginda cogunlukla eklenti
 * kaynakli gurultu gelir. Sunucu hatalari — sunucu bilesenleri, sunucu
 * eylemleri, rota isleyicileri — yakalaniyor; tarayici hatalari
 * yakalanmiyor ve bu bilincli bir karar.
 */

export async function register(): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const mod = await import('./instrumentation.node');
  await mod.start();
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; routeType?: string },
): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const mod = await import('./instrumentation.node');
  await mod.report(error, request, context);
}
