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

Without an explicit style override, both clients use OpenStreetMap standard raster tiles, showing provider-supplied roads, labels, and landmarks. Supplier maps add a metric scale, reset view, independent report/zone/incident/advisory visibility, and report popups with an explicit Open report action. Popups use text nodes for stored content. Existing viewport filters, truncation counts, clustering, and list fallback remain in place. Customer previews center the point without changing it when panned or zoomed.

`VITE_MAP_STYLE_URL` and `EXPO_PUBLIC_MAP_STYLE_URL` take precedence. Leave them empty/unset to use the street default. `VITE_MAP_TILE_URL` and `EXPO_PUBLIC_MAP_TILE_URL` optionally replace its raster template. These are public settings; never put a private geocoding key in them. Custom providers need their own compatible attribution; supplier `VITE_MAP_ATTRIBUTION` adds provider credit, and native MapLibre's attribution control remains enabled.

The public standard tiles are a demo default subject to the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/): visible attribution, normal HTTP caching, valid browser referrers and an identifiable native request header. The Android client identifies its OSM requests as Aqours. No offline download or bulk prefetch feature is offered. Automated WebGL tests intercept OSM requests with a local raster fixture rather than fetching public tiles while panning/zooming. Public service availability is best-effort; configure a suitable licensed provider before substantial deployment.

PSGC cannot establish a street-level point, a service-zone association, or a water-supply boundary. GPS and explicitly confirmed Geoapify candidates supply coordinates. Unlocated addresses remain unlocated and require review; changing an address does not silently relocate a report or assign a service zone. No administrative boundary dataset, routing, satellite imagery, or geocoder replacement is included.

## Dataset and database updates

The API reads the region index and its referenced files relative to the project layout, from source and compiled builds alike. Deploy `psgc-address-data/data/` alongside `aqours-api/`; clients fetch the authenticated catalog instead of bundling all barangays. No runtime package installation is required.

To update the snapshot, replace the index and referenced region files together, update the catalog version, inspect hierarchy changes and provenance, and run the catalog/API/client checks. Do not rewrite old snapshots or guess mappings from duplicate names. The integrity test currently expects 18 regions, 82 provinces, 149 cities, 1,493 municipalities, 14 sub-municipalities, and 42,010 barangays.

Deploy Prisma migration `202610200002_psgc_addresses` before starting the updated API. It adds nullable JSONB columns to service connections, reports, and pickup sites without backfilling or changing their existing strings/coordinates. The database URL and any provider keys remain private operator configuration. Live Geoapify verification still requires configured operator credentials.
