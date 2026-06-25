import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidStellarAddress, isCAddress, isGAddress } from "@/lib/stellar";

// Base-32 alphabet used by Stellar (uppercase letters + digits, no I/L/O/U)
const STELLAR_CHARS = "ABCDEFGHJKMNPQRSTVWXYZ234567";

const validGAddress = fc
  .stringOf(fc.constantFrom(...STELLAR_CHARS.split("")), { minLength: 55, maxLength: 55 })
  .map((s) => "G" + s);

const validCAddress = fc
  .stringOf(fc.constantFrom(...STELLAR_CHARS.split("")), { minLength: 55, maxLength: 55 })
  .map((s) => "C" + s);

describe("isValidStellarAddress — property-based", () => {
  it("accepts all syntactically valid G-addresses", () => {
    fc.assert(
      fc.property(validGAddress, (addr) => {
        expect(isValidStellarAddress(addr)).toBe(true);
      })
    );
  });

  it("accepts all syntactically valid C-addresses", () => {
    fc.assert(
      fc.property(validCAddress, (addr) => {
        expect(isValidStellarAddress(addr)).toBe(true);
      })
    );
  });

  it("is idempotent: valid addresses stay valid when re-validated", () => {
    fc.assert(
      fc.property(fc.oneof(validGAddress, validCAddress), (addr) => {
        const first = isValidStellarAddress(addr);
        const second = isValidStellarAddress(addr);
        expect(first).toBe(second);
      })
    );
  });

  it("rejects addresses with wrong length (< 56)", () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...STELLAR_CHARS.split("")), { minLength: 1, maxLength: 55 }).map((s) => "G" + s.slice(0, Math.max(0, s.length - 1))),
        (addr) => {
          if (addr.length === 56) return; // skip accidental valid length
          expect(isValidStellarAddress(addr)).toBe(false);
        }
      )
    );
  });

  it("rejects addresses with wrong length (> 56)", () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...STELLAR_CHARS.split("")), { minLength: 56, maxLength: 100 }).map((s) => "G" + s),
        (addr) => {
          if (addr.length === 56) return;
          expect(isValidStellarAddress(addr)).toBe(false);
        }
      )
    );
  });

  it("rejects addresses with invalid prefix characters", () => {
    const invalidPrefixes = "ABDEFHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidPrefixes),
        fc.stringOf(fc.constantFrom(...STELLAR_CHARS.split("")), { minLength: 55, maxLength: 55 }),
        (prefix, rest) => {
          expect(isValidStellarAddress(prefix + rest)).toBe(false);
        }
      )
    );
  });

  it("rejects addresses containing lowercase letters", () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.char().filter((c) => /[a-z]/.test(c)), { minLength: 1, maxLength: 10 }),
        (lower) => {
          const addr = "G" + lower.padEnd(55, "A");
          if (addr.length !== 56) return;
          expect(isValidStellarAddress(addr)).toBe(false);
        }
      )
    );
  });

  it("rejects empty string always", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });
});

describe("isCAddress — property-based", () => {
  it("always true for valid C-addresses", () => {
    fc.assert(
      fc.property(validCAddress, (addr) => {
        expect(isCAddress(addr)).toBe(true);
      })
    );
  });

  it("always false for G-addresses", () => {
    fc.assert(
      fc.property(validGAddress, (addr) => {
        expect(isCAddress(addr)).toBe(false);
      })
    );
  });
});

describe("isGAddress — property-based", () => {
  it("always true for valid G-addresses", () => {
    fc.assert(
      fc.property(validGAddress, (addr) => {
        expect(isGAddress(addr)).toBe(true);
      })
    );
  });

  it("always false for C-addresses", () => {
    fc.assert(
      fc.property(validCAddress, (addr) => {
        expect(isGAddress(addr)).toBe(false);
      })
    );
  });
});
