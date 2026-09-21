import { sql } from 'drizzle-orm';
import { REQUEST_EXPIRY_HOURS } from '@havre/core';
import { withDbErrors, type Database } from '../client.js';

/**
 * SURESI DOLAN TALEPLERI KAPATIR.
 *
 * EKRANDA VERILEN AMA TUTULMAYAN BIR SOZ IDI. Rezervasyon satirina
 * talep aninda `expires_at` yaziliyordu, sahibin ekraninda "Respond by
 * <tarih>" goruluyordu, bakici panosunda "A request expires on its own
 * after 36 hours" yaziyordu — ama hicbir kod bu durumu KAPATMIYORDU.
 * Talep sonsuza kadar 'requested' kaliyordu.
 *
 * Iki gorunur sonucu vardi:
 *
 * 1. Cevapsiz kalan sahibin isi hic bitmiyordu. Ne onay ne ret; ekranda
 *    gecmis bir tarih ve bekleyen bir satir.
 *
 * 2. BAKICININ YANIT ORANI SISIYORDU. O hesap (queries/sitter.ts)
 *    'expired' kayitlari paydaya koyup paya koymuyor; hala 'requested'
 *    olanlari ise hic saymiyor — cunku daha dun gelmis bir istek
 *    yuzunden bakiciyi cezalandirmak yanlis olurdu. Hicbir sey suresi
 *    dolmayinca, HIC CEVAP VERMEYEN bir bakici %100 yanit orani
 *    gosteriyordu. Herkese acik profilde duran bir rakam.
 *
 * `expires_at` SATIRDAN OKUNUYOR, yeniden hesaplanmiyor: talep aninda
 * yazilmis deger baglayici olan. Sonradan REQUEST_EXPIRY_HOURS
 * degistirilse bile eski talepler kendi sozlerine gore kapaniyor.
 * (Sabit yine de iceri aliniyor — yoksa bu dosya "36 saat" bilgisinin
 * ikinci bir kopyasi olurdu.)
 */
export interface ExpiredRequest {
  bookingId: string;
  ownerId: string;
  sitterId: string;
}

export const EXPIRY_HOURS = REQUEST_EXPIRY_HOURS;

export async function expireStaleRequests(
  db: Database, limit = 200,
): Promise<ExpiredRequest[]> {
  return withDbErrors(async () => {
    /*
      TEK IFADE, YARIS YOK. Guncelleme ve secim ayri iki sorgu olsaydi,
      arada bakici talebi onaylarsa onaylanmis bir rezervasyonu suresi
      dolmus diye kapatirdik. WHERE status = 'requested' kosulu
      UPDATE'in kendi icinde: ayni anda cevaplanan talep guncellemeye
      hic girmiyor.

      SINIRLI PARTI: bir seferde en fazla `limit` satir. Birikmis on bin
      talep varsa is tek cagrida zaman asimina ugramasin; bir sonraki
      calisma kalanini alir.
    */
    const rows = await db.execute(sql`
      UPDATE bookings SET status = 'expired'::booking_status, updated_at = now()
      WHERE id IN (
        SELECT id FROM bookings
        WHERE status = 'requested'
          AND expires_at IS NOT NULL
          AND expires_at <= now()
        ORDER BY expires_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id::text, owner_id::text, sitter_id::text
    `) as unknown as Array<Record<string, unknown>>;

    if (rows.length === 0) return [];

    /*
      GECMISE DE YAZILIYOR. Rezervasyon detayindaki zaman cizelgesi
      booking_events'ten okunuyor; yazmasaydik durum sessizce degisir ve
      "ne oldu" sorusunun cevabi hicbir yerde olmazdi.

      created_by NULL — bunu bir insan yapmadi (migration 0017).
    */
    await db.execute(sql`
      INSERT INTO booking_events (booking_id, type, payload, created_by)
      SELECT id, 'status_change',
             ${JSON.stringify({ from: 'requested', to: 'expired' })}::jsonb,
             NULL
      FROM bookings WHERE id IN (${sql.join(rows.map((r) => sql`${String(r.id)}::uuid`), sql`, `)})
    `);

    return rows.map((r) => ({
      bookingId: String(r.id),
      ownerId: String(r.owner_id),
      sitterId: String(r.sitter_id),
    }));
  });
}

/** Kac talebin suresi dolmus ama hala acik — izleme icin. */
export async function countStaleRequests(db: Database): Promise<number> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT count(*)::int AS n FROM bookings
      WHERE status = 'requested' AND expires_at IS NOT NULL AND expires_at <= now()
    `) as unknown as Array<{ n: number }>;
    return Number(rows[0]?.n ?? 0);
  });
}
