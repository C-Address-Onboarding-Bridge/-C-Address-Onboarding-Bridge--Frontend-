import {
  isConnected,
  getAddress,
  signTransaction,
  getNetwork,
} from "@stellar/freighter-api";
import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Networks,
  Asset,
  Horizon,
  rpc,
} from "@stellar/stellar-sdk";
import { BRIDGE_CONTRACT_ID } from "./types";

/**
 * Stellar and Soroban integration helpers for the C-Address Bridge frontend.
 *
 * The helpers in this module expect the caller to pass the active Stellar
 * environment explicitly as `"TESTNET"` or `"PUBLIC"`. Wallet functions require
 * the Freighter browser extension to be installed, unlocked, and connected to
 * the same network that the caller passes into transaction helpers.
 */

const HORIZON_URLS = {
  PUBLIC: "https://horizon.stellar.org",
  TESTNET: "https://horizon-testnet.stellar.org",
};

const SOROBAN_RPC_URLS = {
  PUBLIC: "https://soroban-rpc.stellar.org",
  TESTNET: "https://soroban-rpc-testnet.stellar.org",
};

/**
 * Creates a Horizon API client for the selected Stellar network.
 *
 * @param network - Stellar environment to target. Use `"TESTNET"` for local
 * development and `"PUBLIC"` only for production flows.
 * @returns A configured Horizon server instance.
 */
export function getHorizonServer(network: "PUBLIC" | "TESTNET"): Horizon.Server {
  return new Horizon.Server(HORIZON_URLS[network]);
}

/**
 * Creates a Soroban RPC client for the selected Stellar network.
 *
 * @param network - Stellar environment to target.
 * @returns A configured Soroban RPC server instance.
 */
export function getSorobanRpcServer(network: "PUBLIC" | "TESTNET"): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URLS[network]);
}

/**
 * Resolves the SDK network passphrase for transaction building and signing.
 *
 * @param network - Stellar environment to convert into a passphrase.
 * @returns The official Stellar network passphrase used by the SDK.
 */
export function getNetworkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;
}

/**
 * Connects to Freighter and returns the active wallet address.
 *
 * The browser must have Freighter installed and unlocked before this is called.
 *
 * @returns The connected Stellar account address, or `null` when Freighter is
 * unavailable, locked, or denies access.
 * @example
 * const address = await connectWallet();
 * if (address) {
 *   console.log(`Connected wallet: ${address}`);
 * }
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
 * Checks whether Freighter is available and connected.
 *
 * @returns `true` when Freighter reports an active connection; otherwise `false`.
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
 * Reads the currently selected Freighter wallet address.
 *
 * @returns The current wallet address, or `null` when it cannot be read.
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
 * Reads the active Freighter network and maps it to the app network enum.
 *
 * @returns `"PUBLIC"` when Freighter is on public network; otherwise `"TESTNET"`.
 */
export async function getCurrentNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  try {
    const result = await getNetwork();
    return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
  } catch {
    return "TESTNET";
  }
}

/**
 * Validates the app-supported Stellar address shape.
 *
 * @param address - Candidate G-address or C-address.
 * @returns `true` when the address starts with `G` or `C` and has the expected
 * Stellar address length.
 */
export function isValidStellarAddress(address: string): boolean {
  return /^[G|C][A-Z0-9]{55}$/.test(address);
}

/**
 * Checks whether a string is shaped like a Soroban contract address.
 *
 * @param address - Candidate address.
 * @returns `true` when the value is a 56-character C-address.
 */
export function isCAddress(address: string): boolean {
  return address.startsWith("C") && address.length === 56;
}

/**
 * Checks whether a string is shaped like a classic Stellar account address.
 *
 * @param address - Candidate address.
 * @returns `true` when the value is a 56-character G-address.
 */
export function isGAddress(address: string): boolean {
  return address.startsWith("G") && address.length === 56;
}

/** Result returned after a signed transaction is submitted to Stellar. */
export interface PaymentResult {
  hash: string;
  successful: boolean;
}

/** Normalized account balance summary for dashboard and funding views. */
export interface AccountBalances {
  total: string;
  balances: { asset: string; amount: string }[];
}

/** Normalized transaction record shown in bridge, CEX, and onramp flows. */
export interface BridgeTransactionData {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  type: "g-to-c" | "fiat" | "cex";
  hash?: string;
  memo?: string;
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
 * Loads and normalizes account balances from Horizon.
 *
 * @param address - Stellar account address to inspect.
 * @param network - Stellar network where the account exists.
 * @returns The XLM total plus a list of native and issued asset balances. Missing
 * or unfunded accounts return an empty balance set.
 */
export async function getAccountBalances(
  address: string,
  network: "PUBLIC" | "TESTNET"
): Promise<AccountBalances> {
  const server = getHorizonServer(network);
  try {
    const account = await server.loadAccount(address);
    const balances = (account.balances as HorizonBalance[]).map((b) => ({
      asset: b.asset_type === "native" ? "XLM" : (b.asset_code || "unknown"),
      amount: b.balance,
    }));
    const total = balances.find((b) => b.asset === "XLM")?.amount || "0";
    return { total, balances };
  } catch {
    return { total: "0", balances: [] };
  }
}

/**
 * Fetches recent account payments and converts them into bridge transaction rows.
 *
 * @param address - Stellar account whose payment history should be loaded.
 * @param network - Stellar network where the account exists.
 * @param limit - Maximum number of payment records to request from Horizon.
 * @returns Recent transactions ordered by Horizon descending order. Returns an
 * empty array when Horizon is unavailable or the account cannot be loaded.
 */
export async function fetchRecentTransactions(
  address: string,
  network: "PUBLIC" | "TESTNET",
  limit: number = 10
): Promise<BridgeTransactionData[]> {
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
      asset: p.asset_type === "native" ? "XLM" : (p.asset_code || "XLM"),
      status: p.transaction_successful ? "confirmed" as const : "failed" as const,
      timestamp: new Date(p.created_at || Date.now()).getTime(),
      type: "g-to-c" as const,
      hash: p.transaction_hash,
    }));
  } catch {
    return [];
  }
}

