# Releasing find-plus

The release is driven by [`scripts/release.sh`](./scripts/release.sh) in two stages. Agents are the primary audience of this file; human operators can run the same script by hand. Read the script for the exact steps. **Agents never publish, push, or tag**: the publish step is user-run (npm 2FA needs an interactive one-time code), and agents stop at the dry run.

## Verification status

The `bun` release path (`bun pm version`, `bun publish` with the interactive 2FA prompt, and `--finish`) was exercised in the live 3.0.0 release, published as `find-plus` (unscoped). Stage 1 failed three times during that release and was hardened afterward: the remote-ahead check, the tag-at-HEAD verification, and resume from a completed bump are verified by dry-run and scratch-repo tests only, not by a live release. Do the [dry run](#dry-run) first and confirm each step with the user. Existing tags (`v1.0.3` ... `v3.0.0`) confirm the `v` tag prefix.

## Prerequisites

- `bun`, `node` (>= 18, per `engines`), `git`, and `gh` on `PATH`.
- Credential pre-flight: `bun pm whoami` and `gh auth status` must pass, and `git push` access to `origin` (`git@github.com:liquid-labs/find-plus.git`). If either check fails, authenticate in your own terminal (`bunx npm login`; `gh auth login`) and re-run. The script never accepts a code or any secret as an argument.
- npm 2FA is required for publish; `bun publish` prompts for the one-time code. The publish command is run by the user from an interactive terminal; the script never runs it.
- Confirm the exact version and dist-tag with the user before the first non-dry run.

## Manifests

- `package.json` (`version` field) — primary; the bump rewrites it.
- `bun.lock` — has no `version` field for the root package and is normally untouched by the bump.

## Changelog

[`CHANGELOG.md`](./CHANGELOG.md). Release entries use a `## [<version>] - YYYY-MM-DD` heading. Before a release, the entry for the new version must carry the release date rather than `Unreleased`; commit that first. The release script does not edit the changelog.

## Build

1. `bun install --frozen-lockfile`
2. `make qa` (runs `make test` and `make lint`; also run by the `preversion` hook)
3. `make build` (rolls up `src/` into `dist/`; also run by the `prepack` hook)

CI ([`.github/workflows/unit-tests-node.yaml`](./.github/workflows/unit-tests-node.yaml)) runs `bun install --frozen-lockfile`, `bun run build`, and `bun run test` on Node 18/19/20 across Ubuntu, Windows, and macOS for pushes and pull requests to `main`. There is no release or publish workflow.

## Artifacts

The published tarball contains `dist/` (main entry `dist/find-plus.js`), `LICENSE.txt`, and `README.md`, plus the always-included `package.json`. Preview with `bun pm pack --dry-run`.

## Tag prefix

`v` (for example `v3.0.0`).

## Tag push

`bun pm version <version> -m 'release: %s'` commits the bump and creates the `v<version>` tag; the script then runs `git push origin HEAD` and `git push origin refs/tags/v<version>`.

## Registries

| Registry | Publish command |
| --- | --- |
| npm (`find-plus`, public) | `bun publish --access public --tag <dist-tag>` (user-run; see [Procedure](#procedure)) |

The `workspace` git remote (`git@github.com:zanerock/find-plus.git`) is only a working copy, not a release target.

## Credential pre-flight

`bun pm whoami` and `gh auth status`.

## Procedure

1. **Preconditions (user actions).**
   1. The working tree is clean and you are on `main` (override with `RELEASE_BRANCH`).
   2. `main` is pushed to `origin` and CI is green. The script does not check CI.
   3. `CHANGELOG.md` has the new version's `Unreleased` heading replaced by the date, committed.
   4. `make qa` passes locally.
2. **Dry run.** See [Dry run](#dry-run). Fix anything it reports.
3. **Stage 1: `scripts/release.sh <version>`** (for example `scripts/release.sh 3.0.0`). In order, it:
   1. Runs the pre-flight: clean tree, on the release branch, `origin` configured, `bun pm whoami`, `gh auth status`; then `git fetch origin` and fails, before any bump, if `origin/<branch>` has commits local lacks (behind or diverged); then `rm -rf node_modules` and `bun install --frozen-lockfile`.
   2. Bumps with `bun pm version <version> -m 'release: %s'`, whose `preversion` hook runs `make test && make lint`; bun commits and creates the `v<version>` tag. The script then verifies the tag resolves to `HEAD` and aborts, before pushing, if it does not.
   3. Pushes the branch and `refs/tags/v<version>` to `origin`.
   4. **Stops**, printing the publish command. It does not publish.
4. **Publish (user-run).** From an interactive terminal, run the printed command: `bun publish --access public --tag <dist-tag>` (`prepack` runs `make build`; enter the 2FA code when prompted). See [Dist-tag](#dist-tag) for the tag.
5. **Stage 2: `scripts/release.sh --finish <version>`.** It:
   1. Checks the version is on the registry and the dist-tag points at it (a prerelease must not have taken `latest`). `bun info` can lag a short time; retry before assuming failure.
   2. Runs the smoke test: installs `find-plus@<version>` into a temporary directory and checks `import('find-plus')` exposes `escapeGlob`, `find`, and `isIncluded`. A failure exits non-zero and the release is **not** finished; do not unpublish, supersede with a new version.
   3. Creates the GitHub release for the tag with `gh release create v<version> --verify-tag` (`--prerelease` for prereleases). This step is **required**: every release tag gets exactly one GitHub release. Notes are generated from first-parent git history since the previous `v*` tag, plus a compare link.

## Dry run

```bash
scripts/release.sh --dry-run <version>           # e.g. 3.0.0 or 3.0.0-rc.1
scripts/release.sh --print-dist-tag <version>    # only prints the dist-tag; no side effects
bun pm pack --dry-run                            # what would go in the tarball
bun publish --dry-run --access public --tag <dist-tag>
```

`scripts/release.sh --dry-run <version>` runs the pre-flight (missing logins are warnings), the remote-ahead and resume checks, a clean `bun install --frozen-lockfile`, `make qa`, `bun pm pack --dry-run`, and `bun publish --dry-run`. Nothing is bumped, committed, tagged, pushed, or published. A dry run does not authenticate or contact the publish endpoint, so it proves the file list, the build hook, and the QA run, not the real upload, the 2FA prompt, dist-tag assignment, the smoke test, or the GitHub release.

## Dist-tag

The script computes the dist-tag from the version (`dist_tag_for`; inspect with `--print-dist-tag`):

| Version | Dist-tag | GitHub release |
| --- | --- | --- |
| `3.0.0` (no prerelease part) | `latest` | normal |
| `3.0.0-rc.1` | `rc` | prerelease |
| `3.0.1-0` (numeric first identifier) | `next` | prerelease |
| `3.0.0-latest.1` (reserved word) | `next` | prerelease |

Prereleases never take `latest`; always pass `--tag` explicitly when publishing. If a tag is wrong after the fact, fix it with `npm dist-tag add find-plus@<version> <tag>` (a user action; needs credentials). Never unpublish a version; supersede it.

## Resuming an interrupted release

Re-run stage 1 with the explicit version. It never runs `bun pm version` when `package.json` already equals the target (bun would fail with "Version not changed").

- **Remote ahead or diverged.** Stage 1 fetches `origin` and stops before bumping if `origin/<branch>` has commits not in local. Run `git pull` (or merge), then re-run. Do this before the bump: merging after it leaves the tag on the pre-merge commit.
- **Bump done, tag missing or unpushed.** If `package.json` is the target version and a `release: <version>` commit is in `HEAD`'s history, stage 1 skips the bump, creates the annotated tag `v<version>` at `HEAD` if it is missing, pushes `HEAD` and the tag, and prints the publish command.
- **Tag already pushed.** If `origin` already has the tag at `HEAD`, stage 1 says so, pushes `HEAD` if needed, and prints the publish command only.
- **Tag not at `HEAD`.** A local tag at another commit, or a remote tag that is not at `HEAD`, aborts the run with instructions. The script never moves or deletes a tag; ask the user. An unpushed wrong tag can be removed by hand with `git tag -d v<version>` before re-running.
- **Version set without a release commit.** `package.json` at the target with no `release: <version>` commit in history aborts; resolve by hand.

`--dry-run` performs the same remote and resume checks and reports what it would do. Re-running `--finish` skips a GitHub release that already exists.
