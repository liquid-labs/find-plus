# Failing Union Tests

## Purpose and scope

TDD first step for the union change. Add test cases to `src/test/find-plus.test.mjs` that pin down the required union semantics for several `paths` entries. Against the current code, where every `paths` entry is a separate test that must pass (an intersection), the new union cases must **fail**. This task changes no file other than `src/test/find-plus.test.mjs`. Do **not** modify anything under `src/lib/` or `src/find-plus.mjs`. The next task makes these tests pass.

## Requirements

1. In the existing `describe('path matching', …)` `test.each` table in `src/test/find-plus.test.mjs`, add the rows below, grouped under a `// multiple 'paths' entries are a union` comment. That block defaults `root` to `dirDataPath` (`src/test/data/`), and the expected-value constants (`fileA1Path`, `fileAB1Path`, `fileAAAA1Path`, `dirAAPath`, `dirABPath`) already exist at the top of the file.

   | Case | Options (`root` defaulted) | Expected | Fails today? |
   |---|---|---|---|
   | Two plain file paths | `{ paths : ['dirA/fileA-1.txt', 'dirA/dirAB/fileAB-1.txt'] }` | `[fileA1Path, fileAB1Path]` | yes |
   | Two globs, each matching one file | `{ paths : ['**/dirAB/*.txt', '**/dirAAAA/*.txt'] }` | `[fileAB1Path, fileAAAA1Path]` | yes |
   | Glob plus plain path | `{ paths : ['**/dirAAAA/*.txt', 'dirA/fileA-1.txt'] }` | `[fileA1Path, fileAAAA1Path]` | yes |
   | Absolute plus relative | `` { paths : [`${dirDataPath}dirA/fileA-1.txt`, 'dirA/dirAB/fileAB-1.txt'] } `` | `[fileA1Path, fileAB1Path]` | yes |
   | One entry matches nothing | `{ paths : ['dirA/fileA-1.txt', 'no/such/file.txt'] }` | `[fileA1Path]` | yes |
   | Two directories | `{ paths : ['dirA/dirAA/', 'dirA/dirAB/'], sort : 'alpha' }` | `[dirAAPath, dirABPath]` | yes |
   | Union with excludePaths | `{ paths : ['dirA/*.txt', 'dirA/dirAB/*.txt'], excludePaths : ['**/fileAB-1.txt'] }` | `[fileA1Path]` | yes |
   | `sort: 'none'` follows entry order | `{ paths : ['**/dirAAAA/*.txt', 'dirA/*.txt'], sort : 'none' }` | `[fileAAAA1Path, fileA1Path]` | yes |
   | All entries match nothing | `{ paths : ['no/such', 'also/nothing'] }` | `[]` | no (guard) |
   | Overlapping entries deduplicate | `{ paths : ['dirA/*.txt', '**/fileA-1.txt'] }` | `[fileA1Path]` | no (guard) |

   The expected orders rely on the default `'breadth'` sort placing shallower files first (`fileA-1.txt` is at depth 2, `fileAB-1.txt` at depth 3, and `fileAAAA-1.txt` at depth 5 below `src/test/data`). The two-directory case uses `sort : 'alpha'` because the breadth sorter has a pre-existing bug (`b.paretPath` typo) that makes ties at the same depth unreliable. Do not fix that bug here.
2. Keep the existing rows exactly as they are. They must keep passing.
3. Follow the file's existing style: spaces before `:` in object literals, single quotes, and no semicolons.

## Validation

- Install dependencies in the task worktree if `node_modules` is missing (`npm ci`, or symlink `/Users/zane/playground/liquid-labs/find-plus/node_modules`), without committing any lockfile change.
- `npm test` (runs `make test`) fails, and the report shows **exactly the eight rows marked "yes"** failing, each with a received value consistent with intersection behavior (for most, `[]`). Every pre-existing test and the two guard rows pass. Record the failing-row list in the task document's status.
- `npm run lint` passes. Run `make lint-fix` first if only formatting differs.
- `git diff --stat` (excluding `plan/`) lists only `src/test/find-plus.test.mjs`.

## Assumptions

- `npm test` exits non-zero at the end of this task. That is the intended TDD state, and the next task turns it green.
- Test fixtures under `src/test/data` are sufficient. No new fixtures are needed for this task.

## References

- [API design note](../notes/api-design.md): the union semantics these tests encode.
- `src/lib/add-implied-tests.mjs`: the per-entry `unshift` loop that causes the current intersection.
