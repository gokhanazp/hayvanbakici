# Kanada'da Evcil Hayvan Bakıcısı Pazaryeri — Yasal, Mali ve Güven/Güvenlik Altyapısı Raporu

**Tarih:** Eylül 2026 · **Kapsam:** İki taraflı pazaryeri, ödeme aracılığı (payment facilitation), bakıcılar bağımsız yüklenici

> ⚠️ Bu rapor teknik/operasyonel bir ön araştırmadır, hukuki görüş değildir. "DOĞRULAT" etiketli maddeler mutlaka Kanada'da (tercihen Ontario + Québec barosuna kayıtlı) bir avukata ve bir CPA'ya teyit ettirilmelidir.

---

## 0. Yönetici Özeti — En Kritik 8 Bulgu

| # | Bulgu | Etki |
|---|---|---|
| 1 | **CRA Digital Platform Reporting (Part XX) kapsamındasınız.** "Personal services" tanımı ("kullanıcının talebi üzerine bir veya birden fazla bireyin zamana/göreve dayalı işi") pet sitting/dog walking'i doğrudan kapsıyor. Her yıl **31 Ocak**'a kadar her bakıcı için CRA'ya rapor. | Yüksek — ürün gereksinimi (SIN/TIN toplama) |
| 2 | **Québec Law 25 en ağır yük.** Opt-in çerez rızası, otomatik karar bildirimi, sınır ötesi transfer için PIA, veri taşınabilirliği, **biyometrik kullanımda CAI'ye 60 gün önce bildirim**. Ceza: dünya cirosunun %4'üne veya 25M CAD'e kadar + kişi başı 1.000 CAD tazminatlı toplu dava hakkı. | Yüksek |
| 3 | **Bill 96 / Fransızca.** Québec'te hizmet sunan her işletmenin sitesi Fransızca olmalı; **yapışma sözleşmeleri (ToS) önce tam Fransızca sunulmalı**, sonra taraf açıkça İngilizce'yi kabul etmeli. Ceza 3.000–30.000 CAD, tekrarda 2x/3x. | Yüksek |
| 4 | **Stripe Connect Kanada'da çalışır ama "escrow" yoktur.** Manuel payout ile fon tutma süresi Kanada için **maksimum 90 gün**. | Orta — mimari kararı |
| 5 | **Vulnerable Sector Check (VSC) bakıcılar için alınamaz.** Sadece polis yapar ve yalnızca çocuk/savunmasız kişilerle güven ilişkisi olan pozisyonlar için. Evcil hayvan bu tanıma girmez. Enhanced Criminal Record Check ile yetinilecek. | Yüksek — ürün vaadi/pazarlama riski |
| 6 | **Ontario Digital Platform Workers' Rights Act pet sitting'i kapsamıyor** (yalnızca ride-share, delivery, courier). Ancak sınıflandırma riski CRA testi üzerinden devam ediyor. | Orta |
| 7 | **Toronto: Şubat 2027'den itibaren "Pet Establishment" lisansı** — boarding/daycare/gece bakımı yapan bakıcılar lisanslı olmak zorunda. Ayrıca ticari köpek gezdirme izni (4–6 köpek, 2M CAD sigorta). | Orta — arz tarafı uyum |
| 8 | **Competition Act yorum/testimonial kuralları çok sert:** yorum, yayınlanmadan önce yazılı izin gerektirir; sahte/teşvikli yorumda ceza dünya cirosunun %3'üne veya 10M CAD'e kadar. **20 Haziran 2025'ten beri özel taraflar doğrudan Tribunal'a başvurabiliyor.** | Yüksek |

---

## 1. VERİ KORUMA

### 1.1 Hangi yasa uygulanır?

Tek bir yasa değil, **katmanlı bir yapı** geçerli:

- **PIPEDA (federal)** — eyaletler arası ve uluslararası veri akışları için her zaman geçerli. Ulusal bir pazaryerinde bu kaçınılmaz olarak devrede.
- **Alberta PIPA** ve **BC PIPA** — "substantially similar" ilan edilmiş; o eyalet içindeki ticari faaliyet için geçerli.
- **Québec — Loi 25 / Loi sur la protection des renseignements personnels dans le secteur privé** — en katı rejim.
- Yukon, NWT, Nunavut → PIPEDA.

> Pratik kural: **En katı standarda göre tek bir uyum programı kurun.** O standart Québec Law 25'tir. Law 25'e uyarsanız PIPEDA/AB PIPA/BC PIPA'yı büyük ölçüde karşılarsınız.
> Kaynak: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/r_o_p/prov-pipeda/

### 1.2 PIPEDA — somut yükümlülükler

**10 ilke:** Accountability, Identifying Purposes, Consent, Limiting Collection, Limiting Use/Disclosure/Retention, Accuracy, Safeguards, Openness, Individual Access, Challenging Compliance.

**Rıza (meaningful consent):** Amaç, kullanılan veri türleri, üçüncü taraflar ve zarar riski *kullanıcının anlayabileceği* şekilde belirtilmeli. Hassas veri (kimlik belgesi, adli sicil, konum, ödeme) için **açık (express) rıza** şart.

**Veri saklama:** Amaç ortadan kalktığında imha/anonimleştirme. Yazılı saklama takvimi (retention schedule) zorunlu sayılır.

**İhlal bildirimi (Breach of Security Safeguards):**
- Eşik: **"real risk of significant harm" (RROSH)** — verinin hassasiyeti + kötüye kullanım olasılığı. Zarar tanımı geniş: kimlik hırsızlığı, itibar kaybı, mali kayıp, iş kaybı, bedensel zarar.
- Zamanlama: **"as soon as feasible"** — sabit gün yok, ama gecikme savunulabilir olmalı.
- Kime: OPC + etkilenen bireyler (doğrudan: telefon, e-posta, posta) + zararı azaltabilecek diğer kurumlar.
- **Kayıt: TÜM ihlaller (RROSH eşiğini geçmeyenler dahil) 2 yıl boyunca kayıt altında tutulmalı.**
- Bilerek ihlal → suç; savcılığa sevk. *(Ceza tutarları için DOĞRULAT — PIPEDA s.28.)*

Kaynak: https://www.priv.gc.ca/en/privacy-topics/privacy-breaches/respond-to-a-privacy-breach-at-your-business/gd_pb_201810/

### 1.3 Québec Law 25 — bir web platformunu DOĞRUDAN etkileyen maddeler

| Yürürlük | Yükümlülük | Platform için ne demek |
|---|---|---|
| **22 Eyl 2022** | Gizlilik sorumlusu (Privacy Officer) ata; atanmazsa **varsayılan olarak CEO sorumludur**. Adı ve iletişimi web sitesinde yayımlanmalı. | Sitede "Responsable de la protection des renseignements personnels" sayfası |
| 22 Eyl 2022 | Olay müdahale planı + **ihlal kayıt defteri**; CAI'ye bildirim | Incident register |
| **22 Eyl 2022** | **Biyometri kullanımı CAI'ye 60 gün ÖNCE bildirilmeli** | Selfie/yüz eşleştirmeli kimlik doğrulama kullanacaksanız kritik |
| 22 Eyl 2023 | Gizlilik politikası + yönetişim çerçevesi yayımla; şikâyet prosedürü | |
| **22 Eyl 2023** | **Takip teknolojileri için opt-in rıza** — Kuzey Amerika'nın tek açık opt-in rejimi. Ayrıca "en yüksek gizlilik" **varsayılan ayarlar (s.8.1)** | Çerez banner'ı GDPR tarzı: kabul etmeden hiçbir non-essential çerez/SDK çalışmayacak |
| **22 Eyl 2023** | **Otomatik karar bildirimi (s.12.1):** karar *münhasıran* otomatik işlemeye dayanıyorsa (a) karar anında bildir, (b) talep üzerine kullanılan kişisel veriyi, ana faktör/parametreleri ve düzeltme hakkını açıkla, (c) **kararı gözden geçirebilecek bir insana görüş sunma kanalı** aç | Otomatik bakıcı onayı/reddi, risk skoru ile hesap askıya alma, dinamik fiyat → hepsi kapsamda |
| 22 Eyl 2023 | **Sınır ötesi transfer değerlendirmesi (PIA):** Québec dışına aktarmadan önce hedef ülkedeki korumanın "yeterli" olduğunu değerlendir, sözleşme yap, ilgiliyi bilgilendir | AWS us-east-1, Stripe, Twilio, Segment, destek ekibi Türkiye'de → hepsi için PIA |
| 22 Eyl 2023 | Silme/de-indeksleme hakkı, rıza geri çekme, düzeltme | |
| **22 Eyl 2024** | **Veri taşınabilirliği** — yapılandırılmış, yaygın kullanılan bilgisayar formatında | "Verilerimi indir" özelliği (JSON/CSV) |

**Cezalar:** İdari para cezası dünya cirosunun **%2**'sine veya **10M CAD**'e kadar; cezai yaptırım **%4** veya **25M CAD**. **Özel dava hakkı: kişi başı minimum 1.000 CAD cezai tazminat** (toplu dava riski — Kanada'da PIPEDA/GDPR'da olmayan bir özellik).

Kaynaklar: https://www.osano.com/articles/quebec-law-25 · https://www.torys.com/en/our-latest-thinking/publications/2022/04/automated-decision-making

### 1.4 Veriler Kanada'da mı tutulmalı?

**Hayır — özel sektör için genel bir veri yerelleştirme (data residency) zorunluluğu YOK.** Ancak:

- PIPEDA: sınır ötesi aktarım "transfer for processing" sayılır; **hesap verebilirlik sizde kalır**, sözleşmesel koruma + kullanıcıya şeffaf bildirim gerekir.
- **Québec:** aktarım öncesi **PIA yapma ve ilgiliyi bilgilendirme zorunlu** — bu, pratikte en yakın engeldir.
- Kamu sektörü sözleşmeleri (ör. belediye/eyalet ile iş) veya sağlık verisi farklı — sizin senaryonuzda geçerli değil.

