import { addImpliedTests } from './lib/add-implied-tests'
import { dirEntToFilePath } from './lib/dir-ent-to-file-path'
import { validSorts } from './lib/sorters'
import { traverseDirs } from './lib/traverse-dirs'
import { verifyParams } from './lib/verify-params'

const find = async(params = {}) => {
  // we do this first so the values are correct for 'verifyParams'
  if (params.noSpecials === true) {
    params.noBlockDevices = true
    params.noCharacterDevices = true
    params.noFIFOs = true
    params.noSockets = true
  }

  const {
    root,
    sort = 'breadth',
    tests = []
  } = params

  verifyParams(params)

  const myTests = [...tests]
  addImpliedTests({ ...params, myTests })

  // params need to come first, we override root and tests
  const matchedFiles = await traverseDirs({ ...params, root, tests : myTests })

  // results in depth-first sort of full directory paths
  if (sort !== 'none') {
    const sorter = validSorts[sort]
    matchedFiles.sort(sorter)
  }

  const result = matchedFiles.map(dirEntToFilePath)

  return result
}

export { find }
