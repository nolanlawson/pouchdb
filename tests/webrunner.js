/* global mocha: true */

'use strict';

var runner = mocha.run();
var results = {
  passed: 0,
  failed: 0,
  failures: []
};
function uuid () {
  var S4 = function () {
    return Math.floor(Math.random() * 65536).toString(16);
  };
  return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
}

var sessionUsername = 'testuser-' + uuid();
var password = uuid();
var testResultsDb = new PouchDB(sessionUsername);

function makeDoc(test) {
  return {
    user     : sessionUsername,
    session  : sessionUsername,
    async    : test.async,
    duration : test.duration,
    pending  : test.pending,
    parent   : test.parent.fullTitle(),
    title    : test.title,
    type     : test.type,
    speed    : test.speed,
    state    : test.state,
    sync     : test.sync,
    err      : test.err,
    _id      : test.fullTitle()
  };
}

runner.on('pass', function (test) {
  results.passed++;
  testResultsDb.put(makeDoc(test));
});

runner.on('fail', function (test) {
  results.failed++;
  results.failures.push({
    title: test.title,
    err: test.err
  });
  testResultsDb.put(makeDoc(test));
});

(function ($) {
  // sync test results to server
  var date = new Date();
  var sessionAsUser = {
    // couchdb _user stuff
    name          : sessionUsername,
    password      : password,
    type          : 'user',
    roles         : [],
    _id           : 'org.couchdb.user:' + sessionUsername
  };

  $.ajax({
    url : window.COUCHDB_HOST + '/_users',
    method : 'PUT',
    data   : sessionAsUser
  }).success(function () {
    var session = {
      // info to save
      _id           : sessionUsername,
      user          : sessionUsername,
      browser       : window.jQuery.ua.browser,
      userAgent     : window.navigator.userAgent,
      timestamp     : date.toJSON(),
      time          : date.getTime(),
      type          : 'session'
    };
    testResultsDb.put(session);
    var testResultsUrl = window.COUCHDB_HOST.replace('/\/\//', '//' + sessionUsername + ':' + password + '@') +
      '/test_results';
    testResultsDb.replicate.to(testResultsUrl);
  }).error(function (err) {
    console.log(err);
  });


})(jQuery);