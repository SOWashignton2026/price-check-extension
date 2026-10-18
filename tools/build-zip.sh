#!/usr/bin/env bash
# Zip extension/ with files at the archive root (manifest.json at the top level).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/price-check-extension.zip}"
mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(
  cd "$ROOT/extension"
  zip -r "$OUT" . -x '*.DS_Store' -x '__MACOSX/*'
)
echo "Wrote $OUT"
