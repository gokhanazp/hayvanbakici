import Link from 'next/link';
import { requireAdmin, auditView, stamp } from '@/lib/admin';
import { listManualReviews } from '@/lib/data';
import { Page, Badge, Empty } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * INSAN INCELEMESI BEKLEYEN KONTROLLER.
 *
 * NEDEN VAR: gosterge bunlari sayiyordu, `decideApplication` de bir
 * basvuru karara baglanirken yan etki olarak kapatiyordu — ama hicbir
 * ekran tek tek LISTELEMIYORDU. "Otomatik sistem tek basina karar
 * vermez, bir insan okur" sozunun arkasinda, o insanin bakacagi bir
 * liste yoktu. Sayilan ama gorulemeyen is, yapilmayan istir.
 *
 * KARAR BURADA VERILMIYOR. Basvuru ekraninda veriliyor ve bu kontrol
 * orada kapaniyor. Ikinci bir karar yolu acmak iki ayri dogruluk
 * kaynagi yaratirdi; bu ekranin isi bekleyeni gorunur kilmak ve karara
 * GOTURMEK.
 *
 * EN ESKI ONCE. Bekleyen bir adli sicil incelemesi, bekleyen bir
 * basvuru demek: o kisi calisamiyor ve neden bekledigini bilmiyor.
 */
export default async function ChecksPage() {
  const session = await requireAdmin();
  const rows = await listManualReviews();
  await auditView(session.user.id, 'verifications');

  return (
    <Page
      title="Checks needing a person"
      lead="Background checks an automated system would not decide on its own. Nothing here is refused automatically — a person reads every one. The decision is made on the application, and closing the application closes the check."
    >
      {rows.length === 0 ? (
        <Empty>No check is waiting for a person right now.</Empty>
      ) : (
        <div className="a-tablewrap" tabIndex={0}>
          <table className="a-table">
            <thead>
              <tr>
                <th scope="col">Waiting since</th>
                <th scope="col">Sitter</th>
                <th scope="col">Check</th>
                <th scope="col">Provider</th>
                <th scope="col">Application</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td className="a-num a-dim">
                    <time dateTime={v.requestedAt ?? v.createdAt}>
                      {stamp(v.requestedAt ?? v.createdAt)}
                    </time>
                  </td>
                  <td>
                    <Link href={`/admin/users/${v.sitterId}/`}>{v.sitterName ?? '—'}</Link>
                    {v.email && <span className="a-dim" style={{ display: 'block' }}>{v.email}</span>}
                  </td>
                  <td className="a-sec">{v.type.replace(/_/g, ' ')}</td>
                  <td className="a-sec">{v.provider ?? '—'}</td>
                  <td>
                    <Badge value={v.sitterStatus} />{' '}
                    <Link href={`/admin/applications/${v.sitterId}/`}>Open the application →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
