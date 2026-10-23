# Distribution monitoring and early warnings

Supplier Distribution combines site weather, reservation stock, early warnings and existing pickup operations. Monitoring is the initial tab; Sessions, Sites and Warning history retain their own URL state. Reservation lookup stays available across tabs. This feature uses the existing single-supplier deployment and existing site/session records.

## Stock meaning

**Available for reservation** sums `total − reserved − collected` across a site's open, unexpired sessions, including sessions that open later. Quantities remain exact decimal liters. Collection moves reserved liters into collected liters and therefore does not change remaining availability. Cancellation and reservation release can change it.

This is an allocation figure, not physical tank inventory. Selecting a future forecast date never predicts future supply. If no sessions qualify, the view says no reservable sessions rather than claiming the site has physically run out of water.

Optional site capacity is an operator-entered reference. Available/capacity is a reservation-stock ratio; scheduled allocations can make it exceed 100%. Missing capacity produces an unavailable ratio, not an inferred capacity. These settings never rewrite session stock or bypass allocation constraints.

## Site setup and authorization

Staff and admins can configure their existing pickup sites. Monitoring starts disabled/unconfigured; no thresholds are silently applied. Setup suggests 35°C warning and 38°C critical temperatures, but requires explicit configuration and supply limits before activation.

- Critical temperature must exceed warning temperature.
- Critical supply must be nonnegative and lower than low supply.
- Temperature triggers at or above the configured value; supply triggers at or below it.
- Capacity, when supplied, must be positive.
- Versioned edits require a change reason and reject stale versions. Existing operation-key retry rules apply.
- Supplier admins alone can edit the four ordered temperature-display boundaries. Defaults are 25, 30, 34 and 37°C; these colors explain temperature values and do not set warning thresholds.

Every monitoring endpoint verifies supplier staff/admin access. Monitoring records reference the existing supplier and site. This release retains the single-supplier deployment; ambiguous supplier configuration is an error, not an inferred ownership assignment. Customer report/weather/notification access remains separately scoped.

## Forecasts and freshness

The backend reuses the [existing Open-Meteo integration](weather.md) for seven Manila-local daily forecasts, current temperature/humidity/precipitation and daily minimum/maximum temperatures/precipitation. Site weather uses stored site coordinates; it does not geocode or change an address.

Persistent snapshots retain the last successful forecast, last attempt, next refresh and provider error separately. Active located sites refresh hourly by default with bounded concurrency and retry backoff. Identical coordinate requests reuse the existing short-lived provider cache.

A failed refresh retains the last forecast with a stale label. Data older than six hours is unavailable for new temperature evaluations. Missing daily temperatures remain unknown. Changing site coordinates invalidates the previous location's forecast and queues a new fetch. Unlocated sites remain in the list and can still have supply warnings.

## Warning behavior

Temperature checks use each date's forecast maximum. Supply checks use current reservable liters and their own observation timestamp. The two checks are independent: heat alone never predicts water depletion.

Warnings record pickup site, supplier, type, severity, date, temperature, current availability, triggered thresholds/configuration version and evidence timestamps. Temperature, supply and combined warnings retain separate records; combined severity is the highest contributing severity. Supply-only warnings refer to today's observed stock, while future combined warnings explicitly compare future heat with current availability.

Warning history supports a separate date filter, including past dates, and an All warning dates option. Its `warningDate` URL parameter remains independent of the forecast timeline.

Repeated evaluations do not create duplicate active warnings. Changed states/severities retain immutable history. Fresh normal evidence resolves a warning; expired forecast dates, disabled monitoring and inactive sites have distinct closure reasons. Provider failure never masquerades as fresh normal weather or resolves temperature risk on that basis.

The existing notification store supplies notifications to active supplier staff/admin when warnings trigger, escalate or resolve. Related changes are consolidated by site/evaluation. Supplier notifications have their own authenticated read/read-state interface and never enter a customer's notification list.

## Scheduling and inventory integration

Background work starts with the API server and stops during graceful shutdown. Persistent work revisions and expiring claims support restart recovery and prevent concurrent processes from applying stale results. External forecast requests run outside inventory transactions.

Site/session/stock/allocation changes mark affected monitoring work in the same database transaction. Healthy processing targets five seconds; a periodic time sweep also reevaluates expired sessions and forecast dates. Failed work is retried without erasing pending newer changes. Existing session/request lock ordering, exact stock rules and customer notifications remain authoritative.

## Map and timeline

Monitoring pairs a compact comparison table, selected-site details and Leaflet map. Site search/status filters open in the shared Filters dialog; the seven-day timeline controls the forecast date. Setup guidance and map layers/legends expand on demand; reservation lookup remains above the working data. See [service operations presentation](service-operations-ui.md). Narrow layouts expose List/Map switching; missing coordinates never produce invented markers. Current reservation stock and its observation time stay visible while the selected forecast date changes.

Markers indicate normal (green), warning (yellow), critical (red), or unavailable/inactive/unconfigured (gray). A known warning stays visible when the other assessment is unavailable; details identify incomplete assessments. Normal requires valid normal evidence for all enabled checks.

The seven-day timeline updates site details, daily risk and temperature visualization together. A separate temperature layer draws colored circles and numeric forecast maxima at pickup coordinates, below the warning markers. It is not a regional heatmap or a direct measurement. No temperatures are invented between sites.

Default temperature bands are below 25°C (blue), 25–<30°C (green), 30–<34°C (yellow), 34–<37°C (orange), and 37°C or above (red). Users can turn this layer off independently of the basemap and warning markers.

Streets, Light and Dark use Geoapify `osm-bright`, `positron` and `dark-matter` raster styles with the existing intentionally public browser tile key. Provider attribution remains visible. Tile changes preserve markers, temperature layers, selection and viewport. Custom tile configurations remain available; unconfigured styles are not presented as working providers. Tile failure retains report/site data and list access.

## Provider and release limits

Open-Meteo's free endpoint is for noncommercial use, has request quotas and no uptime guarantee. Background refresh is bounded; production commercial operators must arrange appropriate provider access. Retain Open-Meteo attribution and disclose stale results. See [Open-Meteo pricing](https://open-meteo.com/en/pricing) and [Geoapify map styles/attribution](https://apidocs.geoapify.com/docs/maps).

Satellite/Terrain styles, geographic sampling grids, regional interpolation, physical inventory, multiple supplier organizations, consumption forecasting and external email/push delivery are outside this release.

## API and verification

Shared monitoring DTOs live in [monitoring.ts](../aqours-contracts/src/monitoring.ts); [API documentation](api.md) records endpoints. See [schema](schema.md), [setup](setup.md), and [verification](verification.md) for migration, scheduler configuration, test commands and executed evidence. Source presence alone does not certify a provider or deployment.

## Reference-led presentation — 22 October 2026

The Sites tab searches the loaded pickup-site list and opens modal forms for site creation/editing and monitoring configuration. Session create/edit/cancel and temperature-band configuration also use modal forms; the existing `create=1` session link opens the create dialog. Session/stock rows and warning history use readable narrow-screen labels. Monitoring cards display distinct stock-observed and forecast-success timestamps; supplier monitoring notifications show Manila date groups and read/unread labels. These changes do not recalculate server warnings, alter reservations or merge stock timestamps with forecast freshness. Current acceptance is tracked in [UI/UX](ui-ux.md).
