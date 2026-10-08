# Is Included Function

## Purpose and scope

Add a public, synchronous, filesystem-free way to ask whether one specific **literal** path would pass a `find()`-style `paths`/`excludePaths` criteria set. This is the `find path -not -path …` use case. The function is `isIncluded(path, options) => boolean`. It must reuse the exact matching engine, options, and anchoring `find()` uses (`normalizePaths` and `matchesPathCriteria` from `src/lib/path-match.mjs`), with no duplicated or forked matching logic.

Files: create `src/lib/is-included.mjs` and `src/test/is-included.test.mjs`, and modify `src/find-plus.mjs` (export).

## Requirements

1. **`src/lib/is-included.mjs`** exports `isIncluded(path, options = {})`, following the contract in [the API design note](../notes/api-design.md#isincludedpath-options--boolean):
   - Call `verifyParams(options)` so a missing or empty `root` and malformed `paths` entries throw the **same** errors as `find()`.
   - Throw `` new Error("The 'path' to test must be a non-empty string.") `` for a non-string or empty `path`.
   - `absRoot = fsPath.resolve(options.root)`. `isDir = path.endsWith('/') || path.endsWith(fsPath.sep)`. `fullPath = fsPath.resolve(absRoot, path) + (isDir ? fsPath.sep : '')`, which matches `dirEntToFilePath`'s shape. The subject is only ever the first (string) argument to `minimatch`, never a pattern.
   - `return matchesPathCriteria(fullPath, { absRoot, paths : normalizePaths(options.paths, options.minimatchOptions), excludePaths : options.excludePaths, minimatchOptions : options.minimatchOptions })`.
   - Import nothing from `node:fs` or `node:fs/promises`, and do not call `checkRoot`.
   - Ignore all other `find()` options (file-type selectors, `depth`, `leavesOnly`, `excludeRoot`, `tests`, `sort`), and do not check that the subject lies under `root`. Add a short JSDoc block stating both points, since task 005 documents them.
2. **Export** from `src/find-plus.mjs`: `export { escapeGlob, find, isIncluded }`.
3. **Tests** in `src/test/is-included.test.mjs`, in the existing style (`/* global … */` header, `test.each` tables). Required coverage:
   - **Excluded and not excluded**: `{ root : '/proj', excludePaths : ['*/.git/*'] }` gives `false` for `'repo/.git/config'` and `true` for `'repo/src/a.js'`. `excludePaths : ['**/node_modules/**']` gives `false` for `'a/node_modules/x/index.js'`.
   - **Subject metacharacters are literal while criteria metacharacters are glob**: with `paths : ['a[1].js']`, `isIncluded('a1.js', …)` is `true` and `isIncluded('a[1].js', …)` is `false`. With `paths : [{ path : 'a[1].js', literal : true }]`, `'a[1].js'` is `true` and `'a1.js'` is `false`. `excludePaths : ['*.js']` gives `false` for `'a[1].js'`. A subject like `'b{c,d}.js'` with `paths : ['b{c,d}.js']` is `false` (brace-expanded criteria) while `'bc.js'` is `true`.
   - **Dotfiles**: `paths : ['*']` with `'.env'` is `false` by default and `true` with `minimatchOptions : { dot : true }`. `excludePaths : ['**/.*']` gives `false` for `'.env'` and `true` for `'env'`.
   - **Negation**: extglob `paths : ['!(*.js)']` gives `true` for `'a.txt'` and `false` for `'a.js'`. A leading `!` is **not** whole-pattern negation in `find()`, because relative patterns are anchored under root, so `paths : ['!a.js']` gives `true` only for a subject literally named `'!a.js'` and `false` for `'b.js'`. Add a comment citing the [minimatch escape behavior](../notes/minimatch-escape-behavior.md) note.
   - **Absolute and relative with `root`**: with `root : '/proj'` and `paths : ['src/*.js']`, both `'src/a.js'` and `'/proj/src/a.js'` are `true`. Absolute criteria `paths : ['/proj/src/*.js']` with relative subject `'src/a.js'` is `true`. A relative `root` (`'.'` or `'some/rel'`) resolves against `process.cwd()`, so assert with paths built by `fsPath.resolve`. `'../outside.js'` with `paths : ['*.js']` is `false`.
   - **Directories**: `'dirA/'` with `paths : ['dirA/']` is `true`, and `'dirA'` (treated as a file) with `paths : ['dirA/']` is `false`. `'dirA/'` with `paths : ['dirA']` is `true`.
   - **No filesystem access or nonexistent paths**: `root : '/definitely/not/a/real/dir-<random>'` with nonexistent subjects returns the expected booleans without throwing. Also assert `src/lib/is-included.mjs` source contains no `fs` import (read the file in the test, or rely on the Validation grep).
   - **No criteria**: `isIncluded('anything', { root : '/r' })` is `true`, and `paths : []` is `true`.
   - **Errors**: a missing `root` throws `/The 'root' must be explicitly set,/`, and a non-string `path` throws.
   - **Agreement with `find()`**: in `beforeAll`, build a temp fixture tree with `fs.mkdtemp`, removed in `afterAll`. Include nested dirs, `a[1].js`, `a1.js`, `b{c,d}.js`, `bc.js`, `.env`, `.git/config`, `src/x.js`, `src/.hidden/y.js`, and `d[x]{y}/f.txt`. Get the full entry list with `await find({ root : tmpDir })` (no criteria). For each criteria set below, compute `got = new Set(await find({ root : tmpDir, ...criteria }))` and assert, **for every entry `f` of the full list**, `isIncluded(f, { root : tmpDir, ...criteria }) === got.has(f)`. Also check the relative form `f.slice(tmpDir.length + 1)` for entries other than the root itself (keep the trailing `/` on directories). Criteria sets: `{ paths : ['**/*.js'] }`, `{ paths : ['a[1].js'] }`, `{ paths : [{ path : 'a[1].js', literal : true }] }`, `{ paths : [{ path : 'd[x]{y}', literal : true }, 'src/*.js'] }`, `{ excludePaths : ['*/.git/*', '.git/'] }`, `{ excludePaths : ['src/**'] }`, `{ paths : ['**'], minimatchOptions : { dot : true } }`, `{ paths : ['!(*.js)'] }`, `` { paths : [`${tmpDir}/src/*.js`, 'b{c,d}.js'], excludePaths : ['**/bc.js'] } ``, and `{ paths : ['src/', 'src/*'], excludePaths : ['**/.hidden/**'] }`.
   - If an agreement case fails because `find()`'s directory **pruning** in `src/lib/traverse-dirs.mjs` skips something its per-file criteria would accept, do **not** change `isIncluded` to imitate pruning. Halt and report the case. A pruning bug is a `find()` defect to fix in `traverse-dirs.mjs` or file as a finding, as the manager decides.

## Validation

- `npm test` and `npm run lint` pass.
- `grep -nE "from 'node:fs|from 'fs" src/lib/is-included.mjs` finds nothing.
- `grep -n "minimatch" src/lib/is-included.mjs` finds nothing (matching goes only through `path-match.mjs`).
- `grep -n "isIncluded" src/find-plus.mjs` shows it exported.
- `git diff --stat` (excluding `plan/`) lists only `src/lib/is-included.mjs`, `src/test/is-included.test.mjs`, and `src/find-plus.mjs`.

## Assumptions

- Tasks 002 and 003 have landed: `src/lib/path-match.mjs` exports `normalizePaths` and `matchesPathCriteria`, `escapeGlob` is exported, and `npm test` is green at task start.
- The package ships no type declarations, so no `.d.ts` is added.
- The single-subject boolean is the whole API. Batch use is `paths.filter((p) => isIncluded(p, options))`. Do not add an iterator variant.

## References

- [API design note](../notes/api-design.md): binding `isIncluded` contract and its documented scope limits.
- [minimatch escape behavior](../notes/minimatch-escape-behavior.md): dotfile, negation, and trailing-`/` behaviors the tests encode.
- `src/lib/dir-ent-to-file-path.mjs`: the `fullPath` shape `isIncluded` must reproduce.

## Checkpoint hints

- After `src/lib/is-included.mjs` and its export.
- After the table-driven unit tests.
- After the `find()` agreement test.

## Status

- Outcome: blocked (2026-10-08). `src/lib/is-included.mjs`, the `isIncluded` export, and `src/test/is-included.test.mjs` are written; lint passes and all tests pass except the `find()` agreement case for `{ excludePaths : ['src/**'] }`.
- Cause: `traverse-dirs.mjs` prunes `src/` (exclude `p.endsWith('/**')` matched via `minimatch` without `dot`), so `find()` never walks `src/.hidden/` or `src/.hidden/y.js`. The per-file criteria accept them (`src/**` does not match dot segments without `dot : true`), so `isIncluded` returns `true` while `find()` omits them. Per the task, `isIncluded` was not changed to imitate pruning; the manager decides whether to fix `traverse-dirs.mjs` or file a finding.
- All other criteria sets agree. Pre-existing failure on `must specify extant root` is unrelated.
