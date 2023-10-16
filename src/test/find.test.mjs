/* global describe expect test */
import * as fsPath from 'node:path'

import { find } from '../find-plus'

const dirAPath = fsPath.join(__dirname, 'data', 'dirA')
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

describe('find', () => {
  test.each([
    [ 
      { root: dirAAPath },
      'everything', 
      [ dirAAPath, dirAAAPath, dirAAAAPath, fileAAAA1Path, dirAABPath, fileAAB1Path ]
    ],
    // begin 'onlyFiles: true'
    [
      { onlyFiles : true, root : dirAPath },
      'basic files only',
      [fileA1Path, fileAAAA1Path, fileAAB1Path, fileAB1Path, fileABA1Path]
    ],
    // begin 'dirOnly: true' tests
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
      { noRecurseFailed : true, root : dirAPath, tests : [(f) => f.name === 'data' || f.name.endsWith('A')] },
      'traverses passing directories only',
      [dirAPath, dirAAPath, dirAAAPath, dirAAAAPath]
    ],
    [
      { onlyDirs : true, root : dirAPath, tests : [(f) => f.name.indexOf('B') > -1] },
      'traverses failed directories',
      [dirAABPath, dirABPath, dirABAPath]
    ],
    // sorting tests
    [
      { depthFirstSort: true, onlyFiles : true, root : dirAPath },
      'basic files only',
      [fileA1Path, fileAB1Path, fileAAB1Path, fileABA1Path, fileAAAA1Path ]
    ],
  ])('%p %s', async(options, description, expected) => {
    const files = await find(options)
    expect(files).toEqual(expected)
  })

  if (process.platform !== 'win32') {
    test('blockDevicesOnly finds something in /dev', async () => {
      const devPath = fsPath.sep + 'dev'
      const files = await find({ depth: 1, onlyBlockDevices: true, root: devPath })
      expect(files.length).toBeGreaterThan(0)
    })

    test('characterDevicesOnly finds something in /dev', async () => {
      const devPath = fsPath.sep + 'dev'
      const files = await find({ depth: 1, onlyCharacterDevices: true, root: devPath })
      expect(files.length).toBeGreaterThan(0)
    })
  }

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
    [ { onlyFiles: true, onlyDirs: true, root: dirAPath }, "cannot specify multilpe 'only' flags", /multiple 'only'/ ],
    [ 
      { onlyFiles: true, noRecurseFailed: true, root: dirAPath }, 
      "cannot specify multilpe 'only' flags",
      /'only' flag.+?'noRecurseFailed'/
    ]
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
