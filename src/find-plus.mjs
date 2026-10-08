import * as fsPath from 'node:path'

import { addImpliedTests } from './lib/add-implied-tests'
import { dirEntToFilePath } from './lib/dir-ent-to-file-path'
import { escapeGlob, firstMatchIndex, normalizePaths } from './lib/path-match'
import { validSorts } from './lib/sorters'
import { traverseDirs } from './lib/traverse-dirs'
import { verifyParams } from './lib/verify-params'

const find = async(params = {}) => {
  // we do this first so the values are correct for 'verifyParams'
  if (params.noSpecials === true) {
    params.noBlockDevices = true
    params.noCharacterDevices = true
    params.noFIFOs = true
    params.noSockets = true
  }
  if (params.onlySpecials === true) {
    params.noDirs = true
    params.noFiles = true
    params.noSymbolicLinks = true
  }

  const {
    sort = 'breadth',
    tests = []
  } = params

  verifyParams(params)

  const paths = normalizePaths(params.paths, params.minimatchOptions)

  const myTests = [...tests]
  addImpliedTests({ ...params, paths, myTests })

  // params need to come first, we override root and tests
  const matchedFiles = await traverseDirs({ ...params, paths, tests : myTests })

  // results in depth-first sort of full directory paths
  if (sort !== 'none') {
    const sorter = validSorts[sort]
    matchedFiles.sort(sorter)
  }
  else if (paths?.length > 1) {
    const { minimatchOptions } = params
    const absRoot = fsPath.resolve(params.root)
    const opts = { absRoot, minimatchOptions }
    // stable sort: entry order first, walk order within an entry
    const keyed = matchedFiles.map((f) => [firstMatchIndex(dirEntToFilePath(f), paths, opts), f])
    keyed.sort((a, b) => a[0] - b[0])
    matchedFiles.splice(0, matchedFiles.length, ...keyed.map(([, f]) => f))
  }

  const result = matchedFiles.map(dirEntToFilePath)

  return result
}

export { escapeGlob, find }
