# Contributing to C-Address Bridge

## Prerequisites

- Node.js 22+
- npm 10+
- [Freighter](https://freighter.app/) browser extension (for manual testing)
- Git

## Setup

```bash
git clone <repo-url>
cd c-address-bridge
npm install
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:

```
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
```

Start the dev server:

```bash
npm run dev   # http://localhost:3000
```

## Project Architecture

```
src/
├── app/           # Next.js App Router pages (server components by default)
│   ├── bridge/    # G → C bridge flow
│   ├── cex/       # CEX withdrawal routing
│   ├── dashboard/ # Live wallet balances + transaction history
│   ├── onramp/    # Fiat onramp (Moonpay / Transak)
│   └── contracts/ # Admin: deploy / upgrade / inspect Soroban contracts
├── components/    # Shared React components (client components use "use client")
├── lib/
│   ├── stellar.ts # All Stellar SDK + Freighter calls — the core library
│   ├── types.ts   # Shared TypeScript types and constants
│   └── ...        # Fee stats, rate limiting, sanitization, secure storage, etc.
├── hooks/         # Reusable React hooks
├── services/      # Soroban RPC service wrappers
└── config/        # Network configuration
```

Key principle: keep all Stellar/Soroban network calls inside `src/lib/stellar.ts` or `src/services/`. Pages and components call these functions; they do not import the Stellar SDK directly.

## Stellar / Soroban Concepts You Need

| Term        | What it means                                                                               |
| ----------- | ------------------------------------------------------------------------------------------- |
| G-address   | Classic Stellar account (`G` + 55 chars). Holds XLM/tokens, signs transactions.             |
| C-address   | Soroban smart contract address (`C` + 55 chars). Cannot sign; controlled by contract logic. |
| Horizon     | Stellar's HTTP API for classic (non-contract) operations.                                   |
| Soroban RPC | JSON-RPC endpoint for simulating and submitting contract transactions.                      |
| Freighter   | Browser wallet extension that stores the user's key and signs transactions.                 |
| Stroop      | Smallest XLM unit. 1 XLM = 10,000,000 stroops. Fees are denominated in stroops.             |
| SEP-41      | Token standard for Soroban (analogous to ERC-20).                                           |
| Trustline   | Permission an account must grant before it can hold a non-XLM asset.                        |

## Coding Standards

- **TypeScript strict mode** — no `any` except where unavoidable (comment why).
- **Server components by default.** Add `"use client"` only when interactivity requires it.
- **CSS** — use Tailwind v4 utilities and the CSS variables defined in `globals.css`. No inline styles.
- **No AI-generated comments** in source files unless the user explicitly requests them.
- **No emoji** in code or commit messages.
- Keep functions small and pure where possible. Side-effectful code belongs in `lib/` or `services/`.

## Running Checks

All of these must pass before submitting a PR:

```bash
npm run lint        # ESLint — no errors
npm run typecheck   # TypeScript — no errors
npm run test        # Vitest unit tests — all pass
npm run build       # Next.js production build — succeeds
```

E2E tests (requires a running dev server or built app):

```bash
npm run test:e2e
```

## Upgrading the Stellar SDK

The `@stellar/stellar-sdk` and `@stellar/freighter-api` versions are pinned exactly in `package.json` (no `^` caret). This is intentional — the Stellar SDK moves fast and caret ranges have caused silent breakage in the past.

Dependabot is configured to open a PR when a new version is available. Before merging any SDK upgrade PR:

### Upgrade checklist

1. Read the SDK release notes / changelog for breaking changes.
2. Run the full check suite locally:
   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```
3. Pay special attention to the integration test suite:
   ```bash
   npx vitest run src/__tests__/stellar-sdk-integration.test.ts
   ```
   These tests validate the behaviour the abstraction layer depends on. A failure here means `src/lib/stellar-sdk.ts` needs to be updated before the upgrade is safe to merge.
4. Check `src/lib/stellar-sdk.ts` for any API surface that changed. The abstraction layer exports wrappers for the most version-sensitive areas:
   - `isSimulationError` / `getSimulationMinFee` / `getSimulationRetval` — Soroban RPC response shape
   - `checkFreighterConnection` / `getFreighterAddress` / `getFreighterNetwork` / `signWithFreighter` — Freighter API return shapes
   - `createHorizonServer` / `createSorobanServer` — server construction
   - `transactionFromXDR` / `addressFromString` — transaction and address helpers
5. Update the version pins in `package.json` to the new exact version.
6. Run `npm install` to update `package-lock.json`, then commit both files together.
7. Do not merge if any check fails.

### Adding new SDK calls

When adding new code that calls the Stellar SDK directly:
- Import from `@/lib/stellar-sdk`, not from `@stellar/stellar-sdk` or `@stellar/freighter-api`.
- If the SDK functionality you need is not yet exported by `stellar-sdk.ts`, add a thin wrapper there first.
- Add a test in `src/__tests__/stellar-sdk-integration.test.ts` that covers the new wrapper's behaviour, including its response-shape assumptions.

## Submitting a Pull Request

1. Branch off `main`: `git checkout -b feat/short-description`
2. Make your changes and ensure all checks pass.
3. Commit with a short, descriptive message (no emoji, no AI filler).
4. Push and open a PR against `main`.
5. Fill in the PR description: what changed, what was tested, any known limitations.

PRs that fail lint, typecheck, or tests will not be merged.
