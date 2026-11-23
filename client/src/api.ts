const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export async function api<T = any>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = localStorage.getItem('token');
  let r: Response;
  try {
    r = await fetch(BASE + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  } catch { throw new Error('Network error'); }   // translated by the UI (see i18n/core.ts)
  const d = await r.json().catch(() => ({}));
  // Expired/invalid token (e.g. the 7 days are over): clear it and send the user to log in again.
  if (r.status === 401 && token && !path.startsWith('/auth/')) {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.location.assign('/login');
  }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
export const statusLabel = (s: string) => s.replace('_', ' ');
export const statusColor: Record<string, string> = { pending: 'warning', accepted: 'info', in_progress: 'primary', completed: 'success', rejected: 'danger', cancelled: 'secondary' };
