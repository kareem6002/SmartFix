import { avatarSrc } from './avatar';

export function Avatar({ role, gender, name, size = 44, className = '' }:
  { role?: string; gender?: string; name?: string; size?: number; className?: string }) {
  const src = avatarSrc(role, gender);
  const box = { width: size, height: size };
  if (src) return <img className={`avatar-img ${role} ${className}`} src={src} alt={name ? `${name}'s photo` : 'Profile photo'} style={box} />;
  return <span className={`avatar-img fallback ${className}`} style={{ ...box, fontSize: size * 0.42 }} aria-hidden="true">
    {role === 'admin' ? '🛡️' : (name?.trim()[0] || '?').toUpperCase()}</span>;
}