**Öneri:** Teknik zorunluluk olmasa da **Kanada region (AWS ca-central-1 / GCP northamerica-northeast1)** seçmek (a) Law 25 PIA yükünü ciddi azaltır, (b) pazarlama avantajı sağlar, (c) kurumsal müşteri/ortaklıklarda sorun çıkarmaz. **Tavsiye: birincil veri deposu Kanada'da olsun.**

### 1.5 Yapılacaklar — Veri Koruma

- [ ] Gizlilik sorumlusu ata; ad/iletişim bilgisini hem EN hem FR sayfada yayımla
- [ ] Veri envanteri (data map): hangi veri, nerede, hangi alt işleyici, hangi ülke
- [ ] Her sınır ötesi alt işleyici için **PIA (EFVP)** dosyası hazırla — Stripe, AWS, analytics, destek aracı, arka plan kontrol sağlayıcısı
- [ ] GDPR-seviyesi **opt-in Consent Management Platform (CMP)** kur (OneTrust / Cookiebot / Usercentrics); varsayılan olarak non-essential çerezler kapalı
- [ ] **Otomatik karar envanteri** çıkar; her biri için bildirim metni + "insan incelemesi talep et" akışı kur
- [ ] Veri saklama takvimi yaz (ör. reddedilen başvuru 12 ay, tamamlanan rezervasyon 7 yıl [vergi], mesaj logları X ay)
- [ ] Veri dışa aktarma (portability) endpoint'i — JSON/CSV
- [ ] İhlal müdahale planı + ihlal defteri (RROSH değerlendirme şablonu, 2 yıl saklama)
- [ ] Alt işleyici sözleşmelerine veri koruma ekleri (DPA)
- [ ] Biyometrik ID doğrulama kullanacaksanız **CAI'ye 60 gün önceden bildirim** (DOĞRULAT: bildirim formu ve kapsam)

---

## 2. DİL — Fransızca Yükümlülükleri

### 2.1 Federal düzeyde iki dillilik zorunlu mu?

**Hayır.** Official Languages Act yalnızca **federal kurumları** bağlar. Bill C-13 ile çıkarılan *Use of French in Federally Regulated Private Businesses Act* ise yalnızca **federal düzenlemeye tabi özel işletmeleri** (banka, telekom, havayolu, demiryolu, bankacılık vb.) kapsar. **Bir pet sitting pazaryeri federal düzenlemeye tabi değildir → federal iki dillilik yükümlülüğü yoktur.**

Kaynak: https://www.osler.com/en/insights/updates/bill-c-13-parliament-enacts-the-use-of-french-in-federally-regulated-private-businesses-act/

### 2.2 Québec — Charter of the French Language (Bill 96 / Loi 14)

**Kapsam:** "Québec'te faaliyet gösteren ve burada mal veya hizmet sunan her işletme." **Québec'te fiziki ofisiniz olmasa da**, Québeclilere hizmet satıyorsanız kapsamdasınız.

**Web sitesi:** Site, kataloglar, broşürler ve "ticari nitelikteki her belge" Fransızca sunulmalı. Diğer diller olabilir ama **Fransızca versiyon en az eşdeğer kalitede** olmalı — içerik, sunum ve **işlevsellik** bakımından. (Örn. İngilizce'de canlı destek varsa Fransızca'da da olmalı; İngilizce'de 200 SSS varsa Fransızca'da da olmalı.)

**Yapışma sözleşmeleri (s.55) — EN KRİTİK NOKTA:**
Kullanım Şartları, Bakıcı Sözleşmesi, Abonelik Şartları, Yarışma Kuralları gibi müzakere edilemeyen sözleşmelerde:
1. Önce **tam Fransızca versiyon** karşı tarafa sunulmalı,
2. Ancak ondan sonra taraflar **açıkça** İngilizce kullanmayı kabul edebilir.
- Fransızca versiyon için **hiçbir ücret talep edilemez**.
- E-ticaret akışında bunun teknik olarak nasıl karşılanacağı hâlâ belirsiz — sektör pratiği "Fransızca ToS'u varsayılan olarak göster + ayrı bir dil tercihi onayı al" yönünde. **DOĞRULAT.**

**Ticari marka istisnası:** 1 Haziran 2025'ten itibaren istisna daraltıldı — pratikte **tescilli (registered)** markalar korunuyor; ayrıca marka içindeki **jenerik/tanımlayıcı ifadeler** Fransızca'ya çevrilmeli. Tabela/ambalaj için Fransızca metin diğer dilden **en az iki kat** daha büyük yer kaplamalı. (Bu daha çok fiziksel varlık içindir; saf online platform için birincil risk marka *adının* kendisi değil, yanındaki slogan/açıklamadır.) **DOĞRULAT — marka stratejisi için IP avukatı.**

**İstihdam:** Québec'te **6 ay boyunca 25+ çalışan** varsa OQLF'ye francization kaydı (eşik 50'den 25'e indi).

**Cezalar:** İlk ihlal **3.000–30.000 CAD**; ikinci ihlalde **2x**, üçüncüde **3x**. İhlal süregeliyorsa her gün ayrı ihlal sayılabilir. OQLF şikâyet üzerine hareket eder ve önce "mise en demeure" (uyarı) gönderir.

Kaynaklar: https://educaloi.qc.ca/en/understanding-the-law/language-legislation-does-your-website-comply/ · https://gowlingwlg.com/en/insights-resources/articles/2023/bill-96-s-french-first-rule-takes-effect · https://www.mccarthy.ca/en/insights/blogs/consumer-markets-perspectives/french-language-requirements-bill-96-and-june-1-2025-common-misconceptions

### 2.3 Yapılacaklar — Dil

- [ ] **Lansmanda Fransızca'yı "faz 2"ye bırakmayın** — Québec Kanada'nın en büyük 2. pazarı ve OQLF şikâyet odaklı çalışır
- [ ] i18n altyapısını gün 1'de kur (tüm string'ler, e-postalar, SMS, push, hata mesajları, destek makaleleri)
- [ ] **Profesyonel Québec Fransızcası çevirisi** (Fransa Fransızcası ≠ Québec Fransızcası; makine çevirisi OQLF nezdinde risk)
- [ ] ToS/Privacy/Bakıcı Sözleşmesi'nin **hukuken denetlenmiş** FR versiyonu
- [ ] Kayıt akışında: FR sözleşme varsayılan gösterimi + dil tercihi için ayrı açık onay + onayın zaman damgalı kaydı
- [ ] Fransızca müşteri desteği kapasitesi (en az e-posta/chat)
- [ ] Marka adı + slogan için Québec marka denetimi; markayı **CIPO'da tescil ettir** (istisnadan yararlanmak için)

---

## 3. VERGİ VE PLATFORM RAPORLAMA

### 3.1 CRA — Reporting Rules for Digital Platform Operators (Income Tax Act, Part XX / OECD Model Rules)

**Kapsamda mısınız? → EVET.**

"Relevant activity" kategorilerinden biri **"personal services"**: *"bir kullanıcının talebi üzerine bir veya birden fazla birey tarafından gerçekleştirilen, zamana veya göreve dayalı iş"* — dog walking, pet sitting, boarding bu tanıma tam oturur. (Tamamen yardımcı nitelikte hizmetler ve istihdam ilişkileri hariç.)

**Reporting Platform Operator** olursunuz çünkü: Kanada mukimi olacaksınız + satıcıları kullanıcılarla buluşturan bir platform işletiyorsunuz + "excluded platform operator" değilsiniz (yalnızca ilan panosu veya yalnızca ödeme işlemcisi değilsiniz).

**Due diligence (durum tespiti):**
- Her bakıcı için: ad, birincil adres, mukim olunan yargı yetkisi, **TIN (bireyler için SIN)**, doğum tarihi
- Toplanan bilgilerin güvenilirliğinin makul şekilde teyidi
- İlk doğrulama: raporlanabilir yılın **31 Aralık**'ına kadar
- Önceki doğrulama **36 ay** tekrar kullanılabilir (bilgi değişmedikçe)

**Raporlanacaklar (bakıcı başına, ÇEYREKLİK kırılımla):**
- Kimlik bilgileri + TIN + doğum tarihi
- Toplam bedel (consideration) ve işlem sayısı
- Platformun aldığı **ücret/komisyon** ve **kesilen vergiler**
- Bakıcının banka hesap tanımlayıcısı *(DOĞRULAT — hangi hesap alanlarının zorunlu olduğu)*

**Takvim:** Raporlanabilir takvim yılını izleyen **31 Ocak**'a kadar hem CRA'ya bildirim hem de **bakıcının kendisine bir kopya** verilmeli.

**Cezalar:** Geç bildirim → ITA s.162(7.01). TIN talep edilip alınamazsa **kayıt başına 500 CAD**.

**Dikkat — yaygın hata:** "2.800 CAD altı / 30 işlem altı" muafiyeti **yalnızca mal satan satıcılar** içindir. **Hizmet sağlayıcılarda ciro eşiği yoktur — tek bir gezdirme yapan bakıcı bile raporlanır.**

Kaynak: https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/compliance/reporting-rules-digital-platforms/guidance-on-reporting-rules.html

### 3.2 GST/HST

**A) Platformun kendi komisyonu:** Bu, sizin Kanada'da verdiğiniz vergiye tabi bir hizmettir. Küçük tedarikçi eşiğini (**4 ardışık çeyrekte 30.000 CAD**) aştığınız anda GST/HST kaydı zorunlu — ki bir pazaryerinde bu hemen olur. **Komisyon üzerinden, bakıcının bulunduğu eyaletin "place of supply" kurallarına göre GST/HST tahsil edersiniz.**

**B) Bakıcının hizmeti — kim tahsil eder?**

