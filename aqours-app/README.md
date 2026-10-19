# Aqours customer Android application

Expo SDK 57 (`57.0.30`), React Native `0.86.3`, React `19.2.3`, TypeScript 6 and Expo Router. Native MapLibre `11.5.0` requires a rebuilt Android app; Expo Go cannot run this app. The existing Expo stack and npm lockfile are retained. iOS and customer web delivery are outside this release.

## Setup

Build the local public contracts package from the repository root before installing:

```sh
npm --prefix aqours-contracts run build
cd aqours-app
export npm_config_cache="$PWD/../.cache/npm"
export XDG_CACHE_HOME="$PWD/../.cache"
export GRADLE_USER_HOME="$PWD/../.cache/gradle"
export ANDROID_USER_HOME="$PWD/../.cache/android"
export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
export ANDROID_EMULATOR_HOME="$ANDROID_USER_HOME"
export ANDROID_TMP="$PWD/../.cache/tmp/android"
export TMPDIR="$PWD/../.cache/tmp"
export EXPO_NO_TELEMETRY=1
export EXPO_NO_DOTENV=1
mkdir -p "$ANDROID_USER_HOME" "$ANDROID_AVD_HOME" "$ANDROID_TMP" "$TMPDIR"
npm ci
```

Use Node.js 22.13+ supported by SDK 57. Follow the root workspace guide to migrate/seed PostgreSQL and start the API. No user password or server secret is bundled here. Use an individually provisioned customer login from the demonstration account documentation; staff accounts belong to the supplier web app.

Provide only public bundle configuration through the shell or build environment. `.env.example` documents every consumed public variable; this project does not need access to secret-bearing `.env` files.

```sh
export EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api/v1
export EXPO_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
```

`10.0.2.2` reaches the host from the standard Android emulator. For a physical phone use the development computer's reachable LAN address and permit the local API port. The phone's `localhost` refers to the phone. Production API URLs must use HTTPS; `app.config.ts` permits Android cleartext only when an explicitly supplied public API URL starts with `http://`. Change this configuration and rebuild when switching deployment environments.

The example MapLibre style is development demonstration tiles. For deployment choose an appropriately licensed native-compatible map provider, keep its required attribution visible, and restrict any public provider credential. Map rendering and Geoapify geocoding are independent. The private Geoapify key stays in Express. A missing or failed map does not prevent address-based reporting.

## Build and run Android

Use JDK17 and an Android SDK with platform36, build-tools35.0.0 and36.0.0, NDK27.1.12297006, CMake3.22.1 and platform-tools. These exact native toolchains built both APK variants locally; build-tools35 is required by Expo modules even though the app targets36. Set `JAVA_HOME` to your JDK17, and `ANDROID_HOME`/`ANDROID_SDK_ROOT` to your SDK. Configure project-local caches as above. Existing toolchains may be read without modification; use a project-local SDK if installing components. Do not auto-install into or modify the surrounding environment without permission.

```sh
npx expo prebuild --platform android --no-install
npm run android
```

Native directories are generated and ignored. Configure native behavior through Expo config/plugins, never manual changes to generated Android or iOS files. Local release APK packaging, when the SDK/build tools and signing configuration are available:

```sh
cd android
./gradlew :app:assembleRelease --no-daemon --max-workers=2 \
  -PreactNativeArchitectures=arm64-v8a,x86_64 \
  -Dorg.gradle.java.installations.paths="$JAVA_HOME" \
  -Dorg.gradle.java.installations.auto-download=false \
  -Pandroid.builder.sdkDownload=false
```

When public API/style environment values change, force JavaScript rebundling before assembling; Gradle may otherwise reuse an older embedded bundle:

```sh
./gradlew :app:createBundleReleaseJsAndAssets --rerun-tasks --no-daemon --max-workers=2
```

Keep the same project-local toolchain/cache settings and architecture flags when assembling afterward. Verify the resulting APK uses the intended public configuration.

An unsigned or development-signed APK is suitable only for local demonstration. Review release signing before distributing publicly. `eas.json` records optional internal-APK/AAB profiles, but cloud builds are unverified and need additional monorepo preparation: the ignored sibling `aqours-contracts/dist` must be built in an EAS install hook before bundling. No such remote hook, account provisioning, paid cloud build or store submission has been performed. Configure and verify those steps yourself before invoking EAS. The local instructions above are the implemented build path; neither configuration nor JavaScript export proves a successful device installation.

