import { and, eq, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  users, profiles, sitters, sitterServices, verifications, neighbourhoods, cities,
  consentRecords, automatedDecisions,
} from '../schema/index.js';
import { withDbErrors, type Database } from '../client.js';
import { approximatePoint, encryptField } from '../crypto.js';

/**
 * BAKICI ONBOARDING — veri katmani.
 *
 * TASARIM KARARI: her adim KENDI BASINA kaydediliyor ve bakici istedigi an
 * birakip donebiliyor. Rover'in onboarding'i tek uzun form; sektorde bilinen
 * en buyuk terk noktasi orasi. Yarim kalan bir kayit bizim icin de degerli:
 * kimin nerede takildigini gorebiliyoruz.
 *
 * SIN BURADA TOPLANMIYOR — bilincli. CRA Part XX bunu ODEME yapilan
 * bakicilar icin istiyor; hicbir kazanc yokken toplamak gereksiz risk.
 * Stripe Connect adiminda alinacak (bkz. sitters.sinEncrypted).
 */

export interface OnboardingState {
  userId: string;
  email: string;
  firstName: string | null;
  lastNameInitial: string | null;
  bio: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  cityId: string | null;
  neighbourhoodId: string | null;
  province: string | null;
  postalCode: string | null;
  hasExactAddress: boolean;
  status: string | null;
  badgeLevel: number;
  homeType: string | null;
  hasYard: boolean;
  yardFenced: boolean;
  hasOwnPets: boolean;
  smokeFree: boolean;
  maxConcurrentPets: number;
  services: Array<{
    serviceType: string;
    priceCents: number;
    priceUnit: string;
    cancellationPolicy: string;
    acceptsDogs: boolean;
    acceptsCats: boolean;
    acceptsOther: boolean;
  }>;
  screening: { status: string; providerRef: string | null } | null;
  /**
   * Lansman promosyonu bitis tarihi — null ise promosyon YOK.
   *
   * Fiyat adiminda "size ne kalir" satiri bu alani okuyor: promosyon
   * acikken komisyon sifir, kapaliyken normal oranlar. Ekranin
   * soyledigi ile rezervasyonda hesaplanan ayni olmali
   * (bkz. queries/booking.ts -> promoActive).
   */
  promoEndsAt: string | null;
}

