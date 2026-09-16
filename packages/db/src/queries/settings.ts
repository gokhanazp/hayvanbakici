import { and, desc, eq, isNull, lte, gt, sql } from 'drizzle-orm';
import {
  DEFAULT_COMMISSION, resolveCommissionConfig,
  type CommissionConfig, type CommissionCampaign, type ResolvedCommission,
} from '@havre/core';
import type { Database } from '../client.js';
import { withDbErrors } from '../client.js';
import { commissionSettings, commissionCampaigns } from '../schema/settings.js';
import { recordAudit } from './admin.js';

/**
 * KOMISYON AYARLARI — OKUMA VE YAZMA.
 *
 * Bu dosyanin tek isi "su anda hangi oran gecerli" sorusunu
 * cevaplamak. Karar mantigi burada DEGIL, packages/core icinde
 * (resolveCommissionConfig): saf, saati disaridan alan ve testi
 * yazilabilen bir fonksiyon. Burasi yalnizca satirlari okuyup ona
 * veriyor.
 */

export interface CommissionSettingsRow {
  sitterPct: { platform: number; repeat: number; sitter_referral: number };
  ownerPct: number;
  ownerFeeCapCents: number;
  launchPromoMonths: number;
  updatedAt: string | null;
}

export interface CampaignRow {
  id: string;
  name: string;
  sitterPct: { platform?: number; repeat?: number; sitter_referral?: number };
  startsAt: string;
  endsAt: string;
  endedEarlyAt: string | null;
  createdAt: string;
}

function toConfig(row: CommissionSettingsRow): CommissionConfig {
  return {
    sitterPct: {
      platform: row.sitterPct.platform,
      repeat: row.sitterPct.repeat,
      sitter_referral: row.sitterPct.sitter_referral,
    },
    ownerPct: row.ownerPct,
    ownerFeeCapCents: row.ownerFeeCapCents,
    launchPromoMonths: row.launchPromoMonths,
  };
}

/**
 * Taban oranlar. Satir yoksa koddaki varsayilan donuyor.
 *
 * NEDEN SATIR OLMAYABILIR: migration tabloyu bos aciyor. Ilk kaydetmeye
 * kadar site koddaki oranlarla calisiyor ve bu DOGRU davranis — bos bir
 * tabloyu "komisyon sifir" diye okumak, ilk dagitimda butun komisyonlari
 * silerdi.
 */
