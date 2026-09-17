'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { respondToReview } from '@/lib/data';

export type ReplyState = { error?: string | undefined; done?: boolean | undefined };

/**
 * YORUMA YANIT — hesap icindeki yorum sayfasindan.
 *
 * Ayni islem rezervasyon detayinda da var. YETKI IKISINDE DE AYNI
 * YERDE: `respondToReview` sorgusunun WHERE'i `subject_id`'yi oturumdaki
 * kisiyle esliyor ve yaniti yalnizca BIR KEZ kabul ediyor. Yani bu
 * ikinci giris yolu yeni bir yetki yuzeyi acmiyor — yalnizca ayni kapiya
 * ikinci bir tabela koyuyor.
 */
export async function replyToReviewAction(
  _prev: ReplyState, form: FormData,
): Promise<ReplyState> {
  const session = await getSession();
  if (!session) return { error: 'not_a_party' };

  const res = await respondToReview({
    reviewId: String(form.get('reviewId') ?? ''),
    subjectId: session.user.id,
    body: String(form.get('body') ?? ''),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/${String(form.get('locale') ?? 'en')}/account/reviews/`);
  return { done: true };
}
