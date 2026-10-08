# Escape Root In Anchored Relative Patterns

## Purpose and scope

Resolves followup zqI2. `rootGlob` in `src/lib/path-match.mjs` builds `` `${absRoot}/${glob}` `` with the root unescaped, so a root whose absolute path contains glob metacharacters (`[ ] * ? { } ( )`) never matches its own children with relative patterns. Observable behavior change for such roots only. Runs after task 002 (same file).

## Requirements

- Change `rootGlob(glob, absRoot)` to accept the minimatch options (or a `windowsPathsNoEscape` flag) and build `` `${escapeGlob(absRoot, { windowsPathsNoEscape })}/${glob}` `` for relative globs. `escapeGlob` is defined later in the same module; this is fine as the function is called at runtime, but keep module ordering lint-clean.
- Update `firstMatchIndex` and every other `rootGlob` caller (grep `rootGlob` across `src/`, including `is-included.mjs`) to pass the options.
- Verify, rather than assume, that `traverse-dirs.mjs` pruning needs no change: relative-pattern pruning matches root-relative paths and absolute-pattern pruning splits the user-supplied pattern, so neither interpolates `absRoot` into a glob. If verification shows a case that does, fix it minimally and note it in the report.
- Add tests in `src/lib/test/path-match.test.mjs`: relative glob with root `/tmp/a[1]`-style names matches children; absolute glob unchanged. Add a `find()` integration test in `src/test/find-plus.test.mjs` using a temp directory whose name contains `[1]` (the existing literal-path tests at about line 339 show the temp-dir pattern), covering `paths` and `excludePaths` with relative patterns.

## Validation

- All pre-existing tests pass unchanged; `make lint` passes.
- New tests fail before and pass after the change; a root without metacharacters behaves exactly as before.

## Status

Outcome: succeeded (2026-10-08). `rootGlob` now escapes the root via `escapeGlob` (options passed from `firstMatchIndex`; `is-included.mjs` reaches it only through `matchesPathCriteria`, so no change needed there). Verification of pruning found one interpolation: `minPrefix = absRoot + sep` in `src/lib/traverse-dirs.mjs` for absolute patterns; it now uses `escapeGlob(absRoot, minimatchOptions)`. Tests added in `src/lib/test/path-match.test.mjs` and `src/test/find-plus.test.mjs` (fail before, pass after). `make test`: only the 4 known pre-existing failures. `make lint`: single pre-existing error in `src/lib/test/traverse-dirs.test.mjs` (`expect` not defined), identical on baseline.
