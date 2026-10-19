import { useState } from 'react';
import { useSession } from './hooks/useSession';
import { useRoute } from './hooks/useRoute';
import { Failure, label } from './components/Status';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Reports } from './pages/Reports';
import { ReportDetail } from './pages/ReportDetail';
import { Incidents } from './pages/Incidents';
import { IncidentDetail } from './pages/IncidentDetail';
import { Advisories } from './pages/Advisories';
import { Assistance } from './pages/Assistance';
import { AssistanceDetail } from './pages/AssistanceDetail';
import { Distribution } from './pages/Distribution';
import { Settings } from './pages/Settings';
import { MapPage } from './pages/MapPage';

const sections = ['overview', 'reports', 'map', 'incidents', 'advisories', 'assistance', 'distribution', 'settings'];
export default function App() {
  const session = useSession();
  const route = useRoute();
  const [logoutError, setLogoutError] = useState<unknown>();
  const [loggingOut, setLoggingOut] = useState(false);
  if (session.loading) return <main className="session-loading"><h1>Aqours</h1><p role="status">Checking supplier session…</p></main>;
  if (!session.user) return <Login login={session.login} error={session.error} ended={session.ended} restore={() => void session.restore()} />;
  const user = session.user;
  const logout = async () => {
    setLoggingOut(true); setLogoutError(undefined);
    try { await session.logout(); }
    catch (problem) { setLogoutError(problem); }
    finally { setLoggingOut(false); }
  };
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <aside className="sidebar"><a className="brand" href="#/overview">Aqours</a><p className="supplier-label">Supplier workspace</p>
      <nav aria-label="Main navigation">{sections.map(section => <a key={section} href={`#/${section}`} aria-current={route.section === section ? 'page' : undefined}>{label(section)}</a>)}</nav>
      <div className="identity"><strong>{user.name}</strong><span>{label(user.role)}</span><button disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? 'Signing out…' : 'Sign out'}</button><Failure error={logoutError} /></div>
    </aside>
    <main id="main" tabIndex={-1} className="workspace" key={route.section}>
      {route.section === 'overview' && <Overview />}
      {route.section === 'reports' && (route.id ? <ReportDetail id={route.id} returnTo={route.params.get('returnTo')} /> : <Reports params={route.params} />)}
      {route.section === 'map' && <MapPage params={route.params} />}
      {route.section === 'incidents' && (route.id ? <IncidentDetail id={route.id} /> : <Incidents />)}
      {route.section === 'advisories' && <Advisories id={route.id} user={user} />}
      {route.section === 'assistance' && (route.id ? <AssistanceDetail id={route.id} /> : <Assistance />)}
      {route.section === 'distribution' && <Distribution />}
      {route.section === 'settings' && <Settings user={user} />}
      {!sections.includes(route.section) && <><h1>Page not found</h1><a href="#/overview">Return to overview</a></>}
    </main>
  </div>;
}
