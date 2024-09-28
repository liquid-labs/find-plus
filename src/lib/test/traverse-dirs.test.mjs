import { addImpliedTests } from '../add-implied-tests'
import { traverseDirs } from '../traverse-dirs'

describe('traverseDirs', () => {
  describe('skips impossible directories', () => {
    test.each([
      // [{ paths: ['dirA/*.txt'], ['/dirAA', '/dirAB', '/dirFIFO', '/dirSymLink'], ['/dirA']]
      [{ excludePaths: ['dir[F|S]*']}, ['/dirFIFO', '/dirSymLink'], ['/dirA', '/dirAA', '/dirAB']],
      [{ excludePaths: ['dir[F|S]*', 'dirA/dir*']}, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']],
      [{ excludePaths: ['dir[F|S]*', 'dirA/*/']}, ['/dirFIFO', '/dirSymLink', '/dirAA', '/dirAB'], ['/dirA']]
    ])("pattern '%s' skips dir '%s'", async (options, skipped, traversed) => {
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