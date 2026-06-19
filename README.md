# C-Address Bridge

The onboarding layer for Soroban dApps. Fund any Soroban smart account (C-address) directly — from a CEX withdrawal, a credit card, or an existing G-address.

## Features

- **G → C Bridge** — Send XLM or USDC from a Stellar G-address to a Soroban C-address via a single transaction.
- **Fiat Onramp** — Buy USDC with a credit/debit card via Moonpay or Transak and send directly to a C-address.
- **CEX Withdrawal Routing** — Withdraw from Binance, Coinbase, or Kraken to a bridge address that routes funds to your C-address.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** with Server Components
- **Tailwind CSS 4** with dark theme
- **Stellar SDK 15** (Horizon + Soroban RPC)
- **Freighter API 6** (wallet integration)
- **TypeScript 5**
- **Vitest** (testing)

## Getting Started

1. Clone and install:

   ```bash
   git clone <repo-url>
   cd c-address-bridge
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env.local
   ```

   Required env vars (see `.env.example` for all options):

   | Variable | Required | Description |
   |---|---|---|
   | `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | `TESTNET` or `PUBLIC` |
   | `NEXT_PUBLIC_BRIDGE_CONTRACT_ID` | No | Soroban bridge contract (omits direct payment) |
   | `NEXT_PUBLIC_MOONPAY_API_KEY` | For onramp | From [Moonpay dashboard](https://buy.moonpay.com) |
   | `NEXT_PUBLIC_TRANSAK_API_KEY` | For onramp | From [Transak dashboard](https://global.transak.com) |

3. Run:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).


## Docker Development

The repository includes Docker files for both hot-reload development and production-style local builds. Copy the environment file first so compose can pass the same public configuration into the container:

```bash
cp .env.example .env.local
docker compose up --build frontend
```

The development service mounts the repository into `/app`, keeps `node_modules` and `.next` in named volumes, enables file polling for reliable hot reloads, and serves the app at `http://localhost:3000`.

To verify the production image locally, use the production profile:

```bash
docker compose --profile production up --build frontend-prod
```

You can also build the images directly:

```bash
docker build -f Dockerfile.dev -t c-address-bridge:dev .
docker build -t c-address-bridge:prod .
```

Keep secrets out of Docker image layers. Use `.env.local` or shell environment variables for `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_BRIDGE_CONTRACT_ID`, `NEXT_PUBLIC_MOONPAY_API_KEY`, and `NEXT_PUBLIC_TRANSAK_API_KEY`.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run Vitest test suite |

## Architecture

```
src/
├── app/
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout with wallet provider + fonts
│   ├── error.tsx          # Error boundary
│   ├── loading.tsx        # Route loading state
│   ├── not-found.tsx      # 404 page
│   ├── bridge/            # G → C bridge flow
│   ├── cex/               # CEX withdrawal routing
│   ├── dashboard/         # Wallet dashboard with live balances
│   └── onramp/            # Fiat onramp (Moonpay/Transak)
├── components/
│   ├── footer.tsx
│   ├── navbar.tsx
│   ├── transaction-history.tsx
│   └── wallet-provider.tsx  # Wallet context provider
└── lib/
    ├── stellar.ts         # Stellar SDK + Freighter integration
    └── types.ts           # TypeScript types and constants
```

## How It Works

1. **Connect** your Freighter wallet or enter any Stellar address.
2. **Choose** a funding source: G-address, fiat card, or CEX withdrawal.
3. **Enter** the Soroban C-address you want to fund.
4. **Confirm** — sign with Freighter and submit to the Stellar network.

## License

MIT
