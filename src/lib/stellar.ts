import {
  isConnected,
  getAddress,
  signTransaction as freighterSignTransaction,
  getNetwork,
} from "@stellar/freighter-api";

/**
 * Wallet-agnostic signer function.  Matches the signature of each
 * WalletAdapter.signTransaction so callers can pass any adapter's signer
 * instead of being hard-wired to Freighter.
 * Falls back to Freighter when omitted.
 */
export type TxSigner = (xdr: string, networkPassphrase: string) => Promise<string>;

/** Default signer — wraps Freighter's API into the TxSigner shape. */
async function defaultSigner(xdr: string, networkPassphrase: string): Promise<string> {
  const result = await freighterSignTransaction(xdr, { networkPassphrase });
  if ("error" in result && result.error) throw new Error(`Freighter signing failed: ${result.error}`);
  return (result as { signedTxXdr: string }).signedTxXdr;
}
import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Networks,
  Asset,
  Horizon,
  rpc,
  Contract,
  Address,
  Account,
  nativeToScVal,
  scValToNative,
  StrKey,
} from "@stellar/stellar-sdk";
import {
  BRIDGE_CONTRACT_ID,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  type PaymentResult,
  type AccountBalances,
  type BridgeTransaction,
} from "./types";
import {
  ASSET_XLM,
  NATIVE_ASSET_TYPE,
  UNKNOWN_ASSET,
  STELLAR_ADDRESS_REGEX,
  STELLAR_ADDRESS_LENGTH,
  NETWORK_PUBLIC,
  DEFAULT_NETWORK,
  DEFAULT_TX_LIMIT,
  STELLAR_TX_TIMEOUT_SECONDS,
  ACCOUNT_MIN_BALANCE,
  EXPLORER_BASE_URLS,
  STATUS_CONFIRMED,
  STATUS_FAILED,
  STATUS_PENDING,
  BALANCE_INITIAL,
  TX_TYPE_G_TO_C,
  ENV_BRIDGE_CONTRACT_ID,
  ENV_MOONPAY_API_KEY,
  ENV_TRANSAK_API_KEY,
} from "./constants";

export type { BridgeTransaction as BridgeTransactionData } from "./types";
export type { PaymentResult, AccountBalances } from "./types";

/**
 * Returns a Horizon HTTP client for the given Stellar network.
 *
 * @param network - `"PUBLIC"` for mainnet or `"TESTNET"` for the test network.
 * @returns A configured {@link Horizon.Server} instance.
 *
 * @example
 * const server = getHorizonServer("TESTNET");
 * const account = await server.loadAccount("G...");
 */
export function getHorizonServer(network: "PUBLIC" | "TESTNET"): Horizon.Server {
  return new Horizon.Server(HORIZON_URL[network]);
}

/**
 * Returns a Soroban RPC client for the given Stellar network.
 *
 * @param network - `"PUBLIC"` for mainnet or `"TESTNET"` for the test network.
 * @returns A configured {@link rpc.Server} instance.
 *
 * @example
 * const rpcServer = getSorobanRpcServer("TESTNET");
 * const account = await rpcServer.getAccount("G...");
 */
export function getSorobanRpcServer(network: "PUBLIC" | "TESTNET"): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL[network]);
}

/**
 * Returns the Stellar network passphrase used to sign transactions.
 *
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The network passphrase string (e.g. `"Public Global Stellar Network ; September 2015"`).
 */
export function getNetworkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === NETWORK_PUBLIC ? Networks.PUBLIC : Networks.TESTNET;
}

/**
 * Prompts the user to connect their Freighter wallet and returns the active address.
 *
 * Prerequisites: Freighter browser extension must be installed.
 *
 * @returns The connected G-address string, or `null` if Freighter is not installed or the user denies access.
 *
 * @example
 * const address = await connectWallet();
 * if (address) console.log("Connected:", address);
 */
export async function connectWallet(): Promise<string | null> {
  try {
    const conn = await isConnected();
    if (!conn.isConnected) {
      throw new Error("Freighter not detected");
    }
    const addr = await getAddress();
    return addr.address;
  } catch (e) {
    console.error("Failed to connect wallet:", e);
    return null;
  }
}

