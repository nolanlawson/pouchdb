'use strict';

var LevelPouch = require('../adapters/leveldb');
var levelalt = require('levelalt');
var adapterConfig = require('adapter-config');
var utils = require('../utils');

function LevelPouchAlt(opts, callback) {
  var _opts = utils.extend({
    db: levelalt
  }, opts);

  LevelPouch.call(this, _opts, callback);
}

// overrides for normal LevelDB behavior on Node
LevelPouchAlt.valid = function () {
  return adapterConfig.valid();
};
LevelPouchAlt.use_prefix = adapterConfig.use_prefix;

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
