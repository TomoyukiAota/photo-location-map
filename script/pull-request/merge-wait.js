// What wait-for-merge.js makes of a pull request each time that it looks at it: whether to go on waiting, or to end
// and say why. It is kept apart from the waiting, so that the tests give it a pull request as gh describes one.
//
// The waiting ends on what changed since it began, so that it can be started again without ending at once on
// something that is already known: a failed check that is being run again, or a conflict that waits for the owner.

/** The label with which Mergify merges a pull request of the owner, and brings it up to date with main (.mergify.yml). */
export const label = 'automerge';

/** How long a pull request with the label may stay behind main before Mergify is taken to have missed it: Mergify
 * brings it up to date within a minute or so. */
export const behindLimitMinutes = 10;

/** The fields that wait-for-merge.js asks `gh pr view` for. */
export const viewFields = 'number,state,mergedAt,mergeable,mergeStateStatus,labels,headRefOid,reviews,comments';

/** The fields that wait-for-merge.js asks `gh pr checks --required` for. */
export const checkFields = 'name,event,bucket,link';

/** Logins of the apps whose comments on a pull request are summaries that they keep editing, CodeRabbit's of its
 * review and Mergify's of its queue: their comments are there from the start. Their reviews count. */
const summaryCommenters = new Set(['coderabbitai', 'mergify']);

/** The reviews and the comments of people on the pull request, oldest first, as { author, at }. */
export function feedbackOf(pullRequest) {
  const reviews = (pullRequest.reviews ?? [])
    .filter(review => review.state !== 'PENDING')
    .map(review => ({ author: review.author?.login, at: review.submittedAt }));
  const comments = (pullRequest.comments ?? [])
    .filter(comment => !summaryCommenters.has(comment.author?.login))
    .map(comment => ({ author: comment.author?.login, at: comment.createdAt }));
  return [...reviews, ...comments].sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/** The required checks that failed or were canceled, from `gh pr checks --required --json <checkFields>`. A job that
 * is run again is a check of its own, with a link of its own. */
function failedChecksOf(checks) {
  return checks.filter(check => check.bucket === 'fail' || check.bucket === 'cancel');
}

/** What is known when the waiting begins, given the pull request and its required checks as `assess` takes them. */
export function startOf(pullRequest, checks) {
  return {
    feedback: feedbackOf(pullRequest).length,
    failedChecks: failedChecksOf(checks).map(check => check.link),
    conflicting: pullRequest.mergeable === 'CONFLICTING',
    behindSince: undefined,
  };
}

/**
 * What to do about the pull request, given it from `gh pr view --json <viewFields>`, its required checks from
 * `gh pr checks --required --json <checkFields>`, what was seen before (from `startOf`, then from the last call), and
 * the time in milliseconds.
 *
 * Returns `{ end: true, merged, message }` to stop waiting, or `{ end: false, status, seen }` to look again later.
 */
export function assess(pullRequest, checks, seen, now) {
  const name = `#${pullRequest.number}`;
  const commit = String(pullRequest.headRefOid).slice(0, 8);
  const end = (merged, message) => ({ end: true, merged, message });

  if (pullRequest.state === 'MERGED') {
    return end(true, `${name} was merged at ${pullRequest.mergedAt}. Go on with the next step of the work.`);
  }
  if (pullRequest.state === 'CLOSED') {
    return end(false, `${name} was closed without being merged.`);
  }

  const conflicting = pullRequest.mergeable === 'CONFLICTING';
  if (conflicting && !seen.conflicting) {
    return end(false, `${name} conflicts with main, so Mergify cannot bring it up to date: merge main into its branch, ` +
      'resolve the conflicts, and push.');
  }

  const newlyFailed = failedChecksOf(checks).filter(check => !seen.failedChecks.includes(check.link));
  if (newlyFailed.length > 0) {
    const what = newlyFailed
      .map(check => `${check.name} of the ${check.event} run ${check.bucket === 'cancel' ? 'was canceled' : 'failed'}`)
      .join(', ');
    return end(false, `On ${commit} of ${name}, ${what}: read the log, and classify the failure before running it ` +
      'again (AGENTS.md, "Classify a CI failure before rerunning it").');
  }

  const feedback = feedbackOf(pullRequest);
  if (feedback.length > seen.feedback) {
    const authors = [...new Set(feedback.slice(seen.feedback).map(item => item.author))].join(', ');
    return end(false, `${name} has a new review or comment by ${authors}: change what it is right about, and answer ` +
      `the rest. Take the label ${label} off while you change the pull request.`);
  }

  const labeled = (pullRequest.labels ?? []).some(each => each.name === label);
  const behind = labeled && pullRequest.mergeStateStatus === 'BEHIND';
  const behindSince = behind ? (seen.behindSince ?? now) : undefined;
  if (behind && now - behindSince >= behindLimitMinutes * 60_000) {
    return end(false, `${name} has been behind main for ${behindLimitMinutes} minutes with the label ${label}, but ` +
      'Mergify has not brought it up to date: read its check "Summary", which says what it waits for.');
  }

  return {
    end: false,
    status: statusOf(pullRequest, checks, { labeled, behind, conflicting }),
    seen: {
      feedback: Math.min(seen.feedback, feedback.length),
      failedChecks: [...seen.failedChecks, ...newlyFailed.map(check => check.link)],
      conflicting,
      behindSince,
    },
  };
}

/** A line about where the pull request stands, which wait-for-merge.js writes when it changes. */
function statusOf(pullRequest, checks, { labeled, behind, conflicting }) {
  if (conflicting) return 'conflicts with main';
  if (!labeled) return `waits for the label ${label}`;
  if (behind) return 'is behind main, for Mergify to bring it up to date';
  const count = bucket => checks.filter(check => check.bucket === bucket).length;
  const done = count('pass') + count('skipping');
  return `${String(pullRequest.headRefOid).slice(0, 8)}: ${done} of ${checks.length} required checks passed, ` +
    `${count('pending')} pending, ${failedChecksOf(checks).length} failed`;
}
