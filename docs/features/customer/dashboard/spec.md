# Customer Dashboard

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Provide the Android customer's home view: applicable published notices, open reports, and a shortcut to report a problem.
- Help a customer find the latest known supplier information before deciding whether to report or request assistance.
- The saved service connection/address establishes home context; an alternate report location does not replace it.
- This feature does not contain supplier metrics, other customers' report maps, billing, or a new recommendation engine.

---

## MUST

### Home content

- Satisfy REQ-UI-C01, REQ-ACCESS-04, REQ-NOTICE-01 through REQ-NOTICE-03, and REQ-OPS-02 in [requirements](../../../requirements.md).
- Show current published notices matching the customer's saved service connection and explicit confirmed zone associations.
- Keep official quality restrictions distinguishable from incident restoration/progress information.
- Show notice source/publication or latest-update time, affected context, and a visible demonstration-data label when applicable.
- A resolved outage must not hide an applicable quality advisory that has not been explicitly lifted.
- Provide access to the Reports tab for owned report tracking, category, status and details.
- Provide a report shortcut and access to guidance, assistance requests, notifications, and profile.
- Do not expose unpublished updates, internal notes, other households' locations, or other customers' reports.
- Match Home restrictions against all owned connections; Profile lists their addresses and review state.

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

### Weather addition — 21 October 2026

The Weather tab includes current conditions and seven-day forecasts for an owned saved connection, initially preferring the first connection with coordinates. Customers can switch connections or search/select a Philippine city; missing coordinates retain city search without requesting GPS. Weather has independent loading/retry/stale states, Manila timestamps and provider attribution. Selection is temporary and account-scoped, and the API checks ownership before cached weather access. See [weather behavior and checks](../../../weather.md).

### Implemented behavior and modules

`aqours-app/src/features/home/screens/home-screen.tsx` composes applicable quality restrictions, a report shortcut and navigation to service incidents/advisories and assistance. Reports, Messages, Weather and Profile have dedicated tabs.

Home reads `/me/connections` and `/advisories`; the service screen reads `/incidents`, and Reports reads owned `/reports`. No special dashboard table is used. `src/hooks/use-resource.ts` refetches on focus/foreground and polls selected resources every 30 seconds while active. Notices and incidents carry demo labels and source/update context; matching uses API-reviewed zone/connection associations.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Native advisory context shows planned dates, an explicit quality-end-does-not-lift warning and only matching owned connection references/addresses. Connection-targeted customer DTOs exclude all other households. Failed refresh retains last-loaded Manila time with an error, rather than showing a confirmed empty state.

Actual installed N1/N5/N17/N20/N27/N31/N34/N38–40 verify owned Home/demo labels, independent quality persistence/lifting, unknown zone, empty/stale/network recovery, planned dates/own references and report-free notice reception. All-page targeting/failed-page handling have separate API/helper evidence; consult the [native ledger](../../../native-verification.md) and traceability.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.

## Workflow update — 23 October 2026

See [account, notification, conversation and customer workflow corrections](../../../workflow-feedback.md) for current account/connection provisioning, optional generated connection numbers, recipient-owned supplier alerts, conversation indexes, customer tabs, question submission and password changes. Existing data is preserved; no schema migration or dependency changes are required.

## Advisory discovery and incident history — 23 October 2026

Home includes current/upcoming targeted service notices. Service updates offers past/lifted advisory history and resolved incident history. Published incidents are not filtered by customer distance; private reports remain owner-only. See [follow-up behavior](../../../workflow-feedback.md#advisory-guidance-and-app-follow-up--23-october-2026) for scope and verification.
