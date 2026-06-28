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

| Term | What it means |
|---|---|
| G-address | Classic Stellar account (`G` + 55 chars). Holds XLM/tokens, signs transactions. |
| C-address | Soroban smart contract address (`C` + 55 chars). Cannot sign; controlled by contract logic. |
| Horizon | Stellar's HTTP API for classic (non-contract) operations. |
| Soroban RPC | JSON-RPC endpoint for simulating and submitting contract transactions. |
| Freighter | Browser wallet extension that stores the user's key and signs transactions. |
| Stroop | Smallest XLM unit. 1 XLM = 10,000,000 stroops. Fees are denominated in stroops. |
| SEP-41 | Token standard for Soroban (analogous to ERC-20). |
| Trustline | Permission an account must grant before it can hold a non-XLM asset. |

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

## Submitting a Pull Request

1. Branch off `main`: `git checkout -b feat/short-description`
2. Make your changes and ensure all checks pass.
3. Commit with a short, descriptive message (no emoji, no AI filler).
4. Push and open a PR against `main`.
5. Fill in the PR description: what changed, what was tested, any known limitations.

PRs that fail lint, typecheck, or tests will not be merged.
