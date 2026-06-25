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
  SorobanDataBuilder,
} from "@stellar/stellar-sdk";
import {
  BRIDGE_CONTRACT_ID,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  type PaymentResult,
  type AccountBalances,
  type BridgeTransaction,
} from "./types";

export type { BridgeTransaction as BridgeTransactionData } from "./types";
export type { PaymentResult, AccountBalances } from "./types";

export function getHorizonServer(network: "PUBLIC" | "TESTNET"): Horizon.Server {
  return new Horizon.Server(HORIZON_URL[network]);
}

export function getSorobanRpcServer(network: "PUBLIC" | "TESTNET"): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL[network]);
}

export function getNetworkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;
}

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

export async function checkConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const result = await getAddress();
    return result.address;
  } catch {
    return null;
  }
}

export async function getCurrentNetwork(): Promise<"PUBLIC" | "TESTNET"> {
  try {
    const result = await getNetwork();
    return result.network === Networks.PUBLIC ? "PUBLIC" : "TESTNET";
  } catch {
    return "TESTNET";
  }
}

export function isValidStellarAddress(address: string): boolean {
  return /^[G|C][A-Z0-9]{55}$/.test(address);
}

export function isCAddress(address: string): boolean {
  return address.startsWith("C") && address.length === 56;
}

export function isGAddress(address: string): boolean {
  return address.startsWith("G") && address.length === 56;
}

