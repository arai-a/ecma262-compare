# ecma262-compare
ES spec comparator

## Setup

```
$ python build.py init
```

`init` command just clones https://github.com/tc39/ecma262/ .

## Update already merged revisions

```
$ python build.py update
```

`update` command fetches changesets from https://github.com/tc39/ecma262/ , and  generates HTML file for each revisions.
HTML files are stored as `./history/{hash}.html`, and it's cached for 2nd invocation.

## Update PRs

```
$ python build.py pr PR_NUMBER
```

`pr` command retrieves information about specified PR and generated HTML file for each revisions in the PR.
It will fail if the PR is not mergeable.
