import { describe, expect, it } from "vitest";
import { getInitialJSBudgetBytes } from "@/lib/performance";

describe("getInitialJSBudgetBytes", () => {
  it("uses the default 100KB budget when no override is provided", () => {
    const original = process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB;
    delete process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB;

    expect(getInitialJSBudgetBytes()).toBe(100 * 1024);

    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB;
    } else {
      process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB = original;
    }
  });

  it("uses the configured KB override when present", () => {
    const original = process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB;
    process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB = "64";

    expect(getInitialJSBudgetBytes()).toBe(64 * 1024);

    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB;
    } else {
      process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB = original;
    }
  });
});
