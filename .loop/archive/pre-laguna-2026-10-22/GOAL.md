# Aqours UI/UX overhaul

Approved 2026-10-21: both clients, full UX, shared teal utility style. Reference SeeClickFix https://www.civicplus.com/seeclickfix-311-crm/, Thames Water https://www.thameswater.co.uk/help/report-a-problem, FixMyStreet https://fixmystreet.org/pro-manual/, Manila Water https://www.manilawater.com/.

Use loop-engineer and uncodixfy. Maximum FOUR total implementation-verification-correction cycles, including initial implementation. No external continuation runner. Approved new dependencies only: Leaflet1.9.4, @types/leaflet, leaflet.markercluster and its types. No database/domain API changes planned. Preserve permissions, lifecycle, retry/stock integrity, Expo Go fallback/native MapLibre and old links. Project-only files/caches; never read/change secrets. Branch feature/ui-ux-overhaul. Commit verified deliverables. Physical TS line limits web250/mobile300/API200.

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Shared accessible teal design across all mobile and supplier screens | Content/visual review; type/lint/build; narrow/desktop browser checks |
| AC-002 | Mobile five-tab navigation/stacks and four-step report with draft/retry/photo integrity | Helper tests; Android export/build; installed navigation/form checks if available |
| AC-003 | Supplier operational shell/inbox/map/detail and all existing workflows redesigned | Existing browser suites plus responsive/keyboard/error checks |
| AC-004 | Direct Leaflet1.9.4/markercluster, Geoapify raster config/attribution, overlays/selection/fallback | Real rendered map browser checks, tests, no web MapLibre worker |
| AC-005 | Existing authorization/domain/retry behavior preserved | Relevant unit/helper and HTTP/browser workflow regression checks |
| AC-006 | Accurate docs/setup/progress, four-cycle state, reviewed commit | Repository limits/links, diff/content review and successful commit |

Live Geoapify tile/geocoding configuration is operator-owned and may remain unverified; unavailable checks are never passing. UI work is not academic/domain release acceptance.
