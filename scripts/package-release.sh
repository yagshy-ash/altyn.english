#!/usr/bin/env bash
# Builds the app into deploy/ (committed to git). On the server: git pull, then restart node deploy/server.js.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

OUT=deploy
rm -rf "$OUT"
mkdir -p "$OUT"
cp -r .next/standalone/. "$OUT/"
cp -r .next/static "$OUT/.next/static"
[ -d public ] && cp -r public "$OUT/public"

# Never commit local secrets; the server keeps its own deploy/.env
rm -f "$OUT"/.env*

echo "Build ready in $OUT/ — commit and push it."
