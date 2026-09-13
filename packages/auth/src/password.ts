/**
 * SIFRE KURALLARI.
 *
 * NIST SP 800-63B'yi takip ediyoruz, eski "buyuk harf + rakam + sembol"
 * kaliplarini DEGIL. Gerekce: zorunlu karmasiklik kurallari kullanicilari
 * "Parola1!" gibi tahmin edilebilir kaliplara itiyor ve olculen guvenlik
 * kazanci yok. Uzunluk ve YAYGIN SIFRE ENGELI gercek korumayi saglayan iki
 * kural; ikisi de burada.
 *
 * Ayni dosya hem tarayicida (aninda geri bildirim) hem sunucuda (asil kontrol)
 * calisiyor — tarayicidaki kontrol bir kolaylik, guvenlik siniri sunucudur.
 */

export const PASSWORD_RULES = {
  minLength: 10,
  maxLength: 128,
} as const;

/**
 * Hata KODU donduruyoruz, metin degil. Arayuz cevirisini yapiyor;
 * boylece Fransizca metin unutulursa derleme degil, ceviri testi yakaliyor.
 */
export type PasswordProblem =
  | 'too_short'
  | 'too_long'
  | 'common'
  | 'contains_email'
  | 'whitespace_only';

/**
 * En cok sizdirilan sifrelerin kisa listesi. Uretimde bunun yerine
 * Have I Been Pwned'in k-anonimlik API'si kullanilacak (sifrenin SHA-1
 * hash'inin ilk 5 hanesi gonderilir, sifrenin kendisi ASLA gitmez).
 * Burasi cevrimdisi ilk savunma.
 */
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', '123456', '1234567',
  '12345678', '123456789', '1234567890', 'qwerty', 'qwerty123', 'azerty',
  'iloveyou', 'admin', 'welcome', 'welcome1', 'monkey', 'dragon', 'sunshine',
  'princess', 'football', 'baseball', 'letmein', 'abc123', 'trustno1',
  'motdepasse', 'bonjour', 'canada', 'canada123', 'toronto', 'montreal',
  'hockey', 'poutine', 'chien', 'chat', 'doglover', 'petlover', 'havre',
  'havre123', 'petsitter', 'dogwalker',
]);

export function checkPassword(password: string, email?: string): PasswordProblem[] {
  const problems: PasswordProblem[] = [];

  if (password.trim().length === 0) {
    return ['whitespace_only'];
  }
  if (password.length < PASSWORD_RULES.minLength) problems.push('too_short');
  if (password.length > PASSWORD_RULES.maxLength) problems.push('too_long');

  const lowered = password.toLowerCase();
  // Sadece rakam eklenerek yapilan varyantlar da yakalanmali: "password2024"
  const stripped = lowered.replace(/[0-9!@#$%^&*_.-]+$/g, '');
  if (COMMON.has(lowered) || (stripped.length >= 4 && COMMON.has(stripped))) {
    problems.push('common');
  }

  if (email) {
    const local = email.split('@')[0]?.toLowerCase() ?? '';
    if (local.length >= 4 && lowered.includes(local)) problems.push('contains_email');
  }

  return problems;
}

/*
 * BU DOSYA TARAYICIYA GIDIYOR.
 *
 * Bu yuzden @havre/auth ana girisinden DEGIL, @havre/auth/password
 * girisinden ithal edilir. Ana giris server.ts'i, o da @havre/db'yi ve
 * postgres surucusunu ceker; istemci bileseninden ithal edildiginde
 * webpack "Can't resolve 'fs'/'net'/'perf_hooks'" ile derlemeyi kirar.
 * (Bizzat yasandi — bu not onun icin burada.)
 *
 * Buraya sunucuya ozgu hicbir sey eklemeyin.
 */
