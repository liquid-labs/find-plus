const verifyParams = ({
  atDepth,
  depth,
  noBlockDevices,
  noCharacterDevices,
  noDirs,
  noFIFOs,
  noFiles,
  noRecurseFailed,
  noSockets,
  noSymbolicLinks,
  onlyBlockDevices,
  onlyCharacterDevices,
  onlyDirs,
  onlyFIFOs,
  onlyFiles,
  onlySockets,
  onlySymbolicLinks
}) => {
  // check for confliction options
  if (atDepth === true && depth === undefined) {
    throw new Error("Must provide an explicit 'depth' when 'atDepth' is 'true'.")
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
  if (onlyCount > 0 && noRecurseFailed === true && onlyDirs !== true) {
    throw new Error("Cannot set an 'only' flag (other than 'onlyDirs') and 'noRecurseFailed' true; no directories would be searched.")
  }
  if (noDirs === true && noRecurseFailed === true) {
    throw new Error("Cannot set 'noDirs' and 'noRecurseFailed' both true; nothing would be searched.")
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
}

export { verifyParams }
