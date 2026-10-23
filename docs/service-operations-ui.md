# Supplier service operations presentation — 24 October 2026

The Incidents, Official advisories, Assistance queue, Water distribution and Weather pages retain the supplier workspace frame and use compact operational tables. No dependencies, backend endpoints, permissions, DTOs, stock calculations or database records change.

## Layout and behavior

- Tables keep real column headers and row identities at every width. `OperationsTable` provides a named, keyboard-focusable scroll region, a sticky header and a tablet/phone scroll hint. Long tables scroll within a bounded area; existing server pagination remains available below.
- Cells use 8px vertical and 12px horizontal padding, 13px values and 12px secondary lines. Numeric counts, stock quantities and forecast measures align right with tabular figures. Unknown values remain explicit. Mobile actions have 44px targets.
- Incidents and advisories show their server-reported collection totals beside register headings. Assistance retains its query filters, linked report references and queue return context. Demonstration labels remain visible.
- Distribution puts section tabs near the title, keeps reservation lookup available, and collapses setup instructions under **How water pickup works**. Search/status/site filters use the existing filter dialog. The seven-day timeline controls the forecast date; Warning history retains its independent unrestricted date control.
- Monitoring compares sites in a table beside the existing Leaflet map, with daily maximum temperature, current available liters, server status, freshness and missing-location/configuration information. Select a site by its name or map marker to review/configure it. On smaller screens the existing List/Map switch remains available. **Map layers and legend** expands the existing basemap, overlay and legend controls.
- Session stock, pickup sites and warning history use the same compact table treatment. Management and creation controls retain their existing forms, validation, version checks and retry behavior.
- Weather keeps all searchable PSGC hierarchy controls and attribution. The forecast separates low/high temperatures and aligns rain/chance values in columns. Missing locality points, provider failures and stale results retain their explicit states.

The production UI continues to request authorized API data. Fictional visual-verification data exists only under `verification/fixtures/`; it is never imported into application code.

## Design record

Used `design-taste-frontend` app-screen rules and the existing brand: **Framed sheet**, seed **116892705**, with Noto Sans and the green-grey Aqours frame. One redraw replaced count-filter cards with the library's table/filter pattern: paginated endpoints do not provide global state counts, and invented totals would be misleading. The user's compact-table request takes priority over the pattern's mobile list suggestion.

Idea: Aqours' incident references, pickup stock and locality forecasts become aligned operational registers. The working interactions are the existing filters, record links, site selection, reservation lookup and forecast selector. No imagery, decorative motion or sample production content was added.

| Screen | First question |
| --- | --- |
| Incidents | Which area incident needs coordination, and when might service return? |
| Advisories | Which official restriction or notice is drafted, published or lifted? |
| Assistance | Which callback, inspection or pickup request needs action? |
| Distribution | What stock and forecast evidence does each pickup site have? |
| Weather | What are the current conditions and next seven days for this locality? |

## Reproduce the visual checks

Use installed dependencies and Chromium. From the repository root, start the read-only fictional API and the Vite preview in separate terminals:

```sh
node --experimental-strip-types verification/service-operations-preview.ts
AQOURS_NO_DOTENV=1 VITE_API_URL=http://127.0.0.1:5200/api/v1 npm --prefix aqours-web run dev -- --host 127.0.0.1 --port 5199
node --experimental-strip-types verification/browser-service-operations.ts
```

`AQOURS_CHROMIUM` overrides the browser executable. Artifacts stay under `.local/service-operations/`; browser temporary files use project-local `.tmp/`. The preview rejects mutations, binds only to loopback and never loads the API/database. Stop both processes after verification. Use the normal development/build command for ordinary API configuration.

The browser suite covers seven views at 1440/768/390px, table semantics/no document overflow, query filters and return navigation, incident/advisory/session forms, site selection, reservation lookup, weather hierarchy/missing point/retry, queue empty/stale states and staff-only publication restrictions. These are controlled presentation checks, not real HTTP/database lifecycle or provider-uptime evidence.

The data contains six fictional incidents, five advisories, six assistance requests, three pickup sites/sessions and three locality entries. Each session has 1,000.00 total − 200.00 reserved − 100.00 collected = 700.00 available liters. Forecast values are synthetic. No fictional public-health notice is published and no stock is reserved or collected.