export async function getCommissionSettings(db: Database): Promise<CommissionSettingsRow> {
  return withDbErrors(async () => {
    const [row] = await db.select().from(commissionSettings).where(eq(commissionSettings.id, 1));
    if (!row) {
      return {
        sitterPct: { ...DEFAULT_COMMISSION.sitterPct },
        ownerPct: DEFAULT_COMMISSION.ownerPct,
        ownerFeeCapCents: DEFAULT_COMMISSION.ownerFeeCapCents,
        launchPromoMonths: DEFAULT_COMMISSION.launchPromoMonths,
        updatedAt: null,
      };
    }
    return {
      sitterPct: {
        platform: row.sitterPctPlatform,
        repeat: row.sitterPctRepeat,
        sitter_referral: row.sitterPctReferral,
      },
      ownerPct: row.ownerPct,
      ownerFeeCapCents: row.ownerFeeCapCents,
      launchPromoMonths: row.launchPromoMonths,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

function mapCampaign(row: typeof commissionCampaigns.$inferSelect): CampaignRow {
  return {
    id: row.id,
    name: row.name,
    sitterPct: {
      ...(row.sitterPctPlatform === null ? {} : { platform: row.sitterPctPlatform }),
      ...(row.sitterPctRepeat === null ? {} : { repeat: row.sitterPctRepeat }),
      ...(row.sitterPctReferral === null ? {} : { sitter_referral: row.sitterPctReferral }),
    },
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    endedEarlyAt: row.endedEarlyAt ? row.endedEarlyAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * SU AN YURURLUKTEKI kampanya.
 *
 * Erken bitirilenler disarida: `ended_early_at` dolu bir satir pencere
 * icinde olsa bile gecerli degil. Satiri silmek yerine isaretlemek,
 * "o hafta neden indirimliydik" sorusunun cevabini kayitta tutuyor.
 *
 * Birden fazla kampanya pencereyi paylasiyorsa EN SON KURULAN gecerli.
 * Cakismayi panel engelliyor; burada yine de belirlenimci bir kural
 * var, cunku "hangisi gecerli" sorusunun tesadufe birakilmasi
 * komisyonun tesadufe birakilmasi demektir.
 */
export async function getActiveCampaign(
  db: Database, now: Date = new Date(),
): Promise<CampaignRow | null> {
  return withDbErrors(async () => {
    const rows = await db
      .select().from(commissionCampaigns)
      .where(and(
        isNull(commissionCampaigns.endedEarlyAt),
        lte(commissionCampaigns.startsAt, now),
        gt(commissionCampaigns.endsAt, now),
      ))
      .orderBy(desc(commissionCampaigns.createdAt))
      .limit(1);
    return rows[0] ? mapCampaign(rows[0]) : null;
  });
}

/** Taban + kampanya -> o an gecerli yapilandirma. */
export async function getResolvedCommission(
  db: Database, now: Date = new Date(),
): Promise<ResolvedCommission> {
  const [base, campaign] = await Promise.all([
    getCommissionSettings(db),
    getActiveCampaign(db, now),
  ]);
  const asCampaign: CommissionCampaign | null = campaign
    ? {
      name: campaign.name,
      sitterPct: campaign.sitterPct,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
    }
    : null;
  return resolveCommissionConfig(toConfig(base), asCampaign, now);
}

/** Panelde listelenen kampanyalar — yenisi ustte. */
export async function listCampaigns(db: Database, limit = 25): Promise<CampaignRow[]> {
  return withDbErrors(async () => {
    const rows = await db
      .select().from(commissionCampaigns)
      .orderBy(desc(commissionCampaigns.startsAt))
      .limit(limit);
    return rows.map(mapCampaign);
  });
}

export interface SaveSettingsInput {
  adminId: string;
  sitterPct: { platform: number; repeat: number; sitter_referral: number };
  ownerPct: number;
  ownerFeeCapCents: number;
  launchPromoMonths: number;
  ip?: string | undefined;
}

/**
 * Taban oranlari kaydeder ve degisikligi DENETIM KAYDINA yazar.
 *
 * ONCESI VE SONRASI birlikte kaydediliyor. Bir bakici "komisyonum
 * neden degisti" diye sordugunda cevabi bir insan bulabilmeli; sonucu
 * bilmek yetmiyor, oncesini de bilmek gerekiyor.
 */
export async function saveCommissionSettings(
  db: Database, input: SaveSettingsInput,
): Promise<void> {
  const before = await getCommissionSettings(db);

  await withDbErrors(async () => {
    await db
      .insert(commissionSettings)
      .values({
        id: 1,
        sitterPctPlatform: input.sitterPct.platform,
        sitterPctRepeat: input.sitterPct.repeat,
        sitterPctReferral: input.sitterPct.sitter_referral,
        ownerPct: input.ownerPct,
        ownerFeeCapCents: input.ownerFeeCapCents,
        launchPromoMonths: input.launchPromoMonths,
        updatedAt: new Date(),
        updatedBy: input.adminId,
      })
      .onConflictDoUpdate({
        target: commissionSettings.id,
        set: {
          sitterPctPlatform: input.sitterPct.platform,
          sitterPctRepeat: input.sitterPct.repeat,
          sitterPctReferral: input.sitterPct.sitter_referral,
          ownerPct: input.ownerPct,
          ownerFeeCapCents: input.ownerFeeCapCents,
          launchPromoMonths: input.launchPromoMonths,
          updatedAt: new Date(),
          updatedBy: input.adminId,
        },
      });
  });

  await recordAudit(db, {
    actorId: input.adminId,
    action: 'settings.commission',
    entity: 'commission_settings',
    entityId: '1',
    before: { ...before },
    after: {
      sitterPct: input.sitterPct,
      ownerPct: input.ownerPct,
      ownerFeeCapCents: input.ownerFeeCapCents,
      launchPromoMonths: input.launchPromoMonths,
    },
    ...(input.ip ? { ip: input.ip } : {}),
  });
}

export interface CreateCampaignInput {
  adminId: string;
  name: string;
  sitterPct: { platform?: number | undefined; repeat?: number | undefined; sitter_referral?: number | undefined };
  startsAt: string;
  endsAt: string;
  ip?: string | undefined;
}

export type CampaignResult =
  | { ok: true; id: string }
  | { ok: false; error: 'overlap' };

/**
 * Yeni kampanya kurar.
 *
 * CAKISMA REDDEDILIYOR. Iki kampanya ayni gunu kapsarsa "hangisi
 * gecerli" sorusunun cevabi bir siralama kuralina kalir ve yonetici
 * hangi indirimi verdigini ekrana bakarak bilemez. Kural basit
 * olmali: ayni anda en fazla bir kampanya.
 */
export async function createCampaign(
  db: Database, input: CreateCampaignInput,
): Promise<CampaignResult> {
  return withDbErrors(async () => {
    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);

    const [clash] = await db
      .select({ id: commissionCampaigns.id })
      .from(commissionCampaigns)
      .where(and(
        isNull(commissionCampaigns.endedEarlyAt),
        /* Araliklar kesisiyor mu: baslangic digerinin bitisinden once
           VE bitis digerinin baslangicindan sonra. */
        lte(commissionCampaigns.startsAt, ends),
        gt(commissionCampaigns.endsAt, starts),
      ))
      .limit(1);
    if (clash) return { ok: false as const, error: 'overlap' as const };

    const [row] = await db
      .insert(commissionCampaigns)
      .values({
        name: input.name.trim(),
        sitterPctPlatform: input.sitterPct.platform ?? null,
        sitterPctRepeat: input.sitterPct.repeat ?? null,
        sitterPctReferral: input.sitterPct.sitter_referral ?? null,
        startsAt: starts,
        endsAt: ends,
        createdBy: input.adminId,
      })
      .returning({ id: commissionCampaigns.id });

    await recordAudit(db, {
      actorId: input.adminId,
      action: 'settings.campaignCreated',
      entity: 'commission_campaign',
      entityId: row!.id,
      after: {
        name: input.name.trim(),
        sitterPct: input.sitterPct,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
      ...(input.ip ? { ip: input.ip } : {}),
    });

    return { ok: true as const, id: row!.id };
  });
}

/**
 * Kampanyayi ERKEN BITIRIR — silmez.
 *
 * O pencerede yapilmis rezervasyonlarin indirimli oldugu satirlarina
 * yazili; kampanya kaydi silinseydi "neden %10" sorusunun cevabi
 * kaybolurdu.
 */
export async function endCampaign(
  db: Database, input: { adminId: string; campaignId: string; ip?: string | undefined },
): Promise<void> {
  await withDbErrors(async () => {
    await db
      .update(commissionCampaigns)
      .set({ endedEarlyAt: new Date() })
      .where(and(
        eq(commissionCampaigns.id, input.campaignId),
        isNull(commissionCampaigns.endedEarlyAt),
      ));
  });
  await recordAudit(db, {
    actorId: input.adminId,
    action: 'settings.campaignEnded',
    entity: 'commission_campaign',
    entityId: input.campaignId,
    after: { endedEarlyAt: new Date().toISOString() },
    ...(input.ip ? { ip: input.ip } : {}),
  });
}

/** Panelde "son degisiklikler" — yalnizca ayar/kampanya kayitlari. */
export async function listCommissionAudit(db: Database, limit = 10): Promise<Array<{
  id: string; action: string; at: string; actorName: string | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null;
}>> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT a.id, a.action, a.created_at, a.before, a.after,
             p.first_name, p.last_name_initial
      FROM audit_log a
      LEFT JOIN profiles p ON p.user_id = a.actor_id
      WHERE a.action LIKE 'settings.%'
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      action: String(r.action),
      at: new Date(r.created_at as Date).toISOString(),
      actorName: r.first_name
        ? `${String(r.first_name)} ${String(r.last_name_initial ?? '')}.`.trim()
        : null,
      before: (r.before as Record<string, unknown> | null) ?? null,
      after: (r.after as Record<string, unknown> | null) ?? null,
    }));
  });
}
