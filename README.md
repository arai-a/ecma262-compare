# ecma262-compare
ES spec comparator

## Setup

```
$ virtualenv venv
$ . venv/bin/activate
$ pip install libxml2
$ python build.py init
```

`init` command just clones https://github.com/tc39/ecma262/ .

## Update already merged revisions

```
$ python build.py update
```

`update` command fetches changesets from https://github.com/tc39/ecma262/ , and  generates HTML file and JSON file for each revisions.
HTML files are stored as `./history/{hash}.html`, and JSON files are stored as `./history/{hash}.json`, and they're cached for 2nd invocation.

## Update PRs

```
$ python build.py pr PR_NUMBER
$ python extract.py
```

`pr` command retrieves information about specified PR and generated HTML file and JSON file for each revisions in the PR.
It will fail if the PR is not mergeable.
