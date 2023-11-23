/* global afterAll beforeAll describe expect test */
import * as fsPath from 'node:path'
import * as fs from 'node:fs/promises'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { find } from '../find-plus'

const dirDataPath = fsPath.join(__dirname, 'data')

const dirAPath = fsPath.join(dirDataPath, 'dirA')
const fileA1Path = fsPath.join(dirAPath, 'fileA-1.txt')

const dirAAPath = fsPath.join(dirAPath, 'dirAA')
const dirAAAPath = fsPath.join(dirAAPath, 'dirAAA')
const dirAAAAPath = fsPath.join(dirAAAPath, 'dirAAAA')
const fileAAAA1Path = fsPath.join(dirAAAAPath, 'fileAAAA-1.txt')
const dirAABPath = fsPath.join(dirAAPath, 'dirAAB')
const fileAAB1Path = fsPath.join(dirAABPath, 'fileAAB-1.txt')
const dirABPath = fsPath.join(dirAPath, 'dirAB')
const fileAB1Path = fsPath.join(dirABPath, 'fileAB-1.txt')
const dirABAPath = fsPath.join(dirABPath, 'dirABA')
const fileABA1Path = fsPath.join(dirABAPath, 'fileABA-1.txt')

const fifoDir = fsPath.join(dirDataPath, 'dirFIFO')
const fifoPath = fsPath.join(fifoDir, 'fifoA')

const symLinkDir = fsPath.join(dirDataPath, 'dirSymLink')

