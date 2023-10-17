const addImpliedTests = ({
  atDepth,
  depth,
  myTests,
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
  if (atDepth === true) {
    myTests.unshift((f, currDepth) => currDepth === depth)
  }

  if (onlyDirs === true) {
    myTests.unshift((f) => f.isDirectory())
  }
  else if (onlyFiles === true) {
    myTests.unshift((f) => f.isFile())
  }
  else if (onlyBlockDevices === true) {
    myTests.unshift((f) => f.isBlockDevice())
  }
  else if (onlyCharacterDevices === true) {
    myTests.unshift((f) => f.isCharacterDevice())
  }
  else if (onlyFIFOs === true) {
    myTests.unshift((f) => f.isFIFO())
  }
  else if (onlySockets === true) {
    myTests.unshift((f) => f.isSocket())
  }
  else if (onlySymbolicLinks === true) {
    myTests.unshift((f) => f.isSymbolicLink())
  }

  if (noDirs === true) {
    myTests.unshift((f) => !f.isDirectory())
  }
  if (noFiles === true) {
    myTests.unshift((f) => !f.isFile())
  }
  if (noBlockDevices === true) {
    myTests.unshift((f) => !f.isBlockDevice())
  }
  if (noCharacterDevices === true) {
    myTests.unshift((f) => !f.isCharacterDevice())
  }
  if (noFIFOs === true) {
    myTests.unshift((f) => !f.isFIFO())
  }
  if (noSockets === true) {
    myTests.unshift((f) => !f.isSocket())
  }
  if (noSymbolicLinks === true) {
    myTests.unshift((f) => !f.isSymbolicLink())
  }
}

export { addImpliedTests }
