# Complete README Brace Limitation Sentence

## Purpose and scope

Remediates finding fobB: the README sentence in "Literal paths and escapeGlob" describing the `windowsPathsNoEscape` brace limitation ends mid-sentence. The work targets the plan branch `plan/followups-burndown-fixes` and lands through the ordinary per-task loop.

## Requirements

1. Complete the truncated sentence at `README.md` line ~86 (section "Literal paths and escapeGlob"): in `windowsPathsNoEscape` mode, names containing braces with a comma or range (e.g., `a{b,c}.js`) are a known limitation, because brace expansion still applies and `escapeGlob` cannot make them match literally.
2. Change nothing else in the README.

## Validation

1. The sentence ends with a period and a predicate, with no trailing whitespace.
2. The wording matches the limitation comment above `escapeGlob` in `src/lib/path-match.mjs`.
3. `git diff` touches only that sentence in `README.md`.

## References

- Finding `fobB` in this plan's `plan/findings.yaml`.
