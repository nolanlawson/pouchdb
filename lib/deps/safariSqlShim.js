/**
 * Safari SQL shim, designed to work around concurrency issues in Safari 6.x.
 *
 * If a broken Safari is detected, this script overrides the default <code>window.openDatabase</code>, returning a
 * wrapper that naively forces
 * the database to execute all transactions sequentially.
 *
 * TL;DR: performance will suffer, but it's better than a non-working WebSQL!
 *
 */

function safariSqlShim() {
  'use strict';

  var BROKEN_SAFARI_PATTERN = /Version\/6.\S+ Safari/;
  var DELAY = 5000;
  var tId = 1;
  var qId = 1;

  var cachedDatabases = {};

  if (!window || !window.navigator || !window.navigator.userAgent ||
        !BROKEN_SAFARI_PATTERN.test(window.navigator.userAgent)) {
    return;
  }

  function extendCallback(originalCallback, addedCallback) {
    return function(){
      var self = this;
      var selfArguments = [];
      for (var i = 0; i < arguments.length; i++){
        selfArguments.push(arguments[i]);
      }


      var errThrown;
      try {
        if (originalCallback && typeof originalCallback === typeof Function) {
          originalCallback.apply(self, selfArguments);
        }
      } catch (err) {
        errThrown = err;
      }

      addedCallback.apply(self, selfArguments);

      if (errThrown) {
        throw errThrown; // propagate only after calling the added callback
      }
    }
  }

  function Query(transaction, tx, sqlStatement, sqlArguments, callback, errorCallback) {
    var self = this;

    self.id = qId++;
    self.transaction = transaction;
    self.tx = tx;
    self.sqlStatement = sqlStatement;
    self.sqlArguments = sqlArguments;

    function processNextQuery() {
      window.console.log('processed query ' + self.id + '.');
      self.transaction.queryInProgress = null;
      self.transaction.processNextQuery();
    }

    self.callback = extendCallback(callback, processNextQuery);
    self.errorCallback = extendCallback(errorCallback, processNextQuery);
  }

  function Transaction(dbWrapper, isRead, callback, errorCallback, successCallback) {
    var self = this;

    self.id = tId++;
    self.dbWrapper = dbWrapper;
    self.isRead = isRead;

    function processNextTransaction() {
      setTimeout(function(){
        window.console.log('processed transaction ' + self.id + '.');
        self.dbWrapper.transactionInProgress = null;
        self.dbWrapper.processNextTransaction();
      }, DELAY);
    }

    self.errorCallback = extendCallback(errorCallback, processNextTransaction);
    self.successCallback = extendCallback(successCallback, processNextTransaction);

    self.queries = [];
    self.queryInProgress = null;

    self.callback = function(tx) {

      var txArguments = [];
      for (var i = 1; i < arguments.length; i++) {
        txArguments.push(arguments[i]);
      }

      callback.apply(null, [{
        executeSql : function(sqlStatement, sqlArguments, queryCallback, queryErrorCallback) {
          self.queries.push(new Query(self, tx, sqlStatement, sqlArguments, queryCallback, queryErrorCallback));
          self.processNextQuery();
        }
      }].concat(txArguments));
    };

  }

  Transaction.prototype.processNextQuery = function() {
    var self = this;

    if (self.queryInProgress) {
      window.console.log('query ' + self.queryInProgress + ' is already in progress.');
      return; // wait until query is done
    } else if (!self.queries.length) {
      return; // no queries left
    }

    // process query
    var query = self.queries.shift();
    self.queryInProgress = query.id;
    window.console.log('processing query ' + query.id + '...');
    try {
      query.tx.executeSql(query.sqlStatement, query.sqlArguments, query.callback, query.errorCallback);
    } catch (err) {
      window.console.log(JSON.stringify(err));
      //query.errorCallback.apply(null);
      self.queryInProgress = false;
    }

  }

  function DbWrapper(db) {
    var self = this;
    self.db = db;
    self.version = db.version;
    self.transactions = [];
    self.transactionInProgress = null;
  }

  DbWrapper.prototype.processNextTransaction = function() {
    var self = this;

    if (self.transactionInProgress) {
      window.console.log('transaction ' + self.transactionInProgress + ' is already in progress');
      return; // wait until transaction is done
    } else if (!self.transactions.length) {
      return; // no transactions left
    }

    // process transaction
    var transaction = self.transactions.shift();
    self.transactionInProgress = transaction.id;
    window.console.log('processing transaction ' + transaction.id + '...');
    var fun = transaction.isRead ? self.db.readTransaction : self.db.transaction;

    fun.apply(self.db, [transaction.callback, transaction.errorCallback, transaction.successCallback]);

  }

  DbWrapper.prototype.transaction = function(callback, errorCallback, successCallback) {
    var self = this;

    self.transactions.push(new Transaction(self, false, callback, errorCallback, successCallback));
    self.processNextTransaction();
  };

  DbWrapper.prototype.readTransaction = function(callback, errorCallback, successCallback) {
    var self = this;

    self.transactions.push(new Transaction(self, true, callback, errorCallback, successCallback));
    self.processNextTransaction();
  };

  DbWrapper.prototype.changeVersion = function(oldVersion, newVersion, callback, errorCallback, successCallback) {
    var self = this;

    function updateVersion() {
      self.version = self.db.version;
    };

    self.db.changeVersion(oldVersion, newVersion,
      extendCallback(callback, updateVersion),
      extendCallback(errorCallback, updateVersion),
      extendCallback(successCallback, updateVersion));

    updateVersion();

  };

  var originalOpenDatabase = window.openDatabase;
  window.openDatabase = function(name, version, description, size, success) {

    var dbWrapper = cachedDatabases[[name, version, description, size, success]];
    if (!dbWrapper) {
      dbWrapper = new DbWrapper(originalOpenDatabase(name, version, description, size, success));
      cachedDatabases[[name, version, description, size, success]] = dbWrapper;
    }
    return dbWrapper;
  }
}

exports.safariSqlShim = safariSqlShim;