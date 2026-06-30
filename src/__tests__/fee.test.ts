import { describe, it, expect } from "vitest";
import { validateFee, xlmToStroops, stroopsToXlm } from "@/lib/stellar";

describe("validateFee", () => {
  it("accepts fee equal to base fee", () => {
    expect(validateFee("100", "100")).toBe(true);
  });

  it("accepts fee above base fee", () => {
    expect(validateFee("200", "100")).toBe(true);
  });

  it("rejects fee below base fee", () => {
    expect(validateFee("50", "100")).toBe(false);
  });

  it("scales minimum by op count", () => {
    expect(validateFee("200", "100", 2)).toBe(true);
    expect(validateFee("199", "100", 2)).toBe(false);
  });

  it("defaults to 1 operation", () => {
    expect(validateFee("100", "100", 1)).toBe(true);
  });
});

describe("xlmToStroops", () => {
  it("converts 1 XLM to 10000000 stroops", () => {
    expect(xlmToStroops("1")).toBe("10000000");
  });

  it("converts 0.00001 XLM to 100 stroops", () => {
    expect(xlmToStroops("0.00001")).toBe("100");
  });

  it("converts 0 XLM to 0 stroops", () => {
    expect(xlmToStroops("0")).toBe("0");
  });

  it("handles fractional stroops by rounding", () => {
    expect(xlmToStroops("0.000000001")).toBe("0");
  });
});

describe("stroopsToXlm", () => {
  it("converts 10000000 stroops to 1 XLM", () => {
    expect(stroopsToXlm("10000000")).toBe("1.0000000");
  });

  it("converts 100 stroops to 0.00001 XLM", () => {
    expect(stroopsToXlm("100")).toBe("0.0000100");
  });

  it("converts 0 stroops to 0 XLM", () => {
    expect(stroopsToXlm("0")).toBe("0.0000000");
  });
});
