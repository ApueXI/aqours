import type { MapResponse } from '@aqours/contracts';
import { reportCategories } from './report-categories';

/** Use textContent so stored addresses and references cannot inject HTML. */
export function reportPopup(properties: MapResponse['features'][number]['properties'], onSelect: (id: string) => void) {
  const content = document.createElement('div');
  const title = document.createElement('strong'); title.textContent = properties.reference; content.append(title);
  for (const text of [
    `${reportCategories[properties.category].label} · ${properties.status.replaceAll('_', ' ')} · ${properties.priority} priority`,
    properties.address,
    `Location: ${(properties.locationSource || 'unknown').replaceAll('_', ' ')}${properties.locationReview ? ' · Review needed' : ''}`,
  ]) {
    if (!text) continue;
    const paragraph = document.createElement('p'); paragraph.textContent = text; content.append(paragraph);
  }
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Open report';
  button.onclick = () => onSelect(properties.id); content.append(button);
  return content;
}
