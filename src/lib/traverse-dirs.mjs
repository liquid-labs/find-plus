import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { minimatch } from 'minimatch'

import { addFieldsToFile } from './add-fields-to-file'
import { checkRoot } from './check-root'
import { dirEntToFilePath } from './dir-ent-to-file-path'

const traverseDirs = async({
  _traversedDirs, // this is for unit testing; so we can verify that we're actually skipping dirs
  depth,
  excludePaths,
  excludeRoot = false,
  paths,
  root,
  tests
}) => {
  const absRoot = fsPath.resolve(root)
  const rootStat = await checkRoot({ absRoot, root })

  const accumulator = []
  let currDepth = 0

  let frontier = []
  if (excludeRoot === true) { // no need to test root
    frontier.push(rootStat)
    _traversedDirs?.push(dirEntToFilePath(rootStat))
  }
  else {
    testForInclusionAndFrontier({ _traversedDirs, accumulator, file : rootStat, frontier, root, tests })
  }
  currDepth += 1

  // eslint-disable-next-line no-unmodified-loop-condition
  while ((depth === undefined || depth >= currDepth) && frontier.length > 0) {
    const newFrontier = [] // this will gather the directories for the next level
    for (const dirEnt of frontier) {
      const dirPath = fsPath.join(dirEnt.parentPath, dirEnt.name)
      const files = await fs.readdir(dirPath, { withFileTypes : true })
      for (const file of files) {
        addFieldsToFile(file, { absRoot, depth: currDepth, parentPath: dirPath, root })

        testForInclusionAndFrontier({ _traversedDirs, accumulator, currDepth, excludePaths, file, frontier : newFrontier, paths, root, tests })
      }
    }
    // at this point we have processed all files at the current depth, so we work on the files at the next level
    frontier = newFrontier

    currDepth += 1
  }

  return accumulator
}

const testForInclusionAndFrontier = ({ _traversedDirs, accumulator, excludePaths, file, frontier, paths, root, tests }) => {
  const pass = !tests.some((t) => !t(file, {}))
  if (pass === true) {
    accumulator.push(file)
  }
  // test if the file is a dir and should be added to frontier
  if (file.isDirectory() === true) {
    const fullPath = dirEntToFilePath(file)
    const absRoot = fsPath.resolve(root)

    // can we exclude a possible search branch based on the exclude paths?
    let exclude = excludePaths?.some((p) => {
      const matchPath = absOrRelPathForMatch({ absRoot, fullPath, matchPath : p })
      return minimatch(matchPath, p) && p.endsWith('/**')
    }) || false

    // then' let's see if we can exclude the branch based on the paths
    if (exclude === false && paths?.length > 0) {
      // is there some path 'p' of 'paths' which could possible match the current directory in question (represented by
      // fullpath)?
      exclude = !paths.some((p) => {
        const matchPath = absOrRelPathForMatch({ absRoot, fullPath, matchPath : p })
        const matchPathBits = p.split('/')
        const matchPathIsAbsolute = matchPathBits[0] === ''

        if (matchPathIsAbsolute === true) { // then it's an absolute path and we have to sync with the absRoot
          const absRootBits = absRoot.split('/')
          for (const rootBit of absRootBits) {
            const matchPathBit = matchPathBits.shift()
            // in theory, we could do a partial match like we do with the post-root bits below, but the possible
            // matches will resolve quickly enough without the extra logic so we punt for now
            if (matchPathBit.includes('**')) {
              return true
            }
            if (minimatch(rootBit, matchPathBit) === false) {
              return false
            }
          }
        }

        let minPrefix = matchPathIsAbsolute === true ? absRoot + fsPath.sep : ''
        for (let i = 0; i < file.depth && i < matchPathBits.length; i += 1) {
          const nextBit = matchPathBits[i]
          if (nextBit === '**') {
            return true
          }
          else if (nextBit.includes('**')) {
            if (i === file.depth - 1) { // we terminate at the same level
              // then we can still attempt a match for the current dirs based on the part before the '**'
              minPrefix += nextBit.replace(/\*\*.*/, '')
            }
            else { // if we haven't hit the curr depth, then any match is possible
              return true
            }
          }
          else {
            minPrefix += nextBit + '/'
          }
        }

        minPrefix += '**'

        return minimatch(matchPath, minPrefix)
      })
    }

    if (exclude !== true) {
      frontier.push(file)
      _traversedDirs?.push(fullPath)
    }
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
