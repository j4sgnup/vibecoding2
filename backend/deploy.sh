#!/bin/bash
set -e

# 1. Install backend dependencies
npm ci --force --cache .npm --prefer-offline

# 2. Build backend
npm run build


# 3. Copy backend build output to Azure wwwroot/dist folder
mkdir -p ../../wwwroot/dist
cp -r dist/* ../../wwwroot/dist/

# 4. Copy backend package.json to root

# 4. Copy backend package.json to root
cp package.json ../../
cp package-lock.json ../../ 2>/dev/null || true

echo "Backend deploy script completed."
