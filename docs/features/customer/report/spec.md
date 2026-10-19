# Customer Reporting and Follow-up

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Let Android customers create, track, clarify, and follow up their own water-supply reports.
- Include report entry, owned list/detail, messages, optional photos, published incident context, “mark affected,” and “still affected.”
- Keep one customer's report separate from the supplier-managed incident to which staff may link it.
- Use the saved service address, a confirmed typed address, or optional foreground GPS; provide a native MapLibre location preview.
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

- Validate file type/content and size on the server; the exact allowlist and maximum size is documented below.
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
- Show a reviewed duplicate/invalid closure and reason distinctly from service restoration; the separate closure-outcome representation is implemented.
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

### Implemented behavior and modules

`aqours-app/src/features/reports/` implements forms, photos, list/detail and follow-up; `src/features/location/` separates address/GPS selection and native MapLibre preview.

Photo multipart bodies use `src/lib/photo-upload.ts` and Expo FileSystem `File` bytes; Expo57's global fetch does not accept the earlier plain React Native URI descriptor. The friendly picker name remains visible locally, while the uploaded metadata uses the cache file's basename. Same-account/path resource refresh retains the authorized subtree and labels cached information; this preserves picker selection and upload retry state when the app returns to the foreground. Changing account/path hides prior data immediately, and authorization/not-found responses clear it. Native regression verification is recorded separately from helper tests.

`aqours-api/src/routes/reports.ts`, `report-review.ts`, `attachments.ts` and `services/reports.ts` implement owned creation/messages, protected uploads, review and still-affected history. `services/geocode.ts` returns expiring signed candidates. Reports retain location snapshots and unknown-zone review. Report creation precedes optional photo upload; a failed photo retains the report reference and a separate retry. Allowed still JPEG/PNG/WebP images are decoded/reencoded, limited to 5 MiB and 25 million input pixels.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

GPS snapshots retain measured accuracy in meters; alternate confirmation leaves supply-zone review independent. Legacy/unknown accuracy stays null. RN Android protected-image headers use the array-source branch; Expo57 uploads use File bytes and retain their frozen multipart retry intention.

Actual Android N6–7/N14/N16/N18–19/N31/N33 and NM1–17 cover receipt/history/messages, foreign denial, independent follow-up/deduplication, reviewed closure, denied-GPS/provider503 fallback, controlled GPS accuracy/confirmation and supplier-point equality, real native map404 fallback, picker/retained foreground state/protected decoding and committed-response report/photo retry uniqueness. Live signed Geoapify equality remains required in the [native ledger](../../../native-verification.md).

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
