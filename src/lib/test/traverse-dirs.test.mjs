/* global describe test */ // TODO: this should not be necessary; verify fixed in next format and lint upgrade and remove
import { dirname, join as pathJoin, sep as pathSep } from 'node:path'

import { addImpliedTests } from '../add-implied-tests'
import { traverseDirs } from '../traverse-dirs'

const testStagingRoot = dirname(dirname(__dirname))
const dirData = pathJoin(testStagingRoot, 'test', 'data') + pathSep
const absDataPattern = '/**/test-staging/test/data/'

describe('traverseDirs', () => {
  describe('skips impossible directories', () => {
    test.each([
      // relative path excludes
      [{ excludePaths : ['dir[F|S]*/**'] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ excludePaths : ['dir[F|S]*/**', 'dirA/*/**'] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ excludePaths : ['dir[F|S]*/**', 'dirA/dir*/*.txt'] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ excludePaths : ['dir[F|S]*/**', 'dirA/*/*.txt'] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      // non-excluding paths
      [{ excludePaths : ['dir[F|S]*'] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      // absolute path excludes (note, dirData already has the trailing separator)
      [{ excludePaths : [`${dirData}dir[F|S]*/**`] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ excludePaths : [`${dirData}dir[F|S]*/**`, `${dirData}dirA/dir*/**`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ excludePaths : [`${dirData}dir[F|S]*/**`, `${dirData}dirA/*/**`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ excludePaths : [`${absDataPattern}dir[F|S]*/**`] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ excludePaths : [`${absDataPattern}dir[F|S]*/**`, `${absDataPattern}dirA/dir*/**`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      // exclude based on no possible 'paths' match (relative)
      [{ paths : ['dirA/*.txt'] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : ['dir?/*.txt'] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : ['dirA*/*.txt'] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : ['dirA*/'] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      // absolute paths
      [{ paths : [`${dirData}dirA/*.txt`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : [`${dirData}dir?/*.txt`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : [`${dirData}dirA*/*.txt`] }, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ paths : [`${dirData}dirA*/`] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      // '**' edge case (rel)
      [{ paths : ['dirA**'] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ paths : ['dirF**'] }, ['/dirA', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirFIFO']],
      [{ paths : ['dir**'] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      // '**' edge case (abs)
      [{ paths : [`${dirData}dirA**`] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ paths : [`${dirData}dirF**`] }, ['/dirA', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirFIFO']],
      [{ paths : [`${dirData}dir**`] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      // '**' quick bailouts
      [{ paths : ['**'] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      [{ paths : ['/**/'] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      [{ paths : [`${dirData}**`] }, [], ['/dirA', '/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB']],
      [{ paths : [`${dirData}dirA/**`] }, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']]
    ])("pattern '%s' skips dir '%s'", async(options, skipped, traversed) => {
      const _traversedDirs = []
      options._traversedDirs = _traversedDirs
      options.root = 'test/data'

      const myTests = []
      addImpliedTests({ ...options, myTests })
      options.tests = myTests

      await traverseDirs(options)

      for (const dir of _traversedDirs) {
        if (skipped.some((s) => dir.includes(s))) {
          throw new Error(`Dir '${dir}' should have been skipped.`)
        }
      }

      for (const dir of traversed) {
        if (!_traversedDirs.some((d) => d.includes(dir))) {
          throw new Error(`Did not find expected traversed dir '${dir}'.`)
        }
      }
    })
  })
})
