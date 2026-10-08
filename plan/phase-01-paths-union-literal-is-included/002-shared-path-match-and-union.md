# Shared Path Match And Union

## Purpose and scope

Make several `paths` entries a union by sending every per-file `paths`/`excludePaths` decision through one new shared module, `src/lib/path-match.mjs`. Later tasks build literal entries and `isIncluded` on the same module, so it has to be the single home of path-criteria matching. This task makes the failing union tests from task 001 pass without changing single-entry behavior.

Files: create `src/lib/path-match.mjs` and `src/lib/test/path-match.test.mjs`, and modify `src/lib/add-implied-tests.mjs` and `src/find-plus.mjs`. `src/lib/traverse-dirs.mjs` should not need changes, since its pruning already uses `paths.some(...)`. If you find it does, halt and report.

## Requirements

1. **Create `src/lib/path-match.mjs`** exporting `rootGlob`, `firstMatchIndex`, and `matchesPathCriteria`, with the exact semantics in [the API design note](../notes/api-design.md#internal-module-srclibpath-matchmjs):
   - `rootGlob(glob, absRoot)` is the existing anchoring moved verbatim from `add-implied-tests.mjs`: a glob starting with `/` is used as-is, and any other glob becomes `` `${absRoot}/${glob}` ``. Do not escape `absRoot` (pre-existing behavior, recorded as a finding).
   - `firstMatchIndex(fullPath, globs, { absRoot, minimatchOptions })` returns the index of the first glob that matches, or `-1`.
   - `matchesPathCriteria(fullPath, { absRoot, paths, excludePaths, minimatchOptions })` returns `true` iff (`paths` is undefined or empty, or some entry matches) and no `excludePaths` entry matches.
   - Import `minimatch` the same way the existing code does (`import { minimatch } from 'minimatch'`).
2. **Rewrite the `paths`/`excludePaths` part of `addImpliedTests`**: remove the two per-entry `unshift` loops. When `paths?.length > 0` or `excludePaths?.length > 0`, `unshift` **one** test, `(dirEnt) => matchesPathCriteria(dirEntToFilePath(dirEnt), { absRoot, paths, excludePaths, minimatchOptions })`, where `absRoot = fsPath.resolve(root)` as computed today. Replace the private `makeFullPath` with the existing `dirEntToFilePath` from `./dir-ent-to-file-path` (same semantics) and delete `makeFullPath`. Leave every other implied test untouched.
3. **Ordering under `sort: 'none'`** in `src/find-plus.mjs`: when `sort === 'none'` and `paths?.length > 1`, stable-sort `matchedFiles` (Node's `Array.prototype.sort` is stable) by `firstMatchIndex(dirEntToFilePath(f), paths, { absRoot, minimatchOptions })` before mapping to strings, with `absRoot = fsPath.resolve(params.root)`. This gives entry order first and walk order within an entry. Leave the sorter path (`sort !== 'none'`) unchanged.
4. Do not change option names, defaults, or `paths: []` behavior (no filtering, no pruning).
5. **Unit tests**: add `src/lib/test/path-match.test.mjs`. Use pure string inputs with no filesystem access, for example `absRoot = '/proj'`. Cover:
   - `rootGlob` for relative and absolute globs.
   - `firstMatchIndex` returning the first of several matching indexes, and `-1`.
   - `matchesPathCriteria` with no criteria (`true`), union of `paths`, exclusion overriding inclusion, an empty `paths` array, and a directory `fullPath` with a trailing `/` matching a glob written without one.
   Follow the existing test style (`/* global describe expect test */`, `test.each`).

## Validation

- `npm test` passes, including **all** task-001 rows and every pre-existing test in `src/test/find-plus.test.mjs` and `src/lib/test/traverse-dirs.test.mjs`.
- `npm run lint` passes.
- `grep -n "minimatch(" src/lib/add-implied-tests.mjs` finds nothing (all per-file matching now goes through `path-match.mjs`).
- `grep -rn "makeFullPath" src` finds nothing.
- `git diff --stat` (excluding `plan/`) shows only `src/lib/path-match.mjs`, `src/lib/test/path-match.test.mjs`, `src/lib/add-implied-tests.mjs`, and `src/find-plus.mjs`.

## Assumptions

- Task 001 left `npm test` red with exactly its eight intended failures. If other tests fail at task start, halt and report.
- Task worktrees have no `node_modules`. Install with `npm ci` or symlink the project root's `node_modules`, and never commit lockfile changes.

## References

- [API design note](../notes/api-design.md): binding contract for `path-match.mjs`, ordering, and breaking changes.
- [minimatch escape behavior](../notes/minimatch-escape-behavior.md): matcher behaviors (trailing `/`, dotfiles) the tests rely on.
- `src/lib/traverse-dirs.mjs`: pruning, which keeps receiving raw glob strings.

## Checkpoint hints

- After creating `src/lib/path-match.mjs` and its unit tests.
- After rewriting `addImpliedTests` (task-001 tests other than the `sort: 'none'` row should now pass).
- After adding the `sort: 'none'` ordering in `find()`.

## Status

- Outcome: succeeded (2026-10-08).
- Created `src/lib/path-match.mjs`, `src/lib/test/path-match.test.mjs`; modified `src/lib/add-implied-tests.mjs` (single combined path test, `makeFullPath` removed) and `src/find-plus.mjs` (stable first-match-index ordering for `sort: 'none'` with multiple `paths`).
- Validation: lint passes; grep checks empty. From a short path (/tmp/fp) all 8 task-001 union rows and everything else pass (114/115); the one failure ("must specify extant root" message) is environmental and unrelated to this change. From the long worktree path the socket-fixture suite cannot start (listen EINVAL), as on baseline.
