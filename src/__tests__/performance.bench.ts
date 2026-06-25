import { bench, describe } from "vitest";
import { isValidStellarAddress, isCAddress, isGAddress } from "@/lib/stellar";
import type { AccountBalances, BridgeTransaction } from "@/lib/stellar";

// --- Fixtures ---

const G_ADDRESS = "GAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";
const C_ADDRESS = "CAIUIQ7G3TMN53Z2Y3Y5CJI7Q7ZQJX4W5F5N5Z5Q5Z5Q5Z5Q5Z5Q5Z5A";

function makeBalances(count: number): AccountBalances {
  const balances = Array.from({ length: count }, (_, i) => ({
    asset: i === 0 ? "XLM" : `TOKEN${i}`,
    amount: (Math.random() * 1000).toFixed(7),
  }));
  return { total: balances[0]?.amount ?? "0", balances };
}

function makeTransactions(count: number): BridgeTransaction[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${i}`,
    fromAddress: G_ADDRESS,
    toAddress: C_ADDRESS,
    amount: (Math.random() * 100).toFixed(7),
    asset: i % 2 === 0 ? "XLM" : "USDC",
    status: "confirmed" as const,
    timestamp: Date.now() - i * 1000,
    type: "g-to-c" as const,
    hash: `abc${i}`,
  }));
}

// Simulate transaction history rendering (filter + sort — no DOM needed)
function renderTransactionHistory(txs: BridgeTransaction[]): BridgeTransaction[] {
  return txs
    .filter((t) => t.status === "confirmed")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50);
}

// Simulate getAccountBalances with mock data (no network call)
function processAccountBalances(raw: AccountBalances): AccountBalances {
  const balances = raw.balances.map((b) => ({ ...b }));
  const total = balances.find((b) => b.asset === "XLM")?.amount ?? "0";
  return { total, balances };
}

// --- Benchmarks ---

describe("address validation throughput", () => {
  bench("isValidStellarAddress — valid G-address", () => {
    isValidStellarAddress(G_ADDRESS);
  });

  bench("isValidStellarAddress — valid C-address", () => {
    isValidStellarAddress(C_ADDRESS);
  });

  bench("isValidStellarAddress — invalid address", () => {
    isValidStellarAddress("not-an-address");
  });

  bench("isCAddress", () => {
    isCAddress(C_ADDRESS);
  });

  bench("isGAddress", () => {
    isGAddress(G_ADDRESS);
  });
});

describe("getAccountBalances mock processing — varying sizes", () => {
  const small = makeBalances(5);
  const medium = makeBalances(50);
  const large = makeBalances(200);

  bench("processAccountBalances — 5 balances", () => {
    processAccountBalances(small);
  });

  bench("processAccountBalances — 50 balances", () => {
    processAccountBalances(medium);
  });

  bench("processAccountBalances — 200 balances", () => {
    processAccountBalances(large);
  });
});

describe("transaction history rendering", () => {
  const tx10 = makeTransactions(10);
  const tx100 = makeTransactions(100);
  const tx1000 = makeTransactions(1000);

  bench("render 10 transactions", () => {
    renderTransactionHistory(tx10);
  });

  bench("render 100 transactions", () => {
    renderTransactionHistory(tx100);
  });

  bench("render 1000 transactions", () => {
    renderTransactionHistory(tx1000);
  });
});
