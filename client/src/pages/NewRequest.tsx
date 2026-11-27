import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './newrequest.css';
import { api } from '../api';
import { Avatar } from '../AvatarComponent';
import { Tilt } from '../Tilt'; import { AffChips } from '../AffChips';
import { Keys, useI18n } from '../i18n';
import { ICONS } from './Customer';
import { MAX_PHOTOS, fileToDataUrl } from '../imageTools';
import { quickSlots, toLocalInput } from '../datetime';

const MIN_DESC = 10;
const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

export function NewRequest() {
  const nav = useNavigate(); const { t, tc, lang, years, err: tr } = useI18n();
  const q = useMemo(() => new URLSearchParams(location.search), []);
  const [cats, setCats] = useState<any[]>([]); const [techs, setTechs] = useState<any[]>([]);
  const [desc, setDesc] = useState(''); const [category, setCategory] = useState(q.get('category') || ''); const [technician, setTechnician] = useState(q.get('technician') || '');
  const [when, setWhen] = useState(''); const [urgent, setUrgent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]); const [photoErr, setPhotoErr] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null); const catRef = useRef(category); catRef.current = category;
  const slots = useMemo(() => quickSlots(), []); const minWhen = useMemo(() => toLocalInput(new Date()), []);

  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (!category) { setTechs([]); return; }
    api(`/technicians?category=${encodeURIComponent(category)}`).then(setTechs).catch(() => setTechs([]));
  }, [category]);

  const pickCategory = (name: string) => { if (name !== catRef.current) { setCategory(name); setTechnician(''); } };

  // ---- photos ----
  const addFiles = async (files: FileList | File[]) => {
    const imgs = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { setPhotoErr(t('nr.photos.bad')); return; }
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { setPhotoErr(t('nr.photos.tooMany', { n: MAX_PHOTOS })); return; }
    try {
      const urls = await Promise.all(imgs.slice(0, room).map(f => fileToDataUrl(f)));
      setPhotos([...photos, ...urls]);
      setPhotoErr(imgs.length > room ? t('nr.photos.tooMany', { n: MAX_PHOTOS }) : '');
    } catch { setPhotoErr(t('nr.photos.bad')); }
  };
  const removePhoto = (i: number) => { setPhotos(photos.filter((_, n) => n !== i)); setPhotoErr(''); };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };

  // ---- completeness ----
  const descOk = desc.trim().length >= MIN_DESC, svcOk = !!category, techOk = !!technician, timeOk = !!when && new Date(when).getTime() > Date.now();
  const done = [descOk, svcOk, techOk, timeOk]; const doneCount = done.filter(Boolean).length; const ready = doneCount === 4 && !busy;
  const tech = techs.find(x => x._id === technician);
  const whenLabel = when ? new Date(when).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!ready) return; setBusy(true); setErr('');
    try { await api('/requests', 'POST', { technician, category, description: desc.trim(), urgent, scheduledAt: new Date(when).toISOString(), photos }); nav('/my'); }
    catch (x: any) { setErr(tr(x.message)); setBusy(false); }
  };
  const Num = ({ n, ok }: { n: number; ok: boolean }) => <span className={`nr-num ${ok ? 'ok' : ''}`}>{ok ? '✓' : n}</span>;

  return (
    <form className="nr-page" onSubmit={submit} noValidate>
      {/* ---------- hero ---------- */}
      <section className="nr-hero">
        <div className="nr-hero-copy">
          <span className="eyebrow">{t('nr.eyebrow')}</span>
          <h1>{t('new.title')}</h1>
          <p>{t('nr.sub')}</p>
          <ol className="nr-steps">
            {([[descOk, 'nr.steps.describe'], [svcOk && techOk, 'nr.steps.choose'], [timeOk, 'nr.steps.schedule']] as [boolean, Keys][]).map(([ok, k], i) =>
              <li key={k} className={ok ? 'done' : ''}><b>{ok ? '✓' : i + 1}</b>{t(k)}</li>)}
          </ol>
        </div>
        <Tilt className="nr-hero-art" max={6}>
          <span className="orb o1" aria-hidden="true">📷</span><span className="orb o2" aria-hidden="true">✨</span><span className="orb o3" aria-hidden="true">🔧</span>
          <img src="/comic/sam.webp" alt="" />
        </Tilt>
      </section>

      <div className="nr-grid">
        <div className="nr-main">
          {/* ---------- 1. describe + photos ---------- */}
          <section className="nr-card">
            <header className="nr-card-head"><Num n={1} ok={descOk} /><div><h2>{t('nr.step1')}</h2><p>{t('nr.step1.sub')}</p></div></header>
            <div className="nr-split">
              <div className="nr-desc">
                <textarea className="nr-textarea" rows={7} placeholder={t('new.describe')} value={desc} maxLength={1000} onChange={e => setDesc(e.target.value)} />
                <small className={`nr-count ${descOk ? 'ok' : ''}`}>{t('nr.desc.count', { n: desc.trim().length, min: MIN_DESC })}</small>
              </div>
              <div className="nr-photos">
                <div className={`nr-drop ${over ? 'over' : ''} ${photos.length ? 'compact' : ''}`} role="button" tabIndex={0}
                  onClick={() => fileRef.current?.click()} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileRef.current?.click())}
                  onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
                  <span className="nr-drop-icon" aria-hidden="true">📷</span>
                  <b>{photos.length ? t('nr.photos.more') : t('nr.photos.title')}</b>
                  <small>{t('nr.photos.hint', { n: MAX_PHOTOS })}</small>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {photoErr && <div className="nr-photo-err" role="alert">{photoErr}</div>}
                {photos.length > 0 && <div className="nr-thumbs">{photos.map((src, i) =>
                  <div key={i} className="nr-thumb">
                    <img src={src} alt="" /><button type="button" aria-label={t('nr.photos.remove')} onClick={() => removePhoto(i)}>✕</button></div>)}</div>}
                <small className="nr-note">🔒 {t('nr.photos.note')}</small>
              </div>
            </div>
          </section>

          {/* ---------- 2. service + technician ---------- */}
          <section className="nr-card">
            <header className="nr-card-head"><Num n={2} ok={svcOk && techOk} /><div><h2>{t('nr.step2')}</h2><p>{t('nr.step2.sub')}</p></div></header>
            <div className="nr-cats">{cats.map(c =>
              <button type="button" key={c._id} className={`nr-cat ${category === c.name ? 'on' : ''}`} aria-pressed={category === c.name} onClick={() => pickCategory(c.name)}>
                <span className="nr-cat-icon" aria-hidden="true">{ICONS[c.name] || '🛠️'}</span><b>{tc(c.name)}</b><i className="nr-tick" aria-hidden="true">✓</i>
              </button>)}</div>
            <h3 className="nr-sub">{t('nr.tech.title')}</h3>
            {!category ? <div className="nr-empty">👆 {t('nr.tech.pick')}</div>
              : !techs.length ? <div className="nr-empty">{t('techs.none')}</div>
              : <div className="nr-techs">{techs.map(x =>
                <button type="button" key={x._id} className={`nr-tech ${technician === x._id ? 'on' : ''}`} aria-pressed={technician === x._id} onClick={() => setTechnician(x._id)}>
                  <Avatar role="technician" gender={x.gender} name={x.name} size={58} />
                  <span className="nr-tech-info"><b>{x.name}</b>
                    <span className="nr-tech-meta"><span className="stars" dir="ltr">{stars(x.rating || 0)}</span> <small>{x.rating ? x.rating.toFixed(1) : t('tech.new')} ({x.reviewCount || 0})</small></span>
                    <small>{years(x.experienceYears ?? 0)}</small><AffChips aff={x.affiliation} /></span>
                  <i className="nr-tick" aria-hidden="true">✓</i></button>)}</div>}
          </section>

          {/* ---------- 3. when ---------- */}
          <section className="nr-card">
            <header className="nr-card-head"><Num n={3} ok={timeOk} /><div><h2>{t('nr.step3')}</h2><p>{t('nr.step3.sub')}</p></div></header>
            <div className="nr-when">
              <div>
                <div className="nr-label">{t('nr.when.quick')}</div>
                <div className="nr-quick">{slots.map(s => <button type="button" key={s.id} className={`chip ${when === s.value ? 'on' : ''}`} onClick={() => setWhen(s.value)}>{t(`nr.q.${s.id}` as Keys)}</button>)}</div>
                <div className="nr-label mt-3">{t('nr.when.custom')}</div>
                <input className="nr-datetime" type="datetime-local" min={minWhen} value={when} onChange={e => setWhen(e.target.value)} />
              </div>
              <label className={`nr-urgent ${urgent ? 'on' : ''}`}>
                <input type="checkbox" role="switch" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
                <span className="nr-switch" aria-hidden="true" />
                <span><b>{t('new.emergency')}</b><small>{t('nr.urgent.desc')}</small></span>
              </label>
            </div>
          </section>
        </div>

        {/* ---------- live ticket ---------- */}
        <aside className="nr-aside">
          <div className="nr-ticket">
            <div className="nr-ticket-top">
              <div><small>{t('nr.ticket.title')}</small>
                <strong>{category ? tc(category) : t('nr.ticket.none')}</strong>
                {urgent && <span className="badge bg-danger mt-1">{t('jobs.urgent')}</span>}</div>
              <span className={`nr-ticket-icon ${category ? 'on' : ''}`}>{category ? (ICONS[category] || '🛠️') : '🛠️'}</span>
            </div>
            <div className="nr-perf" aria-hidden="true" />
            <div className="nr-ticket-body">
              <div className="nr-row"><small>{t('nr.ticket.tech')}</small>
                {tech ? <span className="nr-row-val"><Avatar role="technician" gender={tech.gender} name={tech.name} size={34} /> {tech.name}</span> : <span className="nr-none">{t('nr.ticket.none')}</span>}</div>
              <div className="nr-row"><small>{t('nr.ticket.when')}</small>{when ? <span className="nr-row-val">📅 {whenLabel}</span> : <span className="nr-none">{t('nr.ticket.none')}</span>}</div>
              {photos.length > 0 && <div className="nr-row"><small>📷 {t('nr.ticket.photos', { n: photos.length })}</small>
                <span className="nr-mini">{photos.map((p, i) => <img key={i} src={p} alt="" />)}</span></div>}
              <ul className="nr-check">{([[descOk, 'nr.check.describe'], [svcOk, 'nr.check.service'], [techOk, 'nr.check.tech'], [timeOk, 'nr.check.time']] as [boolean, Keys][]).map(([ok, k]) =>
                <li key={k} className={ok ? 'ok' : ''}><i>{ok ? '✓' : ''}</i>{t(k)}</li>)}</ul>
              <div className="nr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={doneCount}><i style={{ width: `${doneCount * 25}%` }} /></div>
              <small className="nr-progress-text">{t('nr.progress', { n: doneCount, total: 4 })}</small>
              {err && <div className="alert alert-danger mt-3 mb-0" role="alert">{err}</div>}
              <button className="btn btn-primary btn-lg w-100 mt-3" disabled={!ready}>{busy ? t('nr.booking') : t('new.book')}</button>
              {doneCount < 4 && <small className="nr-hint">{t('nr.hint')}</small>}
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
