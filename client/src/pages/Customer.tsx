import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, statusColor } from '../api';
import { useAuth } from '../auth'; import { Avatar } from '../AvatarComponent'; import { Tilt } from '../Tilt';
import { Keys, useI18n } from '../i18n'; import { RequestPhotos } from '../RequestPhotos'; import { AffChips } from '../AffChips';

const Stars = ({ n }: { n: number }) => <span title={`${n.toFixed(1)}/5`} dir="ltr">{'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}</span>;
export const ICONS: Record<string, string> = { 'Plumbing': '🚰', 'Electrical Repairs': '⚡', 'Air Conditioning and Maintenance': '❄️', 'Carpentry': '🪚', 'Painting': '🎨', 'General Home Maintenance': '🏠' };

function TechCard({ tech }: { tech: any }) {
  const { t, tc, years } = useI18n();
  return <Tilt className="card tech-card provider-card provider-technician glare h-100" max={5}>
    <div className="provider-card-art"><Avatar role="technician" gender={tech.gender} name={tech.name} size={104} /><span className="provider-role-icon" aria-hidden="true">🛠️</span></div>
    <div className="provider-card-body">
      <span className="provider-kind">{tc(tech.category || '')}</span><h3>{tech.name}</h3>
      <div className="mb-1"><span className="stars"><Stars n={tech.rating || 0} /></span> <span className="small text-muted">{tech.rating ? tech.rating.toFixed(1) : t('tech.new')} ({tech.reviewCount || 0})</span></div>
      <div className="small text-muted mb-2">{years(tech.experienceYears ?? 0)}</div><AffChips aff={tech.affiliation} />
      <p className="small provider-bio">{tech.bio}</p>
      <div className="provider-actions"><Link className="btn btn-outline-primary" to={`/professionals/technician/${tech._id}`}>{t('provider.explore')}</Link><Link className="btn btn-primary" to={`/new?category=${encodeURIComponent(tech.category)}&technician=${tech._id}`}>{t('tech.book')}</Link></div>
    </div>
  </Tilt>;
}

const STEPS: [string, Keys, Keys][] = [['📝', 'step.1.t', 'step.1.d'], ['👷', 'step.2.t', 'step.2.d'], ['📅', 'step.3.t', 'step.3.d'], ['✅', 'step.4.t', 'step.4.d']];
const INTENTS: [string, string, string][] = [['technician', 'provider.intent.technician', 'provider.intentDesc.technician'], ['engineer', 'provider.intent.engineer', 'provider.intentDesc.engineer'], ['company', 'provider.intent.company', 'provider.intentDesc.company']];

export function Home() {
  const { user } = useAuth(); const { t, tc } = useI18n();
  const [cats, setCats] = useState<any[]>([]); const [top, setTop] = useState<any[]>([]);
  useEffect(() => { api('/categories').then(setCats).catch(() => {}); api('/technicians').then(x => setTop(x.slice(0, 3))).catch(() => {}); }, []);
  return (<>
    <section className="hero3d">
      <div className="hero-copy"><span className="eyebrow">{t('home.welcome', { name: user?.name.split(' ')[0] || '' })}</span>
        <h1>{t('home.title1')}<br /><span>{t('home.title2')}</span></h1><p>{t('home.lead')}</p>
        <div className="d-flex gap-2 flex-wrap"><Link className="btn btn-primary btn-lg" to="/new">{t('home.start')}</Link><Link className="btn btn-outline-light btn-lg" to="/providers">{t('home.browse')}</Link></div>
      </div>
      <Tilt className="hero-art" max={6}><span className="orb o1" aria-hidden="true">🚰</span><span className="orb o2" aria-hidden="true">⚡</span><span className="orb o3" aria-hidden="true">❄️</span><img src="/art/tech-female.webp" alt={t('home.heroAlt')} /></Tilt>
    </section>
    <section className="customer-intents"><div><span className="eyebrow">{t('provider.eyebrow')}</span><h2>{t('provider.choose')}</h2><p className="text-muted">{t('provider.lead')}</p></div><div className="intent-chooser compact">{INTENTS.map(([role, label, desc]) => <Link key={role} className="intent-card" to={`/providers?role=${role}`}><span className="intent-icon" aria-hidden="true">{role === 'technician' ? '🛠️' : role === 'engineer' ? '📐' : '🏢'}</span><span><b>{t(label as Keys)}</b><small>{t(desc as Keys)}</small></span><i aria-hidden="true">→</i></Link>)}</div></section>
    <h4 className="section-title">{t('home.services')}</h4><div className="row g-3 mb-5">{cats.map(c => <div key={c._id} className="col-6 col-md-4"><Link to={`/technicians?category=${encodeURIComponent(c.name)}`} className="service-card"><span className="service-icon">{ICONS[c.name] || '🛠️'}</span>{tc(c.name)}</Link></div>)}</div>
    <h4 className="section-title">{t('home.how')}</h4><div className="row g-3 mb-5">{STEPS.map(([icon, title, desc], n) => <div key={title} className="col-6 col-md-3"><div className="step"><div className="step-icon">{icon}</div><strong>{n + 1}. {t(title)}</strong><p className="small text-muted mb-0">{t(desc)}</p></div></div>)}</div>
    {top.length > 0 && <><h4 className="section-title">{t('home.top')}</h4><div className="row g-3">{top.map(x => <div className="col-md-4" key={x._id}><TechCard tech={x} /></div>)}</div></>}
  </>);
}

export function Technicians() {
  const { t, tc } = useI18n(); const [cats, setCats] = useState<any[]>([]); const [list, setList] = useState<any[]>([]);
  const [cat, setCat] = useState(new URLSearchParams(location.search).get('category') || '');
  useEffect(() => { api('/categories').then(setCats); }, []);
  useEffect(() => { api('/technicians' + (cat ? `?category=${encodeURIComponent(cat)}` : '')).then(setList); }, [cat]);
  return <><div className="provider-directory-head"><div><h3 className="section-title">{t('techs.title')}</h3><p className="text-muted">{t('provider.listLead.technician')}</p></div><Link className="btn btn-outline-primary" to="/providers">{t('provider.allTypes')}</Link></div>
    <div className="d-flex gap-2 flex-wrap mb-4"><button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>{t('techs.all')}</button>{cats.map(c => <button key={c._id} className={`chip ${cat === c.name ? 'on' : ''}`} onClick={() => setCat(c.name)}>{ICONS[c.name]} {tc(c.name)}</button>)}</div>
    <div className="provider-grid">{list.map(x => <TechCard key={x._id} tech={x} />)}{!list.length && <p className="text-muted">{t('techs.none')}</p>}</div>
  </>;
}

export function MyRequests() {
  const { t, tc, ts, date } = useI18n(); const [items, setItems] = useState<any[]>([]); const [rv, setRv] = useState<{ id: string; rating: number; comment: string } | null>(null);
  const load = () => api('/requests').then(setItems); useEffect(() => { load(); }, []);
  const cancel = async (id: string) => { await api(`/requests/${id}/status`, 'PATCH', { status: 'cancelled' }); load(); };
  const review = async () => { await api('/reviews', 'POST', { request: rv!.id, rating: rv!.rating, comment: rv!.comment }); setRv(null); load(); };
  return <><h3 className="section-title">{t('my.title')}</h3>
    {items.map(r => { const role = r.providerRole || 'technician'; const target = r.provider || r.technician; return <div key={r._id} className="card mb-3"><div className="card-body">
      <div className="d-flex justify-content-between align-items-center gap-2"><div className="d-flex align-items-center gap-2"><Avatar role={role} gender={target?.gender} name={target?.name} size={46} /><strong>{role === 'technician' ? `${ICONS[r.category] || '🛠️'} ${tc(r.category)}` : t(`provider.requestLabel.${role}` as Keys)} {r.urgent && '🚨'}</strong></div><span className={`badge bg-${statusColor[r.status]}`}>{ts(r.status)}</span></div>
      <div className="small text-muted mt-1">{target?.name} · {date(r.scheduledAt)}{role !== 'technician' && r.category ? ` · ${t(`provider.project.${r.category}` as Keys)}` : ''}</div><p className="mb-2">{r.description}</p>{r.photoCount > 0 && <div className="mb-2"><RequestPhotos id={r._id} count={r.photoCount} /></div>}
      {['pending', 'accepted'].includes(r.status) && <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(r._id)}>{t('my.cancel')}</button>}
      {role === 'technician' && r.status === 'completed' && !r.reviewed && <button className="btn btn-sm btn-success" onClick={() => setRv({ id: r._id, rating: 5, comment: '' })}>{t('my.rate')}</button>}
      {rv && rv.id === r._id && <div className="mt-2"><select className="form-select mb-2" value={rv.rating} onChange={e => setRv({ ...rv, rating: +e.target.value })}>{[5, 4, 3, 2, 1].map(n => <option key={n}>{n}</option>)}</select><input className="form-control mb-2" placeholder={t('my.comment')} onChange={e => setRv({ ...rv, comment: e.target.value })} /><button className="btn btn-sm btn-primary" onClick={review}>{t('my.submit')}</button></div>}
    </div></div>; })}
    {!items.length && <p className="text-muted">{t('my.none')}</p>}</>;
}
