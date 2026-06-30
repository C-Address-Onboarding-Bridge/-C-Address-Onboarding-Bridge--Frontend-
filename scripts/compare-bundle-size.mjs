import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CURRENT_REPORT = join(process.cwd(), ".next", "bundle-size-report.json");
const BASELINE_REPORT = join(process.cwd(), ".next", "baseline", "bundle-size-report.json");

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function diffFormatted(current, baseline) {
  const diff = current - baseline;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${formatSize(diff)}`;
}

function main() {
  if (!existsSync(CURRENT_REPORT)) {
    console.log("No current bundle size report found. Run bundle size check first.");
    process.exit(1);
  }

  const current = JSON.parse(readFileSync(CURRENT_REPORT, "utf-8"));
  const hasBaseline = existsSync(BASELINE_REPORT);
  const baseline = hasBaseline ? JSON.parse(readFileSync(BASELINE_REPORT, "utf-8")) : null;

  const rows = [];

  for (const r of current.results) {
    const actual = r.actual;
    const budget = r.budget;
    const baselineActual = baseline ? baseline.sizes[r.key] : null;
    const diff = baselineActual !== null ? diffFormatted(actual, baselineActual) : "—";
    const status = r.pass ? ":white_check_mark:" : ":x:";
    const baselineStr = baselineActual !== null ? formatSize(baselineActual) : "—";

    rows.push({
      label: r.label,
      current: formatSize(actual),
      baseline: baselineStr,
      diff,
      budget: formatSize(budget),
      status,
    });
  }

  const reportUrl = `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY || ""}/actions/runs/${process.env.GITHUB_RUN_ID || "0"}`;

  const header = hasBaseline
    ? "| Asset | Size | Baseline | Diff | Budget | Status |"
    : "| Asset | Size | Budget | Status |";
  const separator = hasBaseline
    ? "|---|---|---|---|---|---|"
    : "|---|---|---|---|";

  let body = `## Bundle Size Report\n\n`;
  if (hasBaseline) {
    body += `Comparison against the latest \`main\` branch build.\n\n`;
  } else {
    body += `No baseline found from \`main\` branch — showing current sizes only.\n\n`;
  }
  body += `${header}\n${separator}\n`;

  for (const row of rows) {
    const cells = hasBaseline
      ? [row.label, row.current, row.baseline, row.diff, row.budget, row.status]
      : [row.label, row.current, row.budget, row.status];
    body += `| ${cells.join(" | ")} |\n`;
  }

  body += `\n[View workflow run](${reportUrl})\n`;

  const passed = current.passed;
  body += `\n**Result:** ${passed ? "All budgets passed" : "Some budgets exceeded — review required"}\n`;

  if (!passed) {
    body += "\n> :warning: This PR increases bundle size beyond the configured budget. ";
    body += "See [Bundle Size Monitoring](#bundle-size-monitoring) in the README for guidance on reviewing intentional increases.\n";
  }

  process.stdout.write(body);
}

main();
