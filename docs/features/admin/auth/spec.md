# Supplier authentication

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-ACCESS-02–05, REQ-OPS-01 and REQ-OPS-08.

---

## WHAT

- Let supplier staff and admins sign in, resume an authorized session, and sign out of the React supplier application.
- Make the API the authority for identity, role, session expiry/revocation, and every protected operation.
- This supplier feature directory is shared by operational staff/admin; it does not grant admin permissions to staff.
- The detailed staff/admin split is adopted in requirements; privileged controls follow the API policy.
- Account provisioning belongs to [settings](../settings/spec.md); public supplier registration and account-approval queues are outside scope.
- Password recovery, federated login, and additional roles are not required first-release capabilities.

---

## MUST

### Session behavior

- Accept the chosen login identifier and password over protected transport; validate input on the server.
- Verify a server-side password hash; never persist or return plaintext passwords.
- Return generic invalid-credential feedback without revealing whether a specific account exists.
- Rate-limit sensitive authentication operations and avoid logging submitted credentials or session material.
- Establish a revocable session and return only the authenticated account's safe identity/role projection.
- Fetch current identity before displaying protected supplier data after a fresh page load.
- Deny supplier access to customer accounts, even if a customer knows a supplier page URL.
- Enforce staff/admin capabilities on every API request, including direct requests that bypass navigation.
- Treat role/account state changes as server-side authorization changes rather than trusting cached browser identity.

### Browser and failure behavior

- Protect browser credentials and state-changing requests; the concrete session mechanism remains an implementation decision.
- Adopted default: HttpOnly secure cookies with suitable SameSite and CSRF defenses, as described in architecture.
- Keep private credentials out of browser storage, URLs, client bundles, rendered errors, and logs.
- Preserve a safe return destination after login; do not accept an arbitrary external redirect.
- Explain loading, invalid credentials, throttling, unavailable service, and expired/revoked session states.
- A network failure must not display a successful login or imply that server-side logout completed.
- On successful logout, revoke the relevant session and clear protected client state and cached identity.
- Repeating logout for an already ended session is safe; protected requests must remain denied.
- After expiry/revocation, stop displaying stale protected results and offer login again.
- Returning through browser history after logout must not restore usable protected data or authorization.

### Acceptance criteria

- [ ] SUP-AUTH-01: A seeded staff account signs in and receives operational access permitted by the API policy.
- [ ] SUP-AUTH-02: A customer account and an unauthenticated caller cannot fetch supplier data by changing routes or calling endpoints directly.
- [ ] SUP-AUTH-03: A staff session cannot invoke admin-only settings/advisory operations under the proposed split.
- [ ] SUP-AUTH-04: Logout and session revocation make subsequent protected requests fail; a repeat logout is safe.
- [ ] SUP-AUTH-05: Invalid credentials and throttling show actionable states without exposing passwords, token values, or account existence.
- [ ] SUP-AUTH-06: A reload restores only a valid session; an expired session and a failed logout never appear as confirmed authenticated/logout success.
- [ ] SUP-AUTH-07: Browser credential and state-changing-request protections are verified against the selected session design.

---

## HOW

### Implemented behavior and modules

`aqours-web/src/pages/Login.tsx`, `hooks/useSession.ts`, `api/client.ts` and `App.tsx` implement supplier login, cookie-session restoration, role-aware navigation and logout.

`aqours-api/src/auth.ts`, `routes/auth.ts` and `http.ts` enforce active accounts, revocable hashed sessions and backend role/ownership checks. Browser cookies are HttpOnly, SameSite=Lax and Secure in production; mutations require the configured Origin plus in-memory CSRF token. Customers cannot become supplier users by changing a route or local role. Deactivation/security changes revoke sessions.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review security API tests and the browser verification script for login, reload and logout. Production HTTPS/cookie deployment and administrative recovery policy require deployment validation.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
