import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { expireStaleRequests, countStaleRequests } from './maintenance.js';

/**
 * SURESI DOLAN TALEPLER.
 *
 * Ekranda "36 saat sonra kendiliginden dolar" yaziyordu ama hicbir kod
 * bunu yapmiyordu. Bu testler sozun tutuldugunu ve YALNIZCA dogru
 * satirlara dokunuldugunu olcuyor.
 */
const db = getDb();

let sitterId = '';
let ownerId = '';
let petId = '';
let province = 'ON';

beforeAll(async () => {
  const s = await db.execute(sql`
    SELECT ss.sitter_id::text AS id FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles p  ON p.user_id  = ss.sitter_id
    JOIN cities   c  ON c.id       = p.city_id
    WHERE ss.is_active AND st.status = 'active' AND p.province IS NOT NULL
    ORDER BY st.created_at, ss.sitter_id LIMIT 1
  `) as unknown as Array<{ id: string }>;
  sitterId = String(s[0]!.id);

  const pr = await db.execute(sql`
    SELECT province::text FROM profiles WHERE user_id = ${sitterId}
  `) as unknown as Array<{ province: string }>;
  province = String(pr[0]!.province);

  const o = await db.execute(sql`
    SELECT id::text FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 1
  `) as unknown as Array<{ id: string }>;
  ownerId = String(o[0]!.id);

  const p = await db.execute(sql`
    SELECT id::text FROM pets WHERE owner_id = ${ownerId} LIMIT 1
  `) as unknown as Array<{ id: string }>;
  petId = p[0] ? String(p[0].id) : '';
});

/** Verilen durum ve bitis zamaniyla ham bir talep satiri yaratir. */
async function makeRequest(status: string, expiresAt: string | null): Promise<string> {
  const rows = await db.execute(sql`
    INSERT INTO bookings (
      owner_id, sitter_id, service_type, status, start_at, end_at, units,
      pet_ids, unit_price_cents, base_cents, extra_pet_cents, holiday_cents, add_ons_cents,
      owner_fee_cents, owner_tax_cents, subtotal_cents, owner_total_cents,
      sitter_commission_pct, sitter_commission_cents, sitter_payout_cents,
      attribution, cancellation_policy, province, expires_at
    ) VALUES (
      ${ownerId}, ${sitterId}, 'boarding', ${status}::booking_status,
      now() + interval '20 days', now() + interval '22 days', 2,
      ${JSON.stringify(petId ? [petId] : [])}::jsonb,
      5000, 10000, 0, 0, 0, 700, 100, 10700, 10800,
      18, 1800, 8200, 'platform', 'moderate', ${province}::province, ${expiresAt}
    ) RETURNING id::text
  `) as unknown as Array<{ id: string }>;
  return String(rows[0]!.id);
}

const status = async (id: string): Promise<string> => {
  const r = await db.execute(sql`SELECT status::text FROM bookings WHERE id = ${id}`) as unknown as Array<{ status: string }>;
  return String(r[0]!.status);
};

describe('suresi dolan talepler', () => {
  it('GECMIS tarihli bekleyen talep kapaniyor', async () => {
    const id = await makeRequest('requested', null);
    /* Bitis zamani PARAMETRE olarak gecmiyor: `now() - interval ...`
       bir SQL ifadesi, metin olarak gonderilince Postgres onu tarih
       diye ayristirmaya calisiyor ve patliyor. Once satiri yaratip
       sonra SQL icinde geriye cekiyoruz. */
    await db.execute(sql`UPDATE bookings SET expires_at = now() - interval '1 hour' WHERE id = ${id}`);

    const out = await expireStaleRequests(db);
    expect(out.some((r) => r.bookingId === id)).toBe(true);
    expect(await status(id)).toBe('expired');

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('SURESI DOLMAMIS talebe DOKUNULMUYOR', async () => {
    const id = await makeRequest('requested', null);
    await db.execute(sql`UPDATE bookings SET expires_at = now() + interval '10 hours' WHERE id = ${id}`);

    await expireStaleRequests(db);
    expect(await status(id)).toBe('requested');

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('ONAYLANMIS rezervasyona DOKUNULMUYOR — tarihi gecmis olsa bile', async () => {
    /*
      En tehlikeli hata bu olurdu: bakici cevap vermis, tarih gecmis ve
      biz onayi geri almisiz. WHERE kosulu UPDATE'in kendi icinde.
    */
    const id = await makeRequest('confirmed', null);
    await db.execute(sql`UPDATE bookings SET expires_at = now() - interval '5 days' WHERE id = ${id}`);

    await expireStaleRequests(db);
    expect(await status(id)).toBe('confirmed');

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('expires_at YOKSA dokunulmuyor', async () => {
    const id = await makeRequest('requested', null);
    await expireStaleRequests(db);
    expect(await status(id)).toBe('requested');
    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('GECMISE yaziliyor ve aktor SISTEM (NULL)', async () => {
    const id = await makeRequest('requested', null);
    await db.execute(sql`UPDATE bookings SET expires_at = now() - interval '1 hour' WHERE id = ${id}`);
    await expireStaleRequests(db);

    const ev = await db.execute(sql`
      SELECT payload, created_by FROM booking_events
      WHERE booking_id = ${id} AND type = 'status_change'
    `) as unknown as Array<{ payload: { from: string; to: string }; created_by: string | null }>;

    expect(ev).toHaveLength(1);
    expect(ev[0]!.payload).toEqual({ from: 'requested', to: 'expired' });
    /* Bunu bir insan yapmadi — bakicinin uzerine yazmak, hicbir sey
       yapmamis birini islem yapmis gibi gosterirdi. */
    expect(ev[0]!.created_by).toBeNull();

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('iki kez calistirmak ayni satiri iki kez kapatmiyor', async () => {
    const id = await makeRequest('requested', null);
    await db.execute(sql`UPDATE bookings SET expires_at = now() - interval '1 hour' WHERE id = ${id}`);

    const first = await expireStaleRequests(db);
    const second = await expireStaleRequests(db);
    expect(first.some((r) => r.bookingId === id)).toBe(true);
    expect(second.some((r) => r.bookingId === id)).toBe(false);

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });

  it('sayim, kapatma sonrasi sifira dusuyor', async () => {
    const id = await makeRequest('requested', null);
    await db.execute(sql`UPDATE bookings SET expires_at = now() - interval '1 hour' WHERE id = ${id}`);

    expect(await countStaleRequests(db)).toBeGreaterThan(0);
    await expireStaleRequests(db);
    expect(await countStaleRequests(db)).toBe(0);

    await db.execute(sql`DELETE FROM bookings WHERE id = ${id}`);
  });
});
