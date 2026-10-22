# UI/UX design and navigation

The 21 October 2026 overhaul uses one teal utility-service palette across the customer app and supplier workspace. It changes presentation and navigation; backend ownership, report/incident/advisory independence, guidance freshness, version checks and transactional stock rules remain enforced by the existing API.

## Design references

- [SeeClickFix](https://www.civicplus.com/seeclickfix-311-crm/): request tracking and customer communication.
- [Thames Water](https://www.thameswater.co.uk/help/report-a-problem): location-focused problem reporting.
- [FixMyStreet Pro](https://fixmystreet.org/pro-manual/): filters, coordinated maps/lists and report details.
- [Manila Water](https://www.manilawater.com/): local service terminology and affected-location advisories.

These references inform interaction patterns; they are not integrations or copied branding. The installed uncodixfy skill guides restrained components, readable hierarchy and consistent spacing.

## Shared presentation

Teal primary actions, white surfaces and neutral backgrounds use text labels as well as status colors. Notice severity and demonstration labels remain explicit. Screens distinguish loading, empty, failed, stale and uncertain-save states. Keyboard focus, readable contrast, larger touch controls and reduced-motion preferences support access. Times use Asia/Manila; restoration estimates remain estimates.

## Customer navigation and reporting

Five bottom destinations are Home, Reports, Assistance, Updates and Profile. Detail and creation screens use stacks with back navigation while existing public paths remain available. Protected navigation is tied to the authenticated customer identity.

Home places service advisories, reporting and open requests ahead of weather. Reporting uses four stages: Problem, Location, Photos and Review. Moving between stages preserves the active in-memory draft; location/photo components retain foreground picker/GPS context. Submission remains deliberate and reports require a saved connection. Selected photos upload separately after the server confirms the report reference.

An uncertain submission locks its original operation and details for retry. Draft state is not a durable offline queue and does not survive process termination. After a restart, inspect owned report/request history before intentionally submitting again. Location selection never changes the supplier-maintained service address. Native builds retain MapLibre; Expo Go retains the coordinates-only preview.

## Supplier navigation and reporting

Operational navigation groups report review, service updates and assistance/distribution work, with role-appropriate settings. Inbox filters are URL-backed. Report detail separates customer messages from internal notes, operational review and history.

Weather has its own `/#/weather` destination in Service operations for staff/admin, available in desktop and mobile navigation. Overview focuses on service metrics and queues. The Weather page retains Philippine city search, current conditions, seven-day forecasts and independent refresh/retry; selection clears when leaving the page or changing accounts.

The map workspace coordinates a report list, selected report and Leaflet view. Wide layouts place the list beside the map; narrow layouts offer explicit List/Map views. Unlocated reports remain accessible. Changing map zoom or selection never changes report priority, association or saved location. Cluster counts cannot establish shared incidents, water-supply topology or safety.

Report marker colors identify categories: red for No water, blue for Leak, amber for Low pressure and purple for Water quality. A labeled swatch legend and marker/popup category text explain the colors. Priority stays visible as text; gray clusters show counts until expanded. Area-layer colors remain independent of report categories.

[Locations and maps](location-and-maps.md) documents Geoapify tiles, public browser-key configuration, required attribution and web map migration. No database migration is required for this overhaul.

## Delivery and evidence

The user limited loop-engineer to four total implementation/verification/correction cycles. Root `.loop/` records the active cycle, assignments, acceptance criteria and evidence. [Verification](verification.md) records current executed checks and remaining native/provider limitations; earlier native/browser evidence applies only to its original artifact.

Local acceptance passes 78 unit/helper, 59 HTTP/PostgreSQL and 90 production browser checks. Actual Android 29 evidence includes report/picker/back/review, all three assistance confirmations, native map and final fitted tab labels at 1.3 text scale. Artifact-specific boundaries and live-provider/physical-device limits remain in the verification ledgers.
