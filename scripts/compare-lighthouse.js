const fs = require('fs');
const path = require('path');

// Configuration
const THRESHOLDS = {
  performance: 0.90,
  accessibility: 0.90,
  'best-practices': 0.90,
  seo: 0.90,
};

const CATEGORY_NAMES = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

function readManifest(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const manifest = JSON.parse(content);
    // Find representative run or fall back to the first one
    const run = manifest.find(r => r.isRepresentativeRun) || manifest[0];
    return run ? run.summary : null;
  } catch (error) {
    console.error(`Error reading manifest at ${filePath}:`, error);
    return null;
  }
}

function formatScore(score) {
  if (score === undefined || score === null) return 'N/A';
  return `${Math.round(score * 100)}`;
}

function getScoreColor(score) {
  if (score === undefined || score === null) return '⚪';
  const val = score * 100;
  if (val >= 90) return '🟢';
  if (val >= 50) return '🟠';
  return '🔴';
}

function main() {
  const mainManifestPath = path.resolve(process.cwd(), '.lighthouseci-main-manifest.json');
  const prManifestPath = path.resolve(process.cwd(), '.lighthouseci-pr-manifest.json');

  const mainSummary = readManifest(mainManifestPath);
  const prSummary = readManifest(prManifestPath);

  if (!prSummary) {
    console.error('Error: PR Lighthouse manifest not found or empty.');
    process.exit(1);
  }

  let hasRegressionOrFailure = false;
  let markdown = '### ⚡ Lighthouse CI Audit Results\n\n';
  markdown += '| Category | Min Threshold | Main Branch | PR Branch | Change | Status |\n';
  markdown += '| :--- | :---: | :---: | :---: | :---: | :---: |\n';

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const mainScore = mainSummary ? mainSummary[key] : null;
    const prScore = prSummary[key] !== undefined ? prSummary[key] : null;
    const categoryName = CATEGORY_NAMES[key];

    let changeText = 'N/A';
    if (mainScore !== null && prScore !== null) {
      const diff = Math.round((prScore - mainScore) * 100);
      if (diff > 0) {
        changeText = `▲ +${diff}`;
      } else if (diff < 0) {
        changeText = `▼ ${diff}`;
      } else {
        changeText = '0';
      }
    }

    const passesThreshold = prScore !== null && prScore >= threshold;
    if (!passesThreshold) {
      hasRegressionOrFailure = true;
    }

    const statusEmoji = passesThreshold ? '✅' : '❌';
    const prScoreFormatted = formatScore(prScore);
    const mainScoreFormatted = formatScore(mainScore);
    const thresholdFormatted = `${Math.round(threshold * 100)}`;

    markdown += `| **${categoryName}** | ${thresholdFormatted} | ${getScoreColor(mainScore)} ${mainScoreFormatted} | ${getScoreColor(prScore)} ${prScoreFormatted} | ${changeText} | ${statusEmoji} |\n`;
  }

  markdown += '\n';

  if (hasRegressionOrFailure) {
    markdown += '⚠️ **CI Warning**: One or more scores do not meet the minimum thresholds. Please optimize performance, accessibility, best practices, and SEO before merging.\n';
  } else {
    markdown += '🎉 **Success**: All Lighthouse scores meet the minimum thresholds!\n';
  }

  fs.writeFileSync(path.resolve(process.cwd(), 'lighthouse-comment.md'), markdown, 'utf8');
  console.log('Lighthouse comparison report generated successfully.');

  if (hasRegressionOrFailure) {
    console.error('Error: Lighthouse scores are below the minimum required thresholds.');
    process.exit(1);
  }
}

main();
