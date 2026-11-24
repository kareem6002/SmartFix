import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
export type Role = 'customer' | 'technician' | 'engineer' | 'company' | 'admin';
export interface Session { id: string; name: string; role: Role; gender?: 'male' | 'female' }
interface Ctx {
  user: Session | null;
  login: (email: string, password: string, role?: Session['role']) => Promise<Session>;
  register: (d: any) => Promise<Session>;
  updateUser: (patch: Partial<Session>) => void;
  logout: () => void;
  guideOpen: boolean; openGuide: () => void; closeGuide: (dontShowAgain?: boolean) => void;
}
const AuthCtx = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthCtx);

const readUser = (): Session | null => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(readUser);
  const [guideOpen, setGuideOpen] = useState(false);   // the comic guide: opens after every fresh login / sign-up
  const save = (d: { token: string; user: Session }) => {
    localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user));
    setUser(d.user);
    if (!localStorage.getItem(`sf_guide_off_${d.user.id}`)) setGuideOpen(true);
    return d.user;
  };
  const updateUser = (patch: Partial<Session>) => setUser(u => {
    if (!u) return u; const n = { ...u, ...patch }; localStorage.setItem('user', JSON.stringify(n)); return n;
  });
  // Sessions saved before profile photos existed have no gender: fetch it once so the photo shows up.
  useEffect(() => {
    if (user && user.role !== 'admin' && !user.gender && localStorage.getItem('token'))
      api('/me').then(m => m?.gender && updateUser({ gender: m.gender, name: m.name })).catch(() => {});
  }, [user?.id]);
  return <AuthCtx.Provider value={{
    user, updateUser, guideOpen,
    openGuide: () => setGuideOpen(true),
    closeGuide: (never = false) => { if (never && user) localStorage.setItem(`sf_guide_off_${user.id}`, '1'); setGuideOpen(false); },
    login: async (email, password, role) => save(await api('/auth/login', 'POST', { email, password, role })),
    register: async d => save(await api('/auth/register', 'POST', d)),
    logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setGuideOpen(false); setUser(null); },
  }}>{children}</AuthCtx.Provider>;
}
