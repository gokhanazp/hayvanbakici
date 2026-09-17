import Link from 'next/link';
import { requireAdmin, auditView, one, stamp } from '@/lib/admin';
import { countAudit, listAudit } from '@/lib/data';
import { Page, Empty, ShortId } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * DENETIM KAYDI.
 *
 * Panelin en onemli sayfasi: diger ekranlarda yapilan her sey buraya
 * dusuyor. Law 25 ve PIPEDA "gerektigi kadar erisim" bekliyor; bunun tek
 * kaniti kimin neye ne zaman baktigidir.
 *
 * Bu sayfayi acmak da bir kayit uretiyor. Denetim kaydini okuyanin
 * kayitsiz kalmasi, kaydin amacini bosa cikarirdi.
 *
 * Kayitlar SILINEMEZ ve buradan duzenlenemez; yalnizca okunur.
 */
const LABEL: Record<string, string> = {
  'sitter.approve': 'Approved a sitter',
  'sitter.reject': 'Refused a sitter',
  'user.suspend': 'Suspended an account',
  'user.restore': 'Lifted a suspension',
  'user.role': 'Changed a role',
  'review.hide': 'Hid a review',
  'review.restore': 'Put a review back',
  'report.resolve': 'Closed a report',
  'booking.override': 'Changed a booking',
  'admin.view': 'Opened a list or record',
  /*
    EKSIK ETIKETLER — DUZELTILEN HATA.

    Bu dortu tabloda yoktu ve `LABEL[r.action] ?? r.action` ham kodu
    ekrana yaziyordu: sayfada 81 kez duz "settings.commission" goruluyordu.
    Hangi ikisi eksikti? PARA ve OZEL MESAJ — yani kaydin en cok okunmasi
    gereken iki olayi.
  */
  'settings.commission': 'Changed the commission rates',
  'settings.campaignCreated': 'Started a commission campaign',
  'settings.campaignEnded': 'Ended a commission campaign',
  'admin.reveal': 'Opened a private message',
};

/** Tanimadigimiz bir kod gelirse bari okunur duruyor: "user.foo" -> "user foo". */
function label(action: string): string {
  return LABEL[action] ?? action.replace(/[._]/g, ' ');
}

/** Bir sayfada kac satir. */
const PER_PAGE = 100;

const HREF: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}/`,
  sitter: (id) => `/admin/applications/${id}/`,
  booking: (id) => `/admin/bookings/${id}/`,
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string | string[]; page?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const decisionsOnly = one(sp.only) === 'decisions';
  const kind = decisionsOnly ? 'decisions' : 'all';

  const total = await countAudit(kind);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  /* Sayfa numarasi kullanicidan geliyor: sinirlara CEKILIYOR, guvenilmiyor. */
  const page = Math.min(pages, Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  const rows = await listAudit(PER_PAGE, kind, (page - 1) * PER_PAGE);
  await auditView(session.user.id, 'audit_log');

  const qs = (n: number) => {
    const parts = [decisionsOnly ? 'only=decisions' : '', n > 1 ? `page=${n}` : '']
      .filter(Boolean);
    return parts.length > 0 ? `?${parts.join('&')}` : '?';
  };

  return (
    <Page
      title="Audit log"
      lead="Who did what, and when. Every decision and every sensitive view lands here — including opening this page. Entries cannot be edited or deleted."
    >
      <div className="a-chips">
        <Link href="?" className={`a-chip${decisionsOnly ? '' : ' is-on'}`}>Everything</Link>
        <Link href="?only=decisions" className={`a-chip${decisionsOnly ? ' is-on' : ''}`}>
          Decisions only
        </Link>
      </div>

      {rows.length === 0 ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <>
          <div className="a-tablewrap" tabIndex={0}>
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">What</th>
                  <th scope="col">On</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const link = r.entityId ? HREF[r.entity]?.(r.entityId) : undefined;
                  return (
                    <tr key={r.id}>
                      <td className="a-num a-dim">
                        <time dateTime={r.at}>{stamp(r.at)}</time>
                      </td>
                      <td>{r.actorName ?? <span className="a-dim">system</span>}</td>
                      <td className="wrap">
                        {label(r.action)}
                        {r.reason && (
                          <span className="a-dim" style={{ display: 'block' }}>
                            Reason given: {r.reason}
                          </span>
                        )}
                      </td>
                      <td className="a-sec">
                        {r.entity}
                        {r.entityId && (
                          <> · {link
                            ? <Link href={link}><ShortId id={r.entityId} /></Link>
                            : <ShortId id={r.entityId} />}</>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/*
            SAYFALAMA. Onceden yalnizca en yeni 250 satir vardi ve ekran
            kesildigini soylemiyordu; eski kayitlara hicbir yerden
            ulasilamiyordu.
          */}
          <div className="a-pager">
            <span className="a-hint">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </span>
            <span className="a-pager-links">
              {page > 1 && <Link href={qs(page - 1)} className="a-chip">Newer</Link>}
              {page < pages && <Link href={qs(page + 1)} className="a-chip">Older</Link>}
            </span>
          </div>
          <p className="a-hint" style={{ marginTop: 10 }}>
            Identifiers are shortened on screen; the full record stays in the database.
          </p>
        </>
      )}
    </Page>
  );
}