export function validateEnvironment(): string[] {
  const warnings: string[] = [];
  if (!process.env.NEXT_PUBLIC_BRIDGE_CONTRACT_ID) {
    warnings.push("NEXT_PUBLIC_BRIDGE_CONTRACT_ID is not set; bridge will fall back to direct payment");
  }
  if (!process.env.NEXT_PUBLIC_MOONPAY_API_KEY) {
    warnings.push("NEXT_PUBLIC_MOONPAY_API_KEY is not set; Moonpay onramp will be unavailable");
  }
  if (!process.env.NEXT_PUBLIC_TRANSAK_API_KEY) {
    warnings.push("NEXT_PUBLIC_TRANSAK_API_KEY is not set; Transak onramp will be unavailable");
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

export async function fetchRecentTransactions(
  address: string,
  network: "PUBLIC" | "TESTNET",
  limit: number = 10
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

export function getAccountMinimumBalance(): string {
  return "1.0";
}

export const USDC_ISSUERS: Record<"PUBLIC" | "TESTNET", string> = {
  PUBLIC: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  TESTNET: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

export interface AccountInfo {
  exists: boolean;
  balances: { asset: string; amount: string }[];
}

export async function loadAccountInfo(
  address: string,
  network: "PUBLIC" | "TESTNET"
): Promise<AccountInfo> {
  const server = getHorizonServer(network);
  try {
    const account = await server.loadAccount(address);
    const balances = (account.balances as HorizonBalance[]).map((b) => ({
      asset: b.asset_type === "native" ? "XLM" : (b.asset_code || "unknown"),
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

export async function hasTrustline(
  address: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<boolean> {
  const info = await loadAccountInfo(address, network);
  return info.balances.some((b) => b.asset === assetCode);
}

export function changeTrustOperation(assetCode: string, issuer: string) {
  return Operation.changeTrust({ asset: new Asset(assetCode, issuer) });
}

export async function buildAndSubmitChangeTrust(
  sourceAddress: string,
  assetCode: string,
  issuer: string,
  network: "PUBLIC" | "TESTNET"
): Promise<PaymentResult> {
  const server = getHorizonServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.loadAccount(sourceAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(changeTrustOperation(assetCode, issuer))
    .setTimeout(30)
    .build();

  const signedResult = await signTransaction(tx.toXDR(), { networkPassphrase: passphrase });
  if ("error" in signedResult && signedResult.error) {
    throw new Error(`Signing failed: ${signedResult.error}`);
  }
  const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);
  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, successful: result.successful };
}

export async function getTransactionStatus(
  hash: string,
  network: "PUBLIC" | "TESTNET"
): Promise<"pending" | "confirmed" | "failed"> {
  const server = getHorizonServer(network);
  try {
    const tx = await server.transactions().transaction(hash).call();
    return tx.successful ? "confirmed" : "failed";
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return "pending";
    }
    throw e;
  }
}

export interface SorobanSimResult {
  instructions: number;
  diskReadBytes: number;
  writeBytes: number;
  readOnlyCount: number;
  readWriteCount: number;
  minResourceFee: string;
  /** The prepared transaction with resources applied, ready for signing. */
  preparedTx: ReturnType<typeof TransactionBuilder.fromXDR>;
}

// In-memory cache keyed by `${contractId}:${method}:${argsHash}`
const simulationCache = new Map<string, SorobanSimResult>();

export function clearSimulationCache(): void {
  simulationCache.clear();
}

export async function simulateSoroban(
  tx: ReturnType<typeof TransactionBuilder.prototype.build>,
  network: "PUBLIC" | "TESTNET",
  cacheKey?: string
): Promise<SorobanSimResult> {
  if (cacheKey && simulationCache.has(cacheKey)) {
    return simulationCache.get(cacheKey)!;
  }

  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);

  const sim = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${(sim as rpc.Api.SimulateTransactionErrorResponse).error}`);
  }

  if (rpc.Api.isSimulationRestore(sim)) {
    throw Object.assign(
      new Error("FootprintRestoreRequired"),
      { restorePreamble: (sim as rpc.Api.SimulateTransactionRestoreResponse).restorePreamble, sim }
    );
  }

  const success = sim as rpc.Api.SimulateTransactionSuccessResponse;
  const built = (success.transactionData as SorobanDataBuilder).build();
  const resources = built.resources();
  const footprint = resources.footprint();

  const result: SorobanSimResult = {
    instructions: resources.instructions(),
    diskReadBytes: resources.diskReadBytes(),
    writeBytes: resources.writeBytes(),
    readOnlyCount: footprint.readOnly().length,
    readWriteCount: footprint.readWrite().length,
    minResourceFee: success.minResourceFee,
    preparedTx: TransactionBuilder.fromXDR(
      (await server.prepareTransaction(tx)).toXDR(),
      passphrase
    ),
  };

  if (cacheKey) simulationCache.set(cacheKey, result);
  return result;
}

export async function restoreExpiredFootprint(
  sourceAddress: string,
  sim: rpc.Api.SimulateTransactionRestoreResponse,
  network: "PUBLIC" | "TESTNET"
): Promise<string> {
  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(sourceAddress);

  const restoreTx = new TransactionBuilder(account, {
    fee: sim.restorePreamble.minResourceFee,
    networkPassphrase: passphrase,
  })
    .addOperation(Operation.restoreFootprint({}))
    .setTimeout(30)
    .build();

  const prepared = await server.prepareTransaction(restoreTx);
  const signedResult = await signTransaction(prepared.toXDR(), { networkPassphrase: passphrase });
  if ("error" in signedResult && signedResult.error) {
    throw new Error(`Signing failed: ${signedResult.error}`);
  }
  const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
  const signedTx = TransactionBuilder.fromXDR(signedXDR, passphrase);
  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Restore failed: ${JSON.stringify(sendResult.errorResult)}`);
  }
  return sendResult.hash;
}

/**
 * Builds and simulates the bridge transaction for resource estimation.
 * Only meaningful when BRIDGE_CONTRACT_ID is set (Soroban path).
 * Falls back gracefully if no contract is configured.
 */
export async function simulateBridgeTx(
  sourceAddress: string,
  amount: string,
  assetCode: string,
  network: "PUBLIC" | "TESTNET"
): Promise<SorobanSimResult | null> {
  if (!BRIDGE_CONTRACT_ID) return null;

  const server = getSorobanRpcServer(network);
  const passphrase = getNetworkPassphrase(network);
  const account = await server.getAccount(sourceAddress);

    const asset = assetCode === "XLM"
    ? Asset.native()
    : new Asset(assetCode, USDC_ISSUERS[network]);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(
      Operation.payment({
        destination: BRIDGE_CONTRACT_ID,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  const cacheKey = `bridge:${BRIDGE_CONTRACT_ID}:${assetCode}:${amount}`;
  return simulateSoroban(tx, network, cacheKey);
}
