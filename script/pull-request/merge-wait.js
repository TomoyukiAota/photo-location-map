// What wait-for-merge.js makes of a pull request each time that it looks at it: whether to go on waiting, or to end
// and say why. It is kept apart from the waiting, so that the tests give it a pull request as gh describes one.
//
// The waiting ends on what changed since it began, so that it can be started again without ending at once on
// something that is already known: a failed check that is being run again, or a conflict that waits for the owner.
// It says all that changed at once: what it left unsaid would be known when it is started again, and never said.

/** The label with which Mergify puts a pull request of the owner in its merge queue, which merges it (.mergify.yml). */
export const label = 'automerge';

/** The labels that Mergify gives a pull request while it is in the merge queue, and once it took it out of the queue,
 * as when its test on top of main failed: the defaults of queued_label and dequeued_label, which .mergify.yml keeps. */
export const queuedLabel = 'queued';
export const dequeuedLabel = 'dequeued';

/** How long a pull request with the label may stay out of the merge queue once its required checks have passed, before
 * Mergify is taken to have missed it: Mergify queues it within a minute or so. */
export const unqueuedLimitMinutes = 10;

/** How long a required check may have no check run while no other required check is pending, before its workflow is
 * taken not to have started, as when a workflow file has an error. A part of the tests that is run again takes about 15
 * minutes, after which the check of its gate comes back. */
export const missingLimitMinutes = 30;

/** The fields that wait-for-merge.js asks `gh pr view` for. */
export const viewFields = 'number,state,mergedAt,mergeable,mergeStateStatus,labels,headRefOid,reviews,comments';

/** The fields that wait-for-merge.js asks `gh pr checks --required` for. */
export const checkFields = 'name,event,bucket,link';

/** Where wait-for-merge.js reads, with `gh api`, the checks that branch protection requires of main, which are those
 * that Mergify waits for (.mergify.yml): the `context` of each of its `checks` is the name of one. */
export const requiredChecksPath = 'repos/{owner}/{repo}/branches/main/protection/required_status_checks';

/** Logins of the apps whose comments on a pull request are summaries that they keep editing, CodeRabbit's of its
 * review and Mergify's of its queue: their comments are there from the start. Their reviews count. */
const summaryCommenters = new Set(['coderabbitai', 'mergify']);

/** The reviews and the comments of people on the pull request, oldest first, as { id, author, at }: a new one is told
 * by its id, so that one that takes the place of a deleted one is new too. */
