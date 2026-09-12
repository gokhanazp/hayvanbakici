# Kanada Evcil Hayvan Bakıcısı Marketplace'i — Kapsamlı SEO Stratejisi

*Araştırma tarihi: Eylül 2026. Fiyat/hacim verileri tahmindir, lansman öncesi Keyword Planner + Ahrefs ile Kanada geo'sunda doğrulanmalıdır.*

---

## 1. ROVER'IN SEO OYUN KİTABI (tersine mühendislik)

### 1.1 URL mimarisi — doğrulanmış kalıplar

Rover tek bir **düz (flat) dizin** kullanıyor; derin klasör hiyerarşisi yok. Ayırıcı olarak **çift tire (`--`)** ile tek bir path segmenti içinde birden fazla değişkeni paketliyor:

| Sayfa tipi | Kalıp | Doğrulanmış örnek |
|---|---|---|
| ABD şehir+hizmet | `/{city}--{state}--{service}/` | `rover.com/toronto--oh--dog-boarding/` |
| **Kanada EN şehir+hizmet** | `/ca/{city}--{prov}--{service}/` | `rover.com/ca/toronto--on--dog-boarding/` |
| **Kanada FR şehir+hizmet** | `/ca/fr/{city}--{prov}--{service-fr}/` | `rover.com/ca/fr/montreal--qc--garde-chien/` |
| **Mahalle+şehir+hizmet** | `/{hood}--{city}--{state}--{service}/` | `rover.com/downtown--seattle--wa--dog-walking/` |
| Hizmet hub (ülke) | `/ca/{service}/` | `rover.com/ca/dog-boarding/`, `/ca/dog-walking/`, `/ca/house-sitting/`, `/ca/pet-sitting/`, `/ca/doggy-day-care/` |
| Bakıcı profili | `/members/{açıklayıcı-slug}/` | `rover.com/members/rie-s-home-full-time-fenced-large-yard/` |
| Blog | `/ca/blog/{slug}/` | `rover.com/ca/blog/toronto-ca-dog-boarding-price/` |
| Fransa (ayrı pazar) | `/fr/{city}--{region}--{service}/` | `rover.com/fr/montreal--occitanie--promenade-chien/` |

**Çıkarılacak dersler:**

1. **Ülke = alt dizin, dil = ikinci alt dizin.** `/ca/` (Kanada İngilizce) ve `/ca/fr/` (Kanada Fransızca). Fransa ayrı: `/fr/`. Yani `fr-CA` ile `fr-FR` içerikleri **ayrı** tutulmuş — doğru karar.
2. **Tarama derinliği sığ.** Her şehir+hizmet sayfası ana sayfadan 2-3 tıklık. Klasör hiyerarşisi yerine `--` ile düzleştirme, crawl budget'ı koruyor.
3. **Bakıcı profil URL'leri ID değil, anahtar kelime içeren açıklayıcı slug.** `rie-s-home-full-time-fenced-large-yard` — "fenced large yard", "full time" gibi uzun kuyruk terimleri URL'de. Ayrıca profiller **ülke-nötr** (`/members/`, `/ca/members/` değil) — tek bir global profil havuzu.
4. **Fransızca hizmet slug'ları da çevrilmiş**: `garde-chien`, `promenade-chien`. Sadece içerik değil URL de yerelleştirilmiş.
5. **Not:** FR sayfasında H1 "Hébergement pour chien Montréal" iken slug `garde-chien` — tutarsızlık. Sizin için fırsat.

### 1.2 Sitemap yapısı

`rover.com/sitemap.xml` bir **sitemap index**'i ve **~218 alt sitemap** içeriyor:

| Kategori | Adet | İçerik |
|---|---|---|
| Landing page sitemap'leri | ~187 | Şehir/mahalle × hizmet kombinasyonları, ülke bazlı |
| Platform sitemap'leri | ~16 | Bakıcı profilleri (`/members/`) |
| Static sitemap'ler | ~17 | Bölge başına çekirdek sayfalar |
| WordPress static | 1 | Blog altyapısı |
| Blog sitemap index | 1 | Blog içerikleri |

17 ülke kapsanıyor: US, CA, UK, IE, DE, AT, CH, ES, FR, IT, NL, BE, NO, SE, DK, PL, FI.

**İndekslenen sayfa tahmini:** 187 landing sitemap × ortalama 10-40k URL ≈ **2-5 milyon landing sayfası** global; artı yüz binlerce bakıcı profili. Kanada payı kabaca **80.000–200.000 sayfa** aralığında (şehir/mahalle × 6 hizmet × 2 dil). *Bu bir tahmindir; kesin rakam için `site:rover.com/ca/` operatörü + Ahrefs Site Explorer ile doğrulayın.*

### 1.3 robots.txt — en kritik stratejik sinyal

Rover şunları engelliyor: `/api/`, `/search/`, availability endpoint'leri, AJAX çağrıları, OAuth, `/reviews/`, checkout, conversations, CDN, community moderation, `/refer-21352/`.

> **En önemli bulgu: `/search/` tamamen engellenmiş.** Rover'ın filtrelenebilir arama uygulaması (faceted search) taramaya kapalı. Tüm SEO değeri statik, küratörlü landing sayfalarında toplanıyor. Faceted navigation indeks şişmesi problemi **kaynağında** çözülmüş.

AI crawler'lar (GPTBot, ClaudeBot, PerplexityBot, CCBot) için **özel blok yok** — varsayılan `User-agent: *` kuralları geçerli. Yani AI motorları landing sayfalarını tarayabiliyor.

`rogerbot` (Moz) için 1sn, `facebookexternalhit` için 10sn crawl-delay tanımlı.

### 1.4 Sayfa anatomisi — `rover.com/ca/toronto--on--dog-boarding/`

Rover'ın thin content'ten kaçınma yöntemi: **her şehir için benzersiz, gerçek marketplace verisi.**

- **H1:** "Dog Boarding Toronto"
- **Giriş:** "Find a loving dog boarder to watch your dog overnight at your sitter's home."
- **Şehre özel canlı veri blokları** (asıl silah):
  - "46,431 pet owners in your area have booked on Rover"
  - "Over 10,935 pet parents in Toronto have booked dog boarding"
  - "Sitters in Toronto average 6 repeat dog boarding clients"
  - Ortalama fiyat: **$53.35/gece (Eylül 2026 itibarıyla)**, medyan **$50**
- **Breadcrumb:** Rover > Ontario > Toronto > Dog Boarding
- **FAQ (8 soru, şehir adı enjekte edilmiş):**
  - "How much does it cost for Dog Boarding in Toronto?"
  - "How many sitters are available in Toronto?"
  - "What should I bring when dropping off my dog for boarding in Toronto?"
  - "Do sitters in Toronto pass a background check?"
  - "What is Rover's cancellation and refund policy for Dog Boarding in Toronto?" vb.
- **Yakın şehir modülü:** `east-york--on--dog-boarding`, `mississauga--on--dog-boarding`, `vaughan--on--dog-boarding`
- **Çapraz hizmet modülü:** aynı şehrin diğer 5 hizmeti
- **Canonical:** self-canonical
- **Meta description:** şehir + gerçek rezervasyon sayısı enjekte edilmiş

**Tespit edilemedi:** Bu sayfalarda hreflang etiketi bulunamadı (FR Montreal sayfasında da yok). Doğrulanması gereken bir bulgu ama doğruysa **sizin için net bir rekabet avantajı** — Rover Kanada'da en-CA/fr-CA sinyallerini vermiyor.

### 1.5 Blog / içerik stratejisi

Yapı: `rover.com/ca/blog/{slug}/`, WordPress üzerinde, ülke bazlı ayrılmış.

Kategoriler: **Dog** ve **Cat** × (New Pet, Breeds, Behaviour, Health, Diet, Grooming, Travel) + **Seasonal**.

En değerli kısım — **kendi verisinden üretilen programatik blog içerikleri**:
- `/ca/blog/toronto-ca-dog-boarding-price/` — "How Much Does Dog Boarding Cost in Toronto?"
- `/ca/blog/toronto-ca-doggy-day-care-price/`
- `/ca/blog/toronto-popular-pet-breeds/` — "Discover The Most Popular Cat and Dog Breeds in Toronto"

