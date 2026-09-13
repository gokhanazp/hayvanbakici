import { getAuth } from '@havre/auth';

/**
 * Kimlik uc noktalari: /api/auth/*
 *
 * NEDEN [locale] DISINDA: cerezler yola gore kapsamlanir. Uc nokta
 * /en/... altinda olsaydi Fransizca tarafta oturum gorunmezdi.
 * Kimlik dilden bagimsiz; ARAYUZ dilli, UC NOKTA degil.
 *
 * NEDEN force-dynamic: her istek cerez okuyup yaziyor; onbellege alinamaz.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function handler(req: Request): Promise<Response> {
  return getAuth().handler(req);
}

export { handler as GET, handler as POST };
