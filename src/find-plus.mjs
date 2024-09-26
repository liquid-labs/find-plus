import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { addImpliedTests } from './lib/add-implied-tests'
import { checkRoot } from './lib/check-root'
import { alphaSorter, breadthFirstSorter, depthFirstSorter } from './lib/sorters'
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
    depth,
    excludeRoot = false,
    noTraverseFailed = false,
    root = throw new Error("Must provide 'root' to find."),
    sort,
    tests = []
  } = params

  verifyParams(params)

  const myTests = [...tests]

  addImpliedTests({ ...params, myTests })

  const rootStat = checkRoot({ root })
  rootStat.path = fsPath.dirname(root)
  rootStat.name = fsPath.basename(root)
  rootStat.depth = 0

  const accumulator = []
  let currDepth = 0

  let frontier = []
  if (excludeRoot === true && noTraverseFailed === false) { // no need for tests
    frontier.push(rootStat)
  }
  else {
    const rootPasses = !myTests.some((t) => !t(rootStat, currDepth))
    if (excludeRoot === false && rootPasses) {
      accumulator.push(rootStat)
    }
    if (rootPasses || noTraverseFailed === false) {
      frontier.push(rootStat)
    }
  }

  currDepth += 1
  // eslint-disable-next-line no-unmodified-loop-condition
  while ((depth === undefined || depth >= currDepth) && frontier.length > 0) {
    const newFrontier = []
    for (const dirEnt of frontier) {
      const dirPath = fsPath.join(dirEnt.path, dirEnt.name)
      const files = await fs.readdir(dirPath, { withFileTypes : true })
      for (const file of files) {
        file.depth = currDepth
        // node 19.x workaround; DirEnt's don't have '.path'; we always set '.path' on the root entry, so this becomes 
        // self-perpetuating and we expect all frontier entries to have '.path' set
        if (file.path === undefined) {
          file.path = dirPath
        }
        const pass = !myTests.some((t) => !t(file, currDepth))

        if (file.isDirectory() && (pass || noTraverseFailed === false)) {
          console.log('dirPath:', dirPath, 'adding frontier:', file) // DEBUG
          newFrontier.push(file)
        }
        if (pass) {
          accumulator.push(file)
        }
      }
    }
    frontier = newFrontier

    currDepth += 1
  }

  // results in depth-first sort of full directory paths
  if (sort !== 'none') {
    const sorter = sort === 'depth' === true
      ? depthFirstSorter
      : sort === 'alpha'
        ? alphaSorter
        : /* default */ breadthFirstSorter
    accumulator.sort(sorter)
  }

  const result = accumulator.map(({ name, path }) => fsPath.resolve(path, name))

  return result
}

export { find }
