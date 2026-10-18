# Customer Authentication

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Give each seeded customer access to their own reports, assistance requests, notifications, profile, and saved service connection.
- Users are fictional demo customers; staff/admin accounts belong to the supplier workspace.
- Scope is login, session restoration, logout/revocation, and protected customer navigation.
- Public registration is optional; this feature does not assume an account-approval queue, password reset, or social login.
- Current evidence: the [Expo manifest](../../../../aqours-app/package.json) and [starter layout](../../../../aqours-app/src/app/_layout.tsx) contain no authentication flow or secure credential integration.

---

## MUST

### Identity and permissions

- Satisfy REQ-ACCESS-01 through REQ-ACCESS-05 in [requirements](../../../requirements.md).
- Use individual seeded accounts linked to sample service connections; obtain demonstration credentials from the future documented account list.
- Authenticate through the API; never embed a shared demo password or production secret in the Android bundle.
- Derive customer identity from the authenticated session, never a customer ID supplied by the client.
- Authorize every owned-record request on the server, including attachments and notification links.
- Do not grant supplier capabilities because a route or role value is changed locally.
- Hash passwords server-side and support revocable sessions; the concrete session scheme remains open.
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

### Components and interfaces

- **Proposed approach:** add customer sign-in/session handling to the existing Expo Router routes under `aqours-app/src/app/`; keep session hooks, request code, and storage adapters outside the route directory.
- Add authentication and current-user services in `aqours-api/`, with password verification, session persistence/revocation, validation, and rate limits.
- Illustrative endpoints, not existing contracts: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/me`.
- A customer-safe identity response should contain only required identity/profile fields, role, and owned connection references; never return password hashes or internal account notes.
- Authentication failures must have a consistent error shape; record-level denial must not reveal the target record's content.
- Use [schema](../../../schema.md) proposals for users and revocable authentication records; choose migration, hashing, and secure-storage tooling only during implementation.
- Server access checks follow the deny-by-default and per-request model described by the [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

### Data flow and sequencing

1. Implement seeded users/connections and server identity/authorization contracts before protected customer features.
2. Validate login on the API, establish a revocable session, and return the authenticated customer identity.
3. Persist only the approved credential material securely; fetch the current identity and owned connection context.
4. Load [dashboard](../dashboard/spec.md), [profile](../profile/spec.md), and [notifications](../notifications/spec.md) within that verified context.
5. On logout or session failure, remove private in-memory/cache state and apply the revocation/retry behavior above.

### Future verification and open decisions

- Add API tests for password verification, expiry/revocation, role denial, ownership checks, rate limits, and repeated logout.
- Add Android integration checks for cold-start restoration, failed login, account switching, expired credentials, and network loss during logout.
- Audit request/error logging for credential disclosure; use fictional test accounts.
- Resolve session lifetime, credential format, offline logout retry behavior, password policy, and secure-storage dependency before implementation; no package is installed by this specification.
- Public registration and password recovery need separate confirmed requirements before inclusion.
- Broader sources: [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md).
