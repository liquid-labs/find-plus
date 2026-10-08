/* global afterAll beforeAll describe expect test */
import * as fsp from 'node:fs/promises'
import * as os from 'node:os'
import * as fsPath from 'node:path'

import { find, isIncluded } from '../find-plus'

describe('isIncluded', () => {
  test.each([
    [{ root : '/proj', excludePaths : ['*/.git/*'] }, 'repo/.git/config', false],
    [{ root : '/proj', excludePaths : ['*/.git/*'] }, 'repo/src/a.js', true],
    [{ root : '/proj', excludePaths : ['**/node_modules/**'] }, 'a/node_modules/x/index.js', false]
  ])('exclusion %j on %s -> %s', (options, path, expected) => {
    expect(isIncluded(path, options)).toBe(expected)
  })

  test.each([
    [{ paths : ['a[1].js'] }, 'a1.js', true],
    [{ paths : ['a[1].js'] }, 'a[1].js', false],
    [{ paths : [{ path : 'a[1].js', literal : true }] }, 'a[1].js', true],
    [{ paths : [{ path : 'a[1].js', literal : true }] }, 'a1.js', false],
    [{ excludePaths : ['*.js'] }, 'a[1].js', false],
    [{ excludePaths : [{ path : 'a[1].js', literal : true }] }, 'a[1].js', false],
    [{ excludePaths : [{ path : 'a[1].js', literal : true }] }, 'a1.js', true],
    [{ excludePaths : ['x.js', { path : 'a[1].js', literal : true }] }, 'a[1].js', false],
    [{ paths : ['b{c,d}.js'] }, 'b{c,d}.js', false],
    [{ paths : ['b{c,d}.js'] }, 'bc.js', true]
  ])('subject literal, criteria glob %j on %s -> %s', (options, path, expected) => {
    expect(isIncluded(path, { root : '/proj', ...options })).toBe(expected)
  })

  test.each([
    [{ paths : ['*'] }, '.env', false],
    [{ paths : ['*'], minimatchOptions : { dot : true } }, '.env', true],
    [{ excludePaths : ['**/.*'] }, '.env', false],
    [{ excludePaths : ['**/.*'] }, 'env', true]
  ])('dotfiles %j on %s -> %s', (options, path, expected) => {
    expect(isIncluded(path, { root : '/proj', ...options })).toBe(expected)
  })

  test.each([
    [{ paths : ['!(*.js)'] }, 'a.txt', true],
    [{ paths : ['!(*.js)'] }, 'a.js', false],
    // a leading '!' is not whole-pattern negation because relative patterns are anchored under root; see
    // plan/notes/minimatch-escape-behavior.md
    [{ paths : ['!a.js'] }, '!a.js', true],
    [{ paths : ['!a.js'] }, 'b.js', false]
  ])('negation %j on %s -> %s', (options, path, expected) => {
    expect(isIncluded(path, { root : '/proj', ...options })).toBe(expected)
  })

  test.each([
    [{ root : '/proj', paths : ['src/*.js'] }, 'src/a.js', true],
    [{ root : '/proj', paths : ['src/*.js'] }, '/proj/src/a.js', true],
    [{ root : '/proj', paths : ['/proj/src/*.js'] }, 'src/a.js', true],
    [{ root : '/proj', paths : ['*.js'] }, '../outside.js', false]
  ])('absolute/relative %j on %s -> %s', (options, path, expected) => {
    expect(isIncluded(path, options)).toBe(expected)
  })

  test.each(['.', 'some/rel'])("relative root '%s' resolves against cwd", (root) => {
    const abs = fsPath.resolve(root)
    expect(isIncluded(fsPath.join(abs, 'x.js'), { root, paths : ['*.js'] })).toBe(true)
    expect(isIncluded('x.js', { root, paths : [fsPath.join(abs, '*.js')] })).toBe(true)
    expect(isIncluded('x.js', { root, paths : [fsPath.join(abs, 'other', '*.js')] })).toBe(false)
  })

  test.each([
    ['dirA/', ['dirA/'], true],
    ['dirA', ['dirA/'], false],
    ['dirA/', ['dirA'], true]
  ])('directory %s with paths %j -> %s', (path, paths, expected) => {
    expect(isIncluded(path, { root : '/proj', paths })).toBe(expected)
  })

  test.each([
    ['src/.hidden/y.js', false],
    ['src/.hidden/', false],
    ['src/x.js', false],
    ['other/.hidden/y.js', true]
  ])("excludePaths ending in '/**' prunes dotted descendants: %s -> %s", (path, expected) => {
    expect(isIncluded(path, { root : '/proj', excludePaths : ['src/**'] })).toBe(expected)
  })

  test('works with nonexistent paths and does not touch the filesystem', () => {
    const root = `/definitely/not/a/real/dir-${Math.random()}`
    expect(isIncluded('nope/a.js', { root, paths : ['nope/*.js'] })).toBe(true)
    expect(isIncluded('nope/a.txt', { root, paths : ['nope/*.js'] })).toBe(false)
    expect(isIncluded('nope/a.js', { root, excludePaths : ['**/*.js'] })).toBe(false)
  })

  test('no criteria includes everything', () => {
    expect(isIncluded('anything', { root : '/r' })).toBe(true)
    expect(isIncluded('anything', { root : '/r', paths : [] })).toBe(true)
  })

  test('errors', () => {
    expect(() => isIncluded('a.js', {})).toThrow(/The 'root' must be explicitly set,/)
    expect(() => isIncluded(undefined, { root : '/r' })).toThrow(/non-empty string/)
    expect(() => isIncluded('', { root : '/r' })).toThrow(/non-empty string/)
    expect(() => isIncluded(5, { root : '/r' })).toThrow()
  })

  describe('agreement with find()', () => {
    let tmpDir
    let entries
    beforeAll(async() => {
      tmpDir = await fsp.mkdtemp(fsPath.join(os.tmpdir(), 'is-included-'))
      const dirs = ['.git', 'src/.hidden', 'd[x]{y}', 'nested/deep']
      for (const d of dirs) {
        await fsp.mkdir(fsPath.join(tmpDir, d), { recursive : true })
      }
      const files = ['a[1].js', 'a1.js', 'b{c,d}.js', 'bc.js', '.env', '.git/config', 'src/x.js',
        'src/.hidden/y.js', 'd[x]{y}/f.txt', 'nested/deep/z.txt', 'nested/n.js']
      for (const f of files) {
        await fsp.writeFile(fsPath.join(tmpDir, f), 'x')
      }
      entries = await find({ root : tmpDir })
    })
    afterAll(async() => {
      await fsp.rm(tmpDir, { recursive : true, force : true })
    })

    const criteriaSets = (dir) => [
      { paths : ['**/*.js'] },
      { paths : ['a[1].js'] },
      { paths : [{ path : 'a[1].js', literal : true }] },
      { paths : [{ path : 'd[x]{y}', literal : true }, 'src/*.js'] },
      { excludePaths : ['*/.git/*', '.git/'] },
      { excludePaths : ['src/**'] },
      { excludePaths : [{ path : 'a[1].js', literal : true }, { path : 'd[x]{y}', literal : true }] },
      { paths : ['**'], minimatchOptions : { dot : true } },
      { paths : ['!(*.js)'] },
      { paths : [`${dir}/src/*.js`, 'b{c,d}.js'], excludePaths : ['**/bc.js'] },
      { paths : ['src/', 'src/*'], excludePaths : ['**/.hidden/**'] }
    ]

    test('every criteria set agrees for absolute and relative subjects', async() => {
      expect(entries.length).toBeGreaterThan(10)
      for (const criteria of criteriaSets(tmpDir)) {
        const got = new Set(await find({ root : tmpDir, ...criteria }))
        const options = { root : tmpDir, ...criteria }
        const mismatches = []
        for (const f of entries) {
          if (isIncluded(f, options) !== got.has(f)) {
            mismatches.push(f)
          }
          const rel = f.slice(tmpDir.length + 1)
          if (rel !== '' && isIncluded(rel, options) !== got.has(f)) {
            mismatches.push(rel)
          }
        }
        expect({ criteria, mismatches }).toEqual({ criteria, mismatches : [] })
      }
    })
  })
})
