# Plan Summary: followups-burndown-fixes

## What was planned and why

Burn down the six open followups recorded in the project's `plan/followups.yaml` (all originating from the earlier `find-paths-union-literal` plan): a sorter bug, directory pruning that ignores `minimatchOptions`, unescaped root interpolation, a `windowsPathsNoEscape` brace limitation, README typos, and `excludePaths` literal entries.

In scope: the changes below. Out of scope: version bumps, new dependencies (including a minimatch upgrade), type declarations, and any behavior change not listed. Hard constraints: all existing tests must pass unchanged (new tests are additive), and each change stays minimal.

Single phase `followups-burndown`. Tasks run in the listed order because 002, 003, and 004 all edit `src/lib/path-match.mjs` and 005 documents their results; 001 touches only `src/lib/sorters.mjs` and may run in parallel with the rest.

| Task | Followup | Summary |
|------|----------|---------|
| 001 fix-breadth-sorter | JFJX | Fix `paretPath` typo and inverted ternary in `breadthFirstSorter`. |
| 002 prune-with-minimatch-options | cTaj | Pass `minimatchOptions` to the pruning `minimatch` calls; add nocase/dot tests. |
| 003 escape-root-in-rootglob | zqI2 | Escape `absRoot` with `escapeGlob` in `rootGlob`; add tests. |
| 004 literal-exclude-paths | JC6t | Normalize `excludePaths` entries like `paths` entries. |
| 005 readme-fixes | fHeL, 5wTv | README typo/anchor fixes; document the brace limitation and `excludePaths` entry forms. |

Findings: 5wTv is resolved by documenting the limitation (no code change), see [decisions](./notes/decisions.md).

## What shipped

### Phase 01 — Followups Burndown Fixes

1. **Fix Breadth Sorter Typo And Inverted Ternary** (`001-fix-breadth-sorter.md`, tier `sonnet-low`) — Fixed the paretPath typo and inverted ternary in breadthFirstSorter; added unit tests for depth, parent and name ordering. 4 pre-existing failures in test/find-plus.test.js are unchanged.
   Commit `8e70b48`, merged at `6c9c3c6263726358eb0ee28b9e33df4457f32431`.

2. **Pass minimatchOptions To Directory Pruning** (`002-prune-with-minimatch-options.md`, tier `sonnet-med`) — Passed minimatchOptions through directory pruning (paths and excludePaths) so nocase/dot no longer drop results. Added unit and end-to-end tests that fail before and pass after.
   Commit `2e54435`, merged at `c7e282863fa9074f71b9482338e9afb2cfd063fe`.

3. **Escape Root In Anchored Relative Patterns** (`003-escape-root-in-rootglob.md`, tier `sonnet-med`) — rootGlob now escapes the root with escapeGlob when anchoring relative globs, so roots with glob metacharacters match their children; also escaped the absRoot interpolation in traverse-dirs absolute-pattern pruning. Tests added.
   Commit `b42a321`, merged at `c36f9600f4daaa41857bbc835bb320eb16fcd422`.

4. **Accept Literal Entries In excludePaths** (`004-literal-exclude-paths.md`, tier `sonnet-med`) — Added literal entry support to excludePaths matching paths; validation, find() and isIncluded share the same normalization. Also fixed the make lint expect-global error in traverse-dirs.test.mjs.
   Commit `67eac65`, merged at `9b08c5171cd5625f22242d43d95d70cfbe15c1e9`.

5. **README Typos Anchors And Limitation Notes** (`005-readme-fixes.md`, tier `sonnet-low`) — README-only fixes: typos, anchors, Usage paren, excludePaths type and literal wording, brace limitation note, root-glob note.
   Commit `6e97c06`, merged at `7cb1541afac3f4c60a16a59f7dd06bb7d032e843`.

### Phase 02 — Remediation Round 1

1. **Complete README Brace Limitation Sentence** (`001-complete-readme-brace-sentence.md`, tier `sonnet-low`) — Completed the truncated README line 86 sentence; no other README changes.
   Commit `9d5b3ef`, merged at `94e9ec44ce845c253ac7067016fff2f444b9c82e`.

