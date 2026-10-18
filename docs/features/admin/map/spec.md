# Supplier report map

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no supplier UI, map integration, coordinate persistence, or map query endpoints exist.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S03, REQ-REPORT-04–05, REQ-INCIDENT-02–04, REQ-ACCESS-03–04 and REQ-OPS-02, 06–07.

---

## WHAT

- Show authorized staff/admin where reported issues are located using MapLibre GL JS in the React supplier application.
- Combine filtered report markers/display clusters, explicit service zones, and published affected-area polygons.
- Link selected records to the [report inbox](../report/spec.md) and [incident detail](../incident/spec.md).
- Support triage and navigation without claiming that visual proximity proves a shared outage or service boundary.
- Staff/admin map access is an operational permission under the proposed split; customers receive no other households' raw locations.
- Hydraulic modeling, automatic incident detection, navigation/routing, and a public household-report map are outside scope.

---

## MUST

### Rendering and meaning

- Render saved, confirmed WGS84 coordinates as GeoJSON `[longitude, latitude]` points.
- Use the stored report issue location, not a fresh guess from its saved connection or geocoder.
- Show location-source/review information in authorized record detail.
- Put reports with missing/ambiguous coordinates in an accessible unlocated list/inbox count rather than hiding them.
- Never place a missing report at `(0, 0)` or a service-zone centroid as if that were its reported position.
- Show service zones and published affected-area Polygon/MultiPolygon shapes from validated stored GeoJSON.
- Keep internal operational geometry and raw household coordinates out of customer/published projections.
- Treat clusters as a display feature whose grouping changes with zoom/configuration.
- Do not use cluster membership/count to confirm an incident, assign severity, draw an actual outage boundary, or infer supply connectivity.
- Preserve the ability to inspect an isolated severe report and send it for priority review.
- Show unique reporting connections and independently sourced affected-customer estimates only under their own labels.

### Queries and resilience

- Filter authorized data by numeric viewport bounds plus category/status/time; explicit zone filtering is a proposed addition.
- Validate finite longitude/latitude bounds, ranges, time filters, enum values, and result/page limits server-side.
- Query ordinary numeric PostgreSQL columns; PostGIS is not required.
- Make truncation/pagination visible; do not present a capped result as every report in the area.
- Preserve applicable filters when navigating between map, inbox, and incident records.
- Require staff confirmation in the incident workflow for any suggested related-report association.
- Keep list views and report navigation usable when tiles, style loading, or map rendering fail.
- Show explicit loading, failed query, no mapped reports, unlocated reports, and stale-result states.
- “No mapped reports” must not imply that service is normal or water is safe.
- Choose compatible map tiles/styles and display required attribution; geocoding and basemap provisioning are separate integrations.
- Keep Geoapify/database secrets server-side; restrict any required client-visible tile credentials appropriately.
- Clearly label demonstration incidents and affected-area shapes.

### Acceptance criteria

- [ ] SUP-MAP-01: A confirmed geocoded point renders at the same longitude/latitude on supplier web and Android customer maps.
- [ ] SUP-MAP-02: Null/ambiguous coordinates remain visible in the unlocated list and never generate invented markers.
- [ ] SUP-MAP-03: Category/status/time/viewport filters return the intended authorized records and preserve applied filter state.
- [ ] SUP-MAP-04: Zoom changes cluster grouping without changing incident associations, priority, or stored affected boundaries.
- [ ] SUP-MAP-05: An isolated severe report can open review without satisfying a cluster-size threshold.
- [ ] SUP-MAP-06: Customer/unauthenticated direct requests cannot obtain household markers or staff-only detail.
- [ ] SUP-MAP-07: Tile failure leaves the report list/navigation usable; query failure does not display an empty success result.
- [ ] SUP-MAP-08: Invalid bounds are rejected and a result cap is disclosed instead of silently omitting records.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: MapLibre view, query/filter hook, legend, report selection, unlocated list, and basemap-error fallback in `aqours-web/`.
- Proposed Express responsibilities: staff/admin permission guard, validated viewport query, numeric repository filters, and safe map DTOs in `aqours-api/`.
- Proposed data: report coordinate pairs/provenance, confirmed zone links, optional GeoJSON zone boundaries, and published incident/advisory areas.
- Proposed `GET /api/v1/staff/map/reports`: numeric bounds and filters in; point features, stable report IDs, pagination/cap information, and as-of time out.
- Proposed authorized zone/published-area read interfaces reuse the same records as [settings](../settings/spec.md), [incidents](../incident/spec.md), and [advisories](../advisory/spec.md).
- Do not fetch geocoding for every map refresh; render persisted coordinates confirmed during location capture/review.
- Convert latitude/longitude columns to point arrays in one API mapping function and verify the ordering at both clients.
- Debounce/coalesce viewport reads as a proposed client behavior; discard responses for superseded filter/view queries.
- Return structured validation/authorization/service errors and retain an explicit as-of label for any stale displayed data.

### Verification and operation

- Test numeric boundary inclusion, coordinate range/order, null pairs, filters, authorization, and result limits at the API.
- Exercise map/list behavior with geocoder failures, tile failures, unknown zones, clusters at several zoom levels, and a severe isolated report.
- Verify customer DTOs exclude household markers/contact details and unpublished content.
- Observe query latency/error/cap events and basemap failures without logging raw household coordinates unnecessarily.
- Dependencies: [authentication](../auth/spec.md), [reports](../report/spec.md), [incidents](../incident/spec.md), and explicit zone data from [settings](../settings/spec.md).
- Open choices: tile/style provider, default demo geography/viewport, result limits, and handling of any future antimeridian-spanning viewport.
- Technical reference: [MapLibre cluster example](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/); clustering is a rendering capability, not outage evidence.
- No map implementation or device/browser verification is claimed by this specification.
