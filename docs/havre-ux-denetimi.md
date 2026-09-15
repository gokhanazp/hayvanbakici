# Havre — Uçtan Uca UX Denetimi

15 Eylül 2026 · Yerel geliştirme kopyası (`npm run dev`, tohum veri) ·
Masaüstü 1280px ve telefon 390px

## Nasıl test ettim

Siteyi iki kez, iki ayrı kişi gibi baştan sona gezdim. Her ekranın
görüntüsünü aldım, formları gerçekten doldurdum, hatalı girdi denedim.

1. **Bakıcı olarak**: ana sayfa → bakıcı davet sayfası → kayıt →
   e-posta doğrulama → giriş → yedi adımlık başvuru → gönderim → onay →
   bakıcı ekranları → kendi genel profili.
2. **Sahip olarak**: ana sayfa → arama → filtreler → sonuç listesi →
   bakıcı profili → oturumsuz rezervasyon denemesi → kayıt → rezervasyon
   formu → hesap ekranları.
3. Rakipler: Rover ve Pawshake'in kendi anlatımları (kaynaklar sonda).

Bulgular üç seviyede:

| Seviye | Anlamı |
|---|---|
| **P0** | Akışı kesiyor ya da yanlış/savunulamaz bir şey söylüyor. Lansmandan önce şart. |
| **P1** | Dönüşümü veya güveni doğrudan düşürüyor. Lansmandan önce yapılmalı. |
| **P2** | İyileştirme. Sonraki turlarda. |

---

# BÖLÜM 1 — BAKICI YOLCULUĞU

## P0-1 · Fotoğraf adımının çıkışı yok (akış kilitleniyor)

