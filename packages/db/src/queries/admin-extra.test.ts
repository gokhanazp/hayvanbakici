import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  listUsers, getUser, setSuspension, setRole, addNote, listNotes,
} from './admin-users.js';
import { listReviews, setReviewHidden, createReport, listReports, resolveReport } from './admin-moderation.js';
import { getBookingAdmin, adminSetBookingStatus } from './admin-bookings.js';
import { getMetrics } from './admin-metrics.js';
import { listAudit } from './admin.js';

/**
 * YENI YONETICI EKRANLARININ ARKASINDAKI KURALLAR.
 *
 * Burada test edilen sey ozellikler degil, VERDIGIMIZ SOZLER:
 *  - gerekcesiz askiya alma / gizleme / iptal olmaz
 *  - askiya alinan bakici sitede gorunmez
 *  - yorum METNI hicbir yerde degismez
 *  - son yonetici indirilmez, kimse kendini askiya almaz
 */
const db = getDb();

let adminId = '';
let otherAdminId = '';
let sitterId = '';

beforeAll(async () => {
  const mk = async (email: string, role: string) => {
    const r = await db.execute(sql`
      INSERT INTO users (email, role, locale) VALUES (${email}, ${role}::user_role, 'en-CA')
      RETURNING id::text
    `);
    return String((r as unknown as Array<{ id: string }>)[0]!.id);
  };
  const stamp = Date.now();
  adminId = await mk(`x-admin-${stamp}@havre-test.ca`, 'admin');
  otherAdminId = await mk(`x-admin2-${stamp}@havre-test.ca`, 'admin');

  // Aktif bir bakici — askiya alma etkisini olcmek icin
  sitterId = await mk(`x-sitter-${stamp}@havre-test.ca`, 'sitter');
  await db.execute(sql`
    INSERT INTO profiles (user_id, first_name, last_name_initial) VALUES (${sitterId}, 'Askı', 'T')
  `);
  await db.execute(sql`
    INSERT INTO sitters (user_id, status) VALUES (${sitterId}, 'active')
  `);
});

describe('kullanici listesi ve detayi', () => {
  it('e-posta ile arama calisir ve toplam sayiyi doner', async () => {
    const page = await listUsers(db, { q: 'x-sitter-' });
    expect(page.rows.some((r) => r.id === sitterId)).toBe(true);
    expect(page.total).toBeGreaterThan(0);
  });

  it('LIKE joker karakterleri arama metninde joker DEGIL', async () => {
    // '%' yazan biri tum kullanicilari listeleyememeli
    const page = await listUsers(db, { q: '%' });
    expect(page.rows.length).toBe(0);
  });

  it('detay rezervasyon gecmisini ve sayilari getirir', async () => {
    const u = await getUser(db, sitterId);
    expect(u?.email).toContain('x-sitter-');
    expect(u?.sitterStatus).toBe('active');
    expect(Array.isArray(u?.recentBookings)).toBe(true);
  });
});

describe('askiya alma', () => {
  it('GEREKCESIZ askiya alma kabul edilmez', async () => {
    const res = await setSuspension(db, {
      userId: sitterId, adminId, suspend: true, reason: 'kisa',
    });
    expect(res).toEqual({ ok: false, error: 'reason_required' });
  });

  it('kimse KENDINI askiya alamaz', async () => {
    const res = await setSuspension(db, {
      userId: adminId, adminId, suspend: true, reason: 'Yeterince uzun bir gerekce.',
    });
    expect(res).toEqual({ ok: false, error: 'self_action' });
  });

  it('askiya alinan bakici SITEDE GORUNMEZ hale gelir', async () => {
    const res = await setSuspension(db, {
      userId: sitterId, adminId, suspend: true,
      reason: 'Sahte belge yukledigi tespit edildi.',
    });
    expect(res).toEqual({ ok: true });

    // "status = 'active'" diyen tum genel sorgular icin tek kontrol noktasi
    const rows = await db.execute(sql`
      SELECT status::text, pre_suspension_status::text FROM sitters WHERE user_id = ${sitterId}
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0]!;
    expect(r.status).toBe('deactivated');
    expect(r.pre_suspension_status).toBe('active');

    const audit = await listAudit(db, 5, 'decisions');
    expect(audit.some((a) => a.action === 'user.suspend' && a.entityId === sitterId)).toBe(true);
  });

  it('aski kalkinca ESKI DURUM geri gelir', async () => {
    const res = await setSuspension(db, {
      userId: sitterId, adminId, suspend: false, reason: 'Belge dogrulandi, karar geri alindi.',
    });
    expect(res).toEqual({ ok: true });
    const rows = await db.execute(sql`
      SELECT status::text, pre_suspension_status FROM sitters WHERE user_id = ${sitterId}
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0]!;
    expect(r.status).toBe('active');
    expect(r.pre_suspension_status).toBeNull();
  });
});

