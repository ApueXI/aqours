# Supplier report map

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S03, REQ-REPORT-04–05, REQ-INCIDENT-02–04, REQ-ACCESS-03–04 and REQ-OPS-02, 06–07.

---

## WHAT

- Show authorized staff/admin where reported issues are located using MapLibre GL JS in the React supplier application.
- Combine filtered report markers/display clusters, explicit service zones, and published affected-area polygons.
- Link selected records to the [report inbox](../report/spec.md) and [incident detail](../incident/spec.md).
- Support triage and navigation without claiming that visual proximity proves a shared outage or service boundary.
- Staff/admin map access is an operational permission under the adopted split; customers receive no other households' raw locations.
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

- Filter authorized data by numeric viewport bounds plus category/status/time; explicit zone filtering is implemented.
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

### Implemented behavior and modules

`aqours-web/src/pages/MapPage.tsx`, `map/MapCanvas.tsx` and `map/layers.ts` implement MapLibre points/clusters, filters, zone/published shapes and an accessible report list/failure fallback.

`aqours-api/src/routes/analytics.ts` implements staff-only numeric viewport queries using generated numeric coordinate columns and parameterized filters. Bounds must be ordered and cannot cross the antimeridian. The response has a result cap/truncation count and unlocated count; unlocated records remain reviewable in the inbox. GeoJSON points use longitude then latitude. Layers and clusters never establish network topology or water safety.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Five actual production MapLibre checks cover live demonstration style, cluster expansion/zoom without writes and authorized point selection; recovery checks cover combined filters/unlocated/API failures. Native NM14 confirms the same persisted GPS point/5m accuracy on preview and supplier canvas; NM16 verifies actual native map404 fallback. Live signed geocoded-point equality remains blocked on private Geoapify configuration.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
