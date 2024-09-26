# find-plus
[![coverage: 98%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/find-plus/pulls?q=is%3Apr+is%3Aclosed) [![Unit tests](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml)

A file finding utility patterned after Linux find.

## Instalation

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

### Key options

- ___`root`___: (__required__, _string_) the path from which to begin the search.
- ___`noTraverseFailed`___: (_boolean_, _default_: `false`) by default, `find` will traverse directories even if the directories themselves are not included in the results (e.g., when `onlyFiles` is set to `true`). When `noTraverseFailed` is `true`, then directories which fail the requirements are not traversed. `noTraverseFailed` cannot be combined with `noDirs` or any of the [`only`-options](#only-options) except `onlyDirs` because then the search would be trivially empty.
- ___`sort`___: (_string_, _default_: 'breadth') specifies the sort to apply to the results. Possible options are 'breadth', 'depth', 'alpha', and 'none'. The 'none' option returns the order in which the files were discovered on disk and is primarily useful to speed things slightly when you don't care about the order.
- ___`tests`___: (_array of functions_, _default_: `[]`) an array of functions which take `(dirEnt, depth)`; each test function must return `true` for a file to be considered in the results. Or-ed tests must be implemented in a single function. `dirEnt` is a [`fs.DirEnt`](https://nodejs.org/api/fs.html#class-fsdirent)-like* object (may be a `DirEnt` or modified [`fs.Stats`](https://nodejs.org/api/fs.html#class-fsstats) with `name` and `path` properties added) and `depth` is the depth of the file relative to the root (which is depth 0). The `tests` are executed after all the built in tests (like `atDepth`, `paths`, `onlyFiles`, etc.) have been passed. This limits the range of inputs the custom `tests` need to deal with.

*: In Node 19.x, `DirEnt`s lack the `path` field, but we normalize all `DirEnt`s to include this field in all versions.

### Path matching

Path matching uses glob style pattern matching provided by [minimatch](https://github.com/isaacs/minimatch#readme). The "path" matched against is the full file path. In addition, directories are suffixed with the file system seperator. E.g., `/users/jane/`, which would match the path `**/jane/**` (which would fail without the trailing '/').

Globbing syntax:
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

The 'or' constructs can be combined with other special patterns; e.g., '+([abc])' would match 'abccba'.

- ___`excludePaths`___: (_array of strings_) any files with a path matching an excluded path are excluded from the results. Paths are considered absolute if they start with '/' and otherwise are considered relative to `root`.
- ___`paths`___: (_array of strings_) a file path must match each path to be included in the results. Paths are considered absolute if they start with '/' and otherwise are considered relative to `root`.

### Depth and root handling options

- ___`atDepth`___: (_boolean_, _default_: `false`) if `true`, then limits the results to those at `depth`.
- ___`depth`___: (_int_, _default_: `undefined`) will only descend 'depth' directories past the search `root` (which is depth 0). Negatvie values are equivalent to 0.
- ___`excludeRoot`___: (_boolean_, _default_: `false`) if `true`, then `root` is excluded from the search results.

### No-options

The following options default to `false` and may be set `true` to exclude the particular type of file. Setting all the regular `no`-options to `true` will raise an error as the search would be trivially empty.

- ___`noBlockDevices`___,
- ___`noCharacterDevices`___,
- ___`noDirs`___,
- ___`noFIFOs`___,
- ___`noFiles`___,
- ___`noSockets`___,
- ___`noSpecial`___: equivalent to `noBlockDevcies`, `noCharacterDevices`, `noFIFOs`, and `noSockets`,
- ___`noSymbolicLinks`___

## Only-options

The following options default to `false` and may be set 'true' to include only the particular type of file. Setting more than one `only`-option to `true` will raise an error as the search would be trivially empty.

- ___`onlyBlockDevices`___,
- ___`onlyCharacterDevices`___,
- ___`onlyDirs`___,
- ___`onlyFIFOs`___,
- ___`onlyFiles`___,
- ___`onlySockets`___,
- ___`onlySymbolicLinks`___