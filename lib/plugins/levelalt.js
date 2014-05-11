'use strict';

var LevelPouch = require('../adapters/leveldb');
var levelalt = require('levelalt');
var valid = require('adapter-config').valid;
var utils = require('../utils');

function LevelPouchAlt(opts, callback) {
  var _opts = utils.extend({
    db: levelalt
  }, opts);

  LevelPouch.call(this, _opts, callback);
}

LevelPouchAlt.valid = function () {
  return valid();
};

LevelPouchAlt.destroy = utils.toPromise(function (name, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  var _opts = utils.extend({
    db: levelalt
  }, opts);

  return LevelPouch.destroy(name, _opts, callback);
});

module.exports = LevelPouchAlt;
