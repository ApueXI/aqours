# Customer Profile and Saved Connection

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Let a signed-in customer view their profile and supplier-provisioned service connection/address.
- Provide reliable saved-address context for reporting, targeted notices, and assistance.
- Current evidence: the [mobile starter](../../../../aqours-app/src/app/) has no profile, customer account, or service-connection data.
- Scope is viewing owned information; self-service connection reassignment, supplier-address edits, and account approval are not confirmed requirements.

---

## MUST

### Owned profile and address

- Satisfy REQ-ACCESS-01 through REQ-ACCESS-04, REQ-UI-C06, and REQ-REPORT-01 in [requirements](../../../requirements.md).
- Show the authenticated customer's relevant profile details, fictional service reference, and saved service address.
- Load only connections owned by that customer; a connection identifier is not proof of permission.
- Make missing or unconfirmed location/zone information visible without inventing coordinates or a service zone.
- Keep the saved address distinct from an individual report's alternate issue location and an inspection's site snapshot.
- Viewing or choosing a saved connection must not modify a historical report, reassign ownership, or rewrite its coordinates.
- Do not allow self-reassignment or direct saved supplier-address changes without separately verified requirements and backend authorization.
- Never expose passwords/hashes, session credentials, staff notes, or other customers' profile/contact/location information.
- Provide access to the [logout](../auth/spec.md) action and show accurate loading, empty/missing-connection, and retry states.
- Clear profile/connection state when the account changes or its session becomes invalid.

### Acceptance

- [ ] PROFILE-C-01: A seeded customer sees their own fictional profile, service reference, and saved address only.
- [ ] PROFILE-C-02: A foreign connection/profile ID is denied server-side, even through a deep link or modified request.
- [ ] PROFILE-C-03: Choosing an alternate issue address in a report leaves the saved profile address and previous reports unchanged.
- [ ] PROFILE-C-04: Missing/unconfirmed coordinates or zone produce an explicit state and preserve address-based reporting.
- [ ] PROFILE-C-05: Network failure, revoked session, and account switching cannot show stale information as another customer's profile.

---

## HOW

### Proposed implementation

- Add a focused Expo Router profile view; keep owned-data hooks and response mapping outside `src/app/`.
- Illustrative read contracts, not existing endpoints: `GET /api/v1/me` and `GET /api/v1/me/connections`.
- Derive the current user from [authentication](../auth/spec.md); apply ownership predicates before reading connection records.
- Use the [schema](../../../schema.md) proposals for `users` and `service_connections`; serialize a restricted customer profile DTO rather than a raw database row.
- Supply saved-location context to [reporting](../report/spec.md) and [dashboard](../dashboard/spec.md) without copying supplier-only fields into client state.
- The API retains report/inspection address snapshots independently; profile refresh must not update those snapshots.

### Dependencies, future checks, and open choices

- Sequence after seeded identity/connection data and authentication; it can precede report creation and notice targeting.
- Add API tests for current-user projection and foreign-connection access, plus Android checks for missing data, refresh errors, and account switching.
- Validate that customer responses omit credentials, internal fields, and another household's coordinates/contact data.
- Confirm profile field display and any future correction-request workflow before adding mutations; this spec does not invent editable fields.
- Resolve multiple-connection selection behavior if needed; do not assume one connection can be assigned by the customer.
- Sources and workflow boundaries: [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md).
