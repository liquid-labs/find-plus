# README Typos Anchors And Limitation Notes

## Purpose and scope

Resolves followup fHeL (README typos and anchors) and the documentation resolution of followup 5wTv (brace limitation under `windowsPathsNoEscape`), and documents the task 004 `excludePaths` change. Edits only `README.md`. Runs last so it reflects tasks 003 and 004.

## Requirements

- Table-of-contents link near line 12 and the `excludePaths` bullet (about line 47): the target heading is `Path matching for efficient searches`, so use anchor `#path-matching-for-efficient-searches` everywhere (the TOC entry text may stay).
- Rename the `noSpecial` option to `noSpecials` (the name `src/find-plus.mjs` reads); check whether `onlySpecials` is documented consistently.
- Fix `noBlockDevcies` to `noBlockDevices` and `Negatvie` to `Negative`.
- Add the missing closing parenthesis to the `find({...})` call in the Usage example (about line 28).
- Update the `excludePaths` bullet type to `(string | { path: string, literal?: boolean })[]` and state entries are handled as with `paths`, including literal entries.
- Document that a literal entry containing `{` or `}` with a comma or range inside is unsupported when `minimatchOptions.windowsPathsNoEscape` is set, in the "Literal paths and escapeGlob" section. State that the limitation is irrelevant to patterns built with `/`.
- If task 003 landed, note that a `root` containing glob characters works with relative patterns. Skip this note if it reads as noise.
- Keep other README content unchanged.

## Validation

- Grep `README.md` for `noSpecial\b`, `Devcies`, `Negatvie`, and `searching)` anchors; none remain.
- Every in-document anchor link resolves to an existing heading.
- The Usage example parses as balanced code (paren count).

## Status

Outcome: succeeded (2026-10-08). Edited `README.md` only: typos (`noSpecials`, `noBlockDevices`, `Negative`), Usage paren, `excludePaths` type and literal-entry wording, windowsPathsNoEscape brace limitation (stated irrelevant for `/` patterns), and a root-with-glob-characters note (task 003). Anchors: all in-document links use `#path-matching-for-efficient-searches` (TOC already did). `onlySpecials` documented consistently with `src/find-plus.mjs`. Validation greps clean.
