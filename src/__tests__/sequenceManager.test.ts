import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getNextSequenceNumber,
  invalidateSequenceCache,
  clearAllSequenceCache,
  isBadSequenceError,
  withSequenceRetry,
} from "@/lib/sequenceManager";
import { Horizon, rpc } from "@stellar/stellar-sdk";

// Mock server implementations
const mockHorizonServer = {
  loadAccount: vi.fn(),
} as unknown as Horizon.Server;

const mockSorobanRpcServer = {
  getAccount: vi.fn(),
} as unknown as rpc.Server;

const testAccountId = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5V3VQ";

beforeEach(() => {
  clearAllSequenceCache();
  vi.clearAllMocks();
  vi.useFakeTimers();
});

describe("sequenceManager", () => {
  describe("getNextSequenceNumber", () => {
    it("fetches from network on cache miss", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const result = await getNextSequenceNumber(testAccountId, mockHorizonServer);

      expect(result).toBe(100n);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledWith(testAccountId);
    });

    it("increments cache on second call", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const first = await getNextSequenceNumber(testAccountId, mockHorizonServer);
      const second = await getNextSequenceNumber(testAccountId, mockHorizonServer);

      expect(first).toBe(100n);
      expect(second).toBe(101n);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(1);
    });

    it("increments multiple times within cache TTL", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await getNextSequenceNumber(testAccountId, mockHorizonServer));
      }

      expect(results).toEqual([100n, 101n, 102n, 103n, 104n]);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(1);
    });

    it("refetches after cache expiry", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      // First call
      await getNextSequenceNumber(testAccountId, mockHorizonServer);

      // Advance time past TTL (30 seconds)
      vi.advanceTimersByTime(31_000);

      // Update mock to return different sequence
      (mockHorizonServer.loadAccount as any).mockResolvedValue({
        sequenceNumber: () => "200",
      });

      // Second call after TTL should refetch
      const result = await getNextSequenceNumber(testAccountId, mockHorizonServer);

      expect(result).toBe(200n);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(2);
    });

    it("handles SorobanRpc server", async () => {
      const mockAccount = { sequence: "100" };
      (mockSorobanRpcServer.getAccount as any).mockResolvedValue(mockAccount);

      const result = await getNextSequenceNumber(testAccountId, mockSorobanRpcServer);

      expect(result).toBe(100n);
      expect(mockSorobanRpcServer.getAccount).toHaveBeenCalledWith(testAccountId);
    });
  });

  describe("invalidateSequenceCache", () => {
    it("causes refetch on next call", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      // Fetch and cache
      await getNextSequenceNumber(testAccountId, mockHorizonServer);

      // Invalidate cache
      invalidateSequenceCache(testAccountId);

      // Update mock to return different sequence
      (mockHorizonServer.loadAccount as any).mockResolvedValue({
        sequenceNumber: () => "200",
      });

      // Next call should refetch
      const result = await getNextSequenceNumber(testAccountId, mockHorizonServer);

      expect(result).toBe(200n);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(2);
    });

    it("only invalidates specified account", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const accountId1 = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5V3VQ";
      const accountId2 = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBTUMXBQ";

      // Fetch both accounts
      await getNextSequenceNumber(accountId1, mockHorizonServer);
      await getNextSequenceNumber(accountId2, mockHorizonServer);

      // Invalidate only accountId1
      invalidateSequenceCache(accountId1);

      // Update mock
      (mockHorizonServer.loadAccount as any).mockResolvedValue({
        sequenceNumber: () => "200",
      });

      // Next call for accountId1 should refetch
      const result1 = await getNextSequenceNumber(accountId1, mockHorizonServer);
      expect(result1).toBe(200n);

      // Next call for accountId2 should use cache (101n from cached 100n)
      const result2 = await getNextSequenceNumber(accountId2, mockHorizonServer);
      expect(result2).toBe(101n);
    });
  });

  describe("isBadSequenceError", () => {
    it("returns true for Horizon tx_bad_seq error", () => {
      const error = {
        response: {
          data: {
            extras: {
              result_codes: {
                transaction: "tx_bad_seq",
              },
            },
          },
        },
      };

      expect(isBadSequenceError(error)).toBe(true);
    });

    it("returns true for error message containing bad_seq", () => {
      const error = new Error("Transaction failed: bad_seq error");

      expect(isBadSequenceError(error)).toBe(true);
    });

    it("returns true for error message containing tx_bad_seq", () => {
      const error = new Error("tx_bad_seq: sequence number too far in the future");

      expect(isBadSequenceError(error)).toBe(true);
    });

    it("returns false for unrelated errors", () => {
      const error = new Error("Transaction failed: insufficient balance");

      expect(isBadSequenceError(error)).toBe(false);
    });

    it("returns false for non-error objects", () => {
      expect(isBadSequenceError(null)).toBe(false);
      expect(isBadSequenceError(undefined)).toBe(false);
      expect(isBadSequenceError({})).toBe(false);
      expect(isBadSequenceError("some string")).toBe(false);
    });
  });

  describe("withSequenceRetry", () => {
    it("calls function once on success", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const fn = vi.fn().mockResolvedValue("success");

      const result = await withSequenceRetry(testAccountId, fn, mockHorizonServer);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("retries on bad_seq error", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const badSeqError = {
        response: {
          data: {
            extras: {
              result_codes: {
                transaction: "tx_bad_seq",
              },
            },
          },
        },
      };

      const fn = vi.fn();
      fn.mockRejectedValueOnce(badSeqError);
      fn.mockResolvedValueOnce("success");

      const result = await withSequenceRetry(testAccountId, fn, mockHorizonServer);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("invalidates cache between retries", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const badSeqError = {
        response: {
          data: {
            extras: {
              result_codes: {
                transaction: "tx_bad_seq",
              },
            },
          },
        },
      };

      const fn = vi.fn();
      fn.mockRejectedValueOnce(badSeqError);
      fn.mockResolvedValueOnce("success");

      await withSequenceRetry(testAccountId, fn, mockHorizonServer);

      // Should have called loadAccount at least twice (initial + after invalidation)
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(2);
    });

    it("does not retry on non-seq error", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const nonSeqError = new Error("Transaction failed: insufficient balance");

      const fn = vi.fn().mockRejectedValue(nonSeqError);

      await expect(
        withSequenceRetry(testAccountId, fn, mockHorizonServer)
      ).rejects.toThrow("Transaction failed: insufficient balance");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("throws after maxRetries exceeded", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const badSeqError = {
        response: {
          data: {
            extras: {
              result_codes: {
                transaction: "tx_bad_seq",
              },
            },
          },
        },
      };

      const fn = vi.fn().mockRejectedValue(badSeqError);

      await expect(
        withSequenceRetry(testAccountId, fn, mockHorizonServer, 2)
      ).rejects.toEqual(badSeqError);

      // Should attempt maxRetries + 1 times
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("passes getSequence function to fn", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      let capturedSequence: bigint | null = null;

      const fn = vi.fn(async (getSequence: () => Promise<bigint>) => {
        capturedSequence = await getSequence();
        return "success";
      });

      await withSequenceRetry(testAccountId, fn, mockHorizonServer);

      expect(capturedSequence).toBe(100n);
    });

    it("applies retry delay between attempts", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const badSeqError = {
        response: {
          data: {
            extras: {
              result_codes: {
                transaction: "tx_bad_seq",
              },
            },
          },
        },
      };

      const fn = vi.fn();
      fn.mockRejectedValueOnce(badSeqError);
      fn.mockResolvedValueOnce("success");

      const promise = withSequenceRetry(testAccountId, fn, mockHorizonServer);

      // Advance time to trigger retry
      await vi.advanceTimersToNextTimerAsync();

      const result = await promise;

      expect(result).toBe("success");
    });
  });

  describe("clearAllSequenceCache", () => {
    it("clears all cached sequences", async () => {
      const mockAccount = { sequenceNumber: () => "100" };
      (mockHorizonServer.loadAccount as any).mockResolvedValue(mockAccount);

      const accountId1 = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5V3VQ";
      const accountId2 = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBTUMXBQ";

      // Fetch both accounts
      await getNextSequenceNumber(accountId1, mockHorizonServer);
      await getNextSequenceNumber(accountId2, mockHorizonServer);

      // Clear all cache
      clearAllSequenceCache();

      // Update mock
      (mockHorizonServer.loadAccount as any).mockResolvedValue({
        sequenceNumber: () => "200",
      });

      // Both should refetch
      const result1 = await getNextSequenceNumber(accountId1, mockHorizonServer);
      const result2 = await getNextSequenceNumber(accountId2, mockHorizonServer);

      expect(result1).toBe(200n);
      expect(result2).toBe(200n);
      expect(mockHorizonServer.loadAccount).toHaveBeenCalledTimes(4);
    });
  });
});
