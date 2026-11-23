import { describe, it, expect } from 'vitest';
import { affiliationOf, canInvite, employmentOnAccept, withAffiliation } from './team';

const company = { _id: 'c1', name: 'Al Noor Contracting', role: 'company', gender: 'male' };
const engineer = (employer: any = null) => ({ _id: 'e1', name: 'Tarek Salem', role: 'engineer', gender: 'male', employer });

describe('who may invite whom', () => {
  it('companies invite engineers, engineers invite technicians - nothing else', () => {
    expect(canInvite('company', 'engineer')).toBe(true);
    expect(canInvite('engineer', 'technician')).toBe(true);
    for (const [a, b] of [['company', 'technician'], ['engineer', 'engineer'], ['engineer', 'company'], ['technician', 'engineer'], ['customer', 'technician'], ['admin', 'engineer'], ['company', 'company']])
      expect([a, b, canInvite(a, b)]).toEqual([a, b, false]);
  });
});

describe('affiliationOf', () => {
  it('technician with no employer works alone (the default)', () => {
    expect(affiliationOf({ role: 'technician', name: 'Ahmed', employer: null })).toEqual({ engineer: null, company: null });
    expect(affiliationOf({ role: 'technician', name: 'Ahmed' })).toEqual({ engineer: null, company: null });
  });
  it('technician -> engineer who works alone: only the engineer', () => {
    const a = affiliationOf({ role: 'technician', employer: engineer(null) });
    expect(a.engineer?.name).toBe('Tarek Salem'); expect(a.company).toBeNull();
  });
  it('technician -> engineer -> company: reports the company the technician works under', () => {
    const a = affiliationOf({ role: 'technician', employer: engineer(company) });
    expect(a.engineer?.name).toBe('Tarek Salem'); expect(a.company).toEqual({ id: 'c1', name: 'Al Noor Contracting', gender: 'male' });
  });
  it('engineer -> company, or alone by default', () => {
    expect(affiliationOf({ role: 'engineer', employer: company }).company?.name).toBe('Al Noor Contracting');
    expect(affiliationOf({ role: 'engineer', employer: null })).toEqual({ engineer: null, company: null });
  });
  it('ignores unpopulated references and impossible links', () => {
    expect(affiliationOf({ role: 'technician', employer: 'someObjectId' })).toEqual({ engineer: null, company: null });
    expect(affiliationOf({ role: 'technician', employer: company })).toEqual({ engineer: null, company: null });   // a technician is never directly under a company
    expect(affiliationOf({ role: 'customer', employer: company })).toEqual({ engineer: null, company: null });
  });
});

describe('withAffiliation', () => {
  it('replaces the raw employer with a clean affiliation', () => {
    const out: any = withAffiliation({ toObject: () => ({ name: 'Ahmed', role: 'technician', employer: engineer(company) }) });
    expect(out.employer).toBeUndefined(); expect(out.affiliation.company.name).toBe('Al Noor Contracting'); expect(out.name).toBe('Ahmed');
  });
});

describe('employmentOnAccept', () => {
  it('accepted application: the applicant starts working for the recipient', () =>
    expect(employmentOnAccept('application', 'engineer1', 'tech1')).toEqual({ employeeId: 'tech1', employerId: 'engineer1' }));
  it('accepted offer: the recipient starts working for the sender', () =>
    expect(employmentOnAccept('offer', 'tech1', 'engineer1')).toEqual({ employeeId: 'tech1', employerId: 'engineer1' }));
});
