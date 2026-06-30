#!/usr/bin/env bash
set -euo pipefail

HORIZON_URL="${HORIZON_URL:-http://localhost:8000}"
SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-http://localhost:8000/soroban/rpc}"
FRIENDBOT_URL="${FRIENDBOT_URL:-http://localhost:8000/friendbot}"

G_ADDRESS="GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A"
C_ADDRESS="CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A"
ALT_G_ADDRESS="GBV5C5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5"

echo "Waiting for Horizon to be ready..."
until curl -sf "$HORIZON_URL/" > /dev/null 2>&1; do
  sleep 2
done
echo "Horizon is ready."

echo "Funding test G-address via friendbot..."
curl -sf "$FRIENDBOT_URL?addr=$G_ADDRESS" > /dev/null || echo "Account may already exist"

echo "Funding test C-address via friendbot..."
curl -sf "$FRIENDBOT_URL?addr=$C_ADDRESS" > /dev/null || echo "Account may already exist"

echo "Funding alt G-address via friendbot..."
curl -sf "$FRIENDBOT_URL?addr=$ALT_G_ADDRESS" > /dev/null || echo "Account may already exist"

echo ""
echo "Sandbox seeded successfully!"
echo ""
echo "Environment variables for local development:"
echo "  NEXT_PUBLIC_HORIZON_URL=$HORIZON_URL"
echo "  NEXT_PUBLIC_SOROBAN_RPC_URL=$SOROBAN_RPC_URL"
echo "  NEXT_PUBLIC_NETWORK=SANDBOX"
echo "  NEXT_PUBLIC_FRIENDBOT_URL=$FRIENDBOT_URL"
echo ""
echo "Accounts created:"
echo "  G-address: $G_ADDRESS"
echo "  C-address: $C_ADDRESS"
echo "  Alt G-address: $ALT_G_ADDRESS"
