# Legacy glob consumer adapter

**TL;DR:** This private package replaces only the `glob` dependency consumed by
Karma 6 and ASAR 3. It implements their legacy interfaces using maintained
`glob@13.0.6`. It does not modify deprecation metadata or filter warnings.

**Details:** Inspected callers are Karma's `lib/file-list.js` (`new Glob` with
`sync: true`, then `.found` and `.statCache[path].mtime`), `lib/init.js`
(`glob.sync`), and `lib/completion.js` (callback glob with `mark`/`nocase`).
ASAR's `lib/crawlfs.js` promisifies `glob.glob` and normally sets `dot: true`.
The adapter supports only these methods and the documented option whitelist in
`index.cjs`. Unknown options and asynchronous `new Glob` fail visibly.

Legacy results sort with the English locale before directory marking. Directory
symlinks receive a trailing slash with `mark` and are excluded with `nodir`,
matching glob 7. Windows separators remain separators, while POSIX backslash
escapes retain their literal-matching meaning. The filesystem traversal
and pattern matching are performed by maintained glob, not a copied legacy
implementation. Arbitrary glob 7 extensions, internal caches, events other than
callback completion, and custom filesystem implementations are outside scope.

The root `.npmrc` must keep `install-links=true`: npm packs these local packages
instead of creating consumer-relative symlinks. Run `npm ci` after changing
adapter source: `npm install` can keep an older packed copy. The compatibility
suite checks installed source freshness. Their own names and versions identify
repository-owned code honestly.

Keep the supported Mocha glob dependency scoped to Mocha. A direct root glob
dependency can make npm 11 ignore these differently named scoped replacements;
the installed-tree checks deliberately reject that resolution. Always check the
actual consumer resolutions after changing dependency topology.

If migrating a lock that retained direct symlinks, explicitly reinstall the
direct adapters once, then verify a clean install:

```sh
mise exec -- npm install --save-dev @photo-location-map/legacy-glob@file:compat/glob @photo-location-map/legacy-rimraf@file:compat/rimraf --install-links=true
mise exec -- npm ci
mise exec -- npm run test:dependency-compat
```

Run `npm run test:dependency-compat` after consumer or adapter upgrades. Tests use
actual Karma file-list discovery/updates and actual ASAR creation/extraction,
including file order, hidden files, symlinks, and unpacked files. Initial isolated
comparison against glob 7 and ASAR 3 produced identical results and archive bytes.
Cross-platform CI and package smoke tests remain necessary, particularly for
Windows path and symlink behavior.

Remove this package and its overrides when the supported Karma/ASAR versions no
longer require legacy glob. Do not extend the supported API automatically when
upgrading a caller; inspect its new calls and update behavioral tests first.