/**
 * Builds, signs with Freighter, and submits a Stellar payment transaction.
 *
 * @param sourceAddress - G-address that funds and signs the transaction.
 * @param destinationAddress - Destination Stellar address for the payment.
 * @param amount - Decimal amount string accepted by the Stellar SDK.
 * @param assetCode - `"XLM"` for native payments or an issued asset code present
 * in the source account balances.
 * @param network - Stellar environment used for Horizon, passphrase, and signing.
 * @returns The submitted transaction hash and success flag from Horizon.
 * @throws When the source account cannot be loaded, the asset code is not held by
 * the source account, Freighter signing fails, or Horizon rejects submission.
 * @example
 * const result = await buildAndSubmitPayment(
 *   sourceAddress,
 *   destinationAddress,
 *   "5",
 *   "XLM",
 *   "TESTNET"
 * );
 */
export async function buildAndSubmitPayment(
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<PaymentResult> {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);

  const account = await server.loadAccount(sourceAddress);
  let asset: Asset;
  if (assetCode === "XLM") {
    asset = Asset.native();
  } else {
    const balances = account.balances as HorizonBalance[];
    const matchingBalance = balances.find(
      (b) => b.asset_code === assetCode
    );
    if (!matchingBalance) {
      throw new Error(`No ${assetCode} trustline found for this account`);
    }
    asset = new Asset(assetCode, matchingBalance.asset_issuer);
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  const signedResult = await signTransaction(tx.toXDR(), {
    networkPassphrase: passphrase,
  });

  if ("error" in signedResult && signedResult.error) {
    throw new Error(`Signing failed: ${signedResult.error}`);
  }

  const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);

  const result = await server.submitTransaction(signedTx);

  return {
    hash: result.hash,
    successful: result.successful,
  };
}

/**
 * Routes a funding request through the configured bridge contract when available.
 *
 * If `BRIDGE_CONTRACT_ID` is not configured, this falls back to a direct Stellar
 * payment to the supplied C-address. The current contract path submits native XLM
 * to the bridge contract and relies on the configured network passphrase.
 *
 * @param sourceAddress - G-address that funds and signs the bridge transaction.
 * @param cAddress - Target Soroban C-address, used directly when no bridge contract
 * is configured.
 * @param amount - Decimal amount string to send.
 * @param assetCode - Requested asset code. The direct-payment fallback supports
 * issued assets that exist in the source account; the contract path currently sends XLM.
 * @param network - Stellar environment used for Horizon, passphrase, and signing.
 * @returns The submitted transaction hash and success flag.
 * @throws When Freighter signing fails, Horizon submission fails, or Stellar returns
 * transaction result codes for a rejected operation.
 * @example
 * await bridgeViaContract(sourceAddress, cAddress, "10", "XLM", "TESTNET");
 */
export async function bridgeViaContract(
  sourceAddress: string,
  cAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<PaymentResult> {
  if (!BRIDGE_CONTRACT_ID) {
    return buildAndSubmitPayment(sourceAddress, cAddress, amount, assetCode, network);
  }

  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);

  const account = await server.loadAccount(sourceAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: BRIDGE_CONTRACT_ID,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();

  const unsignedXDR = tx.toXDR();

  const signedResult = await signTransaction(unsignedXDR, {
    networkPassphrase: passphrase,
  });

  if ("error" in signedResult && signedResult.error) {
    throw new Error(`Signing failed: ${signedResult.error}`);
  }

  const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);

  try {
    const result = await server.submitTransaction(signedTx);
    return {
      hash: result.hash,
      successful: result.successful,
    };
  } catch (e: unknown) {
    const err = e as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    if (err.response?.data?.extras?.result_codes) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(err.response.data.extras.result_codes)}`
      );
    }
    throw e;
  }
}

/**
 * Builds a Stellar Expert URL for a transaction, account, or contract.
 *
 * @param network - Stellar environment that owns the identifier.
 * @param type - Explorer resource type to link to.
 * @param id - Transaction hash, account address, or contract address.
 * @returns A public Stellar Expert explorer URL.
 */
export function getExplorerUrl(
  network: "PUBLIC" | "TESTNET",
  type: "tx" | "account" | "contract",
  id: string
): string {
  const base = network === "PUBLIC"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${base}/${type}/${id}`;
}

/**
 * Returns the app's displayed minimum XLM reserve guidance for a Stellar account.
 *
 * @returns Minimum reserve amount in XLM as a decimal string.
 */
export function getAccountMinimumBalance(): string {
  return "1.0";
}
