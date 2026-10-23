import type { IconType } from 'react-icons';
import { FiGrid, FiInbox, FiMessageSquare, FiMap, FiAlertTriangle, FiVolume2, FiHeadphones, FiDroplet, FiCloud, FiSettings, FiMenu, FiX, FiLogOut, FiChevronRight, FiClock } from 'react-icons/fi';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@aqours/contracts';
import { NotificationAccess } from './NotificationAccess';
import { Brand } from './Brand';
import { Failure, label } from './Status';

const groups = [
  { title: 'Reports', sections: ['overview', 'reports', 'messages', 'map'] },
  { title: 'Service operations', sections: ['incidents', 'advisories', 'assistance', 'distribution', 'weather'] },
  { title: 'Administration', sections: ['settings'] },
];
const titles: Record<string, string> = { reports: 'Report inbox', map: 'Reports map', distribution: 'Water distribution', settings: 'Settings and audit' };
const icons: Record<string, IconType> = {
  overview: FiGrid, reports: FiInbox, messages: FiMessageSquare, map: FiMap,
  incidents: FiAlertTriangle, advisories: FiVolume2, assistance: FiHeadphones,
  distribution: FiDroplet, weather: FiCloud, settings: FiSettings,
};
function NavIcon({ section }: { section: string }) {
  const Icon = icons[section] || FiGrid;
  return <Icon size={18} aria-hidden="true" />;
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
      <div className="sidebar-brand"><a className="brand" href="#/overview"><Brand /></a>
        <button ref={menuButton} className="navigation-toggle" type="button" aria-expanded={menuOpen} aria-controls="supplier-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}{menuOpen ? 'Close menu' : 'Menu'}</button>
      </div>
      <p className="supplier-label">Supplier workspace</p>
      <nav id="supplier-navigation" aria-label="Main navigation" className={menuOpen ? 'navigation is-open' : 'navigation'}>
        {groups.map(group => <div className="nav-group" key={group.title}><p className="nav-group-title">{group.title}</p>
          {group.sections.map(item => <a key={item} href={`#/${item}`} aria-current={section === item ? 'page' : undefined} onClick={() => setMenuOpen(false)}><NavIcon section={item} />{titles[item] || label(item)}</a>)}
        </div>)}
      </nav>
      <div className={menuOpen ? 'identity is-open' : 'identity'}><div><strong>{user.name}</strong><span>{label(user.role)}</span></div>
        <button disabled={loggingOut} onClick={logout}><FiLogOut aria-hidden="true" />{loggingOut ? 'Signing out…' : 'Sign out'}</button><Failure error={logoutError} />
      </div>
    </aside>
    <div className="workspace-frame">
      <header className="workspace-bar"><div className="workspace-breadcrumb"><span>Supplier workspace</span><FiChevronRight aria-hidden="true" /><span>{titles[section] || label(section)}</span>{recordId && <><FiChevronRight aria-hidden="true" /><span>Detail</span></>}</div><div className="workspace-utilities"><span className="workspace-timezone"><FiClock aria-hidden="true" />Asia/Manila</span><NotificationAccess /></div></header>
      <main id="main" ref={main} tabIndex={-1} className="workspace" key={section}>{children}</main>
    </div>
  </div>;
}
