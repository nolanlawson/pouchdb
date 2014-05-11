#!/bin/sh

LEVEL_BACKEND=memdown \
  OUTPUT_FILENAME=pouchdb.memory.js \
  ./bin/build-plugin.sh

LEVEL_BACKEND=localstorage-down \
  OUTPUT_FILENAME=pouchdb.localstorage.js \
  ./bin/build-plugin.sh

LEVEL_BACKEND=level-js \
  OUTPUT_FILENAME=pouchdb.idb-alt.js \
  ./bin/build-plugin.sh