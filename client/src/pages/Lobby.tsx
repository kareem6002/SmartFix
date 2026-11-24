import { PointerEvent as RPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Role } from '../auth';
import { Logo } from '../Logo';
import { Keys, useI18n } from '../i18n';
import { useTheme } from '../Theme';
import { Brand, ROLES } from './Login';
import './lobby.css';

/**
 * First screen for visitors:
 *   1. the lobby photo, full screen, with a single "Enter" button
 *   2. the camera zooms in on the receptionist and she greets you in a speech bubble
 *   3. a tablet rises from the bottom; swipe through the 4 roles you can join as and tap one to go to its login page
 * (Admins have no sign-up, so they only get a small "Admin sign in" link on the tablet.)
 */
const IMG_W = 1672, IMG_H = 941;            // size of /art/lobby.webp
const FACE_X = 850 / IMG_W, FACE_Y = 520 / IMG_H;   // the receptionist's face inside the photo (0..1)
const HEAD = 40 / IMG_H;                    // face centre -> top of her head, as a fraction of the photo height
const TABLET_ROLES: Role[] = ['customer', 'technician', 'engineer', 'company'];
// Region of the photo that also exists as a 4x AI-upscaled image (/art/reception-hd.webp), faded in while zoomed so the zoom stays sharp
const HD = { x0: 520, y0: 330, x1: 1180, y1: 760 };
const ZOOM_MS = 1700, TALK_MS = 1500;

type Phase = 'intro' | 'zoom' | 'talk' | 'tablet';
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener('resize', on); window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return vp;
}

/** Words appear one after another, like she is talking. */
function useTyped(text: string, run: boolean, instant: boolean) {
  const words = text.split(' '); const [n, setN] = useState(instant ? words.length : 0);
  useEffect(() => {
    if (!run) return;
    if (instant) { setN(words.length); return; }
    setN(0); let i = 0;
    const id = window.setInterval(() => { i++; setN(i); if (i >= words.length) clearInterval(id); }, 120);
    return () => clearInterval(id);
  }, [run, text, instant]);   // eslint-disable-line react-hooks/exhaustive-deps
  return words.slice(0, n).join(' ');
}

