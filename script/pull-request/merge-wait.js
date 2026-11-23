// What wait-for-merge.js makes of a pull request each time that it looks at it: whether to go on waiting, or to end
// and say why. It is kept apart from the waiting, so that the tests give it a pull request as gh describes one.
//
// The waiting ends on what changed since it began, so that it can be started again without ending at once on
// something that is already known: a failed check that is being run again, or a conflict that waits for the owner.
// It says all that changed at once: what it left unsaid would be known when it is started again, and never said.

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

/** What is known when the waiting begins, given the pull request and its required checks as `assess` takes them. */
export function startOf(pullRequest, checks) {
  return {
    feedback: feedbackOf(pullRequest).map(item => item.id),
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

  // What needs the agent, each on a line of its own.
  const news = [];

  const conflicting = pullRequest.mergeable === 'CONFLICTING';
  if (conflicting && !seen.conflicting) {
    news.push(`${name} conflicts with main, so Mergify cannot bring it up to date: merge main into its branch, ` +
      'resolve the conflicts, and push.');
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

  const labeled = (pullRequest.labels ?? []).some(each => each.name === label);
  const behind = labeled && pullRequest.mergeStateStatus === 'BEHIND';
  const behindSince = behind ? (seen.behindSince ?? now) : undefined;
  if (behind && now - behindSince >= behindLimitMinutes * 60_000) {
    news.push(`${name} has been behind main for ${behindLimitMinutes} minutes with the label ${label}, but ` +
      'Mergify has not brought it up to date: read its check "Summary", which says what it waits for.');
  }

  if (news.length > 0) return end(false, news.join('\n'));

  return {
    end: false,
    status: statusOf(pullRequest, checks, { labeled, behind, conflicting }),
    seen: {
      feedback: feedback.map(item => item.id),
      failedChecks: [...seen.failedChecks, ...newlyFailed.map(check => check.link)],
      conflicting,
      behindSince,
    },
  };
}

/**
 * Where each required check stands, by its name: 'failed' when one of its runs failed or was canceled, 'pending' when
 * one is still to end, else 'passed'. GitHub and Mergify take every run of a check of the same name on the commit, the
 * push's and the pull request's, which skips its jobs for a pull request from a branch of this repository (AGENTS.md,
 * "CI tests each commit once, on push"): a skipped run passes the check only once the push's has passed too.
 */
function standingOfChecks(checks) {
  const standing = new Map();
  for (const check of checks) {
    const now = check.bucket === 'fail' || check.bucket === 'cancel' ? 'failed'
      : check.bucket === 'pass' || check.bucket === 'skipping' ? 'passed' : 'pending';
    const before = standing.get(check.name);
    if (before !== 'failed' && (before !== 'pending' || now === 'failed')) standing.set(check.name, now);
  }
  return [...standing.values()];
}

/** A line about where the pull request stands, which wait-for-merge.js writes when it changes. */
function statusOf(pullRequest, checks, { labeled, behind, conflicting }) {
  if (conflicting) return 'conflicts with main';
  if (!labeled) return `waits for the label ${label}`;
  if (behind) return 'is behind main, for Mergify to bring it up to date';
  const standing = standingOfChecks(checks);
  const count = state => standing.filter(each => each === state).length;
  return `${String(pullRequest.headRefOid).slice(0, 8)}: ${count('passed')} of ${standing.length} required checks ` +
    `passed, ${count('pending')} pending, ${count('failed')} failed`;
}