Kanada'nın "deemed supplier" (platform vergiyi tahsil eder) kuralları **dar** kapsamlıdır ve yalnızca şu üç senaryoyu kapsar:
1. Kanada dışı satıcıların **B2C dijital ürün/sınır ötesi hizmetleri**,
2. Satış anında **Kanada'da bulunan mallar** (kayıtlı olmayan satıcı),
3. **Kısa dönem konaklama** (1 aydan az, ev sahibi kayıtlı değilse).

**Kanada mukimi bakıcıların Kanada'da bizzat ifa ettiği pet sitting hizmeti bu üç kategoriye girmez.** Dolayısıyla **varsayılan kural: her bakıcı kendi GST/HST'sinden sorumludur** ve yalnızca **kendi** cirosu 30.000 CAD'i aşarsa kaydolup tahsil etmek zorundadır. **DOĞRULAT — bu, mimariye (agent vs. principal) çok bağlı bir sonuçtur ve mutlaka bir Kanadalı GST/HST uzmanı CPA'ya teyit ettirilmelidir.**

> **Kritik mimari kararı:** Sözleşmelerde platformun **acente (agent/disclosed agent)** mı yoksa **asıl (principal)** mı olduğunu net yazın. Eğer platform "hizmeti kendi adına satıyor" gibi konumlanırsa (fiyatı siz belirliyorsanız, müşteriyle sözleşme sizinle ise) **tüm hizmet bedeli üzerinden GST/HST'den siz sorumlu olabilirsiniz.** Rover modeli genelde acente/pazaryeri konumlanmasıdır.

**C) Eyalet bazlı oranlar (2026 — DOĞRULAT: oranlar değişebilir):**

| Eyalet | Yapı | Toplam |
|---|---|---|
| Ontario | HST | **%13** |
| New Brunswick, Newfoundland & Labrador, PEI | HST | **%15** |
| Nova Scotia | HST (1 Nis 2025'te %15→%14 indirildi — **DOĞRULAT**) | **%14** |
| British Columbia | GST %5 + PST %7 | %5 GST (+ PST *belirli* hizmetlerde) |
| Québec | GST %5 + QST %9,975 | ~%14,975 |
| Saskatchewan | GST %5 + PST %6 | |
| Manitoba | GST %5 + RST %7 | |
| Alberta, NT, NU, YT | Yalnızca GST | **%5** |

**D) Eyalet satış vergisi — pazaryeri kolaylaştırıcı (marketplace facilitator) kuralları:**
- **BC PST:** Marketplace facilitator kaydı eşiği **10.000 CAD**/12 ay. Kapsam: mallar, yazılım, konaklama ve **hukuki hizmetler hariç vergiye tabi hizmetler**. ⚠️ BC'de PST *listelenmiş* hizmetlere uygulanır; pet care hizmetleri genellikle listede değildir → muhtemelen kapsam dışı. **DOĞRULAT.** Ayrıca BC, platform tahsil etmezse satıcıya **müteselsil sorumluluk** yükler.
- **Saskatchewan PST:** Eşik **yok**; marketplace facilitator tüm kolaylaştırılan perakende satışlarda tahsil eder.
- **Manitoba RST:** Eşik **yok**; online satış platformları kolaylaştırdıkları tüm perakende satışlarda RST tahsil eder.
- **Québec QST:** Eşik **30.000 CAD**; üçüncü taraf satışları platformun eşiğine sayılabilir.

Kaynaklar: https://stripe.com/guides/understanding-the-tax-obligations-of-marketplaces-in-canada · https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy.html

### 3.3 Bağımsız yüklenici sınıflandırması

**A) CRA testi (iki aşamalı — Québec'te üç aşamalı):**
1. **Niyet:** Taraflar hangi ilişkiyi kurmayı amaçladı?
2. **Gerçek koşullar** altı faktörle test edilir:
   - **Kontrol** — işin *nasıl* yapılacağını kim belirliyor
   - **Araç ve ekipman** — kime ait, bakımı kimde
   - **Taşeron/yardımcı tutabilme** — onay gerekmeden yerine başkasını gönderebiliyor mu
   - **Mali risk** — sabit maliyet taşıyor mu
   - **Yatırım ve yönetim sorumluluğu**
   - **Kâr/zarar fırsatı**

Québec'te ayrıca Medeni Kanun'un **"lien de subordination"** (bağımlılık ilişkisi) kriteri belirleyicidir.

**Yanlış sınıflandırmanın maliyeti:** İşveren, yapılmayan **CPP katkılarının hem işveren hem çalışan payını + EI primlerini + ceza + faizi** öder. Ayrıca ESA (tatil ücreti, fazla mesai, kıdem) ve vergi geriye dönük yükleri.

Kaynak: https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4110/employee-self-employed.html

**B) Ontario Digital Platform Workers' Rights Act, 2022 (DPWRA) — 1 Temmuz 2025'te yürürlükte**

⚠️ **"Digital platform work" tanımı YALNIZCA ride-share, delivery ve courier hizmetlerini kapsar** (taksi/limuzin hariç). **Pet sitting/dog walking kapsam dışıdır.**

Ancak kanunun getirdiği standartlar, gelecekteki mevzuat ve iyi uygulama açısından yol gösterici — ve kapsam genişletilirse hazır olmak avantaj:
- Görev başına **en az asgari ücret** garantisi
- Erişim verildikten sonra **24 saat içinde** şu bilgilerin açıklanması: ücret nasıl hesaplanır, bahşiş nasıl toplanır, ödeme takvimi, **görev dağıtım algoritmasının faktörleri**, performans puanının sonuçları ve nasıl hesaplandığı
- Platformdan çıkarma: **yazılı gerekçe + 2 hafta önceden bildirim** (kasıtlı ciddi kusur, kamu güvenliği veya yasal kısıt halleri hariç)
- Bahşişten kesinti yasağı
- Tüm uyuşmazlıklar **Ontario'da** çözülmeli (zorunlu dış tahkim/forum seçimi geçersiz)
- Misilleme yasağı; **kayıt tutma zorunluluğu; yönetici sorumluluğu**
- **Bu haklar "çalışan olup olmadığına bakılmaksızın" geçerlidir** — yani statüyü değiştirmez.

Kaynaklar: https://www.osler.com/en/insights/blogs/employment-and-labour-law-blog/new-legal-framework-for-digital-platform-workers-coming-into-force-july-1-2025/ · https://www.littler.com/news-analysis/asap/ontario-canada-digital-platform-workers-rights-act-2022-coming-force-july-1-2025

### 3.4 Yapılacaklar — Vergi ve Sınıflandırma

**Vergi/raporlama**
- [ ] Kanada'da tüzel kişilik kur (federal CBCA veya ON/BC eyalet şirketi) — **DOĞRULAT: yapı, GST/HST ve DPI yükümlülüklerini etkiler**
- [ ] **BN (Business Number) + GST/HST hesabı** aç; gerekiyorsa QST (Revenu Québec) ayrı kaydı
- [ ] Onboarding akışına **SIN toplama** ekle (Part XX için zorunlu) — ayrı rıza metni, şifreli saklama, erişim kısıtı, saklama süresi
- [ ] SIN doğrulama/eksik TIN takip iş akışı (500 CAD/kayıt ceza riski)
- [ ] **Part XX raporlama motoru**: bakıcı başına çeyreklik bedel + komisyon + kesilen vergi; her 31 Ocak'ta XML/CRA formatında dosyalama + bakıcıya kopya
- [ ] Komisyon üzerinden doğru eyalet oranıyla GST/HST tahsil et; faturalarda BN numarası göster
- [ ] Bakıcı panelinde **yıllık kazanç özeti** (bakıcının kendi vergi beyanı için) — zorunlu değilse bile güçlü bir ürün özelliği
- [ ] Vergi motoru: Stripe Tax veya Avalara/Vertex ile eyalet bazlı hesaplama

**Sınıflandırma riskini azaltma (kontrol tasarımı)**
- [ ] **Bakıcı kendi fiyatını belirlesin** (platform sadece aralık/öneri sunsun)
- [ ] Bakıcı işi reddedebilsin; münhasırlık dayatılmasın; başka platformlarda çalışabilsin
- [ ] Bakıcı kendi ekipmanını (tasma, araç, ev) kullansın
- [ ] Üniforma, vardiya zorunluluğu, çalışma saati dayatması **OLMASIN**
- [ ] Yazılı **Independent Contractor Agreement** (EN + FR); niyet beyanı + altı faktörle uyumlu hükümler
- [ ] Ürün dilinde dikkat: "çalışanımız", "ekibimiz", "personelimiz" **kullanmayın**; "bağımsız bakıcı" deyin
- [ ] DPWRA'nın şeffaflık maddelerini **gönüllü olarak uygulayın** (algoritma açıklaması, çıkarma bildirimi) — hem itibar hem gelecek mevzuat sigortası

---

## 4. ÖDEME

### 4.1 Stripe Connect — Kanada'da kullanılabilir mi?

**Evet.** Kanada merkezli bir platform, Kanadalı connected account'ları onboard edebilir, CAD'de işlem ve payout yapabilir.

**Önerilen model:**
- **Express hesaplar** — Stripe barındırılan onboarding + KYC'yi Stripe üstlenir, sizin uyum yükünüz azalır
- **Destination charges** veya **separate charges & transfers** — ikincisi fon tutmayı (delayed transfer) daha esnek yönetmenizi sağlar
- Platform ücretini `application_fee_amount` ile alın

