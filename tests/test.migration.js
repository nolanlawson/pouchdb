'use strict';

var adapters = ['local-1'];

if (typeof module !== 'undefined' && module.exports) {
  var PouchDB = require('../lib');
  var testUtils = require('./test.utils.js');
  var PouchDBVersion110 = require('./deps/pouchdb-1.1.0-postfixed.min.js');
}

adapters.map(function (adapter) {

  QUnit.module('migration: ' + adapter, {
    setup : function () {
      this.name = testUtils.generateAdapterUrl(adapter);
      PouchDB.enableAllDbs = true;
    },
    teardown: testUtils.cleanupTestDatabases
  });

  var origDocs = [
    {_id : '0', a : 1, b: 1},
    {_id : '3', a : 4, b: 16},
    {_id : '1', a : 2, b: 4},
    {_id : '2', a : 3, b: 9}
  ];

  asyncTest('Testing basic migration integrity', function () {
    var dbName = this.name;
    var oldPouch = new PouchDBVersion110(dbName);
    oldPouch.bulkDocs({docs : origDocs}, function (err, res) {
      origDocs[0]._deleted = true;
      origDocs[0]._rev = res[0].rev;
      oldPouch.remove(origDocs[0], function (err, res) {
        var pouch = new PouchDB(dbName);
        pouch.allDocs({key : '2'}, function (err, res) {
          ok(!err);
          equal(res.total_rows, 3);
          equal(res.rows.length, 1);
          pouch.allDocs({key : '0'}, function (err, res) {
            ok(!err);
            equal(res.total_rows, 3);
            equal(res.rows.length, 0);
            start();
          });
        });
      });
    });
  });
});