export function Lobby() {
  const { t, lang, setLang, dir } = useI18n(); const nav = useNavigate();
  const skip = !!(useLocation().state as { skipIntro?: boolean } | null)?.skipIntro;   // coming back from a login page -> no need to replay the intro
  const [phase, setPhase] = useState<Phase>(skip ? 'tablet' : 'intro');
  const [snap, setSnap] = useState(true);     // first frame: place the camera without animating
  const { w: vw, h: vh } = useViewport(); const portrait = vh > vw;

  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false))); return () => cancelAnimationFrame(id); }, []);
  useEffect(() => {
    if (phase === 'zoom') { const id = window.setTimeout(() => setPhase('talk'), reduced() ? 50 : ZOOM_MS); return () => clearTimeout(id); }
    if (phase === 'talk') { const id = window.setTimeout(() => setPhase('tablet'), reduced() ? 50 : TALK_MS); return () => clearTimeout(id); }
  }, [phase]);

  // --- camera: preserve the complete photo ("contain") on every aspect ratio; the backdrop fills the remaining space ---
  const s = Math.min(vw / IMG_W, vh / IMG_H), w = IMG_W * s, h = IMG_H * s, left = (vw - w) / 2, top = (vh - h) / 2;
  const cover = Math.max(vw / IMG_W, vh / IMG_H);   // zoom levels are defined relative to a screen-filling photo
  const zoomed = phase !== 'intro';
  const apparent = !zoomed ? s : cover * (phase === 'tablet' ? (portrait ? 1.9 : 2.5) : (portrait ? 2.2 : 3));
  const z = apparent / s;
  const qx = vw / 2, qy = !zoomed ? vh / 2 : phase === 'tablet' ? vh * (portrait ? 0.31 : 0.3) : vh * 0.55;   // where her face should land on screen
  const tx = zoomed ? qx - left - z * FACE_X * w : 0, ty = zoomed ? qy - top - z * FACE_Y * h : 0;
  const head = HEAD * h * z, shoulder = 0.024 * w * z;
  const enterPos = { bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))' };

  const greet = useTyped(t('lobby.greet'), phase === 'talk' || phase === 'tablet', skip || reduced());
  const bubbleOn = phase === 'talk' || phase === 'tablet';

  return (
    <div className={`lobby ${portrait ? 'portrait' : 'landscape'} ph-${phase}`} dir={dir}
      style={{ ['--qx' as string]: `${qx}px`, ['--qy' as string]: `${qy}px`, ['--head' as string]: `${head}px`, ['--shoulder' as string]: `${shoulder}px`, ['--vh' as string]: `${vh}px` }}>
      <img className="lobby-bg" src="/art/lobby.webp" alt="" aria-hidden="true" draggable={false} />
      <div className={`lobby-world ${snap ? 'snap' : ''}`} style={{ left, top, width: w, height: h, transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
        <img src="/art/lobby.webp" width={IMG_W} height={IMG_H} alt={t('lobby.alt')} draggable={false} />
        <img className={`lobby-hd ${zoomed ? 'on' : ''}`} src="/art/reception-hd.webp" alt="" aria-hidden="true" draggable={false}
          style={{ left: `${HD.x0 / IMG_W * 100}%`, top: `${HD.y0 / IMG_H * 100}%`, width: `${(HD.x1 - HD.x0) / IMG_W * 100}%`, height: `${(HD.y1 - HD.y0) / IMG_H * 100}%` }} />
      </div>
      <div className="lobby-shade" aria-hidden="true" />

      {phase === 'intro' && <div className="lobby-intro-copy"><div className="lobby-brand"><Logo size={42} /><strong>Smart<span>Fix</span></strong></div><p>{t('landing.eyebrow').replace('🛠️ ', '')}</p></div>}

      {phase === 'intro' && <button className="lobby-enter" style={enterPos} autoFocus onClick={() => setPhase('zoom')}><span>{t('lobby.enter')}</span><i aria-hidden="true">→</i></button>}

      {bubbleOn && (
        <div className="lobby-bubble" role="status" aria-label={t('lobby.reception')}>
          <p><Brand text={greet} />{greet.split(' ').length < t('lobby.greet').split(' ').length && <span className="caret" aria-hidden="true" />}</p>
        </div>
      )}

      {phase === 'tablet' && <Tablet onPick={r => nav(`/login/${r}`)} lang={lang} setLang={setLang} />}
    </div>
  );
}

function Tablet({ onPick, lang, setLang }: { onPick: (r: Role) => void; lang: string; setLang: (l: any) => void }) {
  const { t, dir } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [idx, setIdx] = useState(0); const [drag, setDrag] = useState(0); const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(true); const [leaving, setLeaving] = useState(false);
  const view = useRef<HTMLDivElement>(null);
  const g = useRef({ x0: 0, id: -1, moved: false, down: false });
  const last = TABLET_ROLES.length - 1;
  const go = useCallback((i: number) => { setIdx(Math.max(0, Math.min(last, i))); setHint(false); }, [last]);
  const pick = (r: Role) => { if (g.current.moved || leaving) return; setLeaving(true); window.setTimeout(() => onPick(r), reduced() ? 0 : 260); };

  const down = (e: RPointerEvent) => { if (e.button > 0) return; g.current = { x0: e.clientX, id: e.pointerId, moved: false, down: true }; };
  const move = (e: RPointerEvent) => {
    const c = g.current; if (!c.down) return;
    const dx = e.clientX - c.x0;
    if (!c.moved && Math.abs(dx) > 8) { c.moved = true; setDragging(true); try { view.current?.setPointerCapture(c.id); } catch { /* ignore */ } }   // capture only once it's a real swipe, so plain taps still reach the buttons
    if (c.moved) {
      const atEdge = (idx === 0 && dx > 0) || (idx === last && dx < 0);
      setDrag(atEdge ? dx * 0.3 : dx);
    }
  };
  const up = (e: RPointerEvent) => {
    const c = g.current; if (!c.down) return; c.down = false;
    if (c.moved) {
      const dx = e.clientX - c.x0, width = view.current?.clientWidth ?? 400;
      if (Math.abs(dx) > Math.min(70, width * 0.18)) go(idx + (dx < 0 ? 1 : -1));
      setDragging(false); setDrag(0);
      window.setTimeout(() => { g.current.moved = false; }, 0);   // let the click that follows a swipe be ignored
    }
  };
  const key = (e: React.KeyboardEvent) => { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); };

  return (
    <div className={`tablet-wrap ${leaving ? 'leaving' : ''}`}>
      <div className="tablet" onKeyDown={key}>
        <span className="tablet-cam" aria-hidden="true" />
        <div className="tablet-screen">
          <div className="tablet-bar">
            <span className="tb-brand"><Logo size={26} /><b>Smart<em>Fix</em></b></span>
            <span className="tb-title">{t('lobby.pickRole')}</span>
            <div className="lang-switch tb-lang" role="group" aria-label={t('nav.language')}>
              <button type="button" lang="en" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
              <button type="button" lang="ar" className={lang === 'ar' ? 'on' : ''} aria-pressed={lang === 'ar'} onClick={() => setLang('ar')}>العربية</button>
            </div>
            <button type="button" className="theme-toggle lobby-theme" onClick={toggleTheme} aria-label={t(`theme.switch.${theme === 'dark' ? 'light' : 'dark'}` as Keys)} title={t(`theme.switch.${theme === 'dark' ? 'light' : 'dark'}` as Keys)}><span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span></button>
          </div>

          <div className="tablet-view" ref={view} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <div className={`tablet-track ${dragging ? 'dragging' : ''}`} style={{ transform: `translateX(calc(${-idx * 100}% + ${drag}px))` }}>
              {TABLET_ROLES.map((r, i) => (
                <article key={r} className={`slide ${i === idx ? 'on' : ''}`} dir={dir} aria-hidden={i !== idx} onClick={() => pick(r)}>
                  <div className={`slide-art art-${r}`}><img src={ROLES[r].art} alt="" draggable={false} /></div>
                  <div className="slide-body">
                    <span className="slide-icon" aria-hidden="true">{ROLES[r].icon}</span>
                    <h3>{t(`role.${r}` as Keys)}</h3>
                    <p>{t(`role.${r}.blurb` as Keys)}</p>
                    <button type="button" className="slide-go" tabIndex={i === idx ? 0 : -1}>{t('lobby.choose')} <span className="arr">→</span></button>
                  </div>
                </article>
              ))}
            </div>
            <button type="button" className="tv-arrow prev" aria-label={t('lobby.prev')} disabled={idx === 0} onClick={() => go(idx - 1)}>‹</button>
            <button type="button" className="tv-arrow next" aria-label={t('lobby.next')} disabled={idx === last} onClick={() => go(idx + 1)}>›</button>
          </div>

          <div className="tablet-foot">
            <div className="dots" role="tablist">{TABLET_ROLES.map((r, i) => <button key={r} type="button" role="tab" aria-selected={i === idx} aria-label={t(`role.${r}` as Keys)} className={i === idx ? 'on' : ''} onClick={() => go(i)} />)}</div>
            <span className={`swipe-hint ${hint ? '' : 'gone'}`} aria-hidden={!hint}><i>👆</i> {t('lobby.swipe')}</span>
            <Link className="tb-admin" to="/login/admin">{t('lobby.admin')}</Link>
          </div>
        </div>
        <span className="thumb l" aria-hidden="true" /><span className="thumb r" aria-hidden="true" />
      </div>
    </div>
  );
}
