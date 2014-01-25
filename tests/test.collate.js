"use strict";

var adapters = ['http-1', 'local-1'];
var is_browser = true;

if (typeof module !== undefined && module.exports) {
  var PouchDB = require('../lib');
  var testUtils = require('./test.utils.js');
  is_browser = false;
}

var toIndexableString = PouchDB.utils.toIndexableString;

// via http://stackoverflow.com/a/6274398/680742
function shuffle(array) {
  var counter = array.length, temp, index;
  while (counter > 0) {
    index = Math.floor(Math.random() * counter);
    counter--;
    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}

// Big list of sorted keys, to ensure
// we honor CouchDB's complex sorting
// algorithm as faithfully as possible.
// Some exceptions:
// 1) UTF8 is sorted in Couch using libicu
// 2) SQLite sorts case-insensitive
// 3) V8 sorts Object.keys, which messes with object sorting
var sortedKeys = [
  null,
  false,
  true,
  -Number.MAX_VALUE,
  -300,
  -200,
  -100,
  -10,
  -2.5,
  -2,
  -1.5,
  -1,
  -0.5,
  -0.0001,
  -Number.MIN_VALUE,
  0,
  Number.MIN_VALUE,
  0.0001,
  0.1,
  0.5,
  1,
  1.5,
  2,
  3,
  10,
  15,
  100,
  200,
  300,
  Number.MAX_VALUE,
  '',
  '1',
  '10',
  '100',
  '2',
  '20',
  '[]',
  //'é', // UTF8
  'foo',
  'mo',
  'moe',
  //'moé', // UTF8
  //'moët et chandon', // UTF8
  'moz',
  'mozilla',
  'mozilla with a super long string see how far it can go',
  'mozzy',
  [],
  [ null ],
  [ null, null ],
  [ null, 'foo' ],
  [ false ],
  [ false, 100 ],
  [ true ],
  [ true, 100 ],
  [ 0 ],
  [ 0, null ],
  [ 0, 1 ],
  [ 0, '' ],
  [ 0, 'foo' ],
  [ '', '' ],
  [ 'foo' ],
  [ 'foo', 1 ],
  {},
  { '0': null },
  { '0': false },
  { '0': true },
  { '0': 0 },
  { '0': 1 },
  { '0': 'bar' },
  { '0': 'foo' },
  { '0': 'foo', '1': false },
  { '0': 'foo', '1': true },
  { '0': 'foo', '1': 0 },
  { '0': 'foo', '1': '0' },
  { '0': 'foo', '1': 'bar' },
  { '0': 'quux' },
  { '1': 'foo' }
  //{ '1': 'foo', '0' : 'foo' } // key order actually matters, but V8 sorts Object.keys
];

adapters.map(function(adapter) {

  QUnit.module("collate: " + adapter, {
    setup : function () {
      this.name = testUtils.generateAdapterUrl(adapter);
      PouchDB.enableAllDbs = true;
    },
    teardown: testUtils.cleanupTestDatabases
  });

  asyncTest('Verify db ordering of indexable strings', function () {
    testUtils.initTestDB(this.name, function (err, db) {
      var docs = shuffle(sortedKeys.map(function (key) {
        return { _id : toIndexableString(key), asJson : JSON.stringify(key)};
      }));
      db.bulkDocs({docs : docs}, function (err) {
        ok(!err, 'unexpected error on bulkDocs: ' + JSON.stringify(err));
        db.allDocs({include_docs : true}, function (err, res) {
          ok(!err, 'unexpected error on allDocs: ' + JSON.stringify(err));
          var returnedKeysAsJson = res.rows.map(function (row) {return row.doc.asJson; });
          var sortedKeysAsJson = sortedKeys.map(function (key) {return JSON.stringify(key); });

          deepEqual(returnedKeysAsJson, sortedKeysAsJson,
            'Expect internal db sorting to match indexable string sorting');
          start();
        });
      });
    });
  });
});