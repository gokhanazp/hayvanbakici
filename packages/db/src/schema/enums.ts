import { pgEnum } from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', ['en-CA', 'fr-CA']);

export const userRoleEnum = pgEnum('user_role', ['owner', 'sitter', 'both', 'admin']);

export const provinceEnum = pgEnum('province', [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'boarding', 'house_sitting', 'drop_in', 'dog_walking', 'day_care', 'training', 'grooming',
]);

export const priceUnitEnum = pgEnum('price_unit', ['night', 'visit', 'walk', 'day', 'session']);

export const sitterStatusEnum = pgEnum('sitter_status', [
  'draft', 'pending', 'active', 'paused', 'deactivated',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'draft', 'requested', 'counter_offered', 'declined', 'expired', 'confirmed',
  'paid', 'in_progress', 'completed', 'payout_released', 'cancelled',
  'disputed', 'refunded', 'resolved',
]);

/** Komisyon oranini belirleyen tek alan (yol haritasi §2.2) */
export const attributionEnum = pgEnum('attribution', [
  'platform', 'sitter_referral', 'repeat',
]);

export const cancellationPolicyEnum = pgEnum('cancellation_policy', [
  'flexible', 'moderate', 'strict',
]);

export const speciesEnum = pgEnum('species', ['dog', 'cat', 'other']);

export const verificationTypeEnum = pgEnum('verification_type', [
  'identity', 'criminal', 'licence', 'insurance', 'certification',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'not_started', 'pending', 'passed', 'failed', 'expired', 'manual_review',
]);

export const homeTypeEnum = pgEnum('home_type', ['house', 'townhouse', 'apartment', 'condo', 'farm']);

export const claimTypeEnum = pgEnum('claim_type', [
  'vet', 'property', 'sitter_property', 'injury',
]);

export const claimStatusEnum = pgEnum('claim_status', [
  'submitted', 'under_review', 'approved', 'partially_approved', 'denied', 'paid',
]);

/** Law 25 + CASL + Bill 96 icin ayri ayri kayit tutulur */
export const consentTypeEnum = pgEnum('consent_type', [
  'cookies_analytics', 'cookies_marketing', 'email_marketing', 'sms_marketing',
  'criminal_check', 'biometric', 'tos_language', 'data_transfer_outside_quebec',
]);

export const bookingEventTypeEnum = pgEnum('booking_event_type', [
  'check_in', 'check_out', 'photo', 'video', 'gps_ping', 'note', 'incident',
  /*
    Durum degisikligi — kim, ne zaman, hangi durumdan hangisine.
    `bookings` tablosunda yalnizca SON durum var; anlasmazlikta ve
    chargeback savunmasinda gereken sey ise SIRA: talep ne zaman geldi,
    bakici ne zaman onayladi, iptal kimden geldi.
  */
  'status_change',
]);

/** Sikayet kuyrugu (yonetici paneli) */
export const reportSubjectEnum = pgEnum('report_subject', [
  'user', 'review', 'message', 'booking',
]);

/**
 * Sikayet durumu. 'dismissed' de bir SONUCTUR: gerekcesi yazilir ve
 * kayitta kalir — sessizce kapatilan sikayet, kapatilmamis sayilir.
 */
export const reportStatusEnum = pgEnum('report_status', [
  'open', 'reviewing', 'actioned', 'dismissed',
]);
