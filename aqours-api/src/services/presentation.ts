const serviceTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23',
});

// Normalize only machine-generated date labels, without changing immutable stored text.
export function generatedTimeText(text: string, label: 'Appointment' | 'Restoration') {
  const pattern = new RegExp(`\\b${label}: (\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z)`, 'g');
  return text.replace(pattern, (original, instant: string) => {
    const date = new Date(instant);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== instant.slice(0, 19)) return original;
    return `${label}: ${serviceTime.format(date)} (Asia/Manila)`;
  });
}
