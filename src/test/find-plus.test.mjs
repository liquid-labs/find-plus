/* global afterAll beforeAll describe expect test */
import * as fs from 'node:fs/promises'
import * as net from 'node:net'
import * as fsPath from 'node:path'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { find } from '../find-plus'

const dirDataPath = fsPath.join(__dirname, 'data') + fsPath.sep

const dirAPath = fsPath.join(dirDataPath, 'dirA') + fsPath.sep
const fileA1Path = fsPath.join(dirAPath, 'fileA-1.txt')

const dirAAPath = fsPath.join(dirAPath, 'dirAA') + fsPath.sep
const dirAAAPath = fsPath.join(dirAAPath, 'dirAAA') + fsPath.sep
const dirAAAAPath = fsPath.join(dirAAAPath, 'dirAAAA') + fsPath.sep
const fileAAAA1Path = fsPath.join(dirAAAAPath, 'fileAAAA-1.txt')
const dirAABPath = fsPath.join(dirAAPath, 'dirAAB') + fsPath.sep
const fileAAB1Path = fsPath.join(dirAABPath, 'fileAAB-1.txt')
const dirABPath = fsPath.join(dirAPath, 'dirAB') + fsPath.sep
const fileAB1Path = fsPath.join(dirABPath, 'fileAB-1.txt')
const dirABAPath = fsPath.join(dirABPath, 'dirABA') + fsPath.sep
const fileABA1Path = fsPath.join(dirABAPath, 'fileABA-1.txt')

const fifoDir = fsPath.join(dirDataPath, 'dirFIFO') + fsPath.sep
const fifoPath = fsPath.join(fifoDir, 'fifoA')

const symLinkDir = fsPath.join(dirDataPath, 'dirSymLink') + fsPath.sep

const socketDirPath = fsPath.join(dirDataPath, 'dirSocket') + fsPath.sep
const socketAPath = fsPath.join(socketDirPath, 'socketA')

