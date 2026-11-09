// Runs the performance scenarios against one or more builds of the application, in alternating order, and saves
// every trial, failed and interrupted ones too. See test/performance/README.md.
//
//   node test/performance/run.mjs --out <dir> --workloads <dir> --viewer-server <origin>
//     --app <label>=<executable> [--app <label>=<executable> ...] [--trials 10] [--warmup 1]
//     [--scenarios startup,open-folder,view-data,settings] [--protocol <id>]
//
// <executable> is a packaged app's executable, or "checkout" for this checkout's build (dist/ and src-main/).
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { packagedAppRoot, root } from './lib/app.mjs';
import { scenarios } from './lib/scenarios.mjs';

const { values } = parseArgs({ options: {
  app: { type: 'string', multiple: true },
  // <label>:<NAME>=<value>, an environment variable for one build's launches, such as a variant of a test profile.
  'app-env': { type: 'string', multiple: true, default: [] },
  scenarios: { type: 'string', default: Object.keys(scenarios).join(',') },
  trials: { type: 'string', default: '10' },
  warmup: { type: 'string', default: '1' },
  out: { type: 'string' },
  workloads: { type: 'string' },
  'viewer-server': { type: 'string' },
  protocol: { type: 'string', default: 'draft' },
  'settle-ms': { type: 'string', default: '3000' },
} });
if (!values.out || !path.isAbsolute(values.out)) throw new Error('--out must be an absolute directory.');
if (!values.workloads || !path.isAbsolute(values.workloads)) throw new Error('--workloads must be an absolute directory from workload.mjs.');
if (!values.app?.length) throw new Error('Give at least one --app <label>=<executable>.');
const selected = values.scenarios.split(',');
for (const name of selected) if (!scenarios[name]) throw new Error(`Unknown scenario ${name}.`);
/** The option `name` as a whole number of at least `min`; anything else stops the series before it starts. */
function wholeNumber(name, min) {
  const value = Number(values[name]);
  if (!Number.isInteger(value) || value < min) throw new Error(`--${name} must be a whole number of at least ${min}, not ${values[name]}.`);
  return value;
}
const trials = wholeNumber('trials', 1);
const warmup = wholeNumber('warmup', 0);
wholeNumber('settle-ms', 0);

const appEnv = {};
for (const entry of values['app-env']) {
  const match = /^([^:]+):([A-Z][A-Z0-9_]*)=(.*)$/.exec(entry);
  if (!match) throw new Error(`--app-env takes <label>:<NAME>=<value>, not ${entry}.`);
  (appEnv[match[1]] ??= {})[match[2]] = match[3];
}
const apps = values.app.map(entry => {
  const [label, ...rest] = entry.split('=');
  const executable = rest.join('=');
  return { label, target: { ...(executable === 'checkout' ? {} : { executable }), env: appEnv[label] ?? {} } };
});
for (const label of Object.keys(appEnv))
  if (!apps.some(app => app.label === label)) throw new Error(`--app-env names ${label}, which no --app is.`);

/** The SHA-256 of `file`, in hexadecimal. */
async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

/** A hash of the application's own code (not node_modules), which tells two builds apart. */
async function codeHash(target) {
  const appRoot = target.executable ? packagedAppRoot(target.executable) : root;
  if (target.executable && !(await stat(appRoot).catch(() => null))?.isDirectory())
    throw new Error(`No code of the app at ${appRoot}: give the executable of a directory build (electron-builder --dir).`);
  const entries = [];
  for (const part of ['dist', 'src-main', 'src-shared', 'electron-util']) {
    const directory = path.join(appRoot, part);
    for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !/\.(js|cjs|mjs|html|css|json)$/.test(entry.name)) continue;
      const file = path.join(entry.parentPath, entry.name);
      entries.push(`${path.relative(appRoot, file)} ${await sha256(file)}`);
    }
  }
  entries.push(`package.json ${await sha256(path.join(appRoot, 'package.json'))}`);
  entries.sort();
  return { appRoot, files: entries.length, sha256: createHash('sha256').update(entries.join('\n')).digest('hex') };
}

