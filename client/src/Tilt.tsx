import { HTMLAttributes, MouseEvent, ReactNode, useCallback, useRef } from 'react';

// Mouse-driven 3D tilt. Sets --rx/--ry (rotation) and --mx/--my (glare position) on the element; CSS does the rest.
// Does nothing on touch screens or when the user prefers reduced motion.
const canTilt = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches;

export function useTilt<T extends HTMLElement>(max = 8) {
  const ref = useRef<T>(null);
  const onMouseMove = useCallback((e: MouseEvent<T>) => {
    const el = ref.current; if (!el || !canTilt()) return;
    const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-(py - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  }, [max]);
  const onMouseLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

export function Tilt({ max = 8, className = '', children, ...rest }: { max?: number; className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const t = useTilt<HTMLDivElement>(max);
  return <div ref={t.ref} onMouseMove={t.onMouseMove} onMouseLeave={t.onMouseLeave} className={`tilt ${className}`} {...rest}>{children}</div>;
}
