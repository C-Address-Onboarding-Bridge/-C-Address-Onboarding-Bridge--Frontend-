import { readFileSync, statSync, readdirSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BUILD_DIR = join(process.cwd(), ".next");
const MANIFEST_PATH = join(BUILD_DIR, "build-manifest.json");
const REPORT_PATH = join(BUILD_DIR, "bundle-size-report.json");
const BUDGET_CONFIG_PATH = join(process.cwd(), ".bundlebudgetrc.json");

function parseSize(str) {
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|KiB|MiB)?$/i);
  if (!match) throw new Error(`Invalid size string: "${str}"`);
  const num = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  switch (unit) {
    case "B": return num;
    case "KB": return num * 1024;
    case "MB": return num * 1024 * 1024;
    case "KIB": return num * 1024;
    case "MIB": return num * 1024 * 1024;
    default: return num;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

function collectFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
    } else if (!predicate || predicate(entry.name, fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadBudgets() {
  if (!existsSync(BUDGET_CONFIG_PATH)) {
    console.error(`Budget config not found at ${BUDGET_CONFIG_PATH}`);
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(BUDGET_CONFIG_PATH, "utf-8"));
  if (!config.budgets) {
    console.error("Budget config must contain a 'budgets' key");
    process.exit(1);
  }
  const budgets = {};
  for (const [key, value] of Object.entries(config.budgets)) {
    budgets[key] = parseSize(value);
  }
  return { raw: config.budgets, bytes: budgets };
}

function measure() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`Build manifest not found at ${MANIFEST_PATH}. Run 'next build' first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

  const initialJsChunks = [
    ...(manifest.polyfillFiles || []),
    ...(manifest.rootMainFiles || []),
  ];

  let initialJsSize = 0;
  for (const chunk of initialJsChunks) {
    initialJsSize += getFileSize(join(BUILD_DIR, chunk));
  }

  const cssDir = join(BUILD_DIR, "static", "css");
  const cssFiles = collectFiles(cssDir, (name) => name.endsWith(".css"));
  let initialCssSize = 0;
  for (const file of cssFiles) {
    initialCssSize += getFileSize(file);
  }

  const staticDir = join(BUILD_DIR, "static");
  const allFiles = collectFiles(staticDir, (name) =>
    name.endsWith(".js") || name.endsWith(".css")
  );
  let totalAssetsSize = 0;
  for (const file of allFiles) {
    totalAssetsSize += getFileSize(file);
  }

  return {
    initialJsSize,
    initialCssSize,
    totalAssetsSize,
  };
}

function check(sizes, budgets) {
  const checks = {
    initialJs: { label: "Initial JS", actual: sizes.initialJsSize, budget: budgets.bytes.initialJs },
    initialCss: { label: "Initial CSS", actual: sizes.initialCssSize, budget: budgets.bytes.initialCss },
    totalAssets: { label: "Total Assets", actual: sizes.totalAssetsSize, budget: budgets.bytes.totalAssets },
  };

  let anyFailed = false;
  const results = [];
  for (const [key, check] of Object.entries(checks)) {
    if (check.budget === undefined) {
      results.push({ key, ...check, pass: true, note: "no budget configured" });
      continue;
    }
    const pass = check.actual <= check.budget;
    if (!pass) anyFailed = true;
    results.push({
      key,
      label: check.label,
      actual: check.actual,
      actualFormatted: formatSize(check.actual),
      budget: check.budget,
      budgetFormatted: formatSize(check.budget),
      pass,
    });
  }

  return { anyFailed, results };
}

function main() {
  const { raw: rawBudgets, bytes: budgetBytes } = loadBudgets();
  const sizes = measure();
  const { anyFailed, results } = check(sizes, { raw: rawBudgets, bytes: budgetBytes });

  const report = {
    sizes: {
      initialJs: sizes.initialJsSize,
      initialCss: sizes.initialCssSize,
      totalAssets: sizes.totalAssetsSize,
    },
    budgets: rawBudgets,
    results,
    passed: !anyFailed,
    timestamp: new Date().toISOString(),
  };

  mkdirSync(BUILD_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("\nBundle Size Report");
  console.log("─".repeat(60));
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    console.log(`  ${r.label.padEnd(20)} ${r.actualFormatted.padEnd(12)} budget ${r.budgetFormatted.padEnd(12)} [${status}]`);
    if (!r.pass) {
      const diff = r.actual - r.budget;
      console.log(`  ${"".padEnd(20)} exceeded by ${formatSize(diff)}`);
    }
  }
  console.log("─".repeat(60));
  console.log(`  Result: ${anyFailed ? "FAILED — budgets exceeded" : "PASSED"}\n`);

  if (anyFailed) process.exit(1);
}

main();
