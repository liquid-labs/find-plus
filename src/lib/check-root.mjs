import { stat } from 'node:fs/promises'
import * as fsPath from 'node:path'

const checkRoot = async ({ root }) => {
  const rootStat = await stat(root, { throwIfNoEntry : false })
  if (rootStat === undefined) {
    const e = new Error(`Did not find root directory at: ${root}`)
    e.code = 'ENOENT'
    throw e
  }
  else if (!rootStat.isDirectory()) {
    throw new Error(`Root '${root}' does not point to a directory as required.`)
  }

  rootStat.parentPath = fsPath.dirname(root)
  rootStat.name = fsPath.basename(root)
  rootStat.depth = 0

  return rootStat
}

export { checkRoot }
