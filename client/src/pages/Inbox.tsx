import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import { Avatar } from '../Avatar';
import { useAuth } from '../auth';
import { Keys, useI18n } from '../i18n';

type InboxItem = { _id: string; kind: string; status: string; from?: any; to?: any; message?: string; createdAt: string; scheduledAt?: string };

export function CollaborationPanel() {
  const { user } = useAuth(); const { t, err: tr } = useI18n();
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'application' | 'offer'>(user?.role === 'company' ? 'offer' : 'application');
  const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (!user || user.role === 'customer' || user.role === 'admin') return null;
  const canApply = user.role === 'technician' || user.role === 'engineer'; const canOffer = user.role === 'engineer' || user.role === 'company';
  const target = mode === 'application' ? (user.role === 'technician' ? 'engineer' : 'company') : (user.role === 'engineer' ? 'technician' : 'engineer');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setNotice(''); setError(''); setBusy(true);
    try { await api(`/collaborations/${mode === 'application' ? 'apply' : 'offer'}`, 'POST', { email, message }); setEmail(''); setMessage(''); setNotice(t(mode === 'application' ? 'collab.applicationSent' : 'collab.offerSent')); }
    catch (x: any) { setError(tr(x.message)); } finally { setBusy(false); }
  };
  return <section className="collab-panel card"><div className="card-body">
    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap"><div><h4 className="mb-1">{t('collab.title')}</h4><p className="text-muted mb-0">{t('collab.subtitle')}</p></div><span className="role-pill">{t(`role.${user.role}` as Keys)}</span></div>
    {canApply && canOffer && <div className="collab-switch mt-3"><button type="button" className={mode === 'application' ? 'active' : ''} onClick={() => setMode('application')}>{t('collab.apply')}</button><button type="button" className={mode === 'offer' ? 'active' : ''} onClick={() => setMode('offer')}>{t('collab.offer')}</button></div>}
    {(canApply || canOffer) && <form onSubmit={submit} className="mt-3"><label className="form-label">{t(mode === 'application' ? 'collab.applyTo' : 'collab.offerTo', { role: t(`role.${target}` as Keys) })}</label>
      <div className="d-flex gap-2 flex-wrap"><input className="form-control" type="email" required dir="ltr" placeholder={t('team.emailPh')} value={email} onChange={e => setEmail(e.target.value)} /><button className="btn btn-primary" type="submit" disabled={busy || !email}>{busy ? t('collab.sending') : t(mode === 'application' ? 'collab.sendApplication' : 'collab.sendOffer')}</button></div>
      <textarea className="form-control mt-2" rows={3} maxLength={800} placeholder={t(mode === 'application' ? 'collab.applicationPlaceholder' : 'collab.offerPlaceholder')} value={message} onChange={e => setMessage(e.target.value)} />
      {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}{notice && <div className="alert alert-success mt-2 mb-0">{notice}</div>}
    </form>}
  </div></section>;
}

