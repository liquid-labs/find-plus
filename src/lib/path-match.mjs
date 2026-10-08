import { minimatch } from 'minimatch'

const rootGlob = (glob, absRoot) =>
  glob.startsWith('/') ? glob : `${absRoot}/${glob}`

const firstMatchIndex = (fullPath, globs, { absRoot, minimatchOptions }) =>
  globs.findIndex((glob) => minimatch(fullPath, rootGlob(glob, absRoot), minimatchOptions))

const matchesPathCriteria = (fullPath, { absRoot, paths, excludePaths, minimatchOptions }) => {
  const opts = { absRoot, minimatchOptions }
  return (paths === undefined || paths.length === 0 || firstMatchIndex(fullPath, paths, opts) !== -1)
    && (excludePaths === undefined || firstMatchIndex(fullPath, excludePaths, opts) === -1)
}

export { firstMatchIndex, matchesPathCriteria, rootGlob }
