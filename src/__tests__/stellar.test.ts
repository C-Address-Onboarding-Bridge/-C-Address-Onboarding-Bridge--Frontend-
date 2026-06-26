import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

import { isConnected, getAddress, getNetwork } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";
import {
  isValidStellarAddress,
  isCAddress,
  isGAddress,
  connectWallet,
  checkConnection,
  getWalletAddress,
  getCurrentNetwork,
  isNativeAsset,
} from "@/lib/stellar";

const G_ADDRESS = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS = "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const PK = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5";

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

  it("rejects invalid prefix", () => {
    const addr = "X" + G_ADDRESS.slice(1);
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

  it("rejects short address", () => {
    expect(isGAddress("CABC")).toBe(false);
  });

  it("rejects G-address with wrong length", () => {
    expect(isGAddress("GABC")).toBe(false);
  });
});

describe("connectWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false, error: null });
    vi.mocked(getAddress).mockResolvedValue({ address: "" });
  });

  it("returns public key on successful connection", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true, error: null });
    vi.mocked(getAddress).mockResolvedValue({ address: PK });

    const result = await connectWallet();

    expect(result).toBe(PK);
    expect(result).not.toBe("");
  });

  it("returns the exact address from getAddress, not a static value", async () => {
    const addr1 = "GABCDE" + "A".repeat(50);
    const addr2 = "GXYZ01" + "B".repeat(50);
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true, error: null });

    vi.mocked(getAddress).mockResolvedValue({ address: addr1 });
    expect(await connectWallet()).toBe(addr1);

    vi.mocked(getAddress).mockResolvedValue({ address: addr2 });
    expect(await connectWallet()).toBe(addr2);
  });

  it("returns null when Freighter is not installed (isConnected returns false)", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false, error: null });

    const result = await connectWallet();

    expect(result).toBeNull();
  });

  it("returns null on user rejection (isConnected throws)", async () => {
    vi.mocked(isConnected).mockRejectedValue(new Error("User rejected"));

    const result = await connectWallet();

    expect(result).toBeNull();
  });

  it("returns null when getAddress throws", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true, error: null });
    vi.mocked(getAddress).mockRejectedValue(new Error("Permission denied"));

    const result = await connectWallet();

    expect(result).toBeNull();
  });
});

describe("checkConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when wallet is connected", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true, error: null });

    const result = await checkConnection();

    expect(result).toBe(true);
  });

  it("returns false when wallet is not connected", async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false, error: null });

    const result = await checkConnection();

    expect(result).toBe(false);
  });

  it("returns false when isConnected throws", async () => {
    vi.mocked(isConnected).mockRejectedValue(new Error("Network error"));

    const result = await checkConnection();

    expect(result).toBe(false);
  });
});

describe("getWalletAddress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns address on success", async () => {
    vi.mocked(getAddress).mockResolvedValue({ address: PK });

    const result = await getWalletAddress();

    expect(result).toBe(PK);
  });

  it("returns null when getAddress throws", async () => {
    vi.mocked(getAddress).mockRejectedValue(new Error("Not connected"));

    const result = await getWalletAddress();

    expect(result).toBeNull();
  });
});

describe("getCurrentNetwork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PUBLIC when network passphrase is public", async () => {
    vi.mocked(getNetwork).mockResolvedValue({ network: Networks.PUBLIC, networkPassphrase: Networks.PUBLIC });

    const result = await getCurrentNetwork();

    expect(result).toBe("PUBLIC");
  });

  it("returns TESTNET when network passphrase is testnet", async () => {
    vi.mocked(getNetwork).mockResolvedValue({ network: Networks.TESTNET, networkPassphrase: Networks.TESTNET });

    const result = await getCurrentNetwork();

    expect(result).toBe("TESTNET");
  });

  it("returns TESTNET when network passphrase is unrecognized", async () => {
    vi.mocked(getNetwork).mockResolvedValue({ network: "Some Future Network", networkPassphrase: "Some Future Network" });

    const result = await getCurrentNetwork();

    expect(result).toBe("TESTNET");
  });

  it("returns TESTNET on error", async () => {
    vi.mocked(getNetwork).mockRejectedValue(new Error("Unavailable"));

    const result = await getCurrentNetwork();

    expect(result).toBe("TESTNET");
  });
});

describe("isNativeAsset", () => {
  it("returns true for XLM", () => {
    expect(isNativeAsset("XLM")).toBe(true);
  });

  it("returns false for USDC", () => {
    expect(isNativeAsset("USDC")).toBe(false);
  });

  it("returns false for arbitrary token code", () => {
    expect(isNativeAsset("yXLM")).toBe(false);
  });
});