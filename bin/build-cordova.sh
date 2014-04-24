TESTS_DIR=tests/cordova

rm -fr $TESTS_DIR/www/vendor
rm -fr $TESTS_DIR/www/node_modules
rm -fr $TESTS_DIR/www/tests

cp -r vendor $TESTS_DIR/www/vendor
mkdir -p $TESTS_DIR/www/node_modules
cp -r node_modules/mocha node_modules/chai $TESTS_DIR/www/node_modules
cp -r tests $TESTS_DIR/www/tests

# TODO: make this bash script not suck
all_test_files=$(egrep '(test|browser).*.js' tests/test.html | sed "s/<script src='//g" | sed "s/'><\/script>//g" | awk '{print $1}' | tr '\n' ' ' | sed "s/ /','/g" | sed "s/,'$//g" | sed "s/^/'/g")
echo "var allTestFiles = [$all_test_files];" > $TESTS_DIR/www/tests/all-test-files.js
