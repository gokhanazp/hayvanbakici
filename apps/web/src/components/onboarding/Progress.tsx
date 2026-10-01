import Link from 'next/link';
import { ONBOARDING_STEPS, REQUIRED_STEPS, stepIndex, type OnboardingStep } from '@havre/core';
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

  /*
    YUZDE — tasarimdaki "Application Progress: 75% Completed" satiri.

    Payda ZORUNLU adimlar: ilerleme cubugu "yuzde kac kaldi" sorusunu
    cevapliyor ve istege bagli adimlari saymak, gonderebilecek durumda
    olan birine "hala %70'tesin" demek olurdu. Pay, TAMAMLANMIS zorunlu
    adim sayisi — gezinilen adim degil, bitirilen is.
  */
  const requiredSteps = ONBOARDING_STEPS.filter(
    (st) => (REQUIRED_STEPS as readonly string[]).includes(st),
  );
  const doneRequired = requiredSteps.filter((st) => completed[st]).length;
  const pct = requiredSteps.length === 0
    ? 0
    : Math.round((doneRequired / requiredSteps.length) * 100);

  return (
    <nav aria-label={m.onboarding.title} className="wizard-progress">
      <div className="wizard-progress-head">
        <p className="wizard-pct tabular">
          {interpolate(m.onboarding.progressPct, { pct })}
        </p>
        <p className="text-body-sm dim tabular" style={{ margin: 0 }}>
          {interpolate(m.onboarding.stepOf, { current: currentIndex + 1, total })}
        </p>
      </div>

      {/*
        CUBUK ARTIK GORUNMEZ — AMA DURUYOR.

        Onceden iki ayri sey ciziliyordu: ustte ince bir dolgu cubugu,
        altinda noktali bir durak sirasi. Ayni bilgiyi iki kez, iki
        farkli olcekte anlatiyorlardi ve karti gereksiz uzatiyorlardi.
        Referans tasarimda tek bir kalin ray var ve duraklar ONUN
        UZERINDE oturuyor; dolu kisim nerede bittiyse icinde bulunulan
        durak orada.

        Goruntuyu artik duraklari birlestiren cizgi tasiyor (CSS,
        .wizard-node::before). Bu oge ise EKRAN OKUYUCU icin kaliyor:
        yedi madde isareti dinlemek "yuzde 43" duymakla ayni sey degil.
        Silinemez, cunku o zaman ilerleme yalnizca GORSEL olarak
        anlatilmis olurdu.
      */}
      <div
        className="wizard-bar sr-only"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={m.onboarding.title}
      >
        <span style={{ width: `${pct}%` }} />
      </div>

      <ol className="wizard-track">
        {ONBOARDING_STEPS.map((step, i) => {
          const label = m.onboarding[`step.${step}` as keyof Messages['onboarding']] as string;
          const isCurrent = step === current;
          const optional = step !== 'review' && !(REQUIRED_STEPS as readonly string[]).includes(step);
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
              <span className="wizard-name">
                {label}
                {/*
                  ZORUNLU OLMAYAN ADIM ACIKCA ISARETLI.

                  Ilerleme "7 adim" diyordu ama gonderim icin BESI
                  yetiyor: fotograf istege bagli (elinde iyi bir kare
                  olmayan birini adli sicil adimina bile sokmamak,
                  arzi kaybetmenin en sessiz yolu) ve son adim zaten
                  ozet. Sayiyi degistirmek yerine istisnayi yaziyoruz:
                  yedi kutu goren biri yedisini de zorunlu saniyordu.
                */}
                {optional && <span className="wizard-optional"> · {m.onboarding.optional}</span>}
              </span>
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
