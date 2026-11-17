import { spawnSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import logger from '../util/logger.js';
import { assess, checkFields, startOf, viewFields } from './merge-wait.js';

// TL;DR: Waits until a pull request is merged, or until it needs the agent that opened it, and says which.
// Details: Mergify merges a pull request with the label automerge, and brings it up to date with main, by itself
// (.mergify.yml), and nothing tells the agent that opened it: the Claude desktop app's Auto-fix wakes a session on a
// failed check, a conflict or a review comment, but not on a merge. So the agent runs this in the background once it
// has opened the pull request (AGENTS.md, "Wait for your pull request until it is merged"), and Claude Code wakes the
// agent when it ends. It looks at the pull request with gh every minute, and ends on what changed since it began
// (merge-wait.js): exit code 0 when the pull request is merged, 1 when it needs the agent, and 2 when it cannot look.
// With --with-auto-fix, it leaves to Auto-fix what Auto-fix reports.

const usage = 'Usage: node script/pull-request/wait-for-merge.js <number of the pull request> [--with-auto-fix]';
const intervalMinutes = 1;
const limitHours = 24;
const attemptsInARow = 5;

const [number, ...options] = process.argv.slice(2);
if (!/^[1-9]\d*$/.test(number ?? '') || options.some(option => option !== '--with-auto-fix')) {
  logger.error(usage);
  process.exit(2);
}
const withAutoFix = options.includes('--with-auto-fix');

/** Runs gh, and gives what it wrote as JSON, or throws with what it wrote to stderr. */
function gh(args, { noneWhen } = {}) {
  const result = spawnSync('gh', args, { encoding: 'utf8' });
  const output = result.stdout?.trim();
  if (result.error) throw result.error;
  // gh pr checks writes the checks even when some are pending or failed, which its exit code reflects.
  if (output) return JSON.parse(output);
  if (noneWhen?.test(result.stderr)) return [];
  throw new Error(`gh ${args.join(' ')} failed with ${result.status}: ${result.stderr?.trim()}`);
}

/** The pull request and its required checks, as merge-wait.js takes them. */
function look() {
  const pullRequest = gh(['pr', 'view', number, '--json', viewFields]);
  // Until the checks of a new commit are reported, gh says that there are none.
  const checks = gh(['pr', 'checks', number, '--required', '--json', checkFields], { noneWhen: /no (required )?checks/i });
  return { pullRequest, checks };
}

const startedAt = Date.now();
let seen;
let status;
let failuresInARow = 0;
for (;;) {
  let looked;
  try {
    looked = look();
    failuresInARow = 0;
  } catch (error) {
    failuresInARow += 1;
    logger.warn(`Could not look at #${number} (${failuresInARow} of ${attemptsInARow} times in a row): ${error.message}`);
    if (failuresInARow >= attemptsInARow) process.exit(2);
  }

  if (looked) {
    seen ??= startOf(looked.pullRequest, looked.checks);
    const result = assess(looked.pullRequest, looked.checks, seen, Date.now(), { withAutoFix });
    if (result.end) {
      logger.info(result.message);
      process.exit(result.merged ? 0 : 1);
    }
    seen = result.seen;
    if (result.status !== status) {
      status = result.status;
      logger.info(`#${number} ${status}`);
    }
  }

  if (Date.now() - startedAt >= limitHours * 3_600_000) {
    logger.info(`#${number} is still open after ${limitHours} hours: tell the owner, and stop waiting for it.`);
    process.exit(1);
  }
  await sleep(intervalMinutes * 60_000);
}
