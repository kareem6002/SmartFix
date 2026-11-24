import { en } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';
export type Keys = keyof typeof en;
export const DICTS: Record<Lang, Record<Keys, string>> = { en, ar };

/** "Hello {name}" + {name:'Sara'} -> "Hello Sara" */
export const format = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;

export function yearsText(lang: Lang, n: number): string {
  if (lang === 'en') return `${n} ${n === 1 ? 'year' : 'years'} experience`;
  if (n <= 0) return 'خبرة أقل من سنة';
  if (n === 1) return 'سنة واحدة من الخبرة';
  if (n === 2) return 'سنتان من الخبرة';
  return n <= 10 ? `${n} سنوات من الخبرة` : `${n} سنة من الخبرة`;
}

// The server replies in English. Known messages are mapped to dictionary keys so they show in the chosen language.
const ERRORS: [RegExp, Keys][] = [
  [/^Network error$/, 'err.network'], [/^Forbidden$/, 'err.forbidden'], [/^Unauthorized$/, 'err.unauthorized'],
  [/^Email already registered$/, 'err.emailTaken'], [/^Invalid email or password$/, 'err.badLogin'], [/^Account deactivated$/, 'err.deactivated'],
  [/^Pick a future time$/, 'err.futureTime'], [/^Technician is not available at that time$/, 'err.unavailable'], [/^Not found$/, 'err.notFound'],
  [/^Cannot move /, 'err.badMove'], [/^Only completed requests can be reviewed$/, 'err.reviewCompleted'], [/^Already reviewed$/, 'err.reviewed'],
  [/^Server error$/, 'err.server'], [/^Request failed$/, 'err.request'],
  [/Enter a valid phone number/, 'err.phone'], [/Enter your address/, 'err.address'],
  [/^No account found with that email$/, 'err.noAccount'], [/^That account is not a technician$/, 'err.notTechnician'], [/^That account is not an engineer$/, 'err.notEngineer'],
  [/^Already in your team$/, 'err.alreadyMember'], [/^Invitation already sent$/, 'err.inviteSent'],
  [/Invalid image/, 'err.image'], [/^Too many requests$/, 'err.tooMany'], [/^Request too large$/, 'err.tooLarge'],
];
export function errorMessage(lang: Lang, msg: string): string {
  const d = DICTS[lang];
  const role = /^This account is not a (customer|technician|admin) account/.exec(msg);
  if (role) return format(d['err.wrongRole'], { role: d[`role.${role[1]}` as Keys].toLowerCase() });
  for (const [re, key] of ERRORS) if (re.test(msg)) return d[key];
  if (/^[\w.]+: /.test(msg)) return d['err.check'];   // validation errors look like "field: message"
  return msg;
}
