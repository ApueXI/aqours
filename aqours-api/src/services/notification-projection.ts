import { project } from './projection.js';
import { generatedTimeText } from './presentation.js';

export function notificationSafe(row: Record<string, any>) {
  const data = project(row.data, ['title', 'text', 'targetType', 'targetId', 'sourceEventKey']);
  return {
    ...data,
    text: data.targetType === 'assistance' ? generatedTimeText(data.text, 'Appointment') : data.text,
    id: row.id, createdAt: row.created_at, readAt: row.read_at,
  };
}
