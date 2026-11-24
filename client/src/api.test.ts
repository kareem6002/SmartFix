import { describe, it, expect } from 'vitest';
import { statusLabel, statusColor } from './api';
describe('helpers', () => {
  it('formats status', () => expect(statusLabel('in_progress')).toBe('in progress'));
  it('has a color for every status', () => ['pending','accepted','in_progress','completed','rejected','cancelled'].forEach(s => expect(statusColor[s]).toBeTruthy()));
});
