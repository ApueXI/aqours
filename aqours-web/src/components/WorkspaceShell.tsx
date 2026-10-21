import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@aqours/contracts';
import { Failure, label } from './Status';

const groups = [
  { title: 'Reports', sections: ['overview', 'reports', 'map'] },
  { title: 'Service operations', sections: ['incidents', 'advisories', 'assistance', 'distribution'] },
  { title: 'Administration', sections: ['settings'] },
];
const titles: Record<string, string> = { reports: 'Report inbox', map: 'Reports map', distribution: 'Water distribution', settings: 'Settings and audit' };
const paths: Record<string, string> = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  reports: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
  incidents: 'm12 3 10 18H2z M12 9v5 M12 17h.01',
  advisories: 'M4 9h4l12-5v16L8 15H4z M8 15l2 6h4l-2-5',
  assistance: 'M4 14v-2a8 8 0 0 1 16 0v2 M4 12H2v7h4v-7z M20 12h2v7h-4v-7z M18 19c0 2-2 3-6 3',
  distribution: 'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z M9 16c0 2 1 3 3 3',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
};
function NavIcon({ section }: { section: string }) {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[section]} /></svg>;
}

export function WorkspaceShell({ user, section, recordId, loggingOut, logoutError, logout, children }: {
  user: User; section: string; recordId?: string; loggingOut: boolean; logoutError: unknown;
  logout(): void; children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const previous = useRef(`${section}/${recordId || ''}`);
  useEffect(() => {
    const next = `${section}/${recordId || ''}`;
    if (previous.current !== next) {
      main.current?.focus();
      window.scrollTo({ top: 0 });
      previous.current = next;
    }
  }, [section, recordId]);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [menuOpen]);
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a>
    <aside className="sidebar">
      <div className="sidebar-brand"><a className="brand" href="#/overview"><NavIcon section="distribution" />Aqours</a>
        <button ref={menuButton} className="navigation-toggle" type="button" aria-expanded={menuOpen} aria-controls="supplier-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close menu' : 'Menu'}</button>
      </div>
      <p className="supplier-label">Supplier workspace</p>
      <nav id="supplier-navigation" aria-label="Main navigation" className={menuOpen ? 'navigation is-open' : 'navigation'}>
        {groups.map(group => <div className="nav-group" key={group.title}><p className="nav-group-title">{group.title}</p>
          {group.sections.map(item => <a key={item} href={`#/${item}`} aria-current={section === item ? 'page' : undefined} onClick={() => setMenuOpen(false)}><NavIcon section={item} />{label(item)}</a>)}
        </div>)}
      </nav>
      <div className="identity"><div><strong>{user.name}</strong><span>{label(user.role)}</span></div>
        <button disabled={loggingOut} onClick={logout}>{loggingOut ? 'Signing out…' : 'Sign out'}</button><Failure error={logoutError} />
      </div>
    </aside>
    <div className="workspace-frame">
      <div className="workspace-bar"><span>{titles[section] || label(section)}{recordId ? ' / Detail' : ''}</span><span>Philippine time · Asia/Manila</span></div>
      <main id="main" ref={main} tabIndex={-1} className="workspace" key={section}>{children}</main>
    </div>
  </div>;
}
