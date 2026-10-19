import type { Category, ReportStatus, IncidentStatus, Geometry, TimelineEvent, Note } from './common.js';
export interface Attachment { id: string; filename: string; mediaType: string; byteSize: number; createdAt: string }
export interface Message { id: string; text: string; authorId: string; authorRole: string; createdAt: string }
export interface IncidentUpdate {
  id: string; incidentId: string; status: IncidentStatus; progress: string; area: string;
  restorationAt: string | null; publishedAt: string; demo: boolean; geometry: Geometry | null;
}
export interface PublishedIncident {
  id: string; category: Category; summary: string; status: IncidentStatus; zoneIds: string[];
  demo: boolean; latestUpdate: IncidentUpdate; updates: IncidentUpdate[];
}
export interface Report {
  id: string; reference: string; customerId: string; connectionId: string; category: Category;
  description: string; guidedDetails: string | null; noticedAt: string; submittedAt: string; status: ReportStatus;
  address: string; locationSource: string; latitude: number | null; longitude: number | null;
  locationConfirmed: boolean; zoneId: string | null; zoneConfirmed: boolean; locationReview: boolean;
  priority: 'normal' | 'high' | 'urgent'; priorityReason: string | null; ownerId: string | null;
  incidentId: string | null; closureOutcome: 'restored' | 'duplicate' | 'invalid' | null;
  closureReason: string | null; version: number; firstRespondedAt: string | null; firstResolvedAt: string | null;
}
export interface ReportDetail extends Report {
  messages: Message[]; attachments: Attachment[]; timeline: TimelineEvent[];
  incident: PublishedIncident | null; notes?: Note[];
  customer?: { name: string; email: string; phone: string | null; connectionReference: string; savedAddress: string };
  suggestions?: { id: string; summary: string; reason: string }[];
}
export interface StaffIncident {
  id: string; category: Category; summary: string; status: IncidentStatus; ownerId: string | null;
  zoneIds: string[]; area: string; geometry: Geometry | null; restorationAt: string | null;
  estimatedAffected: number | null; estimateBasis: string | null; estimateUpdatedAt: string | null;
  demo: boolean; version: number; createdAt: string; updates: IncidentUpdate[];
  reports?: Report[]; notes?: Note[]; timeline?: TimelineEvent[]; reportCount: number; uniqueConnections: number;
}
export interface MapResponse {
  type: 'FeatureCollection'; features: { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { id: string; reference: string; category: Category; status: ReportStatus; priority: string } }[];
  unlocatedCount: number; total: number; truncated: boolean; limit: number;
}
