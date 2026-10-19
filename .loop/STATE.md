# Execution state

Status: CHECKPOINT — implementation and available checks verified; required device/provider acceptance remains outstanding. Updated 2026-10-19 (Asia/Manila).
Branch: feature/aqours-first-release. Clean baseline a068807 preserved. Backend feature commit 8fe0c22; connected clients, verification and documentation are included in the feature commit carrying this checkpoint. Inspect `git log -2` and `git status` when resuming.

## Discovery, scope and decisions

Read PROGRESS first, root/mobile instructions, all four references, index, three role summaries, sixteen specs and actual starter code. Archived unrelated completed documentation state to archive/docs-goal-2026-10-18 before this goal. User adopted the documented one-supplier/accounts/roles/transitions/metrics/rules defaults and explicitly authorized project-local dependencies plus scoped Docker verification metadata. Optional/deferred features remain excluded. No AI; academic acceptance is externally unverified.

Independent package lockfiles preserve Expo57/RN0.86.3; public contracts were established before dependent workers. Express/pg uses typed JSONB records with relational ownership/ledger constraints, four checksummed migrations, revocable opaque mobile sessions, HttpOnly/CSRF browser sessions, controlled private images and transactional histories/notifications/idempotency. SQL WGS84 viewport filtering needs no PostGIS; exact NUMERIC liters use session→request→allocation locking. API-evaluated guidance retains immutable evidence and checks source freshness. All production clients use the real API. Geoapify is a real server adapter; missing configuration returns503 and address-only reporting remains available.

No actual .env or secret-bearing values were read, changed, committed or put in state. Toolchains/caches/data stay in .cache/.local/ignored native directories; existing Android SDK components were read-only links into the local SDK. JDK17/NDK/build tools/images were downloaded locally; no global install, external SDK edit, account provisioning, paid service or deployment. Approved Docker used its existing image/container/network/volume metadata and a project-local bind data path.

## Managed workers and ownership

All managed workers are finished/stopped and released ownership. Lead reviewed actual source, test results and screenshots and owns all paths. Current tool statuses were reconciled before final integrated checks and handoff. No worker is editing; no additional delegation is pending. This feature commit contains the connected clients/documentation checkpoint; confirm actual history and working tree with `git log -2` and `git status` on resume.

| Worker/task | Delivered scope | Requested settings and rationale | Observed status |
| --- | --- | --- | --- |
| api_implementation / api_hardening | Bounded backend implementation, permissions and transactions | Component state records gpt-6.1-sol/high for consequential authorization/stock work; effective settings not exposed | Finished/released; lead integrated and verified |
| web_implementation | Connected supplier UI | gpt-6.1-sol/high for multiworkflow integration; effective unknown | Finished/released |
| android_implementation | Expo customer UI | Component state records gpt-6.1-sol/high; effective unknown | Finished or confirmed absent before reassignment; lead owns source |
| contract_audit | Two contract/config audits and eleven focused HTTP tests | gpt-6.1-sol/high for boundary/race review; effective unknown | Finished/released; concrete findings corrected |
| docs_reconcile | 24 reference/role/spec docs, demo and 220-ID traceability | gpt-6.1-sol/medium for bounded documentation; effective unknown | Both tasks finished/released; lead reconciled final evidence |
| native_verification | Real debug/release APKs and bounded installed Android diagnosis | gpt-6.1-sol/high for native integration/debugging; effective not exposed | Resumed after usage reset, finished/released; no source edits during runtime task |
| acceptance_edges | Four workflow/race/metric HTTP checks | gpt-6.1-sol/high for exact concurrency/cohort assertions; effective not exposed | Finished/released; lead fixed only test floating-mean tolerance and integrated |
| supplier_acceptance | Eight maintenance plus seven report/photo/incident browser checks | gpt-6.1-sol/high for browser/API coordination; effective not exposed | Finished/released; lead reviewed source/results |
| security_acceptance | Five full role/auth/privacy/combined-state HTTP checks | gpt-6.1-sol/high for consequential boundaries; effective unknown | Finished/released; lead integrated configurable database override |
| browser_recovery | Fifteen auth/dashboard/map/settings browser checks | gpt-6.1-sol/high for cross-client recovery; effective unknown | Finished/released; original guidance/rule text restored via appended versions |

Lead handled shared contracts, tightly coupled integration/security fixes, infrastructure, cross-project verification and all state updates directly to preserve coherent interfaces and nonoverlapping ownership. No further worker delegation occurred without lead approval.

## Acceptance and evidence

