#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/reels/campaign-reminder-template/build_campaign_reels.sh" "$@"
