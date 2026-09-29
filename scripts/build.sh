#!/bin/sh
# Package the extension into dist/kitsumizen.zip (works for Chrome Web Store and Firefox AMO).
set -e
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/kitsumizen.zip
zip -r dist/kitsumizen.zip manifest.json src icons LICENSE
echo "Built dist/kitsumizen.zip"
