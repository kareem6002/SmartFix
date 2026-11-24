import type { Keys } from '../i18n/core';
import type { Role } from '../auth';

// The comic guide: 3 comics (pages) per role, 3 panels each. Text lives in the i18n dictionaries;
// Roles: customer, technician, engineer, company, admin - 3 comics each. {a} {b} {c} in a bubble are filled with the real button labels listed in `v`, so the guide always matches the app.
export type Who = 'sam' | 'mona' | 'omar' | 'sara' | 'tarek' | 'layla' | 'adel' | 'nour';   // Sam & Mona = technicians, Omar & Sara = customers, Tarek & Layla = engineers, Adel & Nour = company
export type Demo =                                           // little replicas of the real buttons, shown with a pulsing ring
  | { t: 'pill'; label: Keys }
  | { t: 'btn'; label: Keys; v?: 'primary' | 'outline' | 'danger' | 'success' }
  | { t: 'chip'; label: Keys; icon?: string; on?: boolean }
  | { t: 'badge'; label: Keys; c: string; suffix?: string }
  | { t: 'check'; label: Keys }
  | { t: 'field'; ph: Keys }
  | { t: 'tag'; label: Keys }                                  // affiliation badge, e.g. "With Eng. Tarek"
  | { t: 'photo' }
  | { t: 'stars' };
export interface BubbleDef { k: Keys; v?: Keys[] }
export interface PanelDef {
  kind: 'scene' | 'single' | 'duo'; bg: 'sun' | 'sky' | 'rose' | 'mint' | 'lilac' | 'peach';
  who?: Who | [Who, Who]; side?: 'left' | 'right'; big?: boolean;
  cap?: Keys; sfx?: Keys; bubbles: BubbleDef[]; demo?: Demo[];
  scene?: string;                                   // backdrop photo for kind 'scene' (default: the SmartFix office)
}
export interface PageDef { title: Keys; layout: 'A' | 'B' | 'C'; panels: [PanelDef, PanelDef, PanelDef] }
export type GuideRole = Role;

const status = (s: 'pending' | 'accepted' | 'in_progress' | 'completed'): Demo =>
  ({ t: 'badge', label: `status.${s}` as Keys, c: { pending: 'warning', accepted: 'info', in_progress: 'primary', completed: 'success' }[s] });

