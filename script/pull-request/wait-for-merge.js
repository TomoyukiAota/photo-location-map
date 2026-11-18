import { spawnSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import logger from '../util/logger.js';
import { assess, checkFields, startOf, viewFields } from './merge-wait.js';

// TL;DR: Waits until a pull request is merged, or until it needs the agent that opened it, and says which.
// Details: Mergify merges a pull request with the label automerge, and brings it up to date with main, by itself
// (.mergify.yml), and nothing tells the agent that opened it. So the agent runs this in the background once it has
// opened the pull request (AGENTS.md, "Wait for your pull request until it is merged"), and Claude Code wakes the agent
// when it ends. It looks at the pull request with gh every minute, and ends on what changed since it began
// (merge-wait.js): exit code 0 when the pull request is merged, 1 when it needs the agent, and 2 when it cannot look.
// It reports a failed check itself even where the Claude desktop app's Auto-fix is on: Auto-fix did not wake the
// session of #737 for any of the four checks that were canceled or failed on it, which another agent found and ran
// again instead.

const usage = 'Usage: node script/pull-request/wait-for-merge.js <number of the pull request>';
const intervalMinutes = 1;
const limitHours = 24;
const attemptsInARow = 5;

const [number, ...rest] = process.argv.slice(2);
if (!/^[1-9]\d*$/.test(number ?? '') || rest.length > 0) {
  logger.error(usage);
  process.exit(2);
}

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

/** The pull request and its required checks, as merge-wait.js takes them, or undefined to look again later. */
function look() {
  const pullRequest = gh(['pr', 'view', number, '--json', viewFields]);
  // Until the checks of a new commit are reported, gh says that there are none.
  const checks = gh(['pr', 'checks', number, '--required', '--json', checkFields], { noneWhen: /no (required )?checks/i });
  // gh pr checks reads the checks of the pull request's latest commit by itself. When a commit was pushed between the
  // two, the checks may not be those of the commit that the pull request was read with, so this look is left out.
  const { headRefOid } = gh(['pr', 'view', number, '--json', 'headRefOid']);
  return headRefOid === pullRequest.headRefOid ? { pullRequest, checks } : undefined;
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
    const result = assess(looked.pullRequest, looked.checks, seen, Date.now());
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
