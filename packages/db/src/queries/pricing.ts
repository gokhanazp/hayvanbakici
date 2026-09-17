import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * BAKICININ UCRETLERI — sonradan degistirilebilir hale getirmek.
 *
 * Bakici ucretlerini yalnizca BASVURU SIHIRBAZINDA belirleyebiliyordu.
 * Onaylandiktan sonra fiyatini degistirmek icin "Bakici olun" sihirbazina
 * geri donmesi gerekiyordu: ekranda "Adim 3 / 6" ve en sonunda
 * "Basvurumu gonder" yaziyordu — zaten yayinda olan biri icin hem
 * korkutucu hem yanlis. Pazar yerinde fiyat degistirmek istisna degil,
 * rutin.
 *
 * BURASI YALNIZCA FIYATI GUNCELLIYOR, hizmet EKLEYIP CIKARMIYOR.
 * "Hangi hizmetleri veriyorum" ayri bir karar: profilin bicimini,
 * dogrulamayi ve arama sonuclarini degistiriyor. Fiyat degisikligi ise
 * tek satirlik bir islem ve her hafta olabilir. Ikisini ayni forma
 * koymak, fiyat degistirmek isteyen bakiciyi bir hizmeti yanlislikla
 * kapatma riskiyle karsi karsiya birakirdi.
 */
/*
  OKUMA ICIN AYRI BIR SORGU YOK.

  Ilk halinde bir `getSitterPricing` yazmistim; sonra fark ettim ki
  `getOnboardingState` zaten ayni satirlari (fiyat, ek ucret, tatil
  farki, iptal politikasi) il ve eyaletle birlikte donduruyor. Ikinci
  bir okuma yolu, iki ekranin ayni bakiciya farkli rakam gosterebilmesi
  demekti. Burada yalnizca DAR bir yazma var.
*/
export interface PricingUpdate {
  serviceType: string;
  priceCents: number;
  extraPetPriceCents: number;
  holidaySurchargePct: number;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
}

/**
 * Ucretleri gunceller ve KAC SATIRIN degistigini doner.
 *
 * YURUYEN REZERVASYONLAR ETKILENMIYOR. `bookings` satiri kendi
 * `unit_price_cents` / `base_cents` degerlerini talep aninda yaziyor ve
 * her ekran o satirdan okuyor; buradaki UPDATE yalnizca `sitter_services`
 * tablosuna dokunuyor. Yani bekleyen bir talep, sahibinin gordugu fiyatla
 * kaliyor. Ekranda bunu YAZIYORUZ, cunku aksini varsaymak bakicinin
 * fiyatini degistirmekten cekinmesine yol aciyor.
 *
 * UPDATE, INSERT DEGIL: olmayan bir hizmet buradan acilamaz. Formdan
 * uydurma bir hizmet adi gelirse hicbir satir eslesmiyor ve hicbir sey
 * olmuyor.
 */
export async function updateSitterPricing(
  db: Database, userId: string, input: readonly PricingUpdate[],
): Promise<number> {
  if (input.length === 0) return 0;
  return withDbErrors(async () => {
    let changed = 0;
    for (const s of input) {
      const res = await db.execute(sql`
        UPDATE sitter_services SET
          price_cents = ${s.priceCents},
          extra_pet_price_cents = ${s.extraPetPriceCents},
          holiday_surcharge_pct = ${s.holidaySurchargePct},
          cancellation_policy = ${s.cancellationPolicy}
        WHERE sitter_id = ${userId} AND service_type = ${s.serviceType} AND is_active
        RETURNING id
      `) as unknown as Array<{ id: string }>;
      changed += res.length;
    }
    return changed;
  });
}
