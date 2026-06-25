import { describe, it, expect, vi, beforeEach } from "vitest";

let mockBridgeContractId = "";

vi.mock("@/lib/types", async () => {
  const actual = await vi.importActual<typeof import("@/lib/types")>(
    "@/lib/types",
  );
  return {
    ...actual,
    get BRIDGE_CONTRACT_ID() {
      return mockBridgeContractId;
    },
  };
});

const mockLoadAccount = vi.fn();
const mockSubmitTransaction = vi.fn();
const mockTransactionsCall = vi.fn();
const mockTransactions = vi.fn().mockReturnValue({
  transaction: vi.fn().mockReturnValue({ call: mockTransactionsCall }),
});
const mockPaymentsCall = vi.fn();
const mockPayments = vi.fn().mockReturnValue({
  forAccount: vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({ call: mockPaymentsCall }),
    }),
  }),
});

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual<typeof import("@stellar/stellar-sdk")>(
    "@stellar/stellar-sdk",
  );

  function MockHorizonServer() {
    return {
      loadAccount: mockLoadAccount,
      submitTransaction: mockSubmitTransaction,
      transactions: mockTransactions,
      payments: mockPayments,
    };
  }

  const mockTx = { toXDR: vi.fn().mockReturnValue("mock-xdr") };

  function MockTransactionBuilder(this: Record<string, unknown>) {
    this.addOperation = vi.fn().mockReturnValue(this);
    this.setTimeout = vi.fn().mockReturnValue(this);
    this.build = vi.fn().mockReturnValue(mockTx);
  }
  MockTransactionBuilder.fromXDR = vi.fn().mockReturnValue({
    toXDR: vi.fn().mockReturnValue("mock-signed-xdr"),
  });

  function MockAsset(
    this: Record<string, unknown>,
    code: string,
    issuer?: string,
  ) {
    this.code = code;
    this.assetCode = code;
    this.issuer = issuer;
  }
  MockAsset.native = vi.fn().mockReturnValue({
    code: "XLM",
    assetCode: "XLM",
  });

  return {
    ...actual,
    Horizon: { ...actual.Horizon, Server: MockHorizonServer },
    TransactionBuilder: MockTransactionBuilder,
    Operation: {
      ...actual.Operation,
      payment: vi.fn().mockReturnValue({ type: "payment" }),
    },
    Asset: MockAsset,
  };
});

import { signTransaction } from "@stellar/freighter-api";
import { Operation } from "@stellar/stellar-sdk";
import {
  isValidStellarAddress,
  isCAddress,
  isGAddress,
  getAccountBalances,
  fetchRecentTransactions,
  buildAndSubmitPayment,
  bridgeViaContract,
} from "@/lib/stellar";

const G_ADDRESS =
  "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS =
  "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const USDC_ISSUER =
  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const MOCK_TX_HASH =
  "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const CONTRACT_ID =
  "CBRIDGE1234567890123456789012345678901234567890123456789012345";

function setupAccountFound(xlmBalance = "100") {
  mockLoadAccount.mockResolvedValue({
    balances: [{ asset_type: "native", balance: xlmBalance }],
    sequence: "12345",
  });
}

function setupSignSuccess() {
  vi.mocked(signTransaction).mockResolvedValue({
    signedTxXdr: "mock-signed-xdr",
    signerAddress: G_ADDRESS,
  });
}

