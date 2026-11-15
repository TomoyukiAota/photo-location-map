import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createDraftReleaseIfNone, findOrCreateDraftRelease, gitHubRepositoryOf, gitHubRequest, isPullRequestBuild
} from '../../script/publish/draft-release.js';

// GitHub is never called: each test gives the functions a request or a fetch of its own.
describe('draft-release (script/publish/)', () => {
  describe('isPullRequestBuild', () => {
    it('is true for the build of a pull request, as electron-builder does not publish it', () => {
      assert.strictEqual(isPullRequestBuild({ GITHUB_BASE_REF: 'main' }), true);
      assert.strictEqual(isPullRequestBuild({ TRAVIS_PULL_REQUEST: '42' }), true);
    });

    it('is false for a push, locally, and for a pull request that is published on purpose', () => {
      assert.strictEqual(isPullRequestBuild({ GITHUB_BASE_REF: '' }), false);
      assert.strictEqual(isPullRequestBuild({}), false);
      assert.strictEqual(isPullRequestBuild({ TRAVIS_PULL_REQUEST: 'false' }), false);
      assert.strictEqual(isPullRequestBuild({ GITHUB_BASE_REF: 'main', PUBLISH_FOR_PULL_REQUEST: 'true' }), false);
    });
  });

  describe('gitHubRepositoryOf', () => {
    const configWithOrigin = (url: string) => [
      '[core]', '\tbare = false',
      '[remote "upstream"]', '\turl = https://github.com/someone-else/fork.git',
      '[remote "origin"]', `\turl = ${url}`, '\tfetch = +refs/heads/*:refs/remotes/origin/*',
      '[branch "main"]', '\tremote = origin', '',
    ].join('\n');
    const repository = { owner: 'TomoyukiAota', repo: 'photo-location-map' };

    it('reads the origin remote, over HTTPS or SSH, with or without .git', () => {
      assert.deepStrictEqual(gitHubRepositoryOf(configWithOrigin('https://github.com/TomoyukiAota/photo-location-map.git')), repository);
      assert.deepStrictEqual(gitHubRepositoryOf(configWithOrigin('https://github.com/TomoyukiAota/photo-location-map')), repository);
      assert.deepStrictEqual(gitHubRepositoryOf(configWithOrigin('git@github.com:TomoyukiAota/photo-location-map.git')), repository);
      assert.deepStrictEqual(gitHubRepositoryOf(configWithOrigin('https://github.com/TomoyukiAota/photo-location-map.git').replaceAll('\n', '\r\n')), repository);
    });

    it('gives none for an origin that is not on GitHub, and without an origin', () => {
      assert.strictEqual(gitHubRepositoryOf(configWithOrigin('https://gitlab.com/someone/project.git')), undefined);
      assert.strictEqual(gitHubRepositoryOf('[remote "upstream"]\n\turl = https://github.com/someone-else/fork.git\n'), undefined);
      assert.strictEqual(gitHubRepositoryOf('[remote "origin"]\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n[branch "main"]\n'), undefined);
    });
  });

  describe('findOrCreateDraftRelease', () => {
    const recording = (releases: object[]) => {
      const calls: unknown[][] = [];
      const request = async (method: string, resource: string, body?: object) => {
        calls.push([method, resource, body]);
        return method === 'GET' ? releases : { id: 2, ...body };
      };
      return { calls, request };
    };

    it('creates the draft release as electron-builder does when no release has the tag', async () => {
      const { calls, request } = recording([{ id: 1, tag_name: 'v1.13.0', draft: false }]);
      const { release, created } = await findOrCreateDraftRelease('1.13.1-alpha', request);
      assert.strictEqual(created, true);
      assert.deepStrictEqual(release, { id: 2, tag_name: 'v1.13.1-alpha', name: '1.13.1-alpha', draft: true, prerelease: false });
      assert.deepStrictEqual(calls, [
        ['GET', '/releases', undefined],
        ['POST', '/releases', { tag_name: 'v1.13.1-alpha', name: '1.13.1-alpha', draft: true, prerelease: false }],
      ]);
    });

    it('creates none when a release has the tag or the version, a draft or not, as electron-builder finds it', async () => {
      for (const existing of [
        { id: 1, tag_name: 'v1.13.0', draft: true },
        { id: 1, tag_name: '1.13.0', draft: true },
        { id: 1, tag_name: 'v1.13.0', draft: false },
      ]) {
        const { calls, request } = recording([{ id: 3, tag_name: 'v1.13.1-alpha', draft: true }, existing]);
        const { release, created } = await findOrCreateDraftRelease('1.13.0', request);
        assert.strictEqual(created, false);
        assert.strictEqual(release, existing);
        assert.deepStrictEqual(calls, [['GET', '/releases', undefined]]);
      }
    });
  });

  describe('gitHubRequest', () => {
    const recordingFetch = (status: number, answer: object) => {
      const calls: { url: string; init: RequestInit }[] = [];
      const fetchFunction = async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify(answer), { status, statusText: status === 401 ? 'Unauthorized' : '' });
      };
      return { calls, fetchFunction };
    };

    it('calls the repository\'s resource with the token, and sends a body as JSON', async () => {
      const { calls, fetchFunction } = recordingFetch(201, { id: 2 });
      const request = gitHubRequest({ owner: 'owner', repo: 'repo' }, 'a-token', fetchFunction);
      assert.deepStrictEqual(await request('POST', '/releases', { draft: true }), { id: 2 });
      assert.strictEqual(calls[0].url, 'https://api.github.com/repos/owner/repo/releases');
      assert.strictEqual(calls[0].init.method, 'POST');
      assert.strictEqual(calls[0].init.body, '{"draft":true}');
      const headers = calls[0].init.headers as Record<string, string>;
      assert.strictEqual(headers.Authorization, 'Bearer a-token');
      assert.strictEqual(headers['Content-Type'], 'application/json');
    });

    it('throws for an answer that is not a success, with a message without the token', async () => {
      const { fetchFunction } = recordingFetch(401, { message: 'Bad credentials' });
      const request = gitHubRequest({ owner: 'owner', repo: 'repo' }, 'a-token', fetchFunction);
      await assert.rejects(request('GET', '/releases'), (error: Error) => {
        assert.match(error.message, /401 Unauthorized/);
        assert.doesNotMatch(error.message, /a-token/);
        return true;
      });
    });
  });

  describe('createDraftReleaseIfNone', () => {
    let projectDir: string;
    beforeEach(() => { projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-publish-')); });
    afterEach(() => fs.rmSync(projectDir, { recursive: true, force: true }));

    const writeGitConfig = (url: string) => {
      fs.mkdirSync(path.join(projectDir, '.git'));
      fs.writeFileSync(path.join(projectDir, '.git', 'config'), `[remote "origin"]\n\turl = ${url}\n`);
    };
    const recordingFetch = (releases: object[]) => {
      const calls: string[] = [];
      const fetchFunction = async (url: string, init: RequestInit) => {
        calls.push(`${init.method} ${url}`);
        const answer = init.method === 'GET' ? releases : { draft: true, html_url: 'https://github.com/owner/repo/releases/tag/untagged-1' };
        return new Response(JSON.stringify(answer), { status: init.method === 'GET' ? 200 : 201 });
      };
      return { calls, fetchFunction };
    };
    const run = (fetchFunction: typeof fetch, env: Record<string, string> = {}) =>
      createDraftReleaseIfNone({ projectDir, version: '1.2.3', token: 'a-token', env, fetchFunction });

    it('creates the draft release in the repository of the origin remote in .git/config', async () => {
      writeGitConfig('https://github.com/owner/repo.git');
      const { calls, fetchFunction } = recordingFetch([]);
      assert.strictEqual(await run(fetchFunction), 'created');
      assert.deepStrictEqual(calls, [
        'GET https://api.github.com/repos/owner/repo/releases',
        'POST https://api.github.com/repos/owner/repo/releases',
      ]);
    });

    it('creates none when the release is there', async () => {
      writeGitConfig('https://github.com/owner/repo.git');
      const { calls, fetchFunction } = recordingFetch([{ tag_name: 'v1.2.3', draft: true, html_url: 'https://github.com/owner/repo/releases/tag/untagged-1' }]);
      assert.strictEqual(await run(fetchFunction), 'found');
      assert.deepStrictEqual(calls, ['GET https://api.github.com/repos/owner/repo/releases']);
    });

    it('asks GitHub nothing for the build of a pull request, nor for an origin that is not on GitHub', async () => {
      writeGitConfig('https://github.com/owner/repo.git');
      const { calls, fetchFunction } = recordingFetch([]);
      assert.strictEqual(await run(fetchFunction, { GITHUB_BASE_REF: 'main' }), 'skipped');
      fs.writeFileSync(path.join(projectDir, '.git', 'config'), '[remote "origin"]\n\turl = https://gitlab.com/someone/project.git\n');
      assert.strictEqual(await run(fetchFunction), 'skipped');
      assert.deepStrictEqual(calls, []);
    });

    it('leaves the draft release to electron-builder in a git worktree, whose .git is a file, and without GitHub', async () => {
      fs.writeFileSync(path.join(projectDir, '.git'), 'gitdir: /somewhere/else/.git/worktrees/branch\n');
      const { calls, fetchFunction } = recordingFetch([]);
      assert.strictEqual(await run(fetchFunction), 'failed');
      assert.deepStrictEqual(calls, []);

      fs.rmSync(path.join(projectDir, '.git'));
      writeGitConfig('https://github.com/owner/repo.git');
      const unreachable = async () => { throw new Error('getaddrinfo ENOTFOUND api.github.com'); };
      assert.strictEqual(await run(unreachable as unknown as typeof fetch), 'failed');
    });
  });
});
