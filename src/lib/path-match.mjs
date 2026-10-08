import * as fsPath from 'node:path'

import { escape, minimatch } from 'minimatch'

const rootGlob = (glob, absRoot) =>
  glob.startsWith('/') ? glob : `${absRoot}/${glob}`

const firstMatchIndex = (fullPath, globs, { absRoot, minimatchOptions }) =>
  globs.findIndex((glob) => minimatch(fullPath, rootGlob(glob, absRoot), minimatchOptions))

const matchesPathCriteria = (fullPath, { absRoot, paths, excludePaths, minimatchOptions }) => {
  const opts = { absRoot, minimatchOptions }
  return (paths === undefined || paths.length === 0 || firstMatchIndex(fullPath, paths, opts) !== -1)
    && (excludePaths === undefined || firstMatchIndex(fullPath, excludePaths, opts) === -1)
}

// 'minimatch.escape' leaves braces unescaped, so brace expansion would still run on an "escaped" string; we escape
// them ourselves. In 'windowsPathsNoEscape' mode, wrapping braces as '[{]' does not stop brace expansion for names with
// a comma or range inside the braces (e.g., 'a{b,c}.js'). That is a documented, known limitation of that mode.
const escapeGlob = (str, { windowsPathsNoEscape } = {}) => {
  const escaped = escape(str, { windowsPathsNoEscape })
  return windowsPathsNoEscape === true
    ? escaped.replace(/[{}]/g, '[$&]')
    : escaped.replace(/[{}]/g, '\\$&')
}

// Maps each 'paths' entry to a glob string. Literal entries are expressed as '{ path, literal: true }' objects within
// the single 'paths' list (rather than a separate 'literalPaths' option) so there is one ordered list of entries; this
// keeps "entry order" unambiguous for union ordering under 'sort: none' and when mixing literals and globs. Never
// mutates the input.
const normalizePaths = (paths, minimatchOptions) =>
  paths === undefined
    ? undefined
    : paths.map((entry) =>
      typeof entry === 'string'
        ? entry
        : entry.literal === true ? escapeGlob(entry.path, minimatchOptions ?? {}) : entry.path)

const absOrRelPathForMatch = ({ absRoot, fullPath, matchPath }) => {
  if (matchPath.startsWith('/')) {
    return fullPath
  } // else

  let relPath = fullPath.slice(absRoot.length)
  if (relPath.startsWith(fsPath.sep)) {
    relPath = relPath.slice(1)
  }

  return relPath
}

// True when 'find()' skips the directory at 'fullPath' (trailing separator) because an 'excludePaths' pattern ending in
// '/**' matches it; everything beneath is then excluded, dotted entries included. Intentionally ignores
// 'minimatchOptions', as the traversal always has.
const isPrunedByExcludePaths = ({ fullPath, absRoot, excludePaths }) =>
  excludePaths?.some((p) => {
    const matchPath = absOrRelPathForMatch({ absRoot, fullPath, matchPath : p })
    return minimatch(matchPath, p) && p.endsWith('/**')
  }) || false

export { absOrRelPathForMatch, escapeGlob, isPrunedByExcludePaths, firstMatchIndex, matchesPathCriteria, normalizePaths, rootGlob }