/** What the viewer server serves: a hash of its page and of the scripts that page loads. */
async function viewerIdentity(server) {
  if (!server) return null;
  const html = await (await fetch(server)).text();
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(match => match[1]).sort();
  const hash = createHash('sha256');
  hash.update(html.replace(/nonce="[^"]*"/g, ''));
  for (const script of scripts) hash.update(await (await fetch(new URL(script, server))).text());
  return { server, scripts: scripts.length, sha256: hash.digest('hex') };
}

const manifest = JSON.parse(await readFile(path.join(values.workloads, 'manifest.json'), 'utf8'));
const context = {
  viewerServer: values['viewer-server'],
  workloads: manifest.workloads,
  settleMs: Number(values['settle-ms']),
};

await mkdir(values.out, { recursive: true });
const series = {
  protocol: values.protocol,
  startedAt: new Date().toISOString(),
  host: { platform: process.platform, arch: process.arch, release: os.release(), cpu: os.cpus()[0]?.model, cores: os.cpus().length,
    memoryGb: Math.round(os.totalmem() / 2 ** 30), loadAverageAtStart: os.loadavg() },
  harness: { node: process.version, playwright: JSON.parse(await readFile(path.join(root, 'node_modules/playwright/package.json'), 'utf8')).version },
  workloads: Object.fromEntries(Object.entries(manifest.workloads).map(([name, workload]) => [name, { id: workload.id, files: workload.files, bytes: workload.bytes }])),
  viewerAtStart: await viewerIdentity(context.viewerServer),
  apps: await Promise.all(apps.map(async app => ({ label: app.label, executable: app.target.executable ?? 'checkout',
    env: app.target.env, code: await codeHash(app.target) }))),
  scenarios: selected, trials, warmup, settleMs: context.settleMs,
};
await writeFile(path.join(values.out, 'series.json'), JSON.stringify(series, null, 2));

let interrupted = false;
process.on('SIGINT', () => { interrupted = true; console.log('Interrupted: finishing the current trial, then stopping.'); });

for (let round = 0; round < warmup + trials && !interrupted; round++) {
  // Alternate the order of the builds, so that a drift of the computer's state does not favor one of them.
  const order = round % 2 === 0 ? apps : [...apps].reverse();
  for (const scenario of selected) {
    for (const app of order) {
      if (interrupted) break;
      const startedAtMs = Date.now();
      const trial = { protocol: values.protocol, label: app.label, scenario, round, warmup: round < warmup, startedAt: new Date(startedAtMs).toISOString(),
        loadAverage: os.loadavg() };
      try {
        Object.assign(trial, await scenarios[scenario]({ ...context, target: app.target }), { status: 'ok' });
      } catch (error) {
        Object.assign(trial, { status: interrupted ? 'interrupted' : 'failed', error: String(error?.stack ?? error) });
      }
      trial.durationMs = Date.now() - startedAtMs;
      const directory = path.join(values.out, 'trials', app.label, scenario);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${String(round).padStart(3, '0')}.json`), JSON.stringify(trial, null, 2));
      console.log(`[${new Date().toISOString()}] round ${round}${trial.warmup ? ' (warm-up)' : ''} ${app.label} ${scenario}: ${trial.status} in ${(trial.durationMs / 1000).toFixed(1)} s`
        + (trial.error ? ` - ${trial.error.split('\n')[0]}` : ''));
    }
  }
}

series.finishedAt = new Date().toISOString();
series.complete = !interrupted;
series.loadAverageAtEnd = os.loadavg();
series.viewerAtEnd = await viewerIdentity(context.viewerServer);
series.viewerUnchanged = JSON.stringify(series.viewerAtStart) === JSON.stringify(series.viewerAtEnd);
await writeFile(path.join(values.out, 'series.json'), JSON.stringify(series, null, 2));
console.log(series.complete ? 'Series complete.' : 'Series INCOMPLETE (interrupted).');
if (!series.viewerUnchanged) console.log('WARNING: the viewer server changed during the series; its View Data results are not comparable.');
