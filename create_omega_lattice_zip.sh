#!/bin/bash

# OMEGA LATTICE: Strategic Core Packager
# This script bundles the hardened monorepo into a production-ready ZIP.

set -e

ZIP_NAME="omega-lattice.zip"
echo "--- 📦 PREPARING OMEGA LATTICE DISTRIBUTION [${ZIP_NAME}] ---"

# Clean previous artifacts
rm -f "$ZIP_NAME"

# Create a temporary staging area
STAGING="omega_staging"
rm -rf "$STAGING"
mkdir -p "$STAGING"

# Select critical production files
echo "--- 🏗️ Selection of Core Modules ---"
cp -r apps "$STAGING/"
cp -r src "$STAGING/"
cp -r scripts "$STAGING/"
cp -r public "$STAGING/" 2>/dev/null || true
cp package.json "$STAGING/"
cp tsconfig.json "$STAGING/"
cp vite.config.ts "$STAGING/"
cp index.html "$STAGING/"
cp metadata.json "$STAGING/"
cp .env.example "$STAGING/"
cp README.md "$STAGING/"
cp DEPLOY.md "$STAGING/"

# Zip the staging area
echo "--- 🤐 Compressing Artifacts ---"
cd "$STAGING"
zip -r "../$ZIP_NAME" . -x "**/node_modules/*" "**/dist/*" "**/.git/*"
cd ..

# Cleanup
rm -rf "$STAGING"

echo "--------------------------------------------------------"
echo "✅ ARCHIVE COMPLETE: ${ZIP_NAME}"
echo "Ready for production handover or backup."
echo "--------------------------------------------------------"
