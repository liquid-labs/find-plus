# Followups Burndown Fixes

## Purpose and scope

Burn down the six open followups recorded in the project's `plan/followups.yaml` (all originating from the earlier `find-paths-union-literal` plan): a sorter bug, directory pruning that ignores `minimatchOptions`, unescaped root interpolation, a `windowsPathsNoEscape` brace limitation, README typos, and `excludePaths` literal entries.

In scope: the changes below. Out of scope: version bumps, new dependencies (including a minimatch upgrade), type declarations, and any behavior change not listed. Hard constraints: all existing tests must pass unchanged (new tests are additive), and each change stays minimal.

## Current status

Planned; no tasks started. Single phase, five tasks. See [decisions](./notes/decisions.md) for the two judgment calls.

## Overview

Single phase `followups-burndown`. Tasks run in the listed order because 002, 003, and 004 all edit `src/lib/path-match.mjs` and 005 documents their results; 001 touches only `src/lib/sorters.mjs` and may run in parallel with the rest.

| Task | Followup | Summary |
|------|----------|---------|
| 001 fix-breadth-sorter | JFJX | Fix `paretPath` typo and inverted ternary in `breadthFirstSorter`. |
| 002 prune-with-minimatch-options | cTaj | Pass `minimatchOptions` to the pruning `minimatch` calls; add nocase/dot tests. |
| 003 escape-root-in-rootglob | zqI2 | Escape `absRoot` with `escapeGlob` in `rootGlob`; add tests. |
| 004 literal-exclude-paths | JC6t | Normalize `excludePaths` entries like `paths` entries. |
| 005 readme-fixes | fHeL, 5wTv | README typo/anchor fixes; document the brace limitation and `excludePaths` entry forms. |

Findings: 5wTv is resolved by documenting the limitation (no code change), see [decisions](./notes/decisions.md).
