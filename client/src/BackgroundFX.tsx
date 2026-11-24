import { useEffect, useRef } from 'react';

// Interactive page background: drifting home-repair icons with depth (parallax), a soft glow that follows the
// cursor, icons that drift away from / spin near the pointer, and a shockwave on click or tap.
// Pure canvas, ~15-30 shapes, paused automatically in background tabs. Static when the user prefers reduced motion.
type Kind = 'wrench' | 'gear' | 'house' | 'bolt' | 'drop' | 'ring' | 'plus';
const KINDS: Kind[] = ['wrench', 'gear', 'house', 'bolt', 'drop', 'ring', 'plus', 'wrench', 'house', 'gear', 'bolt', 'drop'];
const COLORS = ['#14205c', '#f58220', '#3d5bff', '#14205c', '#f58220'];

interface P { x: number; y: number; vx: number; vy: number; dx: number; dy: number; dvx: number; dvy: number; z: number; size: number; rot: number; vr: number; spin: number; kind: Kind; color: string; alpha: number }

let paths: Record<string, Path2D> | null = null;
const getPaths = () => paths ??= {
  wrench: new Path2D('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'),
  house: new Path2D('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10'),
  bolt: new Path2D('M13 2 3 14h9l-1 8 10-12h-9l1-8z'),
  drop: new Path2D('M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'),
};

function drawShape(ctx: CanvasRenderingContext2D, p: P, px: number, py: number) {
  ctx.save();
  ctx.translate(p.x + p.dx + px, p.y + p.dy + py); ctx.rotate(p.rot);
  const s = p.size / 24; ctx.scale(s, s); ctx.translate(-12, -12);
  ctx.globalAlpha = p.alpha; ctx.strokeStyle = p.color; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (p.kind === 'gear') {
    ctx.beginPath(); ctx.arc(12, 12, 3.2, 0, 7); ctx.moveTo(18.6, 12); ctx.arc(12, 12, 6.6, 0, 7);
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; ctx.moveTo(12 + Math.cos(a) * 6.6, 12 + Math.sin(a) * 6.6); ctx.lineTo(12 + Math.cos(a) * 9.8, 12 + Math.sin(a) * 9.8); }
    ctx.stroke();
  } else if (p.kind === 'ring') { ctx.beginPath(); ctx.arc(12, 12, 8, 0, 7); ctx.stroke(); }
  else if (p.kind === 'plus') { ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(12, 19); ctx.moveTo(5, 12); ctx.lineTo(19, 12); ctx.stroke(); }
  else ctx.stroke(getPaths()[p.kind]);
  ctx.restore();
}

export function BackgroundFX() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, raf = 0, last = performance.now();
    const ps: P[] = []; const m = { x: -9999, y: -9999, sx: 0, sy: 0, active: false, glow: 0 };
    const R = 190;

    const make = (): P => {
      const z = 0.35 + Math.random() * 0.65;
      return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3 * z, vy: (Math.random() - 0.5) * 0.3 * z - 0.04, dx: 0, dy: 0, dvx: 0, dvy: 0,
        z, size: (24 + Math.random() * 38) * (0.6 + z * 0.7) * (W < 600 ? 0.62 : 1), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.004, spin: 0,
        kind: KINDS[Math.floor(Math.random() * KINDS.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)], alpha: 0.15 + z * 0.19 };
    };
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = Math.round(Math.min(36, Math.max(16, (W * H) / 38000)));
      while (ps.length < want) ps.push(make()); ps.length = want;
      if (m.sx === 0) { m.sx = W / 2; m.sy = H / 2; }
      if (still) frame(0);
    };

    const frame = (dt: number) => {
      ctx.clearRect(0, 0, W, H);
      m.sx += (m.active ? m.x - m.sx : W / 2 - m.sx) * 0.08 * dt; m.sy += (m.active ? m.y - m.sy : H / 2 - m.sy) * 0.08 * dt;
      m.glow += ((m.active ? 1 : 0) - m.glow) * 0.06 * dt;
      if (m.glow > 0.01) {                       // soft glow that follows the cursor
        const g = ctx.createRadialGradient(m.sx, m.sy, 0, m.sx, m.sy, 300);
        g.addColorStop(0, `rgba(245,130,32,${0.17 * m.glow})`); g.addColorStop(0.5, `rgba(80,110,255,${0.07 * m.glow})`); g.addColorStop(1, 'rgba(80,110,255,0)');
        ctx.fillStyle = g; ctx.fillRect(m.sx - 300, m.sy - 300, 600, 600);
      }
      const pxo = (m.sx - W / 2), pyo = (m.sy - H / 2); const margin = 70;
      ps.sort((a, b) => a.z - b.z);
      for (const p of ps) {
        if (!still) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr + p.spin) * dt;
          if (p.x < -margin) p.x = W + margin; else if (p.x > W + margin) p.x = -margin;
          if (p.y < -margin) p.y = H + margin; else if (p.y > H + margin) p.y = -margin;
          const cx = p.x + p.dx, cy = p.y + p.dy;
          if (m.active) {
            const ddx = cx - m.x, ddy = cy - m.y, d = Math.hypot(ddx, ddy);
            if (d < R) { const f = 1 - d / R, k = f * f * 1.6 * (0.5 + p.z); p.dvx += (ddx / (d || 1)) * k * dt; p.dvy += (ddy / (d || 1)) * k * dt; p.spin += f * 0.0016 * dt; }
          }
          p.dvx += -p.dx * 0.012 * dt; p.dvy += -p.dy * 0.012 * dt;           // spring back to its path
          const damp = Math.pow(0.9, dt); p.dvx *= damp; p.dvy *= damp; p.spin *= Math.pow(0.95, dt);
          p.dx += p.dvx * dt; p.dy += p.dvy * dt;
        }
        drawShape(ctx, p, -pxo * 0.035 * p.z, -pyo * 0.035 * p.z);          // nearer icons shift more = depth
      }
    };
    const loop = (t: number) => { const dt = Math.min(2.5, (t - last) / 16.67); last = t; frame(dt); raf = requestAnimationFrame(loop); };

    const move = (e: PointerEvent) => { m.x = e.clientX; m.y = e.clientY; m.active = true; };
    const down = (e: PointerEvent) => {       // shockwave
      move(e);
      for (const p of ps) { const ddx = p.x + p.dx - e.clientX, ddy = p.y + p.dy - e.clientY, d = Math.hypot(ddx, ddy);
        if (d < 380) { const k = (1 - d / 380) * 15 * (0.5 + p.z); p.dvx += (ddx / (d || 1)) * k; p.dvy += (ddy / (d || 1)) * k; p.spin += (1 - d / 380) * 0.05; } }
    };
    const up = (e: PointerEvent) => { if (e.pointerType !== 'mouse') m.active = false; };
    const leave = () => { m.active = false; };

    resize(); window.addEventListener('resize', resize);
    if (!still) {
      window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerdown', down, { passive: true });
      window.addEventListener('pointerup', up, { passive: true }); document.documentElement.addEventListener('mouseleave', leave); window.addEventListener('blur', leave);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('mouseleave', leave); window.removeEventListener('blur', leave);
    };
  }, []);
  return <canvas ref={ref} className="bg-fx" aria-hidden="true" />;
}
