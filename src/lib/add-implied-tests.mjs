import * as fsPath from 'node:path'

import { minimatch } from 'minimatch'

const addImpliedTests = ({
  depth,
  excludePaths,
  leavesOnly,
  minimatchOptions,
  myTests,
  noBlockDevices,
  noCharacterDevices,
  noDirs,
  noFIFOs,
  noFiles,
  noSockets,
  noSymbolicLinks,
  onlyBlockDevices,
  onlyCharacterDevices,
  onlyDirs,
  onlyFIFOs,
  onlyFiles,
  onlySockets,
  onlySymbolicLinks,
  paths,
  root
}) => {
  if (leavesOnly === true) {
    myTests.unshift((f, currDepth) => currDepth === depth)
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
  if (noFiles === true) {
    myTests.unshift((f) => !f.isFile())
  }
  if (noBlockDevices === true) {
    myTests.unshift((f) => !f.isBlockDevice())
  }
  if (noCharacterDevices === true) {
    myTests.unshift((f) => !f.isCharacterDevice())
  }
  if (noFIFOs === true) {
    myTests.unshift((f) => !f.isFIFO())
  }
  if (noSockets === true) {
    myTests.unshift((f) => !f.isSocket())
  }
  if (noSymbolicLinks === true) {
    myTests.unshift((f) => !f.isSymbolicLink())
  }

  root = fsPath.resolve(root)

  if (paths !== undefined) {
    for (const globMatch of paths) {
      myTests.unshift((dirEnt) => {
        const fullPath = makeFullPath(dirEnt)
        const rootedGlobMatch = globMatch.startsWith('/')
          ? globMatch
          : `${root}/${globMatch}`
        return minimatch(fullPath, rootedGlobMatch, minimatchOptions)
      })
    }
  }

  if (excludePaths !== undefined) {
    for (const globMatch of excludePaths) {
      myTests.unshift((dirEnt) => {
        const fullPath = makeFullPath(dirEnt)
        const rootedGlobMatch = globMatch.startsWith('/')
          ? globMatch
          : `${root}/${globMatch}`
        return !minimatch(fullPath, rootedGlobMatch, minimatchOptions)
      })
    }
  }
}

const makeFullPath = (dirEnt) => {
  const { parentPath, name } = dirEnt
  let fullPath = fsPath.resolve(parentPath, name)
  if (dirEnt.isDirectory()) {
    fullPath += fsPath.sep
  }

  return fullPath
}

export { addImpliedTests }
