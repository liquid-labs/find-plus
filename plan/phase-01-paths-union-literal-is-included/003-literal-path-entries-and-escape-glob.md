# Literal Path Entries And Escape Glob

## Purpose and scope

Add an explicit opt-in so a `paths` entry can name an exact file or directory whose name contains glob metacharacters (`[ ] * ? { } ( ) !`). The form is an object entry, `{ path, literal: true }`. String entries remain globs, and the two forms can be mixed in one call under the union rules from task 002. Also add and export `escapeGlob(str)`.

Why an object entry rather than a separate option such as `literalPaths`: one ordered list keeps a single "entry order" for union ordering under `sort: 'none'` and for mixing. A parallel array would make mixed ordering ambiguous. Record this rationale in the code comment on `normalizePaths`. Task 005 documents it in the README.

Files: `src/lib/path-match.mjs` (add `escapeGlob` and `normalizePaths`), `src/lib/verify-params.mjs` (entry validation), `src/find-plus.mjs` (normalize once and export `escapeGlob`), `src/lib/test/path-match.test.mjs`, and `src/test/find-plus.test.mjs`.

## Requirements

1. **`escapeGlob(str, { windowsPathsNoEscape } = {})`** in `src/lib/path-match.mjs`: `escape(str, { windowsPathsNoEscape })` from `minimatch`, followed by escaping `{` and `}`. In default mode use a backslash (`'\\$&'`). In `windowsPathsNoEscape` mode wrap them (`'[$&]'`), and add a comment noting the documented limitation. `minimatch.escape` alone is **not** sufficient because it leaves braces unescaped; the evidence is in [minimatch escape behavior](../notes/minimatch-escape-behavior.md). Accept a `minimatchOptions`-shaped object and read only `windowsPathsNoEscape`.
2. **`normalizePaths(paths, minimatchOptions)`** in `src/lib/path-match.mjs`: returns `undefined` for `undefined`. Otherwise it returns a **new** array where a string entry is kept as-is, `{ path, literal: true }` becomes `escapeGlob(path, minimatchOptions ?? {})`, and `{ path }` or `{ path, literal: false }` becomes `path`. It never mutates the input.
3. **Validation** in `src/lib/verify-params.mjs`: when `paths` is defined, it must be an array, and each entry must be a string, or a non-null, non-array object with a non-empty string `path` and `literal` that is `undefined` or a boolean. Otherwise throw `` new Error(`Invalid 'paths' entry at index ${i}; must be a string or { path: string, literal?: boolean }.`) `` (and a similar `'paths' must be an array` message for a non-array). Add the corresponding rows to the `argument errors` table in `src/test/find-plus.test.mjs`: `paths : [42]`, `paths : [{}]`, `paths : [{ path : 'x', literal : 'yes' }]`, and `paths : 'dirA'`.
4. **Normalize once** in `find()`, after `verifyParams(params)`: `const paths = normalizePaths(params.paths, params.minimatchOptions)`. Pass `{ ...params, paths, myTests }` to `addImpliedTests` and `{ ...params, paths, tests : myTests }` to `traverseDirs`, and use the normalized `paths` in the task-002 `sort: 'none'` ordering. Do not mutate `params.paths`. `traverseDirs` pruning and `addImpliedTests` then only ever see glob strings. The traverse-dirs unit tests that call them directly with strings keep working.
5. **Export** `escapeGlob` from `src/find-plus.mjs`: `export { escapeGlob, find }`.
6. **Tests** (`src/test/find-plus.test.mjs`, new `describe('literal paths', …)`). Build fixtures dynamically in `beforeAll` with `fs.mkdtemp(fsPath.join(os.tmpdir(), 'find-plus-'))` and remove them in `afterAll` (`fs.rm(…, { recursive : true, force : true })`). Do not commit metacharacter-named files. Fixture: files `a[1].js`, `a1.js`, `b{c,d}.js`, `bc.js`, and `x(y).js`; directory `d[x]{y}/` containing `f.txt`; and, guarded by `process.platform !== 'win32'`, files `q?.js`, `qq.js`, `s*.js`, and `st.js`. Assert exact result arrays with `sort : 'alpha'` (or a single result) to avoid the breadth-sorter tie bug. Cover:
   - `[{ path : 'a[1].js', literal : true }]` returns only `a[1].js`. The glob `['a[1].js']` returns only `a1.js`.
   - `[{ path : 'b{c,d}.js', literal : true }]` returns only `b{c,d}.js`, not `bc.js`. Similarly `x(y).js`, and on non-win32 `q?.js` (not `qq.js`) and `s*.js` (not `st.js`).
   - Literal directory: `[{ path : 'd[x]{y}', literal : true }]` and `[{ path : 'd[x]{y}/', literal : true }]` each return only the directory (its path with a trailing separator). `[{ path : 'd[x]{y}/f.txt', literal : true }]` returns the nested file, which proves `traverseDirs` pruning does not wrongly skip the escaped directory. `[escapeGlob('d[x]{y}') + '/**']` returns the directory's contents (assert exactly what `minimatch` yields, which is likely the directory itself plus `f.txt`).
   - Mixed: `[{ path : 'a[1].js', literal : true }, 'b?.js']` returns `a[1].js` and `bc.js`. With `sort : 'none'` and the entries reversed, order follows entry order.
   - Literal absolute: `` [{ path : `${tmpDir}/a[1].js`, literal : true }] `` returns `a[1].js`.
   - `{ path : 'a[1].js' }` (no `literal`) behaves as the glob and returns `a1.js`.
   - Nonexistent literal: `[{ path : 'nope[1].js', literal : true }]` returns `[]` without throwing, and `[{ path : 'nope[1].js', literal : true }, { path : 'a[1].js', literal : true }]` returns `a[1].js`.
   - `src/lib/test/path-match.test.mjs`: `escapeGlob('a[1].js') === 'a\\[1\\].js'`. For every name in the fixture list plus `'!neg.js'`, `'#c.js'`, `'+(x).js'`, and `'x{1..3}.js'`, `minimatch('/r/' + name, '/r/' + escapeGlob(name))` is `true`, and `escapeGlob('a{b,c}.js')` does not match `/r/ab.js`. Also test `normalizePaths` mapping and non-mutation.

