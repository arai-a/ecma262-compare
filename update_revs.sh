#!/bin/sh

echo "var revs = [" > revs.js
(cd ecma262; git log 090e736439a14166bfa2eab2e9f9d94071ec7e94..origin/master --pretty='["%ci", "%H"],') >> revs.js
echo "];" >> revs.js
