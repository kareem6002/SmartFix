import { describe, it, expect } from 'vitest';
import { fitWithin } from './imageTools';
import { quickSlots, toLocalInput } from './datetime';

describe('fitWithin', () => {
  it('scales the longest side down to the limit, keeping the ratio', () => expect(fitWithin(4000, 3000, 1280)).toEqual({ w: 1280, h: 960 }));
  it('handles portrait photos', () => expect(fitWithin(3000, 4000, 1000)).toEqual({ w: 750, h: 1000 }));
  it('never scales up', () => expect(fitWithin(600, 400, 1280)).toEqual({ w: 600, h: 400 }));
});
describe('quick time slots', () => {
  it('formats local datetime-local values', () => expect(toLocalInput(new Date(2026, 10, 7, 9, 5))).toBe('2026-11-07T09:05'));
  it('offers future slots at the expected hours', () => {
    const now = new Date(2026, 10, 17, 20, 30);
    const [a, b, c] = quickSlots(now);
    expect(a.value).toBe('2026-11-18T09:00'); expect(b.value).toBe('2026-11-18T17:00'); expect(c.value).toBe('2026-11-19T09:00');
    for (const s of [a, b, c]) expect(new Date(s.value).getTime()).toBeGreaterThan(now.getTime());
  });
  it('rolls over month ends', () => expect(quickSlots(new Date(2026, 10, 30, 12, 0))[0].value).toBe('2026-12-01T09:00'));
});
