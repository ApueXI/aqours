# Aqours supplier web

The dedicated Weather page (`/#/weather`) includes [Open-Meteo current weather and seven-day forecasts](../docs/weather.md) with a nationwide PSGC locality map and synchronized searchable Region/Province/City-Municipality selectors, manual refresh, attribution and independent retry/stale states for staff/admin. It starts in Laguna without a forecast; unavailable points show a message and no marker. Tile failures preserve selectors/forecast. Open it through desktop or mobile supplier navigation; Overview contains operational metrics and queues.

React and TypeScript supplier workspace built with Vite. Direct Leaflet 1.9.4 with markercluster renders operational report points, zoom-dependent clusters, service zones, and published incident/advisory polygons. The browser uses the live Express API; no production screen substitutes mock data or a simulated successful save.

## Local setup

Use Node.js 22.13 or later. Run from the repository root after setting up the API and its PostgreSQL database:

```sh
npm --prefix aqours-contracts ci --cache .cache/npm
npm --prefix aqours-contracts run build
npm --prefix aqours-web ci --cache .cache/npm
npm --prefix aqours-web run dev
```

The development server listens on port 5173 with a strict port check. The API default is `http://localhost:4000/api/v1`. Its configured web origin must exactly match the origin used by the browser; the documented local browser address is `http://localhost:5173`. Use the fictional supplier accounts from the repository demo runbook, after an explicit development seed. Starting the web application does not seed or reset records.

Public build configuration is documented in [.env.example](.env.example). Supply these variables through the development/build process as needed:

| Variable | Default / meaning |
| --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api/v1`; must include the versioned API base |
| `VITE_GEOAPIFY_MAPS_API_KEY` | Separate public tile-only browser key for Geoapify OSM Bright, Positron and Dark Matter; required unless a raster override is provided |
| `VITE_MAP_TILE_URL` | Optional alternate public raster template; replaces web style JSON configuration |
| `VITE_MAP_ATTRIBUTION` | Provider credit for a custom raster template; Geoapify uses Geoapify/OpenStreetMap/OpenMapTiles attribution |
| `AQOURS_NO_DOTENV` | Set to `1` for checks using explicit process configuration without loading local environment files |

Map style/tile availability is independent of the API. A basemap failure displays an error while the report list remains available. The selected provider’s attribution is displayed in the map. Private Geoapify geocoding and database credentials belong to the API; the intentionally public tile key is a different credential.

Web `VITE_MAP_STYLE_URL` is retired. Migrate an old MapLibre style JSON to a raster `VITE_MAP_TILE_URL` plus attribution or configure the Geoapify browser key. No MapLibre worker asset is needed on web. The API's private geocoding key and signing secret remain separate and must never enter the browser. See [map configuration](../docs/location-and-maps.md).

## Implemented supplier workflows

| Route | Connected behavior |
| --- | --- |
| `/#/overview` | Report cohort/category/status/date filters, incident and report counts, unique connections, mean first response/resolution with completed samples, pending counts, exclusions, metric definitions, Manila period/as-of labels, and drill-down links |
| `/#/reports` | Paginated category/status/period/zone/owner/priority inbox, location review flags, and map navigation |
| `/#/reports/:id` | Customer and connection context, independent issue-address snapshot, protected photo retrieval, acknowledgment/clarification, owner/priority/reason/status/reviewed closure, explicit issue-zone confirmation, suggested incident links and corrections, separate internal notes, and history |
| `/#/map` | Viewport queries, category/status/date/zone filters, category-colored markers with a labeled legend, neutral expandable clusters, zone/published area layers, explicit result-cap and unlocated counts, and a paginated list with an unlocated-only view |
| `/#/weather` | Nationwide PSGC map/searchable hierarchy, current/seven-day forecasts, manual refresh and retry/stale states; temporary selection clears on page exit or account change |
| `/#/incidents` and `/:id` | Create/edit, owner/status, affected zones and area, unknown or explicit restoration estimate, affected-customer estimate and basis separate from report/connection totals, links/history/notes, and explicit customer publication preview |
| `/#/advisories` and `/:id` | Read drafts/publications/revisions; admins create drafts, select approved guidance, preview and publish/revise, or explicitly lift with a reason. Three quality restriction kinds remain distinct; lifting is independent of incident resolution and end dates |
| `/#/assistance` and `/:id` | Filtered paginated callback/inspection/water queue; type-specific details, owner acceptance, appointments and reasoned rescheduling, immediate-support reasons, progress, outcomes/next steps, notes/history, session/allocation details, and dedicated collection confirmation |
| `/#/distribution` | Monitoring-first tabs, server-evaluated seven-day site statuses, independent forecast/current stock, Leaflet site markers and temperature overlay, threshold/capacity setup, warning history and owned monitoring notifications; compact paginated session management, site maintenance and exact reservation lookup preserve existing stock/cancellation/collection workflows |
| `/#/settings` | Admin account role/activation/password, service connection associations, zone boundaries, immutable approved-guidance/rule versions, and audit. Staff sees read-only guidance/rules and operational audit |

