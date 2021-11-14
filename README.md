[![Update revisions and PRs](https://github.com/arai-a/ecma262-compare/workflows/Update%20revisions%20and%20PRs/badge.svg)](https://github.com/arai-a/ecma262-compare/actions?query=workflow%3A%22Update+revisions+and+PRs%22)

# ECMAScript Language Specification Comparator

A webpage to compare [ECMAScript Language Specification](https://tc39.es/ecma262/)'s [revisions](https://github.com/tc39/ecma262/commits/main), and [PRs](https://github.com/tc39/ecma262/pulls).

https://arai-a.github.io/ecma262-compare/

Updated periodically (every 30 minutes, update up to 5 revisions and 5 PRs at a time).

## Structure

This branch contains 2 things:

* Comparator website and the history data
* Scripts to update the history data

### Comparator website and the history data

* Comparator
  * `index.html`
  * `js/compare.js`
  * `js/path-diff-worker.js`
  * `js/tree-diff-worker.js`
  * `js/gunzip.wasm.js`
  * `style/compare.css`
  * `style/base.css`
  * `style/ecmarkup.css`  
    The copy of `ecmarkup.css` file from recent spec
  * `img/*.png`
  * `img/*.ico`
* Index of revisions and PRs snapshots
  * `snapshot_revs.html`
  * `snapshot_prs.html`
  * `js/snapshot.js`
  * `style/snapshot.css`
* Source of `gunzip.wasm`
  * `lib/Cargo.toml`
  * `lib/Makefile`
  * `lib/src/lib.rs`
* History data
  * `history/revs.json`  
    The list of the metadata for already-merged revisions
  * `history/prs.json`  
    The list of the metadata for PRs
  * `history/{SHA}/index.html`  
    Snapshot of `{SHA}` revision
  * `history/{SHA}/sections.json`  
    Extracted section data for `{SHA}` revision, used by the comparator
  * `history/{SHA}/parent_diff.json`  
    Partial data of `sections.json` for `{SHA}` and parent, for diff between them
  * `history/{SHA}/*`  
    Other resources for the snapshot
  * `history/PR/{PR}/info.json`  
    Some metadata for the PR
  * `history/PR/{PR}/{SHA}/index.html`  
    Snapshot of `{SHA}` revision
  * `history/PR/{PR}/{SHA}/sections.json`  
    Extracted section data for `{SHA}` revision, used by the comparator
  * `history/PR/{PR}/{SHA}/parent_diff.json`  
    Partial data of `sections.json` for `{PR}` and parent, for diff between them
  * `history/PR/{PR}/{SHA}/*`  
    Other resources for the snapshot
* Linter settings
  * `.eslintrc.js`
  * `package.json`

### Scripts to update the history data

* `build.py`  
  Script to build the history data
* `config.json`  
  Configuration for the history data
* `requirements.txt`  
  The list of python modules to install on setup
* `Makefile`  
  Makefile for both automation and local run

## Local run

See [Local.md](./Local.md)
