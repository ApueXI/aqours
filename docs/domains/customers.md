# Customer domain

Status: **target capabilities, unimplemented** as of 18 October 2026. The customer application currently contains an Expo starter. Product source: brief v0.4 and [requirements](../requirements.md).

The customer is a seeded individual account linked to fictional service connections and saved addresses. Android is the confirmed customer platform. Public registration is optional; this documentation does not introduce a registration approval process.

| Feature | What the customer can do | Detailed specification |
| --- | --- | --- |
| Authentication | Sign in with the documented demo account, retain a protected session and sign out with server revocation | [Authentication](../features/customer/auth/spec.md) |
| Home | See applicable current published notices for the saved address, open reports and a shortcut to reporting | [Dashboard](../features/customer/dashboard/spec.md) |
| Reports | Submit outage, low-pressure, leak or water-quality concerns; use saved address/optional GPS; confirm a native map location; attach optional photos; track owned reports, exchange clarification messages and send follow-up | [Reports](../features/customer/report/spec.md) |
| Guidance | Answer targeted questions, see a contextual action with reason/source/update time, and choose another appropriate action or decline; rules-based assistance remains proposed pending the academic rubric | [Contextual guidance](../features/customer/guidance/spec.md) |
| Assistance | Explicitly request callback/support, inspection or water pickup; see acceptance/schedule/progress/outcome; cancel before work/collection starts and follow up | [Assistance](../features/customer/assistance/spec.md) |
| Notifications | Read owned persisted in-app notices about published updates and request progress, and follow links only to permitted records | [Notifications](../features/customer/notifications/spec.md) |
| Profile | View own profile, fictional connection details and saved service address | [Profile](../features/customer/profile/spec.md) |

## Workflow summary

1. Sign in, review service notices and open reports.
2. Submit a report using the saved address or confirmed alternate location. GPS denial and basemap failure must leave reporting usable; missing coordinates remain reviewable.
3. Receive a tracking reference, submission time and `received` status; follow the owned timeline and reply to staff.
4. Mark a published incident as affecting the connection without creating duplicate personal reports. If still affected after resolution, return the individual report for review without reopening the incident for everyone.
5. Review guidance and choose an assistance service if useful. Recommendations do not submit requests automatically.
6. Await staff acceptance and scheduling. For pickup, an initial request is not a stock guarantee; acceptance reserves liters and supplies a reference.
7. Review completion or a reasoned unavailable/cancelled/rescheduled outcome. The report, incident and advisory retain their own status.

See [workspace workflows](../workspace.md) for the full sequence and [supplier staff](staff.md) for the other side of the interaction.

## Access and business boundaries

- Access only owned reports, photos, messages, notifications, recommendations and assistance; the API checks ownership on every record request, including changed IDs and file links.
- See permitted published incidents/areas/advisories; never see other customers' household locations/contact information or internal staff notes.
- Retain the saved service address separately from each report's issue location. Self-service reassignment of supplier-maintained connection ownership/address is not specified.
- Choose or decline a recommendation. No recommendation determines water safety, invents a restoration estimate, guarantees an appointment or accepts a water allocation.
- Quality advisories remain applicable until explicitly lifted by an authorized user. An outage resolution or completed assistance does not lift them.
- Requests use liters and staff-managed pickup/distribution. Payments, commerce orders and home delivery are deferred.

Primary requirement groups: `REQ-ACCESS-*`, `REQ-UI-C*`, `REQ-REPORT-*`, customer actions in `REQ-INCIDENT-*`, `REQ-ASSIST-*`, `REQ-WATER-*`, and proposed `REQ-DECISION-*`. Detailed implementation and academic choices remain labeled in [requirements](../requirements.md); this summary creates no extra role or permission.