function setupSubmitSuccess(hash = MOCK_TX_HASH) {
  mockSubmitTransaction.mockResolvedValue({ hash, successful: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBridgeContractId = "";
  setupAccountFound();
  setupSignSuccess();
  setupSubmitSuccess();
});

describe("isValidStellarAddress", () => {
  it("accepts valid G-address", () => {
    expect(isValidStellarAddress(G_ADDRESS)).toBe(true);
  });

  it("accepts valid C-address", () => {
    expect(isValidStellarAddress(C_ADDRESS)).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });

  it("rejects too-short address", () => {
    expect(isValidStellarAddress("GABC")).toBe(false);
  });

  it("rejects too-long address", () => {
    expect(isValidStellarAddress(G_ADDRESS + "EXTRA")).toBe(false);
  });

  it("rejects invalid prefix", () => {
    const addr = "X" + G_ADDRESS.slice(1);
    expect(isValidStellarAddress(addr)).toBe(false);
  });

  it("rejects lowercase characters", () => {
    const lowercase = G_ADDRESS.toLowerCase();
    expect(isValidStellarAddress(lowercase)).toBe(false);
  });

  it("rejects special characters", () => {
    const addr = "GAIUIQ7G3TMN53Z2Y3Y5C!I7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
    expect(isValidStellarAddress(addr)).toBe(false);
  });
});

describe("isCAddress", () => {
  it("detects C-address", () => {
    expect(isCAddress(C_ADDRESS)).toBe(true);
  });

  it("rejects G-address", () => {
    expect(isCAddress(G_ADDRESS)).toBe(false);
  });

  it("rejects short address", () => {
    expect(isCAddress("CABC")).toBe(false);
  });
});

describe("isGAddress", () => {
  it("detects G-address", () => {
    expect(isGAddress(G_ADDRESS)).toBe(true);
  });

  it("rejects C-address", () => {
    expect(isGAddress(C_ADDRESS)).toBe(false);
  });
});

describe("getAccountBalances", () => {
  it("returns parsed balances for an existing account", async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "42.5" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: USDC_ISSUER,
          balance: "100",
        },
      ],
    });

    const result = await getAccountBalances(G_ADDRESS, "TESTNET");

    expect(result.total).toBe("42.5");
    expect(result.balances).toHaveLength(2);
    expect(result.balances[0]).toEqual({ asset: "XLM", amount: "42.5" });
    expect(result.balances[1]).toEqual({ asset: "USDC", amount: "100" });
  });

  it("falls back to zero balances when loadAccount throws (404 or network)", async () => {
    mockLoadAccount.mockRejectedValue(new Error("any failure"));

    const result = await getAccountBalances(G_ADDRESS, "PUBLIC");

    expect(result).toEqual({ total: "0", balances: [] });
  });

  it("falls back to zero total when account has no native balance", async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: USDC_ISSUER,
          balance: "50",
        },
      ],
    });

    const result = await getAccountBalances(G_ADDRESS, "TESTNET");

    expect(result.total).toBe("0");
    expect(result.balances).toHaveLength(1);
  });
});

describe("fetchRecentTransactions", () => {
  it("maps payment records into BridgeTransaction objects", async () => {
    mockPaymentsCall.mockResolvedValue({
      records: [
        {
          id: "op-1",
          from: G_ADDRESS,
          to: C_ADDRESS,
          amount: "10.5",
          asset_type: "native",
          transaction_successful: true,
          created_at: "2024-01-01T00:00:00Z",
          transaction_hash: MOCK_TX_HASH,
        },
        {
          id: "op-2",
          from: C_ADDRESS,
          to: G_ADDRESS,
          amount: "200",
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          transaction_successful: false,
          created_at: "2024-01-02T00:00:00Z",
          transaction_hash: "otherhash",
        },
      ],
    });

    const txs = await fetchRecentTransactions(G_ADDRESS, "TESTNET");

    expect(txs).toHaveLength(2);
    expect(txs[0]).toMatchObject({
      id: "op-1",
      fromAddress: G_ADDRESS,
      toAddress: C_ADDRESS,
      amount: "10.5",
      asset: "XLM",
      status: "confirmed",
      type: "g-to-c",
      hash: MOCK_TX_HASH,
    });
    expect(txs[0].timestamp).toBe(new Date("2024-01-01T00:00:00Z").getTime());
    expect(txs[1]).toMatchObject({
      asset: "USDC",
      status: "failed",
      type: "g-to-c",
    });
  });

  it("returns empty array when there are no payments", async () => {
    mockPaymentsCall.mockResolvedValue({ records: [] });

    const txs = await fetchRecentTransactions(G_ADDRESS, "TESTNET");

    expect(txs).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockPaymentsCall.mockRejectedValue(new Error("Network error"));

    const txs = await fetchRecentTransactions(G_ADDRESS, "PUBLIC");

    expect(txs).toEqual([]);
  });

  it("passes the address through to Horizon", async () => {
    mockPaymentsCall.mockResolvedValue({ records: [] });

    await fetchRecentTransactions(G_ADDRESS, "TESTNET", 5);

    expect(mockPayments).toHaveBeenCalled();
    const chain = mockPayments.mock.results[0].value;
    expect(chain.forAccount).toHaveBeenCalledWith(G_ADDRESS);
  });
});

