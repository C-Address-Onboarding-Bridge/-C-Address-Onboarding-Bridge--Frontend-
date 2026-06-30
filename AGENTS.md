# C-Address Bridge — AI Contributor Guide

## Project Overview

C-Address Bridge is the onboarding layer for Soroban dApps on Stellar. It lets users fund any Soroban smart account (C-address) from three sources:

- **G → C Bridge** — Send XLM/USDC from a Stellar G-address to a C-address
- **Fiat Onramp** — Buy USDC via Moonpay/Transak and send directly to a C-address
- **CEX Withdrawal** — Route Binance/Coinbase/Kraken withdrawals through a bridge address

## Repository Structure

```
/
├── .github/workflows/ci.yml   # CI: frontend build, backend build, contract build+tests
├── .husky/pre-push             # Pre-push hooks (same checks as CI)
├── public/cex/                 # CEX logo SVGs
├── src/                        # Next.js App Router frontend
│   ├── app/                    # Pages: /, /bridge, /cex, /dashboard, /onramp
│   ├── components/             # Shared React components
│   └── lib/                    # Stellar SDK integration, types & constants
├── backend/                    # (optional) Backend service, if present
└── contracts/                  # (optional) Soroban smart contracts, if present
```

## Key Facts (read before editing)

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4
- **Language**: TypeScript 5, strict mode
- **Testing**: Vitest (run with `npm run test`)
- **Linting**: ESLint 9 with `eslint-config-next` (run with `npm run lint`)
- **Type checking**: `tsc --noEmit` (run with `npm run typecheck`)
- **Wallet**: Freighter browser extension via `@stellar/freighter-api`
- **Stellar SDK**: `@stellar/stellar-sdk` v15 (Horizon + Soroban RPC)

## What to Push / Not Push

### Push:

- Source code under `src/`, `backend/`, `contracts/`
- Configuration: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`
- CI: `.github/workflows/ci.yml`
- Git hooks: `.husky/` (entire directory)
- Environment template: `.env.example`
- Public assets: `public/` (project-specific SVGs only)

### Do NOT push:

- `.next/`, `node_modules/`, `out/`, `build/`, `coverage/`
- `.env.local`, `.env.production`, or any actual `.env*` file (tracked via `.env.example`)
- `*.tsbuildinfo`, `next-env.d.ts`
- `tsconfig.tsbuildinfo`
- AI-agent artifact files (e.g. `.claude/`, `.cursor/`, `.windsurf/`, old `CLAUDE.md`)
- Build artifacts, logs, debug output

## Verifying Task Completion

Before finishing any task, run these commands from the repo root:

```sh
# Frontend checks
npm run lint           # ESLint — no errors
npm run typecheck      # TypeScript — no errors
npm run test           # Vitest — all tests pass
npm run build          # Next.js production build — succeeds

# Backend (if backend/ exists)
cd backend && npm run build

# Contracts (if contracts/ exists)
cd contracts && cargo build --release && cargo test
```

If any of these fail, the task is not complete.

## Conventions

- No AI-generated comments in source files unless the user explicitly asks
- Match existing code style (dark theme, CSS variables from `globals.css`, Tailwind v4 utilities)
- Server components by default; add `"use client"` only when interactivity is needed
- No emoji in code or commit messages unless requested
