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
  Contract,
  Address,
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

export function getHorizonServer(network: "PUBLIC" | "TESTNET"): Horizon.Server {
  return new Horizon.Server(HORIZON_URL[network]);
}

export function getSorobanRpcServer(network: "PUBLIC" | "TESTNET"): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL[network]);
}

export function getNetworkPassphrase(network: "PUBLIC" | "TESTNET"): string {
  return network === NETWORK_PUBLIC ? Networks.PUBLIC : Networks.TESTNET;
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
    return DEFAULT_NETWORK;
  }
}

export function isValidStellarAddress(address: string): boolean {
  return STELLAR_ADDRESS_REGEX.test(address);
}

export function isCAddress(address: string): boolean {
  return address.startsWith("C") && address.length === STELLAR_ADDRESS_LENGTH;
}

export function isGAddress(address: string): boolean {
  return address.startsWith("G") && address.length === STELLAR_ADDRESS_LENGTH;
}

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
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
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
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
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
  return `${EXPLORER_BASE_URLS[network]}/${type}/${id}`;
}

export function getAccountMinimumBalance(): string {
  return ACCOUNT_MIN_BALANCE;
}

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
    .setTimeout(STELLAR_TX_TIMEOUT_SECONDS)
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
    return tx.successful ? STATUS_CONFIRMED : STATUS_FAILED;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return STATUS_PENDING;
    }
    throw e;
  }
}

export function isNativeAsset(assetCode: string): boolean {
  return assetCode === "XLM";
}

function addressToScVal(address: string) {
  if (StrKey.isValidEd25519PublicKey(address)) {
    return nativeToScVal(Address.account(StrKey.decodeEd25519PublicKey(address)), { type: "address" });
  }
  return nativeToScVal(Address.contract(StrKey.decodeContract(address)), { type: "address" });
}

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
  const signedResult = await signTransaction(prepared.toXDR(), { networkPassphrase: passphrase });
  if ("error" in signedResult && signedResult.error) {
    throw new Error(`Signing failed: ${signedResult.error}`);
  }
  const signedXDR = (signedResult as { signedTxXdr: string }).signedTxXdr;
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
