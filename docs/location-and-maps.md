# Locations and maps

Aqours uses the bundled `psgc-address-data/data/` Q2 2026 administrative hierarchy for guided Philippine addresses. The supplied JSON identifies `PSGC-2Q-2026-Publication-Datafile.xlsx` as its source. It is a versioned reference snapshot, not a live PSA feed. It contains names and codes, not coordinates or administrative boundary geometry.

## Address entry

Customer alternate issue locations, admin service connections, and staff pickup sites offer guided selection and free-text entry. Search each level, select through barangay, and optionally enter a street, building, or landmark. The selectors follow the actual tree: provinces are omitted where absent, and Manila sub-municipalities appear as districts. Changing a parent clears its descendants. Unfinished guided addresses cannot be submitted, including while child data is loading. Free text and existing saved addresses remain available when catalog requests fail.

The API accepts `structuredAddress: { barangayCode, streetDetails }` alongside the existing address string. Codes remain ten-character strings, including leading zeroes. The server validates the barangay and resolves its full ancestry; client-supplied ancestry/names are rejected. For address-only and GPS inputs it composes the canonical display address. Confirmed Geoapify candidates retain their returned address and bind the PSGC selection/street details in their signed token. Editing either requires a new lookup and confirmation.

Stored `structuredAddress` snapshots contain `barangayCode`, trimmed `streetDetails`, `datasetVersion`, and ordered `ancestry` entries with `code`, `name`, and `level`. Reports using a saved connection copy its existing snapshot. Later connection corrections do not alter report history. Nullable snapshots leave legacy addresses unchanged; text corrections clear an obsolete structured snapshot. Omitted fields on other edits preserve it; explicit null clears it.

The authenticated catalog endpoints are available to all existing roles:

- `GET /api/v1/locations/psgc/regions`
- `GET /api/v1/locations/psgc/children?parentCode=<ten-digit-code>`

Both return the normal `{ data: [...] }` envelope. Entries have `code`, `name`, `level`, and `hasChildren`. Unknown/malformed parents return 400; an existing leaf returns an empty list. No customer records are exposed by the catalog. Existing customer ownership, admin connection maintenance, and staff pickup permissions remain enforced by the backend.

## Map detail and accuracy

The supplier web uses direct Leaflet 1.9.4 with markercluster. Its initial and reset views cover the representative Laguna fixtures. Its default raster provider is Geoapify OSM Bright. The native customer preview retains MapLibre and its OpenStreetMap street default. Both render the stored report location without changing coordinates on pan/zoom. Supplier controls retain metric scale, reset view, independent report/zone/incident/advisory visibility and safe text-node popups. List navigation remains usable when the map provider fails.

The customer preview entry point checks `isRunningInExpoGo()` before loading the separate native MapLibre renderer and street-map configuration. Expo Go displays the supplied coordinates; native builds retain interactive maps, attribution and retry. See [mobile launch instructions](../aqours-app/README.md#run-in-expo-go).

### Supplier raster configuration

- `VITE_GEOAPIFY_MAPS_API_KEY`: intentionally public, tile-only browser key for Geoapify OSM Bright. Configure it privately through the operator's build environment and restrict it to allowed website origins and provider quotas. It is separate from the API's private geocoding key.
- `VITE_MAP_TILE_URL`: optional public raster URL template override. Alternate providers require the corresponding `VITE_MAP_ATTRIBUTION` credit.
- `VITE_MAP_ATTRIBUTION`: provider attribution for a custom raster template. Geoapify maps display Geoapify, OpenStreetMap and OpenMapTiles attribution.
- `VITE_MAP_STYLE_URL`: retired on web because Leaflet consumes raster tile templates, not MapLibre style JSON. Replace it with a compatible `VITE_MAP_TILE_URL` and attribution, or use the Geoapify browser tile key.

Missing browser-key/template configuration and tile errors produce explicit basemap notices; authorized report markers/list data are separate from tile availability. There is no fabricated success or silent key reuse. Backend address lookup still uses `GEOAPIFY_API_KEY` and `GEOCODE_SIGNING_SECRET` on Express only. Never copy those private credentials into a `VITE_*` variable.

Native `EXPO_PUBLIC_MAP_STYLE_URL` still takes precedence over `EXPO_PUBLIC_MAP_TILE_URL` and the default street style. Keep provider/source attribution visible. The OpenStreetMap demo default is subject to its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/); no offline download/bulk prefetch is offered. Automated map tests use a local raster fixture and explicit test configuration rather than panning/zooming against public tile services.

PSGC cannot establish a street-level point, a service-zone association, or a water-supply boundary. GPS and explicitly confirmed Geoapify candidates supply coordinates. Unlocated addresses remain unlocated and require review; changing an address does not silently relocate a report or assign a service zone. No administrative boundary dataset, routing, satellite imagery, or geocoder replacement is included.

## Dataset and database updates

The API reads the region index and its referenced files relative to the project layout, from source and compiled builds alike. Deploy `psgc-address-data/data/` alongside `aqours-api/`; clients fetch the authenticated catalog instead of bundling all barangays. No runtime package installation is required.

To update the snapshot, replace the index and referenced region files together, update the catalog version, inspect hierarchy changes and provenance, and run the catalog/API/client checks. Do not rewrite old snapshots or guess mappings from duplicate names. The integrity test currently expects 18 regions, 82 provinces, 149 cities, 1,493 municipalities, 14 sub-municipalities, and 42,010 barangays.

Deploy Prisma migration `202610200002_psgc_addresses` before starting the updated API. It adds nullable JSONB columns to service connections, reports, and pickup sites without backfilling or changing their existing strings/coordinates. The database URL and any provider keys remain private operator configuration. Live Geoapify verification still requires configured operator credentials.

## Laguna demonstration fixtures

New seeds use three canonical barangays: Bagong Kalsada (`0403405001`, City of Calamba), Batong Malake (`0403411004`, Los Baños), and Balibago (`0403428002`, City of Santa Rosa). Their ancestry includes Laguna (`0403400000`) and Region IV-A CALABARZON (`0400000000`). Names/codes come only from the bundled PSGC snapshot; nationwide runtime address selection is unchanged.

Representative point centers are approximately `(14.1679,121.1951)`, `(14.1674,121.2433)` and `(14.2946,121.1054)`. Locality checks used [Bagong Kalsada](https://mapcarta.com/36439088), [Batong Malake](https://mapcarta.com/32291410) and [Balibago](https://www.philatlas.com/luzon/r04a/laguna/santa-rosa/balibago.html). Household points use tiny synthetic offsets and each demonstration zone is a rectangle within 0.001 degrees of its center. These are approximate demonstration geometry, not surveyed homes, barangay outlines or real supplier coverage. Customer12 retains null coordinates and no confirmed zone despite its canonical address.

The [explicit v1 upgrade](setup.md#upgrading-original-demo-locations-to-laguna) can correct original demo report snapshots while preserving user-created reports and immutable history. This administrative exception does not change normal historical-address behavior. Saved coordinates also supply the customer's [weather forecast](weather.md); PSGC codes alone never provide weather coordinates.
