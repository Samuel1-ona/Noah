#!/bin/bash
# Production Trusted Setup Script for ZK-KYC
# This script downloads Perpetual Powers of Tau and sets up the circuit

set -e

echo "🔐 Production Trusted Setup for ZK-KYC"
echo "======================================"
echo ""

# Configuration
CIRCUIT_SIZE=28  # Powers of 2, adjust based on your circuit size (2^28 = 268M constraints)
PPOT_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final.ptau"
OUTPUT_DIR="./build"
SRS_FILE="$OUTPUT_DIR/powersOfTau28_hez_final.ptau"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if snarkjs is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx (Node.js) is required"
    echo "Install Node.js from: https://nodejs.org/"
    exit 1
fi

# Download Perpetual Powers of Tau if not exists
if [ ! -f "$SRS_FILE" ]; then
    echo "📥 Downloading Perpetual Powers of Tau ceremony file..."
    echo "   This may take a while (file is ~2GB)..."
    wget -O "$SRS_FILE" "$PPOT_URL" || {
        echo "❌ Failed to download PPOT file"
        echo "   You can download manually from:"
        echo "   $PPOT_URL"
        exit 1
    }
    echo "✅ Downloaded PPOT file"
else
    echo "✅ PPOT file already exists: $SRS_FILE"
fi

# Verify the file
echo ""
echo "🔍 Verifying PPOT file..."
npx snarkjs powersoftau verify "$SRS_FILE" || {
    echo "❌ PPOT file verification failed"
    exit 1
}
echo "✅ PPOT file verified"

# Note: For Groth16 with gnark, we need to convert the format
# However, gnark may use its own format. Let's check the circuit size first
echo ""
echo "📊 Circuit Information:"
echo "   Max constraints: 2^$CIRCUIT_SIZE = $((2**CIRCUIT_SIZE))"
echo ""
echo "⚠️  Note: gnark uses its own SRS format"
echo "   The PPOT file downloaded is in snarkjs format"
echo "   For production, you may need to:"
echo "   1. Use gnark's built-in SRS generation (secure for production)"
echo "   2. Or convert PPOT to gnark format (if supported)"
echo ""
echo "✅ Setup preparation complete!"
echo ""
echo "Next steps:"
echo "  1. Run: cd cmd/generate-verifier && go run main.go -srs ../../build/powersOfTau28_hez_final.ptau"
echo "  2. Or use gnark's production setup (recommended)"

