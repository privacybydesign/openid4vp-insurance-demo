#!/usr/bin/env bash
#
# Forwards local docker-compose ports onto a USB-tethered Android device so the
# wallet app can reach the local services via http://localhost:<port>.
#
# Requires `adb` (Android Debug Bridge) on PATH and an authorised device.

set -euo pipefail

PORTS=(
  5173    # frontend (Vite)
  3001    # backend (Express)
  18081   # veramo-issuer
  18082   # veramo-verifier
  18083   # eudi-verifier
)

if ! command -v adb >/dev/null 2>&1; then
  echo "error: adb not found on PATH" >&2
  echo "       install android platform-tools, or skip this script if testing without a phone" >&2
  exit 1
fi

if ! adb get-state >/dev/null 2>&1; then
  echo "error: no Android device attached or device not authorised" >&2
  echo "       run 'adb devices' to debug" >&2
  exit 1
fi

for port in "${PORTS[@]}"; do
  adb reverse "tcp:$port" "tcp:$port"
  echo "forwarded device:$port -> host:$port"
done
