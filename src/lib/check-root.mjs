import { stat } from 'node:fs/promises'
import * as fsPath from 'node:path'

const checkRoot = async ({ root }) => {
  let rootStat
  try {
    rootStat = await stat(root, { throwIfNoEntry : false })
    if (rootStat === undefined) {
      const newE = new Error(`Did not find root directory at: ${root}`)
      newE.code = 'ENOENT'
      throw newE
    }
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      const newE = new Error(`Did not find root directory at: ${root}`, { cause: e })
      newE.code = 'ENOENT'
      throw newE
    } // else
    throw (e)
  }


  if (!rootStat.isDirectory()) {
    throw new Error(`Root '${root}' does not point to a directory as required.`)
  }

  rootStat.parentPath = fsPath.dirname(root)
  rootStat.name = fsPath.basename(root)
  rootStat.depth = 0

  return rootStat
}

export { checkRoot }
