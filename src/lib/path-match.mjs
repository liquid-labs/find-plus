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

export { escapeGlob, firstMatchIndex, matchesPathCriteria, normalizePaths, rootGlob }
