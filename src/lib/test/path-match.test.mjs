/* global describe expect test */
import { minimatch } from 'minimatch'

import { escapeGlob, firstMatchIndex, matchesPathCriteria, normalizePaths, rootGlob } from '../path-match'

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

describe('escapeGlob', () => {
  test('escapes brackets', () => {
    expect(escapeGlob('a[1].js')).toBe('a\\[1\\].js')
  })

  test.each([
    'a[1].js', 'a1.js', 'b{c,d}.js', 'bc.js', 'x(y).js', 'q?.js', 'qq.js', 's*.js', 'st.js',
    'd[x]{y}', '!neg.js', '#c.js', '+(x).js', 'x{1..3}.js'
  ])('%s matches itself', (name) => {
    expect(minimatch('/r/' + name, '/r/' + escapeGlob(name))).toBe(true)
  })

  test('braces do not expand', () => {
    expect(minimatch('/r/ab.js', '/r/' + escapeGlob('a{b,c}.js'))).toBe(false)
    expect(minimatch('/r/a1.js', '/r/' + escapeGlob('a[1].js'))).toBe(false)
  })

  test('windowsPathsNoEscape wraps in brackets', () => {
    expect(escapeGlob('a{b}.js', { windowsPathsNoEscape : true })).toBe('a[{]b[}].js')
  })
})

describe('normalizePaths', () => {
  test('undefined maps to undefined', () => {
    expect(normalizePaths(undefined)).toBeUndefined()
  })

  test('maps entries to globs without mutating input', () => {
    const input = ['*.js', { path : 'a[1].js', literal : true }, { path : 'b[1].js' }, { path : 'c[1].js', literal : false }]
    const copy = JSON.parse(JSON.stringify(input))
    const result = normalizePaths(input, {})
    expect(result).toEqual(['*.js', 'a\\[1\\].js', 'b[1].js', 'c[1].js'])
    expect(result).not.toBe(input)
    expect(input).toEqual(copy)
  })
})
