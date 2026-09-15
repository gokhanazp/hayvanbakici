import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  listOwnerPets, getOwnerPet, createOwnerPet, updateOwnerPet,
  setPetPhoto, deleteOwnerPet, MAX_PETS,
} from './pets.js';

/**
 * SAHIBIN HAYVANLARI.
 *
 * Bu sorgular bir bosluğu kapatiyor: hayvanlar bugune kadar yalnizca
 * rezervasyon formunun icinde yaratilabiliyor, sonra hicbir ekranda
 * gorulemiyordu. Testler "baskasinin hayvanina dokunulamiyor" ve
 * "silinen kayit gecmisi bozmuyor" sozlerini kontrol ediyor.
 */
const db = getDb();

let owner = '';
let other = '';

async function makeUser(): Promise<string> {
  const res = await db.execute(sql`
    INSERT INTO users (email, locale)
    VALUES (${`pet-test-${Date.now()}-${Math.random()}@example.test`}, 'en-CA')
    RETURNING id::text AS id
  `);
  return String((res as unknown as Array<{ id: string }>)[0]!.id);
}

beforeAll(async () => {
  owner = await makeUser();
  other = await makeUser();
});

describe('hayvan ekleme ve okuma', () => {
  it('eklenen hayvan listede, alanlariyla birlikte', async () => {
    const res = await createOwnerPet(db, owner, {
      name: 'Max', species: 'dog', breed: 'Border collie',
      birthDate: '2022-04-11', weightKg: 18.5, temperamentNotes: 'Diger kopeklerle gergin',
    });
    expect(res.ok).toBe(true);

    const pets = await listOwnerPets(db, owner);
    const max = pets.find((p) => p.name === 'Max');
    expect(max).toBeDefined();
    expect(max!.species).toBe('dog');
    expect(max!.breed).toBe('Border collie');
    expect(max!.birthDate).toBe('2022-04-11');
    expect(max!.weightKg).toBeCloseTo(18.5, 1);
  });

  it('istege bagli alanlar bos birakilabiliyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Nour', species: 'cat' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const pet = await getOwnerPet(db, res.id, owner);
    /* Bos DIZE degil NULL: kart "Irk: " diye bos bir satir cizmesin. */
    expect(pet!.breed).toBeNull();
    expect(pet!.birthDate).toBeNull();
    expect(pet!.weightKg).toBeNull();
  });
});

describe('baskasinin hayvani', () => {
  it('BASKASININ hayvani okunamiyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Gizli', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');
    expect(await getOwnerPet(db, res.id, other)).toBeNull();
  });

  it('BASKASININ hayvani duzenlenemiyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Dokunma', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');

    const ok = await updateOwnerPet(db, res.id, other, { name: 'Calindi', species: 'cat' });
    expect(ok).toBe(false);

    const still = await getOwnerPet(db, res.id, owner);
    expect(still!.name).toBe('Dokunma');
  });

  it('BASKASININ hayvani silinemiyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Kalici', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');

    expect(await deleteOwnerPet(db, res.id, other)).toBeNull();
    expect(await getOwnerPet(db, res.id, owner)).not.toBeNull();
  });
});

describe('fotograf', () => {
  it('fotograf kaydediliyor ve ONCEKI adres geri doniyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Foto', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');

    const first = await setPetPhoto(db, res.id, owner, 'pet/aaa.webp');
    expect(first.ok).toBe(true);
    expect(first.previous).toBeNull();

    /* Ikinci yuklemede eski dosya depodan silinebilsin diye adresi
       donuyor; donmeseydi eski fotograf sonsuza kadar erisilebilir
       kalirdi. */
    const second = await setPetPhoto(db, res.id, owner, 'pet/bbb.webp');
    expect(second.previous).toBe('pet/aaa.webp');

    const pet = await getOwnerPet(db, res.id, owner);
    expect(pet!.photoUrl).toBe('pet/bbb.webp');
  });

  it('baskasinin hayvanina fotograf konamiyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Korumali', species: 'cat' });
    if (!res.ok) throw new Error('kurulum');
    expect((await setPetPhoto(db, res.id, other, 'pet/x.webp')).ok).toBe(false);
  });
});

describe('silme', () => {
  it('silinen hayvan listeden gidiyor ama SATIR duruyor', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Gecmis', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');

    await deleteOwnerPet(db, res.id, owner);
    expect((await listOwnerPets(db, owner)).some((p) => p.id === res.id)).toBe(false);

    /*
      YUMUSAK SILME: gecmis rezervasyonlar bu hayvana bagli. Satiri
      gercekten silmek, bir yil once yapilmis bir rezervasyonun kimin
      icin oldugunu kaybetmek olurdu.
    */
    const raw = await db.execute(sql`
      SELECT deleted_at FROM pets WHERE id = ${res.id}::uuid
    `);
    expect((raw as unknown as Array<{ deleted_at: unknown }>)[0]?.deleted_at).not.toBeNull();
  });

  it('ayni hayvani iki kez silmek hata degil, ikincisi bos doner', async () => {
    const res = await createOwnerPet(db, owner, { name: 'Iki kez', species: 'dog' });
    if (!res.ok) throw new Error('kurulum');
    await deleteOwnerPet(db, res.id, owner);
    expect(await deleteOwnerPet(db, res.id, owner)).toBeNull();
  });
});

describe('tavan', () => {
  it('tavana ulasinca yeni hayvan eklenmiyor', async () => {
    const solo = await makeUser();
    for (let i = 0; i < MAX_PETS; i += 1) {
      const r = await createOwnerPet(db, solo, { name: `P${i}`, species: 'dog' });
      expect(r.ok).toBe(true);
    }
    const over = await createOwnerPet(db, solo, { name: 'Fazla', species: 'dog' });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error).toBe('too_many');

    /* Silinen bir hayvan yer aciyor — tavan YASAYAN hayvanlari sayiyor. */
    const pets = await listOwnerPets(db, solo);
    await deleteOwnerPet(db, pets[0]!.id, solo);
    expect((await createOwnerPet(db, solo, { name: 'Yeni', species: 'cat' })).ok).toBe(true);
  });
});
