import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Avatar } from '../Avatar';
import { AffChips } from '../AffChips';
import { useAuth } from '../auth';
import { Keys, useI18n } from '../i18n';
import { toLocalInput } from '../datetime';

export type ProviderRole = 'technician' | 'engineer' | 'company';
const ROLES: ProviderRole[] = ['technician', 'engineer', 'company'];
const roleIcon: Record<ProviderRole, string> = { technician: '🛠️', engineer: '📐', company: '🏢' };
const specialty = (role: ProviderRole, t: (k: Keys) => string) => t(`provider.specialty.${role}` as Keys);

function ProviderCard({ person }: { person: any }) {
  const { t, tc, years } = useI18n();
  const role = person.role as ProviderRole;
  return <article className={`provider-card provider-${role} card`}>
    <div className="provider-card-art"><Avatar role={role} gender={person.gender} name={person.name} size={104} /><span className="provider-role-icon" aria-hidden="true">{roleIcon[role]}</span></div>
    <div className="provider-card-body">
      <span className="provider-kind">{t(`role.${role}` as Keys)}</span>
      <h3>{role === 'engineer' ? t('title.engineer', { name: person.name }) : person.name}</h3>
      <div className="provider-meta">{role === 'technician' && person.category ? tc(person.category) : specialty(role, t)}</div>
      {role === 'technician' && <div className="provider-rating"><span className="stars">{'★'.repeat(Math.round(person.rating || 0))}{'☆'.repeat(5 - Math.round(person.rating || 0))}</span> {person.rating ? person.rating.toFixed(1) : t('tech.new')} · {person.reviewCount || 0}</div>}
      {role !== 'company' && <div className="provider-meta">{years(person.experienceYears || 0)}</div>}
      {role === 'technician' && <AffChips aff={person.affiliation} />}
      {role !== 'technician' && <p className="provider-bio">{person.bio || t(`provider.about.${role}` as Keys)}</p>}
      <div className="provider-actions"><Link className="btn btn-outline-primary" to={`/professionals/${role}/${person._id}`}>{t('provider.explore')}</Link><Link className="btn btn-primary" to={role === 'technician' ? `/new?category=${encodeURIComponent(person.category || '')}&technician=${person._id}` : `/book/${role}/${person._id}`}>{t('provider.book')}</Link></div>
    </div>
  </article>;
}

export function ProvidersDirectory() {
  const { t } = useI18n();
  const requestedRole = new URLSearchParams(location.search).get('role');
  const [role, setRole] = useState<ProviderRole>(ROLES.includes(requestedRole as ProviderRole) ? requestedRole as ProviderRole : 'technician');
  const [items, setItems] = useState<any[]>([]); const [busy, setBusy] = useState(true);
  useEffect(() => { setBusy(true); api(`/providers?role=${role}`).then(setItems).catch(() => setItems([])).finally(() => setBusy(false)); }, [role]);
  return <div className="providers-page">
    <header className="providers-hero"><span className="eyebrow">{t('provider.eyebrow')}</span><h1>{t('provider.title')}</h1><p>{t('provider.lead')}</p></header>
    <section className="intent-chooser" aria-label={t('provider.choose')}>
      {ROLES.map(r => <button key={r} className={`intent-card ${role === r ? 'active' : ''}`} type="button" aria-pressed={role === r} onClick={() => setRole(r)}>
        <span className="intent-icon" aria-hidden="true">{roleIcon[r]}</span><span><b>{t(`provider.intent.${r}` as Keys)}</b><small>{t(`provider.intentDesc.${r}` as Keys)}</small></span><i aria-hidden="true">→</i>
      </button>)}
    </section>
    <div className="provider-directory-head"><div><h2 className="section-title">{t(`provider.listTitle.${role}` as Keys)}</h2><p className="text-muted">{t(`provider.listLead.${role}` as Keys)}</p></div><span className="provider-count">{items.length} {t(`role.${role}` as Keys)}</span></div>
    {busy ? <p className="text-muted">{t('common.loading')}</p> : items.length ? <div className="provider-grid">{items.map(person => <ProviderCard key={person._id} person={person} />)}</div> : <div className="nr-empty">{t(`provider.none.${role}` as Keys)}</div>}
  </div>;
}

