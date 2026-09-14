import { sql } from 'drizzle-orm';
import { redactContact, MAX_MESSAGE } from '@havre/core';
import { withDbErrors, type Database } from '../client.js';

/**
 * MESAJLASMA.
 *
 * MODEL: bir SAHIP–BAKICI cifti icin TEK konusma. Rezervasyon basina ayri
 * bir kutu acmak, ayni iki insani birbirinden habersiz iki yere
 * yaziyordu; ustelik rezervasyon oncesi soru sorarken henuz rezervasyon
 * yok. `booking_id` konusmanin hangi rezervasyondan dogdugunu isaretler,
 * sahipligini degil.
 *
 * IKI METIN SAKLANIYOR:
 *   body          — ham hali. Yalnizca sikayet uzerine, denetim kaydi
 *                   birakilarak acilir.
 *   body_redacted — GOSTERILEN hali; telefon/e-posta/hesap numarasi
 *                   maskeli (packages/core/src/redact.ts).
 * Maskeleme mesaji ENGELLEMEZ. Amac ceza degil, musteriyi kaydi olmayan
 * bir anlasmadan ve "once para gonder" dolandiriciligindan korumak.
 *
 * KIMLIK KONTROLU HER ZAMAN WHERE ICINDE. Once konusmayi cekip sonra
 * "bu kisinin mi" diye bakan bir kod, bir gun o kontrolu atlar.
 */

export type MessagingError =
  | 'not_found'
  | 'not_allowed'
  | 'empty'
  | 'too_long'
  | 'suspended'
  | 'sitter_unavailable'
  | 'rate_limited'
  | 'self';

export type MessagingResult<T> = { ok: true; value: T } | { ok: false; error: MessagingError };

/* MAX_MESSAGE @havre/core'dan geliyor: yazma kutusu da ayni sayiyi
   kullaniyor ve o bir istemci bileseni. */
export { MAX_MESSAGE };

/**
 * Rezervasyon ONCESI yeni konusma acma siniri: saatte 10.
 * Rezervasyon oncesi soru sorma, donusumu artiran ana akis; ama ayni
 * zamanda "yirmi bakiciya ayni mesaji at" akisi. Sinir yeni KONUSMA
 * acmaya, mesaj yazmaya degil: suren bir konusmada hizli yazismak normal.
 */
export const NEW_THREAD_LIMIT = 10;

interface Party {
  suspended: boolean;
  isSitter: boolean;
  sitterActive: boolean;
}

async function party(db: Database, userId: string): Promise<Party | null> {
  const rows = await db.execute(sql`
    SELECT (u.suspended_at IS NOT NULL) AS suspended,
           (s.user_id IS NOT NULL) AS is_sitter,
           COALESCE(s.status::text = 'active', false) AS sitter_active
    FROM users u
    LEFT JOIN sitters s ON s.user_id = u.id
    WHERE u.id = ${userId} AND u.deleted_at IS NULL
    LIMIT 1
  `);
  const r = (rows as unknown as Array<Record<string, unknown>>)[0];
  if (!r) return null;
  return {
    suspended: Boolean(r.suspended),
    isSitter: Boolean(r.is_sitter),
    sitterActive: Boolean(r.sitter_active),
  };
}

/**
 * Konusmayi bulur, yoksa acar.
 *
 * ON CONFLICT: iki es zamanli istek ayni cifti iki kez acamasin diye
 * (tekil indeks migration 0007). `DO UPDATE ... RETURNING` yazildi cunku
 * `DO NOTHING` catismada satir DONDURMEZ ve ikinci istek bos elle kalirdi.
 */
