'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@havre/auth/client';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { Avatar } from '@/components/Avatar';
import { chatStamp } from '@/lib/format';
import { askSitterAction, sendMessageAction } from '@/app/[locale]/account/messages/actions';
import { ASK_EVENT, type AskDetail } from '@/components/chat/AskInChat';
import type { ConversationRow } from '@/components/ConversationList';

/**
 * SAG ALTTA DURAN SOHBET.
 *
 * NEDEN VAR: sahibin sorusu bakiciya BAKARKEN doguyor. "Mesajlar
 * sayfasina git, kisiyi bul, yaz" akisinda o soru cogu zaman hic
 * sorulmuyor. Balon acikken kullanici aramaya devam edebiliyor.
 *
 * GELEN KUTUSU SAYFASI HALA ASIL YER: uzun yazismalar, paylasilabilir
 * adresler, genis ekran. Balon onun yerini almiyor — nitekim o
 * sayfadayken HIC cizilmiyor (iki ayni liste yan yana dururdu).
 *
 * VERI TEK KAYNAKTAN: /api/messages/list ve /api/messages/thread, gelen
 * kutusuyla AYNI sorgulari kullaniyor; gonderme de ayni sunucu eylemi.
 * Ikinci bir mesajlasma uygulamasi yazmiyoruz.
 */

interface ThreadMsg {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  redacted: boolean;
}

interface ThreadData {
  id: string;
  counterpartFirstName: string;
  counterpartInitial: string;
  counterpartAvatarUrl: string | null;
  counterpartSuspended: boolean;
  messages: ThreadMsg[];
}

/*
  YOKLAMA ARALIKLARI — HER GIRIS YAPMIS KULLANICI ICIN SURUYOR.

  Bu iki sayi, sunucuya giden istek sayisini dogrudan belirliyor ve
  kullanici sayisiyla CARPILIYOR: 100 kisi acikken 10 saniyelik bir
  aralik dakikada 600 istek demek. Her istek bir fonksiyon cagrisi ve
  bir veritabani sorgusu.

  Rozet 30 saniyede bir tazeleniyor: okunmamis sayisinin 10 saniye
  once mi 30 saniye once mi hesaplandigi kimsenin fark ettigi bir sey
  degil.

  Acik yazisma 6 saniyeyle basliyor (sohbet hissi burada) ama SESSIZ
  GECEN HER TURDA yavasliyor, 30 saniyeye kadar. Yeni mesaj gelince
  ya da kullanici yazmaya baslayinca yeniden 6 saniyeye donuyor.
  Acik unutulmus bir sohbet, konusulan bir sohbet kadar maliyetli
  olmamali.

  Sekme gorunmuyorsa istek zaten HIC atilmiyor (asagida).
*/
const PING_MS = 30_000;
const THREAD_MS = 6000;
const THREAD_MAX_MS = 30_000;
const OPEN_KEY = 'havre.chat.open';
const CONV_KEY = 'havre.chat.conv';

/* Tarayici deposu gizli sekmede hata atabiliyor; sohbet bu yuzden
   acilmamali. Okuma ve yazma sarmalanmis. */