**KYC (Kanada, birey connected account) — tipik gereksinimler:** ad/soyad, doğum tarihi, Kanada adresi, **SIN (genelde son 4 hane; risk sinyali varsa tam SIN veya belge)**, kimlik belgesi (sürücü belgesi/pasaport), banka hesabı (transit + institution + account no), ToS kabulü (IP + zaman damgası). Şirket hesaplarında ek olarak işletme adı, BN, tescil no, %25+ pay sahipleri ve yönetici bilgileri. *(Tam ve güncel alan listesi için: https://docs.stripe.com/connect/required-verification-information — ülke/capability seçerek üretilir.)*

### 4.2 Escrow / gecikmeli ödeme — EN ÖNEMLİ TEKNİK BULGU

Stripe dokümantasyonu net:

> *"Escrow'un kesin bir hukuki tanımı vardır ve Stripe escrow hizmeti sunmaz, escrow hesaplarını desteklemez. Ancak manuel payout ile ödeme zamanlamasını kontrol edebilirsiniz."*

**Manuel payout ile fon tutma süresi:**

| Ülke | Maksimum tutma süresi |
|---|---|
| ABD | 2 yıl |
| Tayland | 10 gün |
| **Diğer tüm ülkeler (Kanada dahil)** | **90 gün** |

**Sonuç:** Rover benzeri "hizmet tamamlandıktan 2 gün sonra ödeme serbest bırakılır" modeli Stripe Connect ile **tamamen mümkündür** (90 günün çok altında). Uzun vadeli fon tutma (ör. ihtilaf havuzu, teminat) planlıyorsanız 90 gün sınırına takılırsınız.

**Pazarlama diline dikkat:** Kullanıcılara **"escrow"** demeyin. "Ödemeniz hizmet tamamlanana kadar güvenli şekilde tutulur" / "protected payment" deyin. Kanada'da escrow/para transferi hizmeti sunmak **MSB (Money Services Business)** olarak FINTRAC kaydı gerektirebilir — bu, Stripe Connect kullanarak kaçınmak isteyeceğiniz bir yüktür. **DOĞRULAT: FINTRAC MSB tanımı ve "payment service provider" istisnası + RPAA (Retail Payment Activities Act) kaydı — Bank of Canada nezdinde PSP kaydı Kasım 2024'ten beri zorunlu; platformunuz "payment function" ifa ediyorsa kapsamda olabilir. Bu, mutlaka fintech düzenleme avukatına sorulmalı.**

Kaynak: https://docs.stripe.com/connect/manual-payouts

### 4.3 Alternatifler

| Sağlayıcı | Kanada | Not |
|---|---|---|
| **Stripe Connect** | ✅ | Pazaryerleri için en olgun; 135 para birimi; en geniş doküman/topluluk; **başlangıç için önerilen** |
| **Adyen for Platforms** | ✅ (35 ülke, CAD payout, 15 para birimi) | KYC + yaptırım taraması dahil; işlem başına €0,11 + yöntem ücreti; **minimum fatura taahhüdü var** → erken aşama için uygun değil, ölçeklenince avantajlı |
| **PayPal for Marketplaces / Braintree** | Kısmen | Braintree Marketplace yeni müşterilere kapatıldı; PayPal Commerce Platform değerlendirilebilir. **DOĞRULAT** |
| **Moov** | ❌ | ABD odaklı; Kanada desteği yok/sınırlı. **DOĞRULAT** |
| **Mangopay** | Avrupa odaklı | Kanada desteği sınırlı |

Kaynak: https://www.sharetribe.com/academy/marketplace-payments/adyen-for-platforms-overview/

### 4.4 Kanada'da tercih edilen ödeme yöntemleri

**Ödeme alma (müşteri → platform):**
- **Kredi kartı baskın** — Visa & Mastercard; Amex dar ama yüksek harcamalı segmentte önemli. Kanada'da kredi kartı kullanımı ABD'den bile yüksek (ödül/puan kültürü).
- **Digital wallets** — Kanada'da akıllı telefon sahiplerinin **5'te 4'ünde** en az bir cüzdan uygulaması var. **Apple Pay ve Google Pay'i gün 1'de açın** — mobil dönüşümü belirgin artırır.
- **Interac Debit (online)** — Kanada'ya özgü; bazı işlemcilerde destekleniyor. Faz 2.
- **BNPL** — 2024'te e-ticaret işlemlerinin **%5'i**. Pet sitting için (özellikle çok günlük boarding, 500 CAD+ sepetler) düşünülebilir; faz 2.
- **Interac e-Transfer** — Kanada'da devasa (12 ayda **1,4 milyar+** işlem) ama **P2P odaklı**; kart benzeri gerçek zamanlı e-ticaret checkout'u için doğal değil ve **chargeback koruması yok**. ⚠️ Asıl risk: bakıcı ve müşterinin platformu atlayıp e-Transfer ile anlaşması ("disintermediation"). Rover/Airbnb'nin en büyük problemi budur.

**Ödeme yapma (platform → bakıcı):**
- Stripe payout'ları **CAD banka havalesi (EFT)** ile gider — standart, ücretsiz/düşük maliyetli, 2-3 iş günü.
- **Stripe Instant Payouts** (debit kart üzerinden anında) Kanada'da destekleniyor mu → **DOĞRULAT.** Destekleniyorsa bakıcı edinmede ciddi rekabet avantajı.
- **Interac e-Transfer ile toplu payout** Stripe üzerinden yapılamaz; ayrı bir sağlayıcı (Peoples Trust, Nuvei, Paymentus vb. Bulk e-Transfer) gerekir. Erken aşamada gereksiz karmaşıklık.

Kaynaklar: https://stripe.com/resources/more/payments-in-canada-an-in-depth-guide · https://www.clearlypayments.com/blog/interac-statistics-canada-2025/

### 4.5 Yapılacaklar — Ödeme

- [ ] **Stripe Connect + Express accounts** ile başla; `separate charges and transfers` mimarisi kur
- [ ] Ödeme serbest bırakma politikası: hizmet bitiminden **48 saat sonra** transfer (ihtilaf penceresi) — 90 gün sınırının çok altında kal
- [ ] Checkout: kart + **Apple Pay + Google Pay**; CAD varsayılan; fiyatlarda **vergi dahil/hariç açıkça belirtilsin** (drip pricing yasağı — bkz. §6)
- [ ] Bakıcı payout: haftalık otomatik EFT, ayrıca "instant payout" fizibilitesi araştır
- [ ] **Chargeback stratejisi:** hizmet kanıtı (GPS log, foto, mesaj geçmişi, check-in/check-out) sistematik olarak sakla — kart itirazlarında tek savunmanız bu
- [ ] **Disintermediation önleme:** mesajlaşmada telefon/e-posta/e-Transfer maskeleme, platform dışı ödeme teklifi tespiti, platform içi ödemeye bağlı garanti/sigorta teşviki
- [ ] **RPAA (Retail Payment Activities Act) PSP kaydı** ve **FINTRAC MSB** kapsam analizi → fintech avukatı **(DOĞRULAT — bu maddeyi atlamayın)**

---

## 5. GÜVEN VE GÜVENLİK

### 5.1 Arka plan kontrolü (Background Check)

**A) Sağlayıcılar ve maliyet**

| Sağlayıcı | Ürün | Fiyat (CAD) | Süre |
|---|---|---|---|
| **Certn** | Basic Canadian Criminal Record Check (federal CPIC veritabanı) | **24,99** | 4–72 saat |
| Certn | **Enhanced** CRC (+ CPIC Investigative Data Bank + Police Information Portal) | **29,99** | 4–72 saat |
| Certn | **Québec Record Check (SOQUIJ)** — Québec ceza mahkemesi kayıtları | **39,99** | 1 gün |
| Certn | **OneID** — biyometrik kimlik doğrulama (canlı selfie ↔ resmî kimlik) | **4,99** | Anında |
| Certn | Kredi raporu / istihdam doğrulama / referans | 12,99 / 29,99 / 4,49 | — |
| **Sterling Backcheck** (First Advantage) | Kurumsal, hacimli; Kanada'nın en köklü sağlayıcılarından | Sözleşmeli fiyatlama | — |
| **Triton Canada** | Online, hesap açılışı ücretsiz; KOBİ dostu | Sözleşmeli | — |

Kaynaklar: https://certn.co/pricing/ · https://www.sterlingbackcheck.ca/ · https://www.tritoncanada.ca/

**Tipik birim maliyet öngörüsü:** Enhanced CRC + OneID ≈ **35 CAD/bakıcı**. 10.000 bakıcı için ~350.000 CAD. → **Maliyeti bakıcıya yansıtma (Rover modeli: bakıcı öder) veya kademeli rozet sistemi kurun.**

**B) ⚠️ Vulnerable Sector Check (VSC) ALAMASSINIZ — kritik**

- VSC **yalnızca yerel polis** tarafından yapılır (BC'de BC Criminal Records Review Program).
- Yalnızca **18 yaş altı çocuklar veya savunmasız kişiler** üzerinde güven/otorite konumundaki roller için istenebilir.
- **Evcil hayvanlar "vulnerable person" tanımına girmez.**
- Özel tarama şirketleri VSC yapamaz.
- Pozisyon kriterleri karşılamıyorsa VSC talep etmek **suçtur**.

→ **Ürün/pazarlama sonucu:** "Tüm bakıcılarımız vulnerable sector taramasından geçmiştir" gibi bir iddia **hem yanlış hem hukuken riskli** olur (Competition Act yanıltıcı beyan). Doğru dil: *"Enhanced Criminal Record Check + biyometrik kimlik doğrulaması"*.

Kaynak: https://rcmp.ca/en/criminal-records/criminal-record-checks/vulnerable-sector-checks

**C) Yasal kısıtlar**

**Québec — Charter of Human Rights and Freedoms, s.18.2:**
Bir kişi, **yalnızca** bir ceza/penal mahkûmiyeti olduğu için işe alınmaktan reddedilemez, eğer:
- suç **işle bağlantılı değilse**, VEYA
- kişi **af/record suspension** almışsa (bu durumda bağlantı olsa bile dikkate alınamaz — tam koruma).

"Bağlantı testi" bireysel ve olgusal olmalı: suçun ağırlığı ve zamanı, işin nitelikleri, müşteri profili, itibara/hizmete somut etki, tekerrür riski. Stereotip veya genelleme yasak. *Roussin Bizier* kararında "test sürüşünde müşteri savunmasız olur" argümanı yetersiz bulundu; medyada yer alması ve itibar endişesi tek başına yeterli değil.

