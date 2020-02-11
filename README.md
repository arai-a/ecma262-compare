# ecma262-compare
ES spec comparator

## Setup

```
$ make init
```

This creates virtualenv for other commands, and clones https://github.com/tc39/ecma262/ .

## Prepare GitHub API key

To update PRs, create `key.json` file wiht following content, to increase the gitHub acces limit.
(this step isn't necessary for updating already merged revisions)

```
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

## Modify the first revision of the history

`config.json` contains the information about the repository and the first revision that will be processed and shown in the comparator.
To reduce the resource, you can specify the recent revision.

```
{
  "repo_url": "https://github.com/tc39/ecma262/",
  "first_rev": "17ebeea7386e2411e56f58f20c8d442ce91f5f42"
}
```

## Update already merged revisions

```
$ make update
```

This fetches changesets from https://github.com/tc39/ecma262/ , and generates HTML file with resources, and JSON file for each revisions.
HTML files are stored as `./history/{hash}/index.html`, and JSON files are stored as `./history/{hash}/sections.json`, and they're cached for 2nd invocation.

## Update specific PR

```
$ ./venv/bin/python build.py pr PR_NUMBER
```

This retrieves information about specified PR and generated HTML file and JSON file for each revisions in the PR.
HTML files are stored as `./history/PR/{PR_NUMMER}/{hash}/index.html`, and JSON files are stored as `./history/PR/{PR_NUMMER}/{hash}/sections.json`, but they're not cached for 2nd invocation, as parent may change.
It will fail if the PR is not mergeable.

## Update all PRs

```
$ make pr
```

It retrieves the list of PRs and update each PR.
