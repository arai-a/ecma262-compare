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

## Prepare GitHub API key

Create `key.json` file wiht following content

```
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

## Update already merged revisions

```
$ python build.py update
```

`update` command fetches changesets from https://github.com/tc39/ecma262/ , and  generates HTML file and JSON file for each revisions.
HTML files are stored as `./history/{hash}.html`, and JSON files are stored as `./history/{hash}.json`, and they're cached for 2nd invocation.

## Update specific PR

```
$ python build.py pr PR_NUMBER
```

`pr` command retrieves information about specified PR and generated HTML file and JSON file for each revisions in the PR.
HTML files are stored as `./history/PR/{PR_NUMMER}/{hash}.html`, and JSON files are stored as `./history/PR/{PR_NUMMER}/{hash}.json`, but they're not cached for 2nd invocation, as parent may change.
It will fail if the PR is not mergeable.

## Update all PRs

```
$ python build.py pr all
```

It retrieves the list of PRs and update each PR.
