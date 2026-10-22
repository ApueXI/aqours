# Supplier weather representative coordinates

This directory joins a separate coordinate source to the existing bundled Q2 2026 PSGC hierarchy in [`../data/`](../data/). Canonical ten-digit codes, names, levels and ancestry always come from that local hierarchy. The coordinate source does not redefine them. The catalog stops at city/municipality; barangays and Manila sub-municipalities are excluded.

## Sources and attribution

- [`source-coordinates.json`](source-coordinates.json) is the exact [ph-geo `data/coords.json`](https://github.com/kon2raya24/ph-geo/blob/06f38a00f8b9ac03f8bd6a3693893b8c449ac466/data/coords.json), pinned at `06f38a00f8b9ac03f8bd6a3693893b8c449ac466`. SHA-256: `7167015df9dc02f060e13e022b8be5c3be3e0f05c288e8988cf71161bf7968ea`.
- Coordinate data is credited to [GeoNames](https://www.geonames.org/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The upstream ph-geo code has a separate MIT license. See [NOTICE](NOTICE) for retained attribution and limitations.
- [`source-provinces.json`](source-provinces.json) and [`source-regions.json`](source-regions.json) retain ancestor metadata from [ph-dev-utils `data/`](https://github.com/kon2raya24/ph-dev-utils/tree/0dd17a33fba02110edb55d85d1e0382d3c9a6ea2/data), pinned at `0dd17a33fba02110edb55d85d1e0382d3c9a6ea2`; that source is MIT licensed.

Upstream coordinates derive from 2025-vintage postal points averaged by locality and joined to older Q4 2024 PSGC identifiers. They are representative points, with inherited spatial bias, rather than official centroids, surveyed addresses or administrative boundaries. Weather represents conditions at that point, not every place within the locality.

## Mapping and coverage

[`build-coordinates.ts`](build-coordinates.ts) traverses the bundled canonical hierarchy and matches unique normalized locality names only within reviewed ancestry. Normalization removes diacritics, parenthetical alternate names, city prefixes/suffixes, case and punctuation. It does not introduce spelling/renaming aliases or convert six-digit source locality codes into ten-digit codes.

[`ancestry-crosswalk.json`](ancestry-crosswalk.json) explicitly maps historical source province identifiers to current province names. This accommodates provinces moved between regions (including NIR and Sulu); old Maguindanao `1538` maps to its two successor province names, still requiring a unique locality-name match. NCR uses its region with no province. Source Cotabato City `129804` has an explicit unique match to the canonical tree's Maguindanao del Norte ancestry. Source coordinates must fall within the generator's Philippine extent and agree with the retained source-province region; duplicate target matches fail generation.

The retained [`metadata.json`](metadata.json) records pinned source revisions, paths, license attribution and hashes for coordinates and ancestor metadata. [`coverage.json`](coverage.json) records:

| Measure | Count |
| --- | ---: |
| Source coordinate rows | 1,573 |
| Canonical cities/municipalities | 1,642 |
| Matched representative points | 1,553 |
| Canonical localities with unavailable coordinates | 89 |
| Unused source rows (including exclusions) | 20 |

[`coordinates.json`](coordinates.json) retains every canonical locality, with paired nullable latitude/longitude and nullable matched `sourceCode`. The coverage file enumerates all unavailable canonical codes/ancestry and unused source rows. These gaps include unmatched names, new localities and inherited hierarchy inconsistencies; the existing bundled tree places some highly urbanized cities under unexpected provinces, such as Baguio under Apayao. This feature preserves that authoritative-for-this-project hierarchy and leaves such points unavailable rather than silently correcting ancestry or broadening matching.

Known suspect source points for Santa Rosa, Laguna (`043428`) and Manila are explicitly excluded in [`source-exclusions.json`](source-exclusions.json), with identities and reasons. Their raw source rows remain intact; canonical coordinates are null. The exclusion review compares the postal means with the [UNGEGN Manila reference](https://ungegn.un.org/dashboard/cities/details?id=108), [DILG NCR Manila reference](https://drrm.ncr.dilg.gov.ph/lgus/manila), and a [Santa Rosa city planning/GIS presentation hosted by the UN](https://unosd.un.org/sites/default/files/day_3_session_11_hon._mr._arcillas_santa_rosa_philippines.pdf). The displacement is sufficient to withhold those points pending a reviewed replacement; those reference coordinates are not substituted. This is a targeted quality safeguard, not a claim that all other points are spatially verified. Remaining points retain source-derived postal-mean uncertainty.

## Reproduction and updates

From the repository root, using its documented Node version:

```sh
node --experimental-strip-types psgc-address-data/weather/build-coordinates.ts
```

The generator reads only retained local inputs and writes `coordinates.json`, `coverage.json` and `metadata.json`; it requires no installation or network. Tester owns execution and reproducibility evidence. When updating either reference source, pin/review the new revision and licenses, retain exact inputs, review the explicit crosswalk and every changed match/gap, regenerate, and rerun dataset/API/UI checks. Never rewrite canonical PSGC codes or guess coordinates to improve coverage.

Deploy this directory alongside `psgc-address-data/data/` and `aqours-api/`. No database migration, geocoder credential or new runtime dependency is introduced by these weather coordinates. They do not update saved customer/report/pickup coordinates or alter Distribution monitoring. See [weather](../../docs/weather.md) and [locations](../../docs/location-and-maps.md).
