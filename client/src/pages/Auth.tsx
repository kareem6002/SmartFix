import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth'; import { api } from '../api';
import { PasswordField, ROLES, homeFor } from './Login';
import { Keys, useI18n } from '../i18n';

type SignUpRole = 'customer' | 'technician' | 'engineer' | 'company';
const SIGN_UP: SignUpRole[] = ['customer', 'technician', 'engineer', 'company'];

/** Sign-up. The role comes from the first screen via ?role=… - we never ask for it again. Admins can't sign up. */
export function Register() {
  const [qs] = useSearchParams(); const role = qs.get('role') as SignUpRole | null;
  if (!role || !SIGN_UP.includes(role)) return <Navigate to="/" replace />;
  return <RegisterForm role={role} />;
}

function RegisterForm({ role }: { role: SignUpRole }) {
  const { register } = useAuth(); const { t, tc, err: tr } = useI18n(); const nav = useNavigate();
  const [cats, setCats] = useState<any[]>([]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', gender: '', phone: '', address: '', category: '', experienceYears: '', bio: '' });
  const pro = role === 'technician' || role === 'engineer', company = role === 'company';   // technicians & engineers have a specialty and experience
  useEffect(() => { if (pro) api('/categories').then(setCats).catch(() => {}); }, [pro]);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const info = ROLES[role]; const label = t(`role.${role}` as Keys);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body: any = { name: f.name, email: f.email, password: f.password, gender: f.gender, phone: f.phone, address: f.address, role };
      if (pro) Object.assign(body, { category: f.category, experienceYears: Number(f.experienceYears) || 0, bio: f.bio });
      if (company) body.bio = f.bio;
      nav(homeFor((await register(body)).role), { replace: true });
    } catch (x: any) { setErr(tr(x.message)); setBusy(false); }
  };

  return (
    <section className="auth-page">
      <form className="auth-card wide" onSubmit={submit}>
        <Link to={`/login/${role}`} className="auth-back"><span className="arr">←</span> {t('reg.back')}</Link>
        <div className="auth-badge"><span>{info.icon}</span>{label}</div>
        <h2>{t('reg.title')}</h2>
        <p className="auth-sub">{t('reg.sub')}</p>
        {err && <div className="auth-error" role="alert">{err}</div>}

        <label className="auth-label" htmlFor="name">{company ? t('reg.companyName') : t('reg.name')}</label>
        <input id="name" className="auth-input" required minLength={2} autoComplete={company ? 'organization' : 'name'} value={f.name} onChange={set('name')} />

        <label className="auth-label" htmlFor="email">{t('auth.email')}</label>
        <input id="email" className="auth-input" type="email" required autoComplete="email" placeholder={t('auth.emailPh')} value={f.email} onChange={set('email')} />

        <label className="auth-label" htmlFor="password">{t('auth.password')}</label>
        <PasswordField id="password" value={f.password} minLength={6} autoComplete="new-password" placeholder={t('reg.passwordPh')} onChange={v => setF({ ...f, password: v })} />

        <div className="auth-row">
          <div>
            <label className="auth-label" htmlFor="gender">{company ? t('reg.repGender') : t('reg.gender')}</label>
            <select id="gender" className="auth-input" required value={f.gender} onChange={set('gender')}>
              <option value="">{t('reg.select')}</option><option value="male">{t('reg.male')}</option><option value="female">{t('reg.female')}</option>
            </select>
          </div>
          <div>
            <label className="auth-label" htmlFor="phone">{t('reg.phone')}</label>
            <input id="phone" className="auth-input" type="tel" required autoComplete="tel" placeholder="01XXXXXXXXX" pattern="\+?[\d\s\-]{7,15}" title={t('reg.phoneTitle')} value={f.phone} onChange={set('phone')} />
          </div>
        </div>

        <label className="auth-label" htmlFor="address">{t('reg.address')}</label>
        <input id="address" className="auth-input" required minLength={5} autoComplete="street-address" placeholder={t('reg.addressPh')} value={f.address} onChange={set('address')} />

        {pro && <>
          <label className="auth-label" htmlFor="category">{t('reg.specialty')}</label>
          <select id="category" className="auth-input" required value={f.category} onChange={set('category')}>
            <option value="">{t('reg.select')}</option>{cats.map(c => <option key={c._id} value={c.name}>{tc(c.name)}</option>)}
          </select>
          <label className="auth-label" htmlFor="exp">{t('reg.years')}</label>
          <input id="exp" className="auth-input" type="number" min={0} max={60} value={f.experienceYears} onChange={set('experienceYears')} />
        </>}
        {(pro || company) && <>
          <label className="auth-label" htmlFor="bio">{company ? t('reg.aboutCompany') : t('reg.about')}</label>
          <textarea id="bio" className="auth-input" placeholder={company ? t('reg.aboutCompanyPh') : t('reg.aboutPh')} value={f.bio} onChange={set('bio')} />
        </>}

        <button className="auth-btn primary mt-3" disabled={busy}>{busy ? t('reg.creating') : t('reg.submit')}</button>
        <p className="auth-note">{t('reg.have')} <Link to={`/login/${role}`}>{t('auth.login')}</Link></p>
      </form>
    </section>
  );
}
