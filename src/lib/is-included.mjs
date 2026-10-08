import * as fsPath from 'node:path'

import { matchesPathCriteria, normalizePaths } from './path-match'
import { verifyParams } from './verify-params'

/**
 * Reports whether one literal path would pass a 'find()'-style 'paths'/'excludePaths' criteria set. Synchronous and
 * filesystem-free, so it works for paths that do not exist.
 *
 * Scope limits: only 'root', 'paths', 'excludePaths', and 'minimatchOptions' are read; all other 'find()' options
 * (file-type selectors, 'depth', 'leavesOnly', 'excludeRoot', 'tests', 'sort') are ignored. 'root' only anchors
 * relative patterns and relative subjects; the subject is NOT checked to lie under 'root'.
 *
 * @param {string} path - Literal subject path (never a pattern). A trailing '/' marks a directory.
 * @param {object} options - 'find()'-style options object.
 * @returns {boolean} true if the subject passes the path criteria.
 */
const isIncluded = (path, options = {}) => {
  verifyParams(options)
  if (typeof path !== 'string' || path === '') {
    throw new Error("The 'path' to test must be a non-empty string.")
  }

  const { minimatchOptions, excludePaths } = options
  const absRoot = fsPath.resolve(options.root)
  const isDir = path.endsWith('/') || path.endsWith(fsPath.sep)
  const fullPath = fsPath.resolve(absRoot, path) + (isDir ? fsPath.sep : '')

  return matchesPathCriteria(fullPath, {
    absRoot,
    paths : normalizePaths(options.paths, minimatchOptions),
    excludePaths,
    minimatchOptions
  })
}

export { isIncluded }
