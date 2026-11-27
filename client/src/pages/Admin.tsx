import { useEffect, useState } from 'react';
import { api, statusColor } from '../api';
import { Avatar } from '../AvatarComponent';
import { Keys, useI18n } from '../i18n';
export function AdminDashboard() {
  const { t, tc, ts, date } = useI18n();
  const [stats, setStats] = useState<any>({}); const [users, setUsers] = useState<any[]>([]); const [reqs, setReqs] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]); const [name, setName] = useState('');
  const load = () => { api('/admin/stats').then(setStats); api('/admin/users').then(setUsers); api('/admin/requests').then(setReqs); api('/categories').then(setCats); };
  useEffect(load, []);
  const toggle = async (u: any) => { await api(`/admin/users/${u._id}/active`, 'PATCH', { active: !u.active }); load(); };
  const addCat = async () => { if (name) { await api('/categories', 'POST', { name }); setName(''); load(); } };
  const delCat = async (id: string) => { await api(`/categories/${id}`, 'DELETE'); load(); };
  return (<>
    <div className="row g-3 mb-4">{Object.entries(stats).map(([k, v]) => <div className="col-6 col-md" key={k}><div className="card card-body text-center stat"><div className="fs-3 stat-num">{String(v)}</div><div className="text-muted">{t(`stat.${k}` as Keys)}</div></div></div>)}</div>
    <h5 className="section-title">{t('admin.categories')}</h5>
    <div className="d-flex gap-2 mb-2 flex-wrap">{cats.map(c => <span key={c._id} className="badge bg-secondary">{tc(c.name)} <a role="button" onClick={() => delCat(c._id)}>✕</a></span>)}</div>
    <div className="input-group mb-4" style={{ maxWidth: 360 }}><input className="form-control" placeholder={t('admin.newCat')} value={name} onChange={e => setName(e.target.value)} /><button className="btn btn-primary" onClick={addCat}>{t('admin.add')}</button></div>
    <h5 className="section-title">{t('admin.users')}</h5><div className="table-responsive mb-4"><table className="table table-sm"><thead><tr><th>{t('admin.name')}</th><th>{t('admin.email')}</th><th>{t('admin.role')}</th><th></th></tr></thead><tbody>
      {users.map(u => <tr key={u._id}><td><div className="d-flex align-items-center gap-2"><Avatar role={u.role} gender={u.gender} name={u.name} size={34} />{u.name}</div></td><td dir="ltr" className="text-start">{u.email}</td><td>{t(`role.${u.role}` as Keys)}</td><td><button className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => toggle(u)}>{u.active ? t('admin.deactivate') : t('admin.activate')}</button></td></tr>)}</tbody></table></div>
    <h5 className="section-title">{t('admin.bookings')}</h5><div className="table-responsive"><table className="table table-sm"><thead><tr><th>{t('admin.customer')}</th><th>{t('admin.technician')}</th><th>{t('admin.category')}</th><th>{t('admin.when')}</th><th>{t('admin.status')}</th></tr></thead><tbody>
      {reqs.map(r => <tr key={r._id}><td>{r.customer?.name}</td><td>{r.technician?.name}</td><td>{tc(r.category)}{r.urgent && ' 🚨'}</td><td>{date(r.scheduledAt)}</td><td><span className={`badge bg-${statusColor[r.status]}`}>{ts(r.status)}</span></td></tr>)}</tbody></table></div>
  </>);
}
