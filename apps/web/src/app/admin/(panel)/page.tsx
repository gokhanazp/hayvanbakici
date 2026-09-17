import Link from 'next/link';
import { requireAdmin, money, moneyShort, one } from '@/lib/admin';
import { getMetrics, getAdminOverview, getAdminCounts } from '@/lib/data';
import { Page, Card, Stat, Empty } from '@/components/admin/ui';
import { LineChart, BarChart, RankBars } from '@/components/admin/Chart';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90, 365];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const asked = Number(one(sp.days) ?? 30);
  const days = RANGES.includes(asked) ? asked : 30;

  const [m, overview, counts] = await Promise.all([
    getMetrics(days), getAdminOverview(), getAdminCounts(),
  ]);

  const waiting = counts.applications + counts.reports + counts.requestedBookings;

  return (
    <Page
      title="Dashboard"
      lead="Where the marketplace stands, and what is waiting for a person today."
      actions={
        <div className="a-chips" style={{ marginBottom: 0 }}>
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/?days=${d}`} className={`a-chip${d === days ? ' is-on' : ''}`}>
              {d === 365 ? '1 y' : `${d} d`}
            </Link>
          ))}
        </div>
      }
    >
      {/*
        EN USTTE INSAN BEKLEYEN IS. Bir gosterge paneli once "bugun ne
        yapmam lazim" sorusuna cevap vermeli; buyume egrisi ondan sonra
        gelir.
      */}
      <Card style={{
        borderColor: waiting > 0 ? 'var(--color-primary)' : 'var(--color-border)',
        marginBottom: 16,
      }}>
        <div className="a-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 15 }}>
              {waiting > 0 ? `${waiting} waiting for a person` : 'Nothing waiting'}
            </h2>
            <p className="a-dim" style={{ marginTop: 2 }}>
              Nothing here is decided automatically.
            </p>
          </div>
          <div className="a-row">
            {counts.applications > 0 && (
              <Link href="/admin/applications/" className="a-btn">
                {counts.applications} application{counts.applications === 1 ? '' : 's'}
              </Link>
            )}
            {counts.reports > 0 && (
              <Link href="/admin/reports/" className="a-btn a-btn-ghost">
                {counts.reports} report{counts.reports === 1 ? '' : 's'}
              </Link>
            )}
            {counts.requestedBookings > 0 && (
              <Link href="/admin/bookings/?status=requested" className="a-btn a-btn-ghost">
                {counts.requestedBookings} unanswered request{counts.requestedBookings === 1 ? '' : 's'}
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="a-grid a-grid-4" style={{ marginBottom: 16 }}>
        <Stat label={`Signups · ${days} d`} value={String(m.totals.signups)} delta={m.change.signups} />
        <Stat label={`Bookings · ${days} d`} value={String(m.totals.bookings)} delta={m.change.bookings} />
        <Stat
          label={`Platform take · ${days} d`}
          value={money(m.totals.grossCents)}
          delta={m.change.grossCents}
          hint="accrued, not collected"
        />
        <Stat label={`Booking value · ${days} d`} value={money(m.totals.gmvCents)}
              hint="what owners were quoted" />
        <Stat label="Active sitters" value={String(overview.activeSitters)} />
        <Stat label="Owners" value={String(overview.owners)} />
        <Stat label="Cities with supply" value={String(overview.citiesWithSupply)} />
        <Stat label="Published reviews" value={String(overview.reviewsPublished)} />
        {/*
          SORGU BUNU ZATEN GETIRIYORDU AMA HICBIR YERE CIZILMIYORDU.
          Insan incelemesi bekleyen adli sicil kontrolu, gostergedeki
          diger sayilardan farkli: bekledigi her gun bir kisi calisamiyor.
        */}
        <Stat label="Checks needing a person" value={String(overview.manualReviews)} />
      </div>

      {/*
        Uc grafik AYNI izgarada: tam genislige yayilan bir SVG, viewBox
        oranindan dolayi kartlari iki katina cikariyordu. Esit kutular
        ayrica karsilastirmayi kolaylastiriyor.
      */}
      <div className="a-grid a-grid-2" style={{ marginBottom: 16 }}>
        <Card title="Signups" hint={`New accounts per day, last ${days} days`}>
          <LineChart points={m.signups} label="Signups" />
        </Card>
        <Card title="Bookings" hint={`Requests created per day, last ${days} days`}>
          <BarChart points={m.bookings} label="Bookings" />
        </Card>
        <Card
          title="Platform take"
          hint="Owner fee + sitter commission, on bookings that were not declined, expired or cancelled. Havre is not collecting payments yet — this is what would have been earned."
        >
          <LineChart points={m.grossCents} label="Platform take" format={(n) => moneyShort(n)} />
        </Card>
      </div>

      <div className="a-grid a-grid-3">
        <Card title="Supply by city" hint="Active sitters">
          {m.topCities.length === 0 ? <Empty>No active sitters yet.</Empty> : (
            <RankBars rows={m.topCities.map((c) => ({ label: c.city, value: c.sitters }))} />
          )}
        </Card>

        <Card title="Service mix" hint={`Bookings in the last ${days} days`}>
          {m.serviceMix.length === 0 ? <Empty>No bookings in this period.</Empty> : (
            <RankBars rows={m.serviceMix.map((s) => ({
              label: s.serviceType.replace(/_/g, ' '), value: s.count,
            }))} />
          )}
        </Card>

        {/*
          HUNI: bir basvurunun sonunda gercekten calisan bir bakiciya
          donusup donusmedigini gosteriyor. Arz sayisi tek basina
          yaniltici — 150 aktif bakicinin 5'i rezervasyon aldiysa sorun
          arzda degil, eslesmede.
        */}
        <Card title="Sitter funnel" hint="Applied → active → booked → reviewed">
          <RankBars rows={[
            { label: 'Applied', value: m.funnel.applications },
            { label: 'Active', value: m.funnel.active },
            { label: 'Had a booking', value: m.funnel.withBooking },
            { label: 'Has a review', value: m.funnel.withReview },
          ]} />
        </Card>
      </div>
    </Page>
  );
}
