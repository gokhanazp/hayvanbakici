import Link from 'next/link';
import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from '@havre/core';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';

/**
 * ADIM GOSTERGESI.
 *
 * Once yan yana duran hap seklinde etiketlerdi; alti tanesi iki satira
 * sariyor ve hangisinde oldugunuz ancak renkten anlasiliyordu — ilerleme
 * HISSI yoktu. Simdi cizgi uzerinde numarali duraklar: tamamlananlarda
 * onay isareti, icinde bulunulan buyuk ve isimli.
 *
 * Tamamlanmis adimlar BAGLANTI, gelecek adimlar degil — bakici ileri
 * atlayip yarim veri birakamasin diye. Tamamlananlara donmek serbest:
 * "yanlis yazdim" onboarding'de en sik gorulen ihtiyac.
 *
 * Dar ekranda duraklarin adlari gizleniyor (CSS), yalnizca numaralar ve
 * "Adim 2 / 6" satiri kaliyor: alti ad telefonda okunamayacak kadar kucuk
 * olurdu.
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
  const total = ONBOARDING_STEPS.length;

  return (
    <nav aria-label={m.onboarding.title} className="wizard-progress">
      <p className="text-body-sm dim tabular">
        {interpolate(m.onboarding.stepOf, { current: currentIndex + 1, total })}
      </p>

      <ol className="wizard-track">
        {ONBOARDING_STEPS.map((step, i) => {
          const label = m.onboarding[`step.${step}` as keyof Messages['onboarding']] as string;
          const isCurrent = step === current;
          const isDone = completed[step] && !isCurrent;
          const reachable = completed[step] || i < currentIndex;

          const inner = (
            <>
              <span className="wizard-dot" aria-hidden="true">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 8.4 3.2 3.2L13 4.8" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="wizard-name">{label}</span>
            </>
          );

          return (
            <li
              key={step}
              className={`wizard-node${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}
            >
              {reachable && !isCurrent ? (
                <Link href={`/${seg}/become-a-sitter/${step}/`}>{inner}</Link>
              ) : (
                <span aria-current={isCurrent ? 'step' : undefined}>{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
