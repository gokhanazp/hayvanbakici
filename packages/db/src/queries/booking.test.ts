import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  createBookingRequest, createPet, getCalendar, setAvailability,
  listOwnerBookings, listSitterBookings, getBookingForViewer,
  respondToRequest, cancelBooking, unitsBetween, isSitter,
} from './booking.js';

/**
 * REZERVASYON — gercek veritabanina karsi butunlesme testi.
 *
 * Burada dogrulanan seyler Postgres'e ozgu: generate_series ile takvim,
 * ON CONFLICT ile musaitlik yazimi, jsonb pet listesi, enum gecisleri ve
 * "yalnizca taraflar gorebilir" kuralinin SORGUDA tutuldugu.
 *
 * Tohum veri gerektirir (npm run db:seed).
 */
const db = getDb();

let sitterId = '';
let ownerId = '';
let strangerId = '';
let petId = '';

const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

beforeAll(async () => {
  /*
    FIKSTUR SECIMI DETERMINISTIK VE TAM OLMALI.

    Burada siralamasiz bir LIMIT 1 vardi ve bu, testin BASKA bir test
    dosyasinin yarattigi bakiciyi secmesine yol aciyordu: o bakicinin
    sehri (dolayisiyla eyaleti) yok ve vergi hesabi "Bilinmeyen eyalet
    kodu: null" diye patliyordu. Testler yeniden tohumlanmis bir
    veritabaninda gecip, ikinci calistirmada kirilyordu — yani hata
    koddaydi degil, fikstur secimindeydi.

    Sehir ve eyalet ZORUNLU (fiyat hesabi eyalete bagli), sira sabit.
  */
  const rows = await db.execute(sql`
    SELECT ss.sitter_id::text AS id FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles p  ON p.user_id  = ss.sitter_id
    JOIN cities   c  ON c.id       = p.city_id
    WHERE ss.service_type = 'boarding' AND ss.is_active AND st.status = 'active'
      AND p.province IS NOT NULL
    ORDER BY st.created_at, ss.sitter_id
    LIMIT 1
  `);
  sitterId = String((rows as unknown as Array<{ id: string }>)[0]!.id);

  const owners = await db.execute(sql`
    SELECT id::text FROM users WHERE role = 'owner' ORDER BY created_at LIMIT 2
  `);
  const list = owners as unknown as Array<{ id: string }>;
  ownerId = String(list[0]!.id);
  strangerId = String(list[1]!.id);

  petId = await createPet(db, { ownerId, name: 'Test Luna', species: 'dog', weightKg: 12 });
});

describe('unitsBetween', () => {
  it('konaklama GECE sayar', () => {
    expect(unitsBetween('boarding', '2026-10-01', '2026-10-04')).toBe(3);
  });
  it('ziyaret GUN sayar', () => {
    expect(unitsBetween('drop_in', '2026-10-01', '2026-10-03')).toBe(3);
  });
});

describe('takvim', () => {
  it('kaydi olmayan gun ACIK sayilir', async () => {
    const far = iso(300);
    const days = await getCalendar(db, sitterId, far, far);
    expect(days).toHaveLength(1);
    expect(days[0]?.status).toBe('open');
  });

  it('bakici gun kapatabilir ve geri acabilir', async () => {
    const d = iso(310);
    await setAvailability(db, sitterId, [d], 'blocked');
    expect((await getCalendar(db, sitterId, d, d))[0]?.status).toBe('blocked');
    await setAvailability(db, sitterId, [d], 'open');
    expect((await getCalendar(db, sitterId, d, d))[0]?.status).toBe('open');
  });
});

