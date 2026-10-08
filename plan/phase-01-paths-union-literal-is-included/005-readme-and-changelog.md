# Readme And Changelog

## Purpose and scope

Document the final public API produced by tasks 002 to 004 in `README.md`, create `CHANGELOG.md` with a clearly marked BREAKING entry, and run the full test and lint suite one last time. No source changes, except that a README code example may be checked by running it if useful (that check is not committed).

Files: `README.md` (modify) and `CHANGELOG.md` (create).

## Requirements

1. **README `## Usage`**: keep the existing example and add the new named exports to the import line comment or a second short example, `import { escapeGlob, find, isIncluded } from 'find-plus'`. Leave the existing missing-paren typo in the example (`tests: [isaTXTFile] }`) alone unless you are editing that exact line.
2. **README `## Options`, `paths` bullet**: rewrite it to state:
   - The type is `(string | { path: string, literal?: boolean })[]`.
   - **Union semantics**: a file is included if it matches **any** entry (and no `excludePaths` entry). A file matched by several entries appears once. An entry matching nothing does not affect the others, and the result is empty only when no entry matches anything. Multiple entries were an intersection before 3.0.0.
   - String entries are globs, absolute if they start with `/` and otherwise relative to `root` (unchanged).
   - `{ path, literal: true }` names that exact file or directory, so metacharacters such as `[ ] * ? { } ( )` are matched literally. A nonexistent literal matches nothing. A literal names the path itself, not its descendants; use ``escapeGlob(dir) + '/**'`` for contents. Literal and glob entries can be mixed.
   - An empty `paths` array means no path filtering (unchanged).
3. **README `sort` bullet**: add that with `'none'` and more than one `paths` entry, results are ordered by the first matching entry (entry order), then discovery order within an entry. Other sorts order the whole result set as before.
4. **README `minimatchOptions`**: add a bullet under "Path matching" documenting `minimatchOptions` (_object_), passed to [minimatch](https://github.com/isaacs/minimatch#readme) for `paths`/`excludePaths` matching (for example `{ dot: true }` to let `*` and `**` match dotfiles). It is used by `find()`, `isIncluded()`, and `escapeGlob()` (which reads only `windowsPathsNoEscape`). It is an existing but undocumented option, and its name and behavior are unchanged.
5. **New README section `## Literal paths and escapeGlob`**: explain why the object-entry form was chosen (one ordered list keeps entry order for union and ordering, compared with a separate option). Show an example mixing `{ path: 'a[1].js', literal: true }` with a glob. Document `escapeGlob(str[, minimatchOptions])` as returning a glob that matches exactly `str` with `find()`'s engine (it escapes braces as well as the characters `minimatch.escape` handles), and note the `windowsPathsNoEscape` brace limitation in one sentence.
6. **New README section `## Testing a single path with isIncluded`**: document `isIncluded(path, options) => boolean`:
   - Synchronous, with no filesystem access, so it works for nonexistent paths.
   - `path` is a literal path, never a pattern; expand globs yourself. A trailing `/` marks a directory. Relative paths resolve against `root`.
   - `options` takes the same object as `find()`, but only `root` (required), `paths`, `excludePaths`, and `minimatchOptions` are considered. File-type options, `depth`, `leavesOnly`, `excludeRoot`, `tests`, and `sort` are ignored, and the subject is not required to lie under `root`.
   - Its result agrees with whether `find()` would return that path, given the same criteria and a path that exists under `root`.
   - Include a short example (for example `isIncluded('repo/.git/config', { root: '/proj', excludePaths: ['*/.git/*'] }) // false`).
   - Note that whole-pattern `!` negation is not supported; use extglob `!(…)`.
7. **README table of contents**: add the two new sections.
8. **`CHANGELOG.md`** (new, [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style; title `# Changelog`). Start with a `## [3.0.0] - Unreleased` section stating "Recommended version bump: 3.0.0 (major) because of the breaking change below". Include:
   - `### BREAKING`: multiple `paths` entries are now a union (OR) instead of an intersection (AND), with a one-line migration hint (callers relying on AND should use a single combined glob or a custom `tests` function). Also: malformed `paths` values (non-array, or entries that are neither strings nor `{ path, literal? }` objects) now throw `Invalid 'paths' entry …` / `'paths' must be an array` errors.
   - `### Added`: literal `paths` entries `{ path, literal: true }`, `escapeGlob()`, `isIncluded()`, and the `sort: 'none'` entry-order rule for multiple `paths`.
   - `### Changed`: the `options` passed to custom `tests` now carry normalized glob strings in `paths` (literal entries appear escaped).
   - `### Documentation`: `minimatchOptions` is now documented.
   - A short `## [2.0.0]` placeholder line noting that earlier history is in git tags and the GitHub releases.
9. Match the README's existing formatting conventions (`__\`option\`__: (_type_) description`), and keep changes small.

## Validation

- `npm test` and `npm run lint` pass on the final tree.
- `grep -n "union" README.md` and `grep -n "isIncluded" README.md` and `grep -n "escapeGlob" README.md` and `grep -n "minimatchOptions" README.md` each return at least one hit.
- `grep -n "BREAKING" CHANGELOG.md` and `grep -n "3.0.0" CHANGELOG.md` each return a hit.
- `package.json` `version` is still `2.0.0` (`git diff package.json` is empty).
- Every behavioral claim in the new README text matches the tests added in tasks 001 to 004. Cross-check union, literal, ordering, and `isIncluded` scope against those test files.
- `git diff --stat` (excluding `plan/`) lists only `README.md` and `CHANGELOG.md`.

## Assumptions

- Tasks 001 to 004 have landed and `npm test` is green.
- The README's pre-existing broken anchor (`#path-matching-for-efficient-searching`) and the `noSpecial`/`noSpecials` naming typo are out of scope (recorded as a finding). Do not fix them unless they sit on a line you are already rewriting.

## References

- [API design note](../notes/api-design.md): the final API, breaking-change list, and version recommendation to document.
- [minimatch escape behavior](../notes/minimatch-escape-behavior.md): the source for the `escapeGlob` brace note and the negation note.
