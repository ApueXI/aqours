# Customer Reporting and Follow-up

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Let Android customers create, track, clarify, and follow up their own water-supply reports.
- Include report entry, owned list/detail, messages, optional photos, published incident context, “mark affected,” and “still affected.”
- Keep one customer's report separate from the supplier-managed incident to which staff may link it.
- Use the saved service address, a confirmed typed address, or optional foreground GPS; provide a native MapLibre location preview.
- Current evidence: [starter routes](../../../../aqours-app/src/app/) and the [manifest](../../../../aqours-app/package.json) contain no reporting, GPS, upload, geocoding, or native MapLibre implementation.
- Exclude automatic incident creation, household-fault diagnosis, other customers' locations, continuous background tracking, and supplier-only editing.

---

## MUST

### Creation and location

- Satisfy REQ-REPORT-01 through REQ-REPORT-08 and REQ-UI-C02 through REQ-UI-C03 in [requirements](../../../requirements.md).
- Capture category `outage`, `low_pressure`, `leak`, or `water_quality`; description; time noticed; owned connection/issue location; and optional photos.
- Validate required fields and timestamps server-side; distinguish customer-observed time from server submission time.
- Keep the saved service address separate from this report's issue-location snapshot.
- Saved-address reporting must work when GPS permission is denied or device location is unavailable.
- Request only optional foreground GPS and preserve its source/accuracy when available; GPS coordinates do not require forward geocoding.
- For typed addresses, obtain Geoapify candidates through the API and require explicit selection/confirmation.
- Show the selected location on native MapLibre when possible, with address, source, and confirmation/review state.
- Never convert no results, low confidence, ambiguous candidates, quotas, or provider/network failures into invented coordinates or `(0, 0)`.
- Accept a report with an unresolved address/location for review; flag missing coordinates and unconfirmed service zones.
- Do not silently assign the saved connection's zone to an alternate issue location.
- Store WGS84 latitude/longitude with paired-null/range checks and send GeoJSON as `[longitude, latitude]` to both map clients.
- A map/style/tile failure must leave the report form and address-based submission usable.

### Photos and reliable submission

- Validate file type/content and size on the server; the exact allowlist and maximum size must be confirmed before implementation.
- Store photo bytes in controlled storage and metadata through the owning report; a storage key or copied URL must not bypass authorization.
- Distinguish successfully uploaded photos from failed/incomplete uploads; offer explicit retry rather than showing a false attachment success.
- Preserve entered report details during a recoverable submission failure; persistent offline drafts/synchronization are not required.
- Scope report-operation idempotency to the authenticated actor and operation, replay the committed result, and reject incompatible key/payload reuse.
- A repeated tap, timeout, or retry must not create a second report or duplicate successfully attached photos/messages.
- After success show a tracking reference, server submission time, and initial `received` status immediately.

### Owned history and incident context

- Enforce API ownership on report list/detail, messages, attachments, retries, and follow-up actions; do not trust a submitted customer ID.
- Show owned reports with category, reference, current status, and latest relevant update; paginate list results.
- Show detail messages, timeline, published incident link/updates, and a working follow-up action.
- Support statuses `received`, `under_review`, `in_progress`, and `resolved` without allowing customers to perform supplier transitions.
- Show a reviewed duplicate/invalid closure and reason distinctly from service restoration; the separate closure-outcome representation is proposed.
- Expose only deliberately published incident fields and areas, never internal notes or another customer's report/contact/household coordinates.
- Permit customer clarification messages; safely render text and keep staff-only notes outside the customer message channel.
- Display server UTC events in `Asia/Manila` initially and keep the noticed/submitted/published timestamps distinguishable.

### Affected and still-affected actions

- Satisfy REQ-INCIDENT-02, REQ-INCIDENT-05, REQ-INCIDENT-08, and REQ-INCIDENT-09.
- “Mark affected” on a published incident reuses or creates a deduplicated owned personal report for the customer/connection/incident assertion.
- Repeating that action must not delete history, merge customers, or prevent a separate legitimate issue report.
- Staff controls incident links/corrections; the customer does not get unrestricted incident reassignment.
- “Still affected” records follow-up and returns the individual's report for review while retaining prior resolution events.
- That feedback must not reopen the entire incident, change other reports, or lift an advisory.
- Report/incident resolution and assistance completion remain separate; a quality restriction persists until authorized explicit lifting.

