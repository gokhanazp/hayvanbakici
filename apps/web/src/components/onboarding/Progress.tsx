import Link from 'next/link';
import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from '@havre/core';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';

/**
 * Adim gostergesi.
 *
 * Tamamlanmis adimlar BAGLANTI, gelecek adimlar degil — bakici ileri
 * atlayip yarim veri birakamasin diye. Tamamlananlara donmek serbest:
 * "yanlis yazdim" durumu onboarding'de en sik gorulen ihtiyac.
 */
export function Progress({
  locale, current, completed,
}: {
  locale: Locale;
  current: OnboardingStep;
  completed: Record<OnboardingStep, boolean>;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const currentIndex = stepIndex(current);

  return (
    <nav aria-label={m.onboarding.title} className="stack" style={{ marginBottom: 'var(--space-8)' }}>
      <p className="text-body-sm dim tabular">
        {interpolate(m.onboarding.stepOf, { current: currentIndex + 1, total: ONBOARDING_STEPS.length })}
      </p>
      <ol className="wizard-steps">
        {ONBOARDING_STEPS.map((step, i) => {
          const label = m.onboarding[`step.${step}` as keyof Messages['onboarding']] as string;
          const isCurrent = step === current;
          const reachable = completed[step] || i <= currentIndex;

          return (
            <li key={step} className={`wizard-step${isCurrent ? ' wizard-step-current' : ''}`}>
              {reachable && !isCurrent ? (
                <Link href={`/${seg}/become-a-sitter/${step}/`}>{label}</Link>
              ) : (
                <span aria-current={isCurrent ? 'step' : undefined}>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
