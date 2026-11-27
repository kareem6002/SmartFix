import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAuth, Role } from './auth';
import { Avatar } from from './AvatarComponent';
import { Logo } from './Logo';
import { BackgroundFX } from './BackgroundFX';
import { ComicGuide } from './comic/ComicGuide';
import { Keys, useI18n } from './i18n';
import { useTheme } from './Theme';
import { Register } from './pages/Auth';
import { Login } from './pages/Login';
import { Lobby } from './pages/Lobby';
import { Profile } from './pages/Profile';
import { Team } from './pages/Team';
import { Home, Technicians, MyRequests } from './pages/Customer';
import { ProvidersDirectory, ProviderProfile, ProviderBooking } from './pages/Providers';
import { NewRequest } from './pages/NewRequest';
import { TechDashboard } from './pages/Technician';
import { AdminDashboard } from './pages/Admin';
import { Inbox } from './pages/Inbox';
import { CollaborationPage, WorkHistoryPage } from './pages/WorkspaceTabs';

function Landing() {
  const { user } = useAuth();
  if (!user) return <Lobby />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'technician') return <Navigate to="/tech" replace />;
  if (user.role === 'engineer' || user.role === 'company') return <Navigate to="/team" replace />;
  return <Home />;
}
function Guard({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return ([] as Role[]).concat(role).includes(user.role) ? <>{children}</> : <Navigate to="/" replace />;
}
function LoggedIn({ children }: { children: ReactNode }) { const { user } = useAuth(); return user ? <>{children}</> : <Navigate to="/" replace />; }

const LINKS: Record<Role, [string, Keys, string][]> = {
  customer: [['/', 'nav.home', '⌂'], ['/providers', 'nav.providers', '✦'], ['/new', 'nav.newRequest', '+'], ['/my', 'nav.myRequests', '▤']],
  technician: [['/tech', 'nav.myJobs', '▣'], ['/inbox', 'nav.inbox', '✉'], ['/work-history', 'nav.workHistory', '▧'], ['/collaborate', 'nav.applications', '＋']],
  engineer: [['/team', 'nav.myTeam', '▤'], ['/inbox', 'nav.inbox', '✉'], ['/work-history', 'nav.workHistory', '▧'], ['/collaborate', 'nav.applications', '＋']],
  company: [['/team', 'nav.myEngineers', '▤'], ['/inbox', 'nav.inbox', '✉'], ['/work-history', 'nav.workHistory', '▧'], ['/collaborate', 'nav.applications', '＋']],
  admin: [['/admin', 'nav.dashboard', '▦']],
};

function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return <div className="lang-switch" role="group" aria-label={t('nav.language')}><button type="button" lang="en" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button><button type="button" lang="ar" className={lang === 'ar' ? 'on' : ''} aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>العربية</button></div>;
}
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme(); const { t } = useI18n(); const next = theme === 'dark' ? 'light' : 'dark';
  return <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={t(`theme.switch.${next}` as Keys)} title={t(`theme.switch.${next}` as Keys)}><span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><span className="theme-toggle-label">{t(`theme.${theme}` as Keys)}</span></button>;
}
function ProfileMenu() {
  const { user, logout, openGuide } = useAuth(); const { t } = useI18n(); const [open, setOpen] = useState(false); const box = useRef<HTMLDivElement>(null); const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const off = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc); };
  }, []);
  if (!user) return null;
  return <div className="profile" ref={box}><button className="profile-btn" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t('nav.profileMenu')}><Avatar role={user.role} gender={user.gender} name={user.name} size={42} /></button>
    {open && <div className="profile-pop" role="menu"><div className="profile-head"><Avatar role={user.role} gender={user.gender} name={user.name} size={54} /><div><strong>{user.name}</strong><span className="role-pill">{t(`role.${user.role}` as Keys)}</span></div></div>
      <Link className="pop-item" role="menuitem" to="/profile">👤 {t('menu.profile')}</Link><button className="pop-item" role="menuitem" onClick={() => { setOpen(false); openGuide(); }}>📖 {t('menu.guide')}</button><button className="pop-item danger" role="menuitem" onClick={logout}>↪ {t('menu.logout')}</button></div>}
  </div>;
}

export default function App() {
  const { user, guideOpen } = useAuth(); const { t } = useI18n(); const { pathname } = useLocation(); const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  if (!user && pathname === '/') return <Lobby />;
  return <><BackgroundFX /><header className={`sf-nav ${user ? 'authed' : ''}`}><div className="sf-nav-inner">
    <Link className="brand" to="/"><Logo /><span className="brand-text">Smart<span>Fix</span></span></Link>
    {user && <nav className={`nav-links ${menu ? 'open' : ''}`} aria-label={t('nav.primary')}>{LINKS[user.role].map(([to, label, icon]) => <NavLink key={to} end to={to} className={({ isActive }) => `nav-pill ${isActive ? 'active' : ''}`}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{t(label)}</span></NavLink>)}</nav>}
    <div className="nav-tools"><ThemeToggle /><LangSwitch /></div>
    {user && <button className="nav-burger" onClick={() => setMenu(m => !m)} aria-label={t('nav.menu')} aria-expanded={menu}>{menu ? '✕' : '☰'}</button>}
    <ProfileMenu />
  </div></header>
  <main className="container py-4 page"><Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<Navigate to="/" replace />} /><Route path="/login/:role" element={<Login />} /><Route path="/register" element={<Register />} />
    <Route path="/profile" element={<LoggedIn><Profile /></LoggedIn>} /><Route path="/technicians" element={<Technicians />} /><Route path="/providers" element={<ProvidersDirectory />} />
    <Route path="/professionals/:role/:id" element={<ProviderProfile />} /><Route path="/book/:role/:id" element={<Guard role="customer"><ProviderBooking /></Guard>} />
    <Route path="/new" element={<Guard role="customer"><NewRequest /></Guard>} /><Route path="/my" element={<Guard role="customer"><MyRequests /></Guard>} /><Route path="/tech" element={<Guard role="technician"><TechDashboard /></Guard>} />
    <Route path="/team" element={<Guard role={['engineer', 'company']}><Team /></Guard>} /><Route path="/inbox" element={<Guard role={['technician', 'engineer', 'company']}><Inbox /></Guard>} />
    <Route path="/work-history" element={<Guard role={['technician', 'engineer', 'company']}><WorkHistoryPage /></Guard>} /><Route path="/collaborate" element={<Guard role={['technician', 'engineer', 'company']}><CollaborationPage /></Guard>} />
    <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} /><Route path="*" element={<h3>{t('page.notFound')}</h3>} />
  </Routes></main>{user && guideOpen && <ComicGuide />}</>;
}
