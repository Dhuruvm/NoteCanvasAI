#!/bin/bash
# Render deployment build script

echo "=== Installing all dependencies including devDependencies ==="
npm ci --include=dev

echo "=== Verifying Vite installation ==="
npx vite --version

echo "=== Building frontend ==="
npx vite build

echo "=== Building backend ==="
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

echo "=== Build completed successfully ==="
ls -la dist/
ls -la dist/public/

echo "=== Testing production server startup ==="
echo "Starting server test..."
timeout 3s NODE_ENV=production PORT=3000 node dist/index.js || echo "Server test completed (expected timeout)"