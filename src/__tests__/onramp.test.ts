import { describe, it, expect } from "vitest";
import { estimateOnrampOutput } from "@/lib/onramp";
import { PROVIDER_MOONPAY, PROVIDER_TRANSAK } from "@/lib/constants";

describe("estimateOnrampOutput", () => {
  describe("edge cases", () => {
    it("returns zeros for amount of 0", () => {
      expect(estimateOnrampOutput(0, PROVIDER_MOONPAY)).toEqual({ fee: 0, receive: 0 });
      expect(estimateOnrampOutput(0, PROVIDER_TRANSAK)).toEqual({ fee: 0, receive: 0 });
    });

    it("returns zeros for negative amounts", () => {
      expect(estimateOnrampOutput(-100, PROVIDER_MOONPAY)).toEqual({ fee: 0, receive: 0 });
      expect(estimateOnrampOutput(-1, PROVIDER_TRANSAK)).toEqual({ fee: 0, receive: 0 });
    });

    it("handles very large amounts without overflow", () => {
      const result = estimateOnrampOutput(1_000_000_000, PROVIDER_MOONPAY);
      expect(result.fee).toBe(45_000_000);
      expect(result.receive).toBe(950_000_000);
    });
  });

  describe("Moonpay provider", () => {
    it("calculates 4.5% fee", () => {
      const { fee } = estimateOnrampOutput(100, PROVIDER_MOONPAY);
      expect(fee).toBeCloseTo(4.5, 10);
    });

    it("calculates receive as 95% of amount (0.95 * 1 multiplier)", () => {
      const { receive } = estimateOnrampOutput(100, PROVIDER_MOONPAY);
      expect(receive).toBeCloseTo(95, 10);
    });

    it("scales correctly for $200", () => {
      const { fee, receive } = estimateOnrampOutput(200, PROVIDER_MOONPAY);
      expect(fee).toBeCloseTo(9, 10);
      expect(receive).toBeCloseTo(190, 10);
    });
  });

  describe("Transak provider", () => {
    it("calculates 5% fee", () => {
      const { fee } = estimateOnrampOutput(100, PROVIDER_TRANSAK);
      expect(fee).toBeCloseTo(5, 10);
    });

    it("calculates receive as 90.25% of amount (0.95 * 0.95 multiplier)", () => {
      const { receive } = estimateOnrampOutput(100, PROVIDER_TRANSAK);
      expect(receive).toBeCloseTo(90.25, 10);
    });

    it("scales correctly for $200", () => {
      const { fee, receive } = estimateOnrampOutput(200, PROVIDER_TRANSAK);
      expect(fee).toBeCloseTo(10, 10);
      expect(receive).toBeCloseTo(180.5, 10);
    });
  });

  describe("provider differences", () => {
    it("Moonpay has a lower fee rate than Transak", () => {
      const moonpay = estimateOnrampOutput(100, PROVIDER_MOONPAY);
      const transak = estimateOnrampOutput(100, PROVIDER_TRANSAK);
      expect(moonpay.fee).toBeLessThan(transak.fee);
    });

    it("Moonpay yields more USDC than Transak for the same amount", () => {
      const moonpay = estimateOnrampOutput(100, PROVIDER_MOONPAY);
      const transak = estimateOnrampOutput(100, PROVIDER_TRANSAK);
      expect(moonpay.receive).toBeGreaterThan(transak.receive);
    });
  });
});
