import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

const traverseDirs = async({
  depth,
  excludeRoot = false,
  noTraverseFailed = false,
  root,
  tests
}) => {
  const accumulator = []
  let currDepth = 0

  let frontier = []
  if (excludeRoot === true && noTraverseFailed === false) { // no need for tests
    frontier.push(root)
  }
  else {
    testForInclusionAndFrontier({ accumulator, file : root, frontier, noTraverseFailed, tests })
  }
  currDepth += 1

  // eslint-disable-next-line no-unmodified-loop-condition
  while ((depth === undefined || depth >= currDepth) && frontier.length > 0) {
    const newFrontier = []
    for (const dirEnt of frontier) {
      const dirPath = fsPath.join(dirEnt.parentPath, dirEnt.name)
      const files = await fs.readdir(dirPath, { withFileTypes : true })
      for (const file of files) {
        file.depth = currDepth

        // node 19.x DirEnt's lack parent path
        if (file.parentPath === undefined) {
          file.parentPath = dirPath
        }

        testForInclusionAndFrontier({ accumulator, currDepth, file, frontier : newFrontier, noTraverseFailed, tests })
      }
    }
    frontier = newFrontier

    currDepth += 1
  }

  return accumulator
}

const testForInclusionAndFrontier = ({ accumulator, currDepth, file, frontier, noTraverseFailed, tests }) => {
  const pass = !tests.some((t) => !t(file, currDepth))

  if (file.isDirectory() && (pass || noTraverseFailed === false)) {
    frontier.push(file)
  }
  if (pass) {
    accumulator.push(file)
  }
}

export { traverseDirs }
