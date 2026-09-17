import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import type { ProvinceCode } from '@havre/core';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { PricingForm } from '@/components/PricingForm';
import {
  getCommission, getOnboardingState, getSitterStatus, isAdmin, servicePriceRanges, unreadCount,
} from '@/lib/data';
import { savePricesAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * UCRETLER SAYFASI.
 *
 * Bakici ucretlerini yalnizca BASVURU SIHIRBAZINDA belirleyebiliyordu ve
 * sonradan degistirmenin tek yolu o sihirbaza geri donmekti: ust bandinda
 * "Adim 3 / 6", sonunda "Basvurumu gonder" yazan bir akis. Zaten yayinda
 * olan bir bakici icin hem yanlis hem urkutucu. Bir pazar yerinde fiyat
 * degistirmek istisna degil, rutin bir istir ve kendi ekranini hak eder.
 */
export default async function PricesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/sitter/prices/`);

  const sitterStatus = await getSitterStatus(session.user.id);
  if (!sitterStatus) redirect(`/${seg}/become-a-sitter/`);

  const m = getMessages(locale);
  const segment = segmentFor(locale);
  const [state, admin, unread, commission] = await Promise.all([
    getOnboardingState(session.user.id), isAdmin(session.user.id),
    unreadCount(session.user.id), getCommission(),
  ]);
  if (!state) notFound();

  /* Fiyat onerisi yalnizca sehir biliniyorsa anlamli. */
  const ranges = state.cityId ? await servicePriceRanges(state.cityId) : {};

  return (
    <AccountShell
      locale={locale}
      title={m.prices.title}
      lead={m.prices.lead}
      active="prices"
      isSitter
      sitterStatus={sitterStatus}
      isAdmin={admin}
      unread={unread}
    >
      {state.services.length === 0 ? (
        /* Hizmeti olmayan birine bos bir fiyat formu gostermek yerine,
           eksik olan adima gonderiyoruz. */
        <div className="card card-pad" style={{ maxWidth: '36rem' }}>
          <h2 className="text-h4">{m.prices.noServices}</h2>
          <Link
            href={`/${segment}/become-a-sitter/services/`}
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-5)' }}
          >
            {m.prices.addService}
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth: '44rem' }}>
          <PricingForm
            locale={locale}
            rows={state.services}
            ranges={ranges}
            province={(state.province as ProvinceCode | null) ?? null}
            promoEndsAt={state.promoEndsAt}
            commission={commission.config}
            action={savePricesAction}
            setupHref={`/${segment}/become-a-sitter/services/`}
          />
        </div>
      )}
    </AccountShell>
  );
}
