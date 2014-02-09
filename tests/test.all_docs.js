"use strict";

var adapters = ['http-1', 'local-1'];

if (typeof module !== 'undefined' && module.exports) {
  var PouchDB = require('../lib');
  var testUtils = require('./test.utils.js');
}

adapters.map(function(adapter) {

  QUnit.module('all_docs: ' + adapter, {
    setup : function () {
      this.name = testUtils.generateAdapterUrl(adapter);
      PouchDB.enableAllDbs = true;
    },
    teardown: testUtils.cleanupTestDatabases
  });

  var origDocs = [
    {_id:"0",a:1,b:1},
    {_id:"3",a:4,b:16},
    {_id:"1",a:2,b:4},
    {_id:"2",a:3,b:9}
  ];

  asyncTest('Testing all docs', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        db.allDocs(function(err, result) {
          var rows = result.rows;
          ok(result.total_rows === 4, 'correct number of results');
          for(var i=0; i < rows.length; i++) {
            ok(rows[i].id >= "0" && rows[i].id <= "4", 'correct ids');
          }
          db.allDocs({startkey:"2", include_docs: true}, function(err, all) {
            ok(all.rows.length === 2, 'correct number when opts.startkey set');
            ok(all.rows[0].id === "2" && all.rows[1].id, 'correct docs when opts.startkey set');
            // TODO: implement offset
            //ok(all.offset == 2, 'offset correctly set');
            var opts = {startkey: "org.couchdb.user:", endkey: "org.couchdb.user;"};
            db.allDocs(opts, function(err, raw) {
              ok(raw.rows.length === 0, 'raw collation');
              var ids = ["0","3","1","2"];
              db.changes({
                complete: function(err, changes) {
                  changes.results.forEach(function(row, i) {
                    ok(row.id === ids[i], 'seq order');
                  });
                  db.changes({
                    descending: true,
                    complete: function(err, changes) {
                      ids = ["2","1","3","0"];
                      changes.results.forEach(function(row, i) {
                        ok(row.id === ids[i], 'descending=true');
                      });
                      start();
                    }
                  });
                }
              });
            });
          });
        });
      });
    });
  });

  asyncTest('Testing allDocs opts.keys', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        var keys = ["3", "1"];
        db.allDocs({keys: keys}, function(err, result) {
          var rows = result.rows;
          ok(rows.length === 2, 'correct number of rows');
          ok(rows[0].id === "3" && rows[1].id === "1", 'correct rows returned');
          keys = ["2", "0", "1000"];
          db.allDocs({keys: keys}, function(err, result) {
            var rows = result.rows;
            ok(rows.length === 3, 'correct number of rows');
            ok(rows[0].key === "2", 'correct first row');
            ok(rows[1].key === "0", 'correct second row');
            ok(rows[2].key === "1000" && rows[2].error === "not_found", 'correct third (non-existent) row - has error field');
            db.allDocs({keys: keys, descending: true}, function(err, result) {
              var rows = result.rows;
              ok(rows.length === 3, 'correct number of rows (desc)');
              ok(rows[2].key === "2", 'correct first row (desc)');
              ok(rows[1].key === "0", 'correct second row (desc)');
              ok(rows[0].key === "1000" && rows[0].error === "not_found", 'correct third (non-existent) row - has error field (desc)');
              db.allDocs({keys: keys, startkey: "a"}, function(err, result) {
                ok(err, 'error correctly reported - startkey is incompatible with keys');
                db.allDocs({keys: keys, endkey: "a"}, function(err, result) {
                  ok(err, 'error correctly reported - endkey is incompatible with keys');
                  db.allDocs({keys: []}, function(err, result) {
                    ok(!err && result.rows.length === 0, 'correct answer if keys is empty');
                    db.get("2", function(err, doc){
                      db.remove(doc, function(err, doc){
                        db.allDocs({keys: keys, include_docs: true}, function(err, result){
                          var rows = result.rows;
                          ok(rows.length === 3, 'correct number of rows');
                          ok(rows[0].key === "2" && rows[0].value.deleted, 'deleted doc reported properly');
                          ok(rows[1].key === "0", 'correct second doc');
                          ok(rows[2].key === "1000" && rows[2].error === "not_found", 'correct missing doc');
                          start();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  asyncTest('Testing deleting in changes', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        db.get('1', function(err, doc) {
          db.remove(doc, function(err, deleted) {
            ok(deleted.ok, 'deleted');
            db.changes({
              complete: function(err, changes) {
                ok(changes.results.length === 4);
                ok(changes.results[3].id === "1");
                ok(changes.results[3].deleted);
                start();
              }
            });
          });
        });
      });
    });
  });

  asyncTest('Testing updating in changes', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        db.get('3', function(err, doc) {
          doc.updated = 'totally';
          db.put(doc, function(err, doc) {
            db.changes({
              complete: function(err, changes) {
                ok(changes.results.length === 4);
                ok(changes.results[3].id === "3");
                start();
              }
            });
          });
        });
      });
    });
  });

  asyncTest('Testing include docs', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        db.changes({
          include_docs: true,
          complete: function(err, changes) {
            equal(changes.results[0].doc.a, 1);
            start();
          }
        });
      });
    });
  });

  asyncTest('Testing conflicts', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      testUtils.writeDocs(db, JSON.parse(JSON.stringify(origDocs)), function() {
        // add conflicts
        var conflictDoc1 = {
          _id: "3", _rev: "2-aa01552213fafa022e6167113ed01087", value: "X"
        };
        var conflictDoc2 = {
          _id: "3", _rev: "2-ff01552213fafa022e6167113ed01087", value: "Z"
        };
        db.put(conflictDoc1, {new_edits: false}, function(err, doc) {
          db.put(conflictDoc2, {new_edits: false}, function(err, doc) {
            db.get('3', function(err, winRev) {
              equal(winRev._rev, conflictDoc2._rev, "correct wining revision on get");
              var opts = {include_docs: true, conflicts: true, style: 'all_docs'};
              db.changes({
                include_docs: true,
                conflicts: true,
                style: 'all_docs',
                complete: function(err, changes) {
                  var result = changes.results[3];
                  ok("3" === result.id, 'changes are ordered');
                  equal(3, result.changes.length, 'correct number of changes');
                  ok(result.doc._rev === conflictDoc2._rev,
                     'correct winning revision');
                  equal("3", result.doc._id, 'correct doc id');
                  equal(winRev._rev, result.doc._rev,
                        'include doc has correct rev');
                  equal(true, result.doc._conflicts instanceof Array,
                        'include docs contains conflicts');
                  equal(2, result.doc._conflicts.length, 'correct number of changes');
                  equal(conflictDoc1._rev, result.doc._conflicts[0], 'correct conflict rev');
                  db.allDocs({include_docs: true, conflicts: true}, function(err, res) {
                    var row = res.rows[3];
                    equal(4, res.rows.length, 'correct number of changes');
                    equal("3", row.key, 'correct key');
                    equal("3", row.id, 'correct id');
                    equal(row.value.rev, winRev._rev, 'correct rev');
                    equal(row.doc._rev, winRev._rev, 'correct rev');
                    equal("3", row.doc._id, 'correct order');
                    ok(row.doc._conflicts instanceof Array);
                    equal(2, row.doc._conflicts.length, 'Correct number of conflicts');
                    equal(conflictDoc1._rev, res.rows[3].doc._conflicts[0], 'correct conflict rev');
                    start();
                  });
                }
              });
            });
          });
        });
      });
    });
  });

  asyncTest('test basic collation', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      var docs = {docs: [{_id: "z", foo: "z"}, {_id: "a", foo: "a"}]};
      db.bulkDocs(docs, function(err, res) {
        db.allDocs({startkey: 'z', endkey: 'z'}, function(err, result) {
          equal(result.rows.length, 1, 'Exclude a result');
          start();
        });
      });
    });
  });
  asyncTest('test total_rows with both skip and limit', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      var docs = {
        docs: [
          {_id: "w", foo: "w"},
          {_id: "x", foo: "x"},
          {_id: "y", foo: "y"},
          {_id: "z", foo: "z"}
        ]
      };
      db.bulkDocs(docs, function(err, res) {
        db.allDocs({ startkey: 'x', limit: 1 , skip : 1}, function (err, res) {
          equal(res.total_rows, 4, 'Accurately return total_rows count');
          equal(res.rows.length, 1, 'Correctly limit the returned rows');
          equal(res.rows[0].id, 'y', 'Correctly skip 1 doc');

          db.get('x', function(err, xDoc) {
            db.remove(xDoc, function(err, res){
              db.allDocs({ startkey: 'w', limit: 2 , skip : 1}, function(err, res) {
                equal(res.total_rows, 3, 'Accurately return total_rows count after delete');
                equal(res.rows.length, 2, 'Correctly limit the returned rows after delete');
                equal(res.rows[0].id, 'y', 'Correctly skip 1 doc after delete');
                start();
              })
            })
          })
        });
      });
    });
  });

  asyncTest('test limit option and total_rows', function() {
    testUtils.initTestDB(this.name, function(err, db) {
      var docs = {
        docs: [
          {_id: "z", foo: "z"},
          {_id: "a", foo: "a"}
        ]
      };
      db.bulkDocs(docs, function(err, res) {
        db.allDocs({ startkey: 'a', limit: 1 }, function (err, res) {
          equal(res.total_rows, 2, 'Accurately return total_rows count');
          equal(res.rows.length, 1, 'Correctly limit the returned rows.');
          start();
        });
      });
    });
  });
  asyncTest('test escaped startkey/endkey', 1, function () {
    testUtils.initTestDB(this.name, function (err, db) {
      var id1 = "\"crazy id!\" a";
      var id2 = "\"crazy id!\" z";
      var docs = {
        docs: [
          {_id: id1, foo: "a"},
          {_id: id2, foo: "z"}
        ]
      };
      db.bulkDocs(docs, function (err, res) {
        db.allDocs({ startkey: id1, endkey: id2 }, function (err, res) {
          equal(res.total_rows, 2, 'Accurately return total_rows count');
          start();
        });
      });
    });
  });

  asyncTest('test "key" option', function () {
    testUtils.initTestDB(this.name, function (err, db) {
      db.bulkDocs({docs : [{_id : '0'}, {_id : '1'}, {_id : '2'}]}, function(err) {
        ok(!err);
        db.allDocs({key : '1'}, function (err, res) {
          equal(res.rows.length, 1, 'key option returned 1 doc');
          db.allDocs({key : '1', keys : ['1', '2']}, function(err) {
            ok(err, 'error correctly reported - keys is incompatible with key');
            db.allDocs({key : '1', startkey : '1'}, function(err, res) {
              ok(!err, 'error correctly unreported - startkey is compatible with key');
              db.allDocs({key : '1', endkey : '1'}, function(err, res) {
                ok(!err, 'error correctly unreported - endkey is compatible with key');
                // when mixing key/startkey or key/endkey, the results
                // are very weird and probably undefined, so don't go beyond
                // verifying that there's no error
                start();
              })
            })
          })
        });
      })
    });
  });

  asyncTest('test total_rows with a variety of criteria', function() {
    this.timeout(20000);
    testUtils.initTestDB(this.name, function(err, db) {
      var docs = [
        {_id : '0'},
        {_id : '1'},
        {_id : '2'},
        {_id : '3'},
        {_id : '4'},
        {_id : '5'},
        {_id : '6'},
        {_id : '7'},
        {_id : '8'},
        {_id : '9'}
      ];
      db.bulkDocs({docs : docs}).then(function (res) {
        docs[3]._deleted = true;
        docs[7]._deleted = true;
        docs[3]._rev = res[3].rev;
        docs[7]._rev = res[7].rev;
        return db.remove(docs[3]);
      }).then(function () {
        return db.remove(docs[7]);
      }).then(function () {
        return db.allDocs();
      }).then(function (res) {
        equal(res.rows.length, 8, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5'})
      }).then(function (res) {
        equal(res.rows.length, 4, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', skip : 2, limit : 10})
      }).then(function (res) {
        equal(res.rows.length, 2, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', descending : true, skip : 1})
      }).then(function (res) {
        equal(res.rows.length, 4, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', endkey : 'z'})
      }).then(function (res) {
        equal(res.rows.length, 4, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', endkey : '5'})
      }).then(function (res) {
        equal(res.rows.length, 1, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', endkey : '4'});
      }).then(function (res) {
        equal(res.rows.length, 0, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '5', endkey : '4', descending : true});
      }).then(function (res) {
        equal(res.rows.length, 2, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '3', endkey : '7', descending : false});
      }).then(function (res) {
        equal(res.rows.length, 3, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '7', endkey : '3', descending : true});
      }).then(function (res) {
        equal(res.rows.length, 3, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({startkey : '', endkey : '0'});
      }).then(function (res) {
        equal(res.rows.length, 1, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({keys : ['0', '1', '3']});
      }).then(function (res) {
        equal(res.rows.length, 3, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({keys : []});
      }).then(function (res) {
        equal(res.rows.length, 0, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({keys : ['7']});
      }).then(function (res) {
        equal(res.rows.length, 1, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({key : '3'})
      }).then(function (res) {
        equal(res.rows.length, 0, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({key : '2'})
      }).then(function (res) {
        equal(res.rows.length, 1, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        return db.allDocs({key : 'z'})
      }).then(function (res) {
        equal(res.rows.length, 0, 'correctly return rows');
        equal(res.total_rows, 8, 'correctly return total_rows');
        start();
      }).catch(function (err) {
        ok(!err, 'got error: ' + JSON.stringify(err));
        start();
      });

    })
  });
});
