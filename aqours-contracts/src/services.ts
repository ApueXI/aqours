import type { AssistanceType, AssistanceStatus, AdvisoryKind, Geometry, TimelineEvent, Note } from './common.js';
export interface Advisory {
  id: string; kind: AdvisoryKind; title: string; text: string; source: string; zoneIds: string[];
  connectionIds: string[]; geometry: Geometry | null; startsAt: string | null; endsAt: string | null;
  state: 'draft' | 'published' | 'lifted'; publishedAt: string | null; liftedAt: string | null;
  liftReason: string | null; version: number; demo: boolean; updatedAt: string;
  revisions?: { version: number; text: string; source: string; action: string; createdAt: string }[];
}
export interface AssistanceDetails {
  question?: string; contactMethod?: 'phone'; contactNumber?: string; preferredWindow?: string;
  issueDetails?: string; siteAddress?: string; accessInstructions?: string;
  requestedLiters?: string; sessionId?: string | null; notes?: string;
}
export interface Allocation {
  id: string; requestId: string; sessionId: string; liters: string; reference: string;
  state: 'reserved' | 'collected' | 'released'; reservedAt: string; collectedAt: string | null; releasedAt: string | null;
}
export interface PickupSite { id: string; name: string; address: string; instructions: string; active: boolean; demo: boolean; latitude: number | null; longitude: number | null; version: number }
export interface PickupSession {
  id: string; siteId: string; site: PickupSite; zoneIds: string[]; startsAt: string; endsAt: string;
  status: 'open' | 'closed' | 'cancelled'; instructions: string; totalLiters: string;
  reservedLiters: string; collectedLiters: string; remainingLiters: string; availability: 'available' | 'full' | 'unavailable';
  version: number; demo: boolean; updatedAt: string;
}
export interface AssistanceRequest {
  id: string; reference: string; customerId: string; reportId: string; incidentId: string | null;
  type: AssistanceType; status: AssistanceStatus; ownerId: string | null; details: AssistanceDetails;
  appointmentAt: string | null; outcome: string | null; nextSteps: string | null; reason: string | null;
  createdAt: string; updatedAt: string; version: number; timeline?: TimelineEvent[]; notes?: Note[];
  allocation: Allocation | null; session: PickupSession | null; canCancel: boolean;
}
export interface GuidanceCard { action: AssistanceType | 'notice' | 'incident' | 'escalation'; title: string; reason: string; source: string; updatedAt: string; sourceId: string | null; sourceVersion: number | null; sourceType?: 'advisory' | 'incident' | 'rule' | 'guidance' | 'pickup' }
export interface Guidance {
  id: string; reportId: string; evaluatedAt: string; ruleVersion: number; current: boolean;
  uncertainty: string[]; questions: { key: string; label: string; options: string[] }[];
  cards: GuidanceCard[]; alternatives: AssistanceType[]; sourceSignature: string;
}
export interface RuleVersion { id: string; version: number; active: boolean; contactText: string; inspectionText: string; waterText: string; createdAt: string }
export interface ApprovedGuidance { id: string; kind: AdvisoryKind; text: string; source: string; version: number; createdAt: string }
export interface Metrics {
  from: string; to: string; asOf: string; timezone: string; cohort: string;
  activeIncidents: number; unresolvedReports: number; reportCount: number; uniqueConnections: number;
  categories: Record<string, number>; reviewedClosures: number; reopenedReports: number;
  firstResponse: { meanSeconds: number | null; sampleCount: number; pendingCount: number };
  firstResolution: { meanSeconds: number | null; sampleCount: number; excludedCount: number; pendingCount: number };
}
