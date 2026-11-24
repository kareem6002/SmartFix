import { useEffect, useRef, useState } from 'react';
import './comic.css';
import { useAuth } from '../auth';
import { Avatar } from '../Avatar';
import { useI18n } from '../i18n';
import { BubbleDef, Demo, PanelDef, STORY, Who } from './story';

const CHAR: Record<Who, string> = Object.fromEntries((['sam', 'mona', 'omar', 'sara', 'tarek', 'layla', 'adel', 'nour'] as Who[]).map(w => [w, `/comic/${w}.webp`])) as Record<Who, string>;
// where to aim the camera in each backdrop photo so faces stay visible
const SCENE_POS: Record<string, string> = { '/art/scene-engineers.webp': 'center 11%', '/art/scene-company.webp': 'center 13%' };

function Bubble({ b, tail }: { b: BubbleDef; tail: 'left' | 'right' | 'up' }) {
  const { t, dir } = useI18n();
  const vars: Record<string, string> = {}; (b.v ?? []).forEach((k, i) => { vars['abc'[i]] = t(k); });
  return <p className={`cbubble tail-${tail}`} dir={dir}>{t(b.k, vars)}</p>;
}

/** Little replicas of the real buttons, so people can recognise them in the app. */
function Demos({ items }: { items: Demo[] }) {
  const { t } = useI18n(); const { user } = useAuth();
  return (
    <div className="cdemo" aria-hidden="true">
      <small className="cdemo-label">{t('guide.lookFor')}</small>
      <div className="cdemo-items">
        {items.map((d, i) => {
          switch (d.t) {
            case 'pill': return <span key={i} className="nav-pill active demo-hl">{t(d.label)}</span>;
            case 'btn': return <span key={i} className={`btn btn-sm demo-hl ${{ primary: 'btn-primary', outline: 'btn-outline-secondary', danger: 'btn-outline-danger', success: 'btn-success' }[d.v ?? 'primary']}`}>{t(d.label)}</span>;
            case 'chip': return <span key={i} className={`chip ${d.on ? 'on demo-hl' : ''}`}>{d.icon} {t(d.label)}</span>;
            case 'badge': return <span key={i} className={`badge bg-${d.c}`}>{t(d.label)}{d.suffix}</span>;
            case 'check': return <span key={i} className="demo-check demo-hl"><b>✔</b> {t(d.label)}</span>;
            case 'tag': return <span key={i} className="aff-chip">{t(d.label)}</span>;
            case 'field': return <span key={i} className="demo-field">{t(d.ph)}</span>;
            case 'stars': return <span key={i} className="demo-stars" dir="ltr">★★★★★ <small>4.9</small></span>;
            case 'photo': return <span key={i} className="demo-photo demo-hl"><Avatar role={user?.role} gender={user?.gender} name={user?.name} size={46} /></span>;
          }
        })}
      </div>
    </div>
  );
}

const Sfx = ({ text, inflow }: { text: string; inflow?: boolean }) => <div className={`sfx ${inflow ? 'inflow' : ''}`} aria-hidden="true"><span>{text}</span></div>;

