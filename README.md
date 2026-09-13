# Havre — Kanada evcil hayvan bakımı pazaryeri

> **Marka adı geçici.** `Havre` yer tutucudur; karar verilince tek bir arama-değiştirme
> ile (`@havre/*` paket kapsamı ve `packages/i18n/src/messages/*`) değiştirilir.

Rover.com'a rakip, önce Kanada'da (Toronto → Montréal), iki dilli (en-CA / fr-CA)
iki taraflı pazaryeri. Web önce, mobil sonra; ikisi aynı çekirdeği paylaşır.

Tam analiz ve yol haritası: [`docs/00-PROJE-YOL-HARITASI.md`](docs/00-PROJE-YOL-HARITASI.md)

---

## Hızlı başlangıç

```bash
nvm use
npm install
cp .env.example .env
npm run setup      # Postgres+PostGIS ayağa kaldırır, migration ve tohum veriyi çalıştırır
npm run dev
```

`npm run setup` önce `db:preflight` çalıştırır: veritabanı ayakta mı bakar, değilse
Docker / Postgres.app / Homebrew seçeneklerini yazar. **PostGIS zorunlu** — düz
postgres imajıyla migration çöker.

Tek tek: `db:up` · `db:migrate` · `db:seed` · `db:smoke` (gerçek DB'ye karşı duman testi).

**Veritabanıyla ilgili bir şey ters giderse:** `npm run db:doctor` — sunucuya bağlanır,
kurulumun Homebrew mı Postgres.app mi Docker mı olduğunu tespit eder, PostGIS ve tablo
durumunu kontrol eder ve çalıştırılacak tek komutu yazar.

`npm run dev` turbo üzerinden çalışır: önce tokens/core/i18n derlenir, sonra
web açılır (http://localhost:3000).

**Uyarılar**

- `npm run dev -w @havre/web` **kullanmayın** — token derlemesini atlar, tasarım
  değişiklikleri sessizce görünmez. Kökten `npm run dev` çalıştırın.
- Takılırsa: `rm -rf apps/web/.next`
- `Cannot find module @rollup/rollup-*` hatası npm'in opsiyonel bağımlılık
  hatasıdır (art arda kurulumlarda çıkar): `rm -rf node_modules && npm install`

Sayfalar: `/en` · `/fr` · `/en/toronto/dog-boarding/` · `/fr/montreal/pension-pour-chien/`

Testler:
```bash
npm test           # core: 49 test · i18n: 8 test (Bill 96 katalog bütünlüğü dahil)
npm run db:smoke   # gerçek DB'ye karşı: şehirler, landing istatistikleri, PostGIS arama
```

---

## Yapı

```
apps/
  web/            Next.js 15 · App Router · [locale] routing · SEO altyapısı
  mobile/         (Faz 4) Expo / React Native
packages/
  core/           İş mantığı: komisyon motoru, fiyatlama, vergi, iptal, sıralama, arz eşiği
  db/             Drizzle şeması + migration'lar + sorgu katmanı (PostgreSQL + PostGIS)
  i18n/           en-CA / fr-CA katalogları, çevrilmiş slug'lar
  tokens/         Design token'ları → CSS değişkenleri (web) + TS (mobil)
  config/         Ortak tsconfig ön ayarları
docs/             Yol haritası ve araştırma ekleri
```

---

## Bu iskelette kodlanmış kritik kararlar

| Karar | Nerede | Neden |
|---|---|---|
| **Komisyon: %18 platform / %0 bakıcı-referansı / %10 tekrar** | `packages/core/src/commission.ts` | Rover yeni müşteri edinimini %30 ile cezalandırıyor; biz tersini yapıyoruz. Aynı anda bakıcı edinimi + platform dışına kaçış + soğuk başlangıç talebini çözer. |
| **Attribution kalıcıdır** | `resolveAttribution()` | Bakıcının getirdiği müşteri tekrarda da %0 kalır — Rover'ın "her yeni müşteride resetle" mantığının tersi. |
| **Arz eşiği kuralı** | `packages/core/src/seo.ts` + `[city]/[service]/page.tsx` | 0 bakıcı = sayfa yok (404), 1-2 = noindex. Google'ın doorway/thin content cezasına karşı tek gerçek savunma. |
| **`/search/` robots.txt'de engelli** | `apps/web/src/app/robots.ts` | Rover modeli. Faceted navigation, Google'a bildirilen tarama sorunlarının %50'sinin kaynağı. |
| **Çift yönlü hreflang + çevrilmiş slug'lar** | `lib/seo.ts`, `packages/i18n/src/slugs.ts` | Rover ve Pawshake bunu Kanada'da yapmıyor — en düşük asılı meyve. |
| **AggregateRating yalnızca bakıcı profilinde** | `lib/seo.ts` | Kendi markamızda kullanmak Google'ın self-serving ihlali. |
| **Fiyat dökümünde gizli kalem yok** | `packages/core/src/pricing.ts` | Competition Act drip pricing yasağı. |
| **Ödeme 48 saat tutulur, "escrow" denmez** | `packages/core/src/booking-state.ts` | Stripe CA azami 90 gün; "escrow" demek FINTRAC/MSB kapsamına sokabilir. |
| **FR gün 1'de, EN ile 1:1** | `packages/i18n` + CI testi | Bill 96 hukuki zorunluluk. Eksik FR anahtarı testi kırar. |
| **Koyu tema otomatik açılmaz** | `packages/tokens/src/build-css.ts` | Koyu tema henüz tasarlanmadı. `prefers-color-scheme` ile otomatik açılırsa işletim sistemi koyu modda olan herkes onaylanmamış bir arayüz görür. Yalnızca `[data-theme="dark"]` ile açılır; tasarlanıp onaylanınca blok geri eklenecek. |
| **Font dosyaları repoda** | `apps/web/src/app/fonts/` | `next/font/google` build sırasında Google'dan indirir (kısıtlı CI'da kırılır). `next/font/local` ise `node_modules`'a çözmüyor — `next build` geçse bile `next dev` kırılıyor. Dosyalar repoda: deterministik, hoisting'den bağımsız, dış ağa çıkmıyor. Kaynak/sürüm/lisans: `fonts/README.md`. Güncelleme: `npm run fonts:sync -w @havre/web`. |
| **Hero scrim'i kontrastı fotoğraftan bağımsız garanti eder** | `globals.css` `.hero::before` | Metin alanında opaklık ≥0.86 — hangi fotoğraf gelirse gelsin başlık kontrastı WCAG AA'yı geçer, fotoğraf değişince test tekrarlanmaz. |
| **PostGIS, harici arama servisi yok** | `packages/db/src/queries/search.ts` | Faz 1'de Algolia/Typesense gereksiz maliyet ve veri yerleşimi sorunu. `ST_DWithin` geography üzerinde metre çalışır ve GIST indeksini kullanır. Hacim gerektirdiğinde (Faz 2) yeniden değerlendirilir. |
| **Landing istatistikleri gerçek SQL'den** | `packages/db/src/queries/landing.ts` | Medyan/p25/p75 `percentile_cont` ile hesaplanır. Sayfanın benzersizliğini taşıyan veri bu; uydurulmuş sayı yok. |
| **Next, kök `.env`'i sarmalayıcıyla okur** | `apps/web/scripts/next.mjs` | Next yalnızca uygulama dizinindeki `.env`'i okur; `next.config.ts`'ten yüklemek yetmiyor çünkü sayfa verisi ayrı worker süreçlerinde toplanıyor ve Next'in kendi env yüklemesi eziyor. Env, Next başlamadan `--env-file-if-exists` ile yükleniyor. |
| **Turbo görevlerinde `env` bildirimi** | `turbo.json` | Turbo hermetiktir: bildirilmeyen ortam değişkeni göreve geçmez. `DATABASE_URL` bildirildiği için hem geçer hem cache anahtarına girer. |
| **Ham adli sicil raporu saklanmaz** | `packages/db/src/schema/services.ts` | PIPEDA/Law 25 hassas veri kuralı. |
| **SIN toplama + çeyreklik rapor** | `packages/db/src/schema/compliance.ts` | CRA Part XX — hizmet sağlayıcılarda ciro eşiği YOK. |
| **Otomatik karar envanteri** | `automatedDecisions` tablosu | Québec Law 25 s.12.1 — insan incelemesi kanalı zorunlu. |

---

## Sırada ne var

1. **Marka adı kararı** → tek arama-değiştirme
2. ~~PostgreSQL + PostGIS, gerçek sorgular~~ ✅ tamam
3. Auth + bakıcı onboarding + Certn entegrasyonu
4. Stripe Connect Express + `separate charges and transfers`
5. Arama (PostGIS), rezervasyon akışı, mesajlaşma
6. Faz 4: `apps/mobile` (Expo) — aynı `@havre/core` + `@havre/i18n` + `@havre/tokens` üzerine

---

## Uyarılar

- **Tohum verisi gerçek değildir.** `packages/db/src/seed.ts` üretilmiş bakıcı, fiyat ve
  yorum yaratır. Sayfalardaki rakamlar gerçek SQL'den gelir ama veri uydurmadır —
  hiçbir pazarlama malzemesinde kullanılmamalıdır.
- **Fransızca metinler taslaktır.** Lansmandan önce Québec yerlisi profesyonel bir
  editör tarafından revize edilmelidir (Bill 96 riski, ceza 3.000–30.000 CAD).
- **Koruma programı sigorta değildir.** `claims` tablosundaki nottaki uyarı geçerli:
  Kanadalı sigorta düzenleme avukatına doğrulatılmadan canlıya alınmamalıdır.
- Veritabanı Kanada bölgesinde olmalı (`ca-central-1` / `northamerica-northeast1`).
