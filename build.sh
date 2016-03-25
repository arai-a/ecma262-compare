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

for HASH in $(git log master --pretty='%H'); do
    gen ${HASH}
done
