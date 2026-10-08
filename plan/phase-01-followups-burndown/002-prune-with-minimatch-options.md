# Pass minimatchOptions To Directory Pruning

## Purpose and scope

Resolves followup cTaj. Directory pruning ignores the caller's `minimatchOptions`, so with `{ nocase: true }` or `{ dot: true }` it can skip directories whose contents the per-file `paths`/`excludePaths` tests would match, silently dropping results (e.g. `paths: ['FOO/*']` with `nocase` prunes dir `foo`). Files: `src/lib/traverse-dirs.mjs`, `src/lib/path-match.mjs` (`isPrunedByExcludePaths`), `src/lib/test/traverse-dirs.test.mjs`.

## Requirements

- In `testForInclusionAndFrontier`, read `minimatchOptions` from `options` and pass it as the third argument to the `minimatch(rootBit, matchPathBit)` and `minimatch(matchPath, minPrefix)` calls.
- Give `isPrunedByExcludePaths` a `minimatchOptions` parameter, pass it to its `minimatch` call, and update its comment (it no longer ignores the options). Update the caller in `traverse-dirs.mjs`.
- Consider the `dot` case for exclude pruning: with `dot` unset, `foo/**` does not match dotted descendants, but pruning applies only when the directory path itself matches. Keep behavior identical for the no-options case; do not widen scope beyond passing options through.
- Add tests in `src/lib/test/traverse-dirs.test.mjs` (additive, following the existing `test.each` shape and `_traversedDirs` mechanism) showing that with `minimatchOptions: { nocase: true }` a mixed-case `paths` pattern (e.g. `DIRA/*.txt`) still traverses `/dirA`, and that without the option it does not. Add a `dot` case if the fixture data can support it without adding files under `src/test/data` that alter existing test expectations; otherwise create a temp directory in the test. Add an end-to-end `find()` test in `src/test/find-plus.test.mjs` for the nocase case if inexpensive.
- Note the existing test harness builds options without `minimatchOptions`; passing `undefined` must remain valid.

## Validation

- All pre-existing tests pass unchanged; `make lint` passes.
- New nocase (and dot, if feasible) tests fail before the change and pass after.

## Status

Succeeded, 2026-10-08. `minimatchOptions` now passed to the `paths` pruning `minimatch` calls in `src/lib/traverse-dirs.mjs` and to `isPrunedByExcludePaths` in `src/lib/path-match.mjs`. Added nocase/dot tests in `src/lib/test/traverse-dirs.test.mjs` (dot via temp dir) and an end-to-end nocase case in `src/test/find-plus.test.mjs`. New tests fail before and pass after; lint passes; only the 4 pre-existing failures remain.
