import { describe, it, expect } from 'vitest';
import { DATA_URL } from './photos';

describe('photo data URLs', () => {
  it('accepts jpeg/png/webp base64 only', () => {
    expect(DATA_URL.test('data:image/jpeg;base64,QUJD')).toBe(true);
    expect(DATA_URL.test('data:image/png;base64,QUJD==')).toBe(true);
    expect(DATA_URL.test('data:image/webp;base64,QUJD')).toBe(true);
    expect(DATA_URL.test('data:text/html;base64,QUJD')).toBe(false);
    expect(DATA_URL.test('data:image/svg+xml;base64,QUJD')).toBe(false);
    expect(DATA_URL.test('https://evil.example/x.jpg')).toBe(false);
  });
});
