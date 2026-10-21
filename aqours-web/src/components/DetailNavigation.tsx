export function revealSection(id: string) {
  const target = document.getElementById(id);
  const disclosure = target instanceof HTMLDetailsElement;
  if (disclosure) target.open = true;
  target?.scrollIntoView({ block: 'start', behavior: 'instant' });
  (disclosure ? target.querySelector('summary') : target)?.focus({ preventScroll: true });
}

export function DetailNavigation({ items }: { items: { id: string; label: string }[] }) {
  return <nav className="detail-nav" aria-label="Record sections">{items.map(item => <button key={item.id} type="button" aria-label={`Show ${item.label} section`} onClick={() => {
    revealSection(item.id);
  }}>{item.label}</button>)}</nav>;
}
