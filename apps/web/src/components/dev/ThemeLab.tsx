'use client';

import { useEffect, useState } from 'react';
import { THEMES, type ThemeId } from './themes';

/**
 * GECICI TASARIM DENEME DUGMESI.
 *
 * Sadece `npm run dev` icinde: uretim derlemesinde hic yer kaplamiyor
 * (layout icindeki NODE_ENV kontrolu sabit olarak eleniyor).
 *
 * Isi: sag altta bir dugme kumesi. Secilen yonun CSS degiskenleri
 * <style> olarak sayfaya yaziliyor, secim localStorage'da kaliyor —
 * yani sayfalar arasinda gezerken kaybolmuyor, gercek siteyi gercek
 * yonlerde gezebiliyorsun.
 *
 * SECILDIGINDE SILINECEK: yonlerden biri kabul edilince tokens
 * paketine gercek olarak islenir, bu klasor ve public/dev-fonts kalkar.
 */
const KEY = 'havre-theme-lab';

export function ThemeLab() {
  const [id, setId] = useState<ThemeId>('now');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) setId(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(KEY, id);
    const found = THEMES.find((t) => t.id === id);
    let el = document.getElementById('theme-lab-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'theme-lab-style';
      document.head.appendChild(el);
    }
    el.textContent = found?.css ?? '';
  }, [id]);

  const current = THEMES.find((t) => t.id === id);

  return (
    <div className="theme-lab">
      <button
        type="button"
        className="theme-lab-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="theme-lab-dots" aria-hidden="true">
          {current?.swatch.map((c) => <i key={c} style={{ background: c }} />)}
        </span>
        {current?.name ?? 'Tema'}
      </button>

      {open && (
        <div className="theme-lab-body">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-lab-item${t.id === id ? ' is-on' : ''}`}
              onClick={() => setId(t.id)}
            >
              <span className="theme-lab-dots" aria-hidden="true">
                {t.swatch.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span className="theme-lab-text">
                <b>{t.name}</b>
                <small>{t.note}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
