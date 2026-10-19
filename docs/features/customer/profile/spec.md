# Customer Profile and Saved Connection

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Let a signed-in customer view their profile and supplier-provisioned service connection/address.
- Provide reliable saved-address context for reporting, targeted notices, and assistance.
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

### Implemented behavior and modules

`aqours-app/src/app/(customer)/profile.tsx` displays current safe identity and owned saved connections with location/zone review information and sign-out.

`aqours-api/src/routes/auth.ts` implements `/me` and `/me/connections`; `src/services/projection.ts` and `src/store.ts` restrict returned fields. The profile is read-only. Admin connection maintenance cannot silently rewrite report/inspection address snapshots. Missing connection context offers supplier follow-up rather than customer reassignment.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review identity/ownership API tests. Actual Android profile recovery, missing connection display and account switching remain device checks.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
