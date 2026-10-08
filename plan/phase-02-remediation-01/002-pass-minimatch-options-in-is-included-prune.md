# Pass minimatchOptions to isIncluded Ancestor Pruning

## Purpose and scope

Remediates finding uhXy: `src/lib/is-included.mjs` calls `isPrunedByExcludePaths` for ancestor directories without `minimatchOptions`, so `isIncluded` and `find()` can disagree on ancestor pruning under `nocase`/`dot`. The work targets the plan branch `plan/followups-burndown-fixes` and lands through the ordinary per-task loop.

## Requirements

1. In `src/lib/is-included.mjs`, pass `minimatchOptions` in the `isPrunedByExcludePaths` call for ancestor directories (about line 38), matching `src/lib/traverse-dirs.mjs`.
2. Add an `isIncluded` test (in `src/test/is-included.test.mjs`) that uses `nocase` or `dot` with a pruning `/**` exclude and shows `isIncluded` agrees with `find()` on ancestor pruning.
3. Existing tests pass unchanged; new tests are additive.

## Validation

1. The new test fails without the one-line change and passes with it.
2. The full existing test suite passes (apart from the 4 known environmental failures in `src/test/find-plus.test.mjs`), and `make lint` passes.

## References

- Finding `uhXy` in this plan's `plan/findings.yaml`.

## Status

Outcome: succeeded (2026-10-08). Passed `minimatchOptions` to the ancestor `isPrunedByExcludePaths` call in `src/lib/is-included.mjs`; added two nocase tests in `src/test/is-included.test.mjs` (both fail without the fix, pass with it). Full suite: 4 known environmental failures only; `make lint` passes.
