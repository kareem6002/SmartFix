import { describe, it, expect } from 'vitest';
import { en } from './en'; import { ar } from './ar';
import { DICTS, errorMessage, format, yearsText } from './core';
import { STORY } from '../comic/story';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

describe('translations', () => {
  it('Arabic has exactly the same keys as English', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });
  it('every Arabic string keeps the same {placeholders}', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect([k, vars(ar[k])]).toEqual([k, vars(en[k])]);
  });
  it('no translation is empty', () => {
    for (const lang of ['en', 'ar'] as const) for (const [k, v] of Object.entries(DICTS[lang])) expect([lang, k, v.trim().length > 0]).toEqual([lang, k, true]);
  });
  it('formats placeholders', () => expect(format('Hi {name}', { name: 'Sara' })).toBe('Hi Sara'));
  it('Arabic year plurals', () => {
    expect(yearsText('ar', 1)).toBe('سنة واحدة من الخبرة'); expect(yearsText('ar', 2)).toBe('سنتان من الخبرة');
    expect(yearsText('ar', 8)).toBe('8 سنوات من الخبرة'); expect(yearsText('ar', 12)).toBe('12 سنة من الخبرة'); expect(yearsText('en', 1)).toBe('1 year experience');
  });
  it('translates server errors', () => {
    expect(errorMessage('ar', 'Invalid email or password')).toBe(ar['err.badLogin']);
    expect(errorMessage('en', 'Email already registered')).toBe(en['err.emailTaken']);
    expect(errorMessage('ar', 'This account is not a technician account. Go back and choose the right role.')).toContain('فني');
    expect(errorMessage('ar', 'phone: Enter a valid phone number')).toBe(ar['err.phone']);
    expect(errorMessage('en', 'something unknown')).toBe('something unknown');
  });
});

describe('comic story', () => {
  const roles = Object.keys(STORY) as (keyof typeof STORY)[];
  it('has 3 comics of 3 panels for every role', () => {
    expect([...roles].sort()).toEqual(['admin', 'company', 'customer', 'engineer', 'technician']);
    for (const r of roles) { expect(STORY[r]).toHaveLength(3); for (const pg of STORY[r]) expect(pg.panels).toHaveLength(3); }
  });
  it('every bubble fills exactly the placeholders it uses, in both languages', () => {
    for (const r of roles) for (const pg of STORY[r]) for (const p of pg.panels) for (const b of p.bubbles)
      for (const lang of ['en', 'ar'] as const) {
        const used = [...DICTS[lang][b.k].matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
        expect([r, b.k, lang, used]).toEqual([r, b.k, lang, 'abc'.slice(0, (b.v ?? []).length).split('').join(',')]);
      }
  });
  it('duo panels have two characters and two bubbles', () => {
    for (const r of roles) for (const pg of STORY[r]) for (const p of pg.panels) if (p.kind === 'duo') { expect(Array.isArray(p.who)).toBe(true); expect(p.bubbles).toHaveLength(2); }
  });
});
