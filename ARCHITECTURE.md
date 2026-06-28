# Architecture

## High-level overview

C-Address Bridge is a **pure client-side Next.js application** — there is no
proprietary backend server.  All business logic runs in the browser:

```
Browser
  └── Next.js (App Router, React 19)
        ├── UI components (Tailwind CSS 4)
        ├── Wallet layer  (wallet-adapters.ts + wallet-provider.tsx)
        └── Stellar layer (stellar.ts)
              ├── Horizon REST API   — classic account/payment data
              └── Soroban RPC        — smart-contract simulation & invocation
```

Third-party services (Moonpay, Transak, CEX exchanges) are integrated via
redirects or embedded iframes — no server-side proxying occurs.

## Component tree and data flow

```
layout.tsx
  └── WalletProvider          ← holds wallet state (address, network, activeWalletId)
        └── page / route
              ├── navbar.tsx  ← reads useWallet() to show connect button / address
              ├── bridge/     ← calls buildAndSubmitPayment / bridgeViaContract
              ├── dashboard/  ← calls getAccountBalances / fetchRecentTransactions
              ├── onramp/     ← redirects to Moonpay / Transak widget
              ├── cex/        ← displays CEX withdrawal instructions
              └── contracts/  ← admin: deployContract / upgradeContract / getContractState
```

Data flows downward through React context; Stellar calls are made directly from
page components and custom hooks — there is no Redux or Zustand store.

## Stellar integration

### Classic (Horizon)

Used for G-address accounts: balance queries, payment operations, trustlines,
and transaction history via `getAccountBalances`, `fetchRecentTransactions`, and
`buildAndSubmitPayment` in `src/lib/stellar.ts`.

### Soroban (RPC)

Used for C-address smart accounts and the optional bridge contract:

1. **Simulation** — `simulateTransaction` runs the contract call off-chain to
   determine the ledger footprint and resource fees before the user signs.
2. **Invocation** — `sendTransaction` submits the signed envelope; the result is
   polled with `pollTransaction` because Soroban is async (consensus takes ~5 s).

### Wallet signing

`src/lib/stellar.ts` exposes a `TxSigner` type:

```ts
type TxSigner = (xdr: string, networkPassphrase: string) => Promise<string>;
```

Functions that require a signature accept an optional `signer` parameter
(default: Freighter).  The active wallet adapter from `WalletProvider` supplies
its `signTransaction` method as the signer, enabling any supported wallet to
sign transactions without changing the core Stellar logic.

## Wallet layer

`src/lib/wallet-adapters.ts` defines one `WalletAdapter` per wallet:

| Adapter   | Detection           | Notes |
|-----------|---------------------|-------|
| Freighter | `window.freighter`  | Default; uses `@stellar/freighter-api` |
| Lobstr    | `window.lobstr`     | Extension injects its own API |
| xBull     | `window.xBullSDK`   | Extension injects SDK object |
| Albedo    | `window.albedo`     | Web-based pop-up signer, no extension needed |

`WalletProvider` detects available wallets at mount, persists the user's last
choice in `localStorage`, and exposes `switchWallet(id)` which disconnects the
current adapter and reconnects via the chosen one — no page reload required.

## State management

| Concern | Where |
|---------|-------|
| Wallet connection, address, network | `WalletContext` (React context) |
| User preferences (recent addresses) | `localStorage` via `user-preferences.ts` |
| App network selection | `localStorage` (`stellar_app_network`) |
| Active wallet selection | `localStorage` (`stellar_active_wallet`) |
| Transaction/balance data | Local component state + custom hooks |

There is no global client-side cache beyond what the browser provides.

## Key design decisions and trade-offs

**No backend by design** — simplifies deployment (static host / Vercel) and
removes a trust surface.  The trade-off is that all RPC calls go directly from
the user's browser to Stellar public infrastructure, which means no
request-level rate-limiting, caching, or IP shielding.

**Polling instead of streaming** — the wallet connection is checked every 3 s
(`WALLET_POLL_INTERVAL_MS`) rather than via extension events.  This is simpler
and portable across wallets, at the cost of a short lag when the user switches
accounts in the extension.

**Adapter pattern for wallets** — each wallet gets its own adapter module behind
a common interface.  Adding a new wallet requires one new adapter file with no
changes to the rest of the app.

**Soroban simulation before signing** — `prepareTransaction` is called before
presenting the transaction to the wallet.  This populates fees automatically and
catches contract errors before the user is prompted, improving UX.

## Future architecture evolution

A backend server would become necessary when:

- **Rate limiting** — public Horizon/RPC endpoints impose per-IP limits; a
  backend proxy can pool keys and cache responses.
- **Server-side fee bumping** — a service account can wrap user transactions in
  fee-bump envelopes so users don't need XLM for fees (sponsored transactions).
- **Webhook / notification service** — listening for on-chain events to send
  email/push notifications requires a persistent server process.
- **KYC / compliance** — fiat onramp providers may require server-side identity
  verification steps that cannot be done in the browser.
- **Private RPC node** — for production reliability, a dedicated Soroban RPC
  node behind the backend avoids dependency on public infrastructure uptime.
