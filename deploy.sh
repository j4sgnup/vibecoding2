

#!/bin/bash
# Custom deployment script for Azure App Service
# 1. Build frontend in root
echo "Building frontend..."
# 2. Copy frontend build output to wwwroot/public (IIS will serve static files from here)
# 4. Copy backend build and dependencies to wwwroot
echo "Deployment script completed."
#!/bin/bash
set -e

# Run frontend deploy
cd frontend
./deploy.sh
cd ..

# Run backend deploy
cd backend
./deploy.sh
cd ../wwwroot

# Change directory to wwwroot, install dependencies, and start backend
cd ../wwwroot
rm -rf node_modules
npm ci --force --cache .npm --prefer-offline
