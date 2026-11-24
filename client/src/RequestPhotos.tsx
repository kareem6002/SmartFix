import { useEffect, useState } from 'react';
import { api } from './api';
import { useI18n } from './i18n';
import './pages/newrequest.css';

/** "View photos" button for a request: loads the customer's photos on demand and shows them in a lightbox. */
export function RequestPhotos({ id, count }: { id: string; count: number }) {
  const { t, err } = useI18n();
  const [open, setOpen] = useState(false); const [photos, setPhotos] = useState<string[] | null>(null); const [big, setBig] = useState<string | null>(null); const [msg, setMsg] = useState('');
  const toggle = async () => {
    if (!open && !photos) { try { setPhotos((await api(`/requests/${id}/photos`)).photos); } catch (x: any) { setMsg(err(x.message)); setPhotos([]); } }
    setOpen(o => !o);
  };
  useEffect(() => {
    if (!big) return; const esc = (e: KeyboardEvent) => e.key === 'Escape' && setBig(null);
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [big]);
  return (
    <div className="rp">
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={toggle} aria-expanded={open}>{open ? t('photos.hide') : t('photos.view', { n: count })}</button>
      {open && <div className="rp-row">{photos ? (photos.length ? photos.map((p, i) => <button type="button" key={i} className="rp-thumb" onClick={() => setBig(p)}><img src={p} alt="" /></button>) : <small className="text-muted">{msg}</small>) : <small>{t('photos.loading')}</small>}</div>}
      {big && <div className="rp-light" role="dialog" aria-modal="true" onClick={() => setBig(null)}><img src={big} alt="" /><button type="button" className="rp-close" aria-label={t('photos.close')}>✕</button></div>}
    </div>
  );
}