Both `:app:assembleDebug` and the standalone `:app:assembleRelease` succeeded for ARM64/x86_64, with native MapLibre and verified APK v2 signatures. Outputs are `android/app/build/outputs/apk/{debug,release}/app-{debug,release}.apk`. Debug needs Metro; release embeds JavaScript. Install the local release using `adb -s <device-serial> install -r android/app/build/outputs/apk/release/app-release.apk`, then launch Aqours. A supported device must provide Android7/API24 or newer. KVM-backed Android29 and Android36 subsequently installed and ran the standalone release. Actual checks cover sign-in/SecureStore restoration/account isolation, reporting/messages, stale-guidance hiding, notifications, all three assistance submissions with real supplier-browser fulfillment, independent quality restrictions, still-affected feedback, system-picker upload and protected-photo display. Native tests exposed and fixed real SDK57 multipart, foreground draft retention, map-marker and RN0.86 image-header defects. See the [native evidence ledger](../docs/native-verification.md) for exact APK hashes, each result and remaining checks; earlier unaccelerated failures remain historical.

## Implemented customer workflows

- SecureStore bearer session restoration, customer-only login, server logout/revocation retry, and clearing private views when identity changes or expires.
- Home with owned service connections, all-page applicable advisories/published incidents/open reports, notice planned dates/matching owned references, synthetic-data labels, and foreground refresh. A failed later page is an error, never a silently complete first page.
- Reports with category-specific details preserved for supplier review and observed Manila time; saved address, confirmed server-geocoded candidate, optional foreground GPS, native map preview and explicit address-only fallback. Alternate issue locations do not change saved connection details.
- Report receipts, owned paginated history, protected attachments, messages, published incident timeline, deduplicated affected assertions and still-affected review using the current server version.
- Optional JPEG/PNG/WebP photos uploaded after report commit. A failed upload retains the tracking reference and retries only the same attachment. Additional photos can be added from detail.
- API-evaluated questionnaire and explained action/source/revision cards. Current official advisories precede incident and assistance context. Source checks run every 30 seconds while focused and on foreground entry; changed or unverifiable cards are hidden and support remains available. Choosing/declining records a choice; a separate form confirmation creates assistance.
- Explicit callback, inspection and water-pickup forms; paginated sessions use the linked report's confirmed issue zone, include unavailable/full states and provide callback fallback. Owned request history shows old/new agreed appointments, pickup references, allocation state, outcomes, next steps and reasoned eligible cancellation.
- Persisted notifications, foreground polling, server-confirmed read state and allowlisted navigation to freshly authorized destinations; owned profile and saved supplier-maintained connection details.

API failures never become demo success. Domain commands reuse the same operation UUID and original payload after uncertain responses. A pending operation survives route refetch/remount in memory and clears on account change. It is not a durable offline queue and does not survive app process termination; after restarting, inspect owned reports/requests before deliberately submitting again. Android image uploads use Expo FileSystem `File` bytes accepted by SDK57 fetch; plain React Native URI descriptors are unsupported by that encoder. The picker name remains visible locally and upload metadata uses the cache basename. Protected images use a one-element source array to preserve authorization headers in RN0.86 Android; credentials never enter URLs. Same-account/path foreground refresh retains mounted picker/upload state, labels stale data with its last-loaded Manila time and clears it on denied access or identity change. No passwords, tokens or private response bodies are logged.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run export:android
```

Eighteen Node tests exercise bearer/envelope/error boundaries, multipart headers, stable report/photo retry intentions, account/version isolation, strict Manila date parsing, owned advisory-context matching and complete pagination/error handling beyond100records. Four regressions execute the installed Expo encoder and three execute the installed RN Android image-source branch. These helper tests supplement the actual [native checks](../docs/native-verification.md), rather than substitute for them. Mobile typecheck/lint and a rebuilt signed release APK pass. The initial offline SDK57 FileSystem install skipped the remote Directory check. A later online installed-Expo dependency check reports up-to-date; direct Directory metadata returns200 with no unsupported listed native dependencies. Five core/local packages are unlisted, so that metadata does not certify them. Actual native builds/runtime provide separate evidence. Live Geoapify still requires private operator configuration.

All application modules live outside `src/app/`; that directory contains only Expo Router routes/layouts. Handwritten TypeScript/TSX files remain below 300 physical lines. Root documentation describes backend authorization, operations, provider setup, retention and demonstrated limitations.
