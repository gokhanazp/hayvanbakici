import { pgTable, uuid, text, timestamp, jsonb, index, integer } from 'drizzle-orm/pg-core';
import { users, sitters } from './identity.js';
import { bookings } from './bookings.js';
import { localeEnum } from './enums.js';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    ownerId: uuid('owner_id').notNull().references(() => users.id),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('conversations_participants_idx').on(t.ownerId, t.sitterId)],
);

/**
 * MESAJLAR.
 * bodyRedacted: telefon/e-posta/e-Transfer maskelenmis hali — gosterilen budur.
 * body: ham hali, yalnizca ihtilaf/moderasyon icin erisilir.
 *
 * Amac ceza degil HIZALAMA (§2.2): bakicinin kendi getirdigi musteride komisyon
 * zaten %0 oldugu icin platform disina cikmanin ekonomik gerekcesi yoktur.
 * Maskeleme yalnizca musteriyi dolandiriciliktan korumak icindir.
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id').notNull().references(() => users.id),
    body: text('body').notNull(),
    bodyRedacted: text('body_redacted').notNull(),
    attachments: jsonb('attachments').$type<Array<{ url: string; type: string }>>(),
    flaggedReason: text('flagged_reason'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_conversation_idx').on(t.conversationId, t.createdAt)],
);

/**
 * YORUMLAR.
 * Competition Act (§8.6): yalnizca DOGRULANMIS rezervasyon sonrasi; tesvikli yorum
 * toplanmaz; yorumlar duzenlenmez/kirpilmaz; baska sitelerden yorum toplanmaz.
 * SEO: SSR ile HTML'de render edilmeli (client-side yorumlar taranmaz, §7.10).
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => users.id),
    subjectId: uuid('subject_id').notNull().references(() => users.id),
    /** owner_to_sitter | sitter_to_owner */
    direction: text('direction').notNull(),
    rating: integer('rating').notNull(),
    body: text('body'),
    locale: localeEnum('locale').notNull().default('en-CA'),
    responseBody: text('response_body'),
    responseAt: timestamp('response_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reviews_subject_idx').on(t.subjectId, t.publishedAt),
    index('reviews_booking_idx').on(t.bookingId),
  ],
);
