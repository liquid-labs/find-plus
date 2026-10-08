# Accept Literal Entries In excludePaths

## Purpose and scope

Resolves followup JC6t. `paths` accepts `{ path, literal: true }` entries (normalized by `normalizePaths`), but `excludePaths` accepts strings only, forcing callers to use `escapeGlob`. Make `excludePaths` accept the same entry forms. Files: `src/find-plus.mjs`, `src/lib/path-match.mjs`, `src/lib/verify-params.mjs`, tests. Runs after task 003 (same module).

## Requirements

- In `find()`, compute `excludePaths = normalizePaths(params.excludePaths, params.minimatchOptions)` alongside `paths`, and pass the normalized value to `addImpliedTests` and `traverseDirs` (both receive it via the same spread/override pattern used for `paths`). `traverseDirs` pruning checks `p.endsWith('/**')` on strings, so it must only ever see normalized strings. Do not mutate `params.excludePaths`.
- Read `src/lib/verify-params.mjs` and extend its `paths` entry validation to `excludePaths` so malformed entries throw with the same style of message; keep existing messages for existing cases.
- Check `src/lib/is-included.mjs`: if it normalizes `paths`, normalize `excludePaths` the same way so `isIncluded` and `find()` agree.
- A literal `excludePaths` entry excludes exactly that path (not descendants), mirroring the `paths` literal semantics; a literal entry never triggers `/**` pruning.
- Add tests in `src/test/find-plus.test.mjs` (and `src/test/is-included.test.mjs` if applicable) with a temp directory containing a metacharacter-named file such as `a[1].js`: `excludePaths: [{ path: 'a[1].js', literal: true }]` excludes it and only it; mixed string/literal entries work; malformed entries throw.

## Validation

- All pre-existing tests pass unchanged; `make lint` passes.
- New tests fail before and pass after; string-only `excludePaths` behavior is unchanged.
