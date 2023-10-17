import * as fsPath from 'node:path'

const breadthFirstSorter = (a, b) => {
  const aDir = a.isDirectory() ? fsPath.join(a.path, a.name) : a.path
  const bDir = b.isDirectory() ? fsPath.join(b.path, b.name) : a.path

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
    const pathCompare = a.path.localeCompare(b.path)
    return pathCompare === 0 ? 0 : a.name.localeCompare(b.name)
  }
}

const alphaSorter = (a, b) => {
  const aPath = fsPath.join(a.path, a.name)
  const bPath = fsPath.join(b.path, b.name)

  return aPath.localeCompare(bPath)
}

export { alphaSorter, breadthFirstSorter, depthFirstSorter }
