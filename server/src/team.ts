// The chain of command: a company employs engineers, an engineer leads technicians.
// A technician/engineer has at most one `employer` (null = works alone, the default).
export const ROLES = ['customer', 'technician', 'engineer', 'company', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** Which role each leader may invite. */
export const MEMBER_ROLE: Partial<Record<Role, Role>> = { company: 'engineer', engineer: 'technician' };
export const canInvite = (fromRole: string, toRole: string) => MEMBER_ROLE[fromRole as Role] === toRole;

export interface Party { id: string; name: string; gender?: string }
export interface Affiliation { engineer: Party | null; company: Party | null }

const party = (u: any): Party | null => (u && typeof u === 'object' && u.name ? { id: String(u._id ?? u.id), name: u.name, gender: u.gender } : null);

/**
 * What a person works under. Expects `employer` (and the employer's own `employer`) to be populated.
 *  technician -> { engineer, company }  (company only if that engineer works in one)
 *  engineer   -> { company }
 */
export function affiliationOf(u: any): Affiliation {
  const e = u?.employer && typeof u.employer === 'object' && u.employer.name ? u.employer : null;
  if (u?.role === 'technician' && e?.role === 'engineer')
    return { engineer: party(e), company: e.employer?.role === 'company' ? party(e.employer) : null };
  if (u?.role === 'engineer' && e?.role === 'company') return { engineer: null, company: party(e) };
  return { engineer: null, company: null };
}

/** mongoose populate options that load the employer and the employer's employer. */
export const EMPLOYER_POPULATE = { path: 'employer', select: 'name gender role employer', populate: { path: 'employer', select: 'name gender role' } };

/** Plain object for the API: the raw `employer` reference is replaced by a clean `affiliation`. */
export function withAffiliation(doc: any) {
  const o = typeof doc?.toObject === 'function' ? doc.toObject() : { ...doc };
  const affiliation = affiliationOf(o); delete o.employer;
  return { ...o, affiliation };
}

/** Who ends up working for whom when a collaboration is accepted by `recipientId`.
 *  An application comes from the person who wants to JOIN the recipient (the applicant works for the recipient).
 *  An offer comes from the leader inviting the recipient (the recipient works for the sender). */
export function employmentOnAccept(kind: string, recipientId: string, senderId: string) {
  return kind === 'application'
    ? { employeeId: senderId, employerId: recipientId }
    : { employeeId: recipientId, employerId: senderId };
}
