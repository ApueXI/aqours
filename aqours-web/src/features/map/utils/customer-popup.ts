import type { CustomerPoint } from './customer-points';
import { reportPopup } from './report-popup';
import { reportMarkerLabel } from './report-categories';

export const markerLabel = (point: CustomerPoint) => point.report
  ? `${reportMarkerLabel(point.report)} · Customer ${point.reference}` : `${point.reference} · No open reports in current filters`;
export const pointPopup = (point: CustomerPoint, onOpen: (id: string) => void) => {
  const content = document.createElement('div');
  for (const text of [`Customer connection: ${point.reference}`, point.address, point.locationLabel || 'Customer location']) {
    const paragraph = document.createElement('p'); paragraph.textContent = text; content.append(paragraph);
  }
  if (point.report) content.append(reportPopup(point.report, onOpen));
  else { const paragraph = document.createElement('p'); paragraph.textContent = 'No open reports in current filters. This does not establish normal supply or safe water.'; content.append(paragraph); }
  return content;
};
