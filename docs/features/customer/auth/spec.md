# Customer Authentication

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Give each seeded customer access to their own reports, assistance requests, notifications, profile, and saved service connection.
- Users are fictional demo customers; staff/admin accounts belong to the supplier workspace.
- Scope is login, session restoration, logout/revocation, and protected customer navigation.
- Public registration is optional; this feature does not assume an account-approval queue, password reset, or social login.

---

## MUST

### Identity and permissions

- Satisfy REQ-ACCESS-01 through REQ-ACCESS-05 in [requirements](../../../requirements.md).
- Use individual seeded accounts linked to sample service connections; obtain demonstration credentials from the documented demo account list.
- Authenticate through the API; never embed a shared demo password or production secret in the Android bundle.
- Derive customer identity from the authenticated session, never a customer ID supplied by the client.
- Authorize every owned-record request on the server, including attachments and notification links.
- Do not grant supplier capabilities because a route or role value is changed locally.
- Hash passwords server-side and support revocable sessions; the implemented session scheme is described below.
- Store mobile credentials in secure device storage using an approved implementation choice.
- Never log passwords, session credentials, or private response bodies.

### Customer behavior and failure states

- Accept the seeded login identifier and password; show required-field errors before submission and validate again on the server.
- Distinguish invalid credentials, unavailable network/server, and expired/revoked sessions without exposing another account's details.
- Restore a valid session through the API before showing private content; an unverified stored credential is not sufficient.
- On authentication expiry, clear inaccessible customer data from view and offer sign-in again.
- On logout, request server revocation and remove local credentials and account-specific cached views.
- If revocation cannot be confirmed because the network fails, hide private content and show that server sign-out needs retry; do not claim confirmed revocation.
- Repeated logout/revocation attempts must be safe; a revoked credential must fail subsequent protected requests.
- Changing accounts must not reuse the previous customer's reports, notifications, request data, or service-address state.

### Acceptance

- [ ] AUTH-C-01: Two seeded logins restore distinct identities and owned service connections; no shared customer history appears.
- [ ] AUTH-C-02: Invalid credentials and a network outage produce recoverable states and never open authenticated screens.
- [ ] AUTH-C-03: Customer A cannot read or mutate customer B's record by changing an identifier, including through a deep link.
- [ ] AUTH-C-04: Logout revokes the session; replaying its credential is denied, and the next account sees no previous account data.
- [ ] AUTH-C-05: Expired credentials and interrupted logout show accurate state and a working sign-in/retry action.

---

## HOW

### Implemented behavior and modules

`aqours-app/src/features/auth/hooks/session.tsx`, `src/app/login.tsx` and protected `src/app/(customer)/_layout.tsx` implement sign-in, server-verified restoration and sign-out. `src/services/http-client.ts` handles bearer requests/errors.

`aqours-api/src/middleware/authentication.ts` and `src/routes/auth.ts` implement salted scrypt passwords, hashed revocable sessions, active-account checks and safe identity responses. Android stores only session material in Expo SecureStore. Interrupted logout hides private content and retains a pending-revocation retry; account switching clears operation intentions.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Actual installed N1–5/N14/N20/N22–26 cover accounts, server-verified SecureStore cold starts, generic invalid credentials, foreign denial, revocation/expiry and guest-offline sign-out with persisted pending revocation across restart and real-network retry. See the [native ledger](../../../native-verification.md); API replay/role checks remain separate evidence.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
