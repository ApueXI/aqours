# Nationwide supplier PSGC Weather map

## Original request and approved scope

Original user instruction: **“$loop-engineer and implement the plan. but only a maximum of 5 repetition/loop”**. The approved plan is summarized below, including its limitations. The supplier Weather delivery has **a maximum of five implementation/review cycles**. The lead-approved brief supplies the durable contract below. Preserve existing customer weather contracts, staff/admin access, forecast recovery, and the existing Leaflet stack.

Replace supplier free-text Open-Meteo city search with a nationwide interactive Leaflet map of representative city/municipality locality markers and searchable synchronized Region → Province → City/Municipality PSGC dropdowns. Start the map in Laguna and show no forecast until a locality is selected. Region/province choices filter and fit the map; parent changes clear descendants and old forecasts. Skip province where no province exists; stop at city/municipality before barangays or Manila districts. Clear selection on leaving Weather or changing account. Desktop map/forecast sit side by side; mobile stacks them. Keep keyboard access and usable dropdown/forecast recovery after tile failure.

Use the existing authoritative local **PSGC Q2 2026** catalog for canonical ten-digit codes, names and ancestry. Approved coordinate source: [ph-geo](https://github.com/kon2raya24/ph-geo), pinned to a revision, with CC BY 4.0/GeoNames credit. Older six-digit codes must not be blindly expanded. Review mappings; unmatched or ambiguous localities receive null coordinates, no marker/forecast, and an explicit unavailable state. Describe representative coordinates accurately, without implying boundaries or exact addresses.

Add staff/admin `GET /weather/psgc-locations` and an exclusive `GET /weather?psgcCode=<10-digit-code>` mode. The backend resolves canonical coordinates; customers cannot use this mode. Missing coordinates return 422 without a provider call. Preserve prior customer request modes.

## Constraints and deliverables

- No dependencies, migrations, ordinary database changes, customer mobile changes, or Distribution changes.
- Keep all artifacts/caches/configuration project-local. Do not inspect or change secret values, private `.env`, external filesystem or system settings.
- Follow root `AGENTS.md`, relevant directory guidance and TypeScript modularity limits (API 200/web 250 lines per handwritten file).
- Deliver on `feature/psgc-weather-map` with a successful scoped feature commit after verification.
- Exactly four dedicated roles under lead coordination; no role switching, descendants, additional or replacement agents without user authorization. Actual capacity is four active slots including lead; schedule supported waves and reuse identities.
- Relevant sources: [progress](../PROGRESS.md), [architecture](../docs/architecture.md), [requirements](../docs/requirements.md), [schema](../docs/schema.md), [workspace](../docs/workspace.md), [weather](../docs/weather.md), [API](../docs/api.md), [locations](../docs/location-and-maps.md), and [Loop Engineer](../.agents/skills/loop-engineer/SKILL.md).

## Acceptance criteria

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Nationwide canonical city/municipality catalog has ten-digit codes/ancestry, coordinate provenance, reviewed mapping, coverage and explicit null gaps. | Dataset/source reconciliation, mapping assertions, coverage report and provenance review. |
| AC-002 | Staff/admin catalog and exclusive PSGC weather mode validate authorization/input; missing coordinates return 422 without provider calls; customers are forbidden; old customer modes remain. | Unit and actual HTTP authorization/mode/provider-call checks. |
| AC-003 | Weather map starts in Laguna, displays nationwide markers/clusters, filters/fits hierarchy and selects a locality forecast. | Actual rendered Leaflet/browser interactions and catalog reconciliation. |
| AC-004 | Searchable Region/Province/City-Municipality dropdowns handle no-province cases, synchronize selection/map and clear children/forecasts on parent changes. | Unit plus keyboard/browser hierarchy and selection checks. |
| AC-005 | Actual current and seven-day weather retains refresh/stale/loading/error/retry/late-response protection, clearing on account change/unmount. | Unit, HTTP and browser recovery/race/lifecycle checks with provider evidence. |
| AC-006 | Responsive keyboard-accessible rendered workflow survives tile failure with dropdowns/forecast usable and never selects arbitrary coordinates. | Actual desktop/mobile rendered UI review, keyboard and tile-failure checks. |
| AC-007 | No dependencies, migrations, secrets, external filesystem or ordinary database changes; modular limits and requested scope preserved. | Scoped diff, lockfile/schema/environment review and repository checks. |
| AC-008 | Relevant automated API/web/unit/HTTP/browser/build/type/lint/repository checks pass with recorded evidence; failures fixed within five cycles. | Tester command outcomes and evidence artifacts; unavailable checks stay NOT_RUN. |
| AC-009 | Documentation/setup/API/architecture/location/weather/requirements/schema/verification/progress match final behavior and limitations. | Documentation/source reconciliation, examples/paths/links and final diff review. |
| AC-010 | All relevant changes committed successfully on feature/psgc-weather-map, workers quiescent and final evidence reviewed. | Commit/branch confirmation, worker status and lead acceptance review. |

## History and discrepancies

The unrelated completed four-role skill goal was archived before initialization; see [state](STATE.md). The supplied brief is approved intent, not evidence of implementation. No scope changes authorized.
