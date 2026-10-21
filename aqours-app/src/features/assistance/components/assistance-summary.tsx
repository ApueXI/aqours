import type { AssistanceDetails, AssistanceType, PickupSession } from '@aqours/contracts';
import { Body, Section } from '@/components/ui';
import { displayTime } from '@/utils/time';

export const assistanceNames: Record<AssistanceType, string> = {
  callback: 'Callback / support', inspection: 'Site inspection', water_support: 'Water pickup',
};
const fieldNames: Record<string, string> = {
  question: 'Your question', contactMethod: 'Contact method', contactNumber: 'Contact number',
  preferredWindow: 'Preferred time window', issueDetails: 'Issue details', siteAddress: 'Visit address',
  accessInstructions: 'Access instructions', requestedLiters: 'Requested liters', notes: 'Pickup notes',
};

export function AssistanceSummary({ details, pickup }: { details: AssistanceDetails; pickup?: PickupSession | null }) {
  return <Section title="Request details">
    {Object.entries(details).filter(([key, value]) => value && key !== 'sessionId').map(([key, value]) =>
      <Body key={key}>{fieldNames[key] ?? key}: {value}</Body>)}
    {pickup && <>
      <Body>Pickup site: {pickup.site.name}</Body><Body>{pickup.site.address}</Body>
      <Body muted>{displayTime(pickup.startsAt)} to {displayTime(pickup.endsAt)}</Body>
    </>}
  </Section>;
}
