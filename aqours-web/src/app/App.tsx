import { useState } from 'react';
import { useSession } from '../features/auth/hooks/useSession';
import { useRoute } from './useRoute';
import { WorkspaceShell } from '../components/WorkspaceShell';
import { Login } from '../features/auth/screens/Login';
import { Overview } from '../features/overview/screens/Overview';
import { Reports } from '../features/reports/screens/Reports';
import { ReportDetail } from '../features/reports/screens/ReportDetail';
import { Incidents } from '../features/incidents/screens/Incidents';
import { IncidentDetail } from '../features/incidents/screens/IncidentDetail';
import { Advisories } from '../features/advisories/screens/Advisories';
import { Assistance } from '../features/assistance/screens/Assistance';
import { AssistanceDetail } from '../features/assistance/screens/AssistanceDetail';
import { Distribution } from '../features/distribution/screens/Distribution';
import { Settings } from '../features/settings/screens/Settings';
import { MapPage } from '../features/map/screens/MapPage';
import { WeatherPage } from '../features/weather/screens/WeatherPage';

const sections = ['overview', 'reports', 'map', 'incidents', 'advisories', 'assistance', 'distribution', 'weather', 'settings'];
export default function App() {
  const session = useSession();
  const route = useRoute();
  const [logoutError, setLogoutError] = useState<unknown>();
  const [loggingOut, setLoggingOut] = useState(false);
  if (session.loading) return <main className="session-loading"><div className="login-brand">Aqours</div><h1>Supplier workspace</h1><p role="status">Checking supplier session…</p></main>;
  if (!session.user) return <Login login={session.login} error={session.error} ended={session.ended} restore={() => void session.restore()} />;
  const user = session.user;
  const logout = async () => {
    setLoggingOut(true); setLogoutError(undefined);
    try { await session.logout(); }
    catch (problem) { setLogoutError(problem); }
    finally { setLoggingOut(false); }
  };
  return <WorkspaceShell user={user} section={route.section} recordId={route.id} loggingOut={loggingOut} logoutError={logoutError} logout={() => void logout()}>
      {route.section === 'overview' && <Overview key={user.id} params={route.params} />}
      {route.section === 'reports' && (route.id ? <ReportDetail id={route.id} returnTo={route.params.get('returnTo')} /> : <Reports params={route.params} />)}
      {route.section === 'map' && <MapPage params={route.params} />}
      {route.section === 'weather' && <WeatherPage key={user.id} />}
      {route.section === 'incidents' && (route.id ? <IncidentDetail id={route.id} /> : <Incidents />)}
      {route.section === 'advisories' && <Advisories id={route.id} user={user} />}
      {route.section === 'assistance' && (route.id ? <AssistanceDetail id={route.id} returnTo={route.params.get('returnTo')} /> : <Assistance params={route.params} />)}
      {route.section === 'distribution' && <Distribution />}
      {route.section === 'settings' && <Settings user={user} params={route.params} />}
      {!sections.includes(route.section) && <><h1>Page not found</h1><a href="#/overview">Return to overview</a></>}
  </WorkspaceShell>;
}
