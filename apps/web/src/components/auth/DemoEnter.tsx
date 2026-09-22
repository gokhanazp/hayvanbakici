import { segmentFor, type Locale } from '@havre/i18n';

/**
 * DEMO GIRIS BLOGU — YALNIZCA DEMO YAYININDA cizilir.
 *
 * Demoyu gezen birinin karsisina cikan ilk duvar giris ekrani oluyordu:
 * gonderen alan adi dogrulanmadigi icin e-posta yalnizca hesap sahibine
 * gidiyor, yani "baglanti gonderdik" yazan ekranda kimse bekledigi
 * postayi alamiyordu. Bu blok o duvari kaldiriyor.
 *
 * NE OLDUGUNU SAKLAMIYOR: dugmelerin altinda hesaplarin uydurma oldugu
 * yaziyor. "Gercek gibi dursun" diye yazilmis bir demo, demo degil
 * yalandir.
 *
 * JS GEREKTIRMIYOR: iki ayri form, sunucuya POST ediyor.
 */
export function DemoEnter({ locale }: { locale: Locale }) {
  const fr = locale === 'fr-CA';
  const seg = segmentFor(locale);

  const t = fr
    ? {
        title: 'Démonstration — entrez sans courriel',
        owner: 'Entrer comme propriétaire',
        sitter: 'Entrer comme gardien',
        note: 'Ces deux comptes sont fictifs, comme tout le reste du site de démonstration. Aucun courriel n’est envoyé.',
      }
    : {
        title: 'Demo — come in without email',
        owner: 'Enter as an owner',
        sitter: 'Enter as a sitter',
        note: 'Both accounts are made up, like everything else on this demo. No email is sent.',
      };

  return (
    <div className="demo-enter">
      <h2 className="text-label">{t.title}</h2>
      <div className="row">
        <form action="/api/demo/enter" method="post">
          <input type="hidden" name="role" value="owner" />
          <input type="hidden" name="locale" value={seg} />
          <button type="submit" className="btn btn-secondary">{t.owner}</button>
        </form>
        <form action="/api/demo/enter" method="post">
          <input type="hidden" name="role" value="sitter" />
          <input type="hidden" name="locale" value={seg} />
          <button type="submit" className="btn btn-secondary">{t.sitter}</button>
        </form>
      </div>
      <p className="text-small muted" style={{ marginTop: 'var(--space-3)' }}>{t.note}</p>
    </div>
  );
}
