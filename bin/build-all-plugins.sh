#!/bin/sh

LEVEL_BACKEND=memdown ADAPTER_NAME=memory ./build-plugin.sh

LEVEL_BACKEND=localstorage-down ADAPTER_NAME=localstorage ./build-plugin.sh

LEVEL_BACKEND=index-js ADAPTER_NAME=idb-alt ./build-plugin.sh