describe('rezervasyon talebi', () => {
  it('kapali gune talep REDDEDILIR', async () => {
    const a = iso(320), b = iso(322);
    await setAvailability(db, sitterId, [a], 'blocked');
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding', startDate: a, endDate: b, petIds: [petId],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('dates_unavailable');
    await setAvailability(db, sitterId, [a], 'open');
  });

  it('hayvansiz talep REDDEDILIR', async () => {
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding',
      startDate: iso(330), endDate: iso(332), petIds: [],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('pets_missing');
  });

  it('kendi kendine rezervasyon REDDEDILIR', async () => {
    const res = await createBookingRequest(db, {
      ownerId: sitterId, sitterId, serviceType: 'boarding',
      startDate: iso(340), endDate: iso(342), petIds: [petId],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('own_booking');
  });

  it('gecerli talep olusur ve fiyat KALEM KALEM saklanir', async () => {
    const a = iso(350), b = iso(353);
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding', startDate: a, endDate: b,
      petIds: [petId], specialInstructions: 'Akşam yürüyüşü 19:00',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const detail = await getBookingForViewer(db, res.bookingId, ownerId, 'en-CA');
    expect(detail).not.toBeNull();
    expect(detail?.status).toBe('requested');
    expect(detail?.units).toBe(3);
    expect(detail?.viewerRole).toBe('owner');
    expect(detail?.pets[0]?.name).toBe('Test Luna');
    // Toplam = hizmet bedeli + musteri ucreti + vergi
    expect(detail?.ownerTotalCents).toBe(
      (detail?.subtotalCents ?? 0) + (detail?.ownerFeeCents ?? 0) + (detail?.ownerTaxCents ?? 0),
    );
    expect(detail?.timeline[0]?.to).toBe('requested');

    /*
      DOKUM DE DOGRU OLMALI, yalnizca toplam degil.
      Ilk surumde kalem anahtarlari yanlisti ('line.base' yerine
      'quote.base') ve base/extraPet/holiday sifir yaziliyordu: toplam
      dogru, dokum bostu. Sayfada "$55 x 3 gece = $0.00" gorunuyordu.
    */
    expect(detail?.baseCents).toBe((detail?.unitPriceCents ?? 0) * (detail?.units ?? 0));
    expect(detail?.baseCents).toBeGreaterThan(0);
    expect(detail!.subtotalCents).toBe(
      detail!.baseCents + detail!.extraPetCents + detail!.holidayCents,
    );
  });

  it('TARAF OLMAYAN rezervasyonu goremez', async () => {
    const a = iso(360), b = iso(362);
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding', startDate: a, endDate: b, petIds: [petId],
    });
    if (!res.ok) throw new Error('talep olusmadi');
    expect(await getBookingForViewer(db, res.bookingId, strangerId, 'en-CA')).toBeNull();
    expect(await getBookingForViewer(db, res.bookingId, sitterId, 'en-CA')).not.toBeNull();
  });
});

describe('onay ve iptal', () => {
  it('onay gunleri TAKVIMDE tutar, iptal geri birakir', async () => {
    const a = iso(370), b = iso(372);
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding', startDate: a, endDate: b, petIds: [petId],
    });
    if (!res.ok) throw new Error('talep olusmadi');

    expect(await respondToRequest(db, res.bookingId, sitterId, 'confirmed')).toEqual({ ok: true });
    expect((await getCalendar(db, sitterId, a, a))[0]?.status).toBe('booked');

    expect(await cancelBooking(db, res.bookingId, ownerId)).toEqual({ ok: true });
    expect((await getCalendar(db, sitterId, a, a))[0]?.status).toBe('open');
  });

  it('ayni talep IKI KEZ onaylanamaz', async () => {
    const a = iso(380), b = iso(382);
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding', startDate: a, endDate: b, petIds: [petId],
    });
    if (!res.ok) throw new Error('talep olusmadi');
    await respondToRequest(db, res.bookingId, sitterId, 'confirmed');
    const second = await respondToRequest(db, res.bookingId, sitterId, 'confirmed');
    expect(second).toEqual({ ok: false, error: 'invalid' });
    await cancelBooking(db, res.bookingId, ownerId);
  });

  it('BASKA bir bakici talebi yanitlayamaz', async () => {
    const res = await createBookingRequest(db, {
      ownerId, sitterId, serviceType: 'boarding',
      startDate: iso(390), endDate: iso(392), petIds: [petId],
    });
    if (!res.ok) throw new Error('talep olusmadi');
    expect(await respondToRequest(db, res.bookingId, strangerId, 'confirmed'))
      .toEqual({ ok: false, error: 'not_found' });
  });
});

describe('listeler', () => {
  it('sahip kendi rezervasyonlarini gorur', async () => {
    const list = await listOwnerBookings(db, ownerId);
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((b) => b.counterpartFirstName.length > 0)).toBe(true);
  });

  it('bakici gelen talepleri gorur, BEKLEYENLER ustte', async () => {
    const list = await listSitterBookings(db, sitterId);
    expect(list.length).toBeGreaterThan(0);
    const firstPending = list.findIndex((b) => b.status === 'requested');
    const firstOther = list.findIndex((b) => b.status !== 'requested');
    if (firstPending >= 0 && firstOther >= 0) expect(firstPending).toBeLessThan(firstOther);
  });

  it('isSitter dogru cevap verir', async () => {
    expect(await isSitter(db, sitterId)).toBe(true);
    expect(await isSitter(db, ownerId)).toBe(false);
  });
});
