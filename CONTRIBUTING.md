# Contributing

Thanks for helping improve the C-Address Bridge frontend. This guide covers the local setup, project structure, Stellar/Soroban context, coding standards, and pull request checks expected for frontend contributions.

## Development Setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/<your-user>/-C-Address-Onboarding-Bridge--Frontend-.git
   cd -C-Address-Onboarding-Bridge--Frontend-
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Configure the required variables:

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_STELLAR_NETWORK` | Yes | Use `TESTNET` for development and `PUBLIC` for production. |
   | `NEXT_PUBLIC_BRIDGE_CONTRACT_ID` | Optional | Soroban bridge contract ID when contract routing is enabled. |
   | `NEXT_PUBLIC_MOONPAY_API_KEY` | Onramp flows | Moonpay publishable API key for fiat funding. |
   | `NEXT_PUBLIC_TRANSAK_API_KEY` | Onramp flows | Transak publishable API key for fiat funding. |

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000` and connect a Freighter wallet configured for the same Stellar network as `NEXT_PUBLIC_STELLAR_NETWORK`.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the production application. |
| `npm run start` | Serve a production build locally. |
| `npm run lint` | Run ESLint checks. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run test` | Run the Vitest test suite. |

Run `npm run lint`, `npm run typecheck`, and `npm run test` before opening a pull request. Run `npm run build` when changing routing, app shell behavior, environment handling, or wallet transaction flows.

## Project Structure

```text
src/
├── app/                  # Next.js App Router pages, layouts, and route states
│   ├── bridge/           # G-address to C-address bridge flow
│   ├── cex/              # CEX withdrawal routing flow
│   ├── dashboard/        # Wallet dashboard and balance views
│   └── onramp/           # Moonpay and Transak fiat funding flow
├── components/           # Shared UI and wallet provider components
└── lib/                  # Stellar integration, shared types, and constants
```

Keep route-specific behavior inside the matching `src/app/*` route. Put reusable visual elements in `src/components`, and keep network, wallet, transaction, and Soroban helper logic in `src/lib`.

## Stellar and Soroban Concepts

Contributors should understand these terms before changing funding or wallet flows:

- **G address**: a classic Stellar account address used for normal Stellar payments.
- **C address**: a Soroban smart contract address that can receive contract-routed funding.
- **Horizon**: the Stellar API used for classic account and payment data.
- **Soroban RPC**: the API used to simulate, submit, and inspect smart contract transactions.
- **Freighter**: the browser wallet used to connect accounts and sign Stellar transactions.
- **Testnet versus Public**: testnet is for development and must not be mixed with production contract IDs or live onramp configuration.

When changing transaction code, verify that the selected network, contract ID, destination address type, and signer account all refer to the same environment.

## Coding Standards

- Use TypeScript for application logic and keep public component props typed.
- Prefer small, focused React components with explicit loading, error, and empty states.
- Keep wallet and network side effects behind clear helper functions or provider methods.
- Avoid hard-coded addresses, API keys, contract IDs, and network URLs in components.
- Keep user-facing transaction copy precise; distinguish pending, submitted, confirmed, and failed states.
- Follow the existing Tailwind CSS and Next.js App Router patterns already used in the project.

## Testing Requirements

Every pull request should include the checks that match the change:

- UI-only changes: run `npm run lint` and manually verify the affected route in the browser.
- Type, helper, or integration changes: run `npm run typecheck` and `npm run test`.
- Wallet, bridge, CEX, or onramp changes: test on Stellar testnet with a non-production Freighter account.
- Routing or build configuration changes: run `npm run build`.

If a check cannot be run, explain why in the pull request and describe the manual validation that was completed instead.

## Pull Request Process

1. Create a branch with a focused name, such as `docs/contributing-guide` or `fix/bridge-error-state`.
2. Keep each pull request scoped to one issue or one related change set.
3. Include screenshots or recordings for visible UI changes.
4. Link the issue being fixed and summarize testing results.
5. Do not include secrets, personal wallet seeds, payment credentials, or production-only API keys in commits, screenshots, logs, or comments.

## Troubleshooting

- If Freighter does not connect, confirm the extension is installed, unlocked, and set to the same network as `NEXT_PUBLIC_STELLAR_NETWORK`.
- If balances or transaction status do not load, confirm the configured Stellar network is reachable and the address type matches the route being tested.
- If onramp flows fail locally, confirm the relevant Moonpay or Transak public key is configured and that the provider allows the selected test environment.
- If TypeScript fails after dependency updates, delete `node_modules`, reinstall with `npm install`, and rerun `npm run typecheck`.
