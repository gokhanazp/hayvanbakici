import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  openConversation, sendMessage, listConversations, getThread, markRead,
  unreadCount, getRawMessage, reportableMessage, MAX_MESSAGE, NEW_THREAD_LIMIT,
} from './messaging.js';

/**
 * MESAJLASMA TESTLERI.
 *
 * Verilen sozler burada olculuyor:
 *  - bir cift icin TEK konusma (iki tarafin ayri kutulara yazmasi olmaz)
 *  - gosterilen metin MASKELI, ham metin duruyor
 *  - baskasinin konusmasi okunamaz, icine yazilamaz
 *  - askidaki kullanici yazamaz ama okuyabilir
 */
const db = getDb();

let ownerId = '';
let sitterId = '';
let outsiderId = '';
let conversationId = '';

async function mkUser(email: string, role: string, name: string): Promise<string> {
  const r = await db.execute(sql`
    INSERT INTO users (email, role, locale) VALUES (${email}, ${role}::user_role, 'en-CA')
    RETURNING id::text
  `);
  const id = String((r as unknown as Array<{ id: string }>)[0]!.id);
  await db.execute(sql`
    INSERT INTO profiles (user_id, first_name, last_name_initial)
    VALUES (${id}, ${name}, 'T')
  `);
  return id;
}

beforeAll(async () => {
  const stamp = Date.now();
  ownerId = await mkUser(`msg-owner-${stamp}@havre-test.ca`, 'owner', 'Sahip');
  sitterId = await mkUser(`msg-sitter-${stamp}@havre-test.ca`, 'sitter', 'Bakici');
  outsiderId = await mkUser(`msg-other-${stamp}@havre-test.ca`, 'owner', 'Yabanci');
  await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${sitterId}, 'active')`);
});

describe('konusma acma', () => {
  it('acar ve IKINCI cagrida ayni konusmayi doner', async () => {
    const first = await openConversation(db, { ownerId, sitterId });
    expect(first.ok).toBe(true);
    conversationId = (first as { ok: true; value: string }).value;

    const again = await openConversation(db, { ownerId, sitterId });
    expect(again).toEqual({ ok: true, value: conversationId });
  });

  it('kendine konusma acilamaz', async () => {
    const res = await openConversation(db, { ownerId, sitterId: ownerId });
    expect(res).toEqual({ ok: false, error: 'self' });
  });

  it('AKTIF OLMAYAN bakiciya konusma acilamaz', async () => {
    const stamp = Date.now();
    const draft = await mkUser(`msg-draft-${stamp}@havre-test.ca`, 'sitter', 'Taslak');
    await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${draft}, 'pending')`);
    const res = await openConversation(db, { ownerId, sitterId: draft });
    expect(res).toEqual({ ok: false, error: 'sitter_unavailable' });
  });

  it('ASKIDAKI sahip yeni konusma acamaz', async () => {
    const stamp = Date.now();
    const banned = await mkUser(`msg-banned-${stamp}@havre-test.ca`, 'owner', 'Askida');
    await db.execute(sql`UPDATE users SET suspended_at = now() WHERE id = ${banned}`);
    const res = await openConversation(db, { ownerId: banned, sitterId });
    expect(res).toEqual({ ok: false, error: 'suspended' });
  });

  it('saatte acilabilecek yeni konusma SINIRLI', async () => {
    const stamp = Date.now();
    const spammer = await mkUser(`msg-spam-${stamp}@havre-test.ca`, 'owner', 'Hizli');

    // Sinira kadar bakici uret ve konusma ac
    for (let i = 0; i < NEW_THREAD_LIMIT; i += 1) {
      const s = await mkUser(`msg-s${i}-${stamp}@havre-test.ca`, 'sitter', `B${i}`);
      await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${s}, 'active')`);
      const res = await openConversation(db, { ownerId: spammer, sitterId: s });
      expect(res.ok).toBe(true);
    }

    const extra = await mkUser(`msg-extra-${stamp}@havre-test.ca`, 'sitter', 'Fazla');
    await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${extra}, 'active')`);
    const res = await openConversation(db, { ownerId: spammer, sitterId: extra });
    expect(res).toEqual({ ok: false, error: 'rate_limited' });

    // Ama VAR OLAN konusmalarda yazmaya devam edebilir: sinir yeni konusma icin
    const existing = await openConversation(db, { ownerId: spammer, sitterId });
    expect(existing.ok).toBe(false); // bu da yeni bir konusma olurdu
  });
});

