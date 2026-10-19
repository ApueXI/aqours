export function displayTime(value: string | null | undefined): string {
  if (!value) return 'Not yet confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
}

export function localInputNow(): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

export function parseManilaInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value.replace(' ', 'T')}:00+08:00`);
  if (!Number.isFinite(date.getTime())) return null;
  if (new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ') !== value) return null;
  return date.toISOString();
}

export function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}