## Validation

- `npm test` and `npm run lint` pass.
- `grep -n "escapeGlob" src/find-plus.mjs` shows it exported.
- `grep -rn "from 'minimatch'" src --include=*.mjs | grep -v /test/` lists only `src/lib/path-match.mjs` and `src/lib/traverse-dirs.mjs` (no new matcher import sites).
- `git status` shows no fixture files with metacharacter names committed under `src/test/data`.
- `git diff --stat` (excluding `plan/`) lists only the five files named in Purpose and scope.

## Assumptions

- Task 002 has landed: `src/lib/path-match.mjs` exists with `rootGlob`, `firstMatchIndex`, and `matchesPathCriteria`, and `npm test` is green at task start.
- A literal entry names exactly the path, not its descendants, the same as a glob entry naming a directory. Literal entries are not path-normalized (`./x` does not match, same as the glob `./x`). This follows the [API design note](../notes/api-design.md#findoptions-changes).
- `excludePaths` stays string-only. Do not add literal support there.

## References

- [API design note](../notes/api-design.md): binding contract for `escapeGlob`, `normalizePaths`, entry validation, and ordering.
- [minimatch escape behavior](../notes/minimatch-escape-behavior.md): why braces need extra escaping, and the `windowsPathsNoEscape` limitation.

## Checkpoint hints

- After adding `escapeGlob`, `normalizePaths`, and their unit tests.
- After adding `verifyParams` validation and the argument-error rows.
- After wiring normalization into `find()` and adding the temp-fixture literal tests.
