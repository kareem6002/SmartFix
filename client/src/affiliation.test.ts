import { describe, it, expect } from 'vitest';
import { worksAlone } from './affiliation';
const eng = { id: 'e', name: 'Tarek' }, co = { id: 'c', name: 'Al Noor' };
describe('worksAlone', () => {
  it('is the default when there is no affiliation', () => {
    expect(worksAlone('technician', undefined)).toBe(true); expect(worksAlone('engineer', null)).toBe(true);
    expect(worksAlone('technician', { engineer: null, company: null })).toBe(true);
  });
  it('technician is not alone with an engineer; engineer is not alone in a company', () => {
    expect(worksAlone('technician', { engineer: eng, company: null })).toBe(false);
    expect(worksAlone('technician', { engineer: eng, company: co })).toBe(false);
    expect(worksAlone('engineer', { engineer: null, company: co })).toBe(false);
  });
  it('an engineer without a company is alone even if the field set differs', () => expect(worksAlone('engineer', { engineer: eng, company: null })).toBe(true));
});
