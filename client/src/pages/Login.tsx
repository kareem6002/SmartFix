import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth, Role } from '../auth';
import { Tilt } from '../Tilt';
import { Keys, useI18n } from '../i18n';

export const ROLES: Record<Role, { icon: string; art: string; loginArt: string; tile: string }> = {   // order = order of the cards on the first screen
  customer: { icon: '🏠', art: '/art/customers.webp', loginArt: '/art/customers.webp', tile: 'tile-customer' },
  technician: { icon: '🔧', art: '/art/tech-duo.webp', loginArt: '/art/tech-female.webp', tile: 'tile-tech' },
  engineer: { icon: '👷', art: '/art/engineers.webp', loginArt: '/art/engineers.webp', tile: 'tile-eng' },
  company: { icon: '🏢', art: '/art/company.webp', loginArt: '/art/company.webp', tile: 'tile-company' },
  admin: { icon: '🛡️', art: '/art/admins.webp', loginArt: '/art/admins.webp', tile: 'tile-admin' },
};
export const homeFor = (r: Role) => (r === 'admin' ? '/admin' : r === 'technician' ? '/tech' : r === 'engineer' || r === 'company' ? '/team' : '/');

/** Renders "SmartFix" with the orange "Fix" wherever it appears inside a translated sentence. */
export const Brand = ({ text }: { text: string }) =>
  <>{text.split('SmartFix').map((part, i, a) => <span key={i}>{part}{i < a.length - 1 && <>Smart<b>Fix</b></>}</span>)}</>;

export function PasswordField({ id, value, onChange, placeholder, autoComplete, minLength }:
  { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; minLength?: number }) {
  const { t } = useI18n(); const [show, setShow] = useState(false);
  return (
    <div className="auth-pw">
      <input id={id} className="auth-input" type={show ? 'text' : 'password'} required value={value} minLength={minLength}
        autoComplete={autoComplete} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
      <button type="button" className="auth-eye" onClick={() => setShow(x => !x)} aria-label={show ? t('auth.hidePw') : t('auth.showPw')}>
        {show ? t('auth.hide') : t('auth.show')}
      </button>
    </div>
  );
}

/** Step 2 — email + password for the chosen role. */
export function Login() {
  const { role } = useParams();
  if (!role || !(role in ROLES)) return <Navigate to="/" replace />;
  return <LoginForm role={role as Role} />;
}

function LoginForm({ role }: { role: Role }) {
  const { login } = useAuth(); const { t, err: tr } = useI18n(); const nav = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const info = ROLES[role]; const label = t(`role.${role}` as Keys);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const u = await login(email.trim(), password, role); nav(homeFor(u.role), { replace: true }); }
    catch (x: any) { setErr(tr(x.message)); setBusy(false); }
  };

  return (
    <section className="auth-page">
      <div className="auth-split">
        <Tilt className={`auth-art ${info.tile}`} max={5}>
          <img src={info.loginArt} alt="" />
        </Tilt>
        <form className="auth-card" onSubmit={submit}>
          <Link to="/" state={{ skipIntro: true }} className="auth-back"><span className="arr">←</span> {t('auth.changeRole')}</Link>
          <div className="auth-badge"><span>{info.icon}</span>{label}</div>
          <h2>{t('auth.login')}</h2>
          <p className="auth-sub">{t('auth.loginSub', { role: label.toLowerCase() })}</p>

          {err && <div className="auth-error" role="alert">{err}</div>}

          <label className="auth-label" htmlFor="email">{t('auth.email')}</label>
          <input id="email" className="auth-input" type="email" autoComplete="email" placeholder={t('auth.emailPh')}
            required autoFocus value={email} onChange={e => setEmail(e.target.value)} />

          <label className="auth-label" htmlFor="password">{t('auth.password')}</label>
          <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" placeholder={t('auth.passwordPh')} />

          <button className="auth-btn primary mt-3" disabled={busy}>{busy ? t('auth.loggingIn') : t('auth.login')}</button>

          {role === 'admin'
            ? <p className="auth-note">{t('auth.adminNote')}</p>
            : <>
                <div className="auth-or"><span>{t('auth.noAccount')}</span></div>
                <Link to={`/register?role=${role}`} className="auth-btn ghost">{t('auth.create')}</Link>
              </>}
        </form>
      </div>
    </section>
  );
}
