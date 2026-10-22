# Laguna PSGC seeds and weather

User approved plan on 2026-10-22; loop-engineer maximum five implementation/verification cycles.

Root coordination of API fixtures, safe upgrade and existing customer/admin weather verification.

## Contract
Use bundled PSGC Q2 2026, representative Calamba/Los Baños/Santa Rosa barangays. Keep14 accounts,12 connections/reports,3 zones,2 sites; preserve unknown-coordinate customer12 and assistance/stock. Version fresh seed; explicit nonproduction transactional upgrade moves only original mutable fixtures, refuses modified/ambiguous fixtures, preserves all immutable/unrelated data and publishes corrected incident snapshots. Nationwide selection unchanged. Existing admin Overview and customer Home must show current/seven-day Open-Meteo weather for Laguna; verify ownership, failures, refresh and city fallback. No new dependencies, secret access or database reset.

## Acceptance
| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Canonical Laguna structured seeds | Unit plus fresh PostgreSQL seed acceptance |
| AC-002 | Coherent geometry and inherited report locations; customer12 null | Fixture assertions and map browser check |
| AC-003 | Safe upgrade only original mutable fixtures; history preserved | Real legacy PostgreSQL fingerprint comparison |
| AC-004 | Repeat no-op, production/conflict/failure no writes | Real transaction and refusal checks |
| AC-005 | Credentials, owners, scenarios/stock retained | Existing seed acceptance and HTTP checks |
| AC-006 | Admin sees Laguna seven-day forecast | Chromium Overview check |
| AC-007 | Customers see owned Laguna forecast/city fallback | Weather HTTP and available Android runtime |
| AC-008 | Weather auth, recovery, isolation | Existing weather HTTP/browser checks |
| AC-009 | Accurate docs/progress and feature commit | Repository/content/diff checks and commit |

## Coordination
Root `.loop/` owns coordination; child `.loop/` states track component verification. Prior states archived in archive/pre-laguna-2026-10-22. No source changes from interrupted turn. Root reads docs/architecture.md, requirements.md, schema.md, workspace.md, weather.md, location-and-maps.md and component READMEs. Weather already implemented; verification scope, not new weather API.