⚠️ s.18.2 metni istihdamı ("employer") hedefler. **Bağımsız yüklenicilere ve platform erişim kararlarına uygulanıp uygulanmadığı tartışmalıdır — DOĞRULAT (Québec iş hukuku avukatı).** Riski azaltmak için Québec'te "otomatik red" yerine **suç–iş bağlantısı matrisi + bireysel inceleme** kurun (bu aynı zamanda Law 25 s.12.1 otomatik karar yükümlülüğüyle de örtüşür).

Kaynaklar: https://www.blakes.com/insights/hires-dismissals-and-criminal-records-what-quebec-employers-need-to-know/ · https://www.cdpdj.qc.ca/en/frequently-asked-questions/hiring-and-employment-employees-and-people-looking-work

**Diğer kısıtlar:**
- **Ontario Police Record Checks Reform Act, 2015:** üç tür kontrol tanımlar; hangi bilgilerin açıklanabileceğini sınırlar; sonucun **önce başvurana** gösterilip onay alınmasını gerektirir. **DOĞRULAT.**
- **Provincial Consumer Reporting Acts** (Ontario CRA, BC, AB, SK, MB, NS, PEI, NL): tarama sağlayıcısı "consumer reporting agency" ise özel rıza, bildirim ve olumsuz karar bildirimi kuralları devreye girer. **DOĞRULAT.**
- **PIPEDA/Law 25:** Adli sicil = hassas veri → açık ve ayrı rıza, amaçla sınırlı kullanım, kısa saklama süresi, yalnızca "geçti/geçmedi" sonucunun sistemde tutulması (ham raporu saklamayın).

### 5.2 Kimlik doğrulama

**Persona, Onfido (artık Entrust bünyesinde), Veriff** — üçü de Kanada belgelerini destekler: Kanada pasaportu, tüm eyalet/bölge sürücü belgeleri, PR kartı. Veriff 230+ ülke kapsamı belirtir.

**Kanada'ya özgü dikkat noktaları:**
- **Provincial DL kapsamı sağlayıcıdan sağlayıcıya değişir** — özellikle Québec (SAAQ), Ontario, BC belgelerinin doğruluk oranlarını PoC ile ölçün.
- **Québec Law 25 biyometri kuralı:** Yüz eşleştirme/liveness kullanacaksanız, **biyometrik veri bankası oluşturmayı CAI'ye 60 gün önce bildirmek zorunludur.** Bu, çoğu global sağlayıcının müşterilerine hatırlatmadığı bir yükümlülüktür. **Mimari çözüm:** biyometrik şablonu **siz saklamayın**, sağlayıcıda tutulsun ve mümkün olan en kısa sürede silinsin; yine de bildirim yükümlülüğünü **DOĞRULAT.**
- **Certn OneID (4,99 CAD)** — Kanada'ya özgü, arka plan kontrolüyle aynı sağlayıcıda olması entegrasyonu tek kalemde çözer. Küçük/orta ölçekte en pragmatik seçenek.
- **FINTRAC-uyumlu kimlik doğrulama metotları** (photo ID method, credit file method, dual-process method) — eğer PSP/MSB kapsamına girerseniz gerekli. **DOĞRULAT.**

Kaynaklar: https://www.veriff.com/supported-countries · https://www.deepidv.com/media/articles/identity-verification-canada-fintrac-kyc-2026

### 5.3 Sigorta

**A) Bir pet sitting işletmesinin ihtiyacı olan poliçeler (Kanada):**

| Poliçe | Ne kapsar | Not |
|---|---|---|
| **Commercial General Liability (CGL)** | Üçüncü kişilere veya hayvanlara kazara bedensel zarar, başkasının malına kazara zarar | Minimum **2M CAD** (Toronto izni için zorunlu), Metro Vancouver için **5M CAD** |
| **Care, Custody & Control / Animal Bailee** | **Bakım altındaki hayvanın kendisine gelen zarar** — CGL bunu *hariç tutar*. Pet sitting için asıl kritik teminat | Standart CGL'e ek endorsement olarak alınır |
| **Professional Liability (E&O)** | Mesleki ihmal/hatalı tavsiye | |
| **Bonding / Fidelity** | Bakıcının müşteri evinden hırsızlığı | Anahtar teslimi olan modelde önemli |
| **Tenant's Legal Liability / Property** | Müşteri evinde yangın/su hasarı | |
| **Cyber / Privacy Liability** | **Platform için** — veri ihlali, Law 25 toplu dava riski | Platformun kendi poliçesi |

**Maliyet:** Kanada'da temel bir pet sitting işletmesi için 1M CAD CGL + 1M CAD professional liability ≈ **yıllık ~100 CAD** seviyesinden başlayabiliyor (Zensurance). Ölçek, tür, çalışan sayısı ve gelirle artar.

**Kanada'da erişilebilen kanallar:** **Zensurance** (Toronto merkezli, 50+ Kanadalı sigortacıyla broker), **APOLLO Insurance**, **Ratehub** üzerinden karşılaştırma. Pazaryeri düzeyinde grup/master poliçe için **Aon, Marsh, Gallagher** gibi büyük brokerlarla "marketplace/sharing economy" masaları üzerinden gidilmeli. **DOĞRULAT — hangi Kanadalı sigortacının gerçekten platform-level master policy (sitter'ları named insured/additional insured yapan) yazdığı araştırılmalı; bu piyasa dardır.**

Kaynaklar: https://www.zensurance.com/pet-services-insurance/pet-sitting · https://www.ratehub.ca/blog/dog-walking-pet-sitting-insurance/

**B) Rover'ın Kanada'daki garanti yapısı — model olarak inceleyin**

Rover Guarantee (Kanada, CAD):

| Kalem | Tutar |
|---|---|
| Veteriner bakımı (olay başına) | **25.000 CAD** |
| Mal hasarı (olay başına) | **100.000 CAD** |
| Üçüncü kişi yaralanması | **100.000 CAD** |
| **Muafiyet (minimum katkı)** | **250 CAD** — bunun altındaki talepler ödenmez |
| Kapsam için minimum rezervasyon ödemesi | hizmet günü başına **10 CAD** |

**Prosedür:** Zarardan itibaren **48 saat içinde** bildirim, **14 gün içinde** belge sunumu, tedavi masrafları yaralanmadan sonraki **30 gün içinde** oluşmuş olmalı.

**Hariç tutulanlar:** mevcut/ önceden var olan hastalıklar, ırka özgü durumlar, kronik ve ortopedik durumlar, aşı ile önlenebilir hastalıklar, parazit/bakteriyel enfeksiyonlar, tıbbi olmayan giderler, **hayvan sahibinin kendi hayvanının verdiği zarar**, olağan yıpranma.

⚠️ **En önemli nokta:** Rover açıkça büyük harflerle belirtiyor — **"THE ROVER GUARANTEE IS NOT INSURANCE"** ve mevcut sigortaların yerine geçmez. Yani bu bir **sigorta ürünü değil, sözleşmesel bir tazmin (indemnity/reimbursement) programıdır.**

