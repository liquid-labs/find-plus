import { statSync } from 'node:fs'

const checkRoot = ({ root }) => {
  const rootStat = statSync(root, { throwIfNoEntry : false })
  if (rootStat === undefined) {
    const e = new Error(`Did not find root directory at: ${root}`)
    e.code = 'ENOENT'
    throw e
  }
  else if (!rootStat.isDirectory()) {
    throw new Error(`Root '${root}' does not point to a directory as required.`)
  }

  return rootStat
}

export { checkRoot }
