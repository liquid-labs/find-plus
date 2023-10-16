import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { checkRoot } from './lib/check-root'
import { breadthFirstSorter, depthFirstSorter } from './lib/sorters'

const find = async({
  atDepth = false,
  depth,
  depthFirstSort,
  excludeRoot = false,
  noRecurseFailed = false,
  onlyDirs = false,
  onlyFiles = false,
  root = throw new Error("Must provide 'root' to find."),
  tests = []
} = {}) => {
  // check for confliction options
  if (atDepth === true && depth === undefined) {
    throw new Error("Must provide an explicit 'depth' when 'atDepth' is 'true'.")
  }
  if (onlyDirs === true && onlyFiles === true) {
    throw new Error("Cannot limit to both 'onlyDirs' and 'onlyFiles'.")
  }
  if (onlyFiles === true && noRecurseFailed === true) {
    throw new Error("Cannot set both 'onlyFiles' and 'noRecurseFailed' true; no directories would be searched.")
  }

  const myTests = [...tests]

  if (atDepth === true) {
    // myTests.unshift((f, currDepth) => currDepth === depth)
    myTests.unshift((f, currDepth) => {
      return currDepth === depth
    })
  }

  if (onlyDirs === true) {
    myTests.unshift((f) => f.isDirectory())
  }
  else if (onlyFiles === true) {
    myTests.unshift((f) => f.isFile())
  }

  const rootStat = checkRoot({ root })
  rootStat.path = fsPath.dirname(root)
  rootStat.name = fsPath.basename(root)
  rootStat.depth = 0

  const accumulator = []
  let currDepth = 0

  let frontier = []
  if (excludeRoot === true && noRecurseFailed === false) { // no need for tests
    frontier.push(rootStat)
  }
  else {
    const rootPasses = !myTests.some((t) => !t(rootStat, currDepth))
    if (excludeRoot === false && rootPasses) {
      accumulator.push(rootStat)
    }
    if (rootPasses || noRecurseFailed === false) {
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
        const pass = !myTests.some((t) => !t(file, currDepth))

        if (file.isDirectory() && (pass || noRecurseFailed === false)) {
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
  const sorter = depthFirstSort === true ? depthFirstSorter : /* default */ breadthFirstSorter

  const result = accumulator.sort(sorter).map(({ name, path }) => fsPath.join(path, name))

  return result
}

export { find }
