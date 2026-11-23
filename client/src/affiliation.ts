// Who a technician / engineer works under (the server computes this: see server/src/team.ts).
export interface Party { id: string; name: string; gender?: string }
export interface Affiliation { engineer: Party | null; company: Party | null }
export const NO_AFFILIATION: Affiliation = { engineer: null, company: null };
/** A technician is "alone" without an engineer; an engineer is "alone" without a company. */
export const worksAlone = (role: string | undefined, a?: Affiliation | null) =>
  role === 'technician' ? !a?.engineer : role === 'engineer' ? !a?.company : true;
