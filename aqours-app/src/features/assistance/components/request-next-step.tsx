import type { AssistanceRequest } from '@aqours/contracts';
import { Body, Section } from '@/components/ui';
import { displayTime } from '@/utils/time';

export function RequestNextStep({ request }: { request: AssistanceRequest }) {
  const next = request.status === 'requested' ? 'The supplier needs to review your request. An appointment or pickup allocation is not confirmed.'
    : request.status === 'unavailable' ? 'The supplier could not fulfill this request. Review their reason and request callback/support if you need another option.'
      : request.status === 'cancelled' ? 'This request is cancelled. Its history is retained; choose a new request from your report if you still need assistance.'
        : request.status === 'completed' ? 'Review the supplier outcome below. If the water problem continues, contact your supplier from the linked report.'
          : request.allocation?.state === 'reserved' ? 'Use the pickup reference and follow the confirmed site and session instructions below.'
            : request.appointmentAt ? `Follow the agreed appointment: ${displayTime(request.appointmentAt)}. Contact the supplier if your availability changes.`
              : 'The supplier has started arranging this request. Check the latest supplier update; no appointment is recorded yet.';
  return <Section title="What happens next"><Body>{request.nextSteps || next}</Body></Section>;
}
