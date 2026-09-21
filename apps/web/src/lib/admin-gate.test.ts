import { describe, expect, it } from 'vitest';
import { adminGate, clientIp, ipAllowed, isAdminPath, parseAllowlist } from './admin-gate.js';

const headers = (h: Record<string, string>) => ({
  get: (n: string) => h[n.toLowerCase()] ?? null,
});

describe('clientIp', () => {
  it('x-forwarded-for icindeki ILK adresi alir', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '24.114.0.1, 10.0.0.7' }))).toBe('24.114.0.1');
  });

  it('IPv4-eslenmis IPv6 adresini sadelestirir', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '::ffff:24.114.0.1' }))).toBe('24.114.0.1');
  });

  it('x-forwarded-for yoksa x-real-ip', () => {
    expect(clientIp(headers({ 'x-real-ip': '1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('hicbiri yoksa null', () => {
    expect(clientIp(headers({}))).toBeNull();
  });
});

describe('ipAllowed', () => {
  const list = parseAllowlist('24.114.0.1, 10.0.0.0/8, 2001:db8::1');

  it('birebir eslesme', () => expect(ipAllowed('24.114.0.1', list)).toBe(true));
  it('CIDR icinde', () => expect(ipAllowed('10.3.9.200', list)).toBe(true));
  it('CIDR disinda', () => expect(ipAllowed('11.0.0.1', list)).toBe(false));
  it('IPv6 birebir', () => expect(ipAllowed('2001:db8::1', list)).toBe(true));
  it('adres yoksa gecmez', () => expect(ipAllowed(null, list)).toBe(false));

  it('/32 tek adrestir, /24 komsulari da alir', () => {
    expect(ipAllowed('192.168.1.9', parseAllowlist('192.168.1.5/32'))).toBe(false);
    expect(ipAllowed('192.168.1.9', parseAllowlist('192.168.1.5/24'))).toBe(true);
  });

  it('bozuk girdi sessizce ATLANIR, listeyi gecersiz kilmaz', () => {
    const l = parseAllowlist('bozuk/99, 24.114.0.1');
    expect(ipAllowed('24.114.0.1', l)).toBe(true);
    expect(ipAllowed('9.9.9.9', l)).toBe(false);
  });
});

describe('adminGate', () => {
  it('gelistirmede kapi devrede degil', () => {
    const r = adminGate({ ip: null, allowlist: undefined, allowAny: undefined, isProduction: false });
    expect(r).toEqual({ ok: true, reason: 'development' });
  });

  it('URETIMDE AYAR YOKSA PANEL KAPALI', () => {
    const r = adminGate({ ip: '24.114.0.1', allowlist: undefined, allowAny: undefined, isProduction: true });
    expect(r).toEqual({ ok: false, reason: 'no_allowlist' });
  });

  it('liste doluysa yalnizca listedekiler', () => {
    const base = { allowlist: '24.114.0.1', allowAny: undefined, isProduction: true };
    expect(adminGate({ ...base, ip: '24.114.0.1' }).ok).toBe(true);
    expect(adminGate({ ...base, ip: '8.8.8.8' }).ok).toBe(false);
  });

  it('ADMIN_ALLOW_ANY_IP=1 bilerek acilmis kapidir', () => {
    const r = adminGate({ ip: null, allowlist: '', allowAny: '1', isProduction: true });
    expect(r).toEqual({ ok: true, reason: 'explicitly_open' });
  });

  it('liste VARSA allowAny onu gecersiz kilmaz', () => {
    const r = adminGate({ ip: '8.8.8.8', allowlist: '24.114.0.1', allowAny: '1', isProduction: true });
    expect(r.ok).toBe(false);
  });
});

describe('isAdminPath', () => {
  it('/admin ve alti', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/users/')).toBe(true);
  });
  it('benzeyen ama baska olan yollar degil', () => {
    expect(isAdminPath('/en/administrator/')).toBe(false);
    expect(isAdminPath('/adminx')).toBe(false);
  });
});
