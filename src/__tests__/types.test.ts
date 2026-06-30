import { describe, it, expect } from "vitest";
import { CEX_LIST, STELLAR_NETWORK, SOROBAN_RPC_URL, HORIZON_URL } from "@/lib/types";

describe("CEX_LIST", () => {
  it("has three exchanges", () => {
    expect(CEX_LIST).toHaveLength(3);
  });

  it("each exchange has required fields", () => {
    for (const cex of CEX_LIST) {
      expect(cex.name).toBeTruthy();
      expect(cex.logo).toBeTruthy();
      expect(cex.supportedNetworks.length).toBeGreaterThan(0);
      expect(cex.minWithdrawal).toBeTruthy();
      expect(cex.fee).toBeTruthy();
      expect(cex.withdrawalUrl).toBeTruthy();
    }
  });
});

describe("Network constants", () => {
  it("has PUBLIC, TESTNET, and SANDBOX", () => {
    expect(STELLAR_NETWORK.PUBLIC).toBe("PUBLIC");
    expect(STELLAR_NETWORK.TESTNET).toBe("TESTNET");
    expect(STELLAR_NETWORK.SANDBOX).toBe("SANDBOX");
  });

  it("Soroban RPC URLs are valid", () => {
    expect(SOROBAN_RPC_URL.TESTNET).toContain("testnet");
    expect(SOROBAN_RPC_URL.SANDBOX).toContain("localhost");
  });

  it("Horizon URLs are valid", () => {
    expect(HORIZON_URL.TESTNET).toContain("testnet");
    expect(HORIZON_URL.SANDBOX).toContain("localhost");
  });
});
