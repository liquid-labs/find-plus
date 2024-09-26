import * as fsPath from 'node:path'

import { addImpliedTests } from './lib/add-implied-tests'
import { checkRoot } from './lib/check-root'
import { alphaSorter, breadthFirstSorter, depthFirstSorter } from './lib/sorters'
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

  const {
    root = throw new Error("Must provide 'root' to find."),
    sort,
    tests = []
  } = params

  verifyParams(params)

  const myTests = [...tests]

  addImpliedTests({ ...params, myTests })

  const rootStat = checkRoot({ root })
  rootStat.parentPath = fsPath.dirname(root)
  rootStat.name = fsPath.basename(root)
  rootStat.depth = 0

  // params need to come first, we override root and tests
  const matchedFiles = await traverseDirs({ ...params, root : rootStat, tests : myTests })

  // results in depth-first sort of full directory paths
  if (sort !== 'none') {
    const sorter = sort === 'depth' === true
      ? depthFirstSorter
      : sort === 'alpha'
        ? alphaSorter
        : /* default */ breadthFirstSorter
    matchedFiles.sort(sorter)
  }

  const result = matchedFiles.map(({ name, parentPath }) => fsPath.resolve(parentPath, name))

  return result
}

export { find }
