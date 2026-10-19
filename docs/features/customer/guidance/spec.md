# Customer Contextual Guidance

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Help customers understand reported water problems and choose a useful next action with a reason and supporting source.
- Adopted first-release approach: a short guided questionnaire, API-evaluated explainable rules, and action cards.
- The professor's decision-support rubric remains open; rules-based guidance is implemented and AI is outside this release.
- Users are customers viewing their own report context and applicable published supplier guidance.
- Scope covers recommendation generation/explanation, uncertainty, source freshness, and a deliberate handoff to assistance.
- Fulfillment belongs to [assistance](../assistance/spec.md); this feature cannot submit/accept/schedule services or publish advisories automatically.
- Exclude diagnosis, autonomous water-safety decisions, risky repairs, invented restoration times, and an AI chatbot implementation.

---

## MUST

### Scope status and hard boundaries

- Trace the adopted behavior to REQ-DECISION-01 through REQ-DECISION-10 and REQ-UI-C04 in [requirements](../../../requirements.md).
- Keep academic acceptance explicitly unverified; implementation of the adopted questionnaire/rules does not establish academic approval.
- The required privacy, ownership, authorized-publication, and safety limits apply regardless of the later decision-support approach.
- Read only the current customer's report/connection/answers and customer-safe published incident/advisory records.
- Never expose staff notes, another household's coordinates/contact details, or another customer's recommendation history.
- Never diagnose contamination or drinkability from a photo, absent reports, report category, or incident resolution.
- Keep boil-water, do-not-drink, and do-not-use instructions distinct and use only applicable authorized supplier/public-health guidance.
- An outage resolution must not lift a quality restriction; only explicit authorized advisory action can do that.

### Inputs and precedence for the adopted rules

- Evaluate category, service location/zone, report time, customer-stated needs, targeted answers, active advisories, incident status, and current pickup-session availability.
- Use explicit confirmed zone/record associations, not map clusters, as the matching authority.
- Identify missing or conflicting inputs; lack of a confirmed zone or known incident must not be treated as proof of normal service.
- Apply applicable official safety guidance first, then contextual incident guidance; retain visible escalation conditions alongside both.
- Do not synthesize local emergency thresholds or safety instructions; use approved content or explain that confirmation is needed.
- Keep question sets relevant to the category and customer need; do not collect unrelated personal information.
- Persist the rule version and relevant input/source revisions needed to explain an evaluation later.

### Scenario rules, adopted

- Known outage: show the published incident progress and restoration estimate, or explicitly say the estimate is unknown.
- If water is needed before restoration or the estimate is unknown, offer currently listed pickup options or a water-support request.
- If no pickup option is available, offer callback/support instead of guaranteeing water or fabricating availability.
- Low pressure without a known incident: ask targeted questions and offer inspection for staff assessment.
- A problem persisting after resolution: offer follow-up review/inspection without reopening the shared incident automatically.
- Leak: use issue location and reported hazards to surface a relevant supplier contact or assessment request; avoid repair instructions that create risk.
- Water-quality concern: prioritize staff review and surface applicable approved guidance; a photo cannot establish safety.
- Missing, unknown, or conflicting evidence: state what is unconfirmed, retain the report, and offer callback/support follow-up.
- Absence of nearby reports proves neither a household fault nor safe water.

### Cards, alternatives, and freshness

- Each current recommendation shows the action, why it applies, supporting notice/source, last-updated time, and a working next-action button.
- Make the link to the owned report and any published incident/advisory understandable without revealing internal-only context.
- Permit an appropriate alternative or decline; retain customer choice without forcing a new request.
- A button may open a prefilled request form, but only explicit confirmation submits it through the assistance API.
- Clearly distinguish recommendation, request submitted, staff accepted, and appointment/pickup scheduled.
- Reevaluate when incident/advisory information changes; do not display superseded guidance as current.
- Historical rule evidence may be retained for review but must be labeled as historical when sources change.
- After a failed reevaluation, identify stale/unknown context and offer support; do not present the old result as newly verified.
- If AI is later required, it may explain approved records/rules with sources; it cannot publish notices, invent estimates, or decide safety.

### Acceptance

- [ ] GUIDE-C-01: The known-outage case explains the source/update and offers water support when restoration is unknown or later than the stated need.
- [ ] GUIDE-C-02: Full/cancelled/no pickup options produce callback/support, not a water-availability promise.
- [ ] GUIDE-C-03: Unmatched low pressure, leak hazards, and post-resolution persistence each lead to an explained appropriate staff-assessment action.
- [ ] GUIDE-C-04: An applicable quality advisory takes precedence and remains current after outage resolution until explicitly lifted.
- [ ] GUIDE-C-05: Missing/conflicting zone or incident evidence is disclosed; the report remains and a usable support alternative exists.
- [ ] GUIDE-C-06: Choosing/declining an alternative creates no request until deliberate submission; no service is automatically accepted or scheduled.
- [ ] GUIDE-C-07: Source changes cause reevaluation or an explicit stale state; a historical recommendation cannot override current approved guidance.
- [ ] GUIDE-C-08: Customer A cannot evaluate/fetch customer B's report or rule history; inputs/outputs contain no supplier-only fields.
- [ ] GUIDE-C-09: Each scenario retains rule version/source references and can be explained without invented water-safety or restoration claims.

---

## HOW

### Implemented behavior and modules

`aqours-app/src/features/guidance/guidance-screen.tsx` and `use-guidance.ts` render the questionnaire, explanations, sources, uncertainty, alternatives and explicit assistance handoff.

`aqours-api/src/services/guidance.ts`, `guidance-context.ts` and `routes/guidance.ts` evaluate current published advisory/incident context, approved rule versions and eligible pickup availability. Evaluations/choices are immutable owned records; source signatures distinguish historical output from current output. A choice or evaluation never submits assistance. The client checks freshness every 30 seconds while active and on foreground; outdated cards require reevaluation. User-adopted rules are implemented; academic acceptance remains external.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Actual installed N8–9 verify explicit questionnaire/current explained cards and stale-source hiding; N17 retains all three independent official restrictions after planned end and resolved outage/completed services. API decision/freshness tables cover additional permutations; academic acceptance remains external. See the [native ledger](../../../native-verification.md) for current-removal, alternative-action and provider/device boundaries.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
