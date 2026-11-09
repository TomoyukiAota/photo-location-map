// Samples the resident memory of an application's whole process tree: the Electron processes and the HEIC thumbnail
// workers, which are child processes that app.getAppMetrics() does not list. Resident memory counts pages shared
// between processes once per process, so a sum overstates the memory in use; the per-process values are kept too.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Each process: { pid, ppid, rssKb, command }, from ps on macOS and Linux. */
async function listProcesses() {
  const { stdout } = await run('ps', ['-A', '-o', 'pid=,ppid=,rss=,comm='], { maxBuffer: 16 * 1024 * 1024 });
  return stdout.split('\n').map(line => line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/)).filter(Boolean)
    .map(([, pid, ppid, rss, command]) => ({ pid: Number(pid), ppid: Number(ppid), rssKb: Number(rss), command }));
}

/** The process with `rootPid` and all of its descendants. */
export async function processTree(rootPid) {
  const processes = await listProcesses();
  const children = new Map();
  for (const process of processes) children.set(process.ppid, [...(children.get(process.ppid) ?? []), process]);
  const tree = [];
  const queue = processes.filter(process => process.pid === rootPid);
  while (queue.length) {
    const process = queue.shift();
    tree.push(process);
    queue.push(...(children.get(process.pid) ?? []));
  }
  return tree;
}

/**
 * Samples the tree every `intervalMs` until stop() is called, and returns
 * { samples, peakTotalRssKb, peakByPid: { pid: { command, peakRssKb } }, intervalMs }.
 */
export function startTreeSampler(rootPid, intervalMs = 250) {
  if (process.platform === 'win32') return { stop: async () => ({ unsupported: 'ps is not available on Windows', intervalMs }) };
  const peakByPid = new Map();
  let peakTotalRssKb = 0;
  let samples = 0;
  let stopped = false;
  let pending = Promise.resolve();
  /** Reads the tree once, keeping the peak RSS of the tree and of each process. */
  const sample = async () => {
    const tree = await processTree(rootPid).catch(() => []);
    if (!tree.length) return;
    samples++;
    peakTotalRssKb = Math.max(peakTotalRssKb, tree.reduce((sum, entry) => sum + entry.rssKb, 0));
    for (const entry of tree) {
      const previous = peakByPid.get(entry.pid);
      peakByPid.set(entry.pid, { command: entry.command, peakRssKb: Math.max(previous?.peakRssKb ?? 0, entry.rssKb) });
    }
  };
  const timer = setInterval(() => { if (!stopped) pending = pending.then(sample); }, intervalMs);
  timer.unref(); // A sampler that a failed trial did not stop must not keep the harness running.
  pending = pending.then(sample);
  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      await pending;
      return { intervalMs, samples, peakTotalRssKb, peakByPid: Object.fromEntries(peakByPid) };
    },
  };
}

/**
 * The peak resident memory of the tree from what a sampler's stop() gave: undefined on Windows, which has no ps, and a
 * throw when the sampler could not read the tree once, so that the trial fails rather than report a peak of 0 KB.
 */
export function peakTreeRssKb(peak) {
  if (peak.unsupported) return undefined;
  if (!peak.samples) throw new Error('The sampler could not read the process tree once, so its peak is not known.');
  return peak.peakTotalRssKb;
}

/**
 * One sample of the tree: the total and each process's resident memory, grouped by command name. A tree that cannot be
 * read throws, so that the trial fails rather than report 0 KB. On Windows, which has no ps, the total is NaN, which
 * summarize.mjs leaves out, as startTreeSampler does there.
 */
export async function treeSnapshot(rootPid) {
  if (process.platform === 'win32') return { totalRssKb: NaN, processes: [], unsupported: 'ps is not available on Windows' };
  const tree = await processTree(rootPid);
  if (!tree.length) throw new Error(`Process ${rootPid} is not in the list of processes.`);
  return { totalRssKb: tree.reduce((sum, entry) => sum + entry.rssKb, 0), processes: tree.map(({ pid, rssKb, command }) => ({ pid, rssKb, command })) };
}
