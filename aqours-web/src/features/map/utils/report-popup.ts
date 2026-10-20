import type { MapResponse } from '@aqours/contracts';

/** Use textContent so stored addresses and references cannot inject HTML. */
export function reportPopup(properties: MapResponse['features'][number]['properties'], onSelect: (id: string) => void) {
  const content = document.createElement('div');
  const title = document.createElement('strong'); title.textContent = properties.reference; content.append(title);
  for (const text of [
    `${properties.category.replaceAll('_', ' ')} · ${properties.status.replaceAll('_', ' ')} · ${properties.priority}`,
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
