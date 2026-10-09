#!/usr/bin/env bash
# Release find-plus in two stages, because the registry publish needs an interactive 2FA code that only
# the user may enter. This script never publishes and never reads or accepts a secret.
#
# Usage: scripts/release.sh [--dry-run] <X.Y.Z[-pre.N]>   stage 1: pre-flight, bump, commit, tag, push
#        scripts/release.sh --finish <X.Y.Z[-pre.N]>      stage 2: verify publish, smoke test, GitHub release
#        scripts/release.sh --print-dist-tag <X.Y.Z[-pre.N]>   (print the dist-tag; no side effects)
#
# Between the stages the user runs the printed 'bun publish' command by hand, in an interactive terminal.
# Safe to re-run: stage 1 skips a bump/tag/push that already exists; stage 2 skips an existing GitHub release.
# Tooling is bun: bun install, bun pm version, bun pm whoami, bun info, bun publish. See RELEASING.md.
set -euo pipefail

DRY_RUN=0
FINISH=0
VERSION=''
RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
REMOTE=origin
PKG_NAME=find-plus
VERSION_RE='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'

# A release (no prerelease part) takes 'latest'. A prerelease takes its first identifier
# (3.0.0-rc.1 -> rc), so it never takes 'latest'; an unusable or reserved identifier falls back to 'next'.
dist_tag_for() {
  local v=${1%%+*} pre tag
  [[ "$v" == *-* ]] || { echo latest; return; }
  pre=${v#*-}; tag=${pre%%.*}
  [[ "$tag" =~ ^[A-Za-z][A-Za-z0-9-]*$ && "$tag" != latest ]] || tag=next
  echo "$tag"
}

need_version() {
  [[ -n "${1:-}" && "$1" =~ $VERSION_RE ]] || { echo "An explicit version (X.Y.Z[-pre.N]) is required." >&2; exit 2; }
}

while (( $# )); do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --finish) FINISH=1 ;;
    --print-dist-tag) need_version "${2:-}"; dist_tag_for "$2"; exit 0 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    -*) echo "Unknown option: $1" >&2; exit 2 ;;
    *) [[ -z "$VERSION" ]] || { echo "Only one version argument allowed." >&2; exit 2; }; VERSION="$1" ;;
  esac
  shift
done
need_version "$VERSION"
(( ! (DRY_RUN && FINISH) )) || { echo "--dry-run applies to stage 1 only." >&2; exit 2; }

cd "$(git rev-parse --show-toplevel)"
say() { echo "==> $*"; }
TAG="v$VERSION"
DIST_TAG=$(dist_tag_for "$VERSION")
if [[ "$DIST_TAG" == latest ]]; then PRERELEASE_FLAG=(); else PRERELEASE_FLAG=(--prerelease); fi
NAME=$(bun -p "require('./package.json').name")
[[ "$NAME" == "$PKG_NAME" ]] || { echo "package.json name is '$NAME', expected '$PKG_NAME'." >&2; exit 1; }

published() { [[ -n "$(bun info "$PKG_NAME@$VERSION" version 2>/dev/null)" ]]; }

preflight() {
  say "Pre-flight"
  [[ "$(git rev-parse --abbrev-ref HEAD)" == "$RELEASE_BRANCH" ]] || { echo "Must be on branch '$RELEASE_BRANCH'." >&2; exit 1; }
  [[ -z "$(git status --porcelain)" ]] || { echo "Working tree is not clean." >&2; exit 1; }
  git remote get-url "$REMOTE" >/dev/null || { echo "Remote '$REMOTE' not configured." >&2; exit 1; }
  # A dry run only warns on a missing login so the rest can be rehearsed; a real run stops.
  f() { if (( DRY_RUN )); then echo "[dry-run] WARNING: $1 (a real run would stop here)" >&2; else echo "$1" >&2; exit 1; fi; }
  bun pm whoami >/dev/null 2>&1 || f "Not logged in to npm. Run 'bunx npm login' in your own terminal, then re-run."
  gh auth status >/dev/null 2>&1 || f "Not logged in to GitHub. Run 'gh auth login' in your own terminal, then re-run."
}

