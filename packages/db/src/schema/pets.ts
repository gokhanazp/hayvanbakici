import { pgTable, uuid, text, timestamp, boolean, real, date, index } from 'drizzle-orm/pg-core';
import { users } from './identity.js';
import { speciesEnum } from './enums.js';

export const pets = pgTable(
  'pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    species: speciesEnum('species').notNull(),
    breed: text('breed'),
    birthDate: date('birth_date'),
    weightKg: real('weight_kg'),
    isNeutered: boolean('is_neutered'),
    microchip: text('microchip'),
    photoUrl: text('photo_url'),
    temperamentNotes: text('temperament_notes'),
    medicationNotes: text('medication_notes'),
    vetName: text('vet_name'),
    vetPhone: text('vet_phone'),
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('pets_owner_idx').on(t.ownerId)],
);

/**
 * ASI KAYITLARI — Rover'in en cok sikayet edilen eksigi (§1.4 boşluk #5).
 * Rezervasyon oncesi zorunlu; veteriner dogrulamasi opsiyonel ust katman.
 */
export const petVaccinations = pgTable(
  'pet_vaccinations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
    vaccineType: text('vaccine_type').notNull(),
    administeredOn: date('administered_on').notNull(),
    expiresOn: date('expires_on'),
    documentUrl: text('document_url'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('vaccinations_pet_idx').on(t.petId), index('vaccinations_expiry_idx').on(t.expiresOn)],
);
