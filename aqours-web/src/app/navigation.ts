import { query } from '../services/http-client';

export function detailLink(section: string, id: string, returnTo?: string) {
  return `#/${section}/${encodeURIComponent(id)}${returnTo ? query({ returnTo }) : ''}`;
}
export function returnLink(returnTo: string | null | undefined, fallback: string) {
  if (returnTo && /^\/(reports|map|incidents|assistance|distribution)(\?|\/|$)/.test(returnTo)) return `#${returnTo}`;
  return `#/${fallback}`;
}
