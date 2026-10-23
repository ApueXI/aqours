# Reference-led UI/UX goal

## Original request and sources

User approved a reference-led redesign and requested implementation through explicitly invoked Loop Engineer with **MAX 5 loops**. This is refinement of existing Aqours capabilities across every supplier web section and customer Android section, keeping Aqours teal, the current fonts, dependencies, stacks, API/DTOs and schema. This original contract must not be rewritten to excuse missing work.

Original approved brief retained by lead on 2026-10-22; baseline clean `feature/psgc-weather-map` at `991b635`. The preceding PSGC Weather goal is archived at [prior goal](archive/pre-reference-led-ui-ux-2026-10-22/GOAL.md), [state](archive/pre-reference-led-ui-ux-2026-10-22/STATE.md) and [log](archive/pre-reference-led-ui-ux-2026-10-22/LOG.md).

References already researched by lead (patterns to adapt, not new capabilities):

- [Meta Messenger](https://www.meta.com/messenger/): report communication layout/composer.
- [Linear Inbox](https://linear.app/docs/inbox) and [custom views](https://linear.app/docs/custom-views): operational queues, saved navigation/filter context.
- [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/), [confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/) and [password input](https://design-system.service.gov.uk/components/password-input/): reviewed submissions, receipts and labeled authentication.
- [SeeClickFix requests list](https://www.civicplus.help/seeclickfix/docs/requests-list-overview): reports/operational review.
- [Google Maps](https://support.google.com/maps/answer/4610185/): synchronized map/list/detail.
- [Statuspage incidents](https://support.atlassian.com/statuspage/docs/what-is-an-incident/): independent operational/edit/publication/history views.
- [ArcGIS dashboard actions](https://doc.arcgis.com/en/dashboards/latest/create-and-share/actions.htm): linked selection and filters.
- [Shopify transfers](https://help.shopify.com/en/manual/inventory-and-locations/inventory-transfers/viewing-transfers): distribution task organization.
- [Apple Weather](https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26): location/current/seven-day hierarchy.
- [Carbon forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms): task sections, labels and validation.

## Approved scope and deliverables

White-neutral surfaces, 6–8px radii, consistent spacing and readable hierarchy; preserve meaningful marker/status colors. Use taste-skill APP SCREEN workflow and uncodixfy. Supplier desktop gets labeled sidebar, folded below 1100px and readable mobile rows below 640px, with URL-backed filter/return state. Customer retains Home/Reports/Assistance/Updates/Profile tabs, 48px touch targets and text scaling.

Customer Home orders safety restrictions first, then report action/open requests, concise incidents/full detail, connections/weather afterward. Report details on both clients provide Summary/Messages/History; desktop staff operational review sits beside detail, with private notes separately identified. Customer report-scoped Messages route preserves existing URLs. Conversations show incoming/outgoing, date/author/time and composer; retain mounted draft over view changes/errors, do not invent presence/read receipts, retain the same operation on uncertain retry, and scroll only when near bottom or on own-send.

Reporting keeps four stages with review/change, photos and explicit receipt. Callback, inspection and pickup assistance retain review/tracking. Incidents/advisories separate publication previews from editing/history and retain lifecycle independence. Guidance shows source/reason/action; notifications show read/unread/date groups. Map list-marker-detail synchronization/fallback remains intact. Weather keeps location/current/seven days and supplier PSGC synchronization. Distribution keeps tabs/stock/warnings/selected-site detail. Profile/login/admin use labeled validation and task sections.

Deliver final connected UI, reference-to-change matrix, before/after rendered evidence, meaningful regression evidence, current-source installable APK plus actual native checks, reconciled project docs and scoped feature commit. Artifacts are project-local under `.local/reference-ui/`.

## Constraints and delivery

Root/mobile AGENTS apply, including no private `.env` or secret reads, no extra dependencies, no external writes/configuration, no ordinary data mutation and modular TypeScript limits (API 200/web 250/app 300 physical lines). Preserve existing authorization, backend behavior and marker/status semantics. Existing Geoapify/provider/academic/other-device verification limits remain limits unless explicitly reverified.

Exactly four dedicated worker identities under a read-only lead: Implementer `/root/implementer` owns production and all Git mutations; scribe `/root/scribe` owns documentation and `.loop/`; Tester `/root/tester` owns tests, checks, services/devices/build/technical harness; UI reviewer `/root/ui_reviewer` owns read-only actual rendered review. No descendants, additional or replacement agents without user permission. Platform supports four active slots including lead: schedule supported waves without combining roles.

A cycle is bounded implementation followed by technical and actual UI review. Fixes consume the next cycle; bootstrap/readiness waves do not. Maximum 5; initial count 0/5. Final production freeze precedes final verification. Required unrun checks prevent COMPLETE. Implementer creates `feature/reference-led-ui-ux` before production edits and commits after final acceptance checks.

## Acceptance criteria

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Shared reference-led presentation and navigation covers every supplier web and customer Android section; preserve a reference-to-change matrix and before/after renders. | Inspect matrix, source and actual before/after desktop/tablet/phone and Android renders. |
| AC-002 | Customer Home, report list, four-stage reporting, photos and explicit receipt are usable and retain existing workflows. | Actual Android interaction, photo return/draft handling, review/change and submitted readback checks. |
| AC-003 | Both report details expose Summary/Messages/History with Messenger-style report-scoped communication, retained drafts, same-operation uncertain retry and correct scroll behavior. | Meaningful helper/browser/native checks for scoped routes, authors/date/time, draft/errors/retry/scroll and private-note separation. |
| AC-004 | Assistance, guidance, incidents, advisories, updates, profile and authentication improve while their existing workflows and independent lifecycles remain intact. | Actual customer and supplier task walkthroughs, preview/edit/history separation and existing behavior regressions. |
| AC-005 | Supplier Overview, inbox, detail, publication and administration support dense readable responsive tasks. | Actual rendered desktop/tablet/phone tasks, sidebar breakpoints, URL-backed return/filter state and keyboard checks. |
| AC-006 | Report, Weather and Distribution map/list/selection, forecasts, stock and warning operations are preserved and improved. | Real rendered map/list/selection checks, supplier PSGC synchronization and weather/distribution regressions/fallback checks. |
| AC-007 | Keyboard/accessibility, text scale, loading/empty/error/stale/long-content states and all three viewport bands receive actual rendered verification. | Read-only UI review with screenshots and interaction evidence across all required bands and Android text scaling. |
| AC-008 | Existing types/lint/build/helper/relevant HTTP/browser regressions and meaningful changed-behavior checks pass. | Tester executes relevant repository commands and retained/new behavioral harnesses; record commands, revision and results. |
| AC-009 | Build a current-source installable APK and actually verify changed native flows; record artifact hashes and exact boundaries. | Tester builds/installs Android APK, records source/artifact/installed hashes and actual device workflow evidence. |
| AC-010 | Relevant project docs, source/reference matrix, progress and verification records accurately describe final behavior and limitations. | Source/document review plus Tester documentation paths/links/content checks; preserve historical evidence boundaries. |
| AC-011 | Successful scoped feature commit, clean tree and quiescent workers; no dependencies/API/schema/ordinary data/secrets/external environment changes; file limits respected. | Implementer commit/status report, Tester repository checks and owned-service shutdown evidence; lead scope/worker review. |

## Documentation and discrepancies

Read root PROGRESS first, root/mobile guidance, README/docs index, architecture, requirements, schema, workspace and Loop Engineer state/documentation/templates. Existing docs establish connected clients and backend, not acceptance for this new refinement. Reconcile `docs/ui-ux.md`, architecture/workspace, affected feature/role guides, client READMEs, verification/native ledger, traceability as relevant, and root PROGRESS from actual final changes. No API/schema change is authorized. Reference matrix and current evidence locations will be added to existing documentation organization.

Catalog taste-skill path is stale: lead supplied actual `/home/cred/.codex/plugins/cache/taste-skill/taste-skill/2.1.4/skills/taste-skill/SKILL.md`. Preserve original criteria and record conflicts/lead-approved resolutions rather than silently changing them.

## Authorized scope changes

None. Reference-led scope above is the approved original goal.

## Reference availability correction — 23 October 2026

The original Google Maps source URL above is preserved as historical request evidence, but Tester found it unavailable (404). The current reference matrix uses the verified official replacement, [Search locations on Google Maps](https://support.google.com/maps/answer/3092445?hl=en). This repairs reference availability without changing the approved behavior, scope or acceptance criteria.
