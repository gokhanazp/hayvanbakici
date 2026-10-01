import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, segmentFor } from '@havre/i18n';
import {
  ONBOARDING_STEPS, calculateCommission, compareToRover, dollars,
} from '@havre/core';
import { Photo } from '@/components/Photo';
import { SitterStartCta } from '@/components/auth/SitterStartCta';
import { Faq } from '@/components/Faq';
import { EarningsEstimate } from '@/components/EarningsEstimate';
import { ShieldIcon } from '@/components/VerificationBadge';
import { money, dayFmt } from '@/lib/format';
import { cityName, getCommission, getDefaultCity, getLandingData } from '@/lib/data';

/**
 * Bakici davet sayfasi — HERKESE ACIK ve INDEKSLENEBILIR.
 *
 * Arz once gelir (yol haritasi §9): bakici olmadan hicbir sehir sayfasi
 * yayina giremiyor. Bu yuzden bu sayfa sihirbazin disinda tutuldu; giris
 * gerektirmiyor ve statik uretilebiliyor.
 *
 * Sayfadaki HER RAKAM kodun kendisinden geliyor (DEFAULT_COMMISSION,
 * calculateCommission, ONBOARDING_STEPS). Elle yazilmis bir oran, oran
 * degistiginde sessizce yalan haline gelirdi.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const m = getMessages(locale);
  return { title: m.onboarding.title, description: m.sitterLanding.heroBody };
}

export const revalidate = 300;

export default async function BecomeSitterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const s = m.sitterLanding;
  const { config: c, campaignName, campaignEndsAt } = await getCommission();
  const fr = locale === 'fr-CA';

  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'sitter_referral' });
  const vs = compareToRover(sample, ours, 'standard');
  // Bakiciya kalan = hizmet bedeli eksi BAKICIDAN alinan komisyon.
  // (Sahip ucreti ayri kalemdir, bakicinin cebinden cikmaz.)
  const oursPayout = sample - ours.sitterCommissionCents;
  const roverPayout = oursPayout - vs.sitterSavesCents;

  /*
    MEDYAN GERCEK SORGUDAN — ana sayfadaki guven seridiyle AYNI kaynak.
    Sayfa ulusal, o yuzden sehir adi cumlenin icinde yaziyor: "Toronto'da
    medyan" demek ile "medyan" demek ayni sey degil.
  */
  const city = await getDefaultCity();
  const { medianPriceCents } = await getLandingData(city, 'boarding', locale);
  const platformPct = c.sitterPct.platform;
  const payBody = medianPriceCents > 0
    ? interpolate(s['work.payCity'], {
        city: cityName(city, locale),
        price: money(medianPriceCents, locale),
        pct: String(platformPct),
      })
    : interpolate(s['work.payPlain'], { pct: String(platformPct) });

  const work = [
    { title: s['work.doTitle'], body: s['work.doBody'] },
    { title: s['work.timeTitle'], body: s['work.timeBody'] },
    { title: s['work.needTitle'], body: s['work.needBody'] },
    { title: s['work.payTitle'], body: payBody },
  ];

  const rates = [
    { pct: c.sitterPct.sitter_referral, label: m.commission.sitter_referral },
    { pct: c.sitterPct.repeat, label: m.commission.repeat },
    { pct: c.sitterPct.platform, label: m.commission.platform },
  ];

  /*
    HESAPLAYICI SATIRLARI. Ustteki `rates` dizisinin etiketleri tam
    cumle ("Bu musteriyi biz getirdik, %18 aliyoruz."); bir tabloda
    okunmaz. Ayni oranlar, kisa etiketlerle.
  */
  const calcRates = [
    { pct: c.sitterPct.sitter_referral, label: s['calc.rowOwn'] },
    { pct: c.sitterPct.repeat, label: s['calc.rowRepeat'] },
    { pct: c.sitterPct.platform, label: s['calc.rowOurs'] },
  ];

  const faqs = [
    { q: s['faq.clients'], a: s['faq.clientsA'] },
    { q: s['faq.time'], a: s['faq.timeA'] },
    { q: s['faq.check'], a: s['faq.checkA'] },
    { q: s['faq.address'], a: s['faq.addressA'] },
  ];

  return (
    <>
      {/* ---- Kahraman bandi ---- */}
      {/*
        BAKICI DAVETI — tasarimdaki basvuru ekraninin ustu.

        Tasarimdaki baslik "Ayda 4.500 $ CAD'a kadar kazan" diyor ve
        yaninda "haftalik ortalama 780 $" karti var. IKISI DE
        UYDURMA olurdu: henuz tek bir odeme yapmadik, ortalama diye
        gosterecek bir veri yok ve bir kazanc rakami vaat etmek
        bakiciyi en kirilgan yerinden yakalar. Yerlerinde duran sey
        gercek: ucreti bakici koyuyor ve kendi getirdigi musteriden
        hicbir sey almiyoruz.
      */}
      <section className="sa-hero">
        <div className="st-wrap sa-hero-grid">
          <div className="sa-hero-copy">
            <span className="sa-eyebrow">{s.eyebrow}</span>
            <h1 className="sa-h1">{s.heroTitle}</h1>
            <p className="sa-lead">{s.heroBody}</p>
            {/* Dugmeler oturuma gore konusuyor; sayfa statik kaliyor */}
            <div className="sa-cta"><SitterStartCta locale={locale} showSignIn /></div>
          </div>

          <div className="sa-hero-art">
            <Photo id="care-a" locale={locale} priority sizes="(min-width: 900px) 24rem, 100vw" />
          </div>
        </div>
      </section>

      {/*
        YENI BASLAYANIN BOLUMU — KAHRAMAN DEGIL, KAHRAMANIN ALTI.

        Sitedeki iki guclu baslik da ("kendi musterini getir", "kendi
        fiyatini koy") ZATEN bakicilik yapan kisiye sesleniyordu. Hic
        yapmamis kisiye soylenmis tek cumle yoktu; bu bolum o boslugu
        dolduruyor.

        NEDEN KAHRAMANDA DEGIL: "hayvanlari seviyorsan para kazan"
        cumlesini rakip de kuruyor; kahramandaki cumle ise rakibin
        kuramayacagi tek cumle. Duygusal olani onun yerine koymak,
        ayirt edici bir iddiayi siradan biriyle takas etmek olurdu.
        Duygusal cumle KANCA (ust huni), ekonomik cumle KAPANIS.

        NEDEN DONEN BANT (slider) DEGIL: donen kahramanlarda tiklama
        orani ~%1 ve o tiklamalarin ~%89'u yalnizca ilk karede. Ikinci
        karedeki mesaj pratikte yazilmamis sayiliyor. Ustelik kendinden
        hareket eden icerik WCAG 2.2.2 geregi durdurma kontrolu
        istiyor ve kahramana ilk kez istemci JS sokardi. Iki kapi ayni
        anda ekranda: gizlenen hicbir sey yok, hareket eden hicbir sey
        yok, eklenen JS yok.
      */}
      <section className="container section" id="start" style={{ paddingBottom: 0 }}>
        <div className="section-head">
          <h2 className="text-h2">{s['start.heading']}</h2>
          <p className="text-body-lg muted">{s['start.body']}</p>
        </div>

        <div className="door-grid">
          <a className="card card-pad door" href="#what-sitting-is">
            <strong className="text-h4">{s['start.newTitle']}</strong>
            <span className="muted">{s['start.newBody']}</span>
            <span className="door-cta">{s['start.newCta']} &rarr;</span>
          </a>
          <a className="card card-pad door" href="#rates">
            <strong className="text-h4">{s['start.clientsTitle']}</strong>
            <span className="muted">{s['start.clientsBody']}</span>
            <span className="door-cta">{s['start.clientsCta']} &rarr;</span>
          </a>
        </div>
      </section>

      {/*
        BAKICILIK NE DEMEK — VAAT YOK, TARIF VAR.

        Yeni baslayan kisi "ne kadar kazanirim"dan once "bu ne demek, ne
        gerekiyor, ne kadar vaktimi alir" diye soruyor. Dorduncu kart
        parayi da soyluyor ama HESAPLAYICI DEGIL: Kanada'da gelir
        iddialari kanitlanabilir olmak zorunda, o yuzden ekranda yalnizca
        MEDYAN var — bakicinin ne kazanacagina dair bir soz degil, bu
        sehirdeki bakicilarin fiilen ne istedigi. Medyan sifirsa (veri
        yok) sayi HIC yazilmiyor, cumlenin sayisiz hali kuruluyor.
      */}
      <section className="container section" id="what-sitting-is">
        <div className="section-head">
          <h2 className="text-h2">{s.workHeading}</h2>
          <p className="text-body-lg muted">{s.workNote}</p>
        </div>

        <div className="grid grid-4">
          {work.map((w) => (
            <div key={w.title} className="card card-pad">
              <h3 className="text-h4" style={{ marginBottom: 'var(--space-3)' }}>{w.title}</h3>
              <p className="text-body-sm muted">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Oranlar ---- */}
      <section className="container section" id="rates">
        <div className="section-head">
          <h2 className="text-h1">{s.ratesHeading}</h2>
          <p className="text-body-lg muted">{s.ratesNote}</p>
        </div>

        {/*
          KAMPANYA BANDI. Bakicinin en cok baktigi rakam bu sayfada;
          indirimli oldugunu ve NE ZAMAN bittigini soylememek, kampanya
          bitince orani sessizce artirmak olurdu.
        */}
        {campaignName && campaignEndsAt && (
          <div className="notice notice-accent" style={{ marginBottom: 'var(--space-5)' }}>
            <p>
              <strong>{campaignName}</strong>{' — '}
              {locale === 'fr-CA'
                ? `commission réduite jusqu’au ${dayFmt(campaignEndsAt, locale)}.`
                : `lower commission until ${dayFmt(campaignEndsAt, locale)}.`}
            </p>
          </div>
        )}

        {/*
          UCRETLER ACIKCA YAZILI.
          Competition Act'in drip-pricing yasagi tuketici tarafinda; ama
          bakiciya karsi seffaflik bu urunun ana iddiasi. Rakipte bu rakam
          sozlesmenin icinde; burada giris sayfasinda.
        */}
        <div className="grid grid-3">
          {rates.map((r, i) => (
            <div key={r.pct} className={i === 0 ? 'panel card-pad' : 'card card-pad'}
                 style={i === 0 ? { borderRadius: 'var(--radius-lg)' } : undefined}>
              <p className="text-numeral" style={{
                color: i === 0 ? 'var(--color-panel-primary)' : 'var(--color-primary)',
              }}>
                {r.pct}%
              </p>
              <p className="muted" style={{ marginTop: 'var(--space-3)' }}>{r.label}</p>
            </div>
          ))}
        </div>

        {/*
          KARSILASTIRMA + HESAPLAYICI YAN YANA.

          Solda SABIT bir ornek (bizim rakamimiz, compareToRover'dan),
          sagda bakicinin KENDI rakami. Ikisi ayri bolumlere konunca
          sayfa "once biz anlatiriz, sonra siz denersiniz" oluyordu;
          yan yana durduklarinda ornek, hesaplayicinin nasil
          okunacagini gosteren bir anahtar haline geliyor.
        */}
        <div className="sa-rates-split">
        <div className="card card-pad">
          <h3 className="text-h4">{interpolate(s.exampleHeading, { amount: money(sample, locale) })}</h3>
          <dl className="rate-compare">
            <div>
              <dt className="dim text-body-sm">{s.exampleOurs}</dt>
              <dd className="text-h3 tabular" style={{ color: 'var(--color-primary)' }}>
                {money(oursPayout, locale)}
              </dd>
            </div>
            <div>
              <dt className="dim text-body-sm">{s.exampleRover}</dt>
              <dd className="text-h3 tabular">{money(roverPayout, locale)}</dd>
            </div>
            <div>
              <dt className="dim text-body-sm">{s.exampleDiff}</dt>
              <dd className="text-h3 tabular" style={{ color: 'var(--color-accent-hover)' }}>
                +{money(vs.sitterSavesCents, locale)}
              </dd>
            </div>
          </dl>
          <p className="field-hint">{s.exampleNote}</p>
        </div>

        <EarningsEstimate
          locale={locale}
          unit="night"
          defaultRateCents={medianPriceCents > 0 ? medianPriceCents : dollars(45)}
          rates={calcRates}
        />
        </div>
      </section>

      {/* ---- Basvuru adimlari + gereklilikler ---- */}
      <section className="band band-sage band-round-t band-round-b">
        <div className="container section">
          <div className="grid" style={{ gap: 'var(--space-10)', gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <div>
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-3)' }}>{s.stepsHeading}</h2>
              <p className="muted" style={{ marginBottom: 'var(--space-6)', maxWidth: '38rem' }}>
                {s.stepsNote}
              </p>
              {/* Adimlar KODDAN: ONBOARDING_STEPS degisirse sayfa da degisir */}
              <ol className="step-list">
                {ONBOARDING_STEPS.map((step, i) => (
                  <li key={step}>
                    <span className="step-num tabular">{i + 1}</span>
                    <span>{m.onboarding[`step.${step}` as const]}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{s.requirementsHeading}</h2>
              <ul className="req-list">
                {(['age', 'check', 'sin', 'bank'] as const).map((k) => (
                  <li key={k}>
                    <ShieldIcon size={15} />
                    <span>{s[`req.${k}` as const]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- SSS ---- */}
      <section className="container section">
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{s.faqHeading}</h2>
        <div style={{ maxWidth: '48rem' }}>
          <Faq items={faqs} locale={locale} />
        </div>

        <div className="card card-pad" style={{
          marginTop: 'var(--space-10)', background: 'var(--color-primary-subtle)', borderColor: 'transparent',
        }}>
          <h2 className="text-h3">{s.ctaHeading}</h2>
          <div className="row" style={{ marginTop: 'var(--space-5)' }}>
            <SitterStartCta locale={locale} />
            <Link href={`/${seg}/pricing/`} className="btn btn-secondary">
              {fr ? 'Voir nos frais' : 'See how our fees work'}
            </Link>
          </div>
          <p className="field-hint" style={{ marginTop: 'var(--space-5)' }}>
            {m.verification.disclaimer}
          </p>
        </div>
      </section>
    </>
  );
}
