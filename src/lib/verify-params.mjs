const validSorts = ['alpha', 'breadth', 'depth', 'none']

const verifyParams = ({
  root,
  depth,
  leavesOnly,
  noBlockDevices,
  noCharacterDevices,
  noDirs,
  noFIFOs,
  noFiles,
  noSockets,
  noSymbolicLinks,
  onlyBlockDevices,
  onlyCharacterDevices,
  onlyDirs,
  onlyFIFOs,
  onlyFiles,
  onlySockets,
  onlySymbolicLinks,
  sort
}) => {
  // additional 'root' constraints checked by 'checkRoot' invoked from 'traverseDirs'
  if (!root) {
    throw new Error("The 'root' must be explicitly set, and may not be the empty string.")
  }

  // check for confliction options
  if (leavesOnly === true && depth === undefined) {
    throw new Error("Must provide an explicit 'depth' when 'leavesOnly' is 'true'.")
  }
  let onlyCount = 0
  for (const flag of [
    onlyBlockDevices,
    onlyCharacterDevices,
    onlyDirs,
    onlyFIFOs,
    onlyFiles,
    onlySockets,
    onlySymbolicLinks
  ]) {
    if (flag === true) {
      onlyCount += 1
    }
  }
  if (onlyCount > 1) {
    throw new Error("Cannot specify multiple 'only' flags; nothing would be selected.")
  }

  let noCount = 0
  const noFlags = [noBlockDevices, noCharacterDevices, noDirs, noFIFOs, noFiles, noSockets, noSymbolicLinks]
  for (const flag of noFlags) {
    if (flag === true) {
      noCount += 1
    }
  }
  if (noCount === noFlags.length) {
    throw new Error("Cannot set all 'no' flags to true; nothing would be searched.")
  }

  if (sort !== undefined && !validSorts.includes(sort)) {
    throw new Error(`Invalid sort '${sort}'; must be one of: '${validSorts.join("', '")}'`)
  }
}

export { verifyParams }
