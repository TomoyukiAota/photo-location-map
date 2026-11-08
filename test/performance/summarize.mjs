// Summarizes a series from run.mjs, and compares its builds with a baseline build under the budgets of a protocol.
//
//   node test/performance/summarize.mjs <series directory> [--baseline <label>] [--protocol <protocol.json>]
//
// Writes summary.json and summary.md next to series.json, and prints summary.md.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  baseline: { type: 'string' }, protocol: { type: 'string' },
} });
const seriesDirectory = positionals[0];
if (!seriesDirectory) throw new Error('Usage: node test/performance/summarize.mjs <series directory> [--baseline <label>] [--protocol <file>]');
const series = JSON.parse(await readFile(path.join(seriesDirectory, 'series.json'), 'utf8'));
const protocol = values.protocol ? JSON.parse(await readFile(values.protocol, 'utf8')) : null;

const trials = [];
for (const entry of await readdir(path.join(seriesDirectory, 'trials'), { recursive: true, withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json')) trials.push(JSON.parse(await readFile(path.join(entry.parentPath, entry.name), 'utf8')));
}

const quantile = (sorted, q) => {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
};
function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const deviations = sorted.map(value => Math.abs(value - median)).sort((a, b) => a - b);
  return { n: sorted.length, median, p90: sorted.length >= 10 ? quantile(sorted, 0.9) : null, min: sorted[0], max: sorted[sorted.length - 1],
    mad: quantile(deviations, 0.5) };
}

/** The rule of the protocol for a metric: the first whose pattern matches its name. */
function ruleFor(metric) {
  if (!protocol) return null;
  return protocol.rules.find(rule => new RegExp(rule.pattern).test(metric)) ?? null;
}

const counts = {};
const groups = {};
for (const trial of trials) {
  counts[trial.label] ??= {};
  const count = counts[trial.label][trial.scenario] ??= { ok: 0, failed: 0, interrupted: 0, warmup: 0 };
  if (trial.warmup) { count.warmup++; continue; }
  count[trial.status] = (count[trial.status] ?? 0) + 1;
  if (trial.status !== 'ok') continue;
  for (const [metric, value] of Object.entries(trial.metrics)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    ((groups[trial.label] ??= {})[`${trial.scenario}.${metric}`] ??= []).push(value);
  }
}

const labels = series.apps.map(app => app.label);
const baseline = values.baseline ?? labels[0];
const summary = { protocol: series.protocol, baseline, counts, metrics: {} };
const allMetrics = [...new Set(Object.values(groups).flatMap(group => Object.keys(group)))].sort();
for (const metric of allMetrics) {
  const row = summary.metrics[metric] = {};
  const base = groups[baseline]?.[metric] ? stats(groups[baseline][metric]) : null;
  for (const label of labels) {
    if (!groups[label]?.[metric]) continue;
    const entry = row[label] = stats(groups[label][metric]);
    if (label === baseline || !base) continue;
    entry.delta = entry.median - base.median;
    entry.deltaPercent = base.median ? (entry.delta / base.median) * 100 : null;
    const rule = ruleFor(metric);
    if (!rule) continue;
    if (rule.kind === 'diagnostic') continue;
    if (rule.kind === 'invariant') {
      entry.verdict = entry.min === base.min && entry.max === base.max ? 'same' : 'MISMATCH';
      continue;
    }
    if (entry.n < (protocol.minimumTrials ?? 3) || base.n < (protocol.minimumTrials ?? 3)) { entry.verdict = 'insufficient'; continue; }
    // The noise band comes from the baseline's spread; the budget is the change that matters in practice.
    const noise = Math.max(rule.noiseMads * 1.4826 * base.mad, rule.floor ?? 0);
    const budget = Math.max(noise, (rule.budgetPercent / 100) * Math.abs(base.median));
    entry.noise = noise;
    entry.budget = budget;
    entry.verdict = entry.delta > budget ? 'REGRESSION' : entry.delta < -budget ? 'improvement' : 'within budget';
  }
}
await writeFile(path.join(seriesDirectory, 'summary.json'), JSON.stringify(summary, null, 2));

const format = value => value === null || value === undefined ? '' : Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
const lines = [`# Series ${path.basename(seriesDirectory)} (protocol ${series.protocol})`, '',
  `Builds: ${series.apps.map(app => `${app.label} (code ${app.code.sha256.slice(0, 12)})`).join(', ')}. Baseline: ${baseline}.`,
  `Host: ${series.host.cpu}, ${series.host.cores} cores, ${series.host.memoryGb} GB, ${series.host.platform} ${series.host.release}.`,
  `Viewer: ${series.viewerAtStart ? `${series.viewerAtStart.sha256.slice(0, 12)}${series.viewerUnchanged ? ' (unchanged)' : ' (CHANGED during the series)'}` : 'none'}.`,
  `Complete: ${series.complete ? 'yes' : 'NO'}. Trials: ${JSON.stringify(counts)}`, '',
  `| Metric | ${labels.map(label => `${label} median (n, MAD)`).join(' | ')} | ${labels.filter(label => label !== baseline).map(label => `${label} vs ${baseline}`).join(' | ')} |`,
  `| --- | ${labels.map(() => '---:').join(' | ')} | ${labels.filter(label => label !== baseline).map(() => '---').join(' | ')} |`];
for (const metric of allMetrics) {
  const row = summary.metrics[metric];
  const cells = labels.map(label => row[label] ? `${format(row[label].median)} (${row[label].n}, ${format(row[label].mad)})` : '');
  const comparisons = labels.filter(label => label !== baseline).map(label => {
    const entry = row[label];
    if (!entry || entry.delta === undefined) return '';
    return `${entry.delta >= 0 ? '+' : ''}${format(entry.delta)} (${entry.deltaPercent === null ? '' : `${entry.deltaPercent >= 0 ? '+' : ''}${entry.deltaPercent.toFixed(1)} %`})${entry.verdict ? ` ${entry.verdict}` : ''}`;
  });
  lines.push(`| ${metric} | ${cells.join(' | ')} | ${comparisons.join(' | ')} |`);
}
const markdown = lines.join('\n') + '\n';
await writeFile(path.join(seriesDirectory, 'summary.md'), markdown);
console.log(markdown);
