import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  getOverview, listApplications, getApplication, decideApplication,
  listAudit, listAllBookings, isAdmin, recordAudit,
} from './admin.js';

/**
 * ADMIN — gercek veritabanina karsi.
 *
 * En onemli iki iddia burada test ediliyor:
 *   1. Gerekcesiz RED kabul edilmiyor.
 *   2. Her karar denetim kaydina yaziliyor.
 * Ikisi de sayfada soz verdigimiz seyler; kodda tutulmazsa soz degil.
 */
const db = getDb();

let adminId = '';
let applicantId = '';

beforeAll(async () => {
  // Yonetici
  const a = await db.execute(sql`
    INSERT INTO users (email, role, locale) VALUES (${`admin-${Date.now()}@havre-test.ca`}, 'admin', 'en-CA')
    RETURNING id::text
  `);
  adminId = String((a as unknown as Array<{ id: string }>)[0]!.id);

  // Beklemede bir basvuru
  const u = await db.execute(sql`
    INSERT INTO users (email, role, locale) VALUES (${`applicant-${Date.now()}@havre-test.ca`}, 'sitter', 'en-CA')
    RETURNING id::text
  `);
  applicantId = String((u as unknown as Array<{ id: string }>)[0]!.id);
  await db.execute(sql`
    INSERT INTO profiles (user_id, first_name, last_name_initial, bio)
    VALUES (${applicantId}, 'Aday', 'T', 'Test basvurusu')
  `);
  await db.execute(sql`
    INSERT INTO sitters (user_id, status, sin_encrypted) VALUES (${applicantId}, 'pending', 'v1.fake')
  `);
});

describe('ozet', () => {
  it('sayilari dondurur', async () => {
    const o = await getOverview(db);
    expect(o.pendingApplications).toBeGreaterThan(0);
    expect(o.activeSitters).toBeGreaterThan(0);
    expect(Array.isArray(o.bookingsByStatus)).toBe(true);
  });
});

describe('basvuru listesi ve detayi', () => {
  it('bekleyen basvurular listelenir', async () => {
    const list = await listApplications(db, 'pending');
    expect(list.some((a) => a.userId === applicantId)).toBe(true);
  });

  it('detay SIFRELI ALANLARIN ICINI DEGIL, VARLIGINI verir', async () => {
    const d = await getApplication(db, applicantId);
    expect(d).not.toBeNull();
    expect(d?.hasSin).toBe(true);
    // Sifreli degerin kendisi hicbir alanda gecmemeli
    expect(JSON.stringify(d)).not.toContain('v1.fake');
  });
});

describe('karar', () => {
  it('GEREKCESIZ RED kabul edilmez', async () => {
    const res = await decideApplication(db, {
      userId: applicantId, adminId, decision: 'reject', reason: 'kisa',
    });
    expect(res).toEqual({ ok: false, error: 'reason_required' });
    // Durum degismemeli
    expect((await getApplication(db, applicantId))?.status).toBe('pending');
  });

  it('onay durumu aktif yapar ve DENETIM KAYDI birakir', async () => {
    const before = (await listAudit(db, 5)).length;
    const res = await decideApplication(db, {
      userId: applicantId, adminId, decision: 'approve', reason: '',
    });
    expect(res).toEqual({ ok: true });
    expect((await getApplication(db, applicantId))?.status).toBe('active');

    const audit = await listAudit(db, 5);
    expect(audit.length).toBeGreaterThanOrEqual(before);
    expect(audit[0]?.action).toBe('sitter.approve');
    expect(audit[0]?.entityId).toBe(applicantId);
  });

  it('ayni basvuru IKI KEZ karara baglanamaz', async () => {
    const res = await decideApplication(db, {
      userId: applicantId, adminId, decision: 'reject',
      reason: 'Yeterli gerekce metni burada duruyor.',
    });
    expect(res).toEqual({ ok: false, error: 'invalid_state' });
  });
});

describe('denetim kaydi', () => {
  it('elle yazilan kayit da listede gorunur', async () => {
    await recordAudit(db, {
      actorId: adminId, action: 'test.read', entity: 'booking', entityId: 'x',
    });
    const audit = await listAudit(db, 5);
    expect(audit.some((a) => a.action === 'test.read')).toBe(true);
  });

  /*
    Reddin gerekcesi kayitta OKUNABILIR durmali. Yalnizca "reddedildi"
    yazan bir kayit, Quebec Charter s.18.2 veya Law 25 s.12.1 kapsaminda
    gelen bir soruya cevap veremez.
  */
  it('RED GEREKCESI denetim kaydinda okunabiliyor', async () => {
    const u = await db.execute(sql`
      INSERT INTO users (email, role, locale)
      VALUES (${`rejected-${Date.now()}@havre-test.ca`}, 'sitter', 'en-CA')
      RETURNING id::text
    `);
    const rejectedId = String((u as unknown as Array<{ id: string }>)[0]!.id);
    await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${rejectedId}, 'pending')`);

    const reason = 'Kimlik dogrulamasi tamamlanmadi, belgeler eksik.';
    const res = await decideApplication(db, {
      userId: rejectedId, adminId, decision: 'reject', reason,
    });
    expect(res).toEqual({ ok: true });

    const audit = await listAudit(db, 5);
    const row = audit.find((a) => a.action === 'sitter.reject' && a.entityId === rejectedId);
    expect(row?.reason).toBe(reason);

    // Onay kayitlarinda gerekce alani bos kalabilir; zorunlu degil
    const approvals = audit.filter((a) => a.action === 'admin.view');
    expect(approvals.every((a) => a.reason === null)).toBe(true);
  });
});

describe('roller ve listeler', () => {
  it('isAdmin yalnizca yoneticiye true doner', async () => {
    expect(await isAdmin(db, adminId)).toBe(true);
    expect(await isAdmin(db, applicantId)).toBe(false);
  });

  it('rezervasyon listesi durum filtresiyle calisir', async () => {
    const all = await listAllBookings(db);
    expect(all.length).toBeGreaterThan(0);
    const requested = await listAllBookings(db, 'requested');
    expect(requested.every((b) => b.status === 'requested')).toBe(true);
  });
});
