import { describe, it, expect, vi, beforeEach } from "vitest";

// BRIDGE_CONTRACT_ID is a module-level constant (process.env.X || "")
// evaluated at import time, so vi.stubEnv() doesn't work.
// Use a mutable variable + getter mock to allow per-test control.
let mockBridgeContractId = "";

vi.mock("@/lib/types", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/types")
  >("@/lib/types");
  return {
    ...actual,
    get BRIDGE_CONTRACT_ID() {
      return mockBridgeContractId;
    },
  };
});

// Shared mock instances for Horizon.Server
const mockLoadAccount = vi.fn();
const mockSubmitTransaction = vi.fn();
const mockTransactionsCall = vi.fn();
const mockTransactions = vi.fn().mockReturnValue({
  transaction: vi.fn().mockReturnValue({ call: mockTransactionsCall }),
});
const mockPayments = vi.fn().mockReturnValue({
  forAccount: vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({ call: vi.fn() }),
    }),
  }),
});

// Mock freighter-api
vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

// Mock stellar-sdk — override Horizon.Server and TransactionBuilder
vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual<
    typeof import("@stellar/stellar-sdk")
  >("@stellar/stellar-sdk");

  // Must use regular functions (not arrows) for constructors
  function MockHorizonServer() {
    return {
      loadAccount: mockLoadAccount,
      submitTransaction: mockSubmitTransaction,
      transactions: mockTransactions,
      payments: mockPayments,
    };
  }

  // Mock Transaction to avoid real address validation / XDR parsing
  const mockTx = { toXDR: vi.fn().mockReturnValue("mock-xdr") };

  function MockTransactionBuilder(this: Record<string, unknown>) {
    this.addOperation = vi.fn().mockReturnValue(this);
    this.setTimeout = vi.fn().mockReturnValue(this);
    this.build = vi.fn().mockReturnValue(mockTx);
  }
  MockTransactionBuilder.fromXDR = vi
    .fn()
    .mockReturnValue({ toXDR: vi.fn().mockReturnValue("mock-signed-xdr") });

  return {
    ...actual,
    Horizon: {
      ...actual.Horizon,
      Server: MockHorizonServer,
    },
    TransactionBuilder: MockTransactionBuilder,
    // Mock Operation.payment to skip address validation (test addresses
    // don't have valid Stellar checksums)
    Operation: {
      ...actual.Operation,
      payment: vi.fn().mockReturnValue({ type: "payment" }),
    },
  };
});

import { signTransaction } from "@stellar/freighter-api";
import {
  buildAndSubmitPayment,
  bridgeViaContract,
  loadAccountInfo,
  getTransactionStatus,
} from "@/lib/stellar";

const G_ADDRESS =
  "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5";
const C_ADDRESS =
  "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5";
const MOCK_TX_HASH =
  "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

function setupAccount(xlmBalance = "100") {
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
  mockSubmitTransaction.mockResolvedValue({
    hash,
    successful: true,
  });
}

describe("buildAndSubmitPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAccount();
    setupSignSuccess();
    setupSubmitSuccess();
  });

  it("builds, signs, and submits a payment successfully", async () => {
    const result = await buildAndSubmitPayment(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result.hash).toBe(MOCK_TX_HASH);
    expect(result.successful).toBe(true);
    expect(mockLoadAccount).toHaveBeenCalledWith(G_ADDRESS);
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSubmitTransaction).toHaveBeenCalled();
  });

  it("throws when signing fails", async () => {
    vi.mocked(signTransaction).mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "",
      error: "User declined",
    }) as unknown;

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Signing failed: User declined");
  });

  it("throws when submission fails", async () => {
    mockSubmitTransaction.mockRejectedValue(
      new Error("Insufficient balance"),
    );

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Insufficient balance");
  });

  it("throws when trustline is missing for non-native asset", async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [{ asset_type: "native", balance: "100" }],
      sequence: "12345",
    });

    await expect(
      buildAndSubmitPayment(G_ADDRESS, C_ADDRESS, "10", "USDC", "TESTNET"),
    ).rejects.toThrow("No USDC trustline found for this account");
  });
});

