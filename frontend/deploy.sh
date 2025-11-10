#!/bin/bash
set -e

# 1. Install frontend dependencies
npm ci --force --cache .npm --prefer-offline

# 2. Build frontend
npm run build


# 3. Copy build output to Azure wwwroot/public folder
mkdir -p ../../wwwroot/public
cp -r dist/* ../../wwwroot/public/

echo "Frontend deploy script completed."
