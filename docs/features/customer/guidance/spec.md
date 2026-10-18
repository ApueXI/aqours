# Customer Contextual Guidance

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Help customers understand reported water problems and choose a useful next action with a reason and supporting source.
- Proposed first-release approach: a short guided questionnaire, API-evaluated explainable rules, and action cards.
- The professor's decision-support rubric remains open; rules-based guidance is proposed and AI is not confirmed as necessary.
- Users are customers viewing their own report context and applicable published supplier guidance.
- Current evidence: [starter routes](../../../../aqours-app/src/app/) and the empty API contain no questionnaire, rule engine, guidance cards, or recommendation history.
- Scope covers recommendation generation/explanation, uncertainty, source freshness, and a deliberate handoff to assistance.
- Fulfillment belongs to [assistance](../assistance/spec.md); this feature cannot submit/accept/schedule services or publish advisories automatically.
- Exclude diagnosis, autonomous water-safety decisions, risky repairs, invented restoration times, and an AI chatbot implementation.

---

## MUST

### Scope status and hard boundaries

- Trace the proposed behavior to REQ-DECISION-01 through REQ-DECISION-10 and REQ-UI-C04 in [requirements](../../../requirements.md).
- Keep the questionnaire/rule details labeled proposed until academic expectations are confirmed.
- The required privacy, ownership, authorized-publication, and safety limits apply regardless of the later decision-support approach.
- Read only the current customer's report/connection/answers and customer-safe published incident/advisory records.
- Never expose staff notes, another household's coordinates/contact details, or another customer's recommendation history.
- Never diagnose contamination or drinkability from a photo, absent reports, report category, or incident resolution.
- Keep boil-water, do-not-drink, and do-not-use instructions distinct and use only applicable authorized supplier/public-health guidance.
- An outage resolution must not lift a quality restriction; only explicit authorized advisory action can do that.

### Inputs and precedence for the proposed rules

- Evaluate category, service location/zone, report time, customer-stated needs, targeted answers, active advisories, incident status, and current pickup-session availability.
- Use explicit confirmed zone/record associations, not map clusters, as the matching authority.
- Identify missing or conflicting inputs; lack of a confirmed zone or known incident must not be treated as proof of normal service.
- Apply applicable official safety guidance first, then contextual incident guidance; retain visible escalation conditions alongside both.
- Do not synthesize local emergency thresholds or safety instructions; use approved content or explain that confirmation is needed.
- Keep question sets relevant to the category and customer need; do not collect unrelated personal information.
- Persist the rule version and relevant input/source revisions needed to explain an evaluation later.

### Scenario rules, proposed

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

### Proposed components and contracts

- Build focused questionnaire, explanation/source, alternative, and action components outside `aqours-app/src/app/`; routes compose them.
- Implement rule evaluation and published-source matching in `aqours-api/`; both clients must receive consistent API-owned decisions.
- Illustrative interface, not a finalized route: evaluate guidance for an owned report using customer needs and typed questionnaire answers.
- Finalize DTOs for action type, reason, source references/revisions, evaluation time, rule version, freshness, and allowed alternatives before coding.
- Reject foreign report IDs and unsupported answers server-side; derive identity from [authentication](../auth/spec.md).
- Use an explicit rule ordering/decision table with approved content references rather than logic duplicated inside mobile screens.
- Never put provider/database credentials or editable server rule implementation in the client bundle.

### Evaluation and evidence flow

1. Load the [owned report](../report/spec.md), confirmed connection/zone context, and current published source revisions.
2. Ask only relevant targeted questions and record missing/unconfirmed inputs rather than replacing them with guessed values.
3. Evaluate safety precedence and contextual rules against current incident/advisory/session records.
4. Save the evaluation context and result in proposed `recommendation_history`; preserve source/rule revisions for review.
5. Render explanation/action cards, then hand off the chosen service to the [assistance form](../assistance/spec.md) without submitting it.
6. Refetch/reevaluate after relevant source changes or [notifications](../notifications/spec.md); distinguish old evaluations from current guidance.

- Proposed supporting persistence includes versioned approved guidance/rules and source relationships in [schema](../../../schema.md).
- Reevaluation may occur on demand with source-revision checks; exact invalidation/fan-out mechanism is an open implementation choice.
- Evaluation itself must not mutate report/incident/advisory status, reserve stock, or create fulfillment work.
- Audit rule edits by authorized supplier actors and evaluation correlation without logging credentials or unnecessary personal data.

### Research and dependencies

- [The CDC advisory overview](https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html) supports distinct advisory categories; it does not supply Aqours's locally approved notice text.
- Consolidated technical research and trust boundaries are in [architecture](../../../architecture.md); use its separation of published guidance, owned data, and API authority.
- Sequence after auth, report/connection reads, approved incident/advisory records, and pickup availability contracts; integrate assistance actions before final scenario acceptance.
- Confirm academic expectations and the rule/questionnaire content before implementing the proposed guidance method.

### Future verification and unresolved choices

- Add rule-table tests for precedence, all stated issue cases, unknown/conflicting input, no availability, changed source revisions, and alternative/decline behavior.
- Add API tests for owned evidence/history, published-only projections, rule-version retention, and zero fulfillment side effects during evaluation.
- Exercise Android cards, explanations, source times, failed refresh, stale historical output, and explicit form confirmation.
- Confirm approved guidance content, hazard escalation wording, answer schema, rule governance, versioning/storage, and exact evaluate/read endpoints.
- Do not treat a successful technical rule test as academic acceptance or validation of a real water-safety claim.
- Wider workflow/role sources: [workflows/setup](../../../workspace.md) and [customer role](../../../domains/customers.md).
