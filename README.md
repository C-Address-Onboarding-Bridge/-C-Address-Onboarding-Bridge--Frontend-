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

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run Vitest test suite |

## Mock Data (Development)

Developers without a Freighter wallet or live Stellar network can use the built-in mock layer:

1. Enable mock mode:

   ```bash
   # Option A: environment variable (persists across restarts)
   echo 'NEXT_PUBLIC_DEV_MOCK=true' >> .env.local

   # Option B: browser console (session only)
   localStorage.setItem('dev_mock', 'true')
   ```

2. The app will use mock addresses, balances, and transaction history instead of live data.

3. Available mock states:
   - **Funded account**: 100 XLM + 50 USDC balance with transaction history
   - **Empty account**: 1 XLM balance, no transactions
   - **Network error**: Simulates Horizon connection failure

4. Import mocks directly in tests:

   ```typescript
   import { mockFreighterApi, MOCK_TRANSACTIONS, mockHorizonAccount } from "@/lib/mock-data";
   ```

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

## Contract Deployment

The `/contracts` admin page lets developers deploy and manage Soroban bridge contracts directly from the browser using Freighter.

### Enable the admin page

```bash
# .env.local
NEXT_PUBLIC_CONTRACTS_ADMIN=true
```

Navigate to [http://localhost:3000/contracts](http://localhost:3000/contracts). Freighter must be connected.

### Deploy a new contract

1. Build your Soroban contract: `cargo build --release --target wasm32-unknown-unknown`
2. On the admin page, upload the `.wasm` file and click **Deploy**.
3. Freighter will prompt for two signatures: one to upload the WASM, one to create the contract instance.
4. Copy the resulting contract ID into `.env.local`:
   ```
   NEXT_PUBLIC_BRIDGE_CONTRACT_ID_TESTNET=C…
   NEXT_PUBLIC_BRIDGE_CONTRACT_ID_MAINNET=C…
   ```

### Upgrade an existing contract

The contract must expose a `__upgrade(new_wasm_hash: bytes)` entrypoint and the signing address must be the contract admin.

1. Build and upload the new WASM to get its hash (use the **Deploy** flow or `stellar contract upload`).
2. On the **Upgrade Contract** panel, enter the contract ID and new WASM hash, then click **Upgrade**.

### Inspect contract state

Enter any contract C-address in the **Inspect Contract** panel to fetch its on-chain WASM hash and latest ledger from Soroban RPC.

## License

MIT
