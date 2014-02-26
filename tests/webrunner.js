/* global testResultsSync,mocha: true */

'use strict';

var runner = mocha.run();
var results = {
  passed: 0,
  failed: 0,
  failures: []
};

runner.on('pass', function (test) {
  testResultsSync.onPassOrFail(test);
  results.passed++;
});

runner.on('fail', function (e) {
  testResultsSync.onPassOrFail(e);
  results.failed++;
  results.failures.push({
    title: e.title,
    err: e.err
  });
});
