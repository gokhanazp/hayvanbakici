import { demoNotice } from '@/lib/demo';

/**
 * DEMO SERIDI — her sayfanin en ustunde, kapatilamaz.
 *
 * Kapatma dugmesi BILEREK yok: serit bir bildirim degil, ekrandaki
 * verinin ne oldugunu soyleyen bir etiket. Kapatilabilir olsaydi
 * ziyaretcinin gordugu ilk sey onu kapatmak olurdu ve geri kalan
 * gezinti boyunca uydurma bakicilar gercek gibi dururdu.
 *
 * Sunucu bileseni: JS gerektirmiyor ve ISR'yi bozmuyor.
 */
export function DemoNotice({ locale }: { locale: string }) {
  const { title, body } = demoNotice(locale);
  return (
    <div className="demo-notice" role="status">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}