/**
 * Checks whether the Freighter extension is installed and connected.
 *
 * @returns `true` if Freighter is connected, `false` otherwise.
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Returns the active Freighter wallet address without prompting for connection.
 *
 * @returns The G-address string, or `null` if Freighter is unavailable.
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const result = await getAddress();
    return result.address;
  } catch {
    return null;
  }
}

/**
 * Returns the Stellar network that Freighter is currently configured for.
 *
 * @returns `"PUBLIC"` or `"TESTNET"`. Falls back to the app default if Freighter is unavailable.
 */
export async function getCurrentNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  try {
    const result = await getNetwork();
    return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
  } catch {
    return DEFAULT_NETWORK;
  }
}

/**
 * Returns `true` if the given string is a syntactically valid Stellar address (G- or C-address).
 *
 * @param address - The address string to validate.
 */
export function isValidStellarAddress(address: string): boolean {
  return STELLAR_ADDRESS_REGEX.test(address);
}

/**
 * Returns `true` if the address is a Soroban contract address (starts with `C`, 56 chars).
 *
 * @param address - The address string to check.
 */
export function isCAddress(address: string): boolean {
  return address.startsWith("C") && address.length === STELLAR_ADDRESS_LENGTH;
}

/**
 * Returns `true` if the address is a classic Stellar account address (starts with `G`, 56 chars).
 *
 * @param address - The address string to check.
 */
export function isGAddress(address: string): boolean {
  return address.startsWith("G") && address.length === STELLAR_ADDRESS_LENGTH;
}

/**
 * Validates required environment variables and returns a list of human-readable warnings.
 *
 * Missing variables do not throw; they produce warnings so the app can degrade gracefully.
 *
 * @returns Array of warning strings. Empty array means all env vars are set.
 */
export function validateEnvironment(): string[] {
  const warnings: string[] = [];
  if (!process.env[ENV_BRIDGE_CONTRACT_ID]) {
    warnings.push(`${ENV_BRIDGE_CONTRACT_ID} is not set; bridge will fall back to direct payment`);
  }
  if (!process.env[ENV_MOONPAY_API_KEY]) {
    warnings.push(`${ENV_MOONPAY_API_KEY} is not set; Moonpay onramp will be unavailable`);
  }
  if (!process.env[ENV_TRANSAK_API_KEY]) {
    warnings.push(`${ENV_TRANSAK_API_KEY} is not set; Transak onramp will be unavailable`);
  }
  return warnings;
}

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

interface HorizonPayment {
  id: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  transaction_successful?: boolean;
  created_at?: string;
  transaction_hash?: string;
}

/**
 * Fetches all asset balances for a classic Stellar (G-address) account via Horizon.
 *
 * @param address - The G-address of the account.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns An {@link AccountBalances} object with `total` XLM and a `balances` array.
 *          Returns zeroed balances if the account does not exist or the request fails.
 */
export async function getAccountBalances(
  address: string,
  network: "PUBLIC" | "TESTNET"
): Promise<AccountBalances> {
  const server = getHorizonServer(network);
  try {
    const account = await server.loadAccount(address);
    const balances = (account.balances as HorizonBalance[]).map((b) => ({
      asset: b.asset_type === NATIVE_ASSET_TYPE ? ASSET_XLM : (b.asset_code || UNKNOWN_ASSET),
      amount: b.balance,
    }));
    const total = balances.find((b) => b.asset === ASSET_XLM)?.amount || BALANCE_INITIAL;
    return { total, balances };
  } catch {
    return { total: BALANCE_INITIAL, balances: [] };
  }
}

/**
 * Fetches the most recent payment operations for a Stellar account from Horizon.
 *
 * @param address - The G-address to query.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @param limit - Maximum number of records to return (default: {@link DEFAULT_TX_LIMIT}).
 * @returns Array of {@link BridgeTransaction} records, ordered newest first.
 *          Returns an empty array on error.
 */
