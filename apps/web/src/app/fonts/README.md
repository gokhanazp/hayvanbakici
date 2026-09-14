# Fontlar

Bu dosyalar bilerek repoya gömüldü (vendor'landı).

**Neden node_modules'tan okunmuyor:** `next/font/local`, `src` yolunu uygulama
sınırının dışına çıkararak `node_modules`'a çözmüyor — `next build` geçse bile
`next dev` "Module not found" veriyor. Ayrıca göreli yol npm'in hoisting
kararına bağlı olurdu (kök `node_modules` vs `apps/web/node_modules`), yani
farklı makinelerde farklı davranırdı.

**Neden next/font/google değil:** o, fontları build sırasında Google'dan indirir;
ağı kısıtlı bir CI'da build kırılır. Ayrıca Google'a sınır ötesi istek gitmesi
Québec Law 25 açısından gereksiz bir PIA yükü yaratır.

## Kaynak ve sürüm

| Dosya | Paket | Sürüm |
|---|---|---|
| `bricolage-grotesque-latin-wght-normal.woff2` | `@fontsource-variable/bricolage-grotesque` | 5.3.0 |
| `schibsted-grotesk-latin-wght-normal.woff2` | `@fontsource-variable/schibsted-grotesk` | 5.3.0 |
| `inter-latin-wght-normal.woff2` | `@fontsource-variable/inter` | 5.3.0 |

Ilk ikisi SITENIN yazi tipleri. **Inter yalnizca `/admin` altinda** kullaniliyor:
marka yazi tipleri bir pazarlama sayfasinda karakter katiyor, ama gunde
saatlerce bakilacak bir tablo ekraninda karakter degil NOTRLUK isteniyor —
rakamlarin ayni genislikte hizalanmasi, kucuk puntoda kirilmamasi. Panelde
Bricolage hic kullanilmiyor.

İkisi de **SIL Open Font License 1.1** — lisans metinleri bu klasörde.

## Güncelleme

```bash
npm install -D -w @havre/web @fontsource-variable/bricolage-grotesque@latest \
                             @fontsource-variable/schibsted-grotesk@latest \
                             @fontsource-variable/inter@latest
npm run fonts:sync -w @havre/web
```

## Alt küme

`latin` alt kümesi kullanılıyor — Fransızca aksanlar (é, à, ç, ô, î, û)
Latin-1 Supplement'te olduğu için kapsam içinde.
**Türkçe için (Faz 7)** `ğ ş İ ı` Latin Extended-A'da; o zaman `latin-ext`
dosyaları da eklenip `next/font/local` src dizisine ikinci giriş olarak verilecek.
