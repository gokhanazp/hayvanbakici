import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { getSitterDashboard } from './sitter.js';

/**
 * BAKICI PANOSU SORGUSU.
 *
 * Panonun tek isi bakiciya "durumun ne, ne eksik, ne kadar para
 * konusuldu" demek. Verdigi sozler:
 *  - bakici kaydi olmayan icin null
 *  - musaitlik KAYDI OLMAYAN gun ACIK sayilir (varsayilan 'open')
 *  - tutarlar rezervasyon DURUMUNA gore ayri kovalarda; iptal ve red
 *    hicbir kovaya girmez
 *  - fotograf sayimi profil fotografini de sayar (bkz. core/photoTotal)
 */
const db = getDb();

let sitterId = '';
let ownerId = '';

async function mkUser(email: string): Promise<string> {
  const r = await db.execute(sql`
    INSERT INTO users (email, role, locale) VALUES (${email}, 'owner'::user_role, 'en-CA')
    RETURNING id::text
  `);
  const id = String((r as unknown as Array<{ id: string }>)[0]!.id);
  await db.execute(sql`
    INSERT INTO profiles (user_id, first_name, last_name_initial) VALUES (${id}, 'Dash', 'T')
  `);
  return id;
}

beforeAll(async () => {
  const stamp = Date.now();
  sitterId = await mkUser(`dash-sitter-${stamp}@havre-test.ca`);
  ownerId = await mkUser(`dash-owner-${stamp}@havre-test.ca`);
  await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${sitterId}, 'active')`);
});

describe('bakici panosu', () => {
  it('bakici kaydi olmayan icin null', async () => {
    expect(await getSitterDashboard(db, ownerId)).toBeNull();
  });

  it('musaitlik kaydi yoksa onumuzdeki 30 gun ACIK sayilir', async () => {
    const d = await getSitterDashboard(db, sitterId);
    expect(d?.openDays).toBe(30);
  });

  it('kapatilan gunler acik gun sayisindan dusuyor', async () => {
    await db.execute(sql`
      INSERT INTO sitter_availability (sitter_id, date, status)
      SELECT ${sitterId}::uuid, d::date, 'blocked'
      FROM generate_series(CURRENT_DATE, CURRENT_DATE + 4, interval '1 day') d
      ON CONFLICT (sitter_id, date) DO UPDATE SET status = EXCLUDED.status
    `);
    const d = await getSitterDashboard(db, sitterId);
    expect(d?.openDays).toBe(25);
  });

  it('ek hayvan ucreti girilmemis hizmetleri sayiyor', async () => {
    await db.execute(sql`
      INSERT INTO sitter_services (sitter_id, service_type, price_cents, price_unit, extra_pet_price_cents)
      VALUES (${sitterId}, 'boarding', 5000, 'night', 0),
             (${sitterId}, 'dog_walking', 2500, 'walk', 1000)
    `);
    const d = await getSitterDashboard(db, sitterId);
    expect(d?.steps.serviceCount).toBe(2);
    expect(d?.servicesWithoutExtraPet).toBe(1);
  });

  it('fotograf sayimi profil fotografini de sayar', async () => {
    const before = await getSitterDashboard(db, sitterId);
    expect(before?.steps.photoCount).toBe(0);

    await db.execute(sql`
      UPDATE profiles SET avatar_url = '/media/avatar/d.webp' WHERE user_id = ${sitterId}
    `);
    const withAvatar = await getSitterDashboard(db, sitterId);
    expect(withAvatar?.steps.photoCount).toBe(1);
  });

  it('tutarlar rezervasyon durumuna gore ayriliyor; iptal hicbir kovada degil', async () => {
    const mk = (status: string, payout: number, offsetDays: number) => db.execute(sql`
      INSERT INTO bookings (
        owner_id, sitter_id, service_type, status, start_at, end_at, units, pet_ids,
        unit_price_cents, base_cents, subtotal_cents,
        owner_fee_cents, owner_tax_cents, owner_total_cents,
        attribution, sitter_commission_pct, sitter_commission_cents, sitter_payout_cents,
        province, cancellation_policy
      ) VALUES (
        ${ownerId}, ${sitterId}, 'boarding', ${status}::booking_status,
        now() + ${`${offsetDays} days`}::interval, now() + ${`${offsetDays + 2} days`}::interval,
        2, '[]'::jsonb,
        5000, 10000, 10000, 700, 91, 10791,
        'platform'::attribution, 18, 1800, ${payout},
        'ON'::province, 'moderate'::cancellation_policy
      )
    `);

    await mk('requested', 8000, 10);
    await mk('confirmed', 9000, 20);
    await mk('completed', 7000, -30);
    // Iptal ve red: hicbir kovaya girmemeli — "anlasilan" bir sey kalmadi
    await mk('cancelled', 5000, 30);
    await mk('declined', 4000, 40);

    const d = await getSitterDashboard(db, sitterId);
    expect(d?.earnings.awaitingAnswerCents).toBe(8000);
    expect(d?.earnings.awaitingAnswerCount).toBe(1);
    expect(d?.earnings.upcomingCents).toBe(9000);
    expect(d?.earnings.doneCents).toBe(7000);
    // Toplam, iptal + reddi ICERMIYOR
    const total = (d?.earnings.awaitingAnswerCents ?? 0)
      + (d?.earnings.upcomingCents ?? 0) + (d?.earnings.doneCents ?? 0);
    expect(total).toBe(24000);
  });
});
