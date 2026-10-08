# Update Architecture Docs

## Purpose and scope

Review the project's architecture and spec documentation against the public-API changes this plan makes: `paths` union semantics, literal `paths` entries, `escapeGlob`, `isIncluded`, and the new shared `src/lib/path-match.mjs` module. Update those documents where needed. Follow the `update-architecture-docs` task procedure at `plugins/flow/task-procedures/update-architecture-docs/SKILL.md`.

## Requirements

- Implementation task documents that surfaced the architectural implications (public API and component-boundary changes):
  - `plan/phase-01-paths-union-literal-is-included/002-shared-path-match-and-union.md`
  - `plan/phase-01-paths-union-literal-is-included/003-literal-path-entries-and-escape-glob.md`
  - `plan/phase-01-paths-union-literal-is-included/004-is-included-function.md`
  - `plan/phase-01-paths-union-literal-is-included/005-readme-and-changelog.md`
- Architecture and spec files to review:
  - `docs/architecture.md`: **does not exist** in this project at planning time.
  - `docs/*-spec.md`: **none exist** at planning time (check the glob again at task start).
  - `README.md` and `CHANGELOG.md`: the project's only user-facing API documentation, already updated by task 005. Confirm they reflect the final public API as implemented: `find` union and literal entries, `escapeGlob`, `isIncluded`, and `minimatchOptions`.
- Do **not** create `docs/architecture.md` or a spec document. Creating new project documentation is outside this plan's scope. If one is warranted, report it as a recommendation.
- role_doc: `plugins/flow/roles/architect-backend.md`
- Procedure: `plugins/flow/task-procedures/update-architecture-docs/SKILL.md`

## Validation

- `ls docs/architecture.md docs/*-spec.md` was run at task start and its result recorded in the task status. Each file that exists was reviewed and updated where the planned changes affect it.
- `README.md`'s API description matches the exported surface: `grep -n "export" src/find-plus.mjs` shows `escapeGlob`, `find`, and `isIncluded`, and each is documented in `README.md`.
- No new files under `docs/` unless the manager explicitly directs it.
