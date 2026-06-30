import { describe, it, expect } from "vitest";
import { validateCAddress } from "./validation";

const VALID_C = "CD3PAUUC6WSXPQQM26UNI7ZBRQLOQSLOXYZPCYC32U4C2EDROJZM2MOL";
const CORRUPT_CHECKSUM = "CD3PAUUC6WAXPQQM26UNI7ZBRQLOQSLOXYZPCYC32U4C2EDROJZM2MOL";
const VALID_G = "GA5GHFQ2MX27ZRULWWRWAANVL7SSMDU6LF2A42QK52335UGPCJYWTCT7";

describe("validateCAddress", () => {
  it("returns null for a valid C-address", () => {
    expect(validateCAddress(VALID_C)).toBeNull();
  });

  it("returns null for empty string when not required", () => {
    expect(validateCAddress("")).toBeNull();
  });

  it("returns required error when blank and required=true", () => {
    expect(validateCAddress("", true)).toBe("Contract ID is required.");
  });

  it("flags a valid G-address with the Account ID message", () => {
    const error = validateCAddress(VALID_G);
    expect(error).toBe(
      "This is a Stellar Account ID. Please enter a Soroban Contract ID starting with 'C'."
    );
  });

  it("flags a non-C/non-G prefix with the general format message", () => {
    const error = validateCAddress("XABC123");
    expect(error).toBe(
      "Soroban Contract IDs must be exactly 56 characters long and start with 'C'."
    );
  });

  it("flags a too-short C-prefix string with the general format message", () => {
    const error = validateCAddress("CABC123");
    expect(error).toBe(
      "Soroban Contract IDs must be exactly 56 characters long and start with 'C'."
    );
  });

  it("flags a too-long C-prefix string with the general format message", () => {
    const error = validateCAddress("C" + "A".repeat(56));
    expect(error).toBe(
      "Soroban Contract IDs must be exactly 56 characters long and start with 'C'."
    );
  });

  it("flags a 56-char C-address with corrupted checksum", () => {
    expect(validateCAddress(CORRUPT_CHECKSUM)).toBe(
      "Invalid Contract ID checksum. Check for typos or omitted characters."
    );
  });

  it("flags a G-address with C prefix as bad checksum", () => {
    const gAsC = "C" + VALID_G.slice(1);
    expect(validateCAddress(gAsC)).toBe(
      "Invalid Contract ID checksum. Check for typos or omitted characters."
    );
  });
});
