# Frozen component interface — distribution monitoring

Types: aqours-contracts/src/monitoring.ts (lead-owned; workers request changes). JSON envelopes use existing conventions.

## API
- GET /staff/distribution/monitoring => MonitoringOverview. Dates always Manila today+6. Include every site (unconfigured/inactive/unlocated too), all current active warnings, live supply. Read cached forecasts and enqueue missing/due refreshes rather than network calls in inventory transactions.
- GET /staff/pickup-sites/:id/forecast => SiteForecast (server scope check).
- PATCH /staff/pickup-sites/:id/monitoring => SiteMonitoringConfig. Body {expectedVersion:number (0 on initial),enabled:boolean,warningTemperature:number,criticalTemperature:number,lowSupplyLiters:string,criticalSupplyLiters:string,capacityLiters:string|null,reason:string}. Same-key retry/version checks.
- POST /staff/pickup-sites/:id/forecast/refresh => {queued:boolean}. Queue refresh; retain cooldown/hourly cache, no unbounded provider bypass.
- GET /staff/distribution/warnings?siteId=&date=&state=&offset=&limit= => MonitoringWarning[] with page metadata.
- GET /staff/distribution/warnings/:id => {warning:MonitoringWarning,history:MonitoringWarningHistory[]}.
- GET /staff/distribution/temperature-bands => TemperatureBands. PATCH same path admin-only, body{expectedVersion:0 initially,boundaries:[25,30,34,37],reason:string} => TemperatureBands. Exactly4 strictly increasing finite boundaries; colors fixed blue/green/yellow/orange/red.
- GET /staff/distribution/notifications => SupplierMonitoringNotification[] with page metadata. POST /staff/distribution/notifications/:id/read => SupplierMonitoringNotification. Only current actor's monitoring notifications, supplier boundary checked.

Staff/admin only except bands write admin. Customers denied including direct IDs. Supplier singleton from database must be exactly1, otherwise clear config error; no fake tenant memberships. Associated monitoring rows belong to that supplier.

## UI
Distribution accepts {params:URLSearchParams,user:User} passed from App. /distribution?tab=monitoring|sessions|sites|warnings&date=YYYY-MM-DD&siteId=UUID&status=normal|warning|critical|unavailable&view=list|map&style=streets|light|dark&temperature=1|0&q=...
Default monitoring, Manila today, desktop split list/map, phone List/Map. Tab state retains filters/site/date. Reservation lookup existing references always accessible. Existing forms preserved; session table selected details/editor and New pickup session moves to sessions tab/create section. Site forms maintain existing schema; monitoring/capacity setup separate.
Overview supplies days statuses; frontend MUST use server evaluation statuses rather than invent threshold evaluation. Warning labels map family/type to plain language. Weather fresh/stale is explicit, unknown never green. Supply always current; changing future forecast date never projects liters. Weather overlay uses daily maximum only and lives below status markers.

## Worker boundaries
API worker owns aqours-api/** (including migration/schema, unit tests, hooks, startup), no contracts/web/docs/.loop. Web worker owns aqours-web/**, no API/contracts/docs/.loop. Verification worker owns only verification/distribution*.ts and verification/browser-distribution*.ts, no source/contracts/.loop changes. Lead owns contracts, root package scripts, docs, .loop, integration resources and final review. No worker commits or further delegation.

## Verification coordination
Backend expose testable runMonitoringTick/options and per-site evaluation/refresh functions; tell verification worker exact paths/signatures as soon as established. Tests may replace upstream weather responses, never production behavior. All temporary files/caches/data project-local. Do not read .env or secret values. Use isolated test database only, no ordinary DB changes. API files<=200lines, web<=250; split by responsibility.
