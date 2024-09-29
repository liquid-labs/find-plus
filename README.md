# find-plus
[![coverage: 98%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/find-plus/pulls?q=is%3Apr+is%3Aclosed) [![Unit tests](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml)

A file finding utility patterned after Linux find.

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
  - [Setting the root](#setting-the-root)
  - [Path matching](#path-matching)
  - [Search depth](#search-depth)
  - [Selecting file types](#selecting-file-types)
  - [Custom tests](#custom-tests)
  - [Sorting the results](#sorting-the-results)
  - [Directory traversal](#directory-traversal)

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

### Setting and including the root

The `root` (__required__, _string_) option is the directory from which the search begins and all relative [`path` and `excludePath`](#path-matching) patterns are relative to `root`. To avoid mistakes, `root` must be set.

Root may be relative or absolute. If not-absolute, `root` is relative to `process.cwd()`.[^1] The string '.' may be used to set root to the current working directory. E.g., `root: '.'` is equivalent to `root: process.cwd()`. If you are using this library in a tool, often the sensible default would be `process.cwd()` or `process.env.PWD`, depending on your environment and use case.

[^1]: Internally root is always converted to an absolute directory using the internal `path.resolve()` function.

You can use the `excludeRoot` (_boolean_, _default_: `false`) option to exclude the root from the results oven if it otherwise would meet the specified search requirements.

### Path matching

Path matching uses glob style pattern matching provided by [minimatch](https://github.com/isaacs/minimatch#readme). The "path" matched against is the full file path. Note that when matching a directories specifically, you may include the trailing '/' or not. E.g., searching from the root, the directory `/user/jane` would be matched by '/user/jane', '/user/jane/', '/user/j*', '/user/j*/', and so forth.

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

The 'or' constructs can be combined with other special patterns; e.g., '+([abc]|zz)' would match 'abccba', 'abczzcba'. 'zzzz', but NOT match 'abczcba', 'z', or 'zz'.

- ___`excludePaths`___: (_array of strings_) any files with a path matching an excluded path are excluded from the results. Paths are considered absolute if they start with '/' and otherwise are considered relative to `root`.
- ___`paths`___: (_array of strings_) a file path must match each path to be included in the results. Paths are considered absolute if they start with '/' and otherwise are considered relative to `root`.

Note, that when either `excludePaths` or `paths` are defined, the algorithm will skip searching impossible directories.[^3] It can therefore be beneficial and result in faster results to define `excludePaths` or `paths` where possible, even where not strictly necessary for the logic. I.e., consider using these options to optimize and reduce search times as well as for functional purposes.

[^3]: There are some edge cases where additional directories are searched, but for the most part the logic pretty good about excluding impossible branches from the search.

### Search depth

- ___`atDepth`___: (_boolean_, _default_: `false`) if `true`, then limits the results to those at `depth`, which must also be set when setting this option.
- ___`depth`___: (_int_, _default_: `undefined`) will only descend 'depth' directories past the search `root` (which is depth 0). Negatvie values are equivalent to 0.

### Selecting file types

The following options default to `false` and may be set `true` to exclude the particular type of file. Setting all the regular `no`-options to `true` will raise an error as the search would be trivially empty.

- ___`noBlockDevices`___,
- ___`noCharacterDevices`___,
- ___`noDirs`___,
- ___`noFIFOs`___,
- ___`noFiles`___,
- ___`noSockets`___,
- ___`noSpecial`___: equivalent to `noBlockDevcies`, `noCharacterDevices`, `noFIFOs`, and `noSockets`,
- ___`noSymbolicLinks`___

The following options default to `false` and may be set 'true' to include only the particular type of file. Setting more than one `only`-option to `true` will raise an error as the search would be trivially empty.

- ___`onlyBlockDevices`___,
- ___`onlyCharacterDevices`___,
- ___`onlyDirs`___,
- ___`onlyFIFOs`___,
- ___`onlyFiles`___,
- ___`onlySockets`___,
- ___`onlySymbolicLinks`___

### Custom tests

The `tests` (_array of functions_, _default_: `[]`) option accepts an array of functions which take `(dirEnt, depth)`; each test function must return `true` for a file to be considered in the results. Or-ed tests must be implemented in a single function. `dirEnt` is a [`fs.DirEnt`](https://nodejs.org/api/fs.html#class-fsdirent)-like[^2] object (may be a `DirEnt` or modified [`fs.Stats`](https://nodejs.org/api/fs.html#class-fsstats) with `name` and `path` properties added) and `depth` is the depth of the file relative to the root (which is depth 0). The `tests` are executed after all the built in tests (like `atDepth`, `paths`, `onlyFiles`, etc.) have been passed. This limits the range of inputs the custom `tests` need to deal with.

[^2]: In Node 19.x, `DirEnt`s lack the `parentPath` field, but we normalize all `DirEnt`s to include this field in all versions.

### Sorting the results

You can use the `sort` (_string_, _default_: 'breadth') option to specify the preferred ordering of the results. Possible options are 'breadth', 'depth', 'alpha', and 'none'. The 'none' option returns the order in which the files were discovered on disk and is primarily useful to speed things slightly when you don't care about the order. In most cases, leaving the option unset or 'none' will result in breadth-first results equivalent to `sort : 'breadth'`, but this is not guaranteed.

### Directory traversal

By default, `find` will traverse directories even if the directories themselves are not included in the results (e.g., when `onlyFiles` is set to `true`). This behavior can be modified by setting the `noTraverseFailed` (_boolean_, _default_: `false`) option to `true`. When `noTraverseFailed` is `true`, then directories which fail the requirements (ignoring [`noDirs`and the `only*`](#selecting-file-types); see next paragraph) are not traversed.

Note, a path a single pattern like 'foo/bar/\*' combined with `noTraverseFailed : true` is pointless because the first 'foo' directory is not itself matched. For that pattern to return any results, you would need to specify a second pattern 'foo/'. With the two patterns specified, the first level directory will match the second pattern, and the first pattern will yield the expected results.

Note that with no further options, this means that the traversed directories will always be included in the results. You could filter the results based on the trailing path separator, but you're better off using `noDirs` and the `only*` options, which will effect the results, but are ignored for the purposes of determining direcotry traversal. E.g., given `$HOME/foo/bar/file1.txt`, `$HOME/foo/bar/file2.txt`, and `$HOME/foo/bar/baz/file3.txt`, to find the normal files directly under `$HOME/foo/bar` (being `file1.txt` and `file2.txt`), we could do the following:
```js
const result = await find({
  root : env.process.HOME,
  noTraverseFailed : true,
  onlyFiles : true,
  paths : ['foo', 'foo/bar/*']
})
````