import * as fsPath from 'node:path'

const breadthFirstSorter = (a, b) => {
  if (a.depth < b.depth) {
    return -1
  }
  else if (a.depth > b.depth) {
    return 1
  }
  else {
    const pathCompare = a.parentPath.localeCompare(b.paretPath)
    return pathCompare === 0 ? 0 : a.name.localeCompare(b.name)
  }
}

const depthFirstSorter = (a, b) => {
  const aDir = a.isDirectory() ? fsPath.join(a.parentPath, a.name) : a.parentPath
  const bDir = b.isDirectory() ? fsPath.join(b.parentPath, b.name) : b.parentPath

  const dirComp = aDir.localeCompare(bDir)
  return dirComp !== 0 ? dirComp : a.name.localeCompare(b.name)
}

const alphaSorter = (a, b) => {
  const aPath = fsPath.join(a.parentPath, a.name)
  const bPath = fsPath.join(b.parentPath, b.name)

  return aPath.localeCompare(bPath)
}

const validSorts = {
  alpha: alphaSorter,
  breadth: breadthFirstSorter,
  depth: depthFirstSorter,
  none: undefined,
}

export { alphaSorter, breadthFirstSorter, depthFirstSorter, validSorts }