export function ProviderProfile() {
  const { role: roleParam, id } = useParams(); const { user } = useAuth(); const { t, tc, years } = useI18n();
  const role = (ROLES.includes(roleParam as ProviderRole) ? roleParam : 'technician') as ProviderRole;
  const [person, setPerson] = useState<any>(null); const [portfolio, setPortfolio] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api(`/providers/${role}/${id}`), api(`/portfolio/${id}`)])
      .then(([p, work]) => { setPerson(p); setPortfolio(work); }).catch(() => setPerson(null)).finally(() => setLoading(false));
  }, [id, role]);
  if (loading) return <p className="text-muted">{t('common.loading')}</p>;
  if (!person) return <div className="nr-empty">{t('provider.notFound')}</div>;
  const displayName = role === 'engineer' ? t('title.engineer', { name: person.name }) : person.name;
  return <div className="public-profile-page">
    <Link to="/providers" className="profile-back">← {t('provider.back')}</Link>
    <section className={`public-profile-card public-${role}`}>
      <div className="public-profile-cover"><span>{roleIcon[role]}</span></div>
      <div className="public-profile-content"><Avatar role={role} gender={person.gender} name={person.name} size={132} />
        <div className="public-profile-info"><span className="provider-kind">{t(`role.${role}` as Keys)}</span><h1>{displayName}</h1>
          {role === 'technician' && <div className="provider-rating"><span className="stars">{'★'.repeat(Math.round(person.rating || 0))}{'☆'.repeat(5 - Math.round(person.rating || 0))}</span> {person.rating ? person.rating.toFixed(1) : t('tech.new')} · {t('profile.reviews', { n: person.reviewCount || 0 })}</div>}
          {role === 'technician' && <p className="provider-meta">{person.category ? tc(person.category) : specialty(role, t)} · {years(person.experienceYears || 0)}</p>}
          {role === 'engineer' && <p className="provider-meta">{person.category ? tc(person.category) : specialty(role, t)} · {years(person.experienceYears || 0)}</p>}
          {person.affiliation && <AffChips aff={person.affiliation} />}
          {role !== 'technician' && <p className="public-bio">{person.bio || t(`provider.about.${role}` as Keys)}</p>}
          {(role === 'engineer' || role === 'company') && <div className="provider-stats"><span><b>{person.teamSize || 0}</b><small>{t(role === 'engineer' ? 'provider.technicians' : 'provider.engineers')}</small></span></div>}
          {user?.role === 'customer' && <Link className="btn btn-primary btn-lg" to={role === 'technician' ? `/new?category=${encodeURIComponent(person.category || '')}&technician=${person._id}` : `/book/${role}/${person._id}`}>{t('provider.book')}</Link>}
        </div>
      </div>
    </section>
    <section className="public-portfolio"><div className="d-flex justify-content-between align-items-end gap-3 flex-wrap"><div><h2 className="section-title">{t('provider.portfolio')}</h2><p className="text-muted">{t('provider.portfolioLead')}</p></div><span className="work-history-mark">{portfolio.length}</span></div>
      {portfolio.length ? <div className="work-grid">{portfolio.map(item => <article className="work-card" key={item._id}>{item.photos?.length ? <div className="work-cover"><img src={item.photos[0]} alt={item.label} /></div> : <div className="work-cover work-cover-empty">{roleIcon[role]}</div>}<div className="work-card-body"><span className="work-label">{item.label}</span><p>{item.description}</p>{item.photos?.length > 1 && <div className="portfolio-thumbs">{item.photos.slice(1).map((src: string, i: number) => <img key={i} src={src} alt={`${item.label} ${i + 2}`} />)}</div>}</div></article>)}</div> : <div className="nr-empty">{t('provider.portfolioEmpty')}</div>}
    </section>
  </div>;
}

export function ProviderBooking() {
  const { role: roleParam, id } = useParams(); const navigate = useNavigate(); const { t } = useI18n();
  const role = (roleParam === 'company' ? 'company' : 'engineer') as Exclude<ProviderRole, 'technician'>;
  const [person, setPerson] = useState<any>(null); const [loading, setLoading] = useState(true); const [description, setDescription] = useState(''); const [when, setWhen] = useState(''); const [projectType, setProjectType] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { setLoading(true); if (id) api(`/providers/${role}/${id}`).then(setPerson).catch(() => setPerson(null)).finally(() => setLoading(false)); else setLoading(false); }, [id, role]);
  const options = role === 'engineer' ? ['complex', 'design', 'other'] : ['design', 'property', 'maintenance', 'other'];
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(''); setBusy(true); try { await api('/requests/provider', 'POST', { providerId: id, providerRole: role, category: projectType, description: description.trim(), scheduledAt: new Date(when).toISOString() }); navigate('/my'); } catch (x: any) { setError(x.message || t('err.request')); setBusy(false); } };
  if (loading) return <p className="text-muted">{t('common.loading')}</p>;
  if (!person) return <div className="nr-empty">{t('provider.notFound')}</div>;
  return <form className="provider-booking card" onSubmit={submit}>
    <div className="provider-booking-person"><Avatar role={role} gender={person.gender} name={person.name} size={84} /><div><span className="provider-kind">{t(`role.${role}` as Keys)}</span><h1>{person.name}</h1><p>{t(`provider.bookingLead.${role}` as Keys)}</p></div></div>
    <div className="card-body"><h2 className="section-title">{t('provider.bookingTitle')}</h2>
      <label className="form-label" htmlFor="project-type">{t('provider.projectType')}</label><select id="project-type" className="form-select mb-3" required value={projectType} onChange={e => setProjectType(e.target.value)}><option value="">{t('reg.select')}</option>{options.map(k => <option key={k} value={k}>{t(`provider.project.${k}` as Keys)}</option>)}</select>
      <label className="form-label" htmlFor="project-description">{t('provider.projectDetails')}</label><textarea id="project-description" className="form-control mb-3" rows={5} required minLength={10} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('provider.projectPlaceholder')} />
      <label className="form-label" htmlFor="project-time">{t('provider.preferredTime')}</label><input id="project-time" className="form-control" type="datetime-local" required min={toLocalInput(new Date())} value={when} onChange={e => setWhen(e.target.value)} />
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className="d-flex gap-2 mt-4"><button className="btn btn-primary btn-lg" disabled={busy || !projectType || !description.trim() || !when}>{busy ? t('provider.booking') : t('provider.submitBooking')}</button><Link className="btn btn-outline-secondary" to={`/professionals/${role}/${id}`}>{t('provider.cancel')}</Link></div>
    </div>
  </form>;
}
