import fs from 'fs';
import path from 'path';
import logger from '../util/logger.js';

// TL;DR: Before electron-builder publishes, the draft release of the version is created when the repository has
// none, so that electron-builder uploads all the files of a platform into that one draft release.
// Details: electron-builder 26.18.1 makes one GitHub publisher per publish configuration, but
// PublishManager.getOrCreatePublisher (app-builder-lib) awaits createPublisher between looking the publisher up and
// keeping it. Files that are ready together then get a publisher each ("publishing publisher=Github" is logged
// twice), and the getOrCreateRelease (electron-publish) of each, finding no release with the tag, creates one: the
// DMG and the zip of 1.13.0-rc.1 were split between two draft releases, and so are the Windows installer and its
// blockmap of each push in CI ("creating GitHub release" is logged twice). When the draft release is there, every
// publisher finds it and uploads into it, as for 1.13.0-rc.2 and 1.13.0, whose draft releases were created by hand.
// It is looked for and created as electron-builder does: on the first page of the repository's releases, by the tag
// "v<version>" or by the version; created with that tag, the version as its name, as a draft and not a prerelease;
// in the repository of the origin remote in .git/config, which a git worktree does not have, its .git being a file;
// and not for the build of a pull request, which electron-builder does not publish. When the draft release cannot be
// looked for or created, electron-builder publishes as it did before. A draft release is left without files when the
// packaging fails after it is created.
// Remove this when electron-builder keeps one publisher per configuration for files that are ready together.

/** Whether electron-builder skips publishing this build, as the build of a pull request: isPullRequest of builder-util. */
export function isPullRequestBuild(env) {
  const isSet = value => !!value && value !== 'false';
  const pullRequest = ['TRAVIS_PULL_REQUEST', 'CIRCLE_PULL_REQUEST', 'BITRISE_PULL_REQUEST', 'APPVEYOR_PULL_REQUEST_NUMBER',
    'GITHUB_BASE_REF'].some(name => isSet(env[name]));
  return pullRequest && env.PUBLISH_FOR_PULL_REQUEST !== 'true';
}

/** The owner and the name of the GitHub repository of the origin remote in `gitConfig`, or undefined. */
export function gitHubRepositoryOf(gitConfig) {
  const lines = gitConfig.split(/\r?\n/);
  const origin = lines.findIndex(line => line.trim() === '[remote "origin"]');
  if (origin === -1) return undefined;
  for (const line of lines.slice(origin + 1)) {
    if (line.trim().startsWith('[')) return undefined;
    const url = /^\s*url\s*=\s*(\S+)\s*$/.exec(line)?.[1];
    if (url) {
      const match = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url);
      return match ? { owner: match[1], repo: match[2] } : undefined;
    }
  }
  return undefined;
}

/** A function that calls GitHub's REST API for `repository` with `token`, which no message of its errors contains. */
export function gitHubRequest(repository, token, fetchFunction = fetch) {
  return async (method, resource, body) => {
    const response = await fetchFunction(`https://api.github.com/repos/${repository.owner}/${repository.repo}${resource}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'photo-location-map-publish',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`${method} ${resource} was answered with ${response.status} ${response.statusText}.`);
    return response.json();
  };
}

/** The release of `version` that electron-builder would find, or else the draft release that it would create. */
export async function findOrCreateDraftRelease(version, request) {
  const tag = `v${version}`;
  const releases = await request('GET', '/releases');
  const release = releases.find(each => each.tag_name === tag || each.tag_name === version);
  if (release) return { release, created: false };
  const created = await request('POST', '/releases', { tag_name: tag, name: version, draft: true, prerelease: false });
  return { release: created, created: true };
}

/**
 * Creates the draft release of `version` in the repository of `projectDir`, unless a release has its tag, and says
 * what it did: 'created', 'found', 'skipped' or 'failed'. It does not throw: electron-builder publishes as before.
 */
export async function createDraftReleaseIfNone({ projectDir, version, token, env = process.env, fetchFunction = fetch }) {
  if (isPullRequestBuild(env)) {
    logger.info('This is the build of a pull request, which electron-builder does not publish: no draft release is created.');
    return 'skipped';
  }
  try {
    const repository = gitHubRepositoryOf(fs.readFileSync(path.join(projectDir, '.git', 'config'), 'utf8'));
    if (!repository) {
      logger.warn('The origin remote in .git/config is not on GitHub: electron-builder looks for the draft release itself.');
      return 'skipped';
    }
    const { release, created } = await findOrCreateDraftRelease(version, gitHubRequest(repository, token, fetchFunction));
    logger.info(`${created ? 'Created' : 'Found'} the ${release.draft ? 'draft release' : 'release'} of v${version}: ${release.html_url}`);
    return created ? 'created' : 'found';
  } catch (error) {
    logger.warn(`The draft release of v${version} could not be looked for or created, so electron-builder publishes as before: ${error.message}`);
    return 'failed';
  }
}
