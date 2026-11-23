import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Avatar } from '../Avatar';
import { Keys, useI18n } from '../i18n';

export function Team() {
  const { user } = useAuth(); const { t, tc, years, err: tr } = useI18n();
  const role = user!.role as 'engineer' | 'company'; const memberRole = role === 'company' ? 'engineer' : 'technician';
  const [members, setMembers] = useState<any[]>([]); const [err, setErr] = useState('');
  const load = () => api('/team').then(d => setMembers(d?.members ?? [])).catch(x => setErr(tr(x.message)));
  useEffect(() => { load(); }, []);
  const remove = async (m: any) => {
    const who = m.role === 'engineer' ? t('title.engineer', { name: m.name }) : m.name;
    if (!window.confirm(t('team.removeConfirm', { name: who }))) return;
    try { await api(`/team/members/${m._id}`, 'DELETE'); await load(); } catch (x: any) { setErr(tr(x.message)); }
  };
  const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return <div className="team-page">
    <header className="team-head"><div><h3 className="section-title">{t(`team.title.${role}` as Keys)}</h3><p className="text-muted mb-0">{t(`team.sub.${role}` as Keys)}</p></div><Link className="btn btn-primary" to="/collaborate">{t('team.manageApplications')}</Link></header>
    {err && <div className="alert alert-danger" role="alert">{err}</div>}
    <section className="team-block"><h4 className="section-title">{t(role === 'company' ? 'team.membersEng' : 'team.membersTech')} ({members.length})</h4>
      {!members.length ? <div className="nr-empty">{t(`team.empty.${role}` as Keys)}</div> : <div className="team-grid">{members.map(m => <article key={m._id} className="team-card team-card-large card">
        <div className="team-card-photo"><Avatar role={memberRole} gender={m.gender} name={m.name} size={118} /><span className="team-role-mark">{memberRole === 'engineer' ? '📐' : '🛠️'}</span></div>
        <div className="team-card-content"><span className="provider-kind">{t(`role.${memberRole}` as Keys)}</span><h3>{memberRole === 'engineer' ? t('title.engineer', { name: m.name }) : m.name}</h3>
          <p className="provider-meta">{m.category ? tc(m.category) : t(`provider.specialty.${memberRole}` as Keys)}{m.experienceYears != null ? ` · ${years(m.experienceYears)}` : ''}</p>
          {memberRole === 'technician' && <div className="provider-rating"><span className="stars" dir="ltr">{stars(m.rating || 0)}</span> {m.rating ? m.rating.toFixed(1) : t('tech.new')} · {t('profile.reviews', { n: m.reviewCount || 0 })}</div>}
          {memberRole === 'engineer' && <p className="small text-muted">{t('team.techCount', { n: m.technicians?.length || 0 })}</p>}
          {m.bio && <p className="team-bio">{m.bio}</p>}
          <div className="team-card-actions"><Link className="btn btn-outline-primary" to={`/professionals/${memberRole}/${m._id}`}>{t('team.explore')}</Link><button type="button" className="btn btn-outline-danger" onClick={() => remove({ ...m, role: memberRole })}>{t('team.remove')}</button></div>
        </div>
      </article>)}</div>}
    </section>
  </div>;
}
