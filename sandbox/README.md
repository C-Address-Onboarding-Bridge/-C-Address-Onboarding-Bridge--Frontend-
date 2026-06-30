# Stellar Sandbox (Standalone Network)

A Docker-based Stellar standalone network for local development and CI testing. Includes Horizon, Soroban RPC, and Friendbot.

## Prerequisites

- Docker and Docker Compose v2
- Node.js 22+

## Quick Start

```bash
# Start the sandbox
docker compose -f sandbox/docker-compose.yml up -d

# Wait for Horizon to be ready (≈30s)
# Then seed test accounts
bash sandbox/scripts/seed-sandbox.sh
```

The sandbox exposes:
- **Horizon**: http://localhost:8000
- **Soroban RPC**: http://localhost:8000/soroban/rpc
- **Friendbot**: http://localhost:8000/friendbot

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_NETWORK=SANDBOX
NEXT_PUBLIC_HORIZON_URL=http://localhost:8000
NEXT_PUBLIC_SOROBAN_RPC_URL=http://localhost:8000/soroban/rpc
NEXT_PUBLIC_FRIENDBOT_URL=http://localhost:8000/friendbot
```

## Running Tests

```bash
# Ensure sandbox is running and seeded
bash sandbox/scripts/seed-sandbox.sh
npm test
```

## Seeded Accounts

| Address | Type | Description |
|---------|------|-------------|
| `GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A` | G-address | Primary test account |
| `CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A` | C-address | Soroban contract account |
| `GBV5C5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5Q5Z5` | G-address | Secondary test account |

## CI Integration

The sandbox runs as a CI service container (see `.github/workflows/ci.yml`). Tests that depend
on a live Stellar network use the sandbox instead of the public testnet, eliminating flakiness.

## Stopping the Sandbox

```bash
docker compose -f sandbox/docker-compose.yml down -v
```
