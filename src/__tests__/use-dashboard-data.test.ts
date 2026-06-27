// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/stellar", () => ({
  getAccountBalances: vi.fn(),
  fetchRecentTransactions: vi.fn(),
  isCAddress: vi.fn(),
  getSorobanAccountBalances: vi.fn(),
}));

vi.mock("@/lib/horizon-stream", () => ({
  streamPayments: vi.fn(),
  isStreamingSupported: vi.fn(),
}));

import {
  getAccountBalances,
  fetchRecentTransactions,
  isCAddress,
  getSorobanAccountBalances,
} from "@/lib/stellar";
import { streamPayments, isStreamingSupported } from "@/lib/horizon-stream";
import { useDashboardData } from "@/lib/use-dashboard-data";
import type { BridgeTransaction } from "@/lib/types";

// ── Helpers ────────────────────────────────────────────────────────────────

const G_ADDRESS = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS = "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";

const MOCK_BALANCES = {
  total: "100",
  balances: [{ asset: "XLM", amount: "100" }],
};

const MOCK_TX: BridgeTransaction = {
  id: "tx1",
  fromAddress: G_ADDRESS,
  toAddress: C_ADDRESS,
  amount: "10",
  asset: "XLM",
  status: "confirmed",
  timestamp: Date.now(),
  type: "g-to-c",
  hash: "abc123",
};

function setupDefaultMocks() {
  vi.mocked(isCAddress).mockReturnValue(false);
  vi.mocked(getAccountBalances).mockResolvedValue(MOCK_BALANCES);
  vi.mocked(fetchRecentTransactions).mockResolvedValue([MOCK_TX]);
  vi.mocked(getSorobanAccountBalances).mockResolvedValue(MOCK_BALANCES);
  vi.mocked(isStreamingSupported).mockReturnValue(false);
  vi.mocked(streamPayments).mockReturnValue(() => {});
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("returns loading=true and empty data before first fetch", () => {
      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.balance).toBeNull();
      expect(result.current.transactions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("does not fetch when not connected", async () => {
      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", false)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getAccountBalances).not.toHaveBeenCalled();
      expect(fetchRecentTransactions).not.toHaveBeenCalled();
    });

    it("does not fetch when address is null", async () => {
      const { result } = renderHook(() =>
        useDashboardData(null, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getAccountBalances).not.toHaveBeenCalled();
    });
  });

  describe("data fetching", () => {
    it("fetches balances and transactions on mount", async () => {
      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getAccountBalances).toHaveBeenCalledWith(G_ADDRESS, "TESTNET");
      expect(fetchRecentTransactions).toHaveBeenCalledWith(
        G_ADDRESS,
        "TESTNET",
        expect.any(Number)
      );
      expect(result.current.balance).toBe("100");
      expect(result.current.transactions).toEqual([MOCK_TX]);
      expect(result.current.error).toBeNull();
    });

    it("uses getSorobanAccountBalances for C-addresses", async () => {
      vi.mocked(isCAddress).mockReturnValue(true);

      const { result } = renderHook(() =>
        useDashboardData(C_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(getSorobanAccountBalances).toHaveBeenCalled();
      expect(getAccountBalances).not.toHaveBeenCalled();
    });

    it("sets error state on fetch failure", async () => {
      vi.mocked(getAccountBalances).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Network error");
      expect(result.current.balance).toBeNull();
    });

    it("sets generic error message for non-Error throws", async () => {
      vi.mocked(getAccountBalances).mockRejectedValue("oops");

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Failed to fetch data");
    });
  });

  describe("refresh", () => {
    it("refresh() triggers a new fetch", async () => {
      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = vi.mocked(getAccountBalances).mock.calls.length;

      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() =>
        expect(vi.mocked(getAccountBalances).mock.calls.length).toBeGreaterThan(
          callsBefore
        )
      );
    });
  });

  describe("streaming", () => {
    it("does not stream when isStreamingSupported returns false", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(false);

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(streamPayments).not.toHaveBeenCalled();
      expect(result.current.isStreaming).toBe(false);
    });

    it("does not stream for C-addresses (Soroban, no SSE)", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(true);

      const { result } = renderHook(() =>
        useDashboardData(C_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(streamPayments).not.toHaveBeenCalled();
      expect(result.current.isStreaming).toBe(false);
    });

    it("opens a payment stream for G-addresses when SSE is supported", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(false);

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(streamPayments).toHaveBeenCalledWith(
        G_ADDRESS,
        "TESTNET",
        expect.objectContaining({
          cursor: "now",
          onRecord: expect.any(Function),
          onError: expect.any(Function),
        })
      );
      expect(result.current.isStreaming).toBe(true);
    });

    it("calls the stream cleanup on unmount", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(false);

      const mockCleanup = vi.fn();
      vi.mocked(streamPayments).mockReturnValue(mockCleanup);

      const { result, unmount } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      unmount();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it("refreshes data when a new stream record arrives", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(false);

      let capturedOnRecord: ((record: unknown) => void) | null = null;
      vi.mocked(streamPayments).mockImplementation((_addr, _net, opts) => {
        capturedOnRecord = opts.onRecord;
        return () => {};
      });

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      await waitFor(() => expect(result.current.loading).toBe(false));

      const callsBefore = vi.mocked(getAccountBalances).mock.calls.length;

      // Simulate a new payment arriving on the stream
      await act(async () => {
        capturedOnRecord?.({ id: "new-tx" });
      });

      await waitFor(() =>
        expect(vi.mocked(getAccountBalances).mock.calls.length).toBeGreaterThan(
          callsBefore
        )
      );
    });

    it("sets isStreaming to false and falls back to polling on stream error", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(false);

      let capturedOnError: ((err: Error) => void) | null = null;
      vi.mocked(streamPayments).mockImplementation((_addr, _net, opts) => {
        capturedOnError = opts.onError ?? null;
        return () => {};
      });

      const { result } = renderHook(() =>
        useDashboardData(G_ADDRESS, "TESTNET", true)
      );

      // Wait for the initial fetch to complete and streaming to start
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isStreaming).toBe(true);

      // Simulate stream error — this should mark streaming as inactive
      await act(async () => {
        capturedOnError?.(new Error("SSE disconnected"));
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("cleanup on address/network change", () => {
    it("cancels the previous stream and opens a new one when address changes", async () => {
      vi.mocked(isStreamingSupported).mockReturnValue(true);
      vi.mocked(isCAddress).mockReturnValue(false);

      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      vi.mocked(streamPayments)
        .mockReturnValueOnce(cleanup1)
        .mockReturnValueOnce(cleanup2);

      const G2 = "GBIMUQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5B";

      const { result, rerender } = renderHook(
        ({ addr }: { addr: string }) =>
          useDashboardData(addr, "TESTNET", true),
        { initialProps: { addr: G_ADDRESS } }
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(streamPayments).toHaveBeenCalledTimes(1);

      rerender({ addr: G2 });

      await waitFor(() => expect(streamPayments).toHaveBeenCalledTimes(2));

      expect(cleanup1).toHaveBeenCalled();
    });
  });
});
