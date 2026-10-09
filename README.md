# find-plus
[![coverage: 99%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/find-plus/pulls?q=is%3Apr+is%3Aclosed)

A file finding utility patterned after Linux find.

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [Literal paths and escapeGlob](#literal-paths-and-escapeglob)
- [Testing a single path with isIncluded](#testing-a-single-path-with-isincluded)
- [Extglob pattern syntax](#extglob-pattern-syntax)
- [Path matching for efficient searching](#path-matching-for-efficient-searches)
- [Custom tests](#custom-tests)
- [Releasing](#releasing)

## Install

```bash
npm i find-plus
```

## Usage

```javascript
import { find } from 'find-plus' // ESM
// const { find } = require('find-plus')  // CJS

const isaTXTFile = (f) => f.name.endsWith('.txt')
const files = await find({ onlyFiles: true, root: process.env.HOME, tests: [isaTXTFile] })

console.log(`You have ${files.length} text files under your home directory.`)
```

The package also exports `escapeGlob` and `isIncluded`:

```javascript
import { escapeGlob, find, isIncluded } from 'find-plus'
```

## Options

`find()` takes the following options (only the `root` option is required):
- Root options:
  - __`root`__: (__required__, _string_) The directory from which the search begins. May be absolute (starts with '/') or relative to `process.cwd()`.[^1]
  - __`excludeRoot`__: (_boolean_, default: `false`) If `true`, the root directory is excluded from the results even if it would otherwise be included.
- Path matching (see [extglob patterns](#extglob-pattern-syntax) and [path matching for efficient searching](#path-matching-for-efficient-searches) for additional details):
  - __`paths`__: (`(string | { path: string, literal?: boolean })[]`) If defined and non-empty, then only file paths matching **any** entry are included in the results (union semantics), and then only if no `excludePaths` entry matches. A file matched by several entries appears once. An entry matching nothing does not affect the others; the result is empty only when no entry matches anything. Multiple entries were an intersection before 3.0.0. A string entry is a glob, considered absolute if it starts with '/' and otherwise relative to `root`. A `{ path, literal: true }` entry names that exact file or directory, so metacharacters such as `[ ] * ? { } ( )` are matched literally; a nonexistent literal matches nothing. A literal names the path itself, not its descendants; use `escapeGlob(dir) + '/**'` for the contents. Literal and glob entries can be mixed (see [literal paths and escapeGlob](#literal-paths-and-escapeglob)). An empty array means no path filtering. Malformed values throw.
  - __`excludePaths`__: (`(string | { path: string, literal?: boolean })[]`) If defined, then any matching file paths are excluded from the results. Matching directories, however, may still be searched; refer to [path matching for efficient searching](#path-matching-for-efficient-searches) for guidance. Entries are handled as with `paths`: strings are globs (absolute if starting with '/', otherwise relative to `root`), and `{ path, literal: true }` entries name that exact file or directory.
  - __`minimatchOptions`__: (_object_) Options passed to [minimatch](https://github.com/isaacs/minimatch#readme) when matching `paths` and `excludePaths` (for example `{ dot: true }` lets `*` and `**` match dotfiles). Also used by `isIncluded()` and by `escapeGlob()` (which reads only `windowsPathsNoEscape`).
- Limiting depth and leaf results:
  - __`depth`__: (_int_) If defined, will only search the specified number of levels below `root` (which is depth 0). Negative values are equivalent to 0.
  - __`leavesOnly`__: (_boolean_, default: `false`) If `true`, then limits the results to leaf files at `depth`. E.g., `depth = 0` will match only the root directory and `depth = 1` will only match those files within the root directory, and so forth.
- Selecting files types:[^2]
  - __`onlyBlockDevices`__: (_boolean_, default: `false`) Include only block devices.
  - __`onlyCharacterDevices`__: (_boolean_, default: `false`) Include only character devices.
  - __`onlyDirs`__: (_boolean_, default: `false`) Include only directories.
  - __`onlyFIFOs`__: (_boolean_, default: `false`) Include only FIFOs/pipes.
  - __`onlyFiles`__: (_boolean_, default: `false`) Include only regular files.
  - __`onlySockets`__: (_boolean_, default: `false`) Include only sockets.
  - __`onlySpecials`__: (_boolean_, default: `false`) Equivalent to `noDirs`, `noFiles`, and `noSymbolicLinks`.
  - __`onlySymbolicLinks`__: (_boolean_, default: `false`) Include only symbolic links.
  - __`noBlockDevices`__: (_boolean_, default: `false`) Exclude block devices.
  - __`noCharacterDevices`__: (_boolean_, default: `false`) Exclude character devices.
  - __`noDirs`__: (_boolean_, default: `false`) Exclude directories.
  - __`noFIFOs`__: (_boolean_, default: `false`) Exclude FIFOs/pipes.
  - __`noFiles`__: (_boolean_, default: `false`) Exclude regular files.
  - __`noSockets`__: (_boolean_, default: `false`) Exclude sockets.
  - __`noSpecials`__: (_boolean_, default: `false`) : Equivalent to `noBlockDevices`, `noCharacterDevices`, `noFIFOs`, and `noSockets`.
  - __`noSymbolicLinks`__: (_boolean_, default: `false`) : Exclude symbolic links.
- __`tests`__: (_function[]_) If defined, then each potential file is passed to each test which must all return `true` if the file is to be included in the results. Refer to [custom tests](#custom-tests) for additional information.
- __`sort`__: (_string_, default: 'breadth') Specifies the preferred order of the results. Possible values are 'breadth', 'depth', 'alpha', and 'none'. The 'none' option returns the order in which the files were discovered on disk with no additional sorting. This is generally equivalent to 'breadth', but the order is not guaranteed. With 'none' and more than one `paths` entry, results are ordered by the first matching entry (entry order), then discovery order within an entry. Other sorts order the whole result set as before.

[^1]: Internally root is always converted to an absolute directory using the internal `path.resolve()` function. A `root` containing glob characters (e.g., `[`, `{`) works with relative patterns.
[^2]: Setting all the `no*` or multiple `only*` file type selectors will result in an error as the search would be trivially empty.

## Literal paths and escapeGlob

Plain `paths` strings are globs, so a file such as `a[1].js` cannot be named directly. A single ordered `paths` list accepts both forms, rather than a separate option, so that entry order is well defined for union and for `sort: 'none'` ordering:

```javascript
const files = await find({
  root : '/proj',
  paths : [{ path : 'a[1].js', literal : true }, 'src/**/*.mjs']
})
```

`escapeGlob(str[, minimatchOptions])` returns a glob that matches exactly `str` with `find()`'s engine. It escapes braces as well as the characters `minimatch.escape` handles. In `windowsPathsNoEscape` mode, names with braces containing a comma or range (e.g., `a{b,c}.js`) are a known limitation, because brace expansion still applies and `escapeGlob` cannot make them match literally.

## Testing a single path with isIncluded

`isIncluded(path, options) => boolean` reports whether one path passes the path criteria of a `find()` options object.

- It is synchronous and does no filesystem access, so it works for nonexistent paths.
- `path` is a literal path, never a pattern; expand globs yourself. A trailing '/' marks a directory. Relative paths resolve against `root`.
- `options` takes the same object as `find()`, but only `root` (required), `paths`, `excludePaths`, and `minimatchOptions` are considered. File-type options, `depth`, `leavesOnly`, `excludeRoot`, `tests`, and `sort` are ignored, and the subject is not required to lie under `root`.
- Like `find()`, it returns `false` when the path, or any ancestor directory, is skipped by an `excludePaths` pattern ending in '/**'.
- The result agrees with whether `find()` would return that path, given the same criteria and a path that exists under `root`.
- Whole-pattern '!' negation is not supported; use extglob `!(…)`.

```javascript
isIncluded('repo/.git/config', { root : '/proj', excludePaths : ['*/.git/*'] }) // false
```

## Extglob pattern syntax

Path matching uses glob style pattern matching provided by [minimatch](https://github.com/isaacs/minimatch#readme). The "path" matched against is the full file path. Note that when matching a directories specifically, you may include the trailing '/' or not. E.g., searching from the root, the directory `/user/jane` would be matched by '/user/jane', '/user/jane/', '/user/j*', '/user/j*/', and so forth.

Extglob syntax:
- ___*___: matches any string or nothing except '/' (file separator)
- ___**___: matches any string or nothing
- ___?___: matches one character or nothing
- ___[abc]___: matches one of the characters
- ___[a-z]___: matches a character range
- ___[[:alpha:]]___: matches a [POSIX character class](https://www.gnu.org/software/bash/manual/html_node/Pattern-Matching.html)
- ___{a,b}___: matches one of the patterns, separated by commas, equivalent to '@(a|b)'
- ___?(a|b)___: matches zero or one of the patterns, separated by pipes
- ___*(a|b)___: matches zero or more of the patterns
- ___+(a|b)___: matches one or more of the patterns
- ___@(a|b)___: matches exactly one of the patterns
- ___!(a|b)___: matches anything except the patterns

The 'or' constructs can be combined with other special patterns; e.g., '+([abc]|zz)' would match 'abccba', 'abczzcba'. 'zzzz', but NOT match 'abczcba', 'z', or 'zz'.

## Path matching for efficient searches

Note, that when either `excludePaths` or `paths` are defined, the algorithm will skip searching impossible directories.[^3] It can therefore be beneficial and result in faster results to define `excludePaths` or `paths` where possible, even where not strictly necessary for the logic. Consider using these options to optimize and reduce search times as well as for functional purposes.

[^3]: There are some edge cases where additional directories are searched, but for the most part the logic pretty good about excluding impossible branches from the search.

When using `excludePaths`, remember that the pattern does not prevent `find()` from searching within and below the directory unless the patterns ends in '/**'. E.g., `excludePaths = ['foo/']` would exclude directory `foo/` from the results, but not `foo/bar.txt`. `excludePaths = ['foo/**']` would skip searching `foo/` and any sub-directories altogether.

## Custom tests

When specifying custom `tests`, each function takes two arguments: `file` and `options`. The `file` is a is a [`fs.DirEnt`](https://nodejs.org/api/fs.html#class-fsdirent) or [`fs.Stats`](https://nodejs.org/api/fs.html#class-fsstats) object[^4] with `name`, `parentPath`, `absPath`, `relPath`, and `depth` properties added. The `options` object a copy of the options object passed to `find()` with `absRoot` added for convenience and the `tests` property removed. The test functions must return `true` or `false` to indicate the file in question should be included (if all other requirements are met) or must be excluded from the results, respectively.

[^4]: Both `DirEnt` and `Stat` objects provide a matching set of type identifier functions like`isDirectory()`, `isFIFO()`, `isSocket()`, etc.

The custom `tests` are executed after all built in requirements (like `leavesOnly`, `paths`, `onlyFiles`, etc.) are satisfied. Recall that all `tests` must return `true` for the file to pass, so 'or' logic must be implemented within the tests themselves.

## Releasing

Maintainers: see [RELEASING.md](./RELEASING.md) for the release procedure.