export function feedbackOf(pullRequest) {
  const reviews = (pullRequest.reviews ?? [])
    .filter(review => review.state !== 'PENDING')
    .map(review => ({ id: review.id, author: review.author?.login, at: review.submittedAt }));
  const comments = (pullRequest.comments ?? [])
    .filter(comment => !summaryCommenters.has(comment.author?.login))
    .map(comment => ({ id: comment.id, author: comment.author?.login, at: comment.createdAt }));
  return [...reviews, ...comments].sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/** The required checks that failed or were canceled, from `gh pr checks --required --json <checkFields>`. A job that
 * is run again is a check of its own, with a link of its own. */
function failedChecksOf(checks) {
  return checks.filter(check => check.bucket === 'fail' || check.bucket === 'cancel');
}

/** The buckets of `gh pr checks` of a check that has ended: passed, skipped, failed or canceled. */
const endedBuckets = new Set(['pass', 'skipping', 'fail', 'cancel']);

/** Those of `requiredNames`, the checks that branch protection requires (none when they could not be read), that have no
 * check run yet, given the required checks that `gh pr checks --required --json <checkFields>` lists. gh lists a check
 * only once it has a check run, and a job that needs other jobs has none until they have ended: `test (ubuntu)`, which
 * reports the two parts of the tests on Ubuntu, has none while they run. Nor has it while one of them is run again: gh
 * then lists neither its new check run nor its failed one, as for `test (windows-latest)` and `test (macos-arm64)`, then
 * a gate too, while parts of theirs were run again on #829. */
function missingNamesOf(checks, requiredNames = []) {
  return requiredNames.filter(name => !checks.some(check => check.name === name));
}

/** What is known when the waiting begins, given the pull request and its required checks as `assess` takes them. */
export function startOf(pullRequest, checks) {
  return {
    feedback: feedbackOf(pullRequest).map(item => item.id),
    failedChecks: failedChecksOf(checks).map(check => check.link),
    conflicting: pullRequest.mergeable === 'CONFLICTING',
    dequeued: hasLabel(pullRequest, dequeuedLabel),
    unqueuedSince: undefined,
    commit: pullRequest.headRefOid,
    missingSince: undefined,
  };
}

/** Whether the pull request has the label `name`. */
function hasLabel(pullRequest, name) {
  return (pullRequest.labels ?? []).some(each => each.name === name);
}

/**
 * What to do about the pull request, given it from `gh pr view --json <viewFields>`, its required checks from
 * `gh pr checks --required --json <checkFields>`, what was seen before (from `startOf`, then from the last call), the
 * time in milliseconds, and the names of the checks that branch protection requires (from `requiredChecksPath`), or
 * undefined when they could not be read.
 *
 * Returns `{ end: true, merged, message }` to stop waiting, or `{ end: false, status, seen }` to look again later.
 */
export function assess(pullRequest, checks, seen, now, requiredNames) {
  const name = `#${pullRequest.number}`;
  const commit = String(pullRequest.headRefOid).slice(0, 8);
  const end = (merged, message) => ({ end: true, merged, message });

  if (pullRequest.state === 'MERGED') {
    return end(true, `${name} was merged at ${pullRequest.mergedAt}. Go on with the next step of the work.`);
  }
  if (pullRequest.state === 'CLOSED') {
    return end(false, `${name} was closed without being merged.`);
  }

  // What needs the agent, each on a line of its own.
  const news = [];

  const conflicting = pullRequest.mergeable === 'CONFLICTING';
  if (conflicting && !seen.conflicting) {
    news.push(`${name} conflicts with main, so the merge queue cannot test it on top of main: merge main into its ` +
      'branch, resolve the conflicts, and push.');
  }

  const newlyFailed = failedChecksOf(checks).filter(check => !seen.failedChecks.includes(check.link));
  if (newlyFailed.length > 0) {
    const what = newlyFailed
      .map(check => `${check.name} of the ${check.event} run ${check.bucket === 'cancel' ? 'was canceled' : 'failed'}`)
      .join(', ');
    news.push(`On ${commit} of ${name}, ${what}: read the log, and classify the failure before running it again ` +
      '(AGENTS.md, "Classify a CI failure before rerunning it").');
  }

  const feedback = feedbackOf(pullRequest);
  const newFeedback = feedback.filter(item => !seen.feedback.includes(item.id));
  if (newFeedback.length > 0) {
    const authors = [...new Set(newFeedback.map(item => item.author))].join(', ');
    news.push(`${name} has a new review or comment by ${authors}: change what it is right about, and answer the ` +
      `rest. Take the label ${label} off while you change the pull request.`);
  }

  const dequeued = hasLabel(pullRequest, dequeuedLabel);
  if (dequeued && !seen.dequeued) {
    news.push(`${name} was taken out of the merge queue (label ${dequeuedLabel}): its test on top of main failed, or ` +
      'it changed. Read the comment of Mergify on it, and the log of the failed check of its draft pull request ' +
      '"merge queue: …", and classify the failure (AGENTS.md, "Classify a CI failure before rerunning it").');
  }

  // A required check that has had no check run for long, while no other is pending, may never get one: its workflow
  // may not have started. A new commit, of which gh lists no check at first, starts the time again.
  const missing = missingNamesOf(checks, requiredNames);
  const missingAlone = missing.length > 0 && checks.every(check => endedBuckets.has(check.bucket));
  const missingBefore = seen.commit === pullRequest.headRefOid ? seen.missingSince : undefined;
  const missingSince = missingAlone ? (missingBefore ?? now) : undefined;
  if (missingAlone && now - missingSince >= missingLimitMinutes * 60_000) {
    const [what, workflow] = missing.length === 1
      ? [`the required check ${missing[0]} has`, 'its workflow']
      : [`the required checks ${missing.join(', ')} have`, 'their workflows'];
    news.push(`On ${commit} of ${name}, ${what} had no check run for ${missingLimitMinutes} minutes, and no other ` +
      `required check is pending: ${workflow} may not have started, as when a workflow file has an error. Look at ` +
      `the runs of ${commit} in the Actions tab.`);
  }

  // Mergify did not queue a pull request that can be: it may have taken it out of the queue without the label. A
  // required check that has no check run yet is pending.
  const labeled = hasLabel(pullRequest, label);
  const queued = hasLabel(pullRequest, queuedLabel);
  const required = [...checks, ...missing.map(each => ({ name: each, bucket: 'pending' }))];
  const checksPassed = required.length > 0 && required.every(check => check.bucket === 'pass' || check.bucket === 'skipping');
  const unqueued = labeled && checksPassed && !queued && !conflicting;
  const unqueuedSince = unqueued ? (seen.unqueuedSince ?? now) : undefined;
  if (unqueued && now - unqueuedSince >= unqueuedLimitMinutes * 60_000) {
    news.push(`${name} has had the label ${label} and passed its required checks for ${unqueuedLimitMinutes} ` +
      'minutes, but is not in the merge queue: read its check "Mergify Merge Queue", which says why.');
  }

  if (news.length > 0) return end(false, news.join('\n'));

  return {
    end: false,
    status: statusOf(pullRequest, required, { labeled, queued, conflicting }),
    seen: {
      feedback: feedback.map(item => item.id),
      failedChecks: [...seen.failedChecks, ...newlyFailed.map(check => check.link)],
      conflicting,
      dequeued,
      unqueuedSince,
      commit: pullRequest.headRefOid,
      missingSince,
    },
  };
}

/** A line about where the pull request stands, which wait-for-merge.js writes when it changes. */
function statusOf(pullRequest, checks, { labeled, queued, conflicting }) {
  if (conflicting) return 'conflicts with main';
  if (!labeled) return `waits for the label ${label}`;
  const count = bucket => checks.filter(check => check.bucket === bucket).length;
  const done = count('pass') + count('skipping');
  return `${String(pullRequest.headRefOid).slice(0, 8)}: ${queued ? 'in the merge queue' : 'not in the merge queue'}, ` +
    `${done} of ${checks.length} required checks passed, ${count('pending')} pending, ${failedChecksOf(checks).length} failed`;
}