export function Inbox() {
  const { user } = useAuth(); const { t, date, err: tr } = useI18n();
  const [items, setItems] = useState<InboxItem[]>([]); const [error, setError] = useState(''); const [portfolios, setPortfolios] = useState<Record<string, any[]>>({}); const [portfolioVisible, setPortfolioVisible] = useState<Record<string, boolean>>({});
  const load = () => api('/inbox').then(setItems).catch(x => setError(tr(x.message)));
  useEffect(() => { load(); }, []);
  if (!user) return null;
  const answer = async (item: InboxItem, action: 'accept' | 'decline') => {
    setError('');
    try {
      if (item.kind === 'customer_request') await api(`/requests/${item._id}/status`, 'PATCH', { status: action === 'accept' ? 'accepted' : 'rejected' });
      else await api(`/inbox/${item._id}/${action}`, 'POST');
      await load();
    } catch (x: any) { setError(tr(x.message)); }
  };
  const showPortfolio = async (person: any) => {
    if (!person?._id) return;
    if (portfolioVisible[person._id]) { setPortfolioVisible(old => ({ ...old, [person._id]: false })); return; }
    try { const work = Object.prototype.hasOwnProperty.call(portfolios, person._id) ? portfolios[person._id] : await api(`/portfolio/${person._id}`); setPortfolios(old => ({ ...old, [person._id]: work })); setPortfolioVisible(old => ({ ...old, [person._id]: true })); }
    catch (x: any) { setError(tr(x.message)); }
  };
  const incomingPending = items.filter(i => String(i.to?._id) === String(user.id) && i.status === 'pending').length;
  return <div className="inbox-page"><header className="inbox-head"><div><h3 className="section-title">{t('inbox.title')}</h3><p className="text-muted mb-0">{t(user.role === 'company' ? 'inbox.companySubtitle' : 'inbox.subtitle')}</p></div><span className="inbox-count">{t('inbox.pending', { n: incomingPending })}</span></header>
    {error && <div className="alert alert-danger">{error}</div>}
    {!items.length ? <div className="card empty-inbox"><div className="card-body"><h4>{t('inbox.emptyTitle')}</h4><p className="text-muted mb-0">{t('inbox.emptyText')}</p></div></div> : <div className="inbox-list">{items.map(item => {
      const incoming = String(item.to?._id) === String(user.id); const person = incoming ? item.from : item.to; const request = item.kind === 'customer_request';
      const canSeePortfolio = incoming && item.kind === 'offer' && person?.role === 'company' && user.role === 'engineer';
      const message = request ? item.message : item.message;
      return <article className={`card inbox-card ${incoming && item.status === 'pending' ? 'inbox-new' : ''}`} key={item._id}><div className="card-body">
        <div className="d-flex align-items-center gap-3"><Avatar role={person?.role || 'technician'} gender={person?.gender} name={person?.name} size={58} /><div className="flex-grow-1"><strong>{request ? t('inbox.customerRequestFrom', { name: person?.name || '' }) : t(incoming ? 'inbox.sentYou' : 'inbox.youSent', { name: person?.name || '', kind: t(item.kind === 'application' ? 'inbox.application' : 'inbox.offer') })}</strong><div className="small text-muted">{t(`role.${person?.role || 'customer'}` as Keys)} · {date(item.createdAt)}{request && item.scheduledAt ? ` · ${t('provider.preferredTime')}: ${date(item.scheduledAt)}` : ''}</div></div><span className={`badge bg-${item.status === 'pending' ? 'warning' : item.status === 'accepted' ? 'success' : item.status === 'rejected' || item.status === 'declined' ? 'danger' : 'secondary'}`}>{t(`status.${item.status}` as Keys)}</span></div>
        {message && <p className="inbox-message">{message}</p>}
        {canSeePortfolio && <div className="mt-2"><button className="btn btn-sm btn-outline-primary" onClick={() => showPortfolio(person)}>{t(portfolioVisible[person._id] ? 'inbox.hidePortfolio' : 'inbox.viewPortfolio')}</button>
          {portfolioVisible[person._id] && portfolios[person._id]?.length > 0 && <div className="portfolio-inline mt-3">{portfolios[person._id].map(work => <article className="work-card" key={work._id}>{work.photos?.[0] && <div className="work-cover"><img src={work.photos[0]} alt={work.label} /></div>}<div className="work-card-body"><span className="work-label">{work.label}</span><p>{work.description}</p></div></article>)}</div>}
          {portfolioVisible[person._id] && portfolios[person._id]?.length === 0 && <p className="small text-muted mt-2">{t('provider.portfolioEmpty')}</p>}
        </div>}
        {incoming && item.status === 'pending' && <div className="d-flex gap-2 mt-2"><button className="btn btn-sm btn-primary" onClick={() => answer(item, 'accept')}>{t('act.accept')}</button><button className="btn btn-sm btn-outline-secondary" onClick={() => answer(item, 'decline')}>{t('act.reject')}</button></div>}
      </div></article>;
    })}</div>}
  </div>;
}