describe('mesaj gonderme', () => {
  it('bos mesaj gonderilemez', async () => {
    const res = await sendMessage(db, { conversationId, senderId: ownerId, body: '   ' });
    expect(res).toEqual({ ok: false, error: 'empty' });
  });

  it('cok uzun mesaj gonderilemez', async () => {
    const res = await sendMessage(db, {
      conversationId, senderId: ownerId, body: 'a'.repeat(MAX_MESSAGE + 1),
    });
    expect(res).toEqual({ ok: false, error: 'too_long' });
  });

  it('YABANCI birinin konusmaya yazmasi engelleniyor', async () => {
    const res = await sendMessage(db, {
      conversationId, senderId: outsiderId, body: 'Buraya yazmamam lazim',
    });
    expect(res).toEqual({ ok: false, error: 'not_allowed' });
  });

  it('ILETISIM BILGISI maskeleniyor ama HAM METIN saklaniyor', async () => {
    const raw = 'Beni 416-555-1234 numarasindan arayin';
    const res = await sendMessage(db, { conversationId, senderId: ownerId, body: raw });
    expect(res.ok).toBe(true);
    const value = (res as { ok: true; value: { id: string; redactedCount: number } }).value;
    expect(value.redactedCount).toBe(1);

    const stored = await getRawMessage(db, value.id);
    expect(stored?.body).toBe(raw);                    // ham metin duruyor
    expect(stored?.redacted).not.toContain('555');     // gosterilen maskeli
  });

  it('askidaki kullanici YAZAMAZ ama gecmisi OKUYABILIR', async () => {
    await db.execute(sql`UPDATE users SET suspended_at = now() WHERE id = ${ownerId}`);

    const res = await sendMessage(db, { conversationId, senderId: ownerId, body: 'Yazabilir miyim' });
    expect(res).toEqual({ ok: false, error: 'suspended' });

    const thread = await getThread(db, conversationId, ownerId);
    expect(thread?.messages.length).toBeGreaterThan(0);

    await db.execute(sql`UPDATE users SET suspended_at = NULL WHERE id = ${ownerId}`);
  });
});

describe('okuma ve okunmamis', () => {
  it('konusma yalnizca TARAFLARINA aciliyor', async () => {
    expect(await getThread(db, conversationId, outsiderId)).toBeNull();
    expect(await getThread(db, conversationId, sitterId)).not.toBeNull();
  });

  it('okunmamis sayisi yalnizca KARSI tarafin mesajlarini sayiyor', async () => {
    await sendMessage(db, { conversationId, senderId: ownerId, body: 'Merhaba, musait misiniz' });

    // Bakici acisindan okunmamis var, sahip acisindan yok
    expect(await unreadCount(db, sitterId)).toBeGreaterThan(0);
    const mine = await listConversations(db, ownerId);
    expect(mine.find((c) => c.id === conversationId)?.unread).toBe(0);

    await markRead(db, conversationId, sitterId);
    expect(await unreadCount(db, sitterId)).toBe(0);
  });

  it('markRead BASKASININ konusmasinda hicbir sey yapmaz', async () => {
    await sendMessage(db, { conversationId, senderId: sitterId, body: 'Evet, musaitim' });
    await markRead(db, conversationId, outsiderId);

    const rows = await db.execute(sql`
      SELECT count(*)::int AS n FROM messages
      WHERE conversation_id = ${conversationId} AND read_at IS NULL
    `);
    expect(Number((rows as unknown as Array<{ n: number }>)[0]!.n)).toBeGreaterThan(0);
  });

  it('liste son mesaji ve kimin yazdigini gosteriyor', async () => {
    const list = await listConversations(db, ownerId);
    const row = list.find((c) => c.id === conversationId);
    expect(row?.lastMessage).toContain('musaitim');
    expect(row?.lastFromMe).toBe(false);
    expect(row?.counterpartFirstName).toBe('Bakici');
  });
});

/**
 * BILDIRME.
 *
 * Bu, panelde ham metni acmanin TEK anahtari; anahtarin kime verildigi
 * mesajin kendisi kadar onemli.
 */
describe('mesaj bildirme', () => {
  it('karsi tarafin mesaji bildirilebilir, gonderen dogru donuyor', async () => {
    const sent = await sendMessage(db, {
      conversationId, senderId: sitterId, body: 'Sorunuza cevap',
    });
    const id = (sent as { ok: true; value: { id: string } }).value.id;

    const res = await reportableMessage(db, id, ownerId);
    expect(res.ok).toBe(true);
    expect((res as { ok: true; value: { senderId: string } }).value.senderId).toBe(sitterId);
  });

  it('KENDI mesajini bildiremezsin', async () => {
    const sent = await sendMessage(db, {
      conversationId, senderId: ownerId, body: 'Kendi mesajim',
    });
    const id = (sent as { ok: true; value: { id: string } }).value.id;

    expect(await reportableMessage(db, id, ownerId)).toEqual({ ok: false, error: 'self' });
  });

  it('konusmanin TARAFI olmayan bildiremez — mesaj "yok" gorunur', async () => {
    const sent = await sendMessage(db, {
      conversationId, senderId: sitterId, body: 'Ucuncu kisi bunu gormemeli',
    });
    const id = (sent as { ok: true; value: { id: string } }).value.id;

    expect(await reportableMessage(db, id, outsiderId)).toEqual({ ok: false, error: 'not_found' });
  });
});
