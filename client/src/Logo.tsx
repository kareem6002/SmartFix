// SmartFix mark: orange house outline with a wrench, on a navy tile.
export function Logo({ size = 38 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="SmartFix">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a3fa8" /><stop offset="1" stopColor="#14205c" /></linearGradient></defs>
      <rect width="48" height="48" rx="13" fill="url(#lg)" />
      <path d="M9 25 24 11l15 14" fill="none" stroke="#f58220" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 23v14h21V23" fill="none" stroke="#f58220" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 33.5 27.5 26a4 4 0 0 1 5-5l-2.6 2.6.6 2.2 2.2.6 2.6-2.6a4 4 0 0 1-5 5l-7.5 7.5a1.7 1.7 0 0 1-2.4-2.4Z" fill="#fff" />
    </svg>
  );
}