function Panel({ p, area }: { p: PanelDef; area: string }) {
  const { t, dir } = useI18n();
  const cls = `cpanel ${p.kind} bg-${p.bg} ${p.side ? `side-${p.side}` : ''} ${p.big ? 'big' : ''} ${p.cap ? 'has-cap' : ''}`;
  const cap = p.cap && <div className="ccap" dir={dir}>{t(p.cap)}</div>;
  const demo = p.demo && <Demos items={p.demo} />;
  if (p.kind === 'scene') return (
    <section className={cls} style={{ gridArea: area, ...(p.scene ? { backgroundImage: `url(${p.scene})`, backgroundPosition: SCENE_POS[p.scene] ?? 'center 28%', minHeight: 385 } : {}) }}>{cap}{p.sfx && <Sfx text={t(p.sfx)} />}
      <div className="ctext" dir={dir}>{p.bubbles.map((b, i) => <Bubble key={i} b={b} tail="up" />)}{demo}</div></section>);
  if (p.kind === 'duo') { const [l, r] = p.who as [Who, Who]; return (
    <section className={cls} style={{ gridArea: area }}>{cap}{p.sfx && <Sfx text={t(p.sfx)} />}
      <div className="cchar left"><img src={CHAR[l]} alt="" draggable={false} /></div>
      <div className="ctext" dir={dir}>{p.bubbles.map((b, i) => <Bubble key={i} b={b} tail={i === 0 ? 'left' : 'right'} />)}{demo}</div>
      <div className="cchar right"><img src={CHAR[r]} alt="" draggable={false} /></div></section>); }
  return (
    <section className={cls} style={{ gridArea: area }}>{cap}
      <div className="cchar"><img src={CHAR[p.who as Who]} alt="" draggable={false} /></div>
      <div className="ctext" dir={dir}>{p.bubbles.map((b, i) => <Bubble key={i} b={b} tail={p.side === 'right' ? 'right' : 'left'} />)}{demo}{p.sfx && <Sfx text={t(p.sfx)} inflow />}</div></section>);
}

/** Full-screen comic book shown after login: 3 comics for the user's role, with Skip. */
export function ComicGuide() {
  const { user, closeGuide } = useAuth(); const { t, dir } = useI18n();
  const pages = STORY[user!.role]; const [i, setI] = useState(0); const [way, setWay] = useState<1 | -1>(1); const [never, setNever] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null); const last = i === pages.length - 1;
  const go = (n: number) => { if (n < 0 || n >= pages.length) return; setWay(n > i ? 1 : -1); setI(n); };
  const finish = () => closeGuide(never);

  useEffect(() => {
    document.body.style.overflow = 'hidden'; nextRef.current?.focus();
    return () => { document.body.style.overflow = ''; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const fwd = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight', back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === 'Escape') finish(); else if (e.key === fwd) (last ? finish() : go(i + 1)); else if (e.key === back) go(i - 1);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  const page = pages[i];
  return (
    <div className="comic-overlay" role="dialog" aria-modal="true" aria-label={t('guide.label')}>
      <div className="comic-book" dir={dir}>
        <div className="comic-top">
          <span className="comic-series">{t('guide.series')} <b>{t('guide.issue', { n: i + 1 })}</b></span>
          <button className="comic-skip" onClick={finish}>{t('guide.skip')} ✕</button>
        </div>
        <div className="comic-stage">
          <article key={i} className={`cpage L${page.layout}`} style={{ ['--flip' as any]: `${(dir === 'rtl' ? -1 : 1) * way * -78}deg` }}>
            <h2 className="ctitle" dir={dir}>{t(page.title)}</h2>
            <div className="cgrid">{page.panels.map((p, n) => <Panel key={n} p={p} area={`p${n + 1}`} />)}</div>
          </article>
        </div>
        <div className="comic-bar">
          <label className="comic-never"><input type="checkbox" checked={never} onChange={e => setNever(e.target.checked)} /> {t('guide.dontShow')}</label>
          <div className="comic-dots" role="group" aria-label={t('guide.page', { n: i + 1, total: pages.length })}>
            {pages.map((_, n) => <button key={n} className={`dot ${n === i ? 'on' : ''}`} onClick={() => go(n)} aria-label={t('guide.page', { n: n + 1, total: pages.length })} aria-current={n === i} />)}
          </div>
          <div className="comic-nav">
            <button className="cbtn" onClick={() => go(i - 1)} disabled={i === 0}><span className="arr">◀</span> {t('guide.back')}</button>
            <button className="cbtn go" ref={nextRef} onClick={() => (last ? finish() : go(i + 1))}>{last ? t('guide.done') : <>{t('guide.next')} <span className="arr">▶</span></>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
