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

| Dosya | Paket | Sürüm | Nerede |
|---|---|---|---|
| `fredoka-latin-wght-normal.woff2` | `@fontsource-variable/fredoka` | 5.3.0 | site — başlıklar |
| `schibsted-grotesk-latin-wght-normal.woff2` | `@fontsource-variable/schibsted-grotesk` | 5.3.0 | site — gövde metni |
| `inter-latin-wght-normal.woff2` | `@fontsource-variable/inter` | 5.3.0 | yalnızca `/admin` |

**Başlık yazı tipi neden Fredoka:** önceki başlık fontu (Bricolage Grotesque)
iyi bir fonttu ama SOĞUK okunuyordu — sıkı tracking ve keskin uçlar editoryal
bir dergi hissi veriyordu. Hayvan bakımı kategorisinde başlık "ciddi" değil
"gülümseyen" olmalı. **Ağırlık ekseni 300–700'dür, 800 YOKTUR**: 800 istenirse
tarayıcı sahte kalın çizer, o yüzden display/h1 700'e çekildi
(`packages/tokens/src/typography.ts`).

**Gövde metni değişmedi:** uzun metinde okunurluk süslü bir fonttan önemli.

**Inter yalnızca `/admin` altında:** marka yazı tipleri bir pazarlama sayfasında
karakter katıyor, ama günde saatlerce bakılacak bir tablo ekranında karakter
değil NÖTRLÜK isteniyor — rakamların aynı genişlikte hizalanması, küçük puntoda
kırılmaması. Panelde Fredoka bilinçli olarak kullanılmıyor.

Üçü de **SIL Open Font License 1.1** — lisans metinleri bu klasörde.

> `bricolage-grotesque-latin-wght-normal.woff2` ve lisansı artık
> **KULLANILMIYOR**; paketten de çıkarıldı. Dosyalar silinmeyi bekliyor:
> `git rm apps/web/src/app/fonts/bricolage-grotesque-*`

## Güncelleme

```bash
npm install -D -w @havre/web @fontsource-variable/fredoka@latest \
                             @fontsource-variable/schibsted-grotesk@latest \
                             @fontsource-variable/inter@latest
npm run fonts:sync -w @havre/web
```

## Alt küme

`latin` alt kümesi kullanılıyor — Fransızca aksanlar (é, à, ç, ô, î, û)
Latin-1 Supplement'te olduğu için kapsam içinde.
**Türkçe için (Faz 7)** `ğ ş İ ı` Latin Extended-A'da; o zaman `latin-ext`
dosyaları da eklenip `next/font/local` src dizisine ikinci giriş olarak verilecek.
