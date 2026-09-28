-- HANGI SEHIRDE HIZMET VERDIGIMIZ ARTIK BIR VERI, VARSAYIM DEGIL.
--
-- Bugune kadar "acik sehir" diye bir kavram yoktu: tohum veride bakicisi
-- olan her sehrin arama sayfasi aciliyordu. Lansmanda YALNIZCA Toronto'da
-- olacagiz; Ottawa'da arama sayfasi acip "bakici bul" demek, tutamayacagimiz
-- bir soz olurdu.
--
-- `tier` bu isi GOREMEZ cunku o bir PLAN ("bir gun buraya acilacagiz").
-- Acik olmak bir GERCEK ("bugun burada hizmet veriyoruz"). Ikisini ayni
-- sutunda tutmak, planla vaadi birbirine karistirmak olurdu.
--
-- VARSAYILAN KAPALI: yeni eklenen bir sehir kendiliginden yayina girmiyor.
-- Yanlis yonde hata yapmak (kapali sanip acik olmak) bir sehirde sifir
-- bakiciyla "bakici bul" sayfasi demek.
ALTER TABLE "cities" ADD COLUMN "is_live" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "live_since" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cities_live_idx" ON "cities" ("is_live");
--> statement-breakpoint
-- Lansman sehri: Toronto. Baska hicbir sehir acilmiyor -- acmak panelden,
-- bilerek, denetim kaydina yazilarak yapiliyor.
UPDATE "cities" SET "is_live" = true, "live_since" = now() WHERE "slug_en" = 'toronto';
