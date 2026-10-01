import { FOLLOW_UP_DAYS } from './constants.js';

export const fmtNum = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

export const estimateTokens = (text = '') => Math.ceil(String(text).length / 4);

export const daysBetween = (fromIso, now = new Date()) => {
  if (!fromIso) return 0;
  const ms = now.getTime() - new Date(fromIso).getTime();
  return Math.floor(ms / 86_400_000);
};

export const isFollowUpDue = (app, now = new Date()) =>
  app.status === 'sent' && Boolean(app.sentAt) && daysBetween(app.sentAt, now) >= FOLLOW_UP_DAYS;

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export function toCsv(rows) {
  const cols = ['company', 'role', 'status', 'createdAt', 'sentAt', 'notes'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