describe('find', () => {
  test.each([
    [
      { root : dirAAPath },
      'everything',
      [dirAAPath, dirAAAPath, dirAAAAPath, fileAAAA1Path, dirAABPath, fileAAB1Path]
    ],
    // begin 'onlyFiles: true'
    [
      { onlyFiles : true, root : dirAPath },
      'basic files only',
      [fileA1Path, fileAAAA1Path, fileAAB1Path, fileAB1Path, fileABA1Path]
    ],
    // begin 'onlyDirs: true' tests
    [
      { onlyDirs : true, root : dirAPath },
      'basic dirs only',
      [dirAPath, dirAAPath, dirAAAPath, dirAAAAPath, dirAABPath, dirABPath, dirABAPath]
    ],
    [
      { onlyDirs : true, excludeRoot : true, root : dirAPath },
      'basic dirs only, excluding root',
      [dirAAPath, dirAAAPath, dirAAAAPath, dirAABPath, dirABPath, dirABAPath]
    ],
    [{ depth : 1, onlyDirs : true, root : dirAPath }, 'limit to depth 1', [dirAPath, dirAAPath, dirABPath]],
    [
      { depth : 1, onlyDirs : true, excludeRoot : true, root : dirAPath },
      'limit to depth 1 aand exclude root',
      [dirAAPath, dirABPath]],
    [
      { atDepth : true, depth : 1, onlyDirs : true, root : dirAPath },
      "limit to dirs 'atDepth' 1",
      [dirAAPath, dirABPath]
    ],
    [
      { atDepth : true, depth : 2, onlyDirs : true, root : dirAPath },
      "limit to dirs to 'atDepth' 2",
      [dirAAAPath, dirAABPath, dirABAPath]
    ],
    [
      { noTraverseFailed : true, root : dirAPath, tests : [(f) => f.name === 'data' || f.name.endsWith('A')] },
      'traverses passing directories only',
      [dirAPath, dirAAPath, dirAAAPath, dirAAAAPath]
    ],
    [
      { onlyDirs : true, root : dirAPath, tests : [(f) => f.name.indexOf('B') > -1] },
      'traverses failed directories',
      [dirAABPath, dirABPath, dirABAPath]
    ],
    // noDirs
    [{ noDirs : true, root : dirAAPath }, "'noDirs' test", [fileAAAA1Path, fileAAB1Path]],
    // noFiles
    [{ noFiles : true, root : dirAAPath }, "'noFiles' test", [dirAAPath, dirAAAPath, dirAAAAPath, dirAABPath]],
    // sorting tests
    [
      { sort : 'depth', onlyFiles : true, root : dirAPath },
      'basic files only',
      [fileA1Path, fileAB1Path, fileAAB1Path, fileABA1Path, fileAAAA1Path]
    ],
    [
      { sort : 'alpha', onlyFiles : true, root : dirAPath },
      'basic files only',
      [fileAAAA1Path, fileAAB1Path, fileABA1Path, fileAB1Path, fileA1Path]
    ]
  ])('%p %s', async(options, description, expected) => {
    const files = await find(options)
    expect(files).toEqual(expected)
  })

  describe('path matching', () => {
    test.each([
      [{ paths : ['**/dirA/*.txt'] }, [fileA1Path]],
      [{ paths : ['**/data/*'] }, [dirAPath, fifoDir, symLinkDir]],
      [{ excludePaths : ['**/dirA/**'], paths : ['**/data/*'] }, [fifoDir, symLinkDir]],
      [{ paths : ['**/d+(a|t)/*'] }, [dirAPath, fifoDir, symLinkDir]],
      [{ paths : ['**/d@(ata)/*'] }, [dirAPath, fifoDir, symLinkDir]],
      [{ paths : ['**/d*(ata)ata/*'] }, [dirAPath, fifoDir, symLinkDir]],
      [{ paths : ['**/d?ta/*'] }, [dirAPath, fifoDir, symLinkDir]],
      [{ paths : ['**/d+([at])/*'] }, [dirAPath, fifoDir, symLinkDir]]
    ])('%p matches %p', async(options, expected) => {
      options.root = dirDataPath
      const files = await find(options)
      expect(files).toEqual(expected)
    })
  })

  if (process.platform !== 'win32') {
    describe('finding devices', () => {
      const devPath = fsPath.sep + 'dev'
      let allFilesCount, blockDevsCount, charDevsCount, nonSpecialsCount

      beforeAll(async() => {
        const allFiles = await find({ depth : 1, noSort : true, root : devPath })
        const blockDevs = await find({ depth : 1, onlyBlockDevices : true, noSort : true, root : devPath })
        const charDevs = await find({ depth : 1, onlyCharacterDevices : true, noSort : true, root : devPath })
        const nonSpecials = await find({ depth : 1, noSpecials : true, noSort : true, root : devPath })

        allFilesCount = allFiles.length
        blockDevsCount = blockDevs.length
        charDevsCount = charDevs.length
        nonSpecialsCount = nonSpecials.length
      })

      test('onlyBlockDevices finds something in /dev', () => expect(blockDevsCount).toBeGreaterThan(0))

      test('onlyCharacterDevices finds something in /dev', () => expect(charDevsCount).toBeGreaterThan(0))

      test('noSpecials skips both block and character devices in /dev', () => expect(nonSpecialsCount).toBe(allFilesCount - blockDevsCount - charDevsCount))

      test('noBlockDevices skips block devices in /dev', async() => {
        const noBlockDevs = await find({ depth : 1, root : devPath, noBlockDevices : true })
        const noBlockDevCount = noBlockDevs.length
        expect(noBlockDevCount).toBe(allFilesCount - blockDevsCount)
      })

      test('noCharacterDevices skips character devices in /dev', async() => {
        const noCharDevs = await find({ depth : 1, root : devPath, noCharacterDevices : true, noSort : true })
        const noCharDevCount = noCharDevs.length
        expect(noCharDevCount).toBe(allFilesCount - charDevsCount)
      })
    })
  }

  // fifo test
  describe('finding FIFOs', () => {
    let allFilesCount, fifosCount, nonFIFOsCount

    beforeAll(async() => {
      tryExec('mkfifo ' + fifoPath)

      const allFiles = await find({ root : fifoDir, sort : 'none' })
      const fifos = await find({ onlyFIFOs : true, root : fifoDir, sort : 'none' })
      const nonFIFOs = await find({ noFIFOs : true, root : fifoDir, sort : 'none' })

      allFilesCount = allFiles.length
      fifosCount = fifos.length
      nonFIFOsCount = nonFIFOs.length
    })

    afterAll(async() => {
      await fs.rm(fifoPath)
    })

    test('counts FIFO with all files', () => expect(allFilesCount).toBe(4))

    test("'onlyFIFO' counts only FIFO files", () => expect(fifosCount).toBe(1))

    test("'noFIFO' skips FIFO files", () => expect(nonFIFOsCount).toBe(3))
  })

  // TODO: symLink test; no luck after a little googling

  // symlink test
  describe('finding Sockets', () => {
    const symLinkPath = fsPath.join(symLinkDir, 'symLinkA')
    const fileAPath = fsPath.join(symLinkDir, 'fileA.txt')
    let allFilesCount, nonSymLinksCount, symLinksCount

    beforeAll(async() => {
      await fs.symlink(fileAPath, symLinkPath)

      const allFiles = await find({ root : symLinkDir, sort : 'none' })
      const symLinks = await find({ onlySymbolicLinks : true, root : symLinkDir, sort : 'none' })
      const nonSymLinks = await find({ noSymbolicLinks : true, root : symLinkDir, sort : 'none' })

      allFilesCount = allFiles.length
      symLinksCount = symLinks.length
      nonSymLinksCount = nonSymLinks.length
    })

    afterAll(async() => {
      await fs.rm(symLinkPath)
    })

    test('counts symbolic links with all files', () => expect(allFilesCount).toBe(4))

    test("'onlySymbolicLinks' counts only symbolic links", () => expect(symLinksCount).toBe(1))

    test("'noSymbolicLinks' skips symbolic link files", () => expect(nonSymLinksCount).toBe(3))
  })

  test.each([
    [undefined, 'must specify root', /Must provide 'root'/],
    [
      { root : fsPath.join(__dirname, 'some-random-name') },
      'must specify extant root',
      /Did not find.+?some-random-name/
    ],
    [
      { root : fsPath.join(__dirname, 'data', 'dirA', 'dirAB', 'fileAB-1.txt') },
      'root cannot be a file',
      /fileAB-1.txt.+?directory as required/
    ],
    [
      { atDepth : true, root : dirAPath },
      "must specify 'depth' with 'adDepth : true'",
      /Must provide.*depth.+atDepth/
    ],
    [{ onlyFiles : true, onlyDirs : true, root : dirAPath }, "cannot specify multilpe 'only' flags", /multiple 'only'/],
    [
      { onlyFiles : true, noTraverseFailed : true, root : dirAPath },
      "cannot specify multilpe 'only' flags",
      /'only' flag.+?'noTraverseFailed'/
    ],
    [
      { noDirs : true, noTraverseFailed : true, root : dirAPath },
      "'noDirs' and 'noRecurseFail' invalid combination",
      /noDirs.+?noTraverseFailed/
    ],
    [
      { noSpecials : true, noDirs : true, noFiles : true, noSymbolicLinks : true, root : dirAAPath },
      'all "no"s are invalid',
      /all 'no'/
    ],
    [{ sort : 'invalid-sort', root : dirAPath }, 'invalid sort detected', /^Invalid sort/]
  ])('%p %s', async(options, description, regex) => {
    try {
      await find(options)
      throw new Error('did not throw as expected')
    }
    catch (e) {
      expect(e.message).toMatch(regex)
    }
  })
})
