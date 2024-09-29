# find-plus
[![coverage: 98%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/find-plus/pulls?q=is%3Apr+is%3Aclosed) [![Unit tests](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml)

A file finding utility patterned after Linux find.

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [Extglob pattern syntax](#extglob-pattern-syntax)
- [Path matching for efficient searching](#path-matching-for-efficient-searches)
- [Custom tests](#custom-tests)
- [Sorting results](#sorting-results)

## Instal

```bash
npm i find-plus
```

## Usage

```javascript
import { find } from 'find-plus' // ESM
// const { find } = require('find-plus')  // CJS

const isaTXTFile = (f) => f.name.endsWith('.txt')
const files = await find({ onlyFiles: true, root: process.env.HOME, tests: [isaTXTFile] }

console.log(`You have ${files.length} text files under your home directory.`)
```

## Options

`find()` takes the following options (only the `root` option is required):
- Root options:
  - `root`: (__required__, _string_) The directory from which the search begins. May be absolute (starts with '/') or relative to `process.cwd()`.[^1]
  - `excludeRoot`: (_boolean_, default: `false`) If `true`, the root directory is excluded from the results even if it would otherwise be included.
- Path matching (see [extglob patterns](#extglob-pattern-syntax) and [path matching for efficient searching](#path-matching-for-efficient-searches) for additional details):
  - `paths`: (_string[]_) If defined, then only matching file paths are included in the results. The path is considered absolute if it starts with '/' and is otherwise relative to `root`.
  - `excludePaths`: (_string[]_) If defined, then any matching file paths are excluded from the results, but still may be traversed. E.g., the pattern 'foo/' would exclude directory 'foo' from the results, but not 'foo/bar.txt'. Absolute and relative paths handled as with `paths`.
- Limiting depth and leaf results:
  - `depth`: (_int_) If defined, will only search the specified number of levels below `root` (which is depth 0). Negatvie values are equivalent to 0.
  - `leavesOnly`: (_boolean_, default: `false`) If `true`, then limits the results to leaf files at `depth`. E.g., `depth = 0` will match only the root directory and `depth = 1` will only match those files within the root directory, and so forth.
- Selecting files types:[^2]
  - `(onlyBlockDevices)`: (_boolean_, default: `false`) Include only block devices.
  - `(onlyCharacterDevices)`: (_boolean_, default: `false`) Include only character devices.
  - `(onlyDirs)`: (_boolean_, default: `false`) Include only directories.
  - `(onlyFIFOs)`: (_boolean_, default: `false`) Include only FIFOs/pipes.
  - `(onlyFiles)`: (_boolean_, default: `false`) Include only regular files.
  - `(onlySockets)`: (_boolean_, default: `false`) Include only sockets.
  - `(onlySymbolicLinks)`: (_boolean_, default: `false`) Include only symbolic links.
  - `(noBlockDevices)`: (_boolean_, default: `false`) Exclude block devices.
  - `(noCharacterDevices)`: (_boolean_, default: `false`) Exclude character devices.
  - `(noDirs)`: (_boolean_, default: `false`) Exclude directories.
  - `(noFIFOs)`: (_boolean_, default: `false`) Exclude FIFOs/pipes.
  - `(noFiles)`: (_boolean_, default: `false`) Exclude regular files.
  - `(noSockets)`: (_boolean_, default: `false`) Exclude sockets.
  - `(noSpecial)`: (_boolean_, default: `false`) : Equivalent to `noBlockDevcies`, `noCharacterDevices`, `noFIFOs`, and `noSockets`,
  - `(noSymbolicLinks)`: (_boolean_, default: `false`) : Exclude symbolic links.
- `tests`: (_function[]_) If defined, then each potential file is passed to each test which must all return `true` if the file is to be included in the results. Refer to [custom tests](#custom-tests) for additional information.
- `sort`: (_string_, default: 'breadth') Specifies the preferred order of the results. Possible values are 'breadth', 'depth', 'alpha', and 'none'. The 'none' option returns the order in which the files were discovered on disk with no additional sorting. This is generally equivalent to 'breadth', but the order is not guranteed.

[^1]: Internally root is always converted to an absolute directory using the internal `path.resolve()` function.
[^2]: Setting all the `no*` or multiple `only*` file type selectors will result in an error as the search would be trivially empty.

### Setting and including the root

If you are using this library in a tool, often the sensible default would be `process.cwd()` or `process.env.PWD`, depending on your environment and use case.

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

Note, that when either `excludePaths` or `paths` are defined, the algorithm will skip searching impossible directories.[^3] It can therefore be beneficial and result in faster results to define `excludePaths` or `paths` where possible, even where not strictly necessary for the logic. I.e., consider using these options to optimize and reduce search times as well as for functional purposes.

[^3]: There are some edge cases where additional directories are searched, but for the most part the logic pretty good about excluding impossible branches from the search.

## Custom tests

When specifying custom `tests`, each function takes two arguments: `file` and `options`. The `file` is a is a [`fs.DirEnt`](https://nodejs.org/api/fs.html#class-fsdirent) or [`fs.Stats`](https://nodejs.org/api/fs.html#class-fsstats) object[^4] with `name`, `parentPath`, `absPath`, `relPath`, and `depth` properties added. The `options` object a copy of the options object passed to `find()` with `absRoot` added for convenience.

[^4]: Both `DirEnt` and `Stat` objects provide a matching set of type identifier functions like`isDirectory()`, `isFIFO()`, `isSocket()`, etc.

The custom `tests` are executed after all built in requirements (like `leavesOnly`, `paths`, `onlyFiles`, etc.) are satisfied. Recall that all `tests` must return `true` for the file to pass, so 'or' logic must be implemented within the tests themselves.