export async function fetchRecentTransactions(
  address: string,
  network: "PUBLIC" | "TESTNET",
  limit: number = DEFAULT_TX_LIMIT
): Promise<BridgeTransaction[]> {
  const server = getHorizonServer(network);
  try {
    const payments = await server
      .payments()
      .forAccount(address)
      .limit(limit)
      .order("desc")
      .call();

    return (payments.records as HorizonPayment[]).map((p) => ({
      id: p.id,
      fromAddress: p.from || "",
      toAddress: p.to || "",
      amount: p.amount || "0",
      asset: p.asset_type === NATIVE_ASSET_TYPE ? ASSET_XLM : (p.asset_code || ASSET_XLM),
      status: p.transaction_successful ? STATUS_CONFIRMED : STATUS_FAILED,
      timestamp: new Date(p.created_at || Date.now()).getTime(),
      type: TX_TYPE_G_TO_C,
      hash: p.transaction_hash,
    }));
  } catch {
    return [];
  }
}

/**
 * Builds, signs via Freighter, and submits a Stellar payment transaction.
 *
 * For XLM the native asset is used. For any other asset code the account's
 * existing trustline is looked up to determine the issuer.
 *
 * @param sourceAddress - G-address of the signing account.
 * @param destinationAddress - G- or C-address of the recipient.
 * @param amount - Amount to send as a decimal string (e.g. `"10.5"`).
 * @param assetCode - Asset code: `"XLM"` or an alphanumeric code (e.g. `"USDC"`).
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @param feeStroops - Optional fee in stroops; defaults to Stellar BASE_FEE (100).
 * @returns A {@link PaymentResult} with `hash` and `successful` flag.
 * @throws If the account has no trustline for `assetCode`, signing is rejected, or submission fails.
 *
 * @example
 * const result = await buildAndSubmitPayment(
 *   "G...", "C...", "50", "USDC", "TESTNET"
 * );
 * console.log("tx hash:", result.hash);
 */
export async function buildAndSubmitPayment(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET",
  feeStroops?: string,
  /** Optional wallet signer — defaults to Freighter. Pass adapter.signTransaction for other wallets. */
  signer: TxSigner = defaultSigner
): Promise<PaymentResult> {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);

  const account = await server.loadAccount(sourceAddress);
  let asset: Asset;
  if (assetCode === "XLM") {
    asset = Asset.native();
  } else {
    // For non-native assets we must find the issuer from the account's trustlines.
    // Stellar assets are identified by (code, issuer) pairs — the same code can
    // exist from different issuers, so we can't hard-code one.
    const balances = account.balances as HorizonBalance[];
    const matchingBalance = balances.find((b) => b.asset_code === assetCode);
    if (!matchingBalance) {
      throw new Error(`No ${assetCode} trustline found for this account`);
    }
    asset = new Asset(assetCode, matchingBalance.asset_issuer);
  }

  // BASE_FEE (100 stroops) is the network minimum; callers can pass a higher
  // fee from fee-bump or fee-stats to improve inclusion speed during congestion.
  // See: https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering
  const tx = new TransactionBuilder(account, {
    fee: feeStroops ?? BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(Operation.payment({ destination: destinationAddress, asset, amount }))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  const signedXDR = await signer(tx.toXDR(), passphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);
  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, successful: result.successful };
}

/**
 * Builds (but does not sign or submit) a bridge payment transaction.
 *
 * Sends to the configured bridge contract address when `BRIDGE_CONTRACT_ID` is set,
 * otherwise sends directly to `cAddress`.
 *
 * @param sourceAddress - G-address of the signing account.
 * @param cAddress - Target Soroban C-address.
 * @param amount - XLM amount as a decimal string.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @param feeStroop - Fee in stroops (default: BASE_FEE).
 * @returns An unsigned {@link TransactionBuilder} result (call `.toXDR()` or sign directly).
 */
export async function buildBridgeTransaction(
  sourceAddress: string,
  cAddress: string,
  amount: string,
  network: "PUBLIC" | "TESTNET",
  feeStroop: string = BASE_FEE
) {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.loadAccount(sourceAddress);
  return new TransactionBuilder(account, { fee: feeStroop, networkPassphrase: passphrase })
    .addOperation(Operation.payment({ destination: BRIDGE_CONTRACT_ID || cAddress, asset: Asset.native(), amount }))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();
}

