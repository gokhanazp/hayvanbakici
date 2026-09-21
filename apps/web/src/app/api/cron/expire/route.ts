import { expireStaleRequests, countStaleRequests } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SURESI DOLAN TALEPLERI KAPATAN ZAMANLI IS.
 *
 * Ekranda "36 saat sonra kendiliginden dolar" yaziyordu ama hicbir sey
 * bunu yapmiyordu: talep sonsuza kadar bekliyor, sahibi cevap alamiyor
 * ve cevap vermeyen bakicinin yanit orani %100 gorunuyordu (bkz.
 * queries/maintenance.ts).
 *
 * NEDEN BIR ROTA, NEDEN AYRI BIR ISLEYICI DEGIL: barindirma Vercel ve
 * orada zamanli isler bir adrese HTTP istegi olarak geliyor
 * (`vercel.json` → crons). Ayri bir surec calistirmak, ayri bir dagitim
 * ve ayri bir izleme demekti; bu is gunde birkac saniye suruyor.
 *
 * SIKLIK — VERCEL PLANINA BAGLI.
 *
 * vercel.json gunde bir kez diyor (04:17 UTC), cunku Vercel Hobby
 * planinda cron gunde birden fazla calistirilamiyor; saatlik ifade
 * dagitimi reddediyor. Sonucu durustce yazmak gerekirse: ekranda
 * "36 saat" diyoruz, gunluk calismada bir talep 36-60 saat arasinda
 * dusuyor.
 *
 * DEMO YAYINI ICIN kabul edilebilir (veri zaten uydurma ve site bunu
 * her sayfada soyluyor). GERCEK KULLANICIYLA YAYINA CIKMADAN ONCE
 * Pro plana gecip bu ifadeyi "17 * * * *" yapmak GEREKIYOR; aksi
 * halde ekrandaki sozu tutmuyoruz.
 *
 * KIMLIK: `CRON_SECRET`.
 *
 * Bu adres herkese acik ve kimlik kontrolu olmasaydi HERKES
 * calistirabilirdi. Tek basina yikici degil (yalnizca zaten suresi
 * dolmus talepleri kapatiyor) ama veritabanina bedava is yaptirma yolu
 * olurdu. Sir TANIMLI DEGILSE rota 503 doner — acik birakmaktansa
 * calismamasi dogru; calismadigi da ekranda gorunur.
 *
 * KARSILASTIRMA SABIT SURELI degil; sir kisa ve karsilastirma tek
 * seferlik, zamanlama saldirisi icin anlamli bir yuzey yok. Yine de
 * uzunluk once kontrol ediliyor ki farkli uzunlukta bir deger erken
 * donmesin diye degil, gereksiz is yapilmasin diye.
 */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: 'CRON_SECRET tanimli degil' },
      { status: 503 },
    );
  }

  /*
    Vercel zamanli isleri `Authorization: Bearer <CRON_SECRET>` ile
    cagiriyor. Elle tetiklemek icin ayni baslik yeterli.
  */
  const given = req.headers.get('authorization');
  if (given !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const before = await countStaleRequests();
  const expired = await expireStaleRequests();

  /*
    KAC TANE KALDIGI da donuyor: parti sinirli (200) oldugu icin
    birikmis bir kuyruk varsa bu sayi sifira inene kadar her calismada
    azaliyor. Sifira inmiyorsa is yetismiyor demektir ve bunu
    bilmemizin tek yolu bu.
  */
  const remaining = await countStaleRequests();

  return Response.json({
    ok: true,
    expired: expired.length,
    before,
    remaining,
  });
}
