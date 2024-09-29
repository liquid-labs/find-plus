import { resolve as resolvePath } from 'node:path'

const addFieldsToFile = (file, { absRoot, depth, parentPath }) => {
  file.depth = depth

  // node 19.x DirEnt's lack parentPath
  if (file.parentPath === undefined) {
    file.parentPath = parentPath
  }

  file.absPath = resolvePath(parentPath, file.name)

  // we can assume that `file.absPath.startsWith(absRoot) === true` because it's simply not possible to match files 
  // outside of the root
  file.relPath = file.absPath.slice(absRoot.length)
  if (file.relPath.startsWith('/')) {
    file.relPath = file.relPath.slice(1)
  }
  if (file.relPath === '') {
    file.relPath = '.'
  }

  return file
}

export { addFieldsToFile }
