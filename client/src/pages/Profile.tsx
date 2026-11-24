import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../auth'; import { api } from '../api';
import { Avatar } from '../Avatar'; import { Tilt } from '../Tilt'; import { AffChips } from '../AffChips';
import { worksAlone } from '../affiliation';
import { Keys, useI18n } from '../i18n';

export function Profile() {
  const { user, updateUser } = useAuth(); const { t, tc, err: tr } = useI18n();
  const [me, setMe] = useState<any>(null); const [f, setF] = useState<any>({});
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const loadMe = () => api('/me').then(m => { setMe(m); setF((old: any) => ({ ...old, name: m.name || '', gender: m.gender || '', phone: m.phone || '', address: m.address || '', experienceYears: m.experienceYears ?? 0, bio: m.bio || '' })); })
    .catch(x => setErr(tr(x.message)));
  useEffect(() => { loadMe(); }, []);
  if (!user) return null;
  const set = (k: string) => (e: any) => { setF({ ...f, [k]: e.target.value }); setMsg(''); };
  const role = user.role; const pro = role === 'technician' || role === 'engineer'; const company = role === 'company';

  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      const body: any = { name: f.name, phone: f.phone, address: f.address };
      if (f.gender) body.gender = f.gender;
      if (pro) Object.assign(body, { experienceYears: Number(f.experienceYears) || 0 });
      if (pro || company) body.bio = f.bio;
      const m = await api('/me', 'PUT', body); setMe(m);
      updateUser({ name: m.name, gender: m.gender }); setMsg(t('profile.saved'));
    } catch (x: any) { setErr(tr(x.message)); } finally { setBusy(false); }
  };

  return (
    <div className="profile-page">
      <Tilt className="profile-card glare" max={6}>
        <div className="profile-cover" />
        <div className="profile-avatar"><Avatar role={role} gender={f.gender || user.gender} name={f.name || user.name} size={132} /></div>
        <h3>{f.name || user.name}</h3>
        <span className="role-pill">{t(`role.${role}` as Keys)}</span>
        {me?.email && <p className="profile-email" dir="ltr">{me.email}</p>}
        {pro && me && <p className="small text-muted mb-1">{tc(me.category)} · <span className="stars">★</span> {me.rating ? me.rating.toFixed(1) : t('profile.new')} ({t('profile.reviews', { n: me.reviewCount || 0 })})</p>}
        {pro && me && <div className="profile-aff">{worksAlone(role, me.affiliation) ? <span className="aff-chip">🧍 {t('aff.alone')}</span> : <AffChips aff={me.affiliation} />}</div>}
      </Tilt>

      <div className="profile-right">
        <form className="profile-form" onSubmit={save}>
          <h4>{t('profile.title')}</h4>
          {err && <div className="alert alert-danger">{err}</div>}{msg && <div className="alert alert-success">{msg}</div>}
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">{company ? t('reg.companyName') : t('reg.name')}</label><input className="form-control" required minLength={2} value={f.name ?? ''} onChange={set('name')} /></div>
            <div className="col-md-6"><label className="form-label">{t('auth.email')}</label><input className="form-control" dir="ltr" value={me?.email ?? ''} disabled /></div>
            {role !== 'admin' && <div className="col-md-6"><label className="form-label">{company ? t('reg.repGender') : t('reg.gender')}</label>
              <select className="form-select" required value={f.gender ?? ''} onChange={set('gender')}><option value="">{t('reg.select')}</option><option value="male">{t('reg.male')}</option><option value="female">{t('reg.female')}</option></select></div>}
            <div className="col-md-6"><label className="form-label">{t('reg.phone')}</label><input className="form-control" type="tel" value={f.phone ?? ''} onChange={set('phone')} placeholder="01XXXXXXXXX" pattern="\+?[\d\s\-]{7,15}" title={t('reg.phoneTitle')} /></div>
            <div className="col-12"><label className="form-label">{t('reg.address')}</label><input className="form-control" minLength={5} value={f.address ?? ''} onChange={set('address')} placeholder={t('reg.addressPh')} /></div>
            {pro && <>
              <div className="col-md-6"><label className="form-label">{t('reg.specialty')}</label><input className="form-control" value={me ? tc(me.category || '') : ''} disabled /></div>
              <div className="col-md-6"><label className="form-label">{t('reg.years')}</label><input className="form-control" type="number" min={0} max={60} value={f.experienceYears ?? 0} onChange={set('experienceYears')} /></div>
            </>}
            {(pro || company) && <div className="col-12"><label className="form-label">{company ? t('reg.aboutCompany') : t('reg.about')}</label><textarea className="form-control" rows={3} maxLength={500} value={f.bio ?? ''} onChange={set('bio')} /></div>}
          </div>
          <button className="btn btn-primary mt-4" disabled={busy || !me}>{busy ? t('profile.saving') : t('profile.save')}</button>
        </form>
      </div>
    </div>
  );
}