**Nerede:** `/en/become-a-sitter/photos/` (7 adımın 5.'si)

Adımda yalnızca iki **"Upload"** düğmesi var. **"Kaydet ve devam" ya da
"Şimdilik atla" düğmesi yok.** Fotoğraf yüklemeyen bir bakıcı sonraki
adıma geçemiyor: ilerleme çubuğundaki daireler bağlantı değil, tek çıkış
tarayıcının geri tuşu veya adresi elle yazmak.

Üstelik ekranın kendisi *"Fotoğrafsız da başvurabilirsiniz"* diyor — yani
sözü tutmuyor.

> Bu benim eklediğim adımda oluşan bir hata. Düzeltmesi 10 dakika.

**Yapılacak:** "Kaydet ve devam" + "Şimdilik atla" düğmeleri; ilerleme
çubuğundaki tamamlanmış adımlar tıklanabilir olsun.

## P0-2 · Boş fiyatla kaydetmek sessizce başarısız

**Nerede:** 3. adım, "What you offer"

Bir hizmeti işaretleyip fiyat alanını boş bırakarak "Save and continue"e
bastım. **Hiçbir şey olmadı**: sayfa aynı kaldı, hata mesajı yok, alan
kırmızıya dönmedi, ekran kaymadı. Kullanıcı düğmenin bozuk olduğunu
düşünür.

**Yapılacak:** alanın altında hata metni, alana odaklanma, sayfanın
hataya kaydırılması. (Doğrulama sunucuda var — eksik olan geri bildirim.)

## P0-3 · Özet adımı bomboş

**Nerede:** 7. adım, "Review and submit"

Sayfa *"Son bir kez bakın"* diyor ama **bakılacak hiçbir şey yok**:
yalnızca "Submit my application" düğmesi ve "Back". Ad, şehir, hizmetler,
fiyatlar, ev bilgisi, fotoğraf sayısı, adli sicil durumu — hiçbiri
görünmüyor.

15 dakikalık bir formun sonunda kullanıcı ne gönderdiğini göremiyor;
yanlış fiyat girdiyse burada yakalayamıyor.

**Yapılacak:** her adımın özeti + yanında "Düzenle" bağlantısı.

## P0-4 · İngilizce ekranda Türkçe metin

**Nerede:** kayıt sonrası ekran → **"Geliştirme posta kutusunu aç"**

Bu geliştirme aracının düğmesi ve metni çevrilmemiş. Üretimde bu sayfa
görünmüyor ama düğme İngilizce arayüzde Türkçe duruyor; demo yaparken de
görünür.

**Yapılacak:** metni iki dile çevir (ya da yalnızca `NODE_ENV=development`
koşuluyla göster ve etiketini "Open the dev inbox" yap).

## P1-1 · "15 dakika" ve "altı adım" doğru değil

- Davet sayfası: *"Six steps, saved as you go"* — ama listede **yedi**
  adım yazıyor (fotoğraf adımı eklenince metin güncellenmemiş).
- Sihirbaz kenarında *"About 15 minutes in total"* — adli sicil rızası ve
  fotoğraf yüklemeyle birlikte gerçekçi değil.

**Yapılacak:** sayıyı tek yerden (ONBOARDING_STEPS) üret; süreyi ölç ya da
"10–20 dakika" gibi aralık ver.

## P1-2 · Fiyat adımı sözünü tutmuyor: "önerilen aralık" yok

Ekranın tepesinde *"We only suggest a range based on what sitters near you
charge"* yazıyor. **Hiçbir aralık gösterilmiyor.** Fiyat kutusu boş,
placeholder bile yok.

Bu veri bizde **zaten var** (`getLandingData` şehir + hizmet için p25/medyan/p75
döndürüyor). Bakıcının en zorlandığı karar fiyat; burada yardım etmemek
hem terk sebebi hem de düşük/yüksek fiyatlı profiller demek.

**Yapılacak:** "Toronto'da köpek konaklaması: **$45 – $65**, medyan $53"
satırı + kutuya medyan placeholder.

## P1-3 · Bakıcı eline ne geçeceğini görmüyor

Fiyat kutusunun yanında yalnızca "$ ___ / night" var. Havre'nin bütün
farkı komisyon şeffaflığı ama **bakıcı, kendi ekranında net kazancını
göremiyor**.

**Yapılacak:** fiyat girilince altında canlı satır:
"Siz $65 yazdınız → müşteri getirdiyseniz **$65,00**, tekrar müşteride
**$58,50**, bizim getirdiğimiz müşteride **$53,30** size kalır."
(`calculateCommission` hazır.)

## P1-4 · Ek hayvan ve tatil fiyatı hiçbir yerde ayarlanamıyor

Veritabanında `extra_pet_price_cents` ve `holiday_surcharge_pct` var,
rezervasyon hesabı bunları **kullanıyor**, ama bakıcı için ekran yok.
İki hayvanlı bir rezervasyonda bakıcı ek ücret alamıyor.

## P1-5 · Onaydan sonra "bakıcı paneli" diye bir şey yok

Onaylandıktan sonra bakıcının gördüğü ekran: **boş bir talep listesi.**
Yok olanlar:

- profilinin yayında olduğunu söyleyen ve **bağlantısını veren** kart,
- kazanç özeti (bu ay / bekleyen / toplam),
- profil gücü ("fotoğraf ekleyin, %40 daha fazla talep alın"),
- görüntülenme sayısı,
- sıradaki adımlar (takvimi aç, ek hayvan fiyatı gir).

Bugün bakıcı onaylandığında yapacak bir şey bulamıyor.

## P1-6 · Takvimde günlerin durumu görünmüyor

**Nerede:** `/account/sitter/calendar/`

30 günün hepsi **birbirinin aynı beyaz kutu**. Altta "Open / Closed /
Booked" göstergesi var ama günlerde renk yok. Takvimin tek işi "hangi
günler açık" sorusunu cevaplamak; cevaplamıyor.

Ayrıca:
- **Tarih aralığı seçimi yok** — iki haftalık tatili kapatmak 14 tıklama.
- "Tümünü seç", "hafta sonları" gibi kısayol yok.
- Tek başına duran "→" düğmesi etiketsiz.

## P2-1 · Başvuru sırasında sohbet balonu dikkat dağıtıyor

15 dakikalık formun sağ alt köşesinde sohbet balonu duruyor, telefonda
alan kaplıyor. Onboarding sırasında gizlensin.

## P2-2 · Hizmet kartları boş

"Dog boarding / House sitting / Drop-in visits / Dog walking" kutularında
ikon, açıklama veya tipik fiyat yok. Bakıcı "drop-in ne kadar eder"
bilmiyor.

## P2-3 · Seçili hizmet kartı çok baskın

Seçilince kart tamamen pembe doluyor ve içindeki onay kutusu tarayıcının
mavi varsayılanı — marka ile çelişiyor. Onay kutuları özelleştirilmeli.

---

# BÖLÜM 2 — SAHİP (BAKICI ARAYAN) YOLCULUĞU

## P0-5 · "Licensed & insured" rozeti savunulamaz bir iddia

**Nerede:** arama sonuç kartları (`verification.licence`)

Kartlarda **"Licensed & Insured"** rozeti var. Aynı sayfanın alt
bilgisinde ise şu yazıyor: *"The Havre Protection programme is a company
guarantee, not an insurance product."*

Site kendi kendiyle çelişiyor ve sigorta iddiası yapıyor. Competition Act
açısından dayanaksız iddia; hukuki risk. Ana sayfadaki **"Verified,
insured sitters across Canada"** cümlesi de aynı sorunda.

**Yapılacak:** rozeti "Business licence on file" / "İşletme kaydı var"
gibi doğrulanabilir bir şeye çevir, "insured" kelimesini pazarlama
metinlerinden kaldır ya da gerçek bir sigorta poliçesi alınana kadar
"Havre Protection kapsamında" de.

## P0-6 · Profilde bookable olmayan hizmet gösteriliyor

Bakıcı profilinde **"Doggy day care — $49,00 / gün"** kartı görünüyor.
Ama "Request a booking" ekranındaki hizmet listesi v1 ile sınırlı ve
`day_care` v1.5'te. Yani owner fiyatı görüyor, tıklıyor, **seçemiyor.**

**Yapılacak:** profilde de yalnızca bookable hizmetleri göster, ya da
"Yakında" etiketiyle ve fiyatsız göster.

## P1-7 · Telefonda sabit rezervasyon çubuğu yok

390px'de fiyat ve "Request a booking" düğmesi sayfanın **çok aşağısında**.
Masaüstünde sağ sütunda yapışkan panel var, telefonda karşılığı yok.

Bu kategoride standart: altta sabit "**$60/gece · Rezervasyon iste**"
çubuğu. Mobil dönüşümde tek başına en büyük kalem.

## P1-8 · Rezervasyon formu yanlış hizmetle açılıyor

"Dog boarding" araması yapıp bir profile girdim, "Request a booking"
dedim — form **"Dog walking — $24.00 / walk"** ile açıldı (en ucuz
hizmet). Aradığım hizmet seçili gelmeli.

Aynı şekilde profil sağındaki büyük fiyat da en ucuz hizmetin fiyatı;
"dog boarding" arayan kişi $24 görüp $60 ödediğini rezervasyon ekranında
fark ediyor. **Beklenti kırılması.**

## P1-9 · Fiyat dökümü tarih seçilene kadar hiç yok

Sitenin ana vaadi *"Every fee shown before you book"*. Rezervasyon
ekranında tarih seçilmeden **hiçbir rakam yok** — boşluk bile yok, hiç.

**Yapılacak:** tarih seçilmeden önce örnek hesap göster ("3 gece için
yaklaşık $X — hizmet $180, Havre ücreti $12,60, vergi $24,45") ve "Tarih
seçin, tam tutarı görün" ipucu.

## P1-10 · "Send request" boş formda da aktif

Tarih yokken düğme tıklanabilir. Ya devre dışı olmalı ya da ne eksik
olduğunu söylemeli.

## P1-11 · Profilde müsaitlik takvimi yok

"27 days open in the next month" bir istatistik olarak duruyor ama
**hangi günler** açık görünmüyor. Sahip tarihlerini deneyip reddedilmeyi
öğreniyor. Rover ve Pawshake'te takvim profilde.

## P1-12 · Telefonda başlık bozuk

390px'de üst bar: logo + EN/FR + isim + "Sign out" + hamburger.
**"Sign out" iki satıra bölünüyor.** Hesap işlemleri hamburger menüye ya
da avatar menüsüne girmeli.

## P1-13 · Telefonda filtreler ilk ekranı yiyor

Arama sonuç sayfasında iki büyük kart (arama + filtreler) üst üste
duruyor; **tek bir bakıcı görmeden** iki ekran kaydırmak gerekiyor.
Filtreler "Filtrele" düğmesi arkasına alınmalı.

## P1-14 · Sohbet balonu mobilde içeriğin üstüne biniyor

390px'de balon filtre kartını ve "About Fatima" başlığını kapatıyor.
Sayfanın altına iç boşluk eklenmeli (`padding-bottom`), ya da balon
kaydırırken küçülmeli.

## P2-4 · Arama sonuçlarında sıralama ve harita yok

- Sıralama seçeneği yok (fiyat, puan, mesafe). Bizim sıralamamız iyi ama
  kullanıcıya kontrol vermiyor.
- Harita görünümü yok. PostGIS verisi ve kaydırılmış nokta hazır.
- "Favorilere ekle" yok — sahip 3 bakıcı karşılaştırır, listesi kaybolur.
- Seçilen tarihlerde müsaitlik kartta görünmüyor.

## P2-5 · Rozetler açıklamasız

"Certified Pro", "ID verified", "Licensed & Insured" yan yana duruyor;
hiçbirinin ne demek olduğu tıklanabilir değil. Güven rozetinin açıklaması
olmazsa süs olur.

## P2-6 · "The home" başlığı iki kez okunuyor

Bakıcı profilinde galerinin ekran-okuyucu başlığı ile "The home" bölümü
aynı metni kullanıyor; ekran okuyucu iki kez "The home" diyor.

---

# BÖLÜM 3 — HER İKİ TARAFI ETKİLEYENLER

## P0-7 · Fotoğraflar hâlâ yer tutucu

Ana sayfa, arama kartları, bakıcı profili, galeriler — **hepsi boş pastel
bloklar**. Avatarlar gri silüet. Bu, sitenin şu anki en büyük görsel
sorunu: bir evcil hayvan bakım sitesinde güven yüzlerden ve odalardan
gelir.

İki iş var ve ikisi de sizde:
1. `UNSPLASH_ACCESS_KEY` ile `npm run photos:fetch` — pazarlama görselleri
   (kendi Terminal'inizden, 5 dakika).
2. Gerçek bakıcı fotoğrafları — yükleme artık çalışıyor ama **kalıcı
   depolama (S3/R2) yok**; canlıda dosyalar kaybolur.

## P1-15 · Boş ekranlar cılız

"No requests yet", "No bookings yet", "No messages yet" — hepsi tek
cümle + bazen bir düğme. Bu ekranlar yeni kullanıcının **en çok gördüğü**
ekranlar; şu an sayfanın yarısı boş ve altbilgi yukarı kaçıyor.

## P1-16 · Bildirim yok (bilinen eksik ama etkisi burada görünüyor)

Bakıcı olarak başvuru gönderdim: e-posta yok. Onaylandım: e-posta yok.
Sahip olarak soru sordum: bakıcıya haber gitmiyor. **36 saatlik yanıt
süresi vaadi bu yüzden anlamsız.** Sıradaki iş bu olmalı.

## P2-7 · Hesap sekmeleri çoğaldı

Overview · Profile · Your bookings · Messages · Requests · Calendar —
tek sırada altı sekme, sahip ve bakıcı işleri karışık. Gruplandırma
("Benim rezervasyonlarım" / "Bakıcılık") veya yan menü gerekiyor.

## P2-8 · Bilgi kutuları hata rengiyle çizilmiş

Kayıt sonrası "Onay bağlantısı gönderdik" mesajı, hizmet adımındaki
"Fiyatı siz belirlersiniz" notu — ikisi de **pembe/kırmızı uyarı
kutusunda**. Olumlu ve nötr bilgiler için ayrı ton gerekiyor.

---

# BÖLÜM 4 — RAKİPLERDE STANDART OLUP BİZDE OLMAYANLAR

| Özellik | Rover | Pawshake | Havre |
|---|---|---|---|
| Tanışma görüşmesi (meet & greet) akışı | var | **akışın 3. adımı** | tablo var, kod yok |
| Para rezervasyon bitene kadar tutuluyor | var | var | ödeme yok |
| Rakamlı veteriner garantisi | 25.000 $ | var | rakam yok |
| 7/24 destek + veteriner hattı | var | var | destek adresi bile `[TO BE CONFIRMED]` |
| Profilde müsaitlik takvimi | var | var | yok |
| Harita üzerinde arama | var | var | yok |
| Konaklama sırasında fotoğraf | var | var | yok (S3 bekliyor) |
| Yorum yazma | var | var | okunuyor, yazılamıyor |
| **Komisyon şeffaflığı** | yok | yok | **bizde var** |
| **Bakıcının getirdiği müşteride %0** | yok | yok | **bizde var** |

**Okuma:** ürünün fikri (şeffaf komisyon, bakıcı lehine model) rakiplerde
yok ve bu gerçek bir fark. Ama **işlem güvenliği** tarafında — tanışma,
emanet para, rakamlı garanti, destek hattı — rakipler standardı çoktan
kurmuş. Sahip tarafında "neden Rover değil de siz" sorusunun cevabı
bugün yalnızca fiyat; güven tarafında henüz eşit değiliz.

---

# ÖNCELİKLİ YAPILACAKLAR

### Hemen (P0 — bu hafta)

1. Fotoğraf adımına "Devam / Atla" düğmesi *(10 dk)*
2. Boş fiyat hatasını göster *(30 dk)*
3. Özet adımını gerçekten doldur *(2 saat)*
4. "Licensed & insured" ve "insured sitters" ifadelerini temizle *(1 saat)*
5. Profilde bookable olmayan hizmeti gösterme *(30 dk)*
6. Türkçe kalan geliştirme metni *(10 dk)*

### Lansmandan önce (P1)

7. Fiyat önerisi + net kazanç satırı *(yarım gün)*
8. Telefonda sabit rezervasyon çubuğu *(yarım gün)*
9. Rezervasyon formunda doğru hizmetin seçili gelmesi + tarih öncesi örnek fiyat *(yarım gün)*
10. Takvimde gün durumlarının görünmesi + aralık seçimi *(1 gün)*
11. Bakıcı paneli: kazanç, profil gücü, sıradaki adımlar *(1–2 gün)*
12. Mobil başlık ve filtre düzeni *(yarım gün)*
13. Bildirim e-postaları *(2 gün)* — zaten sıradaki iş
14. Ek hayvan / tatil fiyatı ekranı *(yarım gün)*
15. Fotoğraflar: `photos:fetch` + S3/R2 kararı *(sizde)*

### Sonra (P2)

16. Profilde müsaitlik takvimi
17. Arama: sıralama, harita, favoriler
18. Tanışma görüşmesi akışı (`meet_and_greets`)
19. Yorum yazma
20. Boş ekranların zenginleştirilmesi, rozet açıklamaları, sekme düzeni

---

## Kaynaklar

- [Pawshake — How does Pawshake work](https://en.pawshake.ca/how-does-pawshake-work)
- [Rover — Become a Sitter](https://www.rover.com/become-a-sitter/)
- [Rover — Availability yönetimi](https://support.rover.com/hc/en-us/articles/206004606-How-do-I-manage-my-availability)
- [Rover — Sahip için bakıcı bulma](https://support.rover.com/hc/en-us/articles/203062280-How-do-I-find-a-sitter-or-dog-walker-for-my-pet)
