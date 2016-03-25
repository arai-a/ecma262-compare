#!/bin/sh

if ! [ -d ecma262 ]; then
    git clone https://github.com/tc39/ecma262/
fi

cd ecma262

gen() {
    HASH=$1

    if ! [ -f ../history/${HASH}.html ]; then
        echo ${HASH}

        git co ${HASH}
        npm install
        npm run build

        cp out/index.html ../history/${HASH}.html
    else
        echo skip ${HASH}
    fi
}

for HASH in $(git log 090e736439a14166bfa2eab2e9f9d94071ec7e94..origin/master --pretty='%H'); do
    gen ${HASH}
done

echo '"use strict";' > revs.js
echo "var revs = [" >> revs.js
(cd ecma262; git log 090e736439a14166bfa2eab2e9f9d94071ec7e94..origin/master --pretty='["%ci", "%H"],') >> revs.js
echo "];" >> revs.js
