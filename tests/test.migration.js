'use strict';

var testHelpers = {};
var adapters = [['local-1', 'http-1']];
describe('migration', function () {
  adapters.map(function (adapterPair) {

    var local = adapterPair[0];
    var remote = adapterPair[1];

    describe(adapterPair, function () {
      beforeEach(function () {
        testHelpers.name = testUtils.generateAdapterUrl(local);
        testHelpers.remote = testUtils.generateAdapterUrl(remote);
        PouchDB.enableAllDbs = true;
        PouchDBVersion110.enableAllDbs = true;

        // uncomment to test websql in Chrome
        // delete PouchDBVersion110.adapters.idb;
        // delete PouchDB.adapters.idb;
      });
      afterEach(testUtils.cleanupTestDatabases);

      var origDocs = [
        {_id: '0', a: 1, b: 1},
        {_id: '3', a: 4, b: 16},
        {_id: '1', a: 2, b: 4},
        {_id: '2', a: 3, b: 9}
      ];

      it('Testing basic migration integrity', function (done) {
        var oldPouch = new PouchDBVersion110(testHelpers.name);
        oldPouch.bulkDocs({docs: origDocs}, function (err, res) {
          origDocs[0]._deleted = true;
          origDocs[0]._rev = res[0].rev;
          oldPouch.remove(origDocs[0], function (err, res) {
            setTimeout(function () {
              var newPouch = new PouchDB(testHelpers.name);
              newPouch.allDocs({key: '2'}, function (err, res) {
                should.not.exist(err, 'got error: ' + JSON.stringify(err));
                res.total_rows.should.equal(3);
                res.rows.should.have.length(1);
                newPouch.allDocs({key: '0'}, function (err, res) {
                  should.not.exist(err, 'got error: ' + JSON.stringify(err));
                  res.total_rows.should.equal(3);
                  res.rows.should.have.length(0);
                  done();
                });
              });
            }, 700);
          });
        });
      });

      it("Test basic replication with migration", function (done) {

        var docs = [
          {_id: "0", integer: 0, string: '0'},
          {_id: "1", integer: 1, string: '1'},
          {_id: "2", integer: 2, string: '2'},
          {_id: "3", integer: 3, string: '3', _deleted : true},
          {_id: "4", integer: 4, string: '4', _deleted : true}
        ];

        var oldPouch = new PouchDBVersion110(testHelpers.remote);
        oldPouch.bulkDocs({docs: docs}, {}, function (err, res) {
          oldPouch.replicate.to(testHelpers.name, {}, function (err, result) {
            should.not.exist(err, 'got error: ' + JSON.stringify(err));
            should.exist(result.ok, 'replication was ok');
            console.log(result);
            result.docs_written.should.equal(docs.length, 'correct # docs written');
            setTimeout(function () {
              var newPouch = new PouchDB(testHelpers.name);
              newPouch.allDocs({}, function (err, res) {
                should.not.exist(err, 'got error: ' + JSON.stringify(err));
                res.total_rows.should.equal(3);
                res.rows.should.have.length(3);
                done();
              });
            }, 700);
          });
        });
      });
    });
  });
});