### Acceptance

- [ ] REPORT-C-01: Two seeded customers submit and immediately receive distinct references/times/statuses; each sees only their own history.
- [ ] REPORT-C-02: Foreign report, message, attachment, and follow-up IDs are denied server-side without leaking their content.
- [ ] REPORT-C-03: Denied/unavailable GPS still permits saved-address reporting; confirmed geocoding renders the same `[longitude, latitude]` position on web/native maps.
- [ ] REPORT-C-04: Ambiguous/no-result/geocoding outages and missing zones retain a reviewable report without invented coordinates.
- [ ] REPORT-C-05: A basemap failure leaves fields usable; failed uploads are explicit and a retry cannot duplicate a report or successful photo.
- [ ] REPORT-C-06: A linked report displays published incident history while omitting internal notes and other customers' records.
- [ ] REPORT-C-07: Repeated “mark affected” returns the same personal assertion/report and does not block a separate issue.
- [ ] REPORT-C-08: “Still affected” returns only that report for review; incident state, other reports, and active quality guidance remain unchanged.
- [ ] REPORT-C-09: Duplicate/invalid closures are labeled as reviewed outcomes, not demonstrated service restoration.

---

## HOW

### Proposed components and interfaces

- Keep route screens under `aqours-app/src/app/` and report forms, location adapters, upload state, API hooks, and timeline components outside that route directory.
- Add Express report, message, attachment, geocoding, and follow-up services in `aqours-api/`; no corresponding routes exist today.
- Illustrative API groups: `/api/v1/reports`, report messages/attachments, `/api/v1/locations/geocode`, and owned affected/follow-up actions.
- Finalize request/response DTOs, verbs, pagination, error codes, upload protocol, and idempotency headers before implementation.
- A create DTO carries the owned connection, category/details/time, issue-address snapshot, optional confirmed coordinate pair, source/review state, and upload references.
- The API derives ownership, validates connection ownership and candidate/location data, and creates the report/history/idempotent result together.
- Return an explicit location-review state and error categories for validation, authorization, conflict, file rejection, and geocoder unavailability.
- Customer serializers return owned location details and published incident context; supplier DTOs remain separate.

### Data flow and persistence

1. Load [profile](../profile/spec.md) connection context after [authentication](../auth/spec.md).
2. Collect report inputs and optional address candidates/GPS; confirm the selected candidate or retain an unresolved location for review.
3. Submit through the validated, idempotent API; attach only confirmed successful uploads through an authorized relationship.
4. Return reference/status/time, then load the owned detail/timeline and published incident data.
5. Link to [guidance](../guidance/spec.md) for a contextual recommendation and [assistance](../assistance/spec.md) for a deliberate service request.
6. Refetch current owned data after a [notification](../notifications/spec.md), clarification, or still-affected action.

- Use proposed `reports`, attachments, messages, connection/location snapshots, report status/link history, and participation assertions from [schema](../../../schema.md).
- Attachment failure handling must define cleanup/retry behavior before storage implementation; incomplete files cannot masquerade as published photos.
- Record customer/staff actor/time for follow-up and messages; staff linking/priority/status changes retain their own audit history.
- Do not use mutable `updated_at` as a substitute for the metric start/end events in requirements.

### Research constraints

- [Geoapify's forward-geocoding API](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) supplies candidates, coordinates, confidence, and bias/filter controls; customer confirmation and zone review are Aqours requirements.
- [Native MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/) requires a rebuilt native/development app; Expo Go cannot host this map integration.
- Treat geocoding, foreground GPS, map rendering, and tile/style provision as separate responsibilities; private geocoding keys stay server-side.

### Sequencing, future verification, and open choices

- Establish seeded identity/connections, revocable auth, migrations/storage, public contracts, and an Android MapLibre development build before full feature integration.
- Test API validation/ownership, duplicate operations, upload rejection/retry, candidate failures, null/range checks, and coordinate ordering.
- Test Android saved/GPS/typed-address paths, denied permission, unavailable map/provider, interrupted submit/upload, messages, affected assertions, and follow-up.
- Integrate with the supplier inbox/map to verify unlocated reports remain visible and linked publications reach the correct personal timeline.
- Resolve upload limits/storage protocol, candidate-confirmation contract, message retry identifiers, native compatible versions, and exact endpoints during implementation.
- This task adds no dependencies or application code; use [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md) as shared boundaries.
