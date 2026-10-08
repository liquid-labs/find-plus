# Decisions

## Purpose and scope

Records the judgment calls made while planning; both confirmed by the user.

## JFJX: fix the breadth sorter now

The user confirmed: fix it in this plan (task 001) and ship the resulting observable reorder in a new major release. The correct ordering (depth, then parent path, then name) is deterministic. If any existing test encodes the old order, the task halts and reports rather than editing the test.

## 5wTv: document as unsupported

Options were `nobrace` (would apply to the caller's glob entries too, changing their semantics), a minimatch upgrade (new dependency version, engines check, outside "minimal"), or documenting. Decision: document in the README that literal `paths` entries containing `{` `}` with a comma or range are unsupported under `windowsPathsNoEscape`. The code comment in `escapeGlob` already says this. Impact is low because find-plus builds all patterns with `/`.

## zqI2 and pruning

Reading `traverse-dirs.mjs`: relative-pattern pruning compares root-relative paths and absolute-pattern pruning splits user-supplied patterns, so neither interpolates `absRoot` into a glob. The fix is expected to be confined to `rootGlob`; task 003 verifies this rather than assuming it.

## Architecture docs

The `docs/` directory does not exist, so no architecture or spec files exist for a `doc-updates` phase. The `excludePaths` API extension is documented in the README by task 005; no separate `doc-updates` phase is registered.

## Test environment

The user directed: run `bun i` to install `node_modules` in plan and task worktrees as needed for testing.
