import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

const readFile = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });

export function WorkHistory({ enabled = true }: { enabled?: boolean }) {
  const { t, err: tr } = useI18n();
  const [items, setItems] = useState<any[]>([]); const [label, setLabel] = useState(''); const [description, setDescription] = useState(''); const [photos, setPhotos] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const load = () => api('/portfolio/me').then(setItems).catch(() => setItems([]));
  useEffect(() => { if (enabled) load(); }, [enabled]);
  if (!enabled) return null;
  const choose = async (e: ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []).slice(0, 4); try { setPhotos(await Promise.all(files.map(readFile))); } catch { setError(t('work.imageReadError')); } };
  const add = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setNotice(''); setError(''); try { await api('/portfolio', 'POST', { label, description, photos }); setLabel(''); setDescription(''); setPhotos([]); setNotice(t('work.added')); load(); } catch (x: any) { setError(tr(x.message)); } finally { setBusy(false); } };
  const remove = async (id: string) => { try { await api(`/portfolio/${id}`, 'DELETE'); load(); } catch (x: any) { setError(tr(x.message)); } };
  return <section className="work-history card"><div className="card-body"><div className="d-flex justify-content-between align-items-start gap-3 flex-wrap"><div><h4 className="mb-1">{t('work.previousTitle')}</h4><p className="text-muted mb-0">{t('work.previousSubtitle')}</p></div><span className="work-history-mark">{t('provider.portfolio')}</span></div>
    <form className="work-history-form mt-3" onSubmit={add}><div className="row g-2"><div className="col-md-5"><label className="form-label">{t('work.serviceLabel')}</label><input className="form-control" required maxLength={80} placeholder={t('work.servicePlaceholder')} value={label} onChange={e => setLabel(e.target.value)} /></div><div className="col-md-7"><label className="form-label">{t('work.photos')}</label><input className="form-control" type="file" accept="image/*" multiple onChange={choose} /><small className="text-muted">{t('work.photoLimit')}</small></div><div className="col-12"><label className="form-label">{t('work.description')}</label><textarea className="form-control" required minLength={5} maxLength={800} rows={3} placeholder={t('work.descriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} /></div></div>
    {photos.length > 0 && <div className="work-photo-preview">{photos.map((p, i) => <img key={i} src={p} alt={t('work.selectedPhoto', { n: i + 1 })} />)}</div>}{error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}{notice && <div className="alert alert-success mt-2 mb-0">{notice}</div>}
    <button className="btn btn-primary mt-3" disabled={busy}>{busy ? t('profile.saving') : t('work.add')}</button></form>
    {items.length > 0 && <div className="work-grid mt-4">{items.map(item => <article className="work-card" key={item._id}>{item.photos?.length > 0 ? <div className="work-cover"><img src={item.photos[0]} alt={item.label} /></div> : <div className="work-cover work-cover-empty">🛠️</div>}<div className="work-card-body"><span className="work-label">{item.label}</span><p>{item.description}</p><button className="btn btn-sm btn-outline-danger" onClick={() => remove(item._id)}>{t('team.remove')}</button></div></article>)}</div>}
  </div></section>;
}