describe('find', () => {
  describe('non-path search options', () => {
    test.each([
      [
        { root : dirAAPath },
        'everything',
        [dirAAPath, dirAAAPath, dirAABPath, dirAAAAPath, fileAAB1Path, fileAAAA1Path]
      ],
      [
        { root : dirAAPath + fsPath.sep },
        'handles root with trailing ' + fsPath.sep,
        [dirAAPath, dirAAAPath, dirAABPath, dirAAAAPath, fileAAB1Path, fileAAAA1Path]
      ],
      // begin 'onlyFiles: true'
      [
        { onlyFiles : true, root : dirAPath },
        'basic files only',
        [fileA1Path, fileAB1Path, fileAAB1Path, fileABA1Path, fileAAAA1Path]
      ],
      // begin 'onlyDirs: true' tests
      [
        { onlyDirs : true, root : dirAPath },
        'basic dirs only',
        [dirAPath, dirAAPath, dirABPath, dirAAAPath, dirAABPath, dirABAPath, dirAAAAPath]
      ],
      [
        { onlyDirs : true, excludeRoot : true, root : dirAPath },
        'basic dirs only, excluding root',
        [dirAAPath, dirABPath, dirAAAPath, dirAABPath, dirABAPath, dirAAAAPath]
      ],
      [{ depth : 1, onlyDirs : true, root : dirAPath }, 'limit to depth 1', [dirAPath, dirAAPath, dirABPath]],
      [
        { depth : 1, onlyDirs : true, excludeRoot : true, root : dirAPath },
        'limit to depth 1 aand exclude root',
        [dirAAPath, dirABPath]
      ],
      // leavesOnly
      [
        { leavesOnly : true, depth : 0, onlyDirs : true, root : dirAPath },
        "limit to dirs 'leavesOnly' 0",
        [dirAPath]
      ],
      [
        { leavesOnly : true, depth : 1, onlyDirs : true, root : dirAPath },
        "limit to dirs 'leavesOnly' 1",
        [dirAAPath, dirABPath]
      ],
      [
        { leavesOnly : true, depth : 2, onlyDirs : true, root : dirAPath },
        "limit to dirs to 'leavesOnly' 2",
        [dirAAAPath, dirAABPath, dirABAPath]
      ],
      // noDirs
      [{ noDirs : true, root : dirAAPath }, "'noDirs' test", [fileAAB1Path, fileAAAA1Path]],
      // noFiles
      [{ noFiles : true, root : dirAAPath }, "'noFiles' test", [dirAAPath, dirAAAPath, dirAABPath, dirAAAAPath]],
      // sorting tests
      [
        { sort : 'depth', onlyFiles : true, root : dirAPath },
        'basic files only',
        [fileA1Path, fileAAAA1Path, fileAAB1Path, fileAB1Path, fileABA1Path]
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
  })

  describe('path matching', () => {
    test.each([
      // regular '**', '*', and '?' glob matching
      [{ paths : ['**/dirA/*.txt'] }, [fileA1Path]],
      [{ paths : ['**/dirA/'] }, [dirAPath]],
      [{ paths : ['**/dirA'] }, [dirAPath]],
      [{ paths : ['dirA/'] }, [dirAPath]],
      [{ paths : ['dirA'] }, [dirAPath]],
      [{ paths : ['di?A/'] }, [dirAPath]],
      [{ paths : ['d*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['d*/'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['d?r*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      // extglob syntax
      [{ paths : ['d+(i|r)*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['d@(ir)*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['d*(ir)*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ paths : ['d+([ir])*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      // additional tests with different roots
      [{ root : '.', paths : ['test/data/dirA/*.txt'] }, [fileA1Path]],
      [{ root : process.cwd(), paths : ['test/data/dirA/*.txt'] }, [fileA1Path]],
      [{ root : '.', paths : ['**/test/data/*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ root : './', paths : ['**/test/data/*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ root : 'test/data/', paths : ['*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      [{ root : 'test/data', paths : ['*'] }, [dirAPath, fifoDir, socketDirPath, symLinkDir]],
      // excludePaths
      [{ excludePaths : ['**/dirA/**'], paths : ['*'] }, [fifoDir, socketDirPath, symLinkDir]],
      // includes matching paths below excluded directory
      [{ excludePaths : ['dirA/'], paths : ['dirA/**'], onlyDirs : true }, [dirAAPath, dirABPath, dirAAAPath, dirAABPath, dirABAPath, dirAAAAPath]],
      // absolute paths
      [{ paths : [`${dirDataPath}/**/dirA/*.txt`] }, [fileA1Path]],
      // handles incongruent root and paths
      [{ paths : ['/blah/blah/blah/**'] }, []]
    ])('%p matches %p', async(options, expected) => {
      options.root = options.root || dirDataPath
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

  describe('file types', () => {
    let server
    const symLinkPath = fsPath.join(symLinkDir, 'symLinkA')
    const fileAPath = fsPath.join(symLinkDir, 'fileA.txt')

    beforeAll(async() => {
      tryExec('mkfifo ' + fifoPath)

      server = net.createServer((c) => {})
      server.listen(socketAPath, () => {})

      await fs.symlink(fileAPath, symLinkPath)
    })

    afterAll(async() => {
      await fs.rm(fifoPath)

      await server.close()

      await fs.rm(symLinkPath)
    })

    // fifo test
    test('counts FIFO with all files', async() => {
      const allFiles = await find({ root : fifoDir, sort : 'none' })
      expect(allFiles).toHaveLength(4)
    })

    test("'onlyFIFO' counts only FIFO files", async() => {
      const fifos = await find({ onlyFIFOs : true, root : fifoDir, sort : 'none' })
      expect(fifos).toHaveLength(1)
    })

    test("'noFIFO' skips FIFO files", async() => {
      const nonFIFOs = await find({ noFIFOs : true, root : fifoDir, sort : 'none' })
      expect(nonFIFOs).toHaveLength(3)
    })

    // socket tests
    test('counts Socket with all files', async() => {
      const allFiles = await find({ root : socketDirPath })
      expect(allFiles).toHaveLength(3) // the root and two files
    })

    test("'onlySockets' counts only socket files", async() => {
      const socketFiles = await find({ root : socketDirPath, onlySockets : true })
      expect(socketFiles).toEqual([socketAPath])
    })

    test("'noSockets' skips files", async() => {
      const noSocketFiles = await find({ root : socketDirPath, noSockets : true })
      expect(noSocketFiles).toEqual([socketDirPath, fsPath.join(socketDirPath, 'fileA.txt')])
    })

    // symlink test
    test('counts symbolic links with all files', async() => {
      const allFiles = await find({ root : symLinkDir, sort : 'none' })
      expect(allFiles).toHaveLength(4)
    })

    test("'onlySymbolicLinks' counts only symbolic links", async() => {
      const symLinks = await find({ onlySymbolicLinks : true, root : symLinkDir, sort : 'none' })
      expect(symLinks).toHaveLength(1)
    })

    test("'noSymbolicLinks' skips symbolic link files", async() => {
      const nonSymLinks = await find({ noSymbolicLinks : true, root : symLinkDir, sort : 'none' })
      expect(nonSymLinks).toHaveLength(3)
    })

    // onlySpecials test
    test("'onlySpecials' ignores dirs, files, and symlinks", async() => {
      const onlySpecials = await find({ root : dirDataPath, excludePaths : ['dirA/**'], onlySpecials : true })
      expect(onlySpecials).toEqual([fifoPath, socketAPath])
    })
  })

  describe('argument errors', () => {
    test.each([ // error conditions
      [{ root : undefined }, 'must specify root', /The 'root' must be explicitly set,/],
      [{ root : null }, 'must specify root', /The 'root' must be explicitly set,/],
      [{ root : '' }, 'must specify root', /The 'root' must be explicitly set,/],
      [
        { root : fsPath.join(__dirname, 'some-random-name') },
        'must specify extant root',
        /^Did not find root directory at: .+some-random-name$/
      ],
      [
        { root : fsPath.join(__dirname, 'data', 'dirA', 'dirAB', 'fileAB-1.txt') },
        'root cannot be a file',
        /fileAB-1.txt.+?directory as required/
      ],
      [
        { leavesOnly : true, root : dirAPath },
        "must specify 'depth' with 'leavesOnly : true'",
        /Must provide.*depth.+leavesOnly/
      ],
      [{ onlyFiles : true, onlyDirs : true, root : dirAPath }, "cannot specify multilpe 'only' flags", /multiple 'only'/],
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
})
