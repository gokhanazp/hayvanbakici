import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ScreeningApplicant, ScreeningProvider, ScreeningResult, ScreeningWebhookEvent,
} from './types.js';

/**
 * CERTN SAGLAYICISI.
 *
 * DURUM: sozlesme ve API anahtari HENUZ YOK. Bu sinif kodda duruyor ama
 * CERTN_API_KEY tanimlanmadan asla ornegi olusturulmuyor (bkz. index.ts).
 *
 * Anahtar geldigi gun yapilacaklar — baska yerde degisiklik gerekmiyor:
 *  1. Asagidaki uc nokta yollarini ve alan adlarini Certn'in guncel
 *     dokumanina gore dogrula (bu dosya varsayimla yazildi, TEST EDILMEDI).
 *  2. Webhook imza basligini ve algoritmasini dogrula.
 *  3. Sandbox'ta bir basvuru calistir, decide() ciktisini kontrol et.
 *
 * ASLA SAKLAMIYORUZ: ham rapor, sabika kaydi detaylari, belge goruntuleri.
 * Yalnizca providerRef, sonuc ve tarih. (PIPEDA/Law 25 hassas veri kurali:
 * gerekenden fazlasini tutmak basli basina risktir.)
 */
export class CertnScreeningProvider implements ScreeningProvider {
  readonly name = 'certn';

  constructor(
    private readonly apiKey: string,
    private readonly webhookSecret: string,
    private readonly baseUrl = 'https://api.certn.co',
  ) {}

  private async call(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // API anahtari hicbir kosulda hata mesajina girmez.
      throw new Error(`Certn ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.json();
  }

  async submit(applicant: ScreeningApplicant): Promise<ScreeningResult> {
    const data = (await this.call('/api/v2/applications', {
      method: 'POST',
      body: JSON.stringify({
        email: applicant.email,
        first_name: applicant.firstName,
        last_name: applicant.lastName,
        date_of_birth: applicant.dateOfBirth,
        region: applicant.province,
        request_enhanced_identity_verification: true,
        request_criminal_record_check: true,
      }),
    })) as Record<string, unknown>;

    return {
      providerRef: String(data.id ?? ''),
      outcome: mapOutcome(data.result ?? data.status),
    };
  }

  async fetchStatus(providerRef: string): Promise<ScreeningResult> {
    const data = (await this.call(`/api/v2/applications/${providerRef}`)) as Record<string, unknown>;
    return {
      providerRef,
      outcome: mapOutcome(data.result ?? data.status),
      completedAt: typeof data.completed_at === 'string' ? data.completed_at : undefined,
    };
  }

  verifyWebhook(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: string): ScreeningWebhookEvent {
    const o = JSON.parse(rawBody) as Record<string, unknown>;
    return {
      providerRef: String(o.id ?? o.application_id ?? ''),
      outcome: mapOutcome(o.result ?? o.status),
    };
  }
}

/**
 * Saglayicinin sozlugunu bizimkine cevirir.
 *
 * TANIMADIGIMIZ HER DEGER 'flagged' OLUR, 'clear' DEGIL.
 * Sebebi bilincli: saglayici yarin yeni bir durum adi eklerse, hata
 * insan incelemesine dusmekle sonuclanir — sessizce onay vermekle degil.
 */
function mapOutcome(raw: unknown): ScreeningResult['outcome'] {
  const v = String(raw ?? '').toLowerCase();
  if (v === 'cleared' || v === 'clear' || v === 'pass' || v === 'passed') return 'clear';
  if (v === 'pending' || v === 'in_progress' || v === 'processing' || v === 'submitted') return 'pending';
  if (v === 'error' || v === 'failed_to_process' || v === 'cancelled') return 'error';
  return 'flagged';
}
