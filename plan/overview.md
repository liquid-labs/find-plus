# Paths Union, Literal Entries, and isIncluded

## Purpose and scope

This plan brings `find-plus`'s path matching closer to Linux `find` semantics in three ways:

1. **Union of `paths` entries.** Several `paths` entries select the union of their matches. Today they select the intersection. A file matched by more than one entry appears once. An entry that matches nothing does not suppress the others.
2. **Literal `paths` entries.** An explicit opt-in, the object entry `{ path, literal: true }`, marks an entry as an exact file or directory name, so names containing `[ ] * ? { }` work. String entries stay globs, and literal and glob entries can be mixed in one call. A public `escapeGlob(str)` uses the same engine.
3. **`isIncluded(path, options)`.** A synchronous, filesystem-free boolean check of whether one literal subject path passes a `find()`-style `paths`/`excludePaths` criteria set. It is built on the same shared matcher `find()` uses.

Out of scope: changing option names or defaults, adding dependencies, adding type declarations (the package ships none), bumping `package.json`, and the pre-existing issues recorded as findings (unescaped `root` interpolation, the pruning code ignoring `minimatchOptions`, the breadth-sorter typo, the `windowsPathsNoEscape` brace limitation, and README anchor and option-name typos).

The binding API contract, module layout, breaking-change list, and version recommendation are in [the API design note](./notes/api-design.md). The verified `minimatch` 9.0.3 behaviors behind the literal design (including the finding that `minimatch.escape` does not escape braces) are in [minimatch escape behavior](./notes/minimatch-escape-behavior.md).

### Success criteria

- `find({ root, paths: [a, b] })` returns the union of the matches for `a` and `b`, deduplicated, for literal-looking paths, globs, and mixes of the two. Single-entry calls return exactly what they return today, and every existing test passes unchanged.
- `{ path, literal: true }` entries select exactly the named file or directory, even when the name contains glob metacharacters. A nonexistent literal matches nothing and does not throw.
- `isIncluded` uses the same `src/lib/path-match.mjs` helpers as `find()`, accesses no filesystem, and agrees with `find()` on every entry of a fixture tree for every tested criteria set.
- The README documents union semantics, literal entries, ordering under `sort: 'none'`, `escapeGlob`, `isIncluded`, and `minimatchOptions`. `CHANGELOG.md` exists and marks the union change as BREAKING with a recommended 3.0.0 version.
- `npm test` and `npm run lint` (both `make`-driven) pass at the end of the phase.

### Hard constraints

- No new dependencies. Reuse the existing `minimatch` (^9.0.3) import.
- Do not change existing option names or defaults (`sort` stays `'breadth'`, and `paths: []` still means no filtering).
- Do not duplicate or fork matching logic. Every per-file `paths`/`excludePaths` decision goes through `src/lib/path-match.mjs`.
- TDD ordering: the union tests are committed, failing, before the implementation that makes them pass.

## Current status

Planning is complete. Phase 01 starts with task 001 (failing union tests). There are no pre-conditions beyond a task worktree with dependencies installed: the plan worktree has no `node_modules`, so each task worktree needs `npm ci` or a symlink to `/Users/zane/playground/liquid-labs/find-plus/node_modules`. The project has no `docs/` spec or architecture document and no `AGENTS.md`. The README is the only project doc.

## Overview

### Phase 01: Paths union, literal entries, and isIncluded

All five tasks touch the same small set of files (`src/find-plus.mjs`, `src/lib/add-implied-tests.mjs`, the new `src/lib/path-match.mjs`, `src/test/find-plus.test.mjs`, and `README.md`), so they run **strictly in sequence**. None are parallel-eligible.

1. **001: Write failing tests for multi-entry paths union** (`haiku-med`). Adds `test.each` cases to `src/test/find-plus.test.mjs`: two plain file paths, two globs that each match one file, a glob plus a plain path, one entry matching nothing, mixed absolute and relative, `excludePaths` with several `paths`, and `sort: 'none'` entry ordering. The new cases are expected to fail against the current intersection behavior. Nothing in `src/` outside the test file changes.
2. **002: Shared path-match helper and paths union** (`sonnet-med`). Depends on 001. Creates `src/lib/path-match.mjs` (`rootGlob`, `firstMatchIndex`, `matchesPathCriteria`) and replaces `addImpliedTests`'s per-entry tests with one union-aware test. Adds the `sort: 'none'` first-matching-entry ordering in `find()`. All of 001's tests pass.
3. **003: Literal path entries and escapeGlob** (`sonnet-med`). Depends on 002. Adds `escapeGlob` (`minimatch.escape` plus brace escaping) and `normalizePaths`, validates `paths` entries in `verifyParams`, normalizes once in `find()` before `addImpliedTests` and `traverseDirs`, and exports `escapeGlob`. The tests build bracket/brace-named fixtures in a temp dir.
4. **004: Add isIncluded literal-subject matcher** (`sonnet-med`). Depends on 003. Adds `src/lib/is-included.mjs` on top of `normalizePaths` and `matchesPathCriteria` and exports `isIncluded`. The tests cover excluded and included subjects, metacharacter subjects versus glob criteria, dotfiles, extglob negation, absolute and relative subjects with `root`, nonexistent paths, and a `find()` agreement test over a temp fixture tree.
5. **005: Update README and create CHANGELOG** (`sonnet-med`). Depends on 002 to 004. Documents the final API and creates `CHANGELOG.md` with a BREAKING entry and the 3.0.0 recommendation. Runs the full `npm test` and `npm run lint`.

### Phase 02: Documentation updates

The architectural-implications check flagged a public API change, so a `doc-updates` phase with one `update-architecture-docs` task follows. The project has no `docs/architecture.md` or spec, so this task is expected to confirm that nothing needs updating beyond the README and CHANGELOG work in task 005.
