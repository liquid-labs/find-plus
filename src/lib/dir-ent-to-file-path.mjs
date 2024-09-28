import { resolve, sep } from 'node:path'

const dirEntToFilePath = (dirEnt) => {
  const { name, parentPath } = dirEnt
  const absPath = resolve(parentPath, name)

  return dirEnt.isDirectory() ? absPath + sep : absPath
}

export { dirEntToFilePath }