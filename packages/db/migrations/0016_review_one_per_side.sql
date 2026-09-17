--> statement-breakpoint
/*
  BIR REZERVASYONA, BIR TARAFTAN, BIR YORUM.

  Kontrol sunucu eyleminde de var ama yarisan iki istek (cift tiklama,
  iki sekme) ikisini de gecebilir. Tekil indeks bunu VERITABANINDA
  kesiyor — dogruluk uygulamanin dikkatine birakilmiyor.
*/
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_booking_direction_uq"
  ON "reviews" ("booking_id", "direction");
