export const categories = ['outage', 'low_pressure', 'leak', 'water_quality'] as const;
export type Category = typeof categories[number];
export type Role = 'customer' | 'staff' | 'admin';
export type ReportStatus = 'received' | 'under_review' | 'in_progress' | 'resolved';
export type IncidentStatus = 'investigating' | 'confirmed' | 'work_in_progress' | 'monitoring' | 'resolved';
export type AssistanceType = 'callback' | 'inspection' | 'water_support';
export type AssistanceStatus = 'requested' | 'accepted' | 'scheduled' | 'in_progress' | 'completed' | 'unavailable' | 'cancelled';
export type AdvisoryKind = 'scheduled_interruption' | 'boil_water' | 'do_not_drink' | 'do_not_use' | 'general';
export type Geometry = { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };
export interface Envelope<T> { data: T; page?: { offset: number; limit: number; total: number }; asOf?: string }
export interface ApiError { error: { code: string; message: string; details?: unknown } }
export interface User { id: string; email: string; name: string; role: Role; phone: string | null; active: boolean; version: number }
export interface Connection {
  id: string; customerId: string; reference: string; address: string;
  zoneId: string | null; latitude: number | null; longitude: number | null; zoneConfirmed: boolean; version: number;
}
export interface Zone { id: string; code: string; name: string; boundary: Geometry | null; active: boolean; version: number; demo: boolean }
export interface TimelineEvent {
  id: string; action: string; text: string; createdAt: string; actorId: string | null;
  fromStatus?: string | null; toStatus?: string | null;
  appointmentChange?: { from: string | null; to: string };
}
export interface Note { id: string; text: string; authorId: string; createdAt: string }
export interface Notification {
  id: string; title: string; text: string; createdAt: string; readAt: string | null;
  targetType: 'report' | 'incident' | 'advisory' | 'assistance'; targetId: string; sourceEventKey: string;
}
export interface LocationInput {
  address: string; source: 'saved_address' | 'geocoded_address' | 'gps';
  latitude?: number | null; longitude?: number | null; confirmed: boolean;
  accuracy?: number | null; candidateToken?: string;
}
export interface GeocodeCandidate { address: string; latitude: number; longitude: number; confidence: number | null; candidateToken: string }
