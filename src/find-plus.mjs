import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { checkRoot } from './lib/check-root'
import { breadthFirstSorter, depthFirstSorter } from './lib/sorters'

const find = async({
  atDepth = false,
  depth,
  depthFirstSort,
  excludeRoot = false,
  noBlockDevices = false,
  noCharacterDevices = false,
  noDirs = false,
  noFIFOs = false,
  noFiles = false,
  noRecurseFailed = false,
  noSockets = false,
  noSpecials = false,
  noSymbolicLinks = false,
  onlyBlockDevices = false,
  onlyCharacterDevices = false,
  onlyDirs = false,
  onlyFIFOs = false,
  onlyFiles = false,
  onlySockets = false,
  onlySymbolicLinks = false,
  root = throw new Error("Must provide 'root' to find."),
  tests = []
} = {}) => {
  // check for confliction options
  if (atDepth === true && depth === undefined) {
    throw new Error("Must provide an explicit 'depth' when 'atDepth' is 'true'.")
  }
  let onlyCount = 0
  for (const flag of [
    onlyBlockDevices,
    onlyCharacterDevices,
    onlyDirs,
    onlyFIFOs,
    onlyFiles,
    onlySockets,
    onlySymbolicLinks
  ]) {
    if (flag === true) {
      onlyCount += 1
    }
  }
  if (onlyCount > 1) {
    throw new Error("Cannot specify multiple 'only' flags; nothing would be selected.")
  }
  if (onlyCount > 0 && noRecurseFailed === true && onlyDirs !== true) {
    throw new Error("Cannot set an 'only' flag (other than 'onlyDirs') and 'noRecurseFailed' true; no directories would be searched.")
  }
  if (noDirs === true && noRecurseFailed === true) {
    throw new Error("Cannot set 'noDirs' and 'noRecurseFailed' both true; nothing would be searched.")
  }

  if (noSpecials === true) {
    noBlockDevices = true
    noCharacterDevices = true
    noFIFOs = true
    noSockets = true
  }

  let noCount = 0
  const noFlags = [noBlockDevices, noCharacterDevices, noDirs, noFIFOs, noFiles, noSockets, noSymbolicLinks]
  for (const flag of noFlags) {
    if (flag === true) {
      noCount += 1
    }
  }
  if (noCount === noFlags.length) {
    throw new Error("Cannot set all 'no' flags to true; nothing would be searched.")
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
  else if (onlyBlockDevices === true) {
    myTests.unshift((f) => f.isBlockDevice())
  }
  else if (onlyCharacterDevices === true) {
    myTests.unshift((f) => f.isCharacterDevice())
  }
  else if (onlyFIFOs === true) {
    myTests.unshift((f) => f.isFIFO())
  }
  else if (onlySockets === true) {
    myTests.unshift((f) => f.isSocket())
  }
  else if (onlySymbolicLinks === true) {
    myTests.unshift((f) => f.isSymbolicLink())
  }

  if (noDirs === true) {
    myTests.unshift((f) => !f.isDirectory())
  }
  else if (noFiles === true) {
    myTests.unshift((f) => !f.isFile())
  }
  else if (noBlockDevices === true) {
    myTests.unshift((f) => !f.isBlockDevice())
  }
  else if (noCharacterDevices === true) {
    myTests.unshift((f) => !f.isCharacterDevice())
  }
  else if (!noFIFOs === true) {
    myTests.unshift((f) => !f.isFIFO())
  }
  else if (noSockets === true) {
    myTests.unshift((f) => !f.isSocket())
  }
  else if (noSymbolicLinks === true) {
    myTests.unshift((f) => !f.isSymbolicLink())
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