→ **Sizin için çıkarım:** Aynı yapıyı kurabilirsiniz ve bu, sigorta düzenlemesine (Kanada'da eyalet bazlı insurance regulator + broker lisansı) girmeden hareket etmenizi sağlar. **ANCAK bu ayrım hukuken hassastır — "sigorta işi yapma" (carrying on the business of insurance) tanımına girmemek için mutlaka Kanadalı sigorta düzenleme avukatına doğrulatın. DOĞRULAT — bu, raporun en riskli maddesidir.** Arkasına gerçek bir reasürans/master poliçe koymak hem bilanço riskini hem düzenleyici riski azaltır.

Kaynaklar: https://www.rover.com/terms/guarantee/ · https://support-ca.rover.com/hc/en-ca/articles/360036958191

### 5.4 Belediye / eyalet lisansları

**Toronto**

1. **Commercial Dog Walker Permit** (City of Toronto parkları için)
   - **4–6 köpeği** ticari olarak gezdirme izni verir
   - Ücret (1 Ocak 2026): **1 yıl 305,99 CAD** / 6 ay 153,00 CAD / 3 ay 76,50 CAD
   - **Zorunlu: 2.000.000 CAD Commercial General Liability**, bedensel zarar + mal hasarı + kişisel zarar, **City of Toronto "additional insured" olarak** ve izin süresi boyunca geçerli
   - Municipal Code Ch. 608 (Parks) ve Ch. 349 (Animals) uyumu; ihlaller kayıt altına alınır, izin askıya alınabilir
   - ⚠️ İzinsiz olarak aynı anda kaç köpek gezdirilebileceği (genel bylaw limiti) **DOĞRULAT — Toronto Municipal Code Ch. 349**
   - https://www.toronto.ca/services-payments/permits-licences-bylaws/commercial-dog-walker-permit/

2. **Pet Establishment Licence — YENİ, 1 Şubat 2027'de yürürlüğe giriyor**
   - Temmuz 2025'te Meclis onayladı; mevcut "Pet Shop" lisansının yerine geçiyor
   - **Kapsam: hayvan satışı/sahiplendirme, üretim, daycare, BOARDING, eğitim, grooming, GECELİK HAYVAN BAKIMI**
   - Veteriner, barınak ve kurtarma kuruluşları hariç
   - Standartlar: hayvan bakımı, besleme ve elleçleme, barınma, tesis temizliği/sanitasyonu, **kayıt tutma, SİGORTA**
   - Tek lisans tüm endorsement'ları kapsar, ek ücret yok
   - Şehir Sonbahar 2026'da detay + self-assessment aracı yayımlayacak
   - ⚠️ **Bu, sizin "boarding/overnight" arzınızın büyük kısmını doğrudan etkiler.** Evde barındırma yapan bakıcıların lisanslı olması gerekip gerekmediği (ticari tesis vs. özel konut ayrımı) **DOĞRULAT — Toronto Municipal Licensing & Standards'a doğrudan sorulmalı**
   - https://www.toronto.ca/services-payments/permits-licences-bylaws/pet-establishment-licensing-review/

**Vancouver / Metro Vancouver**

3. **Metro Vancouver Regional Parks — Commercial Use Dog Walking Permit**
   - Başvuru ücreti: **200 CAD + GST** (ilk kez)
   - İzin ücreti: **gezdirici başına 250 CAD + GST**
   - Yelek: **50 CAD/adet** (zorunlu)
   - **Zorunlu: minimum 5.000.000 CAD Comprehensive General Liability (olay başına)**
   - Bylaw 1420 s.66 — izinsiz ticari faaliyet yasak
   - ⚠️ **Pacific Spirit Regional Park 2026 için kotası doldu, başvurular kapalı** — arz planlamasında dikkate alın
   - İşlem süresi ~4 hafta; ayrıca **belediye business licence** gerekebilir
   - https://metrovancouver.org/services/regional-parks/commercial-use-dog-walking-permit

4. Ayrıca **City of Vancouver** ve **District of North/West Vancouver** kendi ticari köpek gezdirme izinlerini istiyor — her belediye ayrı. **DOĞRULAT: aynı anda gezdirilebilecek köpek sayısı limiti belediyeden belediyeye değişir (tipik 4–6).**

**Genel ilke:** Kanada'da pet care lisanslaması **neredeyse tamamen belediye düzeyindedir**, eyalet düzeyinde tek tip bir "pet sitter lisansı" yoktur. Boarding/kennel ise zoning (imar) kurallarına takılır — konutta ticari kennel çoğu yerde yasaktır.

**Hayvan refahı mevzuatı (arka plan):**
- Federal: Criminal Code hayvana eziyet maddeleri
- Ontario: **PAWS Act (Provincial Animal Welfare Services Act, 2019)** — Kanada'nın en sert eyalet hayvan refahı yasası, standartlar + müfettiş yetkileri
- BC: **Prevention of Cruelty to Animals Act (PCAA)** + BC SPCA
- Québec: **Animal Welfare and Safety Act (B-3.1)** — hayvanlar "duyarlı varlık (sentient being)" olarak tanımlı; MAPAQ denetimi
- **DOĞRULAT: her eyaletin "hayvan bakım standartları" yönetmeliği, bakıcı eğitim içeriğinize kaynak olmalı**

### 5.5 Yapılacaklar — Güven ve Güvenlik

**Bakıcı onboarding (kademeli rozet sistemi önerisi)**
- [ ] **Seviye 1 — Doğrulanmış Kimlik:** Certn OneID veya Persona/Veriff biyometrik ID (~5 CAD)
- [ ] **Seviye 2 — Adli Sicil Temiz:** Enhanced Canadian CRC (~30 CAD) + Québec'te SOQUIJ (~40 CAD)
- [ ] **Seviye 3 — Lisanslı/Sigortalı:** belediye izni + CGL + care/custody/control poliçesi belgesi yüklenmiş
- [ ] **Seviye 4 — Sertifikalı:** pet first aid sertifikası, platform eğitimi tamamlanmış
- [ ] Yeniden tarama politikası: yıllık veya 2 yılda bir yeniden CRC (**DOĞRULAT: yeniden rıza gerekliliği**)
- [ ] Adli sicil sonucunda **ham raporu saklamayın** — yalnızca karar + tarih + sağlayıcı referansı
- [ ] Québec için **ayrı karar akışı**: otomatik red yok; suç–iş bağlantısı matrisi + insan incelemesi + Law 25 s.12.1 bildirimi
- [ ] Belediye izni gereken hizmet türleri için (Toronto/Vancouver gezdirme, Toronto boarding 2027+) **listeleme öncesi belge zorunluluğu**

**Sigorta / garanti**
- [ ] Kanadalı marketplace broker'ı ile master poliçe fizibilitesi (Aon / Marsh / Gallagher)
- [ ] Rover benzeri "Guarantee" programı tasarla: vet 25.000 CAD, mal hasarı 100.000 CAD, 3. kişi 100.000 CAD, 250 CAD muafiyet, 48 saat bildirim
- [ ] **"Sigorta değildir" ibaresini şartlarda büyük harfle ve belirgin şekilde belirt** (EN + FR)
- [ ] Bakıcılara kendi CGL + animal bailee poliçelerini almalarını teşvik et; Zensurance/APOLLO ile affiliate/indirim anlaşması
- [ ] Platform için **Cyber/Privacy Liability + Tech E&O** poliçesi (Law 25 toplu dava riski)

**Operasyonel güvenlik**
- [ ] 7/24 acil hat (Rover'ın Kanada hattı var: 438-799-5595 — benchmark)
- [ ] Acil veteriner protokolü + önceden anlaşmalı veteriner ağı
- [ ] GPS izli gezinti + foto/video check-in/check-out (hem güven hem chargeback kanıtı)
- [ ] Olay bildirimi ve eskalasyon akışı; Trust & Safety ekibi
- [ ] Bakıcı çıkarma (deactivation) politikası: yazılı gerekçe + itiraz kanalı (DPWRA standardını gönüllü uygula)

---

## 6. TÜKETİCİ KORUMA, REKLAM VE ERİŞİLEBİLİRLİK

### 6.1 Online sözleşmeler — eyalet bazlı

Tüketici koruma Kanada'da **eyalet yetkisindedir**; ulusal bir platform her eyaletin kuralına tabidir. En yüksek ortak paydayı hedefleyin.

**Ontario — Consumer Protection Act, 2002 ("Internet Agreement" hükümleri):**
- Sözleşme kurulmadan **önce** belirlenmiş bilgiler açıklanmalı (kimlik, tam fiyat, teslimat/ifa tarihi, iptal/iade politikası, tüm ek ücretler)
- Tüketiciye teklifi **açıkça kabul veya reddetme** ve **hataları düzeltme** fırsatı verilmeli
- Sözleşme kopyası belirli süre içinde teslim edilmeli
- Ön bilgilendirme yapılmadıysa tüketici **7 gün**, kopya verilmediyse **30 gün** içinde iptal edebilir
- İptal edilen sözleşmede iade edilmezse **kredi kartı chargeback hakkı** (statutory chargeback)
- ⚠️ **Consumer Protection Act, 2023** kabul edildi ama **henüz yürürlükte değil** — otomatik yenileme, tek taraflı değişiklik ve iptal kolaylığı konularında sıkılaştırma getirecek. **Yürürlük tarihini takip edin.**
- https://www.mannlawyers.com/resources/internet-agreements-with-ontario-consumers-consumer-protection-act-considerations-for-businesses/

**Québec — Consumer Protection Act (P-40.1), distance contracts:**
- Satın alma **öncesi** ekranda, belirgin ve anlaşılır şekilde: işletme adı/adresi, ayrıntılı hizmet tanımı, kalem kalem fiyat ve tüm ücretler, ifa tarihi, iptal/iade politikası — **yazdırılabilir veya PDF olarak kaydedilebilir** olmalı
- Kabul öncesi **açık kabul/ret ve hata düzeltme** fırsatı
- Sözleşme kopyası **15 gün içinde**, tüketicinin kolayca saklayıp yazdırabileceği formatta
- **"All-inclusive" fiyat reklamı:** reklamda ödenecek tüm tutarlar gösterilmeli; GST/QST checkout'ta eklenebilir ama **toplam fiyat bileşenlerden daha belirgin** gösterilmeli
- **Statutory chargeback** hakkı mevcut
- **Bill 10 & Bill 24:** deneme süresi bitişi ve tekrarlayan olmayan ücretler için ek açıklama; abonelik iptali için **kolayca bulunabilir bir mekanizma**; Bill 24 ticari sunumlarda kişinin **kimliğinin/görüntüsünün rızasız kullanımını yasaklıyor** (AI üretimi içerik dahil — sentetik bakıcı fotoğrafı/testimonial kullanmayın)
- https://www.lavery.ca/en/publications/our-publications/3223-e-commerce-your-obligations-regarding-the-consumer-protection-act-cpa-and-competition-matters.html

**British Columbia — Bill 4 (1 Ağustos 2025'ten itibaren):**
- **60 günden uzun** otomatik yenilemelerde tüketici **her zaman, cezasız ve gecikmesiz** iptal edebilmeli; yenilemeden sonraki **15 gün içinde iade**
- Yenileme öncesi **30–60 gün** önceden bildirim
- 60 günlük veya daha kısa yenilemelerde yenileme öncesi/sonrası her zaman ücretsiz iptal
- ⚠️ **Tüketici yorumlarını engelleyen sözleşme maddeleri, zorunlu tahkim ve toplu dava yasağı maddeleri YASAK** — ToS'unuzu buna göre yazın

**Manitoba — Bill 49 (1 Temmuz 2025):**
- **Kişiselleştirilmiş algoritmik fiyatlandırma yasak** (bireysel tüketici verisine göre fiyat ayarlamak) — haksız ticari uygulama sayılıyor; tekrarda **1.000.000 CAD**'e kadar ceza
- ⚠️ Dinamik fiyatlandırma tasarlarken kritik: **arz/talep bazlı** fiyatlama ile **kişi bazlı** fiyatlama arasındaki çizgiyi net tutun

Kaynak: https://www.torys.com/our-latest-thinking/publications/2026/07/provincial-governments-continue-to-tighten-consumer-protection-laws

### 6.2 Competition Act — reklam, yorumlar, fiyatlandırma

**A) Drip pricing (kademeli fiyat açıklama) — YASAK**
Erişilemeyen bir fiyatı reklam etmek (zorunlu ücretler sonradan eklenerek) açıkça yanıltıcı sayılıyor. **Tek istisna: devlet tarafından konulan vergi ve harçlar.**
→ Platform hizmet ücreti, Trust & Safety ücreti, rezervasyon ücreti gibi kalemler **ilk gösterilen fiyata dahil olmalı** veya en baştan görünmeli. GST/HST hariç bırakılabilir.

**B) Testimonial ve yorumlar (s.74.02) — ÇOK KATI**
Bir testimonial veya test beyanı yayımlamak için:
1. Üçüncü kişi onu **daha önce kendisi yayımlamış** olmalı, **VEYA**
2. Üçüncü kişinin **yazılı onayını + yayın iznini** almış olmalısınız
3. Yayımlanan hali, kişinin söylediğiyle **birebir tutarlı** olmalı (nitelendirmeleri/çekinceleri atarak sadece olumlu kısmı almak ihlaldir)

**C) Greenwashing (2024 C-59 değişiklikleri)** — çevre iddiaları "adequate and proper test" veya "uluslararası kabul görmüş metodoloji" ile kanıtlanmalı; ispat yükü ilan verende. ("Karbon nötr gezdirme" gibi iddialardan kaçının.)