Bu, ticari landing sayfasının yakalayamadığı **bilgi amaçlı (informational) niyeti** yakalıyor ve landing sayfasına iç link veriyor. Fiyat sayfaları ayrıca AI Overviews'ta çok alıntılanan formattır.

---

## 2. PROGRAMATİK SEO — 2026 kuralları

### 2.1 Google'ın kırmızı çizgileri (resmi spam politikaları)

**Scaled content abuse:** "Arama sıralamalarını manipüle etmek amacıyla üretilen, kullanıcıya yardımcı olmayan çok sayıda sayfa." Özellikle: "üretken yapay zekâ araçlarıyla kullanıcıya değer katmadan çok sayıda sayfa üretmek", "besleme/arama sonuçlarını kazıyarak sayfa üretmek", "ölçekli üretimi gizlemek için birden fazla site kurmak."

**Doorway pages:** "Belirli, benzer sorgular için sıralanmak üzere oluşturulan sayfalar", "kullanıcıları nihai hedeften daha az yararlı ara sayfalara yönlendirmek", **"coğrafi bölgeleri hedefleyen, kullanıcıyı başka yere huniyle aktaran birden fazla alan adı/sayfa"**, "net gezinilebilir hiyerarşi yerine arama sonuçlarına yakın konumlandırılmış büyük ölçüde benzer sayfalar."

> ⚠️ Şehir sayfaları doorway tanımına **tam olarak temas eder**. Sizi kurtaran tek şey: her sayfanın o şehir için **gerçek, benzersiz, kullanıcıya değerli arz ve veri** taşıması.

**Site reputation abuse:** Bu sizi doğrudan ilgilendirmiyor (üçüncü taraf içeriği kiralama sorunu), ama Google'ın **istisna listesi** kritik: "Kullanıcı tarafından oluşturulan içerik platformları (forumlar, yorumlar)" ihlal **değildir**. Yani bakıcı yorumları/profilleri güvenli bölgede.

### 2.2 İndekslenebilirlik için 3 kapı (her sayfa geçmeli)

Bir sayfayı ancak şu üç şartın **hepsi** sağlanıyorsa indeksleyin:

1. **Doğrulanabilir arama hacmi** — Ahrefs verisi: anahtar kelimelerin %99,84'ü ayda <1K arama alıyor ama toplam talebin %39,33'ünü sürüyor. Uzun kuyruk değerlidir, ama **sıfır hacim değersizdir**.
2. **Benzersiz içerik** — gerçekten farklı H1, metin ve şema; şablon tekrarı değil.
3. **Sağlıklı sonuç kümesi** — boşa yakın sayfa değil, gerçek envanter.

### 2.3 Arz eşiği kuralı (marketplace'e özel — en önemli tek kural)

```
bakıcı_sayısı >= 8  →  index, follow  (self-canonical)
bakıcı_sayısı 3–7   →  index, follow  ama "yakındaki şehirler" modülü genişletilir
bakıcı_sayısı 1–2   →  noindex, follow  + bekleme listesi formu
bakıcı_sayısı = 0   →  sayfa hiç üretilmez (404 veya üst şehre 301)
```

Bu kuralı **build time'da ISR ile dinamik** çalıştırın. Arz büyüdükçe sayfa otomatik indekse girer. Bu tek mekanizma, doorway/thin content cezasına karşı en güçlü savunmanız — çünkü "boş sayfa" hiç yayına çıkmaz.

