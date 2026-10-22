# Weather

Added 21 October 2026; supplier navigation updated 22 October 2026. Customer Home and the supplier Weather page (`/#/weather`) show current conditions and a seven-day forecast from [Open-Meteo](https://open-meteo.com/en/docs). Staff/admin open Weather through desktop or mobile navigation; forecasts are no longer embedded in supplier Overview. Customers, staff and admins can use the authenticated weather endpoints. Weather is informational context; it does not create incidents, publish advisories, establish water safety or change assistance/guidance decisions.

## Choosing a location

- Customer Home initially selects the first saved connection with coordinates, or the first connection when none has coordinates. Every saved connection is selectable; missing coordinates prompt for city search.
- Supplier Weather initially prompts for a city. Admins and staff can select Calamba, Los Baños or Santa Rosa for the Laguna demonstration. Both clients search Philippine places through the separate [Open-Meteo geocoding service](https://open-meteo.com/en/docs/geocoding-api), with up to five labeled city/administrative-area results and explicit selection.
- Weather search is independent of Geoapify and PSGC reporting. It does not confirm/update an address, service zone or report location, and needs no GPS permission.
- Selection stays in component memory and clears on unmount or account change. Supplier selection therefore clears when leaving the Weather page, signing out or reloading. Switching locations clears old forecast content; late responses cannot replace the newer selection.

Fresh Laguna seeds and the explicit [v1 fixture upgrade](setup.md#upgrading-original-demo-locations-to-laguna) make customer weather use the selected saved Laguna point automatically. Customer12 retains no coordinates and uses city search. The admin still explicitly selects a weather city; nationwide weather search remains available. PSGC names/codes and weather geocoding are separate sources.

## Display and refresh

Current weather includes conditions, temperature, feels-like temperature, humidity, precipitation and wind. Daily entries show conditions, low/high temperature, precipitation total and maximum precipitation probability, presented as rain chance. Unknown codes and missing values are labeled unavailable; zero remains zero.

Values use Celsius, millimeters, km/h and percentages. Event timestamps and daily dates use `Asia/Manila`. Current conditions are model estimates. Weather time and API retrieval time are displayed separately, with linked Open-Meteo attribution and GeoNames search credit. Supplier advisories retain their own lifecycle and display.

Weather fetches when a forecast location is selected and on manual refresh; customer Home also fetches for its initial saved connection. Android refetches when Home returns to focus or the app enters the foreground. Weather does not use the 30-second water-service polling interval. Refresh respects the backend cache. Failed refresh retains previously loaded data for that same location with an explicit stale label and retry. Initial failures show an error/retry. Loading or failure remains independent of water-service data and supplier metrics.

## API contract

All paths are under `/api/v1`, use normal cookie/bearer authentication and return `{data: ...}`. These GET requests need no operation key.

| Method/path | Input | Response / authorization |
| --- | --- | --- |
| GET /weather/locations | `q`: trimmed 2–100 character city search | `WeatherLocation[]`; all three signed-in roles; up to five Philippine results |
| GET /weather | `connectionId`: UUID | `WeatherForecast`; customer only; API checks ownership before provider/cache access |
| GET /weather | `latitude`, `longitude`: finite numeric strings in WGS84 ranges | `WeatherForecast`; all three signed-in roles; used by selected city results |

Exactly one forecast location mode is accepted. Unknown/mixed parameters, invalid coordinates and malformed searches return 400. Anonymous requests return 401, supplier connection-ID requests 403, foreign/absent connections 404, and an owned connection lacking coordinates 422/`location_unavailable`. Provider transport errors, timeouts, rate limits and invalid forecast payloads return 503/`provider_unavailable`. Existing application rate limiting also applies.

`WeatherLocation` contains provider ID, name, nullable administrative area, country and coordinates. `WeatherForecast` contains requested coordinates, `timezone`, `fetchedAt`, `units`, `attribution`, `current` and seven `daily` entries. Measurement fields are nullable. Current `time` is an ISO UTC instant; daily `date` is a Manila-local `YYYY-MM-DD`. Shared types/display helpers are in [weather.ts](../aqours-contracts/src/weather.ts).

## Provider and storage

Express calls fixed HTTPS endpoints `api.open-meteo.com/v1/forecast` and `geocoding-api.open-meteo.com/v1/search`. Forecast requests use current/daily variables, seven days, metric units, Unix timestamps and `Asia/Manila`. The API validates units, timestamps and measurements. Saved addresses, names and connection/account identifiers are never sent to Open-Meteo; forecasts send coordinates and city search sends search text.

Forecast caching lasts ten minutes and city-search caching 24 hours. Each process-local cache holds at most 500 results and 500 distinct pending requests, shares identical in-flight requests and does not cache failures. Upstream calls time out after eight seconds. Cache expiry is checked on access; restart clears caches. There is no shared multi-process cache, background worker, migration or persistent weather/location-selection history.

No new dependency, API key or environment variable is required for the noncommercial demonstration. Outbound HTTPS to both hosts is needed. The free service has usage limits and no availability guarantee; commercial deployment requires the appropriate [Open-Meteo subscription](https://open-meteo.com/en/pricing). Keep attribution visible. This implementation uses public demonstration endpoints; paid-endpoint configuration is a future deployment change.

## Verification

Run component checks plus six weather unit tests through `npm --prefix aqours-api test`. Deterministic HTTP checks start their own API against a dedicated seeded database; supply a free local port and matching browser origin:

```sh
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_weather_test' \
AQOURS_TEST_API=http://127.0.0.1:4006/api/v1 \
AQOURS_TEST_WEB=http://localhost:5175 WEB_ORIGIN=http://localhost:5175 \
npm run test:weather
```

The HTTP runner intercepts only Open-Meteo calls. Authentication, database reads, ownership, validation, HTTP errors and caching execute against the real API/database. It adds a fictional connection for the missing-coordinate case, then supplies that fixture with reviewed coordinates so later test consumers retain usable connection context.

Build/start the supplier client with `VITE_API_URL` pointing to the free test API port, and supply the matching `WEB_ORIGIN`, then run:

```sh
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_weather_test' \
WEB_ORIGIN=http://127.0.0.1:5175 AQOURS_TEST_API=http://127.0.0.1:4005/api/v1 \
AQOURS_TEST_WEB=http://127.0.0.1:5175 npm run test:weather:browser
```

Browser checks require `DATABASE_URL` for a seeded isolated `_test` database and a free `AQOURS_TEST_API` port matching the supplier bundle. The runner starts/stops its own API; do not start another API on that port. It uses real login, metrics and weather HTTP/database handling, controls only external Open-Meteo responses, and advances server wall time to exercise cache expiry without a ten-minute wait. Laguna city cases cover rendering, failures, retries, missing values, obsolete responses, narrow layout, staff access and selection clearing. They do not certify provider uptime. Actual live-provider and installed Android evidence is recorded separately in [verification](verification.md) and the [native ledger](native-verification.md).
