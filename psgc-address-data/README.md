# PSGC address data

Bundled Philippine administrative hierarchy used by Aqours address entry and backend validation. Supplied source metadata identifies PSA PSGC Q2 2026 (`PSGC-2Q-2026-Publication-Datafile.xlsx`). This repository snapshot contains names/codes and demographic fields, with no coordinates or boundary polygons.

Runtime consumers read `data/list-of-all-regions.json` and the region file referenced by each entry. Preserve ten-digit codes as strings and follow the actual child hierarchy, including directly attached cities/municipalities and Manila sub-municipalities.

See [location integration and update instructions](../docs/location-and-maps.md). No published package or dependency installation is required.
