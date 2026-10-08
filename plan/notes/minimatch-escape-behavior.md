# Minimatch Escape Behavior

## Purpose and scope

Records what the project's installed `minimatch` (9.0.3, the only matching engine `find-plus` uses) does and does not escape, and the behaviors of its matcher that the literal-path and `isIncluded` work depends on. Every result below was verified by running `minimatch` 9.0.3 from the project's `node_modules` during planning.

## `minimatch.escape` does not escape braces

`escape(s)` in default (POSIX) mode escapes only `? * ( ) [ ] \` with a backslash; `+ @ !` are left alone because escaping the parens already disables extglobs. Braces `{` and `}` are **not** escaped, so brace expansion still runs on an "escaped" string:

| Input name | `escape(name)` | Pattern matches its own name? |
|---|---|---|
| `a{b,c}[1]*?.js` | `a{b,c}\[1\]\*\?.js` | no: the braces expand |
| `a{b,c}[1]*?.js` | `a\{b,c\}\[1\]\*\?.js` (escape plus a backslash before each brace) | yes |

Escaping braces with a backslash after `escape()` was verified to make the pattern match exactly the original name, and nothing else, for: `a{b,c}[1]*?.js`, `x{1..3}.js`, `a{b}.js`, `a[1]`, `!neg.js`, `#c.js`, `a\b.js` (a real backslash), `+(x).js`, `a,b.js`, and `.hidden`. `minimatch('/r/ab.js', '/r/' + lit('a{b,c}.js'))` is `false`, as required.

Consequence: `escapeGlob(str)` must be `minimatch.escape(str)` followed by escaping `{` and `}` with a backslash. Using `minimatch.escape` alone fails the "name containing `{ }` is that exact file" requirement.

### `windowsPathsNoEscape` mode limitation

With `{ windowsPathsNoEscape: true }`, `escape()` wraps magic characters in `[]` instead of using backslashes, and wrapping braces as `[{]`/`[}]` does **not** stop brace expansion: `a[{]b,c[}][[]1[]].js` fails to match `a{b,c}[1].js`. A name with no comma or range inside its braces (`a{b}.js`) does match. This mode is outside what `find-plus` targets (it builds every pattern with `/` and anchors on `/`), so the plan documents it as a known limitation and records it as an out-of-scope finding rather than solving it.

## Matcher behaviors the plan relies on

- `minimatch('/r/x/', '/r/x')` is `true`: a directory path with a trailing separator matches a pattern without one. `minimatch('/r/x', '/r/x/')` is `false`: a trailing `/` in a pattern restricts it to directories.
- `minimatch('/r/x', '/r/./x')` is `false`. `minimatch('/r/x', '/r//x')` and `minimatch('/r/y', '/r/x/../y')` are `true`. Glob entries are not otherwise normalized, and literal entries (escaped globs) inherit the same behavior.
- Dotfiles: `minimatch('/r/.foo', '/r/*')` is `false`, and `minimatch('/r/.hidden/f', '/r/**/f')` is `false` unless `{ dot: true }` is passed. An explicit `.git` segment matches: `minimatch('/r/a/.git/b', '/r/*/.git/*')` is `true`.
- Negation: a leading `!` negates a whole pattern only when it is the pattern's first character. `find()` anchors every relative pattern as `${absRoot}/${glob}` and treats a pattern as absolute only when it starts with `/`, so a leading `!` never reaches `minimatch` in first position. **`find()` does not support whole-pattern negation**: `paths: ['!a.js']` means the file literally named `!a.js` under root. Extglob negation `!(…)` inside a segment is supported (for example `paths: ['!(*.txt)']`).
- `escape` is exported as a named export from `minimatch` 9.x (`import { escape, minimatch } from 'minimatch'`).

## Pre-existing pruning detail

`src/lib/traverse-dirs.mjs` prunes directories using the raw `paths`/`excludePaths` strings (`p.split('/')`, `p.endsWith('/**')`, `nextBit.includes('**')`) and calls `minimatch` **without** `minimatchOptions`. An escaped literal has no consecutive `**` (`**` escapes to `\*\*`) and contains no `/` other than real separators, so escaped entries are safe to pass through the existing pruning code as long as they are normalized to glob strings before `traverseDirs` sees them.
