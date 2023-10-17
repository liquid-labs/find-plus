# find-plus
[![coverage: 98%](./.readme-assets/coverage.svg)](https://github.com/liquid-labs/find-plus/pulls?q=is%3Apr+is%3Aclosed) [![Unit tests](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml/badge.svg)](https://github.com/liquid-labs/find-plus/actions/workflows/unit-tests-node.yaml)

A zero-dependency file finder with features similar to Linux find.

## Instalation

```bash
npm i @liquid-labs/find-plus
```

## Usage

```javascript
import { find } from '@liquid-labs/find-plus' // ESM
// const { find } = require('@liquid-labs/find-plus')  // CJS

const isaTXTFile = (f) => f.name.endsWith('.txt')
const files = find({ filesOnly: true, root: process.env.HOME, tests: [isaTXTFile] }

console.log(`You have ${files.length} text files under your home directory.`)
```

## Options

`find()` takes the following options (only the `root` option is required:

- `atDepth`: (_boolean_, _default_: `false`) if `true`, then limits the results to those at `depth`
  depth,
  excludeRoot
  noBlockDevices,
  noCharacterDevices,
  noDirs,
  noFIFOs,
  noFiles,
  noRecurseFailed,
  noSockets,
  noSpecials
  noSymbolicLinks,
  onlyBlockDevices,
  onlyCharacterDevices,
  onlyDirs,
  onlyFIFOs,
  onlyFiles,
  onlySockets,
  onlySymbolicLinks
  root
  sort
  tests