function remember(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch { /* depolama kapali */ }
}
function recall(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function ChatDock({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const path = usePathname();
  const { data: session } = authClient.useSession();

  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ConversationRow[]>([]);
  /* Liste HENUZ GELMEDIYSE "hic konusma yok" DEMEYIZ. Ilk surumde bos
     durum aninda cikiyor, yarim saniye sonra listeye donuyordu — ekran
     bilmedigi bir seyi soyluyordu. */
  const [loaded, setLoaded] = useState(false);
  const [unread, setUnread] = useState(0);
  const [convId, setConvId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState('');
  /* Yazisma HENUZ YOK: profilden gelen ilk soru. Konusma ancak mesaj
     gonderilince aciliyor (bos konusma kaydi birakmiyoruz). */
  const [ask, setAsk] = useState<AskDetail | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeen = useRef<string | null>(null);

  /*
    BALONUN GORUNMEDIGI YERLER.

    - Gelen kutusu: sayfanin kendisi zaten yazisma (bkz. dosya basi).
    - BASVURU SIHIRBAZI: on bes dakikalik bir formun sag alt kosesinde
      duran balon, telefonda "Devam" dugmesinin ustune biniyor ve
      dikkat dagitiyor. Basvuru sirasinda bakicinin isi tek: formu
      bitirmek. Mesajlari basvurudan sonra da okuyabilir.
  */
  const hidden = path.includes('/account/messages')
    || path.includes('/become-a-sitter/');

  const loadList = useCallback(async () => {
    try {
      const r = await fetch('/api/messages/list', { cache: 'no-store' });
      if (!r.ok) return;
      const j = (await r.json()) as { rows: ConversationRow[] };
      setRows(j.rows);
      setLoaded(true);
    } catch { /* ag koptu; bir sonraki turda */ }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/messages/thread?c=${id}`, { cache: 'no-store' });
      if (!r.ok) { setConvId(null); setThread(null); return; }
      const j = (await r.json()) as { thread: ThreadData };
      setThread(j.thread);
      lastSeen.current = j.thread.messages[j.thread.messages.length - 1]?.createdAt ?? null;
      /* Sunucu okundu isaretledi; listedeki rozeti beklemeden dusur. */
      setRows((cur) => cur.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
    } catch { /* sessiz */ }
  }, []);

  /* Okunmamis sayaci — rozet bunun icin, balon kapaliyken de calisiyor. */
  useEffect(() => {
    if (!session || hidden) return;
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/messages/ping', { cache: 'no-store' });
        if (!r.ok) return;
        const j = (await r.json()) as { unread: number };
        if (alive) setUnread(j.unread);
      } catch { /* sessiz */ }
    };
    void tick();
    const t = setInterval(tick, PING_MS);
    return () => { alive = false; clearInterval(t); };
  }, [session, hidden]);

  /* Acik yazismayi tazele — YALNIZCA yeni mesaj varsa yeniden cek.
     Sessiz gecen her turda aralik uzuyor (6 sn -> 30 sn); yeni mesaj
     gelince basa donuyor. */
  useEffect(() => {
    if (!open || !convId) return;
    let alive = true;
    let delay = THREAD_MS;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch(`/api/messages/ping?c=${convId}`, { cache: 'no-store' });
          if (r.ok) {
            const j = (await r.json()) as { lastAt: string | null; unread: number };
            if (!alive) return;
            setUnread(j.unread);
            if (j.lastAt && (!lastSeen.current || j.lastAt > lastSeen.current)) {
              delay = THREAD_MS; // konusma canlandi
              await loadThread(convId);
              void loadList();
            } else {
              delay = Math.min(delay * 2, THREAD_MAX_MS);
            }
          }
        } catch { /* sessiz */ }
      }
      if (alive) timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, delay);
    return () => { alive = false; clearTimeout(timer); };
  }, [open, convId, loadThread, loadList]);

  /* Acilista liste, hatirlanan konusma varsa o da */
  useEffect(() => {
    if (!open) return;
    void loadList();
    if (convId) void loadThread(convId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Sekme boyunca hatirla: sayfa degistirince sohbet kapanmasin */
  useEffect(() => {
    if (!session) return;
    if (recall(OPEN_KEY) === '1') setOpen(true);
    const saved = recall(CONV_KEY);
    if (saved) setConvId(saved);
  }, [session]);

  /*
    DEPOYA YALNIZCA KULLANICI EYLEMIYLE YAZIYORUZ.
    Ilk denemede bu iki satir birer `useEffect` idi ve ilk cizimde
    (oturum daha gelmeden, open=false iken) hatirlanan degeri SILIYORDU;
    sonuc olarak sayfa degistirince sohbet hep kapaniyordu. Yazma, acma
    ve kapama anina bagli.
  */
  const toggleOpen = useCallback((next: boolean) => {
    setOpen(next);
    remember(OPEN_KEY, next ? '1' : null);
  }, []);

  const pickConversation = useCallback((id: string | null) => {
    setConvId(id);
    remember(CONV_KEY, id);
    if (id) void loadThread(id); else setThread(null);
  }, [loadThread]);

  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [thread?.messages.length, convId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    if (!q) return rows;
    return rows.filter((c) =>
      `${c.counterpartFirstName} ${c.counterpartInitial}`.toLocaleLowerCase(locale).includes(q));
  }, [rows, query, locale]);

  const submit = useCallback(async () => {
    if (!convId || body.trim().length === 0 || sending) return;
    setSending(true);
    const form = new FormData();
    form.set('conversationId', convId);
    form.set('body', body);
    form.set('locale', seg);
    try {
      const res = await sendMessageAction({}, form);
      if (!res.error) {
        setBody('');
        await loadThread(convId);
        void loadList();
      }
    } finally {
      setSending(false);
    }
  }, [convId, body, sending, seg, loadThread, loadList]);

  const submitAsk = useCallback(async () => {
    if (!ask || body.trim().length === 0 || sending) return;
    setSending(true);
    setAskError(null);
    const form = new FormData();
    form.set('sitterId', ask.sitterId);
    form.set('body', body);
    /* Eylem TAM yerel kodu bekliyor ('en-CA'), segmenti degil. */
    form.set('locale', locale);
    try {
      const res = await askSitterAction({}, form);
      if (res.error) { setAskError(res.error); return; }
      setBody('');
      setAsk(null);
      /* Sunucu konusma kimligini donduruyor: panel hicbir yere gitmeden
         dogrudan yeni yazismaya geciyor. */
      if (res.conversationId) pickConversation(res.conversationId);
      void loadList();
    } finally {
      setSending(false);
    }
  }, [ask, body, sending, locale, pickConversation, loadList]);

  /*
    PROFILDEKI "SORU SOR" DUGMESINI DINLE.

    Dinleyici, bilesen ekrana HIC cizilmese de kuruluyor (kancalar
    erken donusten once calisiyor) — ama isi yalnizca panel gercekten
    calisabilecek durumdaysa ustleniyor. Ustlenmezse `preventDefault`
    cagrilmiyor ve baglanti eski /ask/ sayfasina gidiyor: giris
    yapmamis ziyaretci oradan giris ekranina, kendi profiline bakan
    bakici da oradan profiline donuyor.
  */
  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<AskDetail>).detail;
      if (!session || hidden) return;
      if (session.user.id === detail.sitterId) return;
      e.preventDefault();
      setAsk(detail);
      setAskError(null);
      setBody('');
      pickConversation(null);
      toggleOpen(true);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, [session, hidden, pickConversation, toggleOpen]);

  const askErrorText = askError
    ? (m.messages[`error.${askError}` as keyof typeof m.messages] as string | undefined)
    : undefined;

  if (!session || hidden) return null;

  return (
    <div className="chat-dock" data-open={open ? 'true' : 'false'}>
      {open && (
        <section className="chat-panel" data-view={ask ? 'ask' : thread ? 'thread' : 'list'}
                 aria-label={m.messages.dockTitle}>
          <header className="chat-panel-head">
            {ask ? (
              <>
                <button type="button" className="chat-icon-btn" aria-label={m.messages.dockBack}
                        onClick={() => { setAsk(null); setAskError(null); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <Avatar src={ask.avatarUrl} size={28} initials={ask.initials} />
                <span className="chat-title">
                  {interpolate(m.messages.askTitle, { name: ask.firstName })}
                </span>
              </>
            ) : thread ? (
              <>
                <button type="button" className="chat-icon-btn" aria-label={m.messages.dockBack}
                        onClick={() => pickConversation(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <Avatar
                  src={thread.counterpartAvatarUrl} size={28}
                  initials={`${thread.counterpartFirstName.slice(0, 1)}${thread.counterpartInitial}`}
                />
                <span className="chat-title">
                  {thread.counterpartFirstName} {thread.counterpartInitial}.
                </span>
              </>
            ) : (
              <span className="chat-title">{m.messages.dockTitle}</span>
            )}
            <button type="button" className="chat-icon-btn" aria-label={m.messages.dockClose}
                    onClick={() => toggleOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          {ask ? (
            <>
              <div className="chat-scroll">
                {askErrorText && <p className="alert alert-error" role="alert">{askErrorText}</p>}
                <p className="field-hint">{m.messages.askLead}</p>
              </div>
              <form
                className="chat-composer"
                onSubmit={(e) => { e.preventDefault(); void submitAsk(); }}
              >
                <textarea
                  value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder={m.messages.askPlaceholder} rows={1} maxLength={2000}
                  aria-label={m.messages.askPlaceholder}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void submitAsk();
                    }
                  }}
                />
                <button type="submit" className="btn btn-primary"
                        disabled={sending || body.trim().length === 0}>
                  {sending ? m.messages.sending : m.messages.send}
                </button>
              </form>
            </>
          ) : thread ? (
            <>
              <div className="chat-scroll" ref={scrollRef}>
                {thread.counterpartSuspended && (
                  <p className="field-hint">{m.messages.counterpartSuspended}</p>
                )}
                {thread.messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble-row${msg.mine ? ' is-mine' : ''}`}>
                    <div className="chat-bubble">
                      <p style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                      <p className="chat-bubble-meta tabular">
                        {chatStamp(msg.createdAt, locale)}
                        {msg.redacted && <span className="dim"> · {m.messages.redactedShort}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                className="chat-composer"
                onSubmit={(e) => { e.preventDefault(); void submit(); }}
              >
                <textarea
                  value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder={m.messages.placeholder} rows={1} maxLength={2000}
                  aria-label={m.messages.placeholder}
                  onKeyDown={(e) => {
                    /* Enter gonderir, Shift+Enter satir atlar: sohbette
                       beklenen davranis bu. Gelen kutusundaki genis yazma
                       alaninda ise Enter satir atliyor — orada uzun metin
                       yaziliyor. */
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                />
                <button type="submit" className="btn btn-primary"
                        disabled={sending || body.trim().length === 0}>
                  {sending ? m.messages.sending : m.messages.send}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="chat-search">
                <input
                  value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={m.messages.dockSearch} aria-label={m.messages.dockSearch}
                />
              </div>
              <div className="chat-scroll">
                {!loaded ? (
                  <p className="field-hint">{m.messages.dockLoading}</p>
                ) : rows.length === 0 ? (
                  <p className="field-hint">{m.messages.dockEmpty}</p>
                ) : filtered.length === 0 ? (
                  <p className="field-hint">{m.messages.dockNoMatch}</p>
                ) : (
                  <ul className="chat-people">
                    {filtered.map((c) => (
                      <li key={c.id}>
                        <button type="button" className="chat-person"
                                onClick={() => pickConversation(c.id)}>
                          <Avatar
                            src={c.counterpartAvatarUrl} size={36}
                            initials={`${c.counterpartFirstName.slice(0, 1)}${c.counterpartInitial}`}
                          />
                          <span className="chat-person-body">
                            <span className="chat-person-top">
                              <span style={{ fontWeight: 600 }}>
                                {c.counterpartFirstName} {c.counterpartInitial}.
                              </span>
                              {c.lastMessageAt && (
                                <span className="dim text-body-sm tabular">
                                  {chatStamp(c.lastMessageAt, locale)}
                                </span>
                              )}
                            </span>
                            <span className="chat-person-last line-clamp-1">
                              {c.lastMessage ?? m.messages.noMessagesYet}
                            </span>
                          </span>
                          {c.unread > 0 && <span className="inbox-count">{c.unread}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <footer className="chat-foot">
                <Link href={`/${seg}/account/messages/`} className="text-body-sm">
                  {m.messages.dockOpenFull} →
                </Link>
              </footer>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        className="chat-launcher"
        aria-label={open ? m.messages.dockClose : m.messages.dockOpen}
        aria-expanded={open}
        onClick={() => toggleOpen(!open)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 13.5a2 2 0 0 1-2 2H8l-4 3.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="chat-launcher-badge" aria-hidden="true">{unread}</span>
        )}
      </button>
    </div>
  );
}
