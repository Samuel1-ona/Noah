#!/bin/bash

# Script to restart backend services
# This will pick up the new contract address from deployments.json

echo "🔄 Restarting Backend Services..."
echo ""

# Find and kill existing node processes on backend ports
echo "Stopping existing services..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || echo "No process on port 3000"
lsof -ti :3001 | xargs kill -9 2>/dev/null || echo "No process on port 3001"
lsof -ti :3002 | xargs kill -9 2>/dev/null || echo "No process on port 3002"
lsof -ti :3003 | xargs kill -9 2>/dev/null || echo "No process on port 3003"
lsof -ti :3004 | xargs kill -9 2>/dev/null || echo "No process on port 3004"

sleep 2

echo ""
echo "✅ Services stopped"
echo ""
echo "📝 To start services, run in separate terminals:"
echo ""
echo "  Terminal 1: cd /Users/machine/Documents/Pyp/backend && npm run gateway:dev"
echo "  Terminal 2: cd /Users/machine/Documents/Pyp/backend && npm run issuer:dev"
echo "  Terminal 3: cd /Users/machine/Documents/Pyp/backend && npm run user:dev"
echo "  Terminal 4: cd /Users/machine/Documents/Pyp/backend && npm run protocol:dev"
echo "  Terminal 5: cd /Users/machine/Documents/Pyp/backend && npm run proof:dev"
echo ""
echo "Or use your process manager (pm2, supervisor, etc.)"
echo ""
echo "✅ New contract address will be loaded from deployments.json:"
echo "   ProtocolAccessControl: 0x39Ffc9aF99539D9C0C215D88F00aE2e33aF12fd8"

