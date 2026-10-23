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

The five visible tabs are **Home, Reports, Messages, Weather, Settings**. Assistance and notifications retain their existing URLs and remain reachable through Home/header controls. The authenticated header provides Notifications access, visually labeled Updates. Notification counts summarize the latest 100 entries; opening an update retains existing authorized detail/read behavior.

Home keeps the report shortcut, applicable quality restrictions and links to service incidents/advisories, assistance and reports. It no longer repeats full report/request/connection lists or embeds weather. `/service` provides incident and advisory details; `/weather` retains the owned-connection and Philippine-city forecast modes. Settings opens Account settings at the existing `/profile` URL, with saved connections and password changes.

A foreground polling guard prevents the 30-second refresh from replacing an in-flight answer submission before its receipt arrives. Report questions remain mounted while guidance is being evaluated or verified. **Submit answers** sends current boolean/unknown/time answers, shows confirmation after success, and blocks choosing an earlier recommendation after editing answers until resubmission. Invalid times and API failures retain explicit feedback. Guidance choices remain separate from assistance submission.

**Change password** in Account settings verifies the current password, checks a repeated new password and uses `POST /me/password`. Every password field receives a slow scrypt retry fingerprint rather than a fast offline verifier. The API requires at least 12 characters, rejects unchanged passwords, locks the user row, audits the change without credentials and revokes other sessions. The current session stays valid so an uncertain request can retry with the same operation key. Forgotten-password recovery remains supplier assisted: login explains how to contact the supplier; admin can set a replacement password after verifying identity. Email/SMS recovery tokens, forced initial rotation, MFA and public registration are not implemented.

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

## Advisory, guidance and app follow-up — 23 October 2026

Advisory editing now labels its audience **Affected service zones** and **Individual service connections (optional)**. Either selection matches; zone targeting requires a supplier-confirmed saved connection. At least one zone or connection remains required by the API. Targets select recipients, independently of report submission and phone coordinates. Optional **Service starts** and **Expected end** fields describe the service window in Manila time, separately from publication. A quality restriction still requires explicit lifting.

The Guidance tab now has one **Customer guidance** section and one refresh action, containing **Advisory instructions** and **Recommended next steps**. Admin actions use these task labels instead of separate version-management headings. The existing approved-text and rule records retain separate API writes and immutable histories because they have different purposes; this is a presentation consolidation, not a combined database version or atomic two-record save. Staff remains read-only.

Home now displays applicable current and upcoming service advisories as well as current quality restrictions. Home and Service updates request the existing `includeLifted=true` collection, then classify notices for display. Service updates can include past and lifted advisories and resolved incidents; current incidents remain the default. Scheduled notices distinguish upcoming, current and past service windows. Quality restrictions stay current regardless of planned dates until lifted. Drafts remain excluded. All pages retain the audience query during pagination.

Only supplier-published incident updates are public. Their list is not filtered by customer distance or service zone. Individual customer reports remain private. Missing advisories can still result from an unmatched or unconfirmed saved zone, missing publication, or the wrong connection target; the UI explains this and offers refresh of advisories and saved connection details. No existing customer-zone assignment or ordinary demo data was changed.

Updates puts **Refresh updates** before the entries and disables it during loading. The former Profile tab is labeled **Settings**, with the same `/profile` route and an **Account settings** shortcut on Home. Password change appears directly after identity, followed by supplier-maintained saved connection information and sign-out. This does not add self-service changes to identity, contact details or service ownership.

Focused checks and runtime limitations are recorded in [verification](verification.md#advisory-guidance-and-app-follow-up--23-october-2026).
