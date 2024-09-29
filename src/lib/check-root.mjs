import { stat } from 'node:fs/promises'
import * as fsPath from 'node:path'

import { addFieldsToFile } from './add-fields-to-file'

const checkRoot = async({ absRoot, root }) => {
  let rootStat
  try {
    rootStat = await stat(root, { throwIfNoEntry : false })
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      const newE = new Error(`Did not find root directory at: ${root}`, { cause : e })
      newE.code = 'ENOENT'
      throw newE
    } // else
    throw (e)
  }

  if (!rootStat.isDirectory()) {
    throw new Error(`Root '${root}' does not point to a directory as required.`)
  }

  rootStat.name = fsPath.basename(absRoot)
  addFieldsToFile(rootStat, { absRoot, depth : 0, parentPath : fsPath.dirname(absRoot) })

  return rootStat
}

export { checkRoot }
