# Customer Dashboard

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Provide the Android customer's home view: applicable published notices, open reports, and a shortcut to report a problem.
- Help a customer find the latest known supplier information before deciding whether to report or request assistance.
- The saved service connection/address establishes home context; an alternate report location does not replace it.
- Current evidence: [the home route](../../../../aqours-app/src/app/index.tsx) is a starter welcome screen without customer data.
- This feature does not contain supplier metrics, other customers' report maps, billing, or a new recommendation engine.

---

## MUST

### Home content

- Satisfy REQ-UI-C01, REQ-ACCESS-04, REQ-NOTICE-01 through REQ-NOTICE-03, and REQ-OPS-02 in [requirements](../../../requirements.md).
- Show current published notices matching the customer's saved service connection and explicit confirmed zone associations.
- Keep official quality restrictions distinguishable from incident restoration/progress information.
- Show notice source/publication or latest-update time, affected context, and a visible demonstration-data label when applicable.
- A resolved outage must not hide an applicable quality advisory that has not been explicitly lifted.
- Show the customer's open reports with category, tracking reference, current status, and a detail action.
- Provide a report shortcut and access to guidance, assistance requests, notifications, and profile.
- Do not expose unpublished updates, internal notes, other households' locations, or other customers' reports.
- If multiple owned connections are supported, make the selected home context explicit; the selection convention remains proposed.

### Empty, stale, and failed states

- Distinguish “no matching published notices” and “no open reports” from a failed lookup.
- Absence of a notice or report must not be presented as proof of safe water or normal supply.
- Handle missing/unconfirmed zone information with an explicit context warning and a report/support action, rather than inventing a match.
- Fetch/refetch current information while foregrounded; disclose stale cached information and its update time after a refresh failure.
- Keep navigation/report entry usable if a notice/report section fails or the basemap is unavailable.
- Apply the [authentication](../auth/spec.md) session-expiry and account-switch behavior to all home data.

### Acceptance

- [ ] HOME-C-01: A seeded connection sees only applicable published notices and its owner's open reports.
- [ ] HOME-C-02: Outage resolution leaves a still-active quality advisory visible; an authorized lift is reflected after refresh.
- [ ] HOME-C-03: Unknown zone, empty results, and failed network lookups produce distinct states with usable actions.
- [ ] HOME-C-04: Every report/notice shortcut opens an authorized detail; an attempted foreign report link is denied by the API.
- [ ] HOME-C-05: Switching customers clears previous notice context and report summaries; synthetic content remains visibly labeled.

---

## HOW

### Proposed composition and data flow

- Keep the Expo Router home screen small; use focused notice, open-report, and navigation components plus request hooks outside `src/app/`.
- Load authenticated identity/connection context before requesting targeted home content.
- Proposed API groups are `me/connections`, published advisories/incidents, and owned reports; a combined home response is optional, not a confirmed endpoint.
- The API computes applicable notice matches from explicit zone/connection links and returns only customer-safe published fields.
- Use [schema](../../../schema.md) users/connections, report summaries, advisory revisions, and published incident updates; no dashboard table is required by this spec.
- A shared source event/revision identifier can keep summary and detail views consistent; fetching the home view must not publish updates or create notifications.
- Use server UTC timestamps and display `Asia/Manila` initially; do not infer current publication state from a client clock alone.

### Dependencies, future checks, and open choices

- Sequence after [auth](../auth/spec.md) and the read contracts for [reports](../report/spec.md); integrate published notice targeting before final acceptance.
- Link to [guidance](../guidance/spec.md) for contextual recommendations and [assistance](../assistance/spec.md) for service fulfillment, rather than duplicating their rules.
- Add API ownership/targeting tests and Android home checks for published/lifted notices, open/resolved reports, missing context, stale data, and retries.
- Verify no raw other-household coordinates or unpublished fields reach the response.
- Choose refresh interval, any cache policy, and multiple-connection home selection during implementation; none is an existing app behavior.
- Sources and boundaries: [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md).