Ayrıca: boş filtre sonuçları **404 dönmeli**, redirect değil (Google'ın açık tavsiyesi).

### 2.4 Kaç sayfayla başlanmalı, nasıl ölçeklenir

**Faz 0 — Lansman (0-3. ay): ~150-250 sayfa**

| Katman | Adet | Hesap |
|---|---|---|
| Hizmet hub (EN) | 6 | boarding, house-sitting, drop-in, daycare, walking, grooming |
| Hizmet hub (FR) | 6 | |
| Eyalet/il hub (EN+FR) | ~20 | 10 il × 2 dil |
| Tier-1 şehir × hizmet (EN) | 90 | 15 şehir × 6 hizmet |
| Tier-1 şehir × hizmet (FR) | 36 | 6 QC şehri × 6 hizmet |
| Blog/kaynak | 25-40 | fiyat rehberleri, şehir rehberleri |

Tier-1 şehirler: Toronto, Vancouver, Montréal, Calgary, Edmonton, Ottawa, Mississauga, Winnipeg, Québec City, Hamilton, Brampton, Surrey, Halifax, London (ON), Victoria.

**Faz 1 (4-8. ay): 250 → ~1.200 sayfa.** Tier-2 şehirler (50-60 şehir) + Toronto/Vancouver/Montréal mahalleleri (şehir başına ilk 15-25 mahalle, sadece 8+ bakıcı olanlar).

**Faz 2 (9-18. ay): 1.200 → 8.000-15.000 sayfa.** Tier-3 şehirler, tam mahalle kapsamı, kanıtlanmış talebi olan nitelikli sayfalar ("dog boarding toronto with large yard").

**Faz 3 (18+ ay): 15.000+.** Bakıcı profillerinin indekslenmesi ölçeği asıl büyütür.

**Altın kural:** Her fazda bir öncekinin indekslenme oranını ölçün. Search Console'da **"Discovered – currently not indexed"** oranı %20'yi aşıyorsa ölçeklemeyi durdurun — Google sayfalarınızı değersiz buluyor demektir.

### 2.5 Şablon farklılaştırma — somut teknik

Şehir sayfasının **en az %40'ı** şehre özgü olmalı. Kaynaklar:

- **Canlı marketplace verisi:** aktif bakıcı sayısı, medyan gecelik fiyat, fiyat aralığı (p25–p75), ortalama yanıt süresi, toplam rezervasyon, tekrar müşteri oranı, ortalama puan + yorum sayısı
- **Yerel gerçek dünya verisi:** şehirdeki köpek parkı sayısı, belediye köpek ruhsat sayısı (Toronto/Montréal open data), en popüler ırklar, apartman/kondo pet politikaları, o şehirdeki tipik konut tipi (Toronto'da kondo → "kondo dostu bakıcılar" açısı)
- **Mevsimsellik:** "Toronto'da Aralık ayında boarding talebi %X artıyor — erken rezervasyon yapın"
- **Gerçek yorum alıntıları:** o şehirdeki bakıcılardan seçilmiş 3-5 yorum (tam metin, kısaltılmamış)
- **Şehre özel FAQ:** fiyat sorusu gerçek medyanla cevaplanır; "Toronto'da hangi mahallelerde en çok bakıcı var?" gibi lokal sorular

**Yapmayın:** Aynı 400 kelimelik paragrafın içine şehir adını değiştirerek yerleştirmek. LLM ile 500 şehir için "benzersiz" paragraf üretmek (scaled content abuse). Şehir adını 12 kez tekrarlamak.

---

## 3. KANADA ÖZELİNDE

### 3.1 Domain kararı: .ca vs .com

| Senaryo | Öneri |
|---|---|
| Sadece Kanada, orta vadede de Kanada | **`.ca` ana domain.** CIRA verisine göre Kanadalı kullanıcılarda güven sinyali yüksek; ccTLD otomatik geo-hedefleme sağlar (Search Console'da ayar gerekmez). |
| 3-5 yıl içinde ABD/global genişleme planı | **`.com` ana domain + `/ca/` alt dizini.** ccTLD'yi sonradan bırakmak pahalı bir migration'dır. |

**Pratik öneri:** Her ikisini de satın alın. `.ca`'yı ana domain yapın (Kanada-first marka konumlandırması + Quebec/Bill 96 uyumu için doğal), `.com`'u 301 ile yönlendirin. Global genişleme gerçekleşirse `.com`'a migration yapıp `.ca`'yı `/ca/` dizinine 301'leyin.

> Not: ccTLD kullanıyorsanız Search Console'da uluslararası hedefleme ayarı **yapılamaz ve gerekmez** — `.ca` zaten Kanada sinyalidir.

### 3.2 Dil/URL stratejisi — alt dizin (kesin öneri)

**Seçilen yapı:**

```
example.ca/en/toronto/dog-boarding/
example.ca/fr/toronto/garde-de-chien/
example.ca/fr/montreal/pension-pour-chien/
```

**Neden alt dizin, alt alan adı değil:**
- Domain otoritesi tek noktada toplanır (en-CA'da kazanılan linkler fr-CA'ya da yarar)
- Tek altyapı, tek sertifika, tek Search Console property
- Next.js i18n routing ile yerleşik destek

**Rakip kanıtı:** Pawshake **alt alan adı** kullanıyor (`en.pawshake.ca/home-dog-boarding/toronto-on`, `fr.pawshake.ca/hebergement-pour-chiens/montreal-qc`) ve **hreflang etiketi tespit edilemedi** — iki dil versiyonu birbirinden kopuk. Bu, düşük asılı meyve.

**Kritik detay — slug'ları da çevirin.** Rover bunu yapıyor (`garde-chien`), Pawshake de (`hebergement-pour-chiens`). Fransızca URL'de İngilizce slug bırakmayın.

### 3.3 hreflang kurulumu (kopyala-yapıştır)

Her sayfanın `<head>`'ine, **çift yönlü ve kendine referanslı** olarak:

```html
<!-- example.ca/en/toronto/dog-boarding/ sayfasında -->
<link rel="alternate" hreflang="en-CA" href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="alternate" hreflang="fr-CA" href="https://example.ca/fr/toronto/garde-de-chien/" />
<link rel="alternate" hreflang="x-default" href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="canonical" href="https://example.ca/en/toronto/dog-boarding/" />
```

```html
<!-- example.ca/fr/toronto/garde-de-chien/ sayfasında — AYNI set, ters yönde -->
<link rel="alternate" hreflang="en-CA" href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="alternate" hreflang="fr-CA" href="https://example.ca/fr/toronto/garde-de-chien/" />
<link rel="alternate" hreflang="x-default" href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="canonical" href="https://example.ca/fr/toronto/garde-de-chien/" />
```

**Kurallar:**
- `en` / `fr` değil, **`en-CA` / `fr-CA`** kullanın — hedefleme hassasiyeti için
- Her versiyon **kendisi dahil** tüm versiyonları referans vermeli (reciprocal)
- `x-default` → İngilizce versiyon (veya dil seçim sayfası)
- Protokol/trailing slash tutarlılığı şart (HTTP/HTTPS karışımı hreflang'i bozar)
- Next.js'te `generateMetadata` içindeki `alternates.languages` ile üretin

**IP tabanlı otomatik yönlendirme yapmayın.** Googlebot çoğunlukla ABD IP'sinden gelir; fr-CA sayfalarınız hiç taranmaz. Bunun yerine: kullanıcının `Accept-Language` başlığına göre **banner ile öneri** sunun, yönlendirmeyin.

### 3.4 ⚖️ Bill 96 — hukuki zorunluluk (çoğu ekibin kaçırdığı nokta)

Quebec'in Fransız Dili Şartı'nın 52. maddesi, "kullanılan ortamdan bağımsız olarak ticari yayınları" kapsar — **web siteleri dahil**.

- Fransızca versiyon, diğer dillerden **"en az onlar kadar elverişli koşullarda"** sunulmalı: aynı derinlikte (özet değil), aynı kolaylıkta bulunabilir, aynı kalitede ve güncellikte
- Şirket büyüklüğünden bağımsız geçerli (25 çalışan eşiği sadece zorunlu "francisation" kaydını etkiler)
- **Cezalar:** ilk ihlal 3.000–30.000 CAD; ikinci ihlalde ikiye, sonrasında üçe katlanır
- Makine çevirisi yeterli değil — özellikle hukuki/ticari kritik içerikte insan revizyonu gerekir

**SEO için sonuç:** fr-CA sadece "nice to have" değil, **hukuki gereklilik**. Bu, Fransızca tarafına kaynak ayırmanın iş gerekçesini otomatik olarak yaratır. Fransızca içerik İngilizce'nin altkümesi olamaz — 1:1 eşleşme kurgulayın.

> **Ayrıca:** Quebec Fransızcası ≠ Fransa Fransızcası. Rover'ın `/fr/montreal--occitanie--promenade-chien/` sayfası Fransa'daki Montréal'ı hedefliyor — Quebec kullanıcısı için tamamen alakasız. Fransa Fransızcası çeviri ajansı kullanmayın; Quebec yerlisi editör kullanın.

### 3.5 Google Business Profile ve yerel paket (local pack)

**Net cevap: Marketplace'iniz GBP'ye uygun DEĞİL.** Google, işletmenin "yüz yüze müşteri hizmeti" vermesini ve "gerçek bir sokak adresi" bulunmasını şart koşar. Tamamen çevrimiçi platformlar ve pazaryerleri bu kriterleri karşılamaz. Sahte GBP oluşturmak askıya alma riski taşır.

**Tek meşru GBP:** merkez ofisiniz için, kategori "Software Company" / "Corporate Office" — marka SERP'i içindir, "dog boarding toronto" için sıralanmaz.

**Local pack stratejisi (gerçekçi plan):**

1. **Local pack'in altını hedefleyin.** "dog boarding toronto" SERP'inde local pack (fiziksel kennel'lar) üstte; hemen altındaki organik sonuçlar marketplace'lerindir. Rover, Pawshake, PetBacker hepsi orada. **Hedef #1 organik sonuç.**

2. **"Best/top X in Y" niyetini yakalayın.** Local pack'in kapsamadığı, listeleme niyetli sorgular (`best dog boarding toronto`, `dog boarding near me alternatives`) marketplace formatına doğal olarak uyar.

3. **Bakıcıları kendi GBP'lerine yönlendirin — dikkatli.** Kendi evinde hizmet veren bakıcılar teknik olarak GBP açabilir (service-area business). Bunu **bakıcı başarı programı** olarak sunun (marka bilinirliği + talep artışı), SEO taktiği olarak değil. Riskli taraf: bakıcılar bağımsızlaşıp platformu atlayabilir. Öneri: sadece top-tier bakıcılara, profil linki şartıyla.

4. **Yerel varlık sinyalleri:** Kanada dizinlerinde tutarlı NAP (Yellow Pages CA, Canada411, BBB Canada, Yelp CA), yerel basın, belediye/dernek ortaklıkları.

### 3.6 Anahtar kelime hedefleri — İngilizce (Kanada)

⚠️ **Aşağıdaki hacimler tahmindir.** Kamuya açık kaynaklarda Kanada-özel hacim verisi bulunamadı; rakamlar ABD/global verinin Kanada nüfus ve arama davranışına oranlanmasıyla türetilmiştir. Lansman öncesi Google Keyword Planner (geo: Canada) + Ahrefs ile doğrulayın.

| Anahtar kelime | Tahmini aylık (CA) | Zorluk | Niyet |
|---|---|---|---|
| `dog daycare toronto` | 2.900 – 6.600 | Yüksek | Ticari |
| `dog boarding toronto` | 1.900 – 3.600 | Yüksek | Ticari |
| `dog walker toronto` | 1.300 – 2.400 | Orta-Yüksek | Ticari |
| `dog sitting toronto` | 600 – 1.300 | Orta | Ticari |
| `pet sitting toronto` | 700 – 1.300 | Orta | Ticari |
| `dog boarding vancouver` | 900 – 1.900 | Orta-Yüksek | Ticari |
| `dog walker vancouver` | 800 – 1.600 | Orta | Ticari |
| `pet sitter vancouver` | 400 – 900 | Orta | Ticari |
| `dog boarding calgary` | 800 – 1.600 | Orta | Ticari |
| `dog daycare calgary` | 1.300 – 2.400 | Orta | Ticari |
| `dog boarding ottawa` | 400 – 900 | Düşük-Orta | Ticari |
| `dog walker montreal` | 300 – 700 | Düşük-Orta | Ticari |
| `dog boarding near me` | 12.000 – 22.000 | Çok yüksek | Yerel (local pack ağırlıklı) |
| `how much does dog boarding cost` | 800 – 1.600 | Düşük | Bilgi (AI Overviews'ta güçlü) |
| `dog boarding vs kennel` | 200 – 500 | Düşük | Bilgi |
| `cat sitting toronto` | 300 – 700 | Düşük | Ticari |
| `overnight pet sitting toronto` | 100 – 300 | Düşük | Uzun kuyruk |

**Not:** Kanada'da **"dog daycare"** genellikle "dog boarding"den **daha yüksek hacimli** — Rover bile daycare hub'ını öne çıkarıyor. Ürün önceliklendirmesinde bunu dikkate alın.

### 3.7 Anahtar kelime hedefleri — Fransızca (Quebec)

⚠️ Aynı doğrulama uyarısı geçerli.

| Anahtar kelime | Tahmini aylık (QC) | Not |
|---|---|---|
| `pension pour chien montreal` | 500 – 1.300 | En yüksek hacimli FR terim. Dikkat: "pension" geleneksel **kennel** çağrışımı taşır — ama arama hacmi burada. |
| `garderie pour chien montreal` | 500 – 1.200 | Daycare. Quebec'te çok yaygın. |
| `promeneur de chien montreal` | 200 – 500 | Dog walker. |
| `gardien d'animaux` / `gardienne d'animaux` | 300 – 800 | Genel pet sitter. Quebec'te dişil form da yaygın — ikisini de kapsayın. |
| `gardiennage d'animaux montreal` | 150 – 400 | Daha resmi/hizmet odaklı. |
| `hébergement pour chien` | 200 – 500 | Rover'ın H1'de kullandığı terim; "pension"dan daha yumuşak/modern. |
| `garde de chien montreal` | 200 – 500 | |
| `gardien de chat montreal` | 100 – 250 | Kedi. |
| `promenade de chien quebec` | 100 – 250 | |
| `toilettage chien montreal` | 800 – 1.900 | Grooming — ayrı hizmet, yüksek hacim. |
| `combien coûte une pension pour chien` | 100 – 300 | Bilgi, AI Overviews. |

**Terminoloji stratejisi (kritik):** Quebec'te hem `pension pour chien` (yüksek hacim, eski çağrışım) hem `hébergement pour chien` (marka için tercih edilir) kullanılıyor. Çözüm: **URL slug'ı `pension-pour-chien`** (hacim), **H1'de "Hébergement pour chien à Montréal"**, gövde metninde "aussi appelé pension pour chien" ile her iki terimi de kapsayın. Ayrıca Quebec'te İngilizce terimler (`pet sitter`, `dog walker`) de aranıyor — FR sayfada bunlara da bir cümlelik referans verin.

---

## 4. TEKNİK SEO

### 4.1 Next.js App Router — render stratejisi

| Sayfa tipi | Strateji | `revalidate` | Gerekçe |
|---|---|---|---|
| Ana sayfa, hizmet hub | SSG + ISR | 86400 (24s) | Nadiren değişir |
| Tier-1 şehir × hizmet | **SSG (build) + ISR** | 3600 (1s) | Fiyat/bakıcı sayısı taze olmalı |
| Tier-2/3 şehir | **ISR on-demand** (`dynamicParams: true`) | 21600 (6s) | Build süresini şişirmez |
| Mahalle sayfaları | ISR on-demand | 43200 (12s) | Uzun kuyruk, düşük değişim |
| Bakıcı profili | ISR on-demand | 3600 | Takvim/fiyat değişir |
| Arama/filtre sonuçları | **CSR + `noindex`** | — | SEO için üretilmiyor |
| Blog | SSG | 86400 | |

```ts
// app/[locale]/[city]/[service]/page.tsx

export const revalidate = 3600;
export const dynamicParams = true; // Tier-2/3 için on-demand ISR

export async function generateStaticParams() {
  // SADECE Tier-1: build süresi kontrol altında kalsın
  const cities = await getTier1Cities(); // ~15 şehir
  const services = await getServices();  // 6 hizmet
  return cities.flatMap(c =>
    services.map(s => ({ locale: c.locale, city: c.slug, service: s.slug }))
  );
}

export async function generateMetadata({ params }) {
  const { city, service, locale } = await params;
  const data = await getCityServiceData(city, service, locale);
  if (!data || data.sitterCount === 0) return { robots: { index: false, follow: false } };

  return {
    title: `${data.serviceName} ${data.cityName} — ${data.sitterCount} ${locale === 'fr' ? 'gardiens vérifiés' : 'verified sitters'}`,
    description: locale === 'fr'
      ? `${data.sitterCount} gardiens à ${data.cityName}. Prix médian ${data.medianPrice}$/nuit. ${data.reviewCount} avis vérifiés.`
      : `${data.sitterCount} verified sitters in ${data.cityName}. Median ${data.medianPrice}/night. ${data.reviewCount} verified reviews.`,
    alternates: {
      canonical: `https://example.ca/${locale}/${city}/${service}/`,
      languages: {
        'en-CA': `https://example.ca/en/${data.enCity}/${data.enService}/`,
        'fr-CA': `https://example.ca/fr/${data.frCity}/${data.frService}/`,
        'x-default': `https://example.ca/en/${data.enCity}/${data.enService}/`,
      },
    },
    // ARZ EŞİĞİ KURALI
    robots: data.sitterCount >= 3
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}
```

**Kritik uyarılar:**
- **On-demand revalidation kullanın.** Yeni bakıcı onaylandığında `revalidatePath()` ile o şehrin sayfalarını anında tazeleyin — arz eşiğini geçen sayfa hemen indekse girer.
- **`generateStaticParams`'ı şişirmeyin.** 10.000 sayfayı build'de üretmek deploy süresini dakikalardan saatlere çıkarır. Tier-1 build'de, gerisi on-demand.
- **Sitemap'i dinamik üretin** (`app/sitemap.ts`), sadece `index: true` olan sayfaları dahil edin. 50.000 URL sınırı → sitemap index kullanın.
- **`fetch` cache stratejisini bilinçli seçin.** Fiyat/sayaç verisi `next: { revalidate: 3600, tags: ['city-' + city] }`.

### 4.2 Core Web Vitals hedefleri

Google eşikleri **75. yüzdelik dilimde, saha verisiyle (CrUX)** ölçülür:

| Metrik | Google "İyi" | **Sizin hedefiniz** | Kritik nokta |
|---|---|---|---|
| **LCP** | < 2,5 sn | **< 2,0 sn** | Genelde şehir sayfasındaki hero görseli veya ilk bakıcı kartı fotoğrafı |
| **INP** | < 200 ms | **< 150 ms** | Filtre/harita etkileşimleri INP katili |
| **CLS** | < 0,1 | **< 0,05** | Bakıcı kartı görselleri, geç yüklenen fiyat/puan |

**Uygulama:**

```tsx
// LCP: ilk görünen bakıcı kartı görseli
<Image
  src={sitter.photo}
  alt={`${sitter.name}, ${serviceName} in ${cityName}`}
  width={320} height={320}
  priority={index < 3}          // sadece ilk 3
  fetchPriority={index === 0 ? 'high' : 'auto'}
  sizes="(max-width: 640px) 45vw, 320px"
  placeholder="blur"
  blurDataURL={sitter.blurHash}  // CLS = 0
/>
```

- **Format:** `next.config.js` → `images: { formats: ['image/avif', 'image/webp'] }`. AVIF, WebP'ye göre %30-50 daha küçük.
- **CLS sıfırlama:** Her görsel/kart için `width`+`height` veya `aspect-ratio` sabit. Fiyat ve puan alanları için skeleton yerine **sabit yükseklikli** placeholder.
- **INP:** Harita ve filtre bileşenlerini `next/dynamic` ile `ssr: false` lazy yükleyin. Filtre inputlarında `useDeferredValue` + debounce. Ana thread'te 50ms'den uzun task bırakmayın.
- **Font:** `next/font/local` ile self-host, `display: swap`, sadece Latin subset + Fransızca aksanlar.
- **Üçüncü taraf script'ler:** Analytics/chat widget'ları `next/script` ile `strategy="lazyOnload"`. Intercom/Drift türü widget'lar INP'nin en büyük düşmanı.

### 4.3 Faceted navigation — karar matrisi

> Google'dan (Gary Illyes, 2023): **Bildirilen tüm tarama sorunlarının %50'si faceted navigation kaynaklı.** Bir Botify vakasında 200K ürünlü sitede filtrelerden **500M+ bot-erişilebilir URL** oluşmuş.

| Filtre tipi | Örnek | Aksiyon |
|---|---|---|
| Sıralama | `?sort=price-asc` | **robots.txt disallow** |
| Oturum/tracking | `?sessionid=`, `?utm_*`, `?ref=` | **robots.txt disallow** |
| Tarih aralığı | `?start=2026-10-01&end=2026-10-05` | **robots.txt disallow** (sonsuz kombinasyon) |
| Harita/koordinat | `?lat=&lng=&zoom=` | **robots.txt disallow** |
| Tek, düşük talepli filtre | `?size=small` | **Üst sayfaya canonical** |
| Tek, **kanıtlı talepli** filtre | `/toronto/dog-boarding/large-dogs/` | **Index (self-canonical)** — temiz URL, benzersiz H1/metin |
| Çoklu filtre, talep yok | `?size=small&price=40&fenced=1` | **robots.txt disallow** |
| Çoklu filtre, kanıtlı talep | `/toronto/dog-boarding/cage-free-with-yard/` | **Index** — ama önce hacmi doğrulayın |
| Boş sonuç | — | **404** (redirect değil) |
| İstemci tarafı filtre (URL değişmiyor) | — | Aksiyon gerekmez |

**⚠️ En sık yapılan hata:** `robots.txt disallow` + `noindex` **aynı URL'de birlikte kullanılmaz.** Google engellenen sayfayı tarayamaz → `noindex` etiketini okuyamaz → sayfa süresiz indekste kalabilir. Birini seçin.

Google Search Central: *"noindex kullanmayın; Google yine de sayfayı isteyip sonra düşürür — tarama zamanı boşa gider."* → Tarama bütçesi için **robots.txt tercih edin**, indeks temizliği için **noindex**.

**Rover modelini taklit edin: `/search/` rotasını robots.txt'de tamamen engelleyin.** Filtreli arama bir ürün özelliğidir, SEO varlığı değil. Sadece kanıtlanmış talebi olan filtre kombinasyonlarını **statik, temiz URL'li landing sayfası** olarak ayrıca üretin.

```
# robots.txt
User-agent: *
Disallow: /api/
Disallow: /search/
Disallow: /*?sort=
Disallow: /*?utm_
Disallow: /*?sessionid=
Disallow: /*&
Disallow: /checkout/
Disallow: /messages/
Disallow: /account/
Disallow: /*?start=

# AI crawler'lara açık bırakın (bkz. bölüm 5)
User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://example.ca/sitemap.xml
```

### 4.4 Sayfalama

- **`rel="next"/"prev"` ölü** (Google 2019'da desteği bıraktı). Kullanmayın.
- **Her sayfalama sayfası kendine canonical.** `?page=2` → `?page=2` (sayfa 1'e canonical **yapmayın**; derin bakıcılar keşfedilmez).
- **Sayfa 2+ için:** `index, follow` bırakın (bakıcı profillerinin keşfi için) ama title'a "— Sayfa 2" ekleyin. Alternatif: `noindex, follow` (indeks şişmesi riskiniz yüksekse).
- **Sonsuz kaydırma (infinite scroll) kullanıyorsanız:** mutlaka gerçek `<a href="?page=2">` linkleriyle desteklenmiş olmalı (progressive enhancement). Sadece JS ile yüklenen içerik taranmaz.
- **Sayfa başına 20-30 bakıcı.** Daha fazlası LCP'yi bozar, daha azı tarama derinliğini artırır.

### 4.5 Schema.org — hangisi, nereye, nasıl

> **En kritik kural (Google resmi):** *"Eğer incelenen varlık kendisi hakkındaki yorumları kontrol ediyorsa, `LocalBusiness` veya herhangi bir `Organization` türü kullanan sayfaları yıldız değerlendirme özelliği için **uygun değildir**."* Ayrıca: *"Yorumları veya puanları başka web sitelerinden toplamayın."*

**Bunun marketplace için anlamı:**
- ❌ Kendi şirketinizi `LocalBusiness` + `AggregateRating` ile işaretlemeyin (self-serving → ceza riski)
- ✅ **Bakıcı profil sayfasında** `AggregateRating` + `Review` **uygundur** — bakıcı, hakkındaki yorumları kontrol etmiyor; müşteriler yazıyor, platform yönetiyor. Bu klasik marketplace senaryosudur (Rover, Yelp, TripAdvisor aynısını yapar).
- ⚠️ Şehir sayfasında toplu yıldız göstermeye çalışmayın — `ItemList` kullanın.

**Şehir × hizmet sayfası — `@graph` ile birleşik JSON-LD:**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.ca/en/" },
        { "@type": "ListItem", "position": 2, "name": "Ontario", "item": "https://example.ca/en/ontario/" },
        { "@type": "ListItem", "position": 3, "name": "Toronto", "item": "https://example.ca/en/toronto/" },
        { "@type": "ListItem", "position": 4, "name": "Dog Boarding" }
      ]
    },
    {
      "@type": "Service",
      "@id": "https://example.ca/en/toronto/dog-boarding/#service",
      "name": "Dog Boarding in Toronto",
      "serviceType": "Dog Boarding",
      "provider": { "@type": "Organization", "@id": "https://example.ca/#org" },
      "areaServed": {
        "@type": "City",
        "name": "Toronto",
        "containedInPlace": { "@type": "State", "name": "Ontario" },
        "address": { "@type": "PostalAddress", "addressLocality": "Toronto",
                     "addressRegion": "ON", "addressCountry": "CA" }
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "CAD",
        "lowPrice": "32",
        "highPrice": "95",
        "offerCount": "247"
      }
    },
    {
      "@type": "ItemList",
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "numberOfItems": 247,
      "itemListElement": [
        { "@type": "ListItem", "position": 1,
          "url": "https://example.ca/en/sitters/sarah-m-fenced-yard-leslieville/" },
        { "@type": "ListItem", "position": 2,
          "url": "https://example.ca/en/sitters/david-k-cage-free-downtown/" }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does dog boarding cost in Toronto?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "As of September 2026, dog boarding in Toronto costs a median of $50 per night, with most sitters charging between $42 and $68. Prices vary by neighbourhood — downtown sitters average $58 while Scarborough averages $44. Based on 3,412 completed bookings."
          }
        },
        {
          "@type": "Question",
          "name": "How many dog boarders are available in Toronto?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "There are currently 247 verified dog boarders accepting bookings in Toronto, with the highest concentration in Leslieville, The Annex and Liberty Village."
          }
        }
      ]
    }
  ]
}
```

**Bakıcı profil sayfası — `AggregateRating` ve `Review` burada meşru:**

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://example.ca/en/sitters/sarah-m-fenced-yard-leslieville/#sitter",
  "name": "Sarah M. — Dog Boarding in Leslieville, Toronto",
  "image": "https://example.ca/img/sitters/sarah-m.jpg",
  "priceRange": "$45-$60",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Toronto",
    "addressRegion": "ON",
    "addressCountry": "CA"
  },
  "areaServed": { "@type": "City", "name": "Toronto" },
  "makesOffer": {
    "@type": "Offer",
    "itemOffered": { "@type": "Service", "name": "Dog Boarding" },
    "priceCurrency": "CAD", "price": "52"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "bestRating": "5",
    "reviewCount": "127"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Jennifer L." },
      "datePublished": "2026-08-14",
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
      "reviewBody": "Sarah sent photos twice a day and our anxious rescue came home completely relaxed. The fenced yard was perfect for Ollie."
    }
  ]
}
```

**Ana sayfa — `Organization` + `WebSite` (SiteLinks Search Box ve entity tanıma için):**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.ca/#org",
      "name": "MarkaAdı",
      "url": "https://example.ca/",
      "logo": "https://example.ca/logo.png",
      "areaServed": { "@type": "Country", "name": "Canada" },
      "sameAs": [
        "https://www.linkedin.com/company/...",
        "https://www.instagram.com/...",
        "https://www.crunchbase.com/organization/...",
        "https://www.wikidata.org/wiki/Q..."
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://example.ca/#website",
      "url": "https://example.ca/",
      "inLanguage": ["en-CA", "fr-CA"],
      "publisher": { "@id": "https://example.ca/#org" }
    }
  ]
}
```

**Şema özeti tablosu:**

| Şema | Nerede | Neden |
|---|---|---|
| `Organization` + `WebSite` | Ana sayfa | Entity tanıma, marka SERP, AI motorları |
| `BreadcrumbList` | Tüm derin sayfalar | SERP'te breadcrumb, hiyerarşi sinyali |
| `Service` + `AggregateOffer` | Şehir × hizmet | Fiyat aralığı sinyali, hizmet tanımı |
| `ItemList` | Şehir × hizmet | Bakıcı listesini yapılandırma, derin keşif |
| `FAQPage` | Şehir × hizmet, blog | AI Overviews alıntı formatı (rich snippet artık sınırlı ama LLM'ler okuyor) |
| `LocalBusiness` + `AggregateRating` + `Review` | **Sadece bakıcı profili** | Yıldızlar — self-serving kuralına takılmaz |
| `Article` / `BlogPosting` | Blog | |
| ❌ `LocalBusiness` + `AggregateRating` | **Kendi markanız için ASLA** | Self-serving ihlali |

---

## 5. YENİ NESİL ARAMA — GEO / AEO (2026)

### 5.1 Google'ın resmi duruşu (en net referans)

Google'ın AI features dokümanı açıkça diyor:

> *"AI Overviews veya AI Mode'da görünmek için ek gereksinim veya özel optimizasyon gerekmez."*
> *"Görünmek için yeni makine-okunabilir dosyalar, AI metin dosyaları veya işaretleme oluşturmanıza gerek yok."*
> *"Eklemeniz gereken özel bir schema.org yapılandırılmış verisi de yok."*

Gereken tek şey: normal Search'te **indekslenmiş ve snippet'e uygun** olmak. `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex` etiketlerine AI özellikleri de uyar. Trafik Search Console'da "Web" arama tipi altında görünür.

### 5.2 llms.txt — güncel durum

**Google:** Gereksiz diyor. John Mueller "keywords meta etiketine" benzetti; hiçbir AI servisinin kullanmadığını, botların dosyayı istemediğini belirtti. Google Search'ün 15 Mayıs 2026 AI optimizasyon rehberi bunu tekrarlıyor.

**Ama diğer tarafta:** Anthropic, "Writing for Agents" rehberinde llms.txt'i **öneriyor**. OpenAI, Agents SDK ve Agentic Commerce Protocol için dosya **tutuyor**. Perplexity'nin llms.txt içeriğini yüzeye çıkardığı gözlemlendi. Google küresel olarak 30.000–60.000 llms.txt dosyası indekslemiş durumda.

**Karar:** Google Search görünürlüğü için **hiçbir faydası yok**. Ama üretim maliyeti ~2 saat ve agent/LLM ekosistemi için değer taşıyor. **Yayınlayın, ama SEO bütçesinden değil — ve bundan trafik beklemeyin.**

```
# https://example.ca/llms.txt
# MarkaAdı — Canada's pet sitting & dog boarding marketplace

> Verified, insured pet sitters and dog walkers across Canada.
> Services: dog boarding, house sitting, drop-in visits, doggy day care,
> dog walking, grooming. Bilingual (en-CA / fr-CA).

## Pricing (updated monthly)
- [Dog boarding cost by city](https://example.ca/en/pricing/dog-boarding/): median nightly rates, 40+ Canadian cities
- [Dog walking rates](https://example.ca/en/pricing/dog-walking/)

## Cities
- [Toronto](https://example.ca/en/toronto/)
- [Vancouver](https://example.ca/en/vancouver/)
- [Montréal (FR)](https://example.ca/fr/montreal/)

## Trust & safety
- [Background checks & insurance](https://example.ca/en/trust-safety/)
```

### 5.3 AI alıntı verisi — gerçekte ne işe yarıyor

1M+ veri noktalı 2026 araştırmasından (Otterly.ai):

| Bulgu | Rakam | Sizin için anlamı |
|---|---|---|
| **Reddit tüm platformlarda #1 alıntı kaynağı** | — | Reddit varlığı zorunlu |
| Topluluk platformları (Reddit, Quora) toplam alıntı payı | **%52,5** | Marka domainleri %47,5 — yani alıntıların yarısından fazlası sizin siteniz dışında |
| ChatGPT'de marka alıntı payı | %44,7 (zayıf link) | *"Markanızdan bahseder ama size kullanıcı göndermez"* |
| Perplexity'de marka payı | %28,9 (Reddit %16,9) | En dengeli mention→tıklama oranı |
| Google AI Overviews'ta marka payı | **%59,8**, en yüksek tıklanabilir link oranı | Ama sorguların sadece ~%33'ünde görünüyor |
| **Sitelerin %73'ünde crawler erişim engeli var** | robots.txt blokları, CDN kısıtları, JS render bağımlılığı | En kolay kazanç |
| Referans niteliğinde, kolay alıntılanabilir içerik | **3-5× daha fazla alıntı** | Format kritik |

### 5.4 Uygulama planı

**A. Erişimi açın (en yüksek ROI, en düşük efor)**
- robots.txt'de GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot, Bytespider'a `Allow: /`
- Cloudflare/CDN bot yönetiminde AI crawler'ları beyaz listeye alın (%73'lük problemin asıl kaynağı genelde burasıdır)
- **Kritik içerik SSR ile HTML'de** olmalı — LLM crawler'ları çoğunlukla JS çalıştırmaz. Bakıcı sayısı, fiyat, yorumlar client-side render ediliyorsa AI için görünmez.

**B. İçeriği alıntılanabilir yapın**
- Her sayfada **cevap-önce paragrafı**: soruyu ilk 40-60 kelimede tam cevaplayın, sonra detaylandırın
- **Chunk yapısı:** her H2/H3 altında bağımsız anlaşılır 2-4 cümle. LLM'ler pasaj bazında alıntılar.
- **Somut sayı + tarih + kaynak:** "Toronto'da köpek pansiyonu medyan $50/gece (Eylül 2026, 3.412 tamamlanmış rezervasyona dayalı)" — bu cümle alıntılanır, "fiyatlar değişir" cümlesi alıntılanmaz
- **Karşılaştırma tabloları:** "Pansiyon vs. kennel vs. evde bakım", "Rover vs. [siz] vs. Pawshake Kanada" — LLM'ler tablo verisini sever
- **Tarih damgası:** `dateModified` ve görünür "Son güncelleme" — tazelik alıntı olasılığını artırır

**C. Kendi domaininiz dışında görünürlük (alıntıların %52,5'i)**
- **Reddit:** r/toronto, r/vancouver, r/montreal, r/dogs, r/PersonalFinanceCanada. **Spam yapmayın** — gerçek hesaplarla, gerçek katkı. Kurucu AMA'ları, "Kanada'da köpek bakım fiyatları hakkında sorularınızı cevaplıyorum" formatı. Ayrıca: mevcut "Toronto'da köpek bakıcısı önerisi" thread'lerini izleyin.
- **Wikipedia/Wikidata:** Wikidata entity'si oluşturun (kolay), Wikipedia sadece gerçek haber kaynağı varsa (zor ama kalıcı)
- **YouTube:** Google AI Overviews'ta en çok alıntılanan kaynak. "Kanada'da köpek bakıcısı nasıl seçilir", bakıcı tanıtım videoları.
- **Karşılaştırma/inceleme siteleri:** "Best pet sitting apps Canada" listelerine girin — bu listeler LLM'lerin birincil kaynağıdır
- **Kanada basını:** Narcity, blogTO, Daily Hive, CBC, Toronto Star, La Presse — hem link hem AI alıntı kaynağı

**D. Entity tutarlılığı**
- İsim, açıklama, kategori, kuruluş yılı, kurucu adı her yerde birebir aynı: site, LinkedIn, Crunchbase, Wikidata, G2, Trustpilot, basın bültenleri
- `sameAs` dizisiyle şemada bunları birbirine bağlayın

**E. Ölçüm**
- Search Console "Web" arama tipi (AI trafiği burada)
- Referrer analizi: `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com` — GA4'te ayrı kanal grubu tanımlayın
- AI görünürlük araçları: Otterly.ai, Profound, Peec AI, Ahrefs Brand Radar

---

## 6. İÇERİK VE BACKLINK STRATEJİSİ

### 6.1 İşe yarayan içerik türleri (öncelik sırasıyla)

**1. Fiyat rehberleri — en yüksek ROI**
Kendi işlem verinizden üretilir, kimse kopyalayamaz, hem SEO hem AI Overviews'ta güçlü.
```
/en/pricing/dog-boarding/                    (ulusal genel bakış + şehir tablosu)
/en/toronto/dog-boarding/cost/               (şehir bazlı)
/fr/montreal/pension-pour-chien/prix/
```
İçerik: medyan/ortalama/aralık, mahalle kırılımı, mevsimsel dalgalanma, kennel ile karşılaştırma, ne etkiler (köpek boyu, ilaç ihtiyacı, tatil dönemi).

**2. Karşılaştırma içerikleri**
`Boarding vs. kennel vs. house sitting`, `[Siz] vs Rover Canada`, `Dog daycare vs dog walker: hangisi köpeğime uygun`. Yüksek dönüşüm + LLM'lerin sevdiği format.

**3. Şehir yaşam rehberleri (link mıknatısı)**
`Toronto'nun en iyi 25 köpek parkı (harita ile)`, `Vancouver'ın köpek dostu patio'ları`, `Montréal'de köpekle metro kullanımı kuralları`, `Calgary off-leash alanları`. Belediye, blog, forum linki çeker.

**4. Sahiplik/bakım rehberleri (bilgi hunisi üstü)**
`Kanada'da köpek sahiplenme maliyeti`, `Kanada kışında köpek bakımı`, `Tatilde köpeğinizi bırakmak: kontrol listesi`.

**5. Veri çalışmaları (digital PR — bkz. 6.2)**

**6. Bakıcı hikâyeleri / yerel profiller**
`Meet the sitters of Leslieville` — hem UGC hem yerel alaka hem AI için özgün içerik.

### 6.2 Digital PR fikirleri — Kanada'ya özel, uygulanabilir

| Fikir | Veri kaynağı | Hedef yayın |
|---|---|---|
| **"Kanada'nın en popüler köpek isimleri 2026"** — il/şehir kırılımlı | Kendi kullanıcı verisi + **Toronto Open Data köpek ruhsat isimleri** (kamuya açık!) | blogTO, Narcity, CTV, CBC, Daily Hive |
| **"Kanada'nın en köpek dostu şehirleri" endeksi** | Köpek parkı/kişi, off-leash alan, pet dostu kiralık oranı, bakıcı yoğunluğu, vet erişimi | Ulusal basın, belediye PR'ları, emlak siteleri |
| **"Köpek bakımı enflasyon raporu"** — çeyreklik fiyat trendi | Kendi işlem verisi | Financial Post, BNN Bloomberg, Global News |
| **"Tatil dönemi pet bakım krizi"** — Noel/March Break talep patlaması | Rezervasyon verisi | Mevsimsel haber döngüsü, garanti kapsama |
| **"Kondo köpekleri raporu"** — Toronto/Vancouver dikey yaşam × pet sahipliği | Kendi veri + CMHC | Emlak basını, blogTO, Storeys |
| **"Quebec'in pet bakım manzarası"** (FR) | QC verisi | La Presse, Le Devoir, Journal de Montréal, Radio-Canada |
| **Kurtarma/barınak ortaklığı** — her rezervasyondan bağış | — | Yerel haber + barınak siteleri linki |

**Uygulama notu:** Veri çalışmalarını her yıl **tekrarlayın**. "2026 raporu" → "2027 raporu" birikimli otorite yaratır ve LLM'ler yıllık serileri güvenilir kaynak sayar.

### 6.3 Yerel link inşası — Kanada

**Katman 1: Temel citation'lar (ilk 30 gün)**
Yellow Pages CA, Canada411, Yelp Canada, BBB Canada, Apple Maps Business Connect, Bing Places, Foursquare. NAP tutarlılığı mutlak.

**Katman 2: Sektör dizinleri ve dernekler**
- **Pet Industry Joint Advisory Council of Canada (PIJAC Canada)** — üyelik + dizin
- **Canadian Kennel Club** — etkinlik sponsorluğu
- Il bazlı veteriner dernekleri (OVMA - Ontario, AMVQ - Québec, SBCVMA - BC)
- **Pet Sitters International / NAPPS** — bakıcı sertifikasyon ortaklığı

**Katman 3: Yerel ortaklıklar (en değerli, en yavaş)**
- **Veteriner klinikleri:** "Önerilen kaynaklar" sayfasına link karşılığında bakıcı eğitim içeriği veya karşılıklı yönlendirme programı. Kanada'da zincir: VCA Canada, VetStrategy — kurumsal ortaklık potansiyeli.
- **Hayvan barınakları/kurtarma dernekleri:** Toronto Humane Society, BC SPCA, SPCA de Montréal, Calgary Humane Society. Sponsorluk/bağış → sponsor sayfası linki.
- **Belediyeler:** Toronto'nun **BluePaw Partners** programı gibi şehir programları (toronto.ca üzerinde "Daycare, Dog Boarding & Walking" listesi var — bu doğrudan hedef). Vancouver, Calgary, Ottawa'da benzerleri araştırılmalı.
- **Pet ürün mağazaları:** Pet Valu, Ren's Pets, Global Pet Foods — mağaza içi QR + web ortaklığı
- **Kondo/apartman yönetim şirketleri:** "sakin avantajları" sayfaları, yüksek alaka
- **Üniversite kariyer merkezleri:** bakıcı kazanımı için, `.edu`/`.ca` linkleri
- **Yerel köpek eğitmenleri, groomer'lar, köpek yürüyüş kulüpleri**

**Katman 4: Dijital PR (6.2)**

**Kaçının:** Toplu satın alınan pet niş backlink paketleri, PBN'ler, "guest post" çiftlikleri. Kanada pazarı küçük; gerçek ilişkiler ölçeklenir, spam linkler cezalandırılır.

### 6.4 UGC (yorumlar) — SEO katkısı

Yorumlar, marketplace SEO'sunun **en güçlü ve en az taklit edilebilir** varlığıdır:

**Neden değerli:**
- Google, spam politikalarında **"kullanıcı tarafından oluşturulan içerik platformlarını"** site reputation abuse istisnası olarak açıkça listeliyor — güvenli bölge
- Ölçekte benzersiz, insan yazımı içerik — scaled content abuse riski yok
- Uzun kuyruk anahtar kelimeleri doğal olarak yakalar ("anxious rescue", "senior dog medication", "cage-free", "fenced yard", "sends photos")
- Tazelik sinyali: sürekli yeni içerik
- `AggregateRating` şeması → SERP'te yıldızlar → CTR artışı
- AI motorları için "gerçek deneyim" sinyali

**Uygulama kuralları:**

| Kural | Neden |
|---|---|
| Yorumlar **SSR ile HTML'de** render edilmeli | Client-side yorumlar taranmaz, AI'ya görünmez |
| Bakıcı profilinde **ilk 10-15 yorum HTML'de**, gerisi sayfalanmış (`?page=2`, index/follow) | LCP korunur, derin yorumlar da keşfedilir |
| Şehir sayfasında **o şehirden seçilmiş 3-5 tam yorum** | Benzersiz içerik + sosyal kanıt |
| Yorum sayfalama URL'leri `index, follow` | Ama **`?sort=` engelli** |
| **Teşvikli yorum toplamayın** | Google: "para, indirim, kupon veya ücretsiz ürün karşılığı yazılan yorumlar" ihlal |
| **Başka sitelerden yorum toplamayın** | Google: "Yorumları veya puanları diğer web sitelerinden toplamayın" |
| Sadece **doğrulanmış rezervasyon** sonrası yorum | Kalite + spam engeli |
| Fransızca yorumlar fr-CA sayfada, İngilizce en-CA'da | Dil tutarlılığı; gerekirse her ikisinde de orijinal dilde gösterip etiketleyin |

**Yorum sayısı hedefi:** Bir şehir sayfasının ciddi sıralanması için o şehirde **200+ yorum** birikimi pratik bir eşiktir. Lansmanda Tier-1 şehirlere arz ve yorum toplamaya odaklanın; 60 şehre yayılmayın.

---

## 7. UYGULAMA YOL HARİTASI VE KPI'LAR

### Faz 0 — Temel (0-3. ay)
- `.ca` domain, `/en/` `/fr/` alt dizin yapısı, Next.js App Router
- 15 Tier-1 şehir × 6 hizmet (EN) + 6 QC şehri × 6 hizmet (FR) ≈ 126 sayfa
- Arz eşiği mantığı `generateMetadata`'da canlı
- hreflang tam kurulum, dinamik sitemap, robots.txt (`/search/` engelli, AI crawler'lar açık)
- Schema: Organization, WebSite, BreadcrumbList, Service, ItemList, FAQPage
- CWV: LCP <2,0s / INP <150ms / CLS <0,05
- Bill 96 uyumu: FR içerik EN ile 1:1, Quebec yerlisi editör
- 25-40 blog yazısı (fiyat rehberleri öncelikli)
- Katman 1 citation'lar

**KPI:** İndekslenme oranı >%90, CWV tüm sayfalarda "İyi", 0 hreflang hatası.

### Faz 1 — Genişleme (4-8. ay)
- Tier-2 şehirler (50-60) + Tier-1 mahalleleri → ~1.200 sayfa
- İlk veri çalışması + digital PR kampanyası
- Reddit/YouTube varlığı başlat
- Veteriner + barınak ortaklıkları (hedef: 20-30 yerel link)
- Bakıcı profilleri indekse (yeterli yorum biriktikçe)

**KPI:** "Discovered – not indexed" <%20, ilk 3 ticari anahtar kelimede ilk 10, ayda 15+ referring domain.

### Faz 2 — Ölçek (9-18. ay)
- 8.000-15.000 sayfa; nitelikli filtre landing sayfaları (kanıtlı hacim şartıyla)
- Yıllık veri raporu #2
- AI görünürlük takibi ve optimizasyonu

**KPI:** Tier-1 şehirlerde organik ilk 3, AI alıntı payı ölçülebilir, organik trafiğin toplam edinimde payı >%40.

### Sürekli izlenecek erken uyarı sinyalleri
| Sinyal | Eşik | Aksiyon |
|---|---|---|
| "Discovered – currently not indexed" | >%20 | Ölçeklemeyi **durdur**, içerik benzersizliğini artır |
| "Crawled – currently not indexed" | Artış trendi | Şablon farklılaştırması yetersiz |
| Ortalama tarama isteği/gün | Düşüş | Crawl budget israfı — faceted nav kontrolü |
| Şehir sayfası ortalama oturum süresi | <30 sn | Doorway sinyali; sayfa gerçekten yararlı değil |
| Şehir sayfası bounce | >%75 | Arz eşiğini yükselt |

---

## Kaynaklar

**Rover (doğrudan inceleme):** [sitemap.xml](https://www.rover.com/sitemap.xml) · [robots.txt](https://www.rover.com/robots.txt) · [Toronto dog boarding](https://www.rover.com/ca/toronto--on--dog-boarding/) · [Montréal garde-chien (FR)](https://www.rover.com/ca/fr/montreal--qc--garde-chien/) · [Rover CA blog](https://www.rover.com/ca/blog/) · [Seattle Downtown mahalle sayfası](https://www.rover.com/downtown--seattle--wa--dog-walking/)

**Google resmi:** [Spam Policies](https://developers.google.com/search/docs/essentials/spam-policies) · [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) · [Review snippet rules](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)

**Teknik SEO:** [Faceted Navigation Indexation: 2026 SEO Decision Matrix](https://www.digitalapplied.com/blog/faceted-navigation-indexation-2026-seo-decision-matrix) · [Marketplace SEO Playbook 2026](https://www.journeyh.io/blog/marketplace-seo-playbook) · [Next.js SEO Guide 2026: App Router](https://appseo.com/next-js-seo-guide-2026-app-router/) · [Core Web Vitals 2026](https://www.corewebvitals.io/core-web-vitals) · [Pagination SEO](https://www.searchenginejournal.com/technical-seo/pagination/)

**Kanada / hreflang / hukuk:** [Hreflang Canada Implementation Guide 2026](https://koanthic.com/en/hreflang-canada-implementation-complete-guide-2026/) · [Bill 96 Website Requirements](https://www.weglot.com/blog/bill-96-explained) · [Bill 96 ve SEO](https://www.arfadia.com/blog/bill-96-seo-quebec-french-language-law/) · [CIRA: SEO advantages of a .CA domain](https://www.cira.ca/en/resources/news/domains/seo-advantages-a-ca-domain/) · [Whitespark: GBP Eligibility by Business Type](https://whitespark.ca/guides/can-your-business-be-on-google-a-guide-to-gbp-eligibility-by-business-type/) · [BrightLocal: GBP for Service-Area Businesses](https://www.brightlocal.com/learn/gbp-for-service-area-businesses/)

**AI / GEO:** [Otterly.ai — The AI Citations Report 2026 (1M+ veri noktası)](https://otterly.ai/blog/the-ai-citations-report-2026/) · [Google's 2026 llms.txt guidance explained](https://www.getpassionfruit.com/blog/should-i-create-an-llms.txt-file-google-s-2026-guidance-explained) · [Reddit as an AI visibility lever](https://sitebulb.com/resources/guides/reddit-is-no-longer-just-a-nerd-forum-its-an-ai-visibility-lever/) · [State of AI Citations 2026](https://www.5wpr.com/research/state-of-ai-citations-2026/)

**Pazar verisi:** [Canada Pet Ownership Statistics 2026](https://articles.hepper.com/pet-ownership-statistics-canada/) · [IBISWorld: Pet Grooming & Boarding in Canada](https://www.ibisworld.com/canada/market-size/pet-grooming-boarding/1735/) · [Grand View Research: Canada Pet Services Market](https://www.grandviewresearch.com/horizon/outlook/pet-services-market/canada)

**Rakipler:** [Pawshake Toronto](https://en.pawshake.ca/home-dog-boarding/toronto-on) · [Pawshake Montréal FR](https://fr.pawshake.ca/hebergement-pour-chiens/montreal-qc) · [City of Toronto BluePaw Partners](https://www.toronto.ca/community-people/animals-pets/pet-licensing/bluepaw-partners/daycare-dog-boarding-walking/) · [Care.com Canada](https://www.care.com/en-ca/profiles/pet-care/dog-sitting/dog-boarding/toronto)

**Link inşası:** [Link Building for Pet Sites](https://outreacher.io/link-building-for-pet-sites/) · [Link Building Playbook for Pet Brands](https://www.amplefound.com/resources/pet-brands/link-building-playbook)

---

## En kritik 7 karar (özet)

1. **`.ca` ana domain + `/en/` `/fr/` alt dizin** — alt alan adı değil. Pawshake'in hatasını tekrarlamayın.
2. **Filtreli arama rotasını robots.txt'de tamamen engelleyin** (Rover modeli). Tüm SEO değerini statik landing sayfalarında toplayın. Faceted nav, Google'a bildirilen tarama sorunlarının %50'sinin kaynağı.
3. **Arz eşiği kuralını koda gömün.** <3 bakıcı = noindex, 0 bakıcı = sayfa yok. Doorway/thin content cezasına karşı tek gerçek savunma.
4. **Her şehir sayfasının %40'ı benzersiz canlı veri olsun** — medyan fiyat, bakıcı sayısı, rezervasyon sayısı, gerçek yorumlar, yerel bağlam. LLM ile "benzersiz paragraf" üretmeyin.
5. **`AggregateRating`'i sadece bakıcı profillerinde kullanın**, kendi markanızda asla (self-serving ihlali).
6. **fr-CA hukuki zorunluluk (Bill 96), pazarlama tercihi değil.** İngilizce ile 1:1, Quebec yerlisi editörle. Ceza 3.000-30.000 CAD.
7. **AI crawler'lara erişim açın ve kritik veriyi SSR ile HTML'e koyun.** Sitelerin %73'ü burada başarısız — en ucuz rekabet avantajı.
