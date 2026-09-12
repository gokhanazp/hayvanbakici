import { getMessages, type Locale } from '@havre/i18n';
import { calculateQuote, type QuoteInput } from '@havre/core';
import { money } from '@/lib/format';

/**
 * FIYAT DOKUMU.
 * Competition Act (yol haritasi §8.6): DRIP PRICING YASAK.
 * Zorunlu tum ucretler ilk gosterilen fiyata dahildir; gizli kalem yoktur.
 * Yalnizca GST/HST ayri satirda gosterilebilir.
 */
export function PriceBreakdown({ input, locale }: { input: QuoteInput; locale: Locale }) {
  const q = calculateQuote(input);
  const m = getMessages(locale);
  const ownerLines = q.lines.filter((l) => l.side === 'owner');

  return (
    <div className="card card-pad">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <tbody>
          {ownerLines.map((line) => (
            <tr key={line.key}>
              <td style={{ padding: 'var(--space-2) 0' }}>
                {m.quote[line.key.split('.')[1] as keyof typeof m.quote]}
              </td>
              <td className="tabular" style={{ textAlign: 'right' }}>
                {money(line.amountCents, locale)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="dim" style={{ padding: 'var(--space-2) 0' }}>{m.quote.tax}</td>
            <td className="tabular dim" style={{ textAlign: 'right' }}>{money(q.ownerTaxCents, locale)}</td>
          </tr>
          <tr style={{ borderTop: '1px solid var(--color-border)' }}>
            <th scope="row" style={{ padding: 'var(--space-3) 0', textAlign: 'left' }}>{m.quote.total}</th>
            <td className="tabular text-h4" style={{ textAlign: 'right' }}>{money(q.ownerTotalCents, locale)}</td>
          </tr>
        </tbody>
      </table>

      <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>{m.quote.allFeesIncluded}</p>

      {/* Bakiciya seffaflik: hangi komisyon, neden */}
      <p
        className="text-body-sm"
        style={{
          marginTop: 'var(--space-3)', padding: 'var(--space-3)',
          background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-md)',
        }}
      >
        {m.commission[q.commission.attribution]}
      </p>
    </div>
  );
}
