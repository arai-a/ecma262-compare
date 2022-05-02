#!/bin/sh

TOTAL_CHUNKS=16

PIDS=""

for I in $(seq 1 $TOTAL_CHUNKS); do
    ./venv/bin/python ./build.py update-json -t parent_diff -i $I -c ${TOTAL_CHUNKS} &
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
