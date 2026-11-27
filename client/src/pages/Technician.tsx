import { useEffect, useState } from 'react';
import { api, statusColor } from '../api';
import { Avatar } from '../AvatarComponent';
import { Keys, useI18n } from '../i18n'; import { RequestPhotos } from '../RequestPhotos';
const NEXT: Record<string, [string, Keys][]> = {
  pending: [['accepted', 'act.accept'], ['rejected', 'act.reject']], accepted: [['in_progress', 'act.start']], in_progress: [['completed', 'act.complete']],
};
export function TechDashboard() {
  const { t, ts, date } = useI18n();
  const [items, setItems] = useState<any[]>([]);
  const load = () => api('/requests').then(setItems); useEffect(() => { load(); }, []);
  const move = async (id: string, status: string) => { await api(`/requests/${id}/status`, 'PATCH', { status }); load(); };
  return (<><h3 className="section-title">{t('jobs.title')}</h3>
    {items.map(r => <div key={r._id} className={`card mb-2 ${r.urgent ? 'border-danger' : ''}`}><div className="card-body">
      <div className="d-flex justify-content-between align-items-center gap-2"><div className="d-flex align-items-center gap-2"><Avatar role="customer" gender={r.customer?.gender} name={r.customer?.name} size={42} /><strong>{r.customer?.name} {r.urgent && t('jobs.urgent')}</strong></div><span className={`badge bg-${statusColor[r.status]}`}>{ts(r.status)}</span></div>
      <div className="small text-muted mt-1">{date(r.scheduledAt)}</div><p>{r.description}</p>
      {r.photoCount > 0 && <div className="mb-2"><RequestPhotos id={r._id} count={r.photoCount} /></div>}
      {(NEXT[r.status] || []).map(([s, label]) => <button key={s} className={`btn btn-sm me-2 ${s === 'rejected' ? 'btn-outline-danger' : 'btn-primary'}`} onClick={() => move(r._id, s)}>{t(label)}</button>)}
    </div></div>)}
    {!items.length && <p className="text-muted">{t('jobs.none')}</p>}</>);
}
