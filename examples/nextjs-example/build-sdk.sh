#!/bin/bash
set -e

# Build SDK (paths are relative to examples/nextjs-example when rootDirectory is set)
echo "Building SDK..."
cd ../../packages/noah-sdk
npm install
npm run build

# Install Next.js example dependencies
echo "Installing Next.js example dependencies..."
cd ../../examples/nextjs-example
npm install

echo "Build preparation complete!"

