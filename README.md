[![Update revisions and PRs](https://github.com/arai-a/ecma262-compare/workflows/Update%20revisions%20and%20PRs/badge.svg)](https://github.com/arai-a/ecma262-compare/actions?query=workflow%3A%22Update+revisions+and+PRs%22)

# ECMAScript Language Specification Comparator

A webpage to compare [ECMAScript Language Specification](https://tc39.es/ecma262/)'s [revisions](https://github.com/tc39/ecma262/commits/master), and [PRs](https://github.com/tc39/ecma262/pulls).

https://arai-a.github.io/ecma262-compare/

Updated periodically (every 30 minutes, update up to 5 revisions and 5 PRs at a time).

## Structure

This branch is to track status for PRs in ecma262 repository.

* `build.py`  
  Script to track the comment info, and post comment
* `config.json`  
  Configuration for PR status
* `pr-status.json`  
  Contains information abotu which PR is updated, and which PR is already commented
* `Makefile`  
  Makefile for automation

## Others

See [gh-pages branch](https://github.com/arai-a/ecma262-compare/tree/gh-pages) for more details.