describe("buildAndSubmitPayment", () => {
  it("builds, signs, and submits an XLM payment successfully", async () => {
    const result = await buildAndSubmitPayment(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result).toEqual({ hash: MOCK_TX_HASH, successful: true });
    expect(mockLoadAccount).toHaveBeenCalledWith(G_ADDRESS);
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSubmitTransaction).toHaveBeenCalled();
  });

  it("rejects for insufficient balance (Horizon error)", async () => {
    mockSubmitTransaction.mockRejectedValue(new Error("Insufficient balance"));

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Insufficient balance");
  });

  it("rejects on network error during submit", async () => {
    mockSubmitTransaction.mockRejectedValue(new Error("Network timeout"));

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Network timeout");
  });

  it("rejects when freighter signing fails with an error property", async () => {
    vi.mocked(signTransaction).mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "",
      error: "User declined",
    } as Awaited<ReturnType<typeof signTransaction>>);

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Signing failed: User declined");
  });

  it("throws when the source account lacks a USDC trustline", async () => {
    setupAccountFound();

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "USDC", "TESTNET"),
    ).rejects.toThrow("No USDC trustline found for this account");
  });

  it("submits a USDC payment when the trustline exists", async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "100" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: USDC_ISSUER,
          balance: "500",
        },
      ],
      sequence: "12345",
    });

    const result = await buildAndSubmitPayment(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "USDC",
      "TESTNET",
    );

    expect(result.successful).toBe(true);
  });
});

describe("bridgeViaContract", () => {
  it("routes payment through the bridge contract when BRIDGE_CONTRACT_ID is set", async () => {
    mockBridgeContractId = CONTRACT_ID;

    const result = await bridgeViaContract(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result).toEqual({ hash: MOCK_TX_HASH, successful: true });
    expect(mockLoadAccount).toHaveBeenCalledWith(G_ADDRESS);
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSubmitTransaction).toHaveBeenCalled();
    expect(vi.mocked(Operation.payment).mock.calls[0][0].destination).toBe(
      CONTRACT_ID,
    );
  });

  it("falls back to direct payment when BRIDGE_CONTRACT_ID is empty", async () => {
    mockBridgeContractId = "";

    const result = await bridgeViaContract(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result).toEqual({ hash: MOCK_TX_HASH, successful: true });
    expect(mockLoadAccount).toHaveBeenCalledTimes(1);
    expect(mockSubmitTransaction).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Operation.payment).mock.calls[0][0].destination).toBe(
      C_ADDRESS,
    );
  });

  it("re-wraps result_codes error when submit includes extras result_codes", async () => {
    mockBridgeContractId = CONTRACT_ID;
    mockSubmitTransaction.mockRejectedValue(
      Object.assign(new Error("Horizon submission failed"), {
        response: {
          data: {
            extras: { result_codes: { transaction: "tx_failed" } },
          },
        },
      }),
    );

    await expect(
      bridgeViaContract(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow(/Transaction failed/);
  });

  it("rethrows non-result-codes errors as-is when contract bridge fails", async () => {
    mockBridgeContractId = CONTRACT_ID;
    mockSubmitTransaction.mockRejectedValue(new Error("Network timeout"));

    await expect(
      bridgeViaContract(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Network timeout");
  });
});