- AC001: contracts build, all application types/lint and root verification TypeScript PASS. All 17 consumed application configuration variables exist in examples; all 27 example names have setup documentation.
- AC002: all 4 migrations applied locally and in approved Docker; repeat migration/seed preserves records. Container recreation counts/checksums PASS. Isolated restore preserves all domain counts and both private-image hashes; restored owner200/foreign404/anonymous401 and 4 migrations PASS.
- AC003..011,014..015: API: 16 unit +54 integrated real HTTP/PostgreSQL scenarios PASS, zero failed/skipped. Covers ownership/roles/revocation/expiry/CSRF, attachments, retries, incident/advisory independence, immutable stale guidance, all services, exact stock/link/affected/cancel-start races, rollback and exact dashboard cohorts. Device and live-provider portions below remain unverified.
- AC012: Web: 15 unit/type/lint/build PASS. Production Chromium: 53 workflow checks and 5 real MapLibre checks PASS, including settings conflict/frozen retries, inspection completion, stock maintenance/cancellation, link correction, real cluster expansion and authorized point selection. GL6 worker packaging fixed after actual rendering failure; lazy MapLibre advisory-size warning remains disclosed.
- AC013: Mobile: 10 helper/type/lint, CNG and Hermes export PASS. Actual ARM64/x86_64 debug APK, 352 tasks and standalone release APK, 546 tasks BUILD SUCCESSFUL; signatures, native MapLibre libraries and embedded final public API/style/JS verified. Android29 nondebuggable package, resumed MainActivity, splash and actual login form observed. No authenticated native workflow passed.
- AC016..017: setup/env/provider/backup/API/demo/Android docs reconciled. Original 84 REQ IDs/order, 126 feature acceptance lines and 10 DEMO rows preserved against baseline. Current checker PASS: 132 application TS files within caps, local links and 95 unique exact named-test mappings. Traceability states each actual proof and remaining manual boundary.
- AC018: feature branch, backend commit and client/documentation checkpoint; final source/configuration/content/diff and staged-secret-path review recorded before commit. This is not full release acceptance while required checks remain open.

The integrated metric fixture initially failed on floating summation order by a fraction of a microsecond; the comparison now allows 1 microsecond, below timestamp precision, with exact counts/nulls retained. An immediate repeat was correctly login-throttled. Final 54-test run after cooldown passed; failed attempts were not counted as passing evidence. Repository rate limits were not changed.

## Runtime and retained artifacts

API session83193 serves current compiled source on port 4000 against project-local PostgreSQL18.6 port55432/aqours_test. Supplier production preview session72172 serves port 5173. RestoreAPI58156 stopped after successful tests. Android36 and29 owned guests are both stopped; Android29 emulator session39414 and installer86151 ended. The installer exit 1 is not counted as a successful command; actual package/startup observation is separate evidence. Project-local AVD/cache data are retained. Isolated ADB5038 was stopped; no Metro/native verification listener remains. The normal developer ADB server was untouched.

Docker project aqours-verify container/network were removed after successful recreation tests without deleting its data/volume; .local/container-postgres-verify remains. Backups/restored images, APKs, logs and screenshots remain ignored in .local/evidence and documented native artifact paths. No unrelated devices, containers or volumes were altered.

## Exact remaining actions

1. Use a stable accelerated emulator or Android phone; the current software targets suffered SystemUI ANRs, watchdog/zygote/system_server replacement and eventual app-process termination. See .local/evidence/native-runtime-assessment.txt and docs/verification.md. Rebuild with a reachable public LAN/HTTPS API address for a phone (existing APK uses emulator 10.0.2.2:4000). Execute actual login/SecureStore restore/logout/account switch, Home/report/messages, GPS allow/deny/address fallback, native map/coordinates/tiles failure, photo picker/upload/retry, guidance freshness, all assistance and notifications. Record each result; rendered login is the last verified native boundary.
2. Operator manually creates/restricts a Geoapify server key, generates a separate signing secret locally and configures only ignored private API environment. Execute live candidate/confidence/confirmation/restriction/quota/timeout/fallback checks from docs/setup.md. Do not request secrets in chat or store them here.
3. For real-use maps, choose a licensed compatible style/tile service and apply supported public-token restrictions/attribution. Development demo style was live-verified on web; no production service was provisioned. Supplier-approved real safety content and optional EAS/deployment are separate operational concerns, not silently verified.
4. Obtain external academic confirmation for the implemented rules/questionnaire/action cards. Technical checks cannot grant it.
5. On resume read current instructions, this state, docs/verification.md and docs/traceability.md; confirm the feature commits/working tree, retained local services and new device/provider prerequisites. All listed locally available implementation/integration work is verified. Do not repeat unaffected checks or label unavailable checks PASS. Goal tool remains active at this first external-only checkpoint; no COMPLETE claim is made.
