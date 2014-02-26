/* export testResultsSync */
/* global jQuery,PouchDB */

'use strict';

var testResultsSync;

(function ($) {

  function uuid() {
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
      user: sessionUsername,
      session: sessionUsername,
      async: test.async,
      duration: test.duration,
      pending: test.pending,
      parent: test.parent.fullTitle(),
      title: test.title,
      type: test.type,
      speed: test.speed,
      state: test.state,
      sync: test.sync,
      err: test.err
    };
  }

  var api = {};

  api.onPassOrFail = function (test) {
    testResultsDb.post(makeDoc(test));
  };

  // sync test results to server
  var date = new Date();
  var userId = 'org.couchdb.user:' + sessionUsername;
  var sessionAsUser = {
    // couchdb _user stuff
    name: sessionUsername,
    password: password,
    type: 'user',
    roles: [],
    _id: userId
  };

  $.ajax('deps/pouch-commit.txt')
    .success(function (pouchCommitVersion) {

      $('#pouch-commit').empty().append($('<span></span>')
        .append($('<span> (</span>'))
        .append(
          $('<a></a>')
          .attr('href', 'https://github.com/daleharvey/pouchdb/commit/' + pouchCommitVersion)
          .text(pouchCommitVersion.substring(0, 7))
        )
        .append($('<span>) </span>'))
      );

      $.ajax({
        url: window.COUCHDB_HOST.replace(/http:\/\/(.*?:.*?@)?/,
          'http://') + '/_users/' + userId.replace(':', '%3A'),
        method: 'PUT',
        data: JSON.stringify(sessionAsUser),
        contentType: 'application/json'
      }).success(function (res) {
          var session = {
            // info to save
            user: sessionUsername,
            browser: window.jQuery.ua.browser,
            device: window.jQuery.ua.device,
            engine: window.jQuery.ua.engine,
            cpu: window.jQuery.ua.cpu,
            userAgent: window.navigator.userAgent,
            timestamp: date.toJSON(),
            time: date.getTime(),
            pouchVersion: PouchDB.version,
            pouchCommit: pouchCommitVersion,
            type: 'session'
          };
          testResultsDb.post(session);
          var testResultsUrl = window.COUCHDB_HOST.replace(/http:\/\/(.*?:.*?@)?/,
            'http://' + sessionUsername + ':' + password + '@') +
            '/test_reports';
          testResultsDb.replicate.to(testResultsUrl, {continuous: true});
        }).error(function (err) {
          console.log(err.responseText);
        });
    });

  testResultsSync = api;


})(jQuery);