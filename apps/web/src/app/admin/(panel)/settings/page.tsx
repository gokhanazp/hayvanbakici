import { requireAdmin, auditView } from '@/lib/admin';
import {
  getCommissionSettings, listCampaigns, listCommissionAudit, getCommission,
} from '@/lib/data';
import { Page, Card, Empty } from '@/components/admin/ui';
import { BaseRatesForm, CampaignForm } from '@/components/admin/CommissionForms';
import { saveCommissionAction, createCampaignAction, endCampaignAction } from '@/app/admin/actions';

/**
 * KOMISYON AYARLARI.
 *
 * NEDEN PANELDE: oranlar koddaki bir sabitte duruyordu. Bir kampanya
 * acmak icin surum cikarmak gerekiyordu — ve ayni zincir kampanyayi
 * KAPATMAYI da bagliyordu. Tarihi gelince kendiliginden biten bir
 * kampanya, "geri almayi unutma" riskini ortadan kaldiriyor.
 *
 * SAYFANIN EN USTUNDE NE OLDUGU YAZIYOR. Burasi panelin paraya dokunan
 * tek yeri; "bu degisiklik neyi etkiler" sorusunun cevabi kaydetme
 * dugmesinin YANINDA olmali, bir dokumanda degil.
 */
export const dynamic = 'force-dynamic';

const dayFmt = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(iso));

const ACTION_LABEL: Record<string, string> = {
  'settings.commission': 'Base rates changed',
  'settings.campaignCreated': 'Campaign scheduled',
  'settings.campaignEnded': 'Campaign ended early',
};

export default async function SettingsPage() {
  const session = await requireAdmin();

  const [base, campaigns, log, live] = await Promise.all([
    getCommissionSettings(),
    listCampaigns(12),
    listCommissionAudit(8),
    getCommission(),
  ]);
  await auditView(session.user.id, 'settings');

  const now = Date.now();
  const active = campaigns.find((c) =>
    !c.endedEarlyAt && Date.parse(c.startsAt) <= now && Date.parse(c.endsAt) > now);
  const upcoming = campaigns.filter((c) => !c.endedEarlyAt && Date.parse(c.startsAt) > now);

  const pctList = (c: { sitterPct: { platform?: number; repeat?: number; sitter_referral?: number } }) =>
    [
      c.sitterPct.platform !== undefined && `introduced ${c.sitterPct.platform}%`,
      c.sitterPct.repeat !== undefined && `repeat ${c.sitterPct.repeat}%`,
      c.sitterPct.sitter_referral !== undefined && `own client ${c.sitterPct.sitter_referral}%`,
    ].filter(Boolean).join(' · ');

  return (
    <Page
      title="Commission"
      lead="The rates the whole site publishes. Changing them here changes the fees page, the sitter invitation and the booking screen — nothing else needs a deploy."
    >
      {/*
        UYARI KAYDETME DUGMESININ USTUNDE, bir dokumanda degil.
        Oran degistiren kisi "acaba eski rezervasyonlar da mi degisti"
        diye sormamali; cevabi burada.
      */}
      <Card title="Before you change anything">
        <ul className="a-def" style={{ display: 'grid', gap: 10 }}>
          <li>
            <strong>Nothing is retroactive.</strong> A booking’s commission is worked out
            when the request is made and written on the booking. Changing a rate — or
            running a campaign — never moves money on a booking that already exists.
          </li>
          <li>
            <strong>The site republishes itself.</strong> The fees page, the sitter
            invitation, the help page and the sitter agreement all read these numbers.
            They refresh as soon as you save.
          </li>
          <li>
            <strong>The agreement shows the base rates.</strong> A campaign is a temporary
            discount and never appears as the agreed rate. A campaign can only
            <em> lower</em> a rate.
          </li>
          <li>
            <strong>Every change is on the record</strong> — who, when, before and after —
            in the audit log.
          </li>
        </ul>
      </Card>

      <Card
        title="Base rates"
        hint={base.updatedAt
          ? `Last changed ${dayFmt(base.updatedAt)}`
          : 'Never changed — these are the values the code ships with.'}
      >
        <BaseRatesForm
          action={saveCommissionAction}
          initial={{
            platform: base.sitterPct.platform,
            repeat: base.sitterPct.repeat,
            referral: base.sitterPct.sitter_referral,
            ownerPct: base.ownerPct,
            ownerFeeCapDollars: Math.round(base.ownerFeeCapCents) / 100,
            launchPromoMonths: base.launchPromoMonths,
          }}
        />
      </Card>

      <Card title="Campaign">
        {active ? (
          <div className="a-note" style={{ marginBottom: 16 }}>
            <p>
              <strong>{active.name}</strong> is running now — {pctList(active)}. Ends{' '}
              {dayFmt(active.endsAt)}.
            </p>
            <p className="a-dim" style={{ marginTop: 4 }}>
              Right now a sitter we introduced a client to pays{' '}
              <strong>{live.config.sitterPct.platform}%</strong>.
            </p>
            {/*
              ERKEN BITIRME KAYDI SILMIYOR: o pencerede yapilmis
              rezervasyonlarin neden indirimli oldugunu aciklayan
              satir duruyor.
            */}
            <form action={endCampaignAction} style={{ marginTop: 10 }}>
              <input type="hidden" name="campaignId" value={active.id} />
              <button className="a-btn a-btn-ghost" type="submit">End it now</button>
            </form>
          </div>
        ) : (
          <p className="a-dim" style={{ marginBottom: 16 }}>
            No campaign is running. Sitters pay the base rates above.
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="a-note" style={{ marginBottom: 16 }}>
            {upcoming.map((c) => (
              <p key={c.id}>
                <strong>{c.name}</strong> — {pctList(c)}, {dayFmt(c.startsAt)} to {dayFmt(c.endsAt)}.
                <form action={endCampaignAction} style={{ display: 'inline', marginLeft: 8 }}>
                  <input type="hidden" name="campaignId" value={c.id} />
                  <button className="a-btn a-btn-ghost" type="submit">Cancel</button>
                </form>
              </p>
            ))}
          </div>
        )}

        <CampaignForm
          action={createCampaignAction}
          base={{
            platform: base.sitterPct.platform,
            repeat: base.sitterPct.repeat,
            referral: base.sitterPct.sitter_referral,
          }}
        />
      </Card>

      <Card title="Past campaigns">
        {campaigns.length === 0 ? (
          <Empty>Nothing yet.</Empty>
        ) : (
          <div className="a-tablewrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th><th>Rates</th><th>From</th><th>To</th><th>State</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const state = c.endedEarlyAt
                    ? 'Ended early'
                    : Date.parse(c.endsAt) <= now ? 'Finished'
                      : Date.parse(c.startsAt) > now ? 'Scheduled' : 'Running';
                  return (
                    <tr key={c.id}>
                      <td className="wrap">{c.name}</td>
                      <td className="wrap">{pctList(c)}</td>
                      <td className="a-num">{dayFmt(c.startsAt)}</td>
                      <td className="a-num">{dayFmt(c.endsAt)}</td>
                      <td>{state}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent changes" hint="The full record is in the audit log.">
        {log.length === 0 ? (
          <Empty>No changes recorded.</Empty>
        ) : (
          <ul className="a-timeline">
            {log.map((row) => (
              <li key={row.id}>
                <time>{dayFmt(row.at)}</time>
                <span>
                  {ACTION_LABEL[row.action] ?? row.action}
                  {row.actorName ? ` — ${row.actorName}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