export async function openConversation(
  db: Database,
  input: { ownerId: string; sitterId: string; bookingId?: string | undefined },
): Promise<MessagingResult<string>> {
  if (input.ownerId === input.sitterId) return { ok: false, error: 'self' };

  return withDbErrors(async () => {
    const owner = await party(db, input.ownerId);
    const sitter = await party(db, input.sitterId);
    if (!owner || !sitter) return { ok: false as const, error: 'not_found' as const };
    if (owner.suspended) return { ok: false as const, error: 'suspended' as const };
    if (!sitter.isSitter || !sitter.sitterActive) {
      return { ok: false as const, error: 'sitter_unavailable' as const };
    }

    // Var mi?
    const found = await db.execute(sql`
      SELECT id::text FROM conversations
      WHERE owner_id = ${input.ownerId} AND sitter_id = ${input.sitterId}
      LIMIT 1
    `);
    const existing = (found as unknown as Array<{ id: string }>)[0];
    if (existing) return { ok: true as const, value: String(existing.id) };

    // Yeni konusma: hiz siniri yalnizca burada
    const recent = await db.execute(sql`
      SELECT count(*)::int AS n FROM conversations
      WHERE owner_id = ${input.ownerId} AND created_at > now() - interval '1 hour'
    `);
    if (Number((recent as unknown as Array<{ n: number }>)[0]?.n ?? 0) >= NEW_THREAD_LIMIT) {
      return { ok: false as const, error: 'rate_limited' as const };
    }

    const created = await db.execute(sql`
      INSERT INTO conversations (owner_id, sitter_id, booking_id)
      VALUES (${input.ownerId}, ${input.sitterId}, ${input.bookingId ?? null})
      ON CONFLICT (owner_id, sitter_id)
      DO UPDATE SET booking_id = COALESCE(conversations.booking_id, EXCLUDED.booking_id)
      RETURNING id::text
    `);
    const row = (created as unknown as Array<{ id: string }>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    return { ok: true as const, value: String(row.id) };
  });
}

export interface SentMessage {
  id: string;
  /** Kac iletisim bilgisi maskelendi — arayuz gondereni uyarir */
  redactedCount: number;
}

export async function sendMessage(
  db: Database,
  input: { conversationId: string; senderId: string; body: string },
): Promise<MessagingResult<SentMessage>> {
  const body = input.body.trim();
  if (body.length === 0) return { ok: false, error: 'empty' };
  if (body.length > MAX_MESSAGE) return { ok: false, error: 'too_long' };

  return withDbErrors(async () => {
    // Kimlik kontrolu WHERE icinde: bu kisi bu konusmanin tarafi mi
    const rows = await db.execute(sql`
      SELECT id::text FROM conversations
      WHERE id = ${input.conversationId}
        AND (owner_id = ${input.senderId} OR sitter_id = ${input.senderId})
      LIMIT 1
    `);
    if ((rows as unknown as unknown[]).length === 0) {
      return { ok: false as const, error: 'not_allowed' as const };
    }

    const sender = await party(db, input.senderId);
    if (!sender) return { ok: false as const, error: 'not_found' as const };
    // Askidaki kullanici okuyabilir ama YAZAMAZ: suren bir konaklamanin
    // gecmisine erisimi kesmek, karsi tarafi da cezalandirirdi.
    if (sender.suspended) return { ok: false as const, error: 'suspended' as const };

    const redacted = redactContact(body);

    const inserted = await db.execute(sql`
      INSERT INTO messages (conversation_id, sender_id, body, body_redacted)
      VALUES (${input.conversationId}, ${input.senderId}, ${body}, ${redacted.text})
      RETURNING id::text
    `);
    await db.execute(sql`
      UPDATE conversations SET last_message_at = now() WHERE id = ${input.conversationId}
    `);

    const row = (inserted as unknown as Array<{ id: string }>)[0]!;
    return { ok: true as const, value: { id: String(row.id), redactedCount: redacted.count } };
  });
}

export interface ConversationSummary {
  id: string;
  counterpartId: string;
  counterpartFirstName: string;
  counterpartInitial: string;
  counterpartAvatarUrl: string | null;
  /** Bakici tarafinin profil adresi — sahip listesinde ise yarar */
  sitterSlug: string | null;
  citySlugEn: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastFromMe: boolean;
  unread: number;
  bookingId: string | null;
}

export async function listConversations(
  db: Database, viewerId: string,
): Promise<ConversationSummary[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT c.id::text, c.booking_id::text, c.last_message_at,
             CASE WHEN c.owner_id = ${viewerId} THEN c.sitter_id ELSE c.owner_id END::text
               AS counterpart_id,
             COALESCE(p.first_name, '—')  AS first_name,
             COALESCE(p.last_name_initial, '') AS last_initial,
             p.avatar_url,
             st.slug AS sitter_slug,
             city.slug_en AS city_slug_en,
             last.body_redacted AS last_body,
             (last.sender_id = ${viewerId}) AS last_from_me,
             (
               SELECT count(*)::int FROM messages m
               WHERE m.conversation_id = c.id
                 AND m.sender_id <> ${viewerId}
                 AND m.read_at IS NULL
             ) AS unread
      FROM conversations c
      LEFT JOIN profiles p ON p.user_id =
        CASE WHEN c.owner_id = ${viewerId} THEN c.sitter_id ELSE c.owner_id END
      LEFT JOIN sitters st ON st.user_id = c.sitter_id
      LEFT JOIN cities city ON city.id = p.city_id
      LEFT JOIN LATERAL (
        SELECT body_redacted, sender_id FROM messages
        WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
      ) last ON true
      WHERE c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId}
      -- Bos konusma (acilmis ama mesaj yazilmamis) listede en altta kalir
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT 100
    `);

    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      counterpartId: String(r.counterpart_id),
      counterpartFirstName: String(r.first_name),
      counterpartInitial: String(r.last_initial),
      counterpartAvatarUrl: (r.avatar_url as string | null) ?? null,
      sitterSlug: (r.sitter_slug as string | null) ?? null,
      citySlugEn: (r.city_slug_en as string | null) ?? null,
      lastMessage: (r.last_body as string | null) ?? null,
      lastMessageAt: r.last_message_at ? new Date(r.last_message_at as Date).toISOString() : null,
      lastFromMe: Boolean(r.last_from_me),
      unread: Number(r.unread ?? 0),
      bookingId: (r.booking_id as string | null) ?? null,
    }));
  });
}

export interface ThreadMessage {
  id: string;
  body: string;
  mine: boolean;
  redacted: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface Thread {
  id: string;
  viewerRole: 'owner' | 'sitter';
  counterpartId: string;
  counterpartFirstName: string;
  counterpartInitial: string;
  counterpartAvatarUrl: string | null;
  sitterSlug: string | null;
  citySlugEn: string | null;
  bookingId: string | null;
  counterpartSuspended: boolean;
  messages: ThreadMessage[];
}

export async function getThread(
  db: Database, conversationId: string, viewerId: string,
): Promise<Thread | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT c.id::text, c.booking_id::text, c.owner_id::text, c.sitter_id::text,
             CASE WHEN c.owner_id = ${viewerId} THEN 'owner' ELSE 'sitter' END AS viewer_role,
             CASE WHEN c.owner_id = ${viewerId} THEN c.sitter_id ELSE c.owner_id END::text
               AS counterpart_id,
             COALESCE(p.first_name, '—') AS first_name,
             COALESCE(p.last_name_initial, '') AS last_initial,
             p.avatar_url, st.slug AS sitter_slug, city.slug_en AS city_slug_en,
             (cu.suspended_at IS NOT NULL) AS counterpart_suspended
      FROM conversations c
      LEFT JOIN profiles p ON p.user_id =
        CASE WHEN c.owner_id = ${viewerId} THEN c.sitter_id ELSE c.owner_id END
      LEFT JOIN users cu ON cu.id =
        CASE WHEN c.owner_id = ${viewerId} THEN c.sitter_id ELSE c.owner_id END
      LEFT JOIN sitters st ON st.user_id = c.sitter_id
      LEFT JOIN cities city ON city.id = p.city_id
      WHERE c.id = ${conversationId}
        AND (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
      LIMIT 1
    `);
    const c = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!c) return null;

    const msgs = await db.execute(sql`
      SELECT id::text, body_redacted, sender_id::text, created_at, read_at,
             (body_redacted <> body) AS was_redacted
      FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT 500
    `);

    return {
      id: String(c.id),
      viewerRole: c.viewer_role === 'owner' ? 'owner' : 'sitter',
      counterpartId: String(c.counterpart_id),
      counterpartFirstName: String(c.first_name),
      counterpartInitial: String(c.last_initial),
      counterpartAvatarUrl: (c.avatar_url as string | null) ?? null,
      sitterSlug: (c.sitter_slug as string | null) ?? null,
      citySlugEn: (c.city_slug_en as string | null) ?? null,
      bookingId: (c.booking_id as string | null) ?? null,
      counterpartSuspended: Boolean(c.counterpart_suspended),
      messages: (msgs as unknown as Array<Record<string, unknown>>).map((m) => ({
        id: String(m.id),
        body: String(m.body_redacted),
        mine: String(m.sender_id) === viewerId,
        redacted: Boolean(m.was_redacted),
        createdAt: new Date(m.created_at as Date).toISOString(),
        readAt: m.read_at ? new Date(m.read_at as Date).toISOString() : null,
      })),
    };
  });
}

