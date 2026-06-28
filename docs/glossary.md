# Stellar / Soroban Glossary

A reference for the key concepts used in C-Address Bridge.

---

## Addresses

### G-address
A classic Stellar account address. Starts with `G`, 56 characters total (base32-encoded Ed25519 public key). G-addresses can hold XLM and other assets, sign transactions, and interact with both Horizon and Soroban.

### C-address
A Soroban smart contract address. Starts with `C`, 56 characters total. C-addresses are deployed contracts — they cannot sign transactions themselves; their behaviour is defined by on-chain WASM code.

---

## Networks and Infrastructure

### Stellar Network
A decentralized layer-1 blockchain with ~5-second finality and sub-cent fees. Supports classic payments, DEX, and (via Soroban) general-purpose smart contracts.

### Horizon
The REST API layer for the classic (pre-Soroban) Stellar network. Used to load accounts, fetch balances, submit payment transactions, and stream events. SDK entry point: `Horizon.Server`.

### Soroban
Stellar's smart contract platform, enabled by Protocol 20. Contracts are written in Rust, compiled to WASM, and deployed to C-addresses. Interactions are signed by G-addresses and processed by validators.

### Soroban RPC
A JSON-RPC endpoint (`rpc.Server` in the SDK) used to simulate transactions, submit contract invocations, and read ledger state. Separate from Horizon.

### Testnet
A public test network with free testnet XLM available from [Friendbot](https://friendbot.stellar.org). Use `NEXT_PUBLIC_STELLAR_NETWORK=TESTNET` during development.

### Mainnet (PUBLIC)
The production Stellar network. Real funds. Use with care.

---

## Wallets and Signing

### Freighter
A browser extension wallet for Stellar. Stores the user's private key and signs transactions on request. Integrated via `@stellar/freighter-api`. [freighter.app](https://www.freighter.app/)

### Transaction Signing
Stellar transactions must be signed by the source account's private key before submission. In this app, Freighter signs all user-initiated transactions — the app never touches private keys.

### Network Passphrase
A string that uniquely identifies a Stellar network and is included in every transaction signature to prevent replay attacks across networks (e.g. testnet transactions can't be replayed on mainnet).

---

## Assets and Fees

### XLM (Lumen)
The native asset of the Stellar network. Used to pay transaction fees and maintain account reserves. 1 XLM = 10,000,000 stroops.

### Stroop
The smallest unit of XLM (0.0000001 XLM). Transaction fees are quoted in stroops. The base fee is 100 stroops (~$0.00001).

### Trustline
Before an account can hold a non-XLM asset (e.g. USDC), it must establish a trustline to that asset via a `changeTrust` operation. This reserves a small amount of XLM.

### SEP-41
The Soroban token standard (analogous to ERC-20 on Ethereum). Defines `balance`, `transfer`, `approve`, `allowance`, `symbol`, `decimals`, and other methods. All Soroban tokens in this app implement SEP-41.

### Base Reserve
The minimum XLM balance every Stellar account must maintain (currently 1 XLM base + 0.5 XLM per additional entry such as trustlines). Accounts below this reserve cannot submit transactions.

---

## Bridge Concepts

### Bridge Flow

```
User (G-address)
    │
    │ signs payment tx via Freighter
    ▼
Bridge Contract (C-address)   ──or──   Direct payment
    │
    │ contract logic routes funds
    ▼
Target C-address (Soroban smart account)
```

1. User connects Freighter and enters the target C-address.
2. The app builds a Stellar payment to either the bridge contract or directly to the C-address.
3. Freighter signs the transaction.
4. The transaction is submitted to Horizon (classic payment) or Soroban RPC (contract invocation).
5. The bridge contract (if present) routes funds to the target C-address.

### Classic Payment vs Contract Invocation

| | Classic payment | Contract invocation |
|---|---|---|
| API | Horizon | Soroban RPC |
| Destination | Any G- or C-address | A specific contract method |
| Simulation required | No | Yes (populates footprint + fees) |
| Confirmation polling | Not needed (synchronous result) | Yes (async, poll until SUCCESS) |
| Used when | `BRIDGE_CONTRACT_ID` is unset | `BRIDGE_CONTRACT_ID` is set |

### Soroban Simulation
Before submitting a contract transaction, it must be simulated against the current ledger state. Simulation populates the transaction's resource footprint (storage keys accessed) and calculates the exact fee. See `server.prepareTransaction()`.

---

## Further Reading

- [Stellar Developer Docs](https://developers.stellar.org/docs)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [SEP-41 Token Standard](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md)
- [Horizon API Reference](https://developers.stellar.org/api/horizon)
- [Freighter API](https://github.com/stellar/freighter)
- [Stellar Expert Explorer](https://stellar.expert)
