import Link from 'next/link';
import Image from 'next/image';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import type { SitterSummary } from '@/lib/data';
import { resolvePhoto } from '@/lib/photos';
import { money } from '@/lib/format';

/**
 * BAKICI SERIDI — ana sayfadaki fotografli izgara.
 *
 * NEDEN STOK FOTOGRAF DEGIL DE BAKICILAR: ana sayfaya "topluluk anlari"
 * diye stok fotograf koymak, sahibi olmadigimiz bir sosyal kanit uretmek
 * olurdu. Buradaki her kutucuk veritabanindaki GERCEK bir bakici kaydidir
 * ve tiklandiginda o bakicinin profiline gider — fotograf da o bakicinin
 * profil fotografidir (tohum veride demo, canlida bakicinin kendi yuklegi).
 *
 * Masonry: sutun sayisi ekrana gore degisir, oranlar SABIT sirayla dagilir.
 * Rastgele oran her yenilemede farkli bir duzen demek olurdu.
 */
const RATIOS = [1.28, 0.92, 1.12, 0.86, 1.34, 1.0, 1.18, 0.95, 1.25] as const;

export function SitterStrip({
  locale, sitters, citySlug, cityName,
}: {
  locale: Locale;
  sitters: SitterSummary[];
  citySlug: string;
  cityName: string;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const shown = sitters.filter((s) => s.slug).slice(0, 8);
  if (shown.length === 0) return null;

  return (
    <section className="container section">
      <div className="section-head">
        <span className="badge" style={{
          background: 'var(--color-primary-subtle)', color: 'var(--color-primary-active)',
        }}>
          {m.sitterStrip.eyebrow}
        </span>
        <h2 className="text-h1">{m.sitterStrip.title}</h2>
        <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
          {m.sitterStrip.subtitle.replace('{city}', cityName)}
        </p>
      </div>

      <div className="gallery-masonry">
        {shown.map((s, i) => {
          const photo = resolvePhoto(s.avatarUrl);
          const ratio = RATIOS[i % RATIOS.length]!;
          return (
            <Link
              key={s.id}
              href={`/${seg}/${citySlug}/sitter/${s.slug}/`}
              className="sitter-strip-item"
              style={{ aspectRatio: `1 / ${ratio}` }}
            >
              {photo
                ? <Image src={photo} alt="" width={520} height={Math.round(520 * ratio)}
                         sizes="(min-width: 1000px) 25vw, (min-width: 700px) 33vw, 50vw" />
                : <span className="avatar avatar-initials" style={{
                    width: '100%', height: '100%', borderRadius: 0, fontSize: '2rem',
                  }}>{s.photoInitials}</span>}
              <span className="sitter-strip-cap">
                <span className="sitter-strip-name">{s.firstName} {s.lastNameInitial}.</span>
                <span className="sitter-strip-meta tabular">
                  {s.neighbourhood} · {money(s.priceCents, locale)}
                  {s.reviewCount > 0 && ` · ★ ${s.rating.toFixed(1)}`}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <p style={{ marginTop: 'var(--space-6)' }}>
        <Link href={`/${seg}/${citySlug}/dog-boarding/`} className="btn btn-secondary">
          {m.sitterStrip.viewAll}
        </Link>
      </p>
    </section>
  );
}