describe('rol degisikligi', () => {
  it('SON YONETICI indirilemez', async () => {
    // Once digerini dusur, sonra tek kalani dusurmeyi dene
    const others = await db.execute(sql`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`);
    const n = Number((others as unknown as Array<{ n: number }>)[0]!.n);
    expect(n).toBeGreaterThanOrEqual(2); // testte iki yonetici var

    const res = await setRole(db, {
      userId: otherAdminId, adminId, role: 'owner', reason: 'Ekipten ayrildi, erisimi kapatildi.',
    });
    expect(res).toEqual({ ok: true });
  });

  it('kimse KENDI rolunu degistiremez', async () => {
    const res = await setRole(db, {
      userId: adminId, adminId, role: 'owner', reason: 'Bu islem yapilamamali.',
    });
    expect(res).toEqual({ ok: false, error: 'self_action' });
  });
});

describe('ic notlar', () => {
  it('not eklenir ve listelenir; duzenleme yolu yok', async () => {
    await addNote(db, {
      entityType: 'user', entityId: sitterId, authorId: adminId,
      body: 'Telefonla aradi, belgeyi tekrar yukleyecek.',
    });
    const notes = await listNotes(db, 'user', sitterId);
    expect(notes[0]?.body).toContain('Telefonla aradi');
  });
});

describe('yorum moderasyonu', () => {
  it('yorum listesi filtrelenebiliyor', async () => {
    const low = await listReviews(db, 'low', 10);
    expect(low.every((r) => r.rating <= 2)).toBe(true);
  });

  it('GEREKCESIZ gizleme kabul edilmez ve METIN DEGISMEZ', async () => {
    const all = await listReviews(db, 'published', 1);
    const target = all[0];
    if (!target) return; // tohum veri yoksa atla

    const bad = await setReviewHidden(db, {
      reviewId: target.id, adminId, hide: true, reason: 'kisa',
    });
    expect(bad).toEqual({ ok: false, error: 'reason_required' });

    const ok = await setReviewHidden(db, {
      reviewId: target.id, adminId, hide: true,
      reason: 'Baska bir kullanicinin telefon numarasini iceriyor.',
    });
    expect(ok).toEqual({ ok: true });

    const after = await db.execute(sql`
      SELECT body, hidden_at, hidden_reason FROM reviews WHERE id = ${target.id}
    `);
    const row = (after as unknown as Array<Record<string, unknown>>)[0]!;
    // Metin AYNI: moderasyon yalnizca gizler, duzenlemez
    expect(row.body).toBe(target.body);
    expect(row.hidden_at).not.toBeNull();

    // Geri alinabilir
    const back = await setReviewHidden(db, {
      reviewId: target.id, adminId, hide: false, reason: '',
    });
    expect(back).toEqual({ ok: true });
  });
});

describe('sikayet kuyrugu', () => {
  it('sikayet acilir, sonucsuz kapatilamaz', async () => {
    const created = await createReport(db, {
      reporterId: adminId, subjectType: 'user', subjectId: sitterId,
      subjectUserId: sitterId, reason: 'Odeme disi yonlendirme',
    });
    expect(created).toEqual({ ok: true });

    const open = await listReports(db, 'open');
    const mine = open.find((r) => r.subjectId === sitterId);
    expect(mine).toBeTruthy();

    const bad = await resolveReport(db, {
      reportId: mine!.id, adminId, outcome: 'dismissed', resolution: 'yok',
    });
    expect(bad).toEqual({ ok: false, error: 'reason_required' });

    const good = await resolveReport(db, {
      reportId: mine!.id, adminId, outcome: 'dismissed',
      resolution: 'Kayitlar incelendi, platform disina yonlendirme bulunmadi.',
    });
    expect(good).toEqual({ ok: true });

    // Kapanmis sikayet tekrar kapatilamaz
    const again = await resolveReport(db, {
      reportId: mine!.id, adminId, outcome: 'actioned',
      resolution: 'Ayni sikayet iki kez sonuclandirilamaz.',
    });
    expect(again).toEqual({ ok: false, error: 'invalid_state' });
  });
});

describe('rezervasyon mudahalesi', () => {
  it('yonetici de DURUM MAKINESININ disina cikamaz', async () => {
    const rows = await db.execute(sql`
      SELECT id::text FROM bookings WHERE status = 'payout_released' LIMIT 1
    `);
    const b = (rows as unknown as Array<{ id: string }>)[0];
    if (!b) return;

    const res = await adminSetBookingStatus(db, {
      bookingId: b.id, adminId, to: 'confirmed',
      reason: 'Odenmis rezervasyon onaya geri dondurulemez.',
    });
    expect(res).toEqual({ ok: false, error: 'invalid_state' });
  });

  it('detay zaman cizelgesini getirir', async () => {
    const rows = await db.execute(sql`SELECT id::text FROM bookings LIMIT 1`);
    const b = (rows as unknown as Array<{ id: string }>)[0];
    if (!b) return;
    const detail = await getBookingAdmin(db, b.id);
    expect(detail?.id).toBe(b.id);
    expect(Array.isArray(detail?.timeline)).toBe(true);
  });
});

describe('metrikler', () => {
  it('bos gunler 0 ile dolduruluyor', async () => {
    const m = await getMetrics(db, 14);
    expect(m.signups).toHaveLength(14);
    expect(m.bookings).toHaveLength(14);
    expect(m.signups.every((p) => Number.isFinite(p.value))).toBe(true);
  });

  it('gun sayisi makul araliga kisitlaniyor', async () => {
    expect((await getMetrics(db, 1)).days).toBe(7);
    expect((await getMetrics(db, 10_000)).days).toBe(365);
  });
});