# --- stage 2 ------------------------------------------------------------------
if (( FINISH )); then
  preflight
  say "Verifying $PKG_NAME@$VERSION is published"
  published || { echo "$PKG_NAME@$VERSION is not on the registry yet (the registry can lag; retry). Publish it by hand first." >&2; exit 1; }
  [[ "$(bun info "$PKG_NAME" "dist-tags.$DIST_TAG" 2>/dev/null)" == "$VERSION" ]] \
    || { echo "Dist-tag '$DIST_TAG' does not point at $VERSION." >&2; exit 1; }
  [[ "$DIST_TAG" == latest ]] || [[ "$(bun info "$PKG_NAME" dist-tags.latest 2>/dev/null)" != "$VERSION" ]] \
    || { echo "Prerelease $VERSION took 'latest'; fix with 'npm dist-tag add' (see RELEASING.md)." >&2; exit 1; }

  say "Smoke test: import('$PKG_NAME') must expose escapeGlob, find, isIncluded"
  SMOKE_DIR=$(mktemp -d)
  trap 'rm -rf "$SMOKE_DIR"' EXIT
  ( cd "$SMOKE_DIR" && echo '{}' > package.json && bun add "$PKG_NAME@$VERSION" >/dev/null \
    && node --input-type=module -e "
const m = await import('$PKG_NAME')
const missing = ['escapeGlob', 'find', 'isIncluded'].filter((n) => typeof m[n] !== 'function')
if (missing.length > 0) { console.error('Missing exports: ' + missing.join(', ')); process.exit(1) }
" ) || { echo "Smoke test FAILED for $PKG_NAME@$VERSION. Do not unpublish; supersede with a new version." >&2; exit 1; }

  say "Creating GitHub release $TAG"
  git rev-parse -q --verify "refs/tags/$TAG" >/dev/null || { echo "Tag $TAG does not exist locally." >&2; exit 1; }
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "Release exists; skipping."
  else
    PREV_TAG=$(git describe --tags --abbrev=0 --match 'v*' "$TAG^" 2>/dev/null || true)
    NOTES_FILE=$(mktemp)
    {
      git log --first-parent --format='* %s' "${PREV_TAG:+$PREV_TAG..}$TAG" | grep -v -E '^\* (release: |v[0-9])' || true
      SLUG=$(git remote get-url "$REMOTE" | sed -E 's#^.*[:/]([^/:]+/[^/]+)$#\1#; s#\.git$##')
      [[ -z "$PREV_TAG" ]] || printf '\n**Full changelog**: https://github.com/%s/compare/%s...%s\n' "$SLUG" "$PREV_TAG" "$TAG"
    } > "$NOTES_FILE"
    gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE" --verify-tag ${PRERELEASE_FLAG[@]+"${PRERELEASE_FLAG[@]}"}
    rm -f "$NOTES_FILE"
  fi
  say "Done: $TAG"
  exit 0
fi

# --- stage 1 ------------------------------------------------------------------
preflight
say "Dist-tag for $VERSION: $DIST_TAG"
say "Installing exactly what bun.lock pins"
rm -rf node_modules
bun install --frozen-lockfile

if (( DRY_RUN )); then
  say "Dry run: QA, pack list, and publish rehearsal (nothing is committed, tagged, pushed, or published)"
  make qa
  bun pm pack --dry-run
  bun publish --dry-run --access public --tag "$DIST_TAG"
  echo "[dry-run] would run: bun pm version $VERSION -m 'release: %s'; git push $REMOTE HEAD refs/tags/$TAG"
  exit 0
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  [[ "$(git rev-parse "$TAG^{commit}")" == "$(git rev-parse HEAD)" ]] || { echo "Tag $TAG exists but is not at HEAD." >&2; exit 1; }
  say "Resuming: commit and tag $TAG already exist"
else
  say "Bumping version (runs 'make test && make lint' via preversion), committing, tagging"
  bun pm version "$VERSION" -m 'release: %s'
fi

say "Pushing branch and $TAG to $REMOTE"
git push "$REMOTE" HEAD
git ls-remote --exit-code --tags "$REMOTE" "refs/tags/$TAG" >/dev/null 2>&1 || git push "$REMOTE" "refs/tags/$TAG"

cat <<MSG

==> STOP: publish is a manual, user-run step (npm 2FA needs an interactive one-time code).
    This script never publishes. In your own interactive terminal, run:

        bun publish --access public --tag $DIST_TAG

    Then finish (verify, smoke test, GitHub release) with:

        scripts/release.sh --finish $VERSION
MSG
