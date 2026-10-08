/* global describe expect test */
import { firstMatchIndex, matchesPathCriteria, rootGlob } from '../path-match'

const absRoot = '/proj'

describe('rootGlob', () => {
  test.each([
    ['a/*.js', '/proj/a/*.js'],
    ['*.js', '/proj/*.js'],
    ['/abs/a.js', '/abs/a.js']
  ])('%s -> %s', (glob, expected) => {
    expect(rootGlob(glob, absRoot)).toBe(expected)
  })
})

describe('firstMatchIndex', () => {
  test.each([
    ['/proj/a.js', ['*.txt', '*.js', 'a.*'], 1],
    ['/proj/a.js', ['*.txt', '*.md'], -1],
    ['/proj/a.js', [], -1],
    ['/other/a.js', ['*.txt', '/other/*.js'], 1]
  ])('%s in %j -> %d', (fullPath, globs, expected) => {
    expect(firstMatchIndex(fullPath, globs, { absRoot })).toBe(expected)
  })
})

describe('matchesPathCriteria', () => {
  test.each([
    ['no criteria', '/proj/a.js', {}, true],
    ['union, first entry', '/proj/a.js', { paths : ['a.js', 'b.js'] }, true],
    ['union, second entry', '/proj/b.js', { paths : ['a.js', 'b.js'] }, true],
    ['union, no entry', '/proj/c.js', { paths : ['a.js', 'b.js'] }, false],
    ['exclude overrides include', '/proj/a.js', { paths : ['*.js'], excludePaths : ['a.js'] }, false],
    ['exclude only, no match', '/proj/b.js', { excludePaths : ['a.js'] }, true],
    ['empty paths', '/proj/a.js', { paths : [] }, true],
    ['directory with trailing slash', '/proj/dir/', { paths : ['dir'] }, true]
  ])('%s', (desc, fullPath, criteria, expected) => {
    expect(matchesPathCriteria(fullPath, { absRoot, ...criteria })).toBe(expected)
  })
})
