import * as fsPath from 'node:path'

import { getDirEntName } from './get-dirent-name'

const breadthFirstSorter = (a, b) => {
  const aDir = a.isDirectory() ? getDirEntName(a) : a.path || fsPath.dirname(a.name)
  const bDir = b.isDirectory() ? getDirEntName(b) : a.path || fsPath.dirname(b.name)

  const dirComp = aDir.localeCompare(bDir)
  return dirComp !== 0 ? dirComp : a.name.localeCompare(b.name)
}

const depthFirstSorter = (a, b) => {
  if (a.depth < b.depth) {
    return -1
  }
  else if (a.depth > b.depth) {
    return 1
  }
  else {
    const aPath = a.path || fsPath.dirname(a.name)
    const bPath = b.path || fsPath.dirname(b.name)
    const pathCompare = aPath.localeCompare(bPath)
    return pathCompare === 0 ? 0 : a.name.localeCompare(b.name)
  }
}

const alphaSorter = (a, b) => {
  const aPath = getDirEntName(a)
  const bPath = getDirEntName(b)

  return aPath.localeCompare(bPath)
}

export { alphaSorter, breadthFirstSorter, depthFirstSorter }
