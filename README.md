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
$ python extract.py
```

`update` command fetches changesets from https://github.com/tc39/ecma262/ , and  generates HTML file for each revisions.
HTML files are stored as `./history/{hash}.html`, and it's cached for 2nd invocation.

`extract.py` extracts data from generated HTML file, and save the data into `./history/{hash}.json`.

## Update PRs

```
$ python build.py pr PR_NUMBER
$ python extract.py
```

`pr` command retrieves information about specified PR and generated HTML file for each revisions in the PR.
It will fail if the PR is not mergeable.
