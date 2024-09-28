import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { minimatch } from 'minimatch'

import { checkRoot } from './check-root'
import { dirEntToFilePath } from './dir-ent-to-file-path'

const traverseDirs = async({
  _traversedDirs,
  depth,
  excludePaths,
  excludeRoot = false,
  noTraverseFailed = false,
  paths,
  root,
  tests
}) => {
  const rootStat = await checkRoot({ root })

  const accumulator = []
  let currDepth = 0

  let frontier = []
  if (excludeRoot === true && noTraverseFailed === false) { // no need for tests
    frontier.push(rootStat)
    _traversedDirs?.push(dirEntToFilePath(rootStat))
  }
  else {
    testForInclusionAndFrontier({ _traversedDirs, accumulator, file : rootStat, frontier, noTraverseFailed, root, tests })
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

        testForInclusionAndFrontier({ _traversedDirs, accumulator, currDepth, excludePaths, file, frontier : newFrontier, noTraverseFailed, paths, root, tests })
      }
    }
    frontier = newFrontier

    currDepth += 1
  }

  return accumulator
}

const testForInclusionAndFrontier = ({ _traversedDirs, accumulator, currDepth, excludePaths, file, frontier, noTraverseFailed, paths, root, tests }) => {
  const pass = !tests.some((t) => !t(file, currDepth))
  // test if the file is a dir and should be added to frontier
  if (file.isDirectory() && (pass || noTraverseFailed === false)) {
    const fullPath = dirEntToFilePath(file)
    const absRoot = fsPath.resolve(root)

    let exclude = excludePaths?.some((p) => {
      const matchPath = absOrRelPathForMatch({ absRoot, fullPath, matchPath: p })
      console.log('matchPath:', matchPath, 'p:', p, 'matches:', minimatch(matchPath, p)) // DEBUG
      return minimatch(matchPath, p)
      /* deprecated by use of absOrRelPathForMatch - delete after testing
      if (p.startsWith('/')) {
        return minimatch(fullPath, p)
      }
      else {
        let relPath = fullPath.slice(absRoot.length)
        if (relPath.startsWith(fsPath.sep)) {
          relPath = relPath.slice(1)
        }

        return minimatch(relPath, p)
      }*/
    }) || false

    /*if (exclude === false) {

    }*/

    /*
    if (paths === undefined || paths.some((p) => {
      const [requiredPrefix] = p.split('**')


      const [prefix] = p.split('**')
      // return fullPath.endsWith(prefix)
      const traverse = fullPath.endsWith(prefix)
      console.log('path:', p, 'fullPath:', fullPath, 'traverse:', traverse) // DEBUG
      return traverse
    })) {
      frontier.push(file)
      _traversedDirs?.push(fullPath)
    }*/

    if (exclude !== true) {
      frontier.push(file)
      _traversedDirs?.push(fullPath)
    }
  }
  // test if the file passes the test
  if (pass) {
    accumulator.push(file)
  }
}

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

export { traverseDirs }
