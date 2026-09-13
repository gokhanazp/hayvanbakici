import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { decryptField } from '../crypto.js';
import {
  users, profiles, sitters, sitterServices, verifications, cities, neighbourhoods,
  consentRecords, automatedDecisions,
} from '../schema/index.js';
import {
  ensureSitter, getOnboardingState, saveAbout, saveHome, saveLocation, saveServices,
  recordScreeningConsent, upsertVerification, recordAutomatedDecision, submitForReview,
  listNeighbourhoods,
} from './onboarding.js';

/**
 * ONBOARDING — gercek veritabanina karsi butunlesme testi.
 *
 * Sahte bir veritabani ile test etmek burada anlamsiz: dogrulamak istedigimiz
 * seylerin hepsi Postgres'e ozgu — PostGIS noktasinin gercekten yazilmasi,
 * sifreli adresin geri okunabilmesi, benzersizlik kisitlarinin tutmasi.
 */

const db = getDb();
const EMAIL = `onboarding-${Date.now()}@havre-test.ca`;
let userId = '';
let cityId = '';
let hoodId = '';

async function cleanup(): Promise<void> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL));
  for (const r of rows) {
    await db.delete(automatedDecisions).where(eq(automatedDecisions.userId, r.id));
    await db.delete(consentRecords).where(eq(consentRecords.userId, r.id));
    await db.delete(verifications).where(eq(verifications.sitterId, r.id));
    await db.delete(sitterServices).where(eq(sitterServices.sitterId, r.id));
    await db.delete(sitters).where(eq(sitters.userId, r.id));
    await db.delete(profiles).where(eq(profiles.userId, r.id));
    await db.delete(users).where(eq(users.id, r.id));
  }
}

beforeAll(async () => {
  await cleanup();
  const [u] = await db.insert(users).values({ email: EMAIL, name: 'Test Sitter' }).returning({ id: users.id });
  userId = u!.id;
  await db.insert(profiles).values({ userId, firstName: 'Test', lastNameInitial: 'S' });

  const [c] = await db.select({ id: cities.id }).from(cities).where(eq(cities.slugEn, 'toronto')).limit(1);
  cityId = c!.id;
  const [h] = await db.select({ id: neighbourhoods.id }).from(neighbourhoods).where(eq(neighbourhoods.cityId, cityId)).limit(1);
  hoodId = h!.id;
});

afterAll(cleanup);