**D) Ordinary Selling Price** — indirim iddialarında "normal fiyat"ın gerçekliğini ispat yükü satıcıda; fiyat kayıtlarını tutun.

**E) Cezalar (idari, hukuki yol):**
| | İlk ihlal | Sonraki |
|---|---|---|
| Birey | 750.000 CAD (veya 3x kazanç) | 1.000.000 CAD |
| **Şirket** | **10.000.000 CAD** veya 3x kazanç veya **yıllık dünya brüt gelirinin %3'ü** (hangisi yüksekse) | **15.000.000 CAD** |

**F) ⚠️ Özel dava erişimi:** **20 Haziran 2025**'ten itibaren özel taraflar yanıltıcı pazarlama dahil konularda **doğrudan Competition Tribunal'a** başvurabiliyor (ve tazminat dağıtımı talep edebiliyor). Bu, rakip veya tüketici gruplarının doğrudan sizi hedef alabileceği anlamına gelir — sadece Bureau'nun önceliklerine bakmak yetmez.

Kaynaklar: https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/use-tests-or-testimonials · https://www.fasken.com/en/knowledge/2024/07/the-evolving-competition-law-landscape-in-ca-4 · https://www.dwpv.com/en/insights/2025/expanded-scope-private-actions-competition-act

### 6.3 Erişilebilirlik

**Ontario — AODA (Integrated Accessibility Standards Regulation):**
- **Ontario'da 1+ çalışanı olan her kuruluş** AODA kapsamında (merkez nerede olursa olsun)
- **50+ çalışan** → kamuya açık web siteleri ve içerik **WCAG 2.0 Level AA** uyumlu olmalı (son tarih zaten geçti: 1 Ocak 2021)
- İki muafiyet: **canlı altyazı (1.2.4)** ve **önceden kaydedilmiş sesli betimleme (1.2.5)**
- **20+ çalışan** → her 3 yılda bir **uyum raporu (Accessibility Compliance Report)** dosyalama
- Yönetmelik hâlâ WCAG **2.0**'a atıf yapıyor (2.1/2.2'ye güncellenmedi)
- Cezalar: şirketler için **500–15.000 CAD**; teorik günlük maksimum 100.000 CAD. Pratikte icra zayıf (2017'den beri sadece 45 uyum emri) ama **özel dava ve insan hakları şikâyeti riski ayrıca var.**

**Federal — Accessible Canada Act:** yalnızca **federal düzenlemeye tabi sektörler** (banka, telekom, ulaştırma). **WCAG 2.1 AA** referans alır. **Pet sitting pazaryeri kapsam dışı.**

**Diğer:** Manitoba (AMA), BC (Accessible British Columbia Act), Nova Scotia, Saskatchewan kendi erişilebilirlik yasalarını kademeli olarak yürürlüğe koyuyor. **DOĞRULAT — bu alan hızlı değişiyor.**

**Öneri:** Baştan **WCAG 2.2 Level AA** hedefleyin. 2.0'ın üstüne çıkmak maliyeti belirgin artırmaz, tüm eyaletleri ve ileri tarihli güncellemeleri kapsar, mobil uyumluluk kriterleri (target size, dragging movements) 2.2'de zaten var.

Kaynaklar: https://www.accessibility.works/aoda-website-accessibility-requirements/ · https://www.levelaccess.com/compliance-overview/accessibility-for-ontarians-with-disabilities-act-aoda-compliance/

### 6.4 BONUS — CASL (Canada's Anti-Spam Legislation)

Talep listesinde yoktu ama **bir pazaryeri için kaçınılmaz ve cezaları çok yüksek**:

- **CEM (Commercial Electronic Message):** amacı alıcıyı ticari faaliyete katılmaya teşvik eden her e-posta/SMS/mesaj
- **Açık rıza (express):** ön işaretli kutu **YASAK**; kullanıcı aktif olarak işaretlemeli; ispat yükü sizde
- **Zımni rıza (implied):** mevcut iş ilişkisi (satın alma/sözleşme) → **2 yıl**; sorgu/başvuru → 6 ay
- **Her CEM'de zorunlu:** gönderenin kimliği + adına gönderilenler + iletişim bilgisi + **abonelikten çıkma (unsubscribe) mekanizması**
- Unsubscribe: kolay ve hızlı olmalı, link **gönderimden sonra en az 60 gün** geçerli kalmalı, talep **10 iş günü** içinde işlenmeli
- **Muafiyetler:** işlemsel/operasyonel mesajlar (rezervasyon onayı, ödeme bildirimi, güvenlik uyarısı), kapalı hesap içi bildirimler
- **Cezalar:** birey **1M CAD**, şirket **10M CAD** / ihlal başına. **Yönetici ve yöneticiler kişisel sorumlu olabilir.**
- Özel dava hakkı (private right of action) askıya alınmış durumda — **DOĞRULAT, yürürlüğe girip girmediği takip edilmeli**

Kaynaklar: https://crtc.gc.ca/eng/com500/faq500.htm · https://crtc.gc.ca/eng/com500/guide.htm

### 6.5 Yapılacaklar — Tüketici / Reklam / Erişilebilirlik

- [ ] **Tüm ücretler ilk gösterilen fiyata dahil** (drip pricing yasağı) — yalnızca GST/HST checkout'ta eklenebilir
- [ ] Checkout akışı: satın alma öncesi tam bilgi ekranı + **açık kabul + hata düzeltme adımı** + yazdırılabilir/PDF özet
- [ ] Sözleşme kopyası **15 gün içinde** e-posta ile (Québec eşiği en katı olan)
- [ ] **İptal/iade politikası** net, erişilebilir, EN+FR; bakıcının belirlediği iptal politikaları için standart şablonlar
- [ ] **Abonelik/üyelik ürünü çıkarırsanız:** BC Bill 4 kurallarına göre yenileme bildirimi + her an ücretsiz iptal + tek tıkla iptal mekanizması
- [ ] **ToS'tan çıkarın:** tüketici yorumunu engelleyen maddeler, zorunlu tahkim, toplu dava feragati (BC'de yasak; diğer eyaletlerde de riskli — Uber v. Heller, 2020 SCC 16)
- [ ] **Yorum sistemi:** yalnızca **doğrulanmış rezervasyon** sonrası yorum; teşvikli yorum politikası açıkça ifşa edilmeli; yorumları düzenlemeyin/kırpmayın; öne çıkan testimonial kullanacaksanız **yazılı izin alın ve saklayın**
- [ ] AI üretimi bakıcı fotoğrafı/yorumu **kullanmayın** (Québec Bill 24 + Competition Act)
- [ ] Kişiselleştirilmiş algoritmik fiyatlandırma **yapmayın** (Manitoba yasağı); dinamik fiyat kullanacaksanız arz/talep temelli ve şeffaf olsun
- [ ] **WCAG 2.2 AA** hedefiyle tasarla; otomatik test (axe/Lighthouse) CI'ya ekle + yılda bir manuel denetim; Accessibility Statement sayfası
- [ ] Ontario'da 20+ çalışana ulaşınca **AODA uyum raporu** takvimini kur
- [ ] **CASL:** çift opt-in pazarlama listesi + rıza kanıtı veritabanı (tarih, IP, yöntem) + her e-postada unsubscribe + işlemsel/pazarlama ayrımı net

---

## 7. ÖNCELİKLİ UYGULAMA PLANI

### Faz 0 — Lansman öncesi (mutlak zorunlu)
1. Kanada tüzel kişiliği + BN + GST/HST kaydı (+ QST)
2. **Hukuk ekibi:** (a) genel ticaret/pazaryeri avukatı ON, (b) Québec avukatı (Law 25 + Bill 96), (c) fintech/ödeme düzenleme avukatı (RPAA/FINTRAC), (d) GST/HST uzmanı CPA, (e) sigorta düzenleme avukatı (garanti programı için)
3. ToS + Privacy Policy + Bakıcı Sözleşmesi + Garanti Şartları — **EN ve Québec FR**, hukuken denetlenmiş
4. Stripe Connect Express entegrasyonu + 48 saatlik gecikmeli transfer
5. Kimlik doğrulama + Enhanced CRC (Certn) entegrasyonu
6. Gizlilik sorumlusu atama + opt-in CMP + veri envanteri + PIA'lar
7. Toronto/Vancouver belediye izin bilgilendirmesi bakıcı onboarding'ine gömülü
8. WCAG 2.2 AA baz uyum + drip pricing'siz fiyat gösterimi

### Faz 1 — İlk 6 ay
9. Part XX raporlama motoru (ilk dosyalama 31 Ocak)
10. Garanti programı + sigorta broker anlaşması
11. Fransızca müşteri desteği
12. AODA uyum raporu takvimi; CASL rıza altyapısı
13. Bakıcı vergi eğitimi/kaynakları (30.000 CAD eşiği, GST/HST kaydı)

