import assert from 'assert';
import {
  assess, dequeuedLabel, feedbackOf, missingLimitMinutes, queuedLabel, startOf, unqueuedLimitMinutes,
} from '../../script/pull-request/merge-wait.js';

// A pull request as `gh pr view --json <viewFields>` describes one: open, and with the label.
const pullRequestWith = (fields: object = {}) => ({
  number: 7, state: 'OPEN', mergedAt: null, mergeable: 'MERGEABLE', mergeStateStatus: 'BLOCKED',
  labels: [{ name: 'automerge' }], headRefOid: '0123456789abcdef', reviews: [], comments: [], ...fields,
});

// The names of the checks that branch protection requires of main, as wait-for-merge.js reads them when it begins.
const requiredNames = ['test (ubuntu)', 'test (windows-latest)', 'test (macos-arm64)', 'e2e against the development build (ubuntu)'];

// The required checks as `gh pr checks --required --json <checkFields>` gives them once each has a check run: the push
// run's alone, as a pull request runs no workflow with jobs of their names (AGENTS.md, "CI tests each commit once, on
// push").
const checksWith = (bucket: string, { failing = '', link = 'job-2' } = {}) => requiredNames
  .map(name => ({ name, event: 'push', link: `${name}-push-1`, bucket }))
  .map(check => check.name === failing ? { ...check, bucket: 'fail', link } : check);

const minute = 60_000;
const start = Date.UTC(2026, 10, 18, 9, 0, 0);

// From the start of the waiting on `before`, what `after` makes it do.
const waitThrough = (before: object, after: object, { checksBefore = checksWith('pending'), checksAfter = checksBefore } = {}) => {
  const seen = startOf(pullRequestWith(before), checksBefore);
  return assess(pullRequestWith(after), checksAfter, seen, start + minute, requiredNames);
};

