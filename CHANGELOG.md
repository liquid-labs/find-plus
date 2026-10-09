# Changelog

## [3.0.0] - 2026-10-08

Recommended version bump: 3.0.0 (major) because of the breaking change below.

### BREAKING

- Multiple `paths` entries are now a union (OR) instead of an intersection (AND). Migration: callers relying on AND should use a single combined glob or a custom `tests` function.
- Malformed `paths` values (a non-array, or entries that are neither strings nor `{ path, literal? }` objects) now throw `Invalid 'paths' entry …` / `'paths' must be an array` errors.

### Added

- Literal `paths` entries: `{ path, literal: true }`.
- `escapeGlob()`.
- `isIncluded()`, which also returns `false` for paths beneath a directory pruned by an `excludePaths` pattern ending in `/**`, agreeing with `find()`.
- With `sort: 'none'` and multiple `paths` entries, results are ordered by first matching entry.

### Changed

- The `options` passed to custom `tests` now carry normalized glob strings in `paths` (literal entries appear escaped).
- Performance: the escaped root glob is now computed once per root (memoized `escapeRoot` in path-match/traverse-dirs) instead of per file test or per directory.
- Development, CI and release tooling converted from npm to bun (`bun.lock` replaces `package-lock.json`). Added `scripts/release.sh` and `RELEASING.md`.

### Fixed

- A nonexistent `root` reliably throws `Did not find root directory at: ...` on current Node versions. `checkRoot` no longer relies on `throwIfNoEntry: false`, which `fs.promises.stat` honors on newer Node and which caused a `TypeError`.
- Socket-based tests bind via a short relative path, so they pass inside deep paths and git worktrees.

### Documentation

- `minimatchOptions` is now documented.

## [2.0.0] - 2024-09-30

Earlier history is in the git tags and the GitHub releases.