/** Karsi tarafin mesajlarini okundu isaretler. Kendi mesajina dokunmaz. */
export async function markRead(
  db: Database, conversationId: string, viewerId: string,
): Promise<void> {
  await withDbErrors(async () => {
    await db.execute(sql`
      UPDATE messages SET read_at = now()
      WHERE conversation_id = ${conversationId}
        AND sender_id <> ${viewerId}
        AND read_at IS NULL
        AND EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.id = ${conversationId}
            AND (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
        )
    `);
  });
}

/** Basliktaki rozet icin: okunmamis mesaji olan konusma sayisi. */
export async function unreadCount(db: Database, viewerId: string): Promise<number> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT count(DISTINCT m.conversation_id)::int AS n
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
        AND m.sender_id <> ${viewerId}
        AND m.read_at IS NULL
    `);
    return Number((rows as unknown as Array<{ n: number }>)[0]?.n ?? 0);
  });
}

/* ------------------------------------------------- yonetici tarafi */

export interface RawMessage {
  id: string;
  body: string;
  redacted: string;
  senderName: string | null;
  senderId: string;
  conversationId: string;
  createdAt: string;
}

/**
 * HAM MESAJ — yalnizca sikayet incelemesi icin.
 *
 * Panelde mesaj listesi YOK ve olmayacak. Bu sorgu tek bir mesaji, tek
 * bir sikayet dosyasi uzerinden aciyor; cagiran taraf audit kaydini
 * yazmak zorunda (apps/web/src/lib/admin.ts icindeki auditView).
 * "Gerektigi kadar erisim" bir ekran tasarimi degil, bir erisim kaydi
 * meselesidir.
 */
export async function getRawMessage(db: Database, messageId: string): Promise<RawMessage | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT m.id::text, m.body, m.body_redacted, m.created_at,
             m.sender_id::text, m.conversation_id::text,
             COALESCE(p.first_name, u.email) AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      LEFT JOIN profiles p ON p.user_id = m.sender_id
      WHERE m.id = ${messageId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;
    return {
      id: String(r.id),
      body: String(r.body),
      redacted: String(r.body_redacted),
      senderName: (r.sender_name as string | null) ?? null,
      senderId: String(r.sender_id),
      conversationId: String(r.conversation_id),
      createdAt: new Date(r.created_at as Date).toISOString(),
    };
  });
}

/**
 * SIKAYET EDILEBILIR MI.
 *
 * Kullanici tarafindaki "bildir" dugmesi icin: mesaj var mi, sikayet
 * eden kisi o konusmanin tarafi mi, ve gonderen kim. Kimlik yine WHERE
 * icinde — baskasinin yazismasindan mesaj sikayet edilemiyor.
 *
 * Kendi mesajini bildirmek reddediliyor: bir kullanicinin kendi yazdigini
 * sikayet etmesi ya yanlislik ya da denetim kuyrugunu doldurma denemesi.
 */
export async function reportableMessage(
  db: Database, messageId: string, viewerId: string,
): Promise<MessagingResult<{ senderId: string; conversationId: string }>> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT m.sender_id::text, m.conversation_id::text
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = ${messageId}
        AND (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return { ok: false as const, error: 'not_found' as const };
    if (String(r.sender_id) === viewerId) return { ok: false as const, error: 'self' as const };
    return {
      ok: true as const,
      value: { senderId: String(r.sender_id), conversationId: String(r.conversation_id) },
    };
  });
}

/**
 * YENI MESAJ VAR MI — yoklama icin en ucuz cevap.
 *
 * Acik duran yazisma birkac saniyede bir soruyor. Bu yuzden sorgu
 * MESAJLARI DONDURMUYOR, yalnizca son mesajin zamanini ve okunmamis
 * sayisini donduruyor: arayuz degisiklik gorurse sayfayi tazeliyor,
 * gormezse hicbir sey olmuyor. Her yoklamada tum yazismayi indirmek,
 * uc kisiden sonra sunucuyu mesgul ederdi.
 *
 * Kimlik yine WHERE icinde: baskasinin konusmasi icin `lastAt` null
 * doner, yani "yok" gorunur.
 */
export async function conversationPing(
  db: Database, viewerId: string, conversationId?: string | undefined,
): Promise<{ lastAt: string | null; unread: number }> {
  return withDbErrors(async () => {
    const unreadRows = await db.execute(sql`
      SELECT count(*)::int AS n
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.read_at IS NULL AND m.sender_id <> ${viewerId}
        AND (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
    `);
    const unread = Number((unreadRows as unknown as Array<{ n: number }>)[0]?.n ?? 0);

    if (!conversationId) return { lastAt: null, unread };

    const rows = await db.execute(sql`
      SELECT max(m.created_at) AS last_at
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.id = ${conversationId}
        AND (c.owner_id = ${viewerId} OR c.sitter_id = ${viewerId})
    `);
    const r = (rows as unknown as Array<{ last_at: Date | null }>)[0];
    return {
      lastAt: r?.last_at ? new Date(r.last_at).toISOString() : null,
      unread,
    };
  });
}
