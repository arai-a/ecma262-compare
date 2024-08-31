#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

TOTAL_CHUNKS=16

# --

PIDS=""

for I in $(seq 1 $TOTAL_CHUNKS); do
    ./venv/bin/python ./build.py update-json -t sections -i $I -c ${TOTAL_CHUNKS} &
    PIDS="${PIDS}$! "
done

echo "PIDS: ${PIDS}"

FAILED_PIDS=""
TOTAL_CODE=0

for PID in ${PIDS}; do
    wait ${PID}
    CODE=$?
    if [ $CODE -ne 0 ]; then
        TOTAL_CODE=$CODE
        FAILED_PIDS="${FAILED_PIDS}${PID} "
    fi
done

if [ $TOTAL_CODE -ne 0 ]; then
    echo "Failed: ${FAILED_PIDS}"
    exit $TOTAL_CODE
fi

./update_parent_json.sh
