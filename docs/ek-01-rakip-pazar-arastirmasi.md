# EK-01 · Rakip ve Pazar Araştırması

**Araştırma tarihi:** 12 Eylül 2026 · Para birimleri kaynakta belirtildiği gibi (USD/CAD karışık — her kalemde işaretlenmiştir)

---

## 1. ROVER İŞ MODELİ (2026 GÜNCEL)

### 1.1 Komisyon yapısı — standart model

| Taraf | Oran | Not |
|---|---|---|
| **Bakıcı (sitter) service fee** | **%20** | ABD'nin çoğu eyaleti + **Kanada** |
| Bakıcı — California & RoverGO | %25 | |
| Bakıcı — UK tek seferlik | %15 | |
| Bakıcı — UK tekrarlayan haftalık bakım | %5 | Rover'ın "sadakat indirimi" denemesi |
| **Müşteri (owner) service fee — Kanada** | **%11, üst sınır CA$65** | Rezervasyon iptalinde iade edilebilir |
| Müşteri service fee — ABD | %11, üst sınır US$50 | |
| **Toplam efektif take rate** | **~%31** (20 + 11) | GMV üzerinden |
| Bahşiş | %0 kesinti | Bakıcı bahşişin tamamını alır |

Kaynak: [Rover Kanada — Service Fees](https://support-ca.rover.com/hc/en-ca/articles/360037446911-What-are-the-service-fees) · [Is Rover free?](https://support-ca.rover.com/hc/en-ca/articles/360036579152-Is-Rover-free)

### 1.2 YENİ KADEMELİ (TIERED) KOMİSYON — en kritik bulgu

Rover 2026'da sabit %20'yi bırakıp **müşteri bazlı kademeli komisyona** geçiyor. Pilot aşamada ve **Kanada'da da yürürlükte**.

**Kanada pilot kademeleri** (her müşteriyle kümülatif rezervasyon hacmine göre, bahşiş hariç):

| Kademe | Müşteriyle kümülatif hacim | Bakıcı komisyonu | Müşteri fee ile **toplam take rate** |
|---|---|---|---|
| Tier 1 | ≤ $499 | **%30** | **~%41** |
| Tier 2 | $500 – $999 | %15 | ~%26 |
| Tier 3 | ≥ $1.000 | %10 | ~%21 |

**Kanada pilot şehirleri:** Saskatoon, Regina, Québec City, Nanaimo, **Calgary**, **Vancouver**, **Ottawa-Gatineau**.
→ **Toronto ve Montréal pilotta DEĞİL** (henüz %20 sabit). Bakıcılar pilota **otomatik dahil ediliyor, opt-out yok**.

**ABD pilot kademeleri** (eşikler farklı): ≤$599 = %30 · $600–$1.199 = %15 · $1.200+ = %10. Şehirler: Seattle/Tacoma/Bellevue, Chicago/Naperville/Elgin, Dallas/Fort Worth/Arlington.

**Stratejik anlamı:** Yeni müşteri ilişkisi artık bakıcıya **%30** (toplam %41'e varan take rate) maliyetli. Rover müşteri–bakıcı ilişkisinin *tekrarını* ödüllendirip, *keşfi* cezalandırıyor. Yeni bir platform için en büyük saldırı yüzeyi budur: **"yeni müşteri edinmek neden en pahalı şey olsun?"**

Kaynak: [Rover CA — Repeat clients pilot](https://support-ca.rover.com/hc/en-ca/articles/46452793506836-New-ways-for-sitters-to-earn-more-with-repeat-clients) · [Rover US](https://support.rover.com/hc/en-us/articles/49949645726228-New-ways-for-sitters-to-earn-more-with-repeat-clients) · [Scritches analizi](https://scritches.io/blog/rover-tiered-fees) · [Houndtrust](https://houndtrust.com/guides/rover-tiered-fees-explained) · [Tails](https://trytails.com/rover-tier-system/)

### 1.3 Diğer gelir kalemleri

- **Profil inceleme / background check ücreti: CA$49** (Kanada'da bakıcı kaydı için, tek seferlik, iade yok). ABD'de tarihsel olarak US$25 idi — Kanada'da anlamlı şekilde daha yüksek.
- Rover **ücretli listeleme / premium sıralama satmıyor** (resmi olarak). Sıralama; profil kalitesi, yanıt hızı, kabul oranı, iptal oranı ve yorumlar üzerinden. — [How Rover Search Works](https://www.rover.com/blog/sitter-resources/how-rover-search-works/)
- Yan gelirler: grooming/training hizmetleri (kademeli komisyon programı **dışında**), pet ürünleri ve affiliate.

### 1.4 RoverProtect / Rover Guarantee kapsamı

**Kapsam:**
- **25.000 $'a kadar veteriner masrafı geri ödemesi** (uygun durumlarda)
- 7/24 destek + rezervasyon sırasında veteriner uzmanına erişim
- Üçüncü taraf background check
- 7 gün içinde iptalde tam iade
- Şifreli ödeme

**Kapsam DIŞI (Kanada resmi listesi — rakip analizi için kritik):**
- Bakıcının **eşyalarına verilen maddi zarar**
- Bakıcı, sahip veya yakınlarının **kendi yaralanmaları**
- Koruyucu bakım, hastalık, kronik ve **önceden var olan durumlar**
- Rezervasyon tarihleri dışındaki olaylar ve **Meet & Greet sırasındaki** olaylar
- Pire, kene, parazit gibi önlenebilir durumlar
- **Rover dışında yapılan rezervasyonlar**

**Kanada limitleri (CAD):** Veteriner 25.000 · Mal hasarı 100.000 · 3. kişi yaralanması 100.000 · **Muafiyet 250 CAD** · Kapsam için gün başına min. 10 CAD rezervasyon ödemesi.
**Prosedür:** Zarardan itibaren 48 saat içinde bildirim · 14 gün içinde belge · tedavi masrafları yaralanmadan sonraki 30 gün içinde.

> ⚠️ Rover büyük harflerle belirtiyor: **"THE ROVER GUARANTEE IS NOT INSURANCE"** — bu bir sigorta ürünü değil, sözleşmesel bir tazmin (indemnity) programıdır.

Kaynak: [RoverProtect](https://www.rover.com/rover-protect/) · [Rover CA — Sitter Guarantee](https://support-ca.rover.com/hc/en-ca/articles/360036961211-What-do-sitters-need-to-know-about-the-Rover-Guarantee) · [Guarantee Terms](https://www.rover.com/terms/guarantee/)

### 1.5 Finansallar ve Blackstone

**Halka açık son veriler (Q3 2023 — SEC):**
- Gelir: **66,2 M$** (+%30 YoY)
- **GBV (Gross Booking Value): 266,4 M$** (+%25)
- Rezervasyon: 1,8 M (+%20) — 290 bin yeni, **1,5 M tekrar (+%23)** → **tekrar oranı %83**
- **Take rate: %23,6** (net; brüt %31'den promosyon/iade sonrası)
- Adj. EBITDA: 17,5 M$ (%26 marj) · Net kâr: 10,5 M$
- FY2023 guidance: gelir 230–232 M$ · FY2022 gelir: 174,0 M$ (+%58)
- **1 milyar $ GBV run-rate**'i Q3 2023'te aştı

Kaynak: [SEC 8-K Ex-99.1, 6 Kas 2023](https://www.sec.gov/Archives/edgar/data/1826018/000182601823000053/ex991_20231106.htm)

**Blackstone satın alması:** Duyuru 29 Kas 2023, hisse başı 11,00 $ nakit, toplam **2,3 milyar $**. Kapanış 27 Şub 2024. CEO: Aaron Easterly → **Brent Turner**. — [Blackstone](https://www.blackstone.com/news/press/rover-agrees-to-be-acquired-by-blackstone-in-2-3-billion-transaction/)

**Blackstone sonrası konsolidasyon (agresif M&A):**

| Yıl | Satın alma | Pazar |
|---|---|---|
| 2024 | **Cat in a Flat** | Avrupa + K. Amerika, kedi bakımı |
| 2025 | **Gudog** | Avrupa (İspanya merkezli) |
| 2025 | **Mad Paws** (~40 M$) | Avustralya — 2024'te 400 bin+ işlem |

Bugünkü ölçek (resmi): **18 ülke**, 12M+ hayvan, 41M 5-yıldızlı konaklama, ortalama 4,9/5.

> ⚠️ **Tahmin:** Blackstone sonrası Rover finansal açıklama yapmıyor. 2023 trendini (%25-30 büyüme) ve 3 satın almayı ekstrapole edersek **2026 grup geliri kabaca 450–550 M$, GBV ~1,8–2,2 milyar $**. Doğrulanmış değil.

Kaynak: [Rover About Us](https://www.rover.com/ca/about-us/) · [GeekWire — Mad Paws](https://www.geekwire.com/2025/rover-to-acquire-australia-based-pet-sitting-marketplace-mad-paws/) · [GeekWire — Cat in a Flat](https://www.geekwire.com/2024/rover-acquires-cat-sitting-marketplace-to-further-expand-its-growth-across-europe/)

### 1.6 Kanada fiyat aralıkları (CAD) — Toronto

Rover'ın kendi verisi (Eylül 2025, HST hariç):

| Hizmet | Aralık | Ortalama |
|---|---|---|
| Drop-in ziyaret | $20–28 / ziyaret | — |
| Köpek pansiyonu (bakıcı evinde) | $40–59 / gece | **$49,39** |
| House sitting (sahibin evinde) | $40–70 / gece | **$60,43** |
| Gündüz hizmetleri | $22–32,67 / gün | — |
| 60 dk yürüyüş/ziyaret ek ücreti | +$12–14 | — |

**Kanada geneli piyasa (platform dışı dahil):** Köpek gezdirme ~$25/yürüyüş · Doggy daycare $30–50/gün · Pansiyon $20–50/gece · Pet sitting $20–85/gece.

Kaynak: [Rover — Toronto Dog Sitting Costs](https://www.rover.com/ca/blog/toronto-ca-dog-sitting-price/) · [Made in CA](https://madeinca.ca/pet-spending-canada-statistics/)

---

## 2. KANADA'DAKİ RAKİPLER

### 2.1 Rover Canada — pazar lideri
- `rover.com/ca` ayrı domain, EN/FR · Tüm büyük Kanada şehirleri
- Hizmetler: Boarding, house sitting, drop-in, daycare, walking, grooming, training
- Model: %20 bakıcı + %11 müşteri (cap CA$65); 7 şehirde %30/%15/%10 pilot; CA$49 profil ücreti
- **Güçlü:** Marka bilinirliği · SEO hakimiyeti (şehir landing page'leri Google'da 1.) · 25.000$ garanti · Blackstone sermayesi · **tekrar rezervasyon oranı %83**
- **Zayıf:** Yüksek ve **artan** komisyon · müşteri desteği şikayetleri · kademeli sistemin yarattığı bakıcı öfkesi · Kanada'ya özel operasyon/dil desteğinin zayıflığı (Québec) · yerel/kültürel uyum eksikliği
- **Pazar payı:** *Tahmin* — Kanada online pet-sitting işlem hacminin **%60–75'i**

### 2.2 Pawshake Canada — 2 numara
- Belçika merkezli, `en.pawshake.ca` · Toronto/Montréal/Vancouver
- Model: Bakıcıdan **~%15**; müşteriden "küçük bir yüzde, büyük rezervasyonlarda üst sınırlı" (**oran açıklanmıyor — şeffaflık sorunu**); kayıt ücretsiz
- **Güçlü:** Rover'dan ucuz · abonelik yok · 7/24 destek
- **Zayıf:** Uygulama performans şikayetleri · bazı bölgelerde **arz/talep likiditesi çok düşük** · ücret şeffaflığı yok · Kanada'da pazarlama yatırımı minimal
- **Pazar payı:** *Tahmin* %5–10

Kaynak: [Pawshake Help — Service Fee](https://support.pawshake.com/hc/en-gb/articles/33949519870612-What-is-the-Pawshake-Service-Fee) · [Savvy New Canadians](https://www.savvynewcanadians.com/best-pet-sitting-apps-canada/)

### 2.3 PetBacker — en agresif komisyonlu
- Singapur/Malezya merkezli · Kanada'da ince kapsama
- Model: **%15–25**, yeni bakıcılar **%25'ten başlıyor**. Pet training sabit **%35**. Tamamlanan iş sayısına göre kademeli düşüş.
- ⚠️ **Platform dışına çıkma şüphesi olan bakıcılara %40 komisyon cezası + hesap kısıtlaması**; ihlal sonrası 5-10 rezervasyonla ancak %20'ye inebiliyor
- **Zayıf:** Kanada'da neredeyse hiç arz yok · cezalandırıcı yapı · bakıcı tarafında kötü itibar
- **Pazar payı:** *Tahmin* %1'in altı

Kaynak: [PetBacker Help Center](https://www.petbacker.com/help-center/pet-service-providers/how-much-are-the-service-fees)

### 2.4 Wag! — iflas etti, pratikte Kanada'da yok
- **27 Temmuz 2025'te Chapter 11 iflas koruması** başvurusu
- 2024 geliri **70,5 M$ (-%16 YoY)**; net zararlar: 17,6 M$ (2024), 13,3 M$ (2023), 38,6 M$ (2022)
- Borcu alan **Retriever LLC** şirketin %100'ünü aldı; **Nasdaq'tan delist**, hissedarlar sıfırlandı
- BofA Securities 16 potansiyel alıcıyla, Arc Capital 26 finansman ortağıyla görüştü — hiçbiri sonuç vermedi
- Kanada'da anlamlı operasyonu yok
- **Ders:** On-demand + yüksek pazarlama harcaması + düşük tekrar oranı bu sektörde **çalışmadı**. Rover'ın %83 tekrar oranına karşı Wag!'ın müşteri edinim maliyeti sürdürülemezdi.

Kaynak: [Chapter11Cases](https://chapter11cases.com/blogs/news/pet-services-platform-wag-files-for-prepackaged-bankruptcy-secured-lender-to-take-ownership) · [Nasdaq delist](https://www.panabee.com/news/nasdaq-delists-wag-existing-equity-faces-cancellation-amid-bankruptcy)

### 2.5 Gardinou — Québec merkezli, %0 komisyon, abonelik modeli
- Kanada şirketi · Montréal, Québec City, Ottawa, Calgary, Vancouver, Richmond
- Model: **%0 komisyon**. Gelir = **bakıcı aboneliği: CA$15/ay veya CA$155/yıl**. Abonelik, rezervasyon taleplerini doğrudan alma + **sahiplerin iletişim bilgilerine erişim** veriyor.
- **Güçlü:** Fransızca-first, Québec kültürel uyumu · bakıcı ekonomisi dramatik biçimde iyi (yılda $3.000 kazanan bakıcı: Rover'da $600–900 komisyon vs Gardinou'da $155) · "Kanadalı" konumlandırma
- **Zayıf:** **Ödeme akışını kontrol etmiyor → ödeme koruması, escrow ve sigorta yok** · talep tarafı zayıf · marka bilinirliği düşük · **disintermediation'ı çözmek yerine iş modeli haline getirmiş**
- **Pazar payı:** *Tahmin* — Québec dışında %1'in altı; Montréal'de niş ama gerçek

Kaynak: [Gardinou pricing](https://www.gardinou.ca/en/pricing-plans/list) · [Gardinou hakkında](https://www.gardinou.ca/en/post/canadian-pet-sitting-platform)

### 2.6 TrustedHousesitters — farklı kategori
Çift taraflı **yıllık üyelik**; bakıcı ücretsiz bakım yapar, karşılığında bedava konaklama alır. Rezervasyon komisyonu yok.

| Plan | Sitter | Pet Parent |
|---|---|---|
| Basic | $97/yıl + **$12/sit booking fee** | ~$112/yıl + $12/sit |
| Standard | $127/yıl + $12/sit | ~$172/yıl + $12/sit |
| Premium | **$194/yıl, booking fee yok** | ~$224/yıl |

*Kanada CAD fiyatlandırma: Basic $169, Standard $219, Premium $339.*

- **Güçlü:** Sahip için sıfır marjinal maliyet · hayvan evde kalıyor · global gezgin topluluğu
- **Zayıf:** 2025-26'da eklenen $12/sit booking fee üyelerde büyük tepki çekti · ticari bakıcı için gelir yok · kısa süreli/acil ihtiyaçlar için kullanışsız · arz güvenilmez
- **Konum:** Doğrudan rakip **değil** — 7+ gün tatil segmentinde çakışıyor, günlük gezdirme/drop-in'de hiç çakışmıyor

Kaynak: [House Sitters Guide — THS 2026 fiyatları](https://www.housesittersguide.com/trustedhousesitters-pricing-2026/)

### 2.7 Yerel / bölgesel Kanadalı oyuncular

**Hello Marshy** — *en yakın tehdit profili*
GTA-first (Toronto, Mississauga, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, Pickering, Ajax, Whitby). Ücretsiz planda **%12 bakıcı komisyonu**; ücretli üyelikte **%0**; **pet parent'tan sıfır ücret**. Köpek dışı hayvanlara açık; ücretli üyelikte background check dahil; **platform dışı iletişime izin veriyor**. — [Hello Marshy](https://www.hellomarshy.com/blog/best-rover-alternative-canada)

**Petme** — **%0 sahip ücreti** + rezervasyon başına **%5'e kadar cashback (max $20)**; bakıcı **%90'a kadar** tutuyor. **$22.000 koruma planı**. 30+ Kanada şehri iddiası. — [Petme Canada](https://petme.social/canada/dog-sitters)

**Spot Dog Walkers** — Toronto & Vancouver. Sadece köpek gezdirme, **birebir tasmalı yürüyüş** (grup yok — kalite konumlandırması). 15/30/45/60 dk; canlı GPS; lockbox girişi; foto/video; sigortalı yürüyüşçüler. **Dragons' Den yatırımı aldı**. İddia: *"4 yıldan uzun süredir hiçbir müşteriye no-show/iptal yapmadık"* — Rover'ın en büyük zayıflığına doğrudan saldırı. — [Spot Dog Walkers Toronto](https://www.spotdogwalkers.com/locations/toronto)

**GoFetch (Vancouver)** — Kanada'nın ilk on-demand köpek gezdirme uygulaması (2016). *Tahmin: fiilen dormant.* — [BetaKit 2016](https://betakit.com/canadas-first-on-demand-dog-walking-app-is-here/)

**Diğerleri (düşük tehdit):** Care.com Kanada (pet'e özel değil) · Petsitter.com ($36/ay premium) · House Sitters Canada · Tails, Scritches, Pupline, Houndtrust, FeeBite (ABD merkezli "Rover fee calculator" SEO araçları — *bakıcı memnuniyetsizliğinin ne kadar büyük bir içerik pazarı yarattığının kanıtı*).

### 2.8 Komisyon modeli karşılaştırma tablosu

| Platform | Bakıcı kesinti | Müşteri ücreti | Toplam take rate | Not |
|---|---|---|---|---|
| **Rover (standart)** | %20 | %11 (cap CA$65) | **~%31** | Kanada varsayılan |
| **Rover Tier 1** | **%30** | %11 | **~%41** | Yeni müşteri = en pahalı |
| Rover Tier 3 | %10 | %11 | ~%21 | $1.000+ kümülatif sonrası |
| Pawshake | ~%15 | açıklanmıyor | ~%20–25 *(tahmin)* | |
| PetBacker (yeni) | %25 | var | ~%30+ | Off-platform cezası %40 |
| **Hello Marshy (free)** | %12 | **%0** | **%12** | GTA |
| **Hello Marshy (üyelik)** | **%0** | %0 | abonelik | |
| **Petme** | ~%10 | **%0** + cashback | ~%10 | |
| **Tails** | %0–10 + %6 işlem | — | **%6–16** | |
| Floofers | %10 | — | %10 | |
| **Gardinou** | **%0** | %0 | **CA$155/yıl** | Ödeme akışı yok |
| The Pet Sitter (EU) | %0 | — | €199–299/yıl | |
| TrustedHousesitters | yok | yok | ~$100–340/yıl | Farklı kategori |

---

## 3. PAZAR VERİLERİ — KANADA

### 3.1 Evcil hayvan sahipliği

| Metrik | Değer | Yıl |
|---|---|---|
| Evinde en az bir hayvan olan hane | **%80** | 2024 |
| Toplam evcil hayvan popülasyonu | **29,4 milyon** | 2024 |
| Kedi / Köpek | ~8,9 M / ~8,3 M | 2024 |
| **Köpek sahibi hane** | **%39** | 2024 |
| **Kedi sahibi hane** | **%37** | 2024 |
| Hem kedi hem köpek | %13 | 2024 |
| Evcil hayvan sigortası sahipliği | **sadece %3** | — |

**Bölgesel farklar (şehir seçimi için kritik):**
- **Québec: kedi %67 vs köpek %48** → Montréal'de **kedi bakımı** baskın ihtiyaç. Rover'ın kedi hizmeti zayıf; bu yüzden Cat in a Flat'i satın aldı.
- **BC, Prairie eyaletleri, Kuzey Kanada:** köpek ağırlıklı → **Vancouver ve Calgary** gezdirme/pansiyon için daha iyi
- **Ontario ve Atlantik Kanada:** dengeli

> ⚠️ Kaynaklar arasında tutarsızlık var: bazıları "%60 Kanadalı evcil hayvan sahibi" diyor, Made in CA "%80 hane" diyor. %80 = *en az bir hayvan olan hane*, %60 = *birey bazlı* olması muhtemel. Planlamada **köpek %39 + kedi %37 hane** rakamlarını kullanın.

Kaynak: [Made in CA — Pet Ownership](https://madeinca.ca/pet-ownership-statistics-canada/) · [CAHI Pet Population Survey](https://cahi-icsa.ca/canadian-pet-population-survey)

### 3.2 Harcama

| Kalem | Tutar | Yıl |
|---|---|---|
| **Kanada pet services pazarı** | **3.057,7 M USD** | 2024 |
| → 2033 projeksiyonu | **6.720,7 M USD** | 2033 |
| → **CAGR** | **%9,2** | 2025–2033 |
| → Medikal (veteriner) payı | %73,36 | 2024 |
| → **Non-medikal (BİZİM PAZARIMIZ)** | **~%26,6 ≈ 814 M USD ≈ 1,1 milyar CAD** | *(hesap)* |
| Non-medikal büyüme | **En hızlı büyüyen segment** | |
| Köpek başına yıllık harcama | ~3.020 CAD | 2024 |
| Kedi başına yıllık harcama | ~2.500 CAD | 2024 |
| Pet harcaması artışı | **+%23** | 2021 → 2024/25 |
| Ortalama veteriner faturası (köpek/kedi) | 960 / 711 CAD/yıl | 2024 |

**TAM/SAM hesabı (tahmin):**
- Kanada non-medikal pet services ≈ **1,1 milyar CAD/yıl**
- Online marketplace'lerden geçen kısım *tahminen* %15–25 ≈ **165–275 M CAD GMV**
- Rover'ın Kanada GMV'si *tahminen* **120–180 M CAD**
- %20 take rate'te 2 numaralı oyuncu için makul 3-yıl hedefi: **20–40 M CAD GMV → 4–8 M CAD net gelir**

Kaynak: [Grand View Research — Canada Pet Services](https://www.grandviewresearch.com/horizon/outlook/pet-services-market/canada) · [Made in CA — Pet Spending](https://madeinca.ca/pet-spending-canada-statistics/)

### 3.3 Metropol pazarlar

| CMA | Nüfus (≈2025) | Yıllık büyüme (StatCan) | Pet profili | Çekicilik |
|---|---|---|---|---|
| **Toronto** | ~7,1 M | **~%0,0** | Dengeli; kondo yoğun | **En büyük; Rover pilotu DIŞINDA** |
| **Montréal** | ~4,5 M | %0,5–0,7 | **Kedi ağırlıklı (%67)**; FR-first | **Rover pilotu DIŞINDA; dil avantajı** |
| **Vancouver** | ~3,0 M | %0,2–0,5 | Köpek ağırlıklı; yüksek gelir | Rover pilotunda — bakıcı hoşnutsuzluğu taze |
| **Calgary** | ~1,7 M | **%2,9** | Köpek ağırlıklı; geniş ev | **En hızlı büyüyen**; Rover pilotunda |
| **Edmonton** | ~1,5 M | **%3,0** | Köpek ağırlıklı | Hızlı büyüyor; Rover pilotu DIŞINDA |
| **Ottawa-Gatineau** | ~1,5 M | ~%1,5 | İki dilli | Rover pilotunda |

Kanada'nın 41 CMA'sının toplam nüfusu: **31.169.100** (1 Tem 2025).

> ⚠️ CMA nüfus rakamları Statista tabanlı yaklaşıktır; büyüme oranları StatCan resmi verisidir. Kesin planlama için StatCan tablo 17-10-0148-01.

Kaynak: [StatCan — Subprovincial population estimates 2025](https://www150.statcan.gc.ca/n1/daily-quotidien/260114/dq260114a-eng.htm) · [Statista CMA](https://www.statista.com/statistics/443749/canada-population-by-metropolitan-area/)

---

## 4. KULLANICI ŞİKAYETLERİ VE PAZAR BOŞLUKLARI

### 4.1 Trustpilot genel görünüm (Rover)

Puan **4,5/5**, **35.293 yorum**. Dağılım: 5★ %84 · 4★ %6 · 3★ %2 · 2★ %1 · **1★ %7**

> **Yorum:** Yüksek ortalama, *hizmetin kendisinin* (bakıcıların) iyi olduğunu gösteriyor. %7'lik 1★ kitlesi neredeyse tamamen **platformla** ilgili — destek, ödeme, tazminat. Yani **bakıcılar iyi, platform kötü.** Yeni bir oyuncu için mükemmel bir yapı: aynı arz havuzunu daha iyi bir platformla sunmak.

Kaynak: [Trustpilot Kanada — rover.com](https://ca.trustpilot.com/review/rover.com)

### 4.2 Pet sahibi şikayetleri

**a) Güvenlik olayları ve zayıf tarama**
- Gizmodo, FTC'den 4 yılda **85 Rover şikayeti** aldı; 10'unu detaylandırdı: kaçan ve araba çarpan köpekler, sıcak çarpması sonucu ölüm, olası zehirlenme, tıbbi ihmal
- Kanada'da belgelenmiş vakalar:
  - [Chilliwack BC — köpek kaçtı, araba çarptı (CBC)](https://www.cbc.ca/news/canada/british-columbia/chilliwack-family-laments-leaving-puppy-with-rover-pet-sitter-after-dog-escapes-and-is-hit-by-car-1.5361456)
  - [Vancouver — bakıcı köpeği kaybetti (Global News)](https://globalnews.ca/news/6174606/b-c-dog-lost-pet-sitting-app/)
  - [Edmonton — "kâbus" bakıcı deneyimi (CBC)](https://www.cbc.ca/news/canada/edmonton/buyer-beware-economist-says-after-edmonton-dog-owner-recounts-nightmare-with-sitter-1.6518582)
  - [Hamilton — 2 köpek ölümü, Ontario soruşturması (CBC)](https://www.cbc.ca/news/canada/hamilton/dog-sitting-hamilton-dog-death-investigation-1.7244766)
- Trustpilot'ta tekrarlayan tema: **"aşı kayıtları neden zorunlu değil?"**

**b) Garanti talebi reddi** — 25.000$ limit teoride yüksek, pratikte erişilmesi zor. "Destekleyici kanıt gönderilmedi" gerekçesiyle red (kanıt gönderilmiş olmasına rağmen).

**c) Sorumluluk kaçışı** — Rover "pet care hizmetleri" pazarlıyor ama küçük yazıda **"Rover pet care hizmeti sağlamaz"** diyor.

**d) Müşteri desteği** — "AI destekli, ne istediğimi anlamıyor"; telefonla insana ulaşılamıyor.

**e) Son dakika iptalleri** — bakıcıların son anda iptali veya onay sonrası ek ücret talebi.

### 4.3 Bakıcı şikayetleri

**a) Komisyon — birincil şikayet.** %20 zaten yüksek görülüyordu; **%30'a çıkan Tier 1** büyük tepki yarattı. Yılda 36.000$ kazanan tam zamanlı bakıcı **7.200$** komisyon ödüyor (abonelik modelinde ~200$). **Yapısal adaletsizlik:** bakıcı müşteriyi kendisi getirse bile Rover %30 alıyor; kademeli sistem **her yeni müşteriyle %30'a resetleniyor**. Grooming ve training kademeli programın dışında.

**b) Ödeme sorunları** — "Rover bana ödeme yapmadı", itiraz sonrası hesap bloke edildi iddiaları.

**c) Sıralama/görünürlük belirsizliği** — Rover "sabit sıralama yok, her arama kişiselleştirilir" diyor → bakıcı için **kara kutu**.

**d) Giriş maliyeti** — **CA$49 profil inceleme ücreti**, henüz hiç rezervasyon almadan, iade edilmez.

**e) Bakıcı kendi eşyası/yaralanması korunmuyor** — garanti bakıcının evine verilen zararı kapsamıyor; ayrıca üçüncü taraf poliçe almak zorunda.

### 4.4 Disintermediation (platform dışına çıkma)

Sektörün yapısal sorunu:
- Rover'ın **tekrar rezervasyon oranı %83** — ilişki bir kez kurulduktan sonra platformun katma değeri çok azalıyor; leakage'ın en yüksek olduğu nokta
- PetBacker **cezayla** çözmeye çalışıyor (%40 komisyon) — bakıcıyı düşmanlaştırıyor
- Rover kademeli fee ile **ödüllendirmeye** geçti (%30→%10) — ekonomik olarak daha akıllı ama yeni müşteri edinimini cezalandırarak
- **Gardinou ve Hello Marshy tamamen teslim oldu:** abonelik alıp taraflara "istediğiniz gibi anlaşın" diyorlar — ödeme koruması ve sigortayı kaybettiriyor

**Kanıtlanmış leakage önleme taktikleri:**
1. **Değer bazlı (etkili):** Gerçek sigorta (Turo 750.000$'a kadar), escrow, resmi sözleşme, itibar sistemi
2. **Profesyonel araçlar:** Takvim, faturalama, muhasebe otomasyonu (Upwork modeli) → platformdan çıkmak *işlevsellik kaybı* demek
3. **Müşteri tarafı:** Sorunsuz ödeme, alıcı koruması, ön onay
4. **Hizalama:** Sağlayıcıya hisse/kâr paylaşımı
5. **Sürtünme bazlı (ters tepebilir):** İletişim engelleme, mesaj kısıtlama, ban

Kaynak: [Sharetribe](https://www.sharetribe.com/academy/how-to-discourage-people-from-going-around-your-payment-system/) · [HBS Online](https://online.hbs.edu/blog/post/disintermediation)

### 4.5 Somut farklılaşma boşlukları

| # | Boşluk | Kanıt | Ürün cevabı |
|---|---|---|---|
| **1** | **Yeni müşteri edinimi cezalandırılıyor** | Rover Tier 1 = %30 (toplam %41) | Tersine çevir: platformun getirdiği müşteride %18-20, bakıcının kendi getirdiğinde **%0–5**. Leakage'ı da otomatik çözer. |
| **2** | **Tekrar rezervasyonda platform değer katmıyor** | %83 tekrar oranı | Tekrarda düşük/sıfır komisyon + abonelik hibrit. Rover kopyalayamaz (ana geliri kanibalize eder). |
| **3** | **Garanti teoride var, pratikte ödemiyor** | FTC 85 şikayet, red vakaları | **SLA'lı tazminat:** 48 saatte karar, redde yazılı gerekçe. Lisanslı Kanadalı sigorta ortağı. |
| **4** | **Bakıcı hiç korunmuyor** | Garanti bakıcı eşyası/yaralanmasını kapsamıyor | Bakıcı tarafı mülk hasarı + kaza sigortası. **Hiçbir rakipte yok.** |
| **5** | **Aşı/sağlık doğrulaması zorunlu değil** | Trustpilot tekrarlayan şikayet | Zorunlu aşı kaydı + veteriner doğrulama |
| **6** | **Destek AI'da tıkalı, insan yok** | Trustpilot #1 negatif tema | Kanada saat diliminde **insan destek**; olay anında telefon |
| **7** | **Québec/Fransızca ihmal + kedi ağırlıklı pazar** | QC kedi %67, köpek %48 | **FR-first Montréal lansmanı + kedi bakımı odaklı ürün** |
| **8** | **Sıralama algoritması kara kutu** | Rover "sabit sıralama yok" | Şeffaf sıralama skoru |
| **9** | **Son dakika iptali cezasız** | Trustpilot + rakip pazarlaması | Sert iptal politikası + **yedek bakıcı garantisi** |
| **10** | **CA$49 peşin giriş ücreti** | Rover Kanada | **Ücretsiz giriş**, background check'i ilk rezervasyondan karşıla |
| **11** | **Toronto ve Montréal Rover pilotunda değil** | Rover CA help center | Bakıcılar %30 şokunu yaşamadı — **pilot gelmeden bakıcı tabanını kapmak için 6-18 aylık pencere** *(tahmin)* |

---

## 5. İKİ TARAFLI PAZARYERİ SOĞUK BAŞLANGIÇ

### 5.1 Hangi tarafla başlanmalı: **ARZ (bakıcı)**

1. **Arz talebi yaratıyor.** Pet care'de bakıcının **zaten mevcut müşteri portföyü var** — bu sektörün en büyük avantajı. (DoorDash'te restoranlar kendi tabelalarını bastı; GrubHub'da restoranlar mekan içinde pazarlama yaptı.)
2. **Bakıcılar şu anda gerçekten kızgın.** Rover'ın %30'a çıkması ve "Rover fee calculator" SEO ekosisteminin büyümesi hazır ve motive bir havuz gösteriyor.
3. **SEO arz gerektirir.** Thumbtack büyümesinin %80-90'ını SEO'ya bağlıyor; GrubHub'ın #1 kanalı SEO (%30 kullanıcı). "Toronto dog boarding" araması ancak listelenmiş bakıcı varsa dönüşür.

Kaynak: [Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-kickstart-and-scale-a-marketplace-2e5) · [Marketplace Cold Start Strategy](https://internetmango.com/insights/marketplace-cold-start-strategy/)

### 5.2 Rover'ın kendi cold-start tarihi — dersler

- Rover ilk müşterilerini **Google Ads'te "dog boarding" kelimelerini satın alarak** kazandı. Tek kanallı, dar, niyet-yüksek.
- **Şehir şehir açıldı**, ülke çapında değil.
- 2016'da Rover + DogVacay birleşmeden önce: birlikte 100.000+ bakıcı, **150 M$ rezervasyon**. Rover, 2 numaralı rakibinden **9 kat hızlı** büyüyordu.
- **2017 DogVacay birleşmesi kritik ders:** İki iyi finanse edilmiş oyuncu (Rover 91,5 M$, DogVacay ~50 M$) aynı şehirlerde savaşınca **ikisi de likidite kuramadı**; birleşmek zorunda kaldılar. → **Bu sektörde network etkisi ŞEHİR BAZINDA yereldir.** Ulusal ölçek, tek bir şehirdeki yoğunluk kadar değerli değil.
- **Wag!'ın 2025 iflası tersten ders:** On-demand, yüksek CAC, düşük tekrar oranı = ölüm.

Kaynak: [GeekWire — Rover/DogVacay](https://www.geekwire.com/2017/rover-acquires-dogvacay-biggest-competitor-online-dog-sitting-marketplace/) · [Management Science — Dog Eat Dog: Network Effects in a Digital Platform Merger](https://pubsonline.informs.org/doi/10.1287/mnsc.2023.4675)

### 5.3 Önerilen cold-start playbook

**Aşama 0 — Tek şehir, tek mahalle kümesi (0-3 ay)**
- **Şehir:** *Öneri* — **Toronto (GTA)** veya **Montréal**. Gerekçe: (a) en büyük iki pazar, (b) **ikisi de Rover'ın kademeli fee pilotunda değil** → pilot geldiğinde büyük bir kitle bir anda serbest kalacak; orada hazır olmalısınız, (c) Montréal ek olarak FR + kedi boşluğu sunuyor
- **Tüm şehirle başlamayın.** 3-5 mahalle seçin (Toronto: Liberty Village, Leslieville, Junction, Annex). Network etkisi mahalle bazında gerçekleşir.

**Aşama 1 — Arzı tohumlama (concierge / manuel)**
1. **Rover/Pawshake profillerinden doğrudan bakıcı avı.** Profiller halka açık; en yüksek puanlı, en çok yorumlu bakıcılara birebir ulaşım.
2. **Teklif:** "İlk 12 ay %0 komisyon" + "kendi müşterilerinizi getirin, onlardan hiç komisyon almayız" + "ücretsiz background check".
3. **Manuel eşleştirme (Wizard of Oz).** İlk 100 rezervasyonu insan eliyle eşleştirin.
4. **Hedef yoğunluk:** *Tahmin* — mahalle kümesinde **50-80 aktif, doğrulanmış bakıcı** minimum likidite eşiği.

**Aşama 2 — Talebi ateşleme**
1. **Bakıcının kendi müşterisi = ilk talep.** 50 bakıcı × 20 müşteri = **1.000 hazır müşteri, CAC ≈ 0**.
2. **SEO** — uzun vadede en büyük kanal. Şehir+hizmet+mahalle landing sayfaları; Fransızca ve mahalle seviyesinde boşluk var.
3. **Google Ads** dar niyet kelimeleri.
4. **Tedarikçi kaynaklı pazarlama.** Bakıcılara QR kod, tasma etiketi, park tabelası. **Köpek parkı bu sektörün "restoran vitrini"dir.**
5. **Veteriner klinikleri, pet shop'lar, groomer'lar, kondo concierge'leri** ile yerel ortaklık.
6. **Word of mouth.** Airbnb/Lyft/Uber büyümesinin %50+'si buradan geldi. Çift taraflı referans kredisi.

**Aşama 3 — Yoğunluğu ölç, ancak sonra genişle**
- Ölçülecek: **arama → rezervasyon dönüşüm oranı** ve **talep kabul oranı**
- *Öneri eşik:* dönüşüm **%25+**, 60 günde tekrar rezervasyon **%40+** olmadan ikinci şehre geçmeyin

**Aşama 4 — Leakage'ı iş modeline gömerek nötralize et**
- **Komisyonu keşif için al, ilişki için alma.** Bakıcının kendi müşterisi = %0-5.
- Bakıcı platformdan çıkmak için ekonomik sebep bulamaz; platform yine de ödeme, sigorta, takvim, vergi raporlaması sağlar → **çıkmak işlevsellik kaybı olur**
- Ek yapışkanlık: takvim, otomatik fatura, CRA vergi özeti, müşteri CRM'i, otomatik hatırlatma (Upwork modeli)

---

## 6. ÖZET — 7 MADDEDE STRATEJİK SONUÇ

1. **Rover kırılgan bir anda.** Blackstone sahipliğinde take rate'i **%31'den %41'e** çıkarıyor. Klasik PE marj sıkma hamlesi ve arz tabanında gerçek öfke yaratıyor. 10 yılda görülen en iyi giriş penceresi.
2. **Toronto ve Montréal henüz pilotta değil.** Bakıcı tabanını Rover'ın fiyat şoku oraya ulaşmadan kapmak için sınırlı zaman var. *(Pencere tahmini: 6-18 ay)*
3. **Wag!'ın iflası**, on-demand/yüksek-CAC modelinin bu sektörde çalışmadığının kanıtı. %83 tekrar oranı olan bir işte, tekrarı sahiplenen kazanır.
4. **Kimse bakıcıyı korumuyor.** Düşük maliyetli, yüksek algılanan değerli farklılaştırıcı.
5. **Québec/Fransızca + kedi çifte boşluk.** Tüm platformlar köpek-first ve İngilizce-first. Gardinou boşluğu gördü ama ödeme akışı olmadığı için ölçeklenemiyor.
6. **Komisyon yapısı ürünün kendisidir.** "Platform getirdiyse %20, sen getirdiysen %0" formülü aynı anda üç problemi çözer: bakıcı edinimi, leakage ve cold-start talebi.
7. **Ölçek değil yoğunluk.** Network etkisi **şehir/mahalle bazında yereldir**. 3 mahallede %100 doluluk, 3 şehirde %10 doluluktan kat kat değerli.

---

## Kaynaklar

**Rover — resmi:** [Kanada service fees](https://support-ca.rover.com/hc/en-ca/articles/360037446911-What-are-the-service-fees) · [Kanada kademeli fee pilotu](https://support-ca.rover.com/hc/en-ca/articles/46452793506836-New-ways-for-sitters-to-earn-more-with-repeat-clients) · [ABD kademeli fee](https://support.rover.com/hc/en-us/articles/49949645726228-New-ways-for-sitters-to-earn-more-with-repeat-clients) · [Is Rover free (CA$49)](https://support-ca.rover.com/hc/en-ca/articles/360036579152-Is-Rover-free) · [RoverProtect](https://www.rover.com/rover-protect/) · [Kanada Guarantee kapsamı](https://support-ca.rover.com/hc/en-ca/articles/360036961211-What-do-sitters-need-to-know-about-the-Rover-Guarantee) · [Guarantee Terms](https://www.rover.com/terms/guarantee/) · [Sıralama algoritması](https://www.rover.com/blog/sitter-resources/how-rover-search-works/) · [About Us](https://www.rover.com/ca/about-us/) · [Toronto fiyatları](https://www.rover.com/ca/blog/toronto-ca-dog-sitting-price/)

**Rover — finansal:** [SEC Q3 2023](https://www.sec.gov/Archives/edgar/data/1826018/000182601823000053/ex991_20231106.htm) · [Blackstone 2,3 milyar $](https://www.blackstone.com/news/press/rover-agrees-to-be-acquired-by-blackstone-in-2-3-billion-transaction/) · [GeekWire — CEO Blackstone sonrası](https://www.geekwire.com/2024/rover-ceo-on-companys-next-chapter-as-pet-sitting-giant-completes-2-3b-deal-with-blackstone/) · [GeekWire — Mad Paws](https://www.geekwire.com/2025/rover-to-acquire-australia-based-pet-sitting-marketplace-mad-paws/) · [GeekWire — Cat in a Flat](https://www.geekwire.com/2024/rover-acquires-cat-sitting-marketplace-to-further-expand-its-growth-across-europe/) · [GeekWire — DogVacay 2017](https://www.geekwire.com/2017/rover-acquires-dogvacay-biggest-competitor-online-dog-sitting-marketplace/) · [TechCrunch](https://techcrunch.com/2017/03/29/rover-dogvacay-merge/)

**Fee analizleri:** [Scritches](https://scritches.io/blog/rover-tiered-fees) · [Pupline](https://www.pupline.app/blog/how-much-does-rover-take) · [Tails](https://trytails.com/rover-tier-system/) · [Houndtrust](https://houndtrust.com/guides/rover-tiered-fees-explained) · [The Pet Sitter — Subscription vs commission](https://thepetsitter.co/en/blog/subscription-vs-commission-pet-platforms)

**Rakipler:** [Pawshake service fee](https://support.pawshake.com/hc/en-gb/articles/33949519870612-What-is-the-Pawshake-Service-Fee) · [PetBacker fees](https://www.petbacker.com/help-center/pet-service-providers/how-much-are-the-service-fees) · [Wag! Chapter 11](https://chapter11cases.com/blogs/news/pet-services-platform-wag-files-for-prepackaged-bankruptcy-secured-lender-to-take-ownership) · [Wag! Nasdaq delist](https://www.panabee.com/news/nasdaq-delists-wag-existing-equity-faces-cancellation-amid-bankruptcy) · [Gardinou fiyatlandırma](https://www.gardinou.ca/en/pricing-plans/list) · [Gardinou hakkında](https://www.gardinou.ca/en/post/canadian-pet-sitting-platform) · [TrustedHousesitters 2026](https://www.housesittersguide.com/trustedhousesitters-pricing-2026/) · [Hello Marshy](https://www.hellomarshy.com/blog/best-rover-alternative-canada) · [Petme Canada](https://petme.social/canada/dog-sitters) · [Spot Dog Walkers Toronto](https://www.spotdogwalkers.com/locations/toronto) · [Savvy New Canadians](https://www.savvynewcanadians.com/best-pet-sitting-apps-canada/) · [BetaKit — GoFetch](https://betakit.com/canadas-first-on-demand-dog-walking-app-is-here/)

**Pazar verileri:** [Grand View Research](https://www.grandviewresearch.com/horizon/outlook/pet-services-market/canada) · [Made in CA — sahiplik](https://madeinca.ca/pet-ownership-statistics-canada/) · [Made in CA — harcama](https://madeinca.ca/pet-spending-canada-statistics/) · [CAHI](https://cahi-icsa.ca/canadian-pet-population-survey) · [StatCan CMA 2025](https://www150.statcan.gc.ca/n1/daily-quotidien/260114/dq260114a-eng.htm) · [Statista CMA](https://www.statista.com/statistics/443749/canada-population-by-metropolitan-area/)

**Şikayetler:** [Trustpilot Kanada — Rover](https://ca.trustpilot.com/review/rover.com) · [Gizmodo — FTC 85 şikayet](https://gizmodo.com/10-horror-stories-about-the-dog-sitting-app-rover-1851411920) · [CBC Chilliwack](https://www.cbc.ca/news/canada/british-columbia/chilliwack-family-laments-leaving-puppy-with-rover-pet-sitter-after-dog-escapes-and-is-hit-by-car-1.5361456) · [Global News BC](https://globalnews.ca/news/6174606/b-c-dog-lost-pet-sitting-app/) · [CBC Edmonton](https://www.cbc.ca/news/canada/edmonton/buyer-beware-economist-says-after-edmonton-dog-owner-recounts-nightmare-with-sitter-1.6518582) · [CBC Hamilton](https://www.cbc.ca/news/canada/hamilton/dog-sitting-hamilton-dog-death-investigation-1.7244766)

**Cold start:** [Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-to-kickstart-and-scale-a-marketplace-2e5) · [Sharetribe — leakage önleme](https://www.sharetribe.com/academy/how-to-discourage-people-from-going-around-your-payment-system/) · [HBS Online](https://online.hbs.edu/blog/post/disintermediation) · [Management Science — Dog Eat Dog](https://pubsonline.informs.org/doi/10.1287/mnsc.2023.4675) · [Cold start — hangi taraf önce](https://internetmango.com/insights/marketplace-cold-start-strategy/)

---

**Doğrulanamayan / tahmin olarak işaretlenenler:** Rover'ın 2024-2026 gelir/GMV rakamları (Blackstone sonrası açıklanmıyor) · Rover'ın Kanada pazar payı · Kanada online pet-care penetrasyon oranı · Calgary/Edmonton/Ottawa CMA nüfus rakamları · minimum likidite eşiği (50-80 bakıcı) ve dönüşüm eşikleri · Toronto/Montréal pilot penceresi süresi · GoFetch'in kapanmış olduğu.
