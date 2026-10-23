# Service operations design review

Direction: Framed sheet, seed 116892705; keep Aqours palette and Noto Sans.
One redraw: list pattern changed from count-filter cards to table/filter layout because paginated endpoints provide no global state counts. The user explicitly requested compact tables; mobile keeps columns rather than following the dealt two-line list variant.

Inventory: supplier staff/admin, explicit incident publication, independent official restrictions, owned assistance, callback/inspection/water support, Manila dates, exact liter stock, pickup references, server-evaluated site warnings, unavailable coordinates, PSGC localities, retained forecast freshness.

Idea: Aqours' incident references, pickup stock and locality forecasts become aligned operational registers. The face is the existing green-grey frame and Q mark. Its signature is the relationship between current stock and dated forecast evidence beside the pickup map. The working interactions are filters, site selection, reservation lookup and locality selection.

Questions: Incidents—what needs coordination? Advisories—which restrictions are official? Assistance—which request needs action? Distribution—what supply/evidence does each site have? Weather—what are the conditions and seven-day outlook?

## Round 1 — before

The 1440/768/390 screenshots show large gaps around table values, stacked mobile fields and excessive setup instructions before distribution data. Incidents use 96px desktop rows and 396px mobile rows; advisories/assistance use 74px desktop rows. Site rows are inflated by paragraph-style demonstration labels. Weather numbers are left-aligned and low/high temperatures share a long cell.

Top three changes: use consistent dense table cells; keep columns at narrow widths; put operational data ahead of setup/map explanations.

## Round 2 — first implementation

The register tables align and fit substantially more rows. Screenshot review caught a monitoring status touching its site name, a misleading default-date filter count, and a mobile reservation input aligned to the right. Corrected the status to its own line, put date selection solely in the existing timeline, and stretched the mobile lookup fields. Compact paired weather selectors and forecast-before-map order reduce phone scrolling. Distribution sessions/sites lose their extra enclosing panel padding.

The inspector also caught a tablet date label within 16px of the viewport edge; smaller horizontal button padding lets all seven dates fit. A focused interaction check prompted explicit clearing of all distribution query filters.

## Round 3 — final app-screen critique

1. Question: each register leads with operational identities/statuses, while Distribution pairs stock with dated forecasts. Weather names its chosen locality before showing conditions and the seven-day table.
2. Edges: shared page margins and full-width tables; no stretched empty cards. Short registers leave honest space below their last row. The monitoring table and map align at their top edges and keep their natural heights.
3. Colour: existing teal/green-grey identity; primary controls in ink; statuses retain operational colours. Map colours describe existing warning/temperature scales.
4. Arithmetic/alignment: integer counts and exact liter strings align right. Fictional session stock reconciles: 1,000.00 − 200.00 − 100.00 = 700.00 L. Dates and forecast values come from the same fixture values as their repeated labels.
5. Zero/missing: unknown restoration/appointment values remain Unknown; unlocated/unconfigured sites retain unavailable/incomplete explanations. No synthetic total is added to production screens.
6. Legend: existing site-status/temperature meanings stay together under Map layers and legend. No new chart or colour scale.
7. Phone: navigation folds, controls remain reachable, columns scroll inside named focusable regions. Weather search/select pairs fit within the screen; forecast precedes the map. Secondary columns require horizontal scrolling, an explicit tradeoff for readable comparison tables.

Scores: Design 8, Usability 8, Creativity 7, Content 9; weighted 7.9/10. Remaining limits: long monitoring evidence needs several text lines; wide tables require horizontal scrolling on phones; provider/configuration notices remain visible in fixture maps. These are operational constraints, not missing production content.

Inspector allowance: `heavy-shadow` only for the existing floating Leaflet map popup in the loaded-weather DOM snapshot. Resting panels have no shadow. Some early inspector folds capture the existing loading state; the loaded Playwright frames supply the full-data review.

Inspector warning rationale: 12px headers, status labels, dates and secondary lines are deliberate compact-table metadata; primary values stay 13px. An empty band below a five-row advisory list is the honest end of a paginated collection, not room for invented content. Source lint flags existing map-marker contrast shadows and the existing semantic temperature scale; neither introduces decorative panels or new chart colours.

No found photographs, generated assets, footage or decorative motion were used. Existing provider/provenance credits remain in the map and Weather footer. All synthetic content is isolated in verification fixtures and is never shipped as application data. See docs/service-operations-ui.md and docs/verification.md for executed check boundaries.
