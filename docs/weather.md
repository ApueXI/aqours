# Weather

Added 21 October 2026; supplier navigation updated 22 October 2026. Customer Home and the supplier Weather page (`/#/weather`) show current conditions and a seven-day forecast from [Open-Meteo](https://open-meteo.com/en/docs). Staff/admin open Weather through desktop or mobile navigation; forecasts are no longer embedded in supplier Overview. Customers, staff and admins can use the authenticated weather endpoints. Weather is informational context; it does not create incidents, publish advisories, establish water safety or change assistance/guidance decisions.

## Choosing a location

Customer Home initially selects the first saved connection with coordinates, or the first connection when none has coordinates. Every saved connection is selectable; missing coordinates prompt for Philippine city search through [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), with up to five labeled results and explicit selection. Customer12 retains the address-only fallback. Existing customer weather behavior and request modes are preserved.

Supplier Weather replaces free-text provider city search with a nationwide canonical PSGC locality map and searchable **Region → Province → City / Municipality** selectors. Each level has a labeled search field and native keyboard-operable select. Choose a province where one exists; NCR skips that step and displays an unavailable province control. Selection stops at city/municipality, before Manila districts or barangays.

The map starts in Laguna without a selected locality or forecast. Nationwide available points are clustered; region/province selections narrow the markers and fit the available points. Clicking a locality marker selects it and synchronizes its hierarchy; choosing a locality in the selectors focuses/selects its marker and loads weather using its canonical code. Changing a region clears province/locality and old forecasts; changing a province clears locality/forecasts. Entries without coordinates remain selectable with **Weather unavailable**, show an explicit message, and create neither a marker nor a forecast request. A focused locality marker activates with Enter or Space and uses the same canonical selection as a click. Map clicks on empty space cannot select arbitrary coordinates. **Reset weather map** clears the hierarchy, selection and forecast, restores nationwide markers and returns the viewport to Laguna.

Map and forecast sit side by side above 1,100px and stack at narrower widths; hierarchy controls also stack at 650px or below. Basemap configuration notices and tile failures leave selectors and forecasts usable; **Retry basemap** retries tiles independently. Selected popups resize with the map, wrap long locality names, and keep their close control clear of zoom controls. Open-Meteo and GeoNames/ph-geo/CC BY 4.0 credits and coordinate-coverage information remain visible.

Selection stays in component memory and clears on page exit, sign-out, account change or reload. Switching localities clears old forecast content; late responses cannot replace a newer selection. Weather needs no GPS permission, does not confirm/update an address, service zone or report point, and remains independent of Geoapify geocoding and water-service decisions. Fresh Laguna seeds and the explicit [v1 fixture upgrade](setup.md#upgrading-original-demo-locations-to-laguna) affect saved customer points, not this separate nationwide locality reference.

## Display and refresh

Current weather includes conditions, temperature, feels-like temperature, humidity, precipitation and wind. Daily entries show conditions, low/high temperature, precipitation total and maximum precipitation probability, presented as rain chance. Unknown codes and missing values are labeled unavailable; zero remains zero.

Values use Celsius, millimeters, km/h and percentages. Event timestamps and daily dates use `Asia/Manila`. Current conditions are model estimates. Weather time and API retrieval time are displayed separately, with linked Open-Meteo attribution; customer search credits GeoNames and supplier locality points retain GeoNames/ph-geo/CC BY 4.0 credit. Supplier advisories retain their own lifecycle and display.

Weather fetches when a forecast location is selected and on manual refresh; customer Home also fetches for its initial saved connection. Android refetches when Home returns to focus or the app enters the foreground. Weather does not use the 30-second water-service polling interval. Refresh respects the backend cache. Failed refresh retains previously loaded data for that same location with an explicit stale label and retry. Initial failures show an error/retry. Loading or failure remains independent of water-service data and supplier metrics.

## API contract

All paths are under `/api/v1`, use normal cookie/bearer authentication and return `{data: ...}`. These GET requests need no operation key.

| Method/path | Input | Response / authorization |
| --- | --- | --- |
| GET /weather/psgc-locations | No query parameters | `WeatherPsgcLocation[]`; staff/admin only; complete city/municipality catalog, including unavailable points |
| GET /weather | `psgcCode`: ten-digit canonical city/municipality code | `WeatherForecast`; staff/admin only; API resolves the representative point |
| GET /weather/locations | `q`: trimmed 2–100 character city search | `WeatherLocation[]`; all three signed-in roles; up to five Philippine results |
| GET /weather | `connectionId`: UUID | `WeatherForecast`; customer only; API checks ownership before provider/cache access |
| GET /weather | `latitude`, `longitude`: finite numeric strings in WGS84 ranges | `WeatherForecast`; all three signed-in roles; used by selected city results |

Exactly one forecast location mode is accepted. A PSGC code cannot be combined with connection IDs, coordinates or other parameters. Unknown/non-locality PSGC codes return 400; malformed codes return 400, customer access to a valid PSGC mode or the catalog returns 403, and a locality with null coordinates returns 422/`location_unavailable` before forecast-provider access. The catalog rejects query parameters. Unknown/mixed parameters, invalid coordinates and malformed searches return 400. Anonymous requests return 401, supplier connection-ID requests 403, foreign/absent connections 404, and an owned connection lacking coordinates 422/`location_unavailable`. Provider transport errors, timeouts, rate limits and invalid forecast payloads return 503/`provider_unavailable`. Existing application rate limiting also applies.

`WeatherPsgcLocation` contains canonical `code`, `name`, `level` (`city` or `municipality`), full ordered `ancestry` (including itself), and paired nullable `latitude`/`longitude`. It exposes no customer data. Its names/codes/ancestry come from the bundled Q2 2026 hierarchy; coordinates come from a separate reviewed [representative-point mapping](../psgc-address-data/weather/README.md).

`WeatherLocation` contains provider ID, name, nullable administrative area, country and coordinates. `WeatherForecast` contains requested coordinates, `timezone`, `fetchedAt`, `units`, `attribution`, `current` and seven `daily` entries. Measurement fields are nullable. Current `time` is an ISO UTC instant; daily `date` is a Manila-local `YYYY-MM-DD`. Shared types/display helpers are in [weather.ts](../aqours-contracts/src/weather.ts).

## Pickup-site monitoring

Supplier Distribution reuses this provider/normalizer for existing pickup coordinates, with a persistent forecast cache, scheduled refresh and independent temperature/reservation-stock warnings. The general Weather page selects canonical city/municipality representative points. See [distribution monitoring](distribution-monitoring.md) for stock meaning, threshold setup, freshness, timeline and map layers.

## Supplier reference coordinates

The retained canonical catalog has 1,642 cities/municipalities. Of these, 1,553 have representative coordinates and 89 remain unavailable. The pinned ph-geo source derives from GeoNames postal points under CC BY 4.0; it supplies approximate locality means rather than administrative geometry or exact addresses. An explicit historical province crosswalk plus unique normalized names joins sources; old six-digit locality identifiers are never expanded into canonical codes. The original bundled hierarchy, including known unexpected HUC ancestry, is preserved. Missing/ambiguous matches stay null; the 89 gaps include two explicit quality exclusions for displaced Santa Rosa/Laguna and Manila postal means. Other points are source-derived approximations with reviewed identity/ancestry matching, not independently spatially verified locations. See [pins, hash, coverage, mapping and retained notices](../psgc-address-data/weather/README.md).

## Provider and storage

Express calls fixed HTTPS endpoints `api.open-meteo.com/v1/forecast` and `geocoding-api.open-meteo.com/v1/search`. Forecast requests use current/daily variables, seven days, metric units, Unix timestamps and `Asia/Manila`. The API validates units, timestamps and measurements. Saved addresses, names and connection/account identifiers are never sent to Open-Meteo; forecasts send coordinates and customer city search sends search text. Supplier hierarchy selection is local reference-data filtering and never calls provider geocoding.

Forecast caching lasts ten minutes and city-search caching 24 hours. Each process-local cache holds at most 500 results and 500 distinct pending requests, shares identical in-flight requests and does not cache failures. Upstream calls time out after eight seconds. Cache expiry is checked on access; restart clears caches. General Weather has no shared multi-process cache, background worker, migration or persistent weather/location-selection history. The supplier catalog is read/cached from bundled reference files and includes every canonical city/municipality. Distribution storage/jobs remain separate.

No new dependency, API key or environment variable is required for the noncommercial demonstration. Outbound HTTPS to both hosts is needed. The free service has usage limits and no availability guarantee; commercial deployment requires the appropriate [Open-Meteo subscription](https://open-meteo.com/en/pricing). Keep attribution visible. This implementation uses public demonstration endpoints; paid-endpoint configuration is a future deployment change.

## Verification

Run the component weather unit tests through `npm --prefix aqours-api test`. Deterministic HTTP checks start their own API against a dedicated seeded database; supply a free local port and matching browser origin:

```sh
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_weather_test' \
AQOURS_TEST_API=http://127.0.0.1:4006/api/v1 \
AQOURS_TEST_WEB=http://localhost:5175 WEB_ORIGIN=http://localhost:5175 \
npm run test:weather
```

The HTTP runner intercepts only Open-Meteo calls. Authentication, database reads, ownership, validation, HTTP errors and caching execute against the real API/database. It reads the seeded customer12 connection for the missing-coordinate case and verifies saved connections remain unchanged; it does not assign coordinates or create a replacement connection.

Build/start the supplier client with `VITE_API_URL` pointing to the free test API port, and supply the matching `WEB_ORIGIN`, then run:

```sh
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_weather_test' \
WEB_ORIGIN=http://127.0.0.1:5175 AQOURS_TEST_API=http://127.0.0.1:4005/api/v1 \
AQOURS_TEST_WEB=http://127.0.0.1:5175 npm run test:weather:browser
```

Browser checks require `DATABASE_URL` for a seeded isolated `_test` database and a free `AQOURS_TEST_API` port matching the supplier bundle. The runner starts/stops its own API; do not start another API on that port. It uses real login, metrics and weather HTTP/database handling, controls only external Open-Meteo responses, and advances server wall time to exercise cache expiry without a ten-minute wait. Canonical PSGC cases cover Laguna startup, searchable hierarchy and no-province behavior, marker synchronization, unavailable points, reset, seven-day rendering, failures/retries, missing values, obsolete responses, narrow layout, staff access, tile failure and selection clearing. They do not certify provider uptime. Actual live-provider and installed Android evidence is recorded separately in [verification](verification.md) and the [native ledger](native-verification.md).

## Reference-led presentation — 22 October 2026

Current temperature now has stronger visual hierarchy on both clients. Supplier seven-day forecast rows retain labeled low/high, precipitation and rain-chance fields when rendered as narrow-screen rows. Supplier canonical PSGC map/hierarchy selection, customer connection/city modes, forecast refresh/stale/error states and provenance are unchanged by this presentation work. Actual rendered/native results and their provider/artifact boundaries are recorded in the [UI/UX guide](ui-ux.md).
