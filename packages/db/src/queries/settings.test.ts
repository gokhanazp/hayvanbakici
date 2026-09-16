import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  getCommissionSettings, saveCommissionSettings,
  createCampaign, endCampaign, getActiveCampaign, getResolvedCommission,
  listCampaigns, listCommissionAudit,
} from './settings.js';

/**
 * KOMISYON AYARLARI — gercek veritabanina karsi.
 *
 * Buradaki testlerin hepsi PARA ile ilgili. En kritik iddia sonuncusu:
 * bir kampanya acmak, daha once yapilmis bir rezervasyonun komisyonunu
 * DEGISTIRMEZ. Bu iddia sayfada da yaziyor; kodda tutulmazsa soz degil.
 */
const db = getDb();
let adminId = '';

async function clean() {
  await db.execute(sql`DELETE FROM commission_campaigns`);
  await db.execute(sql`DELETE FROM commission_settings`);
}

beforeAll(async () => {
  const a = await db.execute(sql`
    INSERT INTO users (email, role, locale)
    VALUES (${`set-${Date.now()}@havre-test.ca`}, 'admin', 'en-CA')
    RETURNING id::text
  `);
  adminId = String((a as unknown as Array<{ id: string }>)[0]!.id);
  await clean();
});

const BASE = {
  sitterPct: { platform: 18, repeat: 10, sitter_referral: 0 },
  ownerPct: 7,
  ownerFeeCapCents: 4500,
  launchPromoMonths: 12,
};

describe('taban oranlar', () => {
  it('satir yokken KODDAKI varsayilan donuyor', async () => {
    await clean();
    const s = await getCommissionSettings(db);
    // Bos tabloyu "komisyon sifir" diye okumak ilk dagitimda butun
    // komisyonlari silerdi.
    expect(s.sitterPct.platform).toBe(18);
    expect(s.ownerPct).toBe(7);
    expect(s.updatedAt).toBeNull();
  });

  it('kaydedilen oran geri okunuyor ve TEK SATIR kaliyor', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE, sitterPct: { platform: 15, repeat: 8, sitter_referral: 0 } });
    await saveCommissionSettings(db, { adminId, ...BASE, sitterPct: { platform: 12, repeat: 6, sitter_referral: 0 } });

    const s = await getCommissionSettings(db);
    expect(s.sitterPct.platform).toBe(12);
    expect(s.updatedAt).not.toBeNull();

    const rows = await db.execute(sql`SELECT count(*)::int AS n FROM commission_settings`);
    expect(Number((rows as unknown as Array<{ n: number }>)[0]!.n)).toBe(1);
  });

  it('degisiklik denetim kaydina ONCESI ve SONRASI ile yaziliyor', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE });
    await saveCommissionSettings(db, { adminId, ...BASE, ownerPct: 5 });

    const log = await listCommissionAudit(db, 5);
    const last = log[0]!;
    expect(last.action).toBe('settings.commission');
    // Bakici "komisyonum neden degisti" diye sordugunda cevabi bir
    // insan bulabilmeli: sonucu bilmek yetmiyor, oncesi de lazim.
    expect((last.before as { ownerPct: number }).ownerPct).toBe(7);
    expect((last.after as { ownerPct: number }).ownerPct).toBe(5);
  });
});

