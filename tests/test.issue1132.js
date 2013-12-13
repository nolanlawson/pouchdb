/*globals initTestDB: false, emit: true, generateAdapterUrl: false */
/*globals PERSIST_DATABASES: false, initDBPair: false, utils: true */
/*globals Pouch.ajax: true, LevelPouch: true */

"use strict";

var qunit = module;
var LevelPouch;
var utils;
var fs;

if (typeof module !== undefined && module.exports) {
    Pouch = require('../src/pouch.js');
    utils = require('./test.utils.js');
    fs = require('fs');

    for (var k in utils) {
        global[k] = global[k] || utils[k];
    }
    qunit = QUnit.module;
}


// Loop through all availible adapters
Object.keys(Pouch.adapters).forEach(function(adapter) {
    // allDbs method only works for local adapters
    if (adapter === "http" || adapter === "https") {
        return;
    }

    asyncTest("Fail to fetch a doc after db was deleted", function() {
        var dbName = 'foodb';
        var docid = 'foodoc';

        var pouchDB = new Pouch({name : dbName, adapter: adapter}, function onCreate() {

            pouchDB.put({_id : docid}, function onPut(){
                Pouch.destroy({name : dbName, adapter : adapter}, function onDestroy(){

                    pouchDB = new Pouch({name : dbName, adapter: adapter}, function onRecreate() {

                        pouchDB.get(docid, function onGet(err, doc){
                            equal(doc, undefined, explanation, 'adapter ' + adapter +' should not return the document,' +
                                ' because db was deleted');
                            notEqual(err, undefined, explanation, 'adapter ' + adapter +' should return error,' +
                                ' because db was deleted');
                            start();
                        })
                    });
                });
            });
        });
    });
});