describe('bakici onboarding', () => {
  it('bakici satiri acilir ve KALICI davet kodu uretilir', async () => {
    await ensureSitter(db, userId);
    const [s] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(s?.status).toBe('draft');
    expect(s?.referralCode).toMatch(/^HV[0-9A-F]{8}$/);

    // Ikinci cagri kodu DEGISTIRMEMELI — bakici bu kodu her yere yaziyor olacak
    const first = s?.referralCode;
    await ensureSitter(db, userId);
    const [again] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(again?.referralCode).toBe(first);
  });

  it('hakkinda adimi profil, telefon ve dogum tarihini yazar', async () => {
    await saveAbout(db, userId, {
      firstName: 'Camille',
      lastNameInitial: 'bourque',
      bio: 'On yildir kopek ve kedi bakiyorum, evimde genis bir bahce var.',
      phone: '4165550142',
      dateOfBirth: '1990-05-14',
    });

    const state = await getOnboardingState(db, userId);
    expect(state?.firstName).toBe('Camille');
    // Gizlilik: yalnizca bas harf, buyuk yazilmis
    expect(state?.lastNameInitial).toBe('B');
    expect(state?.phone).toBe('4165550142');
    expect(state?.dateOfBirth).toBe('1990-05-14');
  });

  it('konum adimi adresi SIFRELER ve yaklasik noktayi PostGIS ile yazar', async () => {
    await saveLocation(db, userId, {
      cityId,
      neighbourhoodId: hoodId,
      postalCode: 'm5v2t6',
      exactAddress: '123 Queen Street West, Unit 4',
    });

    const [p] = await db
      .select({
        enc: profiles.exactAddressEnc,
        postal: profiles.postalCode,
        province: profiles.province,
        lon: sql<number>`ST_X(${profiles.approxLocation}::geometry)`,
        lat: sql<number>`ST_Y(${profiles.approxLocation}::geometry)`,
      })
      .from(profiles)
      .where(eq(profiles.userId, userId));

    // Duz metin adres veritabaninda GECMEMELI
    expect(p?.enc).toBeTruthy();
    expect(p?.enc).not.toContain('Queen Street');
    expect(decryptField(p!.enc!)).toBe('123 Queen Street West, Unit 4');

    expect(p?.postal).toBe('M5V2T6');
    expect(p?.province).toBe('ON');

    // Toronto'nun icinde bir yerde olmali
    expect(p?.lon).toBeGreaterThan(-80);
    expect(p?.lon).toBeLessThan(-79);
    expect(p?.lat).toBeGreaterThan(43);
    expect(p?.lat).toBeLessThan(44);
  });

  it('yaklasik nokta DETERMINISTIK — her kaydetmede ziplamaz', async () => {
    const read = async () => {
      const [p] = await db
        .select({
          lon: sql<number>`ST_X(${profiles.approxLocation}::geometry)`,
          lat: sql<number>`ST_Y(${profiles.approxLocation}::geometry)`,
        })
        .from(profiles).where(eq(profiles.userId, userId));
      return `${p?.lon},${p?.lat}`;
    };

    const before = await read();
    await saveLocation(db, userId, {
      cityId, neighbourhoodId: hoodId, postalCode: 'M5V 2T6',
      exactAddress: '123 Queen Street West, Unit 4',
    });
    expect(await read()).toBe(before);
  });

  it('hizmetler tam olarak degistirilir, birikmez', async () => {
    await saveServices(db, userId, [
      { serviceType: 'boarding', priceCents: 6500, priceUnit: 'night', cancellationPolicy: 'moderate', acceptsDogs: true, acceptsCats: true, acceptsOther: false },
      { serviceType: 'dog_walking', priceCents: 2500, priceUnit: 'walk', cancellationPolicy: 'flexible', acceptsDogs: true, acceptsCats: false, acceptsOther: false },
    ]);
    let rows = await db.select().from(sitterServices).where(eq(sitterServices.sitterId, userId));
    expect(rows).toHaveLength(2);

    // Secimden cikarilan hizmet SILINMELI
    await saveServices(db, userId, [
      { serviceType: 'boarding', priceCents: 7000, priceUnit: 'night', cancellationPolicy: 'strict', acceptsDogs: true, acceptsCats: false, acceptsOther: false },
    ]);
    rows = await db.select().from(sitterServices).where(eq(sitterServices.sitterId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.priceCents).toBe(7000);
    expect(rows[0]?.cancellationPolicy).toBe('strict');
  });

  it('bahce yoksa cevrili bahce iddiasi da kaydedilmez', async () => {
    await saveHome(db, userId, {
      homeType: 'apartment', hasYard: false, yardFenced: true,
      hasOwnPets: true, smokeFree: true, maxConcurrentPets: 3,
    });
    const [s] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(s?.hasYard).toBe(false);
    expect(s?.yardFenced).toBe(false);
  });

  it('en fazla hayvan sayisi makul araliga sikistirilir', async () => {
    await saveHome(db, userId, {
      homeType: 'house', hasYard: true, yardFenced: true,
      hasOwnPets: false, smokeFree: true, maxConcurrentPets: 99,
    });
    const [s] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(s?.maxConcurrentPets).toBe(10);
  });

  it('adli sicil rizasi dil ve surumle birlikte kaydedilir', async () => {
    await recordScreeningConsent(db, {
      userId, localeShown: 'fr-CA', version: '2026-09-1',
      ip: '203.0.113.1', userAgent: 'test',
    });
    const [c] = await db
      .select().from(consentRecords)
      .where(and(eq(consentRecords.userId, userId), eq(consentRecords.type, 'criminal_check')));
    expect(c?.granted).toBe(true);
    // Law 25: rizanin hangi DILDE sunuldugu kaydedilmeli
    expect(c?.localeShown).toBe('fr-CA');
    expect(c?.version).toBe('2026-09-1');
  });

  it('dogrulama kaydi tekrar yazildiginda COGALMAZ', async () => {
    await upsertVerification(db, {
      sitterId: userId, type: 'criminal', status: 'pending',
      provider: 'mock', providerRef: 'mock_1', automatedDecision: false,
    });
    await upsertVerification(db, {
      sitterId: userId, type: 'criminal', status: 'passed',
      provider: 'mock', providerRef: 'mock_1', automatedDecision: true,
      decision: 'screening.passed',
    });

    const rows = await db.select().from(verifications)
      .where(and(eq(verifications.sitterId, userId), eq(verifications.type, 'criminal')));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('passed');
    expect(rows[0]?.decidedAt).toBeInstanceOf(Date);
    // Ham rapor ASLA saklanmaz — yalnizca karar anahtari
    expect(rows[0]?.decision).toBe('screening.passed');
  });

  it('otomatik karar Law 25 icin kaydedilir ve bildirim damgasi tasir', async () => {
    await recordAutomatedDecision(db, {
      userId, decisionType: 'criminal_record_check', outcome: 'passed',
      factors: { provider: 'mock', personalDataUsed: ['date_of_birth'] },
    });
    const [d] = await db.select().from(automatedDecisions).where(eq(automatedDecisions.userId, userId));
    expect(d?.notifiedAt).toBeInstanceOf(Date);
    expect(d?.factors).toMatchObject({ provider: 'mock' });
  });

  it('inceleme kuyruguna girer ve ikinci gonderim durumu bozmaz', async () => {
    await submitForReview(db, userId, 1);
    let [s] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(s?.status).toBe('pending');
    expect(s?.profileCompleteness).toBe(1);

    // Yalnizca 'draft' durumundakiler gecer: zaten incelemedeki bir bakicinin
    // durumu ikinci bir gonderimle sifirlanmamali.
    await submitForReview(db, userId, 0.2);
    [s] = await db.select().from(sitters).where(eq(sitters.userId, userId));
    expect(s?.status).toBe('pending');
    expect(s?.profileCompleteness).toBe(1);
  });

  it('mahalle listesi sehre gore doner', async () => {
    const hoods = await listNeighbourhoods(db, cityId);
    expect(hoods.length).toBeGreaterThan(0);
    expect(hoods.every((h) => h.nameEn.length > 0)).toBe(true);
  });
});
