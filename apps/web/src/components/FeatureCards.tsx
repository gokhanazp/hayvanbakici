import { getMessages, type Locale } from '@havre/i18n';
import { ShieldIcon } from '@/components/VerificationBadge';

/**
 * URUN OZELLIKLERI.
 *
 * CANLI GEZDIRME TAKIBI BURADA YOK — bilincli. O ozellik mobil uygulamayla
 * geliyor (yol haritasi Faz 4) ve web MVP'sinde yapamayacagimiz bir sey.
 * Yapamayacagimiz bir seyi ana sayfada vaat etmek, Competition Act
 * acisindan dayanaksiz iddia; ayrica ilk kullanicilarin guvenini bir kez
 * kaybedersiniz.
 *
 * Yerine koyulan "asi kayitlari", rakiplerde en cok sikayet edilen eksik
 * (yol haritasi §1.4 bosluk #5) ve web'de yapilabilir.
 */

export function FeatureCards({ locale }: { locale: Locale }) {
  const m = getMessages(locale);

  return (
    /* Bolum boslugu .section'dan gelir — bu blok bir bandin icinde yasiyor
       ve kendi padding'ini yazsaydi banttaki ritim diger bolumlerden kayardi. */
    <section className="container section">
      <span className="badge" style={{
        background: 'var(--color-accent-subtle)',
        color: 'var(--color-accent-hover)',
      }}>
        {m.features.eyebrow}
      </span>
      <h2 className="text-h1" style={{ margin: 'var(--space-4) 0 var(--space-8)', maxWidth: '30rem' }}>
        {m.features.title}
      </h2>

      <div className="feature-grid">
        {/* Buyuk kart: urunun ana guven vaadi */}
        <article className="feature-card feature-card-lead">
          <span className="feature-icon" style={{ background: 'rgba(255,255,255,.16)' }}>
            <ShieldIcon size={22} />
          </span>
          <h3 className="text-h3">{m.features['verified.title']}</h3>
          <p>{m.features['verified.body']}</p>

          {/*
            Dogrulama basamaklari. Kartin bos kalan alanini doldurmak icin
            degil: bakici profillerinde gorunen rozetlerin TAM listesi bu ve
            kullanicinin neye bakacagini burada ogrenmesi gerekiyor.
            Renk tek bilgi tasiyicisi degil — ikon + metin birlikte (WCAG 1.4.1).
          */}
          <ul className="feature-levels">
            {(['identity', 'criminal', 'licence', 'certification'] as const).map((k) => (
              <li key={k}>
                <ShieldIcon size={13} />
                {m.verification[k]}
              </li>
            ))}
          </ul>

          <p className="feature-fine">{m.verification.disclaimer}</p>
        </article>

        <article className="feature-card feature-card-quiet">
          <span className="feature-icon tile-apricot">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
              <path d="M4 11.5h16M8 4v3.5M16 4v3.5M8 15.5h4" />
            </svg>
          </span>
          <h3 className="text-h4">{m.features['fees.title']}</h3>
          <p>{m.features['fees.body']}</p>
        </article>

        <article className="feature-card feature-card-quiet">
          <span className="feature-icon tile-peri">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 13.5a2 2 0 0 1-2 2H8l-4 3.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
              <path d="M8.5 9.5h7M8.5 12h4" />
            </svg>
          </span>
          <h3 className="text-h4">{m.features['updates.title']}</h3>
          <p>{m.features['updates.body']}</p>
        </article>

        <article className="feature-card feature-card-accent">
          <span className="feature-icon" style={{ background: 'rgba(255,255,255,.55)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6.5 4.5h8L19 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-13a2 2 0 0 1 1.5-2Z" />
              <path d="M14 4.5V9h4.5" />
              <path d="m8.5 14.5 2 2 4-4.5" />
            </svg>
          </span>
          <h3 className="text-h4">{m.features['vaccines.title']}</h3>
          <p>{m.features['vaccines.body']}</p>
        </article>
      </div>

      {/*
        DURUSTLUK NOTU: bu ucu henuz canli degil. Ana sayfada var olmayan bir
        ozelligi varmis gibi gostermek Competition Act acisindan dayanaksiz
        iddiadir; ne zaman gelecegi acikca yaziliyor.
      */}
      <p className="field-hint" style={{ marginTop: 'var(--space-5)' }}>
        {m.features.plannedNote}
      </p>
    </section>
  );
}