### Faz 2 — Ölçeklenirken
14. Adyen for Platforms fizibilitesi (hacim eşiğine gelince)
15. Instant payout / BNPL / Interac Debit
16. Toronto Pet Establishment lisansı (Şubat 2027) için boarding bakıcı uyum programı
17. Ontario CPA 2023 yürürlüğe girdiğinde uyum güncellemesi

---

## 8. HUKUK DANIŞMANINA MUTLAKA DOĞRULATILACAKLAR

| # | Konu | Kime |
|---|---|---|
| 1 | **Garanti programının "sigorta işi" sayılıp sayılmayacağı** (en yüksek risk) | Sigorta düzenleme avukatı |
| 2 | **RPAA (PSP kaydı) ve FINTRAC MSB** kapsamına girip girmediğiniz | Fintech düzenleme avukatı |
| 3 | GST/HST: platformun **acente mi asıl mı** olduğu ve deemed supplier kurallarının gerçekten dışında kalıp kalmadığınız | GST/HST uzmanı CPA |
| 4 | Bill 96 s.55 **yapışma sözleşmesinin e-ticaret akışında teknik olarak nasıl karşılanacağı** | Québec avukatı |
| 5 | Québec Charter **s.18.2'nin bağımsız yüklenicilere/platform erişim kararlarına uygulanıp uygulanmadığı** | Québec iş hukuku avukatı |
| 6 | **Biyometrik ID doğrulamada CAI'ye 60 gün bildirim** yükümlülüğünün kapsamı | Québec gizlilik avukatı |
| 7 | Toronto **Pet Establishment lisansının evde barındırma yapan bireysel bakıcıları kapsayıp kapsamadığı** | Toronto MLS'e doğrudan sorgu + belediye hukuku |
| 8 | Provincial **Consumer Reporting Acts** ve Ontario **Police Record Checks Reform Act**'in tarama akışınıza etkisi | İstihdam/gizlilik avukatı |
| 9 | Part XX raporlamasında **banka hesap tanımlayıcısı** dahil hangi alanların zorunlu olduğu | CPA + CRA teknik rehberi |
| 10 | Vergi oranları (özellikle **NS %14**) ve BC PST'nin pet care hizmetlerine uygulanıp uygulanmadığı | CPA |
| 11 | **Stripe Instant Payouts** Kanada desteği | Stripe hesap yöneticisi |
| 12 | Braintree/PayPal Marketplace ve Moov'un Kanada durumu | Sağlayıcılara doğrudan |
| 13 | CASL **private right of action**'ın yürürlük durumu | Ticaret avukatı |
| 14 | Belediye bazlı **maksimum köpek sayısı** limitleri (Toronto Ch. 349, Vancouver) | Belediye sorgusu |
| 15 | PIPEDA s.28 **ceza tutarları** ve icra pratiği | Gizlilik avukatı |

---

## Kaynaklar

**Veri koruma**
- [OPC — Provincial laws that may apply instead of PIPEDA](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/r_o_p/prov-pipeda/)
- [OPC — What you need to know about mandatory reporting of breaches](https://www.priv.gc.ca/en/privacy-topics/privacy-breaches/respond-to-a-privacy-breach-at-your-business/gd_pb_201810/)
- [Osano — What Is Quebec's Law 25?](https://www.osano.com/articles/quebec-law-25)
- [Torys — Automated decision-making: what Québec's Bill 64 reforms mean for business](https://www.torys.com/en/our-latest-thinking/publications/2022/04/automated-decision-making)
- [BLG — Canadian privacy laws and data protection](https://www.blg.com/en/insights/perspectives/doing-business-in-canada/canadian-privacy-laws-and-data-protection)

**Dil**
- [Éducaloi — Language Legislation: Does Your Website Comply?](https://educaloi.qc.ca/en/understanding-the-law/language-legislation-does-your-website-comply/)
- [Gowling WLG — Bill 96's "French First" rule and contracts of adhesion](https://gowlingwlg.com/en/insights-resources/articles/2023/bill-96-s-french-first-rule-takes-effect)
- [McCarthy Tétrault — Bill 96 and June 1, 2025: Common Misconceptions](https://www.mccarthy.ca/en/insights/blogs/consumer-markets-perspectives/french-language-requirements-bill-96-and-june-1-2025-common-misconceptions)
- [Osler — Bill C-13: Use of French in Federally Regulated Private Businesses Act](https://www.osler.com/en/insights/updates/bill-c-13-parliament-enacts-the-use-of-french-in-federally-regulated-private-businesses-act/)
- [Smart & Biggar — Québec's French language requirements for commerce and business](https://www.smartbiggar.ca/insights/publication/quebecs-french-language-requirements-for-commerce-and-business-reform-of-the-charter-of-the-french-language)

**Vergi ve platform raporlama**
- [CRA — Guidance on the Reporting Rules for Digital Platform Operators](https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/compliance/reporting-rules-digital-platforms/guidance-on-reporting-rules.html)
- [CRA — Reporting Rules for Digital Platforms (ana sayfa)](https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/compliance/reporting-rules-digital-platforms.html)
- [CRA — RC4110 Employee or Self-employed?](https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4110/employee-self-employed.html)
- [Stripe — Understanding the tax obligations of marketplaces in Canada](https://stripe.com/guides/understanding-the-tax-obligations-of-marketplaces-in-canada)
- [CRA — GST/HST for digital economy businesses](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy.html)
- [Osler — New legal framework for digital platform workers (DPWRA)](https://www.osler.com/en/insights/blogs/employment-and-labour-law-blog/new-legal-framework-for-digital-platform-workers-coming-into-force-july-1-2025/)
- [Littler — Ontario DPWRA coming into force July 1, 2025](https://www.littler.com/news-analysis/asap/ontario-canada-digital-platform-workers-rights-act-2022-coming-force-july-1-2025)

**Ödeme**
- [Stripe Docs — Using manual payouts (90 gün / escrow yok)](https://docs.stripe.com/connect/manual-payouts)
- [Stripe Docs — Required verification information](https://docs.stripe.com/connect/required-verification-information)
- [Stripe — How to accept payments in Canada](https://stripe.com/resources/more/payments-in-canada-an-in-depth-guide)
- [Sharetribe — Adyen for Platforms overview](https://www.sharetribe.com/academy/marketplace-payments/adyen-for-platforms-overview/)
- [Clearly Payments — Interac statistics Canada](https://www.clearlypayments.com/blog/interac-statistics-canada-2025/)

**Güven ve güvenlik**
- [Certn — Pricing](https://certn.co/pricing/)
- [Sterling Backcheck Canada](https://www.sterlingbackcheck.ca/) · [Triton Canada](https://www.tritoncanada.ca/)
- [RCMP — Vulnerable sector checks](https://rcmp.ca/en/criminal-records/criminal-record-checks/vulnerable-sector-checks)
- [Blakes — Hires, Dismissals and Criminal Records: What Quebec Employers Need to Know](https://www.blakes.com/insights/hires-dismissals-and-criminal-records-what-quebec-employers-need-to-know/)
- [CDPDJ — Hiring and employment FAQ](https://www.cdpdj.qc.ca/en/frequently-asked-questions/hiring-and-employment-employees-and-people-looking-work)
- [Veriff — Supported countries](https://www.veriff.com/supported-countries)
- [Zensurance — Pet Sitting Insurance](https://www.zensurance.com/pet-services-insurance/pet-sitting) · [Dog Walker Insurance in Canada](https://www.zensurance.com/blog/dog-walker-insurance-what-coverage-do-dog-walkers-in-canada-need)
- [Ratehub — Dog Walking & Pet Sitting Insurance in Canada](https://www.ratehub.ca/blog/dog-walking-pet-sitting-insurance/)
- [Rover Guarantee Terms](https://www.rover.com/terms/guarantee/) · [Rover Canada Help Centre](https://support-ca.rover.com/hc/en-ca/articles/360036958191)
- [City of Toronto — Commercial Dog Walker Permit](https://www.toronto.ca/services-payments/permits-licences-bylaws/commercial-dog-walker-permit/)
- [City of Toronto — Pet Establishment Licensing Review](https://www.toronto.ca/services-payments/permits-licences-bylaws/pet-establishment-licensing-review/)
- [Metro Vancouver — Commercial Use Dog Walking Permit](https://metrovancouver.org/services/regional-parks/commercial-use-dog-walking-permit)

**Tüketici koruma, reklam, erişilebilirlik**
- [Torys — Provincial governments continue to tighten consumer protection laws](https://www.torys.com/our-latest-thinking/publications/2026/07/provincial-governments-continue-to-tighten-consumer-protection-laws)
- [Lavery — E-commerce: Your Obligations regarding the Consumer Protection Act](https://www.lavery.ca/en/publications/our-publications/3223-e-commerce-your-obligations-regarding-the-consumer-protection-act-cpa-and-competition-matters.html)
- [Mann Lawyers — Internet Agreements with Ontario Consumers](https://www.mannlawyers.com/resources/internet-agreements-with-ontario-consumers-consumer-protection-act-considerations-for-businesses/)
- [Competition Bureau — Use of tests or testimonials](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/use-tests-or-testimonials)
- [Fasken — The Evolving Competition Law Landscape in Canada: Deceptive Marketing Practices](https://www.fasken.com/en/knowledge/2024/07/the-evolving-competition-law-landscape-in-ca-4)
- [Davies — Expanded Scope for Private Actions Under Canada's Competition Act Now in Effect](https://www.dwpv.com/en/insights/2025/expanded-scope-private-actions-competition-act)
- [Accessibility.Works — AODA Website Accessibility Requirements](https://www.accessibility.works/aoda-website-accessibility-requirements/)
- [Level Access — AODA Compliance](https://www.levelaccess.com/compliance-overview/accessibility-for-ontarians-with-disabilities-act-aoda-compliance/)
- [CRTC — CASL FAQ](https://crtc.gc.ca/eng/com500/faq500.htm) · [CASL Guidance on Implied Consent](https://crtc.gc.ca/eng/com500/guide.htm)