export async function getOnboardingState(
  db: Database, userId: string,
): Promise<OnboardingState | null> {
  return withDbErrors(async () => {
    const [row] = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: profiles.firstName,
        lastNameInitial: profiles.lastNameInitial,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        phone: users.phone,
        cityId: profiles.cityId,
        neighbourhoodId: profiles.neighbourhoodId,
        province: profiles.province,
        postalCode: profiles.postalCode,
        exactAddressEnc: profiles.exactAddressEnc,
        status: sitters.status,
        badgeLevel: sitters.badgeLevel,
        dateOfBirth: sitters.dateOfBirth,
        homeType: sitters.homeType,
        hasYard: sitters.hasYard,
        yardFenced: sitters.yardFenced,
        hasOwnPets: sitters.hasOwnPets,
        smokeFree: sitters.smokeFree,
        maxConcurrentPets: sitters.maxConcurrentPets,
        promoEndsAt: sitters.promoEndsAt,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(sitters, eq(sitters.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) return null;

    const svc = await db
      .select({
        serviceType: sitterServices.serviceType,
        priceCents: sitterServices.priceCents,
        priceUnit: sitterServices.priceUnit,
        cancellationPolicy: sitterServices.cancellationPolicy,
        acceptsDogs: sitterServices.acceptsDogs,
        acceptsCats: sitterServices.acceptsCats,
        acceptsOther: sitterServices.acceptsOther,
      })
      .from(sitterServices)
      .where(eq(sitterServices.sitterId, userId));

    const [check] = await db
      .select({ status: verifications.status, providerRef: verifications.providerRef })
      .from(verifications)
      .where(and(eq(verifications.sitterId, userId), eq(verifications.type, 'criminal')))
      .limit(1);

    return {
      userId: row.userId,
      email: row.email,
      firstName: row.firstName,
      lastNameInitial: row.lastNameInitial,
      bio: row.bio,
      phone: row.phone,
      dateOfBirth: row.dateOfBirth,
      avatarUrl: row.avatarUrl ?? null,
      cityId: row.cityId,
      neighbourhoodId: row.neighbourhoodId,
      province: row.province,
      postalCode: row.postalCode,
      hasExactAddress: Boolean(row.exactAddressEnc),
      status: row.status,
      badgeLevel: row.badgeLevel ?? 0,
      homeType: row.homeType,
      hasYard: row.hasYard ?? false,
      yardFenced: row.yardFenced ?? false,
      hasOwnPets: row.hasOwnPets ?? false,
      smokeFree: row.smokeFree ?? true,
      maxConcurrentPets: row.maxConcurrentPets ?? 1,
      services: svc,
      screening: check ?? null,
      promoEndsAt: row.promoEndsAt ? row.promoEndsAt.toISOString() : null,
    };
  });
}

/**
 * Profil adresi: camille-b-7f3a
 *
 * Dort hane sart: ayni mahallede iki "Camille B." olabilir ve adres
 * cakisirdi. Kimlikten turetildigi icin deterministik — ayni bakici her
 * zaman ayni adresi aliyor.
 */
export function sitterSlug(userId: string, firstName: string, lastInitial: string): string {
  const clean = (v: string) =>
    v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = userId.replace(/-/g, '').slice(0, 4);
  const name = clean(firstName) || 'sitter';
  const initial = clean(lastInitial).slice(0, 1);
  return [name, initial, suffix].filter(Boolean).join('-');
}

/** Bakici satirini olusturur (yoksa). Davet kodu burada, bir kez uretiliyor. */
export async function ensureSitter(db: Database, userId: string): Promise<void> {
  await withDbErrors(() =>
    db
      .insert(sitters)
      .values({
        userId,
        status: 'draft',
        // Kalici davet kodu: bakicinin kendi getirdigi musterilerde komisyon %0.
        // Bir kez uretilir ve ASLA degismez — bakici bunu her yere yaziyor olacak.
        referralCode: `HV${randomBytes(4).toString('hex').toUpperCase()}`,
      })
      .onConflictDoNothing(),
  );
}

export async function saveAbout(
  db: Database,
  userId: string,
  input: { firstName: string; lastNameInitial: string; bio: string; phone: string; dateOfBirth: string },
): Promise<void> {
  await ensureSitter(db, userId);
  await withDbErrors(async () => {
    await db
      .update(profiles)
      .set({
        firstName: input.firstName,
        lastNameInitial: input.lastNameInitial.slice(0, 1).toUpperCase(),
        bio: input.bio,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    await db.update(users).set({ phone: input.phone, updatedAt: new Date() }).where(eq(users.id, userId));

    // Slug BIR KEZ yaziliyor. Bakici adini sonradan duzeltse bile adres
    // sabit kaliyor; degistirmek eski baglantilari ve arama gecmisini kirar.
    const [current] = await db
      .select({ slug: sitters.slug }).from(sitters).where(eq(sitters.userId, userId)).limit(1);

    await db.update(sitters).set({
      dateOfBirth: input.dateOfBirth,
      ...(current?.slug
        ? {}
        : { slug: sitterSlug(userId, input.firstName, input.lastNameInitial) }),
    }).where(eq(sitters.userId, userId));
  });
}

export interface LocationInput {
  cityId: string;
  neighbourhoodId: string;
  postalCode: string;
  /** Tam adres — SIFRELENEREK saklanir, haritada gosterilmez */
  exactAddress: string;
}

export async function saveLocation(
  db: Database, userId: string, input: LocationInput,
): Promise<void> {
  await ensureSitter(db, userId);
  await withDbErrors(async () => {
    const [hood] = await db
      .select({
        id: neighbourhoods.id,
        province: cities.province,
        lon: sql<number>`ST_X(${neighbourhoods.centroid}::geometry)`,
        lat: sql<number>`ST_Y(${neighbourhoods.centroid}::geometry)`,
      })
      .from(neighbourhoods)
      .innerJoin(cities, eq(cities.id, neighbourhoods.cityId))
      .where(and(eq(neighbourhoods.id, input.neighbourhoodId), eq(neighbourhoods.cityId, input.cityId)))
      .limit(1);

    if (!hood) throw new Error('Mahalle bulunamadi ya da bu sehre ait degil.');

    /**
     * Haritadaki nokta mahalle merkezinden turetiliyor, TAM ADRESTEN DEGIL.
     * Cografi kodlama servisi yok; ayrica gizlilik acisindan dogru olan da
     * bu: tam adres hicbir zaman bir koordinata cevrilip saklanmiyor.
     */
    const point = approximatePoint(userId, hood.lon, hood.lat);

    await db
      .update(profiles)
      .set({
        cityId: input.cityId,
        neighbourhoodId: input.neighbourhoodId,
        province: hood.province,
        postalCode: input.postalCode.toUpperCase().replace(/\s+/g, ' ').trim(),
        exactAddressEnc: encryptField(input.exactAddress),
        approxLocation: sql`ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));
  });
}

export interface HomeInput {
  homeType: 'house' | 'townhouse' | 'apartment' | 'condo' | 'farm';
  hasYard: boolean;
  yardFenced: boolean;
  hasOwnPets: boolean;
  smokeFree: boolean;
  maxConcurrentPets: number;
}

export async function saveHome(db: Database, userId: string, input: HomeInput): Promise<void> {
  await ensureSitter(db, userId);
  await withDbErrors(() =>
    db
      .update(sitters)
      .set({
        homeType: input.homeType,
        hasYard: input.hasYard,
        // Bahce yoksa "cevrili bahce" iddiasi da olamaz — veri tutarliligi
        yardFenced: input.hasYard ? input.yardFenced : false,
        hasOwnPets: input.hasOwnPets,
        smokeFree: input.smokeFree,
        maxConcurrentPets: Math.max(1, Math.min(10, input.maxConcurrentPets)),
      })
      .where(eq(sitters.userId, userId)),
  );
}

export interface ServiceInput {
  serviceType: 'boarding' | 'house_sitting' | 'drop_in' | 'dog_walking' | 'day_care' | 'training' | 'grooming';
  priceCents: number;
  priceUnit: 'night' | 'visit' | 'walk' | 'day' | 'session';
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  acceptsDogs: boolean;
  acceptsCats: boolean;
  acceptsOther: boolean;
}

export async function saveServices(
  db: Database, userId: string, input: ServiceInput[],
): Promise<void> {
  await ensureSitter(db, userId);
  await withDbErrors(async () => {
    // Secimden cikarilanlar silinir; kismi guncelleme yerine tam degistirme
    // cunku "hangi hizmetleri veriyorum" tek bir butun secim.
    await db.delete(sitterServices).where(eq(sitterServices.sitterId, userId));
    if (input.length === 0) return;

    await db.insert(sitterServices).values(
      input.map((s) => ({
        sitterId: userId,
        serviceType: s.serviceType,
        /**
         * FIYATI BAKICI BELIRLIYOR (yol haritasi §8.4).
         * Platform yalnizca aralik ONERIYOR. Fiyati biz dayatirsak
         * bagimsiz yuklenici siniflandirmasi cokebilir.
         */
        priceCents: s.priceCents,
        priceUnit: s.priceUnit,
        cancellationPolicy: s.cancellationPolicy,
        acceptsDogs: s.acceptsDogs,
        acceptsCats: s.acceptsCats,
        acceptsOther: s.acceptsOther,
        isActive: true,
      })),
    );
  });
}

/**
 * Adli sicil rizasi + kontrolun baslatilmasi.
 *
 * RIZA ONCE KAYDEDILIR, kontrol SONRA baslatilir. Sira onemli: kontrol
 * baslayip riza kaydi yazilamazsa, elimizde rizasiz yapilmis bir sabika
 * sorgusu kalirdi.
 */
export async function recordScreeningConsent(
  db: Database,
  input: { userId: string; localeShown: 'en-CA' | 'fr-CA'; version: string; ip: string | null; userAgent: string | null },
): Promise<void> {
  await withDbErrors(() =>
    db.insert(consentRecords).values({
      userId: input.userId,
      type: 'criminal_check',
      granted: true,
      localeShown: input.localeShown,
      version: input.version,
      ip: input.ip,
      userAgent: input.userAgent,
    }),
  );
}

export async function upsertVerification(
  db: Database,
  input: {
    sitterId: string;
    type: 'identity' | 'criminal' | 'licence' | 'insurance' | 'certification';
    status: 'not_started' | 'pending' | 'passed' | 'failed' | 'expired' | 'manual_review';
    provider: string;
    providerRef: string | null;
    automatedDecision: boolean;
    decision?: string | undefined;
  },
): Promise<void> {
  await withDbErrors(async () => {
    const [existing] = await db
      .select({ id: verifications.id })
      .from(verifications)
      .where(and(eq(verifications.sitterId, input.sitterId), eq(verifications.type, input.type)))
      .limit(1);

    const values = {
      sitterId: input.sitterId,
      type: input.type,
      status: input.status,
      provider: input.provider,
      providerRef: input.providerRef,
      automatedDecision: input.automatedDecision,
      /** Yalnizca KARAR saklanir — ham adli sicil raporu ASLA */
      decision: input.decision ?? null,
      decidedAt: input.status === 'pending' || input.status === 'not_started' ? null : new Date(),
    };

    if (existing) {
      await db.update(verifications).set(values).where(eq(verifications.id, existing.id));
    } else {
      await db.insert(verifications).values(values);
    }
  });
}

/**
 * Law 25 s.12.1 kaydi.
 * Karar munhasiran otomatik islemeye dayaniyorsa: bildirim, aciklama ve
 * insana gorus sunma kanali zorunlu. Kaydi tutmazsak bunlari yapamayiz.
 */
export async function recordAutomatedDecision(
  db: Database,
  input: {
    userId: string;
    decisionType: string;
    outcome: string;
    factors: Record<string, unknown>;
  },
): Promise<void> {
  await withDbErrors(() =>
    db.insert(automatedDecisions).values({
      userId: input.userId,
      decisionType: input.decisionType,
      outcome: input.outcome,
      factors: input.factors,
      notifiedAt: new Date(),
    }),
  );
}

export async function setBadgeLevel(db: Database, userId: string, level: number): Promise<void> {
  await withDbErrors(() =>
    db.update(sitters).set({ badgeLevel: level }).where(eq(sitters.userId, userId)),
  );
}

/** Onboarding'in bittigi nokta: inceleme kuyruguna gir. */
export async function submitForReview(
  db: Database, userId: string, completeness: number,
): Promise<void> {
  await withDbErrors(() =>
    db
      .update(sitters)
      .set({ status: 'pending', profileCompleteness: completeness })
      .where(and(eq(sitters.userId, userId), eq(sitters.status, 'draft'))),
  );
}

export async function listNeighbourhoods(
  db: Database, cityId: string,
): Promise<Array<{ id: string; nameEn: string; nameFr: string }>> {
  return withDbErrors(() =>
    db
      .select({ id: neighbourhoods.id, nameEn: neighbourhoods.nameEn, nameFr: neighbourhoods.nameFr })
      .from(neighbourhoods)
      .where(eq(neighbourhoods.cityId, cityId))
      .orderBy(neighbourhoods.nameEn),
  );
}