The API enforces each role, ownership, transition, publication, and inventory constraint. Available controls do not replace backend permission checks. Draft/internal data never enters a web-authored customer publication automatically.

## Session and save behavior

The web client restores `/auth/session` before protected pages. Authentication uses an HttpOnly server cookie with `credentials: include` and the in-memory CSRF token returned by the API. No password, cookie, bearer token, or CSRF value is written to browser storage. Logout clears protected React state only after the API confirms it. A 401 immediately removes protected content; focused/visible sessions are rechecked every minute and on window focus/page restoration.

Domain saves use a random `Idempotency-Key` and a frozen request body. Ambiguous transport, unreadable, and server failures retain the intention and expose **Retry original action**. An in-memory unresolved-intention registry also preserves the same key if the same payload is resubmitted after navigating away and back. Successful or definitive client-error responses end that intention. Versioned edits send the DTO’s `expectedVersion`; a conflict requests a refresh and human review. The application never silently overwrites or assumes an ambiguous save failed.

Reloading or closing the browser clears in-memory intentions, including password-bearing account edits. After an ambiguous save followed by a full reload, inspect current record/history before deciding on a new action. Operation payloads are intentionally not persisted to browser storage.

Resource failures display actionable retry feedback. Failed refreshes retain a stale-results label and the last received as-of time when available. A changed filter/record clears superseded results. Empty records, zero values, loading, unavailability, full/cancelled pickup sessions, and fictional demonstration records have separate presentations. All event instants display in `Asia/Manila`; appointment fields are interpreted in Manila regardless of browser timezone.

## Verification

Run from the repository root:

```sh
npm --prefix aqours-web run typecheck
npm --prefix aqours-web run lint
npm --prefix aqours-web test
npm --prefix aqours-web run build
npm --prefix aqours-web run preview
```

Preview defaults to port4173, so its origin must match API `WEB_ORIGIN`. To verify the production build with the existing development origin, stop the dev server and run `npm --prefix aqours-web run preview -- --port 5173 --host localhost`. Root `npm run test:browser` checks connected writes; `npm run test:operations` checks exact inbox/report/photo/incident forms; `npm run test:recovery` checks auth failures/throttling, stale/empty dashboards, map recovery/filters and immutable settings; `npm run test:maintenance` checks inspections, settings conflicts/retries, site/session maintenance and link corrections. `npm run test:map` verifies real Leaflet rendering using an intercepted raster fixture, report selection, cluster expansion, viewport zoom and unchanged persisted reports. Root `npm run test:ux` adds keyboard/focus, measured primary-action contrast and responsive navigation/page checks across eight destinations at desktop/tablet/phone widths. Allow at least a minute between login-heavy suites. Map checks use explicit raster test configuration; live Geoapify tile-key verification remains separate.

The Node test runner loads TypeScript through `tsx` without its CLI IPC server or disk cache. The `--experimental-test-isolation=none` setting is available in Node22.13 and retains individual visible results under the verified Node26 environment. Root browser scripts explicitly enable TypeScript stripping for Node22 compatibility. Tests cover cookie/CSRF transport, frozen idempotent retries, definitive conflicts, session revocation, unreadable responses, filter encoding, exact decimal strings, null coordinates, Manila conversion, request transition boundaries, published map geometry, full pagination, and rejection of partial successful lookup results.

The production build typechecks first. Leaflet is loaded by the map feature; no web MapLibre worker is shipped. No native mobile map or Android verification is implied by this web build.

## Source layout and limits

- `src/services/`: cookie/CSRF HTTP transport, shared errors, filter encoding, and mutation intentions.
- `src/hooks/`: URL-backed queue state, cancellable resources and complete paginated reference reads. `src/app/` owns hash routing; authentication hooks live under the auth feature.
- `src/components/`: form fields and save/retry behavior, focused workflow controls, protected attachments, histories, and pagination.
- `src/features/`: focused operational screens, feature components and settings sections.
- `src/features/map/`: Leaflet lifecycle, clusters/layers and published geometry projections.
- `tests/`: client behavior tests using Node’s built-in runner.

