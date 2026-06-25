import { describe, it, expect } from "vitest";
import { isValidStellarAddress, isCAddress, isGAddress, isNativeAsset } from "@/lib/stellar";

const G_ADDRESS = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS = "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";

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