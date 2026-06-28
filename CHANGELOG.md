# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-27

### Added
- G → C Bridge: send XLM/USDC from a Stellar G-address to a Soroban C-address
- Fiat onramp via Moonpay and Transak to fund C-addresses directly
- CEX withdrawal routing (Binance, Coinbase, Kraken) through a bridge address
- `/contracts` admin page for deploying, upgrading, and inspecting Soroban contracts
- Freighter wallet integration (connect, sign, network detection)
- Soroban RPC integration: token balances, allowances, contract invocation
- Event-driven transaction updates via Horizon streaming
- Multi-step bridge form with step transitions and indicator
- Toast notification system with pending/confirmed/failed variants and tx hash links
- Skeleton loaders replacing spinners throughout the UI
- Wallet permissions panel and onboarding tour
- `useMultiStepForm` hook extracted from bridge page
- Barrel exports and runtime environment variable validation
- Soroban transaction simulation before submission
- CEX address verification component
- Fee selector with Horizon fee-stats integration
- Rate limiting, sanitization, and secure storage utilities
- Full Vitest unit test suite, Playwright e2e tests, and Pact contract tests
- Mutation testing with Stryker (advisory)
- CI workflow: lint, typecheck, test, build, e2e, pact, mutation

[Unreleased]: https://github.com/C-Address-Onboarding-Bridge/-C-Address-Onboarding-Bridge--Frontend-/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/C-Address-Onboarding-Bridge/-C-Address-Onboarding-Bridge--Frontend-/releases/tag/v0.1.0