describe('merge-wait (script/pull-request/)', () => {
  it('ends when the pull request is merged, the only end that is merged', () => {
    const result = waitThrough({}, { state: 'MERGED', mergedAt: '2026-11-18T09:01:00Z' });
    assert.deepStrictEqual([result.end, result.merged], [true, true]);
    assert.match(result.message, /#7 was merged at 2026-11-18T09:01:00Z\. Go on with the next step/);
  });

  it('ends when the pull request is closed without being merged', () => {
    const result = waitThrough({}, { state: 'CLOSED' });
    assert.deepStrictEqual([result.end, result.merged], [true, false]);
    assert.match(result.message, /closed without being merged/);
  });

  it('ends when main moved on and the pull request now conflicts with it, which the merge queue cannot test it over', () => {
    const result = waitThrough({}, { mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' });
    assert.deepStrictEqual([result.end, result.merged], [true, false]);
    assert.match(result.message, /#7 conflicts with main, so the merge queue cannot test it on top of main: merge main/);
  });

  it('does not end on a conflict that was there when it began, which is known', () => {
    const conflicting = { mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY' };
    const result = waitThrough(conflicting, conflicting);
    assert.strictEqual(result.end, false);
    assert.strictEqual(result.status, 'conflicts with main');
  });

  it('ends when a required check fails or is canceled, naming it, its run and what happened to it', () => {
    for (const [bucket, happened] of [['fail', 'failed'], ['cancel', 'was canceled']]) {
      const checksAfter = checksWith('pending').map((check, index) => index === 0 ? { ...check, bucket } : check);
      const result = waitThrough({}, {}, { checksAfter });
      assert.deepStrictEqual([result.end, result.merged], [true, false]);
      assert.strictEqual(result.message.startsWith(`On 01234567 of #7, test (ubuntu) of the push run ${happened}: ` +
        'read the log, and classify'), true, result.message);
    }
  });

  it('ends on a job that GitHub canceled for want of a runner, as happened to the macOS jobs of #737', () => {
    // A job that no runner takes within 15 minutes is canceled, and its run fails: gh puts the check in "cancel".
    const checksAfter = checksWith('pending').map(check =>
      check.name === 'test (macos-arm64)' && check.event === 'push' ? { ...check, bucket: 'cancel' } : check);
    const result = waitThrough({}, {}, { checksAfter });
    assert.strictEqual(result.end, true);
    assert.match(result.message, /test \(macos-arm64\) of the push run was canceled/);
  });

  it('does not end on a failed check that was there when it began, but does when its run fails again', () => {
    const failedBefore = checksWith('pending', { failing: 'test (ubuntu)', link: 'job-1' });
    assert.strictEqual(waitThrough({}, {}, { checksBefore: failedBefore }).end, false);
    const failedAgain = checksWith('pending', { failing: 'test (ubuntu)', link: 'job-2' });
    assert.strictEqual(waitThrough({}, {}, { checksBefore: failedBefore, checksAfter: failedAgain }).end, true);
  });

  it('goes on while the checks run or pass, and says how far they are', () => {
    const result = waitThrough({}, {}, { checksAfter: checksWith('pass').map((check, index) => index < 2 ? { ...check, bucket: 'pending' } : check) });
    assert.strictEqual(result.end, false);
    assert.strictEqual(result.status, '01234567: not in the merge queue, 2 of 4 required checks passed, 2 pending, 0 failed');
  });

  it('ends on a new review or comment, but not on the summaries that CodeRabbit and Mergify post as comments', () => {
    const summaries = [
      { id: 'IC_1', author: { login: 'coderabbitai' }, createdAt: '2026-11-18T09:00:30Z' },
      { id: 'IC_2', author: { login: 'mergify' }, createdAt: '2026-11-18T09:00:40Z' },
    ];
    assert.strictEqual(waitThrough({}, { comments: summaries }).end, false);

    const review = { id: 'PRR_1', author: { login: 'coderabbitai' }, state: 'COMMENTED', submittedAt: '2026-11-18T09:06:00Z' };
    const fromReview = waitThrough({ comments: summaries }, { comments: summaries, reviews: [review] });
    assert.strictEqual(fromReview.end, true);
    assert.match(fromReview.message, /#7 has a new review or comment by coderabbitai: change what it is right about/);

    const comment = { id: 'IC_3', author: { login: 'TomoyukiAota' }, createdAt: '2026-11-18T09:07:00Z' };
    const fromComment = waitThrough({}, { comments: [comment] });
    assert.match(fromComment.message, /by TomoyukiAota/);
  });

  it('counts neither a review that is not submitted, nor the feedback that was there when it began', () => {
    const pending = { id: 'PRR_2', author: { login: 'TomoyukiAota' }, state: 'PENDING', submittedAt: null };
    assert.deepStrictEqual(feedbackOf(pullRequestWith({ reviews: [pending] })), []);
    const review = { id: 'PRR_1', author: { login: 'coderabbitai' }, state: 'COMMENTED', submittedAt: '2026-11-18T09:06:00Z' };
    assert.strictEqual(waitThrough({ reviews: [review] }, { reviews: [review] }).end, false);
  });

  it('ends on a comment that takes the place of a deleted one, which leaves their number as it was', () => {
    const deleted = { id: 'IC_4', author: { login: 'TomoyukiAota' }, createdAt: '2026-11-18T09:02:00Z' };
    const added = { id: 'IC_5', author: { login: 'TomoyukiAota' }, createdAt: '2026-11-18T09:03:00Z' };
    const result = waitThrough({ comments: [deleted] }, { comments: [added] });
    assert.strictEqual(result.end, true);
    assert.match(result.message, /has a new review or comment by TomoyukiAota/);
  });

  it('says all that is new at once, so that none of it is taken as known when the waiting starts again', () => {
    const review = { id: 'PRR_1', author: { login: 'coderabbitai' }, state: 'COMMENTED', submittedAt: '2026-11-18T09:06:00Z' };
    const after = { mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY', reviews: [review] };
    const checksAfter = checksWith('pending', { failing: 'test (ubuntu)' });
    const result = waitThrough({}, after, { checksAfter });
    assert.strictEqual(result.end, true);
    const lines = result.message.split('\n');
    assert.strictEqual(lines.length, 3, result.message);
    assert.match(lines[0], /conflicts with main/);
    assert.match(lines[1], /test \(ubuntu\) of the push run failed/);
    assert.match(lines[2], /new review or comment by coderabbitai/);
  });

  it('ends when Mergify takes the pull request out of its merge queue, but not on such a label that was there when it began', () => {
    const queued = { labels: [{ name: 'automerge' }, { name: queuedLabel }] };
    const dequeued = { labels: [{ name: 'automerge' }, { name: dequeuedLabel }] };
    const result = waitThrough(queued, dequeued);
    assert.deepStrictEqual([result.end, result.merged], [true, false]);
    assert.match(result.message, /#7 was taken out of the merge queue \(label dequeued\): its test on top of main failed/);
    assert.strictEqual(waitThrough(dequeued, dequeued).end, false);
  });

  it('says when the pull request is in the merge queue', () => {
    const result = waitThrough({}, { labels: [{ name: 'automerge' }, { name: queuedLabel }] }, { checksAfter: checksWith('pass') });
    assert.strictEqual(result.status, '01234567: in the merge queue, 4 of 4 required checks passed, 0 pending, 0 failed');
  });

  it('waits some minutes for Mergify to queue a pull request with the label whose required checks passed, then ends', () => {
    const passed = checksWith('pass');
    const waiting = pullRequestWith();
    let result = assess(waiting, passed, startOf(waiting, passed), start, requiredNames);
    assert.strictEqual(result.end, false);
    result = assess(waiting, passed, result.seen, start + unqueuedLimitMinutes * minute - 1, requiredNames);
    assert.strictEqual(result.end, false);
    // Queued meanwhile, the waiting starts over.
    const queued = pullRequestWith({ labels: [{ name: 'automerge' }, { name: queuedLabel }] });
    assert.strictEqual(assess(queued, passed, result.seen, start + minute, requiredNames).seen.unqueuedSince, undefined);
    result = assess(waiting, passed, result.seen, start + unqueuedLimitMinutes * minute, requiredNames);
    assert.strictEqual(result.end, true);
    assert.match(result.message, /passed its required checks for 10 minutes, but is not in the merge queue: read its check "Mergify Merge Queue"/);
    // Until its checks have passed, or without the label, the waiting goes on.
    const pending = checksWith('pending');
    result = assess(waiting, pending, startOf(waiting, pending), start, requiredNames);
    result = assess(waiting, pending, result.seen, start + 60 * minute, requiredNames);
    assert.strictEqual(result.end, false);
    const unlabeled = pullRequestWith({ labels: [] });
    result = assess(unlabeled, passed, startOf(unlabeled, passed), start, requiredNames);
    result = assess(unlabeled, passed, result.seen, start + 60 * minute, requiredNames);
    assert.deepStrictEqual([result.end, result.status], [false, 'waits for the label automerge']);
  });

  it('counts as pending a required check that has no check run yet, which holds back the end on a pull request out of the queue', () => {
    // Before the checks of a new commit are reported, gh lists none.
    assert.strictEqual(waitThrough({}, {}, { checksAfter: [] }).status,
      '01234567: not in the merge queue, 0 of 4 required checks passed, 4 pending, 0 failed');

    // test (ubuntu) has no check run while the two parts of the tests on Ubuntu run, nor while one of them is run
    // again, and gh lists the others alone: here for 20 minutes, longer than Mergify is given to queue the pull request,
    // and shorter than a missing check is given to come.
    const waiting = pullRequestWith();
    const ubuntuMissing = checksWith('pass').filter(check => check.name !== 'test (ubuntu)');
    let result = assess(waiting, ubuntuMissing, startOf(waiting, ubuntuMissing), start, requiredNames);
    result = assess(waiting, ubuntuMissing, result.seen, start + 20 * minute, requiredNames);
    assert.strictEqual(result.end, false, result.message);
    assert.strictEqual(result.status, '01234567: not in the merge queue, 3 of 4 required checks passed, 1 pending, 0 failed');
    assert.strictEqual(result.seen.unqueuedSince, undefined);

    // Once it has passed too, Mergify has the minutes to queue the pull request from then on.
    const passed = checksWith('pass');
    const passedAt = start + 21 * minute;
    result = assess(waiting, passed, result.seen, passedAt, requiredNames);
    result = assess(waiting, passed, result.seen, passedAt + unqueuedLimitMinutes * minute - 1, requiredNames);
    assert.strictEqual(result.end, false, result.message);
    result = assess(waiting, passed, result.seen, passedAt + unqueuedLimitMinutes * minute, requiredNames);
    assert.strictEqual(result.end, true);
    assert.match(result.message, /passed its required checks for 10 minutes, but is not in the merge queue/);
  });

  it('ends when a required check has had no check run for 30 minutes while no other is pending, as when its workflow did not start', () => {
    // The workflow of test (windows-latest) did not start, and test (ubuntu) passed, was skipped, or failed or was
    // canceled before the waiting began.
    const waiting = pullRequestWith();
    for (const bucket of ['pass', 'skipping', 'fail', 'cancel']) {
      const checks = checksWith('pass').filter(check => check.name !== 'test (windows-latest)')
        .map(check => check.name === 'test (ubuntu)' ? { ...check, bucket } : check);
      let result = assess(waiting, checks, startOf(waiting, checks), start, requiredNames);
      result = assess(waiting, checks, result.seen, start + missingLimitMinutes * minute - 1, requiredNames);
      assert.strictEqual(result.end, false, result.message);
      result = assess(waiting, checks, result.seen, start + missingLimitMinutes * minute, requiredNames);
      assert.deepStrictEqual([result.end, result.merged], [true, false], bucket);
      assert.strictEqual(result.message, 'On 01234567 of #7, the required check test (windows-latest) has had no check ' +
        'run for 30 minutes, and no other required check is pending: its workflow may not have started, as when a ' +
        'workflow file has an error. Look at the runs of 01234567 in the Actions tab.');
    }

    // Before gh lists any check of the commit, all of them are missing.
    let result = assess(waiting, [], startOf(waiting, []), start, requiredNames);
    result = assess(waiting, [], result.seen, start + missingLimitMinutes * minute, requiredNames);
    assert.match(result.message, new RegExp('^On 01234567 of #7, the required checks test \\(ubuntu\\), test \\(windows-latest\\), ' +
      'test \\(macos-arm64\\), e2e against the development build \\(ubuntu\\) have had no check run for 30 minutes, and no ' +
      'other required check is pending: their workflows may not have started'));
  });

  it('does not end on a required check without a check run while another is pending, and gives it its minutes anew on a new commit', () => {
    // While the tests on macOS run, the workflow of test (windows-latest) has not started.
    const waiting = pullRequestWith();
    const macosRunning = checksWith('pass').filter(check => check.name !== 'test (windows-latest)')
      .map(check => check.name === 'test (macos-arm64)' ? { ...check, bucket: 'pending' } : check);
    let result = assess(waiting, macosRunning, startOf(waiting, macosRunning), start, requiredNames);
    result = assess(waiting, macosRunning, result.seen, start + 60 * minute, requiredNames);
    assert.strictEqual(result.end, false, result.message);
    assert.strictEqual(result.seen.missingSince, undefined);

    // Its minutes start once the tests on macOS have ended. A new commit, of which gh lists no check at first, starts
    // them again.
    const windowsMissing = checksWith('pass').filter(check => check.name !== 'test (windows-latest)');
    result = assess(waiting, windowsMissing, result.seen, start + 61 * minute, requiredNames);
    assert.strictEqual(result.seen.missingSince, start + 61 * minute);
    const pushed = pullRequestWith({ headRefOid: 'fedcba9876543210' });
    result = assess(pushed, [], result.seen, start + 90 * minute, requiredNames);
    result = assess(pushed, [], result.seen, start + 90 * minute + missingLimitMinutes * minute - 1, requiredNames);
    assert.strictEqual(result.end, false, result.message);
    assert.strictEqual(result.seen.missingSince, start + 90 * minute);
  });

  it('counts the checks that gh lists alone, as before, when those that branch protection requires could not be read', () => {
    const waiting = pullRequestWith();
    const ubuntuMissing = checksWith('pass').filter(check => check.name !== 'test (ubuntu)');
    let result = assess(waiting, ubuntuMissing, startOf(waiting, ubuntuMissing), start, undefined);
    assert.strictEqual(result.status, '01234567: not in the merge queue, 3 of 3 required checks passed, 0 pending, 0 failed');
    result = assess(waiting, ubuntuMissing, result.seen, start + unqueuedLimitMinutes * minute, undefined);
    assert.strictEqual(result.end, true);
  });
});
