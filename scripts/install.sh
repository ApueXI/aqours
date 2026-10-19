#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
export npm_config_cache="$PWD/.cache/npm"
export XDG_CACHE_HOME="$PWD/.cache"
export EXPO_NO_TELEMETRY=1
export EXPO_NO_DOTENV=1
npm ci --no-fund --no-audit
npm --prefix aqours-contracts ci --no-fund --no-audit
npm --prefix aqours-contracts run build
npm --prefix aqours-api ci --no-fund --no-audit
npm --prefix aqours-api run generate
npm --prefix aqours-web ci --no-fund --no-audit
npm --prefix aqours-app ci --no-fund --no-audit
