export function getInitialJSBudgetBytes(): number {
  const configuredBudgetKb = Number(process.env.NEXT_PUBLIC_INITIAL_JS_BUDGET_KB ?? "100");
  if (!Number.isFinite(configuredBudgetKb) || configuredBudgetKb <= 0) {
    return 100 * 1024;
  }
  return configuredBudgetKb * 1024;
}