export const STORY: Record<GuideRole, PageDef[]> = {
  customer: [
    { title: 'cg.c1.title', layout: 'A', panels: [
      { kind: 'scene', bg: 'sun', who: 'sam', cap: 'cg.c1.p1.cap', sfx: 'sfx.wow', bubbles: [{ k: 'cg.c1.p1.b1' }] },
      { kind: 'single', bg: 'sky', who: 'omar', side: 'left', bubbles: [{ k: 'cg.c1.p2.b1' }] },
      { kind: 'single', bg: 'rose', who: 'mona', side: 'right', bubbles: [{ k: 'cg.c1.p3.b1', v: ['nav.newRequest', 'home.start'] }],
        demo: [{ t: 'pill', label: 'nav.newRequest' }, { t: 'btn', label: 'home.start' }] },
    ] },
    { title: 'cg.c2.title', layout: 'B', panels: [
      { kind: 'single', bg: 'sun', who: 'sam', side: 'left', big: true, cap: 'cg.c2.p1.cap', bubbles: [{ k: 'cg.c2.p1.b1', v: ['nav.providers'] }],
        demo: [{ t: 'pill', label: 'nav.providers' }] },
      { kind: 'single', bg: 'mint', who: 'mona', side: 'right', bubbles: [{ k: 'cg.c2.p2.b1', v: ['cat.Plumbing', 'tech.book'] }],
        demo: [{ t: 'chip', label: 'cat.Plumbing', icon: '🚰', on: true }, { t: 'btn', label: 'tech.book' }] },
      { kind: 'single', bg: 'lilac', who: 'sara', side: 'left', bubbles: [{ k: 'cg.c2.p3.b1', v: ['new.emergency'] }],
        demo: [{ t: 'photo' }, { t: 'check', label: 'new.emergency' }] },
    ] },
    { title: 'cg.c3.title', layout: 'C', panels: [
      { kind: 'single', bg: 'peach', who: 'mona', side: 'left', sfx: 'sfx.done', bubbles: [{ k: 'cg.c3.p1.b1', v: ['new.book'] }], demo: [{ t: 'btn', label: 'new.book' }] },
      { kind: 'single', bg: 'sky', who: 'omar', side: 'right', bubbles: [{ k: 'cg.c3.p2.b1', v: ['nav.myRequests'] }],
        demo: [status('pending'), status('accepted'), status('in_progress'), status('completed')] },
      { kind: 'duo', bg: 'sun', who: ['sam', 'sara'], sfx: 'sfx.go', bubbles: [{ k: 'cg.c3.p3.b1', v: ['my.cancel', 'my.rate'] }, { k: 'cg.c3.p3.b2' }],
        demo: [{ t: 'btn', label: 'my.cancel', v: 'danger' }, { t: 'btn', label: 'my.rate', v: 'success' }, { t: 'photo' }] },
    ] },
  ],
  technician: [
    { title: 'cg.t1.title', layout: 'A', panels: [
      { kind: 'scene', bg: 'sun', who: 'mona', cap: 'cg.t1.p1.cap', sfx: 'sfx.wow', bubbles: [{ k: 'cg.t1.p1.b1', v: ['nav.myJobs'] }], demo: [{ t: 'pill', label: 'nav.myJobs' }] },
      { kind: 'single', bg: 'sky', who: 'sam', side: 'left', bubbles: [{ k: 'cg.t1.p2.b1' }], demo: [status('pending')] },
      { kind: 'single', bg: 'rose', who: 'sara', side: 'right', bubbles: [{ k: 'cg.t1.p3.b1', v: ['new.emergency', 'jobs.urgent'] }],
        demo: [{ t: 'badge', label: 'jobs.urgent', c: 'danger' }] },
    ] },
    { title: 'cg.t2.title', layout: 'B', panels: [
      { kind: 'single', bg: 'sun', who: 'mona', side: 'left', big: true, cap: 'cg.t2.p1.cap', bubbles: [{ k: 'cg.t2.p1.b1', v: ['act.accept', 'act.reject'] }],
        demo: [{ t: 'btn', label: 'act.accept' }, { t: 'btn', label: 'act.reject', v: 'danger' }] },
      { kind: 'single', bg: 'mint', who: 'sam', side: 'right', bubbles: [{ k: 'cg.t2.p2.b1', v: ['act.start', 'status.in_progress'] }],
        demo: [{ t: 'btn', label: 'act.start' }, status('in_progress')] },
      { kind: 'single', bg: 'lilac', who: 'omar', side: 'left', sfx: 'sfx.stars', bubbles: [{ k: 'cg.t2.p3.b1', v: ['act.complete'] }], demo: [{ t: 'btn', label: 'act.complete' }] },
    ] },
    { title: 'cg.t3.title', layout: 'C', panels: [
      { kind: 'single', bg: 'peach', who: 'sara', side: 'left', bubbles: [{ k: 'cg.t3.p1.b1' }], demo: [{ t: 'stars' }] },
      { kind: 'single', bg: 'sky', who: 'sam', side: 'right', bubbles: [{ k: 'cg.t3.p2.b1', v: ['profile.save'] }], demo: [{ t: 'btn', label: 'profile.save' }] },
      { kind: 'duo', bg: 'sun', who: ['mona', 'omar'], sfx: 'sfx.go', bubbles: [{ k: 'cg.t3.p3.b1', v: ['menu.profile', 'menu.guide', 'menu.logout'] }, { k: 'cg.t3.p3.b2' }],
        demo: [{ t: 'photo' }] },
    ] },
  ],
  engineer: [
    { title: 'cg.eng1.title', layout: 'A', panels: [
      { kind: 'scene', bg: 'sun', who: 'tarek', scene: '/art/scene-engineers.webp', cap: 'cg.eng1.p1.cap', sfx: 'sfx.wow', bubbles: [{ k: 'cg.eng1.p1.b1', v: ['nav.myTeam'] }], demo: [{ t: 'pill', label: 'nav.myTeam' }] },
      { kind: 'single', bg: 'mint', who: 'layla', side: 'left', bubbles: [{ k: 'cg.eng1.p2.b1', v: ['nav.applications', 'collab.sendOffer'] }],
        demo: [{ t: 'pill', label: 'nav.applications' }, { t: 'btn', label: 'collab.sendOffer' }] },
      { kind: 'single', bg: 'peach', who: 'sam', side: 'right', bubbles: [{ k: 'cg.eng1.p3.b1' }], demo: [{ t: 'btn', label: 'act.accept' }] },
    ] },
    { title: 'cg.eng2.title', layout: 'B', panels: [
      { kind: 'single', bg: 'sun', who: 'tarek', side: 'left', big: true, cap: 'cg.eng2.p1.cap', bubbles: [{ k: 'cg.eng2.p1.b1', v: ['team.explore', 'team.remove'] }],
        demo: [{ t: 'btn', label: 'team.explore', v: 'outline' }, { t: 'btn', label: 'team.remove', v: 'danger' }] },
      { kind: 'single', bg: 'sky', who: 'mona', side: 'right', bubbles: [{ k: 'cg.eng2.p2.b1', v: ['team.remove'] }], demo: [{ t: 'btn', label: 'team.remove', v: 'danger' }] },
      { kind: 'single', bg: 'lilac', who: 'omar', side: 'left', bubbles: [{ k: 'cg.eng2.p3.b1' }], demo: [{ t: 'tag', label: 'aff.sampleEngineer' }] },
    ] },
    { title: 'cg.eng3.title', layout: 'C', panels: [
      { kind: 'single', bg: 'rose', who: 'nour', side: 'left', bubbles: [{ k: 'cg.eng3.p1.b1', v: ['menu.profile'] }], demo: [{ t: 'photo' }] },
      { kind: 'single', bg: 'mint', who: 'tarek', side: 'right', bubbles: [{ k: 'cg.eng3.p2.b1', v: ['aff.alone'] }], demo: [{ t: 'tag', label: 'aff.alone' }, { t: 'tag', label: 'aff.sampleInCompany' }] },
      { kind: 'duo', bg: 'sun', who: ['tarek', 'layla'], sfx: 'sfx.go', bubbles: [{ k: 'cg.eng3.p3.b1', v: ['menu.profile', 'menu.guide', 'menu.logout'] }, { k: 'cg.eng3.p3.b2' }], demo: [{ t: 'photo' }] },
    ] },
  ],
  company: [
    { title: 'cg.com1.title', layout: 'A', panels: [
      { kind: 'scene', bg: 'sun', who: 'adel', scene: '/art/scene-company.webp', cap: 'cg.com1.p1.cap', sfx: 'sfx.wow', bubbles: [{ k: 'cg.com1.p1.b1', v: ['nav.myEngineers'] }], demo: [{ t: 'pill', label: 'nav.myEngineers' }] },
      { kind: 'single', bg: 'peach', who: 'nour', side: 'left', bubbles: [{ k: 'cg.com1.p2.b1', v: ['nav.applications', 'collab.sendOffer'] }], demo: [{ t: 'pill', label: 'nav.applications' }, { t: 'btn', label: 'collab.sendOffer' }] },
      { kind: 'single', bg: 'mint', who: 'tarek', side: 'right', bubbles: [{ k: 'cg.com1.p3.b1' }], demo: [{ t: 'tag', label: 'aff.sampleInCompany' }] },
    ] },
    { title: 'cg.com2.title', layout: 'B', panels: [
      { kind: 'single', bg: 'sun', who: 'adel', side: 'left', big: true, cap: 'cg.com2.p1.cap', bubbles: [{ k: 'cg.com2.p1.b1', v: ['team.explore', 'team.remove'] }], demo: [{ t: 'btn', label: 'team.explore', v: 'outline' }, { t: 'btn', label: 'team.remove', v: 'danger' }] },
      { kind: 'single', bg: 'sky', who: 'sam', side: 'right', bubbles: [{ k: 'cg.com2.p2.b1' }], demo: [{ t: 'tag', label: 'aff.sampleEngineer' }, { t: 'tag', label: 'aff.sampleCompany' }] },
      { kind: 'single', bg: 'lilac', who: 'sara', side: 'left', bubbles: [{ k: 'cg.com2.p3.b1' }] },
    ] },
    { title: 'cg.com3.title', layout: 'C', panels: [
      { kind: 'single', bg: 'rose', who: 'layla', side: 'left', bubbles: [{ k: 'cg.com3.p1.b1', v: ['aff.leave'] }], demo: [{ t: 'btn', label: 'aff.leave', v: 'danger' }] },
      { kind: 'single', bg: 'mint', who: 'nour', side: 'right', bubbles: [{ k: 'cg.com3.p2.b1', v: ['team.remove'] }], demo: [{ t: 'btn', label: 'team.remove', v: 'danger' }] },
      { kind: 'duo', bg: 'sun', who: ['adel', 'nour'], sfx: 'sfx.go', bubbles: [{ k: 'cg.com3.p3.b1', v: ['menu.profile', 'menu.guide', 'menu.logout'] }, { k: 'cg.com3.p3.b2' }], demo: [{ t: 'photo' }] },
    ] },
  ],
  admin: [
    { title: 'cg.a1.title', layout: 'A', panels: [
      { kind: 'scene', bg: 'sun', who: 'sam', cap: 'cg.a1.p1.cap', sfx: 'sfx.wow', bubbles: [{ k: 'cg.a1.p1.b1', v: ['nav.dashboard'] }], demo: [{ t: 'pill', label: 'nav.dashboard' }] },
      { kind: 'single', bg: 'sky', who: 'mona', side: 'left', bubbles: [{ k: 'cg.a1.p2.b1' }],
        demo: [{ t: 'chip', label: 'stat.customers' }, { t: 'chip', label: 'stat.technicians' }, { t: 'chip', label: 'stat.engineers' }, { t: 'chip', label: 'stat.companies' }, { t: 'chip', label: 'stat.requests' }, { t: 'chip', label: 'stat.completed' }, { t: 'chip', label: 'stat.pending' }] },
      { kind: 'single', bg: 'rose', who: 'sara', side: 'right', bubbles: [{ k: 'cg.a1.p3.b1', v: ['admin.categories', 'admin.add'] }],
        demo: [{ t: 'field', ph: 'admin.newCat' }, { t: 'btn', label: 'admin.add' }] },
    ] },
    { title: 'cg.a2.title', layout: 'B', panels: [
      { kind: 'single', bg: 'sun', who: 'sam', side: 'left', big: true, bubbles: [{ k: 'cg.a2.p1.b1', v: ['admin.users'] }],
        demo: [{ t: 'chip', label: 'admin.name' }, { t: 'chip', label: 'admin.email' }, { t: 'chip', label: 'admin.role' }] },
      { kind: 'single', bg: 'mint', who: 'mona', side: 'right', bubbles: [{ k: 'cg.a2.p2.b1', v: ['admin.deactivate', 'admin.activate'] }],
        demo: [{ t: 'btn', label: 'admin.deactivate', v: 'danger' }, { t: 'btn', label: 'admin.activate', v: 'success' }] },
      { kind: 'single', bg: 'lilac', who: 'omar', side: 'left', bubbles: [{ k: 'cg.a2.p3.b1' }], demo: [{ t: 'badge', label: 'cat.Plumbing', c: 'secondary', suffix: ' ✕' }] },
    ] },
    { title: 'cg.a3.title', layout: 'C', panels: [
      { kind: 'single', bg: 'peach', who: 'mona', side: 'left', bubbles: [{ k: 'cg.a3.p1.b1', v: ['admin.bookings'] }], demo: [status('pending'), status('accepted'), status('completed')] },
      { kind: 'single', bg: 'sky', who: 'sara', side: 'right', bubbles: [{ k: 'cg.a3.p2.b1' }], demo: [{ t: 'badge', label: 'cat.Plumbing', c: 'light text-dark border', suffix: ' 🚨' }] },
      { kind: 'duo', bg: 'sun', who: ['sam', 'mona'], sfx: 'sfx.go', bubbles: [{ k: 'cg.a3.p3.b1', v: ['menu.profile', 'menu.guide', 'menu.logout'] }, { k: 'cg.a3.p3.b2' }],
        demo: [{ t: 'photo' }] },
    ] },
  ],
};
