# Aqours reports workspace review

Direction: Framed sheet, seed 236262658. No redraws. The map inspector allows `icon-chips` solely for the existing category-coded map markers/legend: these encode issue types and match the operational map, rather than decorating KPI cards. Removed Leaflet's default scale text-shadow. Existing Noto Sans and teal retained. The green-gray frame is the product face; the customer issue map, report references and distinct water issue categories are its signature. Separate KPI cards follow the user's explicit request.

## Data inventory and questions

- Staff/admin operators review customer water reports during sustained work sessions.
- Reports carry references, category, submission/noticed times, status, priority, owner and issue address.
- Categories are outage, low pressure, leak and water quality; location review is distinct from issue status.
- Overview asks which service work needs attention; unresolved reports lead the numeric hierarchy.
- Inbox asks which report to review next; each row ends with Review.
- Messages asks which conversation to open; previews retain report identity, status and last activity.
- Map asks where reports and customers are located; select/open are separate row actions.
- Counts, rates and cohort definitions come from the API; no growth/delta values are invented.
- Filters keep category/status/date/zone/owner/priority fields where supported, plus assistance's existing type variants.
- Fixtures contain six fictional Calamba reports, five unresolved, one resolved; categories sum to six (2 + 1 + 2 + 1). One fictional operator and six customer connection points are test-only.

## Screenshot review, round 1

Before captures: `.local/reports-redesign/before/`, all four screens at 1440/768/390. The original mobile inbox/map rows became long blocks; filters occupied several rows; actions were embedded in identity cells; KPI links shared a border; notifications sat disconnected in the header.

After captures exposed three concrete problems: the action column could leave the visible table frame, tablet status labels broke within words, and the old mobile header selector hid the current destination. Fixed with pinned action/identity columns, nonwrapping status labels, explicit breadcrumb visibility, and a wider desktop map list. The inspector also found 4.4:1 disabled-button contrast; darkened to the existing muted text token.

A selected-map phone capture also exposed a hidden-pane sizing/centering defect. Selection now recalculates map size and centers the stored report point before opening the popup, with Leaflet auto-pan to fit its full height and lower-right zoom controls to keep the popup close button clear; the browser suite checks the popup against the map bounds. Mobile map action cells explicitly prevent icon wrapping.

## Final critique using the app-screen rubric

1. Question and hierarchy: unresolved reports lead Overview; report/conversation tables carry each queue's main action. The map keeps its data overlay and list usable without configured raster tiles.
2. Frame: one 228px navigation column, 24px canvas gutters, 16px peer-card gaps; phone margins are 16px. Cards/tables align to the same edges. Sparse real queues retain their headings/empty explanations.
3. Colour: quiet green-gray chrome, white work surface, teal unresolved figure/brand, semantic status colours. Existing map category colours, including water-quality purple, retain their established meaning.
4. Arithmetic: 5 unresolved + 1 resolved = 6 reports; category counts 2 + 1 + 2 + 1 = 6. Counts are fixture API values, never production defaults. Duration samples/pending totals agree with the six-report cohort.
5. Missing and zero states: existing resource and metric behavior retained. Empty tables explain their next step, stale data remains labeled, errors expose Retry; no missing duration becomes a fabricated zero.
6. Legends: no new charts; existing map category/person/cluster legends remain paired with their actual symbols. Domain markers retain their existing static SVGs.
7. Phone: Menu collapses navigation; native filter dialog scrolls and restores focus. Real tables scroll internally, retaining identity and actions. Secondary fields require horizontal scrolling, an intentional tradeoff for the requested table format. List/Map remain separate mobile views.

Judgment: the redesign improves hierarchy, consistency and action discoverability. It is an operational interface rather than a graphic showcase. Remaining limits are horizontal scrolling for secondary table fields on phones and provider-dependent raster basemaps. No invented product statistics, stock photographs, animations or production sample rows were added.

Final browser measurements: all four screens have 0 FAIL / 0 WARN at 1440, 768 and 390 px, with only the documented map-symbol allowance. All final viewport captures and the selected phone popup were opened and judged. No further visual defects remain in the reviewed states; secondary table fields still require horizontal scrolling on narrow screens.