Handwritten TypeScript/TSX files remain below the 250-line limit. Session tables and operational queues are paginated for display; site inventories, complete reference selectors, map fallback lists, and pickup-reference lookup aggregate pages in memory. This is suited to the demonstration data size; large production deployments should add server-side lookup and reference-search endpoints. Optional polygon entry is validated GeoJSON text rather than a drawing editor. Map clusters are visual aids and never establish an incident association, service-zone confirmation, or water-safety conclusion.

Guided service-connection and pickup-site addresses use the authenticated bundled PSGC catalog with searchable cascading selectors and free-text fallback. See [locations and maps](../docs/location-and-maps.md) for snapshots, deployment, provider settings, and verification. `VITE_MAP_TILE_URL` optionally changes the default raster template.

## Distribution monitoring

Distribution opens Monitoring, followed by Sessions, Sites and Warning history. Reservation lookup is available on every tab and reads every assistance page before reporting a match or no match. Sessions use a compact stock table: select **Manage** to open the existing versioned stock/schedule and reasoned cancellation forms. **New pickup session** opens its creation section in Sessions. Existing site editing remains separate from monitoring configuration.

The URL retains `tab`, `date`, `siteId`, `status`, `q`, `view`, `style` and `temperature`. Warning history has an independent `warningDate` filter for past dates or `all`, with state filtering and pagination. Seven forecast dates come from the server in Asia/Manila. Site status uses the selected server evaluation; the client never recalculates warning thresholds. Supply always describes reservable liters now across eligible sessions, including future pickup sessions, and never becomes a forecast when changing the date. Forecast freshness, last success/attempt, incomplete evidence and unavailable supply have separate labels. Unlocated sites stay in the accessible list.

The desktop map/list are side by side; narrow screens have List/Map controls. Green/yellow/red/gray site markers describe normal/warning/critical/unavailable evaluations with text equivalents. An independent daily-maximum temperature layer draws site circles/numeric labels below markers, using the configured blue/green/yellow/orange/red bands (initially 25/30/34/37°C). These are point forecasts without a regional surface or interpolation. Changing Streets/Light/Dark replaces only Geoapify raster tiles. A configured custom tile URL takes precedence and exposes one **Configured basemap** option; missing tile configuration exposes **Basemap unavailable**, while site markers and lists remain usable.

Monitoring is disabled until deliberately configured. Initial temperature suggestions are 35/38°C; required supply thresholds start blank. Critical temperature must exceed warning temperature, and exact liter thresholds require `0 ≤ critical < low`. Optional planning capacity must be positive; its ratio can exceed 100% and does not represent measured physical inventory. Staff/admin configure sites; only admins see the global temperature-legend editor. All writes use the existing frozen retry/version mechanism, with initial configuration version 0.

Monitoring data, warnings/history and the current actor’s monitoring notifications refresh every 30 seconds while mounted. **Refresh monitoring** also requests active located-site forecast refreshes with bounded client concurrency; the API retains its refresh cooldown. A weather failure does not disable supply operations. Existing session and site endpoints remain independently available if monitoring loading fails. Warning details retain immutable transition evidence and reasons, and notification reads use the supplier-only monitoring endpoints.

## Reference-led presentation — 22 October 2026

The reference-led layout folds labeled navigation at 1100px and uses labeled operational rows below 640px. Report detail switches Summary/Messages/History while retaining the conversation form; operational review keeps its server-version remount behavior and internal notes remain separate. Incident and advisory pages separate customer snapshots/history from editing and explicit publication. Accounts, connections, zones and pickup sites open one selected editor; account/connection search explicitly applies to the current page. Report map `q` searches reference/address locally in the retrieved viewport-marker subset and the complete filtered list, with separate before-search totals and cap labels. The [UI/UX matrix](../docs/ui-ux.md) records verified behavior and explicit evidence limits.

## Workflow update — 23 October 2026

See [account, notification, conversation and customer workflow corrections](../docs/workflow-feedback.md) for current account/connection provisioning, optional generated connection numbers, recipient-owned supplier alerts, conversation indexes, customer tabs, question submission and password changes. Existing data is preserved; no schema migration or dependency changes are required.
