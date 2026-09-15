import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { PetCard } from '@/components/PetCard';
import { PetPhoto } from '@/components/PetPhoto';
import { AddPet, EditPet } from '@/components/PetManager';
import { PetDelete } from '@/components/PetForm';
import { getAccountSummary, isAdmin, listOwnerPets } from '@/lib/data';
import { MAX_PETS } from '@havre/db';

export const dynamic = 'force-dynamic';

/**
 * HAYVANLARIM.
 *
 * Bugune kadar bu ekran YOKTU. Hayvanlar yalnizca rezervasyon formunun
 * icinde yaratilabiliyor, yaratildiktan sonra hicbir yerde
 * gorulemiyordu: adi yanlis yazan duzeltemiyor, fotograf ekleyemiyor,
 * artik yasamayan bir hayvani listeden cikaramiyordu.
 *
 * Bir kez doldurulan bilgi her rezervasyon talebinde yeniden
 * kullaniliyor — bu sayfanin asil degeri o.
 */
export default async function PetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/pets/`);

  const [me, admin, pets] = await Promise.all([
    getAccountSummary(session.user.id),
    isAdmin(session.user.id),
    listOwnerPets(session.user.id),
  ]);
  if (!me) notFound();

  const m = getMessages(locale);

  return (
    <AccountShell
      locale={locale}
      title={m.pets.title}
      lead={m.pets.lead}
      active="pets"
      isSitter={me.sitter !== null}
      sitterStatus={me.sitter?.status ?? null}
      isAdmin={admin}
      unread={me.counts.unreadMessages}
    >
      <div className="stack" style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: '48rem' }}>
        {pets.length === 0 && (
          <div className="card card-muted" style={{ padding: 'var(--space-8)' }}>
            <p className="text-body-lg" style={{ margin: 0 }}>{m.pets.empty}</p>
            <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.pets.emptyHint}</p>
          </div>
        )}

        {pets.map((pet) => (
          <section key={pet.id} className="pet-row">
            <PetCard
              pet={pet} locale={locale}
              actions={
                <>
                  <PetPhoto
                    locale={locale} petId={pet.id} name={pet.name}
                    photoUrl={pet.photoUrl} showAvatar={false}
                  />
                  <EditPet locale={locale} pet={pet} />
                  <PetDelete locale={locale} pet={pet} />
                </>
              }
            />
          </section>
        ))}

        {pets.length < MAX_PETS ? (
          <AddPet locale={locale} />
        ) : (
          <p className="field-hint">{interpolate(m.pets.maxReached, { max: String(MAX_PETS) })}</p>
        )}

        <p className="muted text-body-sm">
          {m.pets.privacyNote}{' '}
          <Link href={`/${seg}/legal/privacy/`}>{m.footer.privacy.toLowerCase()}</Link>
        </p>
      </div>
    </AccountShell>
  );
}
