import { describe, it, expect } from "vitest";

type Network = "PUBLIC" | "TESTNET";

function isNetworkMismatched(connected: boolean, walletNetwork: Network, appNetwork: Network): boolean {
  return connected && walletNetwork !== appNetwork;
}

describe("isNetworkMismatched", () => {
  it("returns false when wallet matches app network (both TESTNET)", () => {
    expect(isNetworkMismatched(true, "TESTNET", "TESTNET")).toBe(false);
  });

  it("returns false when wallet matches app network (both PUBLIC)", () => {
    expect(isNetworkMismatched(true, "PUBLIC", "PUBLIC")).toBe(false);
  });

  it("returns true when wallet is PUBLIC but app expects TESTNET", () => {
    expect(isNetworkMismatched(true, "PUBLIC", "TESTNET")).toBe(true);
  });

  it("returns true when wallet is TESTNET but app expects PUBLIC", () => {
    expect(isNetworkMismatched(true, "TESTNET", "PUBLIC")).toBe(true);
  });

  it("returns false when wallet is not connected even if networks differ", () => {
    expect(isNetworkMismatched(false, "PUBLIC", "TESTNET")).toBe(false);
  });
});

describe("appNetwork persistence helpers", () => {
  function parseStoredNetwork(stored: string | null): Network {
    return stored === "PUBLIC" || stored === "TESTNET" ? stored : "TESTNET";
  }

  it("parses PUBLIC from stored string", () => {
    expect(parseStoredNetwork("PUBLIC")).toBe("PUBLIC");
  });

  it("parses TESTNET from stored string", () => {
    expect(parseStoredNetwork("TESTNET")).toBe("TESTNET");
  });

  it("falls back to TESTNET for unknown stored value", () => {
    expect(parseStoredNetwork("UNKNOWN")).toBe("TESTNET");
  });

  it("falls back to TESTNET for null stored value", () => {
    expect(parseStoredNetwork(null)).toBe("TESTNET");
  });
});