2. **Pass minimatchOptions to isIncluded Ancestor Pruning** (`002-pass-minimatch-options-in-is-included-prune.md`, tier `sonnet-med`) — One-line fix passing minimatchOptions to the ancestor isPrunedByExcludePaths call in isIncluded, with two nocase regression tests that fail without it.
   Commit `bce39e1`, merged at `8739f85e183fc533c5d4750a110380ecbd0d9c86`.

## Key decisions

_No `## Why this shape` section is recorded in `plan/overview.md`, so this plan's cross-task rationale was never written down. Per-task outcomes are under "What shipped" above._

## Findings

- **`diAW`** — **Record breadth sort change in CHANGELOG** — dismissed — 2026-10-08 — reason: Not actionable within this plan: the breadth sort change ships in a new major release (user-confirmed) and CHANGELOG/release notes are written at release time, outside this plan.

- **`qYVo`** — **Hoist escapeGlob(absRoot) out of hot loop** — promoted — ref: `qYVo` — 2026-10-08

- **`fobB`** — **README brace sentence truncated** — dismissed — ref: `94e9ec44ce845c253ac7067016fff2f444b9c82e` — 2026-10-08 — reason: Fixed in remediation task phase-02-remediation-01/001 (merge 94e9ec4); manager reviewed the diff: sentence now complete.

- **`uhXy`** — **isIncluded prune omits minimatchOptions** — dismissed — ref: `8739f85e183fc533c5d4750a110380ecbd0d9c86` — 2026-10-08 — reason: Fixed in remediation task phase-02-remediation-01/002 (merge 8739f85); minimatchOptions now passed in isIncluded ancestor pruning, with regression tests.

## Remediation

- Rounds used: 1 (resolved max_rounds: 3).
- Remediation tasks added: 2 (resolved max_added_tasks: 10).
- Remediation phases:
  - `remediation-01` — 2 task(s)
- Security review required: no.

## Final Task State

# TODO

## Purpose and scope

Tracking document for the active plan.

## Tasks

### Phase 01 — Followups Burndown Fixes

- [x] [001-fix-breadth-sorter.md](./phase-01-followups-burndown/001-fix-breadth-sorter.md) — tier `sonnet-low` · branch `plan/followups-burndown-fixes-01-001` · commit `8e70b48` · merge `6c9c3c6263726358eb0ee28b9e33df4457f32431`
- [x] [002-prune-with-minimatch-options.md](./phase-01-followups-burndown/002-prune-with-minimatch-options.md) — tier `sonnet-med` · branch `plan/followups-burndown-fixes-01-002` · commit `2e54435` · merge `c7e282863fa9074f71b9482338e9afb2cfd063fe`
- [x] [003-escape-root-in-rootglob.md](./phase-01-followups-burndown/003-escape-root-in-rootglob.md) — tier `sonnet-med` · branch `plan/followups-burndown-fixes-01-003` · commit `b42a321` · merge `c36f9600f4daaa41857bbc835bb320eb16fcd422`
- [x] [004-literal-exclude-paths.md](./phase-01-followups-burndown/004-literal-exclude-paths.md) — tier `sonnet-med` · branch `plan/followups-burndown-fixes-01-004` · commit `67eac65` · merge `9b08c5171cd5625f22242d43d95d70cfbe15c1e9`
- [x] [005-readme-fixes.md](./phase-01-followups-burndown/005-readme-fixes.md) — tier `sonnet-low` · branch `plan/followups-burndown-fixes-01-005` · commit `6e97c06` · merge `7cb1541afac3f4c60a16a59f7dd06bb7d032e843`

### Phase 02 — Remediation Round 1

- [x] [001-complete-readme-brace-sentence.md](./phase-02-remediation-01/001-complete-readme-brace-sentence.md) — tier `sonnet-low` · branch `plan/followups-burndown-fixes-02-001` · commit `9d5b3ef` · merge `94e9ec44ce845c253ac7067016fff2f444b9c82e`
- [x] [002-pass-minimatch-options-in-is-included-prune.md](./phase-02-remediation-01/002-pass-minimatch-options-in-is-included-prune.md) — tier `sonnet-med` · branch `plan/followups-burndown-fixes-02-002` · commit `bce39e1` · merge `8739f85e183fc533c5d4750a110380ecbd0d9c86`
