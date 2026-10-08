# Fix Breadth Sorter Typo And Inverted Ternary

## Purpose and scope

Resolves followup JFJX. In `src/lib/sorters.mjs`, `breadthFirstSorter` compares `a.parentPath.localeCompare(b.paretPath)` (typo) and the ternary is inverted. Fix so same-depth entries order by parent path, then by name. Touches only `src/lib/sorters.mjs` plus tests. This is an observable reorder of the default `find()` sort for same-depth entries in different directories; this ships in a new major release (user-confirmed); see [decisions](../notes/decisions.md).

## Requirements

- Replace the body of the same-depth branch with: `const pathCompare = a.parentPath.localeCompare(b.parentPath); return pathCompare !== 0 ? pathCompare : a.name.localeCompare(b.name)`.
- Do not change `depthFirstSorter`, `alphaSorter`, or `validSorts`.
- Add a unit test (new file `src/lib/test/sorters.test.mjs`, following the style of the sibling tests) with plain objects `{ depth, parentPath, name }` covering: lower depth first; same depth, different parents ordered by parent; same depth and parent ordered by name.
- Do not edit existing tests. If an existing test fails because it encodes the old order, halt and report instead of modifying it.

## Validation

- `make test` (or `npm test`) passes, including all pre-existing tests unchanged.
- `make lint` passes.
- New sorter tests fail against the old implementation and pass against the new one.