/**
 * Sends funds to a Soroban C-address, routing through the bridge contract when available.
 *
 * When `BRIDGE_CONTRACT_ID` is set the transaction is prepared via Soroban RPC
 * (simulation + footprint population), signed with Freighter, and polled until
 * confirmed. Without a contract it falls back to {@link buildAndSubmitPayment}.
 *
 * @param sourceAddress - G-address of the signing account.
 * @param cAddress - Target Soroban C-address.
 * @param amount - Amount as a decimal string.
 * @param assetCode - Asset code (e.g. `"XLM"`, `"USDC"`).
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @param feeStroops - Optional fee override in stroops.
 * @returns A {@link PaymentResult} with `hash` and `successful: true` on success.
 * @throws On account load failure, simulation error, signing rejection, or non-SUCCESS poll result.
 *
 * @example
 * const result = await bridgeViaContract(
 *   "G...", "CABC...XYZ", "100", "XLM", "TESTNET"
 * );
 */
export async function bridgeViaContract(
  sourceAddress: string,
  cAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET",
  feeStroops?: string,
  /** Optional wallet signer — defaults to Freighter. */
  signer: TxSigner = defaultSigner
): Promise<PaymentResult> {
  if (!BRIDGE_CONTRACT_ID) {
    // No contract deployed: fall back to a direct G→C payment.
    return buildAndSubmitPayment(sourceAddress, cAddress, amount, assetCode, network, feeStroops, signer);
  }

  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);

  let account;
  try {
    account = await server.getAccount(sourceAddress);
  } catch (e) {
    throw new Error(`Failed to load account ${sourceAddress}: ${e instanceof Error ? e.message : String(e)}`);
  }

  const tx = new TransactionBuilder(account, {
    fee: feeStroops ?? BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(Operation.payment({ destination: BRIDGE_CONTRACT_ID, asset: Asset.native(), amount }))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  // prepareTransaction runs a simulation against Soroban RPC to:
  //  1. Determine the ledger footprint (which contract storage keys are read/written)
  //  2. Compute the resource fee on top of the inclusion fee
  // The returned transaction has these fields populated and is ready to sign.
  // Ref: https://developers.stellar.org/docs/build/guides/dapps/get-started-with-soroban
  let prepared;
  try {
    prepared = await server.prepareTransaction(tx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    throw new Error(`Soroban simulation failed: ${msg}`);
  }

  const signedXDR = await signer(prepared.toXDR(), passphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);

  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Contract invocation failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Soroban transactions are async: sendTransaction enqueues the tx and returns
  // immediately.  We must poll until the ledger that includes it is closed.
  // pollTransaction handles the retry loop (up to `attempts` ledger closes).
  let polled;
  try {
    polled = await server.pollTransaction(sendResult.hash, {
      attempts: 20,
      sleepStrategy: rpc.BasicSleepStrategy,
    });
  } catch (e) {
    throw new Error(`Polling failed for tx ${sendResult.hash}: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (polled.status !== "SUCCESS") {
    throw new Error(`Bridge contract call did not succeed (status: ${polled.status})`);
  }

  return { hash: sendResult.hash, successful: true };
}

/**
 * Constructs a Stellar Expert (or testnet equivalent) URL for a transaction, account, or contract.
 *
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @param type - `"tx"`, `"account"`, or `"contract"`.
 * @param id - The hash / address / contract ID to link to.
 * @returns A fully-qualified URL string.
 */
export function getExplorerUrl(
  network: "PUBLIC" | "TESTNET",
  type: "tx" | "account" | "contract",
  id: string
): string {
  return `${EXPLORER_BASE_URLS[network]}/${type}/${id}`;
}

/**
 * Returns the minimum XLM balance required to keep a Stellar account open.
 *
 * @returns The minimum balance as a decimal string (e.g. `"1.0"`).
 */
export function getAccountMinimumBalance(): string {
  return ACCOUNT_MIN_BALANCE;
}

export interface AccountInfo {
  exists: boolean;
  balances: { asset: string; amount: string }[];
}

/**
 * Loads existence and balance information for any Stellar address.
 *
 * @param address - G- or C-address to query.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns `{ exists: false, balances: [] }` for unfunded accounts (404), otherwise account data.
 * @throws For network errors other than 404.
 */
export async function loadAccountInfo(
  address: string,
  network: "PUBLIC" | "TESTNET"
): Promise<AccountInfo> {
  const server = getHorizonServer(network);
  try {
    const account = await server.loadAccount(address);
    const balances = (account.balances as HorizonBalance[]).map((b) => ({
      asset: b.asset_type === NATIVE_ASSET_TYPE ? ASSET_XLM : (b.asset_code || UNKNOWN_ASSET),
      amount: b.balance,
    }));
    return { exists: true, balances };
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return { exists: false, balances: [] };
    }
    throw e;
  }
}

/**
 * Returns `true` if the account already has a trustline for the given asset code.
 *
 * @param address - G-address to check.
 * @param assetCode - Asset code to look up (e.g. `"USDC"`).
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 */
export async function hasTrustline(
  address: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<boolean> {
  const info = await loadAccountInfo(address, network);
  return info.balances.some((b) => b.asset === assetCode);
}

/**
 * Creates a `changeTrust` Stellar operation to add or remove an asset trustline.
 *
 * @param assetCode - Asset code (e.g. `"USDC"`).
 * @param issuer - Issuer G-address of the asset.
 * @returns A Stellar SDK `Operation` ready to be added to a {@link TransactionBuilder}.
 */
export function changeTrustOperation(assetCode: string, issuer: string) {
  return Operation.changeTrust({ asset: new Asset(assetCode, issuer) });
}

/**
 * Builds, signs, and submits a `changeTrust` transaction to establish an asset trustline.
 *
 * @param sourceAddress - G-address of the account establishing the trustline.
 * @param assetCode - Asset code (e.g. `"USDC"`).
 * @param issuer - Issuer G-address.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns A {@link PaymentResult} confirming the trustline transaction.
 * @throws If signing is rejected or submission fails.
 */
export async function buildAndSubmitChangeTrust(
  sourceAddress: string,
  assetCode: string,
  issuer: string,
  network: "PUBLIC" | "TESTNET",
  /** Optional wallet signer — defaults to Freighter. */
  signer: TxSigner = defaultSigner
): Promise<PaymentResult> {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.loadAccount(sourceAddress);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(changeTrustOperation(assetCode, issuer))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  const signedXDR = await signer(tx.toXDR(), passphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);
  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, successful: result.successful };
}

/**
 * Queries Horizon for the status of a submitted transaction.
 *
 * @param hash - Transaction hash (64-char hex string).
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns `"confirmed"` if successful, `"failed"` if found but unsuccessful, `"pending"` if not yet indexed.
 * @throws For network errors other than 404.
 */
export async function getTransactionStatus(
  hash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<"pending" | "confirmed" | "failed"> {
  const server = getHorizonServer(network);
  try {
    const tx = await server.transactions().transaction(hash).call();
    return tx.successful ? STATUS_CONFIRMED : STATUS_FAILED;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return STATUS_PENDING;
    }
    throw e;
  }
}

/**
 * Returns `true` if the given asset code represents the native XLM asset.
 *
 * @param assetCode - Asset code string to check.
 */
export function isNativeAsset(assetCode: string): boolean {
  return assetCode === "XLM";
}

// A well-known funded account used as simulation source for read-only calls.
// Soroban simulation requires a valid source account to build the transaction
// envelope, but for view-only calls (balance, symbol, decimals) we don't need
// to own the account or pay fees — simulation never hits the network ledger.
// This specific address is the Stellar laboratory's funded testnet faucet account
// and is safe to use as a stand-in source on both TESTNET and PUBLIC.
const SIM_SOURCE = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

/**
 * Simulate a read-only Soroban contract call and return the return value ScVal.
 * Simulation is cheap (no on-chain fee) and sufficient for view functions.
 * Ref: https://developers.stellar.org/docs/data/rpc/api-reference/methods/simulateTransaction
 */
async function simulateContractRead(
  contractId: string,
  method: string,
  args: Parameters<Contract["call"]>[1][],
  network: "PUBLIC" | "TESTNET"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(SIM_SOURCE).catch(
    () => new Account(SIM_SOURCE, "0")
  );
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) return null;
  return (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval ?? null;
}

/**
 * Reads the SEP-41 token balance for an account from a Soroban contract via simulation.
 *
 * @param contractId - C-address of the SEP-41 token contract.
 * @param accountId - G- or C-address of the account to query.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The raw balance as a `bigint` (unscaled). Returns `0n` on any error.
 */
export async function getSorobanTokenBalance(
  contractId: string,
  accountId: string,
  network: "PUBLIC" | "TESTNET"
): Promise<bigint> {
  try {
    const retval = await simulateContractRead(contractId, "balance", [addressToScVal(accountId)], network);
    if (!retval) return BigInt(0);
    return BigInt(scValToNative(retval) as bigint);
  } catch {
    return BigInt(0);
  }
}

/**
 * Reads the token symbol from a SEP-41 contract via simulation.
 *
 * @param contractId - C-address of the token contract.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The symbol string (e.g. `"USDC"`), or the first 8 chars of `contractId` on failure.
 */
export async function getTokenSymbol(
  contractId: string,
  network: "PUBLIC" | "TESTNET"
): Promise<string> {
  try {
    const retval = await simulateContractRead(contractId, "symbol", [], network);
    if (!retval) return contractId.slice(0, 8);
    return String(scValToNative(retval));
  } catch {
    return contractId.slice(0, 8);
  }
}

/**
 * Reads the decimal precision from a SEP-41 token contract via simulation.
 *
 * @param contractId - C-address of the token contract.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The number of decimal places (e.g. `7`). Defaults to `7` on failure.
 */
export async function getTokenDecimals(
  contractId: string,
  network: "PUBLIC" | "TESTNET"
): Promise<number> {
  try {
    const retval = await simulateContractRead(contractId, "decimals", [], network);
    if (!retval) return 7;
    return Number(scValToNative(retval));
  } catch {
    return 7;
  }
}

/**
 * Reads balances for multiple SEP-41 tokens held by a Soroban C-address.
 *
 * Each token's raw balance is divided by `10^decimals` to produce a human-readable amount.
 *
 * @param cAddress - The Soroban C-address to query.
 * @param tokenContractIds - Array of SEP-41 token contract C-addresses.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns An {@link AccountBalances} with XLM total and per-token balance entries.
 */
export async function getSorobanAccountBalances(
  cAddress: string,
  tokenContractIds: string[],
  network: "PUBLIC" | "TESTNET"
): Promise<AccountBalances> {
  const results = await Promise.all(
    tokenContractIds.map(async (contractId) => {
      const [rawBalance, symbol, decimals] = await Promise.all([
        getSorobanTokenBalance(contractId, cAddress, network),
        getTokenSymbol(contractId, network),
        getTokenDecimals(contractId, network),
      ]);
      const divisor = BigInt(10 ** decimals);
      const whole = rawBalance / divisor;
      const frac = rawBalance % divisor;
      const amount = `${whole}.${frac.toString().padStart(decimals, "0")}`;
      return { asset: symbol, amount, contractId };
    })
  );
  const xlmEntry = results.find((b) => b.asset === ASSET_XLM);
  const total = xlmEntry?.amount ?? BALANCE_INITIAL;
  return { total, balances: results };
}

/**
 * Convert a Stellar address string to an ScVal of type Address for use as a
 * Soroban contract argument.
 *
 * Stellar has two address spaces:
 *  - G-addresses (Ed25519 public keys) — classic accounts
 *  - C-addresses (contract IDs)        — Soroban smart contracts / smart accounts
 * The SDK encodes them differently inside ScVal, so we branch on key type.
 * Ref: https://developers.stellar.org/docs/learn/encyclopedia/contract-development/types/built-in-types#address
 */
function addressToScVal(address: string) {
  if (StrKey.isValidEd25519PublicKey(address)) {
    return nativeToScVal(Address.account(StrKey.decodeEd25519PublicKey(address)), { type: "address" });
  }
  return nativeToScVal(Address.contract(StrKey.decodeContract(address)), { type: "address" });
}

/**
 * Queries the current token allowance granted by `owner` to `spender` from a SEP-41 contract.
 *
 * @param tokenContractId - C-address of the SEP-41 token contract.
 * @param owner - G- or C-address of the token owner.
 * @param spender - G- or C-address of the approved spender.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The allowance as a `bigint` (raw, unscaled).
 * @throws If the Soroban simulation fails.
 */
export async function getTokenAllowance(
  tokenContractId: string,
  owner: string,
  spender: string,
  network: "PUBLIC" | "TESTNET"
): Promise<bigint> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(owner);
  const contract = new Contract(tokenContractId);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(contract.call("allowance", addressToScVal(owner), addressToScVal(spender)))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Allowance simulation failed: ${sim.error}`);
  }
  const result = (sim as rpc.Api.SimulateTransactionSuccessResponse).result;
  if (!result) return BigInt(0);
  return BigInt(scValToNative(result.retval) as bigint);
}

/**
 * Submits a SEP-41 `approve` transaction, granting `spender` permission to spend `amount` tokens.
 *
 * The approval expires after approximately 30 days (~535,680 ledgers at 5 s/ledger).
 *
 * @param tokenContractId - C-address of the SEP-41 token contract.
 * @param owner - G-address of the token owner (must be the Freighter-connected account).
 * @param spender - G- or C-address of the approved spender.
 * @param amount - Raw (unscaled) allowance amount as a `bigint`.
 * @param network - `"PUBLIC"` or `"TESTNET"`.
 * @returns The transaction hash string on success.
 * @throws If simulation, signing, or submission fails.
 */
export async function approveToken(
  tokenContractId: string,
  owner: string,
  spender: string,
  amount: bigint,
  network: "PUBLIC" | "TESTNET"
): Promise<string> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(owner);
  const contract = new Contract(tokenContractId);

  const latestLedger = (await server.getLatestLedger()).sequence;
  // Soroban token allowances expire at a specific ledger number, not a timestamp.
  // 535 680 ledgers ≈ 30 days at the ~5 s target close time.
  // Ref: https://developers.stellar.org/docs/tokens/token-interface-specification
  const expirationLedger = latestLedger + 535680; // ~30 days at 5s/ledger

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(
      contract.call(
        "approve",
        addressToScVal(owner),
        addressToScVal(spender),
        nativeToScVal(amount, { type: "i128" }),
        nativeToScVal(expirationLedger, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signedXDR = await defaultSigner(prepared.toXDR(), passphrase);
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);
  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Approve transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }
  const polled = await server.pollTransaction(sendResult.hash, { attempts: 20, sleepStrategy: rpc.BasicSleepStrategy });
  if (polled.status !== "SUCCESS") {
    throw new Error(`Approve transaction did not succeed: ${polled.status}`);
  }
  return sendResult.hash;
}

// --- Contract Admin ---

export interface ContractDeployResult {
  contractId: string;
  wasmHash: string;
  txHash: string;
}

export interface ContractState {
  contractId: string;
  wasmHash: string | null;
  ledger: number;
}

/**
 * Upload WASM bytes + deploy a new contract instance in two steps,
 * both signed by Freighter. Returns the new contract C-address.
 */
export async function deployContract(
  deployerAddress: string,
  wasmBytes: Uint8Array,
  network: "PUBLIC" | "TESTNET"
): Promise<ContractDeployResult> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(deployerAddress);

  // Step 1: upload WASM
  const uploadTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  const preparedUpload = await server.prepareTransaction(uploadTx);
  const signedUploadXDR = await defaultSigner(preparedUpload.toXDR(), passphrase);
  const uploadResult = await server.sendTransaction(TransactionBuilder.fromXDR(signedUploadXDR, passphrase));
  if (uploadResult.status === "ERROR") throw new Error(`WASM upload failed: ${JSON.stringify(uploadResult.errorResult)}`);
  const uploadPolled = await server.pollTransaction(uploadResult.hash, { attempts: 30, sleepStrategy: rpc.BasicSleepStrategy });
  if (uploadPolled.status !== "SUCCESS") throw new Error(`WASM upload did not succeed: ${uploadPolled.status}`);

  const wasmHash = scValToNative((uploadPolled as rpc.Api.GetSuccessfulTransactionResponse).returnValue!) as string;

  // Step 2: create contract instance
  const account2 = await server.getAccount(deployerAddress);
  const createTx = new TransactionBuilder(account2, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(
      Operation.createStellarAssetContract({ asset: Asset.native() }) // placeholder shape — real invocation uses invokeHostFunction
    )
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  // Use invokeHostFunction via raw XDR for contract creation from wasm hash
  const deployTx = new TransactionBuilder(account2, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(
      Operation.createCustomContract({
        wasmHash: Buffer.from(wasmHash, "hex"),
        address: Address.fromString(deployerAddress),
        salt: Buffer.from(crypto.getRandomValues(new Uint8Array(32))),
      })
    )
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  void createTx; // unused placeholder above

  const preparedDeploy = await server.prepareTransaction(deployTx);
  const signedDeployXDR = await defaultSigner(preparedDeploy.toXDR(), passphrase);
  const deployResult = await server.sendTransaction(TransactionBuilder.fromXDR(signedDeployXDR, passphrase));
  if (deployResult.status === "ERROR") throw new Error(`Contract deploy failed: ${JSON.stringify(deployResult.errorResult)}`);
  const deployPolled = await server.pollTransaction(deployResult.hash, { attempts: 30, sleepStrategy: rpc.BasicSleepStrategy });
  if (deployPolled.status !== "SUCCESS") throw new Error(`Contract deploy did not succeed: ${deployPolled.status}`);

  const contractId = scValToNative((deployPolled as rpc.Api.GetSuccessfulTransactionResponse).returnValue!) as string;

  return { contractId, wasmHash: typeof wasmHash === "string" ? wasmHash : Buffer.from(wasmHash).toString("hex"), txHash: deployResult.hash };
}

/**
 * Upgrade an existing contract to a new WASM hash by calling __upgrade.
 */
export async function upgradeContract(
  adminAddress: string,
  contractId: string,
  newWasmHash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<string> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(adminAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
    .addOperation(contract.call("__upgrade", nativeToScVal(Buffer.from(newWasmHash, "hex"), { type: "bytes" })))
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
    .build();

  const prepared = await server.prepareTransaction(tx);
  const signedXDR = await defaultSigner(prepared.toXDR(), passphrase);
  const result = await server.sendTransaction(TransactionBuilder.fromXDR(signedXDR, passphrase));
  if (result.status === "ERROR") throw new Error(`Upgrade failed: ${JSON.stringify(result.errorResult)}`);
  const polled = await server.pollTransaction(result.hash, { attempts: 30, sleepStrategy: rpc.BasicSleepStrategy });
  if (polled.status !== "SUCCESS") throw new Error(`Upgrade did not succeed: ${polled.status}`);
  return result.hash;
}

/**
 * Fetch on-chain state (ledger sequence + wasm hash) for a deployed contract.
 */
export async function getContractState(
  contractId: string,
  network: "PUBLIC" | "TESTNET"
): Promise<ContractState> {
  const server = getSorobanRpcServer(network);
  try {
    const ledgerKey = new Contract(contractId).getFootprint();
    const response = await server.getLedgerEntries(ledgerKey);
    const entry = response.entries[0];
    const wasmHash = entry
      ? Buffer.from((entry.val as { contractData?: { val?: { wasm_hash?: Uint8Array } } })?.contractData?.val?.wasm_hash ?? []).toString("hex")
      : null;
    return { contractId, wasmHash, ledger: response.latestLedger };
  } catch {
    return { contractId, wasmHash: null, ledger: 0 };
  }
}
