#!/bin/sh

echo "var revs = [" > revs.js
(cd ecma262; git log --pretty='["%ci", "%H"],') >> revs.js
echo "];" >> revs.js