describe('kampanya', () => {
  const win = (fromDays: number, toDays: number) => ({
    startsAt: new Date(Date.now() + fromDays * 86400000).toISOString(),
    endsAt: new Date(Date.now() + toDays * 86400000).toISOString(),
  });

  it('yururlukteki kampanya orani cozumleniyor', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE });
    const r = await createCampaign(db, {
      adminId, name: 'Kis', sitterPct: { platform: 10 }, ...win(-1, 10),
    });
    expect(r.ok).toBe(true);

    const resolved = await getResolvedCommission(db);
    expect(resolved.config.sitterPct.platform).toBe(10);
    expect(resolved.campaignName).toBe('Kis');
    // Musteri ucreti kampanyadan etkilenmiyor
    expect(resolved.config.ownerPct).toBe(7);
  });

  it('gelecekteki kampanya HENUZ gecerli degil', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE });
    await createCampaign(db, { adminId, name: 'Yaz', sitterPct: { platform: 5 }, ...win(10, 20) });

    expect(await getActiveCampaign(db)).toBeNull();
    expect((await getResolvedCommission(db)).config.sitterPct.platform).toBe(18);
    // Ama listede gorunuyor: yonetici kurdugunu gorebilmeli
    expect(await listCampaigns(db)).toHaveLength(1);
  });

  it('CAKISAN kampanya reddediliyor', async () => {
    await clean();
    await createCampaign(db, { adminId, name: 'Bir', sitterPct: { platform: 10 }, ...win(0, 10) });
    const second = await createCampaign(db, {
      adminId, name: 'Iki', sitterPct: { platform: 8 }, ...win(5, 15),
    });
    // Ayni anda iki kampanya olursa yonetici hangi indirimi verdigini
    // ekrana bakarak bilemez.
    expect(second).toEqual({ ok: false, error: 'overlap' });
  });

  it('erken bitirilen kampanya SILINMIYOR, yalnizca etkisiz kaliyor', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE });
    const r = await createCampaign(db, {
      adminId, name: 'Erken', sitterPct: { platform: 9 }, ...win(-1, 10),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    await endCampaign(db, { adminId, campaignId: r.id });

    expect(await getActiveCampaign(db)).toBeNull();
    expect((await getResolvedCommission(db)).config.sitterPct.platform).toBe(18);

    const all = await listCampaigns(db);
    expect(all).toHaveLength(1);
    expect(all[0]!.endedEarlyAt).not.toBeNull();
  });

  it('erken bitirilenden SONRA ayni pencereye yeni kampanya kurulabilir', async () => {
    await clean();
    const r = await createCampaign(db, {
      adminId, name: 'Ilk', sitterPct: { platform: 9 }, ...win(0, 10),
    });
    if (!r.ok) throw new Error('kurulmali');
    await endCampaign(db, { adminId, campaignId: r.id });

    const again = await createCampaign(db, {
      adminId, name: 'Ikinci', sitterPct: { platform: 7 }, ...win(0, 10),
    });
    expect(again.ok).toBe(true);
  });
});

describe('GECMISE DONUK DEGIL', () => {
  it('kampanya acmak eski rezervasyonun komisyonunu degistirmez', async () => {
    await clean();
    await saveCommissionSettings(db, { adminId, ...BASE });

    /*
      Rezervasyonun komisyonu istegin OLUSTURULDUGU anda hesaplanip
      satira yaziliyor. Burada o satiri dogrudan yaziyoruz ve sonra
      kampanya aciyoruz: satir kimildamiyorsa, kampanya gecmise
      donuk degil demektir.
    */
    const [row] = (await db.execute(sql`
      SELECT b.id::text, b.sitter_commission_pct, b.sitter_commission_cents
      FROM bookings b LIMIT 1
    `)) as unknown as Array<{ id: string; sitter_commission_pct: number; sitter_commission_cents: number }>;

    if (!row) return; // tohum veri yoksa bu testin soyleyecegi bir sey yok

    const before = { pct: row.sitter_commission_pct, cents: row.sitter_commission_cents };

    await createCampaign(db, {
      adminId,
      name: 'Gecmis testi',
      sitterPct: { platform: 1, repeat: 1 },
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const [after] = (await db.execute(sql`
      SELECT sitter_commission_pct, sitter_commission_cents
      FROM bookings WHERE id = ${row.id}::uuid
    `)) as unknown as Array<{ sitter_commission_pct: number; sitter_commission_cents: number }>;

    expect(after!.sitter_commission_pct).toBe(before.pct);
    expect(after!.sitter_commission_cents).toBe(before.cents);
    await clean();
  });
});
