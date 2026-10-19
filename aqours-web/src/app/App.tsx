import { useState } from 'react';
import { useSession } from '../features/auth/hooks/useSession';
import { useRoute } from './useRoute';
import { Failure, label } from '../components/Status';
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

const sections = ['overview', 'reports', 'map', 'incidents', 'advisories', 'assistance', 'distribution', 'settings'];
export default function App() {
  const session = useSession();
  const route = useRoute();
  const [logoutError, setLogoutError] = useState<unknown>();
  const [loggingOut, setLoggingOut] = useState(false);
  if (session.loading) return <main className="session-loading [width:min(440px,_calc(100%_-_32px))] [margin:10vh_auto] bg-[#fff] [border:1px_solid_#d3dce3] p-[32px] [border-radius:5px]"><h1>Aqours</h1><p role="status">Checking supplier session…</p></main>;
  if (!session.user) return <Login login={session.login} error={session.error} ended={session.ended} restore={() => void session.restore()} />;
  const user = session.user;
  const logout = async () => {
    setLoggingOut(true); setLogoutError(undefined);
    try { await session.logout(); }
    catch (problem) { setLogoutError(problem); }
    finally { setLoggingOut(false); }
  };
  return <div className="app-shell grid [grid-template-columns:240px_minmax(0,_1fr)] min-h-[100vh] [@media(max-width:_1100px)]:[grid-template-columns:200px_minmax(0,_1fr)] [@media(max-width:_760px)]:block">
    <a className="skip-link absolute left-[12px] top-[-100px] bg-[#fff] p-[12px] z-[10] focus:top-[12px]" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <aside className="sidebar [border-right:1px_solid_#d3dce3] bg-[#fff] [padding:24px_16px] flex flex-col [&_nav]:flex [&_nav]:flex-col [&_nav]:gap-[4px] [&_nav_a]:text-[#334155] [&_nav_a]:no-underline [&_nav_a]:[padding:9px_12px] [&_nav_a]:[border-radius:4px] [&_nav_a:hover]:bg-[#f1f5f9] [&_nav_a[aria-current]]:bg-[#e6f3f0] [&_nav_a[aria-current]]:text-[#115e59] [&_nav_a[aria-current]]:font-[650] [@media(max-width:_760px)]:p-[16px] [@media(max-width:_760px)]:[border-right:0] [@media(max-width:_760px)]:[border-bottom:1px_solid_#d3dce3] [@media(max-width:_760px)]:[&_nav]:flex-row [@media(max-width:_760px)]:[&_nav]:overflow-x-auto [@media(max-width:_760px)]:[&_nav]:gap-[4px] [@media(max-width:_760px)]:[&_nav_a]:[padding:8px_10px] [@media(max-width:_760px)]:[&_nav_a]:whitespace-nowrap"><a className="brand text-[#0f172a] text-[24px] font-[700] no-underline [padding:0_12px] [@media(max-width:_760px)]:p-[0] [@media(max-width:_760px)]:text-[22px]" href="#/overview">Aqours</a><p className="supplier-label text-[#475569] [padding:0_12px] mt-[4px] mb-[28px] [@media(max-width:_760px)]:p-[0] [@media(max-width:_760px)]:mb-[12px]">Supplier workspace</p>
      <nav aria-label="Main navigation">{sections.map(section => <a key={section} href={`#/${section}`} aria-current={route.section === section ? 'page' : undefined}>{label(section)}</a>)}</nav>
      <div className="identity mt-auto [padding:32px_12px_0] flex flex-col gap-[6px] [&_span]:text-[#475569] [&_button]:mt-[8px] [@media(max-width:_760px)]:[padding:16px_0_0] [@media(max-width:_760px)]:flex-row [@media(max-width:_760px)]:items-center [@media(max-width:_760px)]:gap-[12px] [@media(max-width:_760px)]:flex-wrap [@media(max-width:_760px)]:[&_button]:[margin:0_0_0_auto] [@media(max-width:_760px)]:[&_.error]:basis-[100%]"><strong>{user.name}</strong><span>{label(user.role)}</span><button disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? 'Signing out…' : 'Sign out'}</button><Failure error={logoutError} /></div>
    </aside>
    <main id="main" tabIndex={-1} className="workspace [padding:28px_32px] max-w-[1560px] w-full [&_>_section]:p-[20px] [&_>_section]:bg-[#fff] [&_>_section]:[border:1px_solid_#d3dce3] [&_>_section]:[border-radius:5px] [&_>_div_>_section]:p-[20px] [&_>_div_>_section]:bg-[#fff] [&_>_div_>_section]:[border:1px_solid_#d3dce3] [&_>_div_>_section]:[border-radius:5px] [@media(min-width:_1600px)]:[margin:0_auto] [@media(max-width:_1100px)]:[padding:24px_20px] [@media(max-width:_760px)]:[padding:24px_16px] [@media(max-width:_760px)]:[&_>_section]:p-[16px] [@media(max-width:_760px)]:[&_>_div_>_section]:p-[16px]" key={route.section}>
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
