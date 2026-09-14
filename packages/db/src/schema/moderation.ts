import {
  pgTable, uuid, text, timestamp, index,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { reportStatusEnum, reportSubjectEnum } from './enums.js';

/**
 * SIKAYET KUYRUGU.
 *
 * Bir kullanicinin baska bir kullaniciyi, yorumu, mesaji veya rezervasyonu
 * bize bildirmesi. Bugun arayuzu yalnizca YONETICI tarafinda: sikayeti
 * elle acan destek ekibi kullanacak. Kullanici tarafindaki "bildir"
 * dugmesi mesajlasma ile birlikte gelecek.
 *
 * MESAJ ICERIGI BURADA DEGIL. Sikayet bir mesaji isaret ediyorsa yalnizca
 * kimligini tutuyoruz; govdesi ancak sikayet acildiginda ve o acilis
 * audit_log'a yazilarak okunur. Sebebi basit: "gerektigi kadar erisim"
 * (Law 25, PIPEDA) bir ekran tasarimi degil, bir erisim kaydi meselesidir.
 */
export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Sikayeti eden. Destek ekibi actiysa yonetici kimligi yazilir. */
    reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'set null' }),
    subjectType: reportSubjectEnum('subject_type').notNull(),
    /** Sikayet edilen kaydin kimligi — tablolar arasi oldugu icin FK yok */
    subjectId: uuid('subject_id').notNull(),
    /** Sikayet edilen kisi (biliniyorsa) — kullanici gecmisinde gorunsun diye */
    subjectUserId: uuid('subject_user_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason').notNull(),
    details: text('details'),
    status: reportStatusEnum('status').notNull().default('open'),
    /** Kapatilirken ne yapildi — "dismissed" bile olsa yazilir */
    resolution: text('resolution'),
    handledBy: uuid('handled_by').references(() => users.id, { onDelete: 'set null' }),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reports_status_idx').on(t.status, t.createdAt),
    index('reports_subject_idx').on(t.subjectType, t.subjectId),
    index('reports_subject_user_idx').on(t.subjectUserId),
  ],
);

/**
 * IC NOTLAR.
 *
 * Yonetici ekibinin kendi arasinda tuttugu not: "telefonla aradi, tarih
 * degisikligi istedi". Kullanici bu notlari GORMEZ.
 *
 * Notlar SILINEMEZ ve DUZENLENEMEZ (guncelleme sorgusu yazilmadi).
 * Gerekce: bir karari sonradan hakli cikaracak sekilde degistirilebilen
 * not, kanit degeri olmayan nottur. Yanlis yazilan not yeni bir notla
 * duzeltilir.
 */
export const adminNotes = pgTable(
  'admin_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    authorId: uuid('author_id').notNull().references(() => users.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('admin_notes_entity_idx').on(t.entityType, t.entityId, t.createdAt)],
);
