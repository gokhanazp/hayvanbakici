-- KABUL EDILEN BOYUT: TAVAN DEGIL, KUME.
--
-- `accepted_size_max_kg` tek bir tavandi ve bu, bakicinin verebilecegi
-- her cevabin sifirdan baslayan KESINTISIZ bir aralik olmasini zorunlu
-- kiliyordu. Gercek boyle degil: kendi iri kopegi olan bir bakici
-- "buyuk kopek alirim ama uc kiloluk yavru alamam, benimki sert
-- oynuyor" diyebiliyor. Eski model bu cumleyi kuramiyordu; bakici ya
-- tutamayacagi bir soz veriyor ya da hizmeti hic acmiyordu.
--
-- `accepted_size_min_kg` ise hic kullanilmadi. Hicbir ekran onu
-- yazmiyordu, sihirbazda karsiligi yoktu ve her satirda 0'di.
--
-- GERI DOLDURMA: eski tavan hangi kademeleri TAMAMEN kapsiyorsa
-- yalnizca onlar isaretleniyor. 20 kiloya kadar alan bir bakiciyi
-- "buyuk kopek alir" diye isaretlemek (18-45 kademesi), onun hic
-- vermedigi bir soz olurdu. Kademe sinirlari packages/core/services.ts
-- icindeki PET_SIZE_STEPS ile ayni: 7 / 18 / 45 / 100.
ALTER TABLE "sitter_services" ADD COLUMN "accepted_sizes" text[];
--> statement-breakpoint
UPDATE "sitter_services" SET "accepted_sizes" = (
  ARRAY[]::text[]
  || CASE WHEN "accepted_size_max_kg" >= 7   THEN ARRAY['small']  ELSE ARRAY[]::text[] END
  || CASE WHEN "accepted_size_max_kg" >= 18  THEN ARRAY['medium'] ELSE ARRAY[]::text[] END
  || CASE WHEN "accepted_size_max_kg" >= 45  THEN ARRAY['large']  ELSE ARRAY[]::text[] END
  || CASE WHEN "accepted_size_max_kg" >= 100 THEN ARRAY['giant']  ELSE ARRAY[]::text[] END
);
--> statement-breakpoint
-- Tavani 7 kilonun ALTINDA olan satirlar bos kalirdi ve bos kume
-- "hicbir hayvani almam" demek olurdu — bu da veriden cikarilamayan
-- bir cumle. Boyle bir satir icin en kucuk kademe isaretleniyor:
-- bakicinin gercekten soyledigi sey buydu.
UPDATE "sitter_services" SET "accepted_sizes" = ARRAY['small']
  WHERE "accepted_sizes" IS NULL OR cardinality("accepted_sizes") = 0;
--> statement-breakpoint
ALTER TABLE "sitter_services" ALTER COLUMN "accepted_sizes" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sitter_services" DROP COLUMN "accepted_size_min_kg";
--> statement-breakpoint
ALTER TABLE "sitter_services" DROP COLUMN "accepted_size_max_kg";
