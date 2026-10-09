# Releasing find-plus

Agents are the primary audience of this file; human operators can follow the same steps by hand. There is no release script: the steps below are run with `npm` and `git`. **Agents never publish, push, or tag**: the publish step is user-run (it may need an interactive one-time code), and agents stop at the dry run.

## Verification status

This file was drafted from the repository's tooling (`package.json`, `Makefile`, `make/*.mk`, `CHANGELOG.md`, `.github/workflows/`, git tags), not from a recorded release run. Items marked **(unconfirmed)** are inferred and need maintainer confirmation before the first non-dry run. Existing tags (`v1.0.3` ... `v2.0.0`) confirm the `v` tag prefix.

## Prerequisites

- `node` (>= 18, per `engines`) and `npm` on `PATH`.
- Credential pre-flight: `npm whoami` must pass (publishing to npm), and `git push` access to `origin` (`git@github.com:liquid-labs/find-plus.git`). If `npm whoami` fails, authenticate in your own terminal (`npm login`) and re-run. Agents never ask for, accept, or store a credential.
- If npm two-factor authentication is enabled for publish **(unconfirmed)**, the publish command prompts for a one-time code; the user runs it from an interactive terminal.
- Confirm the exact version and registry with the user before the first non-dry run.

## Manifests

- `package.json` (`version` field) — primary; currently `2.0.0`.
- `package-lock.json` (`version` field) — updated by `npm version`.

## Changelog

[`CHANGELOG.md`](./CHANGELOG.md). Release entries use a `## [<version>]` heading. The in-progress entry is headed `## [3.0.0] - Unreleased`; at release time replace `Unreleased` with the release date **(unconfirmed: the date format; the `2.0.0` entry carries no date)** and commit that change before the bump. The version in the heading must match the version being released: the pending entry recommends a `3.0.0` major bump for its breaking change, so confirm the version with the user.

## Build

1. `npm ci`
2. `make qa` (runs `make test` and `make lint`; also run by the `preversion` hook)
3. `make build` (rolls up `src/` into `dist/`; also run by the `prepack` hook)

CI ([`.github/workflows/unit-tests-node.yaml`](./.github/workflows/unit-tests-node.yaml)) runs `npm ci`, `npm run build`, and `npm test` on Node 18/19/20 across Ubuntu, Windows, and macOS for pushes and pull requests to `main`. There is no release or publish workflow.

## Artifacts

The published tarball contains `dist/` (main entry `dist/find-plus.js`), `LICENSE.txt`, and `README.md`, plus the always-included `package.json`. Preview with `npm pack --dry-run`.

## Tag prefix

`v` (for example `v2.0.0`).

## Procedure

1. **Preconditions (user actions).**
   1. The working tree is clean and you are on `main`.
   2. `main` is pushed to `origin` and CI is green. The release does not check CI.
   3. `CHANGELOG.md` is updated as described in [Changelog](#changelog) and committed.
   4. `make qa` passes locally.
2. **Dry run.** See [Dry run](#dry-run). Fix anything it reports.
3. **Bump, commit, and tag** **(unconfirmed: the project has no recorded convention)**: `npm version <version>`. The `preversion` hook runs `make test && make lint`; npm updates `package.json` and `package-lock.json`, commits, and creates the `v<version>` tag.
4. **Tag push.** `git push origin main`, then `git push origin refs/tags/v<version>`.
5. **Publish (user-run).** `npm publish --access public` from an interactive terminal (`prepack` runs `make build`). Run it only after the tag push succeeds. Add `--tag <dist-tag>` for a prerelease (see [Dist-tag](#dist-tag)).
6. **GitHub release (optional)** **(unconfirmed: whether releases are created; the `v2.0.0` CHANGELOG note says history lives in "the GitHub releases", which suggests yes)**: `gh release create v<version> --verify-tag --title v<version> --notes-file <notes>` (add `--prerelease` for prereleases). Needs `gh auth status` to pass.
7. **Post-publish verification**, in an empty temporary directory:

   ```bash
   npm view find-plus dist-tags          # the expected tag points at the new version
   npm install find-plus@<version>
   node -e "import('find-plus').then(m => console.log(Object.keys(m)))"   # expect: escapeGlob, find, isIncluded
   ```

   `npm view` can lag the publish by a short time; retry before assuming failure.

## Registries

| Registry | Publish command |
| --- | --- |
| npm (`find-plus`, public) | `npm publish --access public` (add `--tag <dist-tag>` for a prerelease) |

The `workspace` git remote (`git@github.com:zanerock/find-plus.git`) is not a release target **(unconfirmed)**.

## Dry run

```bash
make qa                      # tests and lint
make build                   # builds dist/
npm pack --dry-run           # the exact file list the tarball would contain
npm publish --dry-run --access public
```

A dry run does not authenticate or contact the publish endpoint, so it proves the file list and the build hook, not the real upload, a 2FA prompt, or dist-tag assignment. Nothing is committed, tagged, pushed, or published.

## Dist-tag

A normal release (no prerelease part, such as `3.0.0`) publishes under `latest`. A prerelease (such as `3.0.0-rc.1`) must publish with an explicit `--tag` (for example `rc`) so it never becomes `latest`. If a tag is wrong after the fact, fix it with `npm dist-tag add find-plus@<version> <tag>` (a user action; needs credentials). Never unpublish a version; supersede it with a new one.

## Resuming an interrupted release

Check what already exists: the local tag (`git tag -l v<version>`), the remote tag (`git ls-remote --tags origin v<version>`), the registry version (`npm view find-plus@<version> version`), and the GitHub release (`gh release view v<version>`). Perform only the missing steps, using the same explicit version. If a tag exists but is not at the intended release commit, stop and ask the user; do not move or delete it.
