import { resolve as resolvePath } from 'node:path'

const addFieldsToFile = (file, { absRoot, depth, parentPath }) => {
  file.depth = depth

  // node 19.x DirEnt's lack parentPath
  if (file.parentPath === undefined) {
    file.parentPath = parentPath
  }

  file.absPath = resolvePath(parentPath, file.name)
  if (file.absPath.startsWith(absRoot)) {
    file.relPath = file.absPath.slice(absRoot.length)
    if (file.relPath.endsWith('/')) {
      file.relPath = file.relPath.slice(0, -1)
    }
    if (file.relPath === '') {
      file.relPath = '.'
    }
  }
  else {
    file.relPath = null
  }

  return file
}

export { addFieldsToFile }
