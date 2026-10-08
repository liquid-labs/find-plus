# Decisions

## Purpose and scope

Records the two judgment calls made while planning, so the manager can confirm or override them.

## JFJX: fix the breadth sorter now

The followup suggests deferring to a major. Decision: fix it in this plan, in its own isolated task (001) so it can be dropped without affecting the rest. The current behavior is an unambiguous bug (`paretPath` is always `undefined`, so the comparison is meaningless and the ternary is inverted), and the correct ordering (depth, then parent path, then name) is deterministic. The reorder is observable only for same-depth entries in different directories. The task must confirm existing tests pass unchanged; if any existing expectation encodes the old order, the task halts and reports rather than editing the test.

## 5wTv: document as unsupported

Options were `nobrace` (would apply to the caller's glob entries too, changing their semantics), a minimatch upgrade (new dependency version, engines check, outside "minimal"), or documenting. Decision: document in the README that literal `paths` entries containing `{` `}` with a comma or range are unsupported under `windowsPathsNoEscape`. The code comment in `escapeGlob` already says this. Impact is low because find-plus builds all patterns with `/`.

## zqI2 and pruning

Reading `traverse-dirs.mjs`: relative-pattern pruning compares root-relative paths and absolute-pattern pruning splits user-supplied patterns, so neither interpolates `absRoot` into a glob. The fix is expected to be confined to `rootGlob`; task 003 verifies this rather than assuming it.

## Architecture docs

The `docs/` directory does not exist, so no architecture or spec files exist for a `doc-updates` phase. The `excludePaths` API extension is documented in the README by task 005; no separate `doc-updates` phase is registered.
