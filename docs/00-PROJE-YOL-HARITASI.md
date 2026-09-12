# Kanada Evcil Hayvan Bakımı Pazaryeri — Proje Analizi ve Yol Haritası

**Sürüm:** 1.0 · **Tarih:** 12 Eylül 2026 · **Hazırlayan:** Claude (Cowork)
**Proje kodu:** `hayvanbakici`
**Kapsam:** Kanada'da Rover.com'a rakip, iki taraflı evcil hayvan bakımı pazaryeri — önce web, sonra mobil. Başarı halinde Türkiye ve diğer ülkeler.

> **Nasıl okunmalı:** Bu doküman ana plandır. Bölüm 1–3 *ne yapacağımızı ve neden*, Bölüm 4–7 *nasıl inşa edeceğimizi*, Bölüm 8–12 *ne zaman ve hangi sırayla* anlatır. Ayrıntılı araştırma raporları ekler klasöründedir (`docs/ek-*`).
>
> **Karar bekleyen maddeler** her bölümün sonunda `⏳ KARAR` etiketiyle işaretlidir. Bunları netleştirmeden bir sonraki faza geçmiyoruz.

---

## İÇİNDEKİLER

0. [Yönetici Özeti](#0-yönetici-özeti)
1. [Pazar ve Rakip Analizi](#1-pazar-ve-rakip-analizi)
2. [Stratejik Konumlandırma ve İş Modeli](#2-stratejik-konumlandırma-ve-iş-modeli)
3. [Marka: Ad, Ton ve Kimlik](#3-marka-ad-ton-ve-kimlik)
4. [Tasarım Sistemi ve Görsel Dil](#4-tasarım-sistemi-ve-görsel-dil)
5. [Ürün Kapsamı ve Kullanıcı Akışları](#5-ürün-kapsamı-ve-kullanıcı-akışları)
6. [Teknik Mimari](#6-teknik-mimari)
7. [SEO Stratejisi](#7-seo-stratejisi)
8. [Kanada Uyum ve Yasal Çerçeve](#8-kanada-uyum-ve-yasal-çerçeve)
9. [Pazara Giriş (Go-to-Market)](#9-pazara-giriş-go-to-market)
10. [Fazlı Yol Haritası ve Takvim](#10-fazlı-yol-haritası-ve-takvim)
11. [Bütçe ve Ekip](#11-bütçe-ve-ekip)
12. [KPI'lar, Riskler ve Sonraki Adımlar](#12-kpilar-riskler-ve-sonraki-adımlar)

---

## 0. YÖNETİCİ ÖZETİ

### 0.1 Tek cümlelik tez

> **Rover, Blackstone sahipliğinde komisyonunu %31'den %41'e çıkarıyor ve bunu yaparken "yeni müşteri edinmeyi" bakıcı için en pahalı şey haline getiriyor. Biz bunun tam tersini yapan, Kanada'da doğmuş, gerçek anlamda iki dilli ve bakıcıyı da koruyan bir platform kuruyoruz.**

### 0.2 Neden şimdi — 5 gerçek

| # | Bulgu | Kaynak |
|---|---|---|
| 1 | Rover 2026'da **kademeli komisyona** geçti: bir bakıcının yeni müşterisinde **%30** kesinti + müşteriden %11 → **toplam take rate %41**. Pilot Kanada'da Calgary, Vancouver, Ottawa, Québec City, Saskatoon, Regina, Nanaimo'da yürürlükte. | Rover CA Help Centre |
| 2 | **Toronto ve Montréal henüz pilotta değil.** Bu iki şehirdeki bakıcılar fiyat şokunu yaşamadı. Pilot oraya gelmeden bakıcı tabanını kapmak için tahminen **6–18 aylık bir pencere** var. | Rover CA Help Centre (tahmin: pencere süresi) |
| 3 | **Wag! Temmuz 2025'te iflas etti** (Chapter 11, Nasdaq'tan delist). On-demand + yüksek pazarlama harcamalı + düşük tekrar oranlı model bu sektörde çalışmıyor. Rover'ın tekrar rezervasyon oranı **%83**. | Chapter11Cases, SEC |
| 4 | **Kanada'da hane bazlı: %39 köpek, %37 kedi.** Non-medikal pet services pazarı ≈ **1,1 milyar CAD/yıl** ve en hızlı büyüyen segment (CAGR %9,2). | Made in CA, Grand View Research |
| 5 | **Québec'te kedi sahipliği %67, köpek %48.** Tüm platformlar köpek-first ve İngilizce-first. Bill 96 zaten Fransızca'yı **hukuki zorunluluk** yapıyor — rakiplerin çoğu bunu ciddiye almıyor. | Made in CA, Éducaloi |

### 0.3 Seçilen yol (onaylanan kararlar)

| Karar | Seçim |
|---|---|
| **Teknik yığın** | Next.js 15 (App Router) + Expo/React Native, Turborepo monorepo, TypeScript uçtan uca |
| **Ekip / bütçe** | Küçük ekip (1–3 kişi), yalın MVP, hazır servislerle hız öncelikli |
| **V1 hizmetleri** | Konaklama, Gezdirme, Evde Bakım, Günlük Ziyaret, Gündüz Bakımı, Eğitim, Tımar (7 hizmet — *aşamalı açılış önerisi §5.1'de*) |
| **Marka** | Henüz yok → §3'te 10 öneri + seçim kriterleri |
| **İlk pazar** | **Toronto (GTA)** — mahalle kümesi bazlı başlangıç · 2. şehir **Montréal** |

### 0.4 En kritik 8 karar (bu dokümanın özeti)

1. **Komisyon modeli ürünün kendisidir.** Platformun getirdiği müşteride %18, bakıcının kendi getirdiği müşteride **%0**. Bu tek karar aynı anda üç sorunu çözer: bakıcı edinimi, platform dışına kaçış (disintermediation) ve soğuk başlangıç talebi.
2. **Ölçek değil yoğunluk.** 3 mahallede %100 doluluk, 3 şehirde %10 doluluktan kat kat değerli. Rover–DogVacay birleşmesi (2017) bunun kanıtı: network etkisi bu sektörde **mahalle bazında yereldir**.
3. **Fransızca gün 1'de.** Bill 96 hukuki zorunluluk (ceza 3.000–30.000 CAD, tekrarda 3x) ve aynı zamanda en büyük SEO fırsatı. "Faz 2" değil.
4. **Veri Kanada'da.** Teknik zorunluluk yok ama Québec Law 25'in sınır ötesi transfer (PIA) yükünü ciddi azaltır ve pazarlama avantajı sağlar. `ca-central-1` / `northamerica-northeast1`.
5. **Filtreli aramayı robots.txt'de engelle** (Rover modeli). Tüm SEO değerini statik landing sayfalarında topla. Faceted navigation, Google'a bildirilen tarama sorunlarının %50'sinin kaynağı.
6. **Arz eşiği kuralını koda göm.** `<3 bakıcı = noindex`, `0 bakıcı = sayfa yok`. Thin content/doorway cezasına karşı tek gerçek savunma.
7. **Bakıcıyı da koru.** Hiçbir rakip bakıcının kendi evine/eşyasına/sağlığına karşı koruma vermiyor. Düşük maliyetli, yüksek algılanan değerli farklılaştırıcı.
8. **Web ve mobil aynı anda tasarlanır, sırayla yayınlanır.** Design token'lar ve API sözleşmesi gün 1'de paylaşımlı; mobil uygulama 8. aydan itibaren aynı çekirdek üzerine kurulur, sıfırdan yeniden yazılmaz.

---

## 1. PAZAR VE RAKİP ANALİZİ

### 1.1 Pazar büyüklüğü

| Metrik | Değer | Yıl |
|---|---|---|
| En az bir evcil hayvanı olan Kanada hanesi | **%80** | 2024 |
| Toplam evcil hayvan popülasyonu | **29,4 milyon** | 2024 |
| Köpek sahibi hane / Kedi sahibi hane | **%39 / %37** | 2024 |
| Kanada pet services pazarı | **3,06 milyar USD** | 2024 |
| → Non-medikal (bizim pazarımız) | **~815 M USD ≈ 1,1 milyar CAD** | 2024 *(hesap)* |
| Pazar CAGR (2025–2033) | **%9,2** | — |
| Köpek başına yıllık harcama | ~3.020 CAD | 2024 |

**TAM / SAM / SOM tahmini:**

```
TAM  Kanada non-medikal pet services            ≈ 1,10 milyar CAD/yıl
SAM  Online pazaryerlerinden geçen kısım (%15-25) ≈ 165–275 M CAD GMV
     └ Rover'ın Kanada payı (tahmin)              ≈ 120–180 M CAD
SOM  3 yılda ulaşılabilir hedef                   ≈ 20–40 M CAD GMV
     └ %18 net take rate ile gelir                ≈ 3,6–7,2 M CAD/yıl
```

> ⚠️ SAM ve SOM tahmindir. Rover Blackstone satın alması (Şub 2024) sonrası finansal açıklama yapmıyor.

### 1.2 Hedef şehirler — öncelik sırası

| Sıra | CMA | Nüfus (≈2025) | Yıllık büyüme | Pet profili | Gerekçe |
|---|---|---|---|---|---|
| **1** | **Toronto (GTA)** | ~7,1 M | ~%0,0 | Dengeli, kondo yoğun | En büyük pazar · **Rover pilotu dışında** |
| **2** | **Montréal** | ~4,5 M | ~%0,6 | **Kedi %67** · FR-first | **Rover pilotu dışında** · dil + kedi çifte boşluk |
| 3 | Vancouver | ~3,0 M | ~%0,3 | Köpek ağırlıklı, yüksek gelir | Rover pilotunda → bakıcı hoşnutsuzluğu taze |
| 4 | Calgary | ~1,7 M | **%2,9** | Köpek ağırlıklı | En hızlı büyüyen · Rover pilotunda |
| 5 | Edmonton | ~1,5 M | **%3,0** | Köpek ağırlıklı | Hızlı büyüyor · Rover pilotu dışında |
| 6 | Ottawa-Gatineau | ~1,5 M | ~%1,5 | İki dilli | FR/EN altyapımızı test etmek için ideal |

**Toronto başlangıç mahalle kümesi (öneri):** Liberty Village, Leslieville, The Junction, The Annex, Riverside — yüksek kondo + köpek yoğunluğu, yürüme mesafesi kültürü.

### 1.3 Rakip haritası

| Platform | Bakıcı kesintisi | Müşteri ücreti | Toplam take rate | Kanada varlığı | Notlar |
|---|---|---|---|---|---|
| **Rover** (standart) | %20 | %11 (cap CA$65) | **~%31** | **Lider (~%60-75 tahmini)** | CA$49 giriş ücreti |
| **Rover** (Tier 1 — yeni müşteri) | **%30** | %11 | **~%41** | 7 CA şehrinde pilot | Toronto/Montréal hariç |
| Rover (Tier 3 — $1.000+ sonrası) | %10 | %11 | ~%21 | | |
| Pawshake | ~%15 | açıklanmıyor | ~%20-25 | 2 numara (~%5-10) | Ücret şeffaflığı yok, likidite düşük |
| PetBacker | %15–25 (yeni: %25) | var | ~%30+ | %1'in altı | Platform dışına çıkanı **%40 komisyonla** cezalandırıyor |
| **Wag!** | — | — | — | **Yok — iflas etti (Tem 2025)** | Model dersi |
| **Gardinou** (QC) | **%0** | %0 | Abonelik CA$155/yıl | Montréal'de niş | **Ödeme akışı yok → sigorta/escrow yok** |
| **Hello Marshy** (GTA) | %12 (ücretsiz plan) / %0 (üyelik) | **%0** | %0–12 | GTA | En yakın tehdit profili |
| Petme | ~%10 | %0 + cashback | ~%10 | 30+ CA şehri | $22.000 koruma planı iddiası |
| Spot Dog Walkers | — (kendi ekibi) | — | — | Toronto, Vancouver | Dragons' Den yatırımlı · birebir yürüyüş konumlandırması |
| TrustedHousesitters | yok | yok | ~$100-340/yıl üyelik | Global | Farklı kategori — sadece uzun tatilde çakışır |

### 1.4 Rakip zayıflıkları → bizim fırsat listemiz

Rover'ın Trustpilot puanı **4,5/5 (35.293 yorum)** ama %7'si 1 yıldız — ve o 1 yıldızların neredeyse tamamı **bakıcılarla değil platformla** ilgili. Yani: **bakıcılar iyi, platform kötü.** Aynı arz havuzunu daha iyi bir platformla sunmak mümkün.

| # | Boşluk | Kanıt | Ürün cevabımız |
|---|---|---|---|
| 1 | **Yeni müşteri edinimi cezalandırılıyor** | Rover Tier 1 = %30 | Tersine çevir: bakıcının kendi getirdiği müşteride **%0** |
| 2 | **Tekrar rezervasyonda platform değer katmıyor** | %83 tekrar oranı | Tekrarda düşük komisyon + gerçek işletme araçları (takvim, fatura, CRM, vergi özeti) |
| 3 | **Garanti teoride var, pratikte ödemiyor** | FTC'ye 4 yılda 85 Rover şikayeti; belgelenmiş red vakaları | **SLA'lı tazminat:** 48 saatte karar, red halinde yazılı gerekçe |
| 4 | **Bakıcı hiç korunmuyor** | Rover Guarantee bakıcının evine/eşyasına/sağlığına gelen zararı kapsamıyor | Bakıcı tarafı mülk + kaza koruması — **hiçbir rakipte yok** |
| 5 | **Aşı/sağlık doğrulaması zorunlu değil** | Trustpilot'ta tekrarlayan şikayet | Zorunlu aşı kaydı + veteriner doğrulama |
| 6 | **Destek AI'da tıkalı** | Trustpilot #1 negatif tema | Kanada saat diliminde insan destek; olay anında telefon |
| 7 | **Québec/FR ihmal edilmiş + kedi ağırlıklı pazar** | QC kedi %67 · tüm platformlar köpek/EN-first | FR-first Montréal lansmanı + kedi bakımına özel ürün akışı |
| 8 | **Sıralama algoritması kara kutu** | Rover: "sabit sıralama yok" | Şeffaf sıralama skoru — bakıcı puanını ve nasıl yükselteceğini görür |
| 9 | **Son dakika iptali cezasız** | Trustpilot + rakip pazarlama iddiaları | Sert iptal politikası + **yedek bakıcı garantisi** |
| 10 | **CA$49 peşin giriş ücreti** | Rover Kanada | Ücretsiz giriş; background check maliyetini ilk rezervasyondan karşıla |

### 1.5 Kritik ders: Rover–DogVacay ve Wag!

- **2017, Rover + DogVacay birleşmesi:** İki iyi finanse edilmiş oyuncu (91,5 M$ vs ~50 M$) aynı şehirlerde savaşınca **ikisi de likidite kuramadı** ve birleşmek zorunda kaldılar. → *Network etkisi ulusal değil, şehir/mahalle bazında yereldir.*
- **2025, Wag! iflası:** 2024 geliri 70,5 M$ (-%16), üst üste net zararlar, 16 potansiyel alıcı bulunamadı. On-demand + yüksek CAC + düşük tekrar = ölüm. → *Tekrarı sahiplenen kazanır.*

**⏳ KARAR:** Başlangıç şehri ve mahalle kümesi onayı. (Öneri: Toronto, yukarıdaki 5 mahalle.)

---

## 2. STRATEJİK KONUMLANDIRMA VE İŞ MODELİ

### 2.1 Konumlandırma cümlesi

> **"Kanada'nın kendi evcil hayvan bakım platformu. Bakıcınıza en çok, size en iyi hizmeti veren."**
>
> FR: *« La plateforme de garde d'animaux d'ici. Plus pour les gardiens, mieux pour vous. »*

Üç sütun:
1. **Adil ekonomi** — Bakıcı daha çok kazanır, müşteri daha az öder, ikisi de bunu şeffaf görür.
2. **Gerçek koruma** — Sadece hayvan değil, bakıcı ve ev de korunur; tazminat SLA'lıdır.
3. **Buranın platformu** — Kanada verisi, Kanada desteği, gerçek Québec Fransızcası, Kanada sigortası.

### 2.2 Komisyon modeli — projenin kalbi

Bu, ürünün en önemli tasarım kararıdır. Rover'ın yapısal zaafını doğrudan hedefler.

| Senaryo | Bakıcı kesintisi | Müşteri ücreti | Toplam take rate | Rover karşılığı |
|---|---|---|---|---|
| **Platform getirdi** (arama/keşiften gelen yeni müşteri) | **%18** | **%7** (cap CA$45) | **%25** | %31 (Tier 1'de %41) |
| **Bakıcı getirdi** (kendi davet linki/kodu) | **%0** | **%7** | **%7** | %31–41 |
| **Tekrar rezervasyon** (aynı bakıcı × aynı müşteri, 2.+ kez) | **%10** | **%7** | **%17** | %31 (Tier 3'te %21) |
| Bahşiş | %0 | — | %0 | %0 |
| Giriş ücreti | **CA$0** | — | — | CA$49 |

**Neden bu işe yarar:**

- **Bakıcı edinimi:** "Kendi müşterilerinizi getirin, onlardan hiç komisyon almıyoruz" — Gardinou'nun CA$155/yıl abonelik teklifinden bile agresif, ama biz ödeme akışını, sigortayı ve escrow'u koruyoruz.
- **Soğuk başlangıç talebi:** 50 bakıcı × ortalama 20 mevcut müşteri = **1.000 hazır müşteri, CAC ≈ 0**.
- **Disintermediation:** Bakıcının platformdan çıkması için ekonomik sebep kalmıyor; çıkarsa ödeme koruması, sigorta, takvim, otomatik fatura ve CRA vergi özetini kaybediyor. **Cezayla değil, hizalamayla çözüm.**
- **Rover kopyalayamaz:** Ana gelir kalemini kanibalize etmek zorunda kalır (Innovator's Dilemma).

**Gelir kalemleri:**

| Kalem | Faz | Not |
|---|---|---|
| İşlem komisyonu | 1 | Ana gelir |
| Bakıcı Pro aboneliği (CA$19/ay) | 2 | Öne çıkan profil, gelişmiş takvim, çoklu hizmet, muhasebe dışa aktarımı |
| Koruma planı marjı | 2 | Sigorta ortağıyla gelir paylaşımı |
| Kurumsal / işveren yan hakkı paketi | 3 | Şirketlere çalışan avantajı olarak pet bakım kredisi |
| Affiliate (sigorta, mama, veteriner) | 3 | Düşük öncelik, marka riskine dikkat |

> ⚠️ **Yasal not:** Fiyatı bakıcı belirlemeli, platform sadece aralık önermeli. Bu hem bağımsız yüklenici sınıflandırması (CRA testi) hem GST/HST "acente vs asıl" ayrımı için kritik. Bkz. §8.3.

### 2.3 Rekabet hendeği (moat)

Kısa vadede hendeğimiz yok — o yüzden hız ve yoğunluk her şey. Orta vadede birikenler:

1. **Mahalle yoğunluğu** — bir mahallede 80 bakıcı, ulusal 8.000 bakıcıdan değerli
2. **Yorum arşivi** — taklit edilemez, SEO'da ve güvende bileşik getiri sağlar
3. **Fiyat/talep verisi** — şehir sayfalarının %40'ını benzersiz yapan şey; ayrıca digital PR yakıtı
4. **Bakıcı ekonomisi bağımlılığı** — takvim, fatura, CRA özeti, müşteri CRM'i platformda yaşar
5. **FR-CA içerik derinliği** — Bill 96 zorunluluğunu rekabet avantajına çevirmek

**⏳ KARAR:** Komisyon oranları (%18/%0/%10 ve müşteri %7) onayı. Bu, finansal modelin tüm girdisidir.

---

## 3. MARKA: AD, TON VE KİMLİK

### 3.1 Ad seçim kriterleri (Kanada'ya özel)

| Kriter | Neden |
|---|---|
| İngilizce ve Fransızca'da **aynı şekilde çalışmalı** | Bill 96 · Québec pazarı |
| Fransızca'da olumsuz/komik çağrışım olmamalı | OQLF + marka riski |
| **`.ca` ve `.com` müsait** olmalı | `.ca` Kanadalı güven sinyali (CIRA) |
| 2 hece, ≤ 8 harf tercih | Sözlü tavsiye (word of mouth) bu sektörde büyümenin %50'si |
| **CIPO'da tescil edilebilir** olmalı | Bill 96 ticari marka istisnasından yararlanmak için **tescil şart** |
| Jenerik/tanımlayıcı kelime içermemeli | Tescil edilemez + Bill 96'da Fransızca'ya çevrilmesi gerekir |
| Türkiye'ye taşınabilir olmalı | Faz 4 |

### 3.2 Ad önerileri

**A Grubu — Fransızca-yerli, premium (en güçlü)**

| Ad | Anlam / gerekçe | Risk |
|---|---|---|
| **Havre** | FR "sığınak, liman". EN'de de okunur. Sıcak, premium, Québec'te doğal. `havre.ca` | Jenerik kelime → tescil zor olabilir; `Havre Pet` gibi bileşik gerekebilir |
| **Foyer** | FR/EN "ocak, yuva". Bilingual doğuştan. | EN'de "lobi" anlamı kafa karıştırabilir |
| **Câline** | FR "sarılmacı, sevecen". Québec'te çok sıcak. | EN telaffuz zorluğu |

**B Grubu — Nötr, modern, ölçeklenebilir**

| Ad | Anlam / gerekçe | Risk |
|---|---|---|
| **Nuzzle** | EN "burnuyla sokulmak". Sıcak, fiil gibi, premium. `nuzzle.ca` / `getnuzzle.ca` | FR'de anlamsız (ama olumsuz da değil) |
| **Lupa** | Latince "dişi kurt". Kısa, EN/FR/TR üçünde de sorunsuz okunur. Türkiye'ye taşınır. | Anlam şeffaf değil → marka yatırımı gerekir |
| **Tamo** | Uydurma, yumuşak, global. 4 harf. | Anlam yok |
| **Kindred** | EN "ruh akrabası". Güven odaklı, premium. | FR'de anlamsız, uzun |

**C Grubu — Kanada kimliği vurgulu**

| Ad | Anlam / gerekçe | Risk |
|---|---|---|
| **Maplepaw** | Hiper-Kanadalı. Amerikan Rover'a karşı net konumlandırma. | FR karşılığı zayıf; klişe riski |
| **Boréal** | FR/EN "kuzey ormanı". Premium, Kanadalı, iki dilde çalışır. | Bazı sektörlerde kullanılıyor |
| **Nook** | EN "sıcak köşe". `Book a nook` sloganı güçlü. | Marka çakışması riski yüksek (kontrol edilmeli) |

### 3.3 İlk 3 önerim

1. **Havre** — Québec'te doğal, İngilizce'de zarif, "sığınak" anlamı ürünle birebir örtüşüyor. Bill 96 açısından en güvenli. Tescil için `Havre` + ayırt edici bir ek (ör. *Havre Pet Care*) gerekebilir.
2. **Nuzzle** — En "premium startup" hissi veren, en akılda kalıcı. FR pazarda anlam taşımasa da olumsuz çağrışım yok; Québec'te İngilizce marka adları yaygın.
3. **Lupa** — Türkiye/global genişleme düşünülüyorsa en taşınabilir olan. Üç dilde de aynı okunur.

### 3.4 Marka sesi

| Boyut | Bizim tarafımız | Karşı uç |
|---|---|---|
| Ton | Sakin, güven veren, yetişkin | Cıvık, emoji dolu, "pawsome" kelime oyunları |
| Dil | Açık ve dürüst — ücretler önce söylenir | Küçük yazıya saklanan ücretler |
| Görsel | Sıcak, gerçek fotoğraf, mimari sadelik | Stok fotoğraf, çizgi film maskot |
| Vaat | Ölçülebilir ("48 saatte karar") | Muğlak ("gönül rahatlığı") |

> **Not:** "Pawsome", "fur baby", "pawrent" gibi kelime oyunlarından kaçınıyoruz. Premium algı bunu kaldırmıyor ve Fransızca'ya çevrilemiyor.

### 3.5 Yapılacaklar

- [ ] Shortlist için **CIPO marka taraması** (Canadian Trademarks Database) + ABD USPTO ön kontrol
- [ ] `.ca`, `.com`, `.app` domain müsaitliği + sosyal medya handle kontrolü
- [ ] Québec'te ana dil konuşan 5 kişiyle ad testi (telaffuz, çağrışım)
- [ ] Seçilen adı **CIPO'da tescil başvurusu** (Bill 96 istisnası için tescil şart)
- [ ] Logo + kimlik: kelime markası (wordmark) öncelikli, ikinci olarak sadeleştirilmiş sembol

**⏳ KARAR:** Marka adı seçimi. Bu, domain, tasarım sistemi ve tüm içerik üretiminin önkoşulu.

---

## 4. TASARIM SİSTEMİ VE GÖRSEL DİL

### 4.1 Tasarım tezi

Rover **"neşeli ve erişilebilir"** — beyaz zemin, canlı yeşil, çok sayıda köpek fotoğrafı, yuvarlak her şey. Bu 2014 estetiği ve artık ucuz hissettiriyor.

Biz **"sakin lüks"** hedefliyoruz: Airbnb'nin mekân hissi + Monzo'nun finansal netliği + bir butik otelin sıcaklığı. Kullanıcı "bu platform ciddi bir iş yapıyor" hissi almalı, çünkü sattığımız şey **güven**.

**Beş tasarım ilkesi:**

1. **Sıcak nötr zemin, soğuk beyaz değil.** Ekran bir ev gibi hissettirmeli, bir gösterge paneli gibi değil.
2. **Fotoğraf kahraman, illüstrasyon değil.** Gerçek bakıcılar, gerçek evler, gerçek hayvanlar. Stok fotoğraf yasak.
3. **Tipografi hiyerarşiyi taşır, renk değil.** Renk sadece eylem ve durum için.
4. **Her fiyat tam gösterilir.** Drip pricing hem yasak (Competition Act) hem marka ihaneti.
5. **Hareket bilgi taşır.** Dekoratif animasyon yok; geçişler nedensellik anlatır.

### 4.2 Renk paleti

```
/* Temel — sıcak nötr omurga */
--canvas          #FBF8F4   Ana zemin (sıcak kırık beyaz)
--surface         #FFFFFF   Kart/panel
--surface-sunken  #F3EEE7   İkincil zemin, input
--border          #E7DFD4   Ayırıcı
--border-strong   #D3C8B8

/* Mürekkep — metin */
--ink             #1A1714   Başlık, birincil metin
--ink-secondary   #5C544C   Gövde
--ink-muted       #8A8078   Yardımcı, meta

/* Birincil — "Pine": güven, doğa, Kanada; Rover yeşilinden belirgin farklı */
--primary-50      #EEF5F1
--primary-100     #D3E5DA
--primary-300     #7FB39B
--primary-500     #2F6B52   ← ana marka rengi
--primary-600     #255743   Hover
--primary-700     #1B412F   Basılı
--primary-900     #0E2419

/* Aksan — "Ember": sıcaklık, CTA vurgusu, bahşiş/kutlama */
--accent-100      #FCEBD6
--accent-500      #D9803A
--accent-600      #BE6A2A

/* Durum */
--success-500     #2E7D4F
--warning-500     #C8860D
--danger-500      #B23A2E
--info-500        #2C5F8A

/* Güven rozetleri — bilinçli olarak marka renginden ayrı */
--verify-id       #2C5F8A   Kimlik doğrulandı
--verify-check    #2F6B52   Adli sicil temiz
--verify-insured  #6B4E9E   Sigortalı / lisanslı
--verify-pro      #B8892B   Sertifikalı Pro
```

**Koyu tema (gün 1'den):**
```
--canvas #121110 · --surface #1C1A18 · --surface-sunken #242119
--ink #F5F1EB · --border #322E29 · --primary-500 #4E9B79
```

> **Erişilebilirlik:** Tüm metin/zemin çiftleri **WCAG 2.2 AA** (normal metin 4.5:1, büyük metin 3:1). `--primary-500` beyaz üzerinde 5.8:1 — CTA butonları için güvenli. Renk asla tek bilgi taşıyıcısı değil (rozetlerde ikon + metin birlikte).

### 4.3 Tipografi

| Rol | Font | Kullanım |
|---|---|---|
| **Görüntü / Başlık** | **Fraunces** (variable, opsz + SOFT ekseni) | H1–H2, hero, fiyat rakamları. Sıcak, editöryel, premium — jenerik sans'tan ayrışır |
| **Arayüz / Gövde** | **Inter** (variable) | Her şey. Yüksek okunabilirlik, geniş dil desteği (FR aksanları, ileride TR) |
| **Sayısal** | Inter `tabular-nums` | Fiyat, tarih, sayaç — zıplamayı önler |

**Ölçek (1.25 majör üçlü, 16px taban):**

```
display   48 / 52   Fraunces 600   letter-spacing -0.02em
h1        36 / 42   Fraunces 600   -0.015em
h2        28 / 34   Fraunces 600   -0.01em
h3        22 / 28   Inter 600
h4        18 / 26   Inter 600
body-lg   17 / 27   Inter 400
body      15 / 24   Inter 400
body-sm   13 / 20   Inter 400
caption   12 / 16   Inter 500   +0.01em
```

> ⚠️ **Fransızca uyarısı:** FR metin EN'e göre ortalama **%15–20 daha uzun**. Tüm bileşenler (buton, kart başlığı, sekme, rozet) **iki satıra taşmayı** kaldırmalı. Tasarım dosyalarında her bileşenin FR varyantı zorunlu. Sabit genişlikli buton kullanmayın.

### 4.4 Uzay, köşe, gölge, hareket

```
/* Uzay — 4px taban */
space: 2 4 8 12 16 20 24 32 40 48 64 80 96 128

/* Köşe yarıçapı — yumuşak ama çocuksu değil */
radius-sm   6px    Rozet, etiket
radius-md   10px   Buton, input
radius-lg   16px   Kart
radius-xl   24px   Modal, bölüm kapsayıcı
radius-full 999px  Avatar, pill

/* Gölge — çok hafif, sıcak tonlu (siyah değil) */
shadow-sm  0 1px 2px rgba(26,23,20,.05)
shadow-md  0 4px 12px rgba(26,23,20,.07)
shadow-lg  0 12px 32px rgba(26,23,20,.10)
shadow-xl  0 24px 64px rgba(26,23,20,.12)

/* Hareket */
duration: 120ms (mikro) · 200ms (standart) · 320ms (giriş/çıkış)
easing:   cubic-bezier(.2,.8,.2,1)   ← standart
          cubic-bezier(.4,0,.2,1)     ← çıkış
prefers-reduced-motion: tüm geçişler 0ms'e düşer (zorunlu)
```

### 4.5 Bileşen kütüphanesi (V1)

| Kategori | Bileşenler |
|---|---|
| **Temel** | Button (primary/secondary/ghost/danger × 3 boyut), Input, Select, Textarea, Checkbox, Radio, Switch, DatePicker, DateRangePicker, Stepper |
| **Görüntüleme** | Card, SitterCard, Avatar, AvatarGroup, Badge, VerificationBadge, Rating, PriceTag, Tag, EmptyState, Skeleton |
| **Gezinme** | Header, MobileNav, Breadcrumb, Tabs, Pagination, Stepper (çok adımlı form) |
| **Geri bildirim** | Toast, Alert, Modal, Sheet (mobil bottom sheet), Tooltip, Popover, ConfirmDialog |
| **Alan-özgü** | SearchBar (hizmet + konum + tarih + hayvan), FilterPanel, MapPin & MapCluster, BookingSummary, PriceBreakdown, MessageBubble, PhotoUpdateCard, CalendarGrid, PetProfileCard, ReviewCard, PayoutRow |

**Paylaşım stratejisi (web ↔ mobil):**
```
packages/tokens     → Tek kaynak. JSON → CSS değişkenleri (web) + TS objesi (Expo)
packages/ui         → Web bileşenleri (React + Tailwind + Radix primitives)
packages/ui-native  → Mobil bileşenler (React Native + Unistyles/NativeWind)
```
Bileşen **kodu** paylaşılmaz (web ve native farklı primitifler), ama **token'lar, tipler, iş mantığı ve API istemcisi** paylaşılır. Bu, "React Native for Web" tuzağına düşmeden görsel tutarlılığı garanti eder.

### 4.6 Ekran bazlı tasarım yönü (öne çıkanlar)

**Ana sayfa**
- Hero: tam genişlik, gerçek bir Toronto evinde köpekle bakıcı fotoğrafı, üstte cam efektli (frosted) arama kartı
- Arama kartı alanları: **Hizmet · Konum · Tarih aralığı · Hayvan türü/boyu**
- Hero altında hemen **canlı güven şeridi**: "Toronto'da 247 doğrulanmış bakıcı · Medyan $50/gece · 3.412 tamamlanmış rezervasyon" — gerçek veri, sayaç animasyonu yok
- "Nasıl çalışır" 3 adım · "Koruma" bölümü rakamlarla · Bakıcı hikâyeleri · Bakıcı olma CTA'sı
- **Fiyat şeffaflığı bölümü** — komisyon tablosunu açıkça yayınla. Bu, rakip karşısında en güçlü pazarlama hamlesi.

**Arama sonuçları**
- Masaüstü: sol liste (%58) + sağ yapışkan harita (%42). Mobil: liste öncelikli + "Harita" geçiş butonu
- SitterCard: fotoğraf (4:3), ad + mahalle, tam fiyat (`$52/gece · tüm ücretler dahil`), puan + yorum sayısı, 2–3 rozet, yanıt süresi, "Tekrar müşterisi: 6"
- Filtre paneli: sheet (mobil) / yan panel (masaüstü). **URL'ye yazılır ama `robots.txt`'de engellenir** (§7.4)

**Bakıcı profili**
- Fotoğraf galerisi (evinden gerçek kareler — bu Rover'da zayıf)
- Doğrulama listesi: her rozet **ne anlama geldiğini** açan popover'la
- Takvim (müsaitlik), fiyat tablosu, hizmet listesi
- Yorumlar — ilk 12'si SSR ile HTML'de (SEO + AI görünürlüğü için kritik)
- Yapışkan rezervasyon kartı: fiyat dökümü **baştan tam** açık

**Rezervasyon akışı** (4 adım, ilerleme çubuğu)
`Hizmet & tarih → Hayvan bilgisi → Talimatlar & Meet&Greet → Ödeme onayı`
- Her adımda **tam fiyat dökümü** yanda görünür
- Son ekran yazdırılabilir/PDF özet (Québec CPA zorunluluğu)

**Bakıcı paneli**
- Kazanç kartı: bu ay, bekleyen ödeme, komisyon dökümü (**hangi rezervasyonda ne kadar ve neden**)
- Takvim, talep kutusu, mesajlar, müşteri listesi (CRM)
- **"Kendi müşterimi davet et"** — %0 komisyon linki, büyük ve öne çıkan
- Yıllık vergi özeti (CRA Part XX kopyası + kendi beyanı için döküm)

**Mobil uygulama farkları**
- Tek elle kullanım: birincil eylemler alt %40'ta
- Gezdirme sırasında **canlı GPS rotası** + fotoğraf/video check-in — bu, mobilin *var oluş sebebi* ve web'de yapılamaz
- Push: rezervasyon durumu, mesaj, check-in hatırlatması, ödeme
- Biyometrik giriş, Apple/Google Pay tek dokunuş

### 4.7 Erişilebilirlik hedefi

**WCAG 2.2 Level AA** — Ontario AODA teknik olarak 2.0 AA istiyor ama 2.2'ye çıkmanın ek maliyeti düşük, tüm eyaletleri ve ileri tarihli güncellemeleri kapsıyor, mobil kriterleri (target size ≥24px, dragging alternatives) zaten içinde.

- CI'da `axe-core` + Lighthouse a11y eşiği (≥95)
- Yılda 1 manuel denetim (klavye + ekran okuyucu: NVDA, VoiceOver)
- `/erisilebilirlik` (EN+FR) beyan sayfası

**⏳ KARAR:** Palet ve tipografi yönü onayı. Onay sonrası Figma'da 12 çekirdek ekran + bileşen kütüphanesi üretilir.

---

## 5. ÜRÜN KAPSAMI VE KULLANICI AKIŞLARI

### 5.1 Hizmet tipleri — kademeli açılış önerisi

Yedi hizmetin tamamını seçtiniz. **Veri modeli ve arayüz gün 1'de yedisini de destekleyecek**, ama 1–3 kişilik bir ekiple hepsini aynı anda *canlıya almak* likiditeyi böler ve her birinin kendine has operasyonel yükü vardır (eğitim ve tımar'da fiyatlandırma ve süre mantığı tamamen farklıdır).

| Hizmet | V1 (Ay 5) | V1.5 (Ay 7) | V2 (Ay 10+) | Gerekçe |
|---|---|---|---|---|
| **Konaklama** (bakıcı evinde) | ✅ | | | En yüksek sepet, Rover'ın ana geliri |
| **Köpek Gezdirme** | ✅ | | | En yüksek frekans, tekrar motoru |
| **Günlük Ziyaret** (drop-in) | ✅ | | | Kedi sahipleri için kritik — Montréal hazırlığı |
| **Evde Bakım** (house sitting) | ✅ | | | Konaklama ile aynı altyapı |
| **Gündüz Bakımı** (daycare) | | ✅ | | Kanada'da arama hacmi boarding'den **yüksek** — gecikmemeli |
| **Eğitim** | | | ✅ | Farklı fiyat/süre modeli, sertifika doğrulaması gerekir |
| **Tımar** (grooming) | | | ✅ | Genelde fiziksel salon; farklı arz tipi |

> **Not:** Gündüz bakımı SEO açısından sürpriz derecede değerli — `dog daycare toronto` tahmini aylık 2.900–6.600, `dog boarding toronto`'nun (1.900–3.600) üstünde. V1.5'te mutlaka açılmalı.

**⏳ KARAR:** Bu kademelendirmeyi onaylıyor musunuz, yoksa 7'si de V1'de mi olsun?

### 5.2 V1 özellik listesi

**Pet sahibi (owner)**
- [ ] Kayıt / giriş (e-posta + Google + Apple)
- [ ] Hayvan profili (tür, ırk, yaş, kilo, ilaç, davranış notu, **aşı kaydı yükleme**, veteriner bilgisi, acil durum kişisi)
- [ ] Arama: hizmet + konum (adres/posta kodu) + tarih + hayvan filtresi
- [ ] Filtreler: fiyat, mesafe, ev tipi (bahçeli/apartman), diğer hayvan var mı, kabul edilen boyut, rozet seviyesi, yanıt süresi
- [ ] Harita görünümü (yaklaşık konum — tam adres rezervasyon onayına kadar gizli)
- [ ] Bakıcı profili + takvim + yorumlar
- [ ] **Meet & Greet talebi** (ücretsiz ön tanışma) — güven için kritik, Rover'da zayıf
- [ ] Rezervasyon talebi → bakıcı onayı → ödeme
- [ ] Mesajlaşma (iletişim bilgisi maskeleme ile)
- [ ] Rezervasyon sırasında **fotoğraf/video güncellemeleri** akışı
- [ ] Değişiklik / iptal (politikaya göre iade hesabı)
- [ ] Yorum yazma (yalnızca tamamlanmış rezervasyon sonrası)
- [ ] Ödeme yöntemleri, fatura geçmişi
- [ ] Olay bildirimi / destek talebi

**Bakıcı (sitter)**
- [ ] Başvuru akışı: profil, hizmetler, fiyat, müsaitlik, ev/ortam fotoğrafları, deneyim
- [ ] **Kimlik doğrulama** (biyometrik) → **adli sicil kontrolü** → rozet seviyesi
- [ ] Belge yükleme: belediye izni, sigorta poliçesi, sertifikalar
- [ ] Takvim yönetimi (blok, tekrarlayan müsaitlik, tatil modu)
- [ ] Talep kutusu: kabul / ret / karşı teklif
- [ ] Kazanç paneli + komisyon dökümü + payout geçmişi
- [ ] **"Kendi müşterimi davet et"** — kişisel link/QR, %0 komisyon
- [ ] Müşteri listesi (basit CRM: not, son rezervasyon, tekrar oranı)
- [ ] Check-in / check-out + fotoğraf + GPS (gezdirme)
- [ ] Vergi özeti ve yıllık kazanç dökümü
- [ ] Şeffaf sıralama skoru ("profilinizi nasıl yükseltirsiniz")

**Platform / admin**
- [ ] Bakıcı onay kuyruğu (manuel inceleme + Québec için insan kararı zorunlu — Law 25 s.12.1)
- [ ] Rezervasyon ve ödeme yönetimi, iade/ihtilaf
- [ ] Olay (incident) yönetimi ve tazminat talebi iş akışı — **48 saat SLA**
- [ ] İçerik yönetimi: şehir sayfaları, blog, SSS (EN+FR)
- [ ] Arz eşiği izleme paneli (hangi şehir/mahalle indekslenebilir durumda)
- [ ] CRA Part XX raporlama dışa aktarımı
- [ ] Moderasyon: yorum, mesaj, profil

### 5.3 Kritik akış: Rezervasyon durum makinesi

```
  TASLAK
    │ owner talep gönderir
    ▼
  TALEP_GONDERILDI ──(bakıcı reddeder)──► REDDEDILDI
    │                    │
    │                    └(36 saat yanıt yok)──► SURESI_DOLDU
    │ bakıcı kabul eder
    ▼
  ONAYLANDI  ◄──(karşı teklif kabul)── KARSI_TEKLIF
    │ ödeme çekilir (authorize + capture)
    ▼
  ODENDI ──(iptal: politikaya göre iade)──► IPTAL_EDILDI
    │ hizmet başlangıç tarihi
    ▼
  DEVAM_EDIYOR  (check-in/check-out, foto akışı)
    │ hizmet bitişi
    ▼
  TAMAMLANDI
    │ +48 saat ihtilaf penceresi
    ▼
  ODEME_SERBEST ──► bakıcıya transfer
    │
    └─(ihtilaf açılırsa)──► IHTILAF ──► COZULDU / IADE_EDILDI
```

**Kurallar:**
- Ödeme **hizmet bitiminden 48 saat sonra** serbest bırakılır (Stripe manuel payout; Kanada'da azami tutma süresi 90 gün — bolca içindeyiz)
- Kullanıcıya asla **"escrow"** demiyoruz → "ödemeniz hizmet tamamlanana kadar güvende tutulur" (FINTRAC/MSB kapsamına girmemek için — §8.4)
- İptal politikası bakıcı tarafından 3 şablondan seçilir: Esnek / Orta / Sıkı. Hepsi checkout'ta açıkça gösterilir.

### 5.4 Güven ve güvenlik akışı

**Kademeli rozet sistemi:**

| Seviye | Rozet | Gereksinim | Maliyet |
|---|---|---|---|
| 1 | **Kimlik Doğrulandı** | Biyometrik ID (Certn OneID / Persona) | ~5 CAD |
| 2 | **Adli Sicil Temiz** | Enhanced Canadian CRC (+ QC'de SOQUIJ) | ~30–70 CAD |
| 3 | **Lisanslı & Sigortalı** | Belediye izni + CGL + care/custody/control poliçesi | belge |
| 4 | **Sertifikalı Pro** | Pet ilk yardım sertifikası + platform eğitimi | eğitim |

> ⚠️ **"Vulnerable Sector Check" iddiası kullanılamaz.** VSC yalnızca polis tarafından, yalnızca çocuk/savunmasız kişilerle güven ilişkisi olan roller için yapılır; evcil hayvan bu tanıma girmez. Yanlış iddia Competition Act yanıltıcı beyan riski yaratır. Doğru dil: *"Gelişmiş adli sicil kontrolü + biyometrik kimlik doğrulaması."*

**Maliyet stratejisi:** Rover CA$49'u **peşin** alıyor. Biz **girişi ücretsiz** yapıp maliyeti ilk 3 rezervasyonun komisyonundan karşılıyoruz. Bakıcı edinim hunisindeki en büyük sürtünmeyi kaldırıyor.

**Koruma programı (Rover Guarantee muadili):**

| Kalem | Limit |
|---|---|
| Veteriner bakımı (olay başına) | 25.000 CAD |
| Mal hasarı | 100.000 CAD |
| Üçüncü kişi yaralanması | 100.000 CAD |
| **Bakıcı tarafı mülk/eşya hasarı** | **10.000 CAD** ← *rakiplerde yok* |
| Muafiyet | 250 CAD |
| Bildirim süresi | 48 saat · Belge: 14 gün · **Karar: 48 saat SLA** |

> ⚠️ **En yüksek riskli madde:** Rover programının başında büyük harflerle **"THE ROVER GUARANTEE IS NOT INSURANCE"** yazıyor — yani sözleşmesel tazmin programı, sigorta ürünü değil. Aynı yapıyı kurabiliriz ama **"sigorta işi yapma" tanımına girmemek için Kanadalı sigorta düzenleme avukatına mutlaka doğrulatılmalı.** Arkasına gerçek bir master poliçe/reasürans koymak hem bilanço hem düzenleyici riski azaltır.

---

## 6. TEKNİK MİMARİ

### 6.1 Monorepo yapısı

```
hayvanbakici/
├── apps/
│   ├── web/              Next.js 15 · App Router · RSC
│   ├── mobile/           Expo SDK 54 · expo-router · React Native
│   ├── admin/            Next.js (ayrı deploy, IP kısıtlı)
│   └── worker/           Arka plan işleri (Node + BullMQ veya Inngest)
├── packages/
│   ├── api/              tRPC router'ları — web, mobil, admin ortak
│   ├── db/               Drizzle ORM şeması + migration + seed
│   ├── tokens/           Design token'lar (JSON → CSS var + TS)
│   ├── ui/               Web bileşenleri (React + Tailwind + Radix)
│   ├── ui-native/        Mobil bileşenler (RN + NativeWind)
│   ├── i18n/             en-CA / fr-CA çeviri kaynakları + tip güvenli t()
│   ├── core/             İş mantığı: fiyatlama, komisyon, iptal, uygunluk
│   ├── integrations/     Stripe, Certn, Resend, Twilio, S3 sarmalayıcıları
│   └── config/           eslint, tsconfig, tailwind, prettier ortak konfig
├── docs/                 Bu doküman ve ekler
└── turbo.json
```

**Neden tRPC:** Web ve mobil aynı tip güvenli API'yi paylaşır. REST/OpenAPI yazıp iki kez tip üretmeye gerek kalmaz. 1–3 kişilik ekipte bu haftalar kazandırır. Üçüncü taraf entegrasyonu gerekirse tRPC yanına ince bir REST katmanı eklenir.

### 6.2 Teknoloji seçimleri

| Katman | Seçim | Gerekçe / Alternatif |
|---|---|---|
| **Web** | Next.js 15 App Router, React 19, TypeScript | SSR/ISR SEO için zorunlu; programatik sayfalar için ideal |
| **Stil (web)** | Tailwind CSS v4 + Radix UI primitives | Hızlı, erişilebilir taban, token'larla uyumlu |
| **Mobil** | Expo SDK 54 (managed), expo-router, NativeWind | OTA güncelleme, tek kod tabanı, EAS Build |
| **API** | tRPC v11 (Next.js route handler üzerinde) | Uçtan uca tip güvenliği |
| **Veritabanı** | **PostgreSQL 16 + PostGIS**, `ca-central-1` | Coğrafi arama için PostGIS şart. **Supabase (Toronto region)** veya **Neon** |
| **ORM** | Drizzle | Tip güvenli, hafif, SQL'e yakın, edge uyumlu |
| **Auth** | **Better Auth** (self-hosted) veya Supabase Auth | Veri Kanada'da kalmalı → Clerk/Auth0 veri yerleşimi doğrulanmalı |
| **Arama** | **Faz 1:** PostGIS + Postgres FTS · **Faz 2:** Typesense (self-host) veya Algolia | Başlangıçta Algolia gereksiz maliyet + veri yerleşimi sorunu |
| **Ödeme** | **Stripe Connect Express** · `separate charges & transfers` | Kanada'da olgun; `application_fee_amount` ile komisyon |
| **Dosya/medya** | Cloudflare R2 veya Supabase Storage + `next/image` | AVIF/WebP dönüşümü |
| **Mesajlaşma** | Postgres + Supabase Realtime (veya Ably) | Gerçek zamanlı; mesaj geçmişi chargeback kanıtı |
| **Push** | Expo Notifications (APNs/FCM) | |
| **E-posta / SMS** | Resend (veya Postmark) + Twilio | İşlemsel ve pazarlama ayrı akışlar (CASL) |
| **Arka plan işleri** | Inngest veya BullMQ + Redis | Payout serbest bırakma, hatırlatma, rapor üretimi |
| **Kimlik & sicil** | **Certn** (OneID + Enhanced CRC + SOQUIJ) | Kanada-yerli, tek entegrasyonda ikisi de |
| **Analitik** | PostHog (self-host veya EU/CA region) + Vercel Analytics | Law 25 opt-in rıza ile |
| **Hata izleme** | Sentry | |
| **Rıza yönetimi** | Cookiebot / Usercentrics (CMP) | Law 25 **opt-in** zorunlu |
| **Vergi** | Stripe Tax | Eyalet bazlı GST/HST/QST |
| **CI/CD** | GitHub Actions + Vercel (web) + EAS (mobil) | |

> ⚠️ **Veri yerleşimi doğrulanacak:** Vercel'in sunucusuz fonksiyon bölgeleri arasında Kanada bulunmuyorsa, **veri deposu (Postgres) mutlaka `ca-central-1`'de** kalır ve işleme için Law 25 PIA dosyası hazırlanır. Alternatif: tüm yığını AWS `ca-central-1`'de (SST / Docker + ECS) çalıştırmak. Bu kararı Faz 0'da netleştirin.

### 6.3 Veri modeli (çekirdek)

```sql
-- KİMLİK
users               (id, email, phone, locale[en-CA|fr-CA], role[owner|sitter|both|admin],
                     created_at, last_active_at, marketing_consent_at, marketing_consent_ip)
profiles            (user_id, first_name, last_name_initial, avatar_url, bio, city_id,
                     neighbourhood_id, approx_location geography(Point), exact_address_enc)

-- BAKICI
sitters             (user_id, status[draft|pending|active|paused|deactivated],
                     badge_level, response_time_mins, acceptance_rate, cancellation_rate,
                     ranking_score, home_type, has_yard, yard_fenced, has_own_pets,
                     smoke_free, sin_encrypted, tin_verified_at, stripe_account_id)
sitter_services     (sitter_id, service_type, price_cents, price_unit[night|visit|walk|day|session],
                     extra_pet_price_cents, holiday_surcharge_pct, is_active,
                     accepted_pet_types[], accepted_size_min_kg, accepted_size_max_kg)
sitter_availability (sitter_id, date, status[open|blocked|booked], max_concurrent)
verifications       (sitter_id, type[identity|criminal|licence|insurance|certification],
                     status, provider, provider_ref, decision, decided_by, decided_at,
                     expires_at)   -- ham rapor SAKLANMAZ

-- HAYVAN
pets                (owner_id, name, species[dog|cat|other], breed, birth_date, weight_kg,
                     is_neutered, microchip, temperament_notes, medication_notes,
                     vet_name, vet_phone, emergency_contact)
pet_vaccinations    (pet_id, vaccine_type, administered_on, expires_on, document_url,
                     verified_at, verified_by)

-- REZERVASYON
bookings            (id, owner_id, sitter_id, service_type, status,
                     start_at, end_at, pet_ids[],
                     base_cents, extras_cents, owner_fee_cents, tax_cents, total_cents,
                     sitter_commission_pct, sitter_payout_cents,
                     attribution[platform|sitter_referral|repeat],  -- ← komisyon motoru
                     cancellation_policy, special_instructions,
                     stripe_payment_intent_id, stripe_transfer_id, payout_release_at)
booking_events      (booking_id, type[check_in|check_out|photo|gps_ping|note], payload jsonb,
                     created_by, created_at)
meet_and_greets     (booking_id|inquiry_id, scheduled_at, status, location_type)

-- MESAJLAŞMA
conversations       (booking_id|inquiry_id, owner_id, sitter_id, last_message_at)
messages            (conversation_id, sender_id, body, body_redacted, attachments jsonb,
                     flagged_reason, created_at)

-- YORUM
reviews             (booking_id, author_id, subject_id, direction[owner_to_sitter|sitter_to_owner],
                     rating, body, locale, published_at, response_body)

-- ÖDEME
payouts             (sitter_id, stripe_transfer_id, amount_cents, period_start, period_end, status)
disputes            (booking_id, opened_by, type, status, resolution, sla_due_at, resolved_at)
claims              (booking_id, claimant_id, type[vet|property|sitter_property|injury],
                     amount_requested_cents, amount_approved_cents, status,
                     decision_due_at, decided_at, decision_reason)

-- COĞRAFYA & SEO
provinces           (code, name_en, name_fr)
cities              (slug_en, slug_fr, name_en, name_fr, province_code, centroid geography,
                     tier[1|2|3], population)
neighbourhoods      (city_id, slug_en, slug_fr, name_en, name_fr, boundary geography)
landing_pages       (city_id|neighbourhood_id, service_type, locale,
                     sitter_count, median_price_cents, p25_cents, p75_cents,
                     booking_count, review_count, avg_rating,
                     is_indexable,          -- ← arz eşiği kuralı
                     last_computed_at)

-- UYUM
consent_records     (user_id, type[cookies|marketing|criminal_check|biometric|tos_language],
                     granted, locale_shown, version, ip, user_agent, created_at)
tax_reports         (sitter_id, year, quarter, gross_cents, commission_cents, tax_cents,
                     transaction_count, reported_to_cra_at)
audit_log           (actor_id, action, entity, entity_id, before jsonb, after jsonb, created_at)
incident_register   (type, severity, description, affected_users, rrosh_assessment,
                     reported_to_opc_at, reported_to_cai_at, created_at)  -- 2 yıl saklanır
```

**İndeksler (kritik olanlar):**
```sql
CREATE INDEX idx_sitter_geo   ON profiles USING GIST (approx_location);
CREATE INDEX idx_avail_lookup ON sitter_availability (sitter_id, date) WHERE status='open';
CREATE INDEX idx_booking_sitter_time ON bookings (sitter_id, start_at, end_at);
CREATE INDEX idx_landing_indexable   ON landing_pages (city_id, service_type, locale)
       WHERE is_indexable = true;
```

### 6.4 Arama mimarisi (Faz 1 — dış servis yok)

```sql
-- "Toronto'da 12-15 Ekim arası köpek konaklaması, 20kg köpek, 10km içinde"
SELECT s.user_id, p.approx_location,
       ST_Distance(p.approx_location, $origin) AS distance_m,
       ss.price_cents, s.ranking_score, s.response_time_mins
FROM sitters s
JOIN profiles p        ON p.user_id = s.user_id
JOIN sitter_services ss ON ss.sitter_id = s.user_id
WHERE s.status = 'active'
  AND ss.service_type = 'boarding' AND ss.is_active
  AND $pet_weight BETWEEN ss.accepted_size_min_kg AND ss.accepted_size_max_kg
  AND ST_DWithin(p.approx_location, $origin, $radius_m)
  AND NOT EXISTS (                       -- tarih aralığında blok/dolu gün yok
    SELECT 1 FROM sitter_availability a
    WHERE a.sitter_id = s.user_id
      AND a.date BETWEEN $start AND $end
      AND a.status <> 'open')
ORDER BY (s.ranking_score * 0.5)
       + (1 - LEAST(distance_m / $radius_m, 1)) * 0.3
       + (CASE WHEN s.response_time_mins < 60 THEN 0.2 ELSE 0 END) DESC
LIMIT 30;
```

**Sıralama skoru — şeffaf formül (bakıcıya gösterilir):**
```
ranking_score =
    0.30 × yorum_kalitesi (bayesyen ortalama, düşük sayıda yorumu cezalandırır)
  + 0.20 × yanıt_hızı
  + 0.20 × kabul_oranı
  + 0.15 × (1 − iptal_oranı)
  + 0.10 × profil_tamlığı
  + 0.05 × rozet_seviyesi
```
Bakıcı panelinde her bileşen ve "nasıl yükseltirsiniz" gösterilir. Bu, Rover'ın kara kutusuna karşı doğrudan farklılaştırıcıdır **ve** Ontario DPWRA'nın şeffaflık standardını gönüllü olarak karşılar.

### 6.5 Ödeme akışı

```
1. Owner rezervasyon onaylar
   → PaymentIntent (manual capture)  ·  kart + Apple Pay + Google Pay
2. Bakıcı kabul eder
   → capture  ·  fon platform hesabında
3. Hizmet tamamlanır
   → booking.payout_release_at = end_at + 48 saat
4. Cron (worker)
   → Transfer(destination = sitter.stripe_account_id,
              amount = total − komisyon − vergi)
5. Stripe → bakıcıya haftalık EFT payout (CAD)
```

**Kurallar:**
- `separate charges and transfers` kullanılır (destination charges değil) → fon tutma esnekliği
- Kanada'da manuel payout azami tutma süresi **90 gün** → 48 saat bolca içinde
- Chargeback savunması için **her rezervasyonda kanıt paketi** saklanır: mesaj geçmişi, check-in/out zaman damgaları, GPS logu, fotoğraflar
- Fiyat gösterimi: **tüm ücretler ilk ekranda dahil** (drip pricing yasağı — Competition Act). Sadece GST/HST checkout'ta eklenebilir.

### 6.6 Kalite ve test

| Katman | Araç | Eşik |
|---|---|---|
| Tip | TypeScript `strict` | Hata 0 |
| Birim | Vitest | `packages/core` (fiyatlama, komisyon, iptal, vergi) %90+ |
| Entegrasyon | Vitest + testcontainers (Postgres) | Kritik akışlar |
| E2E web | Playwright | Arama → rezervasyon → ödeme → yorum (EN + FR) |
| E2E mobil | Maestro | Giriş, arama, rezervasyon, check-in |
| Görsel | Chromatic veya Playwright snapshot | Bileşen kütüphanesi |
| Erişilebilirlik | axe-core (CI) + Lighthouse | a11y ≥ 95 |
| Performans | Lighthouse CI + CrUX izleme | LCP <2,0s · INP <150ms · CLS <0,05 |
| Yük | k6 | Arama endpoint'i 200 rps |

**Ortamlar:** `local` → `preview` (her PR) → `staging` (seed veri) → `production`.
Özellik bayrakları (feature flags) ile şehir ve hizmet bazlı kademeli açılış.

---

## 7. SEO STRATEJİSİ

> SEO bu işte lüks değil, **birincil edinim kanalı**. Thumbtack büyümesinin %80–90'ını, GrubHub kullanıcılarının %30'unu SEO'dan aldı. Rover'ın en güçlü kalesi de burası.

### 7.1 Rover'ın oyun kitabı (tersine mühendislik)

| Sayfa tipi | Rover kalıbı |
|---|---|
| Kanada EN şehir+hizmet | `rover.com/ca/toronto--on--dog-boarding/` |
| Kanada FR şehir+hizmet | `rover.com/ca/fr/montreal--qc--garde-chien/` |
| Mahalle+şehir+hizmet | `rover.com/downtown--seattle--wa--dog-walking/` |
| Bakıcı profili | `rover.com/members/rie-s-home-full-time-fenced-large-yard/` |
| Blog (programatik fiyat) | `rover.com/ca/blog/toronto-ca-dog-boarding-price/` |

**Sitemap:** ~218 alt sitemap, tahminen **2–5 milyon** landing sayfası global; Kanada payı ~80.000–200.000.

**En kritik bulgu — `robots.txt`:** Rover `/search/` rotasını **tamamen engelliyor.** Filtrelenebilir arama taramaya kapalı; tüm SEO değeri statik, küratörlü landing sayfalarında toplanıyor. Faceted navigation indeks şişmesi kaynağında çözülmüş.

**Thin content'ten kaçınma yöntemi:** Her şehir sayfasında **gerçek marketplace verisi** — "Toronto'da 10.935 pet parent boarding rezervasyonu yaptı", "ortalama $53,35/gece (Eylül 2026)", şehre enjekte edilmiş 8 soruluk SSS, yakın şehir modülü.

**Tespit edilen zayıflık:** Rover'ın Kanada sayfalarında **hreflang etiketi bulunamadı** — en-CA/fr-CA sinyalleri verilmiyor. Pawshake alt alan adı kullanıyor (`en.pawshake.ca` / `fr.pawshake.ca`) ve onda da hreflang yok. **Bu bizim en düşük asılı meyvemiz.**

### 7.2 URL ve dil mimarisi (kesin karar)

```
example.ca/en/toronto/dog-boarding/
example.ca/fr/toronto/garde-de-chien/
example.ca/fr/montreal/pension-pour-chien/
example.ca/en/toronto/leslieville/dog-boarding/
example.ca/en/sitters/sarah-m-fenced-yard-leslieville/
```

- **`.ca` ana domain** (Kanadalı güven sinyali, otomatik geo-hedefleme). `.com` de satın alınır ve 301'lenir. Global genişleme olursa `.com`'a migration.
- **Alt dizin, alt alan adı değil** — domain otoritesi tek noktada toplanır, tek Search Console property, Next.js i18n yerleşik desteği.
- **Slug'lar da çevrilir.** Fransızca URL'de İngilizce slug bırakılmaz.
- **IP tabanlı otomatik yönlendirme YOK.** Googlebot çoğunlukla ABD IP'sinden gelir; fr-CA sayfaları hiç taranmaz. Bunun yerine `Accept-Language`'a göre banner ile **öneri**.

**hreflang (her sayfada, çift yönlü, kendine referanslı):**
```html
<link rel="alternate" hreflang="en-CA"   href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="alternate" hreflang="fr-CA"   href="https://example.ca/fr/toronto/garde-de-chien/" />
<link rel="alternate" hreflang="x-default" href="https://example.ca/en/toronto/dog-boarding/" />
<link rel="canonical" href="https://example.ca/en/toronto/dog-boarding/" />
```
Next.js'te `generateMetadata` → `alternates.languages` ile üretilir.

### 7.3 Arz eşiği kuralı — en önemli tek mekanizma

Google'ın **doorway pages** tanımı şehir sayfalarına doğrudan temas eder. Bizi kurtaran tek şey: her sayfanın o şehir için **gerçek, benzersiz, kullanıcıya değerli arz** taşıması.

```
bakıcı_sayısı >= 8  →  index, follow  (self-canonical)
bakıcı_sayısı 3–7   →  index, follow  + "yakındaki şehirler" modülü genişletilir
bakıcı_sayısı 1–2   →  noindex, follow  + bekleme listesi formu
bakıcı_sayısı = 0   →  sayfa hiç üretilmez (404)
```

Bu kural `generateMetadata` içinde **çalışma zamanında** uygulanır; arz büyüdükçe sayfa otomatik indekse girer. Yeni bakıcı onaylandığında `revalidatePath()` ile o şehrin sayfaları anında tazelenir.

```ts
// app/[locale]/[city]/[service]/page.tsx
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cities = await getTier1Cities();   // SADECE Tier-1 → build süresi kontrollü
  const services = await getServices();
  return cities.flatMap(c => services.map(s => ({
    locale: c.locale, city: c.slug, service: s.slug,
  })));
}

export async function generateMetadata({ params }) {
  const { city, service, locale } = await params;
  const d = await getCityServiceData(city, service, locale);
  if (!d || d.sitterCount === 0) return { robots: { index: false, follow: false } };

  return {
    title: locale === 'fr'
      ? `${d.serviceName} à ${d.cityName} — ${d.sitterCount} gardiens vérifiés`
      : `${d.serviceName} in ${d.cityName} — ${d.sitterCount} verified sitters`,
    description: locale === 'fr'
      ? `${d.sitterCount} gardiens à ${d.cityName}. Prix médian ${d.medianPrice}$/nuit. ${d.reviewCount} avis vérifiés.`
      : `${d.sitterCount} verified sitters in ${d.cityName}. Median $${d.medianPrice}/night. ${d.reviewCount} verified reviews.`,
    alternates: {
      canonical: `https://example.ca/${locale}/${city}/${service}/`,
      languages: {
        'en-CA': `https://example.ca/en/${d.enCity}/${d.enService}/`,
        'fr-CA': `https://example.ca/fr/${d.frCity}/${d.frService}/`,
        'x-default': `https://example.ca/en/${d.enCity}/${d.enService}/`,
      },
    },
    robots: d.sitterCount >= 3 ? { index: true, follow: true }
                               : { index: false, follow: true },
  };
}
```

### 7.4 Faceted navigation — karar matrisi

> Google (Gary Illyes, 2023): **Bildirilen tüm tarama sorunlarının %50'si faceted navigation kaynaklı.**

| Filtre tipi | Aksiyon |
|---|---|
| Sıralama `?sort=` | robots.txt disallow |
| Tarih aralığı `?start=&end=` | robots.txt disallow (sonsuz kombinasyon) |
| Harita `?lat=&lng=&zoom=` | robots.txt disallow |
| Tracking `?utm_*`, `?ref=` | robots.txt disallow |
| Tek, düşük talepli filtre | Üst sayfaya canonical |
| Tek, **kanıtlı talepli** filtre → `/toronto/dog-boarding/large-dogs/` | Index, temiz URL, benzersiz H1/metin |
| Çoklu filtre, talep yok | robots.txt disallow |
| Boş sonuç | **404** (redirect değil) |

```
# robots.txt
User-agent: *
Disallow: /api/
Disallow: /search/
Disallow: /*?sort=
Disallow: /*?utm_
Disallow: /*?start=
Disallow: /checkout/
Disallow: /messages/
Disallow: /account/

# AI crawler'lara açık
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

> ⚠️ **En sık yapılan hata:** Aynı URL'de `robots.txt disallow` + `noindex` **birlikte kullanılmaz.** Google engellenen sayfayı tarayamaz → `noindex` etiketini okuyamaz → sayfa süresiz indekste kalır. Tarama bütçesi için robots.txt, indeks temizliği için noindex.

### 7.5 Schema.org

> **Google'ın kritik kuralı:** *"Eğer incelenen varlık kendisi hakkındaki yorumları kontrol ediyorsa, `LocalBusiness` veya `Organization` kullanan sayfalar yıldız değerlendirme özelliği için uygun değildir."*

| Şema | Nerede | Neden |
|---|---|---|
| `Organization` + `WebSite` | Ana sayfa | Entity tanıma, marka SERP, AI motorları |
| `BreadcrumbList` | Tüm derin sayfalar | Hiyerarşi sinyali |
| `Service` + `AggregateOffer` | Şehir × hizmet | Fiyat aralığı |
| `ItemList` | Şehir × hizmet | Bakıcı listesi yapılandırma |
| `FAQPage` | Şehir × hizmet, blog | AI Overviews alıntı formatı |
| `LocalBusiness` + `AggregateRating` + `Review` | **Sadece bakıcı profili** | Meşru — bakıcı yorumları kontrol etmiyor |
| ❌ `LocalBusiness` + `AggregateRating` | **Kendi markamız için ASLA** | Self-serving ihlali |

### 7.6 Sayfa ölçekleme planı

| Faz | Ay | Sayfa sayısı | Kapsam |
|---|---|---|---|
| 0 | 0–3 | **~150–250** | 6 hizmet hub (EN+FR), ~20 eyalet hub, 15 Tier-1 şehir × 6 hizmet (EN), 6 QC şehri × 6 hizmet (FR), 25–40 blog |
| 1 | 4–8 | **~1.200** | 50–60 Tier-2 şehir + Toronto/Vancouver/Montréal mahalleleri (8+ bakıcı olanlar) |
| 2 | 9–18 | **8.000–15.000** | Tier-3 şehirler, tam mahalle kapsamı, nitelikli filtre sayfaları |
| 3 | 18+ | 15.000+ | Bakıcı profillerinin indekslenmesi |

**Tier-1 şehirler:** Toronto, Vancouver, Montréal, Calgary, Edmonton, Ottawa, Mississauga, Winnipeg, Québec City, Hamilton, Brampton, Surrey, Halifax, London (ON), Victoria.

**Altın kural:** Her fazda Search Console'da **"Discovered – currently not indexed"** oranını ölç. **%20'yi aşarsa ölçeklemeyi durdur** — Google sayfaları değersiz buluyor demektir.

### 7.7 Şablon farklılaştırma — her şehir sayfasının %40'ı benzersiz olmalı

**Kaynaklar:**
- Canlı marketplace verisi: aktif bakıcı sayısı, medyan gecelik fiyat, p25–p75 aralığı, ortalama yanıt süresi, toplam rezervasyon, tekrar müşteri oranı, ortalama puan
- Yerel gerçek dünya verisi: şehirdeki köpek parkı sayısı, **belediye köpek ruhsat verisi (Toronto/Montréal Open Data — kamuya açık!)**, en popüler ırklar, kondo/apartman pet politikaları
- Mevsimsellik: "Toronto'da Aralık'ta boarding talebi %X artıyor"
- Gerçek yorum alıntıları: o şehirden 3–5 tam yorum
- Şehre özel SSS: fiyat sorusu gerçek medyanla cevaplanır

**Yapmayın:** Aynı paragrafın içine şehir adını değiştirerek yerleştirmek. LLM ile 500 şehir için "benzersiz" paragraf üretmek (= scaled content abuse). Şehir adını 12 kez tekrarlamak.

### 7.8 Anahtar kelimeler

⚠️ *Hacimler tahmindir; lansman öncesi Keyword Planner (geo: Canada) + Ahrefs ile doğrulanmalı.*

**İngilizce (Kanada)**

| Anahtar kelime | Tahmini aylık | Zorluk |
|---|---|---|
| `dog boarding near me` | 12.000–22.000 | Çok yüksek |
| `dog daycare toronto` | **2.900–6.600** | Yüksek |
| `dog boarding toronto` | 1.900–3.600 | Yüksek |
| `dog walker toronto` | 1.300–2.400 | Orta-Yüksek |
| `dog daycare calgary` | 1.300–2.400 | Orta |
| `dog boarding vancouver` | 900–1.900 | Orta-Yüksek |
| `how much does dog boarding cost` | 800–1.600 | Düşük (**AI Overviews'ta güçlü**) |
| `cat sitting toronto` | 300–700 | Düşük |

**Fransızca (Québec)**

| Anahtar kelime | Tahmini aylık | Not |
|---|---|---|
| `toilettage chien montreal` | 800–1.900 | Grooming, yüksek hacim |
| `pension pour chien montreal` | 500–1.300 | En yüksek hacimli FR terim |
| `garderie pour chien montreal` | 500–1.200 | Daycare |
| `gardien/gardienne d'animaux` | 300–800 | **Her iki cinsiyet formunu da kapsa** |
| `promeneur de chien montreal` | 200–500 | |
| `hébergement pour chien` | 200–500 | Markada tercih edilen terim |

**Terminoloji stratejisi:** URL slug'ı `pension-pour-chien` (hacim burada), H1 "Hébergement pour chien à Montréal" (marka tonu), gövde metninde *« aussi appelé pension pour chien »* ile her iki terimi de kapsa.

> **Québec Fransızcası ≠ Fransa Fransızcası.** Rover'ın `/fr/montreal--occitanie--promenade-chien/` sayfası Fransa'daki Montréal'i hedefliyor — Québec kullanıcısı için alakasız. Fransa ajansı değil, **Québec yerlisi editör** kullanın.

### 7.9 Google Business Profile — net cevap

**Marketplace GBP'ye uygun DEĞİL.** Google "yüz yüze müşteri hizmeti" ve "gerçek sokak adresi" şart koşuyor. Sahte GBP askıya alma riski.

Meşru GBP: merkez ofis için, kategori "Software Company" — marka SERP'i içindir, `dog boarding toronto` için sıralanmaz.

**Gerçekçi local pack stratejisi:** Local pack'in (fiziksel kennel'lar) hemen **altındaki #1 organik sonuç** hedeflenir. Ayrıca `best dog boarding toronto` gibi listeleme niyetli sorgular marketplace formatına doğal uyar.

### 7.10 AI arama görünürlüğü (GEO/AEO)

Google resmi duruşu net: *"AI Overviews'ta görünmek için ek gereksinim veya özel optimizasyon gerekmez"*, *"llms.txt gibi yeni dosyalar oluşturmanıza gerek yok"*. Gereken tek şey normal Search'te **indekslenmiş ve snippet'e uygun** olmak.

Ama 1M+ veri noktalı 2026 araştırmasına göre:
- **Reddit tüm platformlarda #1 alıntı kaynağı**; topluluk platformları toplam alıntıların **%52,5'i**
- **Sitelerin %73'ünde AI crawler erişim engeli var** (robots.txt, CDN kısıtı, JS render bağımlılığı) → **en kolay kazanç burada**
- Referans niteliğinde, kolay alıntılanabilir içerik **3–5× daha fazla** alıntı alıyor

**Yapılacaklar:**
1. AI crawler'lara `Allow: /` + **Cloudflare bot yönetiminde beyaz liste** (asıl sorun genelde burada)
2. **Kritik veri SSR ile HTML'de** — bakıcı sayısı, fiyat, yorumlar client-side render ediliyorsa AI için görünmez
3. **Cevap-önce paragrafı** — soruyu ilk 40–60 kelimede tam cevapla
4. **Somut sayı + tarih:** *"Toronto'da köpek pansiyonu medyan $50/gece (Eylül 2026, 3.412 tamamlanmış rezervasyona dayalı)"* — bu alıntılanır, "fiyatlar değişir" alıntılanmaz
5. Karşılaştırma tabloları (LLM'ler tablo verisini sever)
6. `llms.txt` yayınla — Google için faydası yok ama Anthropic öneriyor, OpenAI/Perplexity kullanıyor. ~2 saatlik iş, SEO bütçesinden değil.

### 7.11 İçerik ve backlink

**Öncelik sırasıyla içerik türleri:**
1. **Fiyat rehberleri** (en yüksek ROI) — kendi işlem verimizden, kimse kopyalayamaz, AI Overviews'ta güçlü
2. **Karşılaştırma içerikleri** — `Boarding vs kennel vs house sitting`, `Dog daycare vs dog walker`
3. **Şehir yaşam rehberleri** (link mıknatısı) — `Toronto'nun en iyi 25 köpek parkı`, `Montréal'de köpekle metro kuralları`
4. **Sahiplik rehberleri** — `Kanada kışında köpek bakımı`, `Tatilde köpeğinizi bırakma kontrol listesi`
5. **Veri çalışmaları** (digital PR)
6. **Bakıcı hikâyeleri** — `Leslieville'in bakıcılarıyla tanışın`

**Digital PR fikirleri (Kanada'ya özel):**

| Fikir | Veri kaynağı | Hedef |
|---|---|---|
| "Kanada'nın en popüler köpek isimleri 2026" — il kırılımlı | **Toronto Open Data köpek ruhsat isimleri** (kamuya açık) + kendi veri | blogTO, Narcity, CTV, Daily Hive |
| "Kanada'nın en köpek dostu şehirleri" endeksi | Park/kişi, off-leash alan, pet dostu kiralık oranı, bakıcı yoğunluğu | Ulusal basın, emlak siteleri |
| "Köpek bakımı enflasyon raporu" — çeyreklik | Kendi işlem verisi | Financial Post, BNN Bloomberg |
| "Kondo köpekleri raporu" — Toronto/Vancouver | Kendi veri + CMHC | blogTO, Storeys |
| "Le portrait de la garde d'animaux au Québec" (FR) | QC verisi | La Presse, Le Devoir, Radio-Canada |

> Veri çalışmalarını **her yıl tekrarlayın.** "2026 raporu" → "2027 raporu" birikimli otorite yaratır; LLM'ler yıllık serileri güvenilir kaynak sayar.

**Yerel link katmanları:**
1. Temel citation'lar (ilk 30 gün): Yellow Pages CA, Canada411, Yelp CA, BBB Canada, Apple Maps, Bing Places
2. Dernekler: PIJAC Canada, Canadian Kennel Club, il veteriner dernekleri (OVMA, AMVQ, SBCVMA)
3. **Yerel ortaklıklar (en değerli):** veteriner klinikleri (VCA Canada, VetStrategy), barınaklar (Toronto Humane Society, SPCA de Montréal, BC SPCA), **Toronto'nun BluePaw Partners programı** (toronto.ca üzerinde "Daycare, Dog Boarding & Walking" listesi — doğrudan hedef), pet mağazaları (Pet Valu, Ren's Pets), kondo yönetim şirketleri
4. Digital PR

**Kaçının:** Satın alınan pet niş backlink paketleri, PBN'ler, guest post çiftlikleri. Kanada pazarı küçük; gerçek ilişkiler ölçeklenir.

### 7.12 Erken uyarı sinyalleri

| Sinyal | Eşik | Aksiyon |
|---|---|---|
| "Discovered – currently not indexed" | >%20 | Ölçeklemeyi **durdur** |
| "Crawled – currently not indexed" | Artış trendi | Şablon farklılaştırması yetersiz |
| Tarama isteği/gün | Düşüş | Crawl budget israfı |
| Şehir sayfası oturum süresi | <30 sn | Doorway sinyali |
| Şehir sayfası bounce | >%75 | Arz eşiğini yükselt |

---

## 8. KANADA UYUM VE YASAL ÇERÇEVE

> ⚠️ Bu bölüm teknik/operasyonel bir ön araştırmadır, hukuki görüş değildir. `DOĞRULAT` etiketli maddeler Kanada'da (Ontario + Québec barosuna kayıtlı) avukata ve bir CPA'ya teyit ettirilmelidir. Tam liste §8.8'de.

### 8.1 En kritik 8 bulgu

| # | Bulgu | Etki |
|---|---|---|
| 1 | **CRA Digital Platform Reporting (Part XX) kapsamındayız.** "Personal services" tanımı pet sitting/dog walking'i doğrudan kapsıyor. Her yıl **31 Ocak**'a kadar her bakıcı için CRA'ya rapor + bakıcıya kopya. | Yüksek — **ürün gereksinimi: SIN toplama** |
| 2 | **Québec Law 25 en ağır yük.** Opt-in çerez rızası, otomatik karar bildirimi, sınır ötesi transfer için PIA, veri taşınabilirliği, biyometride CAI'ye 60 gün önce bildirim. Ceza: dünya cirosunun %4'üne veya 25M CAD'e kadar **+ kişi başı 1.000 CAD tazminatlı toplu dava hakkı**. | Yüksek |
| 3 | **Bill 96 / Fransızca.** Québec'te hizmet sunan her işletmenin sitesi Fransızca olmalı; **yapışma sözleşmeleri (ToS) önce tam Fransızca sunulmalı**, sonra taraf açıkça İngilizce'yi kabul etmeli. Ceza 3.000–30.000 CAD, tekrarda 2x/3x. | Yüksek |
| 4 | **Stripe Connect'te "escrow" yoktur.** Manuel payout ile fon tutma Kanada'da **azami 90 gün**. 48 saatlik modelimiz bolca içinde. | Orta — mimari |
| 5 | **Vulnerable Sector Check alınamaz.** Evcil hayvan "vulnerable person" tanımına girmez. Yanlış iddia Competition Act riski. | Yüksek — **pazarlama dili** |
| 6 | **Ontario DPWRA pet sitting'i kapsamıyor** (sadece ride-share, delivery, courier). Ama standartlarını gönüllü uygulamak hem itibar hem gelecek mevzuat sigortası. | Orta |
| 7 | **Toronto: Şubat 2027'den itibaren "Pet Establishment" lisansı** — boarding/daycare/gecelik bakım yapanlar lisanslı olmak zorunda. Ayrıca ticari köpek gezdirme izni (4–6 köpek, **2M CAD sigorta**). | Orta — arz uyumu |
| 8 | **Competition Act yorum kuralları çok sert:** testimonial yayınlamak **yazılı izin** gerektirir; sahte/teşvikli yorumda ceza dünya cirosunun %3'üne veya 10M CAD'e kadar. **20 Haz 2025'ten beri özel taraflar doğrudan Tribunal'a başvurabiliyor.** | Yüksek |

### 8.2 Veri koruma

**Katmanlı yapı:** PIPEDA (federal) + Alberta PIPA + BC PIPA + **Québec Law 25 (en katı)**.
→ **Pratik kural: Law 25'e göre tek bir uyum programı kur.** Diğerlerini büyük ölçüde karşılar.

**Law 25 — bir web platformunu doğrudan etkileyenler:**

| Yürürlük | Yükümlülük |
|---|---|
| 22 Eyl 2022 | Gizlilik sorumlusu ata (atanmazsa **CEO sorumlu**); adı/iletişimi sitede yayınla |
| 22 Eyl 2022 | Olay müdahale planı + **ihlal kayıt defteri** (2 yıl saklama) |
| 22 Eyl 2022 | **Biyometri kullanımı CAI'ye 60 gün ÖNCE bildirilmeli** ← selfie/yüz eşleştirme kullanacaksak kritik |
| 22 Eyl 2023 | **Takip teknolojileri için opt-in rıza** (K. Amerika'nın tek açık opt-in rejimi) + "en yüksek gizlilik" varsayılan ayarlar |
| 22 Eyl 2023 | **Otomatik karar bildirimi (s.12.1):** münhasıran otomatik karar → anında bildir + ana faktörleri açıkla + **insan incelemesi kanalı** aç. *Otomatik bakıcı onayı/reddi, risk skoruyla hesap askıya alma, dinamik fiyat — hepsi kapsamda.* |
| 22 Eyl 2023 | **Sınır ötesi transfer için PIA** — AWS, Stripe, Twilio, analytics, Türkiye'deki destek ekibi: hepsi için |
| 22 Eyl 2024 | **Veri taşınabilirliği** — "Verilerimi indir" (JSON/CSV) |

**Veri Kanada'da mı tutulmalı?** Özel sektör için zorunluluk **yok**. Ama Law 25 PIA yükünü ciddi azaltır + pazarlama avantajı → **Öneri: birincil veri deposu `ca-central-1` / `northamerica-northeast1`.**

**Yapılacaklar:**
- [ ] Gizlilik sorumlusu ata; ad/iletişimi EN+FR sayfada yayınla
- [ ] Veri envanteri (hangi veri, nerede, hangi alt işleyici, hangi ülke)
- [ ] Her sınır ötesi alt işleyici için **PIA dosyası**
- [ ] **Opt-in CMP** (Cookiebot/Usercentrics) — varsayılan olarak non-essential çerezler kapalı
- [ ] **Otomatik karar envanteri** + her biri için bildirim metni + "insan incelemesi talep et" akışı
- [ ] Veri saklama takvimi (reddedilen başvuru 12 ay · tamamlanan rezervasyon 7 yıl [vergi] · mesaj logları X ay)
- [ ] Veri dışa aktarma endpoint'i (JSON/CSV)
- [ ] İhlal müdahale planı + ihlal defteri (RROSH değerlendirme şablonu)

### 8.3 Dil (Bill 96)

**Federal iki dillilik zorunlu DEĞİL** — sadece federal düzenlemeye tabi işletmeler (banka, telekom, havayolu).

**Québec:** Québec'te fiziki ofisiniz olmasa da, Québeclilere hizmet satıyorsanız kapsamdasınız. Site, kataloglar, "ticari nitelikteki her belge" Fransızca sunulmalı ve FR versiyon **en az eşdeğer kalitede** olmalı — içerik, sunum ve **işlevsellik** bakımından. (EN'de canlı destek varsa FR'de de olmalı.)

**Yapışma sözleşmeleri (s.55) — en kritik nokta:** ToS, Bakıcı Sözleşmesi, Abonelik Şartları için:
1. Önce **tam Fransızca versiyon** sunulmalı
2. Ancak ondan sonra taraflar **açıkça** İngilizce'yi kabul edebilir
3. FR versiyon için hiçbir ücret talep edilemez

> E-ticaret akışında bunun teknik olarak nasıl karşılanacağı hâlâ belirsiz. Sektör pratiği: "FR ToS'u varsayılan göster + ayrı dil tercihi onayı al + zaman damgalı kaydet". **DOĞRULAT.**

**Ticari marka istisnası:** 1 Haz 2025'ten beri daraltıldı — pratikte **tescilli (registered)** markalar korunuyor; marka içindeki jenerik/tanımlayıcı ifadeler FR'ye çevrilmeli. → **Markayı CIPO'da tescil ettirin.**

**Yapılacaklar:**
- [ ] **FR'yi "faz 2"ye bırakmayın.** i18n altyapısı gün 1'de: tüm string'ler, e-postalar, SMS, push, hata mesajları, destek makaleleri
- [ ] **Profesyonel Québec Fransızcası** çevirisi (makine çevirisi OQLF nezdinde risk)
- [ ] ToS/Privacy/Bakıcı Sözleşmesi'nin hukuken denetlenmiş FR versiyonu
- [ ] Kayıt akışında FR sözleşme varsayılan + dil tercihi için ayrı açık onay + zaman damgalı kayıt
- [ ] Fransızca müşteri desteği (en az e-posta/chat)

### 8.4 Vergi ve ödeme

**CRA Part XX (Reporting Rules for Digital Platform Operators) — kapsamdayız.**

- Her bakıcı için toplanacak: ad, adres, mukim yargı yetkisi, **TIN (bireylerde SIN)**, doğum tarihi
- Raporlanacak (çeyreklik kırılımla): toplam bedel, işlem sayısı, **alınan komisyon**, kesilen vergiler
- Takvim: takvim yılını izleyen **31 Ocak**'a kadar CRA'ya + **bakıcıya kopya**
- Ceza: TIN alınamazsa **kayıt başına 500 CAD**
- ⚠️ **Yaygın hata:** "2.800 CAD / 30 işlem" muafiyeti **yalnızca mal satanlar** içindir. **Hizmet sağlayıcılarda eşik yok — tek bir gezdirme yapan bakıcı bile raporlanır.**

**GST/HST:**
- **Kendi komisyonumuz** vergiye tabi hizmettir; 4 çeyrekte 30.000 CAD eşiği aşılınca kayıt zorunlu (pazaryerinde hemen olur)
- **Bakıcının hizmeti:** Kanada'nın "deemed supplier" kuralları dar — Kanada mukimi bakıcıların Kanada'da ifa ettiği pet sitting bu kapsamda değil → **varsayılan: her bakıcı kendi GST/HST'sinden sorumlu**, sadece kendi cirosu 30.000 CAD'i aşarsa. **DOĞRULAT (CPA).**

> **Kritik mimari kararı:** Sözleşmelerde platformun **acente (agent)** mi **asıl (principal)** mı olduğu net yazılmalı. "Hizmeti kendi adına satıyor" gibi konumlanırsak (fiyatı biz belirlersek, müşteri sözleşmesi bizimleyse) **tüm hizmet bedeli üzerinden GST/HST'den sorumlu olabiliriz.** → **Fiyatı bakıcı belirlesin.**

**Eyalet oranları (2026, DOĞRULAT):** ON %13 HST · NB/NL/PEI %15 · NS %14 · BC %5 GST (+PST listelenmiş hizmetlerde) · QC %5 GST + %9,975 QST · SK %5+6 · MB %5+7 · AB/NT/NU/YT %5

**Bağımsız yüklenici sınıflandırması — kontrol tasarımı:**
- [ ] **Bakıcı kendi fiyatını belirlesin** (platform sadece aralık önersin)
- [ ] Bakıcı işi reddedebilsin; münhasırlık dayatılmasın; başka platformlarda çalışabilsin
- [ ] Kendi ekipmanını kullansın; üniforma/vardiya/çalışma saati dayatması **olmasın**
- [ ] Yazılı **Independent Contractor Agreement** (EN+FR)
- [ ] Ürün dilinde "çalışanımız/ekibimiz/personelimiz" **kullanmayın** → "bağımsız bakıcı"

**Ödeme:**
- **Stripe Connect Express** + `separate charges and transfers` + 48 saat gecikmeli transfer
- Kullanıcıya asla **"escrow"** demeyin → *"ödemeniz hizmet tamamlanana kadar güvende tutulur"*
- Checkout: kart + **Apple Pay + Google Pay gün 1'de** (Kanadalı akıllı telefon sahiplerinin 5'te 4'ünde cüzdan var)
- ⚠️ **RPAA (Retail Payment Activities Act) PSP kaydı** ve **FINTRAC MSB** kapsam analizi → fintech düzenleme avukatı. **Bu maddeyi atlamayın.**

### 8.5 Güven ve güvenlik — sağlayıcılar

| Sağlayıcı / Ürün | Fiyat (CAD) | Süre |
|---|---|---|
| Certn — Basic Canadian CRC | 24,99 | 4–72 saat |
| **Certn — Enhanced CRC** | **29,99** | 4–72 saat |
| Certn — Québec Record Check (SOQUIJ) | 39,99 | 1 gün |
| **Certn — OneID (biyometrik)** | **4,99** | Anında |
| Sterling Backcheck / Triton Canada | Sözleşmeli | — |

**Tipik birim maliyet:** Enhanced CRC + OneID ≈ **35 CAD/bakıcı** (QC'de ~75 CAD).

**Yasal kısıtlar:**
- **Québec Charter s.18.2:** Af almış kişilerde adli sicil dikkate alınamaz; diğerlerinde suç–iş bağlantısı **bireysel ve olgusal** test edilmeli. Stereotip yasak. → **Québec'te otomatik red YOK**; suç–iş bağlantı matrisi + insan incelemesi (aynı zamanda Law 25 s.12.1 gereği). **DOĞRULAT.**
- **Ontario Police Record Checks Reform Act:** sonuç önce başvurana gösterilip onay alınmalı. **DOĞRULAT.**
- Adli sicil = hassas veri → **ham raporu saklamayın**, sadece karar + tarih + sağlayıcı referansı.

**Belediye lisansları:**

| Şehir | Gereklilik |
|---|---|
| **Toronto — Commercial Dog Walker Permit** | 4–6 köpek · 305,99 CAD/yıl · **2M CAD CGL zorunlu**, City "additional insured" |
| **Toronto — Pet Establishment Licence** | **1 Şubat 2027'den itibaren** boarding/daycare/gecelik bakım için zorunlu. Şehir Sonbahar 2026'da detay yayınlayacak. **DOĞRULAT: evde barındırma yapan bireysel bakıcıları kapsıyor mu** |
| **Metro Vancouver — Commercial Use Dog Walking** | 200 CAD başvuru + 250 CAD/gezdirici + 50 CAD yelek · **5M CAD CGL** · ⚠️ Pacific Spirit Park 2026 kotası dolu |

**Sigorta:**

| Poliçe | Kapsam |
|---|---|
| Commercial General Liability (CGL) | 3. kişi/hayvan zararı · min 2M CAD (Toronto), 5M CAD (Metro Vancouver) |
| **Care, Custody & Control / Animal Bailee** | **Bakım altındaki hayvanın kendisine gelen zarar** — CGL bunu hariç tutar. Pet sitting için asıl kritik teminat |
| Bonding / Fidelity | Bakıcının müşteri evinden hırsızlığı |
| **Cyber / Privacy Liability** | **Platform için** — Law 25 toplu dava riski |

Kanalar: Zensurance (Toronto), APOLLO, Ratehub. Platform düzeyinde master poliçe için Aon / Marsh / Gallagher "sharing economy" masaları. **DOĞRULAT — hangi Kanadalı sigortacının gerçekten platform-level master policy yazdığı; bu piyasa dar.**

### 8.6 Tüketici koruma ve reklam

**Ontario CPA 2002:** Sözleşme öncesi tam bilgi · açık kabul + hata düzeltme fırsatı · sözleşme kopyası · ön bilgi yoksa **7 gün**, kopya yoksa **30 gün** iptal hakkı · statutory chargeback. *(CPA 2023 kabul edildi ama henüz yürürlükte değil — takip edin.)*

**Québec CPA (P-40.1):** Satın alma öncesi **yazdırılabilir/PDF** olarak tam bilgi · sözleşme kopyası **15 gün içinde** · "all-inclusive" fiyat reklamı · **Bill 24: ticari sunumlarda kişinin görüntüsünün rızasız kullanımı yasak (AI üretimi içerik dahil)** → **sentetik bakıcı fotoğrafı/testimonial kullanmayın.**

**BC Bill 4 (1 Ağu 2025):** 60+ günlük otomatik yenilemede her zaman ücretsiz iptal + 15 gün iade · **Tüketici yorumunu engelleyen maddeler, zorunlu tahkim ve toplu dava yasağı maddeleri YASAK** → ToS'u buna göre yazın.

**Manitoba Bill 49 (1 Tem 2025):** **Kişiselleştirilmiş algoritmik fiyatlandırma yasak** (bireysel tüketici verisine göre fiyat ayarlamak). Tekrarda 1M CAD'e kadar ceza. → Dinamik fiyat kullanacaksak **arz/talep temelli** olmalı, kişi bazlı değil.

**Competition Act:**
- **Drip pricing YASAK** — zorunlu ücretler ilk gösterilen fiyata dahil olmalı. Tek istisna: devlet vergi/harçları.
- **Testimonial:** kişi daha önce kendisi yayınlamış olmalı **veya yazılı onay + yayın izni** alınmalı; birebir tutarlı olmalı
- Ceza (şirket): ilk ihlal **10M CAD** veya 3x kazanç veya **dünya brüt gelirinin %3'ü**
- **20 Haz 2025'ten beri özel taraflar doğrudan Tribunal'a başvurabiliyor**

**Erişilebilirlik:** Ontario AODA — 50+ çalışanda WCAG 2.0 AA zorunlu; 20+ çalışanda 3 yılda bir uyum raporu. → **WCAG 2.2 AA hedefleyin** (ek maliyet düşük, tüm eyaletleri kapsar).

**CASL (anti-spam):** Açık rıza — **ön işaretli kutu yasak**; her CEM'de kimlik + unsubscribe (link 60 gün geçerli, talep 10 iş günü içinde işlenir). Ceza: şirket **10M CAD/ihlal**, **yöneticiler kişisel sorumlu olabilir**. İşlemsel mesajlar (rezervasyon onayı, ödeme) muaf.

### 8.7 Uyum yol haritası

**Faz 0 — Lansman öncesi (mutlak zorunlu)**
1. Kanada tüzel kişiliği + BN + GST/HST kaydı (+ QST)
2. Hukuk ekibi: (a) ON ticaret/pazaryeri avukatı, (b) Québec avukatı (Law 25 + Bill 96), (c) fintech/ödeme avukatı (RPAA/FINTRAC), (d) GST/HST uzmanı CPA, (e) sigorta düzenleme avukatı
3. ToS + Privacy + Bakıcı Sözleşmesi + Garanti Şartları — **EN ve Québec FR**, denetlenmiş
4. Stripe Connect Express + 48 saat gecikmeli transfer
5. Certn (OneID + Enhanced CRC) entegrasyonu
6. Gizlilik sorumlusu + opt-in CMP + veri envanteri + PIA'lar
7. Toronto/Vancouver belediye izin bilgilendirmesi bakıcı onboarding'ine gömülü
8. WCAG 2.2 AA baz uyum + drip pricing'siz fiyat gösterimi

**Faz 1 — İlk 6 ay:** Part XX raporlama motoru · garanti programı + sigorta broker anlaşması · FR müşteri desteği · CASL rıza altyapısı · bakıcı vergi eğitimi (30.000 CAD eşiği)

**Faz 2 — Ölçeklenirken:** Adyen fizibilitesi · Instant payout / BNPL / Interac Debit · **Toronto Pet Establishment lisansı (Şub 2027) için boarding bakıcı uyum programı** · Ontario CPA 2023 güncellemesi

### 8.8 Avukata mutlaka doğrulatılacaklar

| # | Konu | Kime |
|---|---|---|
| 1 | **Garanti programının "sigorta işi" sayılıp sayılmayacağı** ← en yüksek risk | Sigorta düzenleme avukatı |
| 2 | **RPAA (PSP kaydı) ve FINTRAC MSB** kapsamı | Fintech düzenleme avukatı |
| 3 | GST/HST: platform **acente mi asıl mı** | GST/HST uzmanı CPA |
| 4 | Bill 96 s.55 yapışma sözleşmesinin **e-ticaret akışında teknik karşılığı** | Québec avukatı |
| 5 | Québec Charter **s.18.2'nin bağımsız yüklenicilere uygulanıp uygulanmadığı** | Québec iş hukuku avukatı |
| 6 | **Biyometrik ID'de CAI'ye 60 gün bildirim** kapsamı | Québec gizlilik avukatı |
| 7 | Toronto **Pet Establishment lisansının evde barındıran bireysel bakıcıları kapsayıp kapsamadığı** | Toronto MLS + belediye hukuku |
| 8 | Provincial **Consumer Reporting Acts** + Ontario **Police Record Checks Reform Act** etkisi | İstihdam/gizlilik avukatı |
| 9 | Part XX'te **hangi banka hesap alanlarının** zorunlu olduğu | CPA + CRA teknik rehberi |
| 10 | Vergi oranları (özellikle NS %14) ve BC PST'nin pet care'e uygulanıp uygulanmadığı | CPA |
| 11 | **Stripe Instant Payouts** Kanada desteği | Stripe hesap yöneticisi |
| 12 | CASL **private right of action** yürürlük durumu | Ticaret avukatı |
| 13 | Belediye bazlı **maksimum köpek sayısı** limitleri | Belediye sorgusu |

---

## 9. PAZARA GİRİŞ (GO-TO-MARKET)

### 9.1 Hangi tarafla başlanır: **ARZ (bakıcı)**

Üç gerekçe:
1. **Arz talebi yaratıyor.** Bu sektörde bakıcının **zaten mevcut müşteri portföyü var** — bu, pet care'in en büyük cold-start avantajı.
2. **Bakıcılar şu anda gerçekten kızgın.** Rover'ın %30'a çıkması ve "Rover fee calculator" SEO ekosisteminin büyümesi (Scritches, Pupline, Houndtrust, Tails, FeeBite — hepsi bakıcı memnuniyetsizliğini paraya çeviriyor) hazır ve motive bir havuz olduğunu gösteriyor.
3. **SEO arz gerektirir.** `dog boarding toronto` araması ancak listelenmiş bakıcı varsa dönüşür.

### 9.2 Aşama 0 — Tek şehir, tek mahalle kümesi (Ay 0–3)

- **Toronto (GTA)** — en büyük pazar + **Rover'ın kademeli fee pilotu dışında**
- **Ama tüm şehirle başlamayın.** 5 mahalle: Liberty Village, Leslieville, The Junction, The Annex, Riverside
- Network etkisi mahalle bazında gerçekleşir: sahip 15 dakikalık yürüme mesafesindeki bakıcıyı ister

### 9.3 Aşama 1 — Arzı tohumlama (concierge)

1. **Rover/Pawshake profillerinden doğrudan bakıcı avı.** Profiller halka açık; en yüksek puanlı, en çok yorumlu bakıcılara birebir ulaşım.
2. **Teklif paketi:**
   - İlk 12 ay **%0 komisyon**
   - **Kendi müşterilerinizi getirin → onlardan hiç komisyon almıyoruz** (kalıcı)
   - **Ücretsiz** kimlik + adli sicil kontrolü (Rover CA$49 alıyor)
   - Bakıcı tarafı mülk/eşya koruması (rakiplerde yok)
3. **Manuel eşleştirme (Wizard of Oz).** İlk 100 rezervasyonu insan eliyle eşleştirin. Arama algoritması ölçekte gerekir, 50 bakıcıda değil.
4. **Hedef yoğunluk:** mahalle kümesinde **50–80 aktif, doğrulanmış bakıcı** — *tahmin: minimum likidite eşiği*. Altında arama sonucu boş görünür ve talep geri gelmez.

### 9.4 Aşama 2 — Talebi ateşleme

| Kanal | Taktik | Beklenen |
|---|---|---|
| **Bakıcının kendi müşterisi** | %0 komisyon linki + QR + hazır SMS/e-posta şablonları | 50 bakıcı × 20 müşteri = **1.000 müşteri, CAC ≈ 0** ← en kritik hamle |
| **SEO** | Tier-1 şehir + mahalle landing sayfaları, FR dahil | Uzun vadede en büyük kanal (Thumbtack %80-90) |
| **Google Ads** | Dar niyet: `dog boarding toronto`, `pet sitter leslieville` | Rover'ın 2012'de yaptığı hamle. Ölçülebilir CAC |
| **Tedarikçi kaynaklı pazarlama** | Bakıcılara QR kod, tasma etiketi, köpek parkı tabelası | Köpek parkı bu sektörün "restoran vitrini" |
| **Yerel ortaklıklar** | Veteriner, pet shop, groomer, kondo concierge — referans komisyonu | Yavaş ama kalıcı |
| **Word of mouth** | Çift taraflı referans kredisi (getiren + gelen ikisi de kazanır) | Airbnb/Uber büyümesinin %50+'si |
| **Basın / PR** | blogTO, Narcity, Daily Hive, BetaKit · "Kanadalı alternatif" hikâyesi | Lansman spike'ı + kalıcı backlink |

### 9.5 Aşama 3 — Genişlemeden önce ölçülecekler

İkinci şehre geçmeden önce (*tahmini eşikler*):
- **Arama → rezervasyon dönüşümü ≥ %25**
- **60 günde tekrar rezervasyon oranı ≥ %40**
- Rezervasyon talebi kabul oranı ≥ %70
- Mahallede aktif bakıcı ≥ 50

> Rover–DogVacay dersi: **iki şehirde yarım likidite, bir şehirde tam likiditeden çok daha kötü.**

### 9.6 Aşama 4 — Montréal ve FR lansmanı (Ay 12+)

Montréal ayrı bir ürün lansmanı gibi ele alınmalı:
- **FR-first arayüz ve içerik** (Bill 96 zaten zorunlu kılıyor)
- **Kedi bakımı odaklı ürün akışı** — QC'de kedi %67 vs köpek %48; tüm rakipler köpek-first
- Québec yerlisi topluluk yöneticisi + FR destek
- FR digital PR: La Presse, Le Devoir, Journal de Montréal, Radio-Canada
- Gardinou'nun abonelik modeliyle doğrudan karşılaştırma: *"Biz de %0 komisyon veriyoruz — ama ödeme koruması, sigorta ve escrow ile birlikte."*

---

## 10. FAZLI YOL HARİTASI VE TAKVİM

> 1–3 kişilik ekip varsayımıyla. Tam zamanlı 1 full-stack + yarı zamanlı tasarım/içerik desteği baz alınmıştır. Ekip büyürse süreler kısalır.

### FAZ 0 — Temel (Ay 0–1)

| Alan | Çıktı |
|---|---|
| **Marka** | Ad seçimi · CIPO taraması · domain · logo + kimlik |
| **Hukuk** | Kanada şirketi · BN + GST/HST · avukat/CPA ekibi kurulumu · ToS/Privacy/Bakıcı Sözleşmesi taslakları (EN+FR) |
| **Tasarım** | Design token'lar · 12 çekirdek ekran (masaüstü + mobil) Figma'da · bileşen kütüphanesi v1 |
| **Teknik** | Turborepo iskeleti · Postgres+PostGIS (`ca-central-1`) · auth · CI/CD · i18n altyapısı |
| **Araştırma doğrulama** | Keyword Planner + Ahrefs ile hacim doğrulaması · 30 bakıcıyla keşif görüşmesi |

**Çıkış kriteri:** Marka belli, hukuki yapı kurulu, tasarım dili onaylı, `hello world` deploy edilmiş.

### FAZ 1 — Web MVP (Ay 2–4)

| Sprint | Kapsam |
|---|---|
| **S1–S2** | Kullanıcı + hayvan profilleri · bakıcı onboarding · kimlik/sicil entegrasyonu (Certn) |
| **S3–S4** | Arama (PostGIS) · bakıcı profili · takvim/müsaitlik · filtreler |
| **S5–S6** | Rezervasyon akışı · Stripe Connect · komisyon motoru · iptal politikaları |
| **S7–S8** | Mesajlaşma · yorumlar · bakıcı paneli · admin panel · bildirimler (e-posta/SMS) |

**Paralel:** SEO landing sayfası şablonu (EN+FR) · 25–40 blog yazısı · robots/sitemap/schema · WCAG denetimi

**Çıkış kriteri:** Uçtan uca bir rezervasyon (arama → ödeme → hizmet → yorum → payout) staging'de tamamlanıyor, EN ve FR'de.

### FAZ 2 — Kapalı beta, Toronto (Ay 5)

- 50–80 bakıcı davetle onboard
- Manuel eşleştirme + günlük operasyon
- İlk 100 rezervasyon, her biri elle izlenir
- Haftalık bakıcı görüşmeleri, hızlı iterasyon
- Koruma programı ilk talepleri test edilir

**Çıkış kriteri:** 100 tamamlanmış rezervasyon · NPS ≥ 50 · kritik bug yok · ödeme akışı sorunsuz

### FAZ 3 — Halka açık lansman, Toronto (Ay 6–7)

- Site tamamen açılır, SEO sayfaları indekse
- Gündüz bakımı (daycare) hizmeti eklenir (**yüksek arama hacmi**)
- Google Ads başlar · basın turu (blogTO, Narcity, BetaKit)
- Referans programı canlı
- İlk digital PR kampanyası ("Toronto'nun en popüler köpek isimleri")

**Çıkış kriteri:** Aylık 300+ rezervasyon · organik trafik ay üstüne ay artışta · ilk 3 ticari anahtar kelimede ilk 10

### FAZ 4 — Mobil uygulama (Ay 8–11)

| Ay | Kapsam |
|---|---|
| 8 | Expo iskeleti · auth · paylaşılan tRPC istemcisi · `ui-native` bileşenleri |
| 9 | Arama · profil · rezervasyon akışı · ödeme (Apple/Google Pay) |
| 10 | Mesajlaşma · push · **GPS'li gezdirme + fotoğraf check-in** (mobilin var oluş sebebi) |
| 11 | Bakıcı modu · TestFlight/Play beta · App Store + Play Store yayını |

**Çıkış kriteri:** İki mağazada yayında · rezervasyonların ≥%35'i mobilden · crash-free rate ≥%99,5

### FAZ 5 — Montréal ve Québec (Ay 12–15)

- FR-first lansman · Québec yerlisi editör + destek
- **Kedi bakımı ürün akışı**
- QC digital PR · Gardinou'ya karşı konumlandırma
- SEO Faz 1 ölçeklemesi (~1.200 sayfa)

### FAZ 6 — Ulusal genişleme (Ay 16–24)

- Vancouver, Calgary, Ottawa, Edmonton
- Eğitim + Tımar hizmetleri
- Bakıcı Pro aboneliği
- SEO Faz 2 (8.000–15.000 sayfa)
- Kurumsal/işveren yan hak paketi pilotu

### FAZ 7 — Uluslararası (Ay 24+)

**Türkiye:** Zaten çok dilli mimari var. Gerekenler: TRY + yerel ödeme (iyzico/PayTR), KVKK uyumu (Law 25'e uyduysak yakınız), TR içerik ve SEO, yerel güven altyapısı (background check sağlayıcısı farklı), farklı fiyat noktası ve komisyon modeli.

**Diğer:** Aynı playbook — tek şehir, tek mahalle kümesi, arz önce.

---

## 11. BÜTÇE VE EKİP

### 11.1 Ekip (1–3 kişi senaryosu)

| Rol | Faz 0–1 | Faz 3+ |
|---|---|---|
| **Kurucu / Ürün** | Tam zamanlı (siz) | Tam zamanlı |
| **Full-stack geliştirici** | Tam zamanlı | +1 |
| **Tasarım** | Yarı zamanlı / freelance | Yarı zamanlı |
| **İçerik & SEO (EN)** | Freelance | Yarı zamanlı |
| **Québec FR editör** | — | Faz 5'te freelance |
| **Topluluk / Bakıcı ilişkileri** | Kurucu yapar | Faz 3'te +1 |
| **Destek** | Kurucu yapar | Faz 3'te yarı zamanlı |

### 11.2 Maliyet tahmini (CAD, *kaba*)

**Tek seferlik (Faz 0–1):**

| Kalem | Tutar |
|---|---|
| Şirket kurulumu + BN/GST kaydı | 1.500 – 3.000 |
| Hukuk (ToS/Privacy/Sözleşmeler, EN+FR, 5 uzmanlık alanı) | **15.000 – 35.000** |
| Marka + kimlik (logo, tipografi, rehber) | 3.000 – 12.000 |
| Québec FR profesyonel çeviri (ilk paket) | 3.000 – 8.000 |
| CIPO marka tescili | 500 – 2.000 |
| **Toplam tek seferlik** | **~23.000 – 60.000** |

**Aylık işletme (Faz 1–3):**

| Kalem | Aylık |
|---|---|
| Altyapı (Vercel/AWS, Postgres, R2, Redis) | 150 – 600 |
| Stripe (işlem bazlı, %2,9 + $0,30) | GMV'ye bağlı |
| Certn (bakıcı başına ~35 CAD) | Arz büyümesine bağlı |
| E-posta/SMS (Resend + Twilio) | 100 – 400 |
| Sentry + PostHog + CMP | 150 – 400 |
| SEO araçları (Ahrefs/Semrush) | 150 – 300 |
| Sigorta (Cyber/Tech E&O) | 200 – 600 |
| **Toplam sabit** | **~750 – 2.300/ay** |

**Pazarlama (Faz 3'ten itibaren):** Google Ads başlangıç 3.000–8.000 CAD/ay; bakıcı teşvikleri (ücretsiz background check ~35 CAD × bakıcı sayısı).

> Bu rakamlar planlama içindir; hukuk maliyeti en büyük değişken ve Québec'in iki dilli gerekliliği onu yukarı çekiyor. Erken aşamada bir **Kanadalı startup hukuk paketi** (sabit ücretli) araştırmaya değer.

---

## 12. KPI'LAR, RİSKLER VE SONRAKİ ADIMLAR

### 12.1 KPI ağacı

**Kuzey Yıldızı: Tamamlanmış rezervasyon / hafta (mahalle kümesi bazında)**

| Katman | Metrik | Faz 2 hedef | Faz 3 hedef | Faz 5 hedef |
|---|---|---|---|---|
| **Arz** | Aktif doğrulanmış bakıcı | 50–80 (5 mahalle) | 300 (Toronto) | 800 (TO+MTL) |
| | Bakıcı başvurusu → aktif dönüşümü | %40 | %50 | %55 |
| | Talep yanıt süresi (medyan) | <4 saat | <2 saat | <90 dk |
| | Kabul oranı | %60 | %70 | %75 |
| **Talep** | Arama → rezervasyon talebi | %15 | %25 | %30 |
| | Talep → tamamlanmış rezervasyon | %50 | %65 | %70 |
| | 60 günde tekrar rezervasyon | %30 | %40 | %50 |
| **Ekonomi** | GMV / ay | 25K CAD | 150K CAD | 800K CAD |
| | Net take rate | %15 | %17 | %18 |
| | CAC (harcanan / yeni müşteri) | — | <40 CAD | <30 CAD |
| | Bakıcı kaynaklı müşteri oranı | %60 | %40 | %30 |
| **Kalite** | Ortalama puan | ≥4,7 | ≥4,8 | ≥4,8 |
| | İptal oranı (bakıcı kaynaklı) | <%5 | <%3 | <%2 |
| | Olay (incident) oranı | <%1 | <%0,5 | <%0,3 |
| | Talep karar süresi (SLA) | %90 <48 saat | %95 <48 saat | %98 <48 saat |
| **SEO** | İndekslenen sayfa | 150 | 250 | 1.200 |
| | "Discovered – not indexed" | <%20 | <%15 | <%15 |
| | Organik oturum / ay | 2.000 | 15.000 | 80.000 |
| | Organik payı (toplam edinimde) | %20 | %35 | %50 |
| **Teknik** | LCP (p75) | <2,5s | <2,0s | <2,0s |
| | INP (p75) | <200ms | <150ms | <150ms |
| | Lighthouse a11y | ≥95 | ≥95 | ≥95 |

### 12.2 Risk kaydı

| # | Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| 1 | **Likidite kurulamaz** (arz veya talep tarafı boş kalır) | Yüksek | Kritik | Tek mahalle kümesi · manuel eşleştirme · bakıcının kendi müşterisi hamlesi · eşikler tutmadan genişleme yok |
| 2 | **Ciddi güvenlik olayı** (hayvan yaralanması/ölümü) — basın krizi | Orta | Kritik | Zorunlu aşı + sicil + sigorta · 7/24 acil hat · veteriner ağı · **hazır kriz iletişim planı** |
| 3 | **Rover fiyat savaşı açar** (Toronto'da komisyonu düşürür) | Orta | Yüksek | Hendeğimiz fiyat değil, *bakıcı ekonomisi + koruma + FR*. Abonelik modeline geçiş hazırlığı |
| 4 | **Garanti programı "sigorta" sayılır** — düzenleyici sorun | Orta | Yüksek | **Faz 0'da sigorta düzenleme avukatına doğrulat** · arkasına master poliçe koy |
| 5 | **Bill 96 / Law 25 ihlali** — ceza + toplu dava | Orta | Yüksek | FR gün 1'de · opt-in CMP · PIA'lar · gizlilik sorumlusu · Québec avukatı |
| 6 | **Bakıcı sınıflandırması** (çalışan sayılma) | Düşük-Orta | Yüksek | Fiyatı bakıcı belirler · münhasırlık yok · yazılı sözleşme · ürün dili kontrolü |
| 7 | **Platform dışına kaçış (disintermediation)** | Yüksek | Orta | **Komisyon hizalaması** (%0 kendi müşterisinde) · takvim/fatura/vergi araçları · sigorta sadece platform içinde |
| 8 | **SEO cezası** (thin content / doorway) | Orta | Yüksek | Arz eşiği kuralı · %40 benzersiz içerik · `/search/` engelli · LLM ile toplu içerik üretme |
| 9 | **Nakit tükenmesi** (küçük ekip, uzun yol) | Orta | Kritik | Faz kapıları · her fazda ölçüm · gerekirse Faz 4 (mobil) ertelenebilir |
| 10 | **Tek kişiye bağımlılık** (bus factor) | Yüksek | Orta | Dokümantasyon zorunlu · altyapı kod olarak · üçüncü taraf servisleri tercih et |
| 11 | **Toronto Pet Establishment lisansı (Şub 2027)** arzın bir kısmını devre dışı bırakır | Orta | Orta | Sonbahar 2026'da yayınlanacak detayı takip et · bakıcı uyum programını erken başlat |

### 12.3 Hemen sonraki adımlar (bu hafta)

| # | Adım | Kim | Süre |
|---|---|---|---|
| 1 | **Marka adı kararı** — §3.3'teki 3 öneriden seçim + CIPO/domain kontrolü | Siz + ben | 2 gün |
| 2 | **Komisyon oranları onayı** — %18/%0/%10 + müşteri %7 | Siz | 1 gün |
| 3 | **Hizmet kademelendirmesi onayı** — §5.1 | Siz | 1 gün |
| 4 | **Tasarım yönü onayı** — palet + tipografi (§4.2, §4.3) | Siz | 2 gün |
| 5 | Kanadalı startup avukatı + CPA ile ilk görüşmeler | Siz | 1 hafta |
| 6 | Anahtar kelime hacimlerini Keyword Planner + Ahrefs ile doğrula | Ben | 2 gün |
| 7 | **10–15 Toronto'lu Rover bakıcısıyla keşif görüşmesi** — komisyon teklifini test et | Siz | 1 hafta |
| 8 | Turborepo iskeleti + tasarım token'ları + i18n altyapısı | Ben | 3 gün |

> **Benim önerim:** 1, 2, 3, 4 numaralı kararları verin; ben bu arada 6 ve 8'i halledeyim. 7 numaralı adım (bakıcı görüşmeleri) tüm iş modelini doğrulayacak en değerli iş — mümkün olan en erken başlayın. Bir bakıcı "kendi müşterimi getirirsem %0 komisyon" teklifine nasıl tepki veriyor, bunu bilmeden kod yazmaya başlamak risk.

---

## EKLER

Bu dokümanın dayandığı tam araştırma raporları:

| Dosya | İçerik |
|---|---|
| `docs/ek-01-rakip-pazar-arastirmasi.md` | Rover iş modeli detayları, kademeli komisyon pilotu, tüm rakip profilleri, pazar verileri, kullanıcı şikayetleri, cold-start playbook — kaynak URL'leriyle |
| `docs/ek-02-kanada-yasal-uyum.md` | PIPEDA/Law 25/Bill 96 madde madde, CRA Part XX, GST/HST, Stripe/escrow, background check sağlayıcıları, sigorta, belediye lisansları, tüketici koruma, CASL |
| `docs/ek-03-seo-arastirmasi.md` | Rover SEO tersine mühendisliği (URL/sitemap/robots.txt), programatik SEO kuralları, hreflang, şema örnekleri, anahtar kelime tabloları, AI görünürlük |

---

**Doküman sürüm geçmişi**

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| 1.0 | 12 Eyl 2026 | İlk sürüm — pazar, strateji, marka, tasarım, mimari, SEO, uyum, yol haritası |
