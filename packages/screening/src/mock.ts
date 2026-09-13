import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ScreeningApplicant, ScreeningProvider, ScreeningResult, ScreeningWebhookEvent,
} from './types.js';

/**
 * SAHTE SAGLAYICI — gelistirme ve test icin.
 *
 * Gercek Certn sozlesmesi imzalanana kadar onboarding akisinin ucundan ucuna
 * calismasi gerekiyor. Bu sinif gercek saglayicinin AYNI arayuzunu uyguluyor;
 * sozlesme imzalandigi gun degisen tek sey createScreeningProvider icindeki
 * secim satiri.
 *
 * SONUC NASIL BELIRLENIYOR: e-postanin hash'inden. Yani ayni bakici her
 * seferinde AYNI sonucu aliyor — testler tekrarlanabilir oluyor.
 *
 * ELLE ZORLAMA (gelistirmede senaryo denemek icin):
 *   ...+clear@...    -> temiz
 *   ...+flagged@...  -> kayit bulundu (insan incelemesine duser)
 *   ...+error@...    -> saglayici hatasi
 *   ...+pending@...  -> sonuc beklemede kalir
 */
export class MockScreeningProvider implements ScreeningProvider {
  readonly name = 'mock';

  constructor(private readonly webhookSecret = 'gelistirme-webhook-anahtari') {}

  async submit(applicant: ScreeningApplicant): Promise<ScreeningResult> {
    const forced = forcedOutcome(applicant.email);
    const outcome = forced ?? deterministicOutcome(applicant.email);

    return {
      providerRef: `mock_${createHash('sha256').update(applicant.sitterId).digest('hex').slice(0, 16)}`,
      outcome,
      note: forced ? `elle zorlandi: ${forced}` : 'sahte saglayici',
      completedAt: outcome === 'pending' ? undefined : new Date().toISOString(),
    };
  }

  async fetchStatus(providerRef: string): Promise<ScreeningResult> {
    return { providerRef, outcome: 'clear', note: 'sahte saglayici', completedAt: new Date().toISOString() };
  }

  verifyWebhook(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    // Uzunluk farkliysa timingSafeEqual firlatir; once uzunlugu esitliyoruz.
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: string): ScreeningWebhookEvent {
    const parsed: unknown = JSON.parse(rawBody);
    const o = parsed as Record<string, unknown>;
    return {
      providerRef: String(o.providerRef ?? ''),
      outcome: (o.outcome as ScreeningWebhookEvent['outcome']) ?? 'error',
      note: typeof o.note === 'string' ? o.note : undefined,
    };
  }
}

function forcedOutcome(email: string): ScreeningResult['outcome'] | null {
  const tag = /\+([a-z]+)@/.exec(email.toLowerCase())?.[1];
  if (tag === 'clear' || tag === 'flagged' || tag === 'error' || tag === 'pending') return tag;
  return null;
}

/**
 * Dagilim bilerek gercekci: cogu basvuru temiz cikar. %10'luk isaretli dilim
 * insan inceleme kuyrugunun bos kalmamasi icin — o yolu da test etmemiz lazim.
 */
function deterministicOutcome(email: string): ScreeningResult['outcome'] {
  const h = createHash('sha256').update(email.toLowerCase()).digest();
  const bucket = (h[0] ?? 0) % 100;
  if (bucket < 85) return 'clear';
  if (bucket < 95) return 'flagged';
  return 'error';
}
