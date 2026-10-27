#!/usr/bin/env bash
# Builds the app and packs a self-contained release: release/altyn-english.tar.gz
# On the server: extract, create .env next to server.js, run `node server.js`.
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build

OUT=release/altyn-english
rm -rf release
mkdir -p "$OUT"
cp -r .next/standalone/. "$OUT/"
cp -r .next/static "$OUT/.next/static"
[ -d public ] && cp -r public "$OUT/public"

# Never ship local secrets; the server gets its own .env
rm -f "$OUT"/.env*
cp .env.example "$OUT/.env.example"

# Migrations, so the database schema can be updated from the server if needed
mkdir -p "$OUT/prisma"
cp -r prisma/schema.prisma prisma/migrations "$OUT/prisma/"

tar -czf release/altyn-english.tar.gz -C release altyn-english
echo "Release: release/altyn-english.tar.gz ($(du -h release/altyn-english.tar.gz | cut -f1))"
