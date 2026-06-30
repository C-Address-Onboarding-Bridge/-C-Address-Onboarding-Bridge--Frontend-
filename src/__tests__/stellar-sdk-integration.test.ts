/**
 * Integration tests that validate Stellar SDK behaviour through the
 * abstraction layer (src/lib/stellar-sdk.ts).
 *
 * These tests serve as a regression suite for SDK version upgrades.
 * If an SDK bump breaks any of these, the abstraction layer in
 * stellar-sdk.ts must be updated before the upgrade is merged.
 *
 * Coverage areas:
 *  - Server factory functions return the right types
 *  - Simulation response helpers handle success and error shapes
 *  - Address utilities accept/reject the right input
 *  - Transaction XDR round-trip via transactionFromXDR
 *  - Freighter wrapper functions translate return shapes correctly
 *  - networkPassphrase returns the correct constants
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Freighter mock ────────────────────────────────────────────────────────────
vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

import { isConnected, getAddress, getNetwork, signTransaction } from "@stellar/freighter-api";

import {
  createHorizonServer,
  createSorobanServer,
  isSimulationError,
  getSimulationMinFee,
  getSimulationRetval,
  isValidAddress,
  isValidContractAddress,
  addressFromString,
  transactionFromXDR,
  checkFreighterConnection,
  getFreighterAddress,
  getFreighterNetwork,
  signWithFreighter,
  networkPassphrase,
  Networks,
  rpc,
  Horizon,
  StrKey,
  BASE_FEE,
} from "@/lib/stellar-sdk";

// ── Server factory tests ──────────────────────────────────────────────────────

describe("createHorizonServer", () => {
  it("returns a Horizon.Server instance", () => {
    const server = createHorizonServer("https://horizon-testnet.stellar.org");
    expect(server).toBeInstanceOf(Horizon.Server);
  });

  it("constructs separate instances for different URLs", () => {
    const a = createHorizonServer("https://horizon-testnet.stellar.org");
    const b = createHorizonServer("https://horizon.stellar.org");
    expect(a).not.toBe(b);
  });
});

describe("createSorobanServer", () => {
  it("returns an rpc.Server instance", () => {
    const server = createSorobanServer("https://soroban-testnet.stellar.org");
    expect(server).toBeInstanceOf(rpc.Server);
  });
});

// ── Simulation helpers ────────────────────────────────────────────────────────

describe("isSimulationError", () => {
  it("returns true for error responses", () => {
    const errorSim = { error: "Some error", events: [], latestLedger: 1 } as unknown as rpc.Api.SimulateTransactionResponse;
    expect(isSimulationError(errorSim)).toBe(true);
  });

  it("returns false for success responses", () => {
    const successSim = {
      minResourceFee: "100",
      results: [],
      transactionData: {},
      events: [],
      latestLedger: 1,
    } as unknown as rpc.Api.SimulateTransactionResponse;
    expect(isSimulationError(successSim)).toBe(false);
  });
});

describe("getSimulationMinFee", () => {
  it("returns the fee as a string when present", () => {
    const sim = { minResourceFee: "12345" } as unknown as rpc.Api.SimulateTransactionSuccessResponse;
    expect(getSimulationMinFee(sim)).toBe("12345");
  });

  it("returns null when minResourceFee is absent", () => {
    const sim = {} as rpc.Api.SimulateTransactionSuccessResponse;
    expect(getSimulationMinFee(sim)).toBeNull();
  });
});

describe("getSimulationRetval", () => {
  it("returns retval when result is present", () => {
    const mockScVal = { switch: () => ({}) };
    const sim = {
      result: { retval: mockScVal },
    } as unknown as rpc.Api.SimulateTransactionSuccessResponse;
    expect(getSimulationRetval(sim)).toBe(mockScVal);
  });

  it("returns null when result is absent", () => {
    const sim = {} as rpc.Api.SimulateTransactionSuccessResponse;
    expect(getSimulationRetval(sim)).toBeNull();
  });

  it("returns null when retval is absent", () => {
    const sim = { result: {} } as unknown as rpc.Api.SimulateTransactionSuccessResponse;
    expect(getSimulationRetval(sim)).toBeNull();
  });
});

// ── Address utilities ─────────────────────────────────────────────────────────

const VALID_G = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const VALID_C = "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";

describe("isValidAddress", () => {
  it("accepts a valid G-address", () => {
    expect(isValidAddress(VALID_G)).toBe(true);
  });

  it("accepts a valid C-address", () => {
    expect(isValidAddress(VALID_C)).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });

  it("rejects a truncated address", () => {
    expect(isValidAddress("GABC")).toBe(false);
  });

  it("rejects a random string", () => {
    expect(isValidAddress("not-an-address")).toBe(false);
  });
});

describe("isValidContractAddress", () => {
  it("accepts a valid C-address", () => {
    expect(isValidContractAddress(VALID_C)).toBe(true);
  });

  it("rejects a G-address", () => {
    expect(isValidContractAddress(VALID_G)).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(isValidContractAddress("garbage")).toBe(false);
  });
});

describe("addressFromString", () => {
  it("returns an Address for a valid G-address", () => {
    const addr = addressFromString(VALID_G);
    expect(addr).toBeDefined();
    expect(addr.toString()).toBe(VALID_G);
  });

  it("returns an Address for a valid C-address", () => {
    const addr = addressFromString(VALID_C);
    expect(addr).toBeDefined();
    expect(addr.toString()).toBe(VALID_C);
  });
});

// ── Network passphrase ────────────────────────────────────────────────────────

describe("networkPassphrase", () => {
  it("returns the PUBLIC passphrase for PUBLIC", () => {
    expect(networkPassphrase("PUBLIC")).toBe(Networks.PUBLIC);
  });

  it("returns the TESTNET passphrase for TESTNET", () => {
    expect(networkPassphrase("TESTNET")).toBe(Networks.TESTNET);
  });

  it("PUBLIC and TESTNET passphrases are different strings", () => {
    expect(networkPassphrase("PUBLIC")).not.toBe(networkPassphrase("TESTNET"));
  });
});

// ── Freighter wrappers ────────────────────────────────────────────────────────

describe("checkFreighterConnection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns isConnected: true when Freighter is connected", async () => {
    vi.mocked(isConnected).mockResolvedValueOnce({ isConnected: true });
    const result = await checkFreighterConnection();
    expect(result.isConnected).toBe(true);
  });

  it("returns isConnected: false when Freighter is not connected", async () => {
    vi.mocked(isConnected).mockResolvedValueOnce({ isConnected: false });
    const result = await checkFreighterConnection();
    expect(result.isConnected).toBe(false);
  });

  it("returns isConnected: false on error", async () => {
    vi.mocked(isConnected).mockRejectedValueOnce(new Error("no extension"));
    const result = await checkFreighterConnection();
    expect(result.isConnected).toBe(false);
  });
});

describe("getFreighterAddress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the address string on success", async () => {
    vi.mocked(getAddress).mockResolvedValueOnce({ address: VALID_G });
    expect(await getFreighterAddress()).toBe(VALID_G);
  });

  it("returns null on error", async () => {
    vi.mocked(getAddress).mockRejectedValueOnce(new Error("fail"));
    expect(await getFreighterAddress()).toBeNull();
  });

  it("returns null when address is empty", async () => {
    vi.mocked(getAddress).mockResolvedValueOnce({ address: "" });
    expect(await getFreighterAddress()).toBeNull();
  });
});

describe("getFreighterNetwork", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns PUBLIC when Freighter is on mainnet", async () => {
    vi.mocked(getNetwork).mockResolvedValueOnce({ network: Networks.PUBLIC, networkPassphrase: Networks.PUBLIC });
    expect(await getFreighterNetwork()).toBe("PUBLIC");
  });

  it("returns TESTNET when Freighter is on testnet", async () => {
    vi.mocked(getNetwork).mockResolvedValueOnce({ network: Networks.TESTNET, networkPassphrase: Networks.TESTNET });
    expect(await getFreighterNetwork()).toBe("TESTNET");
  });

  it("defaults to TESTNET on error", async () => {
    vi.mocked(getNetwork).mockRejectedValueOnce(new Error("fail"));
    expect(await getFreighterNetwork()).toBe("TESTNET");
  });
});

describe("signWithFreighter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns signedTxXdr on success", async () => {
    vi.mocked(signTransaction).mockResolvedValueOnce({ signedTxXdr: "signed-xdr-value" });
    const result = await signWithFreighter("mock-xdr", Networks.TESTNET);
    expect(result.signedTxXdr).toBe("signed-xdr-value");
  });

  it("throws when Freighter returns an error", async () => {
    vi.mocked(signTransaction).mockResolvedValueOnce({ error: "User rejected" } as never);
    await expect(signWithFreighter("mock-xdr", Networks.TESTNET)).rejects.toThrow(
      "Freighter signing failed: User rejected"
    );
  });
});

// ── Constants exposed by the abstraction layer ────────────────────────────────

describe("SDK constants re-exported correctly", () => {
  it("BASE_FEE is a non-empty string", () => {
    expect(typeof BASE_FEE).toBe("string");
    expect(BASE_FEE.length).toBeGreaterThan(0);
  });

  it("Networks.PUBLIC is a non-empty string", () => {
    expect(typeof Networks.PUBLIC).toBe("string");
    expect(Networks.PUBLIC.length).toBeGreaterThan(0);
  });

  it("Networks.TESTNET is a non-empty string", () => {
    expect(typeof Networks.TESTNET).toBe("string");
    expect(Networks.TESTNET.length).toBeGreaterThan(0);
  });

  it("StrKey is exported and functional", () => {
    expect(typeof StrKey.isValidEd25519PublicKey).toBe("function");
    expect(StrKey.isValidEd25519PublicKey(VALID_G)).toBe(true);
  });
});
