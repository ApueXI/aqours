import type { Category, LocationInput } from '@aqours/contracts';
import { parseManilaInput } from '../../../utils/time';
import type { Photo } from '../components/photos';

export const reportSteps = ['Problem', 'Location', 'Photos', 'Review'] as const;
export type ReportDraft = {
  step: number; visited: number; selected: string | null; category: Category; description: string; guidedDetails: string;
  noticed: string; location: LocationInput | null; locationReady: boolean; photos: Photo[]; error: string | null;
};
type Editable = Pick<ReportDraft, 'description' | 'guidedDetails' | 'noticed' | 'location' | 'locationReady' | 'photos'>;
export type DraftAction =
  | { type: 'edit'; patch: Partial<Editable> }
  | { type: 'category'; value: Category }
  | { type: 'connection'; id: string }
  | { type: 'next'; hasConnection: boolean; now: number }
  | { type: 'back' }
  | { type: 'review'; step: number }
  | { type: 'error'; message: string; step?: number };

export function createReportDraft(noticed: string): ReportDraft {
  return { step: 0, visited: 0, selected: null, category: 'outage', description: '', guidedDetails: '', noticed,
    location: null, locationReady: true, photos: [], error: null };
}

export function reportStepError(draft: ReportDraft, step: number, hasConnection: boolean, now: number): string | null {
  if (step === 0) {
    if (!draft.description.trim()) return 'Describe the water problem before continuing.';
    const noticedAt = parseManilaInput(draft.noticed);
    if (!noticedAt) return 'Enter the time noticed as YYYY-MM-DD HH:mm in Asia/Manila.';
    if (Date.parse(noticedAt) > now + 60000) return 'The time noticed cannot be in the future.';
  }
  if (step === 1) {
    if (!hasConnection) return 'A saved connection is required. Ask the supplier to provision it.';
    if (!draft.locationReady) return 'Confirm the issue location, choose address-only reporting, or use your saved address.';
  }
  return null;
}

export function reportDraftReducer(draft: ReportDraft, action: DraftAction): ReportDraft {
  switch (action.type) {
    case 'edit': return { ...draft, ...action.patch, error: null };
    case 'category': return { ...draft, category: action.value, guidedDetails: '', error: null };
    case 'connection': return action.id === draft.selected ? draft
      : { ...draft, selected: action.id, location: null, locationReady: true, error: null };
    case 'back': return { ...draft, step: Math.max(0, draft.step - 1), error: null };
    case 'review': return { ...draft, step: Math.max(0, Math.min(3, action.step)), visited: Math.max(draft.visited, Math.min(3, action.step)), error: null };
    case 'error': return { ...draft, error: action.message, step: action.step ?? draft.step };
    case 'next': {
      const error = reportStepError(draft, draft.step, action.hasConnection, action.now);
      return error ? { ...draft, error } : { ...draft, step: Math.min(3, draft.step + 1), visited: Math.max(draft.visited, Math.min(3, draft.step + 1)), error: null };
    }
  }
}
