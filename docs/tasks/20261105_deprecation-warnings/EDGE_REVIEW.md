# Final edge-case review

## Legacy Glob stat cache: regression fixed

The new adapter initially called `statSync` unconditionally for each matched
entry. A dangling symlink can remain in glob13's `follow: true, nodir: true`
results, so constructing the legacy Glob used by Karma throws ENOENT. A file
removed between discovery and stat-cache construction has the same problem.
This reproduced against the installed adapter, independently of the review text.
An isolated comparison with genuine glob7.2.3 confirmed that it retains the
dangling link with lstat information and a valid mtime; the corrected adapter
returns the same result.

Use ordinary stat information when available, fall back to lstat for a dangling
link, and drop entries that have disappeared. Preserve non-missing errors rather
than suppressing them. Karma can still read every retained entry's mtime. Two
new compatibility tests exercise an actual dangling link and Karma refresh, and
a deterministic removal between modern matching and legacy stat caching; the
latter also checks that an unrelated I/O error remains visible. Windows uses a
junction to avoid requiring symlink privileges.

Fresh installation refreshes packed adapter sources. All 27 compatibility tests
pass locally, as do Angular57 and build/bridge/adapter type checking. Repeat all-platform CI for the new
adapter source; the application runtime and signed bundle source are unchanged.

## Metadata-suffixed cache directories: existing behavior, left unchanged

A separate review finding was compared with the genuine original
delete-empty3.0.0 implementation in an isolated fixture. Both that implementation
and its replacement remove a cache root whose only child is a directory named
`vacation.DS_Store`, even if that child contains a thumbnail. The old emptiness
test applies its metadata-suffix expression to entry names without checking
their types before recursion. This is a pre-existing safety weakness, not a
regression introduced by the deprecation replacement.

The affected data is generated thumbnail/cache content and logs, not original
photos. This task explicitly preserves behavior, so do not silently include a
separate cache-policy change. No application code was changed for this finding.
The owner can decide whether to address it in a follow-up. A possible narrow fix
would ignore only regular metadata files, recurse all real directories, retain
symbolic links, and use a non-recursive final directory removal so concurrent
new cache content prevents deletion. Such a follow-up needs directory-name,
metadata-file, symlink/junction and concurrent-content regressions.
