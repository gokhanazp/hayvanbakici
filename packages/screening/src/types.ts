/**
 * ADLI SICIL / KIMLIK DOGRULAMA — saglayici arayuzu.
 *
 * Arayuz bilerek Certn'in sekline gore cizildi ama Certn'e BAGLI DEGIL.
 * Turkiye'ye (Faz 7) gecildiginde saglayici degisecek; degisen tek sey
 * bu arayuzu uygulayan sinif olmali.
 */

export type Province =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

/**
 * Saglayicinin dondurdugu ham sonuc.
 *
 * 'clear'   : kayit bulunamadi
 * 'flagged' : kayit bulundu ya da esleme belirsiz — KARAR DEGIL, sinyal
 * 'error'   : saglayici basarisiz (kimlik eslesmedi, belge okunamadi vb.)
 */
export type ProviderOutcome = 'pending' | 'clear' | 'flagged' | 'error';

/** Bizim veritabanindaki durum (verifications.status ile ayni kume) */
export type VerificationStatus =
  | 'not_started' | 'pending' | 'passed' | 'failed' | 'expired' | 'manual_review';

export interface ScreeningApplicant {
  readonly sitterId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  /** ISO 8601 (YYYY-MM-DD) */
  readonly dateOfBirth: string;
  readonly province: Province;
}

export interface ScreeningResult {
  /** Saglayicidaki basvuru kimligi — ham rapor DEGIL, yalnizca referans */
  readonly providerRef: string;
  readonly outcome: ProviderOutcome;
  /** Saglayicinin kisa gerekce metni; ham rapor iceremez */
  readonly note?: string | undefined;
  readonly completedAt?: string | undefined;
}

export interface ScreeningWebhookEvent {
  readonly providerRef: string;
  readonly outcome: ProviderOutcome;
  readonly note?: string | undefined;
}

export interface ScreeningProvider {
  readonly name: string;
  /** Basvuruyu baslatir. Riza ONCEDEN alinmis olmali — bkz. consent.ts */
  submit(applicant: ScreeningApplicant): Promise<ScreeningResult>;
  fetchStatus(providerRef: string): Promise<ScreeningResult>;
  /** Webhook imzasini dogrular. Dogrulanmayan webhook ISLENMEZ. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
  parseWebhook(rawBody: string): ScreeningWebhookEvent;
}
