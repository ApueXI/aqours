import { useEffect, useState } from 'react';

export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/overview');
  useEffect(() => {
    const changed = () => setRoute(window.location.hash.slice(1) || '/overview');
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  const [pathname, search = ''] = route.split('?');
  const segments = pathname.split('/').filter(Boolean);
  return { section: segments[0] || 'overview', id: segments[1], params: new URLSearchParams(search) };
}