describe("bridgeViaContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAccount();
    setupSignSuccess();
    setupSubmitSuccess();
  });

  it("routes through the bridge contract and submits successfully", async () => {
    mockBridgeContractId =
      "CBRIDGE1234567890123456789012345678901234567890123456789012345";

    const result = await bridgeViaContract(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result.hash).toBe(MOCK_TX_HASH);
    expect(result.successful).toBe(true);
    expect(mockLoadAccount).toHaveBeenCalledWith(G_ADDRESS);
    expect(signTransaction).toHaveBeenCalled();
    expect(mockSubmitTransaction).toHaveBeenCalled();
  });

  it("falls back to direct payment when no bridge contract is configured", async () => {
    mockBridgeContractId = "";

    const result = await bridgeViaContract(
      G_ADDRESS,
      C_ADDRESS,
      "10",
      "XLM",
      "TESTNET",
    );

    expect(result.hash).toBe(MOCK_TX_HASH);
    expect(result.successful).toBe(true);
  });

  it("throws with result codes when submission includes extras data", async () => {
    mockBridgeContractId =
      "CBRIDGE1234567890123456789012345678901234567890123456789012345";

    // bridgeViaContract catches this and re-wraps it with result_codes info
    mockSubmitTransaction.mockRejectedValue(
      Object.assign(
        new Error("Horizon submission failed"),
        {
          response: {
            data: {
              extras: {
                result_codes: { transaction: "tx_failed" },
              },
            },
          },
        },
      ),
    );

    await expect(
      bridgeViaContract(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Transaction failed");
  });

  it("re-throws non-result-codes errors as-is", async () => {
    mockBridgeContractId =
      "CBRIDGE1234567890123456789012345678901234567890123456789012345";

    mockSubmitTransaction.mockRejectedValue(new Error("Network timeout"));

    await expect(
      bridgeViaContract(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Network timeout");
  });

  it("throws when signing fails during contract bridge", async () => {
    mockBridgeContractId =
      "CBRIDGE1234567890123456789012345678901234567890123456789012345";

    vi.mocked(signTransaction).mockResolvedValue({
      signedTxXdr: "",
      signerAddress: "",
      error: "User declined",
    }) as unknown;

    await expect(
      bridgeViaContract(G_ADDRESS, C_ADDRESS, "10", "XLM", "TESTNET"),
    ).rejects.toThrow("Signing failed: User declined");
  });
});

describe("loadAccountInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns account exists with balances on success", async () => {
    mockLoadAccount.mockResolvedValue({
      balances: [
        { asset_type: "native", balance: "50" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          balance: "200",
        },
      ],
      sequence: "1",
    });

    const info = await loadAccountInfo(G_ADDRESS, "TESTNET");

    expect(info.exists).toBe(true);
    expect(info.balances).toHaveLength(2);
    expect(info.balances[0]).toEqual({ asset: "XLM", amount: "50" });
    expect(info.balances[1]).toEqual({ asset: "USDC", amount: "200" });
  });

  it("returns account does not exist on 404", async () => {
    mockLoadAccount.mockRejectedValue({ response: { status: 404 } });

    const info = await loadAccountInfo(G_ADDRESS, "TESTNET");

    expect(info.exists).toBe(false);
    expect(info.balances).toEqual([]);
  });

  it("throws on non-404 errors", async () => {
    mockLoadAccount.mockRejectedValue(new Error("Network error"));

    await expect(
      loadAccountInfo(G_ADDRESS, "TESTNET"),
    ).rejects.toThrow("Network error");
  });
});

describe("getTransactionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns confirmed when transaction is successful", async () => {
    mockTransactionsCall.mockResolvedValue({ successful: true });

    const status = await getTransactionStatus(MOCK_TX_HASH, "TESTNET");
    expect(status).toBe("confirmed");
  });

  it("returns failed when transaction is unsuccessful", async () => {
    mockTransactionsCall.mockResolvedValue({ successful: false });

    const status = await getTransactionStatus(MOCK_TX_HASH, "TESTNET");
    expect(status).toBe("failed");
  });

  it("returns pending on 404", async () => {
    mockTransactionsCall.mockRejectedValue({
      response: { status: 404 },
    });

    const status = await getTransactionStatus(MOCK_TX_HASH, "TESTNET");
    expect(status).toBe("pending");
  });
});
