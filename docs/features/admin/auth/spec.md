# Supplier authentication

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: `aqours-web/` and `aqours-api/` are empty; no login screen, session, or authorization exists.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-ACCESS-02–05, REQ-OPS-01 and REQ-OPS-08.

---

## WHAT

- Let supplier staff and admins sign in, resume an authorized session, and sign out of the React supplier application.
- Make the API the authority for identity, role, session expiry/revocation, and every protected operation.
- This supplier feature directory is shared by operational staff/admin; it does not grant admin permissions to staff.
- The detailed staff/admin split remains proposed in the requirements; privileged controls must follow the confirmed API policy.
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
- Proposed default: HttpOnly secure cookies with suitable SameSite and CSRF defenses, as described in architecture.
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

### Proposed components and interfaces

- Proposed React responsibilities: login form, current-session request hook, protected navigation, and a reusable session-expired state in `aqours-web/`.
- Proposed Express responsibilities: credential validation, password verification, session lifecycle, and reusable authentication/authorization middleware in `aqours-api/`.
- Proposed persistence: `users` and revocable authentication-session records from schema; no authentication tooling is installed.
- Proposed `POST /api/v1/auth/login`: validated credentials in; established session and safe current-user projection out.
- Proposed `GET /api/v1/me`: authenticated identity/profile; never a substitute for endpoint-specific permissions.
- Proposed `POST /api/v1/auth/logout`: revoke the current session and return a repeat-safe result.
- Use the eventual shared error contract to distinguish invalid input, unauthenticated/forbidden access, throttling, and unavailable service.
- Protect all other supplier feature groups with the same API identity and permission checks.

### Verification and operation

- Test valid/invalid credentials, customer rejection, role checks, expired/revoked sessions, and safe repeated logout at the API boundary.
- Test the selected cookie/CSRF mechanism and cross-origin policy rather than only the login form.
- Exercise browser reload, protected deep links, service failure, and browser history after logout.
- Log security-relevant success/failure/revocation events with actor/time/correlation identifiers; redact secrets and unnecessary personal data.
- Dependencies: [settings](../settings/spec.md) for provisioning; all supplier specs depend on this access boundary.
- Open choices: session/token design, expiry policy, concurrent-session behavior, and exact credential limits.
- Implementation is separately requested work; these are future checks, not tests run during documentation.
