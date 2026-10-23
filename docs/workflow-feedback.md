# Account, conversation and customer workflow corrections — 23 October 2026

## Supplier workspace

- Settings → **Accounts and connections** shows each account with its saved connections, address, service zone and review state. Admin can edit access, add another connection or edit a connection in the same directory. The old `?tab=connections` URL opens this combined directory.
- Creating a customer asks for its service address and zone in the same modal. Account search also matches owned connection numbers and addresses on the current account page. One `POST /staff/settings/accounts` transaction provisions the account, credential and optional nested `connection`; a connection failure rolls everything back. Supplier accounts cannot own connections. The API retains account-only provisioning for existing callers; the web customer form requires an address.
- Connection numbers identify individual properties; zones group supplied properties. The web forms generate the number automatically, so admins only choose the address and service zone. The API still accepts an optional explicit reference for existing callers and generates a unique `CON-…` number when omitted. Selecting a zone does not automatically verify supply membership. Unknown zones remain supported.
- Guided Philippine address entry uses one dropdown per administrative level, with no duplicate search fields. Street/building/landmark remains separate. Free-text entry remains available.
- Zone **Map outline (optional GeoJSON)** replaces the unclear “Display boundary” label. It draws an outline; it does not assign connections or establish supply connectivity. Blank is valid.
- **Messages** lists report conversations with the latest customer/supplier message, latest time and report status. Reports without messages are included so operators can initiate a reply. Opening a conversation selects the report Messages view and retains a return link.
- The header **Notifications** link counts unread customer-activity and monitoring alerts in the latest 100 entries of each feed, with `+` when older entries may exist. Failures show “unavailable.” The notifications page paginates customer events and retains the separate monitoring list.
- New customer reports, customer report messages and assistance requests notify every active staff/admin account of the single supplier. Notifications are committed with the triggering command and deduplicated by recipient/source identity. Read state belongs to each recipient. Old activity is not backfilled. Existing customer notifications remain separate.
- Water distribution provides a linked pickup workflow: establish a site, create a session and stock, accept requests to reserve liters, then record collection by reference. The monitoring explanation distinguishes forecasting/threshold alerts from reservation or fulfillment.

## Customer app

The five visible tabs are **Home, Reports, Messages, Weather, Profile**. Assistance and notifications retain their existing URLs and remain reachable through Home/header controls. The authenticated header provides Notifications access, visually labeled Updates. Notification counts summarize the latest 100 entries; opening an update retains existing authorized detail/read behavior.

Home keeps the report shortcut, applicable quality restrictions and links to service incidents/advisories, assistance and reports. It no longer repeats full report/request/connection lists or embeds weather. `/service` provides incident and advisory details; `/weather` retains the owned-connection and Philippine-city forecast modes. Profile contains saved connections and password changes.

A foreground polling guard prevents the 30-second refresh from replacing an in-flight answer submission before its receipt arrives. Report questions remain mounted while guidance is being evaluated or verified. **Submit answers** sends current boolean/unknown/time answers, shows confirmation after success, and blocks choosing an earlier recommendation after editing answers until resubmission. Invalid times and API failures retain explicit feedback. Guidance choices remain separate from assistance submission.

**Change password** in Profile verifies the current password, checks a repeated new password and uses `POST /me/password`. Every password field receives a slow scrypt retry fingerprint rather than a fast offline verifier. The API requires at least 12 characters, rejects unchanged passwords, locks the user row, audits the change without credentials and revokes other sessions. The current session stays valid so an uncertain request can retry with the same operation key. Forgotten-password recovery remains supplier assisted: login explains how to contact the supplier; admin can set a replacement password after verifying identity. Email/SMS recovery tokens, forced initial rotation, MFA and public registration are not implemented.

## Demo seeds

Fresh seeds only link reports to incidents when their reviewed service zones agree. Four seeded reports contain actual two-way conversations generated through the normal message service, including first-response timestamps and customer/supplier notifications. The sample inspection now describes its associated report category.

Normal repeat seed remains nondestructive. It warns that time-sensitive pickup sessions can expire and that rerunning the seed does not reset dates or passwords. Maintain existing sessions in Water distribution, or deliberately use a separately migrated fresh test database. These source changes do not rewrite existing ordinary demo data or apply the location upgrade.

## API additions

- `POST /me/password` — any authenticated actor, `{ currentPassword, newPassword }`, operation key required; returns `{ changed: true }`.
- `GET /messages` — customer-owned report conversations; `GET /staff/messages` — supplier operators. Both accept standard `offset`/`limit` pagination and order by latest message/submission time. Query ownership is enforced in the repository. DTOs expose report identity/category/status/description and the latest safe message only.
- `GET /staff/notifications`, `GET /staff/notifications/:id`, `PATCH /staff/notifications/:id/read` — supplier operators, recipient ownership enforced. Read uses an empty body and needs no operation key. It cannot read or change another operator’s alert.
- Account creation accepts optional `connection` containing address/optional structured address, optional reference/zone/coordinates and `zoneConfirmed`. Existing customer ID is derived from the created account. Standalone connection creation accepts an omitted reference.

No migrations, libraries or new roles are needed. Existing cookie Origin/CSRF checks, mobile bearer authentication, backend admin checks, optimistic versions and operation identities remain authoritative.

## Verification

See the dated entry in [verification](verification.md). Regression sources are `verification/workflow-feedback.ts`, `verification/workflow-feedback-seed.ts`, `verification/browser-workflow-feedback.ts`, the mobile guidance tests and web provisioning test. Isolated data/evidence live under `.local/workflow-feedback/`; normal databases and private configuration are untouched. Native runtime and final browser outcomes must be read from that entry, not inferred from source or typechecks.
