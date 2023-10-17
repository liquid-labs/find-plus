import * as fsPath from 'node:path'

const getDirEntName = (dirEnt) => {
  if (dirEnt.path !== undefined) {
    return fsPath.join(dirEnt.path, dirEnt.name)
  }
  else {
    return dirEnt.name
  }
}

export { getDirEntName }
