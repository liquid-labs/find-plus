# API Design

## Purpose and scope

The single source of truth for the public API and internal module shape this plan produces. Every task document refers here instead of restating the contract. Where a task needs to deviate, it must halt and report rather than diverge silently.

## Current behavior (verified in source)

- `src/lib/add-implied-tests.mjs` `unshift`s one test per `paths` entry into `myTests`. `traverseDirs` requires every test to pass, so several `paths` entries act as an **intersection** (AND). Two entries naming two different files return `[]`.
- Each `excludePaths` entry is its own negative test, which is correct "exclude if any matches" behavior.
- Anchoring: a pattern that starts with `/` is absolute; anything else becomes `` `${fsPath.resolve(root)}/${glob}` ``. Root is interpolated **unescaped**. That is a pre-existing behavior, preserved here and recorded as a finding.
- The matched string comes from `makeFullPath(dirEnt)` = `fsPath.resolve(parentPath, name)`, plus `fsPath.sep` for directories. `src/lib/dir-ent-to-file-path.mjs` `dirEntToFilePath` computes the identical value.
- `minimatchOptions` is passed to the per-file tests but not to `traverse-dirs.mjs` pruning (recorded as a finding; out of scope).
- `paths: []` adds no test and disables path pruning, so everything matches. That stays the same.
- The package ships no type declarations (`package.json` `files` lists only `dist`, `LICENSE.txt`, `README.md`). No types are added.

## Public API after this plan

Exported from `src/find-plus.mjs` (and re-exported unchanged by `src/index.mjs`'s `export * from './find-plus'`):

```javascript
export { escapeGlob, find, isIncluded }
```

### `find(options)` changes

- **`paths`**: `(string | { path: string, literal?: boolean })[]`. Option name and default are unchanged.
  - A string entry is a glob, exactly as today.
  - An object entry with `literal: true` names that exact file or directory. Its `path` is converted with `escapeGlob(path, minimatchOptions)` and then handled like any other glob, with the same anchoring, pruning, and trailing-`/` directory semantics. An object entry with `literal` absent or `false` is a glob.
  - A literal entry names exactly that path, not its descendants (consistent with glob entries; `escapeGlob(dir) + '/**'` selects contents).
  - Literal entries are not normalized beyond what globs get (`./x` does not match, same as the glob `./x`).
  - Union semantics: a file is included when it matches **any** `paths` entry and no `excludePaths` entry. Each matching file appears once because there is one traversal. An entry that matches nothing does not affect the others, and the result is empty only when every entry matches nothing.
  - A literal entry that does not exist matches nothing. It is not an error.
  - Invalid entries (not a string, not a plain object with a non-empty string `path`, or `literal` present but not boolean) throw from `verifyParams` with a message beginning `Invalid 'paths' entry`.
- **Ordering**: with `sort: 'none'` and more than one `paths` entry, results are stable-sorted by the index of the **first** `paths` entry each file matches. Results therefore follow entry order first and walk order within an entry. With any other `sort` (default `'breadth'`), the sorter alone decides the order. The `sort` default is not changed.
- `excludePaths` is unchanged: strings only, globs, each an independent exclusion. Literal object entries are **not** accepted in `excludePaths` (callers can use `escapeGlob`).
- The `options` object passed to custom `tests` carries the **normalized** `paths` (glob strings). Nothing changes for string-only callers.

### `escapeGlob(str, options?) => string`

- Returns a glob that matches exactly `str` under `find()`'s matcher: `minimatch.escape(str, { windowsPathsNoEscape })` followed by escaping `{` and `}` with a backslash (`[{]`/`[}]` in `windowsPathsNoEscape` mode, which has a documented limitation). The reason is in [minimatch escape behavior](./minimatch-escape-behavior.md).
- `options` is a `minimatchOptions`-style object; only `windowsPathsNoEscape` is read.

### `isIncluded(path, options) => boolean`

- Synchronous. Imports nothing from `node:fs`, so it works for paths that do not exist.
- `path`: a **literal** subject path, never a pattern (`a[1].js` is that file). Absolute or relative; a relative subject resolves against `root` with `fsPath.resolve(absRoot, path)`. A trailing `/` marks the subject as a directory, and the result gets `fsPath.sep` appended to match `dirEntToFilePath`. Callers expand any globs themselves. A non-string or empty `path` throws.
- `options`: a `find()`-style options object. It reads `root` (required, validated by the same `verifyParams` as `find()`, so the error is identical), `paths` (same entry forms as `find()`), `excludePaths`, and `minimatchOptions`. All other `find()` options (file-type selectors, `depth`, `leavesOnly`, `excludeRoot`, `tests`, `sort`) are ignored, and the README says so. Passing the same options object to `find()` and `isIncluded()` is the intended use.
- Returns `true` when the subject passes the path criteria: there are no `paths` (or `paths` is empty) or some entry matches, **and** no `excludePaths` entry matches. With neither option set, it returns `true`.
- `root` only anchors relative patterns and relative subjects. `isIncluded` does **not** check that the subject lies under `root` (a subject outside `root` can return `true` when an absolute pattern matches it, even though `find()` could never return it). The README states this.

## Internal module: `src/lib/path-match.mjs`

The single home of path-criteria matching. `addImpliedTests`, the `sort: 'none'` ordering in `find()`, and `isIncluded` all call it. No other module may call `minimatch` for per-file `paths`/`excludePaths` decisions. The pre-existing pruning heuristics in `traverse-dirs.mjs` stay where they are: they decide what to traverse, not what matches.

Exports (names are binding; extra private helpers are fine):

- `rootGlob(glob, absRoot)`: returns `glob` when it starts with `/`, otherwise `` `${absRoot}/${glob}` ``. This is the existing anchoring, moved here.
- `firstMatchIndex(fullPath, globs, { absRoot, minimatchOptions })`: the index of the first glob in `globs` that `minimatch(fullPath, rootGlob(glob, absRoot), minimatchOptions)` matches, or `-1`.
- `matchesPathCriteria(fullPath, { absRoot, paths, excludePaths, minimatchOptions })`: `(paths === undefined || paths.length === 0 || firstMatchIndex(...) !== -1) && (excludePaths === undefined || firstMatchIndex(fullPath, excludePaths, ...) === -1)`. Both `paths` and `excludePaths` must already be glob strings.
- `escapeGlob(str, { windowsPathsNoEscape } = {})`: added in the literal-entries task.
- `normalizePaths(paths, minimatchOptions)`: added in the literal-entries task. Maps `undefined` to `undefined` and each entry to a glob string. Never mutates its input.

`fullPath` is always a `dirEntToFilePath`-shaped string: absolute, with a trailing `fsPath.sep` for directories. `add-implied-tests.mjs`'s private `makeFullPath` duplicates `dirEntToFilePath` and should be replaced with it.

## Breaking changes and version

- **BREAKING**: several `paths` entries are now a union (OR) instead of an intersection (AND). Single-entry calls behave exactly as before.
- **BREAKING (minor surface)**: malformed `paths` entries now throw a descriptive `Invalid 'paths' entry` error instead of failing incidentally (for example a `TypeError` from `startsWith`).
- Not breaking: the `sort: 'none'` entry-order rule is new, but only applies to multi-entry calls, whose results were previously an intersection.
- Recommended version: **3.0.0** (major) from 2.0.0. `package.json` is not bumped by this plan; the release happens separately.
