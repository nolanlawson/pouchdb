// PouchDB 6.1.0-prerelease
// 
// (c) 2012-2016 Dale Harvey and the PouchDB team
// PouchDB may be freely distributed under the Apache license, version 2.0.
// For all details and documentation:
// http://pouchdb.com
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PouchDB = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
},{}],2:[function(require,module,exports){
(function (process){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if ('env' in (typeof process === 'undefined' ? {} : process)) {
    r = process.env.DEBUG;
  }
  
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))

},{"./debug":3,"_process":10}],3:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug.debug = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting
    args = exports.formatArgs.apply(self, args);

    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":9}],4:[function(require,module,exports){
(function (root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof exports === 'object') {
    module.exports = factory()
  } else {
    root.PromisePool = factory()
    // Legacy API
    root.promisePool = root.PromisePool
  }
})(this, function () {
  'use strict'

  var EventTarget = function () {
    this._listeners = {}
  }

  EventTarget.prototype.addEventListener = function (type, listener) {
    this._listeners[type] = this._listeners[type] || []
    if (this._listeners[type].indexOf(listener) < 0) {
      this._listeners[type].push(listener)
    }
  }

  EventTarget.prototype.removeEventListener = function (type, listener) {
    if (this._listeners[type]) {
      var p = this._listeners[type].indexOf(listener)
      if (p >= 0) {
        this._listeners[type].splice(p, 1)
      }
    }
  }

  EventTarget.prototype.dispatchEvent = function (evt) {
    if (this._listeners[evt.type] && this._listeners[evt.type].length) {
      var listeners = this._listeners[evt.type].slice()
      for (var i = 0, l = listeners.length; i < l; ++i) {
        listeners[i].call(this, evt)
      }
    }
  }

  var isGenerator = function (func) {
    return (typeof func.constructor === 'function' &&
      func.constructor.name === 'GeneratorFunction')
  }

  var functionToIterator = function (func) {
    return {
      next: function () {
        var promise = func()
        return promise ? {value: promise} : {done: true}
      }
    }
  }

  var promiseToIterator = function (promise) {
    var called = false
    return {
      next: function () {
        if (called) {
          return {done: true}
        }
        called = true
        return {value: promise}
      }
    }
  }

  var toIterator = function (obj, Promise) {
    var type = typeof obj
    if (type === 'object') {
      if (typeof obj.next === 'function') {
        return obj
      }
      /* istanbul ignore else */
      if (typeof obj.then === 'function') {
        return promiseToIterator(obj)
      }
    }
    if (type === 'function') {
      return isGenerator(obj) ? obj() : functionToIterator(obj)
    }
    return promiseToIterator(Promise.resolve(obj))
  }

  var PromisePoolEvent = function (target, type, data) {
    this.target = target
    this.type = type
    this.data = data
  }

  var PromisePool = function (source, concurrency, options) {
    EventTarget.call(this)
    if (typeof concurrency !== 'number' ||
        Math.floor(concurrency) !== concurrency ||
        concurrency < 1) {
      throw new Error('Invalid concurrency')
    }
    this._concurrency = concurrency
    this._options = options || {}
    this._options.promise = this._options.promise || Promise
    this._iterator = toIterator(source, this._options.promise)
    this._done = false
    this._size = 0
    this._promise = null
    this._callbacks = null
  }
  PromisePool.prototype = new EventTarget()
  PromisePool.prototype.constructor = PromisePool

  PromisePool.prototype.concurrency = function (value) {
    if (typeof value !== 'undefined') {
      this._concurrency = value
      if (this.active()) {
        this._proceed()
      }
    }
    return this._concurrency
  }

  PromisePool.prototype.size = function () {
    return this._size
  }

  PromisePool.prototype.active = function () {
    return !!this._promise
  }

  PromisePool.prototype.promise = function () {
    return this._promise
  }

  PromisePool.prototype.start = function () {
    var that = this
    var Promise = this._options.promise
    this._promise = new Promise(function (resolve, reject) {
      that._callbacks = {
        reject: reject,
        resolve: resolve
      }
      that._proceed()
    })
    return this._promise
  }

  PromisePool.prototype._fireEvent = function (type, data) {
    this.dispatchEvent(new PromisePoolEvent(this, type, data))
  }

  PromisePool.prototype._settle = function (error) {
    if (error) {
      this._callbacks.reject(error)
    } else {
      this._callbacks.resolve()
    }
    this._promise = null
    this._callbacks = null
  }

  PromisePool.prototype._onPooledPromiseFulfilled = function (promise, result) {
    this._size--
    if (this.active()) {
      this._fireEvent('fulfilled', {
        promise: promise,
        result: result
      })
      this._proceed()
    }
  }

  PromisePool.prototype._onPooledPromiseRejected = function (promise, error) {
    this._size--
    if (this.active()) {
      this._fireEvent('rejected', {
        promise: promise,
        error: error
      })
      this._settle(error || new Error('Unknown error'))
    }
  }

  PromisePool.prototype._trackPromise = function (promise) {
    var that = this
    promise
      .then(function (result) {
        that._onPooledPromiseFulfilled(promise, result)
      }, function (error) {
        that._onPooledPromiseRejected(promise, error)
      })['catch'](function (err) {
        that._settle(new Error('Promise processing failed: ' + err))
      })
  }

  PromisePool.prototype._proceed = function () {
    if (!this._done) {
      var result = null
      while (this._size < this._concurrency &&
          !(result = this._iterator.next()).done) {
        this._size++
        this._trackPromise(result.value)
      }
      this._done = (result === null || !!result.done)
    }
    if (this._done && this._size === 0) {
      this._settle()
    }
  }

  PromisePool.PromisePoolEvent = PromisePoolEvent
  // Legacy API
  PromisePool.PromisePool = PromisePool

  return PromisePool
})

},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
(function (global){
'use strict';
var Mutation = global.MutationObserver || global.WebKitMutationObserver;

var scheduleDrain;

{
  if (Mutation) {
    var called = 0;
    var observer = new Mutation(nextTick);
    var element = global.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    scheduleDrain = function () {
      element.data = (called = ++called % 2);
    };
  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
    var channel = new global.MessageChannel();
    channel.port1.onmessage = nextTick;
    scheduleDrain = function () {
      channel.port2.postMessage(0);
    };
  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
    scheduleDrain = function () {

      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = global.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        nextTick();

        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      global.document.documentElement.appendChild(scriptEl);
    };
  } else {
    scheduleDrain = function () {
      setTimeout(nextTick, 0);
    };
  }
}

var draining;
var queue = [];
//named nextTick for less confusing stack traces
function nextTick() {
  draining = true;
  var i, oldQueue;
  var len = queue.length;
  while (len) {
    oldQueue = queue;
    queue = [];
    i = -1;
    while (++i < len) {
      oldQueue[i]();
    }
    len = queue.length;
  }
  draining = false;
}

module.exports = immediate;
function immediate(task) {
  if (queue.push(task) === 1 && !draining) {
    scheduleDrain();
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
'use strict';
var immediate = require('immediate');

/* istanbul ignore next */
function INTERNAL() {}

var handlers = {};

var REJECTED = ['REJECTED'];
var FULFILLED = ['FULFILLED'];
var PENDING = ['PENDING'];

module.exports = Promise;

function Promise(resolver) {
  if (typeof resolver !== 'function') {
    throw new TypeError('resolver must be a function');
  }
  this.state = PENDING;
  this.queue = [];
  this.outcome = void 0;
  if (resolver !== INTERNAL) {
    safelyResolveThenable(this, resolver);
  }
}

Promise.prototype["catch"] = function (onRejected) {
  return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
    typeof onRejected !== 'function' && this.state === REJECTED) {
    return this;
  }
  var promise = new this.constructor(INTERNAL);
  if (this.state !== PENDING) {
    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
    unwrap(promise, resolver, this.outcome);
  } else {
    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
  }

  return promise;
};
function QueueItem(promise, onFulfilled, onRejected) {
  this.promise = promise;
  if (typeof onFulfilled === 'function') {
    this.onFulfilled = onFulfilled;
    this.callFulfilled = this.otherCallFulfilled;
  }
  if (typeof onRejected === 'function') {
    this.onRejected = onRejected;
    this.callRejected = this.otherCallRejected;
  }
}
QueueItem.prototype.callFulfilled = function (value) {
  handlers.resolve(this.promise, value);
};
QueueItem.prototype.otherCallFulfilled = function (value) {
  unwrap(this.promise, this.onFulfilled, value);
};
QueueItem.prototype.callRejected = function (value) {
  handlers.reject(this.promise, value);
};
QueueItem.prototype.otherCallRejected = function (value) {
  unwrap(this.promise, this.onRejected, value);
};

function unwrap(promise, func, value) {
  immediate(function () {
    var returnValue;
    try {
      returnValue = func(value);
    } catch (e) {
      return handlers.reject(promise, e);
    }
    if (returnValue === promise) {
      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
    } else {
      handlers.resolve(promise, returnValue);
    }
  });
}

handlers.resolve = function (self, value) {
  var result = tryCatch(getThen, value);
  if (result.status === 'error') {
    return handlers.reject(self, result.value);
  }
  var thenable = result.value;

  if (thenable) {
    safelyResolveThenable(self, thenable);
  } else {
    self.state = FULFILLED;
    self.outcome = value;
    var i = -1;
    var len = self.queue.length;
    while (++i < len) {
      self.queue[i].callFulfilled(value);
    }
  }
  return self;
};
handlers.reject = function (self, error) {
  self.state = REJECTED;
  self.outcome = error;
  var i = -1;
  var len = self.queue.length;
  while (++i < len) {
    self.queue[i].callRejected(error);
  }
  return self;
};

function getThen(obj) {
  // Make sure we only access the accessor once as required by the spec
  var then = obj && obj.then;
  if (obj && typeof obj === 'object' && typeof then === 'function') {
    return function appyThen() {
      then.apply(obj, arguments);
    };
  }
}

function safelyResolveThenable(self, thenable) {
  // Either fulfill, reject or reject with error
  var called = false;
  function onError(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.reject(self, value);
  }

  function onSuccess(value) {
    if (called) {
      return;
    }
    called = true;
    handlers.resolve(self, value);
  }

  function tryToUnwrap() {
    thenable(onSuccess, onError);
  }

  var result = tryCatch(tryToUnwrap);
  if (result.status === 'error') {
    onError(result.value);
  }
}

function tryCatch(func, value) {
  var out = {};
  try {
    out.value = func(value);
    out.status = 'success';
  } catch (e) {
    out.status = 'error';
    out.value = e;
  }
  return out;
}

Promise.resolve = resolve;
function resolve(value) {
  if (value instanceof this) {
    return value;
  }
  return handlers.resolve(new this(INTERNAL), value);
}

Promise.reject = reject;
function reject(reason) {
  var promise = new this(INTERNAL);
  return handlers.reject(promise, reason);
}

Promise.all = all;
function all(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var values = new Array(len);
  var resolved = 0;
  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    allResolver(iterable[i], i);
  }
  return promise;
  function allResolver(value, i) {
    self.resolve(value).then(resolveFromAll, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
    function resolveFromAll(outValue) {
      values[i] = outValue;
      if (++resolved === len && !called) {
        called = true;
        handlers.resolve(promise, values);
      }
    }
  }
}

Promise.race = race;
function race(iterable) {
  var self = this;
  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
    return this.reject(new TypeError('must be an array'));
  }

  var len = iterable.length;
  var called = false;
  if (!len) {
    return this.resolve([]);
  }

  var i = -1;
  var promise = new this(INTERNAL);

  while (++i < len) {
    resolver(iterable[i]);
  }
  return promise;
  function resolver(value) {
    self.resolve(value).then(function (response) {
      if (!called) {
        called = true;
        handlers.resolve(promise, response);
      }
    }, function (error) {
      if (!called) {
        called = true;
        handlers.reject(promise, error);
      }
    });
  }
}

},{"immediate":6}],9:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],10:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.9.2
(function() {
  var hasProp = {}.hasOwnProperty,
    slice = [].slice;

  module.exports = function(source, scope) {
    var key, keys, value, values;
    keys = [];
    values = [];
    for (key in scope) {
      if (!hasProp.call(scope, key)) continue;
      value = scope[key];
      if (key === 'this') {
        continue;
      }
      keys.push(key);
      values.push(value);
    }
    return Function.apply(null, slice.call(keys).concat([source])).apply(scope["this"], values);
  };

}).call(this);

},{}],12:[function(require,module,exports){
(function (factory) {
    if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else {
        // Browser globals (with support for web workers)
        var glob;

        try {
            glob = window;
        } catch (e) {
            glob = self;
        }

        glob.SparkMD5 = factory();
    }
}(function (undefined) {

    'use strict';

    /*
     * Fastest md5 implementation around (JKM md5).
     * Credits: Joseph Myers
     *
     * @see http://www.myersdaily.org/joseph/javascript/md5-text.html
     * @see http://jsperf.com/md5-shootout/7
     */

    /* this function is much faster,
      so if possible we use it. Some IEs
      are the only ones I know of that
      need the idiotic second function,
      generated by an if clause.  */
    var add32 = function (a, b) {
        return (a + b) & 0xFFFFFFFF;
    },
        hex_chr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];


    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function md5cycle(x, k) {
        var a = x[0],
            b = x[1],
            c = x[2],
            d = x[3];

        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);

        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);

        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);

        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);
    }

    function md5blk(s) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    function md5blk_array(a) {
        var md5blks = [],
            i; /* Andy King said do it this way. */

        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
    }

    function md51(s) {
        var n = s.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);
        return state;
    }

    function md51_array(a) {
        var n = a.length,
            state = [1732584193, -271733879, -1732584194, 271733878],
            i,
            length,
            tail,
            tmp,
            lo,
            hi;

        for (i = 64; i <= n; i += 64) {
            md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }

        // Not sure if it is a bug, however IE10 will always produce a sub array of length 1
        // containing the last element of the parent array if the sub array specified starts
        // beyond the length of the parent array - weird.
        // https://connect.microsoft.com/IE/feedback/details/771452/typed-array-subarray-issue
        a = (i - 64) < n ? a.subarray(i - 64) : new Uint8Array(0);

        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= a[i] << ((i % 4) << 3);
        }

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Beware that the final length might not fit in 32 bits so we take care of that
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;

        md5cycle(state, tail);

        return state;
    }

    function rhex(n) {
        var s = '',
            j;
        for (j = 0; j < 4; j += 1) {
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    function hex(x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
            x[i] = rhex(x[i]);
        }
        return x.join('');
    }

    // In some cases the fast add32 function cannot be used..
    if (hex(md51('hello')) !== '5d41402abc4b2a76b9719d911017c592') {
        add32 = function (x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
                msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        };
    }

    // ---------------------------------------------------

    /**
     * ArrayBuffer slice polyfill.
     *
     * @see https://github.com/ttaubert/node-arraybuffer-slice
     */

    if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
        (function () {
            function clamp(val, length) {
                val = (val | 0) || 0;

                if (val < 0) {
                    return Math.max(val + length, 0);
                }

                return Math.min(val, length);
            }

            ArrayBuffer.prototype.slice = function (from, to) {
                var length = this.byteLength,
                    begin = clamp(from, length),
                    end = length,
                    num,
                    target,
                    targetArray,
                    sourceArray;

                if (to !== undefined) {
                    end = clamp(to, length);
                }

                if (begin > end) {
                    return new ArrayBuffer(0);
                }

                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);

                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);

                return target;
            };
        })();
    }

    // ---------------------------------------------------

    /**
     * Helpers.
     */

    function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
            str = unescape(encodeURIComponent(str));
        }

        return str;
    }

    function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length,
           buff = new ArrayBuffer(length),
           arr = new Uint8Array(buff),
           i;

        for (i = 0; i < length; i += 1) {
            arr[i] = str.charCodeAt(i);
        }

        return returnUInt8Array ? arr : buff;
    }

    function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
    }

    function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);

        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);

        return returnUInt8Array ? result : result.buffer;
    }

    function hexToBinaryString(hex) {
        var bytes = [],
            length = hex.length,
            x;

        for (x = 0; x < length - 1; x += 2) {
            bytes.push(parseInt(hex.substr(x, 2), 16));
        }

        return String.fromCharCode.apply(String, bytes);
    }

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation.
     *
     * Use this class to perform an incremental md5, otherwise use the
     * static methods instead.
     */

    function SparkMD5() {
        // call reset to init the instance
        this.reset();
    }

    /**
     * Appends a string.
     * A conversion will be applied if an utf8 string is detected.
     *
     * @param {String} str The string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.append = function (str) {
        // Converts the string to utf8 bytes if necessary
        // Then append as binary
        this.appendBinary(toUtf8(str));

        return this;
    };

    /**
     * Appends a binary string.
     *
     * @param {String} contents The binary string to be appended
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.appendBinary = function (contents) {
        this._buff += contents;
        this._length += contents.length;

        var length = this._buff.length,
            i;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
        }

        this._buff = this._buff.substring(i - 64);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            i,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff.charCodeAt(i) << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.reset = function () {
        this._buff = '';
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.prototype.getState = function () {
        return {
            buff: this._buff,
            length: this._length,
            hash: this._hash
        };
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5} The instance itself
     */
    SparkMD5.prototype.setState = function (state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;

        return this;
    };

    /**
     * Releases memory used by the incremental buffer and other additional
     * resources. If you plan to use the instance again, use reset instead.
     */
    SparkMD5.prototype.destroy = function () {
        delete this._hash;
        delete this._buff;
        delete this._length;
    };

    /**
     * Finish the final calculation based on the tail.
     *
     * @param {Array}  tail   The tail (will be modified)
     * @param {Number} length The length of the remaining buffer
     */
    SparkMD5.prototype._finish = function (tail, length) {
        var i = length,
            tmp,
            lo,
            hi;

        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(this._hash, tail);
            for (i = 0; i < 16; i += 1) {
                tail[i] = 0;
            }
        }

        // Do the final computation based on the tail and length
        // Beware that the final length may not fit in 32 bits so we take care of that
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;

        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
    };

    /**
     * Performs the md5 hash on a string.
     * A conversion will be applied if utf8 string is detected.
     *
     * @param {String}  str The string
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hash = function (str, raw) {
        // Converts the string to utf8 bytes if necessary
        // Then compute it using the binary function
        return SparkMD5.hashBinary(toUtf8(str), raw);
    };

    /**
     * Performs the md5 hash on a binary string.
     *
     * @param {String}  content The binary string
     * @param {Boolean} raw     True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.hashBinary = function (content, raw) {
        var hash = md51(content),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    // ---------------------------------------------------

    /**
     * SparkMD5 OOP implementation for array buffers.
     *
     * Use this class to perform an incremental md5 ONLY for array buffers.
     */
    SparkMD5.ArrayBuffer = function () {
        // call reset to init the instance
        this.reset();
    };

    /**
     * Appends an array buffer.
     *
     * @param {ArrayBuffer} arr The array to be appended
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.append = function (arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr, true),
            length = buff.length,
            i;

        this._length += arr.byteLength;

        for (i = 64; i <= length; i += 64) {
            md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
        }

        this._buff = (i - 64) < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);

        return this;
    };

    /**
     * Finishes the incremental computation, reseting the internal state and
     * returning the result.
     *
     * @param {Boolean} raw True to get the raw string, false to get the hex string
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.prototype.end = function (raw) {
        var buff = this._buff,
            length = buff.length,
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            i,
            ret;

        for (i = 0; i < length; i += 1) {
            tail[i >> 2] |= buff[i] << ((i % 4) << 3);
        }

        this._finish(tail, length);
        ret = hex(this._hash);

        if (raw) {
            ret = hexToBinaryString(ret);
        }

        this.reset();

        return ret;
    };

    /**
     * Resets the internal state of the computation.
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.reset = function () {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];

        return this;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @return {Object} The state
     */
    SparkMD5.ArrayBuffer.prototype.getState = function () {
        var state = SparkMD5.prototype.getState.call(this);

        // Convert buffer to a string
        state.buff = arrayBuffer2Utf8Str(state.buff);

        return state;
    };

    /**
     * Gets the internal state of the computation.
     *
     * @param {Object} state The state
     *
     * @return {SparkMD5.ArrayBuffer} The instance itself
     */
    SparkMD5.ArrayBuffer.prototype.setState = function (state) {
        // Convert string to buffer
        state.buff = utf8Str2ArrayBuffer(state.buff, true);

        return SparkMD5.prototype.setState.call(this, state);
    };

    SparkMD5.ArrayBuffer.prototype.destroy = SparkMD5.prototype.destroy;

    SparkMD5.ArrayBuffer.prototype._finish = SparkMD5.prototype._finish;

    /**
     * Performs the md5 hash on an array buffer.
     *
     * @param {ArrayBuffer} arr The array buffer
     * @param {Boolean}     raw True to get the raw string, false to get the hex one
     *
     * @return {String} The result
     */
    SparkMD5.ArrayBuffer.hash = function (arr, raw) {
        var hash = md51_array(new Uint8Array(arr)),
            ret = hex(hash);

        return raw ? hexToBinaryString(ret) : ret;
    };

    return SparkMD5;
}));

},{}],13:[function(require,module,exports){
'use strict';

/**
 * Stringify/parse functions that don't operate
 * recursively, so they avoid call stack exceeded
 * errors.
 */
exports.stringify = function stringify(input) {
  var queue = [];
  queue.push({obj: input});

  var res = '';
  var next, obj, prefix, val, i, arrayPrefix, keys, k, key, value, objPrefix;
  while ((next = queue.pop())) {
    obj = next.obj;
    prefix = next.prefix || '';
    val = next.val || '';
    res += prefix;
    if (val) {
      res += val;
    } else if (typeof obj !== 'object') {
      res += typeof obj === 'undefined' ? null : JSON.stringify(obj);
    } else if (obj === null) {
      res += 'null';
    } else if (Array.isArray(obj)) {
      queue.push({val: ']'});
      for (i = obj.length - 1; i >= 0; i--) {
        arrayPrefix = i === 0 ? '' : ',';
        queue.push({obj: obj[i], prefix: arrayPrefix});
      }
      queue.push({val: '['});
    } else { // object
      keys = [];
      for (k in obj) {
        if (obj.hasOwnProperty(k)) {
          keys.push(k);
        }
      }
      queue.push({val: '}'});
      for (i = keys.length - 1; i >= 0; i--) {
        key = keys[i];
        value = obj[key];
        objPrefix = (i > 0 ? ',' : '');
        objPrefix += JSON.stringify(key) + ':';
        queue.push({obj: value, prefix: objPrefix});
      }
      queue.push({val: '{'});
    }
  }
  return res;
};

// Convenience function for the parse function.
// This pop function is basically copied from
// pouchCollate.parseIndexableString
function pop(obj, stack, metaStack) {
  var lastMetaElement = metaStack[metaStack.length - 1];
  if (obj === lastMetaElement.element) {
    // popping a meta-element, e.g. an object whose value is another object
    metaStack.pop();
    lastMetaElement = metaStack[metaStack.length - 1];
  }
  var element = lastMetaElement.element;
  var lastElementIndex = lastMetaElement.index;
  if (Array.isArray(element)) {
    element.push(obj);
  } else if (lastElementIndex === stack.length - 2) { // obj with key+value
    var key = stack.pop();
    element[key] = obj;
  } else {
    stack.push(obj); // obj with key only
  }
}

exports.parse = function (str) {
  var stack = [];
  var metaStack = []; // stack for arrays and objects
  var i = 0;
  var collationIndex,parsedNum,numChar;
  var parsedString,lastCh,numConsecutiveSlashes,ch;
  var arrayElement, objElement;
  while (true) {
    collationIndex = str[i++];
    if (collationIndex === '}' ||
        collationIndex === ']' ||
        typeof collationIndex === 'undefined') {
      if (stack.length === 1) {
        return stack.pop();
      } else {
        pop(stack.pop(), stack, metaStack);
        continue;
      }
    }
    switch (collationIndex) {
      case ' ':
      case '\t':
      case '\n':
      case ':':
      case ',':
        break;
      case 'n':
        i += 3; // 'ull'
        pop(null, stack, metaStack);
        break;
      case 't':
        i += 3; // 'rue'
        pop(true, stack, metaStack);
        break;
      case 'f':
        i += 4; // 'alse'
        pop(false, stack, metaStack);
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '-':
        parsedNum = '';
        i--;
        while (true) {
          numChar = str[i++];
          if (/[\d\.\-e\+]/.test(numChar)) {
            parsedNum += numChar;
          } else {
            i--;
            break;
          }
        }
        pop(parseFloat(parsedNum), stack, metaStack);
        break;
      case '"':
        parsedString = '';
        lastCh = void 0;
        numConsecutiveSlashes = 0;
        while (true) {
          ch = str[i++];
          if (ch !== '"' || (lastCh === '\\' &&
              numConsecutiveSlashes % 2 === 1)) {
            parsedString += ch;
            lastCh = ch;
            if (lastCh === '\\') {
              numConsecutiveSlashes++;
            } else {
              numConsecutiveSlashes = 0;
            }
          } else {
            break;
          }
        }
        pop(JSON.parse('"' + parsedString + '"'), stack, metaStack);
        break;
      case '[':
        arrayElement = { element: [], index: stack.length };
        stack.push(arrayElement.element);
        metaStack.push(arrayElement);
        break;
      case '{':
        objElement = { element: {}, index: stack.length };
        stack.push(objElement.element);
        metaStack.push(objElement);
        break;
      default:
        throw new Error(
          'unexpectedly reached end of input: ' + collationIndex);
    }
  }
};

},{}],14:[function(require,module,exports){
(function (process,global){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var lie = _interopDefault(require('lie'));
var getArguments = _interopDefault(require('argsarray'));
var debug = _interopDefault(require('debug'));
var events = require('events');
var inherits = _interopDefault(require('inherits'));
var scopedEval = _interopDefault(require('scope-eval'));
var Md5 = _interopDefault(require('spark-md5'));
var vuvuzela = _interopDefault(require('vuvuzela'));
var PromisePool = _interopDefault(require('es6-promise-pool'));

/* istanbul ignore next */
var PouchPromise = typeof Promise === 'function' ? Promise : lie;

function isBinaryObject(object) {
  return (typeof ArrayBuffer !== 'undefined' && object instanceof ArrayBuffer) ||
    (typeof Blob !== 'undefined' && object instanceof Blob);
}

function cloneArrayBuffer(buff) {
  if (typeof buff.slice === 'function') {
    return buff.slice(0);
  }
  // IE10-11 slice() polyfill
  var target = new ArrayBuffer(buff.byteLength);
  var targetArray = new Uint8Array(target);
  var sourceArray = new Uint8Array(buff);
  targetArray.set(sourceArray);
  return target;
}

function cloneBinaryObject(object) {
  if (object instanceof ArrayBuffer) {
    return cloneArrayBuffer(object);
  }
  var size = object.size;
  var type = object.type;
  // Blob
  if (typeof object.slice === 'function') {
    return object.slice(0, size, type);
  }
  // PhantomJS slice() replacement
  return object.webkitSlice(0, size, type);
}

// most of this is borrowed from lodash.isPlainObject:
// https://github.com/fis-components/lodash.isplainobject/
// blob/29c358140a74f252aeb08c9eb28bef86f2217d4a/index.js

var funcToString = Function.prototype.toString;
var objectCtorString = funcToString.call(Object);

function isPlainObject(value) {
  var proto = Object.getPrototypeOf(value);
  /* istanbul ignore if */
  if (proto === null) { // not sure when this happens, but I guess it can
    return true;
  }
  var Ctor = proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

function clone(object) {
  var newObject;
  var i;
  var len;

  if (!object || typeof object !== 'object') {
    return object;
  }

  if (Array.isArray(object)) {
    newObject = [];
    for (i = 0, len = object.length; i < len; i++) {
      newObject[i] = clone(object[i]);
    }
    return newObject;
  }

  // special case: to avoid inconsistencies between IndexedDB
  // and other backends, we automatically stringify Dates
  if (object instanceof Date) {
    return object.toISOString();
  }

  if (isBinaryObject(object)) {
    return cloneBinaryObject(object);
  }

  if (!isPlainObject(object)) {
    return object; // don't clone objects like Workers
  }

  newObject = {};
  for (i in object) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(object, i)) {
      var value = clone(object[i]);
      if (typeof value !== 'undefined') {
        newObject[i] = value;
      }
    }
  }
  return newObject;
}

function once(fun) {
  var called = false;
  return getArguments(function (args) {
    /* istanbul ignore if */
    if (called) {
      // this is a smoke test and should never actually happen
      throw new Error('once called more than once');
    } else {
      called = true;
      fun.apply(this, args);
    }
  });
}

function toPromise(func) {
  //create the function we will be returning
  return getArguments(function (args) {
    // Clone arguments
    args = clone(args);
    var self = this;
    var tempCB =
      (typeof args[args.length - 1] === 'function') ? args.pop() : false;
    // if the last argument is a function, assume its a callback
    var usedCB;
    if (tempCB) {
      // if it was a callback, create a new callback which calls it,
      // but do so async so we don't trap any errors
      usedCB = function (err, resp) {
        process.nextTick(function () {
          tempCB(err, resp);
        });
      };
    }
    var promise = new PouchPromise(function (fulfill, reject) {
      var resp;
      try {
        var callback = once(function (err, mesg) {
          if (err) {
            reject(err);
          } else {
            fulfill(mesg);
          }
        });
        // create a callback for this invocation
        // apply the function in the orig context
        args.push(callback);
        resp = func.apply(self, args);
        if (resp && typeof resp.then === 'function') {
          fulfill(resp);
        }
      } catch (e) {
        reject(e);
      }
    });
    // if there is a callback, call it back
    if (usedCB) {
      promise.then(function (result) {
        usedCB(null, result);
      }, usedCB);
    }
    return promise;
  });
}

var log = debug('pouchdb:api');

function adapterFun(name, callback) {
  function logApiCall(self, name, args) {
    /* istanbul ignore if */
    if (log.enabled) {
      var logArgs = [self.name, name];
      for (var i = 0; i < args.length - 1; i++) {
        logArgs.push(args[i]);
      }
      log.apply(null, logArgs);

      // override the callback itself to log the response
      var origCallback = args[args.length - 1];
      args[args.length - 1] = function (err, res) {
        var responseArgs = [self.name, name];
        responseArgs = responseArgs.concat(
          err ? ['error', err] : ['success', res]
        );
        log.apply(null, responseArgs);
        origCallback(err, res);
      };
    }
  }

  return toPromise(getArguments(function (args) {
    if (this._closed) {
      return PouchPromise.reject(new Error('database is closed'));
    }
    if (this._destroyed) {
      return PouchPromise.reject(new Error('database is destroyed'));
    }
    var self = this;
    logApiCall(self, name, args);
    if (!this.taskqueue.isReady) {
      return new PouchPromise(function (fulfill, reject) {
        self.taskqueue.addTask(function (failed) {
          if (failed) {
            reject(failed);
          } else {
            fulfill(self[name].apply(self, args));
          }
        });
      });
    }
    return callback.apply(this, args);
  }));
}

// like underscore/lodash _.pick()
function pick(obj, arr) {
  var res = {};
  for (var i = 0, len = arr.length; i < len; i++) {
    var prop = arr[i];
    if (prop in obj) {
      res[prop] = obj[prop];
    }
  }
  return res;
}

// Most browsers throttle concurrent requests at 6, so it's silly
// to shim _bulk_get by trying to launch potentially hundreds of requests
// and then letting the majority time out. We can handle this ourselves.
var MAX_NUM_CONCURRENT_REQUESTS = 6;

function identityFunction(x) {
  return x;
}

function formatResultForOpenRevsGet(result) {
  return [{
    ok: result
  }];
}

// shim for P/CouchDB adapters that don't directly implement _bulk_get
function bulkGet(db, opts, callback) {
  var requests = opts.docs;

  // consolidate into one request per doc if possible
  var requestsById = {};
  requests.forEach(function (request) {
    if (request.id in requestsById) {
      requestsById[request.id].push(request);
    } else {
      requestsById[request.id] = [request];
    }
  });

  var numDocs = Object.keys(requestsById).length;
  var numDone = 0;
  var perDocResults = new Array(numDocs);

  function collapseResultsAndFinish() {
    var results = [];
    perDocResults.forEach(function (res) {
      res.docs.forEach(function (info) {
        results.push({
          id: res.id,
          docs: [info]
        });
      });
    });
    callback(null, {results: results});
  }

  function checkDone() {
    if (++numDone === numDocs) {
      collapseResultsAndFinish();
    }
  }

  function gotResult(docIndex, id, docs) {
    perDocResults[docIndex] = {id: id, docs: docs};
    checkDone();
  }

  var allRequests = Object.keys(requestsById);

  var i = 0;

  function nextBatch() {

    if (i >= allRequests.length) {
      return;
    }

    var upTo = Math.min(i + MAX_NUM_CONCURRENT_REQUESTS, allRequests.length);
    var batch = allRequests.slice(i, upTo);
    processBatch(batch, i);
    i += batch.length;
  }

  function processBatch(batch, offset) {
    batch.forEach(function (docId, j) {
      var docIdx = offset + j;
      var docRequests = requestsById[docId];

      // just use the first request as the "template"
      // TODO: The _bulk_get API allows for more subtle use cases than this,
      // but for now it is unlikely that there will be a mix of different
      // "atts_since" or "attachments" in the same request, since it's just
      // replicate.js that is using this for the moment.
      // Also, atts_since is aspirational, since we don't support it yet.
      var docOpts = pick(docRequests[0], ['atts_since', 'attachments']);
      docOpts.open_revs = docRequests.map(function (request) {
        // rev is optional, open_revs disallowed
        return request.rev;
      });

      // remove falsey / undefined revisions
      docOpts.open_revs = docOpts.open_revs.filter(identityFunction);

      var formatResult = identityFunction;

      if (docOpts.open_revs.length === 0) {
        delete docOpts.open_revs;

        // when fetching only the "winning" leaf,
        // transform the result so it looks like an open_revs
        // request
        formatResult = formatResultForOpenRevsGet;
      }

      // globally-supplied options
      ['revs', 'attachments', 'binary', 'ajax'].forEach(function (param) {
        if (param in opts) {
          docOpts[param] = opts[param];
        }
      });
      db.get(docId, docOpts, function (err, res) {
        var result;
        /* istanbul ignore if */
        if (err) {
          result = [{error: err}];
        } else {
          result = formatResult(res);
        }
        gotResult(docIdx, docId, result);
        nextBatch();
      });
    });
  }

  nextBatch();

}

function isChromeApp() {
  return (typeof chrome !== "undefined" &&
    typeof chrome.storage !== "undefined" &&
    typeof chrome.storage.local !== "undefined");
}

var hasLocal;

if (isChromeApp()) {
  hasLocal = false;
} else {
  try {
    localStorage.setItem('_pouch_check_localstorage', 1);
    hasLocal = !!localStorage.getItem('_pouch_check_localstorage');
  } catch (e) {
    hasLocal = false;
  }
}

function hasLocalStorage() {
  return hasLocal;
}

inherits(Changes, events.EventEmitter);

/* istanbul ignore next */
function attachBrowserEvents(self) {
  if (isChromeApp()) {
    chrome.storage.onChanged.addListener(function (e) {
      // make sure it's event addressed to us
      if (e.db_name != null) {
        //object only has oldValue, newValue members
        self.emit(e.dbName.newValue);
      }
    });
  } else if (hasLocalStorage()) {
    if (typeof addEventListener !== 'undefined') {
      addEventListener("storage", function (e) {
        self.emit(e.key);
      });
    } else { // old IE
      window.attachEvent("storage", function (e) {
        self.emit(e.key);
      });
    }
  }
}

function Changes() {
  events.EventEmitter.call(this);
  this._listeners = {};

  attachBrowserEvents(this);
}
Changes.prototype.addListener = function (dbName, id, db, opts) {
  /* istanbul ignore if */
  if (this._listeners[id]) {
    return;
  }
  var self = this;
  var inprogress = false;
  function eventFunction() {
    /* istanbul ignore if */
    if (!self._listeners[id]) {
      return;
    }
    if (inprogress) {
      inprogress = 'waiting';
      return;
    }
    inprogress = true;
    var changesOpts = pick(opts, [
      'style', 'include_docs', 'attachments', 'conflicts', 'filter',
      'doc_ids', 'view', 'since', 'query_params', 'binary'
    ]);

    /* istanbul ignore next */
    function onError() {
      inprogress = false;
    }

    db.changes(changesOpts).on('change', function (c) {
      if (c.seq > opts.since && !opts.cancelled) {
        opts.since = c.seq;
        opts.onChange(c);
      }
    }).on('complete', function () {
      if (inprogress === 'waiting') {
        setTimeout(function (){
          eventFunction();
        },0);
      }
      inprogress = false;
    }).on('error', onError);
  }
  this._listeners[id] = eventFunction;
  this.on(dbName, eventFunction);
};

Changes.prototype.removeListener = function (dbName, id) {
  /* istanbul ignore if */
  if (!(id in this._listeners)) {
    return;
  }
  events.EventEmitter.prototype.removeListener.call(this, dbName,
    this._listeners[id]);
  delete this._listeners[id];
};


/* istanbul ignore next */
Changes.prototype.notifyLocalWindows = function (dbName) {
  //do a useless change on a storage thing
  //in order to get other windows's listeners to activate
  if (isChromeApp()) {
    chrome.storage.local.set({dbName: dbName});
  } else if (hasLocalStorage()) {
    localStorage[dbName] = (localStorage[dbName] === "a") ? "b" : "a";
  }
};

Changes.prototype.notify = function (dbName) {
  this.emit(dbName);
  this.notifyLocalWindows(dbName);
};

function guardedConsole(method) {
  /* istanbul ignore else */
  if (console !== 'undefined' && method in console) {
    var args = Array.prototype.slice.call(arguments, 1);
    console[method].apply(console, args);
  }
}

function randomNumber(min, max) {
  var maxTimeout = 600000; // Hard-coded default of 10 minutes
  min = parseInt(min, 10) || 0;
  max = parseInt(max, 10);
  if (max !== max || max <= min) {
    max = (min || 1) << 1; //doubling
  } else {
    max = max + 1;
  }
  // In order to not exceed maxTimeout, pick a random value between half of maxTimeout and maxTimeout
  if(max > maxTimeout) {
    min = maxTimeout >> 1; // divide by two
    max = maxTimeout;
  }
  var ratio = Math.random();
  var range = max - min;

  return ~~(range * ratio + min); // ~~ coerces to an int, but fast.
}

function defaultBackOff(min) {
  var max = 0;
  if (!min) {
    max = 2000;
  }
  return randomNumber(min, max);
}

// designed to give info to browser users, who are disturbed
// when they see http errors in the console
function explainError(status, str) {
  guardedConsole('info', 'The above ' + status + ' is totally normal. ' + str);
}

// forked from
// https://github.com/vmattos/js-extend/blob/7023fd69a9e9552688086b8b8006b1fcf916a306/extend.js
// TODO: I don't know why we have two different extend() functions in PouchDB

var slice = Array.prototype.slice;
var each = Array.prototype.forEach;

function extend$1(obj) {
  if (typeof obj !== 'object') {
    throw obj + ' is not an object' ;
  }

  var sources = slice.call(arguments, 1);

  each.call(sources, function (source) {
    if (source) {
      for (var prop in source) {
        if (typeof source[prop] === 'object' && obj[prop]) {
          extend$1.call(obj, obj[prop], source[prop]);
        } else {
          obj[prop] = source[prop];
        }
      }
    }
  });

  return obj;
}

inherits(PouchError, Error);

function PouchError(status, error, reason) {
  Error.call(this, reason);
  this.status = status;
  this.name = error;
  this.message = reason;
  this.error = true;
}

PouchError.prototype.toString = function () {
  return JSON.stringify({
    status: this.status,
    name: this.name,
    message: this.message,
    reason: this.reason
  });
};

var UNAUTHORIZED = new PouchError(401, 'unauthorized', "Name or password is incorrect.");
var MISSING_BULK_DOCS = new PouchError(400, 'bad_request', "Missing JSON list of 'docs'");
var MISSING_DOC = new PouchError(404, 'not_found', 'missing');
var REV_CONFLICT = new PouchError(409, 'conflict', 'Document update conflict');
var INVALID_ID = new PouchError(400, 'bad_request', '_id field must contain a string');
var MISSING_ID = new PouchError(412, 'missing_id', '_id is required for puts');
var RESERVED_ID = new PouchError(400, 'bad_request', 'Only reserved document ids may start with underscore.');
var NOT_OPEN = new PouchError(412, 'precondition_failed', 'Database not open');
var UNKNOWN_ERROR = new PouchError(500, 'unknown_error', 'Database encountered an unknown error');
var BAD_ARG = new PouchError(500, 'badarg', 'Some query argument is invalid');
var INVALID_REQUEST = new PouchError(400, 'invalid_request', 'Request was invalid');
var QUERY_PARSE_ERROR = new PouchError(400, 'query_parse_error', 'Some query parameter is invalid');
var DOC_VALIDATION = new PouchError(500, 'doc_validation', 'Bad special document member');
var BAD_REQUEST = new PouchError(400, 'bad_request', 'Something wrong with the request');
var NOT_AN_OBJECT = new PouchError(400, 'bad_request', 'Document must be a JSON object');
var DB_MISSING = new PouchError(404, 'not_found', 'Database not found');
var IDB_ERROR = new PouchError(500, 'indexed_db_went_bad', 'unknown');
var WSQ_ERROR = new PouchError(500, 'web_sql_went_bad', 'unknown');
var LDB_ERROR = new PouchError(500, 'levelDB_went_went_bad', 'unknown');
var FORBIDDEN = new PouchError(403, 'forbidden', 'Forbidden by design doc validate_doc_update function');
var INVALID_REV = new PouchError(400, 'bad_request', 'Invalid rev format');
var FILE_EXISTS = new PouchError(412, 'file_exists', 'The database could not be created, the file already exists.');
var MISSING_STUB = new PouchError(412, 'missing_stub', 'A pre-existing attachment stub wasn\'t found');
var INVALID_URL = new PouchError(413, 'invalid_url', 'Provided URL is invalid');

function createError(error, reason) {
  function CustomPouchError(reason) {
    // inherit error properties from our parent error manually
    // so as to allow proper JSON parsing.
    /* jshint ignore:start */
    for (var p in error) {
      if (typeof error[p] !== 'function') {
        this[p] = error[p];
      }
    }
    /* jshint ignore:end */
    if (reason !== undefined) {
      this.reason = reason;
    }
  }
  CustomPouchError.prototype = PouchError.prototype;
  return new CustomPouchError(reason);
}

function generateErrorFromResponse(err) {

  if (typeof err !== 'object') {
    var data = err;
    err = UNKNOWN_ERROR;
    err.data = data;
  }

  if ('error' in err && err.error === 'conflict') {
    err.name = 'conflict';
    err.status = 409;
  }

  if (!('name' in err)) {
    err.name = err.error || 'unknown';
  }

  if (!('status' in err)) {
    err.status = 500;
  }

  if (!('message' in err)) {
    err.message = err.message || err.reason;
  }

  return err;
}

function tryFilter(filter, doc, req) {
  try {
    return !filter(doc, req);
  } catch (err) {
    var msg = 'Filter function threw: ' + err.toString();
    return createError(BAD_REQUEST, msg);
  }
}

function filterChange(opts) {
  var req = {};
  var hasFilter = opts.filter && typeof opts.filter === 'function';
  req.query = opts.query_params;

  return function filter(change) {
    if (!change.doc) {
      // CSG sends events on the changes feed that don't have documents,
      // this hack makes a whole lot of existing code robust.
      change.doc = {};
    }

    var filterReturn = hasFilter && tryFilter(opts.filter, change.doc, req);

    if (typeof filterReturn === 'object') {
      return filterReturn;
    }

    if (filterReturn) {
      return false;
    }

    if (!opts.include_docs) {
      delete change.doc;
    } else if (!opts.attachments) {
      for (var att in change.doc._attachments) {
        /* istanbul ignore else */
        if (change.doc._attachments.hasOwnProperty(att)) {
          change.doc._attachments[att].stub = true;
        }
      }
    }
    return true;
  };
}

function flatten(arrs) {
  var res = [];
  for (var i = 0, len = arrs.length; i < len; i++) {
    res = res.concat(arrs[i]);
  }
  return res;
}

// Determine id an ID is valid
//   - invalid IDs begin with an underescore that does not begin '_design' or
//     '_local'
//   - any other string value is a valid id
// Returns the specific error object for each case
function invalidIdError(id) {
  var err;
  if (!id) {
    err = createError(MISSING_ID);
  } else if (typeof id !== 'string') {
    err = createError(INVALID_ID);
  } else if (/^_/.test(id) && !(/^_(design|local)/).test(id)) {
    err = createError(RESERVED_ID);
  }
  if (err) {
    throw err;
  }
}

function listenerCount(ee, type) {
  return 'listenerCount' in ee ? ee.listenerCount(type) :
                                 events.EventEmitter.listenerCount(ee, type);
}

function parseDesignDocFunctionName(s) {
  if (!s) {
    return null;
  }
  var parts = s.split('/');
  if (parts.length === 2) {
    return parts;
  }
  if (parts.length === 1) {
    return [s, s];
  }
  return null;
}

function normalizeDesignDocFunctionName(s) {
  var normalized = parseDesignDocFunctionName(s);
  return normalized ? normalized.join('/') : null;
}

// originally parseUri 1.2.2, now patched by us
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
var keys = ["source", "protocol", "authority", "userInfo", "user", "password",
    "host", "port", "relative", "path", "directory", "file", "query", "anchor"];
var qName ="queryKey";
var qParser = /(?:^|&)([^&=]*)=?([^&]*)/g;

// use the "loose" parser
/* jshint maxlen: false */
var parser = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

function parseUri(str) {
  var m = parser.exec(str);
  var uri = {};
  var i = 14;

  while (i--) {
    var key = keys[i];
    var value = m[i] || "";
    var encoded = ['user', 'password'].indexOf(key) !== -1;
    uri[key] = encoded ? decodeURIComponent(value) : value;
  }

  uri[qName] = {};
  uri[keys[12]].replace(qParser, function ($0, $1, $2) {
    if ($1) {
      uri[qName][$1] = $2;
    }
  });

  return uri;
}

// this is essentially the "update sugar" function from daleharvey/pouchdb#1388
// the diffFun tells us what delta to apply to the doc.  it either returns
// the doc, or false if it doesn't need to do an update after all
function upsert(db, docId, diffFun) {
  return new PouchPromise(function (fulfill, reject) {
    db.get(docId, function (err, doc) {
      if (err) {
        /* istanbul ignore next */
        if (err.status !== 404) {
          return reject(err);
        }
        doc = {};
      }

      // the user might change the _rev, so save it for posterity
      var docRev = doc._rev;
      var newDoc = diffFun(doc);

      if (!newDoc) {
        // if the diffFun returns falsy, we short-circuit as
        // an optimization
        return fulfill({updated: false, rev: docRev});
      }

      // users aren't allowed to modify these values,
      // so reset them here
      newDoc._id = docId;
      newDoc._rev = docRev;
      fulfill(tryAndPut(db, newDoc, diffFun));
    });
  });
}

function tryAndPut(db, doc, diffFun) {
  return db.put(doc).then(function (res) {
    return {
      updated: true,
      rev: res.rev
    };
  }, function (err) {
    /* istanbul ignore next */
    if (err.status !== 409) {
      throw err;
    }
    return upsert(db, doc._id, diffFun);
  });
}

// BEGIN Math.uuid.js

/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. 
 *   // (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
var chars = (
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz'
).split('');
function getValue(radix) {
  return 0 | Math.random() * radix;
}
function uuid(len, radix) {
  radix = radix || chars.length;
  var out = '';
  var i = -1;

  if (len) {
    // Compact form
    while (++i < len) {
      out += chars[getValue(radix)];
    }
    return out;
  }
    // rfc4122, version 4 form
    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
  while (++i < 36) {
    switch (i) {
      case 8:
      case 13:
      case 18:
      case 23:
        out += '-';
        break;
      case 19:
        out += chars[(getValue(16) & 0x3) | 0x8];
        break;
      default:
        out += chars[getValue(16)];
    }
  }

  return out;
}

// based on https://github.com/montagejs/collections
function mangle(key) {
  return '$' + key;
}
function unmangle(key) {
  return key.substring(1);
}
function _Map() {
  this.store = {};
}
_Map.prototype.get = function (key) {
  var mangled = mangle(key);
  return this.store[mangled];
};
_Map.prototype.set = function (key, value) {
  var mangled = mangle(key);
  this.store[mangled] = value;
  return true;
};
_Map.prototype.has = function (key) {
  var mangled = mangle(key);
  return mangled in this.store;
};
_Map.prototype.delete = function (key) {
  var mangled = mangle(key);
  var res = mangled in this.store;
  delete this.store[mangled];
  return res;
};
_Map.prototype.forEach = function (cb) {
  var keys = Object.keys(this.store);
  for (var i = 0, len = keys.length; i < len; i++) {
    var key = keys[i];
    var value = this.store[key];
    key = unmangle(key);
    cb(value, key);
  }
};

function _Set(array) {
  this.store = new _Map();

  // init with an array
  if (array && Array.isArray(array)) {
    for (var i = 0, len = array.length; i < len; i++) {
      this.add(array[i]);
    }
  }
}
_Set.prototype.add = function (key) {
  return this.store.set(key, true);
};
_Set.prototype.has = function (key) {
  return this.store.has(key);
};

// We fetch all leafs of the revision tree, and sort them based on tree length
// and whether they were deleted, undeleted documents with the longest revision
// tree (most edits) win
// The final sort algorithm is slightly documented in a sidebar here:
// http://guide.couchdb.org/draft/conflicts.html
function winningRev(metadata) {
  var winningId;
  var winningPos;
  var winningDeleted;
  var toVisit = metadata.rev_tree.slice();
  var node;
  while ((node = toVisit.pop())) {
    var tree = node.ids;
    var branches = tree[2];
    var pos = node.pos;
    if (branches.length) { // non-leaf
      for (var i = 0, len = branches.length; i < len; i++) {
        toVisit.push({pos: pos + 1, ids: branches[i]});
      }
      continue;
    }
    var deleted = !!tree[1].deleted;
    var id = tree[0];
    // sort by deleted, then pos, then id
    if (!winningId || (winningDeleted !== deleted ? winningDeleted :
        winningPos !== pos ? winningPos < pos : winningId < id)) {
      winningId = id;
      winningPos = pos;
      winningDeleted = deleted;
    }
  }

  return winningPos + '-' + winningId;
}

// Pretty much all below can be combined into a higher order function to
// traverse revisions
// The return value from the callback will be passed as context to all
// children of that node
function traverseRevTree(revs, callback) {
  var toVisit = revs.slice();

  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var branches = tree[2];
    var newCtx =
      callback(branches.length === 0, pos, tree[0], node.ctx, tree[1]);
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: pos + 1, ids: branches[i], ctx: newCtx});
    }
  }
}

function sortByPos(a, b) {
  return a.pos - b.pos;
}

function collectLeaves(revs) {
  var leaves = [];
  traverseRevTree(revs, function (isLeaf, pos, id, acc, opts) {
    if (isLeaf) {
      leaves.push({rev: pos + "-" + id, pos: pos, opts: opts});
    }
  });
  leaves.sort(sortByPos).reverse();
  for (var i = 0, len = leaves.length; i < len; i++) {
    delete leaves[i].pos;
  }
  return leaves;
}

// returns revs of all conflicts that is leaves such that
// 1. are not deleted and
// 2. are different than winning revision
function collectConflicts(metadata) {
  var win = winningRev(metadata);
  var leaves = collectLeaves(metadata.rev_tree);
  var conflicts = [];
  for (var i = 0, len = leaves.length; i < len; i++) {
    var leaf = leaves[i];
    if (leaf.rev !== win && !leaf.opts.deleted) {
      conflicts.push(leaf.rev);
    }
  }
  return conflicts;
}

// compact a tree by marking its non-leafs as missing,
// and return a list of revs to delete
function compactTree(metadata) {
  var revs = [];
  traverseRevTree(metadata.rev_tree, function (isLeaf, pos,
                                               revHash, ctx, opts) {
    if (opts.status === 'available' && !isLeaf) {
      revs.push(pos + '-' + revHash);
      opts.status = 'missing';
    }
  });
  return revs;
}

// build up a list of all the paths to the leafs in this revision tree
function rootToLeaf(revs) {
  var paths = [];
  var toVisit = revs.slice();
  var node;
  while ((node = toVisit.pop())) {
    var pos = node.pos;
    var tree = node.ids;
    var id = tree[0];
    var opts = tree[1];
    var branches = tree[2];
    var isLeaf = branches.length === 0;

    var history = node.history ? node.history.slice() : [];
    history.push({id: id, opts: opts});
    if (isLeaf) {
      paths.push({pos: (pos + 1 - history.length), ids: history});
    }
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: pos + 1, ids: branches[i], history: history});
    }
  }
  return paths.reverse();
}

// for a better overview of what this is doing, read:
// https://github.com/apache/couchdb-couch/blob/master/src/couch_key_tree.erl
//
// But for a quick intro, CouchDB uses a revision tree to store a documents
// history, A -> B -> C, when a document has conflicts, that is a branch in the
// tree, A -> (B1 | B2 -> C), We store these as a nested array in the format
//
// KeyTree = [Path ... ]
// Path = {pos: position_from_root, ids: Tree}
// Tree = [Key, Opts, [Tree, ...]], in particular single node: [Key, []]

function sortByPos$1(a, b) {
  return a.pos - b.pos;
}

// classic binary search
function binarySearch(arr, item, comparator) {
  var low = 0;
  var high = arr.length;
  var mid;
  while (low < high) {
    mid = (low + high) >>> 1;
    if (comparator(arr[mid], item) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

// assuming the arr is sorted, insert the item in the proper place
function insertSorted(arr, item, comparator) {
  var idx = binarySearch(arr, item, comparator);
  arr.splice(idx, 0, item);
}

// Turn a path as a flat array into a tree with a single branch.
// If any should be stemmed from the beginning of the array, that's passed
// in as the second argument
function pathToTree(path, numStemmed) {
  var root;
  var leaf;
  for (var i = numStemmed, len = path.length; i < len; i++) {
    var node = path[i];
    var currentLeaf = [node.id, node.opts, []];
    if (leaf) {
      leaf[2].push(currentLeaf);
      leaf = currentLeaf;
    } else {
      root = leaf = currentLeaf;
    }
  }
  return root;
}

// compare the IDs of two trees
function compareTree(a, b) {
  return a[0] < b[0] ? -1 : 1;
}

// Merge two trees together
// The roots of tree1 and tree2 must be the same revision
function mergeTree(in_tree1, in_tree2) {
  var queue = [{tree1: in_tree1, tree2: in_tree2}];
  var conflicts = false;
  while (queue.length > 0) {
    var item = queue.pop();
    var tree1 = item.tree1;
    var tree2 = item.tree2;

    if (tree1[1].status || tree2[1].status) {
      tree1[1].status =
        (tree1[1].status ===  'available' ||
        tree2[1].status === 'available') ? 'available' : 'missing';
    }

    for (var i = 0; i < tree2[2].length; i++) {
      if (!tree1[2][0]) {
        conflicts = 'new_leaf';
        tree1[2][0] = tree2[2][i];
        continue;
      }

      var merged = false;
      for (var j = 0; j < tree1[2].length; j++) {
        if (tree1[2][j][0] === tree2[2][i][0]) {
          queue.push({tree1: tree1[2][j], tree2: tree2[2][i]});
          merged = true;
        }
      }
      if (!merged) {
        conflicts = 'new_branch';
        insertSorted(tree1[2], tree2[2][i], compareTree);
      }
    }
  }
  return {conflicts: conflicts, tree: in_tree1};
}

function doMerge(tree, path, dontExpand) {
  var restree = [];
  var conflicts = false;
  var merged = false;
  var res;

  if (!tree.length) {
    return {tree: [path], conflicts: 'new_leaf'};
  }

  for (var i = 0, len = tree.length; i < len; i++) {
    var branch = tree[i];
    if (branch.pos === path.pos && branch.ids[0] === path.ids[0]) {
      // Paths start at the same position and have the same root, so they need
      // merged
      res = mergeTree(branch.ids, path.ids);
      restree.push({pos: branch.pos, ids: res.tree});
      conflicts = conflicts || res.conflicts;
      merged = true;
    } else if (dontExpand !== true) {
      // The paths start at a different position, take the earliest path and
      // traverse up until it as at the same point from root as the path we
      // want to merge.  If the keys match we return the longer path with the
      // other merged After stemming we dont want to expand the trees

      var t1 = branch.pos < path.pos ? branch : path;
      var t2 = branch.pos < path.pos ? path : branch;
      var diff = t2.pos - t1.pos;

      var candidateParents = [];

      var trees = [];
      trees.push({ids: t1.ids, diff: diff, parent: null, parentIdx: null});
      while (trees.length > 0) {
        var item = trees.pop();
        if (item.diff === 0) {
          if (item.ids[0] === t2.ids[0]) {
            candidateParents.push(item);
          }
          continue;
        }
        var elements = item.ids[2];
        for (var j = 0, elementsLen = elements.length; j < elementsLen; j++) {
          trees.push({
            ids: elements[j],
            diff: item.diff - 1,
            parent: item.ids,
            parentIdx: j
          });
        }
      }

      var el = candidateParents[0];

      if (!el) {
        restree.push(branch);
      } else {
        res = mergeTree(el.ids, t2.ids);
        el.parent[2][el.parentIdx] = res.tree;
        restree.push({pos: t1.pos, ids: t1.ids});
        conflicts = conflicts || res.conflicts;
        merged = true;
      }
    } else {
      restree.push(branch);
    }
  }

  // We didnt find
  if (!merged) {
    restree.push(path);
  }

  restree.sort(sortByPos$1);

  return {
    tree: restree,
    conflicts: conflicts || 'internal_node'
  };
}

// To ensure we dont grow the revision tree infinitely, we stem old revisions
function stem(tree, depth) {
  // First we break out the tree into a complete list of root to leaf paths
  var paths = rootToLeaf(tree);
  var maybeStem = {};

  var result;
  for (var i = 0, len = paths.length; i < len; i++) {
    // Then for each path, we cut off the start of the path based on the
    // `depth` to stem to, and generate a new set of flat trees
    var path = paths[i];
    var stemmed = path.ids;
    var numStemmed = Math.max(0, stemmed.length - depth);
    var stemmedNode = {
      pos: path.pos + numStemmed,
      ids: pathToTree(stemmed, numStemmed)
    };

    for (var s = 0; s < numStemmed; s++) {
      var rev = (path.pos + s) + '-' + stemmed[s].id;
      maybeStem[rev] = true;
    }

    // Then we remerge all those flat trees together, ensuring that we dont
    // connect trees that would go beyond the depth limit
    if (result) {
      result = doMerge(result, stemmedNode, true).tree;
    } else {
      result = [stemmedNode];
    }
  }

  traverseRevTree(result, function (isLeaf, pos, revHash) {
    // some revisions may have been removed in a branch but not in another
    delete maybeStem[pos + '-' + revHash];
  });

  return {
    tree: result,
    revs: Object.keys(maybeStem)
  };
}

function merge(tree, path, depth) {
  var newTree = doMerge(tree, path);
  var stemmed = stem(newTree.tree, depth);
  return {
    tree: stemmed.tree,
    stemmedRevs: stemmed.revs,
    conflicts: newTree.conflicts
  };
}

// return true if a rev exists in the rev tree, false otherwise
function revExists(revs, rev) {
  var toVisit = revs.slice();
  var splitRev = rev.split('-');
  var targetPos = parseInt(splitRev[0], 10);
  var targetId = splitRev[1];

  var node;
  while ((node = toVisit.pop())) {
    if (node.pos === targetPos && node.ids[0] === targetId) {
      return true;
    }
    var branches = node.ids[2];
    for (var i = 0, len = branches.length; i < len; i++) {
      toVisit.push({pos: node.pos + 1, ids: branches[i]});
    }
  }
  return false;
}

function getTrees(node) {
  return node.ids;
}

// check if a specific revision of a doc has been deleted
//  - metadata: the metadata object from the doc store
//  - rev: (optional) the revision to check. defaults to winning revision
function isDeleted(metadata, rev) {
  if (!rev) {
    rev = winningRev(metadata);
  }
  var id = rev.substring(rev.indexOf('-') + 1);
  var toVisit = metadata.rev_tree.map(getTrees);

  var tree;
  while ((tree = toVisit.pop())) {
    if (tree[0] === id) {
      return !!tree[1].deleted;
    }
    toVisit = toVisit.concat(tree[2]);
  }
}

function isLocalId(id) {
  return (/^_local/).test(id);
}

function evalFilter(input) {
  return scopedEval('"use strict";\nreturn ' + input + ';', {});
}

function evalView(input) {
  var code = [
    'return function(doc) {',
    '  "use strict";',
    '  var emitted = false;',
    '  var emit = function (a, b) {',
    '    emitted = true;',
    '  };',
    '  var view = ' + input + ';',
    '  view(doc);',
    '  if (emitted) {',
    '    return true;',
    '  }',
    '};'
  ].join('\n');

  return scopedEval(code, {});
}

inherits(Changes$1, events.EventEmitter);

function tryCatchInChangeListener(self, change) {
  // isolate try/catches to avoid V8 deoptimizations
  try {
    self.emit('change', change);
  } catch (e) {
    guardedConsole('error', 'Error in .on("change", function):', e);
  }
}

function Changes$1(db, opts, callback) {
  events.EventEmitter.call(this);
  var self = this;
  this.db = db;
  opts = opts ? clone(opts) : {};
  var complete = opts.complete = once(function (err, resp) {
    if (err) {
      if (listenerCount(self, 'error') > 0) {
        self.emit('error', err);
      }
    } else {
      self.emit('complete', resp);
    }
    self.removeAllListeners();
    db.removeListener('destroyed', onDestroy);
  });
  if (callback) {
    self.on('complete', function (resp) {
      callback(null, resp);
    });
    self.on('error', callback);
  }
  function onDestroy() {
    self.cancel();
  }
  db.once('destroyed', onDestroy);

  opts.onChange = function (change) {
    /* istanbul ignore if */
    if (opts.isCancelled) {
      return;
    }
    tryCatchInChangeListener(self, change);
  };

  var promise = new PouchPromise(function (fulfill, reject) {
    opts.complete = function (err, res) {
      if (err) {
        reject(err);
      } else {
        fulfill(res);
      }
    };
  });
  self.once('cancel', function () {
    db.removeListener('destroyed', onDestroy);
    opts.complete(null, {status: 'cancelled'});
  });
  this.then = promise.then.bind(promise);
  this['catch'] = promise['catch'].bind(promise);
  this.then(function (result) {
    complete(null, result);
  }, complete);



  if (!db.taskqueue.isReady) {
    db.taskqueue.addTask(function (failed) {
      if (failed) {
        opts.complete(failed);
      } else if (self.isCancelled) {
        self.emit('cancel');
      } else {
        self.doChanges(opts);
      }
    });
  } else {
    self.doChanges(opts);
  }
}
Changes$1.prototype.cancel = function () {
  this.isCancelled = true;
  if (this.db.taskqueue.isReady) {
    this.emit('cancel');
  }
};
function processChange(doc, metadata, opts) {
  var changeList = [{rev: doc._rev}];
  if (opts.style === 'all_docs') {
    changeList = collectLeaves(metadata.rev_tree)
    .map(function (x) { return {rev: x.rev}; });
  }
  var change = {
    id: metadata.id,
    changes: changeList,
    doc: doc
  };

  if (isDeleted(metadata, doc._rev)) {
    change.deleted = true;
  }
  if (opts.conflicts) {
    change.doc._conflicts = collectConflicts(metadata);
    if (!change.doc._conflicts.length) {
      delete change.doc._conflicts;
    }
  }
  return change;
}

Changes$1.prototype.doChanges = function (opts) {
  var self = this;
  var callback = opts.complete;

  opts = clone(opts);
  if ('live' in opts && !('continuous' in opts)) {
    opts.continuous = opts.live;
  }
  opts.processChange = processChange;

  if (opts.since === 'latest') {
    opts.since = 'now';
  }
  if (!opts.since) {
    opts.since = 0;
  }
  if (opts.since === 'now') {
    this.db.info().then(function (info) {
      /* istanbul ignore if */
      if (self.isCancelled) {
        callback(null, {status: 'cancelled'});
        return;
      }
      opts.since = info.update_seq;
      self.doChanges(opts);
    }, callback);
    return;
  }


  if (opts.view && !opts.filter) {
    opts.filter = '_view';
  }

  if (opts.filter && typeof opts.filter === 'string') {
    if (opts.filter === '_view') {
      opts.view = normalizeDesignDocFunctionName(opts.view);
    } else {
      opts.filter = normalizeDesignDocFunctionName(opts.filter);
    }

    if (this.db.type() !== 'http' && !opts.doc_ids) {
      return this.filterChanges(opts);
    }
  }

  if (!('descending' in opts)) {
    opts.descending = false;
  }

  // 0 and 1 should return 1 document
  opts.limit = opts.limit === 0 ? 1 : opts.limit;
  opts.complete = callback;
  var newPromise = this.db._changes(opts);
  /* istanbul ignore else */
  if (newPromise && typeof newPromise.cancel === 'function') {
    var cancel = self.cancel;
    self.cancel = getArguments(function (args) {
      newPromise.cancel();
      cancel.apply(this, args);
    });
  }
};

Changes$1.prototype.filterChanges = function (opts) {
  var self = this;
  var callback = opts.complete;
  if (opts.filter === '_view') {
    if (!opts.view || typeof opts.view !== 'string') {
      var err = createError(BAD_REQUEST,
        '`view` filter parameter not found or invalid.');
      return callback(err);
    }
    // fetch a view from a design doc, make it behave like a filter
    var viewName = parseDesignDocFunctionName(opts.view);
    this.db.get('_design/' + viewName[0], function (err, ddoc) {
      /* istanbul ignore if */
      if (self.isCancelled) {
        return callback(null, {status: 'cancelled'});
      }
      /* istanbul ignore next */
      if (err) {
        return callback(generateErrorFromResponse(err));
      }
      var mapFun = ddoc && ddoc.views && ddoc.views[viewName[1]] &&
        ddoc.views[viewName[1]].map;
      if (!mapFun) {
        return callback(createError(MISSING_DOC,
          (ddoc.views ? 'missing json key: ' + viewName[1] :
            'missing json key: views')));
      }
      opts.filter = evalView(mapFun);
      self.doChanges(opts);
    });
  } else {
    // fetch a filter from a design doc
    var filterName = parseDesignDocFunctionName(opts.filter);
    if (!filterName) {
      return self.doChanges(opts);
    }
    this.db.get('_design/' + filterName[0], function (err, ddoc) {
      /* istanbul ignore if */
      if (self.isCancelled) {
        return callback(null, {status: 'cancelled'});
      }
      /* istanbul ignore next */
      if (err) {
        return callback(generateErrorFromResponse(err));
      }
      var filterFun = ddoc && ddoc.filters && ddoc.filters[filterName[1]];
      if (!filterFun) {
        return callback(createError(MISSING_DOC,
          ((ddoc && ddoc.filters) ? 'missing json key: ' + filterName[1]
            : 'missing json key: filters')));
      }
      opts.filter = evalFilter(filterFun);
      self.doChanges(opts);
    });
  }
};

/*
 * A generic pouch adapter
 */

function compare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

// Wrapper for functions that call the bulkdocs api with a single doc,
// if the first result is an error, return an error
function yankError(callback) {
  return function (err, results) {
    if (err || (results[0] && results[0].error)) {
      callback(err || results[0]);
    } else {
      callback(null, results.length ? results[0]  : results);
    }
  };
}

// clean docs given to us by the user
function cleanDocs(docs) {
  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    if (doc._deleted) {
      delete doc._attachments; // ignore atts for deleted docs
    } else if (doc._attachments) {
      // filter out extraneous keys from _attachments
      var atts = Object.keys(doc._attachments);
      for (var j = 0; j < atts.length; j++) {
        var att = atts[j];
        doc._attachments[att] = pick(doc._attachments[att],
          ['data', 'digest', 'content_type', 'length', 'revpos', 'stub']);
      }
    }
  }
}

// compare two docs, first by _id then by _rev
function compareByIdThenRev(a, b) {
  var idCompare = compare(a._id, b._id);
  if (idCompare !== 0) {
    return idCompare;
  }
  var aStart = a._revisions ? a._revisions.start : 0;
  var bStart = b._revisions ? b._revisions.start : 0;
  return compare(aStart, bStart);
}

// for every node in a revision tree computes its distance from the closest
// leaf
function computeHeight(revs) {
  var height = {};
  var edges = [];
  traverseRevTree(revs, function (isLeaf, pos, id, prnt) {
    var rev = pos + "-" + id;
    if (isLeaf) {
      height[rev] = 0;
    }
    if (prnt !== undefined) {
      edges.push({from: prnt, to: rev});
    }
    return rev;
  });

  edges.reverse();
  edges.forEach(function (edge) {
    if (height[edge.from] === undefined) {
      height[edge.from] = 1 + height[edge.to];
    } else {
      height[edge.from] = Math.min(height[edge.from], 1 + height[edge.to]);
    }
  });
  return height;
}

function allDocsKeysQuery(api, opts, callback) {
  var keys =  ('limit' in opts) ?
      opts.keys.slice(opts.skip, opts.limit + opts.skip) :
      (opts.skip > 0) ? opts.keys.slice(opts.skip) : opts.keys;
  if (opts.descending) {
    keys.reverse();
  }
  if (!keys.length) {
    return api._allDocs({limit: 0}, callback);
  }
  var finalResults = {
    offset: opts.skip
  };
  return PouchPromise.all(keys.map(function (key) {
    var subOpts = extend$1({key: key, deleted: 'ok'}, opts);
    ['limit', 'skip', 'keys'].forEach(function (optKey) {
      delete subOpts[optKey];
    });
    return new PouchPromise(function (resolve, reject) {
      api._allDocs(subOpts, function (err, res) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        finalResults.total_rows = res.total_rows;
        resolve(res.rows[0] || {key: key, error: 'not_found'});
      });
    });
  })).then(function (results) {
    finalResults.rows = results;
    return finalResults;
  });
}

// all compaction is done in a queue, to avoid attaching
// too many listeners at once
function doNextCompaction(self) {
  var task = self._compactionQueue[0];
  var opts = task.opts;
  var callback = task.callback;
  self.get('_local/compaction').catch(function () {
    return false;
  }).then(function (doc) {
    if (doc && doc.last_seq) {
      opts.last_seq = doc.last_seq;
    }
    self._compact(opts, function (err, res) {
      /* istanbul ignore if */
      if (err) {
        callback(err);
      } else {
        callback(null, res);
      }
      process.nextTick(function () {
        self._compactionQueue.shift();
        if (self._compactionQueue.length) {
          doNextCompaction(self);
        }
      });
    });
  });
}

function attachmentNameError(name) {
  if (name.charAt(0) === '_') {
    return name + 'is not a valid attachment name, attachment ' +
      'names cannot start with \'_\'';
  }
  return false;
}

inherits(AbstractPouchDB, events.EventEmitter);

function AbstractPouchDB() {
  events.EventEmitter.call(this);
}

AbstractPouchDB.prototype.post =
  adapterFun('post', function (doc, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return callback(createError(NOT_AN_OBJECT));
  }
  this.bulkDocs({docs: [doc]}, opts, yankError(callback));
});

AbstractPouchDB.prototype.put = adapterFun('put', function (doc, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return cb(createError(NOT_AN_OBJECT));
  }
  invalidIdError(doc._id);
  if (isLocalId(doc._id) && typeof this._putLocal === 'function') {
    if (doc._deleted) {
      return this._removeLocal(doc, cb);
    } else {
      return this._putLocal(doc, cb);
    }
  }
  if (typeof this._put === 'function' && opts.new_edits !== false) {
    this._put(doc, opts, cb);
  } else {
    this.bulkDocs({docs: [doc]}, opts, yankError(cb));
  }
});

AbstractPouchDB.prototype.putAttachment =
  adapterFun('putAttachment', function (docId, attachmentId, rev,
                                              blob, type) {
  var api = this;
  if (typeof type === 'function') {
    type = blob;
    blob = rev;
    rev = null;
  }
  // Lets fix in https://github.com/pouchdb/pouchdb/issues/3267
  /* istanbul ignore if */
  if (typeof type === 'undefined') {
    type = blob;
    blob = rev;
    rev = null;
  }
  if (!type) {
    guardedConsole('warn', 'Attachment', attachmentId, 'on document', docId, 'is missing content_type');
  }

  function createAttachment(doc) {
    var prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0;
    doc._attachments = doc._attachments || {};
    doc._attachments[attachmentId] = {
      content_type: type,
      data: blob,
      revpos: ++prevrevpos
    };
    return api.put(doc);
  }

  return api.get(docId).then(function (doc) {
    if (doc._rev !== rev) {
      throw createError(REV_CONFLICT);
    }

    return createAttachment(doc);
  }, function (err) {
     // create new doc
    /* istanbul ignore else */
    if (err.reason === MISSING_DOC.message) {
      return createAttachment({_id: docId});
    } else {
      throw err;
    }
  });
});

AbstractPouchDB.prototype.removeAttachment =
  adapterFun('removeAttachment', function (docId, attachmentId, rev,
                                                 callback) {
  var self = this;
  self.get(docId, function (err, obj) {
    /* istanbul ignore if */
    if (err) {
      callback(err);
      return;
    }
    if (obj._rev !== rev) {
      callback(createError(REV_CONFLICT));
      return;
    }
    /* istanbul ignore if */
    if (!obj._attachments) {
      return callback();
    }
    delete obj._attachments[attachmentId];
    if (Object.keys(obj._attachments).length === 0) {
      delete obj._attachments;
    }
    self.put(obj, callback);
  });
});

AbstractPouchDB.prototype.remove =
  adapterFun('remove', function (docOrId, optsOrRev, opts, callback) {
  var doc;
  if (typeof optsOrRev === 'string') {
    // id, rev, opts, callback style
    doc = {
      _id: docOrId,
      _rev: optsOrRev
    };
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
  } else {
    // doc, opts, callback style
    doc = docOrId;
    if (typeof optsOrRev === 'function') {
      callback = optsOrRev;
      opts = {};
    } else {
      callback = opts;
      opts = optsOrRev;
    }
  }
  opts = opts || {};
  opts.was_delete = true;
  var newDoc = {_id: doc._id, _rev: (doc._rev || opts.rev)};
  newDoc._deleted = true;
  if (isLocalId(newDoc._id) && typeof this._removeLocal === 'function') {
    return this._removeLocal(doc, callback);
  }
  this.bulkDocs({docs: [newDoc]}, opts, yankError(callback));
});

AbstractPouchDB.prototype.revsDiff =
  adapterFun('revsDiff', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  var ids = Object.keys(req);

  if (!ids.length) {
    return callback(null, {});
  }

  var count = 0;
  var missing = new _Map();

  function addToMissing(id, revId) {
    if (!missing.has(id)) {
      missing.set(id, {missing: []});
    }
    missing.get(id).missing.push(revId);
  }

  function processDoc(id, rev_tree) {
    // Is this fast enough? Maybe we should switch to a set simulated by a map
    var missingForId = req[id].slice(0);
    traverseRevTree(rev_tree, function (isLeaf, pos, revHash, ctx,
      opts) {
        var rev = pos + '-' + revHash;
        var idx = missingForId.indexOf(rev);
        if (idx === -1) {
          return;
        }

        missingForId.splice(idx, 1);
        /* istanbul ignore if */
        if (opts.status !== 'available') {
          addToMissing(id, rev);
        }
      });

    // Traversing the tree is synchronous, so now `missingForId` contains
    // revisions that were not found in the tree
    missingForId.forEach(function (rev) {
      addToMissing(id, rev);
    });
  }

  ids.map(function (id) {
    this._getRevisionTree(id, function (err, rev_tree) {
      if (err && err.status === 404 && err.message === 'missing') {
        missing.set(id, {missing: req[id]});
      } else if (err) {
        /* istanbul ignore next */
        return callback(err);
      } else {
        processDoc(id, rev_tree);
      }

      if (++count === ids.length) {
        // convert LazyMap to object
        var missingObj = {};
        missing.forEach(function (value, key) {
          missingObj[key] = value;
        });
        return callback(null, missingObj);
      }
    });
  }, this);
});

// _bulk_get API for faster replication, as described in
// https://github.com/apache/couchdb-chttpd/pull/33
// At the "abstract" level, it will just run multiple get()s in
// parallel, because this isn't much of a performance cost
// for local databases (except the cost of multiple transactions, which is
// small). The http adapter overrides this in order
// to do a more efficient single HTTP request.
AbstractPouchDB.prototype.bulkGet =
  adapterFun('bulkGet', function (opts, callback) {
  bulkGet(this, opts, callback);
});

// compact one document and fire callback
// by compacting we mean removing all revisions which
// are further from the leaf in revision tree than max_height
AbstractPouchDB.prototype.compactDocument =
  adapterFun('compactDocument', function (docId, maxHeight, callback) {
  var self = this;
  this._getRevisionTree(docId, function (err, revTree) {
    /* istanbul ignore if */
    if (err) {
      return callback(err);
    }
    var height = computeHeight(revTree);
    var candidates = [];
    var revs = [];
    Object.keys(height).forEach(function (rev) {
      if (height[rev] > maxHeight) {
        candidates.push(rev);
      }
    });

    traverseRevTree(revTree, function (isLeaf, pos, revHash, ctx, opts) {
      var rev = pos + '-' + revHash;
      if (opts.status === 'available' && candidates.indexOf(rev) !== -1) {
        revs.push(rev);
      }
    });
    self._doCompaction(docId, revs, callback);
  });
});

// compact the whole database using single document
// compaction
AbstractPouchDB.prototype.compact =
  adapterFun('compact', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var self = this;
  opts = opts || {};

  self._compactionQueue = self._compactionQueue || [];
  self._compactionQueue.push({opts: opts, callback: callback});
  if (self._compactionQueue.length === 1) {
    doNextCompaction(self);
  }
});
AbstractPouchDB.prototype._compact = function (opts, callback) {
  var self = this;
  var changesOpts = {
    return_docs: false,
    last_seq: opts.last_seq || 0
  };
  var promises = [];

  function onChange(row) {
    promises.push(self.compactDocument(row.id, 0));
  }
  function onComplete(resp) {
    var lastSeq = resp.last_seq;
    PouchPromise.all(promises).then(function () {
      return upsert(self, '_local/compaction', function deltaFunc(doc) {
        if (!doc.last_seq || doc.last_seq < lastSeq) {
          doc.last_seq = lastSeq;
          return doc;
        }
        return false; // somebody else got here first, don't update
      });
    }).then(function () {
      callback(null, {ok: true});
    }).catch(callback);
  }
  self.changes(changesOpts)
    .on('change', onChange)
    .on('complete', onComplete)
    .on('error', callback);
};

/* Begin api wrappers. Specific functionality to storage belongs in the
   _[method] */
AbstractPouchDB.prototype.get = adapterFun('get', function (id, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  if (typeof id !== 'string') {
    return cb(createError(INVALID_ID));
  }
  if (isLocalId(id) && typeof this._getLocal === 'function') {
    return this._getLocal(id, cb);
  }
  var leaves = [], self = this;

  function finishOpenRevs() {
    var result = [];
    var count = leaves.length;
    /* istanbul ignore if */
    if (!count) {
      return cb(null, result);
    }
    // order with open_revs is unspecified
    leaves.forEach(function (leaf) {
      self.get(id, {
        rev: leaf,
        revs: opts.revs,
        attachments: opts.attachments
      }, function (err, doc) {
        if (!err) {
          result.push({ok: doc});
        } else {
          result.push({missing: leaf});
        }
        count--;
        if (!count) {
          cb(null, result);
        }
      });
    });
  }

  if (opts.open_revs) {
    if (opts.open_revs === "all") {
      this._getRevisionTree(id, function (err, rev_tree) {
        if (err) {
          return cb(err);
        }
        leaves = collectLeaves(rev_tree).map(function (leaf) {
          return leaf.rev;
        });
        finishOpenRevs();
      });
    } else {
      if (Array.isArray(opts.open_revs)) {
        leaves = opts.open_revs;
        for (var i = 0; i < leaves.length; i++) {
          var l = leaves[i];
          // looks like it's the only thing couchdb checks
          if (!(typeof (l) === "string" && /^\d+-/.test(l))) {
            return cb(createError(INVALID_REV));
          }
        }
        finishOpenRevs();
      } else {
        return cb(createError(UNKNOWN_ERROR, 'function_clause'));
      }
    }
    return; // open_revs does not like other options
  }

  return this._get(id, opts, function (err, result) {
    if (err) {
      return cb(err);
    }

    var doc = result.doc;
    var metadata = result.metadata;
    var ctx = result.ctx;

    if (opts.conflicts) {
      var conflicts = collectConflicts(metadata);
      if (conflicts.length) {
        doc._conflicts = conflicts;
      }
    }

    if (isDeleted(metadata, doc._rev)) {
      doc._deleted = true;
    }

    if (opts.revs || opts.revs_info) {
      var paths = rootToLeaf(metadata.rev_tree);
      var path = paths.reduce(function selectRevPath(result, arr) {
        var splittedRev = doc._rev.split('-');
        var revNo       = parseInt(splittedRev[0], 10);
        var revHash     = splittedRev[1];
        var hashIndex   = arr.ids.map(function (x) { return x.id; })
          .indexOf(revHash);
        var hashFoundAtRevPos = hashIndex === (revNo - 1);

        return (hashFoundAtRevPos || (!result && hashIndex !== -1))
          ? arr
          : result;
      }, null);

      var indexOfRev = path.ids.map(function (x) { return x.id; })
        .indexOf(doc._rev.split('-')[1]) + 1;
      var howMany = path.ids.length - indexOfRev;
      path.ids.splice(indexOfRev, howMany);
      path.ids.reverse();

      if (opts.revs) {
        doc._revisions = {
          start: (path.pos + path.ids.length) - 1,
          ids: path.ids.map(function (rev) {
            return rev.id;
          })
        };
      }
      if (opts.revs_info) {
        var pos =  path.pos + path.ids.length;
        doc._revs_info = path.ids.map(function (rev) {
          pos--;
          return {
            rev: pos + '-' + rev.id,
            status: rev.opts.status
          };
        });
      }
    }

    if (opts.attachments && doc._attachments) {
      var attachments = doc._attachments;
      var count = Object.keys(attachments).length;
      if (count === 0) {
        return cb(null, doc);
      }
      Object.keys(attachments).forEach(function (key) {
        this._getAttachment(doc._id, key, attachments[key], {
          // Previously the revision handling was done in adapter.js
          // getAttachment, however since idb-next doesnt we need to
          // pass the rev through
          rev: doc._rev,
          binary: opts.binary,
          ctx: ctx
        }, function (err, data) {
          var att = doc._attachments[key];
          att.data = data;
          delete att.stub;
          delete att.length;
          if (!--count) {
            cb(null, doc);
          }
        });
      }, self);
    } else {
      if (doc._attachments) {
        for (var key in doc._attachments) {
          /* istanbul ignore else */
          if (doc._attachments.hasOwnProperty(key)) {
            doc._attachments[key].stub = true;
          }
        }
      }
      cb(null, doc);
    }
  });
});

// TODO: I dont like this, it forces an extra read for every
// attachment read and enforces a confusing api between
// adapter.js and the adapter implementation
AbstractPouchDB.prototype.getAttachment =
  adapterFun('getAttachment', function (docId, attachmentId, opts, callback) {
  var self = this;
  if (opts instanceof Function) {
    callback = opts;
    opts = {};
  }
  this._get(docId, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (res.doc._attachments && res.doc._attachments[attachmentId]) {
      opts.ctx = res.ctx;
      opts.binary = true;
      self._getAttachment(docId, attachmentId,
                          res.doc._attachments[attachmentId], opts, callback);
    } else {
      return callback(createError(MISSING_DOC));
    }
  });
});

AbstractPouchDB.prototype.allDocs =
  adapterFun('allDocs', function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts.skip = typeof opts.skip !== 'undefined' ? opts.skip : 0;
  if (opts.start_key) {
    opts.startkey = opts.start_key;
  }
  if (opts.end_key) {
    opts.endkey = opts.end_key;
  }
  if ('keys' in opts) {
    if (!Array.isArray(opts.keys)) {
      return callback(new TypeError('options.keys must be an array'));
    }
    var incompatibleOpt =
      ['startkey', 'endkey', 'key'].filter(function (incompatibleOpt) {
      return incompatibleOpt in opts;
    })[0];
    if (incompatibleOpt) {
      callback(createError(QUERY_PARSE_ERROR,
        'Query parameter `' + incompatibleOpt +
        '` is not compatible with multi-get'
      ));
      return;
    }
    if (this.type() !== 'http') {
      return allDocsKeysQuery(this, opts, callback);
    }
  }

  return this._allDocs(opts, callback);
});

AbstractPouchDB.prototype.changes = function (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return new Changes$1(this, opts, callback);
};

AbstractPouchDB.prototype.close = adapterFun('close', function (callback) {
  this._closed = true;
  this.emit('closed');
  return this._close(callback);
});

AbstractPouchDB.prototype.info = adapterFun('info', function (callback) {
  var self = this;
  this._info(function (err, info) {
    if (err) {
      return callback(err);
    }
    // assume we know better than the adapter, unless it informs us
    info.db_name = info.db_name || self.name;
    info.auto_compaction = !!(self.auto_compaction && self.type() !== 'http');
    info.adapter = self.type();
    callback(null, info);
  });
});

AbstractPouchDB.prototype.id = adapterFun('id', function (callback) {
  return this._id(callback);
});

/* istanbul ignore next */
AbstractPouchDB.prototype.type = function () {
  return (typeof this._type === 'function') ? this._type() : this.adapter;
};

AbstractPouchDB.prototype.bulkDocs =
  adapterFun('bulkDocs', function (req, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  opts = opts || {};

  if (Array.isArray(req)) {
    req = {
      docs: req
    };
  }

  if (!req || !req.docs || !Array.isArray(req.docs)) {
    return callback(createError(MISSING_BULK_DOCS));
  }

  for (var i = 0; i < req.docs.length; ++i) {
    if (typeof req.docs[i] !== 'object' || Array.isArray(req.docs[i])) {
      return callback(createError(NOT_AN_OBJECT));
    }
  }

  var attachmentError;
  req.docs.forEach(function (doc) {
    if (doc._attachments) {
      Object.keys(doc._attachments).forEach(function (name) {
        attachmentError = attachmentError || attachmentNameError(name);
        if (!doc._attachments[name].content_type) {
          guardedConsole('warn', 'Attachment', name, 'on document', doc._id, 'is missing content_type');
        }
      });
    }
  });

  if (attachmentError) {
    return callback(createError(BAD_REQUEST, attachmentError));
  }

  if (!('new_edits' in opts)) {
    if ('new_edits' in req) {
      opts.new_edits = req.new_edits;
    } else {
      opts.new_edits = true;
    }
  }

  if (!opts.new_edits && this.type() !== 'http') {
    // ensure revisions of the same doc are sorted, so that
    // the local adapter processes them correctly (#2935)
    req.docs.sort(compareByIdThenRev);
  }

  cleanDocs(req.docs);

  return this._bulkDocs(req, opts, function (err, res) {
    if (err) {
      return callback(err);
    }
    if (!opts.new_edits) {
      // this is what couch does when new_edits is false
      res = res.filter(function (x) {
        return x.error;
      });
    }
    callback(null, res);
  });
});

AbstractPouchDB.prototype.registerDependentDatabase =
  adapterFun('registerDependentDatabase', function (dependentDb,
                                                          callback) {
  var depDB = new this.constructor(dependentDb, this.__opts);

  function diffFun(doc) {
    doc.dependentDbs = doc.dependentDbs || {};
    if (doc.dependentDbs[dependentDb]) {
      return false; // no update required
    }
    doc.dependentDbs[dependentDb] = true;
    return doc;
  }
  upsert(this, '_local/_pouch_dependentDbs', diffFun)
    .then(function () {
      callback(null, {db: depDB});
    }).catch(callback);
});

AbstractPouchDB.prototype.destroy =
  adapterFun('destroy', function (opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }

  var self = this;
  var usePrefix = 'use_prefix' in self ? self.use_prefix : true;

  function destroyDb() {
    // call destroy method of the particular adaptor
    self._destroy(opts, function (err, resp) {
      if (err) {
        return callback(err);
      }
      self._destroyed = true;
      self.emit('destroyed');
      callback(null, resp || { 'ok': true });
    });
  }

  if (self.type() === 'http') {
    // no need to check for dependent DBs if it's a remote DB
    return destroyDb();
  }

  self.get('_local/_pouch_dependentDbs', function (err, localDoc) {
    if (err) {
      /* istanbul ignore if */
      if (err.status !== 404) {
        return callback(err);
      } else { // no dependencies
        return destroyDb();
      }
    }
    var dependentDbs = localDoc.dependentDbs;
    var PouchDB = self.constructor;
    var deletedMap = Object.keys(dependentDbs).map(function (name) {
      // use_prefix is only false in the browser
      /* istanbul ignore next */
      var trueName = usePrefix ?
        name.replace(new RegExp('^' + PouchDB.prefix), '') : name;
      return new PouchDB(trueName, self.__opts).destroy();
    });
    PouchPromise.all(deletedMap).then(destroyDb, callback);
  });
});

function TaskQueue() {
  this.isReady = false;
  this.failed = false;
  this.queue = [];
}

TaskQueue.prototype.execute = function () {
  var fun;
  if (this.failed) {
    while ((fun = this.queue.shift())) {
      fun(this.failed);
    }
  } else {
    while ((fun = this.queue.shift())) {
      fun();
    }
  }
};

TaskQueue.prototype.fail = function (err) {
  this.failed = err;
  this.execute();
};

TaskQueue.prototype.ready = function (db) {
  this.isReady = true;
  this.db = db;
  this.execute();
};

TaskQueue.prototype.addTask = function (fun) {
  this.queue.push(fun);
  if (this.failed) {
    this.execute();
  }
};

function parseAdapter(name, opts) {
  var match = name.match(/([a-z\-]*):\/\/(.*)/);
  if (match) {
    // the http adapter expects the fully qualified name
    name = /http(s?)/.test(match[1]) ? match[1] + '://' + match[2] : match[2];
    return {name: name, adapter: match[1]};
  }

  // check for browsers that have been upgraded from websql-only to websql+idb
  var skipIdb = 'idb' in PouchDB.adapters && 'websql' in PouchDB.adapters &&
    hasLocalStorage() &&
    localStorage['_pouch__websqldb_' + PouchDB.prefix + name];

  var adapterName;

  if (opts.adapter) {
    adapterName = opts.adapter;
  } else if (typeof opts !== 'undefined' && opts.db) {
    adapterName = 'leveldb';
  } else { // automatically determine adapter
    for (var i = 0; i < PouchDB.preferredAdapters.length; ++i) {
      adapterName = PouchDB.preferredAdapters[i];
      /* istanbul ignore if */
      if (skipIdb && adapterName === 'idb') {
        // log it, because this can be confusing during development
        guardedConsole('log', 'PouchDB is downgrading "' + name + '" to WebSQL to' +
          ' avoid data loss, because it was already opened with WebSQL.');
        continue; // keep using websql to avoid user data loss
      }
      break;
    }
  }

  var adapter = PouchDB.adapters[adapterName];

  // if adapter is invalid, then an error will be thrown later
  var usePrefix = (adapter && 'use_prefix' in adapter) ?
    adapter.use_prefix : true;

  return {
    name: usePrefix ? (PouchDB.prefix + name) : name,
    adapter: adapterName
  };
}

// OK, so here's the deal. Consider this code:
//     var db1 = new PouchDB('foo');
//     var db2 = new PouchDB('foo');
//     db1.destroy();
// ^ these two both need to emit 'destroyed' events,
// as well as the PouchDB constructor itself.
// So we have one db object (whichever one got destroy() called on it)
// responsible for emitting the initial event, which then gets emitted
// by the constructor, which then broadcasts it to any other dbs
// that may have been created with the same name.
function prepareForDestruction(self) {

  var destructionListeners = self.constructor._destructionListeners;

  function onDestroyed() {
    self.removeListener('closed', onClosed);
    self.constructor.emit('destroyed', self.name);
  }

  function onConstructorDestroyed() {
    self.removeListener('destroyed', onDestroyed);
    self.removeListener('closed', onClosed);
    self.emit('destroyed');
  }

  function onClosed() {
    self.removeListener('destroyed', onDestroyed);
    destructionListeners.delete(self.name);
  }

  self.once('destroyed', onDestroyed);
  self.once('closed', onClosed);

  // in setup.js, the constructor is primed to listen for destroy events
  if (!destructionListeners.has(self.name)) {
    destructionListeners.set(self.name, []);
  }
  destructionListeners.get(self.name).push(onConstructorDestroyed);
}

inherits(PouchDB, AbstractPouchDB);
function PouchDB(name, opts) {
  // In Node our test suite only tests this for PouchAlt unfortunately
  /* istanbul ignore if */
  if (!(this instanceof PouchDB)) {
    return new PouchDB(name, opts);
  }

  var self = this;
  opts = opts || {};

  if (name && typeof name === 'object') {
    opts = name;
    name = opts.name;
    delete opts.name;
  }

  this.__opts = opts = clone(opts);

  self.auto_compaction = opts.auto_compaction;
  self.prefix = PouchDB.prefix;

  if (typeof name !== 'string') {
    throw new Error('Missing/invalid DB name');
  }

  var prefixedName = (opts.prefix || '') + name;
  var backend = parseAdapter(prefixedName, opts);

  opts.name = backend.name;
  opts.adapter = opts.adapter || backend.adapter;

  self.name = name;
  self._adapter = opts.adapter;
  debug('pouchdb:adapter')('Picked adapter: ' + opts.adapter);

  if (!PouchDB.adapters[opts.adapter] ||
      !PouchDB.adapters[opts.adapter].valid()) {
    throw new Error('Invalid Adapter: ' + opts.adapter);
  }

  AbstractPouchDB.call(self);
  self.taskqueue = new TaskQueue();

  self.adapter = opts.adapter;

  PouchDB.adapters[opts.adapter].call(self, opts, function (err) {
    if (err) {
      return self.taskqueue.fail(err);
    }
    prepareForDestruction(self);

    self.emit('created', self);
    PouchDB.emit('created', self.name);
    self.taskqueue.ready(self);
  });

}

PouchDB.debug = debug;

PouchDB.adapters = {};
PouchDB.preferredAdapters = [];

PouchDB.prefix = '_pouch_';

var eventEmitter = new events.EventEmitter();

function setUpEventEmitter(Pouch) {
  Object.keys(events.EventEmitter.prototype).forEach(function (key) {
    if (typeof events.EventEmitter.prototype[key] === 'function') {
      Pouch[key] = eventEmitter[key].bind(eventEmitter);
    }
  });

  // these are created in constructor.js, and allow us to notify each DB with
  // the same name that it was destroyed, via the constructor object
  var destructListeners = Pouch._destructionListeners = new _Map();
  Pouch.on('destroyed', function onConstructorDestroyed(name) {
    destructListeners.get(name).forEach(function (callback) {
      callback();
    });
    destructListeners.delete(name);
  });
}

setUpEventEmitter(PouchDB);

PouchDB.adapter = function (id, obj, addToPreferredAdapters) {
  /* istanbul ignore else */
  if (obj.valid()) {
    PouchDB.adapters[id] = obj;
    if (addToPreferredAdapters) {
      PouchDB.preferredAdapters.push(id);
    }
  }
};

PouchDB.plugin = function (obj) {
  if (typeof obj === 'function') { // function style for plugins
    obj(PouchDB);
  } else if (typeof obj !== 'object' || Object.keys(obj).length === 0){
    throw new Error('Invalid plugin: object passed in is empty or not an object');
  } else {
    Object.keys(obj).forEach(function (id) { // object style for plugins
      PouchDB.prototype[id] = obj[id];
    });
  }
  return PouchDB;
};

PouchDB.defaults = function (defaultOpts) {
  function PouchAlt(name, opts) {
    if (!(this instanceof PouchAlt)) {
      return new PouchAlt(name, opts);
    }

    opts = opts || {};

    if (name && typeof name === 'object') {
      opts = name;
      name = opts.name;
      delete opts.name;
    }

    opts = extend$1({}, defaultOpts, opts);
    PouchDB.call(this, name, opts);
  }

  inherits(PouchAlt, PouchDB);

  PouchAlt.preferredAdapters = PouchDB.preferredAdapters.slice();
  Object.keys(PouchDB).forEach(function (key) {
    if (!(key in PouchAlt)) {
      PouchAlt[key] = PouchDB[key];
    }
  });

  return PouchAlt;
};

// managed automatically by set-version.js
var version = "6.1.0-prerelease";

PouchDB.version = version;

function toObject(array) {
  return array.reduce(function (obj, item) {
    obj[item] = true;
    return obj;
  }, {});
}
// List of top level reserved words for doc
var reservedWords = toObject([
  '_id',
  '_rev',
  '_attachments',
  '_deleted',
  '_revisions',
  '_revs_info',
  '_conflicts',
  '_deleted_conflicts',
  '_local_seq',
  '_rev_tree',
  //replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats',
  // Specific to Couchbase Sync Gateway
  '_removed'
]);

// List of reserved words that should end up the document
var dataWords = toObject([
  '_attachments',
  //replication documents
  '_replication_id',
  '_replication_state',
  '_replication_state_time',
  '_replication_state_reason',
  '_replication_stats'
]);

function parseRevisionInfo(rev) {
  if (!/^\d+\-./.test(rev)) {
    return createError(INVALID_REV);
  }
  var idx = rev.indexOf('-');
  var left = rev.substring(0, idx);
  var right = rev.substring(idx + 1);
  return {
    prefix: parseInt(left, 10),
    id: right
  };
}

function makeRevTreeFromRevisions(revisions, opts) {
  var pos = revisions.start - revisions.ids.length + 1;

  var revisionIds = revisions.ids;
  var ids = [revisionIds[0], opts, []];

  for (var i = 1, len = revisionIds.length; i < len; i++) {
    ids = [revisionIds[i], {status: 'missing'}, [ids]];
  }

  return [{
    pos: pos,
    ids: ids
  }];
}

// Preprocess documents, parse their revisions, assign an id and a
// revision for new writes that are missing them, etc
function parseDoc(doc, newEdits) {

  var nRevNum;
  var newRevId;
  var revInfo;
  var opts = {status: 'available'};
  if (doc._deleted) {
    opts.deleted = true;
  }

  if (newEdits) {
    if (!doc._id) {
      doc._id = uuid();
    }
    newRevId = uuid(32, 16).toLowerCase();
    if (doc._rev) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      doc._rev_tree = [{
        pos: revInfo.prefix,
        ids: [revInfo.id, {status: 'missing'}, [[newRevId, opts, []]]]
      }];
      nRevNum = revInfo.prefix + 1;
    } else {
      doc._rev_tree = [{
        pos: 1,
        ids : [newRevId, opts, []]
      }];
      nRevNum = 1;
    }
  } else {
    if (doc._revisions) {
      doc._rev_tree = makeRevTreeFromRevisions(doc._revisions, opts);
      nRevNum = doc._revisions.start;
      newRevId = doc._revisions.ids[0];
    }
    if (!doc._rev_tree) {
      revInfo = parseRevisionInfo(doc._rev);
      if (revInfo.error) {
        return revInfo;
      }
      nRevNum = revInfo.prefix;
      newRevId = revInfo.id;
      doc._rev_tree = [{
        pos: nRevNum,
        ids: [newRevId, opts, []]
      }];
    }
  }

  invalidIdError(doc._id);

  doc._rev = nRevNum + '-' + newRevId;

  var result = {metadata : {}, data : {}};
  for (var key in doc) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(doc, key)) {
      var specialKey = key[0] === '_';
      if (specialKey && !reservedWords[key]) {
        var error = createError(DOC_VALIDATION, key);
        error.message = DOC_VALIDATION.message + ': ' + key;
        throw error;
      } else if (specialKey && !dataWords[key]) {
        result.metadata[key.slice(1)] = doc[key];
      } else {
        result.data[key] = doc[key];
      }
    }
  }
  return result;
}

var atob$1 = function (str) {
  return atob(str);
};

var btoa$1 = function (str) {
  return btoa(str);
};

// Abstracts constructing a Blob object, so it also works in older
// browsers that don't support the native Blob constructor (e.g.
// old QtWebKit versions, Android < 4.4).
function createBlob(parts, properties) {
  /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
                  typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
                  typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder :
                  WebKitBlobBuilder;
    var builder = new Builder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
}

// From http://stackoverflow.com/questions/14967647/ (continues on next line)
// encode-decode-image-with-base64-breaks-image (2013-04-21)
function binaryStringToArrayBuffer(bin) {
  var length = bin.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  for (var i = 0; i < length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
}

function binStringToBluffer(binString, type) {
  return createBlob([binaryStringToArrayBuffer(binString)], {type: type});
}

function b64ToBluffer(b64, type) {
  return binStringToBluffer(atob$1(b64), type);
}

//Can't find original post, but this is close
//http://stackoverflow.com/questions/6965107/ (continues on next line)
//converting-between-strings-and-arraybuffers
function arrayBufferToBinaryString(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

// shim for browsers that don't support it
function readAsBinaryString(blob, callback) {
  if (typeof FileReader === 'undefined') {
    // fix for Firefox in a web worker
    // https://bugzilla.mozilla.org/show_bug.cgi?id=901097
    return callback(arrayBufferToBinaryString(
      new FileReaderSync().readAsArrayBuffer(blob)));
  }

  var reader = new FileReader();
  var hasBinaryString = typeof reader.readAsBinaryString === 'function';
  reader.onloadend = function (e) {
    var result = e.target.result || '';
    if (hasBinaryString) {
      return callback(result);
    }
    callback(arrayBufferToBinaryString(result));
  };
  if (hasBinaryString) {
    reader.readAsBinaryString(blob);
  } else {
    reader.readAsArrayBuffer(blob);
  }
}

function blobToBinaryString(blobOrBuffer, callback) {
  readAsBinaryString(blobOrBuffer, function (bin) {
    callback(bin);
  });
}

function blobToBase64(blobOrBuffer, callback) {
  blobToBinaryString(blobOrBuffer, function (base64) {
    callback(btoa$1(base64));
  });
}

// simplified API. universal browser support is assumed
function readAsArrayBuffer(blob, callback) {
  if (typeof FileReader === 'undefined') {
    // fix for Firefox in a web worker:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=901097
    return callback(new FileReaderSync().readAsArrayBuffer(blob));
  }

  var reader = new FileReader();
  reader.onloadend = function (e) {
    var result = e.target.result || new ArrayBuffer(0);
    callback(result);
  };
  reader.readAsArrayBuffer(blob);
}

var setImmediateShim = global.setImmediate || global.setTimeout;
var MD5_CHUNK_SIZE = 32768;

function rawToBase64(raw) {
  return btoa$1(raw);
}

function sliceBlob(blob, start, end) {
  if (blob.webkitSlice) {
    return blob.webkitSlice(start, end);
  }
  return blob.slice(start, end);
}

function appendBlob(buffer, blob, start, end, callback) {
  if (start > 0 || end < blob.size) {
    // only slice blob if we really need to
    blob = sliceBlob(blob, start, end);
  }
  readAsArrayBuffer(blob, function (arrayBuffer) {
    buffer.append(arrayBuffer);
    callback();
  });
}

function appendString(buffer, string, start, end, callback) {
  if (start > 0 || end < string.length) {
    // only create a substring if we really need to
    string = string.substring(start, end);
  }
  buffer.appendBinary(string);
  callback();
}

function binaryMd5(data, callback) {
  var inputIsString = typeof data === 'string';
  var len = inputIsString ? data.length : data.size;
  var chunkSize = Math.min(MD5_CHUNK_SIZE, len);
  var chunks = Math.ceil(len / chunkSize);
  var currentChunk = 0;
  var buffer = inputIsString ? new Md5() : new Md5.ArrayBuffer();

  var append = inputIsString ? appendString : appendBlob;

  function next() {
    setImmediateShim(loadNextChunk);
  }

  function done() {
    var raw = buffer.end(true);
    var base64 = rawToBase64(raw);
    callback(base64);
    buffer.destroy();
  }

  function loadNextChunk() {
    var start = currentChunk * chunkSize;
    var end = start + chunkSize;
    currentChunk++;
    if (currentChunk < chunks) {
      append(buffer, data, start, end, next);
    } else {
      append(buffer, data, start, end, done);
    }
  }
  loadNextChunk();
}

function stringMd5(string) {
  return Md5.hash(string);
}

function parseBase64(data) {
  try {
    return atob$1(data);
  } catch (e) {
    var err = createError(BAD_ARG,
      'Attachment is not a valid base64 string');
    return {error: err};
  }
}

function preprocessString(att, blobType, callback) {
  var asBinary = parseBase64(att.data);
  if (asBinary.error) {
    return callback(asBinary.error);
  }

  att.length = asBinary.length;
  if (blobType === 'blob') {
    att.data = binStringToBluffer(asBinary, att.content_type);
  } else if (blobType === 'base64') {
    att.data = btoa$1(asBinary);
  } else { // binary
    att.data = asBinary;
  }
  binaryMd5(asBinary, function (result) {
    att.digest = 'md5-' + result;
    callback();
  });
}

function preprocessBlob(att, blobType, callback) {
  binaryMd5(att.data, function (md5) {
    att.digest = 'md5-' + md5;
    // size is for blobs (browser), length is for buffers (node)
    att.length = att.data.size || att.data.length || 0;
    if (blobType === 'binary') {
      blobToBinaryString(att.data, function (binString) {
        att.data = binString;
        callback();
      });
    } else if (blobType === 'base64') {
      blobToBase64(att.data, function (b64) {
        att.data = b64;
        callback();
      });
    } else {
      callback();
    }
  });
}

function preprocessAttachment(att, blobType, callback) {
  if (att.stub) {
    return callback();
  }
  if (typeof att.data === 'string') { // input is a base64 string
    preprocessString(att, blobType, callback);
  } else { // input is a blob
    preprocessBlob(att, blobType, callback);
  }
}

function preprocessAttachments(docInfos, blobType, callback) {

  if (!docInfos.length) {
    return callback();
  }

  var docv = 0;
  var overallErr;

  docInfos.forEach(function (docInfo) {
    var attachments = docInfo.data && docInfo.data._attachments ?
      Object.keys(docInfo.data._attachments) : [];
    var recv = 0;

    if (!attachments.length) {
      return done();
    }

    function processedAttachment(err) {
      overallErr = err;
      recv++;
      if (recv === attachments.length) {
        done();
      }
    }

    for (var key in docInfo.data._attachments) {
      if (docInfo.data._attachments.hasOwnProperty(key)) {
        preprocessAttachment(docInfo.data._attachments[key],
          blobType, processedAttachment);
      }
    }
  });

  function done() {
    docv++;
    if (docInfos.length === docv) {
      if (overallErr) {
        callback(overallErr);
      } else {
        callback();
      }
    }
  }
}

function updateDoc(revLimit, prev, docInfo, results,
                   i, cb, writeDoc, newEdits) {

  if (revExists(prev.rev_tree, docInfo.metadata.rev)) {
    results[i] = docInfo;
    return cb();
  }

  // sometimes this is pre-calculated. historically not always
  var previousWinningRev = prev.winningRev || winningRev(prev);
  var previouslyDeleted = 'deleted' in prev ? prev.deleted :
    isDeleted(prev, previousWinningRev);
  var deleted = 'deleted' in docInfo.metadata ? docInfo.metadata.deleted :
    isDeleted(docInfo.metadata);
  var isRoot = /^1-/.test(docInfo.metadata.rev);

  if (previouslyDeleted && !deleted && newEdits && isRoot) {
    var newDoc = docInfo.data;
    newDoc._rev = previousWinningRev;
    newDoc._id = docInfo.metadata.id;
    docInfo = parseDoc(newDoc, newEdits);
  }

  var merged = merge(prev.rev_tree, docInfo.metadata.rev_tree[0], revLimit);

  var inConflict = newEdits && (((previouslyDeleted && deleted) ||
    (!previouslyDeleted && merged.conflicts !== 'new_leaf') ||
    (previouslyDeleted && !deleted && merged.conflicts === 'new_branch')));

  if (inConflict) {
    var err = createError(REV_CONFLICT);
    results[i] = err;
    return cb();
  }

  var newRev = docInfo.metadata.rev;
  docInfo.metadata.rev_tree = merged.tree;
  docInfo.stemmedRevs = merged.stemmedRevs || [];
  /* istanbul ignore else */
  if (prev.rev_map) {
    docInfo.metadata.rev_map = prev.rev_map; // used only by leveldb
  }

  // recalculate
  var winningRev$$ = winningRev(docInfo.metadata);
  var winningRevIsDeleted = isDeleted(docInfo.metadata, winningRev$$);

  // calculate the total number of documents that were added/removed,
  // from the perspective of total_rows/doc_count
  var delta = (previouslyDeleted === winningRevIsDeleted) ? 0 :
    previouslyDeleted < winningRevIsDeleted ? -1 : 1;

  var newRevIsDeleted;
  if (newRev === winningRev$$) {
    // if the new rev is the same as the winning rev, we can reuse that value
    newRevIsDeleted = winningRevIsDeleted;
  } else {
    // if they're not the same, then we need to recalculate
    newRevIsDeleted = isDeleted(docInfo.metadata, newRev);
  }

  writeDoc(docInfo, winningRev$$, winningRevIsDeleted, newRevIsDeleted,
    true, delta, i, cb);
}

function rootIsMissing(docInfo) {
  return docInfo.metadata.rev_tree[0].ids[1].status === 'missing';
}

function processDocs(revLimit, docInfos, api, fetchedDocs, tx, results,
                     writeDoc, opts, overallCallback) {

  // Default to 1000 locally
  revLimit = revLimit || 1000;

  function insertDoc(docInfo, resultsIdx, callback) {
    // Cant insert new deleted documents
    var winningRev$$ = winningRev(docInfo.metadata);
    var deleted = isDeleted(docInfo.metadata, winningRev$$);
    if ('was_delete' in opts && deleted) {
      results[resultsIdx] = createError(MISSING_DOC, 'deleted');
      return callback();
    }

    // 4712 - detect whether a new document was inserted with a _rev
    var inConflict = newEdits && rootIsMissing(docInfo);

    if (inConflict) {
      var err = createError(REV_CONFLICT);
      results[resultsIdx] = err;
      return callback();
    }

    var delta = deleted ? 0 : 1;

    writeDoc(docInfo, winningRev$$, deleted, deleted, false,
      delta, resultsIdx, callback);
  }

  var newEdits = opts.new_edits;
  var idsToDocs = new _Map();

  var docsDone = 0;
  var docsToDo = docInfos.length;

  function checkAllDocsDone() {
    if (++docsDone === docsToDo && overallCallback) {
      overallCallback();
    }
  }

  docInfos.forEach(function (currentDoc, resultsIdx) {

    if (currentDoc._id && isLocalId(currentDoc._id)) {
      var fun = currentDoc._deleted ? '_removeLocal' : '_putLocal';
      api[fun](currentDoc, {ctx: tx}, function (err, res) {
        results[resultsIdx] = err || res;
        checkAllDocsDone();
      });
      return;
    }

    var id = currentDoc.metadata.id;
    if (idsToDocs.has(id)) {
      docsToDo--; // duplicate
      idsToDocs.get(id).push([currentDoc, resultsIdx]);
    } else {
      idsToDocs.set(id, [[currentDoc, resultsIdx]]);
    }
  });

  // in the case of new_edits, the user can provide multiple docs
  // with the same id. these need to be processed sequentially
  idsToDocs.forEach(function (docs, id) {
    var numDone = 0;

    function docWritten() {
      if (++numDone < docs.length) {
        nextDoc();
      } else {
        checkAllDocsDone();
      }
    }
    function nextDoc() {
      var value = docs[numDone];
      var currentDoc = value[0];
      var resultsIdx = value[1];

      if (fetchedDocs.has(id)) {
        updateDoc(revLimit, fetchedDocs.get(id), currentDoc, results,
          resultsIdx, docWritten, writeDoc, newEdits);
      } else {
        // Ensure stemming applies to new writes as well
        var merged = merge([], currentDoc.metadata.rev_tree[0], revLimit);
        currentDoc.metadata.rev_tree = merged.tree;
        currentDoc.stemmedRevs = merged.stemmedRevs || [];
        insertDoc(currentDoc, resultsIdx, docWritten);
      }
    }
    nextDoc();
  });
}

// IndexedDB requires a versioned database structure, so we use the
// version here to manage migrations.
var ADAPTER_VERSION = 5;

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
// Keyed by document id
var DOC_STORE = 'document-store';
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE = 'by-sequence';
// Where we store attachments
var ATTACH_STORE = 'attach-store';
// Where we store many-to-many relations
// between attachment digests and seqs
var ATTACH_AND_SEQ_STORE = 'attach-seq-store';

// Where we store database-wide meta data in a single record
// keyed by id: META_STORE
var META_STORE = 'meta-store';
// Where we store local documents
var LOCAL_STORE = 'local-store';
// Where we detect blob support
var DETECT_BLOB_SUPPORT_STORE = 'detect-blob-support';

function safeJsonParse(str) {
  // This try/catch guards against stack overflow errors.
  // JSON.parse() is faster than vuvuzela.parse() but vuvuzela
  // cannot overflow.
  try {
    return JSON.parse(str);
  } catch (e) {
    /* istanbul ignore next */
    return vuvuzela.parse(str);
  }
}

function safeJsonStringify(json) {
  try {
    return JSON.stringify(json);
  } catch (e) {
    /* istanbul ignore next */
    return vuvuzela.stringify(json);
  }
}

function tryCode(fun, that, args, PouchDB) {
  try {
    fun.apply(that, args);
  } catch (err) {
    // Shouldn't happen, but in some odd cases
    // IndexedDB implementations might throw a sync
    // error, in which case this will at least log it.
    PouchDB.emit('error', err);
  }
}

var taskQueue = {
  running: false,
  queue: []
};

function applyNext(PouchDB) {
  if (taskQueue.running || !taskQueue.queue.length) {
    return;
  }
  taskQueue.running = true;
  var item = taskQueue.queue.shift();
  item.action(function (err, res) {
    tryCode(item.callback, this, [err, res], PouchDB);
    taskQueue.running = false;
    process.nextTick(function () {
      applyNext(PouchDB);
    });
  });
}

function idbError(callback) {
  return function (evt) {
    var message = 'unknown_error';
    if (evt.target && evt.target.error) {
      message = evt.target.error.name || evt.target.error.message;
    }
    callback(createError(IDB_ERROR, message, evt.type));
  };
}

// Unfortunately, the metadata has to be stringified
// when it is put into the database, because otherwise
// IndexedDB can throw errors for deeply-nested objects.
// Originally we just used JSON.parse/JSON.stringify; now
// we use this custom vuvuzela library that avoids recursion.
// If we could do it all over again, we'd probably use a
// format for the revision trees other than JSON.
function encodeMetadata(metadata, winningRev, deleted) {
  return {
    data: safeJsonStringify(metadata),
    winningRev: winningRev,
    deletedOrLocal: deleted ? '1' : '0',
    seq: metadata.seq, // highest seq for this doc
    id: metadata.id
  };
}

function decodeMetadata(storedObject) {
  if (!storedObject) {
    return null;
  }
  var metadata = safeJsonParse(storedObject.data);
  metadata.winningRev = storedObject.winningRev;
  metadata.deleted = storedObject.deletedOrLocal === '1';
  metadata.seq = storedObject.seq;
  return metadata;
}

// read the doc back out from the database. we don't store the
// _id or _rev because we already have _doc_id_rev.
function decodeDoc(doc) {
  if (!doc) {
    return doc;
  }
  var idx = doc._doc_id_rev.lastIndexOf(':');
  doc._id = doc._doc_id_rev.substring(0, idx - 1);
  doc._rev = doc._doc_id_rev.substring(idx + 1);
  delete doc._doc_id_rev;
  return doc;
}

// Read a blob from the database, encoding as necessary
// and translating from base64 if the IDB doesn't support
// native Blobs
function readBlobData(body, type, asBlob, callback) {
  if (asBlob) {
    if (!body) {
      callback(createBlob([''], {type: type}));
    } else if (typeof body !== 'string') { // we have blob support
      callback(body);
    } else { // no blob support
      callback(b64ToBluffer(body, type));
    }
  } else { // as base64 string
    if (!body) {
      callback('');
    } else if (typeof body !== 'string') { // we have blob support
      readAsBinaryString(body, function (binary) {
        callback(btoa$1(binary));
      });
    } else { // no blob support
      callback(body);
    }
  }
}

function fetchAttachmentsIfNecessary(doc, opts, txn, cb) {
  var attachments = Object.keys(doc._attachments || {});
  if (!attachments.length) {
    return cb && cb();
  }
  var numDone = 0;

  function checkDone() {
    if (++numDone === attachments.length && cb) {
      cb();
    }
  }

  function fetchAttachment(doc, att) {
    var attObj = doc._attachments[att];
    var digest = attObj.digest;
    var req = txn.objectStore(ATTACH_STORE).get(digest);
    req.onsuccess = function (e) {
      attObj.body = e.target.result.body;
      checkDone();
    };
  }

  attachments.forEach(function (att) {
    if (opts.attachments && opts.include_docs) {
      fetchAttachment(doc, att);
    } else {
      doc._attachments[att].stub = true;
      checkDone();
    }
  });
}

// IDB-specific postprocessing necessary because
// we don't know whether we stored a true Blob or
// a base64-encoded string, and if it's a Blob it
// needs to be read outside of the transaction context
function postProcessAttachments(results, asBlob) {
  return PouchPromise.all(results.map(function (row) {
    if (row.doc && row.doc._attachments) {
      var attNames = Object.keys(row.doc._attachments);
      return PouchPromise.all(attNames.map(function (att) {
        var attObj = row.doc._attachments[att];
        if (!('body' in attObj)) { // already processed
          return;
        }
        var body = attObj.body;
        var type = attObj.content_type;
        return new PouchPromise(function (resolve) {
          readBlobData(body, type, asBlob, function (data) {
            row.doc._attachments[att] = extend$1(
              pick(attObj, ['digest', 'content_type']),
              {data: data}
            );
            resolve();
          });
        });
      }));
    }
  }));
}

function compactRevs(revs, docId, txn) {

  var possiblyOrphanedDigests = [];
  var seqStore = txn.objectStore(BY_SEQ_STORE);
  var attStore = txn.objectStore(ATTACH_STORE);
  var attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);
  var count = revs.length;

  function checkDone() {
    count--;
    if (!count) { // done processing all revs
      deleteOrphanedAttachments();
    }
  }

  function deleteOrphanedAttachments() {
    if (!possiblyOrphanedDigests.length) {
      return;
    }
    possiblyOrphanedDigests.forEach(function (digest) {
      var countReq = attAndSeqStore.index('digestSeq').count(
        IDBKeyRange.bound(
          digest + '::', digest + '::\uffff', false, false));
      countReq.onsuccess = function (e) {
        var count = e.target.result;
        if (!count) {
          // orphaned
          attStore.delete(digest);
        }
      };
    });
  }

  revs.forEach(function (rev) {
    var index = seqStore.index('_doc_id_rev');
    var key = docId + "::" + rev;
    index.getKey(key).onsuccess = function (e) {
      var seq = e.target.result;
      if (typeof seq !== 'number') {
        return checkDone();
      }
      seqStore.delete(seq);

      var cursor = attAndSeqStore.index('seq')
        .openCursor(IDBKeyRange.only(seq));

      cursor.onsuccess = function (event) {
        var cursor = event.target.result;
        if (cursor) {
          var digest = cursor.value.digestSeq.split('::')[0];
          possiblyOrphanedDigests.push(digest);
          attAndSeqStore.delete(cursor.primaryKey);
          cursor.continue();
        } else { // done
          checkDone();
        }
      };
    };
  });
}

function openTransactionSafely(idb, stores, mode) {
  try {
    return {
      txn: idb.transaction(stores, mode)
    };
  } catch (err) {
    return {
      error: err
    };
  }
}

function idbBulkDocs(dbOpts, req, opts, api, idb, idbChanges, callback) {
  var docInfos = req.docs;
  var txn;
  var docStore;
  var bySeqStore;
  var attachStore;
  var attachAndSeqStore;
  var docInfoError;
  var docCountDelta = 0;

  for (var i = 0, len = docInfos.length; i < len; i++) {
    var doc = docInfos[i];
    if (doc._id && isLocalId(doc._id)) {
      continue;
    }
    doc = docInfos[i] = parseDoc(doc, opts.new_edits);
    if (doc.error && !docInfoError) {
      docInfoError = doc;
    }
  }

  if (docInfoError) {
    return callback(docInfoError);
  }

  var results = new Array(docInfos.length);
  var fetchedDocs = new _Map();
  var preconditionErrored = false;
  var blobType = api._meta.blobSupport ? 'blob' : 'base64';

  preprocessAttachments(docInfos, blobType, function (err) {
    if (err) {
      return callback(err);
    }
    startTransaction();
  });

  function startTransaction() {

    var stores = [
      DOC_STORE, BY_SEQ_STORE,
      ATTACH_STORE,
      LOCAL_STORE, ATTACH_AND_SEQ_STORE
    ];
    var txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    txn = txnResult.txn;
    txn.onabort = idbError(callback);
    txn.ontimeout = idbError(callback);
    txn.oncomplete = complete;
    docStore = txn.objectStore(DOC_STORE);
    bySeqStore = txn.objectStore(BY_SEQ_STORE);
    attachStore = txn.objectStore(ATTACH_STORE);
    attachAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);

    verifyAttachments(function (err) {
      if (err) {
        preconditionErrored = true;
        return callback(err);
      }
      fetchExistingDocs();
    });
  }

  function idbProcessDocs() {
    processDocs(dbOpts.revs_limit, docInfos, api, fetchedDocs,
                txn, results, writeDoc, opts);
  }

  function fetchExistingDocs() {

    if (!docInfos.length) {
      return;
    }

    var numFetched = 0;

    function checkDone() {
      if (++numFetched === docInfos.length) {
        idbProcessDocs();
      }
    }

    function readMetadata(event) {
      var metadata = decodeMetadata(event.target.result);

      if (metadata) {
        fetchedDocs.set(metadata.id, metadata);
      }
      checkDone();
    }

    for (var i = 0, len = docInfos.length; i < len; i++) {
      var docInfo = docInfos[i];
      if (docInfo._id && isLocalId(docInfo._id)) {
        checkDone(); // skip local docs
        continue;
      }
      var req = docStore.get(docInfo.metadata.id);
      req.onsuccess = readMetadata;
    }
  }

  function complete() {
    if (preconditionErrored) {
      return;
    }

    idbChanges.notify(api._meta.name);
    api._meta.docCount += docCountDelta;
    callback(null, results);
  }

  function verifyAttachment(digest, callback) {

    var req = attachStore.get(digest);
    req.onsuccess = function (e) {
      if (!e.target.result) {
        var err = createError(MISSING_STUB,
          'unknown stub attachment with digest ' +
          digest);
        err.status = 412;
        callback(err);
      } else {
        callback();
      }
    };
  }

  function verifyAttachments(finish) {


    var digests = [];
    docInfos.forEach(function (docInfo) {
      if (docInfo.data && docInfo.data._attachments) {
        Object.keys(docInfo.data._attachments).forEach(function (filename) {
          var att = docInfo.data._attachments[filename];
          if (att.stub) {
            digests.push(att.digest);
          }
        });
      }
    });
    if (!digests.length) {
      return finish();
    }
    var numDone = 0;
    var err;

    function checkDone() {
      if (++numDone === digests.length) {
        finish(err);
      }
    }
    digests.forEach(function (digest) {
      verifyAttachment(digest, function (attErr) {
        if (attErr && !err) {
          err = attErr;
        }
        checkDone();
      });
    });
  }

  function writeDoc(docInfo, winningRev, winningRevIsDeleted, newRevIsDeleted,
                    isUpdate, delta, resultsIdx, callback) {

    docCountDelta += delta;

    docInfo.metadata.winningRev = winningRev;
    docInfo.metadata.deleted = winningRevIsDeleted;

    var doc = docInfo.data;
    doc._id = docInfo.metadata.id;
    doc._rev = docInfo.metadata.rev;

    if (newRevIsDeleted) {
      doc._deleted = true;
    }

    var hasAttachments = doc._attachments &&
      Object.keys(doc._attachments).length;
    if (hasAttachments) {
      return writeAttachments(docInfo, winningRev, winningRevIsDeleted,
        isUpdate, resultsIdx, callback);
    }

    finishDoc(docInfo, winningRev, winningRevIsDeleted,
      isUpdate, resultsIdx, callback);
  }

  function finishDoc(docInfo, winningRev, winningRevIsDeleted,
                     isUpdate, resultsIdx, callback) {

    var doc = docInfo.data;
    var metadata = docInfo.metadata;

    doc._doc_id_rev = metadata.id + '::' + metadata.rev;
    delete doc._id;
    delete doc._rev;

    function afterPutDoc(e) {
      var revsToDelete = docInfo.stemmedRevs || [];

      if (isUpdate && api.auto_compaction) {
        revsToDelete = revsToDelete.concat(compactTree(docInfo.metadata));
      }

      if (revsToDelete && revsToDelete.length) {
        compactRevs(revsToDelete, docInfo.metadata.id, txn);
      }

      metadata.seq = e.target.result;
      // Current _rev is calculated from _rev_tree on read
      // delete metadata.rev;
      var metadataToStore = encodeMetadata(metadata, winningRev,
        winningRevIsDeleted);
      var metaDataReq = docStore.put(metadataToStore);
      metaDataReq.onsuccess = afterPutMetadata;
    }

    function afterPutDocError(e) {
      // ConstraintError, need to update, not put (see #1638 for details)
      e.preventDefault(); // avoid transaction abort
      e.stopPropagation(); // avoid transaction onerror
      var index = bySeqStore.index('_doc_id_rev');
      var getKeyReq = index.getKey(doc._doc_id_rev);
      getKeyReq.onsuccess = function (e) {
        var putReq = bySeqStore.put(doc, e.target.result);
        putReq.onsuccess = afterPutDoc;
      };
    }

    function afterPutMetadata() {
      results[resultsIdx] = {
        ok: true,
        id: metadata.id,
        rev: metadata.rev
      };
      fetchedDocs.set(docInfo.metadata.id, docInfo.metadata);
      insertAttachmentMappings(docInfo, metadata.seq, callback);
    }

    var putReq = bySeqStore.put(doc);

    putReq.onsuccess = afterPutDoc;
    putReq.onerror = afterPutDocError;
  }

  function writeAttachments(docInfo, winningRev, winningRevIsDeleted,
                            isUpdate, resultsIdx, callback) {


    var doc = docInfo.data;

    var numDone = 0;
    var attachments = Object.keys(doc._attachments);

    function collectResults() {
      if (numDone === attachments.length) {
        finishDoc(docInfo, winningRev, winningRevIsDeleted,
          isUpdate, resultsIdx, callback);
      }
    }

    function attachmentSaved() {
      numDone++;
      collectResults();
    }

    attachments.forEach(function (key) {
      var att = docInfo.data._attachments[key];
      if (!att.stub) {
        var data = att.data;
        delete att.data;
        att.revpos = parseInt(winningRev, 10);
        var digest = att.digest;
        saveAttachment(digest, data, attachmentSaved);
      } else {
        numDone++;
        collectResults();
      }
    });
  }

  // map seqs to attachment digests, which
  // we will need later during compaction
  function insertAttachmentMappings(docInfo, seq, callback) {

    var attsAdded = 0;
    var attsToAdd = Object.keys(docInfo.data._attachments || {});

    if (!attsToAdd.length) {
      return callback();
    }

    function checkDone() {
      if (++attsAdded === attsToAdd.length) {
        callback();
      }
    }

    function add(att) {
      var digest = docInfo.data._attachments[att].digest;
      var req = attachAndSeqStore.put({
        seq: seq,
        digestSeq: digest + '::' + seq
      });

      req.onsuccess = checkDone;
      req.onerror = function (e) {
        // this callback is for a constaint error, which we ignore
        // because this docid/rev has already been associated with
        // the digest (e.g. when new_edits == false)
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
        checkDone();
      };
    }
    for (var i = 0; i < attsToAdd.length; i++) {
      add(attsToAdd[i]); // do in parallel
    }
  }

  function saveAttachment(digest, data, callback) {


    var getKeyReq = attachStore.count(digest);
    getKeyReq.onsuccess = function (e) {
      var count = e.target.result;
      if (count) {
        return callback(); // already exists
      }
      var newAtt = {
        digest: digest,
        body: data
      };
      var putReq = attachStore.put(newAtt);
      putReq.onsuccess = callback;
    };
  }
}

function createKeyRange(start, end, inclusiveEnd, key, descending) {
  try {
    if (start && end) {
      if (descending) {
        return IDBKeyRange.bound(end, start, !inclusiveEnd, false);
      } else {
        return IDBKeyRange.bound(start, end, false, !inclusiveEnd);
      }
    } else if (start) {
      if (descending) {
        return IDBKeyRange.upperBound(start);
      } else {
        return IDBKeyRange.lowerBound(start);
      }
    } else if (end) {
      if (descending) {
        return IDBKeyRange.lowerBound(end, !inclusiveEnd);
      } else {
        return IDBKeyRange.upperBound(end, !inclusiveEnd);
      }
    } else if (key) {
      return IDBKeyRange.only(key);
    }
  } catch (e) {
    return {error: e};
  }
  return null;
}

function handleKeyRangeError(api, opts, err, callback) {
  if (err.name === "DataError" && err.code === 0) {
    // data error, start is less than end
    return callback(null, {
      total_rows: api._meta.docCount,
      offset: opts.skip,
      rows: []
    });
  }
  callback(createError(IDB_ERROR, err.name, err.message));
}

function idbAllDocs(opts, api, idb, callback) {

  function allDocsQuery(opts, callback) {
    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var key = 'key' in opts ? opts.key : false;
    var skip = opts.skip || 0;
    var limit = typeof opts.limit === 'number' ? opts.limit : -1;
    var inclusiveEnd = opts.inclusive_end !== false;
    var descending = 'descending' in opts && opts.descending ? 'prev' : null;

    var keyRange = createKeyRange(start, end, inclusiveEnd, key, descending);
    if (keyRange && keyRange.error) {
      return handleKeyRangeError(api, opts, keyRange.error, callback);
    }

    var stores = [DOC_STORE, BY_SEQ_STORE];

    if (opts.attachments) {
      stores.push(ATTACH_STORE);
    }
    var txnResult = openTransactionSafely(idb, stores, 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;
    var docStore = txn.objectStore(DOC_STORE);
    var seqStore = txn.objectStore(BY_SEQ_STORE);
    var cursor = descending ?
      docStore.openCursor(keyRange, descending) :
      docStore.openCursor(keyRange);
    var docIdRevIndex = seqStore.index('_doc_id_rev');
    var results = [];
    var docCount = 0;

    // if the user specifies include_docs=true, then we don't
    // want to block the main cursor while we're fetching the doc
    function fetchDocAsynchronously(metadata, row, winningRev) {
      var key = metadata.id + "::" + winningRev;
      docIdRevIndex.get(key).onsuccess =  function onGetDoc(e) {
        row.doc = decodeDoc(e.target.result);
        if (opts.conflicts) {
          var conflicts = collectConflicts(metadata);
          if (conflicts.length) {
            row.doc._conflicts = conflicts;
          }
        }
        fetchAttachmentsIfNecessary(row.doc, opts, txn);
      };
    }

    function allDocsInner(cursor, winningRev, metadata) {
      var row = {
        id: metadata.id,
        key: metadata.id,
        value: {
          rev: winningRev
        }
      };
      var deleted = metadata.deleted;
      if (opts.deleted === 'ok') {
        results.push(row);
        // deleted docs are okay with "keys" requests
        if (deleted) {
          row.value.deleted = true;
          row.doc = null;
        } else if (opts.include_docs) {
          fetchDocAsynchronously(metadata, row, winningRev);
        }
      } else if (!deleted && skip-- <= 0) {
        results.push(row);
        if (opts.include_docs) {
          fetchDocAsynchronously(metadata, row, winningRev);
        }
        if (--limit === 0) {
          return;
        }
      }
      cursor.continue();
    }

    function onGetCursor(e) {
      docCount = api._meta.docCount; // do this within the txn for consistency
      var cursor = e.target.result;
      if (!cursor) {
        return;
      }
      var metadata = decodeMetadata(cursor.value);
      var winningRev = metadata.winningRev;

      allDocsInner(cursor, winningRev, metadata);
    }

    function onResultsReady() {
      callback(null, {
        total_rows: docCount,
        offset: opts.skip,
        rows: results
      });
    }

    function onTxnComplete() {
      if (opts.attachments) {
        postProcessAttachments(results, opts.binary).then(onResultsReady);
      } else {
        onResultsReady();
      }
    }

    txn.oncomplete = onTxnComplete;
    cursor.onsuccess = onGetCursor;
  }

  function allDocs(opts, callback) {

    if (opts.limit === 0) {
      return callback(null, {
        total_rows: api._meta.docCount,
        offset: opts.skip,
        rows: []
      });
    }
    allDocsQuery(opts, callback);
  }

  allDocs(opts, callback);
}

//
// Blobs are not supported in all versions of IndexedDB, notably
// Chrome <37 and Android <5. In those versions, storing a blob will throw.
//
// Various other blob bugs exist in Chrome v37-42 (inclusive).
// Detecting them is expensive and confusing to users, and Chrome 37-42
// is at very low usage worldwide, so we do a hacky userAgent check instead.
//
// content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
// 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
// FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
//
function checkBlobSupport(txn) {
  return new PouchPromise(function (resolve) {
    var blob = createBlob(['']);
    txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');

    txn.onabort = function (e) {
      // If the transaction aborts now its due to not being able to
      // write to the database, likely due to the disk being full
      e.preventDefault();
      e.stopPropagation();
      resolve(false);
    };

    txn.oncomplete = function () {
      var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
      var matchedEdge = navigator.userAgent.match(/Edge\//);
      // MS Edge pretends to be Chrome 42:
      // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx
      resolve(matchedEdge || !matchedChrome ||
        parseInt(matchedChrome[1], 10) >= 43);
    };
  }).catch(function () {
    return false; // error, so assume unsupported
  });
}

var cachedDBs = new _Map();
var blobSupportPromise;
var idbChanges = new Changes();
var openReqList = new _Map();

function IdbPouch(opts, callback) {
  var api = this;

  taskQueue.queue.push({
    action: function (thisCallback) {
      init(api, opts, thisCallback);
    },
    callback: callback
  });
  applyNext(api.constructor);
}

function init(api, opts, callback) {

  var dbName = opts.name;

  var idb = null;
  api._meta = null;

  // called when creating a fresh new database
  function createSchema(db) {
    var docStore = db.createObjectStore(DOC_STORE, {keyPath : 'id'});
    db.createObjectStore(BY_SEQ_STORE, {autoIncrement: true})
      .createIndex('_doc_id_rev', '_doc_id_rev', {unique: true});
    db.createObjectStore(ATTACH_STORE, {keyPath: 'digest'});
    db.createObjectStore(META_STORE, {keyPath: 'id', autoIncrement: false});
    db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);

    // added in v2
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', {unique : false});

    // added in v3
    db.createObjectStore(LOCAL_STORE, {keyPath: '_id'});

    // added in v4
    var attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE,
      {autoIncrement: true});
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', {unique: true});
  }

  // migration to version 2
  // unfortunately "deletedOrLocal" is a misnomer now that we no longer
  // store local docs in the main doc-store, but whaddyagonnado
  function addDeletedOrLocalIndex(txn, callback) {
    var docStore = txn.objectStore(DOC_STORE);
    docStore.createIndex('deletedOrLocal', 'deletedOrLocal', {unique : false});

    docStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        var metadata = cursor.value;
        var deleted = isDeleted(metadata);
        metadata.deletedOrLocal = deleted ? "1" : "0";
        docStore.put(metadata);
        cursor.continue();
      } else {
        callback();
      }
    };
  }

  // migration to version 3 (part 1)
  function createLocalStoreSchema(db) {
    db.createObjectStore(LOCAL_STORE, {keyPath: '_id'})
      .createIndex('_doc_id_rev', '_doc_id_rev', {unique: true});
  }

  // migration to version 3 (part 2)
  function migrateLocalStore(txn, cb) {
    var localStore = txn.objectStore(LOCAL_STORE);
    var docStore = txn.objectStore(DOC_STORE);
    var seqStore = txn.objectStore(BY_SEQ_STORE);

    var cursor = docStore.openCursor();
    cursor.onsuccess = function (event) {
      var cursor = event.target.result;
      if (cursor) {
        var metadata = cursor.value;
        var docId = metadata.id;
        var local = isLocalId(docId);
        var rev = winningRev(metadata);
        if (local) {
          var docIdRev = docId + "::" + rev;
          // remove all seq entries
          // associated with this docId
          var start = docId + "::";
          var end = docId + "::~";
          var index = seqStore.index('_doc_id_rev');
          var range = IDBKeyRange.bound(start, end, false, false);
          var seqCursor = index.openCursor(range);
          seqCursor.onsuccess = function (e) {
            seqCursor = e.target.result;
            if (!seqCursor) {
              // done
              docStore.delete(cursor.primaryKey);
              cursor.continue();
            } else {
              var data = seqCursor.value;
              if (data._doc_id_rev === docIdRev) {
                localStore.put(data);
              }
              seqStore.delete(seqCursor.primaryKey);
              seqCursor.continue();
            }
          };
        } else {
          cursor.continue();
        }
      } else if (cb) {
        cb();
      }
    };
  }

  // migration to version 4 (part 1)
  function addAttachAndSeqStore(db) {
    var attAndSeqStore = db.createObjectStore(ATTACH_AND_SEQ_STORE,
      {autoIncrement: true});
    attAndSeqStore.createIndex('seq', 'seq');
    attAndSeqStore.createIndex('digestSeq', 'digestSeq', {unique: true});
  }

  // migration to version 4 (part 2)
  function migrateAttsAndSeqs(txn, callback) {
    var seqStore = txn.objectStore(BY_SEQ_STORE);
    var attStore = txn.objectStore(ATTACH_STORE);
    var attAndSeqStore = txn.objectStore(ATTACH_AND_SEQ_STORE);

    // need to actually populate the table. this is the expensive part,
    // so as an optimization, check first that this database even
    // contains attachments
    var req = attStore.count();
    req.onsuccess = function (e) {
      var count = e.target.result;
      if (!count) {
        return callback(); // done
      }

      seqStore.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (!cursor) {
          return callback(); // done
        }
        var doc = cursor.value;
        var seq = cursor.primaryKey;
        var atts = Object.keys(doc._attachments || {});
        var digestMap = {};
        for (var j = 0; j < atts.length; j++) {
          var att = doc._attachments[atts[j]];
          digestMap[att.digest] = true; // uniq digests, just in case
        }
        var digests = Object.keys(digestMap);
        for (j = 0; j < digests.length; j++) {
          var digest = digests[j];
          attAndSeqStore.put({
            seq: seq,
            digestSeq: digest + '::' + seq
          });
        }
        cursor.continue();
      };
    };
  }

  // migration to version 5
  // Instead of relying on on-the-fly migration of metadata,
  // this brings the doc-store to its modern form:
  // - metadata.winningrev
  // - metadata.seq
  // - stringify the metadata when storing it
  function migrateMetadata(txn) {

    function decodeMetadataCompat(storedObject) {
      if (!storedObject.data) {
        // old format, when we didn't store it stringified
        storedObject.deleted = storedObject.deletedOrLocal === '1';
        return storedObject;
      }
      return decodeMetadata(storedObject);
    }

    // ensure that every metadata has a winningRev and seq,
    // which was previously created on-the-fly but better to migrate
    var bySeqStore = txn.objectStore(BY_SEQ_STORE);
    var docStore = txn.objectStore(DOC_STORE);
    var cursor = docStore.openCursor();
    cursor.onsuccess = function (e) {
      var cursor = e.target.result;
      if (!cursor) {
        return; // done
      }
      var metadata = decodeMetadataCompat(cursor.value);

      metadata.winningRev = metadata.winningRev ||
        winningRev(metadata);

      function fetchMetadataSeq() {
        // metadata.seq was added post-3.2.0, so if it's missing,
        // we need to fetch it manually
        var start = metadata.id + '::';
        var end = metadata.id + '::\uffff';
        var req = bySeqStore.index('_doc_id_rev').openCursor(
          IDBKeyRange.bound(start, end));

        var metadataSeq = 0;
        req.onsuccess = function (e) {
          var cursor = e.target.result;
          if (!cursor) {
            metadata.seq = metadataSeq;
            return onGetMetadataSeq();
          }
          var seq = cursor.primaryKey;
          if (seq > metadataSeq) {
            metadataSeq = seq;
          }
          cursor.continue();
        };
      }

      function onGetMetadataSeq() {
        var metadataToStore = encodeMetadata(metadata,
          metadata.winningRev, metadata.deleted);

        var req = docStore.put(metadataToStore);
        req.onsuccess = function () {
          cursor.continue();
        };
      }

      if (metadata.seq) {
        return onGetMetadataSeq();
      }

      fetchMetadataSeq();
    };

  }

  api.type = function () {
    return 'idb';
  };

  api._id = toPromise(function (callback) {
    callback(null, api._meta.instanceId);
  });

  api._bulkDocs = function idb_bulkDocs(req, reqOpts, callback) {
    idbBulkDocs(opts, req, reqOpts, api, idb, idbChanges, callback);
  };

  // First we look up the metadata in the ids database, then we fetch the
  // current revision(s) from the by sequence store
  api._get = function idb_get(id, opts, callback) {
    var doc;
    var metadata;
    var err;
    var txn = opts.ctx;
    if (!txn) {
      var txnResult = openTransactionSafely(idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }

    function finish() {
      callback(err, {doc: doc, metadata: metadata, ctx: txn});
    }

    txn.objectStore(DOC_STORE).get(id).onsuccess = function (e) {
      metadata = decodeMetadata(e.target.result);
      // we can determine the result here if:
      // 1. there is no such document
      // 2. the document is deleted and we don't ask about specific rev
      // When we ask with opts.rev we expect the answer to be either
      // doc (possibly with _deleted=true) or missing error
      if (!metadata) {
        err = createError(MISSING_DOC, 'missing');
        return finish();
      }
      if (isDeleted(metadata) && !opts.rev) {
        err = createError(MISSING_DOC, "deleted");
        return finish();
      }
      var objectStore = txn.objectStore(BY_SEQ_STORE);

      var rev = opts.rev || metadata.winningRev;
      var key = metadata.id + '::' + rev;

      objectStore.index('_doc_id_rev').get(key).onsuccess = function (e) {
        doc = e.target.result;
        if (doc) {
          doc = decodeDoc(doc);
        }
        if (!doc) {
          err = createError(MISSING_DOC, 'missing');
          return finish();
        }
        finish();
      };
    };
  };

  api._getAttachment = function (docId, attachId, attachment, opts, callback) {
    var txn;
    if (opts.ctx) {
      txn = opts.ctx;
    } else {
      var txnResult = openTransactionSafely(idb,
        [DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], 'readonly');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      txn = txnResult.txn;
    }
    var digest = attachment.digest;
    var type = attachment.content_type;

    txn.objectStore(ATTACH_STORE).get(digest).onsuccess = function (e) {
      var body = e.target.result.body;
      readBlobData(body, type, opts.binary, function (blobData) {
        callback(null, blobData);
      });
    };
  };

  api._info = function idb_info(callback) {

    if (idb === null || !cachedDBs.has(dbName)) {
      var error = new Error('db isn\'t open');
      error.id = 'idbNull';
      return callback(error);
    }
    var updateSeq;
    var docCount;

    var txnResult = openTransactionSafely(idb, [BY_SEQ_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;
    var cursor = txn.objectStore(BY_SEQ_STORE).openCursor(null, 'prev');
    cursor.onsuccess = function (event) {
      var cursor = event.target.result;
      updateSeq = cursor ? cursor.key : 0;
      // count within the same txn for consistency
      docCount = api._meta.docCount;
    };

    txn.oncomplete = function () {
      callback(null, {
        doc_count: docCount,
        update_seq: updateSeq,
        // for debugging
        idb_attachment_format: (api._meta.blobSupport ? 'binary' : 'base64')
      });
    };
  };

  api._allDocs = function idb_allDocs(opts, callback) {
    idbAllDocs(opts, api, idb, callback);
  };

  api._changes = function (opts) {
    opts = clone(opts);

    if (opts.continuous) {
      var id = dbName + ':' + uuid();
      idbChanges.addListener(dbName, id, api, opts);
      idbChanges.notify(dbName);
      return {
        cancel: function () {
          idbChanges.removeListener(dbName, id);
        }
      };
    }

    var docIds = opts.doc_ids && new _Set(opts.doc_ids);

    opts.since = opts.since || 0;
    var lastSeq = opts.since;

    var limit = 'limit' in opts ? opts.limit : -1;
    if (limit === 0) {
      limit = 1; // per CouchDB _changes spec
    }
    var returnDocs;
    if ('return_docs' in opts) {
      returnDocs = opts.return_docs;
    } else if ('returnDocs' in opts) {
      // TODO: Remove 'returnDocs' in favor of 'return_docs' in a future release
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }

    var results = [];
    var numResults = 0;
    var filter = filterChange(opts);
    var docIdsToMetadata = new _Map();

    var txn;
    var bySeqStore;
    var docStore;
    var docIdRevIndex;

    function onGetCursor(cursor) {

      var doc = decodeDoc(cursor.value);
      var seq = cursor.key;

      if (docIds && !docIds.has(doc._id)) {
        return cursor.continue();
      }

      var metadata;

      function onGetMetadata() {
        if (metadata.seq !== seq) {
          // some other seq is later
          return cursor.continue();
        }

        lastSeq = seq;

        if (metadata.winningRev === doc._rev) {
          return onGetWinningDoc(doc);
        }

        fetchWinningDoc();
      }

      function fetchWinningDoc() {
        var docIdRev = doc._id + '::' + metadata.winningRev;
        var req = docIdRevIndex.get(docIdRev);
        req.onsuccess = function (e) {
          onGetWinningDoc(decodeDoc(e.target.result));
        };
      }

      function onGetWinningDoc(winningDoc) {

        var change = opts.processChange(winningDoc, metadata, opts);
        change.seq = metadata.seq;

        var filtered = filter(change);
        if (typeof filtered === 'object') {
          return opts.complete(filtered);
        }

        if (filtered) {
          numResults++;
          if (returnDocs) {
            results.push(change);
          }
          // process the attachment immediately
          // for the benefit of live listeners
          if (opts.attachments && opts.include_docs) {
            fetchAttachmentsIfNecessary(winningDoc, opts, txn, function () {
              postProcessAttachments([change], opts.binary).then(function () {
                opts.onChange(change);
              });
            });
          } else {
            opts.onChange(change);
          }
        }
        if (numResults !== limit) {
          cursor.continue();
        }
      }

      metadata = docIdsToMetadata.get(doc._id);
      if (metadata) { // cached
        return onGetMetadata();
      }
      // metadata not cached, have to go fetch it
      docStore.get(doc._id).onsuccess = function (event) {
        metadata = decodeMetadata(event.target.result);
        docIdsToMetadata.set(doc._id, metadata);
        onGetMetadata();
      };
    }

    function onsuccess(event) {
      var cursor = event.target.result;

      if (!cursor) {
        return;
      }
      onGetCursor(cursor);
    }

    function fetchChanges() {
      var objectStores = [DOC_STORE, BY_SEQ_STORE];
      if (opts.attachments) {
        objectStores.push(ATTACH_STORE);
      }
      var txnResult = openTransactionSafely(idb, objectStores, 'readonly');
      if (txnResult.error) {
        return opts.complete(txnResult.error);
      }
      txn = txnResult.txn;
      txn.onabort = idbError(opts.complete);
      txn.oncomplete = onTxnComplete;

      bySeqStore = txn.objectStore(BY_SEQ_STORE);
      docStore = txn.objectStore(DOC_STORE);
      docIdRevIndex = bySeqStore.index('_doc_id_rev');

      var req;

      if (opts.descending) {
        req = bySeqStore.openCursor(null, 'prev');
      } else {
        req = bySeqStore.openCursor(IDBKeyRange.lowerBound(opts.since, true));
      }

      req.onsuccess = onsuccess;
    }

    fetchChanges();

    function onTxnComplete() {

      function finish() {
        opts.complete(null, {
          results: results,
          last_seq: lastSeq
        });
      }

      if (!opts.continuous && opts.attachments) {
        // cannot guarantee that postProcessing was already done,
        // so do it again
        postProcessAttachments(results).then(finish);
      } else {
        finish();
      }
    }
  };

  api._close = function (callback) {
    if (idb === null) {
      return callback(createError(NOT_OPEN));
    }

    // https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#close
    // "Returns immediately and closes the connection in a separate thread..."
    idb.close();
    cachedDBs.delete(dbName);
    idb = null;
    callback();
  };

  api._getRevisionTree = function (docId, callback) {
    var txnResult = openTransactionSafely(idb, [DOC_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;
    var req = txn.objectStore(DOC_STORE).get(docId);
    req.onsuccess = function (event) {
      var doc = decodeMetadata(event.target.result);
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        callback(null, doc.rev_tree);
      }
    };
  };

  // This function removes revisions of document docId
  // which are listed in revs and sets this document
  // revision to to rev_tree
  api._doCompaction = function (docId, revs, callback) {
    var stores = [
      DOC_STORE,
      BY_SEQ_STORE,
      ATTACH_STORE,
      ATTACH_AND_SEQ_STORE
    ];
    var txnResult = openTransactionSafely(idb, stores, 'readwrite');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var txn = txnResult.txn;

    var docStore = txn.objectStore(DOC_STORE);

    docStore.get(docId).onsuccess = function (event) {
      var metadata = decodeMetadata(event.target.result);
      traverseRevTree(metadata.rev_tree, function (isLeaf, pos,
                                                         revHash, ctx, opts) {
        var rev = pos + '-' + revHash;
        if (revs.indexOf(rev) !== -1) {
          opts.status = 'missing';
        }
      });
      compactRevs(revs, docId, txn);
      var winningRev = metadata.winningRev;
      var deleted = metadata.deleted;
      txn.objectStore(DOC_STORE).put(
        encodeMetadata(metadata, winningRev, deleted));
    };
    txn.onabort = idbError(callback);
    txn.oncomplete = function () {
      callback();
    };
  };


  api._getLocal = function (id, callback) {
    var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readonly');
    if (txnResult.error) {
      return callback(txnResult.error);
    }
    var tx = txnResult.txn;
    var req = tx.objectStore(LOCAL_STORE).get(id);

    req.onerror = idbError(callback);
    req.onsuccess = function (e) {
      var doc = e.target.result;
      if (!doc) {
        callback(createError(MISSING_DOC));
      } else {
        delete doc['_doc_id_rev']; // for backwards compat
        callback(null, doc);
      }
    };
  };

  api._putLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    delete doc._revisions; // ignore this, trust the rev
    var oldRev = doc._rev;
    var id = doc._id;
    if (!oldRev) {
      doc._rev = '0-1';
    } else {
      doc._rev = '0-' + (parseInt(oldRev.split('-')[1], 10) + 1);
    }

    var tx = opts.ctx;
    var ret;
    if (!tx) {
      var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      tx.onerror = idbError(callback);
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }

    var oStore = tx.objectStore(LOCAL_STORE);
    var req;
    if (oldRev) {
      req = oStore.get(id);
      req.onsuccess = function (e) {
        var oldDoc = e.target.result;
        if (!oldDoc || oldDoc._rev !== oldRev) {
          callback(createError(REV_CONFLICT));
        } else { // update
          var req = oStore.put(doc);
          req.onsuccess = function () {
            ret = {ok: true, id: doc._id, rev: doc._rev};
            if (opts.ctx) { // return immediately
              callback(null, ret);
            }
          };
        }
      };
    } else { // new doc
      req = oStore.add(doc);
      req.onerror = function (e) {
        // constraint error, already exists
        callback(createError(REV_CONFLICT));
        e.preventDefault(); // avoid transaction abort
        e.stopPropagation(); // avoid transaction onerror
      };
      req.onsuccess = function () {
        ret = {ok: true, id: doc._id, rev: doc._rev};
        if (opts.ctx) { // return immediately
          callback(null, ret);
        }
      };
    }
  };

  api._removeLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var tx = opts.ctx;
    if (!tx) {
      var txnResult = openTransactionSafely(idb, [LOCAL_STORE], 'readwrite');
      if (txnResult.error) {
        return callback(txnResult.error);
      }
      tx = txnResult.txn;
      tx.oncomplete = function () {
        if (ret) {
          callback(null, ret);
        }
      };
    }
    var ret;
    var id = doc._id;
    var oStore = tx.objectStore(LOCAL_STORE);
    var req = oStore.get(id);

    req.onerror = idbError(callback);
    req.onsuccess = function (e) {
      var oldDoc = e.target.result;
      if (!oldDoc || oldDoc._rev !== doc._rev) {
        callback(createError(MISSING_DOC));
      } else {
        oStore.delete(id);
        ret = {ok: true, id: id, rev: '0-0'};
        if (opts.ctx) { // return immediately
          callback(null, ret);
        }
      }
    };
  };

  api._destroy = function (opts, callback) {
    idbChanges.removeAllListeners(dbName);

    //Close open request for "dbName" database to fix ie delay.
    var openReq = openReqList.get(dbName);
    if (openReq && openReq.result) {
      openReq.result.close();
      cachedDBs.delete(dbName);
    }
    var req = indexedDB.deleteDatabase(dbName);

    req.onsuccess = function () {
      //Remove open request from the list.
      openReqList.delete(dbName);
      if (hasLocalStorage() && (dbName in localStorage)) {
        delete localStorage[dbName];
      }
      callback(null, { 'ok': true });
    };

    req.onerror = idbError(callback);
  };

  var cached = cachedDBs.get(dbName);

  if (cached) {
    idb = cached.idb;
    api._meta = cached.global;
    process.nextTick(function () {
      callback(null, api);
    });
    return;
  }

  var req;
  if (opts.storage) {
    req = tryStorageOption(dbName, opts.storage);
  } else {
    req = indexedDB.open(dbName, ADAPTER_VERSION);
  }

  openReqList.set(dbName, req);

  req.onupgradeneeded = function (e) {
    var db = e.target.result;
    if (e.oldVersion < 1) {
      return createSchema(db); // new db, initial schema
    }
    // do migrations

    var txn = e.currentTarget.transaction;
    // these migrations have to be done in this function, before
    // control is returned to the event loop, because IndexedDB

    if (e.oldVersion < 3) {
      createLocalStoreSchema(db); // v2 -> v3
    }
    if (e.oldVersion < 4) {
      addAttachAndSeqStore(db); // v3 -> v4
    }

    var migrations = [
      addDeletedOrLocalIndex, // v1 -> v2
      migrateLocalStore,      // v2 -> v3
      migrateAttsAndSeqs,     // v3 -> v4
      migrateMetadata         // v4 -> v5
    ];

    var i = e.oldVersion;

    function next() {
      var migration = migrations[i - 1];
      i++;
      if (migration) {
        migration(txn, next);
      }
    }

    next();
  };

  req.onsuccess = function (e) {

    idb = e.target.result;

    idb.onversionchange = function () {
      idb.close();
      cachedDBs.delete(dbName);
    };

    idb.onabort = function (e) {
      guardedConsole('error', 'Database has a global failure', e.target.error);
      idb.close();
      cachedDBs.delete(dbName);
    };

    var txn = idb.transaction([
      META_STORE,
      DETECT_BLOB_SUPPORT_STORE,
      DOC_STORE
    ], 'readwrite');

    var req = txn.objectStore(META_STORE).get(META_STORE);

    var blobSupport = null;
    var docCount = null;
    var instanceId = null;

    req.onsuccess = function (e) {

      var checkSetupComplete = function () {
        if (blobSupport === null || docCount === null ||
            instanceId === null) {
          return;
        } else {
          api._meta = {
            name: dbName,
            instanceId: instanceId,
            blobSupport: blobSupport,
            docCount: docCount
          };

          cachedDBs.set(dbName, {
            idb: idb,
            global: api._meta
          });
          callback(null, api);
        }
      };

      //
      // fetch/store the id
      //

      var meta = e.target.result || {id: META_STORE};
      if (dbName  + '_id' in meta) {
        instanceId = meta[dbName + '_id'];
        checkSetupComplete();
      } else {
        instanceId = uuid();
        meta[dbName + '_id'] = instanceId;
        txn.objectStore(META_STORE).put(meta).onsuccess = function () {
          checkSetupComplete();
        };
      }

      //
      // check blob support
      //

      if (!blobSupportPromise) {
        // make sure blob support is only checked once
        blobSupportPromise = checkBlobSupport(txn);
      }

      blobSupportPromise.then(function (val) {
        blobSupport = val;
        checkSetupComplete();
      });

      //
      // count docs
      //

      var index = txn.objectStore(DOC_STORE).index('deletedOrLocal');
      index.count(IDBKeyRange.only('0')).onsuccess = function (e) {
        docCount = e.target.result;
        checkSetupComplete();
      };

    };
  };

  req.onerror = function () {
    var msg = 'Failed to open indexedDB, are you in private browsing mode?';
    guardedConsole('error', msg);
    callback(createError(IDB_ERROR, msg));
  };
}

IdbPouch.valid = function () {
  return true;
};

function tryStorageOption(dbName, storage) {
  try { // option only available in Firefox 26+
    return indexedDB.open(dbName, {
      version: ADAPTER_VERSION,
      storage: storage
    });
  } catch(err) {
      return indexedDB.open(dbName, ADAPTER_VERSION);
  }
}

function IDBPouch (PouchDB) {
  PouchDB.adapter('idb', IdbPouch, true);
}

//
// Parsing hex strings. Yeah.
//
// So basically we need this because of a bug in WebSQL:
// https://code.google.com/p/chromium/issues/detail?id=422690
// https://bugs.webkit.org/show_bug.cgi?id=137637
//
// UTF-8 and UTF-16 are provided as separate functions
// for meager performance improvements
//

function decodeUtf8(str) {
  return decodeURIComponent(escape(str));
}

function hexToInt(charCode) {
  // '0'-'9' is 48-57
  // 'A'-'F' is 65-70
  // SQLite will only give us uppercase hex
  return charCode < 65 ? (charCode - 48) : (charCode - 55);
}


// Example:
// pragma encoding=utf8;
// select hex('A');
// returns '41'
function parseHexUtf8(str, start, end) {
  var result = '';
  while (start < end) {
    result += String.fromCharCode(
      (hexToInt(str.charCodeAt(start++)) << 4) |
        hexToInt(str.charCodeAt(start++)));
  }
  return result;
}

// Example:
// pragma encoding=utf16;
// select hex('A');
// returns '4100'
// notice that the 00 comes after the 41 (i.e. it's swizzled)
function parseHexUtf16(str, start, end) {
  var result = '';
  while (start < end) {
    // UTF-16, so swizzle the bytes
    result += String.fromCharCode(
      (hexToInt(str.charCodeAt(start + 2)) << 12) |
        (hexToInt(str.charCodeAt(start + 3)) << 8) |
        (hexToInt(str.charCodeAt(start)) << 4) |
        hexToInt(str.charCodeAt(start + 1)));
    start += 4;
  }
  return result;
}

function parseHexString(str, encoding) {
  if (encoding === 'UTF-8') {
    return decodeUtf8(parseHexUtf8(str, 0, str.length));
  } else {
    return parseHexUtf16(str, 0, str.length);
  }
}

function quote(str) {
  return "'" + str + "'";
}

var ADAPTER_VERSION$1 = 7; // used to manage migrations

// The object stores created for each database
// DOC_STORE stores the document meta data, its revision history and state
var DOC_STORE$1 = quote('document-store');
// BY_SEQ_STORE stores a particular version of a document, keyed by its
// sequence id
var BY_SEQ_STORE$1 = quote('by-sequence');
// Where we store attachments
var ATTACH_STORE$1 = quote('attach-store');
var LOCAL_STORE$1 = quote('local-store');
var META_STORE$1 = quote('metadata-store');
// where we store many-to-many relations between attachment
// digests and seqs
var ATTACH_AND_SEQ_STORE$1 = quote('attach-seq-store');

// escapeBlob and unescapeBlob are workarounds for a websql bug:
// https://code.google.com/p/chromium/issues/detail?id=422690
// https://bugs.webkit.org/show_bug.cgi?id=137637
// The goal is to never actually insert the \u0000 character
// in the database.
function escapeBlob(str) {
  return str
    .replace(/\u0002/g, '\u0002\u0002')
    .replace(/\u0001/g, '\u0001\u0002')
    .replace(/\u0000/g, '\u0001\u0001');
}

function unescapeBlob(str) {
  return str
    .replace(/\u0001\u0001/g, '\u0000')
    .replace(/\u0001\u0002/g, '\u0001')
    .replace(/\u0002\u0002/g, '\u0002');
}

function stringifyDoc(doc) {
  // don't bother storing the id/rev. it uses lots of space,
  // in persistent map/reduce especially
  delete doc._id;
  delete doc._rev;
  return JSON.stringify(doc);
}

function unstringifyDoc(doc, id, rev) {
  doc = JSON.parse(doc);
  doc._id = id;
  doc._rev = rev;
  return doc;
}

// question mark groups IN queries, e.g. 3 -> '(?,?,?)'
function qMarks(num) {
  var s = '(';
  while (num--) {
    s += '?';
    if (num) {
      s += ',';
    }
  }
  return s + ')';
}

function select(selector, table, joiner, where, orderBy) {
  return 'SELECT ' + selector + ' FROM ' +
    (typeof table === 'string' ? table : table.join(' JOIN ')) +
    (joiner ? (' ON ' + joiner) : '') +
    (where ? (' WHERE ' +
    (typeof where === 'string' ? where : where.join(' AND '))) : '') +
    (orderBy ? (' ORDER BY ' + orderBy) : '');
}

function compactRevs$1(revs, docId, tx) {

  if (!revs.length) {
    return;
  }

  var numDone = 0;
  var seqs = [];

  function checkDone() {
    if (++numDone === revs.length) { // done
      deleteOrphans();
    }
  }

  function deleteOrphans() {
    // find orphaned attachment digests

    if (!seqs.length) {
      return;
    }

    var sql = 'SELECT DISTINCT digest AS digest FROM ' +
      ATTACH_AND_SEQ_STORE$1 + ' WHERE seq IN ' + qMarks(seqs.length);

    tx.executeSql(sql, seqs, function (tx, res) {

      var digestsToCheck = [];
      for (var i = 0; i < res.rows.length; i++) {
        digestsToCheck.push(res.rows.item(i).digest);
      }
      if (!digestsToCheck.length) {
        return;
      }

      var sql = 'DELETE FROM ' + ATTACH_AND_SEQ_STORE$1 +
        ' WHERE seq IN (' +
        seqs.map(function () { return '?'; }).join(',') +
        ')';
      tx.executeSql(sql, seqs, function (tx) {

        var sql = 'SELECT digest FROM ' + ATTACH_AND_SEQ_STORE$1 +
          ' WHERE digest IN (' +
          digestsToCheck.map(function () { return '?'; }).join(',') +
          ')';
        tx.executeSql(sql, digestsToCheck, function (tx, res) {
          var nonOrphanedDigests = new _Set();
          for (var i = 0; i < res.rows.length; i++) {
            nonOrphanedDigests.add(res.rows.item(i).digest);
          }
          digestsToCheck.forEach(function (digest) {
            if (nonOrphanedDigests.has(digest)) {
              return;
            }
            tx.executeSql(
              'DELETE FROM ' + ATTACH_AND_SEQ_STORE$1 + ' WHERE digest=?',
              [digest]);
            tx.executeSql(
              'DELETE FROM ' + ATTACH_STORE$1 + ' WHERE digest=?', [digest]);
          });
        });
      });
    });
  }

  // update by-seq and attach stores in parallel
  revs.forEach(function (rev) {
    var sql = 'SELECT seq FROM ' + BY_SEQ_STORE$1 +
      ' WHERE doc_id=? AND rev=?';

    tx.executeSql(sql, [docId, rev], function (tx, res) {
      if (!res.rows.length) { // already deleted
        return checkDone();
      }
      var seq = res.rows.item(0).seq;
      seqs.push(seq);

      tx.executeSql(
        'DELETE FROM ' + BY_SEQ_STORE$1 + ' WHERE seq=?', [seq], checkDone);
    });
  });
}

function websqlError(callback) {
  return function (event) {
    guardedConsole('error', 'WebSQL threw an error', event);
    // event may actually be a SQLError object, so report is as such
    var errorNameMatch = event && event.constructor.toString()
        .match(/function ([^\(]+)/);
    var errorName = (errorNameMatch && errorNameMatch[1]) || event.type;
    var errorReason = event.target || event.message;
    callback(createError(WSQ_ERROR, errorReason, errorName));
  };
}

function getSize(opts) {
  if ('size' in opts) {
    // triggers immediate popup in iOS, fixes #2347
    // e.g. 5000001 asks for 5 MB, 10000001 asks for 10 MB,
    return opts.size * 1000000;
  }
  // In iOS, doesn't matter as long as it's <= 5000000.
  // Except that if you request too much, our tests fail
  // because of the native "do you accept?" popup.
  // In Android <=4.3, this value is actually used as an
  // honest-to-god ceiling for data, so we need to
  // set it to a decently high number.
  var isAndroid = typeof navigator !== 'undefined' &&
    /Android/.test(navigator.userAgent);
  return isAndroid ? 5000000 : 1; // in PhantomJS, if you use 0 it will crash
}

function websqlBulkDocs(dbOpts, req, opts, api, db, websqlChanges, callback) {
  var newEdits = opts.new_edits;
  var userDocs = req.docs;

  // Parse the docs, give them a sequence number for the result
  var docInfos = userDocs.map(function (doc) {
    if (doc._id && isLocalId(doc._id)) {
      return doc;
    }
    var newDoc = parseDoc(doc, newEdits);
    return newDoc;
  });

  var docInfoErrors = docInfos.filter(function (docInfo) {
    return docInfo.error;
  });
  if (docInfoErrors.length) {
    return callback(docInfoErrors[0]);
  }

  var tx;
  var results = new Array(docInfos.length);
  var fetchedDocs = new _Map();

  var preconditionErrored;
  function complete() {
    if (preconditionErrored) {
      return callback(preconditionErrored);
    }
    websqlChanges.notify(api._name);
    api._docCount = -1; // invalidate
    callback(null, results);
  }

  function verifyAttachment(digest, callback) {
    var sql = 'SELECT count(*) as cnt FROM ' + ATTACH_STORE$1 +
      ' WHERE digest=?';
    tx.executeSql(sql, [digest], function (tx, result) {
      if (result.rows.item(0).cnt === 0) {
        var err = createError(MISSING_STUB,
          'unknown stub attachment with digest ' +
          digest);
        callback(err);
      } else {
        callback();
      }
    });
  }

  function verifyAttachments(finish) {
    var digests = [];
    docInfos.forEach(function (docInfo) {
      if (docInfo.data && docInfo.data._attachments) {
        Object.keys(docInfo.data._attachments).forEach(function (filename) {
          var att = docInfo.data._attachments[filename];
          if (att.stub) {
            digests.push(att.digest);
          }
        });
      }
    });
    if (!digests.length) {
      return finish();
    }
    var numDone = 0;
    var err;

    function checkDone() {
      if (++numDone === digests.length) {
        finish(err);
      }
    }
    digests.forEach(function (digest) {
      verifyAttachment(digest, function (attErr) {
        if (attErr && !err) {
          err = attErr;
        }
        checkDone();
      });
    });
  }

  function writeDoc(docInfo, winningRev, winningRevIsDeleted, newRevIsDeleted,
                    isUpdate, delta, resultsIdx, callback) {

    function finish() {
      var data = docInfo.data;
      var deletedInt = newRevIsDeleted ? 1 : 0;

      var id = data._id;
      var rev = data._rev;
      var json = stringifyDoc(data);
      var sql = 'INSERT INTO ' + BY_SEQ_STORE$1 +
        ' (doc_id, rev, json, deleted) VALUES (?, ?, ?, ?);';
      var sqlArgs = [id, rev, json, deletedInt];

      // map seqs to attachment digests, which
      // we will need later during compaction
      function insertAttachmentMappings(seq, callback) {
        var attsAdded = 0;
        var attsToAdd = Object.keys(data._attachments || {});

        if (!attsToAdd.length) {
          return callback();
        }
        function checkDone() {
          if (++attsAdded === attsToAdd.length) {
            callback();
          }
          return false; // ack handling a constraint error
        }
        function add(att) {
          var sql = 'INSERT INTO ' + ATTACH_AND_SEQ_STORE$1 +
            ' (digest, seq) VALUES (?,?)';
          var sqlArgs = [data._attachments[att].digest, seq];
          tx.executeSql(sql, sqlArgs, checkDone, checkDone);
          // second callback is for a constaint error, which we ignore
          // because this docid/rev has already been associated with
          // the digest (e.g. when new_edits == false)
        }
        for (var i = 0; i < attsToAdd.length; i++) {
          add(attsToAdd[i]); // do in parallel
        }
      }

      tx.executeSql(sql, sqlArgs, function (tx, result) {
        var seq = result.insertId;
        insertAttachmentMappings(seq, function () {
          dataWritten(tx, seq);
        });
      }, function () {
        // constraint error, recover by updating instead (see #1638)
        var fetchSql = select('seq', BY_SEQ_STORE$1, null,
          'doc_id=? AND rev=?');
        tx.executeSql(fetchSql, [id, rev], function (tx, res) {
          var seq = res.rows.item(0).seq;
          var sql = 'UPDATE ' + BY_SEQ_STORE$1 +
            ' SET json=?, deleted=? WHERE doc_id=? AND rev=?;';
          var sqlArgs = [json, deletedInt, id, rev];
          tx.executeSql(sql, sqlArgs, function (tx) {
            insertAttachmentMappings(seq, function () {
              dataWritten(tx, seq);
            });
          });
        });
        return false; // ack that we've handled the error
      });
    }

    function collectResults(attachmentErr) {
      if (!err) {
        if (attachmentErr) {
          err = attachmentErr;
          callback(err);
        } else if (recv === attachments.length) {
          finish();
        }
      }
    }

    var err = null;
    var recv = 0;

    docInfo.data._id = docInfo.metadata.id;
    docInfo.data._rev = docInfo.metadata.rev;
    var attachments = Object.keys(docInfo.data._attachments || {});


    if (newRevIsDeleted) {
      docInfo.data._deleted = true;
    }

    function attachmentSaved(err) {
      recv++;
      collectResults(err);
    }

    attachments.forEach(function (key) {
      var att = docInfo.data._attachments[key];
      if (!att.stub) {
        var data = att.data;
        delete att.data;
        att.revpos = parseInt(winningRev, 10);
        var digest = att.digest;
        saveAttachment(digest, data, attachmentSaved);
      } else {
        recv++;
        collectResults();
      }
    });

    if (!attachments.length) {
      finish();
    }

    function dataWritten(tx, seq) {
      var id = docInfo.metadata.id;

      var revsToCompact = docInfo.stemmedRevs || [];
      if (isUpdate && api.auto_compaction) {
        revsToCompact = compactTree(docInfo.metadata).concat(revsToCompact);
      }
      if (revsToCompact.length) {
        compactRevs$1(revsToCompact, id, tx);
      }

      docInfo.metadata.seq = seq;
      var rev = docInfo.metadata.rev;
      delete docInfo.metadata.rev;

      var sql = isUpdate ?
      'UPDATE ' + DOC_STORE$1 +
      ' SET json=?, max_seq=?, winningseq=' +
      '(SELECT seq FROM ' + BY_SEQ_STORE$1 +
      ' WHERE doc_id=' + DOC_STORE$1 + '.id AND rev=?) WHERE id=?'
        : 'INSERT INTO ' + DOC_STORE$1 +
      ' (id, winningseq, max_seq, json) VALUES (?,?,?,?);';
      var metadataStr = safeJsonStringify(docInfo.metadata);
      var params = isUpdate ?
        [metadataStr, seq, winningRev, id] :
        [id, seq, seq, metadataStr];
      tx.executeSql(sql, params, function () {
        results[resultsIdx] = {
          ok: true,
          id: docInfo.metadata.id,
          rev: rev
        };
        fetchedDocs.set(id, docInfo.metadata);
        callback();
      });
    }
  }

  function websqlProcessDocs() {
    processDocs(dbOpts.revs_limit, docInfos, api, fetchedDocs, tx,
                results, writeDoc, opts);
  }

  function fetchExistingDocs(callback) {
    if (!docInfos.length) {
      return callback();
    }

    var numFetched = 0;

    function checkDone() {
      if (++numFetched === docInfos.length) {
        callback();
      }
    }

    docInfos.forEach(function (docInfo) {
      if (docInfo._id && isLocalId(docInfo._id)) {
        return checkDone(); // skip local docs
      }
      var id = docInfo.metadata.id;
      tx.executeSql('SELECT json FROM ' + DOC_STORE$1 +
      ' WHERE id = ?', [id], function (tx, result) {
        if (result.rows.length) {
          var metadata = safeJsonParse(result.rows.item(0).json);
          fetchedDocs.set(id, metadata);
        }
        checkDone();
      });
    });
  }

  function saveAttachment(digest, data, callback) {
    var sql = 'SELECT digest FROM ' + ATTACH_STORE$1 + ' WHERE digest=?';
    tx.executeSql(sql, [digest], function (tx, result) {
      if (result.rows.length) { // attachment already exists
        return callback();
      }
      // we could just insert before selecting and catch the error,
      // but my hunch is that it's cheaper not to serialize the blob
      // from JS to C if we don't have to (TODO: confirm this)
      sql = 'INSERT INTO ' + ATTACH_STORE$1 +
      ' (digest, body, escaped) VALUES (?,?,1)';
      tx.executeSql(sql, [digest, escapeBlob(data)], function () {
        callback();
      }, function () {
        // ignore constaint errors, means it already exists
        callback();
        return false; // ack we handled the error
      });
    });
  }

  preprocessAttachments(docInfos, 'binary', function (err) {
    if (err) {
      return callback(err);
    }
    db.transaction(function (txn) {
      tx = txn;
      verifyAttachments(function (err) {
        if (err) {
          preconditionErrored = err;
        } else {
          fetchExistingDocs(websqlProcessDocs);
        }
      });
    }, websqlError(callback), complete);
  });
}

var cachedDatabases = new _Map();

// openDatabase passed in through opts (e.g. for node-websql)
function openDatabaseWithOpts(opts) {
  return opts.websql(opts.name, opts.version, opts.description, opts.size);
}

function openDBSafely(opts) {
  try {
    return {
      db: openDatabaseWithOpts(opts)
    };
  } catch (err) {
    return {
      error: err
    };
  }
}

function openDB$1(opts) {
  var cachedResult = cachedDatabases.get(opts.name);
  if (!cachedResult) {
    cachedResult = openDBSafely(opts);
    cachedDatabases.set(opts.name, cachedResult);
  }
  return cachedResult;
}

var websqlChanges = new Changes();

function fetchAttachmentsIfNecessary$1(doc, opts, api, txn, cb) {
  var attachments = Object.keys(doc._attachments || {});
  if (!attachments.length) {
    return cb && cb();
  }
  var numDone = 0;

  function checkDone() {
    if (++numDone === attachments.length && cb) {
      cb();
    }
  }

  function fetchAttachment(doc, att) {
    var attObj = doc._attachments[att];
    var attOpts = {binary: opts.binary, ctx: txn};
    api._getAttachment(doc._id, att, attObj, attOpts, function (_, data) {
      doc._attachments[att] = extend$1(
        pick(attObj, ['digest', 'content_type']),
        { data: data }
      );
      checkDone();
    });
  }

  attachments.forEach(function (att) {
    if (opts.attachments && opts.include_docs) {
      fetchAttachment(doc, att);
    } else {
      doc._attachments[att].stub = true;
      checkDone();
    }
  });
}

var POUCH_VERSION = 1;

// these indexes cover the ground for most allDocs queries
var BY_SEQ_STORE_DELETED_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'by-seq-deleted-idx\' ON ' +
  BY_SEQ_STORE$1 + ' (seq, deleted)';
var BY_SEQ_STORE_DOC_ID_REV_INDEX_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS \'by-seq-doc-id-rev\' ON ' +
    BY_SEQ_STORE$1 + ' (doc_id, rev)';
var DOC_STORE_WINNINGSEQ_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'doc-winningseq-idx\' ON ' +
  DOC_STORE$1 + ' (winningseq)';
var ATTACH_AND_SEQ_STORE_SEQ_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS \'attach-seq-seq-idx\' ON ' +
    ATTACH_AND_SEQ_STORE$1 + ' (seq)';
var ATTACH_AND_SEQ_STORE_ATTACH_INDEX_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS \'attach-seq-digest-idx\' ON ' +
    ATTACH_AND_SEQ_STORE$1 + ' (digest, seq)';

var DOC_STORE_AND_BY_SEQ_JOINER = BY_SEQ_STORE$1 +
  '.seq = ' + DOC_STORE$1 + '.winningseq';

var SELECT_DOCS = BY_SEQ_STORE$1 + '.seq AS seq, ' +
  BY_SEQ_STORE$1 + '.deleted AS deleted, ' +
  BY_SEQ_STORE$1 + '.json AS data, ' +
  BY_SEQ_STORE$1 + '.rev AS rev, ' +
  DOC_STORE$1 + '.json AS metadata';

function WebSqlPouch$1(opts, callback) {
  var api = this;
  var instanceId = null;
  var size = getSize(opts);
  var idRequests = [];
  var encoding;

  api._docCount = -1; // cache sqlite count(*) for performance
  api._name = opts.name;

  // extend the options here, because sqlite plugin has a ton of options
  // and they are constantly changing, so it's more prudent to allow anything
  var websqlOpts = extend$1({}, opts, {
    version: POUCH_VERSION,
    description: opts.name,
    size: size
  });
  var openDBResult = openDB$1(websqlOpts);
  if (openDBResult.error) {
    return websqlError(callback)(openDBResult.error);
  }
  var db = openDBResult.db;
  if (typeof db.readTransaction !== 'function') {
    // doesn't exist in sqlite plugin
    db.readTransaction = db.transaction;
  }

  function dbCreated() {
    // note the db name in case the browser upgrades to idb
    if (hasLocalStorage()) {
      window.localStorage['_pouch__websqldb_' + api._name] = true;
    }
    callback(null, api);
  }

  // In this migration, we added the 'deleted' and 'local' columns to the
  // by-seq and doc store tables.
  // To preserve existing user data, we re-process all the existing JSON
  // and add these values.
  // Called migration2 because it corresponds to adapter version (db_version) #2
  function runMigration2(tx, callback) {
    // index used for the join in the allDocs query
    tx.executeSql(DOC_STORE_WINNINGSEQ_INDEX_SQL);

    tx.executeSql('ALTER TABLE ' + BY_SEQ_STORE$1 +
      ' ADD COLUMN deleted TINYINT(1) DEFAULT 0', [], function () {
      tx.executeSql(BY_SEQ_STORE_DELETED_INDEX_SQL);
      tx.executeSql('ALTER TABLE ' + DOC_STORE$1 +
        ' ADD COLUMN local TINYINT(1) DEFAULT 0', [], function () {
        tx.executeSql('CREATE INDEX IF NOT EXISTS \'doc-store-local-idx\' ON ' +
          DOC_STORE$1 + ' (local, id)');

        var sql = 'SELECT ' + DOC_STORE$1 + '.winningseq AS seq, ' + DOC_STORE$1 +
          '.json AS metadata FROM ' + BY_SEQ_STORE$1 + ' JOIN ' + DOC_STORE$1 +
          ' ON ' + BY_SEQ_STORE$1 + '.seq = ' + DOC_STORE$1 + '.winningseq';

        tx.executeSql(sql, [], function (tx, result) {

          var deleted = [];
          var local = [];

          for (var i = 0; i < result.rows.length; i++) {
            var item = result.rows.item(i);
            var seq = item.seq;
            var metadata = JSON.parse(item.metadata);
            if (isDeleted(metadata)) {
              deleted.push(seq);
            }
            if (isLocalId(metadata.id)) {
              local.push(metadata.id);
            }
          }
          tx.executeSql('UPDATE ' + DOC_STORE$1 + 'SET local = 1 WHERE id IN ' +
            qMarks(local.length), local, function () {
            tx.executeSql('UPDATE ' + BY_SEQ_STORE$1 +
              ' SET deleted = 1 WHERE seq IN ' +
              qMarks(deleted.length), deleted, callback);
          });
        });
      });
    });
  }

  // in this migration, we make all the local docs unversioned
  function runMigration3(tx, callback) {
    var local = 'CREATE TABLE IF NOT EXISTS ' + LOCAL_STORE$1 +
      ' (id UNIQUE, rev, json)';
    tx.executeSql(local, [], function () {
      var sql = 'SELECT ' + DOC_STORE$1 + '.id AS id, ' +
        BY_SEQ_STORE$1 + '.json AS data ' +
        'FROM ' + BY_SEQ_STORE$1 + ' JOIN ' +
        DOC_STORE$1 + ' ON ' + BY_SEQ_STORE$1 + '.seq = ' +
        DOC_STORE$1 + '.winningseq WHERE local = 1';
      tx.executeSql(sql, [], function (tx, res) {
        var rows = [];
        for (var i = 0; i < res.rows.length; i++) {
          rows.push(res.rows.item(i));
        }
        function doNext() {
          if (!rows.length) {
            return callback(tx);
          }
          var row = rows.shift();
          var rev = JSON.parse(row.data)._rev;
          tx.executeSql('INSERT INTO ' + LOCAL_STORE$1 +
              ' (id, rev, json) VALUES (?,?,?)',
              [row.id, rev, row.data], function (tx) {
            tx.executeSql('DELETE FROM ' + DOC_STORE$1 + ' WHERE id=?',
                [row.id], function (tx) {
              tx.executeSql('DELETE FROM ' + BY_SEQ_STORE$1 + ' WHERE seq=?',
                  [row.seq], function () {
                doNext();
              });
            });
          });
        }
        doNext();
      });
    });
  }

  // in this migration, we remove doc_id_rev and just use rev
  function runMigration4(tx, callback) {

    function updateRows(rows) {
      function doNext() {
        if (!rows.length) {
          return callback(tx);
        }
        var row = rows.shift();
        var doc_id_rev = parseHexString(row.hex, encoding);
        var idx = doc_id_rev.lastIndexOf('::');
        var doc_id = doc_id_rev.substring(0, idx);
        var rev = doc_id_rev.substring(idx + 2);
        var sql = 'UPDATE ' + BY_SEQ_STORE$1 +
          ' SET doc_id=?, rev=? WHERE doc_id_rev=?';
        tx.executeSql(sql, [doc_id, rev, doc_id_rev], function () {
          doNext();
        });
      }
      doNext();
    }

    var sql = 'ALTER TABLE ' + BY_SEQ_STORE$1 + ' ADD COLUMN doc_id';
    tx.executeSql(sql, [], function (tx) {
      var sql = 'ALTER TABLE ' + BY_SEQ_STORE$1 + ' ADD COLUMN rev';
      tx.executeSql(sql, [], function (tx) {
        tx.executeSql(BY_SEQ_STORE_DOC_ID_REV_INDEX_SQL, [], function (tx) {
          var sql = 'SELECT hex(doc_id_rev) as hex FROM ' + BY_SEQ_STORE$1;
          tx.executeSql(sql, [], function (tx, res) {
            var rows = [];
            for (var i = 0; i < res.rows.length; i++) {
              rows.push(res.rows.item(i));
            }
            updateRows(rows);
          });
        });
      });
    });
  }

  // in this migration, we add the attach_and_seq table
  // for issue #2818
  function runMigration5(tx, callback) {

    function migrateAttsAndSeqs(tx) {
      // need to actually populate the table. this is the expensive part,
      // so as an optimization, check first that this database even
      // contains attachments
      var sql = 'SELECT COUNT(*) AS cnt FROM ' + ATTACH_STORE$1;
      tx.executeSql(sql, [], function (tx, res) {
        var count = res.rows.item(0).cnt;
        if (!count) {
          return callback(tx);
        }

        var offset = 0;
        var pageSize = 10;
        function nextPage() {
          var sql = select(
            SELECT_DOCS + ', ' + DOC_STORE$1 + '.id AS id',
            [DOC_STORE$1, BY_SEQ_STORE$1],
            DOC_STORE_AND_BY_SEQ_JOINER,
            null,
            DOC_STORE$1 + '.id '
          );
          sql += ' LIMIT ' + pageSize + ' OFFSET ' + offset;
          offset += pageSize;
          tx.executeSql(sql, [], function (tx, res) {
            if (!res.rows.length) {
              return callback(tx);
            }
            var digestSeqs = {};
            function addDigestSeq(digest, seq) {
              // uniq digest/seq pairs, just in case there are dups
              var seqs = digestSeqs[digest] = (digestSeqs[digest] || []);
              if (seqs.indexOf(seq) === -1) {
                seqs.push(seq);
              }
            }
            for (var i = 0; i < res.rows.length; i++) {
              var row = res.rows.item(i);
              var doc = unstringifyDoc(row.data, row.id, row.rev);
              var atts = Object.keys(doc._attachments || {});
              for (var j = 0; j < atts.length; j++) {
                var att = doc._attachments[atts[j]];
                addDigestSeq(att.digest, row.seq);
              }
            }
            var digestSeqPairs = [];
            Object.keys(digestSeqs).forEach(function (digest) {
              var seqs = digestSeqs[digest];
              seqs.forEach(function (seq) {
                digestSeqPairs.push([digest, seq]);
              });
            });
            if (!digestSeqPairs.length) {
              return nextPage();
            }
            var numDone = 0;
            digestSeqPairs.forEach(function (pair) {
              var sql = 'INSERT INTO ' + ATTACH_AND_SEQ_STORE$1 +
                ' (digest, seq) VALUES (?,?)';
              tx.executeSql(sql, pair, function () {
                if (++numDone === digestSeqPairs.length) {
                  nextPage();
                }
              });
            });
          });
        }
        nextPage();
      });
    }

    var attachAndRev = 'CREATE TABLE IF NOT EXISTS ' +
      ATTACH_AND_SEQ_STORE$1 + ' (digest, seq INTEGER)';
    tx.executeSql(attachAndRev, [], function (tx) {
      tx.executeSql(
        ATTACH_AND_SEQ_STORE_ATTACH_INDEX_SQL, [], function (tx) {
          tx.executeSql(
            ATTACH_AND_SEQ_STORE_SEQ_INDEX_SQL, [],
            migrateAttsAndSeqs);
        });
    });
  }

  // in this migration, we use escapeBlob() and unescapeBlob()
  // instead of reading out the binary as HEX, which is slow
  function runMigration6(tx, callback) {
    var sql = 'ALTER TABLE ' + ATTACH_STORE$1 +
      ' ADD COLUMN escaped TINYINT(1) DEFAULT 0';
    tx.executeSql(sql, [], callback);
  }

  // issue #3136, in this migration we need a "latest seq" as well
  // as the "winning seq" in the doc store
  function runMigration7(tx, callback) {
    var sql = 'ALTER TABLE ' + DOC_STORE$1 +
      ' ADD COLUMN max_seq INTEGER';
    tx.executeSql(sql, [], function (tx) {
      var sql = 'UPDATE ' + DOC_STORE$1 + ' SET max_seq=(SELECT MAX(seq) FROM ' +
        BY_SEQ_STORE$1 + ' WHERE doc_id=id)';
      tx.executeSql(sql, [], function (tx) {
        // add unique index after filling, else we'll get a constraint
        // error when we do the ALTER TABLE
        var sql =
          'CREATE UNIQUE INDEX IF NOT EXISTS \'doc-max-seq-idx\' ON ' +
          DOC_STORE$1 + ' (max_seq)';
        tx.executeSql(sql, [], callback);
      });
    });
  }

  function checkEncoding(tx, cb) {
    // UTF-8 on chrome/android, UTF-16 on safari < 7.1
    tx.executeSql('SELECT HEX("a") AS hex', [], function (tx, res) {
        var hex = res.rows.item(0).hex;
        encoding = hex.length === 2 ? 'UTF-8' : 'UTF-16';
        cb();
      }
    );
  }

  function onGetInstanceId() {
    while (idRequests.length > 0) {
      var idCallback = idRequests.pop();
      idCallback(null, instanceId);
    }
  }

  function onGetVersion(tx, dbVersion) {
    if (dbVersion === 0) {
      // initial schema

      var meta = 'CREATE TABLE IF NOT EXISTS ' + META_STORE$1 +
        ' (dbid, db_version INTEGER)';
      var attach = 'CREATE TABLE IF NOT EXISTS ' + ATTACH_STORE$1 +
        ' (digest UNIQUE, escaped TINYINT(1), body BLOB)';
      var attachAndRev = 'CREATE TABLE IF NOT EXISTS ' +
        ATTACH_AND_SEQ_STORE$1 + ' (digest, seq INTEGER)';
      // TODO: migrate winningseq to INTEGER
      var doc = 'CREATE TABLE IF NOT EXISTS ' + DOC_STORE$1 +
        ' (id unique, json, winningseq, max_seq INTEGER UNIQUE)';
      var seq = 'CREATE TABLE IF NOT EXISTS ' + BY_SEQ_STORE$1 +
        ' (seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
        'json, deleted TINYINT(1), doc_id, rev)';
      var local = 'CREATE TABLE IF NOT EXISTS ' + LOCAL_STORE$1 +
        ' (id UNIQUE, rev, json)';

      // creates
      tx.executeSql(attach);
      tx.executeSql(local);
      tx.executeSql(attachAndRev, [], function () {
        tx.executeSql(ATTACH_AND_SEQ_STORE_SEQ_INDEX_SQL);
        tx.executeSql(ATTACH_AND_SEQ_STORE_ATTACH_INDEX_SQL);
      });
      tx.executeSql(doc, [], function () {
        tx.executeSql(DOC_STORE_WINNINGSEQ_INDEX_SQL);
        tx.executeSql(seq, [], function () {
          tx.executeSql(BY_SEQ_STORE_DELETED_INDEX_SQL);
          tx.executeSql(BY_SEQ_STORE_DOC_ID_REV_INDEX_SQL);
          tx.executeSql(meta, [], function () {
            // mark the db version, and new dbid
            var initSeq = 'INSERT INTO ' + META_STORE$1 +
              ' (db_version, dbid) VALUES (?,?)';
            instanceId = uuid();
            var initSeqArgs = [ADAPTER_VERSION$1, instanceId];
            tx.executeSql(initSeq, initSeqArgs, function () {
              onGetInstanceId();
            });
          });
        });
      });
    } else { // version > 0

      var setupDone = function () {
        var migrated = dbVersion < ADAPTER_VERSION$1;
        if (migrated) {
          // update the db version within this transaction
          tx.executeSql('UPDATE ' + META_STORE$1 + ' SET db_version = ' +
            ADAPTER_VERSION$1);
        }
        // notify db.id() callers
        var sql = 'SELECT dbid FROM ' + META_STORE$1;
        tx.executeSql(sql, [], function (tx, result) {
          instanceId = result.rows.item(0).dbid;
          onGetInstanceId();
        });
      };

      // would love to use promises here, but then websql
      // ends the transaction early
      var tasks = [
        runMigration2,
        runMigration3,
        runMigration4,
        runMigration5,
        runMigration6,
        runMigration7,
        setupDone
      ];

      // run each migration sequentially
      var i = dbVersion;
      var nextMigration = function (tx) {
        tasks[i - 1](tx, nextMigration);
        i++;
      };
      nextMigration(tx);
    }
  }

  function setup() {
    db.transaction(function (tx) {
      // first check the encoding
      checkEncoding(tx, function () {
        // then get the version
        fetchVersion(tx);
      });
    }, websqlError(callback), dbCreated);
  }

  function fetchVersion(tx) {
    var sql = 'SELECT sql FROM sqlite_master WHERE tbl_name = ' + META_STORE$1;
    tx.executeSql(sql, [], function (tx, result) {
      if (!result.rows.length) {
        // database hasn't even been created yet (version 0)
        onGetVersion(tx, 0);
      } else if (!/db_version/.test(result.rows.item(0).sql)) {
        // table was created, but without the new db_version column,
        // so add it.
        tx.executeSql('ALTER TABLE ' + META_STORE$1 +
          ' ADD COLUMN db_version INTEGER', [], function () {
          // before version 2, this column didn't even exist
          onGetVersion(tx, 1);
        });
      } else { // column exists, we can safely get it
        tx.executeSql('SELECT db_version FROM ' + META_STORE$1,
          [], function (tx, result) {
          var dbVersion = result.rows.item(0).db_version;
          onGetVersion(tx, dbVersion);
        });
      }
    });
  }

  setup();

  api.type = function () {
    return 'websql';
  };

  api._id = toPromise(function (callback) {
    callback(null, instanceId);
  });

  api._info = function (callback) {
    db.readTransaction(function (tx) {
      countDocs(tx, function (docCount) {
        var sql = 'SELECT MAX(seq) AS seq FROM ' + BY_SEQ_STORE$1;
        tx.executeSql(sql, [], function (tx, res) {
          var updateSeq = res.rows.item(0).seq || 0;
          callback(null, {
            doc_count: docCount,
            update_seq: updateSeq,
            websql_encoding: encoding
          });
        });
      });
    }, websqlError(callback));
  };

  api._bulkDocs = function (req, reqOpts, callback) {
    websqlBulkDocs(opts, req, reqOpts, api, db, websqlChanges, callback);
  };

  api._get = function (id, opts, callback) {
    var doc;
    var metadata;
    var err;
    var tx = opts.ctx;
    if (!tx) {
      return db.readTransaction(function (txn) {
        api._get(id, extend$1({ctx: txn}, opts), callback);
      });
    }

    function finish() {
      callback(err, {doc: doc, metadata: metadata, ctx: tx});
    }

    var sql;
    var sqlArgs;
    if (opts.rev) {
      sql = select(
        SELECT_DOCS,
        [DOC_STORE$1, BY_SEQ_STORE$1],
        DOC_STORE$1 + '.id=' + BY_SEQ_STORE$1 + '.doc_id',
        [BY_SEQ_STORE$1 + '.doc_id=?', BY_SEQ_STORE$1 + '.rev=?']);
      sqlArgs = [id, opts.rev];
    } else {
      sql = select(
        SELECT_DOCS,
        [DOC_STORE$1, BY_SEQ_STORE$1],
        DOC_STORE_AND_BY_SEQ_JOINER,
        DOC_STORE$1 + '.id=?');
      sqlArgs = [id];
    }
    tx.executeSql(sql, sqlArgs, function (a, results) {
      if (!results.rows.length) {
        err = createError(MISSING_DOC, 'missing');
        return finish();
      }
      var item = results.rows.item(0);
      metadata = safeJsonParse(item.metadata);
      if (item.deleted && !opts.rev) {
        err = createError(MISSING_DOC, 'deleted');
        return finish();
      }
      doc = unstringifyDoc(item.data, metadata.id, item.rev);
      finish();
    });
  };

  function countDocs(tx, callback) {

    if (api._docCount !== -1) {
      return callback(api._docCount);
    }

    // count the total rows
    var sql = select(
      'COUNT(' + DOC_STORE$1 + '.id) AS \'num\'',
      [DOC_STORE$1, BY_SEQ_STORE$1],
      DOC_STORE_AND_BY_SEQ_JOINER,
      BY_SEQ_STORE$1 + '.deleted=0');

    tx.executeSql(sql, [], function (tx, result) {
      api._docCount = result.rows.item(0).num;
      callback(api._docCount);
    });
  }

  api._allDocs = function (opts, callback) {
    var results = [];
    var totalRows;

    var start = 'startkey' in opts ? opts.startkey : false;
    var end = 'endkey' in opts ? opts.endkey : false;
    var key = 'key' in opts ? opts.key : false;
    var descending = 'descending' in opts ? opts.descending : false;
    var limit = 'limit' in opts ? opts.limit : -1;
    var offset = 'skip' in opts ? opts.skip : 0;
    var inclusiveEnd = opts.inclusive_end !== false;

    var sqlArgs = [];
    var criteria = [];

    if (key !== false) {
      criteria.push(DOC_STORE$1 + '.id = ?');
      sqlArgs.push(key);
    } else if (start !== false || end !== false) {
      if (start !== false) {
        criteria.push(DOC_STORE$1 + '.id ' + (descending ? '<=' : '>=') + ' ?');
        sqlArgs.push(start);
      }
      if (end !== false) {
        var comparator = descending ? '>' : '<';
        if (inclusiveEnd) {
          comparator += '=';
        }
        criteria.push(DOC_STORE$1 + '.id ' + comparator + ' ?');
        sqlArgs.push(end);
      }
      if (key !== false) {
        criteria.push(DOC_STORE$1 + '.id = ?');
        sqlArgs.push(key);
      }
    }

    if (opts.deleted !== 'ok') {
      // report deleted if keys are specified
      criteria.push(BY_SEQ_STORE$1 + '.deleted = 0');
    }

    db.readTransaction(function (tx) {

      // first count up the total rows
      countDocs(tx, function (count) {
        totalRows = count;

        if (limit === 0) {
          return;
        }

        // then actually fetch the documents
        var sql = select(
          SELECT_DOCS,
          [DOC_STORE$1, BY_SEQ_STORE$1],
          DOC_STORE_AND_BY_SEQ_JOINER,
          criteria,
          DOC_STORE$1 + '.id ' + (descending ? 'DESC' : 'ASC')
          );
        sql += ' LIMIT ' + limit + ' OFFSET ' + offset;

        tx.executeSql(sql, sqlArgs, function (tx, result) {
          for (var i = 0, l = result.rows.length; i < l; i++) {
            var item = result.rows.item(i);
            var metadata = safeJsonParse(item.metadata);
            var id = metadata.id;
            var data = unstringifyDoc(item.data, id, item.rev);
            var winningRev = data._rev;
            var doc = {
              id: id,
              key: id,
              value: {rev: winningRev}
            };
            if (opts.include_docs) {
              doc.doc = data;
              doc.doc._rev = winningRev;
              if (opts.conflicts) {
                var conflicts = collectConflicts(metadata);
                if (conflicts.length) {
                  doc.doc._conflicts = conflicts;
                }
              }
              fetchAttachmentsIfNecessary$1(doc.doc, opts, api, tx);
            }
            if (item.deleted) {
              if (opts.deleted === 'ok') {
                doc.value.deleted = true;
                doc.doc = null;
              } else {
                continue;
              }
            }
            results.push(doc);
          }
        });
      });
    }, websqlError(callback), function () {
      callback(null, {
        total_rows: totalRows,
        offset: opts.skip,
        rows: results
      });
    });
  };

  api._changes = function (opts) {
    opts = clone(opts);

    if (opts.continuous) {
      var id = api._name + ':' + uuid();
      websqlChanges.addListener(api._name, id, api, opts);
      websqlChanges.notify(api._name);
      return {
        cancel: function () {
          websqlChanges.removeListener(api._name, id);
        }
      };
    }

    var descending = opts.descending;

    // Ignore the `since` parameter when `descending` is true
    opts.since = opts.since && !descending ? opts.since : 0;

    var limit = 'limit' in opts ? opts.limit : -1;
    if (limit === 0) {
      limit = 1; // per CouchDB _changes spec
    }

    var returnDocs;
    if ('return_docs' in opts) {
      returnDocs = opts.return_docs;
    } else if ('returnDocs' in opts) {
      // TODO: Remove 'returnDocs' in favor of 'return_docs' in a future release
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }
    var results = [];
    var numResults = 0;

    function fetchChanges() {

      var selectStmt =
        DOC_STORE$1 + '.json AS metadata, ' +
        DOC_STORE$1 + '.max_seq AS maxSeq, ' +
        BY_SEQ_STORE$1 + '.json AS winningDoc, ' +
        BY_SEQ_STORE$1 + '.rev AS winningRev ';

      var from = DOC_STORE$1 + ' JOIN ' + BY_SEQ_STORE$1;

      var joiner = DOC_STORE$1 + '.id=' + BY_SEQ_STORE$1 + '.doc_id' +
        ' AND ' + DOC_STORE$1 + '.winningseq=' + BY_SEQ_STORE$1 + '.seq';

      var criteria = ['maxSeq > ?'];
      var sqlArgs = [opts.since];

      if (opts.doc_ids) {
        criteria.push(DOC_STORE$1 + '.id IN ' + qMarks(opts.doc_ids.length));
        sqlArgs = sqlArgs.concat(opts.doc_ids);
      }

      var orderBy = 'maxSeq ' + (descending ? 'DESC' : 'ASC');

      var sql = select(selectStmt, from, joiner, criteria, orderBy);

      var filter = filterChange(opts);
      if (!opts.view && !opts.filter) {
        // we can just limit in the query
        sql += ' LIMIT ' + limit;
      }

      var lastSeq = opts.since || 0;
      db.readTransaction(function (tx) {
        tx.executeSql(sql, sqlArgs, function (tx, result) {
          function reportChange(change) {
            return function () {
              opts.onChange(change);
            };
          }
          for (var i = 0, l = result.rows.length; i < l; i++) {
            var item = result.rows.item(i);
            var metadata = safeJsonParse(item.metadata);
            lastSeq = item.maxSeq;

            var doc = unstringifyDoc(item.winningDoc, metadata.id,
              item.winningRev);
            var change = opts.processChange(doc, metadata, opts);
            change.seq = item.maxSeq;

            var filtered = filter(change);
            if (typeof filtered === 'object') {
              return opts.complete(filtered);
            }

            if (filtered) {
              numResults++;
              if (returnDocs) {
                results.push(change);
              }
              // process the attachment immediately
              // for the benefit of live listeners
              if (opts.attachments && opts.include_docs) {
                fetchAttachmentsIfNecessary$1(doc, opts, api, tx,
                  reportChange(change));
              } else {
                reportChange(change)();
              }
            }
            if (numResults === limit) {
              break;
            }
          }
        });
      }, websqlError(opts.complete), function () {
        if (!opts.continuous) {
          opts.complete(null, {
            results: results,
            last_seq: lastSeq
          });
        }
      });
    }

    fetchChanges();
  };

  api._close = function (callback) {
    //WebSQL databases do not need to be closed
    callback();
  };

  api._getAttachment = function (docId, attachId, attachment, opts, callback) {
    var res;
    var tx = opts.ctx;
    var digest = attachment.digest;
    var type = attachment.content_type;
    var sql = 'SELECT escaped, ' +
      'CASE WHEN escaped = 1 THEN body ELSE HEX(body) END AS body FROM ' +
      ATTACH_STORE$1 + ' WHERE digest=?';
    tx.executeSql(sql, [digest], function (tx, result) {
      // websql has a bug where \u0000 causes early truncation in strings
      // and blobs. to work around this, we used to use the hex() function,
      // but that's not performant. after migration 6, we remove \u0000
      // and add it back in afterwards
      var item = result.rows.item(0);
      var data = item.escaped ? unescapeBlob(item.body) :
        parseHexString(item.body, encoding);
      if (opts.binary) {
        res = binStringToBluffer(data, type);
      } else {
        res = btoa$1(data);
      }
      callback(null, res);
    });
  };

  api._getRevisionTree = function (docId, callback) {
    db.readTransaction(function (tx) {
      var sql = 'SELECT json AS metadata FROM ' + DOC_STORE$1 + ' WHERE id = ?';
      tx.executeSql(sql, [docId], function (tx, result) {
        if (!result.rows.length) {
          callback(createError(MISSING_DOC));
        } else {
          var data = safeJsonParse(result.rows.item(0).metadata);
          callback(null, data.rev_tree);
        }
      });
    });
  };

  api._doCompaction = function (docId, revs, callback) {
    if (!revs.length) {
      return callback();
    }
    db.transaction(function (tx) {

      // update doc store
      var sql = 'SELECT json AS metadata FROM ' + DOC_STORE$1 + ' WHERE id = ?';
      tx.executeSql(sql, [docId], function (tx, result) {
        var metadata = safeJsonParse(result.rows.item(0).metadata);
        traverseRevTree(metadata.rev_tree, function (isLeaf, pos,
                                                           revHash, ctx, opts) {
          var rev = pos + '-' + revHash;
          if (revs.indexOf(rev) !== -1) {
            opts.status = 'missing';
          }
        });

        var sql = 'UPDATE ' + DOC_STORE$1 + ' SET json = ? WHERE id = ?';
        tx.executeSql(sql, [safeJsonStringify(metadata), docId]);
      });

      compactRevs$1(revs, docId, tx);
    }, websqlError(callback), function () {
      callback();
    });
  };

  api._getLocal = function (id, callback) {
    db.readTransaction(function (tx) {
      var sql = 'SELECT json, rev FROM ' + LOCAL_STORE$1 + ' WHERE id=?';
      tx.executeSql(sql, [id], function (tx, res) {
        if (res.rows.length) {
          var item = res.rows.item(0);
          var doc = unstringifyDoc(item.json, id, item.rev);
          callback(null, doc);
        } else {
          callback(createError(MISSING_DOC));
        }
      });
    });
  };

  api._putLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    delete doc._revisions; // ignore this, trust the rev
    var oldRev = doc._rev;
    var id = doc._id;
    var newRev;
    if (!oldRev) {
      newRev = doc._rev = '0-1';
    } else {
      newRev = doc._rev = '0-' + (parseInt(oldRev.split('-')[1], 10) + 1);
    }
    var json = stringifyDoc(doc);

    var ret;
    function putLocal(tx) {
      var sql;
      var values;
      if (oldRev) {
        sql = 'UPDATE ' + LOCAL_STORE$1 + ' SET rev=?, json=? ' +
          'WHERE id=? AND rev=?';
        values = [newRev, json, id, oldRev];
      } else {
        sql = 'INSERT INTO ' + LOCAL_STORE$1 + ' (id, rev, json) VALUES (?,?,?)';
        values = [id, newRev, json];
      }
      tx.executeSql(sql, values, function (tx, res) {
        if (res.rowsAffected) {
          ret = {ok: true, id: id, rev: newRev};
          if (opts.ctx) { // return immediately
            callback(null, ret);
          }
        } else {
          callback(createError(REV_CONFLICT));
        }
      }, function () {
        callback(createError(REV_CONFLICT));
        return false; // ack that we handled the error
      });
    }

    if (opts.ctx) {
      putLocal(opts.ctx);
    } else {
      db.transaction(putLocal, websqlError(callback), function () {
        if (ret) {
          callback(null, ret);
        }
      });
    }
  };

  api._removeLocal = function (doc, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var ret;

    function removeLocal(tx) {
      var sql = 'DELETE FROM ' + LOCAL_STORE$1 + ' WHERE id=? AND rev=?';
      var params = [doc._id, doc._rev];
      tx.executeSql(sql, params, function (tx, res) {
        if (!res.rowsAffected) {
          return callback(createError(MISSING_DOC));
        }
        ret = {ok: true, id: doc._id, rev: '0-0'};
        if (opts.ctx) { // return immediately
          callback(null, ret);
        }
      });
    }

    if (opts.ctx) {
      removeLocal(opts.ctx);
    } else {
      db.transaction(removeLocal, websqlError(callback), function () {
        if (ret) {
          callback(null, ret);
        }
      });
    }
  };

  api._destroy = function (opts, callback) {
    websqlChanges.removeAllListeners(api._name);
    db.transaction(function (tx) {
      var stores = [DOC_STORE$1, BY_SEQ_STORE$1, ATTACH_STORE$1, META_STORE$1,
        LOCAL_STORE$1, ATTACH_AND_SEQ_STORE$1];
      stores.forEach(function (store) {
        tx.executeSql('DROP TABLE IF EXISTS ' + store, []);
      });
    }, websqlError(callback), function () {
      if (hasLocalStorage()) {
        delete window.localStorage['_pouch__websqldb_' + api._name];
        delete window.localStorage[api._name];
      }
      callback(null, {'ok': true});
    });
  };
}

function canOpenTestDB() {
  try {
    openDatabase('_pouch_validate_websql', 1, '', 1);
    return true;
  } catch (err) {
    return false;
  }
}

// WKWebView had a bug where WebSQL would throw a DOM Exception 18
// (see https://bugs.webkit.org/show_bug.cgi?id=137760 and
// https://github.com/pouchdb/pouchdb/issues/5079)
// This has been fixed in latest WebKit, so we try to detect it here.
function isValidWebSQL() {
  // WKWebView UA:
  //   Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X)
  //   AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13C75
  // Chrome for iOS UA:
  //   Mozilla/5.0 (iPhone; U; CPU iPhone OS 5_1_1 like Mac OS X; en)
  //   AppleWebKit/534.46.0 (KHTML, like Gecko) CriOS/19.0.1084.60
  //   Mobile/9B206 Safari/7534.48.3
  // Firefox for iOS UA:
  //   Mozilla/5.0 (iPhone; CPU iPhone OS 8_3 like Mac OS X) AppleWebKit/600.1.4
  //   (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/600.1.4

  // indexedDB is null on some UIWebViews and undefined in others
  // see: https://bugs.webkit.org/show_bug.cgi?id=137034
  if (typeof indexedDB === 'undefined' || indexedDB === null ||
      !/iP(hone|od|ad)/.test(navigator.userAgent)) {
    // definitely not WKWebView, avoid creating an unnecessary database
    return true;
  }
  // Cache the result in LocalStorage. Reason we do this is because if we
  // call openDatabase() too many times, Safari craps out in SauceLabs and
  // starts throwing DOM Exception 14s.
  var hasLS = hasLocalStorage();
  // Include user agent in the hash, so that if Safari is upgraded, we don't
  // continually think it's broken.
  var localStorageKey = '_pouch__websqldb_valid_' + navigator.userAgent;
  if (hasLS && localStorage[localStorageKey]) {
    return localStorage[localStorageKey] === '1';
  }
  var openedTestDB = canOpenTestDB();
  if (hasLS) {
    localStorage[localStorageKey] = openedTestDB ? '1' : '0';
  }
  return openedTestDB;
}

function valid() {
  if (typeof openDatabase !== 'function') {
    return false;
  }
  return isValidWebSQL();
}

function openDB(name, version, description, size) {
  // Traditional WebSQL API
  return openDatabase(name, version, description, size);
}

function WebSQLPouch(opts, callback) {
  var _opts = extend$1({
    websql: openDB
  }, opts);

  WebSqlPouch$1.call(this, _opts, callback);
}

WebSQLPouch.valid = valid;

WebSQLPouch.use_prefix = true;

function WebSqlPouch (PouchDB) {
  PouchDB.adapter('websql', WebSQLPouch, true);
}

/* global fetch */
/* global Headers */
function wrappedFetch() {
  var wrappedPromise = {};

  var promise = new PouchPromise(function (resolve, reject) {
    wrappedPromise.resolve = resolve;
    wrappedPromise.reject = reject;
  });

  var args = new Array(arguments.length);

  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }

  wrappedPromise.promise = promise;

  PouchPromise.resolve().then(function () {
    return fetch.apply(null, args);
  }).then(function (response) {
    wrappedPromise.resolve(response);
  }).catch(function (error) {
    wrappedPromise.reject(error);
  });

  return wrappedPromise;
}

function fetchRequest(options, callback) {
  var wrappedPromise, timer, response;

  var headers = new Headers();

  var fetchOptions = {
    method: options.method,
    credentials: 'include',
    headers: headers
  };

  if (options.json) {
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', options.headers['Content-Type'] ||
      'application/json');
  }

  if (options.body && (options.body instanceof Blob)) {
    readAsArrayBuffer(options.body, function (arrayBuffer) {
      fetchOptions.body = arrayBuffer;
    });
  } else if (options.body &&
             options.processData &&
             typeof options.body !== 'string') {
    fetchOptions.body = JSON.stringify(options.body);
  } else if ('body' in options) {
    fetchOptions.body = options.body;
  } else {
    fetchOptions.body = null;
  }

  Object.keys(options.headers).forEach(function (key) {
    if (options.headers.hasOwnProperty(key)) {
      headers.set(key, options.headers[key]);
    }
  });

  wrappedPromise = wrappedFetch(options.url, fetchOptions);

  if (options.timeout > 0) {
    timer = setTimeout(function () {
      wrappedPromise.reject(new Error('Load timeout for resource: ' +
        options.url));
    }, options.timeout);
  }

  wrappedPromise.promise.then(function (fetchResponse) {
    response = {
      statusCode: fetchResponse.status
    };

    if (options.timeout > 0) {
      clearTimeout(timer);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return options.binary ? fetchResponse.blob() : fetchResponse.text();
    }

    return fetchResponse.json();
  }).then(function (result) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      callback(null, response, result);
    } else {
      callback(result, response);
    }
  }).catch(function (error) {
    callback(error, response);
  });

  return {abort: wrappedPromise.reject};
}

function xhRequest(options, callback) {

  var xhr, timer;
  var timedout = false;

  var abortReq = function () {
    xhr.abort();
    cleanUp();
  };

  var timeoutReq = function () {
    timedout = true;
    xhr.abort();
    cleanUp();
  };

  var ret = {abort: abortReq};

  var cleanUp = function () {
    clearTimeout(timer);
    ret.abort = function () {};
    if (xhr) {
      xhr.onprogress = undefined;
      if (xhr.upload) {
        xhr.upload.onprogress = undefined;
      }
      xhr.onreadystatechange = undefined;
      xhr = undefined;
    }
  };

  if (options.xhr) {
    xhr = new options.xhr();
  } else {
    xhr = new XMLHttpRequest();
  }

  try {
    xhr.open(options.method, options.url);
  } catch (exception) {
    return callback(new Error(exception.name || 'Url is invalid'));
  }

  xhr.withCredentials = ('withCredentials' in options) ?
    options.withCredentials : true;

  if (options.method === 'GET') {
    delete options.headers['Content-Type'];
  } else if (options.json) {
    options.headers.Accept = 'application/json';
    options.headers['Content-Type'] = options.headers['Content-Type'] ||
      'application/json';
    if (options.body &&
        options.processData &&
        typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
    }
  }

  if (options.binary) {
    xhr.responseType = 'arraybuffer';
  }

  if (!('body' in options)) {
    options.body = null;
  }

  for (var key in options.headers) {
    if (options.headers.hasOwnProperty(key)) {
      xhr.setRequestHeader(key, options.headers[key]);
    }
  }

  if (options.timeout > 0) {
    timer = setTimeout(timeoutReq, options.timeout);
    xhr.onprogress = function () {
      clearTimeout(timer);
      if(xhr.readyState !== 4) {
        timer = setTimeout(timeoutReq, options.timeout);
      }
    };
    if (typeof xhr.upload !== 'undefined') { // does not exist in ie9
      xhr.upload.onprogress = xhr.onprogress;
    }
  }

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) {
      return;
    }

    var response = {
      statusCode: xhr.status
    };

    if (xhr.status >= 200 && xhr.status < 300) {
      var data;
      if (options.binary) {
        data = createBlob([xhr.response || ''], {
          type: xhr.getResponseHeader('Content-Type')
        });
      } else {
        data = xhr.responseText;
      }
      callback(null, response, data);
    } else {
      var err = {};
      if (timedout) {
        err = new Error('ETIMEDOUT');
        err.code = 'ETIMEDOUT';
      } else if (typeof xhr.response === 'string') {
        try {
          err = JSON.parse(xhr.response);
        } catch(e) {}
      }
      err.status = xhr.status;
      callback(err);
    }
    cleanUp();
  };

  if (options.body && (options.body instanceof Blob)) {
    readAsArrayBuffer(options.body, function (arrayBuffer) {
      xhr.send(arrayBuffer);
    });
  } else {
    xhr.send(options.body);
  }

  return ret;
}

function testXhr() {
  return true;
}

var hasXhr = testXhr();

function ajax$1(options, callback) {
  if (hasXhr || options.xhr) {
    return xhRequest(options, callback);
  } else {
    return fetchRequest(options, callback);
  }
}

// the blob already has a type; do nothing
var res$2 = function () {};

function defaultBody() {
  return '';
}

function ajaxCore(options, callback) {

  options = clone(options);

  var defaultOptions = {
    method : "GET",
    headers: {},
    json: true,
    processData: true,
    timeout: 10000,
    cache: false
  };

  options = extend$1(defaultOptions, options);

  function onSuccess(obj, resp, cb) {
    if (!options.binary && options.json && typeof obj === 'string') {
      /* istanbul ignore next */
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        // Probably a malformed JSON from server
        return cb(e);
      }
    }
    if (Array.isArray(obj)) {
      obj = obj.map(function (v) {
        if (v.error || v.missing) {
          return generateErrorFromResponse(v);
        } else {
          return v;
        }
      });
    }
    if (options.binary) {
      res$2(obj, resp);
    }
    cb(null, obj, resp);
  }

  if (options.json) {
    if (!options.binary) {
      options.headers.Accept = 'application/json';
    }
    options.headers['Content-Type'] = options.headers['Content-Type'] ||
      'application/json';
  }

  if (options.binary) {
    options.encoding = null;
    options.json = false;
  }

  if (!options.processData) {
    options.json = false;
  }

  return ajax$1(options, function (err, response, body) {

    if (err) {
      return callback(generateErrorFromResponse(err));
    }

    var error;
    var content_type = response.headers && response.headers['content-type'];
    var data = body || defaultBody();

    // CouchDB doesn't always return the right content-type for JSON data, so
    // we check for ^{ and }$ (ignoring leading/trailing whitespace)
    if (!options.binary && (options.json || !options.processData) &&
        typeof data !== 'object' &&
        (/json/.test(content_type) ||
         (/^[\s]*\{/.test(data) && /\}[\s]*$/.test(data)))) {
      try {
        data = JSON.parse(data.toString());
      } catch (e) {}
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      onSuccess(data, response, callback);
    } else {
      error = generateErrorFromResponse(data);
      error.status = response.statusCode;
      callback(error);
    }
  });
}

function ajax(opts, callback) {

  // cache-buster, specifically designed to work around IE's aggressive caching
  // see http://www.dashbay.com/2011/05/internet-explorer-caches-ajax/
  // Also Safari caches POSTs, so we need to cache-bust those too.
  var ua = (navigator && navigator.userAgent) ?
    navigator.userAgent.toLowerCase() : '';

  var isSafari = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
  var isIE = ua.indexOf('msie') !== -1;
  var isEdge = ua.indexOf('edge') !== -1;

  // it appears the new version of safari also caches GETs,
  // see https://github.com/pouchdb/pouchdb/issues/5010
  var shouldCacheBust = (isSafari ||
    ((isIE || isEdge) && opts.method === 'GET'));

  var cache = 'cache' in opts ? opts.cache : true;

  var isBlobUrl = /^blob:/.test(opts.url); // don't append nonces for blob URLs

  if (!isBlobUrl && (shouldCacheBust || !cache)) {
    var hasArgs = opts.url.indexOf('?') !== -1;
    opts.url += (hasArgs ? '&' : '?') + '_nonce=' + Date.now();
  }

  return ajaxCore(opts, callback);
}

var CHANGES_BATCH_SIZE = 25;
var MAX_SIMULTANEOUS_REVS = 50;

var supportsBulkGetMap = {};

var log$1 = debug('pouchdb:http');

function readAttachmentsAsBlobOrBuffer(row) {
  var atts = row.doc && row.doc._attachments;
  if (!atts) {
    return;
  }
  Object.keys(atts).forEach(function (filename) {
    var att = atts[filename];
    att.data = b64ToBluffer(att.data, att.content_type);
  });
}

function encodeDocId(id) {
  if (/^_design/.test(id)) {
    return '_design/' + encodeURIComponent(id.slice(8));
  }
  if (/^_local/.test(id)) {
    return '_local/' + encodeURIComponent(id.slice(7));
  }
  return encodeURIComponent(id);
}

function preprocessAttachments$1(doc) {
  if (!doc._attachments || !Object.keys(doc._attachments)) {
    return PouchPromise.resolve();
  }

  return PouchPromise.all(Object.keys(doc._attachments).map(function (key) {
    var attachment = doc._attachments[key];
    if (attachment.data && typeof attachment.data !== 'string') {
      return new PouchPromise(function (resolve) {
        blobToBase64(attachment.data, resolve);
      }).then(function (b64) {
        attachment.data = b64;
      });
    }
  }));
}

function hasUrlPrefix(opts) {
  if (!opts.prefix) {
    return false;
  }

  var protocol = parseUri(opts.prefix).protocol;

  return protocol === 'http' || protocol === 'https';
}

// Get all the information you possibly can about the URI given by name and
// return it as a suitable object.
function getHost(name, opts) {

  // encode db name if opts.prefix is a url (#5574)
  if (hasUrlPrefix(opts)) {
    var dbName = opts.name.substr(opts.prefix.length);
    name = opts.prefix + encodeURIComponent(dbName);
  }

  // Prase the URI into all its little bits
  var uri = parseUri(name);

  // Store the user and password as a separate auth object
  if (uri.user || uri.password) {
    uri.auth = {username: uri.user, password: uri.password};
  }

  // Split the path part of the URI into parts using '/' as the delimiter
  // after removing any leading '/' and any trailing '/'
  var parts = uri.path.replace(/(^\/|\/$)/g, '').split('/');

  // Store the first part as the database name and remove it from the parts
  // array
  uri.db = parts.pop();
  // Prevent double encoding of URI component
  if (uri.db.indexOf('%') === -1) {
    uri.db = encodeURIComponent(uri.db);
  }

  // Restore the path by joining all the remaining parts (all the parts
  // except for the database name) with '/'s
  uri.path = parts.join('/');

  return uri;
}

// Generate a URL with the host data given by opts and the given path
function genDBUrl(opts, path) {
  return genUrl(opts, opts.db + '/' + path);
}

// Generate a URL with the host data given by opts and the given path
function genUrl(opts, path) {
  // If the host already has a path, then we need to have a path delimiter
  // Otherwise, the path delimiter is the empty string
  var pathDel = !opts.path ? '' : '/';

  // If the host already has a path, then we need to have a path delimiter
  // Otherwise, the path delimiter is the empty string
  return opts.protocol + '://' + opts.host +
         (opts.port ? (':' + opts.port) : '') +
         '/' + opts.path + pathDel + path;
}

function paramsToStr(params) {
  return '?' + Object.keys(params).map(function (k) {
    return k + '=' + encodeURIComponent(params[k]);
  }).join('&');
}

// Implements the PouchDB API for dealing with CouchDB instances over HTTP
function HttpPouch(opts, callback) {

  // The functions that will be publicly available for HttpPouch
  var api = this;

  var host = getHost(opts.name, opts);
  var dbUrl = genDBUrl(host, '');

  opts = clone(opts);
  var ajaxOpts = opts.ajax || {};

  if (opts.auth || host.auth) {
    var nAuth = opts.auth || host.auth;
    var str = nAuth.username + ':' + nAuth.password;
    var token = btoa$1(unescape(encodeURIComponent(str)));
    ajaxOpts.headers = ajaxOpts.headers || {};
    ajaxOpts.headers.Authorization = 'Basic ' + token;
  }

  // Not strictly necessary, but we do this because numerous tests
  // rely on swapping ajax in and out.
  api._ajax = ajax;

  function ajax$$(userOpts, options, callback) {
    var reqAjax = userOpts.ajax || {};
    var reqOpts = extend$1(clone(ajaxOpts), reqAjax, options);
    log$1(reqOpts.method + ' ' + reqOpts.url);
    return api._ajax(reqOpts, callback);
  }

  function ajaxPromise(userOpts, opts) {
    return new PouchPromise(function (resolve, reject) {
      ajax$$(userOpts, opts, function (err, res) {
        /* istanbul ignore if */
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
    });
  }

  function adapterFun$$(name, fun) {
    return adapterFun(name, getArguments(function (args) {
      setup().then(function () {
        return fun.apply(this, args);
      }).catch(function (e) {
        var callback = args.pop();
        callback(e);
      });
    }));
  }

  var setupPromise;

  function setup() {
    // TODO: Remove `skipSetup` in favor of `skip_setup` in a future release
    if (opts.skipSetup || opts.skip_setup) {
      return PouchPromise.resolve();
    }

    // If there is a setup in process or previous successful setup
    // done then we will use that
    // If previous setups have been rejected we will try again
    if (setupPromise) {
      return setupPromise;
    }

    var checkExists = {method: 'GET', url: dbUrl};
    setupPromise = ajaxPromise({}, checkExists).catch(function (err) {
      if (err && err.status && err.status === 404) {
        // Doesnt exist, create it
        explainError(404, 'PouchDB is just detecting if the remote exists.');
        return ajaxPromise({}, {method: 'PUT', url: dbUrl});
      } else {
        return PouchPromise.reject(err);
      }
    }).catch(function (err) {
      // If we try to create a database that already exists, skipped in
      // istanbul since its catching a race condition.
      /* istanbul ignore if */
      if (err && err.status && err.status === 412) {
        return true;
      }
      return PouchPromise.reject(err);
    });

    setupPromise.catch(function () {
      setupPromise = null;
    });

    return setupPromise;
  }

  setTimeout(function () {
    callback(null, api);
  });

  api.type = function () {
    return 'http';
  };

  api.id = adapterFun$$('id', function (callback) {
    ajax$$({}, {method: 'GET', url: genUrl(host, '')}, function (err, result) {
      var uuid = (result && result.uuid) ?
        (result.uuid + host.db) : genDBUrl(host, '');
      callback(null, uuid);
    });
  });

  api.request = adapterFun$$('request', function (options, callback) {
    options.url = genDBUrl(host, options.url);
    ajax$$({}, options, callback);
  });

  // Sends a POST request to the host calling the couchdb _compact function
  //    version: The version of CouchDB it is running
  api.compact = adapterFun$$('compact', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);
    ajax$$(opts, {
      url: genDBUrl(host, '_compact'),
      method: 'POST'
    }, function () {
      function ping() {
        api.info(function (err, res) {
          if (res && !res.compact_running) {
            callback(null, {ok: true});
          } else {
            setTimeout(ping, opts.interval || 200);
          }
        });
      }
      // Ping the http if it's finished compaction
      ping();
    });
  });

  api.bulkGet = adapterFun('bulkGet', function (opts, callback) {
    var self = this;

    function doBulkGet(cb) {
      var params = {};
      if (opts.revs) {
        params.revs = true;
      }
      if (opts.attachments) {
        /* istanbul ignore next */
        params.attachments = true;
      }
      ajax$$(opts, {
        url: genDBUrl(host, '_bulk_get' + paramsToStr(params)),
        method: 'POST',
        body: { docs: opts.docs}
      }, cb);
    }

    function doBulkGetShim() {
      // avoid "url too long error" by splitting up into multiple requests
      var batchSize = MAX_SIMULTANEOUS_REVS;
      var numBatches = Math.ceil(opts.docs.length / batchSize);
      var numDone = 0;
      var results = new Array(numBatches);

      function onResult(batchNum) {
        return function (err, res) {
          // err is impossible because shim returns a list of errs in that case
          results[batchNum] = res.results;
          if (++numDone === numBatches) {
            callback(null, {results: flatten(results)});
          }
        };
      }

      for (var i = 0; i < numBatches; i++) {
        var subOpts = pick(opts, ['revs', 'attachments']);
        subOpts.ajax = ajaxOpts;
        subOpts.docs = opts.docs.slice(i * batchSize,
          Math.min(opts.docs.length, (i + 1) * batchSize));
        bulkGet(self, subOpts, onResult(i));
      }
    }

    // mark the whole database as either supporting or not supporting _bulk_get
    var dbUrl = genUrl(host, '');
    var supportsBulkGet = supportsBulkGetMap[dbUrl];

    if (typeof supportsBulkGet !== 'boolean') {
      // check if this database supports _bulk_get
      doBulkGet(function (err, res) {
        /* istanbul ignore else */
        if (err) {
          var status = Math.floor(err.status / 100);
          /* istanbul ignore else */
          if (status === 4 || status === 5) { // 40x or 50x
            supportsBulkGetMap[dbUrl] = false;
            explainError(
              err.status,
              'PouchDB is just detecting if the remote ' +
              'supports the _bulk_get API.'
            );
            doBulkGetShim();
          } else {
            callback(err);
          }
        } else {
          supportsBulkGetMap[dbUrl] = true;
          callback(null, res);
        }
      });
    } else if (supportsBulkGet) {
      /* istanbul ignore next */
      doBulkGet(callback);
    } else {
      doBulkGetShim();
    }
  });

  // Calls GET on the host, which gets back a JSON string containing
  //    couchdb: A welcome string
  //    version: The version of CouchDB it is running
  api._info = function (callback) {
    setup().then(function () {
      ajax$$({}, {
        method: 'GET',
        url: genDBUrl(host, '')
      }, function (err, res) {
        /* istanbul ignore next */
        if (err) {
        return callback(err);
        }
        res.host = genDBUrl(host, '');
        callback(null, res);
      });
    }).catch(callback);
  };

  // Get the document with the given id from the database given by host.
  // The id could be solely the _id in the database, or it may be a
  // _design/ID or _local/ID path
  api.get = adapterFun$$('get', function (id, opts, callback) {
    // If no options were given, set the callback to the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);

    // List of parameters to add to the GET request
    var params = {};

    if (opts.revs) {
      params.revs = true;
    }

    if (opts.revs_info) {
      params.revs_info = true;
    }

    if (opts.open_revs) {
      if (opts.open_revs !== "all") {
        opts.open_revs = JSON.stringify(opts.open_revs);
      }
      params.open_revs = opts.open_revs;
    }

    if (opts.rev) {
      params.rev = opts.rev;
    }

    if (opts.conflicts) {
      params.conflicts = opts.conflicts;
    }

    id = encodeDocId(id);

    // Set the options for the ajax call
    var options = {
      method: 'GET',
      url: genDBUrl(host, id + paramsToStr(params))
    };

    function fetchAttachments(doc) {
      var atts = doc._attachments;
      var filenames = atts && Object.keys(atts);
      if (!atts || !filenames.length) {
        return;
      }
      // we fetch these manually in separate XHRs, because
      // Sync Gateway would normally send it back as multipart/mixed,
      // which we cannot parse. Also, this is more efficient than
      // receiving attachments as base64-encoded strings.
      function fetch() {

        if (!filenames.length) {
          return null;
        }

        var filename = filenames.pop();
        var att = atts[filename];
        var path = encodeDocId(doc._id) + '/' + encodeAttachmentId(filename) +
          '?rev=' + doc._rev;
        return ajaxPromise(opts, {
          method: 'GET',
          url: genDBUrl(host, path),
          binary: true
        }).then(function (blob) {
          if (opts.binary) {
            return blob;
          }
          return new PouchPromise(function (resolve) {
            blobToBase64(blob, resolve);
          });
        }).then(function (data) {
          delete att.stub;
          delete att.length;
          att.data = data;
        });
      }

      // This limits the number of parallel xhr requests to 5 any time
      // to avoid issues with maximum browser request limits
      return new PromisePool(fetch, 5, {promise: PouchPromise}).start();
    }

    function fetchAllAttachments(docOrDocs) {
      if (Array.isArray(docOrDocs)) {
        return PouchPromise.all(docOrDocs.map(function (doc) {
          if (doc.ok) {
            return fetchAttachments(doc.ok);
          }
        }));
      }
      return fetchAttachments(docOrDocs);
    }

    ajaxPromise(opts, options).then(function (res) {
      return PouchPromise.resolve().then(function () {
        if (opts.attachments) {
          return fetchAllAttachments(res);
        }
      }).then(function () {
        callback(null, res);
      });
    }).catch(callback);
  });

  // Delete the document given by doc from the database given by host.
  api.remove = adapterFun$$('remove',
      function (docOrId, optsOrRev, opts, callback) {
    var doc;
    if (typeof optsOrRev === 'string') {
      // id, rev, opts, callback style
      doc = {
        _id: docOrId,
        _rev: optsOrRev
      };
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
    } else {
      // doc, opts, callback style
      doc = docOrId;
      if (typeof optsOrRev === 'function') {
        callback = optsOrRev;
        opts = {};
      } else {
        callback = opts;
        opts = optsOrRev;
      }
    }

    var rev = (doc._rev || opts.rev);

    // Delete the document
    ajax$$(opts, {
      method: 'DELETE',
      url: genDBUrl(host, encodeDocId(doc._id)) + '?rev=' + rev
    }, callback);
  });

  function encodeAttachmentId(attachmentId) {
    return attachmentId.split("/").map(encodeURIComponent).join("/");
  }

  // Get the attachment
  api.getAttachment =
    adapterFun$$('getAttachment', function (docId, attachmentId, opts,
                                                callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    var params = opts.rev ? ('?rev=' + opts.rev) : '';
    var url = genDBUrl(host, encodeDocId(docId)) + '/' +
      encodeAttachmentId(attachmentId) + params;
    ajax$$(opts, {
      method: 'GET',
      url: url,
      binary: true
    }, callback);
  });

  // Remove the attachment given by the id and rev
  api.removeAttachment =
    adapterFun$$('removeAttachment', function (docId, attachmentId, rev,
                                                   callback) {

    var url = genDBUrl(host, encodeDocId(docId) + '/' +
      encodeAttachmentId(attachmentId)) + '?rev=' + rev;

    ajax$$({}, {
      method: 'DELETE',
      url: url
    }, callback);
  });

  // Add the attachment given by blob and its contentType property
  // to the document with the given id, the revision given by rev, and
  // add it to the database given by host.
  api.putAttachment =
    adapterFun$$('putAttachment', function (docId, attachmentId, rev, blob,
                                                type, callback) {
    if (typeof type === 'function') {
      callback = type;
      type = blob;
      blob = rev;
      rev = null;
    }
    var id = encodeDocId(docId) + '/' + encodeAttachmentId(attachmentId);
    var url = genDBUrl(host, id);
    if (rev) {
      url += '?rev=' + rev;
    }

    if (typeof blob === 'string') {
      // input is assumed to be a base64 string
      var binary;
      try {
        binary = atob$1(blob);
      } catch (err) {
        return callback(createError(BAD_ARG,
                        'Attachment is not a valid base64 string'));
      }
      blob = binary ? binStringToBluffer(binary, type) : '';
    }

    var opts = {
      headers: {'Content-Type': type},
      method: 'PUT',
      url: url,
      processData: false,
      body: blob,
      timeout: ajaxOpts.timeout || 60000
    };
    // Add the attachment
    ajax$$({}, opts, callback);
  });

  // Update/create multiple documents given by req in the database
  // given by host.
  api._bulkDocs = function (req, opts, callback) {
    // If new_edits=false then it prevents the database from creating
    // new revision numbers for the documents. Instead it just uses
    // the old ones. This is used in database replication.
    req.new_edits = opts.new_edits;

    setup().then(function () {
      return PouchPromise.all(req.docs.map(preprocessAttachments$1));
    }).then(function () {
      // Update/create the documents
      ajax$$(opts, {
        method: 'POST',
        url: genDBUrl(host, '_bulk_docs'),
        timeout: opts.timeout,
        body: req
      }, function (err, results) {
        if (err) {
          return callback(err);
        }
        results.forEach(function (result) {
          result.ok = true; // smooths out cloudant not adding this
        });
        callback(null, results);
      });
    }).catch(callback);
  };


  // Update/create document
  api._put = function (doc, opts, callback) {
    setup().then(function () {
      return preprocessAttachments$1(doc);
    }).then(function () {
      // Update/create the document
      ajax$$(opts, {
        method: 'PUT',
        url: genDBUrl(host, encodeDocId(doc._id)),
        body: doc
      }, function (err, result) {
        if (err) {
          return callback(err);
        }
        callback(null, result);
      });
    }).catch(callback);
  };


  // Get a listing of the documents in the database given
  // by host and ordered by increasing id.
  api.allDocs = adapterFun$$('allDocs', function (opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    opts = clone(opts);

    // List of parameters to add to the GET request
    var params = {};
    var body;
    var method = 'GET';

    if (opts.conflicts) {
      params.conflicts = true;
    }

    if (opts.descending) {
      params.descending = true;
    }

    if (opts.include_docs) {
      params.include_docs = true;
    }

    // added in CouchDB 1.6.0
    if (opts.attachments) {
      params.attachments = true;
    }

    if (opts.key) {
      params.key = JSON.stringify(opts.key);
    }

    if (opts.start_key) {
      opts.startkey = opts.start_key;
    }

    if (opts.startkey) {
      params.startkey = JSON.stringify(opts.startkey);
    }

    if (opts.end_key) {
      opts.endkey = opts.end_key;
    }

    if (opts.endkey) {
      params.endkey = JSON.stringify(opts.endkey);
    }

    if (typeof opts.inclusive_end !== 'undefined') {
      params.inclusive_end = !!opts.inclusive_end;
    }

    if (typeof opts.limit !== 'undefined') {
      params.limit = opts.limit;
    }

    if (typeof opts.skip !== 'undefined') {
      params.skip = opts.skip;
    }

    var paramStr = paramsToStr(params);

    if (typeof opts.keys !== 'undefined') {
      method = 'POST';
      body = {keys: opts.keys};
    }

    // Get the document listing
    ajaxPromise(opts, {
      method: method,
      url: genDBUrl(host, '_all_docs' + paramStr),
      body: body
    }).then(function (res) {
      if (opts.include_docs && opts.attachments && opts.binary) {
        res.rows.forEach(readAttachmentsAsBlobOrBuffer);
      }
      callback(null, res);
    }).catch(callback);
  });

  // Get a list of changes made to documents in the database given by host.
  // TODO According to the README, there should be two other methods here,
  // api.changes.addListener and api.changes.removeListener.
  api._changes = function (opts) {

    // We internally page the results of a changes request, this means
    // if there is a large set of changes to be returned we can start
    // processing them quicker instead of waiting on the entire
    // set of changes to return and attempting to process them at once
    var batchSize = 'batch_size' in opts ? opts.batch_size : CHANGES_BATCH_SIZE;

    opts = clone(opts);
    opts.timeout = ('timeout' in opts) ? opts.timeout :
      ('timeout' in ajaxOpts) ? ajaxOpts.timeout :
      30 * 1000;

    // We give a 5 second buffer for CouchDB changes to respond with
    // an ok timeout (if a timeout it set)
    var params = opts.timeout ? {timeout: opts.timeout - (5 * 1000)} : {};
    var limit = (typeof opts.limit !== 'undefined') ? opts.limit : false;
    var returnDocs;
    if ('return_docs' in opts) {
      returnDocs = opts.return_docs;
    } else if ('returnDocs' in opts) {
      // TODO: Remove 'returnDocs' in favor of 'return_docs' in a future release
      returnDocs = opts.returnDocs;
    } else {
      returnDocs = true;
    }
    //
    var leftToFetch = limit;

    if (opts.style) {
      params.style = opts.style;
    }

    if (opts.include_docs || opts.filter && typeof opts.filter === 'function') {
      params.include_docs = true;
    }

    if (opts.attachments) {
      params.attachments = true;
    }

    if (opts.continuous) {
      params.feed = 'longpoll';
    }

    if (opts.conflicts) {
      params.conflicts = true;
    }

    if (opts.descending) {
      params.descending = true;
    }

    if ('heartbeat' in opts) {
      // If the heartbeat value is false, it disables the default heartbeat
      if (opts.heartbeat) {
        params.heartbeat = opts.heartbeat;
      }
    } else {
      // Default heartbeat to 10 seconds
      params.heartbeat = 10000;
    }

    if (opts.filter && typeof opts.filter === 'string') {
      params.filter = opts.filter;
    }

    if (opts.view && typeof opts.view === 'string') {
      params.filter = '_view';
      params.view = opts.view;
    }

    // If opts.query_params exists, pass it through to the changes request.
    // These parameters may be used by the filter on the source database.
    if (opts.query_params && typeof opts.query_params === 'object') {
      for (var param_name in opts.query_params) {
        /* istanbul ignore else */
        if (opts.query_params.hasOwnProperty(param_name)) {
          params[param_name] = opts.query_params[param_name];
        }
      }
    }

    var method = 'GET';
    var body;

    if (opts.doc_ids) {
      // set this automagically for the user; it's annoying that couchdb
      // requires both a "filter" and a "doc_ids" param.
      params.filter = '_doc_ids';
      method = 'POST';
      body = {doc_ids: opts.doc_ids };
    }

    var xhr;
    var lastFetchedSeq;

    // Get all the changes starting wtih the one immediately after the
    // sequence number given by since.
    var fetch = function (since, callback) {
      if (opts.aborted) {
        return;
      }
      params.since = since;
      // "since" can be any kind of json object in Coudant/CouchDB 2.x
      /* istanbul ignore next */
      if (typeof params.since === "object") {
        params.since = JSON.stringify(params.since);
      }

      if (opts.descending) {
        if (limit) {
          params.limit = leftToFetch;
        }
      } else {
        params.limit = (!limit || leftToFetch > batchSize) ?
          batchSize : leftToFetch;
      }

      // Set the options for the ajax call
      var xhrOpts = {
        method: method,
        url: genDBUrl(host, '_changes' + paramsToStr(params)),
        timeout: opts.timeout,
        body: body
      };
      lastFetchedSeq = since;

      /* istanbul ignore if */
      if (opts.aborted) {
        return;
      }

      // Get the changes
      setup().then(function () {
        xhr = ajax$$(opts, xhrOpts, callback);
      }).catch(callback);
    };

    // If opts.since exists, get all the changes from the sequence
    // number given by opts.since. Otherwise, get all the changes
    // from the sequence number 0.
    var results = {results: []};

    var fetched = function (err, res) {
      if (opts.aborted) {
        return;
      }
      var raw_results_length = 0;
      // If the result of the ajax call (res) contains changes (res.results)
      if (res && res.results) {
        raw_results_length = res.results.length;
        results.last_seq = res.last_seq;
        // For each change
        var req = {};
        req.query = opts.query_params;
        res.results = res.results.filter(function (c) {
          leftToFetch--;
          var ret = filterChange(opts)(c);
          if (ret) {
            if (opts.include_docs && opts.attachments && opts.binary) {
              readAttachmentsAsBlobOrBuffer(c);
            }
            if (returnDocs) {
              results.results.push(c);
            }
            opts.onChange(c);
          }
          return ret;
        });
      } else if (err) {
        // In case of an error, stop listening for changes and call
        // opts.complete
        opts.aborted = true;
        opts.complete(err);
        return;
      }

      // The changes feed may have timed out with no results
      // if so reuse last update sequence
      if (res && res.last_seq) {
        lastFetchedSeq = res.last_seq;
      }

      var finished = (limit && leftToFetch <= 0) ||
        (res && raw_results_length < batchSize) ||
        (opts.descending);

      if ((opts.continuous && !(limit && leftToFetch <= 0)) || !finished) {
        // Queue a call to fetch again with the newest sequence number
        setTimeout(function () { fetch(lastFetchedSeq, fetched); }, 0);
      } else {
        // We're done, call the callback
        opts.complete(null, results);
      }
    };

    fetch(opts.since || 0, fetched);

    // Return a method to cancel this method from processing any more
    return {
      cancel: function () {
        opts.aborted = true;
        if (xhr) {
          xhr.abort();
        }
      }
    };
  };

  // Given a set of document/revision IDs (given by req), tets the subset of
  // those that do NOT correspond to revisions stored in the database.
  // See http://wiki.apache.org/couchdb/HttpPostRevsDiff
  api.revsDiff = adapterFun$$('revsDiff', function (req, opts, callback) {
    // If no options were given, set the callback to be the second parameter
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    // Get the missing document/revision IDs
    ajax$$(opts, {
      method: 'POST',
      url: genDBUrl(host, '_revs_diff'),
      body: req
    }, callback);
  });

  api._close = function (callback) {
    callback();
  };

  api._destroy = function (options, callback) {
    ajax$$(options, {
      url: genDBUrl(host, ''),
      method: 'DELETE'
    }, function (err, resp) {
      if (err && err.status && err.status !== 404) {
        return callback(err);
      }
      callback(null, resp);
    });
  };
}

// HttpPouch is a valid adapter.
HttpPouch.valid = function () {
  return true;
};

function HttpPouch$1 (PouchDB) {
  PouchDB.adapter('http', HttpPouch, false);
  PouchDB.adapter('https', HttpPouch, false);
}

function pad(str, padWith, upToLength) {
  var padding = '';
  var targetLength = upToLength - str.length;
  /* istanbul ignore next */
  while (padding.length < targetLength) {
    padding += padWith;
  }
  return padding;
}

function padLeft(str, padWith, upToLength) {
  var padding = pad(str, padWith, upToLength);
  return padding + str;
}

var MIN_MAGNITUDE = -324; // verified by -Number.MIN_VALUE
var MAGNITUDE_DIGITS = 3; // ditto
var SEP = ''; // set to '_' for easier debugging 

function collate(a, b) {

  if (a === b) {
    return 0;
  }

  a = normalizeKey(a);
  b = normalizeKey(b);

  var ai = collationIndex(a);
  var bi = collationIndex(b);
  if ((ai - bi) !== 0) {
    return ai - bi;
  }
  if (a === null) {
    return 0;
  }
  switch (typeof a) {
    case 'number':
      return a - b;
    case 'boolean':
      return a === b ? 0 : (a < b ? -1 : 1);
    case 'string':
      return stringCollate(a, b);
  }
  return Array.isArray(a) ? arrayCollate(a, b) : objectCollate(a, b);
}

// couch considers null/NaN/Infinity/-Infinity === undefined,
// for the purposes of mapreduce indexes. also, dates get stringified.
function normalizeKey(key) {
  switch (typeof key) {
    case 'undefined':
      return null;
    case 'number':
      if (key === Infinity || key === -Infinity || isNaN(key)) {
        return null;
      }
      return key;
    case 'object':
      var origKey = key;
      if (Array.isArray(key)) {
        var len = key.length;
        key = new Array(len);
        for (var i = 0; i < len; i++) {
          key[i] = normalizeKey(origKey[i]);
        }
      /* istanbul ignore next */
      } else if (key instanceof Date) {
        return key.toJSON();
      } else if (key !== null) { // generic object
        key = {};
        for (var k in origKey) {
          if (origKey.hasOwnProperty(k)) {
            var val = origKey[k];
            if (typeof val !== 'undefined') {
              key[k] = normalizeKey(val);
            }
          }
        }
      }
  }
  return key;
}

function indexify(key) {
  if (key !== null) {
    switch (typeof key) {
      case 'boolean':
        return key ? 1 : 0;
      case 'number':
        return numToIndexableString(key);
      case 'string':
        // We've to be sure that key does not contain \u0000
        // Do order-preserving replacements:
        // 0 -> 1, 1
        // 1 -> 1, 2
        // 2 -> 2, 2
        return key
          .replace(/\u0002/g, '\u0002\u0002')
          .replace(/\u0001/g, '\u0001\u0002')
          .replace(/\u0000/g, '\u0001\u0001');
      case 'object':
        var isArray = Array.isArray(key);
        var arr = isArray ? key : Object.keys(key);
        var i = -1;
        var len = arr.length;
        var result = '';
        if (isArray) {
          while (++i < len) {
            result += toIndexableString(arr[i]);
          }
        } else {
          while (++i < len) {
            var objKey = arr[i];
            result += toIndexableString(objKey) +
                toIndexableString(key[objKey]);
          }
        }
        return result;
    }
  }
  return '';
}

// convert the given key to a string that would be appropriate
// for lexical sorting, e.g. within a database, where the
// sorting is the same given by the collate() function.
function toIndexableString(key) {
  var zero = '\u0000';
  key = normalizeKey(key);
  return collationIndex(key) + SEP + indexify(key) + zero;
}

function parseNumber(str, i) {
  var originalIdx = i;
  var num;
  var zero = str[i] === '1';
  if (zero) {
    num = 0;
    i++;
  } else {
    var neg = str[i] === '0';
    i++;
    var numAsString = '';
    var magAsString = str.substring(i, i + MAGNITUDE_DIGITS);
    var magnitude = parseInt(magAsString, 10) + MIN_MAGNITUDE;
    /* istanbul ignore next */
    if (neg) {
      magnitude = -magnitude;
    }
    i += MAGNITUDE_DIGITS;
    while (true) {
      var ch = str[i];
      if (ch === '\u0000') {
        break;
      } else {
        numAsString += ch;
      }
      i++;
    }
    numAsString = numAsString.split('.');
    if (numAsString.length === 1) {
      num = parseInt(numAsString, 10);
    } else {
      /* istanbul ignore next */
      num = parseFloat(numAsString[0] + '.' + numAsString[1]);
    }
    /* istanbul ignore next */
    if (neg) {
      num = num - 10;
    }
    /* istanbul ignore next */
    if (magnitude !== 0) {
      // parseFloat is more reliable than pow due to rounding errors
      // e.g. Number.MAX_VALUE would return Infinity if we did
      // num * Math.pow(10, magnitude);
      num = parseFloat(num + 'e' + magnitude);
    }
  }
  return {num: num, length : i - originalIdx};
}

// move up the stack while parsing
// this function moved outside of parseIndexableString for performance
function pop(stack, metaStack) {
  var obj = stack.pop();

  if (metaStack.length) {
    var lastMetaElement = metaStack[metaStack.length - 1];
    if (obj === lastMetaElement.element) {
      // popping a meta-element, e.g. an object whose value is another object
      metaStack.pop();
      lastMetaElement = metaStack[metaStack.length - 1];
    }
    var element = lastMetaElement.element;
    var lastElementIndex = lastMetaElement.index;
    if (Array.isArray(element)) {
      element.push(obj);
    } else if (lastElementIndex === stack.length - 2) { // obj with key+value
      var key = stack.pop();
      element[key] = obj;
    } else {
      stack.push(obj); // obj with key only
    }
  }
}

function parseIndexableString(str) {
  var stack = [];
  var metaStack = []; // stack for arrays and objects
  var i = 0;

  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    var collationIndex = str[i++];
    if (collationIndex === '\u0000') {
      if (stack.length === 1) {
        return stack.pop();
      } else {
        pop(stack, metaStack);
        continue;
      }
    }
    switch (collationIndex) {
      case '1':
        stack.push(null);
        break;
      case '2':
        stack.push(str[i] === '1');
        i++;
        break;
      case '3':
        var parsedNum = parseNumber(str, i);
        stack.push(parsedNum.num);
        i += parsedNum.length;
        break;
      case '4':
        var parsedStr = '';
        /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
        while (true) {
          var ch = str[i];
          if (ch === '\u0000') {
            break;
          }
          parsedStr += ch;
          i++;
        }
        // perform the reverse of the order-preserving replacement
        // algorithm (see above)
        parsedStr = parsedStr.replace(/\u0001\u0001/g, '\u0000')
          .replace(/\u0001\u0002/g, '\u0001')
          .replace(/\u0002\u0002/g, '\u0002');
        stack.push(parsedStr);
        break;
      case '5':
        var arrayElement = { element: [], index: stack.length };
        stack.push(arrayElement.element);
        metaStack.push(arrayElement);
        break;
      case '6':
        var objElement = { element: {}, index: stack.length };
        stack.push(objElement.element);
        metaStack.push(objElement);
        break;
      /* istanbul ignore next */
      default:
        throw new Error(
          'bad collationIndex or unexpectedly reached end of input: ' +
            collationIndex);
    }
  }
}

function arrayCollate(a, b) {
  var len = Math.min(a.length, b.length);
  for (var i = 0; i < len; i++) {
    var sort = collate(a[i], b[i]);
    if (sort !== 0) {
      return sort;
    }
  }
  return (a.length === b.length) ? 0 :
    (a.length > b.length) ? 1 : -1;
}
function stringCollate(a, b) {
  // See: https://github.com/daleharvey/pouchdb/issues/40
  // This is incompatible with the CouchDB implementation, but its the
  // best we can do for now
  return (a === b) ? 0 : ((a > b) ? 1 : -1);
}
function objectCollate(a, b) {
  var ak = Object.keys(a), bk = Object.keys(b);
  var len = Math.min(ak.length, bk.length);
  for (var i = 0; i < len; i++) {
    // First sort the keys
    var sort = collate(ak[i], bk[i]);
    if (sort !== 0) {
      return sort;
    }
    // if the keys are equal sort the values
    sort = collate(a[ak[i]], b[bk[i]]);
    if (sort !== 0) {
      return sort;
    }

  }
  return (ak.length === bk.length) ? 0 :
    (ak.length > bk.length) ? 1 : -1;
}
// The collation is defined by erlangs ordered terms
// the atoms null, true, false come first, then numbers, strings,
// arrays, then objects
// null/undefined/NaN/Infinity/-Infinity are all considered null
function collationIndex(x) {
  var id = ['boolean', 'number', 'string', 'object'];
  var idx = id.indexOf(typeof x);
  //false if -1 otherwise true, but fast!!!!1
  if (~idx) {
    if (x === null) {
      return 1;
    }
    if (Array.isArray(x)) {
      return 5;
    }
    return idx < 3 ? (idx + 2) : (idx + 3);
  }
  /* istanbul ignore next */
  if (Array.isArray(x)) {
    return 5;
  }
}

// conversion:
// x yyy zz...zz
// x = 0 for negative, 1 for 0, 2 for positive
// y = exponent (for negative numbers negated) moved so that it's >= 0
// z = mantisse
function numToIndexableString(num) {

  if (num === 0) {
    return '1';
  }

  // convert number to exponential format for easier and
  // more succinct string sorting
  var expFormat = num.toExponential().split(/e\+?/);
  var magnitude = parseInt(expFormat[1], 10);

  var neg = num < 0;

  var result = neg ? '0' : '2';

  // first sort by magnitude
  // it's easier if all magnitudes are positive
  var magForComparison = ((neg ? -magnitude : magnitude) - MIN_MAGNITUDE);
  var magString = padLeft((magForComparison).toString(), '0', MAGNITUDE_DIGITS);

  result += SEP + magString;

  // then sort by the factor
  var factor = Math.abs(parseFloat(expFormat[0])); // [1..10)
  /* istanbul ignore next */
  if (neg) { // for negative reverse ordering
    factor = 10 - factor;
  }

  var factorStr = factor.toFixed(20);

  // strip zeros from the end
  factorStr = factorStr.replace(/\.?0+$/, '');

  result += SEP + factorStr;

  return result;
}

/*
 * Simple task queue to sequentialize actions. Assumes
 * callbacks will eventually fire (once).
 */

function TaskQueue$1() {
  this.promise = new PouchPromise(function (fulfill) {fulfill(); });
}
TaskQueue$1.prototype.add = function (promiseFactory) {
  this.promise = this.promise.catch(function () {
    // just recover
  }).then(function () {
    return promiseFactory();
  });
  return this.promise;
};
TaskQueue$1.prototype.finish = function () {
  return this.promise;
};

function createView(opts) {
  var sourceDB = opts.db;
  var viewName = opts.viewName;
  var mapFun = opts.map;
  var reduceFun = opts.reduce;
  var temporary = opts.temporary;

  // the "undefined" part is for backwards compatibility
  var viewSignature = mapFun.toString() + (reduceFun && reduceFun.toString()) +
    'undefined';

  var cachedViews;
  if (!temporary) {
    // cache this to ensure we don't try to update the same view twice
    cachedViews = sourceDB._cachedViews = sourceDB._cachedViews || {};
    if (cachedViews[viewSignature]) {
      return cachedViews[viewSignature];
    }
  }

  var promiseForView = sourceDB.info().then(function (info) {

    var depDbName = info.db_name + '-mrview-' +
      (temporary ? 'temp' : stringMd5(viewSignature));

    // save the view name in the source db so it can be cleaned up if necessary
    // (e.g. when the _design doc is deleted, remove all associated view data)
    function diffFunction(doc) {
      doc.views = doc.views || {};
      var fullViewName = viewName;
      if (fullViewName.indexOf('/') === -1) {
        fullViewName = viewName + '/' + viewName;
      }
      var depDbs = doc.views[fullViewName] = doc.views[fullViewName] || {};
      /* istanbul ignore if */
      if (depDbs[depDbName]) {
        return; // no update necessary
      }
      depDbs[depDbName] = true;
      return doc;
    }
    return upsert(sourceDB, '_local/mrviews', diffFunction).then(function () {
      return sourceDB.registerDependentDatabase(depDbName).then(function (res) {
        var db = res.db;
        db.auto_compaction = true;
        var view = {
          name: depDbName,
          db: db,
          sourceDB: sourceDB,
          adapter: sourceDB.adapter,
          mapFun: mapFun,
          reduceFun: reduceFun
        };
        return view.db.get('_local/lastSeq').catch(function (err) {
          /* istanbul ignore if */
          if (err.status !== 404) {
            throw err;
          }
        }).then(function (lastSeqDoc) {
          view.seq = lastSeqDoc ? lastSeqDoc.seq : 0;
          if (cachedViews) {
            view.db.once('destroyed', function () {
              delete cachedViews[viewSignature];
            });
          }
          return view;
        });
      });
    });
  });

  if (cachedViews) {
    cachedViews[viewSignature] = promiseForView;
  }
  return promiseForView;
}

function QueryParseError(message) {
  this.status = 400;
  this.name = 'query_parse_error';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, QueryParseError);
  } catch (e) {}
}

inherits(QueryParseError, Error);

function NotFoundError(message) {
  this.status = 404;
  this.name = 'not_found';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, NotFoundError);
  } catch (e) {}
}

inherits(NotFoundError, Error);

function BuiltInError(message) {
  this.status = 500;
  this.name = 'invalid_value';
  this.message = message;
  this.error = true;
  try {
    Error.captureStackTrace(this, BuiltInError);
  } catch (e) {}
}

inherits(BuiltInError, Error);

function createBuiltInError(name) {
  var message = 'builtin ' + name +
    ' function requires map values to be numbers' +
    ' or number arrays';
  return new BuiltInError(message);
}

function sum(values) {
  var result = 0;
  for (var i = 0, len = values.length; i < len; i++) {
    var num = values[i];
    if (typeof num !== 'number') {
      if (Array.isArray(num)) {
        // lists of numbers are also allowed, sum them separately
        result = typeof result === 'number' ? [result] : result;
        for (var j = 0, jLen = num.length; j < jLen; j++) {
          var jNum = num[j];
          if (typeof jNum !== 'number') {
            throw createBuiltInError('_sum');
          } else if (typeof result[j] === 'undefined') {
            result.push(jNum);
          } else {
            result[j] += jNum;
          }
        }
      } else { // not array/number
        throw createBuiltInError('_sum');
      }
    } else if (typeof result === 'number') {
      result += num;
    } else { // add number to array
      result[0] += num;
    }
  }
  return result;
}

var log$2 = guardedConsole.bind(null, 'log');
var isArray = Array.isArray;
var toJSON = JSON.parse;

function evalFunctionWithEval(func, emit) {
  return scopedEval(
    "return (" + func.replace(/;\s*$/, "") + ");",
    {
      emit: emit,
      sum: sum,
      log: log$2,
      isArray: isArray,
      toJSON: toJSON
    }
  );
}

var promisedCallback = function (promise, callback) {
  if (callback) {
    promise.then(function (res) {
      process.nextTick(function () {
        callback(null, res);
      });
    }, function (reason) {
      process.nextTick(function () {
        callback(reason);
      });
    });
  }
  return promise;
};

var callbackify = function (fun) {
  return getArguments(function (args) {
    var cb = args.pop();
    var promise = fun.apply(this, args);
    if (typeof cb === 'function') {
      promisedCallback(promise, cb);
    }
    return promise;
  });
};

// Promise finally util similar to Q.finally
var fin = function (promise, finalPromiseFactory) {
  return promise.then(function (res) {
    return finalPromiseFactory().then(function () {
      return res;
    });
  }, function (reason) {
    return finalPromiseFactory().then(function () {
      throw reason;
    });
  });
};

var sequentialize = function (queue, promiseFactory) {
  return function () {
    var args = arguments;
    var that = this;
    return queue.add(function () {
      return promiseFactory.apply(that, args);
    });
  };
};

// uniq an array of strings, order not guaranteed
// similar to underscore/lodash _.uniq
var uniq = function (arr) {
  var map = {};

  for (var i = 0, len = arr.length; i < len; i++) {
    map['$' + arr[i]] = true;
  }

  var keys = Object.keys(map);
  var output = new Array(keys.length);

  for (i = 0, len = keys.length; i < len; i++) {
    output[i] = keys[i].substring(1);
  }
  return output;
};

var persistentQueues = {};
var tempViewQueue = new TaskQueue$1();
var CHANGES_BATCH_SIZE$1 = 50;

function parseViewName(name) {
  // can be either 'ddocname/viewname' or just 'viewname'
  // (where the ddoc name is the same)
  return name.indexOf('/') === -1 ? [name, name] : name.split('/');
}

function isGenOne(changes) {
  // only return true if the current change is 1-
  // and there are no other leafs
  return changes.length === 1 && /^1-/.test(changes[0].rev);
}

function emitError(db, e) {
  try {
    db.emit('error', e);
  } catch (err) {
    guardedConsole('error',
      'The user\'s map/reduce function threw an uncaught error.\n' +
      'You can debug this error by doing:\n' +
      'myDatabase.on(\'error\', function (err) { debugger; });\n' +
      'Please double-check your map/reduce function.');
    guardedConsole('error', e);
  }
}

function tryCode$1(db, fun, args) {
  // emit an event if there was an error thrown by a map/reduce function.
  // putting try/catches in a single function also avoids deoptimizations.
  try {
    return {
      output : fun.apply(null, args)
    };
  } catch (e) {
    emitError(db, e);
    return {error: e};
  }
}

function sortByKeyThenValue(x, y) {
  var keyCompare = collate(x.key, y.key);
  return keyCompare !== 0 ? keyCompare : collate(x.value, y.value);
}

function sliceResults(results, limit, skip) {
  skip = skip || 0;
  if (typeof limit === 'number') {
    return results.slice(skip, limit + skip);
  } else if (skip > 0) {
    return results.slice(skip);
  }
  return results;
}

function rowToDocId(row) {
  var val = row.value;
  // Users can explicitly specify a joined doc _id, or it
  // defaults to the doc _id that emitted the key/value.
  var docId = (val && typeof val === 'object' && val._id) || row.id;
  return docId;
}

function readAttachmentsAsBlobOrBuffer$1(res) {
  res.rows.forEach(function (row) {
    var atts = row.doc && row.doc._attachments;
    if (!atts) {
      return;
    }
    Object.keys(atts).forEach(function (filename) {
      var att = atts[filename];
      atts[filename].data = b64ToBluffer(att.data, att.content_type);
    });
  });
}

function postprocessAttachments(opts) {
  return function (res) {
    if (opts.include_docs && opts.attachments && opts.binary) {
      readAttachmentsAsBlobOrBuffer$1(res);
    }
    return res;
  };
}

var builtInReduce = {
  _sum: function (keys, values) {
    return sum(values);
  },

  _count: function (keys, values) {
    return values.length;
  },

  _stats: function (keys, values) {
    // no need to implement rereduce=true, because Pouch
    // will never call it
    function sumsqr(values) {
      var _sumsqr = 0;
      for (var i = 0, len = values.length; i < len; i++) {
        var num = values[i];
        _sumsqr += (num * num);
      }
      return _sumsqr;
    }
    return {
      sum     : sum(values),
      min     : Math.min.apply(null, values),
      max     : Math.max.apply(null, values),
      count   : values.length,
      sumsqr : sumsqr(values)
    };
  }
};

function addHttpParam(paramName, opts, params, asJson) {
  // add an http param from opts to params, optionally json-encoded
  var val = opts[paramName];
  if (typeof val !== 'undefined') {
    if (asJson) {
      val = encodeURIComponent(JSON.stringify(val));
    }
    params.push(paramName + '=' + val);
  }
}

function coerceInteger(integerCandidate) {
  if (typeof integerCandidate !== 'undefined') {
    var asNumber = Number(integerCandidate);
    // prevents e.g. '1foo' or '1.1' being coerced to 1
    if (!isNaN(asNumber) && asNumber === parseInt(integerCandidate, 10)) {
      return asNumber;
    } else {
      return integerCandidate;
    }
  }
}

function coerceOptions(opts) {
  opts.group_level = coerceInteger(opts.group_level);
  opts.limit = coerceInteger(opts.limit);
  opts.skip = coerceInteger(opts.skip);
  return opts;
}

function checkPositiveInteger(number) {
  if (number) {
    if (typeof number !== 'number') {
      return  new QueryParseError('Invalid value for integer: "' +
      number + '"');
    }
    if (number < 0) {
      return new QueryParseError('Invalid value for positive integer: ' +
        '"' + number + '"');
    }
  }
}

function checkQueryParseError(options, fun) {
  var startkeyName = options.descending ? 'endkey' : 'startkey';
  var endkeyName = options.descending ? 'startkey' : 'endkey';

  if (typeof options[startkeyName] !== 'undefined' &&
    typeof options[endkeyName] !== 'undefined' &&
    collate(options[startkeyName], options[endkeyName]) > 0) {
    throw new QueryParseError('No rows can match your key range, ' +
    'reverse your start_key and end_key or set {descending : true}');
  } else if (fun.reduce && options.reduce !== false) {
    if (options.include_docs) {
      throw new QueryParseError('{include_docs:true} is invalid for reduce');
    } else if (options.keys && options.keys.length > 1 &&
        !options.group && !options.group_level) {
      throw new QueryParseError('Multi-key fetches for reduce views must use ' +
      '{group: true}');
    }
  }
  ['group_level', 'limit', 'skip'].forEach(function (optionName) {
    var error = checkPositiveInteger(options[optionName]);
    if (error) {
      throw error;
    }
  });
}

function httpQuery(db, fun, opts) {
  // List of parameters to add to the PUT request
  var params = [];
  var body;
  var method = 'GET';

  // If opts.reduce exists and is defined, then add it to the list
  // of parameters.
  // If reduce=false then the results are that of only the map function
  // not the final result of map and reduce.
  addHttpParam('reduce', opts, params);
  addHttpParam('include_docs', opts, params);
  addHttpParam('attachments', opts, params);
  addHttpParam('limit', opts, params);
  addHttpParam('descending', opts, params);
  addHttpParam('group', opts, params);
  addHttpParam('group_level', opts, params);
  addHttpParam('skip', opts, params);
  addHttpParam('stale', opts, params);
  addHttpParam('conflicts', opts, params);
  addHttpParam('startkey', opts, params, true);
  addHttpParam('start_key', opts, params, true);
  addHttpParam('endkey', opts, params, true);
  addHttpParam('end_key', opts, params, true);
  addHttpParam('inclusive_end', opts, params);
  addHttpParam('key', opts, params, true);

  // Format the list of parameters into a valid URI query string
  params = params.join('&');
  params = params === '' ? '' : '?' + params;

  // If keys are supplied, issue a POST to circumvent GET query string limits
  // see http://wiki.apache.org/couchdb/HTTP_view_API#Querying_Options
  if (typeof opts.keys !== 'undefined') {
    var MAX_URL_LENGTH = 2000;
    // according to http://stackoverflow.com/a/417184/680742,
    // the de facto URL length limit is 2000 characters

    var keysAsString =
      'keys=' + encodeURIComponent(JSON.stringify(opts.keys));
    if (keysAsString.length + params.length + 1 <= MAX_URL_LENGTH) {
      // If the keys are short enough, do a GET. we do this to work around
      // Safari not understanding 304s on POSTs (see pouchdb/pouchdb#1239)
      params += (params[0] === '?' ? '&' : '?') + keysAsString;
    } else {
      method = 'POST';
      if (typeof fun === 'string') {
        body = {keys: opts.keys};
      } else { // fun is {map : mapfun}, so append to this
        fun.keys = opts.keys;
      }
    }
  }

  // We are referencing a query defined in the design doc
  if (typeof fun === 'string') {
    var parts = parseViewName(fun);
    return db.request({
      method: method,
      url: '_design/' + parts[0] + '/_view/' + parts[1] + params,
      body: body
    }).then(postprocessAttachments(opts));
  }

  // We are using a temporary view, terrible for performance, good for testing
  body = body || {};
  Object.keys(fun).forEach(function (key) {
    if (Array.isArray(fun[key])) {
      body[key] = fun[key];
    } else {
      body[key] = fun[key].toString();
    }
  });
  return db.request({
    method: 'POST',
    url: '_temp_view' + params,
    body: body
  }).then(postprocessAttachments(opts));
}

// custom adapters can define their own api._query
// and override the default behavior
/* istanbul ignore next */
function customQuery(db, fun, opts) {
  return new PouchPromise(function (resolve, reject) {
    db._query(fun, opts, function (err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}

// custom adapters can define their own api._viewCleanup
// and override the default behavior
/* istanbul ignore next */
function customViewCleanup(db) {
  return new PouchPromise(function (resolve, reject) {
    db._viewCleanup(function (err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res);
    });
  });
}

function defaultsTo(value) {
  return function (reason) {
    /* istanbul ignore else */
    if (reason.status === 404) {
      return value;
    } else {
      throw reason;
    }
  };
}

// returns a promise for a list of docs to update, based on the input docId.
// the order doesn't matter, because post-3.2.0, bulkDocs
// is an atomic operation in all three adapters.
function getDocsToPersist(docId, view, docIdsToChangesAndEmits) {
  var metaDocId = '_local/doc_' + docId;
  var defaultMetaDoc = {_id: metaDocId, keys: []};
  var docData = docIdsToChangesAndEmits[docId];
  var indexableKeysToKeyValues = docData.indexableKeysToKeyValues;
  var changes = docData.changes;

  function getMetaDoc() {
    if (isGenOne(changes)) {
      // generation 1, so we can safely assume initial state
      // for performance reasons (avoids unnecessary GETs)
      return PouchPromise.resolve(defaultMetaDoc);
    }
    return view.db.get(metaDocId).catch(defaultsTo(defaultMetaDoc));
  }

  function getKeyValueDocs(metaDoc) {
    if (!metaDoc.keys.length) {
      // no keys, no need for a lookup
      return PouchPromise.resolve({rows: []});
    }
    return view.db.allDocs({
      keys: metaDoc.keys,
      include_docs: true
    });
  }

  function processKvDocs(metaDoc, kvDocsRes) {
    var kvDocs = [];
    var oldKeysMap = {};

    for (var i = 0, len = kvDocsRes.rows.length; i < len; i++) {
      var row = kvDocsRes.rows[i];
      var doc = row.doc;
      if (!doc) { // deleted
        continue;
      }
      kvDocs.push(doc);
      oldKeysMap[doc._id] = true;
      doc._deleted = !indexableKeysToKeyValues[doc._id];
      if (!doc._deleted) {
        var keyValue = indexableKeysToKeyValues[doc._id];
        if ('value' in keyValue) {
          doc.value = keyValue.value;
        }
      }
    }

    var newKeys = Object.keys(indexableKeysToKeyValues);
    newKeys.forEach(function (key) {
      if (!oldKeysMap[key]) {
        // new doc
        var kvDoc = {
          _id: key
        };
        var keyValue = indexableKeysToKeyValues[key];
        if ('value' in keyValue) {
          kvDoc.value = keyValue.value;
        }
        kvDocs.push(kvDoc);
      }
    });
    metaDoc.keys = uniq(newKeys.concat(metaDoc.keys));
    kvDocs.push(metaDoc);

    return kvDocs;
  }

  return getMetaDoc().then(function (metaDoc) {
    return getKeyValueDocs(metaDoc).then(function (kvDocsRes) {
      return processKvDocs(metaDoc, kvDocsRes);
    });
  });
}

// updates all emitted key/value docs and metaDocs in the mrview database
// for the given batch of documents from the source database
function saveKeyValues(view, docIdsToChangesAndEmits, seq) {
  var seqDocId = '_local/lastSeq';
  return view.db.get(seqDocId)
  .catch(defaultsTo({_id: seqDocId, seq: 0}))
  .then(function (lastSeqDoc) {
    var docIds = Object.keys(docIdsToChangesAndEmits);
    return PouchPromise.all(docIds.map(function (docId) {
      return getDocsToPersist(docId, view, docIdsToChangesAndEmits);
    })).then(function (listOfDocsToPersist) {
      var docsToPersist = flatten(listOfDocsToPersist);
      lastSeqDoc.seq = seq;
      docsToPersist.push(lastSeqDoc);
      // write all docs in a single operation, update the seq once
      return view.db.bulkDocs({docs : docsToPersist});
    });
  });
}

function getQueue(view) {
  var viewName = typeof view === 'string' ? view : view.name;
  var queue = persistentQueues[viewName];
  if (!queue) {
    queue = persistentQueues[viewName] = new TaskQueue$1();
  }
  return queue;
}

function updateView(view) {
  return sequentialize(getQueue(view), function () {
    return updateViewInQueue(view);
  })();
}

function updateViewInQueue(view) {
  // bind the emit function once
  var mapResults;
  var doc;

  function emit(key, value) {
    var output = {id: doc._id, key: normalizeKey(key)};
    // Don't explicitly store the value unless it's defined and non-null.
    // This saves on storage space, because often people don't use it.
    if (typeof value !== 'undefined' && value !== null) {
      output.value = normalizeKey(value);
    }
    mapResults.push(output);
  }

  var mapFun;
  // for temp_views one can use emit(doc, emit), see #38
  if (typeof view.mapFun === "function" && view.mapFun.length === 2) {
    var origMap = view.mapFun;
    mapFun = function (doc) {
      return origMap(doc, emit);
    };
  } else {
    mapFun = evalFunctionWithEval(view.mapFun.toString(), emit);
  }

  var currentSeq = view.seq || 0;

  function processChange(docIdsToChangesAndEmits, seq) {
    return function () {
      return saveKeyValues(view, docIdsToChangesAndEmits, seq);
    };
  }

  var queue = new TaskQueue$1();
  // TODO(neojski): https://github.com/daleharvey/pouchdb/issues/1521

  return new PouchPromise(function (resolve, reject) {

    function complete() {
      queue.finish().then(function () {
        view.seq = currentSeq;
        resolve();
      });
    }

    function processNextBatch() {
      view.sourceDB.changes({
        conflicts: true,
        include_docs: true,
        style: 'all_docs',
        since: currentSeq,
        limit: CHANGES_BATCH_SIZE$1
      }).on('complete', function (response) {
        var results = response.results;
        if (!results.length) {
          return complete();
        }
        var docIdsToChangesAndEmits = {};
        for (var i = 0, l = results.length; i < l; i++) {
          var change = results[i];
          if (change.doc._id[0] !== '_') {
            mapResults = [];
            doc = change.doc;

            if (!doc._deleted) {
              tryCode$1(view.sourceDB, mapFun, [doc]);
            }
            mapResults.sort(sortByKeyThenValue);

            var indexableKeysToKeyValues = {};
            var lastKey;
            for (var j = 0, jl = mapResults.length; j < jl; j++) {
              var obj = mapResults[j];
              var complexKey = [obj.key, obj.id];
              if (collate(obj.key, lastKey) === 0) {
                complexKey.push(j); // dup key+id, so make it unique
              }
              var indexableKey = toIndexableString(complexKey);
              indexableKeysToKeyValues[indexableKey] = obj;
              lastKey = obj.key;
            }
            docIdsToChangesAndEmits[change.doc._id] = {
              indexableKeysToKeyValues: indexableKeysToKeyValues,
              changes: change.changes
            };
          }
          currentSeq = change.seq;
        }
        queue.add(processChange(docIdsToChangesAndEmits, currentSeq));
        if (results.length < CHANGES_BATCH_SIZE$1) {
          return complete();
        }
        return processNextBatch();
      }).on('error', onError);
      /* istanbul ignore next */
      function onError(err) {
        reject(err);
      }
    }

    processNextBatch();
  });
}

function reduceView(view, results, options) {
  if (options.group_level === 0) {
    delete options.group_level;
  }

  var shouldGroup = options.group || options.group_level;

  var reduceFun;
  if (builtInReduce[view.reduceFun]) {
    reduceFun = builtInReduce[view.reduceFun];
  } else {
    reduceFun = evalFunctionWithEval(view.reduceFun.toString());
  }

  var groups = [];
  var lvl = isNaN(options.group_level) ? Number.POSITIVE_INFINITY :
    options.group_level;
  results.forEach(function (e) {
    var last = groups[groups.length - 1];
    var groupKey = shouldGroup ? e.key : null;

    // only set group_level for array keys
    if (shouldGroup && Array.isArray(groupKey)) {
      groupKey = groupKey.slice(0, lvl);
    }

    if (last && collate(last.groupKey, groupKey) === 0) {
      last.keys.push([e.key, e.id]);
      last.values.push(e.value);
      return;
    }
    groups.push({
      keys: [[e.key, e.id]],
      values: [e.value],
      groupKey: groupKey
    });
  });
  results = [];
  for (var i = 0, len = groups.length; i < len; i++) {
    var e = groups[i];
    var reduceTry = tryCode$1(view.sourceDB, reduceFun,
      [e.keys, e.values, false]);
    if (reduceTry.error && reduceTry.error instanceof BuiltInError) {
      // CouchDB returns an error if a built-in errors out
      throw reduceTry.error;
    }
    results.push({
      // CouchDB just sets the value to null if a non-built-in errors out
      value: reduceTry.error ? null : reduceTry.output,
      key: e.groupKey
    });
  }
  // no total_rows/offset when reducing
  return {rows: sliceResults(results, options.limit, options.skip)};
}

function queryView(view, opts) {
  return sequentialize(getQueue(view), function () {
    return queryViewInQueue(view, opts);
  })();
}

function queryViewInQueue(view, opts) {
  var totalRows;
  var shouldReduce = view.reduceFun && opts.reduce !== false;
  var skip = opts.skip || 0;
  if (typeof opts.keys !== 'undefined' && !opts.keys.length) {
    // equivalent query
    opts.limit = 0;
    delete opts.keys;
  }

  function fetchFromView(viewOpts) {
    viewOpts.include_docs = true;
    return view.db.allDocs(viewOpts).then(function (res) {
      totalRows = res.total_rows;
      return res.rows.map(function (result) {

        // implicit migration - in older versions of PouchDB,
        // we explicitly stored the doc as {id: ..., key: ..., value: ...}
        // this is tested in a migration test
        /* istanbul ignore next */
        if ('value' in result.doc && typeof result.doc.value === 'object' &&
            result.doc.value !== null) {
          var keys = Object.keys(result.doc.value).sort();
          // this detection method is not perfect, but it's unlikely the user
          // emitted a value which was an object with these 3 exact keys
          var expectedKeys = ['id', 'key', 'value'];
          if (!(keys < expectedKeys || keys > expectedKeys)) {
            return result.doc.value;
          }
        }

        var parsedKeyAndDocId = parseIndexableString(result.doc._id);
        return {
          key: parsedKeyAndDocId[0],
          id: parsedKeyAndDocId[1],
          value: ('value' in result.doc ? result.doc.value : null)
        };
      });
    });
  }

  function onMapResultsReady(rows) {
    var finalResults;
    if (shouldReduce) {
      finalResults = reduceView(view, rows, opts);
    } else {
      finalResults = {
        total_rows: totalRows,
        offset: skip,
        rows: rows
      };
    }
    if (opts.include_docs) {
      var docIds = uniq(rows.map(rowToDocId));

      return view.sourceDB.allDocs({
        keys: docIds,
        include_docs: true,
        conflicts: opts.conflicts,
        attachments: opts.attachments,
        binary: opts.binary
      }).then(function (allDocsRes) {
        var docIdsToDocs = {};
        allDocsRes.rows.forEach(function (row) {
          if (row.doc) {
            docIdsToDocs['$' + row.id] = row.doc;
          }
        });
        rows.forEach(function (row) {
          var docId = rowToDocId(row);
          var doc = docIdsToDocs['$' + docId];
          if (doc) {
            row.doc = doc;
          }
        });
        return finalResults;
      });
    } else {
      return finalResults;
    }
  }

  if (typeof opts.keys !== 'undefined') {
    var keys = opts.keys;
    var fetchPromises = keys.map(function (key) {
      var viewOpts = {
        startkey : toIndexableString([key]),
        endkey   : toIndexableString([key, {}])
      };
      return fetchFromView(viewOpts);
    });
    return PouchPromise.all(fetchPromises).then(flatten).then(onMapResultsReady);
  } else { // normal query, no 'keys'
    var viewOpts = {
      descending : opts.descending
    };
    if (opts.start_key) {
        opts.startkey = opts.start_key;
    }
    if (opts.end_key) {
        opts.endkey = opts.end_key;
    }
    if (typeof opts.startkey !== 'undefined') {
      viewOpts.startkey = opts.descending ?
        toIndexableString([opts.startkey, {}]) :
        toIndexableString([opts.startkey]);
    }
    if (typeof opts.endkey !== 'undefined') {
      var inclusiveEnd = opts.inclusive_end !== false;
      if (opts.descending) {
        inclusiveEnd = !inclusiveEnd;
      }

      viewOpts.endkey = toIndexableString(
        inclusiveEnd ? [opts.endkey, {}] : [opts.endkey]);
    }
    if (typeof opts.key !== 'undefined') {
      var keyStart = toIndexableString([opts.key]);
      var keyEnd = toIndexableString([opts.key, {}]);
      if (viewOpts.descending) {
        viewOpts.endkey = keyStart;
        viewOpts.startkey = keyEnd;
      } else {
        viewOpts.startkey = keyStart;
        viewOpts.endkey = keyEnd;
      }
    }
    if (!shouldReduce) {
      if (typeof opts.limit === 'number') {
        viewOpts.limit = opts.limit;
      }
      viewOpts.skip = skip;
    }
    return fetchFromView(viewOpts).then(onMapResultsReady);
  }
}

function httpViewCleanup(db) {
  return db.request({
    method: 'POST',
    url: '_view_cleanup'
  });
}

function localViewCleanup(db) {
  return db.get('_local/mrviews').then(function (metaDoc) {
    var docsToViews = {};
    Object.keys(metaDoc.views).forEach(function (fullViewName) {
      var parts = parseViewName(fullViewName);
      var designDocName = '_design/' + parts[0];
      var viewName = parts[1];
      docsToViews[designDocName] = docsToViews[designDocName] || {};
      docsToViews[designDocName][viewName] = true;
    });
    var opts = {
      keys : Object.keys(docsToViews),
      include_docs : true
    };
    return db.allDocs(opts).then(function (res) {
      var viewsToStatus = {};
      res.rows.forEach(function (row) {
        var ddocName = row.key.substring(8);
        Object.keys(docsToViews[row.key]).forEach(function (viewName) {
          var fullViewName = ddocName + '/' + viewName;
          /* istanbul ignore if */
          if (!metaDoc.views[fullViewName]) {
            // new format, without slashes, to support PouchDB 2.2.0
            // migration test in pouchdb's browser.migration.js verifies this
            fullViewName = viewName;
          }
          var viewDBNames = Object.keys(metaDoc.views[fullViewName]);
          // design doc deleted, or view function nonexistent
          var statusIsGood = row.doc && row.doc.views &&
            row.doc.views[viewName];
          viewDBNames.forEach(function (viewDBName) {
            viewsToStatus[viewDBName] =
              viewsToStatus[viewDBName] || statusIsGood;
          });
        });
      });
      var dbsToDelete = Object.keys(viewsToStatus).filter(
        function (viewDBName) { return !viewsToStatus[viewDBName]; });
      var destroyPromises = dbsToDelete.map(function (viewDBName) {
        return sequentialize(getQueue(viewDBName), function () {
          return new db.constructor(viewDBName, db.__opts).destroy();
        })();
      });
      return PouchPromise.all(destroyPromises).then(function () {
        return {ok: true};
      });
    });
  }, defaultsTo({ok: true}));
}

var viewCleanup = callbackify(function () {
  var db = this;
  if (db.type() === 'http') {
    return httpViewCleanup(db);
  }
  /* istanbul ignore next */
  if (typeof db._viewCleanup === 'function') {
    return customViewCleanup(db);
  }
  return localViewCleanup(db);
});

function queryPromised(db, fun, opts) {
  if (db.type() === 'http') {
    return httpQuery(db, fun, opts);
  }

  /* istanbul ignore next */
  if (typeof db._query === 'function') {
    return customQuery(db, fun, opts);
  }

  if (typeof fun !== 'string') {
    // temp_view
    checkQueryParseError(opts, fun);

    var createViewOpts = {
      db : db,
      viewName : 'temp_view/temp_view',
      map : fun.map,
      reduce : fun.reduce,
      temporary : true
    };
    tempViewQueue.add(function () {
      return createView(createViewOpts).then(function (view) {
        function cleanup() {
          return view.db.destroy();
        }
        return fin(updateView(view).then(function () {
          return queryView(view, opts);
        }), cleanup);
      });
    });
    return tempViewQueue.finish();
  } else {
    // persistent view
    var fullViewName = fun;
    var parts = parseViewName(fullViewName);
    var designDocName = parts[0];
    var viewName = parts[1];
    return db.get('_design/' + designDocName).then(function (doc) {
      var fun = doc.views && doc.views[viewName];

      if (!fun || typeof fun.map !== 'string') {
        throw new NotFoundError('ddoc ' + designDocName +
        ' has no view named ' + viewName);
      }
      checkQueryParseError(opts, fun);

      var createViewOpts = {
        db : db,
        viewName : fullViewName,
        map : fun.map,
        reduce : fun.reduce
      };
      return createView(createViewOpts).then(function (view) {
        if (opts.stale === 'ok' || opts.stale === 'update_after') {
          if (opts.stale === 'update_after') {
            process.nextTick(function () {
              updateView(view);
            });
          }
          return queryView(view, opts);
        } else { // stale not ok
          return updateView(view).then(function () {
            return queryView(view, opts);
          });
        }
      });
    });
  }
}

var query = function (fun, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  opts = opts ? coerceOptions(opts) : {};

  if (typeof fun === 'function') {
    fun = {map : fun};
  }

  var db = this;
  var promise = PouchPromise.resolve().then(function () {
    return queryPromised(db, fun, opts);
  });
  promisedCallback(promise, callback);
  return promise;
};


var mapreduce = {
  query: query,
  viewCleanup: viewCleanup
};

function isGenOne$1(rev) {
  return /^1-/.test(rev);
}

function fileHasChanged(localDoc, remoteDoc, filename) {
  return !localDoc._attachments ||
         !localDoc._attachments[filename] ||
         localDoc._attachments[filename].digest !== remoteDoc._attachments[filename].digest;
}

function getDocAttachments(db, doc) {
  var filenames = Object.keys(doc._attachments);
  return PouchPromise.all(filenames.map(function (filename) {
    return db.getAttachment(doc._id, filename, {rev: doc._rev});
  }));
}

function getDocAttachmentsFromTargetOrSource(target, src, doc) {
  var doCheckForLocalAttachments = src.type() === 'http' && target.type() !== 'http';
  var filenames = Object.keys(doc._attachments);

  if (!doCheckForLocalAttachments) {
    return getDocAttachments(src, doc);
  }

  return target.get(doc._id).then(function (localDoc) {
    return PouchPromise.all(filenames.map(function (filename) {
      if (fileHasChanged(localDoc, doc, filename)) {
        return src.getAttachment(doc._id, filename);
      }

      return target.getAttachment(localDoc._id, filename);
    }));
  }).catch(function (error) {
    /* istanbul ignore if */
    if (error.status !== 404) {
      throw error;
    }

    return getDocAttachments(src, doc);
  });
}

function createBulkGetOpts(diffs) {
  var requests = [];
  Object.keys(diffs).forEach(function (id) {
    var missingRevs = diffs[id].missing;
    missingRevs.forEach(function (missingRev) {
      requests.push({
        id: id,
        rev: missingRev
      });
    });
  });

  return {
    docs: requests,
    revs: true
  };
}

//
// Fetch all the documents from the src as described in the "diffs",
// which is a mapping of docs IDs to revisions. If the state ever
// changes to "cancelled", then the returned promise will be rejected.
// Else it will be resolved with a list of fetched documents.
//
function getDocs(src, target, diffs, state) {
  diffs = clone(diffs); // we do not need to modify this

  var resultDocs = [],
      ok = true;

  function getAllDocs() {

    var bulkGetOpts = createBulkGetOpts(diffs);

    if (!bulkGetOpts.docs.length) { // optimization: skip empty requests
      return;
    }

    return src.bulkGet(bulkGetOpts).then(function (bulkGetResponse) {
      /* istanbul ignore if */
      if (state.cancelled) {
        throw new Error('cancelled');
      }
      return PouchPromise.all(bulkGetResponse.results.map(function (bulkGetInfo) {
        return PouchPromise.all(bulkGetInfo.docs.map(function (doc) {
          var remoteDoc = doc.ok;

          if (doc.error) {
            // when AUTO_COMPACTION is set, docs can be returned which look
            // like this: {"missing":"1-7c3ac256b693c462af8442f992b83696"}
            ok = false;
          }

          if (!remoteDoc || !remoteDoc._attachments) {
            return remoteDoc;
          }

          return getDocAttachmentsFromTargetOrSource(target, src, remoteDoc).then(function (attachments) {
            var filenames = Object.keys(remoteDoc._attachments);
            attachments.forEach(function (attachment, i) {
              var att = remoteDoc._attachments[filenames[i]];
              delete att.stub;
              delete att.length;
              att.data = attachment;
            });

            return remoteDoc;
          });
        }));
      }))

      .then(function (results) {
        resultDocs = resultDocs.concat(flatten(results).filter(Boolean));
      });
    });
  }

  function hasAttachments(doc) {
    return doc._attachments && Object.keys(doc._attachments).length > 0;
  }

  function hasConflicts(doc) {
    return doc._conflicts && doc._conflicts.length > 0;
  }

  function fetchRevisionOneDocs(ids) {
    // Optimization: fetch gen-1 docs and attachments in
    // a single request using _all_docs
    return src.allDocs({
      keys: ids,
      include_docs: true,
      conflicts: true
    }).then(function (res) {
      if (state.cancelled) {
        throw new Error('cancelled');
      }
      res.rows.forEach(function (row) {
        if (row.deleted || !row.doc || !isGenOne$1(row.value.rev) ||
            hasAttachments(row.doc) || hasConflicts(row.doc)) {
          // if any of these conditions apply, we need to fetch using get()
          return;
        }

        // strip _conflicts array to appease CSG (#5793)
        /* istanbul ignore if */
        if (row.doc._conflicts) {
          delete row.doc._conflicts;
        }

        // the doc we got back from allDocs() is sufficient
        resultDocs.push(row.doc);
        delete diffs[row.id];
      });
    });
  }

  function getRevisionOneDocs() {
    // filter out the generation 1 docs and get them
    // leaving the non-generation one docs to be got otherwise
    var ids = Object.keys(diffs).filter(function (id) {
      var missing = diffs[id].missing;
      return missing.length === 1 && isGenOne$1(missing[0]);
    });
    if (ids.length > 0) {
      return fetchRevisionOneDocs(ids);
    }
  }

  function returnResult() {
    return { ok:ok, docs:resultDocs };
  }

  return PouchPromise.resolve()
    .then(getRevisionOneDocs)
    .then(getAllDocs)
    .then(returnResult);
}

var CHECKPOINT_VERSION = 1;
var REPLICATOR = "pouchdb";
// This is an arbitrary number to limit the
// amount of replication history we save in the checkpoint.
// If we save too much, the checkpoing docs will become very big,
// if we save fewer, we'll run a greater risk of having to
// read all the changes from 0 when checkpoint PUTs fail
// CouchDB 2.0 has a more involved history pruning,
// but let's go for the simple version for now.
var CHECKPOINT_HISTORY_SIZE = 5;
var LOWEST_SEQ = 0;

function updateCheckpoint(db, id, checkpoint, session, returnValue) {
  return db.get(id).catch(function (err) {
    if (err.status === 404) {
      if (db.type() === 'http') {
        explainError(
          404, 'PouchDB is just checking if a remote checkpoint exists.'
        );
      }
      return {
        session_id: session,
        _id: id,
        history: [],
        replicator: REPLICATOR,
        version: CHECKPOINT_VERSION
      };
    }
    throw err;
  }).then(function (doc) {
    if (returnValue.cancelled) {
      return;
    }

    // if the checkpoint has not changed, do not update
    if (doc.last_seq === checkpoint) {
      return;
    }

    // Filter out current entry for this replication
    doc.history = (doc.history || []).filter(function (item) {
      return item.session_id !== session;
    });

    // Add the latest checkpoint to history
    doc.history.unshift({
      last_seq: checkpoint,
      session_id: session
    });

    // Just take the last pieces in history, to
    // avoid really big checkpoint docs.
    // see comment on history size above
    doc.history = doc.history.slice(0, CHECKPOINT_HISTORY_SIZE);

    doc.version = CHECKPOINT_VERSION;
    doc.replicator = REPLICATOR;

    doc.session_id = session;
    doc.last_seq = checkpoint;

    return db.put(doc).catch(function (err) {
      if (err.status === 409) {
        // retry; someone is trying to write a checkpoint simultaneously
        return updateCheckpoint(db, id, checkpoint, session, returnValue);
      }
      throw err;
    });
  });
}

function Checkpointer(src, target, id, returnValue) {
  this.src = src;
  this.target = target;
  this.id = id;
  this.returnValue = returnValue;
}

Checkpointer.prototype.writeCheckpoint = function (checkpoint, session) {
  var self = this;
  return this.updateTarget(checkpoint, session).then(function () {
    return self.updateSource(checkpoint, session);
  });
};

Checkpointer.prototype.updateTarget = function (checkpoint, session) {
  return updateCheckpoint(this.target, this.id, checkpoint,
    session, this.returnValue);
};

Checkpointer.prototype.updateSource = function (checkpoint, session) {
  var self = this;
  if (this.readOnlySource) {
    return PouchPromise.resolve(true);
  }
  return updateCheckpoint(this.src, this.id, checkpoint,
    session, this.returnValue)
    .catch(function (err) {
      if (isForbiddenError(err)) {
        self.readOnlySource = true;
        return true;
      }
      throw err;
    });
};

var comparisons = {
  "undefined": function (targetDoc, sourceDoc) {
    // This is the previous comparison function
    if (collate(targetDoc.last_seq, sourceDoc.last_seq) === 0) {
      return sourceDoc.last_seq;
    }
    /* istanbul ignore next */
    return 0;
  },
  "1": function (targetDoc, sourceDoc) {
    // This is the comparison function ported from CouchDB
    return compareReplicationLogs(sourceDoc, targetDoc).last_seq;
  }
};

Checkpointer.prototype.getCheckpoint = function () {
  var self = this;
  return self.target.get(self.id).then(function (targetDoc) {
    if (self.readOnlySource) {
      return PouchPromise.resolve(targetDoc.last_seq);
    }

    return self.src.get(self.id).then(function (sourceDoc) {
      // Since we can't migrate an old version doc to a new one
      // (no session id), we just go with the lowest seq in this case
      /* istanbul ignore if */
      if (targetDoc.version !== sourceDoc.version) {
        return LOWEST_SEQ;
      }

      var version;
      if (targetDoc.version) {
        version = targetDoc.version.toString();
      } else {
        version = "undefined";
      }

      if (version in comparisons) {
        return comparisons[version](targetDoc, sourceDoc);
      }
      /* istanbul ignore next */
      return LOWEST_SEQ;
    }, function (err) {
      if (err.status === 404 && targetDoc.last_seq) {
        return self.src.put({
          _id: self.id,
          last_seq: LOWEST_SEQ
        }).then(function () {
          return LOWEST_SEQ;
        }, function (err) {
          if (isForbiddenError(err)) {
            self.readOnlySource = true;
            return targetDoc.last_seq;
          }
          /* istanbul ignore next */
          return LOWEST_SEQ;
        });
      }
      throw err;
    });
  }).catch(function (err) {
    if (err.status !== 404) {
      throw err;
    }
    return LOWEST_SEQ;
  });
};
// This checkpoint comparison is ported from CouchDBs source
// they come from here:
// https://github.com/apache/couchdb-couch-replicator/blob/master/src/couch_replicator.erl#L863-L906

function compareReplicationLogs(srcDoc, tgtDoc) {
  if (srcDoc.session_id === tgtDoc.session_id) {
    return {
      last_seq: srcDoc.last_seq,
      history: srcDoc.history
    };
  }

  return compareReplicationHistory(srcDoc.history, tgtDoc.history);
}

function compareReplicationHistory(sourceHistory, targetHistory) {
  // the erlang loop via function arguments is not so easy to repeat in JS
  // therefore, doing this as recursion
  var S = sourceHistory[0];
  var sourceRest = sourceHistory.slice(1);
  var T = targetHistory[0];
  var targetRest = targetHistory.slice(1);

  if (!S || targetHistory.length === 0) {
    return {
      last_seq: LOWEST_SEQ,
      history: []
    };
  }

  var sourceId = S.session_id;
  /* istanbul ignore if */
  if (hasSessionId(sourceId, targetHistory)) {
    return {
      last_seq: S.last_seq,
      history: sourceHistory
    };
  }

  var targetId = T.session_id;
  if (hasSessionId(targetId, sourceRest)) {
    return {
      last_seq: T.last_seq,
      history: targetRest
    };
  }

  return compareReplicationHistory(sourceRest, targetRest);
}

function hasSessionId(sessionId, history) {
  var props = history[0];
  var rest = history.slice(1);

  if (!sessionId || history.length === 0) {
    return false;
  }

  if (sessionId === props.session_id) {
    return true;
  }

  return hasSessionId(sessionId, rest);
}

function isForbiddenError(err) {
  return typeof err.status === 'number' && Math.floor(err.status / 100) === 4;
}

var STARTING_BACK_OFF = 0;

function backOff(opts, returnValue, error, callback) {
  if (opts.retry === false) {
    returnValue.emit('error', error);
    returnValue.removeAllListeners();
    return;
  }
  if (typeof opts.back_off_function !== 'function') {
    opts.back_off_function = defaultBackOff;
  }
  returnValue.emit('requestError', error);
  if (returnValue.state === 'active' || returnValue.state === 'pending') {
    returnValue.emit('paused', error);
    returnValue.state = 'stopped';
    var backOffSet = function backoffTimeSet() {
      opts.current_back_off = STARTING_BACK_OFF;
    };
    var removeBackOffSetter = function removeBackOffTimeSet() {
      returnValue.removeListener('active', backOffSet);
    };
    returnValue.once('paused', removeBackOffSetter);
    returnValue.once('active', backOffSet);
  }

  opts.current_back_off = opts.current_back_off || STARTING_BACK_OFF;
  opts.current_back_off = opts.back_off_function(opts.current_back_off);
  setTimeout(callback, opts.current_back_off);
}

function sortObjectPropertiesByKey(queryParams) {
  return Object.keys(queryParams).sort(collate).reduce(function (result, key) {
    result[key] = queryParams[key];
    return result;
  }, {});
}

// Generate a unique id particular to this replication.
// Not guaranteed to align perfectly with CouchDB's rep ids.
function generateReplicationId(src, target, opts) {
  var docIds = opts.doc_ids ? opts.doc_ids.sort(collate) : '';
  var filterFun = opts.filter ? opts.filter.toString() : '';
  var queryParams = '';
  var filterViewName =  '';

  if (opts.filter && opts.query_params) {
    queryParams = JSON.stringify(sortObjectPropertiesByKey(opts.query_params));
  }

  if (opts.filter && opts.filter === '_view') {
    filterViewName = opts.view.toString();
  }

  return PouchPromise.all([src.id(), target.id()]).then(function (res) {
    var queryData = res[0] + res[1] + filterFun + filterViewName +
      queryParams + docIds;
    return new PouchPromise(function (resolve) {
      binaryMd5(queryData, resolve);
    });
  }).then(function (md5sum) {
    // can't use straight-up md5 alphabet, because
    // the char '/' is interpreted as being for attachments,
    // and + is also not url-safe
    md5sum = md5sum.replace(/\//g, '.').replace(/\+/g, '_');
    return '_local/' + md5sum;
  });
}

function replicate$1(src, target, opts, returnValue, result) {
  var batches = [];               // list of batches to be processed
  var currentBatch;               // the batch currently being processed
  var pendingBatch = {
    seq: 0,
    changes: [],
    docs: []
  }; // next batch, not yet ready to be processed
  var writingCheckpoint = false;  // true while checkpoint is being written
  var changesCompleted = false;   // true when all changes received
  var replicationCompleted = false; // true when replication has completed
  var last_seq = 0;
  var continuous = opts.continuous || opts.live || false;
  var batch_size = opts.batch_size || 100;
  var batches_limit = opts.batches_limit || 10;
  var changesPending = false;     // true while src.changes is running
  var doc_ids = opts.doc_ids;
  var repId;
  var checkpointer;
  var changedDocs = [];
  // Like couchdb, every replication gets a unique session id
  var session = uuid();

  result = result || {
    ok: true,
    start_time: new Date(),
    docs_read: 0,
    docs_written: 0,
    doc_write_failures: 0,
    errors: []
  };

  var changesOpts = {};
  returnValue.ready(src, target);

  function initCheckpointer() {
    if (checkpointer) {
      return PouchPromise.resolve();
    }
    return generateReplicationId(src, target, opts).then(function (res) {
      repId = res;
      checkpointer = new Checkpointer(src, target, repId, returnValue);
    });
  }

  function writeDocs() {
    changedDocs = [];

    if (currentBatch.docs.length === 0) {
      return;
    }
    var docs = currentBatch.docs;
    var bulkOpts = {timeout: opts.timeout};
    return target.bulkDocs({docs: docs, new_edits: false}, bulkOpts).then(function (res) {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }

      // `res` doesn't include full documents (which live in `docs`), so we create a map of 
      // (id -> error), and check for errors while iterating over `docs`
      var errorsById = Object.create(null);
      res.forEach(function (res) {
        if (res.error) {
          errorsById[res.id] = res;
        }
      });

      var errorsNo = Object.keys(errorsById).length;
      result.doc_write_failures += errorsNo;
      result.docs_written += docs.length - errorsNo;

      docs.forEach(function (doc) {
        var error = errorsById[doc._id];
        if (error) {
          result.errors.push(error);
          if (error.name === 'unauthorized' || error.name === 'forbidden') {
            returnValue.emit('denied', clone(error));
          } else {
            throw error;
          }
        } else {
          changedDocs.push(doc);
        }
      });

    }, function (err) {
      result.doc_write_failures += docs.length;
      throw err;
    });
  }

  function finishBatch() {
    if (currentBatch.error) {
      throw new Error('There was a problem getting docs.');
    }
    result.last_seq = last_seq = currentBatch.seq;
    var outResult = clone(result);
    if (changedDocs.length) {
      outResult.docs = changedDocs;
      returnValue.emit('change', outResult);
    }
    writingCheckpoint = true;
    return checkpointer.writeCheckpoint(currentBatch.seq,
        session).then(function () {
      writingCheckpoint = false;
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      currentBatch = undefined;
      getChanges();
    }).catch(function (err) {
      onCheckpointError(err);
      throw err;
    });
  }

  function getDiffs() {
    var diff = {};
    currentBatch.changes.forEach(function (change) {
      // Couchbase Sync Gateway emits these, but we can ignore them
      /* istanbul ignore if */
      if (change.id === "_user/") {
        return;
      }
      diff[change.id] = change.changes.map(function (x) {
        return x.rev;
      });
    });
    return target.revsDiff(diff).then(function (diffs) {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        throw new Error('cancelled');
      }
      // currentBatch.diffs elements are deleted as the documents are written
      currentBatch.diffs = diffs;
    });
  }

  function getBatchDocs() {
    return getDocs(src, target, currentBatch.diffs, returnValue).then(function (got) {
      currentBatch.error = !got.ok;
      got.docs.forEach(function (doc) {
        delete currentBatch.diffs[doc._id];
        result.docs_read++;
        currentBatch.docs.push(doc);
      });
    });
  }

  function startNextBatch() {
    if (returnValue.cancelled || currentBatch) {
      return;
    }
    if (batches.length === 0) {
      processPendingBatch(true);
      return;
    }
    currentBatch = batches.shift();
    getDiffs()
      .then(getBatchDocs)
      .then(writeDocs)
      .then(finishBatch)
      .then(startNextBatch)
      .catch(function (err) {
        abortReplication('batch processing terminated with error', err);
      });
  }


  function processPendingBatch(immediate) {
    if (pendingBatch.changes.length === 0) {
      if (batches.length === 0 && !currentBatch) {
        if ((continuous && changesOpts.live) || changesCompleted) {
          returnValue.state = 'pending';
          returnValue.emit('paused');
        }
        if (changesCompleted) {
          completeReplication();
        }
      }
      return;
    }
    if (
      immediate ||
      changesCompleted ||
      pendingBatch.changes.length >= batch_size
    ) {
      batches.push(pendingBatch);
      pendingBatch = {
        seq: 0,
        changes: [],
        docs: []
      };
      if (returnValue.state === 'pending' || returnValue.state === 'stopped') {
        returnValue.state = 'active';
        returnValue.emit('active');
      }
      startNextBatch();
    }
  }


  function abortReplication(reason, err) {
    if (replicationCompleted) {
      return;
    }
    if (!err.message) {
      err.message = reason;
    }
    result.ok = false;
    result.status = 'aborting';
    batches = [];
    pendingBatch = {
      seq: 0,
      changes: [],
      docs: []
    };
    completeReplication(err);
  }


  function completeReplication(fatalError) {
    if (replicationCompleted) {
      return;
    }
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      result.status = 'cancelled';
      if (writingCheckpoint) {
        return;
      }
    }
    result.status = result.status || 'complete';
    result.end_time = new Date();
    result.last_seq = last_seq;
    replicationCompleted = true;

    if (fatalError) {
      fatalError.result = result;

      if (fatalError.name === 'unauthorized' || fatalError.name === 'forbidden') {
        returnValue.emit('error', fatalError);
        returnValue.removeAllListeners();
      } else {
        backOff(opts, returnValue, fatalError, function () {
          replicate$1(src, target, opts, returnValue);
        });
      }
    } else {
      returnValue.emit('complete', result);
      returnValue.removeAllListeners();
    }
  }


  function onChange(change) {
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    var filter = filterChange(opts)(change);
    if (!filter) {
      return;
    }
    pendingBatch.seq = change.seq;
    pendingBatch.changes.push(change);
    processPendingBatch(batches.length === 0 && changesOpts.live);
  }


  function onChangesComplete(changes) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }

    // if no results were returned then we're done,
    // else fetch more
    if (changes.results.length > 0) {
      changesOpts.since = changes.last_seq;
      getChanges();
      processPendingBatch(true);
    } else {

      var complete = function () {
        if (continuous) {
          changesOpts.live = true;
          getChanges();
        } else {
          changesCompleted = true;
        }
        processPendingBatch(true);
      };

      // update the checkpoint so we start from the right seq next time
      if (!currentBatch && changes.results.length === 0) {
        writingCheckpoint = true;
        checkpointer.writeCheckpoint(changes.last_seq,
            session).then(function () {
          writingCheckpoint = false;
          result.last_seq = last_seq = changes.last_seq;
          complete();
        })
        .catch(onCheckpointError);
      } else {
        complete();
      }
    }
  }


  function onChangesError(err) {
    changesPending = false;
    /* istanbul ignore if */
    if (returnValue.cancelled) {
      return completeReplication();
    }
    abortReplication('changes rejected', err);
  }


  function getChanges() {
    if (!(
      !changesPending &&
      !changesCompleted &&
      batches.length < batches_limit
      )) {
      return;
    }
    changesPending = true;
    function abortChanges() {
      changes.cancel();
    }
    function removeListener() {
      returnValue.removeListener('cancel', abortChanges);
    }

    if (returnValue._changes) { // remove old changes() and listeners
      returnValue.removeListener('cancel', returnValue._abortChanges);
      returnValue._changes.cancel();
    }
    returnValue.once('cancel', abortChanges);

    var changes = src.changes(changesOpts)
      .on('change', onChange);
    changes.then(removeListener, removeListener);
    changes.then(onChangesComplete)
      .catch(onChangesError);

    if (opts.retry) {
      // save for later so we can cancel if necessary
      returnValue._changes = changes;
      returnValue._abortChanges = abortChanges;
    }
  }


  function startChanges() {
    initCheckpointer().then(function () {
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        return;
      }
      return checkpointer.getCheckpoint().then(function (checkpoint) {
        last_seq = checkpoint;
        changesOpts = {
          since: last_seq,
          limit: batch_size,
          batch_size: batch_size,
          style: 'all_docs',
          doc_ids: doc_ids,
          return_docs: true // required so we know when we're done
        };
        if (opts.filter) {
          if (typeof opts.filter !== 'string') {
            // required for the client-side filter in onChange
            changesOpts.include_docs = true;
          } else { // ddoc filter
            changesOpts.filter = opts.filter;
          }
        }
        if ('heartbeat' in opts) {
          changesOpts.heartbeat = opts.heartbeat;
        }
        if ('timeout' in opts) {
          changesOpts.timeout = opts.timeout;
        }
        if (opts.query_params) {
          changesOpts.query_params = opts.query_params;
        }
        if (opts.view) {
          changesOpts.view = opts.view;
        }
        getChanges();
      });
    }).catch(function (err) {
      abortReplication('getCheckpoint rejected with ', err);
    });
  }

  /* istanbul ignore next */
  function onCheckpointError(err) {
    writingCheckpoint = false;
    abortReplication('writeCheckpoint completed with error', err);
  }

  /* istanbul ignore if */
  if (returnValue.cancelled) { // cancelled immediately
    completeReplication();
    return;
  }

  if (!returnValue._addedListeners) {
    returnValue.once('cancel', completeReplication);

    if (typeof opts.complete === 'function') {
      returnValue.once('error', opts.complete);
      returnValue.once('complete', function (result) {
        opts.complete(null, result);
      });
    }
    returnValue._addedListeners = true;
  }

  if (typeof opts.since === 'undefined') {
    startChanges();
  } else {
    initCheckpointer().then(function () {
      writingCheckpoint = true;
      return checkpointer.writeCheckpoint(opts.since, session);
    }).then(function () {
      writingCheckpoint = false;
      /* istanbul ignore if */
      if (returnValue.cancelled) {
        completeReplication();
        return;
      }
      last_seq = opts.since;
      startChanges();
    }).catch(onCheckpointError);
  }
}

// We create a basic promise so the caller can cancel the replication possibly
// before we have actually started listening to changes etc
inherits(Replication, events.EventEmitter);
function Replication() {
  events.EventEmitter.call(this);
  this.cancelled = false;
  this.state = 'pending';
  var self = this;
  var promise = new PouchPromise(function (fulfill, reject) {
    self.once('complete', fulfill);
    self.once('error', reject);
  });
  self.then = function (resolve, reject) {
    return promise.then(resolve, reject);
  };
  self.catch = function (reject) {
    return promise.catch(reject);
  };
  // As we allow error handling via "error" event as well,
  // put a stub in here so that rejecting never throws UnhandledError.
  self.catch(function () {});
}

Replication.prototype.cancel = function () {
  this.cancelled = true;
  this.state = 'cancelled';
  this.emit('cancel');
};

Replication.prototype.ready = function (src, target) {
  var self = this;
  if (self._readyCalled) {
    return;
  }
  self._readyCalled = true;

  function onDestroy() {
    self.cancel();
  }
  src.once('destroyed', onDestroy);
  target.once('destroyed', onDestroy);
  function cleanup() {
    src.removeListener('destroyed', onDestroy);
    target.removeListener('destroyed', onDestroy);
  }
  self.once('complete', cleanup);
};

function toPouch(db, opts) {
  var PouchConstructor = opts.PouchConstructor;
  if (typeof db === 'string') {
    return new PouchConstructor(db, opts);
  } else {
    return db;
  }
}

function replicate(src, target, opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }

  if (opts.doc_ids && !Array.isArray(opts.doc_ids)) {
    throw createError(BAD_REQUEST,
                       "`doc_ids` filter parameter is not a list.");
  }

  opts.complete = callback;
  opts = clone(opts);
  opts.continuous = opts.continuous || opts.live;
  opts.retry = ('retry' in opts) ? opts.retry : false;
  /*jshint validthis:true */
  opts.PouchConstructor = opts.PouchConstructor || this;
  var replicateRet = new Replication(opts);
  var srcPouch = toPouch(src, opts);
  var targetPouch = toPouch(target, opts);
  replicate$1(srcPouch, targetPouch, opts, replicateRet);
  return replicateRet;
}

inherits(Sync, events.EventEmitter);
function sync(src, target, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  if (typeof opts === 'undefined') {
    opts = {};
  }
  opts = clone(opts);
  /*jshint validthis:true */
  opts.PouchConstructor = opts.PouchConstructor || this;
  src = toPouch(src, opts);
  target = toPouch(target, opts);
  return new Sync(src, target, opts, callback);
}

function Sync(src, target, opts, callback) {
  var self = this;
  this.canceled = false;

  var optsPush = opts.push ? extend$1({}, opts, opts.push) : opts;
  var optsPull = opts.pull ? extend$1({}, opts, opts.pull) : opts;

  this.push = replicate(src, target, optsPush);
  this.pull = replicate(target, src, optsPull);

  this.pushPaused = true;
  this.pullPaused = true;

  function pullChange(change) {
    self.emit('change', {
      direction: 'pull',
      change: change
    });
  }
  function pushChange(change) {
    self.emit('change', {
      direction: 'push',
      change: change
    });
  }
  function pushDenied(doc) {
    self.emit('denied', {
      direction: 'push',
      doc: doc
    });
  }
  function pullDenied(doc) {
    self.emit('denied', {
      direction: 'pull',
      doc: doc
    });
  }
  function pushPaused() {
    self.pushPaused = true;
    /* istanbul ignore if */
    if (self.pullPaused) {
      self.emit('paused');
    }
  }
  function pullPaused() {
    self.pullPaused = true;
    /* istanbul ignore if */
    if (self.pushPaused) {
      self.emit('paused');
    }
  }
  function pushActive() {
    self.pushPaused = false;
    /* istanbul ignore if */
    if (self.pullPaused) {
      self.emit('active', {
        direction: 'push'
      });
    }
  }
  function pullActive() {
    self.pullPaused = false;
    /* istanbul ignore if */
    if (self.pushPaused) {
      self.emit('active', {
        direction: 'pull'
      });
    }
  }

  var removed = {};

  function removeAll(type) { // type is 'push' or 'pull'
    return function (event, func) {
      var isChange = event === 'change' &&
        (func === pullChange || func === pushChange);
      var isDenied = event === 'denied' &&
        (func === pullDenied || func === pushDenied);
      var isPaused = event === 'paused' &&
        (func === pullPaused || func === pushPaused);
      var isActive = event === 'active' &&
        (func === pullActive || func === pushActive);

      if (isChange || isDenied || isPaused || isActive) {
        if (!(event in removed)) {
          removed[event] = {};
        }
        removed[event][type] = true;
        if (Object.keys(removed[event]).length === 2) {
          // both push and pull have asked to be removed
          self.removeAllListeners(event);
        }
      }
    };
  }

  if (opts.live) {
    this.push.on('complete', self.pull.cancel.bind(self.pull));
    this.pull.on('complete', self.push.cancel.bind(self.push));
  }

  function addOneListener(ee, event, listener) {
    if (ee.listeners(event).indexOf(listener) == -1) {
      ee.on(event, listener);
    }
  }

  this.on('newListener', function (event) {
    if (event === 'change') {
      addOneListener(self.pull, 'change', pullChange);
      addOneListener(self.push, 'change', pushChange);
    } else if (event === 'denied') {
      addOneListener(self.pull, 'denied', pullDenied);
      addOneListener(self.push, 'denied', pushDenied);
    } else if (event === 'active') {
      addOneListener(self.pull, 'active', pullActive);
      addOneListener(self.push, 'active', pushActive);
    } else if (event === 'paused') {
      addOneListener(self.pull, 'paused', pullPaused);
      addOneListener(self.push, 'paused', pushPaused);
    }
  });

  this.on('removeListener', function (event) {
    if (event === 'change') {
      self.pull.removeListener('change', pullChange);
      self.push.removeListener('change', pushChange);
    } else if (event === 'denied') {
      self.pull.removeListener('denied', pullDenied);
      self.push.removeListener('denied', pushDenied);
    } else if (event === 'active') {
      self.pull.removeListener('active', pullActive);
      self.push.removeListener('active', pushActive);
    } else if (event === 'paused') {
      self.pull.removeListener('paused', pullPaused);
      self.push.removeListener('paused', pushPaused);
    }
  });

  this.pull.on('removeListener', removeAll('pull'));
  this.push.on('removeListener', removeAll('push'));

  var promise = PouchPromise.all([
    this.push,
    this.pull
  ]).then(function (resp) {
    var out = {
      push: resp[0],
      pull: resp[1]
    };
    self.emit('complete', out);
    if (callback) {
      callback(null, out);
    }
    self.removeAllListeners();
    return out;
  }, function (err) {
    self.cancel();
    if (callback) {
      // if there's a callback, then the callback can receive
      // the error event
      callback(err);
    } else {
      // if there's no callback, then we're safe to emit an error
      // event, which would otherwise throw an unhandled error
      // due to 'error' being a special event in EventEmitters
      self.emit('error', err);
    }
    self.removeAllListeners();
    if (callback) {
      // no sense throwing if we're already emitting an 'error' event
      throw err;
    }
  });

  this.then = function (success, err) {
    return promise.then(success, err);
  };

  this.catch = function (err) {
    return promise.catch(err);
  };
}

Sync.prototype.cancel = function () {
  if (!this.canceled) {
    this.canceled = true;
    this.push.cancel();
    this.pull.cancel();
  }
};

function replication(PouchDB) {
  PouchDB.replicate = replicate;
  PouchDB.sync = sync;

  Object.defineProperty(PouchDB.prototype, 'replicate', {
    get: function () {
      var self = this;
      return {
        from: function (other, opts, callback) {
          return self.constructor.replicate(other, self, opts, callback);
        },
        to: function (other, opts, callback) {
          return self.constructor.replicate(self, other, opts, callback);
        }
      };
    }
  });

  PouchDB.prototype.sync = function (dbName, opts, callback) {
    return this.constructor.sync(this, dbName, opts, callback);
  };
}

PouchDB.plugin(IDBPouch)
  .plugin(WebSqlPouch)
  .plugin(HttpPouch$1)
  .plugin(mapreduce)
  .plugin(replication);

// Pull from src because pouchdb-node/pouchdb-browser themselves
// are aggressively optimized and jsnext:main would normally give us this
// aggressive bundle.

module.exports = PouchDB;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":10,"argsarray":1,"debug":2,"es6-promise-pool":4,"events":5,"inherits":7,"lie":8,"scope-eval":11,"spark-md5":12,"vuvuzela":13}]},{},[14])(14)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXJnc2FycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RlYnVnL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCJub2RlX21vZHVsZXMvZXM2LXByb21pc2UtcG9vbC9lczYtcHJvbWlzZS1wb29sLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvaW1tZWRpYXRlL2xpYi9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvbGllL2xpYi9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9zY29wZS1ldmFsL3Njb3BlX2V2YWwuanMiLCJub2RlX21vZHVsZXMvc3BhcmstbWQ1L3NwYXJrLW1kNS5qcyIsIm5vZGVfbW9kdWxlcy92dXZ1emVsYS9pbmRleC5qcyIsInBhY2thZ2VzL25vZGVfbW9kdWxlcy9wb3VjaGRiL2xpYi9pbmRleC1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFyZ3NBcnJheTtcblxuZnVuY3Rpb24gYXJnc0FycmF5KGZ1bikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChsZW4pIHtcbiAgICAgIHZhciBhcmdzID0gW107XG4gICAgICB2YXIgaSA9IC0xO1xuICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bi5jYWxsKHRoaXMsIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZnVuLmNhbGwodGhpcywgW10pO1xuICAgIH1cbiAgfTtcbn0iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG4gIHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoJ2VudicgaW4gKHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJyA/IHt9IDogcHJvY2VzcykpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cbiAgXG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1Zy5kZWJ1ZyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZ1xuICAgIGFyZ3MgPSBleHBvcnRzLmZvcm1hdEFyZ3MuYXBwbHkoc2VsZiwgYXJncyk7XG5cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1tcXFxcXiQrPy4oKXxbXFxde31dL2csICdcXFxcJCYnKS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoW10sIGZhY3RvcnkpXHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpXHJcbiAgfSBlbHNlIHtcclxuICAgIHJvb3QuUHJvbWlzZVBvb2wgPSBmYWN0b3J5KClcclxuICAgIC8vIExlZ2FjeSBBUElcclxuICAgIHJvb3QucHJvbWlzZVBvb2wgPSByb290LlByb21pc2VQb29sXHJcbiAgfVxyXG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XHJcbiAgJ3VzZSBzdHJpY3QnXHJcblxyXG4gIHZhciBFdmVudFRhcmdldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9XHJcbiAgfVxyXG5cclxuICBFdmVudFRhcmdldC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgdGhpcy5fbGlzdGVuZXJzW3R5cGVdID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdIHx8IFtdXHJcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW3R5cGVdLmluZGV4T2YobGlzdGVuZXIpIDwgMCkge1xyXG4gICAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0ucHVzaChsaXN0ZW5lcilcclxuICAgIH1cclxuICB9XHJcblxyXG4gIEV2ZW50VGFyZ2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XHJcbiAgICBpZiAodGhpcy5fbGlzdGVuZXJzW3R5cGVdKSB7XHJcbiAgICAgIHZhciBwID0gdGhpcy5fbGlzdGVuZXJzW3R5cGVdLmluZGV4T2YobGlzdGVuZXIpXHJcbiAgICAgIGlmIChwID49IDApIHtcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbdHlwZV0uc3BsaWNlKHAsIDEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIEV2ZW50VGFyZ2V0LnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgaWYgKHRoaXMuX2xpc3RlbmVyc1tldnQudHlwZV0gJiYgdGhpcy5fbGlzdGVuZXJzW2V2dC50eXBlXS5sZW5ndGgpIHtcclxuICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldnQudHlwZV0uc2xpY2UoKVxyXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcclxuICAgICAgICBsaXN0ZW5lcnNbaV0uY2FsbCh0aGlzLCBldnQpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBpc0dlbmVyYXRvciA9IGZ1bmN0aW9uIChmdW5jKSB7XHJcbiAgICByZXR1cm4gKHR5cGVvZiBmdW5jLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgIGZ1bmMuY29uc3RydWN0b3IubmFtZSA9PT0gJ0dlbmVyYXRvckZ1bmN0aW9uJylcclxuICB9XHJcblxyXG4gIHZhciBmdW5jdGlvblRvSXRlcmF0b3IgPSBmdW5jdGlvbiAoZnVuYykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmV4dDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwcm9taXNlID0gZnVuYygpXHJcbiAgICAgICAgcmV0dXJuIHByb21pc2UgPyB7dmFsdWU6IHByb21pc2V9IDoge2RvbmU6IHRydWV9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBwcm9taXNlVG9JdGVyYXRvciA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XHJcbiAgICB2YXIgY2FsbGVkID0gZmFsc2VcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoY2FsbGVkKSB7XHJcbiAgICAgICAgICByZXR1cm4ge2RvbmU6IHRydWV9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhbGxlZCA9IHRydWVcclxuICAgICAgICByZXR1cm4ge3ZhbHVlOiBwcm9taXNlfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgdG9JdGVyYXRvciA9IGZ1bmN0aW9uIChvYmosIFByb21pc2UpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIG9ialxyXG4gICAgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIGlmICh0eXBlb2Ygb2JqLm5leHQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gb2JqXHJcbiAgICAgIH1cclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgaWYgKHR5cGVvZiBvYmoudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlVG9JdGVyYXRvcihvYmopXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHJldHVybiBpc0dlbmVyYXRvcihvYmopID8gb2JqKCkgOiBmdW5jdGlvblRvSXRlcmF0b3Iob2JqKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByb21pc2VUb0l0ZXJhdG9yKFByb21pc2UucmVzb2x2ZShvYmopKVxyXG4gIH1cclxuXHJcbiAgdmFyIFByb21pc2VQb29sRXZlbnQgPSBmdW5jdGlvbiAodGFyZ2V0LCB0eXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldFxyXG4gICAgdGhpcy50eXBlID0gdHlwZVxyXG4gICAgdGhpcy5kYXRhID0gZGF0YVxyXG4gIH1cclxuXHJcbiAgdmFyIFByb21pc2VQb29sID0gZnVuY3Rpb24gKHNvdXJjZSwgY29uY3VycmVuY3ksIG9wdGlvbnMpIHtcclxuICAgIEV2ZW50VGFyZ2V0LmNhbGwodGhpcylcclxuICAgIGlmICh0eXBlb2YgY29uY3VycmVuY3kgIT09ICdudW1iZXInIHx8XHJcbiAgICAgICAgTWF0aC5mbG9vcihjb25jdXJyZW5jeSkgIT09IGNvbmN1cnJlbmN5IHx8XHJcbiAgICAgICAgY29uY3VycmVuY3kgPCAxKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb25jdXJyZW5jeScpXHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5XHJcbiAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgdGhpcy5fb3B0aW9ucy5wcm9taXNlID0gdGhpcy5fb3B0aW9ucy5wcm9taXNlIHx8IFByb21pc2VcclxuICAgIHRoaXMuX2l0ZXJhdG9yID0gdG9JdGVyYXRvcihzb3VyY2UsIHRoaXMuX29wdGlvbnMucHJvbWlzZSlcclxuICAgIHRoaXMuX2RvbmUgPSBmYWxzZVxyXG4gICAgdGhpcy5fc2l6ZSA9IDBcclxuICAgIHRoaXMuX3Byb21pc2UgPSBudWxsXHJcbiAgICB0aGlzLl9jYWxsYmFja3MgPSBudWxsXHJcbiAgfVxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZSA9IG5ldyBFdmVudFRhcmdldCgpXHJcbiAgUHJvbWlzZVBvb2wucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJvbWlzZVBvb2xcclxuXHJcbiAgUHJvbWlzZVBvb2wucHJvdG90eXBlLmNvbmN1cnJlbmN5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICB0aGlzLl9jb25jdXJyZW5jeSA9IHZhbHVlXHJcbiAgICAgIGlmICh0aGlzLmFjdGl2ZSgpKSB7XHJcbiAgICAgICAgdGhpcy5fcHJvY2VlZCgpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9jb25jdXJyZW5jeVxyXG4gIH1cclxuXHJcbiAgUHJvbWlzZVBvb2wucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2l6ZVxyXG4gIH1cclxuXHJcbiAgUHJvbWlzZVBvb2wucHJvdG90eXBlLmFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiAhIXRoaXMuX3Byb21pc2VcclxuICB9XHJcblxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZS5wcm9taXNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2VcclxuICB9XHJcblxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0aGF0ID0gdGhpc1xyXG4gICAgdmFyIFByb21pc2UgPSB0aGlzLl9vcHRpb25zLnByb21pc2VcclxuICAgIHRoaXMuX3Byb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgIHRoYXQuX2NhbGxiYWNrcyA9IHtcclxuICAgICAgICByZWplY3Q6IHJlamVjdCxcclxuICAgICAgICByZXNvbHZlOiByZXNvbHZlXHJcbiAgICAgIH1cclxuICAgICAgdGhhdC5fcHJvY2VlZCgpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHRoaXMuX3Byb21pc2VcclxuICB9XHJcblxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZS5fZmlyZUV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgUHJvbWlzZVBvb2xFdmVudCh0aGlzLCB0eXBlLCBkYXRhKSlcclxuICB9XHJcblxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZS5fc2V0dGxlID0gZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgdGhpcy5fY2FsbGJhY2tzLnJlamVjdChlcnJvcilcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX2NhbGxiYWNrcy5yZXNvbHZlKClcclxuICAgIH1cclxuICAgIHRoaXMuX3Byb21pc2UgPSBudWxsXHJcbiAgICB0aGlzLl9jYWxsYmFja3MgPSBudWxsXHJcbiAgfVxyXG5cclxuICBQcm9taXNlUG9vbC5wcm90b3R5cGUuX29uUG9vbGVkUHJvbWlzZUZ1bGZpbGxlZCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZXN1bHQpIHtcclxuICAgIHRoaXMuX3NpemUtLVxyXG4gICAgaWYgKHRoaXMuYWN0aXZlKCkpIHtcclxuICAgICAgdGhpcy5fZmlyZUV2ZW50KCdmdWxmaWxsZWQnLCB7XHJcbiAgICAgICAgcHJvbWlzZTogcHJvbWlzZSxcclxuICAgICAgICByZXN1bHQ6IHJlc3VsdFxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLl9wcm9jZWVkKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIFByb21pc2VQb29sLnByb3RvdHlwZS5fb25Qb29sZWRQcm9taXNlUmVqZWN0ZWQgPSBmdW5jdGlvbiAocHJvbWlzZSwgZXJyb3IpIHtcclxuICAgIHRoaXMuX3NpemUtLVxyXG4gICAgaWYgKHRoaXMuYWN0aXZlKCkpIHtcclxuICAgICAgdGhpcy5fZmlyZUV2ZW50KCdyZWplY3RlZCcsIHtcclxuICAgICAgICBwcm9taXNlOiBwcm9taXNlLFxyXG4gICAgICAgIGVycm9yOiBlcnJvclxyXG4gICAgICB9KVxyXG4gICAgICB0aGlzLl9zZXR0bGUoZXJyb3IgfHwgbmV3IEVycm9yKCdVbmtub3duIGVycm9yJykpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBQcm9taXNlUG9vbC5wcm90b3R5cGUuX3RyYWNrUHJvbWlzZSA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXNcclxuICAgIHByb21pc2VcclxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG4gICAgICAgIHRoYXQuX29uUG9vbGVkUHJvbWlzZUZ1bGZpbGxlZChwcm9taXNlLCByZXN1bHQpXHJcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgIHRoYXQuX29uUG9vbGVkUHJvbWlzZVJlamVjdGVkKHByb21pc2UsIGVycm9yKVxyXG4gICAgICB9KVsnY2F0Y2gnXShmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgdGhhdC5fc2V0dGxlKG5ldyBFcnJvcignUHJvbWlzZSBwcm9jZXNzaW5nIGZhaWxlZDogJyArIGVycikpXHJcbiAgICAgIH0pXHJcbiAgfVxyXG5cclxuICBQcm9taXNlUG9vbC5wcm90b3R5cGUuX3Byb2NlZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMuX2RvbmUpIHtcclxuICAgICAgdmFyIHJlc3VsdCA9IG51bGxcclxuICAgICAgd2hpbGUgKHRoaXMuX3NpemUgPCB0aGlzLl9jb25jdXJyZW5jeSAmJlxyXG4gICAgICAgICAgIShyZXN1bHQgPSB0aGlzLl9pdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcclxuICAgICAgICB0aGlzLl9zaXplKytcclxuICAgICAgICB0aGlzLl90cmFja1Byb21pc2UocmVzdWx0LnZhbHVlKVxyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX2RvbmUgPSAocmVzdWx0ID09PSBudWxsIHx8ICEhcmVzdWx0LmRvbmUpXHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5fZG9uZSAmJiB0aGlzLl9zaXplID09PSAwKSB7XHJcbiAgICAgIHRoaXMuX3NldHRsZSgpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBQcm9taXNlUG9vbC5Qcm9taXNlUG9vbEV2ZW50ID0gUHJvbWlzZVBvb2xFdmVudFxyXG4gIC8vIExlZ2FjeSBBUElcclxuICBQcm9taXNlUG9vbC5Qcm9taXNlUG9vbCA9IFByb21pc2VQb29sXHJcblxyXG4gIHJldHVybiBQcm9taXNlUG9vbFxyXG59KVxyXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIndXNlIHN0cmljdCc7XG52YXIgTXV0YXRpb24gPSBnbG9iYWwuTXV0YXRpb25PYnNlcnZlciB8fCBnbG9iYWwuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcblxudmFyIHNjaGVkdWxlRHJhaW47XG5cbntcbiAgaWYgKE11dGF0aW9uKSB7XG4gICAgdmFyIGNhbGxlZCA9IDA7XG4gICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uKG5leHRUaWNrKTtcbiAgICB2YXIgZWxlbWVudCA9IGdsb2JhbC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgb2JzZXJ2ZXIub2JzZXJ2ZShlbGVtZW50LCB7XG4gICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlXG4gICAgfSk7XG4gICAgc2NoZWR1bGVEcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGVsZW1lbnQuZGF0YSA9IChjYWxsZWQgPSArK2NhbGxlZCAlIDIpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoIWdsb2JhbC5zZXRJbW1lZGlhdGUgJiYgdHlwZW9mIGdsb2JhbC5NZXNzYWdlQ2hhbm5lbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgY2hhbm5lbCA9IG5ldyBnbG9iYWwuTWVzc2FnZUNoYW5uZWwoKTtcbiAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IG5leHRUaWNrO1xuICAgIHNjaGVkdWxlRHJhaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgIH07XG4gIH0gZWxzZSBpZiAoJ2RvY3VtZW50JyBpbiBnbG9iYWwgJiYgJ29ucmVhZHlzdGF0ZWNoYW5nZScgaW4gZ2xvYmFsLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpKSB7XG4gICAgc2NoZWR1bGVEcmFpbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgLy8gQ3JlYXRlIGEgPHNjcmlwdD4gZWxlbWVudDsgaXRzIHJlYWR5c3RhdGVjaGFuZ2UgZXZlbnQgd2lsbCBiZSBmaXJlZCBhc3luY2hyb25vdXNseSBvbmNlIGl0IGlzIGluc2VydGVkXG4gICAgICAvLyBpbnRvIHRoZSBkb2N1bWVudC4gRG8gc28sIHRodXMgcXVldWluZyB1cCB0aGUgdGFzay4gUmVtZW1iZXIgdG8gY2xlYW4gdXAgb25jZSBpdCdzIGJlZW4gY2FsbGVkLlxuICAgICAgdmFyIHNjcmlwdEVsID0gZ2xvYmFsLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgc2NyaXB0RWwub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBuZXh0VGljaygpO1xuXG4gICAgICAgIHNjcmlwdEVsLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgIHNjcmlwdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0RWwpO1xuICAgICAgICBzY3JpcHRFbCA9IG51bGw7XG4gICAgICB9O1xuICAgICAgZ2xvYmFsLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JpcHRFbCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBzY2hlZHVsZURyYWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgc2V0VGltZW91dChuZXh0VGljaywgMCk7XG4gICAgfTtcbiAgfVxufVxuXG52YXIgZHJhaW5pbmc7XG52YXIgcXVldWUgPSBbXTtcbi8vbmFtZWQgbmV4dFRpY2sgZm9yIGxlc3MgY29uZnVzaW5nIHN0YWNrIHRyYWNlc1xuZnVuY3Rpb24gbmV4dFRpY2soKSB7XG4gIGRyYWluaW5nID0gdHJ1ZTtcbiAgdmFyIGksIG9sZFF1ZXVlO1xuICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICB3aGlsZSAobGVuKSB7XG4gICAgb2xkUXVldWUgPSBxdWV1ZTtcbiAgICBxdWV1ZSA9IFtdO1xuICAgIGkgPSAtMTtcbiAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICBvbGRRdWV1ZVtpXSgpO1xuICAgIH1cbiAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gIH1cbiAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpbW1lZGlhdGU7XG5mdW5jdGlvbiBpbW1lZGlhdGUodGFzaykge1xuICBpZiAocXVldWUucHVzaCh0YXNrKSA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICBzY2hlZHVsZURyYWluKCk7XG4gIH1cbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIGltbWVkaWF0ZSA9IHJlcXVpcmUoJ2ltbWVkaWF0ZScpO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gSU5URVJOQUwoKSB7fVxuXG52YXIgaGFuZGxlcnMgPSB7fTtcblxudmFyIFJFSkVDVEVEID0gWydSRUpFQ1RFRCddO1xudmFyIEZVTEZJTExFRCA9IFsnRlVMRklMTEVEJ107XG52YXIgUEVORElORyA9IFsnUEVORElORyddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb21pc2U7XG5cbmZ1bmN0aW9uIFByb21pc2UocmVzb2x2ZXIpIHtcbiAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3Jlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG4gIHRoaXMuc3RhdGUgPSBQRU5ESU5HO1xuICB0aGlzLnF1ZXVlID0gW107XG4gIHRoaXMub3V0Y29tZSA9IHZvaWQgMDtcbiAgaWYgKHJlc29sdmVyICE9PSBJTlRFUk5BTCkge1xuICAgIHNhZmVseVJlc29sdmVUaGVuYWJsZSh0aGlzLCByZXNvbHZlcik7XG4gIH1cbn1cblxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59O1xuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICBpZiAodHlwZW9mIG9uRnVsZmlsbGVkICE9PSAnZnVuY3Rpb24nICYmIHRoaXMuc3RhdGUgPT09IEZVTEZJTExFRCB8fFxuICAgIHR5cGVvZiBvblJlamVjdGVkICE9PSAnZnVuY3Rpb24nICYmIHRoaXMuc3RhdGUgPT09IFJFSkVDVEVEKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgdmFyIHByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihJTlRFUk5BTCk7XG4gIGlmICh0aGlzLnN0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgdmFyIHJlc29sdmVyID0gdGhpcy5zdGF0ZSA9PT0gRlVMRklMTEVEID8gb25GdWxmaWxsZWQgOiBvblJlamVjdGVkO1xuICAgIHVud3JhcChwcm9taXNlLCByZXNvbHZlciwgdGhpcy5vdXRjb21lKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnF1ZXVlLnB1c2gobmV3IFF1ZXVlSXRlbShwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkpO1xuICB9XG5cbiAgcmV0dXJuIHByb21pc2U7XG59O1xuZnVuY3Rpb24gUXVldWVJdGVtKHByb21pc2UsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gIHRoaXMucHJvbWlzZSA9IHByb21pc2U7XG4gIGlmICh0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLm9uRnVsZmlsbGVkID0gb25GdWxmaWxsZWQ7XG4gICAgdGhpcy5jYWxsRnVsZmlsbGVkID0gdGhpcy5vdGhlckNhbGxGdWxmaWxsZWQ7XG4gIH1cbiAgaWYgKHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5vblJlamVjdGVkID0gb25SZWplY3RlZDtcbiAgICB0aGlzLmNhbGxSZWplY3RlZCA9IHRoaXMub3RoZXJDYWxsUmVqZWN0ZWQ7XG4gIH1cbn1cblF1ZXVlSXRlbS5wcm90b3R5cGUuY2FsbEZ1bGZpbGxlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBoYW5kbGVycy5yZXNvbHZlKHRoaXMucHJvbWlzZSwgdmFsdWUpO1xufTtcblF1ZXVlSXRlbS5wcm90b3R5cGUub3RoZXJDYWxsRnVsZmlsbGVkID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHVud3JhcCh0aGlzLnByb21pc2UsIHRoaXMub25GdWxmaWxsZWQsIHZhbHVlKTtcbn07XG5RdWV1ZUl0ZW0ucHJvdG90eXBlLmNhbGxSZWplY3RlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICBoYW5kbGVycy5yZWplY3QodGhpcy5wcm9taXNlLCB2YWx1ZSk7XG59O1xuUXVldWVJdGVtLnByb3RvdHlwZS5vdGhlckNhbGxSZWplY3RlZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB1bndyYXAodGhpcy5wcm9taXNlLCB0aGlzLm9uUmVqZWN0ZWQsIHZhbHVlKTtcbn07XG5cbmZ1bmN0aW9uIHVud3JhcChwcm9taXNlLCBmdW5jLCB2YWx1ZSkge1xuICBpbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXR1cm5WYWx1ZTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuVmFsdWUgPSBmdW5jKHZhbHVlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gaGFuZGxlcnMucmVqZWN0KHByb21pc2UsIGUpO1xuICAgIH1cbiAgICBpZiAocmV0dXJuVmFsdWUgPT09IHByb21pc2UpIHtcbiAgICAgIGhhbmRsZXJzLnJlamVjdChwcm9taXNlLCBuZXcgVHlwZUVycm9yKCdDYW5ub3QgcmVzb2x2ZSBwcm9taXNlIHdpdGggaXRzZWxmJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoYW5kbGVycy5yZXNvbHZlKHByb21pc2UsIHJldHVyblZhbHVlKTtcbiAgICB9XG4gIH0pO1xufVxuXG5oYW5kbGVycy5yZXNvbHZlID0gZnVuY3Rpb24gKHNlbGYsIHZhbHVlKSB7XG4gIHZhciByZXN1bHQgPSB0cnlDYXRjaChnZXRUaGVuLCB2YWx1ZSk7XG4gIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZXJyb3InKSB7XG4gICAgcmV0dXJuIGhhbmRsZXJzLnJlamVjdChzZWxmLCByZXN1bHQudmFsdWUpO1xuICB9XG4gIHZhciB0aGVuYWJsZSA9IHJlc3VsdC52YWx1ZTtcblxuICBpZiAodGhlbmFibGUpIHtcbiAgICBzYWZlbHlSZXNvbHZlVGhlbmFibGUoc2VsZiwgdGhlbmFibGUpO1xuICB9IGVsc2Uge1xuICAgIHNlbGYuc3RhdGUgPSBGVUxGSUxMRUQ7XG4gICAgc2VsZi5vdXRjb21lID0gdmFsdWU7XG4gICAgdmFyIGkgPSAtMTtcbiAgICB2YXIgbGVuID0gc2VsZi5xdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgc2VsZi5xdWV1ZVtpXS5jYWxsRnVsZmlsbGVkKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNlbGY7XG59O1xuaGFuZGxlcnMucmVqZWN0ID0gZnVuY3Rpb24gKHNlbGYsIGVycm9yKSB7XG4gIHNlbGYuc3RhdGUgPSBSRUpFQ1RFRDtcbiAgc2VsZi5vdXRjb21lID0gZXJyb3I7XG4gIHZhciBpID0gLTE7XG4gIHZhciBsZW4gPSBzZWxmLnF1ZXVlLmxlbmd0aDtcbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIHNlbGYucXVldWVbaV0uY2FsbFJlamVjdGVkKGVycm9yKTtcbiAgfVxuICByZXR1cm4gc2VsZjtcbn07XG5cbmZ1bmN0aW9uIGdldFRoZW4ob2JqKSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSBvbmx5IGFjY2VzcyB0aGUgYWNjZXNzb3Igb25jZSBhcyByZXF1aXJlZCBieSB0aGUgc3BlY1xuICB2YXIgdGhlbiA9IG9iaiAmJiBvYmoudGhlbjtcbiAgaWYgKG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmdW5jdGlvbiBhcHB5VGhlbigpIHtcbiAgICAgIHRoZW4uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FmZWx5UmVzb2x2ZVRoZW5hYmxlKHNlbGYsIHRoZW5hYmxlKSB7XG4gIC8vIEVpdGhlciBmdWxmaWxsLCByZWplY3Qgb3IgcmVqZWN0IHdpdGggZXJyb3JcbiAgdmFyIGNhbGxlZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBvbkVycm9yKHZhbHVlKSB7XG4gICAgaWYgKGNhbGxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjYWxsZWQgPSB0cnVlO1xuICAgIGhhbmRsZXJzLnJlamVjdChzZWxmLCB2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvblN1Y2Nlc3ModmFsdWUpIHtcbiAgICBpZiAoY2FsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhbGxlZCA9IHRydWU7XG4gICAgaGFuZGxlcnMucmVzb2x2ZShzZWxmLCB2YWx1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cnlUb1Vud3JhcCgpIHtcbiAgICB0aGVuYWJsZShvblN1Y2Nlc3MsIG9uRXJyb3IpO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoKHRyeVRvVW53cmFwKTtcbiAgaWYgKHJlc3VsdC5zdGF0dXMgPT09ICdlcnJvcicpIHtcbiAgICBvbkVycm9yKHJlc3VsdC52YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5Q2F0Y2goZnVuYywgdmFsdWUpIHtcbiAgdmFyIG91dCA9IHt9O1xuICB0cnkge1xuICAgIG91dC52YWx1ZSA9IGZ1bmModmFsdWUpO1xuICAgIG91dC5zdGF0dXMgPSAnc3VjY2Vzcyc7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBvdXQuc3RhdHVzID0gJ2Vycm9yJztcbiAgICBvdXQudmFsdWUgPSBlO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cblByb21pc2UucmVzb2x2ZSA9IHJlc29sdmU7XG5mdW5jdGlvbiByZXNvbHZlKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHRoaXMpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGhhbmRsZXJzLnJlc29sdmUobmV3IHRoaXMoSU5URVJOQUwpLCB2YWx1ZSk7XG59XG5cblByb21pc2UucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICB2YXIgcHJvbWlzZSA9IG5ldyB0aGlzKElOVEVSTkFMKTtcbiAgcmV0dXJuIGhhbmRsZXJzLnJlamVjdChwcm9taXNlLCByZWFzb24pO1xufVxuXG5Qcm9taXNlLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChpdGVyYWJsZSkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlcmFibGUpICE9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ211c3QgYmUgYW4gYXJyYXknKSk7XG4gIH1cblxuICB2YXIgbGVuID0gaXRlcmFibGUubGVuZ3RoO1xuICB2YXIgY2FsbGVkID0gZmFsc2U7XG4gIGlmICghbGVuKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZShbXSk7XG4gIH1cblxuICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbik7XG4gIHZhciByZXNvbHZlZCA9IDA7XG4gIHZhciBpID0gLTE7XG4gIHZhciBwcm9taXNlID0gbmV3IHRoaXMoSU5URVJOQUwpO1xuXG4gIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICBhbGxSZXNvbHZlcihpdGVyYWJsZVtpXSwgaSk7XG4gIH1cbiAgcmV0dXJuIHByb21pc2U7XG4gIGZ1bmN0aW9uIGFsbFJlc29sdmVyKHZhbHVlLCBpKSB7XG4gICAgc2VsZi5yZXNvbHZlKHZhbHVlKS50aGVuKHJlc29sdmVGcm9tQWxsLCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIGlmICghY2FsbGVkKSB7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGhhbmRsZXJzLnJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gcmVzb2x2ZUZyb21BbGwob3V0VmFsdWUpIHtcbiAgICAgIHZhbHVlc1tpXSA9IG91dFZhbHVlO1xuICAgICAgaWYgKCsrcmVzb2x2ZWQgPT09IGxlbiAmJiAhY2FsbGVkKSB7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGhhbmRsZXJzLnJlc29sdmUocHJvbWlzZSwgdmFsdWVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuUHJvbWlzZS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoaXRlcmFibGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZXJhYmxlKSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgIHJldHVybiB0aGlzLnJlamVjdChuZXcgVHlwZUVycm9yKCdtdXN0IGJlIGFuIGFycmF5JykpO1xuICB9XG5cbiAgdmFyIGxlbiA9IGl0ZXJhYmxlLmxlbmd0aDtcbiAgdmFyIGNhbGxlZCA9IGZhbHNlO1xuICBpZiAoIWxlbikge1xuICAgIHJldHVybiB0aGlzLnJlc29sdmUoW10pO1xuICB9XG5cbiAgdmFyIGkgPSAtMTtcbiAgdmFyIHByb21pc2UgPSBuZXcgdGhpcyhJTlRFUk5BTCk7XG5cbiAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgIHJlc29sdmVyKGl0ZXJhYmxlW2ldKTtcbiAgfVxuICByZXR1cm4gcHJvbWlzZTtcbiAgZnVuY3Rpb24gcmVzb2x2ZXIodmFsdWUpIHtcbiAgICBzZWxmLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICBpZiAoIWNhbGxlZCkge1xuICAgICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgICBoYW5kbGVycy5yZXNvbHZlKHByb21pc2UsIHJlc3BvbnNlKTtcbiAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIGlmICghY2FsbGVkKSB7XG4gICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgIGhhbmRsZXJzLnJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDBcbnZhciBtID0gcyAqIDYwXG52YXIgaCA9IG0gKiA2MFxudmFyIGQgPSBoICogMjRcbnZhciB5ID0gZCAqIDM2NS4yNVxuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEB0aHJvd3Mge0Vycm9yfSB0aHJvdyBhbiBlcnJvciBpZiB2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIG51bWJlclxuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbFxuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/XG5cdFx0XHRmbXRMb25nKHZhbCkgOlxuXHRcdFx0Zm10U2hvcnQodmFsKVxuICB9XG4gIHRocm93IG5ldyBFcnJvcigndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICsgSlNPTi5zdHJpbmdpZnkodmFsKSlcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpXG4gIGlmIChzdHIubGVuZ3RoID4gMTAwMDApIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKHN0cilcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSlcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKVxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHlcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkXG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2hycyc6XG4gICAgY2FzZSAnaHInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoXG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtXG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzXG4gICAgY2FzZSAnbWlsbGlzZWNvbmRzJzpcbiAgICBjYXNlICdtaWxsaXNlY29uZCc6XG4gICAgY2FzZSAnbXNlY3MnOlxuICAgIGNhc2UgJ21zZWMnOlxuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJ1xuICB9XG4gIGlmIChtcyA+PSBoKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJ1xuICB9XG4gIGlmIChtcyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJ1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJ1xuICB9XG4gIHJldHVybiBtcyArICdtcydcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpIHx8XG4gICAgcGx1cmFsKG1zLCBoLCAnaG91cicpIHx8XG4gICAgcGx1cmFsKG1zLCBtLCAnbWludXRlJykgfHxcbiAgICBwbHVyYWwobXMsIHMsICdzZWNvbmQnKSB8fFxuICAgIG1zICsgJyBtcydcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVyblxuICB9XG4gIGlmIChtcyA8IG4gKiAxLjUpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZVxuICB9XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncydcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOS4yXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gICAgc2xpY2UgPSBbXS5zbGljZTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvdXJjZSwgc2NvcGUpIHtcbiAgICB2YXIga2V5LCBrZXlzLCB2YWx1ZSwgdmFsdWVzO1xuICAgIGtleXMgPSBbXTtcbiAgICB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKGtleSBpbiBzY29wZSkge1xuICAgICAgaWYgKCFoYXNQcm9wLmNhbGwoc2NvcGUsIGtleSkpIGNvbnRpbnVlO1xuICAgICAgdmFsdWUgPSBzY29wZVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gJ3RoaXMnKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBGdW5jdGlvbi5hcHBseShudWxsLCBzbGljZS5jYWxsKGtleXMpLmNvbmNhdChbc291cmNlXSkpLmFwcGx5KHNjb3BlW1widGhpc1wiXSwgdmFsdWVzKTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbiAoZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gTm9kZS9Db21tb25KU1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBTURcbiAgICAgICAgZGVmaW5lKGZhY3RvcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFscyAod2l0aCBzdXBwb3J0IGZvciB3ZWIgd29ya2VycylcbiAgICAgICAgdmFyIGdsb2I7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGdsb2IgPSB3aW5kb3c7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGdsb2IgPSBzZWxmO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2xvYi5TcGFya01ENSA9IGZhY3RvcnkoKTtcbiAgICB9XG59KGZ1bmN0aW9uICh1bmRlZmluZWQpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qXG4gICAgICogRmFzdGVzdCBtZDUgaW1wbGVtZW50YXRpb24gYXJvdW5kIChKS00gbWQ1KS5cbiAgICAgKiBDcmVkaXRzOiBKb3NlcGggTXllcnNcbiAgICAgKlxuICAgICAqIEBzZWUgaHR0cDovL3d3dy5teWVyc2RhaWx5Lm9yZy9qb3NlcGgvamF2YXNjcmlwdC9tZDUtdGV4dC5odG1sXG4gICAgICogQHNlZSBodHRwOi8vanNwZXJmLmNvbS9tZDUtc2hvb3RvdXQvN1xuICAgICAqL1xuXG4gICAgLyogdGhpcyBmdW5jdGlvbiBpcyBtdWNoIGZhc3RlcixcbiAgICAgIHNvIGlmIHBvc3NpYmxlIHdlIHVzZSBpdC4gU29tZSBJRXNcbiAgICAgIGFyZSB0aGUgb25seSBvbmVzIEkga25vdyBvZiB0aGF0XG4gICAgICBuZWVkIHRoZSBpZGlvdGljIHNlY29uZCBmdW5jdGlvbixcbiAgICAgIGdlbmVyYXRlZCBieSBhbiBpZiBjbGF1c2UuICAqL1xuICAgIHZhciBhZGQzMiA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiAoYSArIGIpICYgMHhGRkZGRkZGRjtcbiAgICB9LFxuICAgICAgICBoZXhfY2hyID0gWycwJywgJzEnLCAnMicsICczJywgJzQnLCAnNScsICc2JywgJzcnLCAnOCcsICc5JywgJ2EnLCAnYicsICdjJywgJ2QnLCAnZScsICdmJ107XG5cblxuICAgIGZ1bmN0aW9uIGNtbihxLCBhLCBiLCB4LCBzLCB0KSB7XG4gICAgICAgIGEgPSBhZGQzMihhZGQzMihhLCBxKSwgYWRkMzIoeCwgdCkpO1xuICAgICAgICByZXR1cm4gYWRkMzIoKGEgPDwgcykgfCAoYSA+Pj4gKDMyIC0gcykpLCBiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmZihhLCBiLCBjLCBkLCB4LCBzLCB0KSB7XG4gICAgICAgIHJldHVybiBjbW4oKGIgJiBjKSB8ICgofmIpICYgZCksIGEsIGIsIHgsIHMsIHQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdnKGEsIGIsIGMsIGQsIHgsIHMsIHQpIHtcbiAgICAgICAgcmV0dXJuIGNtbigoYiAmIGQpIHwgKGMgJiAofmQpKSwgYSwgYiwgeCwgcywgdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGgoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgICAgICByZXR1cm4gY21uKGIgXiBjIF4gZCwgYSwgYiwgeCwgcywgdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaWkoYSwgYiwgYywgZCwgeCwgcywgdCkge1xuICAgICAgICByZXR1cm4gY21uKGMgXiAoYiB8ICh+ZCkpLCBhLCBiLCB4LCBzLCB0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZDVjeWNsZSh4LCBrKSB7XG4gICAgICAgIHZhciBhID0geFswXSxcbiAgICAgICAgICAgIGIgPSB4WzFdLFxuICAgICAgICAgICAgYyA9IHhbMl0sXG4gICAgICAgICAgICBkID0geFszXTtcblxuICAgICAgICBhID0gZmYoYSwgYiwgYywgZCwga1swXSwgNywgLTY4MDg3NjkzNik7XG4gICAgICAgIGQgPSBmZihkLCBhLCBiLCBjLCBrWzFdLCAxMiwgLTM4OTU2NDU4Nik7XG4gICAgICAgIGMgPSBmZihjLCBkLCBhLCBiLCBrWzJdLCAxNywgNjA2MTA1ODE5KTtcbiAgICAgICAgYiA9IGZmKGIsIGMsIGQsIGEsIGtbM10sIDIyLCAtMTA0NDUyNTMzMCk7XG4gICAgICAgIGEgPSBmZihhLCBiLCBjLCBkLCBrWzRdLCA3LCAtMTc2NDE4ODk3KTtcbiAgICAgICAgZCA9IGZmKGQsIGEsIGIsIGMsIGtbNV0sIDEyLCAxMjAwMDgwNDI2KTtcbiAgICAgICAgYyA9IGZmKGMsIGQsIGEsIGIsIGtbNl0sIDE3LCAtMTQ3MzIzMTM0MSk7XG4gICAgICAgIGIgPSBmZihiLCBjLCBkLCBhLCBrWzddLCAyMiwgLTQ1NzA1OTgzKTtcbiAgICAgICAgYSA9IGZmKGEsIGIsIGMsIGQsIGtbOF0sIDcsIDE3NzAwMzU0MTYpO1xuICAgICAgICBkID0gZmYoZCwgYSwgYiwgYywga1s5XSwgMTIsIC0xOTU4NDE0NDE3KTtcbiAgICAgICAgYyA9IGZmKGMsIGQsIGEsIGIsIGtbMTBdLCAxNywgLTQyMDYzKTtcbiAgICAgICAgYiA9IGZmKGIsIGMsIGQsIGEsIGtbMTFdLCAyMiwgLTE5OTA0MDQxNjIpO1xuICAgICAgICBhID0gZmYoYSwgYiwgYywgZCwga1sxMl0sIDcsIDE4MDQ2MDM2ODIpO1xuICAgICAgICBkID0gZmYoZCwgYSwgYiwgYywga1sxM10sIDEyLCAtNDAzNDExMDEpO1xuICAgICAgICBjID0gZmYoYywgZCwgYSwgYiwga1sxNF0sIDE3LCAtMTUwMjAwMjI5MCk7XG4gICAgICAgIGIgPSBmZihiLCBjLCBkLCBhLCBrWzE1XSwgMjIsIDEyMzY1MzUzMjkpO1xuXG4gICAgICAgIGEgPSBnZyhhLCBiLCBjLCBkLCBrWzFdLCA1LCAtMTY1Nzk2NTEwKTtcbiAgICAgICAgZCA9IGdnKGQsIGEsIGIsIGMsIGtbNl0sIDksIC0xMDY5NTAxNjMyKTtcbiAgICAgICAgYyA9IGdnKGMsIGQsIGEsIGIsIGtbMTFdLCAxNCwgNjQzNzE3NzEzKTtcbiAgICAgICAgYiA9IGdnKGIsIGMsIGQsIGEsIGtbMF0sIDIwLCAtMzczODk3MzAyKTtcbiAgICAgICAgYSA9IGdnKGEsIGIsIGMsIGQsIGtbNV0sIDUsIC03MDE1NTg2OTEpO1xuICAgICAgICBkID0gZ2coZCwgYSwgYiwgYywga1sxMF0sIDksIDM4MDE2MDgzKTtcbiAgICAgICAgYyA9IGdnKGMsIGQsIGEsIGIsIGtbMTVdLCAxNCwgLTY2MDQ3ODMzNSk7XG4gICAgICAgIGIgPSBnZyhiLCBjLCBkLCBhLCBrWzRdLCAyMCwgLTQwNTUzNzg0OCk7XG4gICAgICAgIGEgPSBnZyhhLCBiLCBjLCBkLCBrWzldLCA1LCA1Njg0NDY0MzgpO1xuICAgICAgICBkID0gZ2coZCwgYSwgYiwgYywga1sxNF0sIDksIC0xMDE5ODAzNjkwKTtcbiAgICAgICAgYyA9IGdnKGMsIGQsIGEsIGIsIGtbM10sIDE0LCAtMTg3MzYzOTYxKTtcbiAgICAgICAgYiA9IGdnKGIsIGMsIGQsIGEsIGtbOF0sIDIwLCAxMTYzNTMxNTAxKTtcbiAgICAgICAgYSA9IGdnKGEsIGIsIGMsIGQsIGtbMTNdLCA1LCAtMTQ0NDY4MTQ2Nyk7XG4gICAgICAgIGQgPSBnZyhkLCBhLCBiLCBjLCBrWzJdLCA5LCAtNTE0MDM3ODQpO1xuICAgICAgICBjID0gZ2coYywgZCwgYSwgYiwga1s3XSwgMTQsIDE3MzUzMjg0NzMpO1xuICAgICAgICBiID0gZ2coYiwgYywgZCwgYSwga1sxMl0sIDIwLCAtMTkyNjYwNzczNCk7XG5cbiAgICAgICAgYSA9IGhoKGEsIGIsIGMsIGQsIGtbNV0sIDQsIC0zNzg1NTgpO1xuICAgICAgICBkID0gaGgoZCwgYSwgYiwgYywga1s4XSwgMTEsIC0yMDIyNTc0NDYzKTtcbiAgICAgICAgYyA9IGhoKGMsIGQsIGEsIGIsIGtbMTFdLCAxNiwgMTgzOTAzMDU2Mik7XG4gICAgICAgIGIgPSBoaChiLCBjLCBkLCBhLCBrWzE0XSwgMjMsIC0zNTMwOTU1Nik7XG4gICAgICAgIGEgPSBoaChhLCBiLCBjLCBkLCBrWzFdLCA0LCAtMTUzMDk5MjA2MCk7XG4gICAgICAgIGQgPSBoaChkLCBhLCBiLCBjLCBrWzRdLCAxMSwgMTI3Mjg5MzM1Myk7XG4gICAgICAgIGMgPSBoaChjLCBkLCBhLCBiLCBrWzddLCAxNiwgLTE1NTQ5NzYzMik7XG4gICAgICAgIGIgPSBoaChiLCBjLCBkLCBhLCBrWzEwXSwgMjMsIC0xMDk0NzMwNjQwKTtcbiAgICAgICAgYSA9IGhoKGEsIGIsIGMsIGQsIGtbMTNdLCA0LCA2ODEyNzkxNzQpO1xuICAgICAgICBkID0gaGgoZCwgYSwgYiwgYywga1swXSwgMTEsIC0zNTg1MzcyMjIpO1xuICAgICAgICBjID0gaGgoYywgZCwgYSwgYiwga1szXSwgMTYsIC03MjI1MjE5NzkpO1xuICAgICAgICBiID0gaGgoYiwgYywgZCwgYSwga1s2XSwgMjMsIDc2MDI5MTg5KTtcbiAgICAgICAgYSA9IGhoKGEsIGIsIGMsIGQsIGtbOV0sIDQsIC02NDAzNjQ0ODcpO1xuICAgICAgICBkID0gaGgoZCwgYSwgYiwgYywga1sxMl0sIDExLCAtNDIxODE1ODM1KTtcbiAgICAgICAgYyA9IGhoKGMsIGQsIGEsIGIsIGtbMTVdLCAxNiwgNTMwNzQyNTIwKTtcbiAgICAgICAgYiA9IGhoKGIsIGMsIGQsIGEsIGtbMl0sIDIzLCAtOTk1MzM4NjUxKTtcblxuICAgICAgICBhID0gaWkoYSwgYiwgYywgZCwga1swXSwgNiwgLTE5ODYzMDg0NCk7XG4gICAgICAgIGQgPSBpaShkLCBhLCBiLCBjLCBrWzddLCAxMCwgMTEyNjg5MTQxNSk7XG4gICAgICAgIGMgPSBpaShjLCBkLCBhLCBiLCBrWzE0XSwgMTUsIC0xNDE2MzU0OTA1KTtcbiAgICAgICAgYiA9IGlpKGIsIGMsIGQsIGEsIGtbNV0sIDIxLCAtNTc0MzQwNTUpO1xuICAgICAgICBhID0gaWkoYSwgYiwgYywgZCwga1sxMl0sIDYsIDE3MDA0ODU1NzEpO1xuICAgICAgICBkID0gaWkoZCwgYSwgYiwgYywga1szXSwgMTAsIC0xODk0OTg2NjA2KTtcbiAgICAgICAgYyA9IGlpKGMsIGQsIGEsIGIsIGtbMTBdLCAxNSwgLTEwNTE1MjMpO1xuICAgICAgICBiID0gaWkoYiwgYywgZCwgYSwga1sxXSwgMjEsIC0yMDU0OTIyNzk5KTtcbiAgICAgICAgYSA9IGlpKGEsIGIsIGMsIGQsIGtbOF0sIDYsIDE4NzMzMTMzNTkpO1xuICAgICAgICBkID0gaWkoZCwgYSwgYiwgYywga1sxNV0sIDEwLCAtMzA2MTE3NDQpO1xuICAgICAgICBjID0gaWkoYywgZCwgYSwgYiwga1s2XSwgMTUsIC0xNTYwMTk4MzgwKTtcbiAgICAgICAgYiA9IGlpKGIsIGMsIGQsIGEsIGtbMTNdLCAyMSwgMTMwOTE1MTY0OSk7XG4gICAgICAgIGEgPSBpaShhLCBiLCBjLCBkLCBrWzRdLCA2LCAtMTQ1NTIzMDcwKTtcbiAgICAgICAgZCA9IGlpKGQsIGEsIGIsIGMsIGtbMTFdLCAxMCwgLTExMjAyMTAzNzkpO1xuICAgICAgICBjID0gaWkoYywgZCwgYSwgYiwga1syXSwgMTUsIDcxODc4NzI1OSk7XG4gICAgICAgIGIgPSBpaShiLCBjLCBkLCBhLCBrWzldLCAyMSwgLTM0MzQ4NTU1MSk7XG5cbiAgICAgICAgeFswXSA9IGFkZDMyKGEsIHhbMF0pO1xuICAgICAgICB4WzFdID0gYWRkMzIoYiwgeFsxXSk7XG4gICAgICAgIHhbMl0gPSBhZGQzMihjLCB4WzJdKTtcbiAgICAgICAgeFszXSA9IGFkZDMyKGQsIHhbM10pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1kNWJsayhzKSB7XG4gICAgICAgIHZhciBtZDVibGtzID0gW10sXG4gICAgICAgICAgICBpOyAvKiBBbmR5IEtpbmcgc2FpZCBkbyBpdCB0aGlzIHdheS4gKi9cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNjQ7IGkgKz0gNCkge1xuICAgICAgICAgICAgbWQ1Ymxrc1tpID4+IDJdID0gcy5jaGFyQ29kZUF0KGkpICsgKHMuY2hhckNvZGVBdChpICsgMSkgPDwgOCkgKyAocy5jaGFyQ29kZUF0KGkgKyAyKSA8PCAxNikgKyAocy5jaGFyQ29kZUF0KGkgKyAzKSA8PCAyNCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1kNWJsa3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWQ1YmxrX2FycmF5KGEpIHtcbiAgICAgICAgdmFyIG1kNWJsa3MgPSBbXSxcbiAgICAgICAgICAgIGk7IC8qIEFuZHkgS2luZyBzYWlkIGRvIGl0IHRoaXMgd2F5LiAqL1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA2NDsgaSArPSA0KSB7XG4gICAgICAgICAgICBtZDVibGtzW2kgPj4gMl0gPSBhW2ldICsgKGFbaSArIDFdIDw8IDgpICsgKGFbaSArIDJdIDw8IDE2KSArIChhW2kgKyAzXSA8PCAyNCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1kNWJsa3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWQ1MShzKSB7XG4gICAgICAgIHZhciBuID0gcy5sZW5ndGgsXG4gICAgICAgICAgICBzdGF0ZSA9IFsxNzMyNTg0MTkzLCAtMjcxNzMzODc5LCAtMTczMjU4NDE5NCwgMjcxNzMzODc4XSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBsZW5ndGgsXG4gICAgICAgICAgICB0YWlsLFxuICAgICAgICAgICAgdG1wLFxuICAgICAgICAgICAgbG8sXG4gICAgICAgICAgICBoaTtcblxuICAgICAgICBmb3IgKGkgPSA2NDsgaSA8PSBuOyBpICs9IDY0KSB7XG4gICAgICAgICAgICBtZDVjeWNsZShzdGF0ZSwgbWQ1YmxrKHMuc3Vic3RyaW5nKGkgLSA2NCwgaSkpKTtcbiAgICAgICAgfVxuICAgICAgICBzID0gcy5zdWJzdHJpbmcoaSAtIDY0KTtcbiAgICAgICAgbGVuZ3RoID0gcy5sZW5ndGg7XG4gICAgICAgIHRhaWwgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGFpbFtpID4+IDJdIHw9IHMuY2hhckNvZGVBdChpKSA8PCAoKGkgJSA0KSA8PCAzKTtcbiAgICAgICAgfVxuICAgICAgICB0YWlsW2kgPj4gMl0gfD0gMHg4MCA8PCAoKGkgJSA0KSA8PCAzKTtcbiAgICAgICAgaWYgKGkgPiA1NSkge1xuICAgICAgICAgICAgbWQ1Y3ljbGUoc3RhdGUsIHRhaWwpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IDE2OyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB0YWlsW2ldID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJld2FyZSB0aGF0IHRoZSBmaW5hbCBsZW5ndGggbWlnaHQgbm90IGZpdCBpbiAzMiBiaXRzIHNvIHdlIHRha2UgY2FyZSBvZiB0aGF0XG4gICAgICAgIHRtcCA9IG4gKiA4O1xuICAgICAgICB0bXAgPSB0bXAudG9TdHJpbmcoMTYpLm1hdGNoKC8oLio/KSguezAsOH0pJC8pO1xuICAgICAgICBsbyA9IHBhcnNlSW50KHRtcFsyXSwgMTYpO1xuICAgICAgICBoaSA9IHBhcnNlSW50KHRtcFsxXSwgMTYpIHx8IDA7XG5cbiAgICAgICAgdGFpbFsxNF0gPSBsbztcbiAgICAgICAgdGFpbFsxNV0gPSBoaTtcblxuICAgICAgICBtZDVjeWNsZShzdGF0ZSwgdGFpbCk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZDUxX2FycmF5KGEpIHtcbiAgICAgICAgdmFyIG4gPSBhLmxlbmd0aCxcbiAgICAgICAgICAgIHN0YXRlID0gWzE3MzI1ODQxOTMsIC0yNzE3MzM4NzksIC0xNzMyNTg0MTk0LCAyNzE3MzM4NzhdLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbmd0aCxcbiAgICAgICAgICAgIHRhaWwsXG4gICAgICAgICAgICB0bXAsXG4gICAgICAgICAgICBsbyxcbiAgICAgICAgICAgIGhpO1xuXG4gICAgICAgIGZvciAoaSA9IDY0OyBpIDw9IG47IGkgKz0gNjQpIHtcbiAgICAgICAgICAgIG1kNWN5Y2xlKHN0YXRlLCBtZDVibGtfYXJyYXkoYS5zdWJhcnJheShpIC0gNjQsIGkpKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3Qgc3VyZSBpZiBpdCBpcyBhIGJ1ZywgaG93ZXZlciBJRTEwIHdpbGwgYWx3YXlzIHByb2R1Y2UgYSBzdWIgYXJyYXkgb2YgbGVuZ3RoIDFcbiAgICAgICAgLy8gY29udGFpbmluZyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBwYXJlbnQgYXJyYXkgaWYgdGhlIHN1YiBhcnJheSBzcGVjaWZpZWQgc3RhcnRzXG4gICAgICAgIC8vIGJleW9uZCB0aGUgbGVuZ3RoIG9mIHRoZSBwYXJlbnQgYXJyYXkgLSB3ZWlyZC5cbiAgICAgICAgLy8gaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvZmVlZGJhY2svZGV0YWlscy83NzE0NTIvdHlwZWQtYXJyYXktc3ViYXJyYXktaXNzdWVcbiAgICAgICAgYSA9IChpIC0gNjQpIDwgbiA/IGEuc3ViYXJyYXkoaSAtIDY0KSA6IG5ldyBVaW50OEFycmF5KDApO1xuXG4gICAgICAgIGxlbmd0aCA9IGEubGVuZ3RoO1xuICAgICAgICB0YWlsID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHRhaWxbaSA+PiAyXSB8PSBhW2ldIDw8ICgoaSAlIDQpIDw8IDMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFpbFtpID4+IDJdIHw9IDB4ODAgPDwgKChpICUgNCkgPDwgMyk7XG4gICAgICAgIGlmIChpID4gNTUpIHtcbiAgICAgICAgICAgIG1kNWN5Y2xlKHN0YXRlLCB0YWlsKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAxNjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgdGFpbFtpXSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCZXdhcmUgdGhhdCB0aGUgZmluYWwgbGVuZ3RoIG1pZ2h0IG5vdCBmaXQgaW4gMzIgYml0cyBzbyB3ZSB0YWtlIGNhcmUgb2YgdGhhdFxuICAgICAgICB0bXAgPSBuICogODtcbiAgICAgICAgdG1wID0gdG1wLnRvU3RyaW5nKDE2KS5tYXRjaCgvKC4qPykoLnswLDh9KSQvKTtcbiAgICAgICAgbG8gPSBwYXJzZUludCh0bXBbMl0sIDE2KTtcbiAgICAgICAgaGkgPSBwYXJzZUludCh0bXBbMV0sIDE2KSB8fCAwO1xuXG4gICAgICAgIHRhaWxbMTRdID0gbG87XG4gICAgICAgIHRhaWxbMTVdID0gaGk7XG5cbiAgICAgICAgbWQ1Y3ljbGUoc3RhdGUsIHRhaWwpO1xuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByaGV4KG4pIHtcbiAgICAgICAgdmFyIHMgPSAnJyxcbiAgICAgICAgICAgIGo7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCA0OyBqICs9IDEpIHtcbiAgICAgICAgICAgIHMgKz0gaGV4X2NoclsobiA+PiAoaiAqIDggKyA0KSkgJiAweDBGXSArIGhleF9jaHJbKG4gPj4gKGogKiA4KSkgJiAweDBGXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoZXgoeCkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHgubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHhbaV0gPSByaGV4KHhbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4LmpvaW4oJycpO1xuICAgIH1cblxuICAgIC8vIEluIHNvbWUgY2FzZXMgdGhlIGZhc3QgYWRkMzIgZnVuY3Rpb24gY2Fubm90IGJlIHVzZWQuLlxuICAgIGlmIChoZXgobWQ1MSgnaGVsbG8nKSkgIT09ICc1ZDQxNDAyYWJjNGIyYTc2Yjk3MTlkOTExMDE3YzU5MicpIHtcbiAgICAgICAgYWRkMzIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICAgICAgdmFyIGxzdyA9ICh4ICYgMHhGRkZGKSArICh5ICYgMHhGRkZGKSxcbiAgICAgICAgICAgICAgICBtc3cgPSAoeCA+PiAxNikgKyAoeSA+PiAxNikgKyAobHN3ID4+IDE2KTtcbiAgICAgICAgICAgIHJldHVybiAobXN3IDw8IDE2KSB8IChsc3cgJiAweEZGRkYpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLyoqXG4gICAgICogQXJyYXlCdWZmZXIgc2xpY2UgcG9seWZpbGwuXG4gICAgICpcbiAgICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90dGF1YmVydC9ub2RlLWFycmF5YnVmZmVyLXNsaWNlXG4gICAgICovXG5cbiAgICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiAhQXJyYXlCdWZmZXIucHJvdG90eXBlLnNsaWNlKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmdW5jdGlvbiBjbGFtcCh2YWwsIGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhbCA9ICh2YWwgfCAwKSB8fCAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KHZhbCArIGxlbmd0aCwgMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgubWluKHZhbCwgbGVuZ3RoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQXJyYXlCdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuYnl0ZUxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSBjbGFtcChmcm9tLCBsZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICBlbmQgPSBsZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIG51bSxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRBcnJheSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlQXJyYXk7XG5cbiAgICAgICAgICAgICAgICBpZiAodG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlbmQgPSBjbGFtcCh0bywgbGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYmVnaW4gPiBlbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBBcnJheUJ1ZmZlcigwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBudW0gPSBlbmQgLSBiZWdpbjtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBuZXcgQXJyYXlCdWZmZXIobnVtKTtcbiAgICAgICAgICAgICAgICB0YXJnZXRBcnJheSA9IG5ldyBVaW50OEFycmF5KHRhcmdldCk7XG5cbiAgICAgICAgICAgICAgICBzb3VyY2VBcnJheSA9IG5ldyBVaW50OEFycmF5KHRoaXMsIGJlZ2luLCBudW0pO1xuICAgICAgICAgICAgICAgIHRhcmdldEFycmF5LnNldChzb3VyY2VBcnJheSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkoKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgIC8qKlxuICAgICAqIEhlbHBlcnMuXG4gICAgICovXG5cbiAgICBmdW5jdGlvbiB0b1V0Zjgoc3RyKSB7XG4gICAgICAgIGlmICgvW1xcdTAwODAtXFx1RkZGRl0vLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgc3RyID0gdW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN0cikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1dGY4U3RyMkFycmF5QnVmZmVyKHN0ciwgcmV0dXJuVUludDhBcnJheSkge1xuICAgICAgICB2YXIgbGVuZ3RoID0gc3RyLmxlbmd0aCxcbiAgICAgICAgICAgYnVmZiA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpLFxuICAgICAgICAgICBhcnIgPSBuZXcgVWludDhBcnJheShidWZmKSxcbiAgICAgICAgICAgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGFycltpXSA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVJbnQ4QXJyYXkgPyBhcnIgOiBidWZmO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFycmF5QnVmZmVyMlV0ZjhTdHIoYnVmZikge1xuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBuZXcgVWludDhBcnJheShidWZmKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uY2F0ZW5hdGVBcnJheUJ1ZmZlcnMoZmlyc3QsIHNlY29uZCwgcmV0dXJuVUludDhBcnJheSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkoZmlyc3QuYnl0ZUxlbmd0aCArIHNlY29uZC5ieXRlTGVuZ3RoKTtcblxuICAgICAgICByZXN1bHQuc2V0KG5ldyBVaW50OEFycmF5KGZpcnN0KSk7XG4gICAgICAgIHJlc3VsdC5zZXQobmV3IFVpbnQ4QXJyYXkoc2Vjb25kKSwgZmlyc3QuYnl0ZUxlbmd0aCk7XG5cbiAgICAgICAgcmV0dXJuIHJldHVyblVJbnQ4QXJyYXkgPyByZXN1bHQgOiByZXN1bHQuYnVmZmVyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhleFRvQmluYXJ5U3RyaW5nKGhleCkge1xuICAgICAgICB2YXIgYnl0ZXMgPSBbXSxcbiAgICAgICAgICAgIGxlbmd0aCA9IGhleC5sZW5ndGgsXG4gICAgICAgICAgICB4O1xuXG4gICAgICAgIGZvciAoeCA9IDA7IHggPCBsZW5ndGggLSAxOyB4ICs9IDIpIHtcbiAgICAgICAgICAgIGJ5dGVzLnB1c2gocGFyc2VJbnQoaGV4LnN1YnN0cih4LCAyKSwgMTYpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgYnl0ZXMpO1xuICAgIH1cblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgLyoqXG4gICAgICogU3BhcmtNRDUgT09QIGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogVXNlIHRoaXMgY2xhc3MgdG8gcGVyZm9ybSBhbiBpbmNyZW1lbnRhbCBtZDUsIG90aGVyd2lzZSB1c2UgdGhlXG4gICAgICogc3RhdGljIG1ldGhvZHMgaW5zdGVhZC5cbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIFNwYXJrTUQ1KCkge1xuICAgICAgICAvLyBjYWxsIHJlc2V0IHRvIGluaXQgdGhlIGluc3RhbmNlXG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIGEgc3RyaW5nLlxuICAgICAqIEEgY29udmVyc2lvbiB3aWxsIGJlIGFwcGxpZWQgaWYgYW4gdXRmOCBzdHJpbmcgaXMgZGV0ZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gYmUgYXBwZW5kZWRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NwYXJrTUQ1fSBUaGUgaW5zdGFuY2UgaXRzZWxmXG4gICAgICovXG4gICAgU3BhcmtNRDUucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgLy8gQ29udmVydHMgdGhlIHN0cmluZyB0byB1dGY4IGJ5dGVzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAvLyBUaGVuIGFwcGVuZCBhcyBiaW5hcnlcbiAgICAgICAgdGhpcy5hcHBlbmRCaW5hcnkodG9VdGY4KHN0cikpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIGEgYmluYXJ5IHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50cyBUaGUgYmluYXJ5IHN0cmluZyB0byBiZSBhcHBlbmRlZFxuICAgICAqXG4gICAgICogQHJldHVybiB7U3BhcmtNRDV9IFRoZSBpbnN0YW5jZSBpdHNlbGZcbiAgICAgKi9cbiAgICBTcGFya01ENS5wcm90b3R5cGUuYXBwZW5kQmluYXJ5ID0gZnVuY3Rpb24gKGNvbnRlbnRzKSB7XG4gICAgICAgIHRoaXMuX2J1ZmYgKz0gY29udGVudHM7XG4gICAgICAgIHRoaXMuX2xlbmd0aCArPSBjb250ZW50cy5sZW5ndGg7XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuX2J1ZmYubGVuZ3RoLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBmb3IgKGkgPSA2NDsgaSA8PSBsZW5ndGg7IGkgKz0gNjQpIHtcbiAgICAgICAgICAgIG1kNWN5Y2xlKHRoaXMuX2hhc2gsIG1kNWJsayh0aGlzLl9idWZmLnN1YnN0cmluZyhpIC0gNjQsIGkpKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9idWZmID0gdGhpcy5fYnVmZi5zdWJzdHJpbmcoaSAtIDY0KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmluaXNoZXMgdGhlIGluY3JlbWVudGFsIGNvbXB1dGF0aW9uLCByZXNldGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgYW5kXG4gICAgICogcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhdyBUcnVlIHRvIGdldCB0aGUgcmF3IHN0cmluZywgZmFsc2UgdG8gZ2V0IHRoZSBoZXggc3RyaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZXN1bHRcbiAgICAgKi9cbiAgICBTcGFya01ENS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHJhdykge1xuICAgICAgICB2YXIgYnVmZiA9IHRoaXMuX2J1ZmYsXG4gICAgICAgICAgICBsZW5ndGggPSBidWZmLmxlbmd0aCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICB0YWlsID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgICAgICAgICAgcmV0O1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGFpbFtpID4+IDJdIHw9IGJ1ZmYuY2hhckNvZGVBdChpKSA8PCAoKGkgJSA0KSA8PCAzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpbmlzaCh0YWlsLCBsZW5ndGgpO1xuICAgICAgICByZXQgPSBoZXgodGhpcy5faGFzaCk7XG5cbiAgICAgICAgaWYgKHJhdykge1xuICAgICAgICAgICAgcmV0ID0gaGV4VG9CaW5hcnlTdHJpbmcocmV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzZXQoKTtcblxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NwYXJrTUQ1fSBUaGUgaW5zdGFuY2UgaXRzZWxmXG4gICAgICovXG4gICAgU3BhcmtNRDUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9idWZmID0gJyc7XG4gICAgICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuX2hhc2ggPSBbMTczMjU4NDE5MywgLTI3MTczMzg3OSwgLTE3MzI1ODQxOTQsIDI3MTczMzg3OF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGludGVybmFsIHN0YXRlIG9mIHRoZSBjb21wdXRhdGlvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHN0YXRlXG4gICAgICovXG4gICAgU3BhcmtNRDUucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYnVmZjogdGhpcy5fYnVmZixcbiAgICAgICAgICAgIGxlbmd0aDogdGhpcy5fbGVuZ3RoLFxuICAgICAgICAgICAgaGFzaDogdGhpcy5faGFzaFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29tcHV0YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgVGhlIHN0YXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTcGFya01ENX0gVGhlIGluc3RhbmNlIGl0c2VsZlxuICAgICAqL1xuICAgIFNwYXJrTUQ1LnByb3RvdHlwZS5zZXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICB0aGlzLl9idWZmID0gc3RhdGUuYnVmZjtcbiAgICAgICAgdGhpcy5fbGVuZ3RoID0gc3RhdGUubGVuZ3RoO1xuICAgICAgICB0aGlzLl9oYXNoID0gc3RhdGUuaGFzaDtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVsZWFzZXMgbWVtb3J5IHVzZWQgYnkgdGhlIGluY3JlbWVudGFsIGJ1ZmZlciBhbmQgb3RoZXIgYWRkaXRpb25hbFxuICAgICAqIHJlc291cmNlcy4gSWYgeW91IHBsYW4gdG8gdXNlIHRoZSBpbnN0YW5jZSBhZ2FpbiwgdXNlIHJlc2V0IGluc3RlYWQuXG4gICAgICovXG4gICAgU3BhcmtNRDUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9oYXNoO1xuICAgICAgICBkZWxldGUgdGhpcy5fYnVmZjtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2xlbmd0aDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmluaXNoIHRoZSBmaW5hbCBjYWxjdWxhdGlvbiBiYXNlZCBvbiB0aGUgdGFpbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9ICB0YWlsICAgVGhlIHRhaWwgKHdpbGwgYmUgbW9kaWZpZWQpXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCBUaGUgbGVuZ3RoIG9mIHRoZSByZW1haW5pbmcgYnVmZmVyXG4gICAgICovXG4gICAgU3BhcmtNRDUucHJvdG90eXBlLl9maW5pc2ggPSBmdW5jdGlvbiAodGFpbCwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBpID0gbGVuZ3RoLFxuICAgICAgICAgICAgdG1wLFxuICAgICAgICAgICAgbG8sXG4gICAgICAgICAgICBoaTtcblxuICAgICAgICB0YWlsW2kgPj4gMl0gfD0gMHg4MCA8PCAoKGkgJSA0KSA8PCAzKTtcbiAgICAgICAgaWYgKGkgPiA1NSkge1xuICAgICAgICAgICAgbWQ1Y3ljbGUodGhpcy5faGFzaCwgdGFpbCk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMTY7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIHRhaWxbaV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gdGhlIGZpbmFsIGNvbXB1dGF0aW9uIGJhc2VkIG9uIHRoZSB0YWlsIGFuZCBsZW5ndGhcbiAgICAgICAgLy8gQmV3YXJlIHRoYXQgdGhlIGZpbmFsIGxlbmd0aCBtYXkgbm90IGZpdCBpbiAzMiBiaXRzIHNvIHdlIHRha2UgY2FyZSBvZiB0aGF0XG4gICAgICAgIHRtcCA9IHRoaXMuX2xlbmd0aCAqIDg7XG4gICAgICAgIHRtcCA9IHRtcC50b1N0cmluZygxNikubWF0Y2goLyguKj8pKC57MCw4fSkkLyk7XG4gICAgICAgIGxvID0gcGFyc2VJbnQodG1wWzJdLCAxNik7XG4gICAgICAgIGhpID0gcGFyc2VJbnQodG1wWzFdLCAxNikgfHwgMDtcblxuICAgICAgICB0YWlsWzE0XSA9IGxvO1xuICAgICAgICB0YWlsWzE1XSA9IGhpO1xuICAgICAgICBtZDVjeWNsZSh0aGlzLl9oYXNoLCB0YWlsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgdGhlIG1kNSBoYXNoIG9uIGEgc3RyaW5nLlxuICAgICAqIEEgY29udmVyc2lvbiB3aWxsIGJlIGFwcGxpZWQgaWYgdXRmOCBzdHJpbmcgaXMgZGV0ZWN0ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gIHN0ciBUaGUgc3RyaW5nXG4gICAgICogQHBhcmFtIHtCb29sZWFufSByYXcgVHJ1ZSB0byBnZXQgdGhlIHJhdyBzdHJpbmcsIGZhbHNlIHRvIGdldCB0aGUgaGV4IHN0cmluZ1xuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgcmVzdWx0XG4gICAgICovXG4gICAgU3BhcmtNRDUuaGFzaCA9IGZ1bmN0aW9uIChzdHIsIHJhdykge1xuICAgICAgICAvLyBDb252ZXJ0cyB0aGUgc3RyaW5nIHRvIHV0ZjggYnl0ZXMgaWYgbmVjZXNzYXJ5XG4gICAgICAgIC8vIFRoZW4gY29tcHV0ZSBpdCB1c2luZyB0aGUgYmluYXJ5IGZ1bmN0aW9uXG4gICAgICAgIHJldHVybiBTcGFya01ENS5oYXNoQmluYXJ5KHRvVXRmOChzdHIpLCByYXcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyB0aGUgbWQ1IGhhc2ggb24gYSBiaW5hcnkgc3RyaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICBjb250ZW50IFRoZSBiaW5hcnkgc3RyaW5nXG4gICAgICogQHBhcmFtIHtCb29sZWFufSByYXcgICAgIFRydWUgdG8gZ2V0IHRoZSByYXcgc3RyaW5nLCBmYWxzZSB0byBnZXQgdGhlIGhleCBzdHJpbmdcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHJlc3VsdFxuICAgICAqL1xuICAgIFNwYXJrTUQ1Lmhhc2hCaW5hcnkgPSBmdW5jdGlvbiAoY29udGVudCwgcmF3KSB7XG4gICAgICAgIHZhciBoYXNoID0gbWQ1MShjb250ZW50KSxcbiAgICAgICAgICAgIHJldCA9IGhleChoYXNoKTtcblxuICAgICAgICByZXR1cm4gcmF3ID8gaGV4VG9CaW5hcnlTdHJpbmcocmV0KSA6IHJldDtcbiAgICB9O1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAvKipcbiAgICAgKiBTcGFya01ENSBPT1AgaW1wbGVtZW50YXRpb24gZm9yIGFycmF5IGJ1ZmZlcnMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBjbGFzcyB0byBwZXJmb3JtIGFuIGluY3JlbWVudGFsIG1kNSBPTkxZIGZvciBhcnJheSBidWZmZXJzLlxuICAgICAqL1xuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjYWxsIHJlc2V0IHRvIGluaXQgdGhlIGluc3RhbmNlXG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQXBwZW5kcyBhbiBhcnJheSBidWZmZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5QnVmZmVyfSBhcnIgVGhlIGFycmF5IHRvIGJlIGFwcGVuZGVkXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTcGFya01ENS5BcnJheUJ1ZmZlcn0gVGhlIGluc3RhbmNlIGl0c2VsZlxuICAgICAqL1xuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHZhciBidWZmID0gY29uY2F0ZW5hdGVBcnJheUJ1ZmZlcnModGhpcy5fYnVmZi5idWZmZXIsIGFyciwgdHJ1ZSksXG4gICAgICAgICAgICBsZW5ndGggPSBidWZmLmxlbmd0aCxcbiAgICAgICAgICAgIGk7XG5cbiAgICAgICAgdGhpcy5fbGVuZ3RoICs9IGFyci5ieXRlTGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDY0OyBpIDw9IGxlbmd0aDsgaSArPSA2NCkge1xuICAgICAgICAgICAgbWQ1Y3ljbGUodGhpcy5faGFzaCwgbWQ1YmxrX2FycmF5KGJ1ZmYuc3ViYXJyYXkoaSAtIDY0LCBpKSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYnVmZiA9IChpIC0gNjQpIDwgbGVuZ3RoID8gbmV3IFVpbnQ4QXJyYXkoYnVmZi5idWZmZXIuc2xpY2UoaSAtIDY0KSkgOiBuZXcgVWludDhBcnJheSgwKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRmluaXNoZXMgdGhlIGluY3JlbWVudGFsIGNvbXB1dGF0aW9uLCByZXNldGluZyB0aGUgaW50ZXJuYWwgc3RhdGUgYW5kXG4gICAgICogcmV0dXJuaW5nIHRoZSByZXN1bHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJhdyBUcnVlIHRvIGdldCB0aGUgcmF3IHN0cmluZywgZmFsc2UgdG8gZ2V0IHRoZSBoZXggc3RyaW5nXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSByZXN1bHRcbiAgICAgKi9cbiAgICBTcGFya01ENS5BcnJheUJ1ZmZlci5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHJhdykge1xuICAgICAgICB2YXIgYnVmZiA9IHRoaXMuX2J1ZmYsXG4gICAgICAgICAgICBsZW5ndGggPSBidWZmLmxlbmd0aCxcbiAgICAgICAgICAgIHRhaWwgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgcmV0O1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdGFpbFtpID4+IDJdIHw9IGJ1ZmZbaV0gPDwgKChpICUgNCkgPDwgMyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9maW5pc2godGFpbCwgbGVuZ3RoKTtcbiAgICAgICAgcmV0ID0gaGV4KHRoaXMuX2hhc2gpO1xuXG4gICAgICAgIGlmIChyYXcpIHtcbiAgICAgICAgICAgIHJldCA9IGhleFRvQmluYXJ5U3RyaW5nKHJldCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29tcHV0YXRpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTcGFya01ENS5BcnJheUJ1ZmZlcn0gVGhlIGluc3RhbmNlIGl0c2VsZlxuICAgICAqL1xuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fYnVmZiA9IG5ldyBVaW50OEFycmF5KDApO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLl9oYXNoID0gWzE3MzI1ODQxOTMsIC0yNzE3MzM4NzksIC0xNzMyNTg0MTk0LCAyNzE3MzM4NzhdO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29tcHV0YXRpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBzdGF0ZVxuICAgICAqL1xuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gU3BhcmtNRDUucHJvdG90eXBlLmdldFN0YXRlLmNhbGwodGhpcyk7XG5cbiAgICAgICAgLy8gQ29udmVydCBidWZmZXIgdG8gYSBzdHJpbmdcbiAgICAgICAgc3RhdGUuYnVmZiA9IGFycmF5QnVmZmVyMlV0ZjhTdHIoc3RhdGUuYnVmZik7XG5cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbnRlcm5hbCBzdGF0ZSBvZiB0aGUgY29tcHV0YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgVGhlIHN0YXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtTcGFya01ENS5BcnJheUJ1ZmZlcn0gVGhlIGluc3RhbmNlIGl0c2VsZlxuICAgICAqL1xuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyLnByb3RvdHlwZS5zZXRTdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAvLyBDb252ZXJ0IHN0cmluZyB0byBidWZmZXJcbiAgICAgICAgc3RhdGUuYnVmZiA9IHV0ZjhTdHIyQXJyYXlCdWZmZXIoc3RhdGUuYnVmZiwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIFNwYXJrTUQ1LnByb3RvdHlwZS5zZXRTdGF0ZS5jYWxsKHRoaXMsIHN0YXRlKTtcbiAgICB9O1xuXG4gICAgU3BhcmtNRDUuQXJyYXlCdWZmZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBTcGFya01ENS5wcm90b3R5cGUuZGVzdHJveTtcblxuICAgIFNwYXJrTUQ1LkFycmF5QnVmZmVyLnByb3RvdHlwZS5fZmluaXNoID0gU3BhcmtNRDUucHJvdG90eXBlLl9maW5pc2g7XG5cbiAgICAvKipcbiAgICAgKiBQZXJmb3JtcyB0aGUgbWQ1IGhhc2ggb24gYW4gYXJyYXkgYnVmZmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYXJyIFRoZSBhcnJheSBidWZmZXJcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59ICAgICByYXcgVHJ1ZSB0byBnZXQgdGhlIHJhdyBzdHJpbmcsIGZhbHNlIHRvIGdldCB0aGUgaGV4IG9uZVxuICAgICAqXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgcmVzdWx0XG4gICAgICovXG4gICAgU3BhcmtNRDUuQXJyYXlCdWZmZXIuaGFzaCA9IGZ1bmN0aW9uIChhcnIsIHJhdykge1xuICAgICAgICB2YXIgaGFzaCA9IG1kNTFfYXJyYXkobmV3IFVpbnQ4QXJyYXkoYXJyKSksXG4gICAgICAgICAgICByZXQgPSBoZXgoaGFzaCk7XG5cbiAgICAgICAgcmV0dXJuIHJhdyA/IGhleFRvQmluYXJ5U3RyaW5nKHJldCkgOiByZXQ7XG4gICAgfTtcblxuICAgIHJldHVybiBTcGFya01ENTtcbn0pKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBTdHJpbmdpZnkvcGFyc2UgZnVuY3Rpb25zIHRoYXQgZG9uJ3Qgb3BlcmF0ZVxuICogcmVjdXJzaXZlbHksIHNvIHRoZXkgYXZvaWQgY2FsbCBzdGFjayBleGNlZWRlZFxuICogZXJyb3JzLlxuICovXG5leHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIHN0cmluZ2lmeShpbnB1dCkge1xuICB2YXIgcXVldWUgPSBbXTtcbiAgcXVldWUucHVzaCh7b2JqOiBpbnB1dH0pO1xuXG4gIHZhciByZXMgPSAnJztcbiAgdmFyIG5leHQsIG9iaiwgcHJlZml4LCB2YWwsIGksIGFycmF5UHJlZml4LCBrZXlzLCBrLCBrZXksIHZhbHVlLCBvYmpQcmVmaXg7XG4gIHdoaWxlICgobmV4dCA9IHF1ZXVlLnBvcCgpKSkge1xuICAgIG9iaiA9IG5leHQub2JqO1xuICAgIHByZWZpeCA9IG5leHQucHJlZml4IHx8ICcnO1xuICAgIHZhbCA9IG5leHQudmFsIHx8ICcnO1xuICAgIHJlcyArPSBwcmVmaXg7XG4gICAgaWYgKHZhbCkge1xuICAgICAgcmVzICs9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgICByZXMgKz0gdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogSlNPTi5zdHJpbmdpZnkob2JqKTtcbiAgICB9IGVsc2UgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgICAgcmVzICs9ICdudWxsJztcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgcXVldWUucHVzaCh7dmFsOiAnXSd9KTtcbiAgICAgIGZvciAoaSA9IG9iai5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcnJheVByZWZpeCA9IGkgPT09IDAgPyAnJyA6ICcsJztcbiAgICAgICAgcXVldWUucHVzaCh7b2JqOiBvYmpbaV0sIHByZWZpeDogYXJyYXlQcmVmaXh9KTtcbiAgICAgIH1cbiAgICAgIHF1ZXVlLnB1c2goe3ZhbDogJ1snfSk7XG4gICAgfSBlbHNlIHsgLy8gb2JqZWN0XG4gICAgICBrZXlzID0gW107XG4gICAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHF1ZXVlLnB1c2goe3ZhbDogJ30nfSk7XG4gICAgICBmb3IgKGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgIHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgIG9ialByZWZpeCA9IChpID4gMCA/ICcsJyA6ICcnKTtcbiAgICAgICAgb2JqUHJlZml4ICs9IEpTT04uc3RyaW5naWZ5KGtleSkgKyAnOic7XG4gICAgICAgIHF1ZXVlLnB1c2goe29iajogdmFsdWUsIHByZWZpeDogb2JqUHJlZml4fSk7XG4gICAgICB9XG4gICAgICBxdWV1ZS5wdXNoKHt2YWw6ICd7J30pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufTtcblxuLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIHRoZSBwYXJzZSBmdW5jdGlvbi5cbi8vIFRoaXMgcG9wIGZ1bmN0aW9uIGlzIGJhc2ljYWxseSBjb3BpZWQgZnJvbVxuLy8gcG91Y2hDb2xsYXRlLnBhcnNlSW5kZXhhYmxlU3RyaW5nXG5mdW5jdGlvbiBwb3Aob2JqLCBzdGFjaywgbWV0YVN0YWNrKSB7XG4gIHZhciBsYXN0TWV0YUVsZW1lbnQgPSBtZXRhU3RhY2tbbWV0YVN0YWNrLmxlbmd0aCAtIDFdO1xuICBpZiAob2JqID09PSBsYXN0TWV0YUVsZW1lbnQuZWxlbWVudCkge1xuICAgIC8vIHBvcHBpbmcgYSBtZXRhLWVsZW1lbnQsIGUuZy4gYW4gb2JqZWN0IHdob3NlIHZhbHVlIGlzIGFub3RoZXIgb2JqZWN0XG4gICAgbWV0YVN0YWNrLnBvcCgpO1xuICAgIGxhc3RNZXRhRWxlbWVudCA9IG1ldGFTdGFja1ttZXRhU3RhY2subGVuZ3RoIC0gMV07XG4gIH1cbiAgdmFyIGVsZW1lbnQgPSBsYXN0TWV0YUVsZW1lbnQuZWxlbWVudDtcbiAgdmFyIGxhc3RFbGVtZW50SW5kZXggPSBsYXN0TWV0YUVsZW1lbnQuaW5kZXg7XG4gIGlmIChBcnJheS5pc0FycmF5KGVsZW1lbnQpKSB7XG4gICAgZWxlbWVudC5wdXNoKG9iaik7XG4gIH0gZWxzZSBpZiAobGFzdEVsZW1lbnRJbmRleCA9PT0gc3RhY2subGVuZ3RoIC0gMikgeyAvLyBvYmogd2l0aCBrZXkrdmFsdWVcbiAgICB2YXIga2V5ID0gc3RhY2sucG9wKCk7XG4gICAgZWxlbWVudFtrZXldID0gb2JqO1xuICB9IGVsc2Uge1xuICAgIHN0YWNrLnB1c2gob2JqKTsgLy8gb2JqIHdpdGgga2V5IG9ubHlcbiAgfVxufVxuXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHN0cikge1xuICB2YXIgc3RhY2sgPSBbXTtcbiAgdmFyIG1ldGFTdGFjayA9IFtdOyAvLyBzdGFjayBmb3IgYXJyYXlzIGFuZCBvYmplY3RzXG4gIHZhciBpID0gMDtcbiAgdmFyIGNvbGxhdGlvbkluZGV4LHBhcnNlZE51bSxudW1DaGFyO1xuICB2YXIgcGFyc2VkU3RyaW5nLGxhc3RDaCxudW1Db25zZWN1dGl2ZVNsYXNoZXMsY2g7XG4gIHZhciBhcnJheUVsZW1lbnQsIG9iakVsZW1lbnQ7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29sbGF0aW9uSW5kZXggPSBzdHJbaSsrXTtcbiAgICBpZiAoY29sbGF0aW9uSW5kZXggPT09ICd9JyB8fFxuICAgICAgICBjb2xsYXRpb25JbmRleCA9PT0gJ10nIHx8XG4gICAgICAgIHR5cGVvZiBjb2xsYXRpb25JbmRleCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGlmIChzdGFjay5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHN0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9wKHN0YWNrLnBvcCgpLCBzdGFjaywgbWV0YVN0YWNrKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAoY29sbGF0aW9uSW5kZXgpIHtcbiAgICAgIGNhc2UgJyAnOlxuICAgICAgY2FzZSAnXFx0JzpcbiAgICAgIGNhc2UgJ1xcbic6XG4gICAgICBjYXNlICc6JzpcbiAgICAgIGNhc2UgJywnOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ24nOlxuICAgICAgICBpICs9IDM7IC8vICd1bGwnXG4gICAgICAgIHBvcChudWxsLCBzdGFjaywgbWV0YVN0YWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0JzpcbiAgICAgICAgaSArPSAzOyAvLyAncnVlJ1xuICAgICAgICBwb3AodHJ1ZSwgc3RhY2ssIG1ldGFTdGFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZic6XG4gICAgICAgIGkgKz0gNDsgLy8gJ2Fsc2UnXG4gICAgICAgIHBvcChmYWxzZSwgc3RhY2ssIG1ldGFTdGFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnMCc6XG4gICAgICBjYXNlICcxJzpcbiAgICAgIGNhc2UgJzInOlxuICAgICAgY2FzZSAnMyc6XG4gICAgICBjYXNlICc0JzpcbiAgICAgIGNhc2UgJzUnOlxuICAgICAgY2FzZSAnNic6XG4gICAgICBjYXNlICc3JzpcbiAgICAgIGNhc2UgJzgnOlxuICAgICAgY2FzZSAnOSc6XG4gICAgICBjYXNlICctJzpcbiAgICAgICAgcGFyc2VkTnVtID0gJyc7XG4gICAgICAgIGktLTtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBudW1DaGFyID0gc3RyW2krK107XG4gICAgICAgICAgaWYgKC9bXFxkXFwuXFwtZVxcK10vLnRlc3QobnVtQ2hhcikpIHtcbiAgICAgICAgICAgIHBhcnNlZE51bSArPSBudW1DaGFyO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpLS07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcG9wKHBhcnNlRmxvYXQocGFyc2VkTnVtKSwgc3RhY2ssIG1ldGFTdGFjayk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnXCInOlxuICAgICAgICBwYXJzZWRTdHJpbmcgPSAnJztcbiAgICAgICAgbGFzdENoID0gdm9pZCAwO1xuICAgICAgICBudW1Db25zZWN1dGl2ZVNsYXNoZXMgPSAwO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGNoID0gc3RyW2krK107XG4gICAgICAgICAgaWYgKGNoICE9PSAnXCInIHx8IChsYXN0Q2ggPT09ICdcXFxcJyAmJlxuICAgICAgICAgICAgICBudW1Db25zZWN1dGl2ZVNsYXNoZXMgJSAyID09PSAxKSkge1xuICAgICAgICAgICAgcGFyc2VkU3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbGFzdENoID0gY2g7XG4gICAgICAgICAgICBpZiAobGFzdENoID09PSAnXFxcXCcpIHtcbiAgICAgICAgICAgICAgbnVtQ29uc2VjdXRpdmVTbGFzaGVzKys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBudW1Db25zZWN1dGl2ZVNsYXNoZXMgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcG9wKEpTT04ucGFyc2UoJ1wiJyArIHBhcnNlZFN0cmluZyArICdcIicpLCBzdGFjaywgbWV0YVN0YWNrKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdbJzpcbiAgICAgICAgYXJyYXlFbGVtZW50ID0geyBlbGVtZW50OiBbXSwgaW5kZXg6IHN0YWNrLmxlbmd0aCB9O1xuICAgICAgICBzdGFjay5wdXNoKGFycmF5RWxlbWVudC5lbGVtZW50KTtcbiAgICAgICAgbWV0YVN0YWNrLnB1c2goYXJyYXlFbGVtZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd7JzpcbiAgICAgICAgb2JqRWxlbWVudCA9IHsgZWxlbWVudDoge30sIGluZGV4OiBzdGFjay5sZW5ndGggfTtcbiAgICAgICAgc3RhY2sucHVzaChvYmpFbGVtZW50LmVsZW1lbnQpO1xuICAgICAgICBtZXRhU3RhY2sucHVzaChvYmpFbGVtZW50KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ3VuZXhwZWN0ZWRseSByZWFjaGVkIGVuZCBvZiBpbnB1dDogJyArIGNvbGxhdGlvbkluZGV4KTtcbiAgICB9XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wRGVmYXVsdCAoZXgpIHsgcmV0dXJuIChleCAmJiAodHlwZW9mIGV4ID09PSAnb2JqZWN0JykgJiYgJ2RlZmF1bHQnIGluIGV4KSA/IGV4WydkZWZhdWx0J10gOiBleDsgfVxuXG52YXIgbGllID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ2xpZScpKTtcbnZhciBnZXRBcmd1bWVudHMgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnYXJnc2FycmF5JykpO1xudmFyIGRlYnVnID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ2RlYnVnJykpO1xudmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIGluaGVyaXRzID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ2luaGVyaXRzJykpO1xudmFyIHNjb3BlZEV2YWwgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnc2NvcGUtZXZhbCcpKTtcbnZhciBNZDUgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnc3BhcmstbWQ1JykpO1xudmFyIHZ1dnV6ZWxhID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ3Z1dnV6ZWxhJykpO1xudmFyIFByb21pc2VQb29sID0gX2ludGVyb3BEZWZhdWx0KHJlcXVpcmUoJ2VzNi1wcm9taXNlLXBvb2wnKSk7XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG52YXIgUG91Y2hQcm9taXNlID0gdHlwZW9mIFByb21pc2UgPT09ICdmdW5jdGlvbicgPyBQcm9taXNlIDogbGllO1xuXG5mdW5jdGlvbiBpc0JpbmFyeU9iamVjdChvYmplY3QpIHtcbiAgcmV0dXJuICh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIG9iamVjdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB8fFxuICAgICh0eXBlb2YgQmxvYiAhPT0gJ3VuZGVmaW5lZCcgJiYgb2JqZWN0IGluc3RhbmNlb2YgQmxvYik7XG59XG5cbmZ1bmN0aW9uIGNsb25lQXJyYXlCdWZmZXIoYnVmZikge1xuICBpZiAodHlwZW9mIGJ1ZmYuc2xpY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gYnVmZi5zbGljZSgwKTtcbiAgfVxuICAvLyBJRTEwLTExIHNsaWNlKCkgcG9seWZpbGxcbiAgdmFyIHRhcmdldCA9IG5ldyBBcnJheUJ1ZmZlcihidWZmLmJ5dGVMZW5ndGgpO1xuICB2YXIgdGFyZ2V0QXJyYXkgPSBuZXcgVWludDhBcnJheSh0YXJnZXQpO1xuICB2YXIgc291cmNlQXJyYXkgPSBuZXcgVWludDhBcnJheShidWZmKTtcbiAgdGFyZ2V0QXJyYXkuc2V0KHNvdXJjZUFycmF5KTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuZnVuY3Rpb24gY2xvbmVCaW5hcnlPYmplY3Qob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiBjbG9uZUFycmF5QnVmZmVyKG9iamVjdCk7XG4gIH1cbiAgdmFyIHNpemUgPSBvYmplY3Quc2l6ZTtcbiAgdmFyIHR5cGUgPSBvYmplY3QudHlwZTtcbiAgLy8gQmxvYlxuICBpZiAodHlwZW9mIG9iamVjdC5zbGljZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBvYmplY3Quc2xpY2UoMCwgc2l6ZSwgdHlwZSk7XG4gIH1cbiAgLy8gUGhhbnRvbUpTIHNsaWNlKCkgcmVwbGFjZW1lbnRcbiAgcmV0dXJuIG9iamVjdC53ZWJraXRTbGljZSgwLCBzaXplLCB0eXBlKTtcbn1cblxuLy8gbW9zdCBvZiB0aGlzIGlzIGJvcnJvd2VkIGZyb20gbG9kYXNoLmlzUGxhaW5PYmplY3Q6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmlzLWNvbXBvbmVudHMvbG9kYXNoLmlzcGxhaW5vYmplY3QvXG4vLyBibG9iLzI5YzM1ODE0MGE3NGYyNTJhZWIwOGM5ZWIyOGJlZjg2ZjIyMTdkNGEvaW5kZXguanNcblxudmFyIGZ1bmNUb1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcbnZhciBvYmplY3RDdG9yU3RyaW5nID0gZnVuY1RvU3RyaW5nLmNhbGwoT2JqZWN0KTtcblxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpO1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHByb3RvID09PSBudWxsKSB7IC8vIG5vdCBzdXJlIHdoZW4gdGhpcyBoYXBwZW5zLCBidXQgSSBndWVzcyBpdCBjYW5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgQ3RvciA9IHByb3RvLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gKHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiZcbiAgICBDdG9yIGluc3RhbmNlb2YgQ3RvciAmJiBmdW5jVG9TdHJpbmcuY2FsbChDdG9yKSA9PSBvYmplY3RDdG9yU3RyaW5nKTtcbn1cblxuZnVuY3Rpb24gY2xvbmUob2JqZWN0KSB7XG4gIHZhciBuZXdPYmplY3Q7XG4gIHZhciBpO1xuICB2YXIgbGVuO1xuXG4gIGlmICghb2JqZWN0IHx8IHR5cGVvZiBvYmplY3QgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICBuZXdPYmplY3QgPSBbXTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBvYmplY3QubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG5ld09iamVjdFtpXSA9IGNsb25lKG9iamVjdFtpXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXdPYmplY3Q7XG4gIH1cblxuICAvLyBzcGVjaWFsIGNhc2U6IHRvIGF2b2lkIGluY29uc2lzdGVuY2llcyBiZXR3ZWVuIEluZGV4ZWREQlxuICAvLyBhbmQgb3RoZXIgYmFja2VuZHMsIHdlIGF1dG9tYXRpY2FsbHkgc3RyaW5naWZ5IERhdGVzXG4gIGlmIChvYmplY3QgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmV0dXJuIG9iamVjdC50b0lTT1N0cmluZygpO1xuICB9XG5cbiAgaWYgKGlzQmluYXJ5T2JqZWN0KG9iamVjdCkpIHtcbiAgICByZXR1cm4gY2xvbmVCaW5hcnlPYmplY3Qob2JqZWN0KTtcbiAgfVxuXG4gIGlmICghaXNQbGFpbk9iamVjdChvYmplY3QpKSB7XG4gICAgcmV0dXJuIG9iamVjdDsgLy8gZG9uJ3QgY2xvbmUgb2JqZWN0cyBsaWtlIFdvcmtlcnNcbiAgfVxuXG4gIG5ld09iamVjdCA9IHt9O1xuICBmb3IgKGkgaW4gb2JqZWN0KSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgaSkpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGNsb25lKG9iamVjdFtpXSk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBuZXdPYmplY3RbaV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ld09iamVjdDtcbn1cblxuZnVuY3Rpb24gb25jZShmdW4pIHtcbiAgdmFyIGNhbGxlZCA9IGZhbHNlO1xuICByZXR1cm4gZ2V0QXJndW1lbnRzKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKGNhbGxlZCkge1xuICAgICAgLy8gdGhpcyBpcyBhIHNtb2tlIHRlc3QgYW5kIHNob3VsZCBuZXZlciBhY3R1YWxseSBoYXBwZW5cbiAgICAgIHRocm93IG5ldyBFcnJvcignb25jZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgIGZ1bi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0b1Byb21pc2UoZnVuYykge1xuICAvL2NyZWF0ZSB0aGUgZnVuY3Rpb24gd2Ugd2lsbCBiZSByZXR1cm5pbmdcbiAgcmV0dXJuIGdldEFyZ3VtZW50cyhmdW5jdGlvbiAoYXJncykge1xuICAgIC8vIENsb25lIGFyZ3VtZW50c1xuICAgIGFyZ3MgPSBjbG9uZShhcmdzKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHRlbXBDQiA9XG4gICAgICAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykgPyBhcmdzLnBvcCgpIDogZmFsc2U7XG4gICAgLy8gaWYgdGhlIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgYXNzdW1lIGl0cyBhIGNhbGxiYWNrXG4gICAgdmFyIHVzZWRDQjtcbiAgICBpZiAodGVtcENCKSB7XG4gICAgICAvLyBpZiBpdCB3YXMgYSBjYWxsYmFjaywgY3JlYXRlIGEgbmV3IGNhbGxiYWNrIHdoaWNoIGNhbGxzIGl0LFxuICAgICAgLy8gYnV0IGRvIHNvIGFzeW5jIHNvIHdlIGRvbid0IHRyYXAgYW55IGVycm9yc1xuICAgICAgdXNlZENCID0gZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0ZW1wQ0IoZXJyLCByZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH1cbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKGZ1bGZpbGwsIHJlamVjdCkge1xuICAgICAgdmFyIHJlc3A7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBvbmNlKGZ1bmN0aW9uIChlcnIsIG1lc2cpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnVsZmlsbChtZXNnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjcmVhdGUgYSBjYWxsYmFjayBmb3IgdGhpcyBpbnZvY2F0aW9uXG4gICAgICAgIC8vIGFwcGx5IHRoZSBmdW5jdGlvbiBpbiB0aGUgb3JpZyBjb250ZXh0XG4gICAgICAgIGFyZ3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgIHJlc3AgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICBpZiAocmVzcCAmJiB0eXBlb2YgcmVzcC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgZnVsZmlsbChyZXNwKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gaWYgdGhlcmUgaXMgYSBjYWxsYmFjaywgY2FsbCBpdCBiYWNrXG4gICAgaWYgKHVzZWRDQikge1xuICAgICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgdXNlZENCKG51bGwsIHJlc3VsdCk7XG4gICAgICB9LCB1c2VkQ0IpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSk7XG59XG5cbnZhciBsb2cgPSBkZWJ1ZygncG91Y2hkYjphcGknKTtcblxuZnVuY3Rpb24gYWRhcHRlckZ1bihuYW1lLCBjYWxsYmFjaykge1xuICBmdW5jdGlvbiBsb2dBcGlDYWxsKHNlbGYsIG5hbWUsIGFyZ3MpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAobG9nLmVuYWJsZWQpIHtcbiAgICAgIHZhciBsb2dBcmdzID0gW3NlbGYubmFtZSwgbmFtZV07XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgIGxvZ0FyZ3MucHVzaChhcmdzW2ldKTtcbiAgICAgIH1cbiAgICAgIGxvZy5hcHBseShudWxsLCBsb2dBcmdzKTtcblxuICAgICAgLy8gb3ZlcnJpZGUgdGhlIGNhbGxiYWNrIGl0c2VsZiB0byBsb2cgdGhlIHJlc3BvbnNlXG4gICAgICB2YXIgb3JpZ0NhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgYXJnc1thcmdzLmxlbmd0aCAtIDFdID0gZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIHZhciByZXNwb25zZUFyZ3MgPSBbc2VsZi5uYW1lLCBuYW1lXTtcbiAgICAgICAgcmVzcG9uc2VBcmdzID0gcmVzcG9uc2VBcmdzLmNvbmNhdChcbiAgICAgICAgICBlcnIgPyBbJ2Vycm9yJywgZXJyXSA6IFsnc3VjY2VzcycsIHJlc11cbiAgICAgICAgKTtcbiAgICAgICAgbG9nLmFwcGx5KG51bGwsIHJlc3BvbnNlQXJncyk7XG4gICAgICAgIG9yaWdDYWxsYmFjayhlcnIsIHJlcyk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0b1Byb21pc2UoZ2V0QXJndW1lbnRzKGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdkYXRhYmFzZSBpcyBjbG9zZWQnKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybiBQb3VjaFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignZGF0YWJhc2UgaXMgZGVzdHJveWVkJykpO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgbG9nQXBpQ2FsbChzZWxmLCBuYW1lLCBhcmdzKTtcbiAgICBpZiAoIXRoaXMudGFza3F1ZXVlLmlzUmVhZHkpIHtcbiAgICAgIHJldHVybiBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChmdWxmaWxsLCByZWplY3QpIHtcbiAgICAgICAgc2VsZi50YXNrcXVldWUuYWRkVGFzayhmdW5jdGlvbiAoZmFpbGVkKSB7XG4gICAgICAgICAgaWYgKGZhaWxlZCkge1xuICAgICAgICAgICAgcmVqZWN0KGZhaWxlZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZ1bGZpbGwoc2VsZltuYW1lXS5hcHBseShzZWxmLCBhcmdzKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gIH0pKTtcbn1cblxuLy8gbGlrZSB1bmRlcnNjb3JlL2xvZGFzaCBfLnBpY2soKVxuZnVuY3Rpb24gcGljayhvYmosIGFycikge1xuICB2YXIgcmVzID0ge307XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgcHJvcCA9IGFycltpXTtcbiAgICBpZiAocHJvcCBpbiBvYmopIHtcbiAgICAgIHJlc1twcm9wXSA9IG9ialtwcm9wXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLy8gTW9zdCBicm93c2VycyB0aHJvdHRsZSBjb25jdXJyZW50IHJlcXVlc3RzIGF0IDYsIHNvIGl0J3Mgc2lsbHlcbi8vIHRvIHNoaW0gX2J1bGtfZ2V0IGJ5IHRyeWluZyB0byBsYXVuY2ggcG90ZW50aWFsbHkgaHVuZHJlZHMgb2YgcmVxdWVzdHNcbi8vIGFuZCB0aGVuIGxldHRpbmcgdGhlIG1ham9yaXR5IHRpbWUgb3V0LiBXZSBjYW4gaGFuZGxlIHRoaXMgb3Vyc2VsdmVzLlxudmFyIE1BWF9OVU1fQ09OQ1VSUkVOVF9SRVFVRVNUUyA9IDY7XG5cbmZ1bmN0aW9uIGlkZW50aXR5RnVuY3Rpb24oeCkge1xuICByZXR1cm4geDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UmVzdWx0Rm9yT3BlblJldnNHZXQocmVzdWx0KSB7XG4gIHJldHVybiBbe1xuICAgIG9rOiByZXN1bHRcbiAgfV07XG59XG5cbi8vIHNoaW0gZm9yIFAvQ291Y2hEQiBhZGFwdGVycyB0aGF0IGRvbid0IGRpcmVjdGx5IGltcGxlbWVudCBfYnVsa19nZXRcbmZ1bmN0aW9uIGJ1bGtHZXQoZGIsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIHZhciByZXF1ZXN0cyA9IG9wdHMuZG9jcztcblxuICAvLyBjb25zb2xpZGF0ZSBpbnRvIG9uZSByZXF1ZXN0IHBlciBkb2MgaWYgcG9zc2libGVcbiAgdmFyIHJlcXVlc3RzQnlJZCA9IHt9O1xuICByZXF1ZXN0cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgaWYgKHJlcXVlc3QuaWQgaW4gcmVxdWVzdHNCeUlkKSB7XG4gICAgICByZXF1ZXN0c0J5SWRbcmVxdWVzdC5pZF0ucHVzaChyZXF1ZXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdHNCeUlkW3JlcXVlc3QuaWRdID0gW3JlcXVlc3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIG51bURvY3MgPSBPYmplY3Qua2V5cyhyZXF1ZXN0c0J5SWQpLmxlbmd0aDtcbiAgdmFyIG51bURvbmUgPSAwO1xuICB2YXIgcGVyRG9jUmVzdWx0cyA9IG5ldyBBcnJheShudW1Eb2NzKTtcblxuICBmdW5jdGlvbiBjb2xsYXBzZVJlc3VsdHNBbmRGaW5pc2goKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBwZXJEb2NSZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKHJlcykge1xuICAgICAgcmVzLmRvY3MuZm9yRWFjaChmdW5jdGlvbiAoaW5mbykge1xuICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgIGlkOiByZXMuaWQsXG4gICAgICAgICAgZG9jczogW2luZm9dXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgY2FsbGJhY2sobnVsbCwge3Jlc3VsdHM6IHJlc3VsdHN9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICBpZiAoKytudW1Eb25lID09PSBudW1Eb2NzKSB7XG4gICAgICBjb2xsYXBzZVJlc3VsdHNBbmRGaW5pc2goKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnb3RSZXN1bHQoZG9jSW5kZXgsIGlkLCBkb2NzKSB7XG4gICAgcGVyRG9jUmVzdWx0c1tkb2NJbmRleF0gPSB7aWQ6IGlkLCBkb2NzOiBkb2NzfTtcbiAgICBjaGVja0RvbmUoKTtcbiAgfVxuXG4gIHZhciBhbGxSZXF1ZXN0cyA9IE9iamVjdC5rZXlzKHJlcXVlc3RzQnlJZCk7XG5cbiAgdmFyIGkgPSAwO1xuXG4gIGZ1bmN0aW9uIG5leHRCYXRjaCgpIHtcblxuICAgIGlmIChpID49IGFsbFJlcXVlc3RzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB1cFRvID0gTWF0aC5taW4oaSArIE1BWF9OVU1fQ09OQ1VSUkVOVF9SRVFVRVNUUywgYWxsUmVxdWVzdHMubGVuZ3RoKTtcbiAgICB2YXIgYmF0Y2ggPSBhbGxSZXF1ZXN0cy5zbGljZShpLCB1cFRvKTtcbiAgICBwcm9jZXNzQmF0Y2goYmF0Y2gsIGkpO1xuICAgIGkgKz0gYmF0Y2gubGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc0JhdGNoKGJhdGNoLCBvZmZzZXQpIHtcbiAgICBiYXRjaC5mb3JFYWNoKGZ1bmN0aW9uIChkb2NJZCwgaikge1xuICAgICAgdmFyIGRvY0lkeCA9IG9mZnNldCArIGo7XG4gICAgICB2YXIgZG9jUmVxdWVzdHMgPSByZXF1ZXN0c0J5SWRbZG9jSWRdO1xuXG4gICAgICAvLyBqdXN0IHVzZSB0aGUgZmlyc3QgcmVxdWVzdCBhcyB0aGUgXCJ0ZW1wbGF0ZVwiXG4gICAgICAvLyBUT0RPOiBUaGUgX2J1bGtfZ2V0IEFQSSBhbGxvd3MgZm9yIG1vcmUgc3VidGxlIHVzZSBjYXNlcyB0aGFuIHRoaXMsXG4gICAgICAvLyBidXQgZm9yIG5vdyBpdCBpcyB1bmxpa2VseSB0aGF0IHRoZXJlIHdpbGwgYmUgYSBtaXggb2YgZGlmZmVyZW50XG4gICAgICAvLyBcImF0dHNfc2luY2VcIiBvciBcImF0dGFjaG1lbnRzXCIgaW4gdGhlIHNhbWUgcmVxdWVzdCwgc2luY2UgaXQncyBqdXN0XG4gICAgICAvLyByZXBsaWNhdGUuanMgdGhhdCBpcyB1c2luZyB0aGlzIGZvciB0aGUgbW9tZW50LlxuICAgICAgLy8gQWxzbywgYXR0c19zaW5jZSBpcyBhc3BpcmF0aW9uYWwsIHNpbmNlIHdlIGRvbid0IHN1cHBvcnQgaXQgeWV0LlxuICAgICAgdmFyIGRvY09wdHMgPSBwaWNrKGRvY1JlcXVlc3RzWzBdLCBbJ2F0dHNfc2luY2UnLCAnYXR0YWNobWVudHMnXSk7XG4gICAgICBkb2NPcHRzLm9wZW5fcmV2cyA9IGRvY1JlcXVlc3RzLm1hcChmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgICAvLyByZXYgaXMgb3B0aW9uYWwsIG9wZW5fcmV2cyBkaXNhbGxvd2VkXG4gICAgICAgIHJldHVybiByZXF1ZXN0LnJldjtcbiAgICAgIH0pO1xuXG4gICAgICAvLyByZW1vdmUgZmFsc2V5IC8gdW5kZWZpbmVkIHJldmlzaW9uc1xuICAgICAgZG9jT3B0cy5vcGVuX3JldnMgPSBkb2NPcHRzLm9wZW5fcmV2cy5maWx0ZXIoaWRlbnRpdHlGdW5jdGlvbik7XG5cbiAgICAgIHZhciBmb3JtYXRSZXN1bHQgPSBpZGVudGl0eUZ1bmN0aW9uO1xuXG4gICAgICBpZiAoZG9jT3B0cy5vcGVuX3JldnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSBkb2NPcHRzLm9wZW5fcmV2cztcblxuICAgICAgICAvLyB3aGVuIGZldGNoaW5nIG9ubHkgdGhlIFwid2lubmluZ1wiIGxlYWYsXG4gICAgICAgIC8vIHRyYW5zZm9ybSB0aGUgcmVzdWx0IHNvIGl0IGxvb2tzIGxpa2UgYW4gb3Blbl9yZXZzXG4gICAgICAgIC8vIHJlcXVlc3RcbiAgICAgICAgZm9ybWF0UmVzdWx0ID0gZm9ybWF0UmVzdWx0Rm9yT3BlblJldnNHZXQ7XG4gICAgICB9XG5cbiAgICAgIC8vIGdsb2JhbGx5LXN1cHBsaWVkIG9wdGlvbnNcbiAgICAgIFsncmV2cycsICdhdHRhY2htZW50cycsICdiaW5hcnknLCAnYWpheCddLmZvckVhY2goZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgIGlmIChwYXJhbSBpbiBvcHRzKSB7XG4gICAgICAgICAgZG9jT3B0c1twYXJhbV0gPSBvcHRzW3BhcmFtXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBkYi5nZXQoZG9jSWQsIGRvY09wdHMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlc3VsdCA9IFt7ZXJyb3I6IGVycn1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdCA9IGZvcm1hdFJlc3VsdChyZXMpO1xuICAgICAgICB9XG4gICAgICAgIGdvdFJlc3VsdChkb2NJZHgsIGRvY0lkLCByZXN1bHQpO1xuICAgICAgICBuZXh0QmF0Y2goKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgbmV4dEJhdGNoKCk7XG5cbn1cblxuZnVuY3Rpb24gaXNDaHJvbWVBcHAoKSB7XG4gIHJldHVybiAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBjaHJvbWUuc3RvcmFnZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBjaHJvbWUuc3RvcmFnZS5sb2NhbCAhPT0gXCJ1bmRlZmluZWRcIik7XG59XG5cbnZhciBoYXNMb2NhbDtcblxuaWYgKGlzQ2hyb21lQXBwKCkpIHtcbiAgaGFzTG9jYWwgPSBmYWxzZTtcbn0gZWxzZSB7XG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ19wb3VjaF9jaGVja19sb2NhbHN0b3JhZ2UnLCAxKTtcbiAgICBoYXNMb2NhbCA9ICEhbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ19wb3VjaF9jaGVja19sb2NhbHN0b3JhZ2UnKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGhhc0xvY2FsID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzTG9jYWxTdG9yYWdlKCkge1xuICByZXR1cm4gaGFzTG9jYWw7XG59XG5cbmluaGVyaXRzKENoYW5nZXMsIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gYXR0YWNoQnJvd3NlckV2ZW50cyhzZWxmKSB7XG4gIGlmIChpc0Nocm9tZUFwcCgpKSB7XG4gICAgY2hyb21lLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyBtYWtlIHN1cmUgaXQncyBldmVudCBhZGRyZXNzZWQgdG8gdXNcbiAgICAgIGlmIChlLmRiX25hbWUgIT0gbnVsbCkge1xuICAgICAgICAvL29iamVjdCBvbmx5IGhhcyBvbGRWYWx1ZSwgbmV3VmFsdWUgbWVtYmVyc1xuICAgICAgICBzZWxmLmVtaXQoZS5kYk5hbWUubmV3VmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKGhhc0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihcInN0b3JhZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgc2VsZi5lbWl0KGUua2V5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7IC8vIG9sZCBJRVxuICAgICAgd2luZG93LmF0dGFjaEV2ZW50KFwic3RvcmFnZVwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBzZWxmLmVtaXQoZS5rZXkpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIENoYW5nZXMoKSB7XG4gIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbiAgdGhpcy5fbGlzdGVuZXJzID0ge307XG5cbiAgYXR0YWNoQnJvd3NlckV2ZW50cyh0aGlzKTtcbn1cbkNoYW5nZXMucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gKGRiTmFtZSwgaWQsIGRiLCBvcHRzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAodGhpcy5fbGlzdGVuZXJzW2lkXSkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBpbnByb2dyZXNzID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGV2ZW50RnVuY3Rpb24oKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFzZWxmLl9saXN0ZW5lcnNbaWRdKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChpbnByb2dyZXNzKSB7XG4gICAgICBpbnByb2dyZXNzID0gJ3dhaXRpbmcnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpbnByb2dyZXNzID0gdHJ1ZTtcbiAgICB2YXIgY2hhbmdlc09wdHMgPSBwaWNrKG9wdHMsIFtcbiAgICAgICdzdHlsZScsICdpbmNsdWRlX2RvY3MnLCAnYXR0YWNobWVudHMnLCAnY29uZmxpY3RzJywgJ2ZpbHRlcicsXG4gICAgICAnZG9jX2lkcycsICd2aWV3JywgJ3NpbmNlJywgJ3F1ZXJ5X3BhcmFtcycsICdiaW5hcnknXG4gICAgXSk7XG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGZ1bmN0aW9uIG9uRXJyb3IoKSB7XG4gICAgICBpbnByb2dyZXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZGIuY2hhbmdlcyhjaGFuZ2VzT3B0cykub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChjKSB7XG4gICAgICBpZiAoYy5zZXEgPiBvcHRzLnNpbmNlICYmICFvcHRzLmNhbmNlbGxlZCkge1xuICAgICAgICBvcHRzLnNpbmNlID0gYy5zZXE7XG4gICAgICAgIG9wdHMub25DaGFuZ2UoYyk7XG4gICAgICB9XG4gICAgfSkub24oJ2NvbXBsZXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGlucHJvZ3Jlc3MgPT09ICd3YWl0aW5nJykge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpe1xuICAgICAgICAgIGV2ZW50RnVuY3Rpb24oKTtcbiAgICAgICAgfSwwKTtcbiAgICAgIH1cbiAgICAgIGlucHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICB9KS5vbignZXJyb3InLCBvbkVycm9yKTtcbiAgfVxuICB0aGlzLl9saXN0ZW5lcnNbaWRdID0gZXZlbnRGdW5jdGlvbjtcbiAgdGhpcy5vbihkYk5hbWUsIGV2ZW50RnVuY3Rpb24pO1xufTtcblxuQ2hhbmdlcy5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZGJOYW1lLCBpZCkge1xuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKCEoaWQgaW4gdGhpcy5fbGlzdGVuZXJzKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBldmVudHMuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lci5jYWxsKHRoaXMsIGRiTmFtZSxcbiAgICB0aGlzLl9saXN0ZW5lcnNbaWRdKTtcbiAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tpZF07XG59O1xuXG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5DaGFuZ2VzLnByb3RvdHlwZS5ub3RpZnlMb2NhbFdpbmRvd3MgPSBmdW5jdGlvbiAoZGJOYW1lKSB7XG4gIC8vZG8gYSB1c2VsZXNzIGNoYW5nZSBvbiBhIHN0b3JhZ2UgdGhpbmdcbiAgLy9pbiBvcmRlciB0byBnZXQgb3RoZXIgd2luZG93cydzIGxpc3RlbmVycyB0byBhY3RpdmF0ZVxuICBpZiAoaXNDaHJvbWVBcHAoKSkge1xuICAgIGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7ZGJOYW1lOiBkYk5hbWV9KTtcbiAgfSBlbHNlIGlmIChoYXNMb2NhbFN0b3JhZ2UoKSkge1xuICAgIGxvY2FsU3RvcmFnZVtkYk5hbWVdID0gKGxvY2FsU3RvcmFnZVtkYk5hbWVdID09PSBcImFcIikgPyBcImJcIiA6IFwiYVwiO1xuICB9XG59O1xuXG5DaGFuZ2VzLnByb3RvdHlwZS5ub3RpZnkgPSBmdW5jdGlvbiAoZGJOYW1lKSB7XG4gIHRoaXMuZW1pdChkYk5hbWUpO1xuICB0aGlzLm5vdGlmeUxvY2FsV2luZG93cyhkYk5hbWUpO1xufTtcblxuZnVuY3Rpb24gZ3VhcmRlZENvbnNvbGUobWV0aG9kKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBtZXRob2QgaW4gY29uc29sZSkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBjb25zb2xlW21ldGhvZF0uYXBwbHkoY29uc29sZSwgYXJncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmFuZG9tTnVtYmVyKG1pbiwgbWF4KSB7XG4gIHZhciBtYXhUaW1lb3V0ID0gNjAwMDAwOyAvLyBIYXJkLWNvZGVkIGRlZmF1bHQgb2YgMTAgbWludXRlc1xuICBtaW4gPSBwYXJzZUludChtaW4sIDEwKSB8fCAwO1xuICBtYXggPSBwYXJzZUludChtYXgsIDEwKTtcbiAgaWYgKG1heCAhPT0gbWF4IHx8IG1heCA8PSBtaW4pIHtcbiAgICBtYXggPSAobWluIHx8IDEpIDw8IDE7IC8vZG91YmxpbmdcbiAgfSBlbHNlIHtcbiAgICBtYXggPSBtYXggKyAxO1xuICB9XG4gIC8vIEluIG9yZGVyIHRvIG5vdCBleGNlZWQgbWF4VGltZW91dCwgcGljayBhIHJhbmRvbSB2YWx1ZSBiZXR3ZWVuIGhhbGYgb2YgbWF4VGltZW91dCBhbmQgbWF4VGltZW91dFxuICBpZihtYXggPiBtYXhUaW1lb3V0KSB7XG4gICAgbWluID0gbWF4VGltZW91dCA+PiAxOyAvLyBkaXZpZGUgYnkgdHdvXG4gICAgbWF4ID0gbWF4VGltZW91dDtcbiAgfVxuICB2YXIgcmF0aW8gPSBNYXRoLnJhbmRvbSgpO1xuICB2YXIgcmFuZ2UgPSBtYXggLSBtaW47XG5cbiAgcmV0dXJuIH5+KHJhbmdlICogcmF0aW8gKyBtaW4pOyAvLyB+fiBjb2VyY2VzIHRvIGFuIGludCwgYnV0IGZhc3QuXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRCYWNrT2ZmKG1pbikge1xuICB2YXIgbWF4ID0gMDtcbiAgaWYgKCFtaW4pIHtcbiAgICBtYXggPSAyMDAwO1xuICB9XG4gIHJldHVybiByYW5kb21OdW1iZXIobWluLCBtYXgpO1xufVxuXG4vLyBkZXNpZ25lZCB0byBnaXZlIGluZm8gdG8gYnJvd3NlciB1c2Vycywgd2hvIGFyZSBkaXN0dXJiZWRcbi8vIHdoZW4gdGhleSBzZWUgaHR0cCBlcnJvcnMgaW4gdGhlIGNvbnNvbGVcbmZ1bmN0aW9uIGV4cGxhaW5FcnJvcihzdGF0dXMsIHN0cikge1xuICBndWFyZGVkQ29uc29sZSgnaW5mbycsICdUaGUgYWJvdmUgJyArIHN0YXR1cyArICcgaXMgdG90YWxseSBub3JtYWwuICcgKyBzdHIpO1xufVxuXG4vLyBmb3JrZWQgZnJvbVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZtYXR0b3MvanMtZXh0ZW5kL2Jsb2IvNzAyM2ZkNjlhOWU5NTUyNjg4MDg2YjhiODAwNmIxZmNmOTE2YTMwNi9leHRlbmQuanNcbi8vIFRPRE86IEkgZG9uJ3Qga25vdyB3aHkgd2UgaGF2ZSB0d28gZGlmZmVyZW50IGV4dGVuZCgpIGZ1bmN0aW9ucyBpbiBQb3VjaERCXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBlYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbmZ1bmN0aW9uIGV4dGVuZCQxKG9iaikge1xuICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBvYmogKyAnIGlzIG5vdCBhbiBvYmplY3QnIDtcbiAgfVxuXG4gIHZhciBzb3VyY2VzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGVhY2guY2FsbChzb3VyY2VzLCBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbcHJvcF0gPT09ICdvYmplY3QnICYmIG9ialtwcm9wXSkge1xuICAgICAgICAgIGV4dGVuZCQxLmNhbGwob2JqLCBvYmpbcHJvcF0sIHNvdXJjZVtwcm9wXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb2JqO1xufVxuXG5pbmhlcml0cyhQb3VjaEVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIFBvdWNoRXJyb3Ioc3RhdHVzLCBlcnJvciwgcmVhc29uKSB7XG4gIEVycm9yLmNhbGwodGhpcywgcmVhc29uKTtcbiAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gIHRoaXMubmFtZSA9IGVycm9yO1xuICB0aGlzLm1lc3NhZ2UgPSByZWFzb247XG4gIHRoaXMuZXJyb3IgPSB0cnVlO1xufVxuXG5Qb3VjaEVycm9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgIG5hbWU6IHRoaXMubmFtZSxcbiAgICBtZXNzYWdlOiB0aGlzLm1lc3NhZ2UsXG4gICAgcmVhc29uOiB0aGlzLnJlYXNvblxuICB9KTtcbn07XG5cbnZhciBVTkFVVEhPUklaRUQgPSBuZXcgUG91Y2hFcnJvcig0MDEsICd1bmF1dGhvcml6ZWQnLCBcIk5hbWUgb3IgcGFzc3dvcmQgaXMgaW5jb3JyZWN0LlwiKTtcbnZhciBNSVNTSU5HX0JVTEtfRE9DUyA9IG5ldyBQb3VjaEVycm9yKDQwMCwgJ2JhZF9yZXF1ZXN0JywgXCJNaXNzaW5nIEpTT04gbGlzdCBvZiAnZG9jcydcIik7XG52YXIgTUlTU0lOR19ET0MgPSBuZXcgUG91Y2hFcnJvcig0MDQsICdub3RfZm91bmQnLCAnbWlzc2luZycpO1xudmFyIFJFVl9DT05GTElDVCA9IG5ldyBQb3VjaEVycm9yKDQwOSwgJ2NvbmZsaWN0JywgJ0RvY3VtZW50IHVwZGF0ZSBjb25mbGljdCcpO1xudmFyIElOVkFMSURfSUQgPSBuZXcgUG91Y2hFcnJvcig0MDAsICdiYWRfcmVxdWVzdCcsICdfaWQgZmllbGQgbXVzdCBjb250YWluIGEgc3RyaW5nJyk7XG52YXIgTUlTU0lOR19JRCA9IG5ldyBQb3VjaEVycm9yKDQxMiwgJ21pc3NpbmdfaWQnLCAnX2lkIGlzIHJlcXVpcmVkIGZvciBwdXRzJyk7XG52YXIgUkVTRVJWRURfSUQgPSBuZXcgUG91Y2hFcnJvcig0MDAsICdiYWRfcmVxdWVzdCcsICdPbmx5IHJlc2VydmVkIGRvY3VtZW50IGlkcyBtYXkgc3RhcnQgd2l0aCB1bmRlcnNjb3JlLicpO1xudmFyIE5PVF9PUEVOID0gbmV3IFBvdWNoRXJyb3IoNDEyLCAncHJlY29uZGl0aW9uX2ZhaWxlZCcsICdEYXRhYmFzZSBub3Qgb3BlbicpO1xudmFyIFVOS05PV05fRVJST1IgPSBuZXcgUG91Y2hFcnJvcig1MDAsICd1bmtub3duX2Vycm9yJywgJ0RhdGFiYXNlIGVuY291bnRlcmVkIGFuIHVua25vd24gZXJyb3InKTtcbnZhciBCQURfQVJHID0gbmV3IFBvdWNoRXJyb3IoNTAwLCAnYmFkYXJnJywgJ1NvbWUgcXVlcnkgYXJndW1lbnQgaXMgaW52YWxpZCcpO1xudmFyIElOVkFMSURfUkVRVUVTVCA9IG5ldyBQb3VjaEVycm9yKDQwMCwgJ2ludmFsaWRfcmVxdWVzdCcsICdSZXF1ZXN0IHdhcyBpbnZhbGlkJyk7XG52YXIgUVVFUllfUEFSU0VfRVJST1IgPSBuZXcgUG91Y2hFcnJvcig0MDAsICdxdWVyeV9wYXJzZV9lcnJvcicsICdTb21lIHF1ZXJ5IHBhcmFtZXRlciBpcyBpbnZhbGlkJyk7XG52YXIgRE9DX1ZBTElEQVRJT04gPSBuZXcgUG91Y2hFcnJvcig1MDAsICdkb2NfdmFsaWRhdGlvbicsICdCYWQgc3BlY2lhbCBkb2N1bWVudCBtZW1iZXInKTtcbnZhciBCQURfUkVRVUVTVCA9IG5ldyBQb3VjaEVycm9yKDQwMCwgJ2JhZF9yZXF1ZXN0JywgJ1NvbWV0aGluZyB3cm9uZyB3aXRoIHRoZSByZXF1ZXN0Jyk7XG52YXIgTk9UX0FOX09CSkVDVCA9IG5ldyBQb3VjaEVycm9yKDQwMCwgJ2JhZF9yZXF1ZXN0JywgJ0RvY3VtZW50IG11c3QgYmUgYSBKU09OIG9iamVjdCcpO1xudmFyIERCX01JU1NJTkcgPSBuZXcgUG91Y2hFcnJvcig0MDQsICdub3RfZm91bmQnLCAnRGF0YWJhc2Ugbm90IGZvdW5kJyk7XG52YXIgSURCX0VSUk9SID0gbmV3IFBvdWNoRXJyb3IoNTAwLCAnaW5kZXhlZF9kYl93ZW50X2JhZCcsICd1bmtub3duJyk7XG52YXIgV1NRX0VSUk9SID0gbmV3IFBvdWNoRXJyb3IoNTAwLCAnd2ViX3NxbF93ZW50X2JhZCcsICd1bmtub3duJyk7XG52YXIgTERCX0VSUk9SID0gbmV3IFBvdWNoRXJyb3IoNTAwLCAnbGV2ZWxEQl93ZW50X3dlbnRfYmFkJywgJ3Vua25vd24nKTtcbnZhciBGT1JCSURERU4gPSBuZXcgUG91Y2hFcnJvcig0MDMsICdmb3JiaWRkZW4nLCAnRm9yYmlkZGVuIGJ5IGRlc2lnbiBkb2MgdmFsaWRhdGVfZG9jX3VwZGF0ZSBmdW5jdGlvbicpO1xudmFyIElOVkFMSURfUkVWID0gbmV3IFBvdWNoRXJyb3IoNDAwLCAnYmFkX3JlcXVlc3QnLCAnSW52YWxpZCByZXYgZm9ybWF0Jyk7XG52YXIgRklMRV9FWElTVFMgPSBuZXcgUG91Y2hFcnJvcig0MTIsICdmaWxlX2V4aXN0cycsICdUaGUgZGF0YWJhc2UgY291bGQgbm90IGJlIGNyZWF0ZWQsIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLicpO1xudmFyIE1JU1NJTkdfU1RVQiA9IG5ldyBQb3VjaEVycm9yKDQxMiwgJ21pc3Npbmdfc3R1YicsICdBIHByZS1leGlzdGluZyBhdHRhY2htZW50IHN0dWIgd2FzblxcJ3QgZm91bmQnKTtcbnZhciBJTlZBTElEX1VSTCA9IG5ldyBQb3VjaEVycm9yKDQxMywgJ2ludmFsaWRfdXJsJywgJ1Byb3ZpZGVkIFVSTCBpcyBpbnZhbGlkJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKGVycm9yLCByZWFzb24pIHtcbiAgZnVuY3Rpb24gQ3VzdG9tUG91Y2hFcnJvcihyZWFzb24pIHtcbiAgICAvLyBpbmhlcml0IGVycm9yIHByb3BlcnRpZXMgZnJvbSBvdXIgcGFyZW50IGVycm9yIG1hbnVhbGx5XG4gICAgLy8gc28gYXMgdG8gYWxsb3cgcHJvcGVyIEpTT04gcGFyc2luZy5cbiAgICAvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG4gICAgZm9yICh2YXIgcCBpbiBlcnJvcikge1xuICAgICAgaWYgKHR5cGVvZiBlcnJvcltwXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzW3BdID0gZXJyb3JbcF07XG4gICAgICB9XG4gICAgfVxuICAgIC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG4gICAgaWYgKHJlYXNvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnJlYXNvbiA9IHJlYXNvbjtcbiAgICB9XG4gIH1cbiAgQ3VzdG9tUG91Y2hFcnJvci5wcm90b3R5cGUgPSBQb3VjaEVycm9yLnByb3RvdHlwZTtcbiAgcmV0dXJuIG5ldyBDdXN0b21Qb3VjaEVycm9yKHJlYXNvbik7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRXJyb3JGcm9tUmVzcG9uc2UoZXJyKSB7XG5cbiAgaWYgKHR5cGVvZiBlcnIgIT09ICdvYmplY3QnKSB7XG4gICAgdmFyIGRhdGEgPSBlcnI7XG4gICAgZXJyID0gVU5LTk9XTl9FUlJPUjtcbiAgICBlcnIuZGF0YSA9IGRhdGE7XG4gIH1cblxuICBpZiAoJ2Vycm9yJyBpbiBlcnIgJiYgZXJyLmVycm9yID09PSAnY29uZmxpY3QnKSB7XG4gICAgZXJyLm5hbWUgPSAnY29uZmxpY3QnO1xuICAgIGVyci5zdGF0dXMgPSA0MDk7XG4gIH1cblxuICBpZiAoISgnbmFtZScgaW4gZXJyKSkge1xuICAgIGVyci5uYW1lID0gZXJyLmVycm9yIHx8ICd1bmtub3duJztcbiAgfVxuXG4gIGlmICghKCdzdGF0dXMnIGluIGVycikpIHtcbiAgICBlcnIuc3RhdHVzID0gNTAwO1xuICB9XG5cbiAgaWYgKCEoJ21lc3NhZ2UnIGluIGVycikpIHtcbiAgICBlcnIubWVzc2FnZSA9IGVyci5tZXNzYWdlIHx8IGVyci5yZWFzb247XG4gIH1cblxuICByZXR1cm4gZXJyO1xufVxuXG5mdW5jdGlvbiB0cnlGaWx0ZXIoZmlsdGVyLCBkb2MsIHJlcSkge1xuICB0cnkge1xuICAgIHJldHVybiAhZmlsdGVyKGRvYywgcmVxKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdmFyIG1zZyA9ICdGaWx0ZXIgZnVuY3Rpb24gdGhyZXc6ICcgKyBlcnIudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gY3JlYXRlRXJyb3IoQkFEX1JFUVVFU1QsIG1zZyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyQ2hhbmdlKG9wdHMpIHtcbiAgdmFyIHJlcSA9IHt9O1xuICB2YXIgaGFzRmlsdGVyID0gb3B0cy5maWx0ZXIgJiYgdHlwZW9mIG9wdHMuZmlsdGVyID09PSAnZnVuY3Rpb24nO1xuICByZXEucXVlcnkgPSBvcHRzLnF1ZXJ5X3BhcmFtcztcblxuICByZXR1cm4gZnVuY3Rpb24gZmlsdGVyKGNoYW5nZSkge1xuICAgIGlmICghY2hhbmdlLmRvYykge1xuICAgICAgLy8gQ1NHIHNlbmRzIGV2ZW50cyBvbiB0aGUgY2hhbmdlcyBmZWVkIHRoYXQgZG9uJ3QgaGF2ZSBkb2N1bWVudHMsXG4gICAgICAvLyB0aGlzIGhhY2sgbWFrZXMgYSB3aG9sZSBsb3Qgb2YgZXhpc3RpbmcgY29kZSByb2J1c3QuXG4gICAgICBjaGFuZ2UuZG9jID0ge307XG4gICAgfVxuXG4gICAgdmFyIGZpbHRlclJldHVybiA9IGhhc0ZpbHRlciAmJiB0cnlGaWx0ZXIob3B0cy5maWx0ZXIsIGNoYW5nZS5kb2MsIHJlcSk7XG5cbiAgICBpZiAodHlwZW9mIGZpbHRlclJldHVybiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJSZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlclJldHVybikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghb3B0cy5pbmNsdWRlX2RvY3MpIHtcbiAgICAgIGRlbGV0ZSBjaGFuZ2UuZG9jO1xuICAgIH0gZWxzZSBpZiAoIW9wdHMuYXR0YWNobWVudHMpIHtcbiAgICAgIGZvciAodmFyIGF0dCBpbiBjaGFuZ2UuZG9jLl9hdHRhY2htZW50cykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgICBpZiAoY2hhbmdlLmRvYy5fYXR0YWNobWVudHMuaGFzT3duUHJvcGVydHkoYXR0KSkge1xuICAgICAgICAgIGNoYW5nZS5kb2MuX2F0dGFjaG1lbnRzW2F0dF0uc3R1YiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW4oYXJycykge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcmVzID0gcmVzLmNvbmNhdChhcnJzW2ldKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG4vLyBEZXRlcm1pbmUgaWQgYW4gSUQgaXMgdmFsaWRcbi8vICAgLSBpbnZhbGlkIElEcyBiZWdpbiB3aXRoIGFuIHVuZGVyZXNjb3JlIHRoYXQgZG9lcyBub3QgYmVnaW4gJ19kZXNpZ24nIG9yXG4vLyAgICAgJ19sb2NhbCdcbi8vICAgLSBhbnkgb3RoZXIgc3RyaW5nIHZhbHVlIGlzIGEgdmFsaWQgaWRcbi8vIFJldHVybnMgdGhlIHNwZWNpZmljIGVycm9yIG9iamVjdCBmb3IgZWFjaCBjYXNlXG5mdW5jdGlvbiBpbnZhbGlkSWRFcnJvcihpZCkge1xuICB2YXIgZXJyO1xuICBpZiAoIWlkKSB7XG4gICAgZXJyID0gY3JlYXRlRXJyb3IoTUlTU0lOR19JRCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgIGVyciA9IGNyZWF0ZUVycm9yKElOVkFMSURfSUQpO1xuICB9IGVsc2UgaWYgKC9eXy8udGVzdChpZCkgJiYgISgvXl8oZGVzaWdufGxvY2FsKS8pLnRlc3QoaWQpKSB7XG4gICAgZXJyID0gY3JlYXRlRXJyb3IoUkVTRVJWRURfSUQpO1xuICB9XG4gIGlmIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJDb3VudChlZSwgdHlwZSkge1xuICByZXR1cm4gJ2xpc3RlbmVyQ291bnQnIGluIGVlID8gZWUubGlzdGVuZXJDb3VudCh0eXBlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudHMuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQoZWUsIHR5cGUpO1xufVxuXG5mdW5jdGlvbiBwYXJzZURlc2lnbkRvY0Z1bmN0aW9uTmFtZShzKSB7XG4gIGlmICghcykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZhciBwYXJ0cyA9IHMuc3BsaXQoJy8nKTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMikge1xuICAgIHJldHVybiBwYXJ0cztcbiAgfVxuICBpZiAocGFydHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIFtzLCBzXTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRGVzaWduRG9jRnVuY3Rpb25OYW1lKHMpIHtcbiAgdmFyIG5vcm1hbGl6ZWQgPSBwYXJzZURlc2lnbkRvY0Z1bmN0aW9uTmFtZShzKTtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQgPyBub3JtYWxpemVkLmpvaW4oJy8nKSA6IG51bGw7XG59XG5cbi8vIG9yaWdpbmFsbHkgcGFyc2VVcmkgMS4yLjIsIG5vdyBwYXRjaGVkIGJ5IHVzXG4vLyAoYykgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+XG4vLyBNSVQgTGljZW5zZVxudmFyIGtleXMgPSBbXCJzb3VyY2VcIiwgXCJwcm90b2NvbFwiLCBcImF1dGhvcml0eVwiLCBcInVzZXJJbmZvXCIsIFwidXNlclwiLCBcInBhc3N3b3JkXCIsXG4gICAgXCJob3N0XCIsIFwicG9ydFwiLCBcInJlbGF0aXZlXCIsIFwicGF0aFwiLCBcImRpcmVjdG9yeVwiLCBcImZpbGVcIiwgXCJxdWVyeVwiLCBcImFuY2hvclwiXTtcbnZhciBxTmFtZSA9XCJxdWVyeUtleVwiO1xudmFyIHFQYXJzZXIgPSAvKD86XnwmKShbXiY9XSopPT8oW14mXSopL2c7XG5cbi8vIHVzZSB0aGUgXCJsb29zZVwiIHBhcnNlclxuLyoganNoaW50IG1heGxlbjogZmFsc2UgKi9cbnZhciBwYXJzZXIgPSAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKikoPzo6KFteOkBdKikpPyk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS87XG5cbmZ1bmN0aW9uIHBhcnNlVXJpKHN0cikge1xuICB2YXIgbSA9IHBhcnNlci5leGVjKHN0cik7XG4gIHZhciB1cmkgPSB7fTtcbiAgdmFyIGkgPSAxNDtcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgdmFyIHZhbHVlID0gbVtpXSB8fCBcIlwiO1xuICAgIHZhciBlbmNvZGVkID0gWyd1c2VyJywgJ3Bhc3N3b3JkJ10uaW5kZXhPZihrZXkpICE9PSAtMTtcbiAgICB1cmlba2V5XSA9IGVuY29kZWQgPyBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpIDogdmFsdWU7XG4gIH1cblxuICB1cmlbcU5hbWVdID0ge307XG4gIHVyaVtrZXlzWzEyXV0ucmVwbGFjZShxUGFyc2VyLCBmdW5jdGlvbiAoJDAsICQxLCAkMikge1xuICAgIGlmICgkMSkge1xuICAgICAgdXJpW3FOYW1lXVskMV0gPSAkMjtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB1cmk7XG59XG5cbi8vIHRoaXMgaXMgZXNzZW50aWFsbHkgdGhlIFwidXBkYXRlIHN1Z2FyXCIgZnVuY3Rpb24gZnJvbSBkYWxlaGFydmV5L3BvdWNoZGIjMTM4OFxuLy8gdGhlIGRpZmZGdW4gdGVsbHMgdXMgd2hhdCBkZWx0YSB0byBhcHBseSB0byB0aGUgZG9jLiAgaXQgZWl0aGVyIHJldHVybnNcbi8vIHRoZSBkb2MsIG9yIGZhbHNlIGlmIGl0IGRvZXNuJ3QgbmVlZCB0byBkbyBhbiB1cGRhdGUgYWZ0ZXIgYWxsXG5mdW5jdGlvbiB1cHNlcnQoZGIsIGRvY0lkLCBkaWZmRnVuKSB7XG4gIHJldHVybiBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChmdWxmaWxsLCByZWplY3QpIHtcbiAgICBkYi5nZXQoZG9jSWQsIGZ1bmN0aW9uIChlcnIsIGRvYykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBpZiAoZXJyLnN0YXR1cyAhPT0gNDA0KSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGRvYyA9IHt9O1xuICAgICAgfVxuXG4gICAgICAvLyB0aGUgdXNlciBtaWdodCBjaGFuZ2UgdGhlIF9yZXYsIHNvIHNhdmUgaXQgZm9yIHBvc3Rlcml0eVxuICAgICAgdmFyIGRvY1JldiA9IGRvYy5fcmV2O1xuICAgICAgdmFyIG5ld0RvYyA9IGRpZmZGdW4oZG9jKTtcblxuICAgICAgaWYgKCFuZXdEb2MpIHtcbiAgICAgICAgLy8gaWYgdGhlIGRpZmZGdW4gcmV0dXJucyBmYWxzeSwgd2Ugc2hvcnQtY2lyY3VpdCBhc1xuICAgICAgICAvLyBhbiBvcHRpbWl6YXRpb25cbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwoe3VwZGF0ZWQ6IGZhbHNlLCByZXY6IGRvY1Jldn0pO1xuICAgICAgfVxuXG4gICAgICAvLyB1c2VycyBhcmVuJ3QgYWxsb3dlZCB0byBtb2RpZnkgdGhlc2UgdmFsdWVzLFxuICAgICAgLy8gc28gcmVzZXQgdGhlbSBoZXJlXG4gICAgICBuZXdEb2MuX2lkID0gZG9jSWQ7XG4gICAgICBuZXdEb2MuX3JldiA9IGRvY1JldjtcbiAgICAgIGZ1bGZpbGwodHJ5QW5kUHV0KGRiLCBuZXdEb2MsIGRpZmZGdW4pKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRyeUFuZFB1dChkYiwgZG9jLCBkaWZmRnVuKSB7XG4gIHJldHVybiBkYi5wdXQoZG9jKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXBkYXRlZDogdHJ1ZSxcbiAgICAgIHJldjogcmVzLnJldlxuICAgIH07XG4gIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmIChlcnIuc3RhdHVzICE9PSA0MDkpIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgcmV0dXJuIHVwc2VydChkYiwgZG9jLl9pZCwgZGlmZkZ1bik7XG4gIH0pO1xufVxuXG4vLyBCRUdJTiBNYXRoLnV1aWQuanNcblxuLyohXG5NYXRoLnV1aWQuanMgKHYxLjQpXG5odHRwOi8vd3d3LmJyb29mYS5jb21cbm1haWx0bzpyb2JlcnRAYnJvb2ZhLmNvbVxuXG5Db3B5cmlnaHQgKGMpIDIwMTAgUm9iZXJ0IEtpZWZmZXJcbkR1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBhbmQgR1BMIGxpY2Vuc2VzLlxuKi9cblxuLypcbiAqIEdlbmVyYXRlIGEgcmFuZG9tIHV1aWQuXG4gKlxuICogVVNBR0U6IE1hdGgudXVpZChsZW5ndGgsIHJhZGl4KVxuICogICBsZW5ndGggLSB0aGUgZGVzaXJlZCBudW1iZXIgb2YgY2hhcmFjdGVyc1xuICogICByYWRpeCAgLSB0aGUgbnVtYmVyIG9mIGFsbG93YWJsZSB2YWx1ZXMgZm9yIGVhY2ggY2hhcmFjdGVyLlxuICpcbiAqIEVYQU1QTEVTOlxuICogICAvLyBObyBhcmd1bWVudHMgIC0gcmV0dXJucyBSRkM0MTIyLCB2ZXJzaW9uIDQgSURcbiAqICAgPj4+IE1hdGgudXVpZCgpXG4gKiAgIFwiOTIzMjlEMzktNkY1Qy00NTIwLUFCRkMtQUFCNjQ1NDRFMTcyXCJcbiAqXG4gKiAgIC8vIE9uZSBhcmd1bWVudCAtIHJldHVybnMgSUQgb2YgdGhlIHNwZWNpZmllZCBsZW5ndGhcbiAqICAgPj4+IE1hdGgudXVpZCgxNSkgICAgIC8vIDE1IGNoYXJhY3RlciBJRCAoZGVmYXVsdCBiYXNlPTYyKVxuICogICBcIlZjeWR4Z2x0eHJWWlNUVlwiXG4gKlxuICogICAvLyBUd28gYXJndW1lbnRzIC0gcmV0dXJucyBJRCBvZiB0aGUgc3BlY2lmaWVkIGxlbmd0aCwgYW5kIHJhZGl4LiBcbiAqICAgLy8gKFJhZGl4IG11c3QgYmUgPD0gNjIpXG4gKiAgID4+PiBNYXRoLnV1aWQoOCwgMikgIC8vIDggY2hhcmFjdGVyIElEIChiYXNlPTIpXG4gKiAgIFwiMDEwMDEwMTBcIlxuICogICA+Pj4gTWF0aC51dWlkKDgsIDEwKSAvLyA4IGNoYXJhY3RlciBJRCAoYmFzZT0xMClcbiAqICAgXCI0NzQ3MzA0NlwiXG4gKiAgID4+PiBNYXRoLnV1aWQoOCwgMTYpIC8vIDggY2hhcmFjdGVyIElEIChiYXNlPTE2KVxuICogICBcIjA5OEY0RDM1XCJcbiAqL1xudmFyIGNoYXJzID0gKFxuICAnMDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJyArXG4gICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eidcbikuc3BsaXQoJycpO1xuZnVuY3Rpb24gZ2V0VmFsdWUocmFkaXgpIHtcbiAgcmV0dXJuIDAgfCBNYXRoLnJhbmRvbSgpICogcmFkaXg7XG59XG5mdW5jdGlvbiB1dWlkKGxlbiwgcmFkaXgpIHtcbiAgcmFkaXggPSByYWRpeCB8fCBjaGFycy5sZW5ndGg7XG4gIHZhciBvdXQgPSAnJztcbiAgdmFyIGkgPSAtMTtcblxuICBpZiAobGVuKSB7XG4gICAgLy8gQ29tcGFjdCBmb3JtXG4gICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgb3V0ICs9IGNoYXJzW2dldFZhbHVlKHJhZGl4KV07XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgICAvLyByZmM0MTIyLCB2ZXJzaW9uIDQgZm9ybVxuICAgIC8vIEZpbGwgaW4gcmFuZG9tIGRhdGEuICBBdCBpPT0xOSBzZXQgdGhlIGhpZ2ggYml0cyBvZiBjbG9jayBzZXF1ZW5jZSBhc1xuICAgIC8vIHBlciByZmM0MTIyLCBzZWMuIDQuMS41XG4gIHdoaWxlICgrK2kgPCAzNikge1xuICAgIHN3aXRjaCAoaSkge1xuICAgICAgY2FzZSA4OlxuICAgICAgY2FzZSAxMzpcbiAgICAgIGNhc2UgMTg6XG4gICAgICBjYXNlIDIzOlxuICAgICAgICBvdXQgKz0gJy0nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTk6XG4gICAgICAgIG91dCArPSBjaGFyc1soZ2V0VmFsdWUoMTYpICYgMHgzKSB8IDB4OF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgb3V0ICs9IGNoYXJzW2dldFZhbHVlKDE2KV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dDtcbn1cblxuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL21vbnRhZ2Vqcy9jb2xsZWN0aW9uc1xuZnVuY3Rpb24gbWFuZ2xlKGtleSkge1xuICByZXR1cm4gJyQnICsga2V5O1xufVxuZnVuY3Rpb24gdW5tYW5nbGUoa2V5KSB7XG4gIHJldHVybiBrZXkuc3Vic3RyaW5nKDEpO1xufVxuZnVuY3Rpb24gX01hcCgpIHtcbiAgdGhpcy5zdG9yZSA9IHt9O1xufVxuX01hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgbWFuZ2xlZCA9IG1hbmdsZShrZXkpO1xuICByZXR1cm4gdGhpcy5zdG9yZVttYW5nbGVkXTtcbn07XG5fTWFwLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICB2YXIgbWFuZ2xlZCA9IG1hbmdsZShrZXkpO1xuICB0aGlzLnN0b3JlW21hbmdsZWRdID0gdmFsdWU7XG4gIHJldHVybiB0cnVlO1xufTtcbl9NYXAucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdmFyIG1hbmdsZWQgPSBtYW5nbGUoa2V5KTtcbiAgcmV0dXJuIG1hbmdsZWQgaW4gdGhpcy5zdG9yZTtcbn07XG5fTWFwLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBtYW5nbGVkID0gbWFuZ2xlKGtleSk7XG4gIHZhciByZXMgPSBtYW5nbGVkIGluIHRoaXMuc3RvcmU7XG4gIGRlbGV0ZSB0aGlzLnN0b3JlW21hbmdsZWRdO1xuICByZXR1cm4gcmVzO1xufTtcbl9NYXAucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoY2IpIHtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnN0b3JlKTtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnN0b3JlW2tleV07XG4gICAga2V5ID0gdW5tYW5nbGUoa2V5KTtcbiAgICBjYih2YWx1ZSwga2V5KTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX1NldChhcnJheSkge1xuICB0aGlzLnN0b3JlID0gbmV3IF9NYXAoKTtcblxuICAvLyBpbml0IHdpdGggYW4gYXJyYXlcbiAgaWYgKGFycmF5ICYmIEFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0aGlzLmFkZChhcnJheVtpXSk7XG4gICAgfVxuICB9XG59XG5fU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLnN0b3JlLnNldChrZXksIHRydWUpO1xufTtcbl9TZXQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIHRoaXMuc3RvcmUuaGFzKGtleSk7XG59O1xuXG4vLyBXZSBmZXRjaCBhbGwgbGVhZnMgb2YgdGhlIHJldmlzaW9uIHRyZWUsIGFuZCBzb3J0IHRoZW0gYmFzZWQgb24gdHJlZSBsZW5ndGhcbi8vIGFuZCB3aGV0aGVyIHRoZXkgd2VyZSBkZWxldGVkLCB1bmRlbGV0ZWQgZG9jdW1lbnRzIHdpdGggdGhlIGxvbmdlc3QgcmV2aXNpb25cbi8vIHRyZWUgKG1vc3QgZWRpdHMpIHdpblxuLy8gVGhlIGZpbmFsIHNvcnQgYWxnb3JpdGhtIGlzIHNsaWdodGx5IGRvY3VtZW50ZWQgaW4gYSBzaWRlYmFyIGhlcmU6XG4vLyBodHRwOi8vZ3VpZGUuY291Y2hkYi5vcmcvZHJhZnQvY29uZmxpY3RzLmh0bWxcbmZ1bmN0aW9uIHdpbm5pbmdSZXYobWV0YWRhdGEpIHtcbiAgdmFyIHdpbm5pbmdJZDtcbiAgdmFyIHdpbm5pbmdQb3M7XG4gIHZhciB3aW5uaW5nRGVsZXRlZDtcbiAgdmFyIHRvVmlzaXQgPSBtZXRhZGF0YS5yZXZfdHJlZS5zbGljZSgpO1xuICB2YXIgbm9kZTtcbiAgd2hpbGUgKChub2RlID0gdG9WaXNpdC5wb3AoKSkpIHtcbiAgICB2YXIgdHJlZSA9IG5vZGUuaWRzO1xuICAgIHZhciBicmFuY2hlcyA9IHRyZWVbMl07XG4gICAgdmFyIHBvcyA9IG5vZGUucG9zO1xuICAgIGlmIChicmFuY2hlcy5sZW5ndGgpIHsgLy8gbm9uLWxlYWZcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBicmFuY2hlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB0b1Zpc2l0LnB1c2goe3BvczogcG9zICsgMSwgaWRzOiBicmFuY2hlc1tpXX0pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHZhciBkZWxldGVkID0gISF0cmVlWzFdLmRlbGV0ZWQ7XG4gICAgdmFyIGlkID0gdHJlZVswXTtcbiAgICAvLyBzb3J0IGJ5IGRlbGV0ZWQsIHRoZW4gcG9zLCB0aGVuIGlkXG4gICAgaWYgKCF3aW5uaW5nSWQgfHwgKHdpbm5pbmdEZWxldGVkICE9PSBkZWxldGVkID8gd2lubmluZ0RlbGV0ZWQgOlxuICAgICAgICB3aW5uaW5nUG9zICE9PSBwb3MgPyB3aW5uaW5nUG9zIDwgcG9zIDogd2lubmluZ0lkIDwgaWQpKSB7XG4gICAgICB3aW5uaW5nSWQgPSBpZDtcbiAgICAgIHdpbm5pbmdQb3MgPSBwb3M7XG4gICAgICB3aW5uaW5nRGVsZXRlZCA9IGRlbGV0ZWQ7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHdpbm5pbmdQb3MgKyAnLScgKyB3aW5uaW5nSWQ7XG59XG5cbi8vIFByZXR0eSBtdWNoIGFsbCBiZWxvdyBjYW4gYmUgY29tYmluZWQgaW50byBhIGhpZ2hlciBvcmRlciBmdW5jdGlvbiB0b1xuLy8gdHJhdmVyc2UgcmV2aXNpb25zXG4vLyBUaGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGNhbGxiYWNrIHdpbGwgYmUgcGFzc2VkIGFzIGNvbnRleHQgdG8gYWxsXG4vLyBjaGlsZHJlbiBvZiB0aGF0IG5vZGVcbmZ1bmN0aW9uIHRyYXZlcnNlUmV2VHJlZShyZXZzLCBjYWxsYmFjaykge1xuICB2YXIgdG9WaXNpdCA9IHJldnMuc2xpY2UoKTtcblxuICB2YXIgbm9kZTtcbiAgd2hpbGUgKChub2RlID0gdG9WaXNpdC5wb3AoKSkpIHtcbiAgICB2YXIgcG9zID0gbm9kZS5wb3M7XG4gICAgdmFyIHRyZWUgPSBub2RlLmlkcztcbiAgICB2YXIgYnJhbmNoZXMgPSB0cmVlWzJdO1xuICAgIHZhciBuZXdDdHggPVxuICAgICAgY2FsbGJhY2soYnJhbmNoZXMubGVuZ3RoID09PSAwLCBwb3MsIHRyZWVbMF0sIG5vZGUuY3R4LCB0cmVlWzFdKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnJhbmNoZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRvVmlzaXQucHVzaCh7cG9zOiBwb3MgKyAxLCBpZHM6IGJyYW5jaGVzW2ldLCBjdHg6IG5ld0N0eH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzb3J0QnlQb3MoYSwgYikge1xuICByZXR1cm4gYS5wb3MgLSBiLnBvcztcbn1cblxuZnVuY3Rpb24gY29sbGVjdExlYXZlcyhyZXZzKSB7XG4gIHZhciBsZWF2ZXMgPSBbXTtcbiAgdHJhdmVyc2VSZXZUcmVlKHJldnMsIGZ1bmN0aW9uIChpc0xlYWYsIHBvcywgaWQsIGFjYywgb3B0cykge1xuICAgIGlmIChpc0xlYWYpIHtcbiAgICAgIGxlYXZlcy5wdXNoKHtyZXY6IHBvcyArIFwiLVwiICsgaWQsIHBvczogcG9zLCBvcHRzOiBvcHRzfSk7XG4gICAgfVxuICB9KTtcbiAgbGVhdmVzLnNvcnQoc29ydEJ5UG9zKS5yZXZlcnNlKCk7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsZWF2ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBkZWxldGUgbGVhdmVzW2ldLnBvcztcbiAgfVxuICByZXR1cm4gbGVhdmVzO1xufVxuXG4vLyByZXR1cm5zIHJldnMgb2YgYWxsIGNvbmZsaWN0cyB0aGF0IGlzIGxlYXZlcyBzdWNoIHRoYXRcbi8vIDEuIGFyZSBub3QgZGVsZXRlZCBhbmRcbi8vIDIuIGFyZSBkaWZmZXJlbnQgdGhhbiB3aW5uaW5nIHJldmlzaW9uXG5mdW5jdGlvbiBjb2xsZWN0Q29uZmxpY3RzKG1ldGFkYXRhKSB7XG4gIHZhciB3aW4gPSB3aW5uaW5nUmV2KG1ldGFkYXRhKTtcbiAgdmFyIGxlYXZlcyA9IGNvbGxlY3RMZWF2ZXMobWV0YWRhdGEucmV2X3RyZWUpO1xuICB2YXIgY29uZmxpY3RzID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsZWF2ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgbGVhZiA9IGxlYXZlc1tpXTtcbiAgICBpZiAobGVhZi5yZXYgIT09IHdpbiAmJiAhbGVhZi5vcHRzLmRlbGV0ZWQpIHtcbiAgICAgIGNvbmZsaWN0cy5wdXNoKGxlYWYucmV2KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbmZsaWN0cztcbn1cblxuLy8gY29tcGFjdCBhIHRyZWUgYnkgbWFya2luZyBpdHMgbm9uLWxlYWZzIGFzIG1pc3NpbmcsXG4vLyBhbmQgcmV0dXJuIGEgbGlzdCBvZiByZXZzIHRvIGRlbGV0ZVxuZnVuY3Rpb24gY29tcGFjdFRyZWUobWV0YWRhdGEpIHtcbiAgdmFyIHJldnMgPSBbXTtcbiAgdHJhdmVyc2VSZXZUcmVlKG1ldGFkYXRhLnJldl90cmVlLCBmdW5jdGlvbiAoaXNMZWFmLCBwb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldkhhc2gsIGN0eCwgb3B0cykge1xuICAgIGlmIChvcHRzLnN0YXR1cyA9PT0gJ2F2YWlsYWJsZScgJiYgIWlzTGVhZikge1xuICAgICAgcmV2cy5wdXNoKHBvcyArICctJyArIHJldkhhc2gpO1xuICAgICAgb3B0cy5zdGF0dXMgPSAnbWlzc2luZyc7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJldnM7XG59XG5cbi8vIGJ1aWxkIHVwIGEgbGlzdCBvZiBhbGwgdGhlIHBhdGhzIHRvIHRoZSBsZWFmcyBpbiB0aGlzIHJldmlzaW9uIHRyZWVcbmZ1bmN0aW9uIHJvb3RUb0xlYWYocmV2cykge1xuICB2YXIgcGF0aHMgPSBbXTtcbiAgdmFyIHRvVmlzaXQgPSByZXZzLnNsaWNlKCk7XG4gIHZhciBub2RlO1xuICB3aGlsZSAoKG5vZGUgPSB0b1Zpc2l0LnBvcCgpKSkge1xuICAgIHZhciBwb3MgPSBub2RlLnBvcztcbiAgICB2YXIgdHJlZSA9IG5vZGUuaWRzO1xuICAgIHZhciBpZCA9IHRyZWVbMF07XG4gICAgdmFyIG9wdHMgPSB0cmVlWzFdO1xuICAgIHZhciBicmFuY2hlcyA9IHRyZWVbMl07XG4gICAgdmFyIGlzTGVhZiA9IGJyYW5jaGVzLmxlbmd0aCA9PT0gMDtcblxuICAgIHZhciBoaXN0b3J5ID0gbm9kZS5oaXN0b3J5ID8gbm9kZS5oaXN0b3J5LnNsaWNlKCkgOiBbXTtcbiAgICBoaXN0b3J5LnB1c2goe2lkOiBpZCwgb3B0czogb3B0c30pO1xuICAgIGlmIChpc0xlYWYpIHtcbiAgICAgIHBhdGhzLnB1c2goe3BvczogKHBvcyArIDEgLSBoaXN0b3J5Lmxlbmd0aCksIGlkczogaGlzdG9yeX0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnJhbmNoZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRvVmlzaXQucHVzaCh7cG9zOiBwb3MgKyAxLCBpZHM6IGJyYW5jaGVzW2ldLCBoaXN0b3J5OiBoaXN0b3J5fSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXRocy5yZXZlcnNlKCk7XG59XG5cbi8vIGZvciBhIGJldHRlciBvdmVydmlldyBvZiB3aGF0IHRoaXMgaXMgZG9pbmcsIHJlYWQ6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vYXBhY2hlL2NvdWNoZGItY291Y2gvYmxvYi9tYXN0ZXIvc3JjL2NvdWNoX2tleV90cmVlLmVybFxuLy9cbi8vIEJ1dCBmb3IgYSBxdWljayBpbnRybywgQ291Y2hEQiB1c2VzIGEgcmV2aXNpb24gdHJlZSB0byBzdG9yZSBhIGRvY3VtZW50c1xuLy8gaGlzdG9yeSwgQSAtPiBCIC0+IEMsIHdoZW4gYSBkb2N1bWVudCBoYXMgY29uZmxpY3RzLCB0aGF0IGlzIGEgYnJhbmNoIGluIHRoZVxuLy8gdHJlZSwgQSAtPiAoQjEgfCBCMiAtPiBDKSwgV2Ugc3RvcmUgdGhlc2UgYXMgYSBuZXN0ZWQgYXJyYXkgaW4gdGhlIGZvcm1hdFxuLy9cbi8vIEtleVRyZWUgPSBbUGF0aCAuLi4gXVxuLy8gUGF0aCA9IHtwb3M6IHBvc2l0aW9uX2Zyb21fcm9vdCwgaWRzOiBUcmVlfVxuLy8gVHJlZSA9IFtLZXksIE9wdHMsIFtUcmVlLCAuLi5dXSwgaW4gcGFydGljdWxhciBzaW5nbGUgbm9kZTogW0tleSwgW11dXG5cbmZ1bmN0aW9uIHNvcnRCeVBvcyQxKGEsIGIpIHtcbiAgcmV0dXJuIGEucG9zIC0gYi5wb3M7XG59XG5cbi8vIGNsYXNzaWMgYmluYXJ5IHNlYXJjaFxuZnVuY3Rpb24gYmluYXJ5U2VhcmNoKGFyciwgaXRlbSwgY29tcGFyYXRvcikge1xuICB2YXIgbG93ID0gMDtcbiAgdmFyIGhpZ2ggPSBhcnIubGVuZ3RoO1xuICB2YXIgbWlkO1xuICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICBpZiAoY29tcGFyYXRvcihhcnJbbWlkXSwgaXRlbSkgPCAwKSB7XG4gICAgICBsb3cgPSBtaWQgKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWdoID0gbWlkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbG93O1xufVxuXG4vLyBhc3N1bWluZyB0aGUgYXJyIGlzIHNvcnRlZCwgaW5zZXJ0IHRoZSBpdGVtIGluIHRoZSBwcm9wZXIgcGxhY2VcbmZ1bmN0aW9uIGluc2VydFNvcnRlZChhcnIsIGl0ZW0sIGNvbXBhcmF0b3IpIHtcbiAgdmFyIGlkeCA9IGJpbmFyeVNlYXJjaChhcnIsIGl0ZW0sIGNvbXBhcmF0b3IpO1xuICBhcnIuc3BsaWNlKGlkeCwgMCwgaXRlbSk7XG59XG5cbi8vIFR1cm4gYSBwYXRoIGFzIGEgZmxhdCBhcnJheSBpbnRvIGEgdHJlZSB3aXRoIGEgc2luZ2xlIGJyYW5jaC5cbi8vIElmIGFueSBzaG91bGQgYmUgc3RlbW1lZCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LCB0aGF0J3MgcGFzc2VkXG4vLyBpbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50XG5mdW5jdGlvbiBwYXRoVG9UcmVlKHBhdGgsIG51bVN0ZW1tZWQpIHtcbiAgdmFyIHJvb3Q7XG4gIHZhciBsZWFmO1xuICBmb3IgKHZhciBpID0gbnVtU3RlbW1lZCwgbGVuID0gcGF0aC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBub2RlID0gcGF0aFtpXTtcbiAgICB2YXIgY3VycmVudExlYWYgPSBbbm9kZS5pZCwgbm9kZS5vcHRzLCBbXV07XG4gICAgaWYgKGxlYWYpIHtcbiAgICAgIGxlYWZbMl0ucHVzaChjdXJyZW50TGVhZik7XG4gICAgICBsZWFmID0gY3VycmVudExlYWY7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3QgPSBsZWFmID0gY3VycmVudExlYWY7XG4gICAgfVxuICB9XG4gIHJldHVybiByb290O1xufVxuXG4vLyBjb21wYXJlIHRoZSBJRHMgb2YgdHdvIHRyZWVzXG5mdW5jdGlvbiBjb21wYXJlVHJlZShhLCBiKSB7XG4gIHJldHVybiBhWzBdIDwgYlswXSA/IC0xIDogMTtcbn1cblxuLy8gTWVyZ2UgdHdvIHRyZWVzIHRvZ2V0aGVyXG4vLyBUaGUgcm9vdHMgb2YgdHJlZTEgYW5kIHRyZWUyIG11c3QgYmUgdGhlIHNhbWUgcmV2aXNpb25cbmZ1bmN0aW9uIG1lcmdlVHJlZShpbl90cmVlMSwgaW5fdHJlZTIpIHtcbiAgdmFyIHF1ZXVlID0gW3t0cmVlMTogaW5fdHJlZTEsIHRyZWUyOiBpbl90cmVlMn1dO1xuICB2YXIgY29uZmxpY3RzID0gZmFsc2U7XG4gIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGl0ZW0gPSBxdWV1ZS5wb3AoKTtcbiAgICB2YXIgdHJlZTEgPSBpdGVtLnRyZWUxO1xuICAgIHZhciB0cmVlMiA9IGl0ZW0udHJlZTI7XG5cbiAgICBpZiAodHJlZTFbMV0uc3RhdHVzIHx8IHRyZWUyWzFdLnN0YXR1cykge1xuICAgICAgdHJlZTFbMV0uc3RhdHVzID1cbiAgICAgICAgKHRyZWUxWzFdLnN0YXR1cyA9PT0gICdhdmFpbGFibGUnIHx8XG4gICAgICAgIHRyZWUyWzFdLnN0YXR1cyA9PT0gJ2F2YWlsYWJsZScpID8gJ2F2YWlsYWJsZScgOiAnbWlzc2luZyc7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmVlMlsyXS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCF0cmVlMVsyXVswXSkge1xuICAgICAgICBjb25mbGljdHMgPSAnbmV3X2xlYWYnO1xuICAgICAgICB0cmVlMVsyXVswXSA9IHRyZWUyWzJdW2ldO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIG1lcmdlZCA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0cmVlMVsyXS5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAodHJlZTFbMl1bal1bMF0gPT09IHRyZWUyWzJdW2ldWzBdKSB7XG4gICAgICAgICAgcXVldWUucHVzaCh7dHJlZTE6IHRyZWUxWzJdW2pdLCB0cmVlMjogdHJlZTJbMl1baV19KTtcbiAgICAgICAgICBtZXJnZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIW1lcmdlZCkge1xuICAgICAgICBjb25mbGljdHMgPSAnbmV3X2JyYW5jaCc7XG4gICAgICAgIGluc2VydFNvcnRlZCh0cmVlMVsyXSwgdHJlZTJbMl1baV0sIGNvbXBhcmVUcmVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtjb25mbGljdHM6IGNvbmZsaWN0cywgdHJlZTogaW5fdHJlZTF9O1xufVxuXG5mdW5jdGlvbiBkb01lcmdlKHRyZWUsIHBhdGgsIGRvbnRFeHBhbmQpIHtcbiAgdmFyIHJlc3RyZWUgPSBbXTtcbiAgdmFyIGNvbmZsaWN0cyA9IGZhbHNlO1xuICB2YXIgbWVyZ2VkID0gZmFsc2U7XG4gIHZhciByZXM7XG5cbiAgaWYgKCF0cmVlLmxlbmd0aCkge1xuICAgIHJldHVybiB7dHJlZTogW3BhdGhdLCBjb25mbGljdHM6ICduZXdfbGVhZid9O1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRyZWUubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgYnJhbmNoID0gdHJlZVtpXTtcbiAgICBpZiAoYnJhbmNoLnBvcyA9PT0gcGF0aC5wb3MgJiYgYnJhbmNoLmlkc1swXSA9PT0gcGF0aC5pZHNbMF0pIHtcbiAgICAgIC8vIFBhdGhzIHN0YXJ0IGF0IHRoZSBzYW1lIHBvc2l0aW9uIGFuZCBoYXZlIHRoZSBzYW1lIHJvb3QsIHNvIHRoZXkgbmVlZFxuICAgICAgLy8gbWVyZ2VkXG4gICAgICByZXMgPSBtZXJnZVRyZWUoYnJhbmNoLmlkcywgcGF0aC5pZHMpO1xuICAgICAgcmVzdHJlZS5wdXNoKHtwb3M6IGJyYW5jaC5wb3MsIGlkczogcmVzLnRyZWV9KTtcbiAgICAgIGNvbmZsaWN0cyA9IGNvbmZsaWN0cyB8fCByZXMuY29uZmxpY3RzO1xuICAgICAgbWVyZ2VkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGRvbnRFeHBhbmQgIT09IHRydWUpIHtcbiAgICAgIC8vIFRoZSBwYXRocyBzdGFydCBhdCBhIGRpZmZlcmVudCBwb3NpdGlvbiwgdGFrZSB0aGUgZWFybGllc3QgcGF0aCBhbmRcbiAgICAgIC8vIHRyYXZlcnNlIHVwIHVudGlsIGl0IGFzIGF0IHRoZSBzYW1lIHBvaW50IGZyb20gcm9vdCBhcyB0aGUgcGF0aCB3ZVxuICAgICAgLy8gd2FudCB0byBtZXJnZS4gIElmIHRoZSBrZXlzIG1hdGNoIHdlIHJldHVybiB0aGUgbG9uZ2VyIHBhdGggd2l0aCB0aGVcbiAgICAgIC8vIG90aGVyIG1lcmdlZCBBZnRlciBzdGVtbWluZyB3ZSBkb250IHdhbnQgdG8gZXhwYW5kIHRoZSB0cmVlc1xuXG4gICAgICB2YXIgdDEgPSBicmFuY2gucG9zIDwgcGF0aC5wb3MgPyBicmFuY2ggOiBwYXRoO1xuICAgICAgdmFyIHQyID0gYnJhbmNoLnBvcyA8IHBhdGgucG9zID8gcGF0aCA6IGJyYW5jaDtcbiAgICAgIHZhciBkaWZmID0gdDIucG9zIC0gdDEucG9zO1xuXG4gICAgICB2YXIgY2FuZGlkYXRlUGFyZW50cyA9IFtdO1xuXG4gICAgICB2YXIgdHJlZXMgPSBbXTtcbiAgICAgIHRyZWVzLnB1c2goe2lkczogdDEuaWRzLCBkaWZmOiBkaWZmLCBwYXJlbnQ6IG51bGwsIHBhcmVudElkeDogbnVsbH0pO1xuICAgICAgd2hpbGUgKHRyZWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB0cmVlcy5wb3AoKTtcbiAgICAgICAgaWYgKGl0ZW0uZGlmZiA9PT0gMCkge1xuICAgICAgICAgIGlmIChpdGVtLmlkc1swXSA9PT0gdDIuaWRzWzBdKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGVQYXJlbnRzLnB1c2goaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbGVtZW50cyA9IGl0ZW0uaWRzWzJdO1xuICAgICAgICBmb3IgKHZhciBqID0gMCwgZWxlbWVudHNMZW4gPSBlbGVtZW50cy5sZW5ndGg7IGogPCBlbGVtZW50c0xlbjsgaisrKSB7XG4gICAgICAgICAgdHJlZXMucHVzaCh7XG4gICAgICAgICAgICBpZHM6IGVsZW1lbnRzW2pdLFxuICAgICAgICAgICAgZGlmZjogaXRlbS5kaWZmIC0gMSxcbiAgICAgICAgICAgIHBhcmVudDogaXRlbS5pZHMsXG4gICAgICAgICAgICBwYXJlbnRJZHg6IGpcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgZWwgPSBjYW5kaWRhdGVQYXJlbnRzWzBdO1xuXG4gICAgICBpZiAoIWVsKSB7XG4gICAgICAgIHJlc3RyZWUucHVzaChicmFuY2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzID0gbWVyZ2VUcmVlKGVsLmlkcywgdDIuaWRzKTtcbiAgICAgICAgZWwucGFyZW50WzJdW2VsLnBhcmVudElkeF0gPSByZXMudHJlZTtcbiAgICAgICAgcmVzdHJlZS5wdXNoKHtwb3M6IHQxLnBvcywgaWRzOiB0MS5pZHN9KTtcbiAgICAgICAgY29uZmxpY3RzID0gY29uZmxpY3RzIHx8IHJlcy5jb25mbGljdHM7XG4gICAgICAgIG1lcmdlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3RyZWUucHVzaChicmFuY2gpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdlIGRpZG50IGZpbmRcbiAgaWYgKCFtZXJnZWQpIHtcbiAgICByZXN0cmVlLnB1c2gocGF0aCk7XG4gIH1cblxuICByZXN0cmVlLnNvcnQoc29ydEJ5UG9zJDEpO1xuXG4gIHJldHVybiB7XG4gICAgdHJlZTogcmVzdHJlZSxcbiAgICBjb25mbGljdHM6IGNvbmZsaWN0cyB8fCAnaW50ZXJuYWxfbm9kZSdcbiAgfTtcbn1cblxuLy8gVG8gZW5zdXJlIHdlIGRvbnQgZ3JvdyB0aGUgcmV2aXNpb24gdHJlZSBpbmZpbml0ZWx5LCB3ZSBzdGVtIG9sZCByZXZpc2lvbnNcbmZ1bmN0aW9uIHN0ZW0odHJlZSwgZGVwdGgpIHtcbiAgLy8gRmlyc3Qgd2UgYnJlYWsgb3V0IHRoZSB0cmVlIGludG8gYSBjb21wbGV0ZSBsaXN0IG9mIHJvb3QgdG8gbGVhZiBwYXRoc1xuICB2YXIgcGF0aHMgPSByb290VG9MZWFmKHRyZWUpO1xuICB2YXIgbWF5YmVTdGVtID0ge307XG5cbiAgdmFyIHJlc3VsdDtcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhdGhzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgLy8gVGhlbiBmb3IgZWFjaCBwYXRoLCB3ZSBjdXQgb2ZmIHRoZSBzdGFydCBvZiB0aGUgcGF0aCBiYXNlZCBvbiB0aGVcbiAgICAvLyBgZGVwdGhgIHRvIHN0ZW0gdG8sIGFuZCBnZW5lcmF0ZSBhIG5ldyBzZXQgb2YgZmxhdCB0cmVlc1xuICAgIHZhciBwYXRoID0gcGF0aHNbaV07XG4gICAgdmFyIHN0ZW1tZWQgPSBwYXRoLmlkcztcbiAgICB2YXIgbnVtU3RlbW1lZCA9IE1hdGgubWF4KDAsIHN0ZW1tZWQubGVuZ3RoIC0gZGVwdGgpO1xuICAgIHZhciBzdGVtbWVkTm9kZSA9IHtcbiAgICAgIHBvczogcGF0aC5wb3MgKyBudW1TdGVtbWVkLFxuICAgICAgaWRzOiBwYXRoVG9UcmVlKHN0ZW1tZWQsIG51bVN0ZW1tZWQpXG4gICAgfTtcblxuICAgIGZvciAodmFyIHMgPSAwOyBzIDwgbnVtU3RlbW1lZDsgcysrKSB7XG4gICAgICB2YXIgcmV2ID0gKHBhdGgucG9zICsgcykgKyAnLScgKyBzdGVtbWVkW3NdLmlkO1xuICAgICAgbWF5YmVTdGVtW3Jldl0gPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRoZW4gd2UgcmVtZXJnZSBhbGwgdGhvc2UgZmxhdCB0cmVlcyB0b2dldGhlciwgZW5zdXJpbmcgdGhhdCB3ZSBkb250XG4gICAgLy8gY29ubmVjdCB0cmVlcyB0aGF0IHdvdWxkIGdvIGJleW9uZCB0aGUgZGVwdGggbGltaXRcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICByZXN1bHQgPSBkb01lcmdlKHJlc3VsdCwgc3RlbW1lZE5vZGUsIHRydWUpLnRyZWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IFtzdGVtbWVkTm9kZV07XG4gICAgfVxuICB9XG5cbiAgdHJhdmVyc2VSZXZUcmVlKHJlc3VsdCwgZnVuY3Rpb24gKGlzTGVhZiwgcG9zLCByZXZIYXNoKSB7XG4gICAgLy8gc29tZSByZXZpc2lvbnMgbWF5IGhhdmUgYmVlbiByZW1vdmVkIGluIGEgYnJhbmNoIGJ1dCBub3QgaW4gYW5vdGhlclxuICAgIGRlbGV0ZSBtYXliZVN0ZW1bcG9zICsgJy0nICsgcmV2SGFzaF07XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgdHJlZTogcmVzdWx0LFxuICAgIHJldnM6IE9iamVjdC5rZXlzKG1heWJlU3RlbSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWVyZ2UodHJlZSwgcGF0aCwgZGVwdGgpIHtcbiAgdmFyIG5ld1RyZWUgPSBkb01lcmdlKHRyZWUsIHBhdGgpO1xuICB2YXIgc3RlbW1lZCA9IHN0ZW0obmV3VHJlZS50cmVlLCBkZXB0aCk7XG4gIHJldHVybiB7XG4gICAgdHJlZTogc3RlbW1lZC50cmVlLFxuICAgIHN0ZW1tZWRSZXZzOiBzdGVtbWVkLnJldnMsXG4gICAgY29uZmxpY3RzOiBuZXdUcmVlLmNvbmZsaWN0c1xuICB9O1xufVxuXG4vLyByZXR1cm4gdHJ1ZSBpZiBhIHJldiBleGlzdHMgaW4gdGhlIHJldiB0cmVlLCBmYWxzZSBvdGhlcndpc2VcbmZ1bmN0aW9uIHJldkV4aXN0cyhyZXZzLCByZXYpIHtcbiAgdmFyIHRvVmlzaXQgPSByZXZzLnNsaWNlKCk7XG4gIHZhciBzcGxpdFJldiA9IHJldi5zcGxpdCgnLScpO1xuICB2YXIgdGFyZ2V0UG9zID0gcGFyc2VJbnQoc3BsaXRSZXZbMF0sIDEwKTtcbiAgdmFyIHRhcmdldElkID0gc3BsaXRSZXZbMV07XG5cbiAgdmFyIG5vZGU7XG4gIHdoaWxlICgobm9kZSA9IHRvVmlzaXQucG9wKCkpKSB7XG4gICAgaWYgKG5vZGUucG9zID09PSB0YXJnZXRQb3MgJiYgbm9kZS5pZHNbMF0gPT09IHRhcmdldElkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIGJyYW5jaGVzID0gbm9kZS5pZHNbMl07XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJyYW5jaGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0b1Zpc2l0LnB1c2goe3Bvczogbm9kZS5wb3MgKyAxLCBpZHM6IGJyYW5jaGVzW2ldfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0VHJlZXMobm9kZSkge1xuICByZXR1cm4gbm9kZS5pZHM7XG59XG5cbi8vIGNoZWNrIGlmIGEgc3BlY2lmaWMgcmV2aXNpb24gb2YgYSBkb2MgaGFzIGJlZW4gZGVsZXRlZFxuLy8gIC0gbWV0YWRhdGE6IHRoZSBtZXRhZGF0YSBvYmplY3QgZnJvbSB0aGUgZG9jIHN0b3JlXG4vLyAgLSByZXY6IChvcHRpb25hbCkgdGhlIHJldmlzaW9uIHRvIGNoZWNrLiBkZWZhdWx0cyB0byB3aW5uaW5nIHJldmlzaW9uXG5mdW5jdGlvbiBpc0RlbGV0ZWQobWV0YWRhdGEsIHJldikge1xuICBpZiAoIXJldikge1xuICAgIHJldiA9IHdpbm5pbmdSZXYobWV0YWRhdGEpO1xuICB9XG4gIHZhciBpZCA9IHJldi5zdWJzdHJpbmcocmV2LmluZGV4T2YoJy0nKSArIDEpO1xuICB2YXIgdG9WaXNpdCA9IG1ldGFkYXRhLnJldl90cmVlLm1hcChnZXRUcmVlcyk7XG5cbiAgdmFyIHRyZWU7XG4gIHdoaWxlICgodHJlZSA9IHRvVmlzaXQucG9wKCkpKSB7XG4gICAgaWYgKHRyZWVbMF0gPT09IGlkKSB7XG4gICAgICByZXR1cm4gISF0cmVlWzFdLmRlbGV0ZWQ7XG4gICAgfVxuICAgIHRvVmlzaXQgPSB0b1Zpc2l0LmNvbmNhdCh0cmVlWzJdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0xvY2FsSWQoaWQpIHtcbiAgcmV0dXJuICgvXl9sb2NhbC8pLnRlc3QoaWQpO1xufVxuXG5mdW5jdGlvbiBldmFsRmlsdGVyKGlucHV0KSB7XG4gIHJldHVybiBzY29wZWRFdmFsKCdcInVzZSBzdHJpY3RcIjtcXG5yZXR1cm4gJyArIGlucHV0ICsgJzsnLCB7fSk7XG59XG5cbmZ1bmN0aW9uIGV2YWxWaWV3KGlucHV0KSB7XG4gIHZhciBjb2RlID0gW1xuICAgICdyZXR1cm4gZnVuY3Rpb24oZG9jKSB7JyxcbiAgICAnICBcInVzZSBzdHJpY3RcIjsnLFxuICAgICcgIHZhciBlbWl0dGVkID0gZmFsc2U7JyxcbiAgICAnICB2YXIgZW1pdCA9IGZ1bmN0aW9uIChhLCBiKSB7JyxcbiAgICAnICAgIGVtaXR0ZWQgPSB0cnVlOycsXG4gICAgJyAgfTsnLFxuICAgICcgIHZhciB2aWV3ID0gJyArIGlucHV0ICsgJzsnLFxuICAgICcgIHZpZXcoZG9jKTsnLFxuICAgICcgIGlmIChlbWl0dGVkKSB7JyxcbiAgICAnICAgIHJldHVybiB0cnVlOycsXG4gICAgJyAgfScsXG4gICAgJ307J1xuICBdLmpvaW4oJ1xcbicpO1xuXG4gIHJldHVybiBzY29wZWRFdmFsKGNvZGUsIHt9KTtcbn1cblxuaW5oZXJpdHMoQ2hhbmdlcyQxLCBldmVudHMuRXZlbnRFbWl0dGVyKTtcblxuZnVuY3Rpb24gdHJ5Q2F0Y2hJbkNoYW5nZUxpc3RlbmVyKHNlbGYsIGNoYW5nZSkge1xuICAvLyBpc29sYXRlIHRyeS9jYXRjaGVzIHRvIGF2b2lkIFY4IGRlb3B0aW1pemF0aW9uc1xuICB0cnkge1xuICAgIHNlbGYuZW1pdCgnY2hhbmdlJywgY2hhbmdlKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGd1YXJkZWRDb25zb2xlKCdlcnJvcicsICdFcnJvciBpbiAub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24pOicsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIENoYW5nZXMkMShkYiwgb3B0cywgY2FsbGJhY2spIHtcbiAgZXZlbnRzLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuZGIgPSBkYjtcbiAgb3B0cyA9IG9wdHMgPyBjbG9uZShvcHRzKSA6IHt9O1xuICB2YXIgY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlID0gb25jZShmdW5jdGlvbiAoZXJyLCByZXNwKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgaWYgKGxpc3RlbmVyQ291bnQoc2VsZiwgJ2Vycm9yJykgPiAwKSB7XG4gICAgICAgIHNlbGYuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmVtaXQoJ2NvbXBsZXRlJywgcmVzcCk7XG4gICAgfVxuICAgIHNlbGYucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgZGIucmVtb3ZlTGlzdGVuZXIoJ2Rlc3Ryb3llZCcsIG9uRGVzdHJveSk7XG4gIH0pO1xuICBpZiAoY2FsbGJhY2spIHtcbiAgICBzZWxmLm9uKCdjb21wbGV0ZScsIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwKTtcbiAgICB9KTtcbiAgICBzZWxmLm9uKCdlcnJvcicsIGNhbGxiYWNrKTtcbiAgfVxuICBmdW5jdGlvbiBvbkRlc3Ryb3koKSB7XG4gICAgc2VsZi5jYW5jZWwoKTtcbiAgfVxuICBkYi5vbmNlKCdkZXN0cm95ZWQnLCBvbkRlc3Ryb3kpO1xuXG4gIG9wdHMub25DaGFuZ2UgPSBmdW5jdGlvbiAoY2hhbmdlKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKG9wdHMuaXNDYW5jZWxsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5Q2F0Y2hJbkNoYW5nZUxpc3RlbmVyKHNlbGYsIGNoYW5nZSk7XG4gIH07XG5cbiAgdmFyIHByb21pc2UgPSBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChmdWxmaWxsLCByZWplY3QpIHtcbiAgICBvcHRzLmNvbXBsZXRlID0gZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVsZmlsbChyZXMpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuICBzZWxmLm9uY2UoJ2NhbmNlbCcsIGZ1bmN0aW9uICgpIHtcbiAgICBkYi5yZW1vdmVMaXN0ZW5lcignZGVzdHJveWVkJywgb25EZXN0cm95KTtcbiAgICBvcHRzLmNvbXBsZXRlKG51bGwsIHtzdGF0dXM6ICdjYW5jZWxsZWQnfSk7XG4gIH0pO1xuICB0aGlzLnRoZW4gPSBwcm9taXNlLnRoZW4uYmluZChwcm9taXNlKTtcbiAgdGhpc1snY2F0Y2gnXSA9IHByb21pc2VbJ2NhdGNoJ10uYmluZChwcm9taXNlKTtcbiAgdGhpcy50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICBjb21wbGV0ZShudWxsLCByZXN1bHQpO1xuICB9LCBjb21wbGV0ZSk7XG5cblxuXG4gIGlmICghZGIudGFza3F1ZXVlLmlzUmVhZHkpIHtcbiAgICBkYi50YXNrcXVldWUuYWRkVGFzayhmdW5jdGlvbiAoZmFpbGVkKSB7XG4gICAgICBpZiAoZmFpbGVkKSB7XG4gICAgICAgIG9wdHMuY29tcGxldGUoZmFpbGVkKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5pc0NhbmNlbGxlZCkge1xuICAgICAgICBzZWxmLmVtaXQoJ2NhbmNlbCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5kb0NoYW5nZXMob3B0cyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5kb0NoYW5nZXMob3B0cyk7XG4gIH1cbn1cbkNoYW5nZXMkMS5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmlzQ2FuY2VsbGVkID0gdHJ1ZTtcbiAgaWYgKHRoaXMuZGIudGFza3F1ZXVlLmlzUmVhZHkpIHtcbiAgICB0aGlzLmVtaXQoJ2NhbmNlbCcpO1xuICB9XG59O1xuZnVuY3Rpb24gcHJvY2Vzc0NoYW5nZShkb2MsIG1ldGFkYXRhLCBvcHRzKSB7XG4gIHZhciBjaGFuZ2VMaXN0ID0gW3tyZXY6IGRvYy5fcmV2fV07XG4gIGlmIChvcHRzLnN0eWxlID09PSAnYWxsX2RvY3MnKSB7XG4gICAgY2hhbmdlTGlzdCA9IGNvbGxlY3RMZWF2ZXMobWV0YWRhdGEucmV2X3RyZWUpXG4gICAgLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4ge3JldjogeC5yZXZ9OyB9KTtcbiAgfVxuICB2YXIgY2hhbmdlID0ge1xuICAgIGlkOiBtZXRhZGF0YS5pZCxcbiAgICBjaGFuZ2VzOiBjaGFuZ2VMaXN0LFxuICAgIGRvYzogZG9jXG4gIH07XG5cbiAgaWYgKGlzRGVsZXRlZChtZXRhZGF0YSwgZG9jLl9yZXYpKSB7XG4gICAgY2hhbmdlLmRlbGV0ZWQgPSB0cnVlO1xuICB9XG4gIGlmIChvcHRzLmNvbmZsaWN0cykge1xuICAgIGNoYW5nZS5kb2MuX2NvbmZsaWN0cyA9IGNvbGxlY3RDb25mbGljdHMobWV0YWRhdGEpO1xuICAgIGlmICghY2hhbmdlLmRvYy5fY29uZmxpY3RzLmxlbmd0aCkge1xuICAgICAgZGVsZXRlIGNoYW5nZS5kb2MuX2NvbmZsaWN0cztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZTtcbn1cblxuQ2hhbmdlcyQxLnByb3RvdHlwZS5kb0NoYW5nZXMgPSBmdW5jdGlvbiAob3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjYWxsYmFjayA9IG9wdHMuY29tcGxldGU7XG5cbiAgb3B0cyA9IGNsb25lKG9wdHMpO1xuICBpZiAoJ2xpdmUnIGluIG9wdHMgJiYgISgnY29udGludW91cycgaW4gb3B0cykpIHtcbiAgICBvcHRzLmNvbnRpbnVvdXMgPSBvcHRzLmxpdmU7XG4gIH1cbiAgb3B0cy5wcm9jZXNzQ2hhbmdlID0gcHJvY2Vzc0NoYW5nZTtcblxuICBpZiAob3B0cy5zaW5jZSA9PT0gJ2xhdGVzdCcpIHtcbiAgICBvcHRzLnNpbmNlID0gJ25vdyc7XG4gIH1cbiAgaWYgKCFvcHRzLnNpbmNlKSB7XG4gICAgb3B0cy5zaW5jZSA9IDA7XG4gIH1cbiAgaWYgKG9wdHMuc2luY2UgPT09ICdub3cnKSB7XG4gICAgdGhpcy5kYi5pbmZvKCkudGhlbihmdW5jdGlvbiAoaW5mbykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoc2VsZi5pc0NhbmNlbGxlZCkge1xuICAgICAgICBjYWxsYmFjayhudWxsLCB7c3RhdHVzOiAnY2FuY2VsbGVkJ30pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBvcHRzLnNpbmNlID0gaW5mby51cGRhdGVfc2VxO1xuICAgICAgc2VsZi5kb0NoYW5nZXMob3B0cyk7XG4gICAgfSwgY2FsbGJhY2spO1xuICAgIHJldHVybjtcbiAgfVxuXG5cbiAgaWYgKG9wdHMudmlldyAmJiAhb3B0cy5maWx0ZXIpIHtcbiAgICBvcHRzLmZpbHRlciA9ICdfdmlldyc7XG4gIH1cblxuICBpZiAob3B0cy5maWx0ZXIgJiYgdHlwZW9mIG9wdHMuZmlsdGVyID09PSAnc3RyaW5nJykge1xuICAgIGlmIChvcHRzLmZpbHRlciA9PT0gJ192aWV3Jykge1xuICAgICAgb3B0cy52aWV3ID0gbm9ybWFsaXplRGVzaWduRG9jRnVuY3Rpb25OYW1lKG9wdHMudmlldyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMuZmlsdGVyID0gbm9ybWFsaXplRGVzaWduRG9jRnVuY3Rpb25OYW1lKG9wdHMuZmlsdGVyKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kYi50eXBlKCkgIT09ICdodHRwJyAmJiAhb3B0cy5kb2NfaWRzKSB7XG4gICAgICByZXR1cm4gdGhpcy5maWx0ZXJDaGFuZ2VzKG9wdHMpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghKCdkZXNjZW5kaW5nJyBpbiBvcHRzKSkge1xuICAgIG9wdHMuZGVzY2VuZGluZyA9IGZhbHNlO1xuICB9XG5cbiAgLy8gMCBhbmQgMSBzaG91bGQgcmV0dXJuIDEgZG9jdW1lbnRcbiAgb3B0cy5saW1pdCA9IG9wdHMubGltaXQgPT09IDAgPyAxIDogb3B0cy5saW1pdDtcbiAgb3B0cy5jb21wbGV0ZSA9IGNhbGxiYWNrO1xuICB2YXIgbmV3UHJvbWlzZSA9IHRoaXMuZGIuX2NoYW5nZXMob3B0cyk7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChuZXdQcm9taXNlICYmIHR5cGVvZiBuZXdQcm9taXNlLmNhbmNlbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBjYW5jZWwgPSBzZWxmLmNhbmNlbDtcbiAgICBzZWxmLmNhbmNlbCA9IGdldEFyZ3VtZW50cyhmdW5jdGlvbiAoYXJncykge1xuICAgICAgbmV3UHJvbWlzZS5jYW5jZWwoKTtcbiAgICAgIGNhbmNlbC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9KTtcbiAgfVxufTtcblxuQ2hhbmdlcyQxLnByb3RvdHlwZS5maWx0ZXJDaGFuZ2VzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgY2FsbGJhY2sgPSBvcHRzLmNvbXBsZXRlO1xuICBpZiAob3B0cy5maWx0ZXIgPT09ICdfdmlldycpIHtcbiAgICBpZiAoIW9wdHMudmlldyB8fCB0eXBlb2Ygb3B0cy52aWV3ICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFyIGVyciA9IGNyZWF0ZUVycm9yKEJBRF9SRVFVRVNULFxuICAgICAgICAnYHZpZXdgIGZpbHRlciBwYXJhbWV0ZXIgbm90IGZvdW5kIG9yIGludmFsaWQuJyk7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICB9XG4gICAgLy8gZmV0Y2ggYSB2aWV3IGZyb20gYSBkZXNpZ24gZG9jLCBtYWtlIGl0IGJlaGF2ZSBsaWtlIGEgZmlsdGVyXG4gICAgdmFyIHZpZXdOYW1lID0gcGFyc2VEZXNpZ25Eb2NGdW5jdGlvbk5hbWUob3B0cy52aWV3KTtcbiAgICB0aGlzLmRiLmdldCgnX2Rlc2lnbi8nICsgdmlld05hbWVbMF0sIGZ1bmN0aW9uIChlcnIsIGRkb2MpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKHNlbGYuaXNDYW5jZWxsZWQpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHtzdGF0dXM6ICdjYW5jZWxsZWQnfSk7XG4gICAgICB9XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZ2VuZXJhdGVFcnJvckZyb21SZXNwb25zZShlcnIpKTtcbiAgICAgIH1cbiAgICAgIHZhciBtYXBGdW4gPSBkZG9jICYmIGRkb2Mudmlld3MgJiYgZGRvYy52aWV3c1t2aWV3TmFtZVsxXV0gJiZcbiAgICAgICAgZGRvYy52aWV3c1t2aWV3TmFtZVsxXV0ubWFwO1xuICAgICAgaWYgKCFtYXBGdW4pIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DLFxuICAgICAgICAgIChkZG9jLnZpZXdzID8gJ21pc3NpbmcganNvbiBrZXk6ICcgKyB2aWV3TmFtZVsxXSA6XG4gICAgICAgICAgICAnbWlzc2luZyBqc29uIGtleTogdmlld3MnKSkpO1xuICAgICAgfVxuICAgICAgb3B0cy5maWx0ZXIgPSBldmFsVmlldyhtYXBGdW4pO1xuICAgICAgc2VsZi5kb0NoYW5nZXMob3B0cyk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gZmV0Y2ggYSBmaWx0ZXIgZnJvbSBhIGRlc2lnbiBkb2NcbiAgICB2YXIgZmlsdGVyTmFtZSA9IHBhcnNlRGVzaWduRG9jRnVuY3Rpb25OYW1lKG9wdHMuZmlsdGVyKTtcbiAgICBpZiAoIWZpbHRlck5hbWUpIHtcbiAgICAgIHJldHVybiBzZWxmLmRvQ2hhbmdlcyhvcHRzKTtcbiAgICB9XG4gICAgdGhpcy5kYi5nZXQoJ19kZXNpZ24vJyArIGZpbHRlck5hbWVbMF0sIGZ1bmN0aW9uIChlcnIsIGRkb2MpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKHNlbGYuaXNDYW5jZWxsZWQpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHtzdGF0dXM6ICdjYW5jZWxsZWQnfSk7XG4gICAgICB9XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZ2VuZXJhdGVFcnJvckZyb21SZXNwb25zZShlcnIpKTtcbiAgICAgIH1cbiAgICAgIHZhciBmaWx0ZXJGdW4gPSBkZG9jICYmIGRkb2MuZmlsdGVycyAmJiBkZG9jLmZpbHRlcnNbZmlsdGVyTmFtZVsxXV07XG4gICAgICBpZiAoIWZpbHRlckZ1bikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoTUlTU0lOR19ET0MsXG4gICAgICAgICAgKChkZG9jICYmIGRkb2MuZmlsdGVycykgPyAnbWlzc2luZyBqc29uIGtleTogJyArIGZpbHRlck5hbWVbMV1cbiAgICAgICAgICAgIDogJ21pc3NpbmcganNvbiBrZXk6IGZpbHRlcnMnKSkpO1xuICAgICAgfVxuICAgICAgb3B0cy5maWx0ZXIgPSBldmFsRmlsdGVyKGZpbHRlckZ1bik7XG4gICAgICBzZWxmLmRvQ2hhbmdlcyhvcHRzKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLypcbiAqIEEgZ2VuZXJpYyBwb3VjaCBhZGFwdGVyXG4gKi9cblxuZnVuY3Rpb24gY29tcGFyZShsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA8IHJpZ2h0ID8gLTEgOiBsZWZ0ID4gcmlnaHQgPyAxIDogMDtcbn1cblxuLy8gV3JhcHBlciBmb3IgZnVuY3Rpb25zIHRoYXQgY2FsbCB0aGUgYnVsa2RvY3MgYXBpIHdpdGggYSBzaW5nbGUgZG9jLFxuLy8gaWYgdGhlIGZpcnN0IHJlc3VsdCBpcyBhbiBlcnJvciwgcmV0dXJuIGFuIGVycm9yXG5mdW5jdGlvbiB5YW5rRXJyb3IoY2FsbGJhY2spIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICBpZiAoZXJyIHx8IChyZXN1bHRzWzBdICYmIHJlc3VsdHNbMF0uZXJyb3IpKSB7XG4gICAgICBjYWxsYmFjayhlcnIgfHwgcmVzdWx0c1swXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMubGVuZ3RoID8gcmVzdWx0c1swXSAgOiByZXN1bHRzKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIGNsZWFuIGRvY3MgZ2l2ZW4gdG8gdXMgYnkgdGhlIHVzZXJcbmZ1bmN0aW9uIGNsZWFuRG9jcyhkb2NzKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkb2MgPSBkb2NzW2ldO1xuICAgIGlmIChkb2MuX2RlbGV0ZWQpIHtcbiAgICAgIGRlbGV0ZSBkb2MuX2F0dGFjaG1lbnRzOyAvLyBpZ25vcmUgYXR0cyBmb3IgZGVsZXRlZCBkb2NzXG4gICAgfSBlbHNlIGlmIChkb2MuX2F0dGFjaG1lbnRzKSB7XG4gICAgICAvLyBmaWx0ZXIgb3V0IGV4dHJhbmVvdXMga2V5cyBmcm9tIF9hdHRhY2htZW50c1xuICAgICAgdmFyIGF0dHMgPSBPYmplY3Qua2V5cyhkb2MuX2F0dGFjaG1lbnRzKTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXR0cy5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgYXR0ID0gYXR0c1tqXTtcbiAgICAgICAgZG9jLl9hdHRhY2htZW50c1thdHRdID0gcGljayhkb2MuX2F0dGFjaG1lbnRzW2F0dF0sXG4gICAgICAgICAgWydkYXRhJywgJ2RpZ2VzdCcsICdjb250ZW50X3R5cGUnLCAnbGVuZ3RoJywgJ3JldnBvcycsICdzdHViJ10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBjb21wYXJlIHR3byBkb2NzLCBmaXJzdCBieSBfaWQgdGhlbiBieSBfcmV2XG5mdW5jdGlvbiBjb21wYXJlQnlJZFRoZW5SZXYoYSwgYikge1xuICB2YXIgaWRDb21wYXJlID0gY29tcGFyZShhLl9pZCwgYi5faWQpO1xuICBpZiAoaWRDb21wYXJlICE9PSAwKSB7XG4gICAgcmV0dXJuIGlkQ29tcGFyZTtcbiAgfVxuICB2YXIgYVN0YXJ0ID0gYS5fcmV2aXNpb25zID8gYS5fcmV2aXNpb25zLnN0YXJ0IDogMDtcbiAgdmFyIGJTdGFydCA9IGIuX3JldmlzaW9ucyA/IGIuX3JldmlzaW9ucy5zdGFydCA6IDA7XG4gIHJldHVybiBjb21wYXJlKGFTdGFydCwgYlN0YXJ0KTtcbn1cblxuLy8gZm9yIGV2ZXJ5IG5vZGUgaW4gYSByZXZpc2lvbiB0cmVlIGNvbXB1dGVzIGl0cyBkaXN0YW5jZSBmcm9tIHRoZSBjbG9zZXN0XG4vLyBsZWFmXG5mdW5jdGlvbiBjb21wdXRlSGVpZ2h0KHJldnMpIHtcbiAgdmFyIGhlaWdodCA9IHt9O1xuICB2YXIgZWRnZXMgPSBbXTtcbiAgdHJhdmVyc2VSZXZUcmVlKHJldnMsIGZ1bmN0aW9uIChpc0xlYWYsIHBvcywgaWQsIHBybnQpIHtcbiAgICB2YXIgcmV2ID0gcG9zICsgXCItXCIgKyBpZDtcbiAgICBpZiAoaXNMZWFmKSB7XG4gICAgICBoZWlnaHRbcmV2XSA9IDA7XG4gICAgfVxuICAgIGlmIChwcm50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVkZ2VzLnB1c2goe2Zyb206IHBybnQsIHRvOiByZXZ9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJldjtcbiAgfSk7XG5cbiAgZWRnZXMucmV2ZXJzZSgpO1xuICBlZGdlcy5mb3JFYWNoKGZ1bmN0aW9uIChlZGdlKSB7XG4gICAgaWYgKGhlaWdodFtlZGdlLmZyb21dID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGhlaWdodFtlZGdlLmZyb21dID0gMSArIGhlaWdodFtlZGdlLnRvXTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0W2VkZ2UuZnJvbV0gPSBNYXRoLm1pbihoZWlnaHRbZWRnZS5mcm9tXSwgMSArIGhlaWdodFtlZGdlLnRvXSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGhlaWdodDtcbn1cblxuZnVuY3Rpb24gYWxsRG9jc0tleXNRdWVyeShhcGksIG9wdHMsIGNhbGxiYWNrKSB7XG4gIHZhciBrZXlzID0gICgnbGltaXQnIGluIG9wdHMpID9cbiAgICAgIG9wdHMua2V5cy5zbGljZShvcHRzLnNraXAsIG9wdHMubGltaXQgKyBvcHRzLnNraXApIDpcbiAgICAgIChvcHRzLnNraXAgPiAwKSA/IG9wdHMua2V5cy5zbGljZShvcHRzLnNraXApIDogb3B0cy5rZXlzO1xuICBpZiAob3B0cy5kZXNjZW5kaW5nKSB7XG4gICAga2V5cy5yZXZlcnNlKCk7XG4gIH1cbiAgaWYgKCFrZXlzLmxlbmd0aCkge1xuICAgIHJldHVybiBhcGkuX2FsbERvY3Moe2xpbWl0OiAwfSwgY2FsbGJhY2spO1xuICB9XG4gIHZhciBmaW5hbFJlc3VsdHMgPSB7XG4gICAgb2Zmc2V0OiBvcHRzLnNraXBcbiAgfTtcbiAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwoa2V5cy5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBzdWJPcHRzID0gZXh0ZW5kJDEoe2tleToga2V5LCBkZWxldGVkOiAnb2snfSwgb3B0cyk7XG4gICAgWydsaW1pdCcsICdza2lwJywgJ2tleXMnXS5mb3JFYWNoKGZ1bmN0aW9uIChvcHRLZXkpIHtcbiAgICAgIGRlbGV0ZSBzdWJPcHRzW29wdEtleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgYXBpLl9hbGxEb2NzKHN1Yk9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbFJlc3VsdHMudG90YWxfcm93cyA9IHJlcy50b3RhbF9yb3dzO1xuICAgICAgICByZXNvbHZlKHJlcy5yb3dzWzBdIHx8IHtrZXk6IGtleSwgZXJyb3I6ICdub3RfZm91bmQnfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSkpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdHMpIHtcbiAgICBmaW5hbFJlc3VsdHMucm93cyA9IHJlc3VsdHM7XG4gICAgcmV0dXJuIGZpbmFsUmVzdWx0cztcbiAgfSk7XG59XG5cbi8vIGFsbCBjb21wYWN0aW9uIGlzIGRvbmUgaW4gYSBxdWV1ZSwgdG8gYXZvaWQgYXR0YWNoaW5nXG4vLyB0b28gbWFueSBsaXN0ZW5lcnMgYXQgb25jZVxuZnVuY3Rpb24gZG9OZXh0Q29tcGFjdGlvbihzZWxmKSB7XG4gIHZhciB0YXNrID0gc2VsZi5fY29tcGFjdGlvblF1ZXVlWzBdO1xuICB2YXIgb3B0cyA9IHRhc2sub3B0cztcbiAgdmFyIGNhbGxiYWNrID0gdGFzay5jYWxsYmFjaztcbiAgc2VsZi5nZXQoJ19sb2NhbC9jb21wYWN0aW9uJykuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYyAmJiBkb2MubGFzdF9zZXEpIHtcbiAgICAgIG9wdHMubGFzdF9zZXEgPSBkb2MubGFzdF9zZXE7XG4gICAgfVxuICAgIHNlbGYuX2NvbXBhY3Qob3B0cywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgICB9XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5fY29tcGFjdGlvblF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGlmIChzZWxmLl9jb21wYWN0aW9uUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgZG9OZXh0Q29tcGFjdGlvbihzZWxmKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhdHRhY2htZW50TmFtZUVycm9yKG5hbWUpIHtcbiAgaWYgKG5hbWUuY2hhckF0KDApID09PSAnXycpIHtcbiAgICByZXR1cm4gbmFtZSArICdpcyBub3QgYSB2YWxpZCBhdHRhY2htZW50IG5hbWUsIGF0dGFjaG1lbnQgJyArXG4gICAgICAnbmFtZXMgY2Fubm90IHN0YXJ0IHdpdGggXFwnX1xcJyc7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5pbmhlcml0cyhBYnN0cmFjdFBvdWNoREIsIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBBYnN0cmFjdFBvdWNoREIoKSB7XG4gIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbn1cblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5wb3N0ID1cbiAgYWRhcHRlckZ1bigncG9zdCcsIGZ1bmN0aW9uIChkb2MsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBkb2MgIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgIHJldHVybiBjYWxsYmFjayhjcmVhdGVFcnJvcihOT1RfQU5fT0JKRUNUKSk7XG4gIH1cbiAgdGhpcy5idWxrRG9jcyh7ZG9jczogW2RvY119LCBvcHRzLCB5YW5rRXJyb3IoY2FsbGJhY2spKTtcbn0pO1xuXG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLnB1dCA9IGFkYXB0ZXJGdW4oJ3B1dCcsIGZ1bmN0aW9uIChkb2MsIG9wdHMsIGNiKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNiID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBkb2MgIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgIHJldHVybiBjYihjcmVhdGVFcnJvcihOT1RfQU5fT0JKRUNUKSk7XG4gIH1cbiAgaW52YWxpZElkRXJyb3IoZG9jLl9pZCk7XG4gIGlmIChpc0xvY2FsSWQoZG9jLl9pZCkgJiYgdHlwZW9mIHRoaXMuX3B1dExvY2FsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGRvYy5fZGVsZXRlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbW92ZUxvY2FsKGRvYywgY2IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHV0TG9jYWwoZG9jLCBjYik7XG4gICAgfVxuICB9XG4gIGlmICh0eXBlb2YgdGhpcy5fcHV0ID09PSAnZnVuY3Rpb24nICYmIG9wdHMubmV3X2VkaXRzICE9PSBmYWxzZSkge1xuICAgIHRoaXMuX3B1dChkb2MsIG9wdHMsIGNiKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmJ1bGtEb2NzKHtkb2NzOiBbZG9jXX0sIG9wdHMsIHlhbmtFcnJvcihjYikpO1xuICB9XG59KTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5wdXRBdHRhY2htZW50ID1cbiAgYWRhcHRlckZ1bigncHV0QXR0YWNobWVudCcsIGZ1bmN0aW9uIChkb2NJZCwgYXR0YWNobWVudElkLCByZXYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvYiwgdHlwZSkge1xuICB2YXIgYXBpID0gdGhpcztcbiAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdHlwZSA9IGJsb2I7XG4gICAgYmxvYiA9IHJldjtcbiAgICByZXYgPSBudWxsO1xuICB9XG4gIC8vIExldHMgZml4IGluIGh0dHBzOi8vZ2l0aHViLmNvbS9wb3VjaGRiL3BvdWNoZGIvaXNzdWVzLzMyNjdcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0eXBlID0gYmxvYjtcbiAgICBibG9iID0gcmV2O1xuICAgIHJldiA9IG51bGw7XG4gIH1cbiAgaWYgKCF0eXBlKSB7XG4gICAgZ3VhcmRlZENvbnNvbGUoJ3dhcm4nLCAnQXR0YWNobWVudCcsIGF0dGFjaG1lbnRJZCwgJ29uIGRvY3VtZW50JywgZG9jSWQsICdpcyBtaXNzaW5nIGNvbnRlbnRfdHlwZScpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQXR0YWNobWVudChkb2MpIHtcbiAgICB2YXIgcHJldnJldnBvcyA9ICdfcmV2JyBpbiBkb2MgPyBwYXJzZUludChkb2MuX3JldiwgMTApIDogMDtcbiAgICBkb2MuX2F0dGFjaG1lbnRzID0gZG9jLl9hdHRhY2htZW50cyB8fCB7fTtcbiAgICBkb2MuX2F0dGFjaG1lbnRzW2F0dGFjaG1lbnRJZF0gPSB7XG4gICAgICBjb250ZW50X3R5cGU6IHR5cGUsXG4gICAgICBkYXRhOiBibG9iLFxuICAgICAgcmV2cG9zOiArK3ByZXZyZXZwb3NcbiAgICB9O1xuICAgIHJldHVybiBhcGkucHV0KGRvYyk7XG4gIH1cblxuICByZXR1cm4gYXBpLmdldChkb2NJZCkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKGRvYy5fcmV2ICE9PSByZXYpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKFJFVl9DT05GTElDVCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZUF0dGFjaG1lbnQoZG9jKTtcbiAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAvLyBjcmVhdGUgbmV3IGRvY1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgaWYgKGVyci5yZWFzb24gPT09IE1JU1NJTkdfRE9DLm1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiBjcmVhdGVBdHRhY2htZW50KHtfaWQ6IGRvY0lkfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufSk7XG5cbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUucmVtb3ZlQXR0YWNobWVudCA9XG4gIGFkYXB0ZXJGdW4oJ3JlbW92ZUF0dGFjaG1lbnQnLCBmdW5jdGlvbiAoZG9jSWQsIGF0dGFjaG1lbnRJZCwgcmV2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5nZXQoZG9jSWQsIGZ1bmN0aW9uIChlcnIsIG9iaikge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChlcnIpIHtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChvYmouX3JldiAhPT0gcmV2KSB7XG4gICAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihSRVZfQ09ORkxJQ1QpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKCFvYmouX2F0dGFjaG1lbnRzKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG4gICAgZGVsZXRlIG9iai5fYXR0YWNobWVudHNbYXR0YWNobWVudElkXTtcbiAgICBpZiAoT2JqZWN0LmtleXMob2JqLl9hdHRhY2htZW50cykubGVuZ3RoID09PSAwKSB7XG4gICAgICBkZWxldGUgb2JqLl9hdHRhY2htZW50cztcbiAgICB9XG4gICAgc2VsZi5wdXQob2JqLCBjYWxsYmFjayk7XG4gIH0pO1xufSk7XG5cbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUucmVtb3ZlID1cbiAgYWRhcHRlckZ1bigncmVtb3ZlJywgZnVuY3Rpb24gKGRvY09ySWQsIG9wdHNPclJldiwgb3B0cywgY2FsbGJhY2spIHtcbiAgdmFyIGRvYztcbiAgaWYgKHR5cGVvZiBvcHRzT3JSZXYgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gaWQsIHJldiwgb3B0cywgY2FsbGJhY2sgc3R5bGVcbiAgICBkb2MgPSB7XG4gICAgICBfaWQ6IGRvY09ySWQsXG4gICAgICBfcmV2OiBvcHRzT3JSZXZcbiAgICB9O1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBkb2MsIG9wdHMsIGNhbGxiYWNrIHN0eWxlXG4gICAgZG9jID0gZG9jT3JJZDtcbiAgICBpZiAodHlwZW9mIG9wdHNPclJldiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSBvcHRzT3JSZXY7XG4gICAgICBvcHRzID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgPSBvcHRzT3JSZXY7XG4gICAgfVxuICB9XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuICBvcHRzLndhc19kZWxldGUgPSB0cnVlO1xuICB2YXIgbmV3RG9jID0ge19pZDogZG9jLl9pZCwgX3JldjogKGRvYy5fcmV2IHx8IG9wdHMucmV2KX07XG4gIG5ld0RvYy5fZGVsZXRlZCA9IHRydWU7XG4gIGlmIChpc0xvY2FsSWQobmV3RG9jLl9pZCkgJiYgdHlwZW9mIHRoaXMuX3JlbW92ZUxvY2FsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbW92ZUxvY2FsKGRvYywgY2FsbGJhY2spO1xuICB9XG4gIHRoaXMuYnVsa0RvY3Moe2RvY3M6IFtuZXdEb2NdfSwgb3B0cywgeWFua0Vycm9yKGNhbGxiYWNrKSk7XG59KTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5yZXZzRGlmZiA9XG4gIGFkYXB0ZXJGdW4oJ3JldnNEaWZmJywgZnVuY3Rpb24gKHJlcSwgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICB2YXIgaWRzID0gT2JqZWN0LmtleXMocmVxKTtcblxuICBpZiAoIWlkcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwge30pO1xuICB9XG5cbiAgdmFyIGNvdW50ID0gMDtcbiAgdmFyIG1pc3NpbmcgPSBuZXcgX01hcCgpO1xuXG4gIGZ1bmN0aW9uIGFkZFRvTWlzc2luZyhpZCwgcmV2SWQpIHtcbiAgICBpZiAoIW1pc3NpbmcuaGFzKGlkKSkge1xuICAgICAgbWlzc2luZy5zZXQoaWQsIHttaXNzaW5nOiBbXX0pO1xuICAgIH1cbiAgICBtaXNzaW5nLmdldChpZCkubWlzc2luZy5wdXNoKHJldklkKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NEb2MoaWQsIHJldl90cmVlKSB7XG4gICAgLy8gSXMgdGhpcyBmYXN0IGVub3VnaD8gTWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBhIHNldCBzaW11bGF0ZWQgYnkgYSBtYXBcbiAgICB2YXIgbWlzc2luZ0ZvcklkID0gcmVxW2lkXS5zbGljZSgwKTtcbiAgICB0cmF2ZXJzZVJldlRyZWUocmV2X3RyZWUsIGZ1bmN0aW9uIChpc0xlYWYsIHBvcywgcmV2SGFzaCwgY3R4LFxuICAgICAgb3B0cykge1xuICAgICAgICB2YXIgcmV2ID0gcG9zICsgJy0nICsgcmV2SGFzaDtcbiAgICAgICAgdmFyIGlkeCA9IG1pc3NpbmdGb3JJZC5pbmRleE9mKHJldik7XG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbWlzc2luZ0ZvcklkLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKG9wdHMuc3RhdHVzICE9PSAnYXZhaWxhYmxlJykge1xuICAgICAgICAgIGFkZFRvTWlzc2luZyhpZCwgcmV2KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAvLyBUcmF2ZXJzaW5nIHRoZSB0cmVlIGlzIHN5bmNocm9ub3VzLCBzbyBub3cgYG1pc3NpbmdGb3JJZGAgY29udGFpbnNcbiAgICAvLyByZXZpc2lvbnMgdGhhdCB3ZXJlIG5vdCBmb3VuZCBpbiB0aGUgdHJlZVxuICAgIG1pc3NpbmdGb3JJZC5mb3JFYWNoKGZ1bmN0aW9uIChyZXYpIHtcbiAgICAgIGFkZFRvTWlzc2luZyhpZCwgcmV2KTtcbiAgICB9KTtcbiAgfVxuXG4gIGlkcy5tYXAoZnVuY3Rpb24gKGlkKSB7XG4gICAgdGhpcy5fZ2V0UmV2aXNpb25UcmVlKGlkLCBmdW5jdGlvbiAoZXJyLCByZXZfdHJlZSkge1xuICAgICAgaWYgKGVyciAmJiBlcnIuc3RhdHVzID09PSA0MDQgJiYgZXJyLm1lc3NhZ2UgPT09ICdtaXNzaW5nJykge1xuICAgICAgICBtaXNzaW5nLnNldChpZCwge21pc3Npbmc6IHJlcVtpZF19KTtcbiAgICAgIH0gZWxzZSBpZiAoZXJyKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvY2Vzc0RvYyhpZCwgcmV2X3RyZWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoKytjb3VudCA9PT0gaWRzLmxlbmd0aCkge1xuICAgICAgICAvLyBjb252ZXJ0IExhenlNYXAgdG8gb2JqZWN0XG4gICAgICAgIHZhciBtaXNzaW5nT2JqID0ge307XG4gICAgICAgIG1pc3NpbmcuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgIG1pc3NpbmdPYmpba2V5XSA9IHZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIG1pc3NpbmdPYmopO1xuICAgICAgfVxuICAgIH0pO1xuICB9LCB0aGlzKTtcbn0pO1xuXG4vLyBfYnVsa19nZXQgQVBJIGZvciBmYXN0ZXIgcmVwbGljYXRpb24sIGFzIGRlc2NyaWJlZCBpblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2FwYWNoZS9jb3VjaGRiLWNodHRwZC9wdWxsLzMzXG4vLyBBdCB0aGUgXCJhYnN0cmFjdFwiIGxldmVsLCBpdCB3aWxsIGp1c3QgcnVuIG11bHRpcGxlIGdldCgpcyBpblxuLy8gcGFyYWxsZWwsIGJlY2F1c2UgdGhpcyBpc24ndCBtdWNoIG9mIGEgcGVyZm9ybWFuY2UgY29zdFxuLy8gZm9yIGxvY2FsIGRhdGFiYXNlcyAoZXhjZXB0IHRoZSBjb3N0IG9mIG11bHRpcGxlIHRyYW5zYWN0aW9ucywgd2hpY2ggaXNcbi8vIHNtYWxsKS4gVGhlIGh0dHAgYWRhcHRlciBvdmVycmlkZXMgdGhpcyBpbiBvcmRlclxuLy8gdG8gZG8gYSBtb3JlIGVmZmljaWVudCBzaW5nbGUgSFRUUCByZXF1ZXN0LlxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5idWxrR2V0ID1cbiAgYWRhcHRlckZ1bignYnVsa0dldCcsIGZ1bmN0aW9uIChvcHRzLCBjYWxsYmFjaykge1xuICBidWxrR2V0KHRoaXMsIG9wdHMsIGNhbGxiYWNrKTtcbn0pO1xuXG4vLyBjb21wYWN0IG9uZSBkb2N1bWVudCBhbmQgZmlyZSBjYWxsYmFja1xuLy8gYnkgY29tcGFjdGluZyB3ZSBtZWFuIHJlbW92aW5nIGFsbCByZXZpc2lvbnMgd2hpY2hcbi8vIGFyZSBmdXJ0aGVyIGZyb20gdGhlIGxlYWYgaW4gcmV2aXNpb24gdHJlZSB0aGFuIG1heF9oZWlnaHRcbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUuY29tcGFjdERvY3VtZW50ID1cbiAgYWRhcHRlckZ1bignY29tcGFjdERvY3VtZW50JywgZnVuY3Rpb24gKGRvY0lkLCBtYXhIZWlnaHQsIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fZ2V0UmV2aXNpb25UcmVlKGRvY0lkLCBmdW5jdGlvbiAoZXJyLCByZXZUcmVlKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgfVxuICAgIHZhciBoZWlnaHQgPSBjb21wdXRlSGVpZ2h0KHJldlRyZWUpO1xuICAgIHZhciBjYW5kaWRhdGVzID0gW107XG4gICAgdmFyIHJldnMgPSBbXTtcbiAgICBPYmplY3Qua2V5cyhoZWlnaHQpLmZvckVhY2goZnVuY3Rpb24gKHJldikge1xuICAgICAgaWYgKGhlaWdodFtyZXZdID4gbWF4SGVpZ2h0KSB7XG4gICAgICAgIGNhbmRpZGF0ZXMucHVzaChyZXYpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdHJhdmVyc2VSZXZUcmVlKHJldlRyZWUsIGZ1bmN0aW9uIChpc0xlYWYsIHBvcywgcmV2SGFzaCwgY3R4LCBvcHRzKSB7XG4gICAgICB2YXIgcmV2ID0gcG9zICsgJy0nICsgcmV2SGFzaDtcbiAgICAgIGlmIChvcHRzLnN0YXR1cyA9PT0gJ2F2YWlsYWJsZScgJiYgY2FuZGlkYXRlcy5pbmRleE9mKHJldikgIT09IC0xKSB7XG4gICAgICAgIHJldnMucHVzaChyZXYpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNlbGYuX2RvQ29tcGFjdGlvbihkb2NJZCwgcmV2cywgY2FsbGJhY2spO1xuICB9KTtcbn0pO1xuXG4vLyBjb21wYWN0IHRoZSB3aG9sZSBkYXRhYmFzZSB1c2luZyBzaW5nbGUgZG9jdW1lbnRcbi8vIGNvbXBhY3Rpb25cbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUuY29tcGFjdCA9XG4gIGFkYXB0ZXJGdW4oJ2NvbXBhY3QnLCBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgc2VsZi5fY29tcGFjdGlvblF1ZXVlID0gc2VsZi5fY29tcGFjdGlvblF1ZXVlIHx8IFtdO1xuICBzZWxmLl9jb21wYWN0aW9uUXVldWUucHVzaCh7b3B0czogb3B0cywgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gIGlmIChzZWxmLl9jb21wYWN0aW9uUXVldWUubGVuZ3RoID09PSAxKSB7XG4gICAgZG9OZXh0Q29tcGFjdGlvbihzZWxmKTtcbiAgfVxufSk7XG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLl9jb21wYWN0ID0gZnVuY3Rpb24gKG9wdHMsIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGNoYW5nZXNPcHRzID0ge1xuICAgIHJldHVybl9kb2NzOiBmYWxzZSxcbiAgICBsYXN0X3NlcTogb3B0cy5sYXN0X3NlcSB8fCAwXG4gIH07XG4gIHZhciBwcm9taXNlcyA9IFtdO1xuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKHJvdykge1xuICAgIHByb21pc2VzLnB1c2goc2VsZi5jb21wYWN0RG9jdW1lbnQocm93LmlkLCAwKSk7XG4gIH1cbiAgZnVuY3Rpb24gb25Db21wbGV0ZShyZXNwKSB7XG4gICAgdmFyIGxhc3RTZXEgPSByZXNwLmxhc3Rfc2VxO1xuICAgIFBvdWNoUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHVwc2VydChzZWxmLCAnX2xvY2FsL2NvbXBhY3Rpb24nLCBmdW5jdGlvbiBkZWx0YUZ1bmMoZG9jKSB7XG4gICAgICAgIGlmICghZG9jLmxhc3Rfc2VxIHx8IGRvYy5sYXN0X3NlcSA8IGxhc3RTZXEpIHtcbiAgICAgICAgICBkb2MubGFzdF9zZXEgPSBsYXN0U2VxO1xuICAgICAgICAgIHJldHVybiBkb2M7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBzb21lYm9keSBlbHNlIGdvdCBoZXJlIGZpcnN0LCBkb24ndCB1cGRhdGVcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwge29rOiB0cnVlfSk7XG4gICAgfSkuY2F0Y2goY2FsbGJhY2spO1xuICB9XG4gIHNlbGYuY2hhbmdlcyhjaGFuZ2VzT3B0cylcbiAgICAub24oJ2NoYW5nZScsIG9uQ2hhbmdlKVxuICAgIC5vbignY29tcGxldGUnLCBvbkNvbXBsZXRlKVxuICAgIC5vbignZXJyb3InLCBjYWxsYmFjayk7XG59O1xuXG4vKiBCZWdpbiBhcGkgd3JhcHBlcnMuIFNwZWNpZmljIGZ1bmN0aW9uYWxpdHkgdG8gc3RvcmFnZSBiZWxvbmdzIGluIHRoZVxuICAgX1ttZXRob2RdICovXG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLmdldCA9IGFkYXB0ZXJGdW4oJ2dldCcsIGZ1bmN0aW9uIChpZCwgb3B0cywgY2IpIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2IgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBjYihjcmVhdGVFcnJvcihJTlZBTElEX0lEKSk7XG4gIH1cbiAgaWYgKGlzTG9jYWxJZChpZCkgJiYgdHlwZW9mIHRoaXMuX2dldExvY2FsID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldExvY2FsKGlkLCBjYik7XG4gIH1cbiAgdmFyIGxlYXZlcyA9IFtdLCBzZWxmID0gdGhpcztcblxuICBmdW5jdGlvbiBmaW5pc2hPcGVuUmV2cygpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGNvdW50ID0gbGVhdmVzLmxlbmd0aDtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoIWNvdW50KSB7XG4gICAgICByZXR1cm4gY2IobnVsbCwgcmVzdWx0KTtcbiAgICB9XG4gICAgLy8gb3JkZXIgd2l0aCBvcGVuX3JldnMgaXMgdW5zcGVjaWZpZWRcbiAgICBsZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAobGVhZikge1xuICAgICAgc2VsZi5nZXQoaWQsIHtcbiAgICAgICAgcmV2OiBsZWFmLFxuICAgICAgICByZXZzOiBvcHRzLnJldnMsXG4gICAgICAgIGF0dGFjaG1lbnRzOiBvcHRzLmF0dGFjaG1lbnRzXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyLCBkb2MpIHtcbiAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaCh7b2s6IGRvY30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHttaXNzaW5nOiBsZWFmfSk7XG4gICAgICAgIH1cbiAgICAgICAgY291bnQtLTtcbiAgICAgICAgaWYgKCFjb3VudCkge1xuICAgICAgICAgIGNiKG51bGwsIHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKG9wdHMub3Blbl9yZXZzKSB7XG4gICAgaWYgKG9wdHMub3Blbl9yZXZzID09PSBcImFsbFwiKSB7XG4gICAgICB0aGlzLl9nZXRSZXZpc2lvblRyZWUoaWQsIGZ1bmN0aW9uIChlcnIsIHJldl90cmVlKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBsZWF2ZXMgPSBjb2xsZWN0TGVhdmVzKHJldl90cmVlKS5tYXAoZnVuY3Rpb24gKGxlYWYpIHtcbiAgICAgICAgICByZXR1cm4gbGVhZi5yZXY7XG4gICAgICAgIH0pO1xuICAgICAgICBmaW5pc2hPcGVuUmV2cygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMub3Blbl9yZXZzKSkge1xuICAgICAgICBsZWF2ZXMgPSBvcHRzLm9wZW5fcmV2cztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZWF2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YXIgbCA9IGxlYXZlc1tpXTtcbiAgICAgICAgICAvLyBsb29rcyBsaWtlIGl0J3MgdGhlIG9ubHkgdGhpbmcgY291Y2hkYiBjaGVja3NcbiAgICAgICAgICBpZiAoISh0eXBlb2YgKGwpID09PSBcInN0cmluZ1wiICYmIC9eXFxkKy0vLnRlc3QobCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gY2IoY3JlYXRlRXJyb3IoSU5WQUxJRF9SRVYpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmluaXNoT3BlblJldnMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjYihjcmVhdGVFcnJvcihVTktOT1dOX0VSUk9SLCAnZnVuY3Rpb25fY2xhdXNlJykpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm47IC8vIG9wZW5fcmV2cyBkb2VzIG5vdCBsaWtlIG90aGVyIG9wdGlvbnNcbiAgfVxuXG4gIHJldHVybiB0aGlzLl9nZXQoaWQsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYihlcnIpO1xuICAgIH1cblxuICAgIHZhciBkb2MgPSByZXN1bHQuZG9jO1xuICAgIHZhciBtZXRhZGF0YSA9IHJlc3VsdC5tZXRhZGF0YTtcbiAgICB2YXIgY3R4ID0gcmVzdWx0LmN0eDtcblxuICAgIGlmIChvcHRzLmNvbmZsaWN0cykge1xuICAgICAgdmFyIGNvbmZsaWN0cyA9IGNvbGxlY3RDb25mbGljdHMobWV0YWRhdGEpO1xuICAgICAgaWYgKGNvbmZsaWN0cy5sZW5ndGgpIHtcbiAgICAgICAgZG9jLl9jb25mbGljdHMgPSBjb25mbGljdHM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzRGVsZXRlZChtZXRhZGF0YSwgZG9jLl9yZXYpKSB7XG4gICAgICBkb2MuX2RlbGV0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLnJldnMgfHwgb3B0cy5yZXZzX2luZm8pIHtcbiAgICAgIHZhciBwYXRocyA9IHJvb3RUb0xlYWYobWV0YWRhdGEucmV2X3RyZWUpO1xuICAgICAgdmFyIHBhdGggPSBwYXRocy5yZWR1Y2UoZnVuY3Rpb24gc2VsZWN0UmV2UGF0aChyZXN1bHQsIGFycikge1xuICAgICAgICB2YXIgc3BsaXR0ZWRSZXYgPSBkb2MuX3Jldi5zcGxpdCgnLScpO1xuICAgICAgICB2YXIgcmV2Tm8gICAgICAgPSBwYXJzZUludChzcGxpdHRlZFJldlswXSwgMTApO1xuICAgICAgICB2YXIgcmV2SGFzaCAgICAgPSBzcGxpdHRlZFJldlsxXTtcbiAgICAgICAgdmFyIGhhc2hJbmRleCAgID0gYXJyLmlkcy5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguaWQ7IH0pXG4gICAgICAgICAgLmluZGV4T2YocmV2SGFzaCk7XG4gICAgICAgIHZhciBoYXNoRm91bmRBdFJldlBvcyA9IGhhc2hJbmRleCA9PT0gKHJldk5vIC0gMSk7XG5cbiAgICAgICAgcmV0dXJuIChoYXNoRm91bmRBdFJldlBvcyB8fCAoIXJlc3VsdCAmJiBoYXNoSW5kZXggIT09IC0xKSlcbiAgICAgICAgICA/IGFyclxuICAgICAgICAgIDogcmVzdWx0O1xuICAgICAgfSwgbnVsbCk7XG5cbiAgICAgIHZhciBpbmRleE9mUmV2ID0gcGF0aC5pZHMubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LmlkOyB9KVxuICAgICAgICAuaW5kZXhPZihkb2MuX3Jldi5zcGxpdCgnLScpWzFdKSArIDE7XG4gICAgICB2YXIgaG93TWFueSA9IHBhdGguaWRzLmxlbmd0aCAtIGluZGV4T2ZSZXY7XG4gICAgICBwYXRoLmlkcy5zcGxpY2UoaW5kZXhPZlJldiwgaG93TWFueSk7XG4gICAgICBwYXRoLmlkcy5yZXZlcnNlKCk7XG5cbiAgICAgIGlmIChvcHRzLnJldnMpIHtcbiAgICAgICAgZG9jLl9yZXZpc2lvbnMgPSB7XG4gICAgICAgICAgc3RhcnQ6IChwYXRoLnBvcyArIHBhdGguaWRzLmxlbmd0aCkgLSAxLFxuICAgICAgICAgIGlkczogcGF0aC5pZHMubWFwKGZ1bmN0aW9uIChyZXYpIHtcbiAgICAgICAgICAgIHJldHVybiByZXYuaWQ7XG4gICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRzLnJldnNfaW5mbykge1xuICAgICAgICB2YXIgcG9zID0gIHBhdGgucG9zICsgcGF0aC5pZHMubGVuZ3RoO1xuICAgICAgICBkb2MuX3JldnNfaW5mbyA9IHBhdGguaWRzLm1hcChmdW5jdGlvbiAocmV2KSB7XG4gICAgICAgICAgcG9zLS07XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJldjogcG9zICsgJy0nICsgcmV2LmlkLFxuICAgICAgICAgICAgc3RhdHVzOiByZXYub3B0cy5zdGF0dXNcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0cy5hdHRhY2htZW50cyAmJiBkb2MuX2F0dGFjaG1lbnRzKSB7XG4gICAgICB2YXIgYXR0YWNobWVudHMgPSBkb2MuX2F0dGFjaG1lbnRzO1xuICAgICAgdmFyIGNvdW50ID0gT2JqZWN0LmtleXMoYXR0YWNobWVudHMpLmxlbmd0aDtcbiAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gY2IobnVsbCwgZG9jKTtcbiAgICAgIH1cbiAgICAgIE9iamVjdC5rZXlzKGF0dGFjaG1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgdGhpcy5fZ2V0QXR0YWNobWVudChkb2MuX2lkLCBrZXksIGF0dGFjaG1lbnRzW2tleV0sIHtcbiAgICAgICAgICAvLyBQcmV2aW91c2x5IHRoZSByZXZpc2lvbiBoYW5kbGluZyB3YXMgZG9uZSBpbiBhZGFwdGVyLmpzXG4gICAgICAgICAgLy8gZ2V0QXR0YWNobWVudCwgaG93ZXZlciBzaW5jZSBpZGItbmV4dCBkb2VzbnQgd2UgbmVlZCB0b1xuICAgICAgICAgIC8vIHBhc3MgdGhlIHJldiB0aHJvdWdoXG4gICAgICAgICAgcmV2OiBkb2MuX3JldixcbiAgICAgICAgICBiaW5hcnk6IG9wdHMuYmluYXJ5LFxuICAgICAgICAgIGN0eDogY3R4XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICB2YXIgYXR0ID0gZG9jLl9hdHRhY2htZW50c1trZXldO1xuICAgICAgICAgIGF0dC5kYXRhID0gZGF0YTtcbiAgICAgICAgICBkZWxldGUgYXR0LnN0dWI7XG4gICAgICAgICAgZGVsZXRlIGF0dC5sZW5ndGg7XG4gICAgICAgICAgaWYgKCEtLWNvdW50KSB7XG4gICAgICAgICAgICBjYihudWxsLCBkb2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LCBzZWxmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRvYy5fYXR0YWNobWVudHMpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRvYy5fYXR0YWNobWVudHMpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgICAgIGlmIChkb2MuX2F0dGFjaG1lbnRzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGRvYy5fYXR0YWNobWVudHNba2V5XS5zdHViID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNiKG51bGwsIGRvYyk7XG4gICAgfVxuICB9KTtcbn0pO1xuXG4vLyBUT0RPOiBJIGRvbnQgbGlrZSB0aGlzLCBpdCBmb3JjZXMgYW4gZXh0cmEgcmVhZCBmb3IgZXZlcnlcbi8vIGF0dGFjaG1lbnQgcmVhZCBhbmQgZW5mb3JjZXMgYSBjb25mdXNpbmcgYXBpIGJldHdlZW5cbi8vIGFkYXB0ZXIuanMgYW5kIHRoZSBhZGFwdGVyIGltcGxlbWVudGF0aW9uXG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLmdldEF0dGFjaG1lbnQgPVxuICBhZGFwdGVyRnVuKCdnZXRBdHRhY2htZW50JywgZnVuY3Rpb24gKGRvY0lkLCBhdHRhY2htZW50SWQsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYgKG9wdHMgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgdGhpcy5fZ2V0KGRvY0lkLCBvcHRzLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICB9XG4gICAgaWYgKHJlcy5kb2MuX2F0dGFjaG1lbnRzICYmIHJlcy5kb2MuX2F0dGFjaG1lbnRzW2F0dGFjaG1lbnRJZF0pIHtcbiAgICAgIG9wdHMuY3R4ID0gcmVzLmN0eDtcbiAgICAgIG9wdHMuYmluYXJ5ID0gdHJ1ZTtcbiAgICAgIHNlbGYuX2dldEF0dGFjaG1lbnQoZG9jSWQsIGF0dGFjaG1lbnRJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmRvYy5fYXR0YWNobWVudHNbYXR0YWNobWVudElkXSwgb3B0cywgY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoTUlTU0lOR19ET0MpKTtcbiAgICB9XG4gIH0pO1xufSk7XG5cbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUuYWxsRG9jcyA9XG4gIGFkYXB0ZXJGdW4oJ2FsbERvY3MnLCBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICBvcHRzLnNraXAgPSB0eXBlb2Ygb3B0cy5za2lwICE9PSAndW5kZWZpbmVkJyA/IG9wdHMuc2tpcCA6IDA7XG4gIGlmIChvcHRzLnN0YXJ0X2tleSkge1xuICAgIG9wdHMuc3RhcnRrZXkgPSBvcHRzLnN0YXJ0X2tleTtcbiAgfVxuICBpZiAob3B0cy5lbmRfa2V5KSB7XG4gICAgb3B0cy5lbmRrZXkgPSBvcHRzLmVuZF9rZXk7XG4gIH1cbiAgaWYgKCdrZXlzJyBpbiBvcHRzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG9wdHMua2V5cykpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgVHlwZUVycm9yKCdvcHRpb25zLmtleXMgbXVzdCBiZSBhbiBhcnJheScpKTtcbiAgICB9XG4gICAgdmFyIGluY29tcGF0aWJsZU9wdCA9XG4gICAgICBbJ3N0YXJ0a2V5JywgJ2VuZGtleScsICdrZXknXS5maWx0ZXIoZnVuY3Rpb24gKGluY29tcGF0aWJsZU9wdCkge1xuICAgICAgcmV0dXJuIGluY29tcGF0aWJsZU9wdCBpbiBvcHRzO1xuICAgIH0pWzBdO1xuICAgIGlmIChpbmNvbXBhdGlibGVPcHQpIHtcbiAgICAgIGNhbGxiYWNrKGNyZWF0ZUVycm9yKFFVRVJZX1BBUlNFX0VSUk9SLFxuICAgICAgICAnUXVlcnkgcGFyYW1ldGVyIGAnICsgaW5jb21wYXRpYmxlT3B0ICtcbiAgICAgICAgJ2AgaXMgbm90IGNvbXBhdGlibGUgd2l0aCBtdWx0aS1nZXQnXG4gICAgICApKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMudHlwZSgpICE9PSAnaHR0cCcpIHtcbiAgICAgIHJldHVybiBhbGxEb2NzS2V5c1F1ZXJ5KHRoaXMsIG9wdHMsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5fYWxsRG9jcyhvcHRzLCBjYWxsYmFjayk7XG59KTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5jaGFuZ2VzID0gZnVuY3Rpb24gKG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgcmV0dXJuIG5ldyBDaGFuZ2VzJDEodGhpcywgb3B0cywgY2FsbGJhY2spO1xufTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5jbG9zZSA9IGFkYXB0ZXJGdW4oJ2Nsb3NlJywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHRoaXMuX2Nsb3NlZCA9IHRydWU7XG4gIHRoaXMuZW1pdCgnY2xvc2VkJyk7XG4gIHJldHVybiB0aGlzLl9jbG9zZShjYWxsYmFjayk7XG59KTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5pbmZvID0gYWRhcHRlckZ1bignaW5mbycsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuX2luZm8oZnVuY3Rpb24gKGVyciwgaW5mbykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIH1cbiAgICAvLyBhc3N1bWUgd2Uga25vdyBiZXR0ZXIgdGhhbiB0aGUgYWRhcHRlciwgdW5sZXNzIGl0IGluZm9ybXMgdXNcbiAgICBpbmZvLmRiX25hbWUgPSBpbmZvLmRiX25hbWUgfHwgc2VsZi5uYW1lO1xuICAgIGluZm8uYXV0b19jb21wYWN0aW9uID0gISEoc2VsZi5hdXRvX2NvbXBhY3Rpb24gJiYgc2VsZi50eXBlKCkgIT09ICdodHRwJyk7XG4gICAgaW5mby5hZGFwdGVyID0gc2VsZi50eXBlKCk7XG4gICAgY2FsbGJhY2sobnVsbCwgaW5mbyk7XG4gIH0pO1xufSk7XG5cbkFic3RyYWN0UG91Y2hEQi5wcm90b3R5cGUuaWQgPSBhZGFwdGVyRnVuKCdpZCcsIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICByZXR1cm4gdGhpcy5faWQoY2FsbGJhY2spO1xufSk7XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAodHlwZW9mIHRoaXMuX3R5cGUgPT09ICdmdW5jdGlvbicpID8gdGhpcy5fdHlwZSgpIDogdGhpcy5hZGFwdGVyO1xufTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5idWxrRG9jcyA9XG4gIGFkYXB0ZXJGdW4oJ2J1bGtEb2NzJywgZnVuY3Rpb24gKHJlcSwgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHJlcSkpIHtcbiAgICByZXEgPSB7XG4gICAgICBkb2NzOiByZXFcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFyZXEgfHwgIXJlcS5kb2NzIHx8ICFBcnJheS5pc0FycmF5KHJlcS5kb2NzKSkge1xuICAgIHJldHVybiBjYWxsYmFjayhjcmVhdGVFcnJvcihNSVNTSU5HX0JVTEtfRE9DUykpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXEuZG9jcy5sZW5ndGg7ICsraSkge1xuICAgIGlmICh0eXBlb2YgcmVxLmRvY3NbaV0gIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkocmVxLmRvY3NbaV0pKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoTk9UX0FOX09CSkVDVCkpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBhdHRhY2htZW50RXJyb3I7XG4gIHJlcS5kb2NzLmZvckVhY2goZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MuX2F0dGFjaG1lbnRzKSB7XG4gICAgICBPYmplY3Qua2V5cyhkb2MuX2F0dGFjaG1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGF0dGFjaG1lbnRFcnJvciA9IGF0dGFjaG1lbnRFcnJvciB8fCBhdHRhY2htZW50TmFtZUVycm9yKG5hbWUpO1xuICAgICAgICBpZiAoIWRvYy5fYXR0YWNobWVudHNbbmFtZV0uY29udGVudF90eXBlKSB7XG4gICAgICAgICAgZ3VhcmRlZENvbnNvbGUoJ3dhcm4nLCAnQXR0YWNobWVudCcsIG5hbWUsICdvbiBkb2N1bWVudCcsIGRvYy5faWQsICdpcyBtaXNzaW5nIGNvbnRlbnRfdHlwZScpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChhdHRhY2htZW50RXJyb3IpIHtcbiAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoQkFEX1JFUVVFU1QsIGF0dGFjaG1lbnRFcnJvcikpO1xuICB9XG5cbiAgaWYgKCEoJ25ld19lZGl0cycgaW4gb3B0cykpIHtcbiAgICBpZiAoJ25ld19lZGl0cycgaW4gcmVxKSB7XG4gICAgICBvcHRzLm5ld19lZGl0cyA9IHJlcS5uZXdfZWRpdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMubmV3X2VkaXRzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIW9wdHMubmV3X2VkaXRzICYmIHRoaXMudHlwZSgpICE9PSAnaHR0cCcpIHtcbiAgICAvLyBlbnN1cmUgcmV2aXNpb25zIG9mIHRoZSBzYW1lIGRvYyBhcmUgc29ydGVkLCBzbyB0aGF0XG4gICAgLy8gdGhlIGxvY2FsIGFkYXB0ZXIgcHJvY2Vzc2VzIHRoZW0gY29ycmVjdGx5ICgjMjkzNSlcbiAgICByZXEuZG9jcy5zb3J0KGNvbXBhcmVCeUlkVGhlblJldik7XG4gIH1cblxuICBjbGVhbkRvY3MocmVxLmRvY3MpO1xuXG4gIHJldHVybiB0aGlzLl9idWxrRG9jcyhyZXEsIG9wdHMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIH1cbiAgICBpZiAoIW9wdHMubmV3X2VkaXRzKSB7XG4gICAgICAvLyB0aGlzIGlzIHdoYXQgY291Y2ggZG9lcyB3aGVuIG5ld19lZGl0cyBpcyBmYWxzZVxuICAgICAgcmVzID0gcmVzLmZpbHRlcihmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geC5lcnJvcjtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjYWxsYmFjayhudWxsLCByZXMpO1xuICB9KTtcbn0pO1xuXG5BYnN0cmFjdFBvdWNoREIucHJvdG90eXBlLnJlZ2lzdGVyRGVwZW5kZW50RGF0YWJhc2UgPVxuICBhZGFwdGVyRnVuKCdyZWdpc3RlckRlcGVuZGVudERhdGFiYXNlJywgZnVuY3Rpb24gKGRlcGVuZGVudERiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKSB7XG4gIHZhciBkZXBEQiA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGRlcGVuZGVudERiLCB0aGlzLl9fb3B0cyk7XG5cbiAgZnVuY3Rpb24gZGlmZkZ1bihkb2MpIHtcbiAgICBkb2MuZGVwZW5kZW50RGJzID0gZG9jLmRlcGVuZGVudERicyB8fCB7fTtcbiAgICBpZiAoZG9jLmRlcGVuZGVudERic1tkZXBlbmRlbnREYl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTsgLy8gbm8gdXBkYXRlIHJlcXVpcmVkXG4gICAgfVxuICAgIGRvYy5kZXBlbmRlbnREYnNbZGVwZW5kZW50RGJdID0gdHJ1ZTtcbiAgICByZXR1cm4gZG9jO1xuICB9XG4gIHVwc2VydCh0aGlzLCAnX2xvY2FsL19wb3VjaF9kZXBlbmRlbnREYnMnLCBkaWZmRnVuKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHtkYjogZGVwREJ9KTtcbiAgICB9KS5jYXRjaChjYWxsYmFjayk7XG59KTtcblxuQWJzdHJhY3RQb3VjaERCLnByb3RvdHlwZS5kZXN0cm95ID1cbiAgYWRhcHRlckZ1bignZGVzdHJveScsIGZ1bmN0aW9uIChvcHRzLCBjYWxsYmFjaykge1xuXG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciB1c2VQcmVmaXggPSAndXNlX3ByZWZpeCcgaW4gc2VsZiA/IHNlbGYudXNlX3ByZWZpeCA6IHRydWU7XG5cbiAgZnVuY3Rpb24gZGVzdHJveURiKCkge1xuICAgIC8vIGNhbGwgZGVzdHJveSBtZXRob2Qgb2YgdGhlIHBhcnRpY3VsYXIgYWRhcHRvclxuICAgIHNlbGYuX2Rlc3Ryb3kob3B0cywgZnVuY3Rpb24gKGVyciwgcmVzcCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgICBzZWxmLmVtaXQoJ2Rlc3Ryb3llZCcpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcCB8fCB7ICdvayc6IHRydWUgfSk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoc2VsZi50eXBlKCkgPT09ICdodHRwJykge1xuICAgIC8vIG5vIG5lZWQgdG8gY2hlY2sgZm9yIGRlcGVuZGVudCBEQnMgaWYgaXQncyBhIHJlbW90ZSBEQlxuICAgIHJldHVybiBkZXN0cm95RGIoKTtcbiAgfVxuXG4gIHNlbGYuZ2V0KCdfbG9jYWwvX3BvdWNoX2RlcGVuZGVudERicycsIGZ1bmN0aW9uIChlcnIsIGxvY2FsRG9jKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoZXJyLnN0YXR1cyAhPT0gNDA0KSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHsgLy8gbm8gZGVwZW5kZW5jaWVzXG4gICAgICAgIHJldHVybiBkZXN0cm95RGIoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGRlcGVuZGVudERicyA9IGxvY2FsRG9jLmRlcGVuZGVudERicztcbiAgICB2YXIgUG91Y2hEQiA9IHNlbGYuY29uc3RydWN0b3I7XG4gICAgdmFyIGRlbGV0ZWRNYXAgPSBPYmplY3Qua2V5cyhkZXBlbmRlbnREYnMpLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgLy8gdXNlX3ByZWZpeCBpcyBvbmx5IGZhbHNlIGluIHRoZSBicm93c2VyXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdmFyIHRydWVOYW1lID0gdXNlUHJlZml4ID9cbiAgICAgICAgbmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoJ14nICsgUG91Y2hEQi5wcmVmaXgpLCAnJykgOiBuYW1lO1xuICAgICAgcmV0dXJuIG5ldyBQb3VjaERCKHRydWVOYW1lLCBzZWxmLl9fb3B0cykuZGVzdHJveSgpO1xuICAgIH0pO1xuICAgIFBvdWNoUHJvbWlzZS5hbGwoZGVsZXRlZE1hcCkudGhlbihkZXN0cm95RGIsIGNhbGxiYWNrKTtcbiAgfSk7XG59KTtcblxuZnVuY3Rpb24gVGFza1F1ZXVlKCkge1xuICB0aGlzLmlzUmVhZHkgPSBmYWxzZTtcbiAgdGhpcy5mYWlsZWQgPSBmYWxzZTtcbiAgdGhpcy5xdWV1ZSA9IFtdO1xufVxuXG5UYXNrUXVldWUucHJvdG90eXBlLmV4ZWN1dGUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBmdW47XG4gIGlmICh0aGlzLmZhaWxlZCkge1xuICAgIHdoaWxlICgoZnVuID0gdGhpcy5xdWV1ZS5zaGlmdCgpKSkge1xuICAgICAgZnVuKHRoaXMuZmFpbGVkKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKChmdW4gPSB0aGlzLnF1ZXVlLnNoaWZ0KCkpKSB7XG4gICAgICBmdW4oKTtcbiAgICB9XG4gIH1cbn07XG5cblRhc2tRdWV1ZS5wcm90b3R5cGUuZmFpbCA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgdGhpcy5mYWlsZWQgPSBlcnI7XG4gIHRoaXMuZXhlY3V0ZSgpO1xufTtcblxuVGFza1F1ZXVlLnByb3RvdHlwZS5yZWFkeSA9IGZ1bmN0aW9uIChkYikge1xuICB0aGlzLmlzUmVhZHkgPSB0cnVlO1xuICB0aGlzLmRiID0gZGI7XG4gIHRoaXMuZXhlY3V0ZSgpO1xufTtcblxuVGFza1F1ZXVlLnByb3RvdHlwZS5hZGRUYXNrID0gZnVuY3Rpb24gKGZ1bikge1xuICB0aGlzLnF1ZXVlLnB1c2goZnVuKTtcbiAgaWYgKHRoaXMuZmFpbGVkKSB7XG4gICAgdGhpcy5leGVjdXRlKCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHBhcnNlQWRhcHRlcihuYW1lLCBvcHRzKSB7XG4gIHZhciBtYXRjaCA9IG5hbWUubWF0Y2goLyhbYS16XFwtXSopOlxcL1xcLyguKikvKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgLy8gdGhlIGh0dHAgYWRhcHRlciBleHBlY3RzIHRoZSBmdWxseSBxdWFsaWZpZWQgbmFtZVxuICAgIG5hbWUgPSAvaHR0cChzPykvLnRlc3QobWF0Y2hbMV0pID8gbWF0Y2hbMV0gKyAnOi8vJyArIG1hdGNoWzJdIDogbWF0Y2hbMl07XG4gICAgcmV0dXJuIHtuYW1lOiBuYW1lLCBhZGFwdGVyOiBtYXRjaFsxXX07XG4gIH1cblxuICAvLyBjaGVjayBmb3IgYnJvd3NlcnMgdGhhdCBoYXZlIGJlZW4gdXBncmFkZWQgZnJvbSB3ZWJzcWwtb25seSB0byB3ZWJzcWwraWRiXG4gIHZhciBza2lwSWRiID0gJ2lkYicgaW4gUG91Y2hEQi5hZGFwdGVycyAmJiAnd2Vic3FsJyBpbiBQb3VjaERCLmFkYXB0ZXJzICYmXG4gICAgaGFzTG9jYWxTdG9yYWdlKCkgJiZcbiAgICBsb2NhbFN0b3JhZ2VbJ19wb3VjaF9fd2Vic3FsZGJfJyArIFBvdWNoREIucHJlZml4ICsgbmFtZV07XG5cbiAgdmFyIGFkYXB0ZXJOYW1lO1xuXG4gIGlmIChvcHRzLmFkYXB0ZXIpIHtcbiAgICBhZGFwdGVyTmFtZSA9IG9wdHMuYWRhcHRlcjtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0cy5kYikge1xuICAgIGFkYXB0ZXJOYW1lID0gJ2xldmVsZGInO1xuICB9IGVsc2UgeyAvLyBhdXRvbWF0aWNhbGx5IGRldGVybWluZSBhZGFwdGVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBQb3VjaERCLnByZWZlcnJlZEFkYXB0ZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICBhZGFwdGVyTmFtZSA9IFBvdWNoREIucHJlZmVycmVkQWRhcHRlcnNbaV07XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChza2lwSWRiICYmIGFkYXB0ZXJOYW1lID09PSAnaWRiJykge1xuICAgICAgICAvLyBsb2cgaXQsIGJlY2F1c2UgdGhpcyBjYW4gYmUgY29uZnVzaW5nIGR1cmluZyBkZXZlbG9wbWVudFxuICAgICAgICBndWFyZGVkQ29uc29sZSgnbG9nJywgJ1BvdWNoREIgaXMgZG93bmdyYWRpbmcgXCInICsgbmFtZSArICdcIiB0byBXZWJTUUwgdG8nICtcbiAgICAgICAgICAnIGF2b2lkIGRhdGEgbG9zcywgYmVjYXVzZSBpdCB3YXMgYWxyZWFkeSBvcGVuZWQgd2l0aCBXZWJTUUwuJyk7XG4gICAgICAgIGNvbnRpbnVlOyAvLyBrZWVwIHVzaW5nIHdlYnNxbCB0byBhdm9pZCB1c2VyIGRhdGEgbG9zc1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIGFkYXB0ZXIgPSBQb3VjaERCLmFkYXB0ZXJzW2FkYXB0ZXJOYW1lXTtcblxuICAvLyBpZiBhZGFwdGVyIGlzIGludmFsaWQsIHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gbGF0ZXJcbiAgdmFyIHVzZVByZWZpeCA9IChhZGFwdGVyICYmICd1c2VfcHJlZml4JyBpbiBhZGFwdGVyKSA/XG4gICAgYWRhcHRlci51c2VfcHJlZml4IDogdHJ1ZTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IHVzZVByZWZpeCA/IChQb3VjaERCLnByZWZpeCArIG5hbWUpIDogbmFtZSxcbiAgICBhZGFwdGVyOiBhZGFwdGVyTmFtZVxuICB9O1xufVxuXG4vLyBPSywgc28gaGVyZSdzIHRoZSBkZWFsLiBDb25zaWRlciB0aGlzIGNvZGU6XG4vLyAgICAgdmFyIGRiMSA9IG5ldyBQb3VjaERCKCdmb28nKTtcbi8vICAgICB2YXIgZGIyID0gbmV3IFBvdWNoREIoJ2ZvbycpO1xuLy8gICAgIGRiMS5kZXN0cm95KCk7XG4vLyBeIHRoZXNlIHR3byBib3RoIG5lZWQgdG8gZW1pdCAnZGVzdHJveWVkJyBldmVudHMsXG4vLyBhcyB3ZWxsIGFzIHRoZSBQb3VjaERCIGNvbnN0cnVjdG9yIGl0c2VsZi5cbi8vIFNvIHdlIGhhdmUgb25lIGRiIG9iamVjdCAod2hpY2hldmVyIG9uZSBnb3QgZGVzdHJveSgpIGNhbGxlZCBvbiBpdClcbi8vIHJlc3BvbnNpYmxlIGZvciBlbWl0dGluZyB0aGUgaW5pdGlhbCBldmVudCwgd2hpY2ggdGhlbiBnZXRzIGVtaXR0ZWRcbi8vIGJ5IHRoZSBjb25zdHJ1Y3Rvciwgd2hpY2ggdGhlbiBicm9hZGNhc3RzIGl0IHRvIGFueSBvdGhlciBkYnNcbi8vIHRoYXQgbWF5IGhhdmUgYmVlbiBjcmVhdGVkIHdpdGggdGhlIHNhbWUgbmFtZS5cbmZ1bmN0aW9uIHByZXBhcmVGb3JEZXN0cnVjdGlvbihzZWxmKSB7XG5cbiAgdmFyIGRlc3RydWN0aW9uTGlzdGVuZXJzID0gc2VsZi5jb25zdHJ1Y3Rvci5fZGVzdHJ1Y3Rpb25MaXN0ZW5lcnM7XG5cbiAgZnVuY3Rpb24gb25EZXN0cm95ZWQoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcignY2xvc2VkJywgb25DbG9zZWQpO1xuICAgIHNlbGYuY29uc3RydWN0b3IuZW1pdCgnZGVzdHJveWVkJywgc2VsZi5uYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ29uc3RydWN0b3JEZXN0cm95ZWQoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcignZGVzdHJveWVkJywgb25EZXN0cm95ZWQpO1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlZCcsIG9uQ2xvc2VkKTtcbiAgICBzZWxmLmVtaXQoJ2Rlc3Ryb3llZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25DbG9zZWQoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcignZGVzdHJveWVkJywgb25EZXN0cm95ZWQpO1xuICAgIGRlc3RydWN0aW9uTGlzdGVuZXJzLmRlbGV0ZShzZWxmLm5hbWUpO1xuICB9XG5cbiAgc2VsZi5vbmNlKCdkZXN0cm95ZWQnLCBvbkRlc3Ryb3llZCk7XG4gIHNlbGYub25jZSgnY2xvc2VkJywgb25DbG9zZWQpO1xuXG4gIC8vIGluIHNldHVwLmpzLCB0aGUgY29uc3RydWN0b3IgaXMgcHJpbWVkIHRvIGxpc3RlbiBmb3IgZGVzdHJveSBldmVudHNcbiAgaWYgKCFkZXN0cnVjdGlvbkxpc3RlbmVycy5oYXMoc2VsZi5uYW1lKSkge1xuICAgIGRlc3RydWN0aW9uTGlzdGVuZXJzLnNldChzZWxmLm5hbWUsIFtdKTtcbiAgfVxuICBkZXN0cnVjdGlvbkxpc3RlbmVycy5nZXQoc2VsZi5uYW1lKS5wdXNoKG9uQ29uc3RydWN0b3JEZXN0cm95ZWQpO1xufVxuXG5pbmhlcml0cyhQb3VjaERCLCBBYnN0cmFjdFBvdWNoREIpO1xuZnVuY3Rpb24gUG91Y2hEQihuYW1lLCBvcHRzKSB7XG4gIC8vIEluIE5vZGUgb3VyIHRlc3Qgc3VpdGUgb25seSB0ZXN0cyB0aGlzIGZvciBQb3VjaEFsdCB1bmZvcnR1bmF0ZWx5XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUG91Y2hEQikpIHtcbiAgICByZXR1cm4gbmV3IFBvdWNoREIobmFtZSwgb3B0cyk7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gIGlmIChuYW1lICYmIHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIG9wdHMgPSBuYW1lO1xuICAgIG5hbWUgPSBvcHRzLm5hbWU7XG4gICAgZGVsZXRlIG9wdHMubmFtZTtcbiAgfVxuXG4gIHRoaXMuX19vcHRzID0gb3B0cyA9IGNsb25lKG9wdHMpO1xuXG4gIHNlbGYuYXV0b19jb21wYWN0aW9uID0gb3B0cy5hdXRvX2NvbXBhY3Rpb247XG4gIHNlbGYucHJlZml4ID0gUG91Y2hEQi5wcmVmaXg7XG5cbiAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZy9pbnZhbGlkIERCIG5hbWUnKTtcbiAgfVxuXG4gIHZhciBwcmVmaXhlZE5hbWUgPSAob3B0cy5wcmVmaXggfHwgJycpICsgbmFtZTtcbiAgdmFyIGJhY2tlbmQgPSBwYXJzZUFkYXB0ZXIocHJlZml4ZWROYW1lLCBvcHRzKTtcblxuICBvcHRzLm5hbWUgPSBiYWNrZW5kLm5hbWU7XG4gIG9wdHMuYWRhcHRlciA9IG9wdHMuYWRhcHRlciB8fCBiYWNrZW5kLmFkYXB0ZXI7XG5cbiAgc2VsZi5uYW1lID0gbmFtZTtcbiAgc2VsZi5fYWRhcHRlciA9IG9wdHMuYWRhcHRlcjtcbiAgZGVidWcoJ3BvdWNoZGI6YWRhcHRlcicpKCdQaWNrZWQgYWRhcHRlcjogJyArIG9wdHMuYWRhcHRlcik7XG5cbiAgaWYgKCFQb3VjaERCLmFkYXB0ZXJzW29wdHMuYWRhcHRlcl0gfHxcbiAgICAgICFQb3VjaERCLmFkYXB0ZXJzW29wdHMuYWRhcHRlcl0udmFsaWQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBBZGFwdGVyOiAnICsgb3B0cy5hZGFwdGVyKTtcbiAgfVxuXG4gIEFic3RyYWN0UG91Y2hEQi5jYWxsKHNlbGYpO1xuICBzZWxmLnRhc2txdWV1ZSA9IG5ldyBUYXNrUXVldWUoKTtcblxuICBzZWxmLmFkYXB0ZXIgPSBvcHRzLmFkYXB0ZXI7XG5cbiAgUG91Y2hEQi5hZGFwdGVyc1tvcHRzLmFkYXB0ZXJdLmNhbGwoc2VsZiwgb3B0cywgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBzZWxmLnRhc2txdWV1ZS5mYWlsKGVycik7XG4gICAgfVxuICAgIHByZXBhcmVGb3JEZXN0cnVjdGlvbihzZWxmKTtcblxuICAgIHNlbGYuZW1pdCgnY3JlYXRlZCcsIHNlbGYpO1xuICAgIFBvdWNoREIuZW1pdCgnY3JlYXRlZCcsIHNlbGYubmFtZSk7XG4gICAgc2VsZi50YXNrcXVldWUucmVhZHkoc2VsZik7XG4gIH0pO1xuXG59XG5cblBvdWNoREIuZGVidWcgPSBkZWJ1ZztcblxuUG91Y2hEQi5hZGFwdGVycyA9IHt9O1xuUG91Y2hEQi5wcmVmZXJyZWRBZGFwdGVycyA9IFtdO1xuXG5Qb3VjaERCLnByZWZpeCA9ICdfcG91Y2hfJztcblxudmFyIGV2ZW50RW1pdHRlciA9IG5ldyBldmVudHMuRXZlbnRFbWl0dGVyKCk7XG5cbmZ1bmN0aW9uIHNldFVwRXZlbnRFbWl0dGVyKFBvdWNoKSB7XG4gIE9iamVjdC5rZXlzKGV2ZW50cy5FdmVudEVtaXR0ZXIucHJvdG90eXBlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodHlwZW9mIGV2ZW50cy5FdmVudEVtaXR0ZXIucHJvdG90eXBlW2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIFBvdWNoW2tleV0gPSBldmVudEVtaXR0ZXJba2V5XS5iaW5kKGV2ZW50RW1pdHRlcik7XG4gICAgfVxuICB9KTtcblxuICAvLyB0aGVzZSBhcmUgY3JlYXRlZCBpbiBjb25zdHJ1Y3Rvci5qcywgYW5kIGFsbG93IHVzIHRvIG5vdGlmeSBlYWNoIERCIHdpdGhcbiAgLy8gdGhlIHNhbWUgbmFtZSB0aGF0IGl0IHdhcyBkZXN0cm95ZWQsIHZpYSB0aGUgY29uc3RydWN0b3Igb2JqZWN0XG4gIHZhciBkZXN0cnVjdExpc3RlbmVycyA9IFBvdWNoLl9kZXN0cnVjdGlvbkxpc3RlbmVycyA9IG5ldyBfTWFwKCk7XG4gIFBvdWNoLm9uKCdkZXN0cm95ZWQnLCBmdW5jdGlvbiBvbkNvbnN0cnVjdG9yRGVzdHJveWVkKG5hbWUpIHtcbiAgICBkZXN0cnVjdExpc3RlbmVycy5nZXQobmFtZSkuZm9yRWFjaChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gICAgZGVzdHJ1Y3RMaXN0ZW5lcnMuZGVsZXRlKG5hbWUpO1xuICB9KTtcbn1cblxuc2V0VXBFdmVudEVtaXR0ZXIoUG91Y2hEQik7XG5cblBvdWNoREIuYWRhcHRlciA9IGZ1bmN0aW9uIChpZCwgb2JqLCBhZGRUb1ByZWZlcnJlZEFkYXB0ZXJzKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChvYmoudmFsaWQoKSkge1xuICAgIFBvdWNoREIuYWRhcHRlcnNbaWRdID0gb2JqO1xuICAgIGlmIChhZGRUb1ByZWZlcnJlZEFkYXB0ZXJzKSB7XG4gICAgICBQb3VjaERCLnByZWZlcnJlZEFkYXB0ZXJzLnB1c2goaWQpO1xuICAgIH1cbiAgfVxufTtcblxuUG91Y2hEQi5wbHVnaW4gPSBmdW5jdGlvbiAob2JqKSB7XG4gIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7IC8vIGZ1bmN0aW9uIHN0eWxlIGZvciBwbHVnaW5zXG4gICAgb2JqKFBvdWNoREIpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwKXtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGx1Z2luOiBvYmplY3QgcGFzc2VkIGluIGlzIGVtcHR5IG9yIG5vdCBhbiBvYmplY3QnKTtcbiAgfSBlbHNlIHtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7IC8vIG9iamVjdCBzdHlsZSBmb3IgcGx1Z2luc1xuICAgICAgUG91Y2hEQi5wcm90b3R5cGVbaWRdID0gb2JqW2lkXTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gUG91Y2hEQjtcbn07XG5cblBvdWNoREIuZGVmYXVsdHMgPSBmdW5jdGlvbiAoZGVmYXVsdE9wdHMpIHtcbiAgZnVuY3Rpb24gUG91Y2hBbHQobmFtZSwgb3B0cykge1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQb3VjaEFsdCkpIHtcbiAgICAgIHJldHVybiBuZXcgUG91Y2hBbHQobmFtZSwgb3B0cyk7XG4gICAgfVxuXG4gICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICBpZiAobmFtZSAmJiB0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG9wdHMgPSBuYW1lO1xuICAgICAgbmFtZSA9IG9wdHMubmFtZTtcbiAgICAgIGRlbGV0ZSBvcHRzLm5hbWU7XG4gICAgfVxuXG4gICAgb3B0cyA9IGV4dGVuZCQxKHt9LCBkZWZhdWx0T3B0cywgb3B0cyk7XG4gICAgUG91Y2hEQi5jYWxsKHRoaXMsIG5hbWUsIG9wdHMpO1xuICB9XG5cbiAgaW5oZXJpdHMoUG91Y2hBbHQsIFBvdWNoREIpO1xuXG4gIFBvdWNoQWx0LnByZWZlcnJlZEFkYXB0ZXJzID0gUG91Y2hEQi5wcmVmZXJyZWRBZGFwdGVycy5zbGljZSgpO1xuICBPYmplY3Qua2V5cyhQb3VjaERCKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoIShrZXkgaW4gUG91Y2hBbHQpKSB7XG4gICAgICBQb3VjaEFsdFtrZXldID0gUG91Y2hEQltrZXldO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIFBvdWNoQWx0O1xufTtcblxuLy8gbWFuYWdlZCBhdXRvbWF0aWNhbGx5IGJ5IHNldC12ZXJzaW9uLmpzXG52YXIgdmVyc2lvbiA9IFwiNi4xLjAtcHJlcmVsZWFzZVwiO1xuXG5Qb3VjaERCLnZlcnNpb24gPSB2ZXJzaW9uO1xuXG5mdW5jdGlvbiB0b09iamVjdChhcnJheSkge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKGZ1bmN0aW9uIChvYmosIGl0ZW0pIHtcbiAgICBvYmpbaXRlbV0gPSB0cnVlO1xuICAgIHJldHVybiBvYmo7XG4gIH0sIHt9KTtcbn1cbi8vIExpc3Qgb2YgdG9wIGxldmVsIHJlc2VydmVkIHdvcmRzIGZvciBkb2NcbnZhciByZXNlcnZlZFdvcmRzID0gdG9PYmplY3QoW1xuICAnX2lkJyxcbiAgJ19yZXYnLFxuICAnX2F0dGFjaG1lbnRzJyxcbiAgJ19kZWxldGVkJyxcbiAgJ19yZXZpc2lvbnMnLFxuICAnX3JldnNfaW5mbycsXG4gICdfY29uZmxpY3RzJyxcbiAgJ19kZWxldGVkX2NvbmZsaWN0cycsXG4gICdfbG9jYWxfc2VxJyxcbiAgJ19yZXZfdHJlZScsXG4gIC8vcmVwbGljYXRpb24gZG9jdW1lbnRzXG4gICdfcmVwbGljYXRpb25faWQnLFxuICAnX3JlcGxpY2F0aW9uX3N0YXRlJyxcbiAgJ19yZXBsaWNhdGlvbl9zdGF0ZV90aW1lJyxcbiAgJ19yZXBsaWNhdGlvbl9zdGF0ZV9yZWFzb24nLFxuICAnX3JlcGxpY2F0aW9uX3N0YXRzJyxcbiAgLy8gU3BlY2lmaWMgdG8gQ291Y2hiYXNlIFN5bmMgR2F0ZXdheVxuICAnX3JlbW92ZWQnXG5dKTtcblxuLy8gTGlzdCBvZiByZXNlcnZlZCB3b3JkcyB0aGF0IHNob3VsZCBlbmQgdXAgdGhlIGRvY3VtZW50XG52YXIgZGF0YVdvcmRzID0gdG9PYmplY3QoW1xuICAnX2F0dGFjaG1lbnRzJyxcbiAgLy9yZXBsaWNhdGlvbiBkb2N1bWVudHNcbiAgJ19yZXBsaWNhdGlvbl9pZCcsXG4gICdfcmVwbGljYXRpb25fc3RhdGUnLFxuICAnX3JlcGxpY2F0aW9uX3N0YXRlX3RpbWUnLFxuICAnX3JlcGxpY2F0aW9uX3N0YXRlX3JlYXNvbicsXG4gICdfcmVwbGljYXRpb25fc3RhdHMnXG5dKTtcblxuZnVuY3Rpb24gcGFyc2VSZXZpc2lvbkluZm8ocmV2KSB7XG4gIGlmICghL15cXGQrXFwtLi8udGVzdChyZXYpKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUVycm9yKElOVkFMSURfUkVWKTtcbiAgfVxuICB2YXIgaWR4ID0gcmV2LmluZGV4T2YoJy0nKTtcbiAgdmFyIGxlZnQgPSByZXYuc3Vic3RyaW5nKDAsIGlkeCk7XG4gIHZhciByaWdodCA9IHJldi5zdWJzdHJpbmcoaWR4ICsgMSk7XG4gIHJldHVybiB7XG4gICAgcHJlZml4OiBwYXJzZUludChsZWZ0LCAxMCksXG4gICAgaWQ6IHJpZ2h0XG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VSZXZUcmVlRnJvbVJldmlzaW9ucyhyZXZpc2lvbnMsIG9wdHMpIHtcbiAgdmFyIHBvcyA9IHJldmlzaW9ucy5zdGFydCAtIHJldmlzaW9ucy5pZHMubGVuZ3RoICsgMTtcblxuICB2YXIgcmV2aXNpb25JZHMgPSByZXZpc2lvbnMuaWRzO1xuICB2YXIgaWRzID0gW3JldmlzaW9uSWRzWzBdLCBvcHRzLCBbXV07XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IHJldmlzaW9uSWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWRzID0gW3JldmlzaW9uSWRzW2ldLCB7c3RhdHVzOiAnbWlzc2luZyd9LCBbaWRzXV07XG4gIH1cblxuICByZXR1cm4gW3tcbiAgICBwb3M6IHBvcyxcbiAgICBpZHM6IGlkc1xuICB9XTtcbn1cblxuLy8gUHJlcHJvY2VzcyBkb2N1bWVudHMsIHBhcnNlIHRoZWlyIHJldmlzaW9ucywgYXNzaWduIGFuIGlkIGFuZCBhXG4vLyByZXZpc2lvbiBmb3IgbmV3IHdyaXRlcyB0aGF0IGFyZSBtaXNzaW5nIHRoZW0sIGV0Y1xuZnVuY3Rpb24gcGFyc2VEb2MoZG9jLCBuZXdFZGl0cykge1xuXG4gIHZhciBuUmV2TnVtO1xuICB2YXIgbmV3UmV2SWQ7XG4gIHZhciByZXZJbmZvO1xuICB2YXIgb3B0cyA9IHtzdGF0dXM6ICdhdmFpbGFibGUnfTtcbiAgaWYgKGRvYy5fZGVsZXRlZCkge1xuICAgIG9wdHMuZGVsZXRlZCA9IHRydWU7XG4gIH1cblxuICBpZiAobmV3RWRpdHMpIHtcbiAgICBpZiAoIWRvYy5faWQpIHtcbiAgICAgIGRvYy5faWQgPSB1dWlkKCk7XG4gICAgfVxuICAgIG5ld1JldklkID0gdXVpZCgzMiwgMTYpLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKGRvYy5fcmV2KSB7XG4gICAgICByZXZJbmZvID0gcGFyc2VSZXZpc2lvbkluZm8oZG9jLl9yZXYpO1xuICAgICAgaWYgKHJldkluZm8uZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHJldkluZm87XG4gICAgICB9XG4gICAgICBkb2MuX3Jldl90cmVlID0gW3tcbiAgICAgICAgcG9zOiByZXZJbmZvLnByZWZpeCxcbiAgICAgICAgaWRzOiBbcmV2SW5mby5pZCwge3N0YXR1czogJ21pc3NpbmcnfSwgW1tuZXdSZXZJZCwgb3B0cywgW11dXV1cbiAgICAgIH1dO1xuICAgICAgblJldk51bSA9IHJldkluZm8ucHJlZml4ICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jLl9yZXZfdHJlZSA9IFt7XG4gICAgICAgIHBvczogMSxcbiAgICAgICAgaWRzIDogW25ld1JldklkLCBvcHRzLCBbXV1cbiAgICAgIH1dO1xuICAgICAgblJldk51bSA9IDE7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkb2MuX3JldmlzaW9ucykge1xuICAgICAgZG9jLl9yZXZfdHJlZSA9IG1ha2VSZXZUcmVlRnJvbVJldmlzaW9ucyhkb2MuX3JldmlzaW9ucywgb3B0cyk7XG4gICAgICBuUmV2TnVtID0gZG9jLl9yZXZpc2lvbnMuc3RhcnQ7XG4gICAgICBuZXdSZXZJZCA9IGRvYy5fcmV2aXNpb25zLmlkc1swXTtcbiAgICB9XG4gICAgaWYgKCFkb2MuX3Jldl90cmVlKSB7XG4gICAgICByZXZJbmZvID0gcGFyc2VSZXZpc2lvbkluZm8oZG9jLl9yZXYpO1xuICAgICAgaWYgKHJldkluZm8uZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIHJldkluZm87XG4gICAgICB9XG4gICAgICBuUmV2TnVtID0gcmV2SW5mby5wcmVmaXg7XG4gICAgICBuZXdSZXZJZCA9IHJldkluZm8uaWQ7XG4gICAgICBkb2MuX3Jldl90cmVlID0gW3tcbiAgICAgICAgcG9zOiBuUmV2TnVtLFxuICAgICAgICBpZHM6IFtuZXdSZXZJZCwgb3B0cywgW11dXG4gICAgICB9XTtcbiAgICB9XG4gIH1cblxuICBpbnZhbGlkSWRFcnJvcihkb2MuX2lkKTtcblxuICBkb2MuX3JldiA9IG5SZXZOdW0gKyAnLScgKyBuZXdSZXZJZDtcblxuICB2YXIgcmVzdWx0ID0ge21ldGFkYXRhIDoge30sIGRhdGEgOiB7fX07XG4gIGZvciAodmFyIGtleSBpbiBkb2MpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZG9jLCBrZXkpKSB7XG4gICAgICB2YXIgc3BlY2lhbEtleSA9IGtleVswXSA9PT0gJ18nO1xuICAgICAgaWYgKHNwZWNpYWxLZXkgJiYgIXJlc2VydmVkV29yZHNba2V5XSkge1xuICAgICAgICB2YXIgZXJyb3IgPSBjcmVhdGVFcnJvcihET0NfVkFMSURBVElPTiwga2V5KTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IERPQ19WQUxJREFUSU9OLm1lc3NhZ2UgKyAnOiAnICsga2V5O1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0gZWxzZSBpZiAoc3BlY2lhbEtleSAmJiAhZGF0YVdvcmRzW2tleV0pIHtcbiAgICAgICAgcmVzdWx0Lm1ldGFkYXRhW2tleS5zbGljZSgxKV0gPSBkb2Nba2V5XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5kYXRhW2tleV0gPSBkb2Nba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxudmFyIGF0b2IkMSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgcmV0dXJuIGF0b2Ioc3RyKTtcbn07XG5cbnZhciBidG9hJDEgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIHJldHVybiBidG9hKHN0cik7XG59O1xuXG4vLyBBYnN0cmFjdHMgY29uc3RydWN0aW5nIGEgQmxvYiBvYmplY3QsIHNvIGl0IGFsc28gd29ya3MgaW4gb2xkZXJcbi8vIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0aGUgbmF0aXZlIEJsb2IgY29uc3RydWN0b3IgKGUuZy5cbi8vIG9sZCBRdFdlYktpdCB2ZXJzaW9ucywgQW5kcm9pZCA8IDQuNCkuXG5mdW5jdGlvbiBjcmVhdGVCbG9iKHBhcnRzLCBwcm9wZXJ0aWVzKSB7XG4gIC8qIGdsb2JhbCBCbG9iQnVpbGRlcixNU0Jsb2JCdWlsZGVyLE1vekJsb2JCdWlsZGVyLFdlYktpdEJsb2JCdWlsZGVyICovXG4gIHBhcnRzID0gcGFydHMgfHwgW107XG4gIHByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzIHx8IHt9O1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgQmxvYihwYXJ0cywgcHJvcGVydGllcyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZS5uYW1lICE9PSBcIlR5cGVFcnJvclwiKSB7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICB2YXIgQnVpbGRlciA9IHR5cGVvZiBCbG9iQnVpbGRlciAhPT0gJ3VuZGVmaW5lZCcgPyBCbG9iQnVpbGRlciA6XG4gICAgICAgICAgICAgICAgICB0eXBlb2YgTVNCbG9iQnVpbGRlciAhPT0gJ3VuZGVmaW5lZCcgPyBNU0Jsb2JCdWlsZGVyIDpcbiAgICAgICAgICAgICAgICAgIHR5cGVvZiBNb3pCbG9iQnVpbGRlciAhPT0gJ3VuZGVmaW5lZCcgPyBNb3pCbG9iQnVpbGRlciA6XG4gICAgICAgICAgICAgICAgICBXZWJLaXRCbG9iQnVpbGRlcjtcbiAgICB2YXIgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgYnVpbGRlci5hcHBlbmQocGFydHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbGRlci5nZXRCbG9iKHByb3BlcnRpZXMudHlwZSk7XG4gIH1cbn1cblxuLy8gRnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0OTY3NjQ3LyAoY29udGludWVzIG9uIG5leHQgbGluZSlcbi8vIGVuY29kZS1kZWNvZGUtaW1hZ2Utd2l0aC1iYXNlNjQtYnJlYWtzLWltYWdlICgyMDEzLTA0LTIxKVxuZnVuY3Rpb24gYmluYXJ5U3RyaW5nVG9BcnJheUJ1ZmZlcihiaW4pIHtcbiAgdmFyIGxlbmd0aCA9IGJpbi5sZW5ndGg7XG4gIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIobGVuZ3RoKTtcbiAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBhcnJbaV0gPSBiaW4uY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gYnVmO1xufVxuXG5mdW5jdGlvbiBiaW5TdHJpbmdUb0JsdWZmZXIoYmluU3RyaW5nLCB0eXBlKSB7XG4gIHJldHVybiBjcmVhdGVCbG9iKFtiaW5hcnlTdHJpbmdUb0FycmF5QnVmZmVyKGJpblN0cmluZyldLCB7dHlwZTogdHlwZX0pO1xufVxuXG5mdW5jdGlvbiBiNjRUb0JsdWZmZXIoYjY0LCB0eXBlKSB7XG4gIHJldHVybiBiaW5TdHJpbmdUb0JsdWZmZXIoYXRvYiQxKGI2NCksIHR5cGUpO1xufVxuXG4vL0Nhbid0IGZpbmQgb3JpZ2luYWwgcG9zdCwgYnV0IHRoaXMgaXMgY2xvc2Vcbi8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy82OTY1MTA3LyAoY29udGludWVzIG9uIG5leHQgbGluZSlcbi8vY29udmVydGluZy1iZXR3ZWVuLXN0cmluZ3MtYW5kLWFycmF5YnVmZmVyc1xuZnVuY3Rpb24gYXJyYXlCdWZmZXJUb0JpbmFyeVN0cmluZyhidWZmZXIpIHtcbiAgdmFyIGJpbmFyeSA9ICcnO1xuICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICB2YXIgbGVuZ3RoID0gYnl0ZXMuYnl0ZUxlbmd0aDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGJpbmFyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKTtcbiAgfVxuICByZXR1cm4gYmluYXJ5O1xufVxuXG4vLyBzaGltIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgaXRcbmZ1bmN0aW9uIHJlYWRBc0JpbmFyeVN0cmluZyhibG9iLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIEZpbGVSZWFkZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gZml4IGZvciBGaXJlZm94IGluIGEgd2ViIHdvcmtlclxuICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkwMTA5N1xuICAgIHJldHVybiBjYWxsYmFjayhhcnJheUJ1ZmZlclRvQmluYXJ5U3RyaW5nKFxuICAgICAgbmV3IEZpbGVSZWFkZXJTeW5jKCkucmVhZEFzQXJyYXlCdWZmZXIoYmxvYikpKTtcbiAgfVxuXG4gIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICB2YXIgaGFzQmluYXJ5U3RyaW5nID0gdHlwZW9mIHJlYWRlci5yZWFkQXNCaW5hcnlTdHJpbmcgPT09ICdmdW5jdGlvbic7XG4gIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciByZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQgfHwgJyc7XG4gICAgaWYgKGhhc0JpbmFyeVN0cmluZykge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGNhbGxiYWNrKGFycmF5QnVmZmVyVG9CaW5hcnlTdHJpbmcocmVzdWx0KSk7XG4gIH07XG4gIGlmIChoYXNCaW5hcnlTdHJpbmcpIHtcbiAgICByZWFkZXIucmVhZEFzQmluYXJ5U3RyaW5nKGJsb2IpO1xuICB9IGVsc2Uge1xuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBibG9iVG9CaW5hcnlTdHJpbmcoYmxvYk9yQnVmZmVyLCBjYWxsYmFjaykge1xuICByZWFkQXNCaW5hcnlTdHJpbmcoYmxvYk9yQnVmZmVyLCBmdW5jdGlvbiAoYmluKSB7XG4gICAgY2FsbGJhY2soYmluKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iT3JCdWZmZXIsIGNhbGxiYWNrKSB7XG4gIGJsb2JUb0JpbmFyeVN0cmluZyhibG9iT3JCdWZmZXIsIGZ1bmN0aW9uIChiYXNlNjQpIHtcbiAgICBjYWxsYmFjayhidG9hJDEoYmFzZTY0KSk7XG4gIH0pO1xufVxuXG4vLyBzaW1wbGlmaWVkIEFQSS4gdW5pdmVyc2FsIGJyb3dzZXIgc3VwcG9ydCBpcyBhc3N1bWVkXG5mdW5jdGlvbiByZWFkQXNBcnJheUJ1ZmZlcihibG9iLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIEZpbGVSZWFkZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gZml4IGZvciBGaXJlZm94IGluIGEgd2ViIHdvcmtlcjpcbiAgICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05MDEwOTdcbiAgICByZXR1cm4gY2FsbGJhY2sobmV3IEZpbGVSZWFkZXJTeW5jKCkucmVhZEFzQXJyYXlCdWZmZXIoYmxvYikpO1xuICB9XG5cbiAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gIHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciByZXN1bHQgPSBlLnRhcmdldC5yZXN1bHQgfHwgbmV3IEFycmF5QnVmZmVyKDApO1xuICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gIH07XG4gIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbn1cblxudmFyIHNldEltbWVkaWF0ZVNoaW0gPSBnbG9iYWwuc2V0SW1tZWRpYXRlIHx8IGdsb2JhbC5zZXRUaW1lb3V0O1xudmFyIE1ENV9DSFVOS19TSVpFID0gMzI3Njg7XG5cbmZ1bmN0aW9uIHJhd1RvQmFzZTY0KHJhdykge1xuICByZXR1cm4gYnRvYSQxKHJhdyk7XG59XG5cbmZ1bmN0aW9uIHNsaWNlQmxvYihibG9iLCBzdGFydCwgZW5kKSB7XG4gIGlmIChibG9iLndlYmtpdFNsaWNlKSB7XG4gICAgcmV0dXJuIGJsb2Iud2Via2l0U2xpY2Uoc3RhcnQsIGVuZCk7XG4gIH1cbiAgcmV0dXJuIGJsb2Iuc2xpY2Uoc3RhcnQsIGVuZCk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZEJsb2IoYnVmZmVyLCBibG9iLCBzdGFydCwgZW5kLCBjYWxsYmFjaykge1xuICBpZiAoc3RhcnQgPiAwIHx8IGVuZCA8IGJsb2Iuc2l6ZSkge1xuICAgIC8vIG9ubHkgc2xpY2UgYmxvYiBpZiB3ZSByZWFsbHkgbmVlZCB0b1xuICAgIGJsb2IgPSBzbGljZUJsb2IoYmxvYiwgc3RhcnQsIGVuZCk7XG4gIH1cbiAgcmVhZEFzQXJyYXlCdWZmZXIoYmxvYiwgZnVuY3Rpb24gKGFycmF5QnVmZmVyKSB7XG4gICAgYnVmZmVyLmFwcGVuZChhcnJheUJ1ZmZlcik7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFN0cmluZyhidWZmZXIsIHN0cmluZywgc3RhcnQsIGVuZCwgY2FsbGJhY2spIHtcbiAgaWYgKHN0YXJ0ID4gMCB8fCBlbmQgPCBzdHJpbmcubGVuZ3RoKSB7XG4gICAgLy8gb25seSBjcmVhdGUgYSBzdWJzdHJpbmcgaWYgd2UgcmVhbGx5IG5lZWQgdG9cbiAgICBzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICB9XG4gIGJ1ZmZlci5hcHBlbmRCaW5hcnkoc3RyaW5nKTtcbiAgY2FsbGJhY2soKTtcbn1cblxuZnVuY3Rpb24gYmluYXJ5TWQ1KGRhdGEsIGNhbGxiYWNrKSB7XG4gIHZhciBpbnB1dElzU3RyaW5nID0gdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnO1xuICB2YXIgbGVuID0gaW5wdXRJc1N0cmluZyA/IGRhdGEubGVuZ3RoIDogZGF0YS5zaXplO1xuICB2YXIgY2h1bmtTaXplID0gTWF0aC5taW4oTUQ1X0NIVU5LX1NJWkUsIGxlbik7XG4gIHZhciBjaHVua3MgPSBNYXRoLmNlaWwobGVuIC8gY2h1bmtTaXplKTtcbiAgdmFyIGN1cnJlbnRDaHVuayA9IDA7XG4gIHZhciBidWZmZXIgPSBpbnB1dElzU3RyaW5nID8gbmV3IE1kNSgpIDogbmV3IE1kNS5BcnJheUJ1ZmZlcigpO1xuXG4gIHZhciBhcHBlbmQgPSBpbnB1dElzU3RyaW5nID8gYXBwZW5kU3RyaW5nIDogYXBwZW5kQmxvYjtcblxuICBmdW5jdGlvbiBuZXh0KCkge1xuICAgIHNldEltbWVkaWF0ZVNoaW0obG9hZE5leHRDaHVuayk7XG4gIH1cblxuICBmdW5jdGlvbiBkb25lKCkge1xuICAgIHZhciByYXcgPSBidWZmZXIuZW5kKHRydWUpO1xuICAgIHZhciBiYXNlNjQgPSByYXdUb0Jhc2U2NChyYXcpO1xuICAgIGNhbGxiYWNrKGJhc2U2NCk7XG4gICAgYnVmZmVyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWROZXh0Q2h1bmsoKSB7XG4gICAgdmFyIHN0YXJ0ID0gY3VycmVudENodW5rICogY2h1bmtTaXplO1xuICAgIHZhciBlbmQgPSBzdGFydCArIGNodW5rU2l6ZTtcbiAgICBjdXJyZW50Q2h1bmsrKztcbiAgICBpZiAoY3VycmVudENodW5rIDwgY2h1bmtzKSB7XG4gICAgICBhcHBlbmQoYnVmZmVyLCBkYXRhLCBzdGFydCwgZW5kLCBuZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwZW5kKGJ1ZmZlciwgZGF0YSwgc3RhcnQsIGVuZCwgZG9uZSk7XG4gICAgfVxuICB9XG4gIGxvYWROZXh0Q2h1bmsoKTtcbn1cblxuZnVuY3Rpb24gc3RyaW5nTWQ1KHN0cmluZykge1xuICByZXR1cm4gTWQ1Lmhhc2goc3RyaW5nKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VCYXNlNjQoZGF0YSkge1xuICB0cnkge1xuICAgIHJldHVybiBhdG9iJDEoZGF0YSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB2YXIgZXJyID0gY3JlYXRlRXJyb3IoQkFEX0FSRyxcbiAgICAgICdBdHRhY2htZW50IGlzIG5vdCBhIHZhbGlkIGJhc2U2NCBzdHJpbmcnKTtcbiAgICByZXR1cm4ge2Vycm9yOiBlcnJ9O1xuICB9XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NTdHJpbmcoYXR0LCBibG9iVHlwZSwgY2FsbGJhY2spIHtcbiAgdmFyIGFzQmluYXJ5ID0gcGFyc2VCYXNlNjQoYXR0LmRhdGEpO1xuICBpZiAoYXNCaW5hcnkuZXJyb3IpIHtcbiAgICByZXR1cm4gY2FsbGJhY2soYXNCaW5hcnkuZXJyb3IpO1xuICB9XG5cbiAgYXR0Lmxlbmd0aCA9IGFzQmluYXJ5Lmxlbmd0aDtcbiAgaWYgKGJsb2JUeXBlID09PSAnYmxvYicpIHtcbiAgICBhdHQuZGF0YSA9IGJpblN0cmluZ1RvQmx1ZmZlcihhc0JpbmFyeSwgYXR0LmNvbnRlbnRfdHlwZSk7XG4gIH0gZWxzZSBpZiAoYmxvYlR5cGUgPT09ICdiYXNlNjQnKSB7XG4gICAgYXR0LmRhdGEgPSBidG9hJDEoYXNCaW5hcnkpO1xuICB9IGVsc2UgeyAvLyBiaW5hcnlcbiAgICBhdHQuZGF0YSA9IGFzQmluYXJ5O1xuICB9XG4gIGJpbmFyeU1kNShhc0JpbmFyeSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGF0dC5kaWdlc3QgPSAnbWQ1LScgKyByZXN1bHQ7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NCbG9iKGF0dCwgYmxvYlR5cGUsIGNhbGxiYWNrKSB7XG4gIGJpbmFyeU1kNShhdHQuZGF0YSwgZnVuY3Rpb24gKG1kNSkge1xuICAgIGF0dC5kaWdlc3QgPSAnbWQ1LScgKyBtZDU7XG4gICAgLy8gc2l6ZSBpcyBmb3IgYmxvYnMgKGJyb3dzZXIpLCBsZW5ndGggaXMgZm9yIGJ1ZmZlcnMgKG5vZGUpXG4gICAgYXR0Lmxlbmd0aCA9IGF0dC5kYXRhLnNpemUgfHwgYXR0LmRhdGEubGVuZ3RoIHx8IDA7XG4gICAgaWYgKGJsb2JUeXBlID09PSAnYmluYXJ5Jykge1xuICAgICAgYmxvYlRvQmluYXJ5U3RyaW5nKGF0dC5kYXRhLCBmdW5jdGlvbiAoYmluU3RyaW5nKSB7XG4gICAgICAgIGF0dC5kYXRhID0gYmluU3RyaW5nO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChibG9iVHlwZSA9PT0gJ2Jhc2U2NCcpIHtcbiAgICAgIGJsb2JUb0Jhc2U2NChhdHQuZGF0YSwgZnVuY3Rpb24gKGI2NCkge1xuICAgICAgICBhdHQuZGF0YSA9IGI2NDtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NBdHRhY2htZW50KGF0dCwgYmxvYlR5cGUsIGNhbGxiYWNrKSB7XG4gIGlmIChhdHQuc3R1Yikge1xuICAgIHJldHVybiBjYWxsYmFjaygpO1xuICB9XG4gIGlmICh0eXBlb2YgYXR0LmRhdGEgPT09ICdzdHJpbmcnKSB7IC8vIGlucHV0IGlzIGEgYmFzZTY0IHN0cmluZ1xuICAgIHByZXByb2Nlc3NTdHJpbmcoYXR0LCBibG9iVHlwZSwgY2FsbGJhY2spO1xuICB9IGVsc2UgeyAvLyBpbnB1dCBpcyBhIGJsb2JcbiAgICBwcmVwcm9jZXNzQmxvYihhdHQsIGJsb2JUeXBlLCBjYWxsYmFjayk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJlcHJvY2Vzc0F0dGFjaG1lbnRzKGRvY0luZm9zLCBibG9iVHlwZSwgY2FsbGJhY2spIHtcblxuICBpZiAoIWRvY0luZm9zLmxlbmd0aCkge1xuICAgIHJldHVybiBjYWxsYmFjaygpO1xuICB9XG5cbiAgdmFyIGRvY3YgPSAwO1xuICB2YXIgb3ZlcmFsbEVycjtcblxuICBkb2NJbmZvcy5mb3JFYWNoKGZ1bmN0aW9uIChkb2NJbmZvKSB7XG4gICAgdmFyIGF0dGFjaG1lbnRzID0gZG9jSW5mby5kYXRhICYmIGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHMgP1xuICAgICAgT2JqZWN0LmtleXMoZG9jSW5mby5kYXRhLl9hdHRhY2htZW50cykgOiBbXTtcbiAgICB2YXIgcmVjdiA9IDA7XG5cbiAgICBpZiAoIWF0dGFjaG1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzZWRBdHRhY2htZW50KGVycikge1xuICAgICAgb3ZlcmFsbEVyciA9IGVycjtcbiAgICAgIHJlY3YrKztcbiAgICAgIGlmIChyZWN2ID09PSBhdHRhY2htZW50cy5sZW5ndGgpIHtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGtleSBpbiBkb2NJbmZvLmRhdGEuX2F0dGFjaG1lbnRzKSB7XG4gICAgICBpZiAoZG9jSW5mby5kYXRhLl9hdHRhY2htZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHByZXByb2Nlc3NBdHRhY2htZW50KGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHNba2V5XSxcbiAgICAgICAgICBibG9iVHlwZSwgcHJvY2Vzc2VkQXR0YWNobWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBkb25lKCkge1xuICAgIGRvY3YrKztcbiAgICBpZiAoZG9jSW5mb3MubGVuZ3RoID09PSBkb2N2KSB7XG4gICAgICBpZiAob3ZlcmFsbEVycikge1xuICAgICAgICBjYWxsYmFjayhvdmVyYWxsRXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZURvYyhyZXZMaW1pdCwgcHJldiwgZG9jSW5mbywgcmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICBpLCBjYiwgd3JpdGVEb2MsIG5ld0VkaXRzKSB7XG5cbiAgaWYgKHJldkV4aXN0cyhwcmV2LnJldl90cmVlLCBkb2NJbmZvLm1ldGFkYXRhLnJldikpIHtcbiAgICByZXN1bHRzW2ldID0gZG9jSW5mbztcbiAgICByZXR1cm4gY2IoKTtcbiAgfVxuXG4gIC8vIHNvbWV0aW1lcyB0aGlzIGlzIHByZS1jYWxjdWxhdGVkLiBoaXN0b3JpY2FsbHkgbm90IGFsd2F5c1xuICB2YXIgcHJldmlvdXNXaW5uaW5nUmV2ID0gcHJldi53aW5uaW5nUmV2IHx8IHdpbm5pbmdSZXYocHJldik7XG4gIHZhciBwcmV2aW91c2x5RGVsZXRlZCA9ICdkZWxldGVkJyBpbiBwcmV2ID8gcHJldi5kZWxldGVkIDpcbiAgICBpc0RlbGV0ZWQocHJldiwgcHJldmlvdXNXaW5uaW5nUmV2KTtcbiAgdmFyIGRlbGV0ZWQgPSAnZGVsZXRlZCcgaW4gZG9jSW5mby5tZXRhZGF0YSA/IGRvY0luZm8ubWV0YWRhdGEuZGVsZXRlZCA6XG4gICAgaXNEZWxldGVkKGRvY0luZm8ubWV0YWRhdGEpO1xuICB2YXIgaXNSb290ID0gL14xLS8udGVzdChkb2NJbmZvLm1ldGFkYXRhLnJldik7XG5cbiAgaWYgKHByZXZpb3VzbHlEZWxldGVkICYmICFkZWxldGVkICYmIG5ld0VkaXRzICYmIGlzUm9vdCkge1xuICAgIHZhciBuZXdEb2MgPSBkb2NJbmZvLmRhdGE7XG4gICAgbmV3RG9jLl9yZXYgPSBwcmV2aW91c1dpbm5pbmdSZXY7XG4gICAgbmV3RG9jLl9pZCA9IGRvY0luZm8ubWV0YWRhdGEuaWQ7XG4gICAgZG9jSW5mbyA9IHBhcnNlRG9jKG5ld0RvYywgbmV3RWRpdHMpO1xuICB9XG5cbiAgdmFyIG1lcmdlZCA9IG1lcmdlKHByZXYucmV2X3RyZWUsIGRvY0luZm8ubWV0YWRhdGEucmV2X3RyZWVbMF0sIHJldkxpbWl0KTtcblxuICB2YXIgaW5Db25mbGljdCA9IG5ld0VkaXRzICYmICgoKHByZXZpb3VzbHlEZWxldGVkICYmIGRlbGV0ZWQpIHx8XG4gICAgKCFwcmV2aW91c2x5RGVsZXRlZCAmJiBtZXJnZWQuY29uZmxpY3RzICE9PSAnbmV3X2xlYWYnKSB8fFxuICAgIChwcmV2aW91c2x5RGVsZXRlZCAmJiAhZGVsZXRlZCAmJiBtZXJnZWQuY29uZmxpY3RzID09PSAnbmV3X2JyYW5jaCcpKSk7XG5cbiAgaWYgKGluQ29uZmxpY3QpIHtcbiAgICB2YXIgZXJyID0gY3JlYXRlRXJyb3IoUkVWX0NPTkZMSUNUKTtcbiAgICByZXN1bHRzW2ldID0gZXJyO1xuICAgIHJldHVybiBjYigpO1xuICB9XG5cbiAgdmFyIG5ld1JldiA9IGRvY0luZm8ubWV0YWRhdGEucmV2O1xuICBkb2NJbmZvLm1ldGFkYXRhLnJldl90cmVlID0gbWVyZ2VkLnRyZWU7XG4gIGRvY0luZm8uc3RlbW1lZFJldnMgPSBtZXJnZWQuc3RlbW1lZFJldnMgfHwgW107XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gIGlmIChwcmV2LnJldl9tYXApIHtcbiAgICBkb2NJbmZvLm1ldGFkYXRhLnJldl9tYXAgPSBwcmV2LnJldl9tYXA7IC8vIHVzZWQgb25seSBieSBsZXZlbGRiXG4gIH1cblxuICAvLyByZWNhbGN1bGF0ZVxuICB2YXIgd2lubmluZ1JldiQkID0gd2lubmluZ1Jldihkb2NJbmZvLm1ldGFkYXRhKTtcbiAgdmFyIHdpbm5pbmdSZXZJc0RlbGV0ZWQgPSBpc0RlbGV0ZWQoZG9jSW5mby5tZXRhZGF0YSwgd2lubmluZ1JldiQkKTtcblxuICAvLyBjYWxjdWxhdGUgdGhlIHRvdGFsIG51bWJlciBvZiBkb2N1bWVudHMgdGhhdCB3ZXJlIGFkZGVkL3JlbW92ZWQsXG4gIC8vIGZyb20gdGhlIHBlcnNwZWN0aXZlIG9mIHRvdGFsX3Jvd3MvZG9jX2NvdW50XG4gIHZhciBkZWx0YSA9IChwcmV2aW91c2x5RGVsZXRlZCA9PT0gd2lubmluZ1JldklzRGVsZXRlZCkgPyAwIDpcbiAgICBwcmV2aW91c2x5RGVsZXRlZCA8IHdpbm5pbmdSZXZJc0RlbGV0ZWQgPyAtMSA6IDE7XG5cbiAgdmFyIG5ld1JldklzRGVsZXRlZDtcbiAgaWYgKG5ld1JldiA9PT0gd2lubmluZ1JldiQkKSB7XG4gICAgLy8gaWYgdGhlIG5ldyByZXYgaXMgdGhlIHNhbWUgYXMgdGhlIHdpbm5pbmcgcmV2LCB3ZSBjYW4gcmV1c2UgdGhhdCB2YWx1ZVxuICAgIG5ld1JldklzRGVsZXRlZCA9IHdpbm5pbmdSZXZJc0RlbGV0ZWQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gaWYgdGhleSdyZSBub3QgdGhlIHNhbWUsIHRoZW4gd2UgbmVlZCB0byByZWNhbGN1bGF0ZVxuICAgIG5ld1JldklzRGVsZXRlZCA9IGlzRGVsZXRlZChkb2NJbmZvLm1ldGFkYXRhLCBuZXdSZXYpO1xuICB9XG5cbiAgd3JpdGVEb2MoZG9jSW5mbywgd2lubmluZ1JldiQkLCB3aW5uaW5nUmV2SXNEZWxldGVkLCBuZXdSZXZJc0RlbGV0ZWQsXG4gICAgdHJ1ZSwgZGVsdGEsIGksIGNiKTtcbn1cblxuZnVuY3Rpb24gcm9vdElzTWlzc2luZyhkb2NJbmZvKSB7XG4gIHJldHVybiBkb2NJbmZvLm1ldGFkYXRhLnJldl90cmVlWzBdLmlkc1sxXS5zdGF0dXMgPT09ICdtaXNzaW5nJztcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0RvY3MocmV2TGltaXQsIGRvY0luZm9zLCBhcGksIGZldGNoZWREb2NzLCB0eCwgcmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgIHdyaXRlRG9jLCBvcHRzLCBvdmVyYWxsQ2FsbGJhY2spIHtcblxuICAvLyBEZWZhdWx0IHRvIDEwMDAgbG9jYWxseVxuICByZXZMaW1pdCA9IHJldkxpbWl0IHx8IDEwMDA7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0RG9jKGRvY0luZm8sIHJlc3VsdHNJZHgsIGNhbGxiYWNrKSB7XG4gICAgLy8gQ2FudCBpbnNlcnQgbmV3IGRlbGV0ZWQgZG9jdW1lbnRzXG4gICAgdmFyIHdpbm5pbmdSZXYkJCA9IHdpbm5pbmdSZXYoZG9jSW5mby5tZXRhZGF0YSk7XG4gICAgdmFyIGRlbGV0ZWQgPSBpc0RlbGV0ZWQoZG9jSW5mby5tZXRhZGF0YSwgd2lubmluZ1JldiQkKTtcbiAgICBpZiAoJ3dhc19kZWxldGUnIGluIG9wdHMgJiYgZGVsZXRlZCkge1xuICAgICAgcmVzdWx0c1tyZXN1bHRzSWR4XSA9IGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DLCAnZGVsZXRlZCcpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgLy8gNDcxMiAtIGRldGVjdCB3aGV0aGVyIGEgbmV3IGRvY3VtZW50IHdhcyBpbnNlcnRlZCB3aXRoIGEgX3JldlxuICAgIHZhciBpbkNvbmZsaWN0ID0gbmV3RWRpdHMgJiYgcm9vdElzTWlzc2luZyhkb2NJbmZvKTtcblxuICAgIGlmIChpbkNvbmZsaWN0KSB7XG4gICAgICB2YXIgZXJyID0gY3JlYXRlRXJyb3IoUkVWX0NPTkZMSUNUKTtcbiAgICAgIHJlc3VsdHNbcmVzdWx0c0lkeF0gPSBlcnI7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG5cbiAgICB2YXIgZGVsdGEgPSBkZWxldGVkID8gMCA6IDE7XG5cbiAgICB3cml0ZURvYyhkb2NJbmZvLCB3aW5uaW5nUmV2JCQsIGRlbGV0ZWQsIGRlbGV0ZWQsIGZhbHNlLFxuICAgICAgZGVsdGEsIHJlc3VsdHNJZHgsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHZhciBuZXdFZGl0cyA9IG9wdHMubmV3X2VkaXRzO1xuICB2YXIgaWRzVG9Eb2NzID0gbmV3IF9NYXAoKTtcblxuICB2YXIgZG9jc0RvbmUgPSAwO1xuICB2YXIgZG9jc1RvRG8gPSBkb2NJbmZvcy5sZW5ndGg7XG5cbiAgZnVuY3Rpb24gY2hlY2tBbGxEb2NzRG9uZSgpIHtcbiAgICBpZiAoKytkb2NzRG9uZSA9PT0gZG9jc1RvRG8gJiYgb3ZlcmFsbENhbGxiYWNrKSB7XG4gICAgICBvdmVyYWxsQ2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBkb2NJbmZvcy5mb3JFYWNoKGZ1bmN0aW9uIChjdXJyZW50RG9jLCByZXN1bHRzSWR4KSB7XG5cbiAgICBpZiAoY3VycmVudERvYy5faWQgJiYgaXNMb2NhbElkKGN1cnJlbnREb2MuX2lkKSkge1xuICAgICAgdmFyIGZ1biA9IGN1cnJlbnREb2MuX2RlbGV0ZWQgPyAnX3JlbW92ZUxvY2FsJyA6ICdfcHV0TG9jYWwnO1xuICAgICAgYXBpW2Z1bl0oY3VycmVudERvYywge2N0eDogdHh9LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgcmVzdWx0c1tyZXN1bHRzSWR4XSA9IGVyciB8fCByZXM7XG4gICAgICAgIGNoZWNrQWxsRG9jc0RvbmUoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpZCA9IGN1cnJlbnREb2MubWV0YWRhdGEuaWQ7XG4gICAgaWYgKGlkc1RvRG9jcy5oYXMoaWQpKSB7XG4gICAgICBkb2NzVG9Eby0tOyAvLyBkdXBsaWNhdGVcbiAgICAgIGlkc1RvRG9jcy5nZXQoaWQpLnB1c2goW2N1cnJlbnREb2MsIHJlc3VsdHNJZHhdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWRzVG9Eb2NzLnNldChpZCwgW1tjdXJyZW50RG9jLCByZXN1bHRzSWR4XV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gaW4gdGhlIGNhc2Ugb2YgbmV3X2VkaXRzLCB0aGUgdXNlciBjYW4gcHJvdmlkZSBtdWx0aXBsZSBkb2NzXG4gIC8vIHdpdGggdGhlIHNhbWUgaWQuIHRoZXNlIG5lZWQgdG8gYmUgcHJvY2Vzc2VkIHNlcXVlbnRpYWxseVxuICBpZHNUb0RvY3MuZm9yRWFjaChmdW5jdGlvbiAoZG9jcywgaWQpIHtcbiAgICB2YXIgbnVtRG9uZSA9IDA7XG5cbiAgICBmdW5jdGlvbiBkb2NXcml0dGVuKCkge1xuICAgICAgaWYgKCsrbnVtRG9uZSA8IGRvY3MubGVuZ3RoKSB7XG4gICAgICAgIG5leHREb2MoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoZWNrQWxsRG9jc0RvbmUoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dERvYygpIHtcbiAgICAgIHZhciB2YWx1ZSA9IGRvY3NbbnVtRG9uZV07XG4gICAgICB2YXIgY3VycmVudERvYyA9IHZhbHVlWzBdO1xuICAgICAgdmFyIHJlc3VsdHNJZHggPSB2YWx1ZVsxXTtcblxuICAgICAgaWYgKGZldGNoZWREb2NzLmhhcyhpZCkpIHtcbiAgICAgICAgdXBkYXRlRG9jKHJldkxpbWl0LCBmZXRjaGVkRG9jcy5nZXQoaWQpLCBjdXJyZW50RG9jLCByZXN1bHRzLFxuICAgICAgICAgIHJlc3VsdHNJZHgsIGRvY1dyaXR0ZW4sIHdyaXRlRG9jLCBuZXdFZGl0cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBFbnN1cmUgc3RlbW1pbmcgYXBwbGllcyB0byBuZXcgd3JpdGVzIGFzIHdlbGxcbiAgICAgICAgdmFyIG1lcmdlZCA9IG1lcmdlKFtdLCBjdXJyZW50RG9jLm1ldGFkYXRhLnJldl90cmVlWzBdLCByZXZMaW1pdCk7XG4gICAgICAgIGN1cnJlbnREb2MubWV0YWRhdGEucmV2X3RyZWUgPSBtZXJnZWQudHJlZTtcbiAgICAgICAgY3VycmVudERvYy5zdGVtbWVkUmV2cyA9IG1lcmdlZC5zdGVtbWVkUmV2cyB8fCBbXTtcbiAgICAgICAgaW5zZXJ0RG9jKGN1cnJlbnREb2MsIHJlc3VsdHNJZHgsIGRvY1dyaXR0ZW4pO1xuICAgICAgfVxuICAgIH1cbiAgICBuZXh0RG9jKCk7XG4gIH0pO1xufVxuXG4vLyBJbmRleGVkREIgcmVxdWlyZXMgYSB2ZXJzaW9uZWQgZGF0YWJhc2Ugc3RydWN0dXJlLCBzbyB3ZSB1c2UgdGhlXG4vLyB2ZXJzaW9uIGhlcmUgdG8gbWFuYWdlIG1pZ3JhdGlvbnMuXG52YXIgQURBUFRFUl9WRVJTSU9OID0gNTtcblxuLy8gVGhlIG9iamVjdCBzdG9yZXMgY3JlYXRlZCBmb3IgZWFjaCBkYXRhYmFzZVxuLy8gRE9DX1NUT1JFIHN0b3JlcyB0aGUgZG9jdW1lbnQgbWV0YSBkYXRhLCBpdHMgcmV2aXNpb24gaGlzdG9yeSBhbmQgc3RhdGVcbi8vIEtleWVkIGJ5IGRvY3VtZW50IGlkXG52YXIgRE9DX1NUT1JFID0gJ2RvY3VtZW50LXN0b3JlJztcbi8vIEJZX1NFUV9TVE9SRSBzdG9yZXMgYSBwYXJ0aWN1bGFyIHZlcnNpb24gb2YgYSBkb2N1bWVudCwga2V5ZWQgYnkgaXRzXG4vLyBzZXF1ZW5jZSBpZFxudmFyIEJZX1NFUV9TVE9SRSA9ICdieS1zZXF1ZW5jZSc7XG4vLyBXaGVyZSB3ZSBzdG9yZSBhdHRhY2htZW50c1xudmFyIEFUVEFDSF9TVE9SRSA9ICdhdHRhY2gtc3RvcmUnO1xuLy8gV2hlcmUgd2Ugc3RvcmUgbWFueS10by1tYW55IHJlbGF0aW9uc1xuLy8gYmV0d2VlbiBhdHRhY2htZW50IGRpZ2VzdHMgYW5kIHNlcXNcbnZhciBBVFRBQ0hfQU5EX1NFUV9TVE9SRSA9ICdhdHRhY2gtc2VxLXN0b3JlJztcblxuLy8gV2hlcmUgd2Ugc3RvcmUgZGF0YWJhc2Utd2lkZSBtZXRhIGRhdGEgaW4gYSBzaW5nbGUgcmVjb3JkXG4vLyBrZXllZCBieSBpZDogTUVUQV9TVE9SRVxudmFyIE1FVEFfU1RPUkUgPSAnbWV0YS1zdG9yZSc7XG4vLyBXaGVyZSB3ZSBzdG9yZSBsb2NhbCBkb2N1bWVudHNcbnZhciBMT0NBTF9TVE9SRSA9ICdsb2NhbC1zdG9yZSc7XG4vLyBXaGVyZSB3ZSBkZXRlY3QgYmxvYiBzdXBwb3J0XG52YXIgREVURUNUX0JMT0JfU1VQUE9SVF9TVE9SRSA9ICdkZXRlY3QtYmxvYi1zdXBwb3J0JztcblxuZnVuY3Rpb24gc2FmZUpzb25QYXJzZShzdHIpIHtcbiAgLy8gVGhpcyB0cnkvY2F0Y2ggZ3VhcmRzIGFnYWluc3Qgc3RhY2sgb3ZlcmZsb3cgZXJyb3JzLlxuICAvLyBKU09OLnBhcnNlKCkgaXMgZmFzdGVyIHRoYW4gdnV2dXplbGEucGFyc2UoKSBidXQgdnV2dXplbGFcbiAgLy8gY2Fubm90IG92ZXJmbG93LlxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHN0cik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB2dXZ1emVsYS5wYXJzZShzdHIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVKc29uU3RyaW5naWZ5KGpzb24pIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoanNvbik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB2dXZ1emVsYS5zdHJpbmdpZnkoanNvbik7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5Q29kZShmdW4sIHRoYXQsIGFyZ3MsIFBvdWNoREIpIHtcbiAgdHJ5IHtcbiAgICBmdW4uYXBwbHkodGhhdCwgYXJncyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFNob3VsZG4ndCBoYXBwZW4sIGJ1dCBpbiBzb21lIG9kZCBjYXNlc1xuICAgIC8vIEluZGV4ZWREQiBpbXBsZW1lbnRhdGlvbnMgbWlnaHQgdGhyb3cgYSBzeW5jXG4gICAgLy8gZXJyb3IsIGluIHdoaWNoIGNhc2UgdGhpcyB3aWxsIGF0IGxlYXN0IGxvZyBpdC5cbiAgICBQb3VjaERCLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxufVxuXG52YXIgdGFza1F1ZXVlID0ge1xuICBydW5uaW5nOiBmYWxzZSxcbiAgcXVldWU6IFtdXG59O1xuXG5mdW5jdGlvbiBhcHBseU5leHQoUG91Y2hEQikge1xuICBpZiAodGFza1F1ZXVlLnJ1bm5pbmcgfHwgIXRhc2tRdWV1ZS5xdWV1ZS5sZW5ndGgpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGFza1F1ZXVlLnJ1bm5pbmcgPSB0cnVlO1xuICB2YXIgaXRlbSA9IHRhc2tRdWV1ZS5xdWV1ZS5zaGlmdCgpO1xuICBpdGVtLmFjdGlvbihmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICB0cnlDb2RlKGl0ZW0uY2FsbGJhY2ssIHRoaXMsIFtlcnIsIHJlc10sIFBvdWNoREIpO1xuICAgIHRhc2tRdWV1ZS5ydW5uaW5nID0gZmFsc2U7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBhcHBseU5leHQoUG91Y2hEQik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpZGJFcnJvcihjYWxsYmFjaykge1xuICByZXR1cm4gZnVuY3Rpb24gKGV2dCkge1xuICAgIHZhciBtZXNzYWdlID0gJ3Vua25vd25fZXJyb3InO1xuICAgIGlmIChldnQudGFyZ2V0ICYmIGV2dC50YXJnZXQuZXJyb3IpIHtcbiAgICAgIG1lc3NhZ2UgPSBldnQudGFyZ2V0LmVycm9yLm5hbWUgfHwgZXZ0LnRhcmdldC5lcnJvci5tZXNzYWdlO1xuICAgIH1cbiAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihJREJfRVJST1IsIG1lc3NhZ2UsIGV2dC50eXBlKSk7XG4gIH07XG59XG5cbi8vIFVuZm9ydHVuYXRlbHksIHRoZSBtZXRhZGF0YSBoYXMgdG8gYmUgc3RyaW5naWZpZWRcbi8vIHdoZW4gaXQgaXMgcHV0IGludG8gdGhlIGRhdGFiYXNlLCBiZWNhdXNlIG90aGVyd2lzZVxuLy8gSW5kZXhlZERCIGNhbiB0aHJvdyBlcnJvcnMgZm9yIGRlZXBseS1uZXN0ZWQgb2JqZWN0cy5cbi8vIE9yaWdpbmFsbHkgd2UganVzdCB1c2VkIEpTT04ucGFyc2UvSlNPTi5zdHJpbmdpZnk7IG5vd1xuLy8gd2UgdXNlIHRoaXMgY3VzdG9tIHZ1dnV6ZWxhIGxpYnJhcnkgdGhhdCBhdm9pZHMgcmVjdXJzaW9uLlxuLy8gSWYgd2UgY291bGQgZG8gaXQgYWxsIG92ZXIgYWdhaW4sIHdlJ2QgcHJvYmFibHkgdXNlIGFcbi8vIGZvcm1hdCBmb3IgdGhlIHJldmlzaW9uIHRyZWVzIG90aGVyIHRoYW4gSlNPTi5cbmZ1bmN0aW9uIGVuY29kZU1ldGFkYXRhKG1ldGFkYXRhLCB3aW5uaW5nUmV2LCBkZWxldGVkKSB7XG4gIHJldHVybiB7XG4gICAgZGF0YTogc2FmZUpzb25TdHJpbmdpZnkobWV0YWRhdGEpLFxuICAgIHdpbm5pbmdSZXY6IHdpbm5pbmdSZXYsXG4gICAgZGVsZXRlZE9yTG9jYWw6IGRlbGV0ZWQgPyAnMScgOiAnMCcsXG4gICAgc2VxOiBtZXRhZGF0YS5zZXEsIC8vIGhpZ2hlc3Qgc2VxIGZvciB0aGlzIGRvY1xuICAgIGlkOiBtZXRhZGF0YS5pZFxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWNvZGVNZXRhZGF0YShzdG9yZWRPYmplY3QpIHtcbiAgaWYgKCFzdG9yZWRPYmplY3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2YXIgbWV0YWRhdGEgPSBzYWZlSnNvblBhcnNlKHN0b3JlZE9iamVjdC5kYXRhKTtcbiAgbWV0YWRhdGEud2lubmluZ1JldiA9IHN0b3JlZE9iamVjdC53aW5uaW5nUmV2O1xuICBtZXRhZGF0YS5kZWxldGVkID0gc3RvcmVkT2JqZWN0LmRlbGV0ZWRPckxvY2FsID09PSAnMSc7XG4gIG1ldGFkYXRhLnNlcSA9IHN0b3JlZE9iamVjdC5zZXE7XG4gIHJldHVybiBtZXRhZGF0YTtcbn1cblxuLy8gcmVhZCB0aGUgZG9jIGJhY2sgb3V0IGZyb20gdGhlIGRhdGFiYXNlLiB3ZSBkb24ndCBzdG9yZSB0aGVcbi8vIF9pZCBvciBfcmV2IGJlY2F1c2Ugd2UgYWxyZWFkeSBoYXZlIF9kb2NfaWRfcmV2LlxuZnVuY3Rpb24gZGVjb2RlRG9jKGRvYykge1xuICBpZiAoIWRvYykge1xuICAgIHJldHVybiBkb2M7XG4gIH1cbiAgdmFyIGlkeCA9IGRvYy5fZG9jX2lkX3Jldi5sYXN0SW5kZXhPZignOicpO1xuICBkb2MuX2lkID0gZG9jLl9kb2NfaWRfcmV2LnN1YnN0cmluZygwLCBpZHggLSAxKTtcbiAgZG9jLl9yZXYgPSBkb2MuX2RvY19pZF9yZXYuc3Vic3RyaW5nKGlkeCArIDEpO1xuICBkZWxldGUgZG9jLl9kb2NfaWRfcmV2O1xuICByZXR1cm4gZG9jO1xufVxuXG4vLyBSZWFkIGEgYmxvYiBmcm9tIHRoZSBkYXRhYmFzZSwgZW5jb2RpbmcgYXMgbmVjZXNzYXJ5XG4vLyBhbmQgdHJhbnNsYXRpbmcgZnJvbSBiYXNlNjQgaWYgdGhlIElEQiBkb2Vzbid0IHN1cHBvcnRcbi8vIG5hdGl2ZSBCbG9ic1xuZnVuY3Rpb24gcmVhZEJsb2JEYXRhKGJvZHksIHR5cGUsIGFzQmxvYiwgY2FsbGJhY2spIHtcbiAgaWYgKGFzQmxvYikge1xuICAgIGlmICghYm9keSkge1xuICAgICAgY2FsbGJhY2soY3JlYXRlQmxvYihbJyddLCB7dHlwZTogdHlwZX0pKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBib2R5ICE9PSAnc3RyaW5nJykgeyAvLyB3ZSBoYXZlIGJsb2Igc3VwcG9ydFxuICAgICAgY2FsbGJhY2soYm9keSk7XG4gICAgfSBlbHNlIHsgLy8gbm8gYmxvYiBzdXBwb3J0XG4gICAgICBjYWxsYmFjayhiNjRUb0JsdWZmZXIoYm9keSwgdHlwZSkpO1xuICAgIH1cbiAgfSBlbHNlIHsgLy8gYXMgYmFzZTY0IHN0cmluZ1xuICAgIGlmICghYm9keSkge1xuICAgICAgY2FsbGJhY2soJycpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgIT09ICdzdHJpbmcnKSB7IC8vIHdlIGhhdmUgYmxvYiBzdXBwb3J0XG4gICAgICByZWFkQXNCaW5hcnlTdHJpbmcoYm9keSwgZnVuY3Rpb24gKGJpbmFyeSkge1xuICAgICAgICBjYWxsYmFjayhidG9hJDEoYmluYXJ5KSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgeyAvLyBubyBibG9iIHN1cHBvcnRcbiAgICAgIGNhbGxiYWNrKGJvZHkpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBmZXRjaEF0dGFjaG1lbnRzSWZOZWNlc3NhcnkoZG9jLCBvcHRzLCB0eG4sIGNiKSB7XG4gIHZhciBhdHRhY2htZW50cyA9IE9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMgfHwge30pO1xuICBpZiAoIWF0dGFjaG1lbnRzLmxlbmd0aCkge1xuICAgIHJldHVybiBjYiAmJiBjYigpO1xuICB9XG4gIHZhciBudW1Eb25lID0gMDtcblxuICBmdW5jdGlvbiBjaGVja0RvbmUoKSB7XG4gICAgaWYgKCsrbnVtRG9uZSA9PT0gYXR0YWNobWVudHMubGVuZ3RoICYmIGNiKSB7XG4gICAgICBjYigpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZldGNoQXR0YWNobWVudChkb2MsIGF0dCkge1xuICAgIHZhciBhdHRPYmogPSBkb2MuX2F0dGFjaG1lbnRzW2F0dF07XG4gICAgdmFyIGRpZ2VzdCA9IGF0dE9iai5kaWdlc3Q7XG4gICAgdmFyIHJlcSA9IHR4bi5vYmplY3RTdG9yZShBVFRBQ0hfU1RPUkUpLmdldChkaWdlc3QpO1xuICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgYXR0T2JqLmJvZHkgPSBlLnRhcmdldC5yZXN1bHQuYm9keTtcbiAgICAgIGNoZWNrRG9uZSgpO1xuICAgIH07XG4gIH1cblxuICBhdHRhY2htZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChhdHQpIHtcbiAgICBpZiAob3B0cy5hdHRhY2htZW50cyAmJiBvcHRzLmluY2x1ZGVfZG9jcykge1xuICAgICAgZmV0Y2hBdHRhY2htZW50KGRvYywgYXR0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jLl9hdHRhY2htZW50c1thdHRdLnN0dWIgPSB0cnVlO1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuICB9KTtcbn1cblxuLy8gSURCLXNwZWNpZmljIHBvc3Rwcm9jZXNzaW5nIG5lY2Vzc2FyeSBiZWNhdXNlXG4vLyB3ZSBkb24ndCBrbm93IHdoZXRoZXIgd2Ugc3RvcmVkIGEgdHJ1ZSBCbG9iIG9yXG4vLyBhIGJhc2U2NC1lbmNvZGVkIHN0cmluZywgYW5kIGlmIGl0J3MgYSBCbG9iIGl0XG4vLyBuZWVkcyB0byBiZSByZWFkIG91dHNpZGUgb2YgdGhlIHRyYW5zYWN0aW9uIGNvbnRleHRcbmZ1bmN0aW9uIHBvc3RQcm9jZXNzQXR0YWNobWVudHMocmVzdWx0cywgYXNCbG9iKSB7XG4gIHJldHVybiBQb3VjaFByb21pc2UuYWxsKHJlc3VsdHMubWFwKGZ1bmN0aW9uIChyb3cpIHtcbiAgICBpZiAocm93LmRvYyAmJiByb3cuZG9jLl9hdHRhY2htZW50cykge1xuICAgICAgdmFyIGF0dE5hbWVzID0gT2JqZWN0LmtleXMocm93LmRvYy5fYXR0YWNobWVudHMpO1xuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwoYXR0TmFtZXMubWFwKGZ1bmN0aW9uIChhdHQpIHtcbiAgICAgICAgdmFyIGF0dE9iaiA9IHJvdy5kb2MuX2F0dGFjaG1lbnRzW2F0dF07XG4gICAgICAgIGlmICghKCdib2R5JyBpbiBhdHRPYmopKSB7IC8vIGFscmVhZHkgcHJvY2Vzc2VkXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBib2R5ID0gYXR0T2JqLmJvZHk7XG4gICAgICAgIHZhciB0eXBlID0gYXR0T2JqLmNvbnRlbnRfdHlwZTtcbiAgICAgICAgcmV0dXJuIG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgICByZWFkQmxvYkRhdGEoYm9keSwgdHlwZSwgYXNCbG9iLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgcm93LmRvYy5fYXR0YWNobWVudHNbYXR0XSA9IGV4dGVuZCQxKFxuICAgICAgICAgICAgICBwaWNrKGF0dE9iaiwgWydkaWdlc3QnLCAnY29udGVudF90eXBlJ10pLFxuICAgICAgICAgICAgICB7ZGF0YTogZGF0YX1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSkpO1xuICAgIH1cbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBjb21wYWN0UmV2cyhyZXZzLCBkb2NJZCwgdHhuKSB7XG5cbiAgdmFyIHBvc3NpYmx5T3JwaGFuZWREaWdlc3RzID0gW107XG4gIHZhciBzZXFTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShCWV9TRVFfU1RPUkUpO1xuICB2YXIgYXR0U3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQVRUQUNIX1NUT1JFKTtcbiAgdmFyIGF0dEFuZFNlcVN0b3JlID0gdHhuLm9iamVjdFN0b3JlKEFUVEFDSF9BTkRfU0VRX1NUT1JFKTtcbiAgdmFyIGNvdW50ID0gcmV2cy5sZW5ndGg7XG5cbiAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgIGNvdW50LS07XG4gICAgaWYgKCFjb3VudCkgeyAvLyBkb25lIHByb2Nlc3NpbmcgYWxsIHJldnNcbiAgICAgIGRlbGV0ZU9ycGhhbmVkQXR0YWNobWVudHMoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVPcnBoYW5lZEF0dGFjaG1lbnRzKCkge1xuICAgIGlmICghcG9zc2libHlPcnBoYW5lZERpZ2VzdHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHBvc3NpYmx5T3JwaGFuZWREaWdlc3RzLmZvckVhY2goZnVuY3Rpb24gKGRpZ2VzdCkge1xuICAgICAgdmFyIGNvdW50UmVxID0gYXR0QW5kU2VxU3RvcmUuaW5kZXgoJ2RpZ2VzdFNlcScpLmNvdW50KFxuICAgICAgICBJREJLZXlSYW5nZS5ib3VuZChcbiAgICAgICAgICBkaWdlc3QgKyAnOjonLCBkaWdlc3QgKyAnOjpcXHVmZmZmJywgZmFsc2UsIGZhbHNlKSk7XG4gICAgICBjb3VudFJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgY291bnQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIGlmICghY291bnQpIHtcbiAgICAgICAgICAvLyBvcnBoYW5lZFxuICAgICAgICAgIGF0dFN0b3JlLmRlbGV0ZShkaWdlc3QpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgcmV2cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXYpIHtcbiAgICB2YXIgaW5kZXggPSBzZXFTdG9yZS5pbmRleCgnX2RvY19pZF9yZXYnKTtcbiAgICB2YXIga2V5ID0gZG9jSWQgKyBcIjo6XCIgKyByZXY7XG4gICAgaW5kZXguZ2V0S2V5KGtleSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBzZXEgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBpZiAodHlwZW9mIHNlcSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGNoZWNrRG9uZSgpO1xuICAgICAgfVxuICAgICAgc2VxU3RvcmUuZGVsZXRlKHNlcSk7XG5cbiAgICAgIHZhciBjdXJzb3IgPSBhdHRBbmRTZXFTdG9yZS5pbmRleCgnc2VxJylcbiAgICAgICAgLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2Uub25seShzZXEpKTtcblxuICAgICAgY3Vyc29yLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgaWYgKGN1cnNvcikge1xuICAgICAgICAgIHZhciBkaWdlc3QgPSBjdXJzb3IudmFsdWUuZGlnZXN0U2VxLnNwbGl0KCc6OicpWzBdO1xuICAgICAgICAgIHBvc3NpYmx5T3JwaGFuZWREaWdlc3RzLnB1c2goZGlnZXN0KTtcbiAgICAgICAgICBhdHRBbmRTZXFTdG9yZS5kZWxldGUoY3Vyc29yLnByaW1hcnlLZXkpO1xuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9IGVsc2UgeyAvLyBkb25lXG4gICAgICAgICAgY2hlY2tEb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9wZW5UcmFuc2FjdGlvblNhZmVseShpZGIsIHN0b3JlcywgbW9kZSkge1xuICB0cnkge1xuICAgIHJldHVybiB7XG4gICAgICB0eG46IGlkYi50cmFuc2FjdGlvbihzdG9yZXMsIG1vZGUpXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGlkYkJ1bGtEb2NzKGRiT3B0cywgcmVxLCBvcHRzLCBhcGksIGlkYiwgaWRiQ2hhbmdlcywgY2FsbGJhY2spIHtcbiAgdmFyIGRvY0luZm9zID0gcmVxLmRvY3M7XG4gIHZhciB0eG47XG4gIHZhciBkb2NTdG9yZTtcbiAgdmFyIGJ5U2VxU3RvcmU7XG4gIHZhciBhdHRhY2hTdG9yZTtcbiAgdmFyIGF0dGFjaEFuZFNlcVN0b3JlO1xuICB2YXIgZG9jSW5mb0Vycm9yO1xuICB2YXIgZG9jQ291bnREZWx0YSA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRvY0luZm9zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdmFyIGRvYyA9IGRvY0luZm9zW2ldO1xuICAgIGlmIChkb2MuX2lkICYmIGlzTG9jYWxJZChkb2MuX2lkKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGRvYyA9IGRvY0luZm9zW2ldID0gcGFyc2VEb2MoZG9jLCBvcHRzLm5ld19lZGl0cyk7XG4gICAgaWYgKGRvYy5lcnJvciAmJiAhZG9jSW5mb0Vycm9yKSB7XG4gICAgICBkb2NJbmZvRXJyb3IgPSBkb2M7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRvY0luZm9FcnJvcikge1xuICAgIHJldHVybiBjYWxsYmFjayhkb2NJbmZvRXJyb3IpO1xuICB9XG5cbiAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkoZG9jSW5mb3MubGVuZ3RoKTtcbiAgdmFyIGZldGNoZWREb2NzID0gbmV3IF9NYXAoKTtcbiAgdmFyIHByZWNvbmRpdGlvbkVycm9yZWQgPSBmYWxzZTtcbiAgdmFyIGJsb2JUeXBlID0gYXBpLl9tZXRhLmJsb2JTdXBwb3J0ID8gJ2Jsb2InIDogJ2Jhc2U2NCc7XG5cbiAgcHJlcHJvY2Vzc0F0dGFjaG1lbnRzKGRvY0luZm9zLCBibG9iVHlwZSwgZnVuY3Rpb24gKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIH1cbiAgICBzdGFydFRyYW5zYWN0aW9uKCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHN0YXJ0VHJhbnNhY3Rpb24oKSB7XG5cbiAgICB2YXIgc3RvcmVzID0gW1xuICAgICAgRE9DX1NUT1JFLCBCWV9TRVFfU1RPUkUsXG4gICAgICBBVFRBQ0hfU1RPUkUsXG4gICAgICBMT0NBTF9TVE9SRSwgQVRUQUNIX0FORF9TRVFfU1RPUkVcbiAgICBdO1xuICAgIHZhciB0eG5SZXN1bHQgPSBvcGVuVHJhbnNhY3Rpb25TYWZlbHkoaWRiLCBzdG9yZXMsICdyZWFkd3JpdGUnKTtcbiAgICBpZiAodHhuUmVzdWx0LmVycm9yKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sodHhuUmVzdWx0LmVycm9yKTtcbiAgICB9XG4gICAgdHhuID0gdHhuUmVzdWx0LnR4bjtcbiAgICB0eG4ub25hYm9ydCA9IGlkYkVycm9yKGNhbGxiYWNrKTtcbiAgICB0eG4ub250aW1lb3V0ID0gaWRiRXJyb3IoY2FsbGJhY2spO1xuICAgIHR4bi5vbmNvbXBsZXRlID0gY29tcGxldGU7XG4gICAgZG9jU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKTtcbiAgICBieVNlcVN0b3JlID0gdHhuLm9iamVjdFN0b3JlKEJZX1NFUV9TVE9SRSk7XG4gICAgYXR0YWNoU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQVRUQUNIX1NUT1JFKTtcbiAgICBhdHRhY2hBbmRTZXFTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShBVFRBQ0hfQU5EX1NFUV9TVE9SRSk7XG5cbiAgICB2ZXJpZnlBdHRhY2htZW50cyhmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHByZWNvbmRpdGlvbkVycm9yZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGZldGNoRXhpc3RpbmdEb2NzKCk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBpZGJQcm9jZXNzRG9jcygpIHtcbiAgICBwcm9jZXNzRG9jcyhkYk9wdHMucmV2c19saW1pdCwgZG9jSW5mb3MsIGFwaSwgZmV0Y2hlZERvY3MsXG4gICAgICAgICAgICAgICAgdHhuLCByZXN1bHRzLCB3cml0ZURvYywgb3B0cyk7XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaEV4aXN0aW5nRG9jcygpIHtcblxuICAgIGlmICghZG9jSW5mb3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG51bUZldGNoZWQgPSAwO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgaWYgKCsrbnVtRmV0Y2hlZCA9PT0gZG9jSW5mb3MubGVuZ3RoKSB7XG4gICAgICAgIGlkYlByb2Nlc3NEb2NzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVhZE1ldGFkYXRhKGV2ZW50KSB7XG4gICAgICB2YXIgbWV0YWRhdGEgPSBkZWNvZGVNZXRhZGF0YShldmVudC50YXJnZXQucmVzdWx0KTtcblxuICAgICAgaWYgKG1ldGFkYXRhKSB7XG4gICAgICAgIGZldGNoZWREb2NzLnNldChtZXRhZGF0YS5pZCwgbWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRvY0luZm9zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgZG9jSW5mbyA9IGRvY0luZm9zW2ldO1xuICAgICAgaWYgKGRvY0luZm8uX2lkICYmIGlzTG9jYWxJZChkb2NJbmZvLl9pZCkpIHtcbiAgICAgICAgY2hlY2tEb25lKCk7IC8vIHNraXAgbG9jYWwgZG9jc1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciByZXEgPSBkb2NTdG9yZS5nZXQoZG9jSW5mby5tZXRhZGF0YS5pZCk7XG4gICAgICByZXEub25zdWNjZXNzID0gcmVhZE1ldGFkYXRhO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgIGlmIChwcmVjb25kaXRpb25FcnJvcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWRiQ2hhbmdlcy5ub3RpZnkoYXBpLl9tZXRhLm5hbWUpO1xuICAgIGFwaS5fbWV0YS5kb2NDb3VudCArPSBkb2NDb3VudERlbHRhO1xuICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5QXR0YWNobWVudChkaWdlc3QsIGNhbGxiYWNrKSB7XG5cbiAgICB2YXIgcmVxID0gYXR0YWNoU3RvcmUuZ2V0KGRpZ2VzdCk7XG4gICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIWUudGFyZ2V0LnJlc3VsdCkge1xuICAgICAgICB2YXIgZXJyID0gY3JlYXRlRXJyb3IoTUlTU0lOR19TVFVCLFxuICAgICAgICAgICd1bmtub3duIHN0dWIgYXR0YWNobWVudCB3aXRoIGRpZ2VzdCAnICtcbiAgICAgICAgICBkaWdlc3QpO1xuICAgICAgICBlcnIuc3RhdHVzID0gNDEyO1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5QXR0YWNobWVudHMoZmluaXNoKSB7XG5cblxuICAgIHZhciBkaWdlc3RzID0gW107XG4gICAgZG9jSW5mb3MuZm9yRWFjaChmdW5jdGlvbiAoZG9jSW5mbykge1xuICAgICAgaWYgKGRvY0luZm8uZGF0YSAmJiBkb2NJbmZvLmRhdGEuX2F0dGFjaG1lbnRzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHMpLmZvckVhY2goZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgdmFyIGF0dCA9IGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHNbZmlsZW5hbWVdO1xuICAgICAgICAgIGlmIChhdHQuc3R1Yikge1xuICAgICAgICAgICAgZGlnZXN0cy5wdXNoKGF0dC5kaWdlc3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFkaWdlc3RzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZpbmlzaCgpO1xuICAgIH1cbiAgICB2YXIgbnVtRG9uZSA9IDA7XG4gICAgdmFyIGVycjtcblxuICAgIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICAgIGlmICgrK251bURvbmUgPT09IGRpZ2VzdHMubGVuZ3RoKSB7XG4gICAgICAgIGZpbmlzaChlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICBkaWdlc3RzLmZvckVhY2goZnVuY3Rpb24gKGRpZ2VzdCkge1xuICAgICAgdmVyaWZ5QXR0YWNobWVudChkaWdlc3QsIGZ1bmN0aW9uIChhdHRFcnIpIHtcbiAgICAgICAgaWYgKGF0dEVyciAmJiAhZXJyKSB7XG4gICAgICAgICAgZXJyID0gYXR0RXJyO1xuICAgICAgICB9XG4gICAgICAgIGNoZWNrRG9uZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZURvYyhkb2NJbmZvLCB3aW5uaW5nUmV2LCB3aW5uaW5nUmV2SXNEZWxldGVkLCBuZXdSZXZJc0RlbGV0ZWQsXG4gICAgICAgICAgICAgICAgICAgIGlzVXBkYXRlLCBkZWx0YSwgcmVzdWx0c0lkeCwgY2FsbGJhY2spIHtcblxuICAgIGRvY0NvdW50RGVsdGEgKz0gZGVsdGE7XG5cbiAgICBkb2NJbmZvLm1ldGFkYXRhLndpbm5pbmdSZXYgPSB3aW5uaW5nUmV2O1xuICAgIGRvY0luZm8ubWV0YWRhdGEuZGVsZXRlZCA9IHdpbm5pbmdSZXZJc0RlbGV0ZWQ7XG5cbiAgICB2YXIgZG9jID0gZG9jSW5mby5kYXRhO1xuICAgIGRvYy5faWQgPSBkb2NJbmZvLm1ldGFkYXRhLmlkO1xuICAgIGRvYy5fcmV2ID0gZG9jSW5mby5tZXRhZGF0YS5yZXY7XG5cbiAgICBpZiAobmV3UmV2SXNEZWxldGVkKSB7XG4gICAgICBkb2MuX2RlbGV0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBoYXNBdHRhY2htZW50cyA9IGRvYy5fYXR0YWNobWVudHMgJiZcbiAgICAgIE9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMpLmxlbmd0aDtcbiAgICBpZiAoaGFzQXR0YWNobWVudHMpIHtcbiAgICAgIHJldHVybiB3cml0ZUF0dGFjaG1lbnRzKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsXG4gICAgICAgIGlzVXBkYXRlLCByZXN1bHRzSWR4LCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgZmluaXNoRG9jKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsXG4gICAgICBpc1VwZGF0ZSwgcmVzdWx0c0lkeCwgY2FsbGJhY2spO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluaXNoRG9jKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsXG4gICAgICAgICAgICAgICAgICAgICBpc1VwZGF0ZSwgcmVzdWx0c0lkeCwgY2FsbGJhY2spIHtcblxuICAgIHZhciBkb2MgPSBkb2NJbmZvLmRhdGE7XG4gICAgdmFyIG1ldGFkYXRhID0gZG9jSW5mby5tZXRhZGF0YTtcblxuICAgIGRvYy5fZG9jX2lkX3JldiA9IG1ldGFkYXRhLmlkICsgJzo6JyArIG1ldGFkYXRhLnJldjtcbiAgICBkZWxldGUgZG9jLl9pZDtcbiAgICBkZWxldGUgZG9jLl9yZXY7XG5cbiAgICBmdW5jdGlvbiBhZnRlclB1dERvYyhlKSB7XG4gICAgICB2YXIgcmV2c1RvRGVsZXRlID0gZG9jSW5mby5zdGVtbWVkUmV2cyB8fCBbXTtcblxuICAgICAgaWYgKGlzVXBkYXRlICYmIGFwaS5hdXRvX2NvbXBhY3Rpb24pIHtcbiAgICAgICAgcmV2c1RvRGVsZXRlID0gcmV2c1RvRGVsZXRlLmNvbmNhdChjb21wYWN0VHJlZShkb2NJbmZvLm1ldGFkYXRhKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXZzVG9EZWxldGUgJiYgcmV2c1RvRGVsZXRlLmxlbmd0aCkge1xuICAgICAgICBjb21wYWN0UmV2cyhyZXZzVG9EZWxldGUsIGRvY0luZm8ubWV0YWRhdGEuaWQsIHR4bik7XG4gICAgICB9XG5cbiAgICAgIG1ldGFkYXRhLnNlcSA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIC8vIEN1cnJlbnQgX3JldiBpcyBjYWxjdWxhdGVkIGZyb20gX3Jldl90cmVlIG9uIHJlYWRcbiAgICAgIC8vIGRlbGV0ZSBtZXRhZGF0YS5yZXY7XG4gICAgICB2YXIgbWV0YWRhdGFUb1N0b3JlID0gZW5jb2RlTWV0YWRhdGEobWV0YWRhdGEsIHdpbm5pbmdSZXYsXG4gICAgICAgIHdpbm5pbmdSZXZJc0RlbGV0ZWQpO1xuICAgICAgdmFyIG1ldGFEYXRhUmVxID0gZG9jU3RvcmUucHV0KG1ldGFkYXRhVG9TdG9yZSk7XG4gICAgICBtZXRhRGF0YVJlcS5vbnN1Y2Nlc3MgPSBhZnRlclB1dE1ldGFkYXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFmdGVyUHV0RG9jRXJyb3IoZSkge1xuICAgICAgLy8gQ29uc3RyYWludEVycm9yLCBuZWVkIHRvIHVwZGF0ZSwgbm90IHB1dCAoc2VlICMxNjM4IGZvciBkZXRhaWxzKVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBhdm9pZCB0cmFuc2FjdGlvbiBhYm9ydFxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gYXZvaWQgdHJhbnNhY3Rpb24gb25lcnJvclxuICAgICAgdmFyIGluZGV4ID0gYnlTZXFTdG9yZS5pbmRleCgnX2RvY19pZF9yZXYnKTtcbiAgICAgIHZhciBnZXRLZXlSZXEgPSBpbmRleC5nZXRLZXkoZG9jLl9kb2NfaWRfcmV2KTtcbiAgICAgIGdldEtleVJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgcHV0UmVxID0gYnlTZXFTdG9yZS5wdXQoZG9jLCBlLnRhcmdldC5yZXN1bHQpO1xuICAgICAgICBwdXRSZXEub25zdWNjZXNzID0gYWZ0ZXJQdXREb2M7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFmdGVyUHV0TWV0YWRhdGEoKSB7XG4gICAgICByZXN1bHRzW3Jlc3VsdHNJZHhdID0ge1xuICAgICAgICBvazogdHJ1ZSxcbiAgICAgICAgaWQ6IG1ldGFkYXRhLmlkLFxuICAgICAgICByZXY6IG1ldGFkYXRhLnJldlxuICAgICAgfTtcbiAgICAgIGZldGNoZWREb2NzLnNldChkb2NJbmZvLm1ldGFkYXRhLmlkLCBkb2NJbmZvLm1ldGFkYXRhKTtcbiAgICAgIGluc2VydEF0dGFjaG1lbnRNYXBwaW5ncyhkb2NJbmZvLCBtZXRhZGF0YS5zZXEsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICB2YXIgcHV0UmVxID0gYnlTZXFTdG9yZS5wdXQoZG9jKTtcblxuICAgIHB1dFJlcS5vbnN1Y2Nlc3MgPSBhZnRlclB1dERvYztcbiAgICBwdXRSZXEub25lcnJvciA9IGFmdGVyUHV0RG9jRXJyb3I7XG4gIH1cblxuICBmdW5jdGlvbiB3cml0ZUF0dGFjaG1lbnRzKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNVcGRhdGUsIHJlc3VsdHNJZHgsIGNhbGxiYWNrKSB7XG5cblxuICAgIHZhciBkb2MgPSBkb2NJbmZvLmRhdGE7XG5cbiAgICB2YXIgbnVtRG9uZSA9IDA7XG4gICAgdmFyIGF0dGFjaG1lbnRzID0gT2JqZWN0LmtleXMoZG9jLl9hdHRhY2htZW50cyk7XG5cbiAgICBmdW5jdGlvbiBjb2xsZWN0UmVzdWx0cygpIHtcbiAgICAgIGlmIChudW1Eb25lID09PSBhdHRhY2htZW50cy5sZW5ndGgpIHtcbiAgICAgICAgZmluaXNoRG9jKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsXG4gICAgICAgICAgaXNVcGRhdGUsIHJlc3VsdHNJZHgsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhdHRhY2htZW50U2F2ZWQoKSB7XG4gICAgICBudW1Eb25lKys7XG4gICAgICBjb2xsZWN0UmVzdWx0cygpO1xuICAgIH1cblxuICAgIGF0dGFjaG1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgdmFyIGF0dCA9IGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHNba2V5XTtcbiAgICAgIGlmICghYXR0LnN0dWIpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBhdHQuZGF0YTtcbiAgICAgICAgZGVsZXRlIGF0dC5kYXRhO1xuICAgICAgICBhdHQucmV2cG9zID0gcGFyc2VJbnQod2lubmluZ1JldiwgMTApO1xuICAgICAgICB2YXIgZGlnZXN0ID0gYXR0LmRpZ2VzdDtcbiAgICAgICAgc2F2ZUF0dGFjaG1lbnQoZGlnZXN0LCBkYXRhLCBhdHRhY2htZW50U2F2ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtRG9uZSsrO1xuICAgICAgICBjb2xsZWN0UmVzdWx0cygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gbWFwIHNlcXMgdG8gYXR0YWNobWVudCBkaWdlc3RzLCB3aGljaFxuICAvLyB3ZSB3aWxsIG5lZWQgbGF0ZXIgZHVyaW5nIGNvbXBhY3Rpb25cbiAgZnVuY3Rpb24gaW5zZXJ0QXR0YWNobWVudE1hcHBpbmdzKGRvY0luZm8sIHNlcSwgY2FsbGJhY2spIHtcblxuICAgIHZhciBhdHRzQWRkZWQgPSAwO1xuICAgIHZhciBhdHRzVG9BZGQgPSBPYmplY3Qua2V5cyhkb2NJbmZvLmRhdGEuX2F0dGFjaG1lbnRzIHx8IHt9KTtcblxuICAgIGlmICghYXR0c1RvQWRkLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgaWYgKCsrYXR0c0FkZGVkID09PSBhdHRzVG9BZGQubGVuZ3RoKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkKGF0dCkge1xuICAgICAgdmFyIGRpZ2VzdCA9IGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHNbYXR0XS5kaWdlc3Q7XG4gICAgICB2YXIgcmVxID0gYXR0YWNoQW5kU2VxU3RvcmUucHV0KHtcbiAgICAgICAgc2VxOiBzZXEsXG4gICAgICAgIGRpZ2VzdFNlcTogZGlnZXN0ICsgJzo6JyArIHNlcVxuICAgICAgfSk7XG5cbiAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBjaGVja0RvbmU7XG4gICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIC8vIHRoaXMgY2FsbGJhY2sgaXMgZm9yIGEgY29uc3RhaW50IGVycm9yLCB3aGljaCB3ZSBpZ25vcmVcbiAgICAgICAgLy8gYmVjYXVzZSB0aGlzIGRvY2lkL3JldiBoYXMgYWxyZWFkeSBiZWVuIGFzc29jaWF0ZWQgd2l0aFxuICAgICAgICAvLyB0aGUgZGlnZXN0IChlLmcuIHdoZW4gbmV3X2VkaXRzID09IGZhbHNlKVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIGF2b2lkIHRyYW5zYWN0aW9uIGFib3J0XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7IC8vIGF2b2lkIHRyYW5zYWN0aW9uIG9uZXJyb3JcbiAgICAgICAgY2hlY2tEb25lKCk7XG4gICAgICB9O1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHNUb0FkZC5sZW5ndGg7IGkrKykge1xuICAgICAgYWRkKGF0dHNUb0FkZFtpXSk7IC8vIGRvIGluIHBhcmFsbGVsXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2F2ZUF0dGFjaG1lbnQoZGlnZXN0LCBkYXRhLCBjYWxsYmFjaykge1xuXG5cbiAgICB2YXIgZ2V0S2V5UmVxID0gYXR0YWNoU3RvcmUuY291bnQoZGlnZXN0KTtcbiAgICBnZXRLZXlSZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBjb3VudCA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmIChjb3VudCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTsgLy8gYWxyZWFkeSBleGlzdHNcbiAgICAgIH1cbiAgICAgIHZhciBuZXdBdHQgPSB7XG4gICAgICAgIGRpZ2VzdDogZGlnZXN0LFxuICAgICAgICBib2R5OiBkYXRhXG4gICAgICB9O1xuICAgICAgdmFyIHB1dFJlcSA9IGF0dGFjaFN0b3JlLnB1dChuZXdBdHQpO1xuICAgICAgcHV0UmVxLm9uc3VjY2VzcyA9IGNhbGxiYWNrO1xuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlS2V5UmFuZ2Uoc3RhcnQsIGVuZCwgaW5jbHVzaXZlRW5kLCBrZXksIGRlc2NlbmRpbmcpIHtcbiAgdHJ5IHtcbiAgICBpZiAoc3RhcnQgJiYgZW5kKSB7XG4gICAgICBpZiAoZGVzY2VuZGluZykge1xuICAgICAgICByZXR1cm4gSURCS2V5UmFuZ2UuYm91bmQoZW5kLCBzdGFydCwgIWluY2x1c2l2ZUVuZCwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIElEQktleVJhbmdlLmJvdW5kKHN0YXJ0LCBlbmQsIGZhbHNlLCAhaW5jbHVzaXZlRW5kKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHN0YXJ0KSB7XG4gICAgICBpZiAoZGVzY2VuZGluZykge1xuICAgICAgICByZXR1cm4gSURCS2V5UmFuZ2UudXBwZXJCb3VuZChzdGFydCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gSURCS2V5UmFuZ2UubG93ZXJCb3VuZChzdGFydCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbmQpIHtcbiAgICAgIGlmIChkZXNjZW5kaW5nKSB7XG4gICAgICAgIHJldHVybiBJREJLZXlSYW5nZS5sb3dlckJvdW5kKGVuZCwgIWluY2x1c2l2ZUVuZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gSURCS2V5UmFuZ2UudXBwZXJCb3VuZChlbmQsICFpbmNsdXNpdmVFbmQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2V5KSB7XG4gICAgICByZXR1cm4gSURCS2V5UmFuZ2Uub25seShrZXkpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB7ZXJyb3I6IGV9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVLZXlSYW5nZUVycm9yKGFwaSwgb3B0cywgZXJyLCBjYWxsYmFjaykge1xuICBpZiAoZXJyLm5hbWUgPT09IFwiRGF0YUVycm9yXCIgJiYgZXJyLmNvZGUgPT09IDApIHtcbiAgICAvLyBkYXRhIGVycm9yLCBzdGFydCBpcyBsZXNzIHRoYW4gZW5kXG4gICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgIHRvdGFsX3Jvd3M6IGFwaS5fbWV0YS5kb2NDb3VudCxcbiAgICAgIG9mZnNldDogb3B0cy5za2lwLFxuICAgICAgcm93czogW11cbiAgICB9KTtcbiAgfVxuICBjYWxsYmFjayhjcmVhdGVFcnJvcihJREJfRVJST1IsIGVyci5uYW1lLCBlcnIubWVzc2FnZSkpO1xufVxuXG5mdW5jdGlvbiBpZGJBbGxEb2NzKG9wdHMsIGFwaSwgaWRiLCBjYWxsYmFjaykge1xuXG4gIGZ1bmN0aW9uIGFsbERvY3NRdWVyeShvcHRzLCBjYWxsYmFjaykge1xuICAgIHZhciBzdGFydCA9ICdzdGFydGtleScgaW4gb3B0cyA/IG9wdHMuc3RhcnRrZXkgOiBmYWxzZTtcbiAgICB2YXIgZW5kID0gJ2VuZGtleScgaW4gb3B0cyA/IG9wdHMuZW5ka2V5IDogZmFsc2U7XG4gICAgdmFyIGtleSA9ICdrZXknIGluIG9wdHMgPyBvcHRzLmtleSA6IGZhbHNlO1xuICAgIHZhciBza2lwID0gb3B0cy5za2lwIHx8IDA7XG4gICAgdmFyIGxpbWl0ID0gdHlwZW9mIG9wdHMubGltaXQgPT09ICdudW1iZXInID8gb3B0cy5saW1pdCA6IC0xO1xuICAgIHZhciBpbmNsdXNpdmVFbmQgPSBvcHRzLmluY2x1c2l2ZV9lbmQgIT09IGZhbHNlO1xuICAgIHZhciBkZXNjZW5kaW5nID0gJ2Rlc2NlbmRpbmcnIGluIG9wdHMgJiYgb3B0cy5kZXNjZW5kaW5nID8gJ3ByZXYnIDogbnVsbDtcblxuICAgIHZhciBrZXlSYW5nZSA9IGNyZWF0ZUtleVJhbmdlKHN0YXJ0LCBlbmQsIGluY2x1c2l2ZUVuZCwga2V5LCBkZXNjZW5kaW5nKTtcbiAgICBpZiAoa2V5UmFuZ2UgJiYga2V5UmFuZ2UuZXJyb3IpIHtcbiAgICAgIHJldHVybiBoYW5kbGVLZXlSYW5nZUVycm9yKGFwaSwgb3B0cywga2V5UmFuZ2UuZXJyb3IsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICB2YXIgc3RvcmVzID0gW0RPQ19TVE9SRSwgQllfU0VRX1NUT1JFXTtcblxuICAgIGlmIChvcHRzLmF0dGFjaG1lbnRzKSB7XG4gICAgICBzdG9yZXMucHVzaChBVFRBQ0hfU1RPUkUpO1xuICAgIH1cbiAgICB2YXIgdHhuUmVzdWx0ID0gb3BlblRyYW5zYWN0aW9uU2FmZWx5KGlkYiwgc3RvcmVzLCAncmVhZG9ubHknKTtcbiAgICBpZiAodHhuUmVzdWx0LmVycm9yKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sodHhuUmVzdWx0LmVycm9yKTtcbiAgICB9XG4gICAgdmFyIHR4biA9IHR4blJlc3VsdC50eG47XG4gICAgdmFyIGRvY1N0b3JlID0gdHhuLm9iamVjdFN0b3JlKERPQ19TVE9SRSk7XG4gICAgdmFyIHNlcVN0b3JlID0gdHhuLm9iamVjdFN0b3JlKEJZX1NFUV9TVE9SRSk7XG4gICAgdmFyIGN1cnNvciA9IGRlc2NlbmRpbmcgP1xuICAgICAgZG9jU3RvcmUub3BlbkN1cnNvcihrZXlSYW5nZSwgZGVzY2VuZGluZykgOlxuICAgICAgZG9jU3RvcmUub3BlbkN1cnNvcihrZXlSYW5nZSk7XG4gICAgdmFyIGRvY0lkUmV2SW5kZXggPSBzZXFTdG9yZS5pbmRleCgnX2RvY19pZF9yZXYnKTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBkb2NDb3VudCA9IDA7XG5cbiAgICAvLyBpZiB0aGUgdXNlciBzcGVjaWZpZXMgaW5jbHVkZV9kb2NzPXRydWUsIHRoZW4gd2UgZG9uJ3RcbiAgICAvLyB3YW50IHRvIGJsb2NrIHRoZSBtYWluIGN1cnNvciB3aGlsZSB3ZSdyZSBmZXRjaGluZyB0aGUgZG9jXG4gICAgZnVuY3Rpb24gZmV0Y2hEb2NBc3luY2hyb25vdXNseShtZXRhZGF0YSwgcm93LCB3aW5uaW5nUmV2KSB7XG4gICAgICB2YXIga2V5ID0gbWV0YWRhdGEuaWQgKyBcIjo6XCIgKyB3aW5uaW5nUmV2O1xuICAgICAgZG9jSWRSZXZJbmRleC5nZXQoa2V5KS5vbnN1Y2Nlc3MgPSAgZnVuY3Rpb24gb25HZXREb2MoZSkge1xuICAgICAgICByb3cuZG9jID0gZGVjb2RlRG9jKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIGlmIChvcHRzLmNvbmZsaWN0cykge1xuICAgICAgICAgIHZhciBjb25mbGljdHMgPSBjb2xsZWN0Q29uZmxpY3RzKG1ldGFkYXRhKTtcbiAgICAgICAgICBpZiAoY29uZmxpY3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgcm93LmRvYy5fY29uZmxpY3RzID0gY29uZmxpY3RzO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmZXRjaEF0dGFjaG1lbnRzSWZOZWNlc3Nhcnkocm93LmRvYywgb3B0cywgdHhuKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWxsRG9jc0lubmVyKGN1cnNvciwgd2lubmluZ1JldiwgbWV0YWRhdGEpIHtcbiAgICAgIHZhciByb3cgPSB7XG4gICAgICAgIGlkOiBtZXRhZGF0YS5pZCxcbiAgICAgICAga2V5OiBtZXRhZGF0YS5pZCxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICByZXY6IHdpbm5pbmdSZXZcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBkZWxldGVkID0gbWV0YWRhdGEuZGVsZXRlZDtcbiAgICAgIGlmIChvcHRzLmRlbGV0ZWQgPT09ICdvaycpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHJvdyk7XG4gICAgICAgIC8vIGRlbGV0ZWQgZG9jcyBhcmUgb2theSB3aXRoIFwia2V5c1wiIHJlcXVlc3RzXG4gICAgICAgIGlmIChkZWxldGVkKSB7XG4gICAgICAgICAgcm93LnZhbHVlLmRlbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgIHJvdy5kb2MgPSBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdHMuaW5jbHVkZV9kb2NzKSB7XG4gICAgICAgICAgZmV0Y2hEb2NBc3luY2hyb25vdXNseShtZXRhZGF0YSwgcm93LCB3aW5uaW5nUmV2KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghZGVsZXRlZCAmJiBza2lwLS0gPD0gMCkge1xuICAgICAgICByZXN1bHRzLnB1c2gocm93KTtcbiAgICAgICAgaWYgKG9wdHMuaW5jbHVkZV9kb2NzKSB7XG4gICAgICAgICAgZmV0Y2hEb2NBc3luY2hyb25vdXNseShtZXRhZGF0YSwgcm93LCB3aW5uaW5nUmV2KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoLS1saW1pdCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25HZXRDdXJzb3IoZSkge1xuICAgICAgZG9jQ291bnQgPSBhcGkuX21ldGEuZG9jQ291bnQ7IC8vIGRvIHRoaXMgd2l0aGluIHRoZSB0eG4gZm9yIGNvbnNpc3RlbmN5XG4gICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG1ldGFkYXRhID0gZGVjb2RlTWV0YWRhdGEoY3Vyc29yLnZhbHVlKTtcbiAgICAgIHZhciB3aW5uaW5nUmV2ID0gbWV0YWRhdGEud2lubmluZ1JldjtcblxuICAgICAgYWxsRG9jc0lubmVyKGN1cnNvciwgd2lubmluZ1JldiwgbWV0YWRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uUmVzdWx0c1JlYWR5KCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICB0b3RhbF9yb3dzOiBkb2NDb3VudCxcbiAgICAgICAgb2Zmc2V0OiBvcHRzLnNraXAsXG4gICAgICAgIHJvd3M6IHJlc3VsdHNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVHhuQ29tcGxldGUoKSB7XG4gICAgICBpZiAob3B0cy5hdHRhY2htZW50cykge1xuICAgICAgICBwb3N0UHJvY2Vzc0F0dGFjaG1lbnRzKHJlc3VsdHMsIG9wdHMuYmluYXJ5KS50aGVuKG9uUmVzdWx0c1JlYWR5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9uUmVzdWx0c1JlYWR5KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdHhuLm9uY29tcGxldGUgPSBvblR4bkNvbXBsZXRlO1xuICAgIGN1cnNvci5vbnN1Y2Nlc3MgPSBvbkdldEN1cnNvcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsbERvY3Mob3B0cywgY2FsbGJhY2spIHtcblxuICAgIGlmIChvcHRzLmxpbWl0ID09PSAwKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwge1xuICAgICAgICB0b3RhbF9yb3dzOiBhcGkuX21ldGEuZG9jQ291bnQsXG4gICAgICAgIG9mZnNldDogb3B0cy5za2lwLFxuICAgICAgICByb3dzOiBbXVxuICAgICAgfSk7XG4gICAgfVxuICAgIGFsbERvY3NRdWVyeShvcHRzLCBjYWxsYmFjayk7XG4gIH1cblxuICBhbGxEb2NzKG9wdHMsIGNhbGxiYWNrKTtcbn1cblxuLy9cbi8vIEJsb2JzIGFyZSBub3Qgc3VwcG9ydGVkIGluIGFsbCB2ZXJzaW9ucyBvZiBJbmRleGVkREIsIG5vdGFibHlcbi8vIENocm9tZSA8MzcgYW5kIEFuZHJvaWQgPDUuIEluIHRob3NlIHZlcnNpb25zLCBzdG9yaW5nIGEgYmxvYiB3aWxsIHRocm93LlxuLy9cbi8vIFZhcmlvdXMgb3RoZXIgYmxvYiBidWdzIGV4aXN0IGluIENocm9tZSB2MzctNDIgKGluY2x1c2l2ZSkuXG4vLyBEZXRlY3RpbmcgdGhlbSBpcyBleHBlbnNpdmUgYW5kIGNvbmZ1c2luZyB0byB1c2VycywgYW5kIENocm9tZSAzNy00MlxuLy8gaXMgYXQgdmVyeSBsb3cgdXNhZ2Ugd29ybGR3aWRlLCBzbyB3ZSBkbyBhIGhhY2t5IHVzZXJBZ2VudCBjaGVjayBpbnN0ZWFkLlxuLy9cbi8vIGNvbnRlbnQtdHlwZSBidWc6IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00MDgxMjBcbi8vIDQwNCBidWc6IGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00NDc5MTZcbi8vIEZpbGVSZWFkZXIgYnVnOiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDQ3ODM2XG4vL1xuZnVuY3Rpb24gY2hlY2tCbG9iU3VwcG9ydCh0eG4pIHtcbiAgcmV0dXJuIG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICB2YXIgYmxvYiA9IGNyZWF0ZUJsb2IoWycnXSk7XG4gICAgdHhuLm9iamVjdFN0b3JlKERFVEVDVF9CTE9CX1NVUFBPUlRfU1RPUkUpLnB1dChibG9iLCAna2V5Jyk7XG5cbiAgICB0eG4ub25hYm9ydCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyBJZiB0aGUgdHJhbnNhY3Rpb24gYWJvcnRzIG5vdyBpdHMgZHVlIHRvIG5vdCBiZWluZyBhYmxlIHRvXG4gICAgICAvLyB3cml0ZSB0byB0aGUgZGF0YWJhc2UsIGxpa2VseSBkdWUgdG8gdGhlIGRpc2sgYmVpbmcgZnVsbFxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHJlc29sdmUoZmFsc2UpO1xuICAgIH07XG5cbiAgICB0eG4ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBtYXRjaGVkQ2hyb21lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQ2hyb21lXFwvKFxcZCspLyk7XG4gICAgICB2YXIgbWF0Y2hlZEVkZ2UgPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9FZGdlXFwvLyk7XG4gICAgICAvLyBNUyBFZGdlIHByZXRlbmRzIHRvIGJlIENocm9tZSA0MjpcbiAgICAgIC8vIGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaGg4NjkzMDElMjh2PXZzLjg1JTI5LmFzcHhcbiAgICAgIHJlc29sdmUobWF0Y2hlZEVkZ2UgfHwgIW1hdGNoZWRDaHJvbWUgfHxcbiAgICAgICAgcGFyc2VJbnQobWF0Y2hlZENocm9tZVsxXSwgMTApID49IDQzKTtcbiAgICB9O1xuICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZhbHNlOyAvLyBlcnJvciwgc28gYXNzdW1lIHVuc3VwcG9ydGVkXG4gIH0pO1xufVxuXG52YXIgY2FjaGVkREJzID0gbmV3IF9NYXAoKTtcbnZhciBibG9iU3VwcG9ydFByb21pc2U7XG52YXIgaWRiQ2hhbmdlcyA9IG5ldyBDaGFuZ2VzKCk7XG52YXIgb3BlblJlcUxpc3QgPSBuZXcgX01hcCgpO1xuXG5mdW5jdGlvbiBJZGJQb3VjaChvcHRzLCBjYWxsYmFjaykge1xuICB2YXIgYXBpID0gdGhpcztcblxuICB0YXNrUXVldWUucXVldWUucHVzaCh7XG4gICAgYWN0aW9uOiBmdW5jdGlvbiAodGhpc0NhbGxiYWNrKSB7XG4gICAgICBpbml0KGFwaSwgb3B0cywgdGhpc0NhbGxiYWNrKTtcbiAgICB9LFxuICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICB9KTtcbiAgYXBwbHlOZXh0KGFwaS5jb25zdHJ1Y3Rvcik7XG59XG5cbmZ1bmN0aW9uIGluaXQoYXBpLCBvcHRzLCBjYWxsYmFjaykge1xuXG4gIHZhciBkYk5hbWUgPSBvcHRzLm5hbWU7XG5cbiAgdmFyIGlkYiA9IG51bGw7XG4gIGFwaS5fbWV0YSA9IG51bGw7XG5cbiAgLy8gY2FsbGVkIHdoZW4gY3JlYXRpbmcgYSBmcmVzaCBuZXcgZGF0YWJhc2VcbiAgZnVuY3Rpb24gY3JlYXRlU2NoZW1hKGRiKSB7XG4gICAgdmFyIGRvY1N0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoRE9DX1NUT1JFLCB7a2V5UGF0aCA6ICdpZCd9KTtcbiAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShCWV9TRVFfU1RPUkUsIHthdXRvSW5jcmVtZW50OiB0cnVlfSlcbiAgICAgIC5jcmVhdGVJbmRleCgnX2RvY19pZF9yZXYnLCAnX2RvY19pZF9yZXYnLCB7dW5pcXVlOiB0cnVlfSk7XG4gICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoQVRUQUNIX1NUT1JFLCB7a2V5UGF0aDogJ2RpZ2VzdCd9KTtcbiAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShNRVRBX1NUT1JFLCB7a2V5UGF0aDogJ2lkJywgYXV0b0luY3JlbWVudDogZmFsc2V9KTtcbiAgICBkYi5jcmVhdGVPYmplY3RTdG9yZShERVRFQ1RfQkxPQl9TVVBQT1JUX1NUT1JFKTtcblxuICAgIC8vIGFkZGVkIGluIHYyXG4gICAgZG9jU3RvcmUuY3JlYXRlSW5kZXgoJ2RlbGV0ZWRPckxvY2FsJywgJ2RlbGV0ZWRPckxvY2FsJywge3VuaXF1ZSA6IGZhbHNlfSk7XG5cbiAgICAvLyBhZGRlZCBpbiB2M1xuICAgIGRiLmNyZWF0ZU9iamVjdFN0b3JlKExPQ0FMX1NUT1JFLCB7a2V5UGF0aDogJ19pZCd9KTtcblxuICAgIC8vIGFkZGVkIGluIHY0XG4gICAgdmFyIGF0dEFuZFNlcVN0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoQVRUQUNIX0FORF9TRVFfU1RPUkUsXG4gICAgICB7YXV0b0luY3JlbWVudDogdHJ1ZX0pO1xuICAgIGF0dEFuZFNlcVN0b3JlLmNyZWF0ZUluZGV4KCdzZXEnLCAnc2VxJyk7XG4gICAgYXR0QW5kU2VxU3RvcmUuY3JlYXRlSW5kZXgoJ2RpZ2VzdFNlcScsICdkaWdlc3RTZXEnLCB7dW5pcXVlOiB0cnVlfSk7XG4gIH1cblxuICAvLyBtaWdyYXRpb24gdG8gdmVyc2lvbiAyXG4gIC8vIHVuZm9ydHVuYXRlbHkgXCJkZWxldGVkT3JMb2NhbFwiIGlzIGEgbWlzbm9tZXIgbm93IHRoYXQgd2Ugbm8gbG9uZ2VyXG4gIC8vIHN0b3JlIGxvY2FsIGRvY3MgaW4gdGhlIG1haW4gZG9jLXN0b3JlLCBidXQgd2hhZGR5YWdvbm5hZG9cbiAgZnVuY3Rpb24gYWRkRGVsZXRlZE9yTG9jYWxJbmRleCh0eG4sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGRvY1N0b3JlID0gdHhuLm9iamVjdFN0b3JlKERPQ19TVE9SRSk7XG4gICAgZG9jU3RvcmUuY3JlYXRlSW5kZXgoJ2RlbGV0ZWRPckxvY2FsJywgJ2RlbGV0ZWRPckxvY2FsJywge3VuaXF1ZSA6IGZhbHNlfSk7XG5cbiAgICBkb2NTdG9yZS5vcGVuQ3Vyc29yKCkub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhID0gY3Vyc29yLnZhbHVlO1xuICAgICAgICB2YXIgZGVsZXRlZCA9IGlzRGVsZXRlZChtZXRhZGF0YSk7XG4gICAgICAgIG1ldGFkYXRhLmRlbGV0ZWRPckxvY2FsID0gZGVsZXRlZCA/IFwiMVwiIDogXCIwXCI7XG4gICAgICAgIGRvY1N0b3JlLnB1dChtZXRhZGF0YSk7XG4gICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gbWlncmF0aW9uIHRvIHZlcnNpb24gMyAocGFydCAxKVxuICBmdW5jdGlvbiBjcmVhdGVMb2NhbFN0b3JlU2NoZW1hKGRiKSB7XG4gICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoTE9DQUxfU1RPUkUsIHtrZXlQYXRoOiAnX2lkJ30pXG4gICAgICAuY3JlYXRlSW5kZXgoJ19kb2NfaWRfcmV2JywgJ19kb2NfaWRfcmV2Jywge3VuaXF1ZTogdHJ1ZX0pO1xuICB9XG5cbiAgLy8gbWlncmF0aW9uIHRvIHZlcnNpb24gMyAocGFydCAyKVxuICBmdW5jdGlvbiBtaWdyYXRlTG9jYWxTdG9yZSh0eG4sIGNiKSB7XG4gICAgdmFyIGxvY2FsU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoTE9DQUxfU1RPUkUpO1xuICAgIHZhciBkb2NTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShET0NfU1RPUkUpO1xuICAgIHZhciBzZXFTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShCWV9TRVFfU1RPUkUpO1xuXG4gICAgdmFyIGN1cnNvciA9IGRvY1N0b3JlLm9wZW5DdXJzb3IoKTtcbiAgICBjdXJzb3Iub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmIChjdXJzb3IpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhID0gY3Vyc29yLnZhbHVlO1xuICAgICAgICB2YXIgZG9jSWQgPSBtZXRhZGF0YS5pZDtcbiAgICAgICAgdmFyIGxvY2FsID0gaXNMb2NhbElkKGRvY0lkKTtcbiAgICAgICAgdmFyIHJldiA9IHdpbm5pbmdSZXYobWV0YWRhdGEpO1xuICAgICAgICBpZiAobG9jYWwpIHtcbiAgICAgICAgICB2YXIgZG9jSWRSZXYgPSBkb2NJZCArIFwiOjpcIiArIHJldjtcbiAgICAgICAgICAvLyByZW1vdmUgYWxsIHNlcSBlbnRyaWVzXG4gICAgICAgICAgLy8gYXNzb2NpYXRlZCB3aXRoIHRoaXMgZG9jSWRcbiAgICAgICAgICB2YXIgc3RhcnQgPSBkb2NJZCArIFwiOjpcIjtcbiAgICAgICAgICB2YXIgZW5kID0gZG9jSWQgKyBcIjo6flwiO1xuICAgICAgICAgIHZhciBpbmRleCA9IHNlcVN0b3JlLmluZGV4KCdfZG9jX2lkX3JldicpO1xuICAgICAgICAgIHZhciByYW5nZSA9IElEQktleVJhbmdlLmJvdW5kKHN0YXJ0LCBlbmQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgdmFyIHNlcUN1cnNvciA9IGluZGV4Lm9wZW5DdXJzb3IocmFuZ2UpO1xuICAgICAgICAgIHNlcUN1cnNvci5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgc2VxQ3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgaWYgKCFzZXFDdXJzb3IpIHtcbiAgICAgICAgICAgICAgLy8gZG9uZVxuICAgICAgICAgICAgICBkb2NTdG9yZS5kZWxldGUoY3Vyc29yLnByaW1hcnlLZXkpO1xuICAgICAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHZhciBkYXRhID0gc2VxQ3Vyc29yLnZhbHVlO1xuICAgICAgICAgICAgICBpZiAoZGF0YS5fZG9jX2lkX3JldiA9PT0gZG9jSWRSZXYpIHtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JlLnB1dChkYXRhKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZXFTdG9yZS5kZWxldGUoc2VxQ3Vyc29yLnByaW1hcnlLZXkpO1xuICAgICAgICAgICAgICBzZXFDdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNiKSB7XG4gICAgICAgIGNiKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIG1pZ3JhdGlvbiB0byB2ZXJzaW9uIDQgKHBhcnQgMSlcbiAgZnVuY3Rpb24gYWRkQXR0YWNoQW5kU2VxU3RvcmUoZGIpIHtcbiAgICB2YXIgYXR0QW5kU2VxU3RvcmUgPSBkYi5jcmVhdGVPYmplY3RTdG9yZShBVFRBQ0hfQU5EX1NFUV9TVE9SRSxcbiAgICAgIHthdXRvSW5jcmVtZW50OiB0cnVlfSk7XG4gICAgYXR0QW5kU2VxU3RvcmUuY3JlYXRlSW5kZXgoJ3NlcScsICdzZXEnKTtcbiAgICBhdHRBbmRTZXFTdG9yZS5jcmVhdGVJbmRleCgnZGlnZXN0U2VxJywgJ2RpZ2VzdFNlcScsIHt1bmlxdWU6IHRydWV9KTtcbiAgfVxuXG4gIC8vIG1pZ3JhdGlvbiB0byB2ZXJzaW9uIDQgKHBhcnQgMilcbiAgZnVuY3Rpb24gbWlncmF0ZUF0dHNBbmRTZXFzKHR4biwgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VxU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQllfU0VRX1NUT1JFKTtcbiAgICB2YXIgYXR0U3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQVRUQUNIX1NUT1JFKTtcbiAgICB2YXIgYXR0QW5kU2VxU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQVRUQUNIX0FORF9TRVFfU1RPUkUpO1xuXG4gICAgLy8gbmVlZCB0byBhY3R1YWxseSBwb3B1bGF0ZSB0aGUgdGFibGUuIHRoaXMgaXMgdGhlIGV4cGVuc2l2ZSBwYXJ0LFxuICAgIC8vIHNvIGFzIGFuIG9wdGltaXphdGlvbiwgY2hlY2sgZmlyc3QgdGhhdCB0aGlzIGRhdGFiYXNlIGV2ZW5cbiAgICAvLyBjb250YWlucyBhdHRhY2htZW50c1xuICAgIHZhciByZXEgPSBhdHRTdG9yZS5jb3VudCgpO1xuICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGNvdW50ID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgaWYgKCFjb3VudCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTsgLy8gZG9uZVxuICAgICAgfVxuXG4gICAgICBzZXFTdG9yZS5vcGVuQ3Vyc29yKCkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGN1cnNvciA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTsgLy8gZG9uZVxuICAgICAgICB9XG4gICAgICAgIHZhciBkb2MgPSBjdXJzb3IudmFsdWU7XG4gICAgICAgIHZhciBzZXEgPSBjdXJzb3IucHJpbWFyeUtleTtcbiAgICAgICAgdmFyIGF0dHMgPSBPYmplY3Qua2V5cyhkb2MuX2F0dGFjaG1lbnRzIHx8IHt9KTtcbiAgICAgICAgdmFyIGRpZ2VzdE1hcCA9IHt9O1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGF0dHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgYXR0ID0gZG9jLl9hdHRhY2htZW50c1thdHRzW2pdXTtcbiAgICAgICAgICBkaWdlc3RNYXBbYXR0LmRpZ2VzdF0gPSB0cnVlOyAvLyB1bmlxIGRpZ2VzdHMsIGp1c3QgaW4gY2FzZVxuICAgICAgICB9XG4gICAgICAgIHZhciBkaWdlc3RzID0gT2JqZWN0LmtleXMoZGlnZXN0TWFwKTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGRpZ2VzdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgZGlnZXN0ID0gZGlnZXN0c1tqXTtcbiAgICAgICAgICBhdHRBbmRTZXFTdG9yZS5wdXQoe1xuICAgICAgICAgICAgc2VxOiBzZXEsXG4gICAgICAgICAgICBkaWdlc3RTZXE6IGRpZ2VzdCArICc6OicgKyBzZXFcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgIH07XG4gICAgfTtcbiAgfVxuXG4gIC8vIG1pZ3JhdGlvbiB0byB2ZXJzaW9uIDVcbiAgLy8gSW5zdGVhZCBvZiByZWx5aW5nIG9uIG9uLXRoZS1mbHkgbWlncmF0aW9uIG9mIG1ldGFkYXRhLFxuICAvLyB0aGlzIGJyaW5ncyB0aGUgZG9jLXN0b3JlIHRvIGl0cyBtb2Rlcm4gZm9ybTpcbiAgLy8gLSBtZXRhZGF0YS53aW5uaW5ncmV2XG4gIC8vIC0gbWV0YWRhdGEuc2VxXG4gIC8vIC0gc3RyaW5naWZ5IHRoZSBtZXRhZGF0YSB3aGVuIHN0b3JpbmcgaXRcbiAgZnVuY3Rpb24gbWlncmF0ZU1ldGFkYXRhKHR4bikge1xuXG4gICAgZnVuY3Rpb24gZGVjb2RlTWV0YWRhdGFDb21wYXQoc3RvcmVkT2JqZWN0KSB7XG4gICAgICBpZiAoIXN0b3JlZE9iamVjdC5kYXRhKSB7XG4gICAgICAgIC8vIG9sZCBmb3JtYXQsIHdoZW4gd2UgZGlkbid0IHN0b3JlIGl0IHN0cmluZ2lmaWVkXG4gICAgICAgIHN0b3JlZE9iamVjdC5kZWxldGVkID0gc3RvcmVkT2JqZWN0LmRlbGV0ZWRPckxvY2FsID09PSAnMSc7XG4gICAgICAgIHJldHVybiBzdG9yZWRPYmplY3Q7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVjb2RlTWV0YWRhdGEoc3RvcmVkT2JqZWN0KTtcbiAgICB9XG5cbiAgICAvLyBlbnN1cmUgdGhhdCBldmVyeSBtZXRhZGF0YSBoYXMgYSB3aW5uaW5nUmV2IGFuZCBzZXEsXG4gICAgLy8gd2hpY2ggd2FzIHByZXZpb3VzbHkgY3JlYXRlZCBvbi10aGUtZmx5IGJ1dCBiZXR0ZXIgdG8gbWlncmF0ZVxuICAgIHZhciBieVNlcVN0b3JlID0gdHhuLm9iamVjdFN0b3JlKEJZX1NFUV9TVE9SRSk7XG4gICAgdmFyIGRvY1N0b3JlID0gdHhuLm9iamVjdFN0b3JlKERPQ19TVE9SRSk7XG4gICAgdmFyIGN1cnNvciA9IGRvY1N0b3JlLm9wZW5DdXJzb3IoKTtcbiAgICBjdXJzb3Iub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICByZXR1cm47IC8vIGRvbmVcbiAgICAgIH1cbiAgICAgIHZhciBtZXRhZGF0YSA9IGRlY29kZU1ldGFkYXRhQ29tcGF0KGN1cnNvci52YWx1ZSk7XG5cbiAgICAgIG1ldGFkYXRhLndpbm5pbmdSZXYgPSBtZXRhZGF0YS53aW5uaW5nUmV2IHx8XG4gICAgICAgIHdpbm5pbmdSZXYobWV0YWRhdGEpO1xuXG4gICAgICBmdW5jdGlvbiBmZXRjaE1ldGFkYXRhU2VxKCkge1xuICAgICAgICAvLyBtZXRhZGF0YS5zZXEgd2FzIGFkZGVkIHBvc3QtMy4yLjAsIHNvIGlmIGl0J3MgbWlzc2luZyxcbiAgICAgICAgLy8gd2UgbmVlZCB0byBmZXRjaCBpdCBtYW51YWxseVxuICAgICAgICB2YXIgc3RhcnQgPSBtZXRhZGF0YS5pZCArICc6Oic7XG4gICAgICAgIHZhciBlbmQgPSBtZXRhZGF0YS5pZCArICc6OlxcdWZmZmYnO1xuICAgICAgICB2YXIgcmVxID0gYnlTZXFTdG9yZS5pbmRleCgnX2RvY19pZF9yZXYnKS5vcGVuQ3Vyc29yKFxuICAgICAgICAgIElEQktleVJhbmdlLmJvdW5kKHN0YXJ0LCBlbmQpKTtcblxuICAgICAgICB2YXIgbWV0YWRhdGFTZXEgPSAwO1xuICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgY3Vyc29yID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICBtZXRhZGF0YS5zZXEgPSBtZXRhZGF0YVNlcTtcbiAgICAgICAgICAgIHJldHVybiBvbkdldE1ldGFkYXRhU2VxKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzZXEgPSBjdXJzb3IucHJpbWFyeUtleTtcbiAgICAgICAgICBpZiAoc2VxID4gbWV0YWRhdGFTZXEpIHtcbiAgICAgICAgICAgIG1ldGFkYXRhU2VxID0gc2VxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25HZXRNZXRhZGF0YVNlcSgpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhVG9TdG9yZSA9IGVuY29kZU1ldGFkYXRhKG1ldGFkYXRhLFxuICAgICAgICAgIG1ldGFkYXRhLndpbm5pbmdSZXYsIG1ldGFkYXRhLmRlbGV0ZWQpO1xuXG4gICAgICAgIHZhciByZXEgPSBkb2NTdG9yZS5wdXQobWV0YWRhdGFUb1N0b3JlKTtcbiAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKG1ldGFkYXRhLnNlcSkge1xuICAgICAgICByZXR1cm4gb25HZXRNZXRhZGF0YVNlcSgpO1xuICAgICAgfVxuXG4gICAgICBmZXRjaE1ldGFkYXRhU2VxKCk7XG4gICAgfTtcblxuICB9XG5cbiAgYXBpLnR5cGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICdpZGInO1xuICB9O1xuXG4gIGFwaS5faWQgPSB0b1Byb21pc2UoZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgYXBpLl9tZXRhLmluc3RhbmNlSWQpO1xuICB9KTtcblxuICBhcGkuX2J1bGtEb2NzID0gZnVuY3Rpb24gaWRiX2J1bGtEb2NzKHJlcSwgcmVxT3B0cywgY2FsbGJhY2spIHtcbiAgICBpZGJCdWxrRG9jcyhvcHRzLCByZXEsIHJlcU9wdHMsIGFwaSwgaWRiLCBpZGJDaGFuZ2VzLCBjYWxsYmFjayk7XG4gIH07XG5cbiAgLy8gRmlyc3Qgd2UgbG9vayB1cCB0aGUgbWV0YWRhdGEgaW4gdGhlIGlkcyBkYXRhYmFzZSwgdGhlbiB3ZSBmZXRjaCB0aGVcbiAgLy8gY3VycmVudCByZXZpc2lvbihzKSBmcm9tIHRoZSBieSBzZXF1ZW5jZSBzdG9yZVxuICBhcGkuX2dldCA9IGZ1bmN0aW9uIGlkYl9nZXQoaWQsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGRvYztcbiAgICB2YXIgbWV0YWRhdGE7XG4gICAgdmFyIGVycjtcbiAgICB2YXIgdHhuID0gb3B0cy5jdHg7XG4gICAgaWYgKCF0eG4pIHtcbiAgICAgIHZhciB0eG5SZXN1bHQgPSBvcGVuVHJhbnNhY3Rpb25TYWZlbHkoaWRiLFxuICAgICAgICBbRE9DX1NUT1JFLCBCWV9TRVFfU1RPUkUsIEFUVEFDSF9TVE9SRV0sICdyZWFkb25seScpO1xuICAgICAgaWYgKHR4blJlc3VsdC5lcnJvcikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sodHhuUmVzdWx0LmVycm9yKTtcbiAgICAgIH1cbiAgICAgIHR4biA9IHR4blJlc3VsdC50eG47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgY2FsbGJhY2soZXJyLCB7ZG9jOiBkb2MsIG1ldGFkYXRhOiBtZXRhZGF0YSwgY3R4OiB0eG59KTtcbiAgICB9XG5cbiAgICB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKS5nZXQoaWQpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICBtZXRhZGF0YSA9IGRlY29kZU1ldGFkYXRhKGUudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAvLyB3ZSBjYW4gZGV0ZXJtaW5lIHRoZSByZXN1bHQgaGVyZSBpZjpcbiAgICAgIC8vIDEuIHRoZXJlIGlzIG5vIHN1Y2ggZG9jdW1lbnRcbiAgICAgIC8vIDIuIHRoZSBkb2N1bWVudCBpcyBkZWxldGVkIGFuZCB3ZSBkb24ndCBhc2sgYWJvdXQgc3BlY2lmaWMgcmV2XG4gICAgICAvLyBXaGVuIHdlIGFzayB3aXRoIG9wdHMucmV2IHdlIGV4cGVjdCB0aGUgYW5zd2VyIHRvIGJlIGVpdGhlclxuICAgICAgLy8gZG9jIChwb3NzaWJseSB3aXRoIF9kZWxldGVkPXRydWUpIG9yIG1pc3NpbmcgZXJyb3JcbiAgICAgIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgZXJyID0gY3JlYXRlRXJyb3IoTUlTU0lOR19ET0MsICdtaXNzaW5nJyk7XG4gICAgICAgIHJldHVybiBmaW5pc2goKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0RlbGV0ZWQobWV0YWRhdGEpICYmICFvcHRzLnJldikge1xuICAgICAgICBlcnIgPSBjcmVhdGVFcnJvcihNSVNTSU5HX0RPQywgXCJkZWxldGVkXCIpO1xuICAgICAgICByZXR1cm4gZmluaXNoKCk7XG4gICAgICB9XG4gICAgICB2YXIgb2JqZWN0U3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoQllfU0VRX1NUT1JFKTtcblxuICAgICAgdmFyIHJldiA9IG9wdHMucmV2IHx8IG1ldGFkYXRhLndpbm5pbmdSZXY7XG4gICAgICB2YXIga2V5ID0gbWV0YWRhdGEuaWQgKyAnOjonICsgcmV2O1xuXG4gICAgICBvYmplY3RTdG9yZS5pbmRleCgnX2RvY19pZF9yZXYnKS5nZXQoa2V5KS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBkb2MgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgICBkb2MgPSBkZWNvZGVEb2MoZG9jKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRvYykge1xuICAgICAgICAgIGVyciA9IGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DLCAnbWlzc2luZycpO1xuICAgICAgICAgIHJldHVybiBmaW5pc2goKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5pc2goKTtcbiAgICAgIH07XG4gICAgfTtcbiAgfTtcblxuICBhcGkuX2dldEF0dGFjaG1lbnQgPSBmdW5jdGlvbiAoZG9jSWQsIGF0dGFjaElkLCBhdHRhY2htZW50LCBvcHRzLCBjYWxsYmFjaykge1xuICAgIHZhciB0eG47XG4gICAgaWYgKG9wdHMuY3R4KSB7XG4gICAgICB0eG4gPSBvcHRzLmN0eDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHR4blJlc3VsdCA9IG9wZW5UcmFuc2FjdGlvblNhZmVseShpZGIsXG4gICAgICAgIFtET0NfU1RPUkUsIEJZX1NFUV9TVE9SRSwgQVRUQUNIX1NUT1JFXSwgJ3JlYWRvbmx5Jyk7XG4gICAgICBpZiAodHhuUmVzdWx0LmVycm9yKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh0eG5SZXN1bHQuZXJyb3IpO1xuICAgICAgfVxuICAgICAgdHhuID0gdHhuUmVzdWx0LnR4bjtcbiAgICB9XG4gICAgdmFyIGRpZ2VzdCA9IGF0dGFjaG1lbnQuZGlnZXN0O1xuICAgIHZhciB0eXBlID0gYXR0YWNobWVudC5jb250ZW50X3R5cGU7XG5cbiAgICB0eG4ub2JqZWN0U3RvcmUoQVRUQUNIX1NUT1JFKS5nZXQoZGlnZXN0KS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGJvZHkgPSBlLnRhcmdldC5yZXN1bHQuYm9keTtcbiAgICAgIHJlYWRCbG9iRGF0YShib2R5LCB0eXBlLCBvcHRzLmJpbmFyeSwgZnVuY3Rpb24gKGJsb2JEYXRhKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGJsb2JEYXRhKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgYXBpLl9pbmZvID0gZnVuY3Rpb24gaWRiX2luZm8oY2FsbGJhY2spIHtcblxuICAgIGlmIChpZGIgPT09IG51bGwgfHwgIWNhY2hlZERCcy5oYXMoZGJOYW1lKSkge1xuICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKCdkYiBpc25cXCd0IG9wZW4nKTtcbiAgICAgIGVycm9yLmlkID0gJ2lkYk51bGwnO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gICAgdmFyIHVwZGF0ZVNlcTtcbiAgICB2YXIgZG9jQ291bnQ7XG5cbiAgICB2YXIgdHhuUmVzdWx0ID0gb3BlblRyYW5zYWN0aW9uU2FmZWx5KGlkYiwgW0JZX1NFUV9TVE9SRV0sICdyZWFkb25seScpO1xuICAgIGlmICh0eG5SZXN1bHQuZXJyb3IpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayh0eG5SZXN1bHQuZXJyb3IpO1xuICAgIH1cbiAgICB2YXIgdHhuID0gdHhuUmVzdWx0LnR4bjtcbiAgICB2YXIgY3Vyc29yID0gdHhuLm9iamVjdFN0b3JlKEJZX1NFUV9TVE9SRSkub3BlbkN1cnNvcihudWxsLCAncHJldicpO1xuICAgIGN1cnNvci5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHZhciBjdXJzb3IgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgdXBkYXRlU2VxID0gY3Vyc29yID8gY3Vyc29yLmtleSA6IDA7XG4gICAgICAvLyBjb3VudCB3aXRoaW4gdGhlIHNhbWUgdHhuIGZvciBjb25zaXN0ZW5jeVxuICAgICAgZG9jQ291bnQgPSBhcGkuX21ldGEuZG9jQ291bnQ7XG4gICAgfTtcblxuICAgIHR4bi5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICBkb2NfY291bnQ6IGRvY0NvdW50LFxuICAgICAgICB1cGRhdGVfc2VxOiB1cGRhdGVTZXEsXG4gICAgICAgIC8vIGZvciBkZWJ1Z2dpbmdcbiAgICAgICAgaWRiX2F0dGFjaG1lbnRfZm9ybWF0OiAoYXBpLl9tZXRhLmJsb2JTdXBwb3J0ID8gJ2JpbmFyeScgOiAnYmFzZTY0JylcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgYXBpLl9hbGxEb2NzID0gZnVuY3Rpb24gaWRiX2FsbERvY3Mob3B0cywgY2FsbGJhY2spIHtcbiAgICBpZGJBbGxEb2NzKG9wdHMsIGFwaSwgaWRiLCBjYWxsYmFjayk7XG4gIH07XG5cbiAgYXBpLl9jaGFuZ2VzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgICBvcHRzID0gY2xvbmUob3B0cyk7XG5cbiAgICBpZiAob3B0cy5jb250aW51b3VzKSB7XG4gICAgICB2YXIgaWQgPSBkYk5hbWUgKyAnOicgKyB1dWlkKCk7XG4gICAgICBpZGJDaGFuZ2VzLmFkZExpc3RlbmVyKGRiTmFtZSwgaWQsIGFwaSwgb3B0cyk7XG4gICAgICBpZGJDaGFuZ2VzLm5vdGlmeShkYk5hbWUpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2FuY2VsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWRiQ2hhbmdlcy5yZW1vdmVMaXN0ZW5lcihkYk5hbWUsIGlkKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgZG9jSWRzID0gb3B0cy5kb2NfaWRzICYmIG5ldyBfU2V0KG9wdHMuZG9jX2lkcyk7XG5cbiAgICBvcHRzLnNpbmNlID0gb3B0cy5zaW5jZSB8fCAwO1xuICAgIHZhciBsYXN0U2VxID0gb3B0cy5zaW5jZTtcblxuICAgIHZhciBsaW1pdCA9ICdsaW1pdCcgaW4gb3B0cyA/IG9wdHMubGltaXQgOiAtMTtcbiAgICBpZiAobGltaXQgPT09IDApIHtcbiAgICAgIGxpbWl0ID0gMTsgLy8gcGVyIENvdWNoREIgX2NoYW5nZXMgc3BlY1xuICAgIH1cbiAgICB2YXIgcmV0dXJuRG9jcztcbiAgICBpZiAoJ3JldHVybl9kb2NzJyBpbiBvcHRzKSB7XG4gICAgICByZXR1cm5Eb2NzID0gb3B0cy5yZXR1cm5fZG9jcztcbiAgICB9IGVsc2UgaWYgKCdyZXR1cm5Eb2NzJyBpbiBvcHRzKSB7XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgJ3JldHVybkRvY3MnIGluIGZhdm9yIG9mICdyZXR1cm5fZG9jcycgaW4gYSBmdXR1cmUgcmVsZWFzZVxuICAgICAgcmV0dXJuRG9jcyA9IG9wdHMucmV0dXJuRG9jcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuRG9jcyA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgbnVtUmVzdWx0cyA9IDA7XG4gICAgdmFyIGZpbHRlciA9IGZpbHRlckNoYW5nZShvcHRzKTtcbiAgICB2YXIgZG9jSWRzVG9NZXRhZGF0YSA9IG5ldyBfTWFwKCk7XG5cbiAgICB2YXIgdHhuO1xuICAgIHZhciBieVNlcVN0b3JlO1xuICAgIHZhciBkb2NTdG9yZTtcbiAgICB2YXIgZG9jSWRSZXZJbmRleDtcblxuICAgIGZ1bmN0aW9uIG9uR2V0Q3Vyc29yKGN1cnNvcikge1xuXG4gICAgICB2YXIgZG9jID0gZGVjb2RlRG9jKGN1cnNvci52YWx1ZSk7XG4gICAgICB2YXIgc2VxID0gY3Vyc29yLmtleTtcblxuICAgICAgaWYgKGRvY0lkcyAmJiAhZG9jSWRzLmhhcyhkb2MuX2lkKSkge1xuICAgICAgICByZXR1cm4gY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICB9XG5cbiAgICAgIHZhciBtZXRhZGF0YTtcblxuICAgICAgZnVuY3Rpb24gb25HZXRNZXRhZGF0YSgpIHtcbiAgICAgICAgaWYgKG1ldGFkYXRhLnNlcSAhPT0gc2VxKSB7XG4gICAgICAgICAgLy8gc29tZSBvdGhlciBzZXEgaXMgbGF0ZXJcbiAgICAgICAgICByZXR1cm4gY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0U2VxID0gc2VxO1xuXG4gICAgICAgIGlmIChtZXRhZGF0YS53aW5uaW5nUmV2ID09PSBkb2MuX3Jldikge1xuICAgICAgICAgIHJldHVybiBvbkdldFdpbm5pbmdEb2MoZG9jKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZldGNoV2lubmluZ0RvYygpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBmZXRjaFdpbm5pbmdEb2MoKSB7XG4gICAgICAgIHZhciBkb2NJZFJldiA9IGRvYy5faWQgKyAnOjonICsgbWV0YWRhdGEud2lubmluZ1JldjtcbiAgICAgICAgdmFyIHJlcSA9IGRvY0lkUmV2SW5kZXguZ2V0KGRvY0lkUmV2KTtcbiAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgb25HZXRXaW5uaW5nRG9jKGRlY29kZURvYyhlLnRhcmdldC5yZXN1bHQpKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gb25HZXRXaW5uaW5nRG9jKHdpbm5pbmdEb2MpIHtcblxuICAgICAgICB2YXIgY2hhbmdlID0gb3B0cy5wcm9jZXNzQ2hhbmdlKHdpbm5pbmdEb2MsIG1ldGFkYXRhLCBvcHRzKTtcbiAgICAgICAgY2hhbmdlLnNlcSA9IG1ldGFkYXRhLnNlcTtcblxuICAgICAgICB2YXIgZmlsdGVyZWQgPSBmaWx0ZXIoY2hhbmdlKTtcbiAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXJlZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICByZXR1cm4gb3B0cy5jb21wbGV0ZShmaWx0ZXJlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsdGVyZWQpIHtcbiAgICAgICAgICBudW1SZXN1bHRzKys7XG4gICAgICAgICAgaWYgKHJldHVybkRvY3MpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChjaGFuZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBwcm9jZXNzIHRoZSBhdHRhY2htZW50IGltbWVkaWF0ZWx5XG4gICAgICAgICAgLy8gZm9yIHRoZSBiZW5lZml0IG9mIGxpdmUgbGlzdGVuZXJzXG4gICAgICAgICAgaWYgKG9wdHMuYXR0YWNobWVudHMgJiYgb3B0cy5pbmNsdWRlX2RvY3MpIHtcbiAgICAgICAgICAgIGZldGNoQXR0YWNobWVudHNJZk5lY2Vzc2FyeSh3aW5uaW5nRG9jLCBvcHRzLCB0eG4sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgcG9zdFByb2Nlc3NBdHRhY2htZW50cyhbY2hhbmdlXSwgb3B0cy5iaW5hcnkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG9wdHMub25DaGFuZ2UoY2hhbmdlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0cy5vbkNoYW5nZShjaGFuZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobnVtUmVzdWx0cyAhPT0gbGltaXQpIHtcbiAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtZXRhZGF0YSA9IGRvY0lkc1RvTWV0YWRhdGEuZ2V0KGRvYy5faWQpO1xuICAgICAgaWYgKG1ldGFkYXRhKSB7IC8vIGNhY2hlZFxuICAgICAgICByZXR1cm4gb25HZXRNZXRhZGF0YSgpO1xuICAgICAgfVxuICAgICAgLy8gbWV0YWRhdGEgbm90IGNhY2hlZCwgaGF2ZSB0byBnbyBmZXRjaCBpdFxuICAgICAgZG9jU3RvcmUuZ2V0KGRvYy5faWQpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBtZXRhZGF0YSA9IGRlY29kZU1ldGFkYXRhKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICBkb2NJZHNUb01ldGFkYXRhLnNldChkb2MuX2lkLCBtZXRhZGF0YSk7XG4gICAgICAgIG9uR2V0TWV0YWRhdGEoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25zdWNjZXNzKGV2ZW50KSB7XG4gICAgICB2YXIgY3Vyc29yID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgb25HZXRDdXJzb3IoY3Vyc29yKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmZXRjaENoYW5nZXMoKSB7XG4gICAgICB2YXIgb2JqZWN0U3RvcmVzID0gW0RPQ19TVE9SRSwgQllfU0VRX1NUT1JFXTtcbiAgICAgIGlmIChvcHRzLmF0dGFjaG1lbnRzKSB7XG4gICAgICAgIG9iamVjdFN0b3Jlcy5wdXNoKEFUVEFDSF9TVE9SRSk7XG4gICAgICB9XG4gICAgICB2YXIgdHhuUmVzdWx0ID0gb3BlblRyYW5zYWN0aW9uU2FmZWx5KGlkYiwgb2JqZWN0U3RvcmVzLCAncmVhZG9ubHknKTtcbiAgICAgIGlmICh0eG5SZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG9wdHMuY29tcGxldGUodHhuUmVzdWx0LmVycm9yKTtcbiAgICAgIH1cbiAgICAgIHR4biA9IHR4blJlc3VsdC50eG47XG4gICAgICB0eG4ub25hYm9ydCA9IGlkYkVycm9yKG9wdHMuY29tcGxldGUpO1xuICAgICAgdHhuLm9uY29tcGxldGUgPSBvblR4bkNvbXBsZXRlO1xuXG4gICAgICBieVNlcVN0b3JlID0gdHhuLm9iamVjdFN0b3JlKEJZX1NFUV9TVE9SRSk7XG4gICAgICBkb2NTdG9yZSA9IHR4bi5vYmplY3RTdG9yZShET0NfU1RPUkUpO1xuICAgICAgZG9jSWRSZXZJbmRleCA9IGJ5U2VxU3RvcmUuaW5kZXgoJ19kb2NfaWRfcmV2Jyk7XG5cbiAgICAgIHZhciByZXE7XG5cbiAgICAgIGlmIChvcHRzLmRlc2NlbmRpbmcpIHtcbiAgICAgICAgcmVxID0gYnlTZXFTdG9yZS5vcGVuQ3Vyc29yKG51bGwsICdwcmV2Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEgPSBieVNlcVN0b3JlLm9wZW5DdXJzb3IoSURCS2V5UmFuZ2UubG93ZXJCb3VuZChvcHRzLnNpbmNlLCB0cnVlKSk7XG4gICAgICB9XG5cbiAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBvbnN1Y2Nlc3M7XG4gICAgfVxuXG4gICAgZmV0Y2hDaGFuZ2VzKCk7XG5cbiAgICBmdW5jdGlvbiBvblR4bkNvbXBsZXRlKCkge1xuXG4gICAgICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgICAgIG9wdHMuY29tcGxldGUobnVsbCwge1xuICAgICAgICAgIHJlc3VsdHM6IHJlc3VsdHMsXG4gICAgICAgICAgbGFzdF9zZXE6IGxhc3RTZXFcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0cy5jb250aW51b3VzICYmIG9wdHMuYXR0YWNobWVudHMpIHtcbiAgICAgICAgLy8gY2Fubm90IGd1YXJhbnRlZSB0aGF0IHBvc3RQcm9jZXNzaW5nIHdhcyBhbHJlYWR5IGRvbmUsXG4gICAgICAgIC8vIHNvIGRvIGl0IGFnYWluXG4gICAgICAgIHBvc3RQcm9jZXNzQXR0YWNobWVudHMocmVzdWx0cykudGhlbihmaW5pc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluaXNoKCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGFwaS5fY2xvc2UgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBpZiAoaWRiID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoTk9UX09QRU4pKTtcbiAgICB9XG5cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0luZGV4ZWREQi9JREJEYXRhYmFzZSNjbG9zZVxuICAgIC8vIFwiUmV0dXJucyBpbW1lZGlhdGVseSBhbmQgY2xvc2VzIHRoZSBjb25uZWN0aW9uIGluIGEgc2VwYXJhdGUgdGhyZWFkLi4uXCJcbiAgICBpZGIuY2xvc2UoKTtcbiAgICBjYWNoZWREQnMuZGVsZXRlKGRiTmFtZSk7XG4gICAgaWRiID0gbnVsbDtcbiAgICBjYWxsYmFjaygpO1xuICB9O1xuXG4gIGFwaS5fZ2V0UmV2aXNpb25UcmVlID0gZnVuY3Rpb24gKGRvY0lkLCBjYWxsYmFjaykge1xuICAgIHZhciB0eG5SZXN1bHQgPSBvcGVuVHJhbnNhY3Rpb25TYWZlbHkoaWRiLCBbRE9DX1NUT1JFXSwgJ3JlYWRvbmx5Jyk7XG4gICAgaWYgKHR4blJlc3VsdC5lcnJvcikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHR4blJlc3VsdC5lcnJvcik7XG4gICAgfVxuICAgIHZhciB0eG4gPSB0eG5SZXN1bHQudHhuO1xuICAgIHZhciByZXEgPSB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKS5nZXQoZG9jSWQpO1xuICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIHZhciBkb2MgPSBkZWNvZGVNZXRhZGF0YShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIGlmICghZG9jKSB7XG4gICAgICAgIGNhbGxiYWNrKGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayhudWxsLCBkb2MucmV2X3RyZWUpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gVGhpcyBmdW5jdGlvbiByZW1vdmVzIHJldmlzaW9ucyBvZiBkb2N1bWVudCBkb2NJZFxuICAvLyB3aGljaCBhcmUgbGlzdGVkIGluIHJldnMgYW5kIHNldHMgdGhpcyBkb2N1bWVudFxuICAvLyByZXZpc2lvbiB0byB0byByZXZfdHJlZVxuICBhcGkuX2RvQ29tcGFjdGlvbiA9IGZ1bmN0aW9uIChkb2NJZCwgcmV2cywgY2FsbGJhY2spIHtcbiAgICB2YXIgc3RvcmVzID0gW1xuICAgICAgRE9DX1NUT1JFLFxuICAgICAgQllfU0VRX1NUT1JFLFxuICAgICAgQVRUQUNIX1NUT1JFLFxuICAgICAgQVRUQUNIX0FORF9TRVFfU1RPUkVcbiAgICBdO1xuICAgIHZhciB0eG5SZXN1bHQgPSBvcGVuVHJhbnNhY3Rpb25TYWZlbHkoaWRiLCBzdG9yZXMsICdyZWFkd3JpdGUnKTtcbiAgICBpZiAodHhuUmVzdWx0LmVycm9yKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2sodHhuUmVzdWx0LmVycm9yKTtcbiAgICB9XG4gICAgdmFyIHR4biA9IHR4blJlc3VsdC50eG47XG5cbiAgICB2YXIgZG9jU3RvcmUgPSB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKTtcblxuICAgIGRvY1N0b3JlLmdldChkb2NJZCkub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICB2YXIgbWV0YWRhdGEgPSBkZWNvZGVNZXRhZGF0YShldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgIHRyYXZlcnNlUmV2VHJlZShtZXRhZGF0YS5yZXZfdHJlZSwgZnVuY3Rpb24gKGlzTGVhZiwgcG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2SGFzaCwgY3R4LCBvcHRzKSB7XG4gICAgICAgIHZhciByZXYgPSBwb3MgKyAnLScgKyByZXZIYXNoO1xuICAgICAgICBpZiAocmV2cy5pbmRleE9mKHJldikgIT09IC0xKSB7XG4gICAgICAgICAgb3B0cy5zdGF0dXMgPSAnbWlzc2luZyc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY29tcGFjdFJldnMocmV2cywgZG9jSWQsIHR4bik7XG4gICAgICB2YXIgd2lubmluZ1JldiA9IG1ldGFkYXRhLndpbm5pbmdSZXY7XG4gICAgICB2YXIgZGVsZXRlZCA9IG1ldGFkYXRhLmRlbGV0ZWQ7XG4gICAgICB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKS5wdXQoXG4gICAgICAgIGVuY29kZU1ldGFkYXRhKG1ldGFkYXRhLCB3aW5uaW5nUmV2LCBkZWxldGVkKSk7XG4gICAgfTtcbiAgICB0eG4ub25hYm9ydCA9IGlkYkVycm9yKGNhbGxiYWNrKTtcbiAgICB0eG4ub25jb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfTtcbiAgfTtcblxuXG4gIGFwaS5fZ2V0TG9jYWwgPSBmdW5jdGlvbiAoaWQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHR4blJlc3VsdCA9IG9wZW5UcmFuc2FjdGlvblNhZmVseShpZGIsIFtMT0NBTF9TVE9SRV0sICdyZWFkb25seScpO1xuICAgIGlmICh0eG5SZXN1bHQuZXJyb3IpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayh0eG5SZXN1bHQuZXJyb3IpO1xuICAgIH1cbiAgICB2YXIgdHggPSB0eG5SZXN1bHQudHhuO1xuICAgIHZhciByZXEgPSB0eC5vYmplY3RTdG9yZShMT0NBTF9TVE9SRSkuZ2V0KGlkKTtcblxuICAgIHJlcS5vbmVycm9yID0gaWRiRXJyb3IoY2FsbGJhY2spO1xuICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGRvYyA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICAgIGlmICghZG9jKSB7XG4gICAgICAgIGNhbGxiYWNrKGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgZG9jWydfZG9jX2lkX3JldiddOyAvLyBmb3IgYmFja3dhcmRzIGNvbXBhdFxuICAgICAgICBjYWxsYmFjayhudWxsLCBkb2MpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgYXBpLl9wdXRMb2NhbCA9IGZ1bmN0aW9uIChkb2MsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIGRlbGV0ZSBkb2MuX3JldmlzaW9uczsgLy8gaWdub3JlIHRoaXMsIHRydXN0IHRoZSByZXZcbiAgICB2YXIgb2xkUmV2ID0gZG9jLl9yZXY7XG4gICAgdmFyIGlkID0gZG9jLl9pZDtcbiAgICBpZiAoIW9sZFJldikge1xuICAgICAgZG9jLl9yZXYgPSAnMC0xJztcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jLl9yZXYgPSAnMC0nICsgKHBhcnNlSW50KG9sZFJldi5zcGxpdCgnLScpWzFdLCAxMCkgKyAxKTtcbiAgICB9XG5cbiAgICB2YXIgdHggPSBvcHRzLmN0eDtcbiAgICB2YXIgcmV0O1xuICAgIGlmICghdHgpIHtcbiAgICAgIHZhciB0eG5SZXN1bHQgPSBvcGVuVHJhbnNhY3Rpb25TYWZlbHkoaWRiLCBbTE9DQUxfU1RPUkVdLCAncmVhZHdyaXRlJyk7XG4gICAgICBpZiAodHhuUmVzdWx0LmVycm9yKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh0eG5SZXN1bHQuZXJyb3IpO1xuICAgICAgfVxuICAgICAgdHggPSB0eG5SZXN1bHQudHhuO1xuICAgICAgdHgub25lcnJvciA9IGlkYkVycm9yKGNhbGxiYWNrKTtcbiAgICAgIHR4Lm9uY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBvU3RvcmUgPSB0eC5vYmplY3RTdG9yZShMT0NBTF9TVE9SRSk7XG4gICAgdmFyIHJlcTtcbiAgICBpZiAob2xkUmV2KSB7XG4gICAgICByZXEgPSBvU3RvcmUuZ2V0KGlkKTtcbiAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb2xkRG9jID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgICBpZiAoIW9sZERvYyB8fCBvbGREb2MuX3JldiAhPT0gb2xkUmV2KSB7XG4gICAgICAgICAgY2FsbGJhY2soY3JlYXRlRXJyb3IoUkVWX0NPTkZMSUNUKSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIHVwZGF0ZVxuICAgICAgICAgIHZhciByZXEgPSBvU3RvcmUucHV0KGRvYyk7XG4gICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldCA9IHtvazogdHJ1ZSwgaWQ6IGRvYy5faWQsIHJldjogZG9jLl9yZXZ9O1xuICAgICAgICAgICAgaWYgKG9wdHMuY3R4KSB7IC8vIHJldHVybiBpbW1lZGlhdGVseVxuICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBlbHNlIHsgLy8gbmV3IGRvY1xuICAgICAgcmVxID0gb1N0b3JlLmFkZChkb2MpO1xuICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAvLyBjb25zdHJhaW50IGVycm9yLCBhbHJlYWR5IGV4aXN0c1xuICAgICAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihSRVZfQ09ORkxJQ1QpKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBhdm9pZCB0cmFuc2FjdGlvbiBhYm9ydFxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpOyAvLyBhdm9pZCB0cmFuc2FjdGlvbiBvbmVycm9yXG4gICAgICB9O1xuICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0ID0ge29rOiB0cnVlLCBpZDogZG9jLl9pZCwgcmV2OiBkb2MuX3Jldn07XG4gICAgICAgIGlmIChvcHRzLmN0eCkgeyAvLyByZXR1cm4gaW1tZWRpYXRlbHlcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcblxuICBhcGkuX3JlbW92ZUxvY2FsID0gZnVuY3Rpb24gKGRvYywgb3B0cywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHR4ID0gb3B0cy5jdHg7XG4gICAgaWYgKCF0eCkge1xuICAgICAgdmFyIHR4blJlc3VsdCA9IG9wZW5UcmFuc2FjdGlvblNhZmVseShpZGIsIFtMT0NBTF9TVE9SRV0sICdyZWFkd3JpdGUnKTtcbiAgICAgIGlmICh0eG5SZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHR4blJlc3VsdC5lcnJvcik7XG4gICAgICB9XG4gICAgICB0eCA9IHR4blJlc3VsdC50eG47XG4gICAgICB0eC5vbmNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAocmV0KSB7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV0KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHJldDtcbiAgICB2YXIgaWQgPSBkb2MuX2lkO1xuICAgIHZhciBvU3RvcmUgPSB0eC5vYmplY3RTdG9yZShMT0NBTF9TVE9SRSk7XG4gICAgdmFyIHJlcSA9IG9TdG9yZS5nZXQoaWQpO1xuXG4gICAgcmVxLm9uZXJyb3IgPSBpZGJFcnJvcihjYWxsYmFjayk7XG4gICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgb2xkRG9jID0gZS50YXJnZXQucmVzdWx0O1xuICAgICAgaWYgKCFvbGREb2MgfHwgb2xkRG9jLl9yZXYgIT09IGRvYy5fcmV2KSB7XG4gICAgICAgIGNhbGxiYWNrKGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvU3RvcmUuZGVsZXRlKGlkKTtcbiAgICAgICAgcmV0ID0ge29rOiB0cnVlLCBpZDogaWQsIHJldjogJzAtMCd9O1xuICAgICAgICBpZiAob3B0cy5jdHgpIHsgLy8gcmV0dXJuIGltbWVkaWF0ZWx5XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgYXBpLl9kZXN0cm95ID0gZnVuY3Rpb24gKG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgaWRiQ2hhbmdlcy5yZW1vdmVBbGxMaXN0ZW5lcnMoZGJOYW1lKTtcblxuICAgIC8vQ2xvc2Ugb3BlbiByZXF1ZXN0IGZvciBcImRiTmFtZVwiIGRhdGFiYXNlIHRvIGZpeCBpZSBkZWxheS5cbiAgICB2YXIgb3BlblJlcSA9IG9wZW5SZXFMaXN0LmdldChkYk5hbWUpO1xuICAgIGlmIChvcGVuUmVxICYmIG9wZW5SZXEucmVzdWx0KSB7XG4gICAgICBvcGVuUmVxLnJlc3VsdC5jbG9zZSgpO1xuICAgICAgY2FjaGVkREJzLmRlbGV0ZShkYk5hbWUpO1xuICAgIH1cbiAgICB2YXIgcmVxID0gaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7XG5cbiAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy9SZW1vdmUgb3BlbiByZXF1ZXN0IGZyb20gdGhlIGxpc3QuXG4gICAgICBvcGVuUmVxTGlzdC5kZWxldGUoZGJOYW1lKTtcbiAgICAgIGlmIChoYXNMb2NhbFN0b3JhZ2UoKSAmJiAoZGJOYW1lIGluIGxvY2FsU3RvcmFnZSkpIHtcbiAgICAgICAgZGVsZXRlIGxvY2FsU3RvcmFnZVtkYk5hbWVdO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgeyAnb2snOiB0cnVlIH0pO1xuICAgIH07XG5cbiAgICByZXEub25lcnJvciA9IGlkYkVycm9yKGNhbGxiYWNrKTtcbiAgfTtcblxuICB2YXIgY2FjaGVkID0gY2FjaGVkREJzLmdldChkYk5hbWUpO1xuXG4gIGlmIChjYWNoZWQpIHtcbiAgICBpZGIgPSBjYWNoZWQuaWRiO1xuICAgIGFwaS5fbWV0YSA9IGNhY2hlZC5nbG9iYWw7XG4gICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBhcGkpO1xuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciByZXE7XG4gIGlmIChvcHRzLnN0b3JhZ2UpIHtcbiAgICByZXEgPSB0cnlTdG9yYWdlT3B0aW9uKGRiTmFtZSwgb3B0cy5zdG9yYWdlKTtcbiAgfSBlbHNlIHtcbiAgICByZXEgPSBpbmRleGVkREIub3BlbihkYk5hbWUsIEFEQVBURVJfVkVSU0lPTik7XG4gIH1cblxuICBvcGVuUmVxTGlzdC5zZXQoZGJOYW1lLCByZXEpO1xuXG4gIHJlcS5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBkYiA9IGUudGFyZ2V0LnJlc3VsdDtcbiAgICBpZiAoZS5vbGRWZXJzaW9uIDwgMSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVNjaGVtYShkYik7IC8vIG5ldyBkYiwgaW5pdGlhbCBzY2hlbWFcbiAgICB9XG4gICAgLy8gZG8gbWlncmF0aW9uc1xuXG4gICAgdmFyIHR4biA9IGUuY3VycmVudFRhcmdldC50cmFuc2FjdGlvbjtcbiAgICAvLyB0aGVzZSBtaWdyYXRpb25zIGhhdmUgdG8gYmUgZG9uZSBpbiB0aGlzIGZ1bmN0aW9uLCBiZWZvcmVcbiAgICAvLyBjb250cm9sIGlzIHJldHVybmVkIHRvIHRoZSBldmVudCBsb29wLCBiZWNhdXNlIEluZGV4ZWREQlxuXG4gICAgaWYgKGUub2xkVmVyc2lvbiA8IDMpIHtcbiAgICAgIGNyZWF0ZUxvY2FsU3RvcmVTY2hlbWEoZGIpOyAvLyB2MiAtPiB2M1xuICAgIH1cbiAgICBpZiAoZS5vbGRWZXJzaW9uIDwgNCkge1xuICAgICAgYWRkQXR0YWNoQW5kU2VxU3RvcmUoZGIpOyAvLyB2MyAtPiB2NFxuICAgIH1cblxuICAgIHZhciBtaWdyYXRpb25zID0gW1xuICAgICAgYWRkRGVsZXRlZE9yTG9jYWxJbmRleCwgLy8gdjEgLT4gdjJcbiAgICAgIG1pZ3JhdGVMb2NhbFN0b3JlLCAgICAgIC8vIHYyIC0+IHYzXG4gICAgICBtaWdyYXRlQXR0c0FuZFNlcXMsICAgICAvLyB2MyAtPiB2NFxuICAgICAgbWlncmF0ZU1ldGFkYXRhICAgICAgICAgLy8gdjQgLT4gdjVcbiAgICBdO1xuXG4gICAgdmFyIGkgPSBlLm9sZFZlcnNpb247XG5cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgdmFyIG1pZ3JhdGlvbiA9IG1pZ3JhdGlvbnNbaSAtIDFdO1xuICAgICAgaSsrO1xuICAgICAgaWYgKG1pZ3JhdGlvbikge1xuICAgICAgICBtaWdyYXRpb24odHhuLCBuZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0KCk7XG4gIH07XG5cbiAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG5cbiAgICBpZGIgPSBlLnRhcmdldC5yZXN1bHQ7XG5cbiAgICBpZGIub252ZXJzaW9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWRiLmNsb3NlKCk7XG4gICAgICBjYWNoZWREQnMuZGVsZXRlKGRiTmFtZSk7XG4gICAgfTtcblxuICAgIGlkYi5vbmFib3J0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGd1YXJkZWRDb25zb2xlKCdlcnJvcicsICdEYXRhYmFzZSBoYXMgYSBnbG9iYWwgZmFpbHVyZScsIGUudGFyZ2V0LmVycm9yKTtcbiAgICAgIGlkYi5jbG9zZSgpO1xuICAgICAgY2FjaGVkREJzLmRlbGV0ZShkYk5hbWUpO1xuICAgIH07XG5cbiAgICB2YXIgdHhuID0gaWRiLnRyYW5zYWN0aW9uKFtcbiAgICAgIE1FVEFfU1RPUkUsXG4gICAgICBERVRFQ1RfQkxPQl9TVVBQT1JUX1NUT1JFLFxuICAgICAgRE9DX1NUT1JFXG4gICAgXSwgJ3JlYWR3cml0ZScpO1xuXG4gICAgdmFyIHJlcSA9IHR4bi5vYmplY3RTdG9yZShNRVRBX1NUT1JFKS5nZXQoTUVUQV9TVE9SRSk7XG5cbiAgICB2YXIgYmxvYlN1cHBvcnQgPSBudWxsO1xuICAgIHZhciBkb2NDb3VudCA9IG51bGw7XG4gICAgdmFyIGluc3RhbmNlSWQgPSBudWxsO1xuXG4gICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgIHZhciBjaGVja1NldHVwQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChibG9iU3VwcG9ydCA9PT0gbnVsbCB8fCBkb2NDb3VudCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgaW5zdGFuY2VJZCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcGkuX21ldGEgPSB7XG4gICAgICAgICAgICBuYW1lOiBkYk5hbWUsXG4gICAgICAgICAgICBpbnN0YW5jZUlkOiBpbnN0YW5jZUlkLFxuICAgICAgICAgICAgYmxvYlN1cHBvcnQ6IGJsb2JTdXBwb3J0LFxuICAgICAgICAgICAgZG9jQ291bnQ6IGRvY0NvdW50XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNhY2hlZERCcy5zZXQoZGJOYW1lLCB7XG4gICAgICAgICAgICBpZGI6IGlkYixcbiAgICAgICAgICAgIGdsb2JhbDogYXBpLl9tZXRhXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgYXBpKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy9cbiAgICAgIC8vIGZldGNoL3N0b3JlIHRoZSBpZFxuICAgICAgLy9cblxuICAgICAgdmFyIG1ldGEgPSBlLnRhcmdldC5yZXN1bHQgfHwge2lkOiBNRVRBX1NUT1JFfTtcbiAgICAgIGlmIChkYk5hbWUgICsgJ19pZCcgaW4gbWV0YSkge1xuICAgICAgICBpbnN0YW5jZUlkID0gbWV0YVtkYk5hbWUgKyAnX2lkJ107XG4gICAgICAgIGNoZWNrU2V0dXBDb21wbGV0ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2VJZCA9IHV1aWQoKTtcbiAgICAgICAgbWV0YVtkYk5hbWUgKyAnX2lkJ10gPSBpbnN0YW5jZUlkO1xuICAgICAgICB0eG4ub2JqZWN0U3RvcmUoTUVUQV9TVE9SRSkucHV0KG1ldGEpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjaGVja1NldHVwQ29tcGxldGUoKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy9cbiAgICAgIC8vIGNoZWNrIGJsb2Igc3VwcG9ydFxuICAgICAgLy9cblxuICAgICAgaWYgKCFibG9iU3VwcG9ydFByb21pc2UpIHtcbiAgICAgICAgLy8gbWFrZSBzdXJlIGJsb2Igc3VwcG9ydCBpcyBvbmx5IGNoZWNrZWQgb25jZVxuICAgICAgICBibG9iU3VwcG9ydFByb21pc2UgPSBjaGVja0Jsb2JTdXBwb3J0KHR4bik7XG4gICAgICB9XG5cbiAgICAgIGJsb2JTdXBwb3J0UHJvbWlzZS50aGVuKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgYmxvYlN1cHBvcnQgPSB2YWw7XG4gICAgICAgIGNoZWNrU2V0dXBDb21wbGV0ZSgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vXG4gICAgICAvLyBjb3VudCBkb2NzXG4gICAgICAvL1xuXG4gICAgICB2YXIgaW5kZXggPSB0eG4ub2JqZWN0U3RvcmUoRE9DX1NUT1JFKS5pbmRleCgnZGVsZXRlZE9yTG9jYWwnKTtcbiAgICAgIGluZGV4LmNvdW50KElEQktleVJhbmdlLm9ubHkoJzAnKSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZG9jQ291bnQgPSBlLnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIGNoZWNrU2V0dXBDb21wbGV0ZSgpO1xuICAgICAgfTtcblxuICAgIH07XG4gIH07XG5cbiAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1zZyA9ICdGYWlsZWQgdG8gb3BlbiBpbmRleGVkREIsIGFyZSB5b3UgaW4gcHJpdmF0ZSBicm93c2luZyBtb2RlPyc7XG4gICAgZ3VhcmRlZENvbnNvbGUoJ2Vycm9yJywgbXNnKTtcbiAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihJREJfRVJST1IsIG1zZykpO1xuICB9O1xufVxuXG5JZGJQb3VjaC52YWxpZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiB0cnlTdG9yYWdlT3B0aW9uKGRiTmFtZSwgc3RvcmFnZSkge1xuICB0cnkgeyAvLyBvcHRpb24gb25seSBhdmFpbGFibGUgaW4gRmlyZWZveCAyNitcbiAgICByZXR1cm4gaW5kZXhlZERCLm9wZW4oZGJOYW1lLCB7XG4gICAgICB2ZXJzaW9uOiBBREFQVEVSX1ZFUlNJT04sXG4gICAgICBzdG9yYWdlOiBzdG9yYWdlXG4gICAgfSk7XG4gIH0gY2F0Y2goZXJyKSB7XG4gICAgICByZXR1cm4gaW5kZXhlZERCLm9wZW4oZGJOYW1lLCBBREFQVEVSX1ZFUlNJT04pO1xuICB9XG59XG5cbmZ1bmN0aW9uIElEQlBvdWNoIChQb3VjaERCKSB7XG4gIFBvdWNoREIuYWRhcHRlcignaWRiJywgSWRiUG91Y2gsIHRydWUpO1xufVxuXG4vL1xuLy8gUGFyc2luZyBoZXggc3RyaW5ncy4gWWVhaC5cbi8vXG4vLyBTbyBiYXNpY2FsbHkgd2UgbmVlZCB0aGlzIGJlY2F1c2Ugb2YgYSBidWcgaW4gV2ViU1FMOlxuLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTQyMjY5MFxuLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTEzNzYzN1xuLy9cbi8vIFVURi04IGFuZCBVVEYtMTYgYXJlIHByb3ZpZGVkIGFzIHNlcGFyYXRlIGZ1bmN0aW9uc1xuLy8gZm9yIG1lYWdlciBwZXJmb3JtYW5jZSBpbXByb3ZlbWVudHNcbi8vXG5cbmZ1bmN0aW9uIGRlY29kZVV0Zjgoc3RyKSB7XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKHN0cikpO1xufVxuXG5mdW5jdGlvbiBoZXhUb0ludChjaGFyQ29kZSkge1xuICAvLyAnMCctJzknIGlzIDQ4LTU3XG4gIC8vICdBJy0nRicgaXMgNjUtNzBcbiAgLy8gU1FMaXRlIHdpbGwgb25seSBnaXZlIHVzIHVwcGVyY2FzZSBoZXhcbiAgcmV0dXJuIGNoYXJDb2RlIDwgNjUgPyAoY2hhckNvZGUgLSA0OCkgOiAoY2hhckNvZGUgLSA1NSk7XG59XG5cblxuLy8gRXhhbXBsZTpcbi8vIHByYWdtYSBlbmNvZGluZz11dGY4O1xuLy8gc2VsZWN0IGhleCgnQScpO1xuLy8gcmV0dXJucyAnNDEnXG5mdW5jdGlvbiBwYXJzZUhleFV0Zjgoc3RyLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXN1bHQgPSAnJztcbiAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAoaGV4VG9JbnQoc3RyLmNoYXJDb2RlQXQoc3RhcnQrKykpIDw8IDQpIHxcbiAgICAgICAgaGV4VG9JbnQoc3RyLmNoYXJDb2RlQXQoc3RhcnQrKykpKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBFeGFtcGxlOlxuLy8gcHJhZ21hIGVuY29kaW5nPXV0ZjE2O1xuLy8gc2VsZWN0IGhleCgnQScpO1xuLy8gcmV0dXJucyAnNDEwMCdcbi8vIG5vdGljZSB0aGF0IHRoZSAwMCBjb21lcyBhZnRlciB0aGUgNDEgKGkuZS4gaXQncyBzd2l6emxlZClcbmZ1bmN0aW9uIHBhcnNlSGV4VXRmMTYoc3RyLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXN1bHQgPSAnJztcbiAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gVVRGLTE2LCBzbyBzd2l6emxlIHRoZSBieXRlc1xuICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFxuICAgICAgKGhleFRvSW50KHN0ci5jaGFyQ29kZUF0KHN0YXJ0ICsgMikpIDw8IDEyKSB8XG4gICAgICAgIChoZXhUb0ludChzdHIuY2hhckNvZGVBdChzdGFydCArIDMpKSA8PCA4KSB8XG4gICAgICAgIChoZXhUb0ludChzdHIuY2hhckNvZGVBdChzdGFydCkpIDw8IDQpIHxcbiAgICAgICAgaGV4VG9JbnQoc3RyLmNoYXJDb2RlQXQoc3RhcnQgKyAxKSkpO1xuICAgIHN0YXJ0ICs9IDQ7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcGFyc2VIZXhTdHJpbmcoc3RyLCBlbmNvZGluZykge1xuICBpZiAoZW5jb2RpbmcgPT09ICdVVEYtOCcpIHtcbiAgICByZXR1cm4gZGVjb2RlVXRmOChwYXJzZUhleFV0Zjgoc3RyLCAwLCBzdHIubGVuZ3RoKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhcnNlSGV4VXRmMTYoc3RyLCAwLCBzdHIubGVuZ3RoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBxdW90ZShzdHIpIHtcbiAgcmV0dXJuIFwiJ1wiICsgc3RyICsgXCInXCI7XG59XG5cbnZhciBBREFQVEVSX1ZFUlNJT04kMSA9IDc7IC8vIHVzZWQgdG8gbWFuYWdlIG1pZ3JhdGlvbnNcblxuLy8gVGhlIG9iamVjdCBzdG9yZXMgY3JlYXRlZCBmb3IgZWFjaCBkYXRhYmFzZVxuLy8gRE9DX1NUT1JFIHN0b3JlcyB0aGUgZG9jdW1lbnQgbWV0YSBkYXRhLCBpdHMgcmV2aXNpb24gaGlzdG9yeSBhbmQgc3RhdGVcbnZhciBET0NfU1RPUkUkMSA9IHF1b3RlKCdkb2N1bWVudC1zdG9yZScpO1xuLy8gQllfU0VRX1NUT1JFIHN0b3JlcyBhIHBhcnRpY3VsYXIgdmVyc2lvbiBvZiBhIGRvY3VtZW50LCBrZXllZCBieSBpdHNcbi8vIHNlcXVlbmNlIGlkXG52YXIgQllfU0VRX1NUT1JFJDEgPSBxdW90ZSgnYnktc2VxdWVuY2UnKTtcbi8vIFdoZXJlIHdlIHN0b3JlIGF0dGFjaG1lbnRzXG52YXIgQVRUQUNIX1NUT1JFJDEgPSBxdW90ZSgnYXR0YWNoLXN0b3JlJyk7XG52YXIgTE9DQUxfU1RPUkUkMSA9IHF1b3RlKCdsb2NhbC1zdG9yZScpO1xudmFyIE1FVEFfU1RPUkUkMSA9IHF1b3RlKCdtZXRhZGF0YS1zdG9yZScpO1xuLy8gd2hlcmUgd2Ugc3RvcmUgbWFueS10by1tYW55IHJlbGF0aW9ucyBiZXR3ZWVuIGF0dGFjaG1lbnRcbi8vIGRpZ2VzdHMgYW5kIHNlcXNcbnZhciBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxID0gcXVvdGUoJ2F0dGFjaC1zZXEtc3RvcmUnKTtcblxuLy8gZXNjYXBlQmxvYiBhbmQgdW5lc2NhcGVCbG9iIGFyZSB3b3JrYXJvdW5kcyBmb3IgYSB3ZWJzcWwgYnVnOlxuLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTQyMjY5MFxuLy8gaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTEzNzYzN1xuLy8gVGhlIGdvYWwgaXMgdG8gbmV2ZXIgYWN0dWFsbHkgaW5zZXJ0IHRoZSBcXHUwMDAwIGNoYXJhY3RlclxuLy8gaW4gdGhlIGRhdGFiYXNlLlxuZnVuY3Rpb24gZXNjYXBlQmxvYihzdHIpIHtcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC9cXHUwMDAyL2csICdcXHUwMDAyXFx1MDAwMicpXG4gICAgLnJlcGxhY2UoL1xcdTAwMDEvZywgJ1xcdTAwMDFcXHUwMDAyJylcbiAgICAucmVwbGFjZSgvXFx1MDAwMC9nLCAnXFx1MDAwMVxcdTAwMDEnKTtcbn1cblxuZnVuY3Rpb24gdW5lc2NhcGVCbG9iKHN0cikge1xuICByZXR1cm4gc3RyXG4gICAgLnJlcGxhY2UoL1xcdTAwMDFcXHUwMDAxL2csICdcXHUwMDAwJylcbiAgICAucmVwbGFjZSgvXFx1MDAwMVxcdTAwMDIvZywgJ1xcdTAwMDEnKVxuICAgIC5yZXBsYWNlKC9cXHUwMDAyXFx1MDAwMi9nLCAnXFx1MDAwMicpO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlEb2MoZG9jKSB7XG4gIC8vIGRvbid0IGJvdGhlciBzdG9yaW5nIHRoZSBpZC9yZXYuIGl0IHVzZXMgbG90cyBvZiBzcGFjZSxcbiAgLy8gaW4gcGVyc2lzdGVudCBtYXAvcmVkdWNlIGVzcGVjaWFsbHlcbiAgZGVsZXRlIGRvYy5faWQ7XG4gIGRlbGV0ZSBkb2MuX3JldjtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGRvYyk7XG59XG5cbmZ1bmN0aW9uIHVuc3RyaW5naWZ5RG9jKGRvYywgaWQsIHJldikge1xuICBkb2MgPSBKU09OLnBhcnNlKGRvYyk7XG4gIGRvYy5faWQgPSBpZDtcbiAgZG9jLl9yZXYgPSByZXY7XG4gIHJldHVybiBkb2M7XG59XG5cbi8vIHF1ZXN0aW9uIG1hcmsgZ3JvdXBzIElOIHF1ZXJpZXMsIGUuZy4gMyAtPiAnKD8sPyw/KSdcbmZ1bmN0aW9uIHFNYXJrcyhudW0pIHtcbiAgdmFyIHMgPSAnKCc7XG4gIHdoaWxlIChudW0tLSkge1xuICAgIHMgKz0gJz8nO1xuICAgIGlmIChudW0pIHtcbiAgICAgIHMgKz0gJywnO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcyArICcpJztcbn1cblxuZnVuY3Rpb24gc2VsZWN0KHNlbGVjdG9yLCB0YWJsZSwgam9pbmVyLCB3aGVyZSwgb3JkZXJCeSkge1xuICByZXR1cm4gJ1NFTEVDVCAnICsgc2VsZWN0b3IgKyAnIEZST00gJyArXG4gICAgKHR5cGVvZiB0YWJsZSA9PT0gJ3N0cmluZycgPyB0YWJsZSA6IHRhYmxlLmpvaW4oJyBKT0lOICcpKSArXG4gICAgKGpvaW5lciA/ICgnIE9OICcgKyBqb2luZXIpIDogJycpICtcbiAgICAod2hlcmUgPyAoJyBXSEVSRSAnICtcbiAgICAodHlwZW9mIHdoZXJlID09PSAnc3RyaW5nJyA/IHdoZXJlIDogd2hlcmUuam9pbignIEFORCAnKSkpIDogJycpICtcbiAgICAob3JkZXJCeSA/ICgnIE9SREVSIEJZICcgKyBvcmRlckJ5KSA6ICcnKTtcbn1cblxuZnVuY3Rpb24gY29tcGFjdFJldnMkMShyZXZzLCBkb2NJZCwgdHgpIHtcblxuICBpZiAoIXJldnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG51bURvbmUgPSAwO1xuICB2YXIgc2VxcyA9IFtdO1xuXG4gIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICBpZiAoKytudW1Eb25lID09PSByZXZzLmxlbmd0aCkgeyAvLyBkb25lXG4gICAgICBkZWxldGVPcnBoYW5zKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlT3JwaGFucygpIHtcbiAgICAvLyBmaW5kIG9ycGhhbmVkIGF0dGFjaG1lbnQgZGlnZXN0c1xuXG4gICAgaWYgKCFzZXFzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzcWwgPSAnU0VMRUNUIERJU1RJTkNUIGRpZ2VzdCBBUyBkaWdlc3QgRlJPTSAnICtcbiAgICAgIEFUVEFDSF9BTkRfU0VRX1NUT1JFJDEgKyAnIFdIRVJFIHNlcSBJTiAnICsgcU1hcmtzKHNlcXMubGVuZ3RoKTtcblxuICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBzZXFzLCBmdW5jdGlvbiAodHgsIHJlcykge1xuXG4gICAgICB2YXIgZGlnZXN0c1RvQ2hlY2sgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLnJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGlnZXN0c1RvQ2hlY2sucHVzaChyZXMucm93cy5pdGVtKGkpLmRpZ2VzdCk7XG4gICAgICB9XG4gICAgICBpZiAoIWRpZ2VzdHNUb0NoZWNrLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBzcWwgPSAnREVMRVRFIEZST00gJyArIEFUVEFDSF9BTkRfU0VRX1NUT1JFJDEgK1xuICAgICAgICAnIFdIRVJFIHNlcSBJTiAoJyArXG4gICAgICAgIHNlcXMubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuICc/JzsgfSkuam9pbignLCcpICtcbiAgICAgICAgJyknO1xuICAgICAgdHguZXhlY3V0ZVNxbChzcWwsIHNlcXMsIGZ1bmN0aW9uICh0eCkge1xuXG4gICAgICAgIHZhciBzcWwgPSAnU0VMRUNUIGRpZ2VzdCBGUk9NICcgKyBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxICtcbiAgICAgICAgICAnIFdIRVJFIGRpZ2VzdCBJTiAoJyArXG4gICAgICAgICAgZGlnZXN0c1RvQ2hlY2subWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuICc/JzsgfSkuam9pbignLCcpICtcbiAgICAgICAgICAnKSc7XG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBkaWdlc3RzVG9DaGVjaywgZnVuY3Rpb24gKHR4LCByZXMpIHtcbiAgICAgICAgICB2YXIgbm9uT3JwaGFuZWREaWdlc3RzID0gbmV3IF9TZXQoKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcy5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub25PcnBoYW5lZERpZ2VzdHMuYWRkKHJlcy5yb3dzLml0ZW0oaSkuZGlnZXN0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlnZXN0c1RvQ2hlY2suZm9yRWFjaChmdW5jdGlvbiAoZGlnZXN0KSB7XG4gICAgICAgICAgICBpZiAobm9uT3JwaGFuZWREaWdlc3RzLmhhcyhkaWdlc3QpKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoXG4gICAgICAgICAgICAgICdERUxFVEUgRlJPTSAnICsgQVRUQUNIX0FORF9TRVFfU1RPUkUkMSArICcgV0hFUkUgZGlnZXN0PT8nLFxuICAgICAgICAgICAgICBbZGlnZXN0XSk7XG4gICAgICAgICAgICB0eC5leGVjdXRlU3FsKFxuICAgICAgICAgICAgICAnREVMRVRFIEZST00gJyArIEFUVEFDSF9TVE9SRSQxICsgJyBXSEVSRSBkaWdlc3Q9PycsIFtkaWdlc3RdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSBieS1zZXEgYW5kIGF0dGFjaCBzdG9yZXMgaW4gcGFyYWxsZWxcbiAgcmV2cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXYpIHtcbiAgICB2YXIgc3FsID0gJ1NFTEVDVCBzZXEgRlJPTSAnICsgQllfU0VRX1NUT1JFJDEgK1xuICAgICAgJyBXSEVSRSBkb2NfaWQ9PyBBTkQgcmV2PT8nO1xuXG4gICAgdHguZXhlY3V0ZVNxbChzcWwsIFtkb2NJZCwgcmV2XSwgZnVuY3Rpb24gKHR4LCByZXMpIHtcbiAgICAgIGlmICghcmVzLnJvd3MubGVuZ3RoKSB7IC8vIGFscmVhZHkgZGVsZXRlZFxuICAgICAgICByZXR1cm4gY2hlY2tEb25lKCk7XG4gICAgICB9XG4gICAgICB2YXIgc2VxID0gcmVzLnJvd3MuaXRlbSgwKS5zZXE7XG4gICAgICBzZXFzLnB1c2goc2VxKTtcblxuICAgICAgdHguZXhlY3V0ZVNxbChcbiAgICAgICAgJ0RFTEVURSBGUk9NICcgKyBCWV9TRVFfU1RPUkUkMSArICcgV0hFUkUgc2VxPT8nLCBbc2VxXSwgY2hlY2tEb25lKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHdlYnNxbEVycm9yKGNhbGxiYWNrKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBndWFyZGVkQ29uc29sZSgnZXJyb3InLCAnV2ViU1FMIHRocmV3IGFuIGVycm9yJywgZXZlbnQpO1xuICAgIC8vIGV2ZW50IG1heSBhY3R1YWxseSBiZSBhIFNRTEVycm9yIG9iamVjdCwgc28gcmVwb3J0IGlzIGFzIHN1Y2hcbiAgICB2YXIgZXJyb3JOYW1lTWF0Y2ggPSBldmVudCAmJiBldmVudC5jb25zdHJ1Y3Rvci50b1N0cmluZygpXG4gICAgICAgIC5tYXRjaCgvZnVuY3Rpb24gKFteXFwoXSspLyk7XG4gICAgdmFyIGVycm9yTmFtZSA9IChlcnJvck5hbWVNYXRjaCAmJiBlcnJvck5hbWVNYXRjaFsxXSkgfHwgZXZlbnQudHlwZTtcbiAgICB2YXIgZXJyb3JSZWFzb24gPSBldmVudC50YXJnZXQgfHwgZXZlbnQubWVzc2FnZTtcbiAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihXU1FfRVJST1IsIGVycm9yUmVhc29uLCBlcnJvck5hbWUpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0U2l6ZShvcHRzKSB7XG4gIGlmICgnc2l6ZScgaW4gb3B0cykge1xuICAgIC8vIHRyaWdnZXJzIGltbWVkaWF0ZSBwb3B1cCBpbiBpT1MsIGZpeGVzICMyMzQ3XG4gICAgLy8gZS5nLiA1MDAwMDAxIGFza3MgZm9yIDUgTUIsIDEwMDAwMDAxIGFza3MgZm9yIDEwIE1CLFxuICAgIHJldHVybiBvcHRzLnNpemUgKiAxMDAwMDAwO1xuICB9XG4gIC8vIEluIGlPUywgZG9lc24ndCBtYXR0ZXIgYXMgbG9uZyBhcyBpdCdzIDw9IDUwMDAwMDAuXG4gIC8vIEV4Y2VwdCB0aGF0IGlmIHlvdSByZXF1ZXN0IHRvbyBtdWNoLCBvdXIgdGVzdHMgZmFpbFxuICAvLyBiZWNhdXNlIG9mIHRoZSBuYXRpdmUgXCJkbyB5b3UgYWNjZXB0P1wiIHBvcHVwLlxuICAvLyBJbiBBbmRyb2lkIDw9NC4zLCB0aGlzIHZhbHVlIGlzIGFjdHVhbGx5IHVzZWQgYXMgYW5cbiAgLy8gaG9uZXN0LXRvLWdvZCBjZWlsaW5nIGZvciBkYXRhLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIHNldCBpdCB0byBhIGRlY2VudGx5IGhpZ2ggbnVtYmVyLlxuICB2YXIgaXNBbmRyb2lkID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAvQW5kcm9pZC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgcmV0dXJuIGlzQW5kcm9pZCA/IDUwMDAwMDAgOiAxOyAvLyBpbiBQaGFudG9tSlMsIGlmIHlvdSB1c2UgMCBpdCB3aWxsIGNyYXNoXG59XG5cbmZ1bmN0aW9uIHdlYnNxbEJ1bGtEb2NzKGRiT3B0cywgcmVxLCBvcHRzLCBhcGksIGRiLCB3ZWJzcWxDaGFuZ2VzLCBjYWxsYmFjaykge1xuICB2YXIgbmV3RWRpdHMgPSBvcHRzLm5ld19lZGl0cztcbiAgdmFyIHVzZXJEb2NzID0gcmVxLmRvY3M7XG5cbiAgLy8gUGFyc2UgdGhlIGRvY3MsIGdpdmUgdGhlbSBhIHNlcXVlbmNlIG51bWJlciBmb3IgdGhlIHJlc3VsdFxuICB2YXIgZG9jSW5mb3MgPSB1c2VyRG9jcy5tYXAoZnVuY3Rpb24gKGRvYykge1xuICAgIGlmIChkb2MuX2lkICYmIGlzTG9jYWxJZChkb2MuX2lkKSkge1xuICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgdmFyIG5ld0RvYyA9IHBhcnNlRG9jKGRvYywgbmV3RWRpdHMpO1xuICAgIHJldHVybiBuZXdEb2M7XG4gIH0pO1xuXG4gIHZhciBkb2NJbmZvRXJyb3JzID0gZG9jSW5mb3MuZmlsdGVyKGZ1bmN0aW9uIChkb2NJbmZvKSB7XG4gICAgcmV0dXJuIGRvY0luZm8uZXJyb3I7XG4gIH0pO1xuICBpZiAoZG9jSW5mb0Vycm9ycy5sZW5ndGgpIHtcbiAgICByZXR1cm4gY2FsbGJhY2soZG9jSW5mb0Vycm9yc1swXSk7XG4gIH1cblxuICB2YXIgdHg7XG4gIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGRvY0luZm9zLmxlbmd0aCk7XG4gIHZhciBmZXRjaGVkRG9jcyA9IG5ldyBfTWFwKCk7XG5cbiAgdmFyIHByZWNvbmRpdGlvbkVycm9yZWQ7XG4gIGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuICAgIGlmIChwcmVjb25kaXRpb25FcnJvcmVkKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2socHJlY29uZGl0aW9uRXJyb3JlZCk7XG4gICAgfVxuICAgIHdlYnNxbENoYW5nZXMubm90aWZ5KGFwaS5fbmFtZSk7XG4gICAgYXBpLl9kb2NDb3VudCA9IC0xOyAvLyBpbnZhbGlkYXRlXG4gICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gIH1cblxuICBmdW5jdGlvbiB2ZXJpZnlBdHRhY2htZW50KGRpZ2VzdCwgY2FsbGJhY2spIHtcbiAgICB2YXIgc3FsID0gJ1NFTEVDVCBjb3VudCgqKSBhcyBjbnQgRlJPTSAnICsgQVRUQUNIX1NUT1JFJDEgK1xuICAgICAgJyBXSEVSRSBkaWdlc3Q9Pyc7XG4gICAgdHguZXhlY3V0ZVNxbChzcWwsIFtkaWdlc3RdLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgaWYgKHJlc3VsdC5yb3dzLml0ZW0oMCkuY250ID09PSAwKSB7XG4gICAgICAgIHZhciBlcnIgPSBjcmVhdGVFcnJvcihNSVNTSU5HX1NUVUIsXG4gICAgICAgICAgJ3Vua25vd24gc3R1YiBhdHRhY2htZW50IHdpdGggZGlnZXN0ICcgK1xuICAgICAgICAgIGRpZ2VzdCk7XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdmVyaWZ5QXR0YWNobWVudHMoZmluaXNoKSB7XG4gICAgdmFyIGRpZ2VzdHMgPSBbXTtcbiAgICBkb2NJbmZvcy5mb3JFYWNoKGZ1bmN0aW9uIChkb2NJbmZvKSB7XG4gICAgICBpZiAoZG9jSW5mby5kYXRhICYmIGRvY0luZm8uZGF0YS5fYXR0YWNobWVudHMpIHtcbiAgICAgICAgT2JqZWN0LmtleXMoZG9jSW5mby5kYXRhLl9hdHRhY2htZW50cykuZm9yRWFjaChmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICB2YXIgYXR0ID0gZG9jSW5mby5kYXRhLl9hdHRhY2htZW50c1tmaWxlbmFtZV07XG4gICAgICAgICAgaWYgKGF0dC5zdHViKSB7XG4gICAgICAgICAgICBkaWdlc3RzLnB1c2goYXR0LmRpZ2VzdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWRpZ2VzdHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmluaXNoKCk7XG4gICAgfVxuICAgIHZhciBudW1Eb25lID0gMDtcbiAgICB2YXIgZXJyO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgaWYgKCsrbnVtRG9uZSA9PT0gZGlnZXN0cy5sZW5ndGgpIHtcbiAgICAgICAgZmluaXNoKGVycik7XG4gICAgICB9XG4gICAgfVxuICAgIGRpZ2VzdHMuZm9yRWFjaChmdW5jdGlvbiAoZGlnZXN0KSB7XG4gICAgICB2ZXJpZnlBdHRhY2htZW50KGRpZ2VzdCwgZnVuY3Rpb24gKGF0dEVycikge1xuICAgICAgICBpZiAoYXR0RXJyICYmICFlcnIpIHtcbiAgICAgICAgICBlcnIgPSBhdHRFcnI7XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tEb25lKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlRG9jKGRvY0luZm8sIHdpbm5pbmdSZXYsIHdpbm5pbmdSZXZJc0RlbGV0ZWQsIG5ld1JldklzRGVsZXRlZCxcbiAgICAgICAgICAgICAgICAgICAgaXNVcGRhdGUsIGRlbHRhLCByZXN1bHRzSWR4LCBjYWxsYmFjaykge1xuXG4gICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgdmFyIGRhdGEgPSBkb2NJbmZvLmRhdGE7XG4gICAgICB2YXIgZGVsZXRlZEludCA9IG5ld1JldklzRGVsZXRlZCA/IDEgOiAwO1xuXG4gICAgICB2YXIgaWQgPSBkYXRhLl9pZDtcbiAgICAgIHZhciByZXYgPSBkYXRhLl9yZXY7XG4gICAgICB2YXIganNvbiA9IHN0cmluZ2lmeURvYyhkYXRhKTtcbiAgICAgIHZhciBzcWwgPSAnSU5TRVJUIElOVE8gJyArIEJZX1NFUV9TVE9SRSQxICtcbiAgICAgICAgJyAoZG9jX2lkLCByZXYsIGpzb24sIGRlbGV0ZWQpIFZBTFVFUyAoPywgPywgPywgPyk7JztcbiAgICAgIHZhciBzcWxBcmdzID0gW2lkLCByZXYsIGpzb24sIGRlbGV0ZWRJbnRdO1xuXG4gICAgICAvLyBtYXAgc2VxcyB0byBhdHRhY2htZW50IGRpZ2VzdHMsIHdoaWNoXG4gICAgICAvLyB3ZSB3aWxsIG5lZWQgbGF0ZXIgZHVyaW5nIGNvbXBhY3Rpb25cbiAgICAgIGZ1bmN0aW9uIGluc2VydEF0dGFjaG1lbnRNYXBwaW5ncyhzZXEsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhdHRzQWRkZWQgPSAwO1xuICAgICAgICB2YXIgYXR0c1RvQWRkID0gT2JqZWN0LmtleXMoZGF0YS5fYXR0YWNobWVudHMgfHwge30pO1xuXG4gICAgICAgIGlmICghYXR0c1RvQWRkLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICAgICAgICBpZiAoKythdHRzQWRkZWQgPT09IGF0dHNUb0FkZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gYWNrIGhhbmRsaW5nIGEgY29uc3RyYWludCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGFkZChhdHQpIHtcbiAgICAgICAgICB2YXIgc3FsID0gJ0lOU0VSVCBJTlRPICcgKyBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxICtcbiAgICAgICAgICAgICcgKGRpZ2VzdCwgc2VxKSBWQUxVRVMgKD8sPyknO1xuICAgICAgICAgIHZhciBzcWxBcmdzID0gW2RhdGEuX2F0dGFjaG1lbnRzW2F0dF0uZGlnZXN0LCBzZXFdO1xuICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBzcWxBcmdzLCBjaGVja0RvbmUsIGNoZWNrRG9uZSk7XG4gICAgICAgICAgLy8gc2Vjb25kIGNhbGxiYWNrIGlzIGZvciBhIGNvbnN0YWludCBlcnJvciwgd2hpY2ggd2UgaWdub3JlXG4gICAgICAgICAgLy8gYmVjYXVzZSB0aGlzIGRvY2lkL3JldiBoYXMgYWxyZWFkeSBiZWVuIGFzc29jaWF0ZWQgd2l0aFxuICAgICAgICAgIC8vIHRoZSBkaWdlc3QgKGUuZy4gd2hlbiBuZXdfZWRpdHMgPT0gZmFsc2UpXG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRzVG9BZGQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhZGQoYXR0c1RvQWRkW2ldKTsgLy8gZG8gaW4gcGFyYWxsZWxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0eC5leGVjdXRlU3FsKHNxbCwgc3FsQXJncywgZnVuY3Rpb24gKHR4LCByZXN1bHQpIHtcbiAgICAgICAgdmFyIHNlcSA9IHJlc3VsdC5pbnNlcnRJZDtcbiAgICAgICAgaW5zZXJ0QXR0YWNobWVudE1hcHBpbmdzKHNlcSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRhdGFXcml0dGVuKHR4LCBzZXEpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY29uc3RyYWludCBlcnJvciwgcmVjb3ZlciBieSB1cGRhdGluZyBpbnN0ZWFkIChzZWUgIzE2MzgpXG4gICAgICAgIHZhciBmZXRjaFNxbCA9IHNlbGVjdCgnc2VxJywgQllfU0VRX1NUT1JFJDEsIG51bGwsXG4gICAgICAgICAgJ2RvY19pZD0/IEFORCByZXY9PycpO1xuICAgICAgICB0eC5leGVjdXRlU3FsKGZldGNoU3FsLCBbaWQsIHJldl0sIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgICAgdmFyIHNlcSA9IHJlcy5yb3dzLml0ZW0oMCkuc2VxO1xuICAgICAgICAgIHZhciBzcWwgPSAnVVBEQVRFICcgKyBCWV9TRVFfU1RPUkUkMSArXG4gICAgICAgICAgICAnIFNFVCBqc29uPT8sIGRlbGV0ZWQ9PyBXSEVSRSBkb2NfaWQ9PyBBTkQgcmV2PT87JztcbiAgICAgICAgICB2YXIgc3FsQXJncyA9IFtqc29uLCBkZWxldGVkSW50LCBpZCwgcmV2XTtcbiAgICAgICAgICB0eC5leGVjdXRlU3FsKHNxbCwgc3FsQXJncywgZnVuY3Rpb24gKHR4KSB7XG4gICAgICAgICAgICBpbnNlcnRBdHRhY2htZW50TWFwcGluZ3Moc2VxLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGRhdGFXcml0dGVuKHR4LCBzZXEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIGFjayB0aGF0IHdlJ3ZlIGhhbmRsZWQgdGhlIGVycm9yXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb2xsZWN0UmVzdWx0cyhhdHRhY2htZW50RXJyKSB7XG4gICAgICBpZiAoIWVycikge1xuICAgICAgICBpZiAoYXR0YWNobWVudEVycikge1xuICAgICAgICAgIGVyciA9IGF0dGFjaG1lbnRFcnI7XG4gICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfSBlbHNlIGlmIChyZWN2ID09PSBhdHRhY2htZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICBmaW5pc2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBlcnIgPSBudWxsO1xuICAgIHZhciByZWN2ID0gMDtcblxuICAgIGRvY0luZm8uZGF0YS5faWQgPSBkb2NJbmZvLm1ldGFkYXRhLmlkO1xuICAgIGRvY0luZm8uZGF0YS5fcmV2ID0gZG9jSW5mby5tZXRhZGF0YS5yZXY7XG4gICAgdmFyIGF0dGFjaG1lbnRzID0gT2JqZWN0LmtleXMoZG9jSW5mby5kYXRhLl9hdHRhY2htZW50cyB8fCB7fSk7XG5cblxuICAgIGlmIChuZXdSZXZJc0RlbGV0ZWQpIHtcbiAgICAgIGRvY0luZm8uZGF0YS5fZGVsZXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXR0YWNobWVudFNhdmVkKGVycikge1xuICAgICAgcmVjdisrO1xuICAgICAgY29sbGVjdFJlc3VsdHMoZXJyKTtcbiAgICB9XG5cbiAgICBhdHRhY2htZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciBhdHQgPSBkb2NJbmZvLmRhdGEuX2F0dGFjaG1lbnRzW2tleV07XG4gICAgICBpZiAoIWF0dC5zdHViKSB7XG4gICAgICAgIHZhciBkYXRhID0gYXR0LmRhdGE7XG4gICAgICAgIGRlbGV0ZSBhdHQuZGF0YTtcbiAgICAgICAgYXR0LnJldnBvcyA9IHBhcnNlSW50KHdpbm5pbmdSZXYsIDEwKTtcbiAgICAgICAgdmFyIGRpZ2VzdCA9IGF0dC5kaWdlc3Q7XG4gICAgICAgIHNhdmVBdHRhY2htZW50KGRpZ2VzdCwgZGF0YSwgYXR0YWNobWVudFNhdmVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY3YrKztcbiAgICAgICAgY29sbGVjdFJlc3VsdHMoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghYXR0YWNobWVudHMubGVuZ3RoKSB7XG4gICAgICBmaW5pc2goKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkYXRhV3JpdHRlbih0eCwgc2VxKSB7XG4gICAgICB2YXIgaWQgPSBkb2NJbmZvLm1ldGFkYXRhLmlkO1xuXG4gICAgICB2YXIgcmV2c1RvQ29tcGFjdCA9IGRvY0luZm8uc3RlbW1lZFJldnMgfHwgW107XG4gICAgICBpZiAoaXNVcGRhdGUgJiYgYXBpLmF1dG9fY29tcGFjdGlvbikge1xuICAgICAgICByZXZzVG9Db21wYWN0ID0gY29tcGFjdFRyZWUoZG9jSW5mby5tZXRhZGF0YSkuY29uY2F0KHJldnNUb0NvbXBhY3QpO1xuICAgICAgfVxuICAgICAgaWYgKHJldnNUb0NvbXBhY3QubGVuZ3RoKSB7XG4gICAgICAgIGNvbXBhY3RSZXZzJDEocmV2c1RvQ29tcGFjdCwgaWQsIHR4KTtcbiAgICAgIH1cblxuICAgICAgZG9jSW5mby5tZXRhZGF0YS5zZXEgPSBzZXE7XG4gICAgICB2YXIgcmV2ID0gZG9jSW5mby5tZXRhZGF0YS5yZXY7XG4gICAgICBkZWxldGUgZG9jSW5mby5tZXRhZGF0YS5yZXY7XG5cbiAgICAgIHZhciBzcWwgPSBpc1VwZGF0ZSA/XG4gICAgICAnVVBEQVRFICcgKyBET0NfU1RPUkUkMSArXG4gICAgICAnIFNFVCBqc29uPT8sIG1heF9zZXE9Pywgd2lubmluZ3NlcT0nICtcbiAgICAgICcoU0VMRUNUIHNlcSBGUk9NICcgKyBCWV9TRVFfU1RPUkUkMSArXG4gICAgICAnIFdIRVJFIGRvY19pZD0nICsgRE9DX1NUT1JFJDEgKyAnLmlkIEFORCByZXY9PykgV0hFUkUgaWQ9PydcbiAgICAgICAgOiAnSU5TRVJUIElOVE8gJyArIERPQ19TVE9SRSQxICtcbiAgICAgICcgKGlkLCB3aW5uaW5nc2VxLCBtYXhfc2VxLCBqc29uKSBWQUxVRVMgKD8sPyw/LD8pOyc7XG4gICAgICB2YXIgbWV0YWRhdGFTdHIgPSBzYWZlSnNvblN0cmluZ2lmeShkb2NJbmZvLm1ldGFkYXRhKTtcbiAgICAgIHZhciBwYXJhbXMgPSBpc1VwZGF0ZSA/XG4gICAgICAgIFttZXRhZGF0YVN0ciwgc2VxLCB3aW5uaW5nUmV2LCBpZF0gOlxuICAgICAgICBbaWQsIHNlcSwgc2VxLCBtZXRhZGF0YVN0cl07XG4gICAgICB0eC5leGVjdXRlU3FsKHNxbCwgcGFyYW1zLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlc3VsdHNbcmVzdWx0c0lkeF0gPSB7XG4gICAgICAgICAgb2s6IHRydWUsXG4gICAgICAgICAgaWQ6IGRvY0luZm8ubWV0YWRhdGEuaWQsXG4gICAgICAgICAgcmV2OiByZXZcbiAgICAgICAgfTtcbiAgICAgICAgZmV0Y2hlZERvY3Muc2V0KGlkLCBkb2NJbmZvLm1ldGFkYXRhKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHdlYnNxbFByb2Nlc3NEb2NzKCkge1xuICAgIHByb2Nlc3NEb2NzKGRiT3B0cy5yZXZzX2xpbWl0LCBkb2NJbmZvcywgYXBpLCBmZXRjaGVkRG9jcywgdHgsXG4gICAgICAgICAgICAgICAgcmVzdWx0cywgd3JpdGVEb2MsIG9wdHMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hFeGlzdGluZ0RvY3MoY2FsbGJhY2spIHtcbiAgICBpZiAoIWRvY0luZm9zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuXG4gICAgdmFyIG51bUZldGNoZWQgPSAwO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tEb25lKCkge1xuICAgICAgaWYgKCsrbnVtRmV0Y2hlZCA9PT0gZG9jSW5mb3MubGVuZ3RoKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZG9jSW5mb3MuZm9yRWFjaChmdW5jdGlvbiAoZG9jSW5mbykge1xuICAgICAgaWYgKGRvY0luZm8uX2lkICYmIGlzTG9jYWxJZChkb2NJbmZvLl9pZCkpIHtcbiAgICAgICAgcmV0dXJuIGNoZWNrRG9uZSgpOyAvLyBza2lwIGxvY2FsIGRvY3NcbiAgICAgIH1cbiAgICAgIHZhciBpZCA9IGRvY0luZm8ubWV0YWRhdGEuaWQ7XG4gICAgICB0eC5leGVjdXRlU3FsKCdTRUxFQ1QganNvbiBGUk9NICcgKyBET0NfU1RPUkUkMSArXG4gICAgICAnIFdIRVJFIGlkID0gPycsIFtpZF0sIGZ1bmN0aW9uICh0eCwgcmVzdWx0KSB7XG4gICAgICAgIGlmIChyZXN1bHQucm93cy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgbWV0YWRhdGEgPSBzYWZlSnNvblBhcnNlKHJlc3VsdC5yb3dzLml0ZW0oMCkuanNvbik7XG4gICAgICAgICAgZmV0Y2hlZERvY3Muc2V0KGlkLCBtZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tEb25lKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhdmVBdHRhY2htZW50KGRpZ2VzdCwgZGF0YSwgY2FsbGJhY2spIHtcbiAgICB2YXIgc3FsID0gJ1NFTEVDVCBkaWdlc3QgRlJPTSAnICsgQVRUQUNIX1NUT1JFJDEgKyAnIFdIRVJFIGRpZ2VzdD0/JztcbiAgICB0eC5leGVjdXRlU3FsKHNxbCwgW2RpZ2VzdF0sIGZ1bmN0aW9uICh0eCwgcmVzdWx0KSB7XG4gICAgICBpZiAocmVzdWx0LnJvd3MubGVuZ3RoKSB7IC8vIGF0dGFjaG1lbnQgYWxyZWFkeSBleGlzdHNcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICAvLyB3ZSBjb3VsZCBqdXN0IGluc2VydCBiZWZvcmUgc2VsZWN0aW5nIGFuZCBjYXRjaCB0aGUgZXJyb3IsXG4gICAgICAvLyBidXQgbXkgaHVuY2ggaXMgdGhhdCBpdCdzIGNoZWFwZXIgbm90IHRvIHNlcmlhbGl6ZSB0aGUgYmxvYlxuICAgICAgLy8gZnJvbSBKUyB0byBDIGlmIHdlIGRvbid0IGhhdmUgdG8gKFRPRE86IGNvbmZpcm0gdGhpcylcbiAgICAgIHNxbCA9ICdJTlNFUlQgSU5UTyAnICsgQVRUQUNIX1NUT1JFJDEgK1xuICAgICAgJyAoZGlnZXN0LCBib2R5LCBlc2NhcGVkKSBWQUxVRVMgKD8sPywxKSc7XG4gICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW2RpZ2VzdCwgZXNjYXBlQmxvYihkYXRhKV0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gaWdub3JlIGNvbnN0YWludCBlcnJvcnMsIG1lYW5zIGl0IGFscmVhZHkgZXhpc3RzXG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gYWNrIHdlIGhhbmRsZWQgdGhlIGVycm9yXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByZXByb2Nlc3NBdHRhY2htZW50cyhkb2NJbmZvcywgJ2JpbmFyeScsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICB9XG4gICAgZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHR4bikge1xuICAgICAgdHggPSB0eG47XG4gICAgICB2ZXJpZnlBdHRhY2htZW50cyhmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBwcmVjb25kaXRpb25FcnJvcmVkID0gZXJyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZldGNoRXhpc3RpbmdEb2NzKHdlYnNxbFByb2Nlc3NEb2NzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgd2Vic3FsRXJyb3IoY2FsbGJhY2spLCBjb21wbGV0ZSk7XG4gIH0pO1xufVxuXG52YXIgY2FjaGVkRGF0YWJhc2VzID0gbmV3IF9NYXAoKTtcblxuLy8gb3BlbkRhdGFiYXNlIHBhc3NlZCBpbiB0aHJvdWdoIG9wdHMgKGUuZy4gZm9yIG5vZGUtd2Vic3FsKVxuZnVuY3Rpb24gb3BlbkRhdGFiYXNlV2l0aE9wdHMob3B0cykge1xuICByZXR1cm4gb3B0cy53ZWJzcWwob3B0cy5uYW1lLCBvcHRzLnZlcnNpb24sIG9wdHMuZGVzY3JpcHRpb24sIG9wdHMuc2l6ZSk7XG59XG5cbmZ1bmN0aW9uIG9wZW5EQlNhZmVseShvcHRzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRiOiBvcGVuRGF0YWJhc2VXaXRoT3B0cyhvcHRzKVxuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiB7XG4gICAgICBlcnJvcjogZXJyXG4gICAgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcGVuREIkMShvcHRzKSB7XG4gIHZhciBjYWNoZWRSZXN1bHQgPSBjYWNoZWREYXRhYmFzZXMuZ2V0KG9wdHMubmFtZSk7XG4gIGlmICghY2FjaGVkUmVzdWx0KSB7XG4gICAgY2FjaGVkUmVzdWx0ID0gb3BlbkRCU2FmZWx5KG9wdHMpO1xuICAgIGNhY2hlZERhdGFiYXNlcy5zZXQob3B0cy5uYW1lLCBjYWNoZWRSZXN1bHQpO1xuICB9XG4gIHJldHVybiBjYWNoZWRSZXN1bHQ7XG59XG5cbnZhciB3ZWJzcWxDaGFuZ2VzID0gbmV3IENoYW5nZXMoKTtcblxuZnVuY3Rpb24gZmV0Y2hBdHRhY2htZW50c0lmTmVjZXNzYXJ5JDEoZG9jLCBvcHRzLCBhcGksIHR4biwgY2IpIHtcbiAgdmFyIGF0dGFjaG1lbnRzID0gT2JqZWN0LmtleXMoZG9jLl9hdHRhY2htZW50cyB8fCB7fSk7XG4gIGlmICghYXR0YWNobWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGNiICYmIGNiKCk7XG4gIH1cbiAgdmFyIG51bURvbmUgPSAwO1xuXG4gIGZ1bmN0aW9uIGNoZWNrRG9uZSgpIHtcbiAgICBpZiAoKytudW1Eb25lID09PSBhdHRhY2htZW50cy5sZW5ndGggJiYgY2IpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hBdHRhY2htZW50KGRvYywgYXR0KSB7XG4gICAgdmFyIGF0dE9iaiA9IGRvYy5fYXR0YWNobWVudHNbYXR0XTtcbiAgICB2YXIgYXR0T3B0cyA9IHtiaW5hcnk6IG9wdHMuYmluYXJ5LCBjdHg6IHR4bn07XG4gICAgYXBpLl9nZXRBdHRhY2htZW50KGRvYy5faWQsIGF0dCwgYXR0T2JqLCBhdHRPcHRzLCBmdW5jdGlvbiAoXywgZGF0YSkge1xuICAgICAgZG9jLl9hdHRhY2htZW50c1thdHRdID0gZXh0ZW5kJDEoXG4gICAgICAgIHBpY2soYXR0T2JqLCBbJ2RpZ2VzdCcsICdjb250ZW50X3R5cGUnXSksXG4gICAgICAgIHsgZGF0YTogZGF0YSB9XG4gICAgICApO1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfSk7XG4gIH1cblxuICBhdHRhY2htZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChhdHQpIHtcbiAgICBpZiAob3B0cy5hdHRhY2htZW50cyAmJiBvcHRzLmluY2x1ZGVfZG9jcykge1xuICAgICAgZmV0Y2hBdHRhY2htZW50KGRvYywgYXR0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jLl9hdHRhY2htZW50c1thdHRdLnN0dWIgPSB0cnVlO1xuICAgICAgY2hlY2tEb25lKCk7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIFBPVUNIX1ZFUlNJT04gPSAxO1xuXG4vLyB0aGVzZSBpbmRleGVzIGNvdmVyIHRoZSBncm91bmQgZm9yIG1vc3QgYWxsRG9jcyBxdWVyaWVzXG52YXIgQllfU0VRX1NUT1JFX0RFTEVURURfSU5ERVhfU1FMID1cbiAgJ0NSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIFxcJ2J5LXNlcS1kZWxldGVkLWlkeFxcJyBPTiAnICtcbiAgQllfU0VRX1NUT1JFJDEgKyAnIChzZXEsIGRlbGV0ZWQpJztcbnZhciBCWV9TRVFfU1RPUkVfRE9DX0lEX1JFVl9JTkRFWF9TUUwgPVxuICAnQ1JFQVRFIFVOSVFVRSBJTkRFWCBJRiBOT1QgRVhJU1RTIFxcJ2J5LXNlcS1kb2MtaWQtcmV2XFwnIE9OICcgK1xuICAgIEJZX1NFUV9TVE9SRSQxICsgJyAoZG9jX2lkLCByZXYpJztcbnZhciBET0NfU1RPUkVfV0lOTklOR1NFUV9JTkRFWF9TUUwgPVxuICAnQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgXFwnZG9jLXdpbm5pbmdzZXEtaWR4XFwnIE9OICcgK1xuICBET0NfU1RPUkUkMSArICcgKHdpbm5pbmdzZXEpJztcbnZhciBBVFRBQ0hfQU5EX1NFUV9TVE9SRV9TRVFfSU5ERVhfU1FMID1cbiAgJ0NSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIFxcJ2F0dGFjaC1zZXEtc2VxLWlkeFxcJyBPTiAnICtcbiAgICBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxICsgJyAoc2VxKSc7XG52YXIgQVRUQUNIX0FORF9TRVFfU1RPUkVfQVRUQUNIX0lOREVYX1NRTCA9XG4gICdDUkVBVEUgVU5JUVVFIElOREVYIElGIE5PVCBFWElTVFMgXFwnYXR0YWNoLXNlcS1kaWdlc3QtaWR4XFwnIE9OICcgK1xuICAgIEFUVEFDSF9BTkRfU0VRX1NUT1JFJDEgKyAnIChkaWdlc3QsIHNlcSknO1xuXG52YXIgRE9DX1NUT1JFX0FORF9CWV9TRVFfSk9JTkVSID0gQllfU0VRX1NUT1JFJDEgK1xuICAnLnNlcSA9ICcgKyBET0NfU1RPUkUkMSArICcud2lubmluZ3NlcSc7XG5cbnZhciBTRUxFQ1RfRE9DUyA9IEJZX1NFUV9TVE9SRSQxICsgJy5zZXEgQVMgc2VxLCAnICtcbiAgQllfU0VRX1NUT1JFJDEgKyAnLmRlbGV0ZWQgQVMgZGVsZXRlZCwgJyArXG4gIEJZX1NFUV9TVE9SRSQxICsgJy5qc29uIEFTIGRhdGEsICcgK1xuICBCWV9TRVFfU1RPUkUkMSArICcucmV2IEFTIHJldiwgJyArXG4gIERPQ19TVE9SRSQxICsgJy5qc29uIEFTIG1ldGFkYXRhJztcblxuZnVuY3Rpb24gV2ViU3FsUG91Y2gkMShvcHRzLCBjYWxsYmFjaykge1xuICB2YXIgYXBpID0gdGhpcztcbiAgdmFyIGluc3RhbmNlSWQgPSBudWxsO1xuICB2YXIgc2l6ZSA9IGdldFNpemUob3B0cyk7XG4gIHZhciBpZFJlcXVlc3RzID0gW107XG4gIHZhciBlbmNvZGluZztcblxuICBhcGkuX2RvY0NvdW50ID0gLTE7IC8vIGNhY2hlIHNxbGl0ZSBjb3VudCgqKSBmb3IgcGVyZm9ybWFuY2VcbiAgYXBpLl9uYW1lID0gb3B0cy5uYW1lO1xuXG4gIC8vIGV4dGVuZCB0aGUgb3B0aW9ucyBoZXJlLCBiZWNhdXNlIHNxbGl0ZSBwbHVnaW4gaGFzIGEgdG9uIG9mIG9wdGlvbnNcbiAgLy8gYW5kIHRoZXkgYXJlIGNvbnN0YW50bHkgY2hhbmdpbmcsIHNvIGl0J3MgbW9yZSBwcnVkZW50IHRvIGFsbG93IGFueXRoaW5nXG4gIHZhciB3ZWJzcWxPcHRzID0gZXh0ZW5kJDEoe30sIG9wdHMsIHtcbiAgICB2ZXJzaW9uOiBQT1VDSF9WRVJTSU9OLFxuICAgIGRlc2NyaXB0aW9uOiBvcHRzLm5hbWUsXG4gICAgc2l6ZTogc2l6ZVxuICB9KTtcbiAgdmFyIG9wZW5EQlJlc3VsdCA9IG9wZW5EQiQxKHdlYnNxbE9wdHMpO1xuICBpZiAob3BlbkRCUmVzdWx0LmVycm9yKSB7XG4gICAgcmV0dXJuIHdlYnNxbEVycm9yKGNhbGxiYWNrKShvcGVuREJSZXN1bHQuZXJyb3IpO1xuICB9XG4gIHZhciBkYiA9IG9wZW5EQlJlc3VsdC5kYjtcbiAgaWYgKHR5cGVvZiBkYi5yZWFkVHJhbnNhY3Rpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBkb2Vzbid0IGV4aXN0IGluIHNxbGl0ZSBwbHVnaW5cbiAgICBkYi5yZWFkVHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRiQ3JlYXRlZCgpIHtcbiAgICAvLyBub3RlIHRoZSBkYiBuYW1lIGluIGNhc2UgdGhlIGJyb3dzZXIgdXBncmFkZXMgdG8gaWRiXG4gICAgaWYgKGhhc0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlWydfcG91Y2hfX3dlYnNxbGRiXycgKyBhcGkuX25hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgY2FsbGJhY2sobnVsbCwgYXBpKTtcbiAgfVxuXG4gIC8vIEluIHRoaXMgbWlncmF0aW9uLCB3ZSBhZGRlZCB0aGUgJ2RlbGV0ZWQnIGFuZCAnbG9jYWwnIGNvbHVtbnMgdG8gdGhlXG4gIC8vIGJ5LXNlcSBhbmQgZG9jIHN0b3JlIHRhYmxlcy5cbiAgLy8gVG8gcHJlc2VydmUgZXhpc3RpbmcgdXNlciBkYXRhLCB3ZSByZS1wcm9jZXNzIGFsbCB0aGUgZXhpc3RpbmcgSlNPTlxuICAvLyBhbmQgYWRkIHRoZXNlIHZhbHVlcy5cbiAgLy8gQ2FsbGVkIG1pZ3JhdGlvbjIgYmVjYXVzZSBpdCBjb3JyZXNwb25kcyB0byBhZGFwdGVyIHZlcnNpb24gKGRiX3ZlcnNpb24pICMyXG4gIGZ1bmN0aW9uIHJ1bk1pZ3JhdGlvbjIodHgsIGNhbGxiYWNrKSB7XG4gICAgLy8gaW5kZXggdXNlZCBmb3IgdGhlIGpvaW4gaW4gdGhlIGFsbERvY3MgcXVlcnlcbiAgICB0eC5leGVjdXRlU3FsKERPQ19TVE9SRV9XSU5OSU5HU0VRX0lOREVYX1NRTCk7XG5cbiAgICB0eC5leGVjdXRlU3FsKCdBTFRFUiBUQUJMRSAnICsgQllfU0VRX1NUT1JFJDEgK1xuICAgICAgJyBBREQgQ09MVU1OIGRlbGV0ZWQgVElOWUlOVCgxKSBERUZBVUxUIDAnLCBbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgdHguZXhlY3V0ZVNxbChCWV9TRVFfU1RPUkVfREVMRVRFRF9JTkRFWF9TUUwpO1xuICAgICAgdHguZXhlY3V0ZVNxbCgnQUxURVIgVEFCTEUgJyArIERPQ19TVE9SRSQxICtcbiAgICAgICAgJyBBREQgQ09MVU1OIGxvY2FsIFRJTllJTlQoMSkgREVGQVVMVCAwJywgW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHguZXhlY3V0ZVNxbCgnQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgXFwnZG9jLXN0b3JlLWxvY2FsLWlkeFxcJyBPTiAnICtcbiAgICAgICAgICBET0NfU1RPUkUkMSArICcgKGxvY2FsLCBpZCknKTtcblxuICAgICAgICB2YXIgc3FsID0gJ1NFTEVDVCAnICsgRE9DX1NUT1JFJDEgKyAnLndpbm5pbmdzZXEgQVMgc2VxLCAnICsgRE9DX1NUT1JFJDEgK1xuICAgICAgICAgICcuanNvbiBBUyBtZXRhZGF0YSBGUk9NICcgKyBCWV9TRVFfU1RPUkUkMSArICcgSk9JTiAnICsgRE9DX1NUT1JFJDEgK1xuICAgICAgICAgICcgT04gJyArIEJZX1NFUV9TVE9SRSQxICsgJy5zZXEgPSAnICsgRE9DX1NUT1JFJDEgKyAnLndpbm5pbmdzZXEnO1xuXG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4LCByZXN1bHQpIHtcblxuICAgICAgICAgIHZhciBkZWxldGVkID0gW107XG4gICAgICAgICAgdmFyIGxvY2FsID0gW107XG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdC5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IHJlc3VsdC5yb3dzLml0ZW0oaSk7XG4gICAgICAgICAgICB2YXIgc2VxID0gaXRlbS5zZXE7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGEgPSBKU09OLnBhcnNlKGl0ZW0ubWV0YWRhdGEpO1xuICAgICAgICAgICAgaWYgKGlzRGVsZXRlZChtZXRhZGF0YSkpIHtcbiAgICAgICAgICAgICAgZGVsZXRlZC5wdXNoKHNlcSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNMb2NhbElkKG1ldGFkYXRhLmlkKSkge1xuICAgICAgICAgICAgICBsb2NhbC5wdXNoKG1ldGFkYXRhLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdHguZXhlY3V0ZVNxbCgnVVBEQVRFICcgKyBET0NfU1RPUkUkMSArICdTRVQgbG9jYWwgPSAxIFdIRVJFIGlkIElOICcgK1xuICAgICAgICAgICAgcU1hcmtzKGxvY2FsLmxlbmd0aCksIGxvY2FsLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0eC5leGVjdXRlU3FsKCdVUERBVEUgJyArIEJZX1NFUV9TVE9SRSQxICtcbiAgICAgICAgICAgICAgJyBTRVQgZGVsZXRlZCA9IDEgV0hFUkUgc2VxIElOICcgK1xuICAgICAgICAgICAgICBxTWFya3MoZGVsZXRlZC5sZW5ndGgpLCBkZWxldGVkLCBjYWxsYmFjayk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBpbiB0aGlzIG1pZ3JhdGlvbiwgd2UgbWFrZSBhbGwgdGhlIGxvY2FsIGRvY3MgdW52ZXJzaW9uZWRcbiAgZnVuY3Rpb24gcnVuTWlncmF0aW9uMyh0eCwgY2FsbGJhY2spIHtcbiAgICB2YXIgbG9jYWwgPSAnQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgJyArIExPQ0FMX1NUT1JFJDEgK1xuICAgICAgJyAoaWQgVU5JUVVFLCByZXYsIGpzb24pJztcbiAgICB0eC5leGVjdXRlU3FsKGxvY2FsLCBbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNxbCA9ICdTRUxFQ1QgJyArIERPQ19TVE9SRSQxICsgJy5pZCBBUyBpZCwgJyArXG4gICAgICAgIEJZX1NFUV9TVE9SRSQxICsgJy5qc29uIEFTIGRhdGEgJyArXG4gICAgICAgICdGUk9NICcgKyBCWV9TRVFfU1RPUkUkMSArICcgSk9JTiAnICtcbiAgICAgICAgRE9DX1NUT1JFJDEgKyAnIE9OICcgKyBCWV9TRVFfU1RPUkUkMSArICcuc2VxID0gJyArXG4gICAgICAgIERPQ19TVE9SRSQxICsgJy53aW5uaW5nc2VxIFdIRVJFIGxvY2FsID0gMSc7XG4gICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgIHZhciByb3dzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLnJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICByb3dzLnB1c2gocmVzLnJvd3MuaXRlbShpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZG9OZXh0KCkge1xuICAgICAgICAgIGlmICghcm93cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0eCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciByb3cgPSByb3dzLnNoaWZ0KCk7XG4gICAgICAgICAgdmFyIHJldiA9IEpTT04ucGFyc2Uocm93LmRhdGEpLl9yZXY7XG4gICAgICAgICAgdHguZXhlY3V0ZVNxbCgnSU5TRVJUIElOVE8gJyArIExPQ0FMX1NUT1JFJDEgK1xuICAgICAgICAgICAgICAnIChpZCwgcmV2LCBqc29uKSBWQUxVRVMgKD8sPyw/KScsXG4gICAgICAgICAgICAgIFtyb3cuaWQsIHJldiwgcm93LmRhdGFdLCBmdW5jdGlvbiAodHgpIHtcbiAgICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoJ0RFTEVURSBGUk9NICcgKyBET0NfU1RPUkUkMSArICcgV0hFUkUgaWQ9PycsXG4gICAgICAgICAgICAgICAgW3Jvdy5pZF0sIGZ1bmN0aW9uICh0eCkge1xuICAgICAgICAgICAgICB0eC5leGVjdXRlU3FsKCdERUxFVEUgRlJPTSAnICsgQllfU0VRX1NUT1JFJDEgKyAnIFdIRVJFIHNlcT0/JyxcbiAgICAgICAgICAgICAgICAgIFtyb3cuc2VxXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRvTmV4dCgpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGRvTmV4dCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBpbiB0aGlzIG1pZ3JhdGlvbiwgd2UgcmVtb3ZlIGRvY19pZF9yZXYgYW5kIGp1c3QgdXNlIHJldlxuICBmdW5jdGlvbiBydW5NaWdyYXRpb240KHR4LCBjYWxsYmFjaykge1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUm93cyhyb3dzKSB7XG4gICAgICBmdW5jdGlvbiBkb05leHQoKSB7XG4gICAgICAgIGlmICghcm93cy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodHgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByb3cgPSByb3dzLnNoaWZ0KCk7XG4gICAgICAgIHZhciBkb2NfaWRfcmV2ID0gcGFyc2VIZXhTdHJpbmcocm93LmhleCwgZW5jb2RpbmcpO1xuICAgICAgICB2YXIgaWR4ID0gZG9jX2lkX3Jldi5sYXN0SW5kZXhPZignOjonKTtcbiAgICAgICAgdmFyIGRvY19pZCA9IGRvY19pZF9yZXYuc3Vic3RyaW5nKDAsIGlkeCk7XG4gICAgICAgIHZhciByZXYgPSBkb2NfaWRfcmV2LnN1YnN0cmluZyhpZHggKyAyKTtcbiAgICAgICAgdmFyIHNxbCA9ICdVUERBVEUgJyArIEJZX1NFUV9TVE9SRSQxICtcbiAgICAgICAgICAnIFNFVCBkb2NfaWQ9PywgcmV2PT8gV0hFUkUgZG9jX2lkX3Jldj0/JztcbiAgICAgICAgdHguZXhlY3V0ZVNxbChzcWwsIFtkb2NfaWQsIHJldiwgZG9jX2lkX3Jldl0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkb05leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBkb05leHQoKTtcbiAgICB9XG5cbiAgICB2YXIgc3FsID0gJ0FMVEVSIFRBQkxFICcgKyBCWV9TRVFfU1RPUkUkMSArICcgQUREIENPTFVNTiBkb2NfaWQnO1xuICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4KSB7XG4gICAgICB2YXIgc3FsID0gJ0FMVEVSIFRBQkxFICcgKyBCWV9TRVFfU1RPUkUkMSArICcgQUREIENPTFVNTiByZXYnO1xuICAgICAgdHguZXhlY3V0ZVNxbChzcWwsIFtdLCBmdW5jdGlvbiAodHgpIHtcbiAgICAgICAgdHguZXhlY3V0ZVNxbChCWV9TRVFfU1RPUkVfRE9DX0lEX1JFVl9JTkRFWF9TUUwsIFtdLCBmdW5jdGlvbiAodHgpIHtcbiAgICAgICAgICB2YXIgc3FsID0gJ1NFTEVDVCBoZXgoZG9jX2lkX3JldikgYXMgaGV4IEZST00gJyArIEJZX1NFUV9TVE9SRSQxO1xuICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4LCByZXMpIHtcbiAgICAgICAgICAgIHZhciByb3dzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcy5yb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHJvd3MucHVzaChyZXMucm93cy5pdGVtKGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHVwZGF0ZVJvd3Mocm93cyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBpbiB0aGlzIG1pZ3JhdGlvbiwgd2UgYWRkIHRoZSBhdHRhY2hfYW5kX3NlcSB0YWJsZVxuICAvLyBmb3IgaXNzdWUgIzI4MThcbiAgZnVuY3Rpb24gcnVuTWlncmF0aW9uNSh0eCwgY2FsbGJhY2spIHtcblxuICAgIGZ1bmN0aW9uIG1pZ3JhdGVBdHRzQW5kU2Vxcyh0eCkge1xuICAgICAgLy8gbmVlZCB0byBhY3R1YWxseSBwb3B1bGF0ZSB0aGUgdGFibGUuIHRoaXMgaXMgdGhlIGV4cGVuc2l2ZSBwYXJ0LFxuICAgICAgLy8gc28gYXMgYW4gb3B0aW1pemF0aW9uLCBjaGVjayBmaXJzdCB0aGF0IHRoaXMgZGF0YWJhc2UgZXZlblxuICAgICAgLy8gY29udGFpbnMgYXR0YWNobWVudHNcbiAgICAgIHZhciBzcWwgPSAnU0VMRUNUIENPVU5UKCopIEFTIGNudCBGUk9NICcgKyBBVFRBQ0hfU1RPUkUkMTtcbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4LCByZXMpIHtcbiAgICAgICAgdmFyIGNvdW50ID0gcmVzLnJvd3MuaXRlbSgwKS5jbnQ7XG4gICAgICAgIGlmICghY291bnQpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgIHZhciBwYWdlU2l6ZSA9IDEwO1xuICAgICAgICBmdW5jdGlvbiBuZXh0UGFnZSgpIHtcbiAgICAgICAgICB2YXIgc3FsID0gc2VsZWN0KFxuICAgICAgICAgICAgU0VMRUNUX0RPQ1MgKyAnLCAnICsgRE9DX1NUT1JFJDEgKyAnLmlkIEFTIGlkJyxcbiAgICAgICAgICAgIFtET0NfU1RPUkUkMSwgQllfU0VRX1NUT1JFJDFdLFxuICAgICAgICAgICAgRE9DX1NUT1JFX0FORF9CWV9TRVFfSk9JTkVSLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIERPQ19TVE9SRSQxICsgJy5pZCAnXG4gICAgICAgICAgKTtcbiAgICAgICAgICBzcWwgKz0gJyBMSU1JVCAnICsgcGFnZVNpemUgKyAnIE9GRlNFVCAnICsgb2Zmc2V0O1xuICAgICAgICAgIG9mZnNldCArPSBwYWdlU2l6ZTtcbiAgICAgICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgICAgICBpZiAoIXJlcy5yb3dzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRpZ2VzdFNlcXMgPSB7fTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZERpZ2VzdFNlcShkaWdlc3QsIHNlcSkge1xuICAgICAgICAgICAgICAvLyB1bmlxIGRpZ2VzdC9zZXEgcGFpcnMsIGp1c3QgaW4gY2FzZSB0aGVyZSBhcmUgZHVwc1xuICAgICAgICAgICAgICB2YXIgc2VxcyA9IGRpZ2VzdFNlcXNbZGlnZXN0XSA9IChkaWdlc3RTZXFzW2RpZ2VzdF0gfHwgW10pO1xuICAgICAgICAgICAgICBpZiAoc2Vxcy5pbmRleE9mKHNlcSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc2Vxcy5wdXNoKHNlcSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzLnJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgdmFyIHJvdyA9IHJlcy5yb3dzLml0ZW0oaSk7XG4gICAgICAgICAgICAgIHZhciBkb2MgPSB1bnN0cmluZ2lmeURvYyhyb3cuZGF0YSwgcm93LmlkLCByb3cucmV2KTtcbiAgICAgICAgICAgICAgdmFyIGF0dHMgPSBPYmplY3Qua2V5cyhkb2MuX2F0dGFjaG1lbnRzIHx8IHt9KTtcbiAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhdHRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dCA9IGRvYy5fYXR0YWNobWVudHNbYXR0c1tqXV07XG4gICAgICAgICAgICAgICAgYWRkRGlnZXN0U2VxKGF0dC5kaWdlc3QsIHJvdy5zZXEpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGlnZXN0U2VxUGFpcnMgPSBbXTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGRpZ2VzdFNlcXMpLmZvckVhY2goZnVuY3Rpb24gKGRpZ2VzdCkge1xuICAgICAgICAgICAgICB2YXIgc2VxcyA9IGRpZ2VzdFNlcXNbZGlnZXN0XTtcbiAgICAgICAgICAgICAgc2Vxcy5mb3JFYWNoKGZ1bmN0aW9uIChzZXEpIHtcbiAgICAgICAgICAgICAgICBkaWdlc3RTZXFQYWlycy5wdXNoKFtkaWdlc3QsIHNlcV0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFkaWdlc3RTZXFQYWlycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5leHRQYWdlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbnVtRG9uZSA9IDA7XG4gICAgICAgICAgICBkaWdlc3RTZXFQYWlycy5mb3JFYWNoKGZ1bmN0aW9uIChwYWlyKSB7XG4gICAgICAgICAgICAgIHZhciBzcWwgPSAnSU5TRVJUIElOVE8gJyArIEFUVEFDSF9BTkRfU0VRX1NUT1JFJDEgK1xuICAgICAgICAgICAgICAgICcgKGRpZ2VzdCwgc2VxKSBWQUxVRVMgKD8sPyknO1xuICAgICAgICAgICAgICB0eC5leGVjdXRlU3FsKHNxbCwgcGFpciwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgrK251bURvbmUgPT09IGRpZ2VzdFNlcVBhaXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgbmV4dFBhZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dFBhZ2UoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBhdHRhY2hBbmRSZXYgPSAnQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgJyArXG4gICAgICBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxICsgJyAoZGlnZXN0LCBzZXEgSU5URUdFUiknO1xuICAgIHR4LmV4ZWN1dGVTcWwoYXR0YWNoQW5kUmV2LCBbXSwgZnVuY3Rpb24gKHR4KSB7XG4gICAgICB0eC5leGVjdXRlU3FsKFxuICAgICAgICBBVFRBQ0hfQU5EX1NFUV9TVE9SRV9BVFRBQ0hfSU5ERVhfU1FMLCBbXSwgZnVuY3Rpb24gKHR4KSB7XG4gICAgICAgICAgdHguZXhlY3V0ZVNxbChcbiAgICAgICAgICAgIEFUVEFDSF9BTkRfU0VRX1NUT1JFX1NFUV9JTkRFWF9TUUwsIFtdLFxuICAgICAgICAgICAgbWlncmF0ZUF0dHNBbmRTZXFzKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBpbiB0aGlzIG1pZ3JhdGlvbiwgd2UgdXNlIGVzY2FwZUJsb2IoKSBhbmQgdW5lc2NhcGVCbG9iKClcbiAgLy8gaW5zdGVhZCBvZiByZWFkaW5nIG91dCB0aGUgYmluYXJ5IGFzIEhFWCwgd2hpY2ggaXMgc2xvd1xuICBmdW5jdGlvbiBydW5NaWdyYXRpb242KHR4LCBjYWxsYmFjaykge1xuICAgIHZhciBzcWwgPSAnQUxURVIgVEFCTEUgJyArIEFUVEFDSF9TVE9SRSQxICtcbiAgICAgICcgQUREIENPTFVNTiBlc2NhcGVkIFRJTllJTlQoMSkgREVGQVVMVCAwJztcbiAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIGlzc3VlICMzMTM2LCBpbiB0aGlzIG1pZ3JhdGlvbiB3ZSBuZWVkIGEgXCJsYXRlc3Qgc2VxXCIgYXMgd2VsbFxuICAvLyBhcyB0aGUgXCJ3aW5uaW5nIHNlcVwiIGluIHRoZSBkb2Mgc3RvcmVcbiAgZnVuY3Rpb24gcnVuTWlncmF0aW9uNyh0eCwgY2FsbGJhY2spIHtcbiAgICB2YXIgc3FsID0gJ0FMVEVSIFRBQkxFICcgKyBET0NfU1RPUkUkMSArXG4gICAgICAnIEFERCBDT0xVTU4gbWF4X3NlcSBJTlRFR0VSJztcbiAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGZ1bmN0aW9uICh0eCkge1xuICAgICAgdmFyIHNxbCA9ICdVUERBVEUgJyArIERPQ19TVE9SRSQxICsgJyBTRVQgbWF4X3NlcT0oU0VMRUNUIE1BWChzZXEpIEZST00gJyArXG4gICAgICAgIEJZX1NFUV9TVE9SRSQxICsgJyBXSEVSRSBkb2NfaWQ9aWQpJztcbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4KSB7XG4gICAgICAgIC8vIGFkZCB1bmlxdWUgaW5kZXggYWZ0ZXIgZmlsbGluZywgZWxzZSB3ZSdsbCBnZXQgYSBjb25zdHJhaW50XG4gICAgICAgIC8vIGVycm9yIHdoZW4gd2UgZG8gdGhlIEFMVEVSIFRBQkxFXG4gICAgICAgIHZhciBzcWwgPVxuICAgICAgICAgICdDUkVBVEUgVU5JUVVFIElOREVYIElGIE5PVCBFWElTVFMgXFwnZG9jLW1heC1zZXEtaWR4XFwnIE9OICcgK1xuICAgICAgICAgIERPQ19TVE9SRSQxICsgJyAobWF4X3NlcSknO1xuICAgICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY2hlY2tFbmNvZGluZyh0eCwgY2IpIHtcbiAgICAvLyBVVEYtOCBvbiBjaHJvbWUvYW5kcm9pZCwgVVRGLTE2IG9uIHNhZmFyaSA8IDcuMVxuICAgIHR4LmV4ZWN1dGVTcWwoJ1NFTEVDVCBIRVgoXCJhXCIpIEFTIGhleCcsIFtdLCBmdW5jdGlvbiAodHgsIHJlcykge1xuICAgICAgICB2YXIgaGV4ID0gcmVzLnJvd3MuaXRlbSgwKS5oZXg7XG4gICAgICAgIGVuY29kaW5nID0gaGV4Lmxlbmd0aCA9PT0gMiA/ICdVVEYtOCcgOiAnVVRGLTE2JztcbiAgICAgICAgY2IoKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gb25HZXRJbnN0YW5jZUlkKCkge1xuICAgIHdoaWxlIChpZFJlcXVlc3RzLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBpZENhbGxiYWNrID0gaWRSZXF1ZXN0cy5wb3AoKTtcbiAgICAgIGlkQ2FsbGJhY2sobnVsbCwgaW5zdGFuY2VJZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25HZXRWZXJzaW9uKHR4LCBkYlZlcnNpb24pIHtcbiAgICBpZiAoZGJWZXJzaW9uID09PSAwKSB7XG4gICAgICAvLyBpbml0aWFsIHNjaGVtYVxuXG4gICAgICB2YXIgbWV0YSA9ICdDUkVBVEUgVEFCTEUgSUYgTk9UIEVYSVNUUyAnICsgTUVUQV9TVE9SRSQxICtcbiAgICAgICAgJyAoZGJpZCwgZGJfdmVyc2lvbiBJTlRFR0VSKSc7XG4gICAgICB2YXIgYXR0YWNoID0gJ0NSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICcgKyBBVFRBQ0hfU1RPUkUkMSArXG4gICAgICAgICcgKGRpZ2VzdCBVTklRVUUsIGVzY2FwZWQgVElOWUlOVCgxKSwgYm9keSBCTE9CKSc7XG4gICAgICB2YXIgYXR0YWNoQW5kUmV2ID0gJ0NSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICcgK1xuICAgICAgICBBVFRBQ0hfQU5EX1NFUV9TVE9SRSQxICsgJyAoZGlnZXN0LCBzZXEgSU5URUdFUiknO1xuICAgICAgLy8gVE9ETzogbWlncmF0ZSB3aW5uaW5nc2VxIHRvIElOVEVHRVJcbiAgICAgIHZhciBkb2MgPSAnQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgJyArIERPQ19TVE9SRSQxICtcbiAgICAgICAgJyAoaWQgdW5pcXVlLCBqc29uLCB3aW5uaW5nc2VxLCBtYXhfc2VxIElOVEVHRVIgVU5JUVVFKSc7XG4gICAgICB2YXIgc2VxID0gJ0NSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICcgKyBCWV9TRVFfU1RPUkUkMSArXG4gICAgICAgICcgKHNlcSBJTlRFR0VSIE5PVCBOVUxMIFBSSU1BUlkgS0VZIEFVVE9JTkNSRU1FTlQsICcgK1xuICAgICAgICAnanNvbiwgZGVsZXRlZCBUSU5ZSU5UKDEpLCBkb2NfaWQsIHJldiknO1xuICAgICAgdmFyIGxvY2FsID0gJ0NSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTICcgKyBMT0NBTF9TVE9SRSQxICtcbiAgICAgICAgJyAoaWQgVU5JUVVFLCByZXYsIGpzb24pJztcblxuICAgICAgLy8gY3JlYXRlc1xuICAgICAgdHguZXhlY3V0ZVNxbChhdHRhY2gpO1xuICAgICAgdHguZXhlY3V0ZVNxbChsb2NhbCk7XG4gICAgICB0eC5leGVjdXRlU3FsKGF0dGFjaEFuZFJldiwgW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHguZXhlY3V0ZVNxbChBVFRBQ0hfQU5EX1NFUV9TVE9SRV9TRVFfSU5ERVhfU1FMKTtcbiAgICAgICAgdHguZXhlY3V0ZVNxbChBVFRBQ0hfQU5EX1NFUV9TVE9SRV9BVFRBQ0hfSU5ERVhfU1FMKTtcbiAgICAgIH0pO1xuICAgICAgdHguZXhlY3V0ZVNxbChkb2MsIFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoRE9DX1NUT1JFX1dJTk5JTkdTRVFfSU5ERVhfU1FMKTtcbiAgICAgICAgdHguZXhlY3V0ZVNxbChzZXEsIFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdHguZXhlY3V0ZVNxbChCWV9TRVFfU1RPUkVfREVMRVRFRF9JTkRFWF9TUUwpO1xuICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoQllfU0VRX1NUT1JFX0RPQ19JRF9SRVZfSU5ERVhfU1FMKTtcbiAgICAgICAgICB0eC5leGVjdXRlU3FsKG1ldGEsIFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBtYXJrIHRoZSBkYiB2ZXJzaW9uLCBhbmQgbmV3IGRiaWRcbiAgICAgICAgICAgIHZhciBpbml0U2VxID0gJ0lOU0VSVCBJTlRPICcgKyBNRVRBX1NUT1JFJDEgK1xuICAgICAgICAgICAgICAnIChkYl92ZXJzaW9uLCBkYmlkKSBWQUxVRVMgKD8sPyknO1xuICAgICAgICAgICAgaW5zdGFuY2VJZCA9IHV1aWQoKTtcbiAgICAgICAgICAgIHZhciBpbml0U2VxQXJncyA9IFtBREFQVEVSX1ZFUlNJT04kMSwgaW5zdGFuY2VJZF07XG4gICAgICAgICAgICB0eC5leGVjdXRlU3FsKGluaXRTZXEsIGluaXRTZXFBcmdzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIG9uR2V0SW5zdGFuY2VJZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHsgLy8gdmVyc2lvbiA+IDBcblxuICAgICAgdmFyIHNldHVwRG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1pZ3JhdGVkID0gZGJWZXJzaW9uIDwgQURBUFRFUl9WRVJTSU9OJDE7XG4gICAgICAgIGlmIChtaWdyYXRlZCkge1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZGIgdmVyc2lvbiB3aXRoaW4gdGhpcyB0cmFuc2FjdGlvblxuICAgICAgICAgIHR4LmV4ZWN1dGVTcWwoJ1VQREFURSAnICsgTUVUQV9TVE9SRSQxICsgJyBTRVQgZGJfdmVyc2lvbiA9ICcgK1xuICAgICAgICAgICAgQURBUFRFUl9WRVJTSU9OJDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vdGlmeSBkYi5pZCgpIGNhbGxlcnNcbiAgICAgICAgdmFyIHNxbCA9ICdTRUxFQ1QgZGJpZCBGUk9NICcgKyBNRVRBX1NUT1JFJDE7XG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbXSwgZnVuY3Rpb24gKHR4LCByZXN1bHQpIHtcbiAgICAgICAgICBpbnN0YW5jZUlkID0gcmVzdWx0LnJvd3MuaXRlbSgwKS5kYmlkO1xuICAgICAgICAgIG9uR2V0SW5zdGFuY2VJZCgpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIHdvdWxkIGxvdmUgdG8gdXNlIHByb21pc2VzIGhlcmUsIGJ1dCB0aGVuIHdlYnNxbFxuICAgICAgLy8gZW5kcyB0aGUgdHJhbnNhY3Rpb24gZWFybHlcbiAgICAgIHZhciB0YXNrcyA9IFtcbiAgICAgICAgcnVuTWlncmF0aW9uMixcbiAgICAgICAgcnVuTWlncmF0aW9uMyxcbiAgICAgICAgcnVuTWlncmF0aW9uNCxcbiAgICAgICAgcnVuTWlncmF0aW9uNSxcbiAgICAgICAgcnVuTWlncmF0aW9uNixcbiAgICAgICAgcnVuTWlncmF0aW9uNyxcbiAgICAgICAgc2V0dXBEb25lXG4gICAgICBdO1xuXG4gICAgICAvLyBydW4gZWFjaCBtaWdyYXRpb24gc2VxdWVudGlhbGx5XG4gICAgICB2YXIgaSA9IGRiVmVyc2lvbjtcbiAgICAgIHZhciBuZXh0TWlncmF0aW9uID0gZnVuY3Rpb24gKHR4KSB7XG4gICAgICAgIHRhc2tzW2kgLSAxXSh0eCwgbmV4dE1pZ3JhdGlvbik7XG4gICAgICAgIGkrKztcbiAgICAgIH07XG4gICAgICBuZXh0TWlncmF0aW9uKHR4KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICBkYi50cmFuc2FjdGlvbihmdW5jdGlvbiAodHgpIHtcbiAgICAgIC8vIGZpcnN0IGNoZWNrIHRoZSBlbmNvZGluZ1xuICAgICAgY2hlY2tFbmNvZGluZyh0eCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB0aGVuIGdldCB0aGUgdmVyc2lvblxuICAgICAgICBmZXRjaFZlcnNpb24odHgpO1xuICAgICAgfSk7XG4gICAgfSwgd2Vic3FsRXJyb3IoY2FsbGJhY2spLCBkYkNyZWF0ZWQpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hWZXJzaW9uKHR4KSB7XG4gICAgdmFyIHNxbCA9ICdTRUxFQ1Qgc3FsIEZST00gc3FsaXRlX21hc3RlciBXSEVSRSB0YmxfbmFtZSA9ICcgKyBNRVRBX1NUT1JFJDE7XG4gICAgdHguZXhlY3V0ZVNxbChzcWwsIFtdLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgaWYgKCFyZXN1bHQucm93cy5sZW5ndGgpIHtcbiAgICAgICAgLy8gZGF0YWJhc2UgaGFzbid0IGV2ZW4gYmVlbiBjcmVhdGVkIHlldCAodmVyc2lvbiAwKVxuICAgICAgICBvbkdldFZlcnNpb24odHgsIDApO1xuICAgICAgfSBlbHNlIGlmICghL2RiX3ZlcnNpb24vLnRlc3QocmVzdWx0LnJvd3MuaXRlbSgwKS5zcWwpKSB7XG4gICAgICAgIC8vIHRhYmxlIHdhcyBjcmVhdGVkLCBidXQgd2l0aG91dCB0aGUgbmV3IGRiX3ZlcnNpb24gY29sdW1uLFxuICAgICAgICAvLyBzbyBhZGQgaXQuXG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoJ0FMVEVSIFRBQkxFICcgKyBNRVRBX1NUT1JFJDEgK1xuICAgICAgICAgICcgQUREIENPTFVNTiBkYl92ZXJzaW9uIElOVEVHRVInLCBbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIGJlZm9yZSB2ZXJzaW9uIDIsIHRoaXMgY29sdW1uIGRpZG4ndCBldmVuIGV4aXN0XG4gICAgICAgICAgb25HZXRWZXJzaW9uKHR4LCAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgeyAvLyBjb2x1bW4gZXhpc3RzLCB3ZSBjYW4gc2FmZWx5IGdldCBpdFxuICAgICAgICB0eC5leGVjdXRlU3FsKCdTRUxFQ1QgZGJfdmVyc2lvbiBGUk9NICcgKyBNRVRBX1NUT1JFJDEsXG4gICAgICAgICAgW10sIGZ1bmN0aW9uICh0eCwgcmVzdWx0KSB7XG4gICAgICAgICAgdmFyIGRiVmVyc2lvbiA9IHJlc3VsdC5yb3dzLml0ZW0oMCkuZGJfdmVyc2lvbjtcbiAgICAgICAgICBvbkdldFZlcnNpb24odHgsIGRiVmVyc2lvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2V0dXAoKTtcblxuICBhcGkudHlwZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ3dlYnNxbCc7XG4gIH07XG5cbiAgYXBpLl9pZCA9IHRvUHJvbWlzZShmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayhudWxsLCBpbnN0YW5jZUlkKTtcbiAgfSk7XG5cbiAgYXBpLl9pbmZvID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgZGIucmVhZFRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0eCkge1xuICAgICAgY291bnREb2NzKHR4LCBmdW5jdGlvbiAoZG9jQ291bnQpIHtcbiAgICAgICAgdmFyIHNxbCA9ICdTRUxFQ1QgTUFYKHNlcSkgQVMgc2VxIEZST00gJyArIEJZX1NFUV9TVE9SRSQxO1xuICAgICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW10sIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgICAgdmFyIHVwZGF0ZVNlcSA9IHJlcy5yb3dzLml0ZW0oMCkuc2VxIHx8IDA7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICAgICAgZG9jX2NvdW50OiBkb2NDb3VudCxcbiAgICAgICAgICAgIHVwZGF0ZV9zZXE6IHVwZGF0ZVNlcSxcbiAgICAgICAgICAgIHdlYnNxbF9lbmNvZGluZzogZW5jb2RpbmdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LCB3ZWJzcWxFcnJvcihjYWxsYmFjaykpO1xuICB9O1xuXG4gIGFwaS5fYnVsa0RvY3MgPSBmdW5jdGlvbiAocmVxLCByZXFPcHRzLCBjYWxsYmFjaykge1xuICAgIHdlYnNxbEJ1bGtEb2NzKG9wdHMsIHJlcSwgcmVxT3B0cywgYXBpLCBkYiwgd2Vic3FsQ2hhbmdlcywgY2FsbGJhY2spO1xuICB9O1xuXG4gIGFwaS5fZ2V0ID0gZnVuY3Rpb24gKGlkLCBvcHRzLCBjYWxsYmFjaykge1xuICAgIHZhciBkb2M7XG4gICAgdmFyIG1ldGFkYXRhO1xuICAgIHZhciBlcnI7XG4gICAgdmFyIHR4ID0gb3B0cy5jdHg7XG4gICAgaWYgKCF0eCkge1xuICAgICAgcmV0dXJuIGRiLnJlYWRUcmFuc2FjdGlvbihmdW5jdGlvbiAodHhuKSB7XG4gICAgICAgIGFwaS5fZ2V0KGlkLCBleHRlbmQkMSh7Y3R4OiB0eG59LCBvcHRzKSwgY2FsbGJhY2spO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgICAgY2FsbGJhY2soZXJyLCB7ZG9jOiBkb2MsIG1ldGFkYXRhOiBtZXRhZGF0YSwgY3R4OiB0eH0pO1xuICAgIH1cblxuICAgIHZhciBzcWw7XG4gICAgdmFyIHNxbEFyZ3M7XG4gICAgaWYgKG9wdHMucmV2KSB7XG4gICAgICBzcWwgPSBzZWxlY3QoXG4gICAgICAgIFNFTEVDVF9ET0NTLFxuICAgICAgICBbRE9DX1NUT1JFJDEsIEJZX1NFUV9TVE9SRSQxXSxcbiAgICAgICAgRE9DX1NUT1JFJDEgKyAnLmlkPScgKyBCWV9TRVFfU1RPUkUkMSArICcuZG9jX2lkJyxcbiAgICAgICAgW0JZX1NFUV9TVE9SRSQxICsgJy5kb2NfaWQ9PycsIEJZX1NFUV9TVE9SRSQxICsgJy5yZXY9PyddKTtcbiAgICAgIHNxbEFyZ3MgPSBbaWQsIG9wdHMucmV2XTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3FsID0gc2VsZWN0KFxuICAgICAgICBTRUxFQ1RfRE9DUyxcbiAgICAgICAgW0RPQ19TVE9SRSQxLCBCWV9TRVFfU1RPUkUkMV0sXG4gICAgICAgIERPQ19TVE9SRV9BTkRfQllfU0VRX0pPSU5FUixcbiAgICAgICAgRE9DX1NUT1JFJDEgKyAnLmlkPT8nKTtcbiAgICAgIHNxbEFyZ3MgPSBbaWRdO1xuICAgIH1cbiAgICB0eC5leGVjdXRlU3FsKHNxbCwgc3FsQXJncywgZnVuY3Rpb24gKGEsIHJlc3VsdHMpIHtcbiAgICAgIGlmICghcmVzdWx0cy5yb3dzLmxlbmd0aCkge1xuICAgICAgICBlcnIgPSBjcmVhdGVFcnJvcihNSVNTSU5HX0RPQywgJ21pc3NpbmcnKTtcbiAgICAgICAgcmV0dXJuIGZpbmlzaCgpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZW0gPSByZXN1bHRzLnJvd3MuaXRlbSgwKTtcbiAgICAgIG1ldGFkYXRhID0gc2FmZUpzb25QYXJzZShpdGVtLm1ldGFkYXRhKTtcbiAgICAgIGlmIChpdGVtLmRlbGV0ZWQgJiYgIW9wdHMucmV2KSB7XG4gICAgICAgIGVyciA9IGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DLCAnZGVsZXRlZCcpO1xuICAgICAgICByZXR1cm4gZmluaXNoKCk7XG4gICAgICB9XG4gICAgICBkb2MgPSB1bnN0cmluZ2lmeURvYyhpdGVtLmRhdGEsIG1ldGFkYXRhLmlkLCBpdGVtLnJldik7XG4gICAgICBmaW5pc2goKTtcbiAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBjb3VudERvY3ModHgsIGNhbGxiYWNrKSB7XG5cbiAgICBpZiAoYXBpLl9kb2NDb3VudCAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhhcGkuX2RvY0NvdW50KTtcbiAgICB9XG5cbiAgICAvLyBjb3VudCB0aGUgdG90YWwgcm93c1xuICAgIHZhciBzcWwgPSBzZWxlY3QoXG4gICAgICAnQ09VTlQoJyArIERPQ19TVE9SRSQxICsgJy5pZCkgQVMgXFwnbnVtXFwnJyxcbiAgICAgIFtET0NfU1RPUkUkMSwgQllfU0VRX1NUT1JFJDFdLFxuICAgICAgRE9DX1NUT1JFX0FORF9CWV9TRVFfSk9JTkVSLFxuICAgICAgQllfU0VRX1NUT1JFJDEgKyAnLmRlbGV0ZWQ9MCcpO1xuXG4gICAgdHguZXhlY3V0ZVNxbChzcWwsIFtdLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgYXBpLl9kb2NDb3VudCA9IHJlc3VsdC5yb3dzLml0ZW0oMCkubnVtO1xuICAgICAgY2FsbGJhY2soYXBpLl9kb2NDb3VudCk7XG4gICAgfSk7XG4gIH1cblxuICBhcGkuX2FsbERvY3MgPSBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciB0b3RhbFJvd3M7XG5cbiAgICB2YXIgc3RhcnQgPSAnc3RhcnRrZXknIGluIG9wdHMgPyBvcHRzLnN0YXJ0a2V5IDogZmFsc2U7XG4gICAgdmFyIGVuZCA9ICdlbmRrZXknIGluIG9wdHMgPyBvcHRzLmVuZGtleSA6IGZhbHNlO1xuICAgIHZhciBrZXkgPSAna2V5JyBpbiBvcHRzID8gb3B0cy5rZXkgOiBmYWxzZTtcbiAgICB2YXIgZGVzY2VuZGluZyA9ICdkZXNjZW5kaW5nJyBpbiBvcHRzID8gb3B0cy5kZXNjZW5kaW5nIDogZmFsc2U7XG4gICAgdmFyIGxpbWl0ID0gJ2xpbWl0JyBpbiBvcHRzID8gb3B0cy5saW1pdCA6IC0xO1xuICAgIHZhciBvZmZzZXQgPSAnc2tpcCcgaW4gb3B0cyA/IG9wdHMuc2tpcCA6IDA7XG4gICAgdmFyIGluY2x1c2l2ZUVuZCA9IG9wdHMuaW5jbHVzaXZlX2VuZCAhPT0gZmFsc2U7XG5cbiAgICB2YXIgc3FsQXJncyA9IFtdO1xuICAgIHZhciBjcml0ZXJpYSA9IFtdO1xuXG4gICAgaWYgKGtleSAhPT0gZmFsc2UpIHtcbiAgICAgIGNyaXRlcmlhLnB1c2goRE9DX1NUT1JFJDEgKyAnLmlkID0gPycpO1xuICAgICAgc3FsQXJncy5wdXNoKGtleSk7XG4gICAgfSBlbHNlIGlmIChzdGFydCAhPT0gZmFsc2UgfHwgZW5kICE9PSBmYWxzZSkge1xuICAgICAgaWYgKHN0YXJ0ICE9PSBmYWxzZSkge1xuICAgICAgICBjcml0ZXJpYS5wdXNoKERPQ19TVE9SRSQxICsgJy5pZCAnICsgKGRlc2NlbmRpbmcgPyAnPD0nIDogJz49JykgKyAnID8nKTtcbiAgICAgICAgc3FsQXJncy5wdXNoKHN0YXJ0KTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmQgIT09IGZhbHNlKSB7XG4gICAgICAgIHZhciBjb21wYXJhdG9yID0gZGVzY2VuZGluZyA/ICc+JyA6ICc8JztcbiAgICAgICAgaWYgKGluY2x1c2l2ZUVuZCkge1xuICAgICAgICAgIGNvbXBhcmF0b3IgKz0gJz0nO1xuICAgICAgICB9XG4gICAgICAgIGNyaXRlcmlhLnB1c2goRE9DX1NUT1JFJDEgKyAnLmlkICcgKyBjb21wYXJhdG9yICsgJyA/Jyk7XG4gICAgICAgIHNxbEFyZ3MucHVzaChlbmQpO1xuICAgICAgfVxuICAgICAgaWYgKGtleSAhPT0gZmFsc2UpIHtcbiAgICAgICAgY3JpdGVyaWEucHVzaChET0NfU1RPUkUkMSArICcuaWQgPSA/Jyk7XG4gICAgICAgIHNxbEFyZ3MucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmRlbGV0ZWQgIT09ICdvaycpIHtcbiAgICAgIC8vIHJlcG9ydCBkZWxldGVkIGlmIGtleXMgYXJlIHNwZWNpZmllZFxuICAgICAgY3JpdGVyaWEucHVzaChCWV9TRVFfU1RPUkUkMSArICcuZGVsZXRlZCA9IDAnKTtcbiAgICB9XG5cbiAgICBkYi5yZWFkVHJhbnNhY3Rpb24oZnVuY3Rpb24gKHR4KSB7XG5cbiAgICAgIC8vIGZpcnN0IGNvdW50IHVwIHRoZSB0b3RhbCByb3dzXG4gICAgICBjb3VudERvY3ModHgsIGZ1bmN0aW9uIChjb3VudCkge1xuICAgICAgICB0b3RhbFJvd3MgPSBjb3VudDtcblxuICAgICAgICBpZiAobGltaXQgPT09IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGVuIGFjdHVhbGx5IGZldGNoIHRoZSBkb2N1bWVudHNcbiAgICAgICAgdmFyIHNxbCA9IHNlbGVjdChcbiAgICAgICAgICBTRUxFQ1RfRE9DUyxcbiAgICAgICAgICBbRE9DX1NUT1JFJDEsIEJZX1NFUV9TVE9SRSQxXSxcbiAgICAgICAgICBET0NfU1RPUkVfQU5EX0JZX1NFUV9KT0lORVIsXG4gICAgICAgICAgY3JpdGVyaWEsXG4gICAgICAgICAgRE9DX1NUT1JFJDEgKyAnLmlkICcgKyAoZGVzY2VuZGluZyA/ICdERVNDJyA6ICdBU0MnKVxuICAgICAgICAgICk7XG4gICAgICAgIHNxbCArPSAnIExJTUlUICcgKyBsaW1pdCArICcgT0ZGU0VUICcgKyBvZmZzZXQ7XG5cbiAgICAgICAgdHguZXhlY3V0ZVNxbChzcWwsIHNxbEFyZ3MsIGZ1bmN0aW9uICh0eCwgcmVzdWx0KSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSByZXN1bHQucm93cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gcmVzdWx0LnJvd3MuaXRlbShpKTtcbiAgICAgICAgICAgIHZhciBtZXRhZGF0YSA9IHNhZmVKc29uUGFyc2UoaXRlbS5tZXRhZGF0YSk7XG4gICAgICAgICAgICB2YXIgaWQgPSBtZXRhZGF0YS5pZDtcbiAgICAgICAgICAgIHZhciBkYXRhID0gdW5zdHJpbmdpZnlEb2MoaXRlbS5kYXRhLCBpZCwgaXRlbS5yZXYpO1xuICAgICAgICAgICAgdmFyIHdpbm5pbmdSZXYgPSBkYXRhLl9yZXY7XG4gICAgICAgICAgICB2YXIgZG9jID0ge1xuICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgIGtleTogaWQsXG4gICAgICAgICAgICAgIHZhbHVlOiB7cmV2OiB3aW5uaW5nUmV2fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChvcHRzLmluY2x1ZGVfZG9jcykge1xuICAgICAgICAgICAgICBkb2MuZG9jID0gZGF0YTtcbiAgICAgICAgICAgICAgZG9jLmRvYy5fcmV2ID0gd2lubmluZ1JldjtcbiAgICAgICAgICAgICAgaWYgKG9wdHMuY29uZmxpY3RzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbmZsaWN0cyA9IGNvbGxlY3RDb25mbGljdHMobWV0YWRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChjb25mbGljdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICBkb2MuZG9jLl9jb25mbGljdHMgPSBjb25mbGljdHM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGZldGNoQXR0YWNobWVudHNJZk5lY2Vzc2FyeSQxKGRvYy5kb2MsIG9wdHMsIGFwaSwgdHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0uZGVsZXRlZCkge1xuICAgICAgICAgICAgICBpZiAob3B0cy5kZWxldGVkID09PSAnb2snKSB7XG4gICAgICAgICAgICAgICAgZG9jLnZhbHVlLmRlbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRvYy5kb2MgPSBudWxsO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goZG9jKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSwgd2Vic3FsRXJyb3IoY2FsbGJhY2spLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCB7XG4gICAgICAgIHRvdGFsX3Jvd3M6IHRvdGFsUm93cyxcbiAgICAgICAgb2Zmc2V0OiBvcHRzLnNraXAsXG4gICAgICAgIHJvd3M6IHJlc3VsdHNcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIGFwaS5fY2hhbmdlcyA9IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgb3B0cyA9IGNsb25lKG9wdHMpO1xuXG4gICAgaWYgKG9wdHMuY29udGludW91cykge1xuICAgICAgdmFyIGlkID0gYXBpLl9uYW1lICsgJzonICsgdXVpZCgpO1xuICAgICAgd2Vic3FsQ2hhbmdlcy5hZGRMaXN0ZW5lcihhcGkuX25hbWUsIGlkLCBhcGksIG9wdHMpO1xuICAgICAgd2Vic3FsQ2hhbmdlcy5ub3RpZnkoYXBpLl9uYW1lKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNhbmNlbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHdlYnNxbENoYW5nZXMucmVtb3ZlTGlzdGVuZXIoYXBpLl9uYW1lLCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGRlc2NlbmRpbmcgPSBvcHRzLmRlc2NlbmRpbmc7XG5cbiAgICAvLyBJZ25vcmUgdGhlIGBzaW5jZWAgcGFyYW1ldGVyIHdoZW4gYGRlc2NlbmRpbmdgIGlzIHRydWVcbiAgICBvcHRzLnNpbmNlID0gb3B0cy5zaW5jZSAmJiAhZGVzY2VuZGluZyA/IG9wdHMuc2luY2UgOiAwO1xuXG4gICAgdmFyIGxpbWl0ID0gJ2xpbWl0JyBpbiBvcHRzID8gb3B0cy5saW1pdCA6IC0xO1xuICAgIGlmIChsaW1pdCA9PT0gMCkge1xuICAgICAgbGltaXQgPSAxOyAvLyBwZXIgQ291Y2hEQiBfY2hhbmdlcyBzcGVjXG4gICAgfVxuXG4gICAgdmFyIHJldHVybkRvY3M7XG4gICAgaWYgKCdyZXR1cm5fZG9jcycgaW4gb3B0cykge1xuICAgICAgcmV0dXJuRG9jcyA9IG9wdHMucmV0dXJuX2RvY3M7XG4gICAgfSBlbHNlIGlmICgncmV0dXJuRG9jcycgaW4gb3B0cykge1xuICAgICAgLy8gVE9ETzogUmVtb3ZlICdyZXR1cm5Eb2NzJyBpbiBmYXZvciBvZiAncmV0dXJuX2RvY3MnIGluIGEgZnV0dXJlIHJlbGVhc2VcbiAgICAgIHJldHVybkRvY3MgPSBvcHRzLnJldHVybkRvY3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybkRvY3MgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBudW1SZXN1bHRzID0gMDtcblxuICAgIGZ1bmN0aW9uIGZldGNoQ2hhbmdlcygpIHtcblxuICAgICAgdmFyIHNlbGVjdFN0bXQgPVxuICAgICAgICBET0NfU1RPUkUkMSArICcuanNvbiBBUyBtZXRhZGF0YSwgJyArXG4gICAgICAgIERPQ19TVE9SRSQxICsgJy5tYXhfc2VxIEFTIG1heFNlcSwgJyArXG4gICAgICAgIEJZX1NFUV9TVE9SRSQxICsgJy5qc29uIEFTIHdpbm5pbmdEb2MsICcgK1xuICAgICAgICBCWV9TRVFfU1RPUkUkMSArICcucmV2IEFTIHdpbm5pbmdSZXYgJztcblxuICAgICAgdmFyIGZyb20gPSBET0NfU1RPUkUkMSArICcgSk9JTiAnICsgQllfU0VRX1NUT1JFJDE7XG5cbiAgICAgIHZhciBqb2luZXIgPSBET0NfU1RPUkUkMSArICcuaWQ9JyArIEJZX1NFUV9TVE9SRSQxICsgJy5kb2NfaWQnICtcbiAgICAgICAgJyBBTkQgJyArIERPQ19TVE9SRSQxICsgJy53aW5uaW5nc2VxPScgKyBCWV9TRVFfU1RPUkUkMSArICcuc2VxJztcblxuICAgICAgdmFyIGNyaXRlcmlhID0gWydtYXhTZXEgPiA/J107XG4gICAgICB2YXIgc3FsQXJncyA9IFtvcHRzLnNpbmNlXTtcblxuICAgICAgaWYgKG9wdHMuZG9jX2lkcykge1xuICAgICAgICBjcml0ZXJpYS5wdXNoKERPQ19TVE9SRSQxICsgJy5pZCBJTiAnICsgcU1hcmtzKG9wdHMuZG9jX2lkcy5sZW5ndGgpKTtcbiAgICAgICAgc3FsQXJncyA9IHNxbEFyZ3MuY29uY2F0KG9wdHMuZG9jX2lkcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBvcmRlckJ5ID0gJ21heFNlcSAnICsgKGRlc2NlbmRpbmcgPyAnREVTQycgOiAnQVNDJyk7XG5cbiAgICAgIHZhciBzcWwgPSBzZWxlY3Qoc2VsZWN0U3RtdCwgZnJvbSwgam9pbmVyLCBjcml0ZXJpYSwgb3JkZXJCeSk7XG5cbiAgICAgIHZhciBmaWx0ZXIgPSBmaWx0ZXJDaGFuZ2Uob3B0cyk7XG4gICAgICBpZiAoIW9wdHMudmlldyAmJiAhb3B0cy5maWx0ZXIpIHtcbiAgICAgICAgLy8gd2UgY2FuIGp1c3QgbGltaXQgaW4gdGhlIHF1ZXJ5XG4gICAgICAgIHNxbCArPSAnIExJTUlUICcgKyBsaW1pdDtcbiAgICAgIH1cblxuICAgICAgdmFyIGxhc3RTZXEgPSBvcHRzLnNpbmNlIHx8IDA7XG4gICAgICBkYi5yZWFkVHJhbnNhY3Rpb24oZnVuY3Rpb24gKHR4KSB7XG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBzcWxBcmdzLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgICAgIGZ1bmN0aW9uIHJlcG9ydENoYW5nZShjaGFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIG9wdHMub25DaGFuZ2UoY2hhbmdlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVzdWx0LnJvd3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IHJlc3VsdC5yb3dzLml0ZW0oaSk7XG4gICAgICAgICAgICB2YXIgbWV0YWRhdGEgPSBzYWZlSnNvblBhcnNlKGl0ZW0ubWV0YWRhdGEpO1xuICAgICAgICAgICAgbGFzdFNlcSA9IGl0ZW0ubWF4U2VxO1xuXG4gICAgICAgICAgICB2YXIgZG9jID0gdW5zdHJpbmdpZnlEb2MoaXRlbS53aW5uaW5nRG9jLCBtZXRhZGF0YS5pZCxcbiAgICAgICAgICAgICAgaXRlbS53aW5uaW5nUmV2KTtcbiAgICAgICAgICAgIHZhciBjaGFuZ2UgPSBvcHRzLnByb2Nlc3NDaGFuZ2UoZG9jLCBtZXRhZGF0YSwgb3B0cyk7XG4gICAgICAgICAgICBjaGFuZ2Uuc2VxID0gaXRlbS5tYXhTZXE7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZCA9IGZpbHRlcihjaGFuZ2UpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXJlZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9wdHMuY29tcGxldGUoZmlsdGVyZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZmlsdGVyZWQpIHtcbiAgICAgICAgICAgICAgbnVtUmVzdWx0cysrO1xuICAgICAgICAgICAgICBpZiAocmV0dXJuRG9jcykge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChjaGFuZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIHByb2Nlc3MgdGhlIGF0dGFjaG1lbnQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgLy8gZm9yIHRoZSBiZW5lZml0IG9mIGxpdmUgbGlzdGVuZXJzXG4gICAgICAgICAgICAgIGlmIChvcHRzLmF0dGFjaG1lbnRzICYmIG9wdHMuaW5jbHVkZV9kb2NzKSB7XG4gICAgICAgICAgICAgICAgZmV0Y2hBdHRhY2htZW50c0lmTmVjZXNzYXJ5JDEoZG9jLCBvcHRzLCBhcGksIHR4LFxuICAgICAgICAgICAgICAgICAgcmVwb3J0Q2hhbmdlKGNoYW5nZSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcG9ydENoYW5nZShjaGFuZ2UpKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChudW1SZXN1bHRzID09PSBsaW1pdCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSwgd2Vic3FsRXJyb3Iob3B0cy5jb21wbGV0ZSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFvcHRzLmNvbnRpbnVvdXMpIHtcbiAgICAgICAgICBvcHRzLmNvbXBsZXRlKG51bGwsIHtcbiAgICAgICAgICAgIHJlc3VsdHM6IHJlc3VsdHMsXG4gICAgICAgICAgICBsYXN0X3NlcTogbGFzdFNlcVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmZXRjaENoYW5nZXMoKTtcbiAgfTtcblxuICBhcGkuX2Nsb3NlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgLy9XZWJTUUwgZGF0YWJhc2VzIGRvIG5vdCBuZWVkIHRvIGJlIGNsb3NlZFxuICAgIGNhbGxiYWNrKCk7XG4gIH07XG5cbiAgYXBpLl9nZXRBdHRhY2htZW50ID0gZnVuY3Rpb24gKGRvY0lkLCBhdHRhY2hJZCwgYXR0YWNobWVudCwgb3B0cywgY2FsbGJhY2spIHtcbiAgICB2YXIgcmVzO1xuICAgIHZhciB0eCA9IG9wdHMuY3R4O1xuICAgIHZhciBkaWdlc3QgPSBhdHRhY2htZW50LmRpZ2VzdDtcbiAgICB2YXIgdHlwZSA9IGF0dGFjaG1lbnQuY29udGVudF90eXBlO1xuICAgIHZhciBzcWwgPSAnU0VMRUNUIGVzY2FwZWQsICcgK1xuICAgICAgJ0NBU0UgV0hFTiBlc2NhcGVkID0gMSBUSEVOIGJvZHkgRUxTRSBIRVgoYm9keSkgRU5EIEFTIGJvZHkgRlJPTSAnICtcbiAgICAgIEFUVEFDSF9TVE9SRSQxICsgJyBXSEVSRSBkaWdlc3Q9Pyc7XG4gICAgdHguZXhlY3V0ZVNxbChzcWwsIFtkaWdlc3RdLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgLy8gd2Vic3FsIGhhcyBhIGJ1ZyB3aGVyZSBcXHUwMDAwIGNhdXNlcyBlYXJseSB0cnVuY2F0aW9uIGluIHN0cmluZ3NcbiAgICAgIC8vIGFuZCBibG9icy4gdG8gd29yayBhcm91bmQgdGhpcywgd2UgdXNlZCB0byB1c2UgdGhlIGhleCgpIGZ1bmN0aW9uLFxuICAgICAgLy8gYnV0IHRoYXQncyBub3QgcGVyZm9ybWFudC4gYWZ0ZXIgbWlncmF0aW9uIDYsIHdlIHJlbW92ZSBcXHUwMDAwXG4gICAgICAvLyBhbmQgYWRkIGl0IGJhY2sgaW4gYWZ0ZXJ3YXJkc1xuICAgICAgdmFyIGl0ZW0gPSByZXN1bHQucm93cy5pdGVtKDApO1xuICAgICAgdmFyIGRhdGEgPSBpdGVtLmVzY2FwZWQgPyB1bmVzY2FwZUJsb2IoaXRlbS5ib2R5KSA6XG4gICAgICAgIHBhcnNlSGV4U3RyaW5nKGl0ZW0uYm9keSwgZW5jb2RpbmcpO1xuICAgICAgaWYgKG9wdHMuYmluYXJ5KSB7XG4gICAgICAgIHJlcyA9IGJpblN0cmluZ1RvQmx1ZmZlcihkYXRhLCB0eXBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcyA9IGJ0b2EkMShkYXRhKTtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgfSk7XG4gIH07XG5cbiAgYXBpLl9nZXRSZXZpc2lvblRyZWUgPSBmdW5jdGlvbiAoZG9jSWQsIGNhbGxiYWNrKSB7XG4gICAgZGIucmVhZFRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0eCkge1xuICAgICAgdmFyIHNxbCA9ICdTRUxFQ1QganNvbiBBUyBtZXRhZGF0YSBGUk9NICcgKyBET0NfU1RPUkUkMSArICcgV0hFUkUgaWQgPSA/JztcbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbZG9jSWRdLCBmdW5jdGlvbiAodHgsIHJlc3VsdCkge1xuICAgICAgICBpZiAoIXJlc3VsdC5yb3dzLmxlbmd0aCkge1xuICAgICAgICAgIGNhbGxiYWNrKGNyZWF0ZUVycm9yKE1JU1NJTkdfRE9DKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIGRhdGEgPSBzYWZlSnNvblBhcnNlKHJlc3VsdC5yb3dzLml0ZW0oMCkubWV0YWRhdGEpO1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEucmV2X3RyZWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBhcGkuX2RvQ29tcGFjdGlvbiA9IGZ1bmN0aW9uIChkb2NJZCwgcmV2cywgY2FsbGJhY2spIHtcbiAgICBpZiAoIXJldnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9XG4gICAgZGIudHJhbnNhY3Rpb24oZnVuY3Rpb24gKHR4KSB7XG5cbiAgICAgIC8vIHVwZGF0ZSBkb2Mgc3RvcmVcbiAgICAgIHZhciBzcWwgPSAnU0VMRUNUIGpzb24gQVMgbWV0YWRhdGEgRlJPTSAnICsgRE9DX1NUT1JFJDEgKyAnIFdIRVJFIGlkID0gPyc7XG4gICAgICB0eC5leGVjdXRlU3FsKHNxbCwgW2RvY0lkXSwgZnVuY3Rpb24gKHR4LCByZXN1bHQpIHtcbiAgICAgICAgdmFyIG1ldGFkYXRhID0gc2FmZUpzb25QYXJzZShyZXN1bHQucm93cy5pdGVtKDApLm1ldGFkYXRhKTtcbiAgICAgICAgdHJhdmVyc2VSZXZUcmVlKG1ldGFkYXRhLnJldl90cmVlLCBmdW5jdGlvbiAoaXNMZWFmLCBwb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldkhhc2gsIGN0eCwgb3B0cykge1xuICAgICAgICAgIHZhciByZXYgPSBwb3MgKyAnLScgKyByZXZIYXNoO1xuICAgICAgICAgIGlmIChyZXZzLmluZGV4T2YocmV2KSAhPT0gLTEpIHtcbiAgICAgICAgICAgIG9wdHMuc3RhdHVzID0gJ21pc3NpbmcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHNxbCA9ICdVUERBVEUgJyArIERPQ19TVE9SRSQxICsgJyBTRVQganNvbiA9ID8gV0hFUkUgaWQgPSA/JztcbiAgICAgICAgdHguZXhlY3V0ZVNxbChzcWwsIFtzYWZlSnNvblN0cmluZ2lmeShtZXRhZGF0YSksIGRvY0lkXSk7XG4gICAgICB9KTtcblxuICAgICAgY29tcGFjdFJldnMkMShyZXZzLCBkb2NJZCwgdHgpO1xuICAgIH0sIHdlYnNxbEVycm9yKGNhbGxiYWNrKSwgZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9KTtcbiAgfTtcblxuICBhcGkuX2dldExvY2FsID0gZnVuY3Rpb24gKGlkLCBjYWxsYmFjaykge1xuICAgIGRiLnJlYWRUcmFuc2FjdGlvbihmdW5jdGlvbiAodHgpIHtcbiAgICAgIHZhciBzcWwgPSAnU0VMRUNUIGpzb24sIHJldiBGUk9NICcgKyBMT0NBTF9TVE9SRSQxICsgJyBXSEVSRSBpZD0/JztcbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBbaWRdLCBmdW5jdGlvbiAodHgsIHJlcykge1xuICAgICAgICBpZiAocmVzLnJvd3MubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIGl0ZW0gPSByZXMucm93cy5pdGVtKDApO1xuICAgICAgICAgIHZhciBkb2MgPSB1bnN0cmluZ2lmeURvYyhpdGVtLmpzb24sIGlkLCBpdGVtLnJldik7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgZG9jKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihNSVNTSU5HX0RPQykpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBhcGkuX3B1dExvY2FsID0gZnVuY3Rpb24gKGRvYywgb3B0cywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgZGVsZXRlIGRvYy5fcmV2aXNpb25zOyAvLyBpZ25vcmUgdGhpcywgdHJ1c3QgdGhlIHJldlxuICAgIHZhciBvbGRSZXYgPSBkb2MuX3JldjtcbiAgICB2YXIgaWQgPSBkb2MuX2lkO1xuICAgIHZhciBuZXdSZXY7XG4gICAgaWYgKCFvbGRSZXYpIHtcbiAgICAgIG5ld1JldiA9IGRvYy5fcmV2ID0gJzAtMSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld1JldiA9IGRvYy5fcmV2ID0gJzAtJyArIChwYXJzZUludChvbGRSZXYuc3BsaXQoJy0nKVsxXSwgMTApICsgMSk7XG4gICAgfVxuICAgIHZhciBqc29uID0gc3RyaW5naWZ5RG9jKGRvYyk7XG5cbiAgICB2YXIgcmV0O1xuICAgIGZ1bmN0aW9uIHB1dExvY2FsKHR4KSB7XG4gICAgICB2YXIgc3FsO1xuICAgICAgdmFyIHZhbHVlcztcbiAgICAgIGlmIChvbGRSZXYpIHtcbiAgICAgICAgc3FsID0gJ1VQREFURSAnICsgTE9DQUxfU1RPUkUkMSArICcgU0VUIHJldj0/LCBqc29uPT8gJyArXG4gICAgICAgICAgJ1dIRVJFIGlkPT8gQU5EIHJldj0/JztcbiAgICAgICAgdmFsdWVzID0gW25ld1JldiwganNvbiwgaWQsIG9sZFJldl07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzcWwgPSAnSU5TRVJUIElOVE8gJyArIExPQ0FMX1NUT1JFJDEgKyAnIChpZCwgcmV2LCBqc29uKSBWQUxVRVMgKD8sPyw/KSc7XG4gICAgICAgIHZhbHVlcyA9IFtpZCwgbmV3UmV2LCBqc29uXTtcbiAgICAgIH1cbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCB2YWx1ZXMsIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgIGlmIChyZXMucm93c0FmZmVjdGVkKSB7XG4gICAgICAgICAgcmV0ID0ge29rOiB0cnVlLCBpZDogaWQsIHJldjogbmV3UmV2fTtcbiAgICAgICAgICBpZiAob3B0cy5jdHgpIHsgLy8gcmV0dXJuIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihSRVZfQ09ORkxJQ1QpKTtcbiAgICAgICAgfVxuICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFjayhjcmVhdGVFcnJvcihSRVZfQ09ORkxJQ1QpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBhY2sgdGhhdCB3ZSBoYW5kbGVkIHRoZSBlcnJvclxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuY3R4KSB7XG4gICAgICBwdXRMb2NhbChvcHRzLmN0eCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRiLnRyYW5zYWN0aW9uKHB1dExvY2FsLCB3ZWJzcWxFcnJvcihjYWxsYmFjayksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBhcGkuX3JlbW92ZUxvY2FsID0gZnVuY3Rpb24gKGRvYywgb3B0cywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHJldDtcblxuICAgIGZ1bmN0aW9uIHJlbW92ZUxvY2FsKHR4KSB7XG4gICAgICB2YXIgc3FsID0gJ0RFTEVURSBGUk9NICcgKyBMT0NBTF9TVE9SRSQxICsgJyBXSEVSRSBpZD0/IEFORCByZXY9Pyc7XG4gICAgICB2YXIgcGFyYW1zID0gW2RvYy5faWQsIGRvYy5fcmV2XTtcbiAgICAgIHR4LmV4ZWN1dGVTcWwoc3FsLCBwYXJhbXMsIGZ1bmN0aW9uICh0eCwgcmVzKSB7XG4gICAgICAgIGlmICghcmVzLnJvd3NBZmZlY3RlZCkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhjcmVhdGVFcnJvcihNSVNTSU5HX0RPQykpO1xuICAgICAgICB9XG4gICAgICAgIHJldCA9IHtvazogdHJ1ZSwgaWQ6IGRvYy5faWQsIHJldjogJzAtMCd9O1xuICAgICAgICBpZiAob3B0cy5jdHgpIHsgLy8gcmV0dXJuIGltbWVkaWF0ZWx5XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuY3R4KSB7XG4gICAgICByZW1vdmVMb2NhbChvcHRzLmN0eCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRiLnRyYW5zYWN0aW9uKHJlbW92ZUxvY2FsLCB3ZWJzcWxFcnJvcihjYWxsYmFjayksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJldCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBhcGkuX2Rlc3Ryb3kgPSBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgICB3ZWJzcWxDaGFuZ2VzLnJlbW92ZUFsbExpc3RlbmVycyhhcGkuX25hbWUpO1xuICAgIGRiLnRyYW5zYWN0aW9uKGZ1bmN0aW9uICh0eCkge1xuICAgICAgdmFyIHN0b3JlcyA9IFtET0NfU1RPUkUkMSwgQllfU0VRX1NUT1JFJDEsIEFUVEFDSF9TVE9SRSQxLCBNRVRBX1NUT1JFJDEsXG4gICAgICAgIExPQ0FMX1NUT1JFJDEsIEFUVEFDSF9BTkRfU0VRX1NUT1JFJDFdO1xuICAgICAgc3RvcmVzLmZvckVhY2goZnVuY3Rpb24gKHN0b3JlKSB7XG4gICAgICAgIHR4LmV4ZWN1dGVTcWwoJ0RST1AgVEFCTEUgSUYgRVhJU1RTICcgKyBzdG9yZSwgW10pO1xuICAgICAgfSk7XG4gICAgfSwgd2Vic3FsRXJyb3IoY2FsbGJhY2spLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoaGFzTG9jYWxTdG9yYWdlKCkpIHtcbiAgICAgICAgZGVsZXRlIHdpbmRvdy5sb2NhbFN0b3JhZ2VbJ19wb3VjaF9fd2Vic3FsZGJfJyArIGFwaS5fbmFtZV07XG4gICAgICAgIGRlbGV0ZSB3aW5kb3cubG9jYWxTdG9yYWdlW2FwaS5fbmFtZV07XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCB7J29rJzogdHJ1ZX0pO1xuICAgIH0pO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjYW5PcGVuVGVzdERCKCkge1xuICB0cnkge1xuICAgIG9wZW5EYXRhYmFzZSgnX3BvdWNoX3ZhbGlkYXRlX3dlYnNxbCcsIDEsICcnLCAxKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIFdLV2ViVmlldyBoYWQgYSBidWcgd2hlcmUgV2ViU1FMIHdvdWxkIHRocm93IGEgRE9NIEV4Y2VwdGlvbiAxOFxuLy8gKHNlZSBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTM3NzYwIGFuZFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3BvdWNoZGIvcG91Y2hkYi9pc3N1ZXMvNTA3OSlcbi8vIFRoaXMgaGFzIGJlZW4gZml4ZWQgaW4gbGF0ZXN0IFdlYktpdCwgc28gd2UgdHJ5IHRvIGRldGVjdCBpdCBoZXJlLlxuZnVuY3Rpb24gaXNWYWxpZFdlYlNRTCgpIHtcbiAgLy8gV0tXZWJWaWV3IFVBOlxuICAvLyAgIE1vemlsbGEvNS4wIChpUGhvbmU7IENQVSBpUGhvbmUgT1MgOV8yIGxpa2UgTWFjIE9TIFgpXG4gIC8vICAgQXBwbGVXZWJLaXQvNjAxLjEuNDYgKEtIVE1MLCBsaWtlIEdlY2tvKSBNb2JpbGUvMTNDNzVcbiAgLy8gQ2hyb21lIGZvciBpT1MgVUE6XG4gIC8vICAgTW96aWxsYS81LjAgKGlQaG9uZTsgVTsgQ1BVIGlQaG9uZSBPUyA1XzFfMSBsaWtlIE1hYyBPUyBYOyBlbilcbiAgLy8gICBBcHBsZVdlYktpdC81MzQuNDYuMCAoS0hUTUwsIGxpa2UgR2Vja28pIENyaU9TLzE5LjAuMTA4NC42MFxuICAvLyAgIE1vYmlsZS85QjIwNiBTYWZhcmkvNzUzNC40OC4zXG4gIC8vIEZpcmVmb3ggZm9yIGlPUyBVQTpcbiAgLy8gICBNb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDhfMyBsaWtlIE1hYyBPUyBYKSBBcHBsZVdlYktpdC82MDAuMS40XG4gIC8vICAgKEtIVE1MLCBsaWtlIEdlY2tvKSBGeGlPUy8xLjAgTW9iaWxlLzEyRjY5IFNhZmFyaS82MDAuMS40XG5cbiAgLy8gaW5kZXhlZERCIGlzIG51bGwgb24gc29tZSBVSVdlYlZpZXdzIGFuZCB1bmRlZmluZWQgaW4gb3RoZXJzXG4gIC8vIHNlZTogaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTEzNzAzNFxuICBpZiAodHlwZW9mIGluZGV4ZWREQiA9PT0gJ3VuZGVmaW5lZCcgfHwgaW5kZXhlZERCID09PSBudWxsIHx8XG4gICAgICAhL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgLy8gZGVmaW5pdGVseSBub3QgV0tXZWJWaWV3LCBhdm9pZCBjcmVhdGluZyBhbiB1bm5lY2Vzc2FyeSBkYXRhYmFzZVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8vIENhY2hlIHRoZSByZXN1bHQgaW4gTG9jYWxTdG9yYWdlLiBSZWFzb24gd2UgZG8gdGhpcyBpcyBiZWNhdXNlIGlmIHdlXG4gIC8vIGNhbGwgb3BlbkRhdGFiYXNlKCkgdG9vIG1hbnkgdGltZXMsIFNhZmFyaSBjcmFwcyBvdXQgaW4gU2F1Y2VMYWJzIGFuZFxuICAvLyBzdGFydHMgdGhyb3dpbmcgRE9NIEV4Y2VwdGlvbiAxNHMuXG4gIHZhciBoYXNMUyA9IGhhc0xvY2FsU3RvcmFnZSgpO1xuICAvLyBJbmNsdWRlIHVzZXIgYWdlbnQgaW4gdGhlIGhhc2gsIHNvIHRoYXQgaWYgU2FmYXJpIGlzIHVwZ3JhZGVkLCB3ZSBkb24ndFxuICAvLyBjb250aW51YWxseSB0aGluayBpdCdzIGJyb2tlbi5cbiAgdmFyIGxvY2FsU3RvcmFnZUtleSA9ICdfcG91Y2hfX3dlYnNxbGRiX3ZhbGlkXycgKyBuYXZpZ2F0b3IudXNlckFnZW50O1xuICBpZiAoaGFzTFMgJiYgbG9jYWxTdG9yYWdlW2xvY2FsU3RvcmFnZUtleV0pIHtcbiAgICByZXR1cm4gbG9jYWxTdG9yYWdlW2xvY2FsU3RvcmFnZUtleV0gPT09ICcxJztcbiAgfVxuICB2YXIgb3BlbmVkVGVzdERCID0gY2FuT3BlblRlc3REQigpO1xuICBpZiAoaGFzTFMpIHtcbiAgICBsb2NhbFN0b3JhZ2VbbG9jYWxTdG9yYWdlS2V5XSA9IG9wZW5lZFRlc3REQiA/ICcxJyA6ICcwJztcbiAgfVxuICByZXR1cm4gb3BlbmVkVGVzdERCO1xufVxuXG5mdW5jdGlvbiB2YWxpZCgpIHtcbiAgaWYgKHR5cGVvZiBvcGVuRGF0YWJhc2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGlzVmFsaWRXZWJTUUwoKTtcbn1cblxuZnVuY3Rpb24gb3BlbkRCKG5hbWUsIHZlcnNpb24sIGRlc2NyaXB0aW9uLCBzaXplKSB7XG4gIC8vIFRyYWRpdGlvbmFsIFdlYlNRTCBBUElcbiAgcmV0dXJuIG9wZW5EYXRhYmFzZShuYW1lLCB2ZXJzaW9uLCBkZXNjcmlwdGlvbiwgc2l6ZSk7XG59XG5cbmZ1bmN0aW9uIFdlYlNRTFBvdWNoKG9wdHMsIGNhbGxiYWNrKSB7XG4gIHZhciBfb3B0cyA9IGV4dGVuZCQxKHtcbiAgICB3ZWJzcWw6IG9wZW5EQlxuICB9LCBvcHRzKTtcblxuICBXZWJTcWxQb3VjaCQxLmNhbGwodGhpcywgX29wdHMsIGNhbGxiYWNrKTtcbn1cblxuV2ViU1FMUG91Y2gudmFsaWQgPSB2YWxpZDtcblxuV2ViU1FMUG91Y2gudXNlX3ByZWZpeCA9IHRydWU7XG5cbmZ1bmN0aW9uIFdlYlNxbFBvdWNoIChQb3VjaERCKSB7XG4gIFBvdWNoREIuYWRhcHRlcignd2Vic3FsJywgV2ViU1FMUG91Y2gsIHRydWUpO1xufVxuXG4vKiBnbG9iYWwgZmV0Y2ggKi9cbi8qIGdsb2JhbCBIZWFkZXJzICovXG5mdW5jdGlvbiB3cmFwcGVkRmV0Y2goKSB7XG4gIHZhciB3cmFwcGVkUHJvbWlzZSA9IHt9O1xuXG4gIHZhciBwcm9taXNlID0gbmV3IFBvdWNoUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgd3JhcHBlZFByb21pc2UucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgd3JhcHBlZFByb21pc2UucmVqZWN0ID0gcmVqZWN0O1xuICB9KTtcblxuICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgd3JhcHBlZFByb21pc2UucHJvbWlzZSA9IHByb21pc2U7XG5cbiAgUG91Y2hQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZmV0Y2guYXBwbHkobnVsbCwgYXJncyk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgd3JhcHBlZFByb21pc2UucmVzb2x2ZShyZXNwb25zZSk7XG4gIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgIHdyYXBwZWRQcm9taXNlLnJlamVjdChlcnJvcik7XG4gIH0pO1xuXG4gIHJldHVybiB3cmFwcGVkUHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hSZXF1ZXN0KG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHZhciB3cmFwcGVkUHJvbWlzZSwgdGltZXIsIHJlc3BvbnNlO1xuXG4gIHZhciBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcblxuICB2YXIgZmV0Y2hPcHRpb25zID0ge1xuICAgIG1ldGhvZDogb3B0aW9ucy5tZXRob2QsXG4gICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcbiAgICBoZWFkZXJzOiBoZWFkZXJzXG4gIH07XG5cbiAgaWYgKG9wdGlvbnMuanNvbikge1xuICAgIGhlYWRlcnMuc2V0KCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgIGhlYWRlcnMuc2V0KCdDb250ZW50LVR5cGUnLCBvcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddIHx8XG4gICAgICAnYXBwbGljYXRpb24vanNvbicpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYm9keSAmJiAob3B0aW9ucy5ib2R5IGluc3RhbmNlb2YgQmxvYikpIHtcbiAgICByZWFkQXNBcnJheUJ1ZmZlcihvcHRpb25zLmJvZHksIGZ1bmN0aW9uIChhcnJheUJ1ZmZlcikge1xuICAgICAgZmV0Y2hPcHRpb25zLmJvZHkgPSBhcnJheUJ1ZmZlcjtcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmJvZHkgJiZcbiAgICAgICAgICAgICBvcHRpb25zLnByb2Nlc3NEYXRhICYmXG4gICAgICAgICAgICAgdHlwZW9mIG9wdGlvbnMuYm9keSAhPT0gJ3N0cmluZycpIHtcbiAgICBmZXRjaE9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuYm9keSk7XG4gIH0gZWxzZSBpZiAoJ2JvZHknIGluIG9wdGlvbnMpIHtcbiAgICBmZXRjaE9wdGlvbnMuYm9keSA9IG9wdGlvbnMuYm9keTtcbiAgfSBlbHNlIHtcbiAgICBmZXRjaE9wdGlvbnMuYm9keSA9IG51bGw7XG4gIH1cblxuICBPYmplY3Qua2V5cyhvcHRpb25zLmhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgaGVhZGVycy5zZXQoa2V5LCBvcHRpb25zLmhlYWRlcnNba2V5XSk7XG4gICAgfVxuICB9KTtcblxuICB3cmFwcGVkUHJvbWlzZSA9IHdyYXBwZWRGZXRjaChvcHRpb25zLnVybCwgZmV0Y2hPcHRpb25zKTtcblxuICBpZiAob3B0aW9ucy50aW1lb3V0ID4gMCkge1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICB3cmFwcGVkUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdMb2FkIHRpbWVvdXQgZm9yIHJlc291cmNlOiAnICtcbiAgICAgICAgb3B0aW9ucy51cmwpKTtcbiAgICB9LCBvcHRpb25zLnRpbWVvdXQpO1xuICB9XG5cbiAgd3JhcHBlZFByb21pc2UucHJvbWlzZS50aGVuKGZ1bmN0aW9uIChmZXRjaFJlc3BvbnNlKSB7XG4gICAgcmVzcG9uc2UgPSB7XG4gICAgICBzdGF0dXNDb2RlOiBmZXRjaFJlc3BvbnNlLnN0YXR1c1xuICAgIH07XG5cbiAgICBpZiAob3B0aW9ucy50aW1lb3V0ID4gMCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA8IDMwMCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuYmluYXJ5ID8gZmV0Y2hSZXNwb25zZS5ibG9iKCkgOiBmZXRjaFJlc3BvbnNlLnRleHQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmV0Y2hSZXNwb25zZS5qc29uKCk7XG4gIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZSwgcmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2socmVzdWx0LCByZXNwb25zZSk7XG4gICAgfVxuICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICBjYWxsYmFjayhlcnJvciwgcmVzcG9uc2UpO1xuICB9KTtcblxuICByZXR1cm4ge2Fib3J0OiB3cmFwcGVkUHJvbWlzZS5yZWplY3R9O1xufVxuXG5mdW5jdGlvbiB4aFJlcXVlc3Qob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICB2YXIgeGhyLCB0aW1lcjtcbiAgdmFyIHRpbWVkb3V0ID0gZmFsc2U7XG5cbiAgdmFyIGFib3J0UmVxID0gZnVuY3Rpb24gKCkge1xuICAgIHhoci5hYm9ydCgpO1xuICAgIGNsZWFuVXAoKTtcbiAgfTtcblxuICB2YXIgdGltZW91dFJlcSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aW1lZG91dCA9IHRydWU7XG4gICAgeGhyLmFib3J0KCk7XG4gICAgY2xlYW5VcCgpO1xuICB9O1xuXG4gIHZhciByZXQgPSB7YWJvcnQ6IGFib3J0UmVxfTtcblxuICB2YXIgY2xlYW5VcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHJldC5hYm9ydCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIGlmICh4aHIpIHtcbiAgICAgIHhoci5vbnByb2dyZXNzID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKHhoci51cGxvYWQpIHtcbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHVuZGVmaW5lZDtcbiAgICAgIHhociA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH07XG5cbiAgaWYgKG9wdGlvbnMueGhyKSB7XG4gICAgeGhyID0gbmV3IG9wdGlvbnMueGhyKCk7XG4gIH0gZWxzZSB7XG4gICAgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gIH1cblxuICB0cnkge1xuICAgIHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCk7XG4gIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoZXhjZXB0aW9uLm5hbWUgfHwgJ1VybCBpcyBpbnZhbGlkJykpO1xuICB9XG5cbiAgeGhyLndpdGhDcmVkZW50aWFscyA9ICgnd2l0aENyZWRlbnRpYWxzJyBpbiBvcHRpb25zKSA/XG4gICAgb3B0aW9ucy53aXRoQ3JlZGVudGlhbHMgOiB0cnVlO1xuXG4gIGlmIChvcHRpb25zLm1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICBkZWxldGUgb3B0aW9ucy5oZWFkZXJzWydDb250ZW50LVR5cGUnXTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmpzb24pIHtcbiAgICBvcHRpb25zLmhlYWRlcnMuQWNjZXB0ID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgIG9wdGlvbnMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBvcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddIHx8XG4gICAgICAnYXBwbGljYXRpb24vanNvbic7XG4gICAgaWYgKG9wdGlvbnMuYm9keSAmJlxuICAgICAgICBvcHRpb25zLnByb2Nlc3NEYXRhICYmXG4gICAgICAgIHR5cGVvZiBvcHRpb25zLmJvZHkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG9wdGlvbnMuYm9keSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuYm9keSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdGlvbnMuYmluYXJ5KSB7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gIH1cblxuICBpZiAoISgnYm9keScgaW4gb3B0aW9ucykpIHtcbiAgICBvcHRpb25zLmJvZHkgPSBudWxsO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMuaGVhZGVycykge1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoa2V5LCBvcHRpb25zLmhlYWRlcnNba2V5XSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdGlvbnMudGltZW91dCA+IDApIHtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQodGltZW91dFJlcSwgb3B0aW9ucy50aW1lb3V0KTtcbiAgICB4aHIub25wcm9ncmVzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICBpZih4aHIucmVhZHlTdGF0ZSAhPT0gNCkge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQodGltZW91dFJlcSwgb3B0aW9ucy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGlmICh0eXBlb2YgeGhyLnVwbG9hZCAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gZG9lcyBub3QgZXhpc3QgaW4gaWU5XG4gICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSB4aHIub25wcm9ncmVzcztcbiAgICB9XG4gIH1cblxuICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gNCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciByZXNwb25zZSA9IHtcbiAgICAgIHN0YXR1c0NvZGU6IHhoci5zdGF0dXNcbiAgICB9O1xuXG4gICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgIHZhciBkYXRhO1xuICAgICAgaWYgKG9wdGlvbnMuYmluYXJ5KSB7XG4gICAgICAgIGRhdGEgPSBjcmVhdGVCbG9iKFt4aHIucmVzcG9uc2UgfHwgJyddLCB7XG4gICAgICAgICAgdHlwZTogeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGEgPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UsIGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZXJyID0ge307XG4gICAgICBpZiAodGltZWRvdXQpIHtcbiAgICAgICAgZXJyID0gbmV3IEVycm9yKCdFVElNRURPVVQnKTtcbiAgICAgICAgZXJyLmNvZGUgPSAnRVRJTUVET1VUJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHhoci5yZXNwb25zZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBlcnIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZSk7XG4gICAgICAgIH0gY2F0Y2goZSkge31cbiAgICAgIH1cbiAgICAgIGVyci5zdGF0dXMgPSB4aHIuc3RhdHVzO1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICB9XG4gICAgY2xlYW5VcCgpO1xuICB9O1xuXG4gIGlmIChvcHRpb25zLmJvZHkgJiYgKG9wdGlvbnMuYm9keSBpbnN0YW5jZW9mIEJsb2IpKSB7XG4gICAgcmVhZEFzQXJyYXlCdWZmZXIob3B0aW9ucy5ib2R5LCBmdW5jdGlvbiAoYXJyYXlCdWZmZXIpIHtcbiAgICAgIHhoci5zZW5kKGFycmF5QnVmZmVyKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICB4aHIuc2VuZChvcHRpb25zLmJvZHkpO1xuICB9XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gdGVzdFhocigpIHtcbiAgcmV0dXJuIHRydWU7XG59XG5cbnZhciBoYXNYaHIgPSB0ZXN0WGhyKCk7XG5cbmZ1bmN0aW9uIGFqYXgkMShvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoaGFzWGhyIHx8IG9wdGlvbnMueGhyKSB7XG4gICAgcmV0dXJuIHhoUmVxdWVzdChvcHRpb25zLCBjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZldGNoUmVxdWVzdChvcHRpb25zLCBjYWxsYmFjayk7XG4gIH1cbn1cblxuLy8gdGhlIGJsb2IgYWxyZWFkeSBoYXMgYSB0eXBlOyBkbyBub3RoaW5nXG52YXIgcmVzJDIgPSBmdW5jdGlvbiAoKSB7fTtcblxuZnVuY3Rpb24gZGVmYXVsdEJvZHkoKSB7XG4gIHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gYWpheENvcmUob3B0aW9ucywgY2FsbGJhY2spIHtcblxuICBvcHRpb25zID0gY2xvbmUob3B0aW9ucyk7XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIG1ldGhvZCA6IFwiR0VUXCIsXG4gICAgaGVhZGVyczoge30sXG4gICAganNvbjogdHJ1ZSxcbiAgICBwcm9jZXNzRGF0YTogdHJ1ZSxcbiAgICB0aW1lb3V0OiAxMDAwMCxcbiAgICBjYWNoZTogZmFsc2VcbiAgfTtcblxuICBvcHRpb25zID0gZXh0ZW5kJDEoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIGZ1bmN0aW9uIG9uU3VjY2VzcyhvYmosIHJlc3AsIGNiKSB7XG4gICAgaWYgKCFvcHRpb25zLmJpbmFyeSAmJiBvcHRpb25zLmpzb24gJiYgdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0cnkge1xuICAgICAgICBvYmogPSBKU09OLnBhcnNlKG9iaik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFByb2JhYmx5IGEgbWFsZm9ybWVkIEpTT04gZnJvbSBzZXJ2ZXJcbiAgICAgICAgcmV0dXJuIGNiKGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICBvYmogPSBvYmoubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIGlmICh2LmVycm9yIHx8IHYubWlzc2luZykge1xuICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUVycm9yRnJvbVJlc3BvbnNlKHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuYmluYXJ5KSB7XG4gICAgICByZXMkMihvYmosIHJlc3ApO1xuICAgIH1cbiAgICBjYihudWxsLCBvYmosIHJlc3ApO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuanNvbikge1xuICAgIGlmICghb3B0aW9ucy5iaW5hcnkpIHtcbiAgICAgIG9wdGlvbnMuaGVhZGVycy5BY2NlcHQgPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgfVxuICAgIG9wdGlvbnMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBvcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddIHx8XG4gICAgICAnYXBwbGljYXRpb24vanNvbic7XG4gIH1cblxuICBpZiAob3B0aW9ucy5iaW5hcnkpIHtcbiAgICBvcHRpb25zLmVuY29kaW5nID0gbnVsbDtcbiAgICBvcHRpb25zLmpzb24gPSBmYWxzZTtcbiAgfVxuXG4gIGlmICghb3B0aW9ucy5wcm9jZXNzRGF0YSkge1xuICAgIG9wdGlvbnMuanNvbiA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGFqYXgkMShvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSwgYm9keSkge1xuXG4gICAgaWYgKGVycikge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGdlbmVyYXRlRXJyb3JGcm9tUmVzcG9uc2UoZXJyKSk7XG4gICAgfVxuXG4gICAgdmFyIGVycm9yO1xuICAgIHZhciBjb250ZW50X3R5cGUgPSByZXNwb25zZS5oZWFkZXJzICYmIHJlc3BvbnNlLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xuICAgIHZhciBkYXRhID0gYm9keSB8fCBkZWZhdWx0Qm9keSgpO1xuXG4gICAgLy8gQ291Y2hEQiBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIHJpZ2h0IGNvbnRlbnQtdHlwZSBmb3IgSlNPTiBkYXRhLCBzb1xuICAgIC8vIHdlIGNoZWNrIGZvciBeeyBhbmQgfSQgKGlnbm9yaW5nIGxlYWRpbmcvdHJhaWxpbmcgd2hpdGVzcGFjZSlcbiAgICBpZiAoIW9wdGlvbnMuYmluYXJ5ICYmIChvcHRpb25zLmpzb24gfHwgIW9wdGlvbnMucHJvY2Vzc0RhdGEpICYmXG4gICAgICAgIHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JyAmJlxuICAgICAgICAoL2pzb24vLnRlc3QoY29udGVudF90eXBlKSB8fFxuICAgICAgICAgKC9eW1xcc10qXFx7Ly50ZXN0KGRhdGEpICYmIC9cXH1bXFxzXSokLy50ZXN0KGRhdGEpKSkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEudG9TdHJpbmcoKSk7XG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cblxuICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgICBvblN1Y2Nlc3MoZGF0YSwgcmVzcG9uc2UsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3IgPSBnZW5lcmF0ZUVycm9yRnJvbVJlc3BvbnNlKGRhdGEpO1xuICAgICAgZXJyb3Iuc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzQ29kZTtcbiAgICAgIGNhbGxiYWNrKGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhamF4KG9wdHMsIGNhbGxiYWNrKSB7XG5cbiAgLy8gY2FjaGUtYnVzdGVyLCBzcGVjaWZpY2FsbHkgZGVzaWduZWQgdG8gd29yayBhcm91bmQgSUUncyBhZ2dyZXNzaXZlIGNhY2hpbmdcbiAgLy8gc2VlIGh0dHA6Ly93d3cuZGFzaGJheS5jb20vMjAxMS8wNS9pbnRlcm5ldC1leHBsb3Jlci1jYWNoZXMtYWpheC9cbiAgLy8gQWxzbyBTYWZhcmkgY2FjaGVzIFBPU1RzLCBzbyB3ZSBuZWVkIHRvIGNhY2hlLWJ1c3QgdGhvc2UgdG9vLlxuICB2YXIgdWEgPSAobmF2aWdhdG9yICYmIG5hdmlnYXRvci51c2VyQWdlbnQpID9cbiAgICBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkgOiAnJztcblxuICB2YXIgaXNTYWZhcmkgPSB1YS5pbmRleE9mKCdzYWZhcmknKSAhPT0gLTEgJiYgdWEuaW5kZXhPZignY2hyb21lJykgPT09IC0xO1xuICB2YXIgaXNJRSA9IHVhLmluZGV4T2YoJ21zaWUnKSAhPT0gLTE7XG4gIHZhciBpc0VkZ2UgPSB1YS5pbmRleE9mKCdlZGdlJykgIT09IC0xO1xuXG4gIC8vIGl0IGFwcGVhcnMgdGhlIG5ldyB2ZXJzaW9uIG9mIHNhZmFyaSBhbHNvIGNhY2hlcyBHRVRzLFxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3BvdWNoZGIvcG91Y2hkYi9pc3N1ZXMvNTAxMFxuICB2YXIgc2hvdWxkQ2FjaGVCdXN0ID0gKGlzU2FmYXJpIHx8XG4gICAgKChpc0lFIHx8IGlzRWRnZSkgJiYgb3B0cy5tZXRob2QgPT09ICdHRVQnKSk7XG5cbiAgdmFyIGNhY2hlID0gJ2NhY2hlJyBpbiBvcHRzID8gb3B0cy5jYWNoZSA6IHRydWU7XG5cbiAgdmFyIGlzQmxvYlVybCA9IC9eYmxvYjovLnRlc3Qob3B0cy51cmwpOyAvLyBkb24ndCBhcHBlbmQgbm9uY2VzIGZvciBibG9iIFVSTHNcblxuICBpZiAoIWlzQmxvYlVybCAmJiAoc2hvdWxkQ2FjaGVCdXN0IHx8ICFjYWNoZSkpIHtcbiAgICB2YXIgaGFzQXJncyA9IG9wdHMudXJsLmluZGV4T2YoJz8nKSAhPT0gLTE7XG4gICAgb3B0cy51cmwgKz0gKGhhc0FyZ3MgPyAnJicgOiAnPycpICsgJ19ub25jZT0nICsgRGF0ZS5ub3coKTtcbiAgfVxuXG4gIHJldHVybiBhamF4Q29yZShvcHRzLCBjYWxsYmFjayk7XG59XG5cbnZhciBDSEFOR0VTX0JBVENIX1NJWkUgPSAyNTtcbnZhciBNQVhfU0lNVUxUQU5FT1VTX1JFVlMgPSA1MDtcblxudmFyIHN1cHBvcnRzQnVsa0dldE1hcCA9IHt9O1xuXG52YXIgbG9nJDEgPSBkZWJ1ZygncG91Y2hkYjpodHRwJyk7XG5cbmZ1bmN0aW9uIHJlYWRBdHRhY2htZW50c0FzQmxvYk9yQnVmZmVyKHJvdykge1xuICB2YXIgYXR0cyA9IHJvdy5kb2MgJiYgcm93LmRvYy5fYXR0YWNobWVudHM7XG4gIGlmICghYXR0cykge1xuICAgIHJldHVybjtcbiAgfVxuICBPYmplY3Qua2V5cyhhdHRzKS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgIHZhciBhdHQgPSBhdHRzW2ZpbGVuYW1lXTtcbiAgICBhdHQuZGF0YSA9IGI2NFRvQmx1ZmZlcihhdHQuZGF0YSwgYXR0LmNvbnRlbnRfdHlwZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVEb2NJZChpZCkge1xuICBpZiAoL15fZGVzaWduLy50ZXN0KGlkKSkge1xuICAgIHJldHVybiAnX2Rlc2lnbi8nICsgZW5jb2RlVVJJQ29tcG9uZW50KGlkLnNsaWNlKDgpKTtcbiAgfVxuICBpZiAoL15fbG9jYWwvLnRlc3QoaWQpKSB7XG4gICAgcmV0dXJuICdfbG9jYWwvJyArIGVuY29kZVVSSUNvbXBvbmVudChpZC5zbGljZSg3KSk7XG4gIH1cbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChpZCk7XG59XG5cbmZ1bmN0aW9uIHByZXByb2Nlc3NBdHRhY2htZW50cyQxKGRvYykge1xuICBpZiAoIWRvYy5fYXR0YWNobWVudHMgfHwgIU9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMpKSB7XG4gICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChPYmplY3Qua2V5cyhkb2MuX2F0dGFjaG1lbnRzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgIHZhciBhdHRhY2htZW50ID0gZG9jLl9hdHRhY2htZW50c1trZXldO1xuICAgIGlmIChhdHRhY2htZW50LmRhdGEgJiYgdHlwZW9mIGF0dGFjaG1lbnQuZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIGJsb2JUb0Jhc2U2NChhdHRhY2htZW50LmRhdGEsIHJlc29sdmUpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAoYjY0KSB7XG4gICAgICAgIGF0dGFjaG1lbnQuZGF0YSA9IGI2NDtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBoYXNVcmxQcmVmaXgob3B0cykge1xuICBpZiAoIW9wdHMucHJlZml4KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdmFyIHByb3RvY29sID0gcGFyc2VVcmkob3B0cy5wcmVmaXgpLnByb3RvY29sO1xuXG4gIHJldHVybiBwcm90b2NvbCA9PT0gJ2h0dHAnIHx8IHByb3RvY29sID09PSAnaHR0cHMnO1xufVxuXG4vLyBHZXQgYWxsIHRoZSBpbmZvcm1hdGlvbiB5b3UgcG9zc2libHkgY2FuIGFib3V0IHRoZSBVUkkgZ2l2ZW4gYnkgbmFtZSBhbmRcbi8vIHJldHVybiBpdCBhcyBhIHN1aXRhYmxlIG9iamVjdC5cbmZ1bmN0aW9uIGdldEhvc3QobmFtZSwgb3B0cykge1xuXG4gIC8vIGVuY29kZSBkYiBuYW1lIGlmIG9wdHMucHJlZml4IGlzIGEgdXJsICgjNTU3NClcbiAgaWYgKGhhc1VybFByZWZpeChvcHRzKSkge1xuICAgIHZhciBkYk5hbWUgPSBvcHRzLm5hbWUuc3Vic3RyKG9wdHMucHJlZml4Lmxlbmd0aCk7XG4gICAgbmFtZSA9IG9wdHMucHJlZml4ICsgZW5jb2RlVVJJQ29tcG9uZW50KGRiTmFtZSk7XG4gIH1cblxuICAvLyBQcmFzZSB0aGUgVVJJIGludG8gYWxsIGl0cyBsaXR0bGUgYml0c1xuICB2YXIgdXJpID0gcGFyc2VVcmkobmFtZSk7XG5cbiAgLy8gU3RvcmUgdGhlIHVzZXIgYW5kIHBhc3N3b3JkIGFzIGEgc2VwYXJhdGUgYXV0aCBvYmplY3RcbiAgaWYgKHVyaS51c2VyIHx8IHVyaS5wYXNzd29yZCkge1xuICAgIHVyaS5hdXRoID0ge3VzZXJuYW1lOiB1cmkudXNlciwgcGFzc3dvcmQ6IHVyaS5wYXNzd29yZH07XG4gIH1cblxuICAvLyBTcGxpdCB0aGUgcGF0aCBwYXJ0IG9mIHRoZSBVUkkgaW50byBwYXJ0cyB1c2luZyAnLycgYXMgdGhlIGRlbGltaXRlclxuICAvLyBhZnRlciByZW1vdmluZyBhbnkgbGVhZGluZyAnLycgYW5kIGFueSB0cmFpbGluZyAnLydcbiAgdmFyIHBhcnRzID0gdXJpLnBhdGgucmVwbGFjZSgvKF5cXC98XFwvJCkvZywgJycpLnNwbGl0KCcvJyk7XG5cbiAgLy8gU3RvcmUgdGhlIGZpcnN0IHBhcnQgYXMgdGhlIGRhdGFiYXNlIG5hbWUgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBwYXJ0c1xuICAvLyBhcnJheVxuICB1cmkuZGIgPSBwYXJ0cy5wb3AoKTtcbiAgLy8gUHJldmVudCBkb3VibGUgZW5jb2Rpbmcgb2YgVVJJIGNvbXBvbmVudFxuICBpZiAodXJpLmRiLmluZGV4T2YoJyUnKSA9PT0gLTEpIHtcbiAgICB1cmkuZGIgPSBlbmNvZGVVUklDb21wb25lbnQodXJpLmRiKTtcbiAgfVxuXG4gIC8vIFJlc3RvcmUgdGhlIHBhdGggYnkgam9pbmluZyBhbGwgdGhlIHJlbWFpbmluZyBwYXJ0cyAoYWxsIHRoZSBwYXJ0c1xuICAvLyBleGNlcHQgZm9yIHRoZSBkYXRhYmFzZSBuYW1lKSB3aXRoICcvJ3NcbiAgdXJpLnBhdGggPSBwYXJ0cy5qb2luKCcvJyk7XG5cbiAgcmV0dXJuIHVyaTtcbn1cblxuLy8gR2VuZXJhdGUgYSBVUkwgd2l0aCB0aGUgaG9zdCBkYXRhIGdpdmVuIGJ5IG9wdHMgYW5kIHRoZSBnaXZlbiBwYXRoXG5mdW5jdGlvbiBnZW5EQlVybChvcHRzLCBwYXRoKSB7XG4gIHJldHVybiBnZW5Vcmwob3B0cywgb3B0cy5kYiArICcvJyArIHBhdGgpO1xufVxuXG4vLyBHZW5lcmF0ZSBhIFVSTCB3aXRoIHRoZSBob3N0IGRhdGEgZ2l2ZW4gYnkgb3B0cyBhbmQgdGhlIGdpdmVuIHBhdGhcbmZ1bmN0aW9uIGdlblVybChvcHRzLCBwYXRoKSB7XG4gIC8vIElmIHRoZSBob3N0IGFscmVhZHkgaGFzIGEgcGF0aCwgdGhlbiB3ZSBuZWVkIHRvIGhhdmUgYSBwYXRoIGRlbGltaXRlclxuICAvLyBPdGhlcndpc2UsIHRoZSBwYXRoIGRlbGltaXRlciBpcyB0aGUgZW1wdHkgc3RyaW5nXG4gIHZhciBwYXRoRGVsID0gIW9wdHMucGF0aCA/ICcnIDogJy8nO1xuXG4gIC8vIElmIHRoZSBob3N0IGFscmVhZHkgaGFzIGEgcGF0aCwgdGhlbiB3ZSBuZWVkIHRvIGhhdmUgYSBwYXRoIGRlbGltaXRlclxuICAvLyBPdGhlcndpc2UsIHRoZSBwYXRoIGRlbGltaXRlciBpcyB0aGUgZW1wdHkgc3RyaW5nXG4gIHJldHVybiBvcHRzLnByb3RvY29sICsgJzovLycgKyBvcHRzLmhvc3QgK1xuICAgICAgICAgKG9wdHMucG9ydCA/ICgnOicgKyBvcHRzLnBvcnQpIDogJycpICtcbiAgICAgICAgICcvJyArIG9wdHMucGF0aCArIHBhdGhEZWwgKyBwYXRoO1xufVxuXG5mdW5jdGlvbiBwYXJhbXNUb1N0cihwYXJhbXMpIHtcbiAgcmV0dXJuICc/JyArIE9iamVjdC5rZXlzKHBhcmFtcykubWFwKGZ1bmN0aW9uIChrKSB7XG4gICAgcmV0dXJuIGsgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW2tdKTtcbiAgfSkuam9pbignJicpO1xufVxuXG4vLyBJbXBsZW1lbnRzIHRoZSBQb3VjaERCIEFQSSBmb3IgZGVhbGluZyB3aXRoIENvdWNoREIgaW5zdGFuY2VzIG92ZXIgSFRUUFxuZnVuY3Rpb24gSHR0cFBvdWNoKG9wdHMsIGNhbGxiYWNrKSB7XG5cbiAgLy8gVGhlIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgcHVibGljbHkgYXZhaWxhYmxlIGZvciBIdHRwUG91Y2hcbiAgdmFyIGFwaSA9IHRoaXM7XG5cbiAgdmFyIGhvc3QgPSBnZXRIb3N0KG9wdHMubmFtZSwgb3B0cyk7XG4gIHZhciBkYlVybCA9IGdlbkRCVXJsKGhvc3QsICcnKTtcblxuICBvcHRzID0gY2xvbmUob3B0cyk7XG4gIHZhciBhamF4T3B0cyA9IG9wdHMuYWpheCB8fCB7fTtcblxuICBpZiAob3B0cy5hdXRoIHx8IGhvc3QuYXV0aCkge1xuICAgIHZhciBuQXV0aCA9IG9wdHMuYXV0aCB8fCBob3N0LmF1dGg7XG4gICAgdmFyIHN0ciA9IG5BdXRoLnVzZXJuYW1lICsgJzonICsgbkF1dGgucGFzc3dvcmQ7XG4gICAgdmFyIHRva2VuID0gYnRvYSQxKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKSk7XG4gICAgYWpheE9wdHMuaGVhZGVycyA9IGFqYXhPcHRzLmhlYWRlcnMgfHwge307XG4gICAgYWpheE9wdHMuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0Jhc2ljICcgKyB0b2tlbjtcbiAgfVxuXG4gIC8vIE5vdCBzdHJpY3RseSBuZWNlc3NhcnksIGJ1dCB3ZSBkbyB0aGlzIGJlY2F1c2UgbnVtZXJvdXMgdGVzdHNcbiAgLy8gcmVseSBvbiBzd2FwcGluZyBhamF4IGluIGFuZCBvdXQuXG4gIGFwaS5fYWpheCA9IGFqYXg7XG5cbiAgZnVuY3Rpb24gYWpheCQkKHVzZXJPcHRzLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIHZhciByZXFBamF4ID0gdXNlck9wdHMuYWpheCB8fCB7fTtcbiAgICB2YXIgcmVxT3B0cyA9IGV4dGVuZCQxKGNsb25lKGFqYXhPcHRzKSwgcmVxQWpheCwgb3B0aW9ucyk7XG4gICAgbG9nJDEocmVxT3B0cy5tZXRob2QgKyAnICcgKyByZXFPcHRzLnVybCk7XG4gICAgcmV0dXJuIGFwaS5fYWpheChyZXFPcHRzLCBjYWxsYmFjayk7XG4gIH1cblxuICBmdW5jdGlvbiBhamF4UHJvbWlzZSh1c2VyT3B0cywgb3B0cykge1xuICAgIHJldHVybiBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGFqYXgkJCh1c2VyT3B0cywgb3B0cywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUocmVzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRhcHRlckZ1biQkKG5hbWUsIGZ1bikge1xuICAgIHJldHVybiBhZGFwdGVyRnVuKG5hbWUsIGdldEFyZ3VtZW50cyhmdW5jdGlvbiAoYXJncykge1xuICAgICAgc2V0dXAoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgfSk7XG4gICAgfSkpO1xuICB9XG5cbiAgdmFyIHNldHVwUHJvbWlzZTtcblxuICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAvLyBUT0RPOiBSZW1vdmUgYHNraXBTZXR1cGAgaW4gZmF2b3Igb2YgYHNraXBfc2V0dXBgIGluIGEgZnV0dXJlIHJlbGVhc2VcbiAgICBpZiAob3B0cy5za2lwU2V0dXAgfHwgb3B0cy5za2lwX3NldHVwKSB7XG4gICAgICByZXR1cm4gUG91Y2hQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIHNldHVwIGluIHByb2Nlc3Mgb3IgcHJldmlvdXMgc3VjY2Vzc2Z1bCBzZXR1cFxuICAgIC8vIGRvbmUgdGhlbiB3ZSB3aWxsIHVzZSB0aGF0XG4gICAgLy8gSWYgcHJldmlvdXMgc2V0dXBzIGhhdmUgYmVlbiByZWplY3RlZCB3ZSB3aWxsIHRyeSBhZ2FpblxuICAgIGlmIChzZXR1cFByb21pc2UpIHtcbiAgICAgIHJldHVybiBzZXR1cFByb21pc2U7XG4gICAgfVxuXG4gICAgdmFyIGNoZWNrRXhpc3RzID0ge21ldGhvZDogJ0dFVCcsIHVybDogZGJVcmx9O1xuICAgIHNldHVwUHJvbWlzZSA9IGFqYXhQcm9taXNlKHt9LCBjaGVja0V4aXN0cykuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVyciAmJiBlcnIuc3RhdHVzICYmIGVyci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICAvLyBEb2VzbnQgZXhpc3QsIGNyZWF0ZSBpdFxuICAgICAgICBleHBsYWluRXJyb3IoNDA0LCAnUG91Y2hEQiBpcyBqdXN0IGRldGVjdGluZyBpZiB0aGUgcmVtb3RlIGV4aXN0cy4nKTtcbiAgICAgICAgcmV0dXJuIGFqYXhQcm9taXNlKHt9LCB7bWV0aG9kOiAnUFVUJywgdXJsOiBkYlVybH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAvLyBJZiB3ZSB0cnkgdG8gY3JlYXRlIGEgZGF0YWJhc2UgdGhhdCBhbHJlYWR5IGV4aXN0cywgc2tpcHBlZCBpblxuICAgICAgLy8gaXN0YW5idWwgc2luY2UgaXRzIGNhdGNoaW5nIGEgcmFjZSBjb25kaXRpb24uXG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChlcnIgJiYgZXJyLnN0YXR1cyAmJiBlcnIuc3RhdHVzID09PSA0MTIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gUG91Y2hQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH0pO1xuXG4gICAgc2V0dXBQcm9taXNlLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHNldHVwUHJvbWlzZSA9IG51bGw7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2V0dXBQcm9taXNlO1xuICB9XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgYXBpKTtcbiAgfSk7XG5cbiAgYXBpLnR5cGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICdodHRwJztcbiAgfTtcblxuICBhcGkuaWQgPSBhZGFwdGVyRnVuJCQoJ2lkJywgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgYWpheCQkKHt9LCB7bWV0aG9kOiAnR0VUJywgdXJsOiBnZW5VcmwoaG9zdCwgJycpfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gICAgICB2YXIgdXVpZCA9IChyZXN1bHQgJiYgcmVzdWx0LnV1aWQpID9cbiAgICAgICAgKHJlc3VsdC51dWlkICsgaG9zdC5kYikgOiBnZW5EQlVybChob3N0LCAnJyk7XG4gICAgICBjYWxsYmFjayhudWxsLCB1dWlkKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgYXBpLnJlcXVlc3QgPSBhZGFwdGVyRnVuJCQoJ3JlcXVlc3QnLCBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICBvcHRpb25zLnVybCA9IGdlbkRCVXJsKGhvc3QsIG9wdGlvbnMudXJsKTtcbiAgICBhamF4JCQoe30sIG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgfSk7XG5cbiAgLy8gU2VuZHMgYSBQT1NUIHJlcXVlc3QgdG8gdGhlIGhvc3QgY2FsbGluZyB0aGUgY291Y2hkYiBfY29tcGFjdCBmdW5jdGlvblxuICAvLyAgICB2ZXJzaW9uOiBUaGUgdmVyc2lvbiBvZiBDb3VjaERCIGl0IGlzIHJ1bm5pbmdcbiAgYXBpLmNvbXBhY3QgPSBhZGFwdGVyRnVuJCQoJ2NvbXBhY3QnLCBmdW5jdGlvbiAob3B0cywgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgIG9wdHMgPSB7fTtcbiAgICB9XG4gICAgb3B0cyA9IGNsb25lKG9wdHMpO1xuICAgIGFqYXgkJChvcHRzLCB7XG4gICAgICB1cmw6IGdlbkRCVXJsKGhvc3QsICdfY29tcGFjdCcpLFxuICAgICAgbWV0aG9kOiAnUE9TVCdcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICBmdW5jdGlvbiBwaW5nKCkge1xuICAgICAgICBhcGkuaW5mbyhmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgICBpZiAocmVzICYmICFyZXMuY29tcGFjdF9ydW5uaW5nKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7b2s6IHRydWV9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2V0VGltZW91dChwaW5nLCBvcHRzLmludGVydmFsIHx8IDIwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIFBpbmcgdGhlIGh0dHAgaWYgaXQncyBmaW5pc2hlZCBjb21wYWN0aW9uXG4gICAgICBwaW5nKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGFwaS5idWxrR2V0ID0gYWRhcHRlckZ1bignYnVsa0dldCcsIGZ1bmN0aW9uIChvcHRzLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGRvQnVsa0dldChjYikge1xuICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgaWYgKG9wdHMucmV2cykge1xuICAgICAgICBwYXJhbXMucmV2cyA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAob3B0cy5hdHRhY2htZW50cykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBwYXJhbXMuYXR0YWNobWVudHMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgYWpheCQkKG9wdHMsIHtcbiAgICAgICAgdXJsOiBnZW5EQlVybChob3N0LCAnX2J1bGtfZ2V0JyArIHBhcmFtc1RvU3RyKHBhcmFtcykpLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgYm9keTogeyBkb2NzOiBvcHRzLmRvY3N9XG4gICAgICB9LCBjYik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZG9CdWxrR2V0U2hpbSgpIHtcbiAgICAgIC8vIGF2b2lkIFwidXJsIHRvbyBsb25nIGVycm9yXCIgYnkgc3BsaXR0aW5nIHVwIGludG8gbXVsdGlwbGUgcmVxdWVzdHNcbiAgICAgIHZhciBiYXRjaFNpemUgPSBNQVhfU0lNVUxUQU5FT1VTX1JFVlM7XG4gICAgICB2YXIgbnVtQmF0Y2hlcyA9IE1hdGguY2VpbChvcHRzLmRvY3MubGVuZ3RoIC8gYmF0Y2hTaXplKTtcbiAgICAgIHZhciBudW1Eb25lID0gMDtcbiAgICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KG51bUJhdGNoZXMpO1xuXG4gICAgICBmdW5jdGlvbiBvblJlc3VsdChiYXRjaE51bSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgLy8gZXJyIGlzIGltcG9zc2libGUgYmVjYXVzZSBzaGltIHJldHVybnMgYSBsaXN0IG9mIGVycnMgaW4gdGhhdCBjYXNlXG4gICAgICAgICAgcmVzdWx0c1tiYXRjaE51bV0gPSByZXMucmVzdWx0cztcbiAgICAgICAgICBpZiAoKytudW1Eb25lID09PSBudW1CYXRjaGVzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCB7cmVzdWx0czogZmxhdHRlbihyZXN1bHRzKX0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1CYXRjaGVzOyBpKyspIHtcbiAgICAgICAgdmFyIHN1Yk9wdHMgPSBwaWNrKG9wdHMsIFsncmV2cycsICdhdHRhY2htZW50cyddKTtcbiAgICAgICAgc3ViT3B0cy5hamF4ID0gYWpheE9wdHM7XG4gICAgICAgIHN1Yk9wdHMuZG9jcyA9IG9wdHMuZG9jcy5zbGljZShpICogYmF0Y2hTaXplLFxuICAgICAgICAgIE1hdGgubWluKG9wdHMuZG9jcy5sZW5ndGgsIChpICsgMSkgKiBiYXRjaFNpemUpKTtcbiAgICAgICAgYnVsa0dldChzZWxmLCBzdWJPcHRzLCBvblJlc3VsdChpKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbWFyayB0aGUgd2hvbGUgZGF0YWJhc2UgYXMgZWl0aGVyIHN1cHBvcnRpbmcgb3Igbm90IHN1cHBvcnRpbmcgX2J1bGtfZ2V0XG4gICAgdmFyIGRiVXJsID0gZ2VuVXJsKGhvc3QsICcnKTtcbiAgICB2YXIgc3VwcG9ydHNCdWxrR2V0ID0gc3VwcG9ydHNCdWxrR2V0TWFwW2RiVXJsXTtcblxuICAgIGlmICh0eXBlb2Ygc3VwcG9ydHNCdWxrR2V0ICE9PSAnYm9vbGVhbicpIHtcbiAgICAgIC8vIGNoZWNrIGlmIHRoaXMgZGF0YWJhc2Ugc3VwcG9ydHMgX2J1bGtfZ2V0XG4gICAgICBkb0J1bGtHZXQoZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICB2YXIgc3RhdHVzID0gTWF0aC5mbG9vcihlcnIuc3RhdHVzIC8gMTAwKTtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgICAgIGlmIChzdGF0dXMgPT09IDQgfHwgc3RhdHVzID09PSA1KSB7IC8vIDQweCBvciA1MHhcbiAgICAgICAgICAgIHN1cHBvcnRzQnVsa0dldE1hcFtkYlVybF0gPSBmYWxzZTtcbiAgICAgICAgICAgIGV4cGxhaW5FcnJvcihcbiAgICAgICAgICAgICAgZXJyLnN0YXR1cyxcbiAgICAgICAgICAgICAgJ1BvdWNoREIgaXMganVzdCBkZXRlY3RpbmcgaWYgdGhlIHJlbW90ZSAnICtcbiAgICAgICAgICAgICAgJ3N1cHBvcnRzIHRoZSBfYnVsa19nZXQgQVBJLidcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBkb0J1bGtHZXRTaGltKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN1cHBvcnRzQnVsa0dldE1hcFtkYlVybF0gPSB0cnVlO1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNCdWxrR2V0KSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgZG9CdWxrR2V0KGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9CdWxrR2V0U2hpbSgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gQ2FsbHMgR0VUIG9uIHRoZSBob3N0LCB3aGljaCBnZXRzIGJhY2sgYSBKU09OIHN0cmluZyBjb250YWluaW5nXG4gIC8vICAgIGNvdWNoZGI6IEEgd2VsY29tZSBzdHJpbmdcbiAgLy8gICAgdmVyc2lvbjogVGhlIHZlcnNpb24gb2YgQ291Y2hEQiBpdCBpcyBydW5uaW5nXG4gIGFwaS5faW5mbyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHNldHVwKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICBhamF4JCQoe30sIHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiBnZW5EQlVybChob3N0LCAnJylcbiAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5ob3N0ID0gZ2VuREJVcmwoaG9zdCwgJycpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXMpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goY2FsbGJhY2spO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgZG9jdW1lbnQgd2l0aCB0aGUgZ2l2ZW4gaWQgZnJvbSB0aGUgZGF0YWJhc2UgZ2l2ZW4gYnkgaG9zdC5cbiAgLy8gVGhlIGlkIGNvdWxkIGJlIHNvbGVseSB0aGUgX2lkIGluIHRoZSBkYXRhYmFzZSwgb3IgaXQgbWF5IGJlIGFcbiAgLy8gX2Rlc2lnbi9JRCBvciBfbG9jYWwvSUQgcGF0aFxuICBhcGkuZ2V0ID0gYWRhcHRlckZ1biQkKCdnZXQnLCBmdW5jdGlvbiAoaWQsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgLy8gSWYgbm8gb3B0aW9ucyB3ZXJlIGdpdmVuLCBzZXQgdGhlIGNhbGxiYWNrIHRvIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHMgPSBjbG9uZShvcHRzKTtcblxuICAgIC8vIExpc3Qgb2YgcGFyYW1ldGVycyB0byBhZGQgdG8gdGhlIEdFVCByZXF1ZXN0XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuXG4gICAgaWYgKG9wdHMucmV2cykge1xuICAgICAgcGFyYW1zLnJldnMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLnJldnNfaW5mbykge1xuICAgICAgcGFyYW1zLnJldnNfaW5mbyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMub3Blbl9yZXZzKSB7XG4gICAgICBpZiAob3B0cy5vcGVuX3JldnMgIT09IFwiYWxsXCIpIHtcbiAgICAgICAgb3B0cy5vcGVuX3JldnMgPSBKU09OLnN0cmluZ2lmeShvcHRzLm9wZW5fcmV2cyk7XG4gICAgICB9XG4gICAgICBwYXJhbXMub3Blbl9yZXZzID0gb3B0cy5vcGVuX3JldnM7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMucmV2KSB7XG4gICAgICBwYXJhbXMucmV2ID0gb3B0cy5yZXY7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuY29uZmxpY3RzKSB7XG4gICAgICBwYXJhbXMuY29uZmxpY3RzID0gb3B0cy5jb25mbGljdHM7XG4gICAgfVxuXG4gICAgaWQgPSBlbmNvZGVEb2NJZChpZCk7XG5cbiAgICAvLyBTZXQgdGhlIG9wdGlvbnMgZm9yIHRoZSBhamF4IGNhbGxcbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IGdlbkRCVXJsKGhvc3QsIGlkICsgcGFyYW1zVG9TdHIocGFyYW1zKSlcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZmV0Y2hBdHRhY2htZW50cyhkb2MpIHtcbiAgICAgIHZhciBhdHRzID0gZG9jLl9hdHRhY2htZW50cztcbiAgICAgIHZhciBmaWxlbmFtZXMgPSBhdHRzICYmIE9iamVjdC5rZXlzKGF0dHMpO1xuICAgICAgaWYgKCFhdHRzIHx8ICFmaWxlbmFtZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIHdlIGZldGNoIHRoZXNlIG1hbnVhbGx5IGluIHNlcGFyYXRlIFhIUnMsIGJlY2F1c2VcbiAgICAgIC8vIFN5bmMgR2F0ZXdheSB3b3VsZCBub3JtYWxseSBzZW5kIGl0IGJhY2sgYXMgbXVsdGlwYXJ0L21peGVkLFxuICAgICAgLy8gd2hpY2ggd2UgY2Fubm90IHBhcnNlLiBBbHNvLCB0aGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW5cbiAgICAgIC8vIHJlY2VpdmluZyBhdHRhY2htZW50cyBhcyBiYXNlNjQtZW5jb2RlZCBzdHJpbmdzLlxuICAgICAgZnVuY3Rpb24gZmV0Y2goKSB7XG5cbiAgICAgICAgaWYgKCFmaWxlbmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmlsZW5hbWUgPSBmaWxlbmFtZXMucG9wKCk7XG4gICAgICAgIHZhciBhdHQgPSBhdHRzW2ZpbGVuYW1lXTtcbiAgICAgICAgdmFyIHBhdGggPSBlbmNvZGVEb2NJZChkb2MuX2lkKSArICcvJyArIGVuY29kZUF0dGFjaG1lbnRJZChmaWxlbmFtZSkgK1xuICAgICAgICAgICc/cmV2PScgKyBkb2MuX3JldjtcbiAgICAgICAgcmV0dXJuIGFqYXhQcm9taXNlKG9wdHMsIHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogZ2VuREJVcmwoaG9zdCwgcGF0aCksXG4gICAgICAgICAgYmluYXJ5OiB0cnVlXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGJsb2IpIHtcbiAgICAgICAgICBpZiAob3B0cy5iaW5hcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBibG9iO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFBvdWNoUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgYmxvYlRvQmFzZTY0KGJsb2IsIHJlc29sdmUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgZGVsZXRlIGF0dC5zdHViO1xuICAgICAgICAgIGRlbGV0ZSBhdHQubGVuZ3RoO1xuICAgICAgICAgIGF0dC5kYXRhID0gZGF0YTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgbGltaXRzIHRoZSBudW1iZXIgb2YgcGFyYWxsZWwgeGhyIHJlcXVlc3RzIHRvIDUgYW55IHRpbWVcbiAgICAgIC8vIHRvIGF2b2lkIGlzc3VlcyB3aXRoIG1heGltdW0gYnJvd3NlciByZXF1ZXN0IGxpbWl0c1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlUG9vbChmZXRjaCwgNSwge3Byb21pc2U6IFBvdWNoUHJvbWlzZX0pLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmV0Y2hBbGxBdHRhY2htZW50cyhkb2NPckRvY3MpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGRvY09yRG9jcykpIHtcbiAgICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwoZG9jT3JEb2NzLm1hcChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgaWYgKGRvYy5vaykge1xuICAgICAgICAgICAgcmV0dXJuIGZldGNoQXR0YWNobWVudHMoZG9jLm9rKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmZXRjaEF0dGFjaG1lbnRzKGRvY09yRG9jcyk7XG4gICAgfVxuXG4gICAgYWpheFByb21pc2Uob3B0cywgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICByZXR1cm4gUG91Y2hQcm9taXNlLnJlc29sdmUoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9wdHMuYXR0YWNobWVudHMpIHtcbiAgICAgICAgICByZXR1cm4gZmV0Y2hBbGxBdHRhY2htZW50cyhyZXMpO1xuICAgICAgICB9XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKGNhbGxiYWNrKTtcbiAgfSk7XG5cbiAgLy8gRGVsZXRlIHRoZSBkb2N1bWVudCBnaXZlbiBieSBkb2MgZnJvbSB0aGUgZGF0YWJhc2UgZ2l2ZW4gYnkgaG9zdC5cbiAgYXBpLnJlbW92ZSA9IGFkYXB0ZXJGdW4kJCgncmVtb3ZlJyxcbiAgICAgIGZ1bmN0aW9uIChkb2NPcklkLCBvcHRzT3JSZXYsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGRvYztcbiAgICBpZiAodHlwZW9mIG9wdHNPclJldiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIGlkLCByZXYsIG9wdHMsIGNhbGxiYWNrIHN0eWxlXG4gICAgICBkb2MgPSB7XG4gICAgICAgIF9pZDogZG9jT3JJZCxcbiAgICAgICAgX3Jldjogb3B0c09yUmV2XG4gICAgICB9O1xuICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBkb2MsIG9wdHMsIGNhbGxiYWNrIHN0eWxlXG4gICAgICBkb2MgPSBkb2NPcklkO1xuICAgICAgaWYgKHR5cGVvZiBvcHRzT3JSZXYgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRzT3JSZXY7XG4gICAgICAgIG9wdHMgPSB7fTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICAgICAgb3B0cyA9IG9wdHNPclJldjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmV2ID0gKGRvYy5fcmV2IHx8IG9wdHMucmV2KTtcblxuICAgIC8vIERlbGV0ZSB0aGUgZG9jdW1lbnRcbiAgICBhamF4JCQob3B0cywge1xuICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgIHVybDogZ2VuREJVcmwoaG9zdCwgZW5jb2RlRG9jSWQoZG9jLl9pZCkpICsgJz9yZXY9JyArIHJldlxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gZW5jb2RlQXR0YWNobWVudElkKGF0dGFjaG1lbnRJZCkge1xuICAgIHJldHVybiBhdHRhY2htZW50SWQuc3BsaXQoXCIvXCIpLm1hcChlbmNvZGVVUklDb21wb25lbnQpLmpvaW4oXCIvXCIpO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBhdHRhY2htZW50XG4gIGFwaS5nZXRBdHRhY2htZW50ID1cbiAgICBhZGFwdGVyRnVuJCQoJ2dldEF0dGFjaG1lbnQnLCBmdW5jdGlvbiAoZG9jSWQsIGF0dGFjaG1lbnRJZCwgb3B0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIHZhciBwYXJhbXMgPSBvcHRzLnJldiA/ICgnP3Jldj0nICsgb3B0cy5yZXYpIDogJyc7XG4gICAgdmFyIHVybCA9IGdlbkRCVXJsKGhvc3QsIGVuY29kZURvY0lkKGRvY0lkKSkgKyAnLycgK1xuICAgICAgZW5jb2RlQXR0YWNobWVudElkKGF0dGFjaG1lbnRJZCkgKyBwYXJhbXM7XG4gICAgYWpheCQkKG9wdHMsIHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IHVybCxcbiAgICAgIGJpbmFyeTogdHJ1ZVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfSk7XG5cbiAgLy8gUmVtb3ZlIHRoZSBhdHRhY2htZW50IGdpdmVuIGJ5IHRoZSBpZCBhbmQgcmV2XG4gIGFwaS5yZW1vdmVBdHRhY2htZW50ID1cbiAgICBhZGFwdGVyRnVuJCQoJ3JlbW92ZUF0dGFjaG1lbnQnLCBmdW5jdGlvbiAoZG9jSWQsIGF0dGFjaG1lbnRJZCwgcmV2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2spIHtcblxuICAgIHZhciB1cmwgPSBnZW5EQlVybChob3N0LCBlbmNvZGVEb2NJZChkb2NJZCkgKyAnLycgK1xuICAgICAgZW5jb2RlQXR0YWNobWVudElkKGF0dGFjaG1lbnRJZCkpICsgJz9yZXY9JyArIHJldjtcblxuICAgIGFqYXgkJCh7fSwge1xuICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgIHVybDogdXJsXG4gICAgfSwgY2FsbGJhY2spO1xuICB9KTtcblxuICAvLyBBZGQgdGhlIGF0dGFjaG1lbnQgZ2l2ZW4gYnkgYmxvYiBhbmQgaXRzIGNvbnRlbnRUeXBlIHByb3BlcnR5XG4gIC8vIHRvIHRoZSBkb2N1bWVudCB3aXRoIHRoZSBnaXZlbiBpZCwgdGhlIHJldmlzaW9uIGdpdmVuIGJ5IHJldiwgYW5kXG4gIC8vIGFkZCBpdCB0byB0aGUgZGF0YWJhc2UgZ2l2ZW4gYnkgaG9zdC5cbiAgYXBpLnB1dEF0dGFjaG1lbnQgPVxuICAgIGFkYXB0ZXJGdW4kJCgncHV0QXR0YWNobWVudCcsIGZ1bmN0aW9uIChkb2NJZCwgYXR0YWNobWVudElkLCByZXYsIGJsb2IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlLCBjYWxsYmFjaykge1xuICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY2FsbGJhY2sgPSB0eXBlO1xuICAgICAgdHlwZSA9IGJsb2I7XG4gICAgICBibG9iID0gcmV2O1xuICAgICAgcmV2ID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGlkID0gZW5jb2RlRG9jSWQoZG9jSWQpICsgJy8nICsgZW5jb2RlQXR0YWNobWVudElkKGF0dGFjaG1lbnRJZCk7XG4gICAgdmFyIHVybCA9IGdlbkRCVXJsKGhvc3QsIGlkKTtcbiAgICBpZiAocmV2KSB7XG4gICAgICB1cmwgKz0gJz9yZXY9JyArIHJldjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJsb2IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBpbnB1dCBpcyBhc3N1bWVkIHRvIGJlIGEgYmFzZTY0IHN0cmluZ1xuICAgICAgdmFyIGJpbmFyeTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGJpbmFyeSA9IGF0b2IkMShibG9iKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soY3JlYXRlRXJyb3IoQkFEX0FSRyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdBdHRhY2htZW50IGlzIG5vdCBhIHZhbGlkIGJhc2U2NCBzdHJpbmcnKSk7XG4gICAgICB9XG4gICAgICBibG9iID0gYmluYXJ5ID8gYmluU3RyaW5nVG9CbHVmZmVyKGJpbmFyeSwgdHlwZSkgOiAnJztcbiAgICB9XG5cbiAgICB2YXIgb3B0cyA9IHtcbiAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogdHlwZX0sXG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiB1cmwsXG4gICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICBib2R5OiBibG9iLFxuICAgICAgdGltZW91dDogYWpheE9wdHMudGltZW91dCB8fCA2MDAwMFxuICAgIH07XG4gICAgLy8gQWRkIHRoZSBhdHRhY2htZW50XG4gICAgYWpheCQkKHt9LCBvcHRzLCBjYWxsYmFjayk7XG4gIH0pO1xuXG4gIC8vIFVwZGF0ZS9jcmVhdGUgbXVsdGlwbGUgZG9jdW1lbnRzIGdpdmVuIGJ5IHJlcSBpbiB0aGUgZGF0YWJhc2VcbiAgLy8gZ2l2ZW4gYnkgaG9zdC5cbiAgYXBpLl9idWxrRG9jcyA9IGZ1bmN0aW9uIChyZXEsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgLy8gSWYgbmV3X2VkaXRzPWZhbHNlIHRoZW4gaXQgcHJldmVudHMgdGhlIGRhdGFiYXNlIGZyb20gY3JlYXRpbmdcbiAgICAvLyBuZXcgcmV2aXNpb24gbnVtYmVycyBmb3IgdGhlIGRvY3VtZW50cy4gSW5zdGVhZCBpdCBqdXN0IHVzZXNcbiAgICAvLyB0aGUgb2xkIG9uZXMuIFRoaXMgaXMgdXNlZCBpbiBkYXRhYmFzZSByZXBsaWNhdGlvbi5cbiAgICByZXEubmV3X2VkaXRzID0gb3B0cy5uZXdfZWRpdHM7XG5cbiAgICBzZXR1cCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwocmVxLmRvY3MubWFwKHByZXByb2Nlc3NBdHRhY2htZW50cyQxKSk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVcGRhdGUvY3JlYXRlIHRoZSBkb2N1bWVudHNcbiAgICAgIGFqYXgkJChvcHRzLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB1cmw6IGdlbkRCVXJsKGhvc3QsICdfYnVsa19kb2NzJyksXG4gICAgICAgIHRpbWVvdXQ6IG9wdHMudGltZW91dCxcbiAgICAgICAgYm9keTogcmVxXG4gICAgICB9LCBmdW5jdGlvbiAoZXJyLCByZXN1bHRzKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdC5vayA9IHRydWU7IC8vIHNtb290aHMgb3V0IGNsb3VkYW50IG5vdCBhZGRpbmcgdGhpc1xuICAgICAgICB9KTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaChjYWxsYmFjayk7XG4gIH07XG5cblxuICAvLyBVcGRhdGUvY3JlYXRlIGRvY3VtZW50XG4gIGFwaS5fcHV0ID0gZnVuY3Rpb24gKGRvYywgb3B0cywgY2FsbGJhY2spIHtcbiAgICBzZXR1cCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHByZXByb2Nlc3NBdHRhY2htZW50cyQxKGRvYyk7XG4gICAgfSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBVcGRhdGUvY3JlYXRlIHRoZSBkb2N1bWVudFxuICAgICAgYWpheCQkKG9wdHMsIHtcbiAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgdXJsOiBnZW5EQlVybChob3N0LCBlbmNvZGVEb2NJZChkb2MuX2lkKSksXG4gICAgICAgIGJvZHk6IGRvY1xuICAgICAgfSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goY2FsbGJhY2spO1xuICB9O1xuXG5cbiAgLy8gR2V0IGEgbGlzdGluZyBvZiB0aGUgZG9jdW1lbnRzIGluIHRoZSBkYXRhYmFzZSBnaXZlblxuICAvLyBieSBob3N0IGFuZCBvcmRlcmVkIGJ5IGluY3JlYXNpbmcgaWQuXG4gIGFwaS5hbGxEb2NzID0gYWRhcHRlckZ1biQkKCdhbGxEb2NzJywgZnVuY3Rpb24gKG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuICAgIG9wdHMgPSBjbG9uZShvcHRzKTtcblxuICAgIC8vIExpc3Qgb2YgcGFyYW1ldGVycyB0byBhZGQgdG8gdGhlIEdFVCByZXF1ZXN0XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgIHZhciBib2R5O1xuICAgIHZhciBtZXRob2QgPSAnR0VUJztcblxuICAgIGlmIChvcHRzLmNvbmZsaWN0cykge1xuICAgICAgcGFyYW1zLmNvbmZsaWN0cyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZGVzY2VuZGluZykge1xuICAgICAgcGFyYW1zLmRlc2NlbmRpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmluY2x1ZGVfZG9jcykge1xuICAgICAgcGFyYW1zLmluY2x1ZGVfZG9jcyA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gYWRkZWQgaW4gQ291Y2hEQiAxLjYuMFxuICAgIGlmIChvcHRzLmF0dGFjaG1lbnRzKSB7XG4gICAgICBwYXJhbXMuYXR0YWNobWVudHMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmtleSkge1xuICAgICAgcGFyYW1zLmtleSA9IEpTT04uc3RyaW5naWZ5KG9wdHMua2V5KTtcbiAgICB9XG5cbiAgICBpZiAob3B0cy5zdGFydF9rZXkpIHtcbiAgICAgIG9wdHMuc3RhcnRrZXkgPSBvcHRzLnN0YXJ0X2tleTtcbiAgICB9XG5cbiAgICBpZiAob3B0cy5zdGFydGtleSkge1xuICAgICAgcGFyYW1zLnN0YXJ0a2V5ID0gSlNPTi5zdHJpbmdpZnkob3B0cy5zdGFydGtleSk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5kX2tleSkge1xuICAgICAgb3B0cy5lbmRrZXkgPSBvcHRzLmVuZF9rZXk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5ka2V5KSB7XG4gICAgICBwYXJhbXMuZW5ka2V5ID0gSlNPTi5zdHJpbmdpZnkob3B0cy5lbmRrZXkpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5pbmNsdXNpdmVfZW5kICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcGFyYW1zLmluY2x1c2l2ZV9lbmQgPSAhIW9wdHMuaW5jbHVzaXZlX2VuZDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMubGltaXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMubGltaXQgPSBvcHRzLmxpbWl0O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5za2lwICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcGFyYW1zLnNraXAgPSBvcHRzLnNraXA7XG4gICAgfVxuXG4gICAgdmFyIHBhcmFtU3RyID0gcGFyYW1zVG9TdHIocGFyYW1zKTtcblxuICAgIGlmICh0eXBlb2Ygb3B0cy5rZXlzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgbWV0aG9kID0gJ1BPU1QnO1xuICAgICAgYm9keSA9IHtrZXlzOiBvcHRzLmtleXN9O1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgZG9jdW1lbnQgbGlzdGluZ1xuICAgIGFqYXhQcm9taXNlKG9wdHMsIHtcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgdXJsOiBnZW5EQlVybChob3N0LCAnX2FsbF9kb2NzJyArIHBhcmFtU3RyKSxcbiAgICAgIGJvZHk6IGJvZHlcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIGlmIChvcHRzLmluY2x1ZGVfZG9jcyAmJiBvcHRzLmF0dGFjaG1lbnRzICYmIG9wdHMuYmluYXJ5KSB7XG4gICAgICAgIHJlcy5yb3dzLmZvckVhY2gocmVhZEF0dGFjaG1lbnRzQXNCbG9iT3JCdWZmZXIpO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9KS5jYXRjaChjYWxsYmFjayk7XG4gIH0pO1xuXG4gIC8vIEdldCBhIGxpc3Qgb2YgY2hhbmdlcyBtYWRlIHRvIGRvY3VtZW50cyBpbiB0aGUgZGF0YWJhc2UgZ2l2ZW4gYnkgaG9zdC5cbiAgLy8gVE9ETyBBY2NvcmRpbmcgdG8gdGhlIFJFQURNRSwgdGhlcmUgc2hvdWxkIGJlIHR3byBvdGhlciBtZXRob2RzIGhlcmUsXG4gIC8vIGFwaS5jaGFuZ2VzLmFkZExpc3RlbmVyIGFuZCBhcGkuY2hhbmdlcy5yZW1vdmVMaXN0ZW5lci5cbiAgYXBpLl9jaGFuZ2VzID0gZnVuY3Rpb24gKG9wdHMpIHtcblxuICAgIC8vIFdlIGludGVybmFsbHkgcGFnZSB0aGUgcmVzdWx0cyBvZiBhIGNoYW5nZXMgcmVxdWVzdCwgdGhpcyBtZWFuc1xuICAgIC8vIGlmIHRoZXJlIGlzIGEgbGFyZ2Ugc2V0IG9mIGNoYW5nZXMgdG8gYmUgcmV0dXJuZWQgd2UgY2FuIHN0YXJ0XG4gICAgLy8gcHJvY2Vzc2luZyB0aGVtIHF1aWNrZXIgaW5zdGVhZCBvZiB3YWl0aW5nIG9uIHRoZSBlbnRpcmVcbiAgICAvLyBzZXQgb2YgY2hhbmdlcyB0byByZXR1cm4gYW5kIGF0dGVtcHRpbmcgdG8gcHJvY2VzcyB0aGVtIGF0IG9uY2VcbiAgICB2YXIgYmF0Y2hTaXplID0gJ2JhdGNoX3NpemUnIGluIG9wdHMgPyBvcHRzLmJhdGNoX3NpemUgOiBDSEFOR0VTX0JBVENIX1NJWkU7XG5cbiAgICBvcHRzID0gY2xvbmUob3B0cyk7XG4gICAgb3B0cy50aW1lb3V0ID0gKCd0aW1lb3V0JyBpbiBvcHRzKSA/IG9wdHMudGltZW91dCA6XG4gICAgICAoJ3RpbWVvdXQnIGluIGFqYXhPcHRzKSA/IGFqYXhPcHRzLnRpbWVvdXQgOlxuICAgICAgMzAgKiAxMDAwO1xuXG4gICAgLy8gV2UgZ2l2ZSBhIDUgc2Vjb25kIGJ1ZmZlciBmb3IgQ291Y2hEQiBjaGFuZ2VzIHRvIHJlc3BvbmQgd2l0aFxuICAgIC8vIGFuIG9rIHRpbWVvdXQgKGlmIGEgdGltZW91dCBpdCBzZXQpXG4gICAgdmFyIHBhcmFtcyA9IG9wdHMudGltZW91dCA/IHt0aW1lb3V0OiBvcHRzLnRpbWVvdXQgLSAoNSAqIDEwMDApfSA6IHt9O1xuICAgIHZhciBsaW1pdCA9ICh0eXBlb2Ygb3B0cy5saW1pdCAhPT0gJ3VuZGVmaW5lZCcpID8gb3B0cy5saW1pdCA6IGZhbHNlO1xuICAgIHZhciByZXR1cm5Eb2NzO1xuICAgIGlmICgncmV0dXJuX2RvY3MnIGluIG9wdHMpIHtcbiAgICAgIHJldHVybkRvY3MgPSBvcHRzLnJldHVybl9kb2NzO1xuICAgIH0gZWxzZSBpZiAoJ3JldHVybkRvY3MnIGluIG9wdHMpIHtcbiAgICAgIC8vIFRPRE86IFJlbW92ZSAncmV0dXJuRG9jcycgaW4gZmF2b3Igb2YgJ3JldHVybl9kb2NzJyBpbiBhIGZ1dHVyZSByZWxlYXNlXG4gICAgICByZXR1cm5Eb2NzID0gb3B0cy5yZXR1cm5Eb2NzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm5Eb2NzID0gdHJ1ZTtcbiAgICB9XG4gICAgLy9cbiAgICB2YXIgbGVmdFRvRmV0Y2ggPSBsaW1pdDtcblxuICAgIGlmIChvcHRzLnN0eWxlKSB7XG4gICAgICBwYXJhbXMuc3R5bGUgPSBvcHRzLnN0eWxlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmluY2x1ZGVfZG9jcyB8fCBvcHRzLmZpbHRlciAmJiB0eXBlb2Ygb3B0cy5maWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHBhcmFtcy5pbmNsdWRlX2RvY3MgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmF0dGFjaG1lbnRzKSB7XG4gICAgICBwYXJhbXMuYXR0YWNobWVudHMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmNvbnRpbnVvdXMpIHtcbiAgICAgIHBhcmFtcy5mZWVkID0gJ2xvbmdwb2xsJztcbiAgICB9XG5cbiAgICBpZiAob3B0cy5jb25mbGljdHMpIHtcbiAgICAgIHBhcmFtcy5jb25mbGljdHMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChvcHRzLmRlc2NlbmRpbmcpIHtcbiAgICAgIHBhcmFtcy5kZXNjZW5kaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoJ2hlYXJ0YmVhdCcgaW4gb3B0cykge1xuICAgICAgLy8gSWYgdGhlIGhlYXJ0YmVhdCB2YWx1ZSBpcyBmYWxzZSwgaXQgZGlzYWJsZXMgdGhlIGRlZmF1bHQgaGVhcnRiZWF0XG4gICAgICBpZiAob3B0cy5oZWFydGJlYXQpIHtcbiAgICAgICAgcGFyYW1zLmhlYXJ0YmVhdCA9IG9wdHMuaGVhcnRiZWF0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWZhdWx0IGhlYXJ0YmVhdCB0byAxMCBzZWNvbmRzXG4gICAgICBwYXJhbXMuaGVhcnRiZWF0ID0gMTAwMDA7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZmlsdGVyICYmIHR5cGVvZiBvcHRzLmZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBhcmFtcy5maWx0ZXIgPSBvcHRzLmZpbHRlcjtcbiAgICB9XG5cbiAgICBpZiAob3B0cy52aWV3ICYmIHR5cGVvZiBvcHRzLnZpZXcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwYXJhbXMuZmlsdGVyID0gJ192aWV3JztcbiAgICAgIHBhcmFtcy52aWV3ID0gb3B0cy52aWV3O1xuICAgIH1cblxuICAgIC8vIElmIG9wdHMucXVlcnlfcGFyYW1zIGV4aXN0cywgcGFzcyBpdCB0aHJvdWdoIHRvIHRoZSBjaGFuZ2VzIHJlcXVlc3QuXG4gICAgLy8gVGhlc2UgcGFyYW1ldGVycyBtYXkgYmUgdXNlZCBieSB0aGUgZmlsdGVyIG9uIHRoZSBzb3VyY2UgZGF0YWJhc2UuXG4gICAgaWYgKG9wdHMucXVlcnlfcGFyYW1zICYmIHR5cGVvZiBvcHRzLnF1ZXJ5X3BhcmFtcyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIHBhcmFtX25hbWUgaW4gb3B0cy5xdWVyeV9wYXJhbXMpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgICAgaWYgKG9wdHMucXVlcnlfcGFyYW1zLmhhc093blByb3BlcnR5KHBhcmFtX25hbWUpKSB7XG4gICAgICAgICAgcGFyYW1zW3BhcmFtX25hbWVdID0gb3B0cy5xdWVyeV9wYXJhbXNbcGFyYW1fbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgbWV0aG9kID0gJ0dFVCc7XG4gICAgdmFyIGJvZHk7XG5cbiAgICBpZiAob3B0cy5kb2NfaWRzKSB7XG4gICAgICAvLyBzZXQgdGhpcyBhdXRvbWFnaWNhbGx5IGZvciB0aGUgdXNlcjsgaXQncyBhbm5veWluZyB0aGF0IGNvdWNoZGJcbiAgICAgIC8vIHJlcXVpcmVzIGJvdGggYSBcImZpbHRlclwiIGFuZCBhIFwiZG9jX2lkc1wiIHBhcmFtLlxuICAgICAgcGFyYW1zLmZpbHRlciA9ICdfZG9jX2lkcyc7XG4gICAgICBtZXRob2QgPSAnUE9TVCc7XG4gICAgICBib2R5ID0ge2RvY19pZHM6IG9wdHMuZG9jX2lkcyB9O1xuICAgIH1cblxuICAgIHZhciB4aHI7XG4gICAgdmFyIGxhc3RGZXRjaGVkU2VxO1xuXG4gICAgLy8gR2V0IGFsbCB0aGUgY2hhbmdlcyBzdGFydGluZyB3dGloIHRoZSBvbmUgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlXG4gICAgLy8gc2VxdWVuY2UgbnVtYmVyIGdpdmVuIGJ5IHNpbmNlLlxuICAgIHZhciBmZXRjaCA9IGZ1bmN0aW9uIChzaW5jZSwgY2FsbGJhY2spIHtcbiAgICAgIGlmIChvcHRzLmFib3J0ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGFyYW1zLnNpbmNlID0gc2luY2U7XG4gICAgICAvLyBcInNpbmNlXCIgY2FuIGJlIGFueSBraW5kIG9mIGpzb24gb2JqZWN0IGluIENvdWRhbnQvQ291Y2hEQiAyLnhcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICBpZiAodHlwZW9mIHBhcmFtcy5zaW5jZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBwYXJhbXMuc2luY2UgPSBKU09OLnN0cmluZ2lmeShwYXJhbXMuc2luY2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0cy5kZXNjZW5kaW5nKSB7XG4gICAgICAgIGlmIChsaW1pdCkge1xuICAgICAgICAgIHBhcmFtcy5saW1pdCA9IGxlZnRUb0ZldGNoO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXMubGltaXQgPSAoIWxpbWl0IHx8IGxlZnRUb0ZldGNoID4gYmF0Y2hTaXplKSA/XG4gICAgICAgICAgYmF0Y2hTaXplIDogbGVmdFRvRmV0Y2g7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgb3B0aW9ucyBmb3IgdGhlIGFqYXggY2FsbFxuICAgICAgdmFyIHhock9wdHMgPSB7XG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICB1cmw6IGdlbkRCVXJsKGhvc3QsICdfY2hhbmdlcycgKyBwYXJhbXNUb1N0cihwYXJhbXMpKSxcbiAgICAgICAgdGltZW91dDogb3B0cy50aW1lb3V0LFxuICAgICAgICBib2R5OiBib2R5XG4gICAgICB9O1xuICAgICAgbGFzdEZldGNoZWRTZXEgPSBzaW5jZTtcblxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAob3B0cy5hYm9ydGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBjaGFuZ2VzXG4gICAgICBzZXR1cCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB4aHIgPSBhamF4JCQob3B0cywgeGhyT3B0cywgY2FsbGJhY2spO1xuICAgICAgfSkuY2F0Y2goY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICAvLyBJZiBvcHRzLnNpbmNlIGV4aXN0cywgZ2V0IGFsbCB0aGUgY2hhbmdlcyBmcm9tIHRoZSBzZXF1ZW5jZVxuICAgIC8vIG51bWJlciBnaXZlbiBieSBvcHRzLnNpbmNlLiBPdGhlcndpc2UsIGdldCBhbGwgdGhlIGNoYW5nZXNcbiAgICAvLyBmcm9tIHRoZSBzZXF1ZW5jZSBudW1iZXIgMC5cbiAgICB2YXIgcmVzdWx0cyA9IHtyZXN1bHRzOiBbXX07XG5cbiAgICB2YXIgZmV0Y2hlZCA9IGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKG9wdHMuYWJvcnRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcmF3X3Jlc3VsdHNfbGVuZ3RoID0gMDtcbiAgICAgIC8vIElmIHRoZSByZXN1bHQgb2YgdGhlIGFqYXggY2FsbCAocmVzKSBjb250YWlucyBjaGFuZ2VzIChyZXMucmVzdWx0cylcbiAgICAgIGlmIChyZXMgJiYgcmVzLnJlc3VsdHMpIHtcbiAgICAgICAgcmF3X3Jlc3VsdHNfbGVuZ3RoID0gcmVzLnJlc3VsdHMubGVuZ3RoO1xuICAgICAgICByZXN1bHRzLmxhc3Rfc2VxID0gcmVzLmxhc3Rfc2VxO1xuICAgICAgICAvLyBGb3IgZWFjaCBjaGFuZ2VcbiAgICAgICAgdmFyIHJlcSA9IHt9O1xuICAgICAgICByZXEucXVlcnkgPSBvcHRzLnF1ZXJ5X3BhcmFtcztcbiAgICAgICAgcmVzLnJlc3VsdHMgPSByZXMucmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICBsZWZ0VG9GZXRjaC0tO1xuICAgICAgICAgIHZhciByZXQgPSBmaWx0ZXJDaGFuZ2Uob3B0cykoYyk7XG4gICAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgICAgaWYgKG9wdHMuaW5jbHVkZV9kb2NzICYmIG9wdHMuYXR0YWNobWVudHMgJiYgb3B0cy5iaW5hcnkpIHtcbiAgICAgICAgICAgICAgcmVhZEF0dGFjaG1lbnRzQXNCbG9iT3JCdWZmZXIoYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmV0dXJuRG9jcykge1xuICAgICAgICAgICAgICByZXN1bHRzLnJlc3VsdHMucHVzaChjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wdHMub25DaGFuZ2UoYyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChlcnIpIHtcbiAgICAgICAgLy8gSW4gY2FzZSBvZiBhbiBlcnJvciwgc3RvcCBsaXN0ZW5pbmcgZm9yIGNoYW5nZXMgYW5kIGNhbGxcbiAgICAgICAgLy8gb3B0cy5jb21wbGV0ZVxuICAgICAgICBvcHRzLmFib3J0ZWQgPSB0cnVlO1xuICAgICAgICBvcHRzLmNvbXBsZXRlKGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGNoYW5nZXMgZmVlZCBtYXkgaGF2ZSB0aW1lZCBvdXQgd2l0aCBubyByZXN1bHRzXG4gICAgICAvLyBpZiBzbyByZXVzZSBsYXN0IHVwZGF0ZSBzZXF1ZW5jZVxuICAgICAgaWYgKHJlcyAmJiByZXMubGFzdF9zZXEpIHtcbiAgICAgICAgbGFzdEZldGNoZWRTZXEgPSByZXMubGFzdF9zZXE7XG4gICAgICB9XG5cbiAgICAgIHZhciBmaW5pc2hlZCA9IChsaW1pdCAmJiBsZWZ0VG9GZXRjaCA8PSAwKSB8fFxuICAgICAgICAocmVzICYmIHJhd19yZXN1bHRzX2xlbmd0aCA8IGJhdGNoU2l6ZSkgfHxcbiAgICAgICAgKG9wdHMuZGVzY2VuZGluZyk7XG5cbiAgICAgIGlmICgob3B0cy5jb250aW51b3VzICYmICEobGltaXQgJiYgbGVmdFRvRmV0Y2ggPD0gMCkpIHx8ICFmaW5pc2hlZCkge1xuICAgICAgICAvLyBRdWV1ZSBhIGNhbGwgdG8gZmV0Y2ggYWdhaW4gd2l0aCB0aGUgbmV3ZXN0IHNlcXVlbmNlIG51bWJlclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgZmV0Y2gobGFzdEZldGNoZWRTZXEsIGZldGNoZWQpOyB9LCAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlJ3JlIGRvbmUsIGNhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgIG9wdHMuY29tcGxldGUobnVsbCwgcmVzdWx0cyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZldGNoKG9wdHMuc2luY2UgfHwgMCwgZmV0Y2hlZCk7XG5cbiAgICAvLyBSZXR1cm4gYSBtZXRob2QgdG8gY2FuY2VsIHRoaXMgbWV0aG9kIGZyb20gcHJvY2Vzc2luZyBhbnkgbW9yZVxuICAgIHJldHVybiB7XG4gICAgICBjYW5jZWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb3B0cy5hYm9ydGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHhocikge1xuICAgICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBHaXZlbiBhIHNldCBvZiBkb2N1bWVudC9yZXZpc2lvbiBJRHMgKGdpdmVuIGJ5IHJlcSksIHRldHMgdGhlIHN1YnNldCBvZlxuICAvLyB0aG9zZSB0aGF0IGRvIE5PVCBjb3JyZXNwb25kIHRvIHJldmlzaW9ucyBzdG9yZWQgaW4gdGhlIGRhdGFiYXNlLlxuICAvLyBTZWUgaHR0cDovL3dpa2kuYXBhY2hlLm9yZy9jb3VjaGRiL0h0dHBQb3N0UmV2c0RpZmZcbiAgYXBpLnJldnNEaWZmID0gYWRhcHRlckZ1biQkKCdyZXZzRGlmZicsIGZ1bmN0aW9uIChyZXEsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgLy8gSWYgbm8gb3B0aW9ucyB3ZXJlIGdpdmVuLCBzZXQgdGhlIGNhbGxiYWNrIHRvIGJlIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBtaXNzaW5nIGRvY3VtZW50L3JldmlzaW9uIElEc1xuICAgIGFqYXgkJChvcHRzLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogZ2VuREJVcmwoaG9zdCwgJ19yZXZzX2RpZmYnKSxcbiAgICAgIGJvZHk6IHJlcVxuICAgIH0sIGNhbGxiYWNrKTtcbiAgfSk7XG5cbiAgYXBpLl9jbG9zZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrKCk7XG4gIH07XG5cbiAgYXBpLl9kZXN0cm95ID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgYWpheCQkKG9wdGlvbnMsIHtcbiAgICAgIHVybDogZ2VuREJVcmwoaG9zdCwgJycpLFxuICAgICAgbWV0aG9kOiAnREVMRVRFJ1xuICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3ApIHtcbiAgICAgIGlmIChlcnIgJiYgZXJyLnN0YXR1cyAmJiBlcnIuc3RhdHVzICE9PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICB9XG4gICAgICBjYWxsYmFjayhudWxsLCByZXNwKTtcbiAgICB9KTtcbiAgfTtcbn1cblxuLy8gSHR0cFBvdWNoIGlzIGEgdmFsaWQgYWRhcHRlci5cbkh0dHBQb3VjaC52YWxpZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBIdHRwUG91Y2gkMSAoUG91Y2hEQikge1xuICBQb3VjaERCLmFkYXB0ZXIoJ2h0dHAnLCBIdHRwUG91Y2gsIGZhbHNlKTtcbiAgUG91Y2hEQi5hZGFwdGVyKCdodHRwcycsIEh0dHBQb3VjaCwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBwYWQoc3RyLCBwYWRXaXRoLCB1cFRvTGVuZ3RoKSB7XG4gIHZhciBwYWRkaW5nID0gJyc7XG4gIHZhciB0YXJnZXRMZW5ndGggPSB1cFRvTGVuZ3RoIC0gc3RyLmxlbmd0aDtcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgd2hpbGUgKHBhZGRpbmcubGVuZ3RoIDwgdGFyZ2V0TGVuZ3RoKSB7XG4gICAgcGFkZGluZyArPSBwYWRXaXRoO1xuICB9XG4gIHJldHVybiBwYWRkaW5nO1xufVxuXG5mdW5jdGlvbiBwYWRMZWZ0KHN0ciwgcGFkV2l0aCwgdXBUb0xlbmd0aCkge1xuICB2YXIgcGFkZGluZyA9IHBhZChzdHIsIHBhZFdpdGgsIHVwVG9MZW5ndGgpO1xuICByZXR1cm4gcGFkZGluZyArIHN0cjtcbn1cblxudmFyIE1JTl9NQUdOSVRVREUgPSAtMzI0OyAvLyB2ZXJpZmllZCBieSAtTnVtYmVyLk1JTl9WQUxVRVxudmFyIE1BR05JVFVERV9ESUdJVFMgPSAzOyAvLyBkaXR0b1xudmFyIFNFUCA9ICcnOyAvLyBzZXQgdG8gJ18nIGZvciBlYXNpZXIgZGVidWdnaW5nIFxuXG5mdW5jdGlvbiBjb2xsYXRlKGEsIGIpIHtcblxuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgYSA9IG5vcm1hbGl6ZUtleShhKTtcbiAgYiA9IG5vcm1hbGl6ZUtleShiKTtcblxuICB2YXIgYWkgPSBjb2xsYXRpb25JbmRleChhKTtcbiAgdmFyIGJpID0gY29sbGF0aW9uSW5kZXgoYik7XG4gIGlmICgoYWkgLSBiaSkgIT09IDApIHtcbiAgICByZXR1cm4gYWkgLSBiaTtcbiAgfVxuICBpZiAoYSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIHN3aXRjaCAodHlwZW9mIGEpIHtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIGEgPT09IGIgPyAwIDogKGEgPCBiID8gLTEgOiAxKTtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHN0cmluZ0NvbGxhdGUoYSwgYik7XG4gIH1cbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSkgPyBhcnJheUNvbGxhdGUoYSwgYikgOiBvYmplY3RDb2xsYXRlKGEsIGIpO1xufVxuXG4vLyBjb3VjaCBjb25zaWRlcnMgbnVsbC9OYU4vSW5maW5pdHkvLUluZmluaXR5ID09PSB1bmRlZmluZWQsXG4vLyBmb3IgdGhlIHB1cnBvc2VzIG9mIG1hcHJlZHVjZSBpbmRleGVzLiBhbHNvLCBkYXRlcyBnZXQgc3RyaW5naWZpZWQuXG5mdW5jdGlvbiBub3JtYWxpemVLZXkoa2V5KSB7XG4gIHN3aXRjaCAodHlwZW9mIGtleSkge1xuICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgaWYgKGtleSA9PT0gSW5maW5pdHkgfHwga2V5ID09PSAtSW5maW5pdHkgfHwgaXNOYU4oa2V5KSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBrZXk7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIHZhciBvcmlnS2V5ID0ga2V5O1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkge1xuICAgICAgICB2YXIgbGVuID0ga2V5Lmxlbmd0aDtcbiAgICAgICAga2V5ID0gbmV3IEFycmF5KGxlbik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBrZXlbaV0gPSBub3JtYWxpemVLZXkob3JpZ0tleVtpXSk7XG4gICAgICAgIH1cbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB9IGVsc2UgaWYgKGtleSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgcmV0dXJuIGtleS50b0pTT04oKTtcbiAgICAgIH0gZWxzZSBpZiAoa2V5ICE9PSBudWxsKSB7IC8vIGdlbmVyaWMgb2JqZWN0XG4gICAgICAgIGtleSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBrIGluIG9yaWdLZXkpIHtcbiAgICAgICAgICBpZiAob3JpZ0tleS5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IG9yaWdLZXlba107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAga2V5W2tdID0gbm9ybWFsaXplS2V5KHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gIH1cbiAgcmV0dXJuIGtleTtcbn1cblxuZnVuY3Rpb24gaW5kZXhpZnkoa2V5KSB7XG4gIGlmIChrZXkgIT09IG51bGwpIHtcbiAgICBzd2l0Y2ggKHR5cGVvZiBrZXkpIHtcbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICByZXR1cm4ga2V5ID8gMSA6IDA7XG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICByZXR1cm4gbnVtVG9JbmRleGFibGVTdHJpbmcoa2V5KTtcbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIC8vIFdlJ3ZlIHRvIGJlIHN1cmUgdGhhdCBrZXkgZG9lcyBub3QgY29udGFpbiBcXHUwMDAwXG4gICAgICAgIC8vIERvIG9yZGVyLXByZXNlcnZpbmcgcmVwbGFjZW1lbnRzOlxuICAgICAgICAvLyAwIC0+IDEsIDFcbiAgICAgICAgLy8gMSAtPiAxLCAyXG4gICAgICAgIC8vIDIgLT4gMiwgMlxuICAgICAgICByZXR1cm4ga2V5XG4gICAgICAgICAgLnJlcGxhY2UoL1xcdTAwMDIvZywgJ1xcdTAwMDJcXHUwMDAyJylcbiAgICAgICAgICAucmVwbGFjZSgvXFx1MDAwMS9nLCAnXFx1MDAwMVxcdTAwMDInKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXHUwMDAwL2csICdcXHUwMDAxXFx1MDAwMScpO1xuICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGtleSk7XG4gICAgICAgIHZhciBhcnIgPSBpc0FycmF5ID8ga2V5IDogT2JqZWN0LmtleXMoa2V5KTtcbiAgICAgICAgdmFyIGkgPSAtMTtcbiAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgICB3aGlsZSAoKytpIDwgbGVuKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gdG9JbmRleGFibGVTdHJpbmcoYXJyW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IGxlbikge1xuICAgICAgICAgICAgdmFyIG9iaktleSA9IGFycltpXTtcbiAgICAgICAgICAgIHJlc3VsdCArPSB0b0luZGV4YWJsZVN0cmluZyhvYmpLZXkpICtcbiAgICAgICAgICAgICAgICB0b0luZGV4YWJsZVN0cmluZyhrZXlbb2JqS2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAnJztcbn1cblxuLy8gY29udmVydCB0aGUgZ2l2ZW4ga2V5IHRvIGEgc3RyaW5nIHRoYXQgd291bGQgYmUgYXBwcm9wcmlhdGVcbi8vIGZvciBsZXhpY2FsIHNvcnRpbmcsIGUuZy4gd2l0aGluIGEgZGF0YWJhc2UsIHdoZXJlIHRoZVxuLy8gc29ydGluZyBpcyB0aGUgc2FtZSBnaXZlbiBieSB0aGUgY29sbGF0ZSgpIGZ1bmN0aW9uLlxuZnVuY3Rpb24gdG9JbmRleGFibGVTdHJpbmcoa2V5KSB7XG4gIHZhciB6ZXJvID0gJ1xcdTAwMDAnO1xuICBrZXkgPSBub3JtYWxpemVLZXkoa2V5KTtcbiAgcmV0dXJuIGNvbGxhdGlvbkluZGV4KGtleSkgKyBTRVAgKyBpbmRleGlmeShrZXkpICsgemVybztcbn1cblxuZnVuY3Rpb24gcGFyc2VOdW1iZXIoc3RyLCBpKSB7XG4gIHZhciBvcmlnaW5hbElkeCA9IGk7XG4gIHZhciBudW07XG4gIHZhciB6ZXJvID0gc3RyW2ldID09PSAnMSc7XG4gIGlmICh6ZXJvKSB7XG4gICAgbnVtID0gMDtcbiAgICBpKys7XG4gIH0gZWxzZSB7XG4gICAgdmFyIG5lZyA9IHN0cltpXSA9PT0gJzAnO1xuICAgIGkrKztcbiAgICB2YXIgbnVtQXNTdHJpbmcgPSAnJztcbiAgICB2YXIgbWFnQXNTdHJpbmcgPSBzdHIuc3Vic3RyaW5nKGksIGkgKyBNQUdOSVRVREVfRElHSVRTKTtcbiAgICB2YXIgbWFnbml0dWRlID0gcGFyc2VJbnQobWFnQXNTdHJpbmcsIDEwKSArIE1JTl9NQUdOSVRVREU7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAobmVnKSB7XG4gICAgICBtYWduaXR1ZGUgPSAtbWFnbml0dWRlO1xuICAgIH1cbiAgICBpICs9IE1BR05JVFVERV9ESUdJVFM7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciBjaCA9IHN0cltpXTtcbiAgICAgIGlmIChjaCA9PT0gJ1xcdTAwMDAnKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtQXNTdHJpbmcgKz0gY2g7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICAgIG51bUFzU3RyaW5nID0gbnVtQXNTdHJpbmcuc3BsaXQoJy4nKTtcbiAgICBpZiAobnVtQXNTdHJpbmcubGVuZ3RoID09PSAxKSB7XG4gICAgICBudW0gPSBwYXJzZUludChudW1Bc1N0cmluZywgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgbnVtID0gcGFyc2VGbG9hdChudW1Bc1N0cmluZ1swXSArICcuJyArIG51bUFzU3RyaW5nWzFdKTtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAobmVnKSB7XG4gICAgICBudW0gPSBudW0gLSAxMDtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZiAobWFnbml0dWRlICE9PSAwKSB7XG4gICAgICAvLyBwYXJzZUZsb2F0IGlzIG1vcmUgcmVsaWFibGUgdGhhbiBwb3cgZHVlIHRvIHJvdW5kaW5nIGVycm9yc1xuICAgICAgLy8gZS5nLiBOdW1iZXIuTUFYX1ZBTFVFIHdvdWxkIHJldHVybiBJbmZpbml0eSBpZiB3ZSBkaWRcbiAgICAgIC8vIG51bSAqIE1hdGgucG93KDEwLCBtYWduaXR1ZGUpO1xuICAgICAgbnVtID0gcGFyc2VGbG9hdChudW0gKyAnZScgKyBtYWduaXR1ZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge251bTogbnVtLCBsZW5ndGggOiBpIC0gb3JpZ2luYWxJZHh9O1xufVxuXG4vLyBtb3ZlIHVwIHRoZSBzdGFjayB3aGlsZSBwYXJzaW5nXG4vLyB0aGlzIGZ1bmN0aW9uIG1vdmVkIG91dHNpZGUgb2YgcGFyc2VJbmRleGFibGVTdHJpbmcgZm9yIHBlcmZvcm1hbmNlXG5mdW5jdGlvbiBwb3Aoc3RhY2ssIG1ldGFTdGFjaykge1xuICB2YXIgb2JqID0gc3RhY2sucG9wKCk7XG5cbiAgaWYgKG1ldGFTdGFjay5sZW5ndGgpIHtcbiAgICB2YXIgbGFzdE1ldGFFbGVtZW50ID0gbWV0YVN0YWNrW21ldGFTdGFjay5sZW5ndGggLSAxXTtcbiAgICBpZiAob2JqID09PSBsYXN0TWV0YUVsZW1lbnQuZWxlbWVudCkge1xuICAgICAgLy8gcG9wcGluZyBhIG1ldGEtZWxlbWVudCwgZS5nLiBhbiBvYmplY3Qgd2hvc2UgdmFsdWUgaXMgYW5vdGhlciBvYmplY3RcbiAgICAgIG1ldGFTdGFjay5wb3AoKTtcbiAgICAgIGxhc3RNZXRhRWxlbWVudCA9IG1ldGFTdGFja1ttZXRhU3RhY2subGVuZ3RoIC0gMV07XG4gICAgfVxuICAgIHZhciBlbGVtZW50ID0gbGFzdE1ldGFFbGVtZW50LmVsZW1lbnQ7XG4gICAgdmFyIGxhc3RFbGVtZW50SW5kZXggPSBsYXN0TWV0YUVsZW1lbnQuaW5kZXg7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlbWVudCkpIHtcbiAgICAgIGVsZW1lbnQucHVzaChvYmopO1xuICAgIH0gZWxzZSBpZiAobGFzdEVsZW1lbnRJbmRleCA9PT0gc3RhY2subGVuZ3RoIC0gMikgeyAvLyBvYmogd2l0aCBrZXkrdmFsdWVcbiAgICAgIHZhciBrZXkgPSBzdGFjay5wb3AoKTtcbiAgICAgIGVsZW1lbnRba2V5XSA9IG9iajtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhY2sucHVzaChvYmopOyAvLyBvYmogd2l0aCBrZXkgb25seVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBwYXJzZUluZGV4YWJsZVN0cmluZyhzdHIpIHtcbiAgdmFyIHN0YWNrID0gW107XG4gIHZhciBtZXRhU3RhY2sgPSBbXTsgLy8gc3RhY2sgZm9yIGFycmF5cyBhbmQgb2JqZWN0c1xuICB2YXIgaSA9IDA7XG5cbiAgLyplc2xpbnQgbm8tY29uc3RhbnQtY29uZGl0aW9uOiBbXCJlcnJvclwiLCB7IFwiY2hlY2tMb29wc1wiOiBmYWxzZSB9XSovXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIGNvbGxhdGlvbkluZGV4ID0gc3RyW2krK107XG4gICAgaWYgKGNvbGxhdGlvbkluZGV4ID09PSAnXFx1MDAwMCcpIHtcbiAgICAgIGlmIChzdGFjay5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHN0YWNrLnBvcCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9wKHN0YWNrLCBtZXRhU3RhY2spO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3dpdGNoIChjb2xsYXRpb25JbmRleCkge1xuICAgICAgY2FzZSAnMSc6XG4gICAgICAgIHN0YWNrLnB1c2gobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnMic6XG4gICAgICAgIHN0YWNrLnB1c2goc3RyW2ldID09PSAnMScpO1xuICAgICAgICBpKys7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnMyc6XG4gICAgICAgIHZhciBwYXJzZWROdW0gPSBwYXJzZU51bWJlcihzdHIsIGkpO1xuICAgICAgICBzdGFjay5wdXNoKHBhcnNlZE51bS5udW0pO1xuICAgICAgICBpICs9IHBhcnNlZE51bS5sZW5ndGg7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnNCc6XG4gICAgICAgIHZhciBwYXJzZWRTdHIgPSAnJztcbiAgICAgICAgLyplc2xpbnQgbm8tY29uc3RhbnQtY29uZGl0aW9uOiBbXCJlcnJvclwiLCB7IFwiY2hlY2tMb29wc1wiOiBmYWxzZSB9XSovXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgdmFyIGNoID0gc3RyW2ldO1xuICAgICAgICAgIGlmIChjaCA9PT0gJ1xcdTAwMDAnKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyc2VkU3RyICs9IGNoO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICAvLyBwZXJmb3JtIHRoZSByZXZlcnNlIG9mIHRoZSBvcmRlci1wcmVzZXJ2aW5nIHJlcGxhY2VtZW50XG4gICAgICAgIC8vIGFsZ29yaXRobSAoc2VlIGFib3ZlKVxuICAgICAgICBwYXJzZWRTdHIgPSBwYXJzZWRTdHIucmVwbGFjZSgvXFx1MDAwMVxcdTAwMDEvZywgJ1xcdTAwMDAnKVxuICAgICAgICAgIC5yZXBsYWNlKC9cXHUwMDAxXFx1MDAwMi9nLCAnXFx1MDAwMScpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcdTAwMDJcXHUwMDAyL2csICdcXHUwMDAyJyk7XG4gICAgICAgIHN0YWNrLnB1c2gocGFyc2VkU3RyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICc1JzpcbiAgICAgICAgdmFyIGFycmF5RWxlbWVudCA9IHsgZWxlbWVudDogW10sIGluZGV4OiBzdGFjay5sZW5ndGggfTtcbiAgICAgICAgc3RhY2sucHVzaChhcnJheUVsZW1lbnQuZWxlbWVudCk7XG4gICAgICAgIG1ldGFTdGFjay5wdXNoKGFycmF5RWxlbWVudCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnNic6XG4gICAgICAgIHZhciBvYmpFbGVtZW50ID0geyBlbGVtZW50OiB7fSwgaW5kZXg6IHN0YWNrLmxlbmd0aCB9O1xuICAgICAgICBzdGFjay5wdXNoKG9iakVsZW1lbnQuZWxlbWVudCk7XG4gICAgICAgIG1ldGFTdGFjay5wdXNoKG9iakVsZW1lbnQpO1xuICAgICAgICBicmVhaztcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ2JhZCBjb2xsYXRpb25JbmRleCBvciB1bmV4cGVjdGVkbHkgcmVhY2hlZCBlbmQgb2YgaW5wdXQ6ICcgK1xuICAgICAgICAgICAgY29sbGF0aW9uSW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcnJheUNvbGxhdGUoYSwgYikge1xuICB2YXIgbGVuID0gTWF0aC5taW4oYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBzb3J0ID0gY29sbGF0ZShhW2ldLCBiW2ldKTtcbiAgICBpZiAoc29ydCAhPT0gMCkge1xuICAgICAgcmV0dXJuIHNvcnQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAoYS5sZW5ndGggPT09IGIubGVuZ3RoKSA/IDAgOlxuICAgIChhLmxlbmd0aCA+IGIubGVuZ3RoKSA/IDEgOiAtMTtcbn1cbmZ1bmN0aW9uIHN0cmluZ0NvbGxhdGUoYSwgYikge1xuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9kYWxlaGFydmV5L3BvdWNoZGIvaXNzdWVzLzQwXG4gIC8vIFRoaXMgaXMgaW5jb21wYXRpYmxlIHdpdGggdGhlIENvdWNoREIgaW1wbGVtZW50YXRpb24sIGJ1dCBpdHMgdGhlXG4gIC8vIGJlc3Qgd2UgY2FuIGRvIGZvciBub3dcbiAgcmV0dXJuIChhID09PSBiKSA/IDAgOiAoKGEgPiBiKSA/IDEgOiAtMSk7XG59XG5mdW5jdGlvbiBvYmplY3RDb2xsYXRlKGEsIGIpIHtcbiAgdmFyIGFrID0gT2JqZWN0LmtleXMoYSksIGJrID0gT2JqZWN0LmtleXMoYik7XG4gIHZhciBsZW4gPSBNYXRoLm1pbihhay5sZW5ndGgsIGJrLmxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAvLyBGaXJzdCBzb3J0IHRoZSBrZXlzXG4gICAgdmFyIHNvcnQgPSBjb2xsYXRlKGFrW2ldLCBia1tpXSk7XG4gICAgaWYgKHNvcnQgIT09IDApIHtcbiAgICAgIHJldHVybiBzb3J0O1xuICAgIH1cbiAgICAvLyBpZiB0aGUga2V5cyBhcmUgZXF1YWwgc29ydCB0aGUgdmFsdWVzXG4gICAgc29ydCA9IGNvbGxhdGUoYVtha1tpXV0sIGJbYmtbaV1dKTtcbiAgICBpZiAoc29ydCAhPT0gMCkge1xuICAgICAgcmV0dXJuIHNvcnQ7XG4gICAgfVxuXG4gIH1cbiAgcmV0dXJuIChhay5sZW5ndGggPT09IGJrLmxlbmd0aCkgPyAwIDpcbiAgICAoYWsubGVuZ3RoID4gYmsubGVuZ3RoKSA/IDEgOiAtMTtcbn1cbi8vIFRoZSBjb2xsYXRpb24gaXMgZGVmaW5lZCBieSBlcmxhbmdzIG9yZGVyZWQgdGVybXNcbi8vIHRoZSBhdG9tcyBudWxsLCB0cnVlLCBmYWxzZSBjb21lIGZpcnN0LCB0aGVuIG51bWJlcnMsIHN0cmluZ3MsXG4vLyBhcnJheXMsIHRoZW4gb2JqZWN0c1xuLy8gbnVsbC91bmRlZmluZWQvTmFOL0luZmluaXR5Ly1JbmZpbml0eSBhcmUgYWxsIGNvbnNpZGVyZWQgbnVsbFxuZnVuY3Rpb24gY29sbGF0aW9uSW5kZXgoeCkge1xuICB2YXIgaWQgPSBbJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ3N0cmluZycsICdvYmplY3QnXTtcbiAgdmFyIGlkeCA9IGlkLmluZGV4T2YodHlwZW9mIHgpO1xuICAvL2ZhbHNlIGlmIC0xIG90aGVyd2lzZSB0cnVlLCBidXQgZmFzdCEhISExXG4gIGlmICh+aWR4KSB7XG4gICAgaWYgKHggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgcmV0dXJuIDU7XG4gICAgfVxuICAgIHJldHVybiBpZHggPCAzID8gKGlkeCArIDIpIDogKGlkeCArIDMpO1xuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgcmV0dXJuIDU7XG4gIH1cbn1cblxuLy8gY29udmVyc2lvbjpcbi8vIHggeXl5IHp6Li4uenpcbi8vIHggPSAwIGZvciBuZWdhdGl2ZSwgMSBmb3IgMCwgMiBmb3IgcG9zaXRpdmVcbi8vIHkgPSBleHBvbmVudCAoZm9yIG5lZ2F0aXZlIG51bWJlcnMgbmVnYXRlZCkgbW92ZWQgc28gdGhhdCBpdCdzID49IDBcbi8vIHogPSBtYW50aXNzZVxuZnVuY3Rpb24gbnVtVG9JbmRleGFibGVTdHJpbmcobnVtKSB7XG5cbiAgaWYgKG51bSA9PT0gMCkge1xuICAgIHJldHVybiAnMSc7XG4gIH1cblxuICAvLyBjb252ZXJ0IG51bWJlciB0byBleHBvbmVudGlhbCBmb3JtYXQgZm9yIGVhc2llciBhbmRcbiAgLy8gbW9yZSBzdWNjaW5jdCBzdHJpbmcgc29ydGluZ1xuICB2YXIgZXhwRm9ybWF0ID0gbnVtLnRvRXhwb25lbnRpYWwoKS5zcGxpdCgvZVxcKz8vKTtcbiAgdmFyIG1hZ25pdHVkZSA9IHBhcnNlSW50KGV4cEZvcm1hdFsxXSwgMTApO1xuXG4gIHZhciBuZWcgPSBudW0gPCAwO1xuXG4gIHZhciByZXN1bHQgPSBuZWcgPyAnMCcgOiAnMic7XG5cbiAgLy8gZmlyc3Qgc29ydCBieSBtYWduaXR1ZGVcbiAgLy8gaXQncyBlYXNpZXIgaWYgYWxsIG1hZ25pdHVkZXMgYXJlIHBvc2l0aXZlXG4gIHZhciBtYWdGb3JDb21wYXJpc29uID0gKChuZWcgPyAtbWFnbml0dWRlIDogbWFnbml0dWRlKSAtIE1JTl9NQUdOSVRVREUpO1xuICB2YXIgbWFnU3RyaW5nID0gcGFkTGVmdCgobWFnRm9yQ29tcGFyaXNvbikudG9TdHJpbmcoKSwgJzAnLCBNQUdOSVRVREVfRElHSVRTKTtcblxuICByZXN1bHQgKz0gU0VQICsgbWFnU3RyaW5nO1xuXG4gIC8vIHRoZW4gc29ydCBieSB0aGUgZmFjdG9yXG4gIHZhciBmYWN0b3IgPSBNYXRoLmFicyhwYXJzZUZsb2F0KGV4cEZvcm1hdFswXSkpOyAvLyBbMS4uMTApXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChuZWcpIHsgLy8gZm9yIG5lZ2F0aXZlIHJldmVyc2Ugb3JkZXJpbmdcbiAgICBmYWN0b3IgPSAxMCAtIGZhY3RvcjtcbiAgfVxuXG4gIHZhciBmYWN0b3JTdHIgPSBmYWN0b3IudG9GaXhlZCgyMCk7XG5cbiAgLy8gc3RyaXAgemVyb3MgZnJvbSB0aGUgZW5kXG4gIGZhY3RvclN0ciA9IGZhY3RvclN0ci5yZXBsYWNlKC9cXC4/MCskLywgJycpO1xuXG4gIHJlc3VsdCArPSBTRVAgKyBmYWN0b3JTdHI7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLypcbiAqIFNpbXBsZSB0YXNrIHF1ZXVlIHRvIHNlcXVlbnRpYWxpemUgYWN0aW9ucy4gQXNzdW1lc1xuICogY2FsbGJhY2tzIHdpbGwgZXZlbnR1YWxseSBmaXJlIChvbmNlKS5cbiAqL1xuXG5mdW5jdGlvbiBUYXNrUXVldWUkMSgpIHtcbiAgdGhpcy5wcm9taXNlID0gbmV3IFBvdWNoUHJvbWlzZShmdW5jdGlvbiAoZnVsZmlsbCkge2Z1bGZpbGwoKTsgfSk7XG59XG5UYXNrUXVldWUkMS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHByb21pc2VGYWN0b3J5KSB7XG4gIHRoaXMucHJvbWlzZSA9IHRoaXMucHJvbWlzZS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgLy8ganVzdCByZWNvdmVyXG4gIH0pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwcm9taXNlRmFjdG9yeSgpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbn07XG5UYXNrUXVldWUkMS5wcm90b3R5cGUuZmluaXNoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5wcm9taXNlO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlVmlldyhvcHRzKSB7XG4gIHZhciBzb3VyY2VEQiA9IG9wdHMuZGI7XG4gIHZhciB2aWV3TmFtZSA9IG9wdHMudmlld05hbWU7XG4gIHZhciBtYXBGdW4gPSBvcHRzLm1hcDtcbiAgdmFyIHJlZHVjZUZ1biA9IG9wdHMucmVkdWNlO1xuICB2YXIgdGVtcG9yYXJ5ID0gb3B0cy50ZW1wb3Jhcnk7XG5cbiAgLy8gdGhlIFwidW5kZWZpbmVkXCIgcGFydCBpcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgdmFyIHZpZXdTaWduYXR1cmUgPSBtYXBGdW4udG9TdHJpbmcoKSArIChyZWR1Y2VGdW4gJiYgcmVkdWNlRnVuLnRvU3RyaW5nKCkpICtcbiAgICAndW5kZWZpbmVkJztcblxuICB2YXIgY2FjaGVkVmlld3M7XG4gIGlmICghdGVtcG9yYXJ5KSB7XG4gICAgLy8gY2FjaGUgdGhpcyB0byBlbnN1cmUgd2UgZG9uJ3QgdHJ5IHRvIHVwZGF0ZSB0aGUgc2FtZSB2aWV3IHR3aWNlXG4gICAgY2FjaGVkVmlld3MgPSBzb3VyY2VEQi5fY2FjaGVkVmlld3MgPSBzb3VyY2VEQi5fY2FjaGVkVmlld3MgfHwge307XG4gICAgaWYgKGNhY2hlZFZpZXdzW3ZpZXdTaWduYXR1cmVdKSB7XG4gICAgICByZXR1cm4gY2FjaGVkVmlld3Nbdmlld1NpZ25hdHVyZV07XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb21pc2VGb3JWaWV3ID0gc291cmNlREIuaW5mbygpLnRoZW4oZnVuY3Rpb24gKGluZm8pIHtcblxuICAgIHZhciBkZXBEYk5hbWUgPSBpbmZvLmRiX25hbWUgKyAnLW1ydmlldy0nICtcbiAgICAgICh0ZW1wb3JhcnkgPyAndGVtcCcgOiBzdHJpbmdNZDUodmlld1NpZ25hdHVyZSkpO1xuXG4gICAgLy8gc2F2ZSB0aGUgdmlldyBuYW1lIGluIHRoZSBzb3VyY2UgZGIgc28gaXQgY2FuIGJlIGNsZWFuZWQgdXAgaWYgbmVjZXNzYXJ5XG4gICAgLy8gKGUuZy4gd2hlbiB0aGUgX2Rlc2lnbiBkb2MgaXMgZGVsZXRlZCwgcmVtb3ZlIGFsbCBhc3NvY2lhdGVkIHZpZXcgZGF0YSlcbiAgICBmdW5jdGlvbiBkaWZmRnVuY3Rpb24oZG9jKSB7XG4gICAgICBkb2Mudmlld3MgPSBkb2Mudmlld3MgfHwge307XG4gICAgICB2YXIgZnVsbFZpZXdOYW1lID0gdmlld05hbWU7XG4gICAgICBpZiAoZnVsbFZpZXdOYW1lLmluZGV4T2YoJy8nKSA9PT0gLTEpIHtcbiAgICAgICAgZnVsbFZpZXdOYW1lID0gdmlld05hbWUgKyAnLycgKyB2aWV3TmFtZTtcbiAgICAgIH1cbiAgICAgIHZhciBkZXBEYnMgPSBkb2Mudmlld3NbZnVsbFZpZXdOYW1lXSA9IGRvYy52aWV3c1tmdWxsVmlld05hbWVdIHx8IHt9O1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAoZGVwRGJzW2RlcERiTmFtZV0pIHtcbiAgICAgICAgcmV0dXJuOyAvLyBubyB1cGRhdGUgbmVjZXNzYXJ5XG4gICAgICB9XG4gICAgICBkZXBEYnNbZGVwRGJOYW1lXSA9IHRydWU7XG4gICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICByZXR1cm4gdXBzZXJ0KHNvdXJjZURCLCAnX2xvY2FsL21ydmlld3MnLCBkaWZmRnVuY3Rpb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHNvdXJjZURCLnJlZ2lzdGVyRGVwZW5kZW50RGF0YWJhc2UoZGVwRGJOYW1lKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgdmFyIGRiID0gcmVzLmRiO1xuICAgICAgICBkYi5hdXRvX2NvbXBhY3Rpb24gPSB0cnVlO1xuICAgICAgICB2YXIgdmlldyA9IHtcbiAgICAgICAgICBuYW1lOiBkZXBEYk5hbWUsXG4gICAgICAgICAgZGI6IGRiLFxuICAgICAgICAgIHNvdXJjZURCOiBzb3VyY2VEQixcbiAgICAgICAgICBhZGFwdGVyOiBzb3VyY2VEQi5hZGFwdGVyLFxuICAgICAgICAgIG1hcEZ1bjogbWFwRnVuLFxuICAgICAgICAgIHJlZHVjZUZ1bjogcmVkdWNlRnVuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB2aWV3LmRiLmdldCgnX2xvY2FsL2xhc3RTZXEnKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgICAgaWYgKGVyci5zdGF0dXMgIT09IDQwNCkge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAobGFzdFNlcURvYykge1xuICAgICAgICAgIHZpZXcuc2VxID0gbGFzdFNlcURvYyA/IGxhc3RTZXFEb2Muc2VxIDogMDtcbiAgICAgICAgICBpZiAoY2FjaGVkVmlld3MpIHtcbiAgICAgICAgICAgIHZpZXcuZGIub25jZSgnZGVzdHJveWVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBkZWxldGUgY2FjaGVkVmlld3Nbdmlld1NpZ25hdHVyZV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGlmIChjYWNoZWRWaWV3cykge1xuICAgIGNhY2hlZFZpZXdzW3ZpZXdTaWduYXR1cmVdID0gcHJvbWlzZUZvclZpZXc7XG4gIH1cbiAgcmV0dXJuIHByb21pc2VGb3JWaWV3O1xufVxuXG5mdW5jdGlvbiBRdWVyeVBhcnNlRXJyb3IobWVzc2FnZSkge1xuICB0aGlzLnN0YXR1cyA9IDQwMDtcbiAgdGhpcy5uYW1lID0gJ3F1ZXJ5X3BhcnNlX2Vycm9yJztcbiAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgdGhpcy5lcnJvciA9IHRydWU7XG4gIHRyeSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgUXVlcnlQYXJzZUVycm9yKTtcbiAgfSBjYXRjaCAoZSkge31cbn1cblxuaW5oZXJpdHMoUXVlcnlQYXJzZUVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIE5vdEZvdW5kRXJyb3IobWVzc2FnZSkge1xuICB0aGlzLnN0YXR1cyA9IDQwNDtcbiAgdGhpcy5uYW1lID0gJ25vdF9mb3VuZCc7XG4gIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gIHRoaXMuZXJyb3IgPSB0cnVlO1xuICB0cnkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIE5vdEZvdW5kRXJyb3IpO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG5pbmhlcml0cyhOb3RGb3VuZEVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIEJ1aWx0SW5FcnJvcihtZXNzYWdlKSB7XG4gIHRoaXMuc3RhdHVzID0gNTAwO1xuICB0aGlzLm5hbWUgPSAnaW52YWxpZF92YWx1ZSc7XG4gIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gIHRoaXMuZXJyb3IgPSB0cnVlO1xuICB0cnkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIEJ1aWx0SW5FcnJvcik7XG4gIH0gY2F0Y2ggKGUpIHt9XG59XG5cbmluaGVyaXRzKEJ1aWx0SW5FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiBjcmVhdGVCdWlsdEluRXJyb3IobmFtZSkge1xuICB2YXIgbWVzc2FnZSA9ICdidWlsdGluICcgKyBuYW1lICtcbiAgICAnIGZ1bmN0aW9uIHJlcXVpcmVzIG1hcCB2YWx1ZXMgdG8gYmUgbnVtYmVycycgK1xuICAgICcgb3IgbnVtYmVyIGFycmF5cyc7XG4gIHJldHVybiBuZXcgQnVpbHRJbkVycm9yKG1lc3NhZ2UpO1xufVxuXG5mdW5jdGlvbiBzdW0odmFsdWVzKSB7XG4gIHZhciByZXN1bHQgPSAwO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdmFyIG51bSA9IHZhbHVlc1tpXTtcbiAgICBpZiAodHlwZW9mIG51bSAhPT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG51bSkpIHtcbiAgICAgICAgLy8gbGlzdHMgb2YgbnVtYmVycyBhcmUgYWxzbyBhbGxvd2VkLCBzdW0gdGhlbSBzZXBhcmF0ZWx5XG4gICAgICAgIHJlc3VsdCA9IHR5cGVvZiByZXN1bHQgPT09ICdudW1iZXInID8gW3Jlc3VsdF0gOiByZXN1bHQ7XG4gICAgICAgIGZvciAodmFyIGogPSAwLCBqTGVuID0gbnVtLmxlbmd0aDsgaiA8IGpMZW47IGorKykge1xuICAgICAgICAgIHZhciBqTnVtID0gbnVtW2pdO1xuICAgICAgICAgIGlmICh0eXBlb2Ygak51bSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRocm93IGNyZWF0ZUJ1aWx0SW5FcnJvcignX3N1bScpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdFtqXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGpOdW0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHRbal0gKz0gak51bTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG5vdCBhcnJheS9udW1iZXJcbiAgICAgICAgdGhyb3cgY3JlYXRlQnVpbHRJbkVycm9yKCdfc3VtJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnbnVtYmVyJykge1xuICAgICAgcmVzdWx0ICs9IG51bTtcbiAgICB9IGVsc2UgeyAvLyBhZGQgbnVtYmVyIHRvIGFycmF5XG4gICAgICByZXN1bHRbMF0gKz0gbnVtO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIgbG9nJDIgPSBndWFyZGVkQ29uc29sZS5iaW5kKG51bGwsICdsb2cnKTtcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbnZhciB0b0pTT04gPSBKU09OLnBhcnNlO1xuXG5mdW5jdGlvbiBldmFsRnVuY3Rpb25XaXRoRXZhbChmdW5jLCBlbWl0KSB7XG4gIHJldHVybiBzY29wZWRFdmFsKFxuICAgIFwicmV0dXJuIChcIiArIGZ1bmMucmVwbGFjZSgvO1xccyokLywgXCJcIikgKyBcIik7XCIsXG4gICAge1xuICAgICAgZW1pdDogZW1pdCxcbiAgICAgIHN1bTogc3VtLFxuICAgICAgbG9nOiBsb2ckMixcbiAgICAgIGlzQXJyYXk6IGlzQXJyYXksXG4gICAgICB0b0pTT046IHRvSlNPTlxuICAgIH1cbiAgKTtcbn1cblxudmFyIHByb21pc2VkQ2FsbGJhY2sgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgaWYgKGNhbGxiYWNrKSB7XG4gICAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFjayhudWxsLCByZXMpO1xuICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNhbGxiYWNrKHJlYXNvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcHJvbWlzZTtcbn07XG5cbnZhciBjYWxsYmFja2lmeSA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgcmV0dXJuIGdldEFyZ3VtZW50cyhmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBjYiA9IGFyZ3MucG9wKCk7XG4gICAgdmFyIHByb21pc2UgPSBmdW4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgaWYgKHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcHJvbWlzZWRDYWxsYmFjayhwcm9taXNlLCBjYik7XG4gICAgfVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9KTtcbn07XG5cbi8vIFByb21pc2UgZmluYWxseSB1dGlsIHNpbWlsYXIgdG8gUS5maW5hbGx5XG52YXIgZmluID0gZnVuY3Rpb24gKHByb21pc2UsIGZpbmFsUHJvbWlzZUZhY3RvcnkpIHtcbiAgcmV0dXJuIHByb21pc2UudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgcmV0dXJuIGZpbmFsUHJvbWlzZUZhY3RvcnkoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG4gIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gZmluYWxQcm9taXNlRmFjdG9yeSgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3cgcmVhc29uO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbnZhciBzZXF1ZW50aWFsaXplID0gZnVuY3Rpb24gKHF1ZXVlLCBwcm9taXNlRmFjdG9yeSkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gcXVldWUuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBwcm9taXNlRmFjdG9yeS5hcHBseSh0aGF0LCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbi8vIHVuaXEgYW4gYXJyYXkgb2Ygc3RyaW5ncywgb3JkZXIgbm90IGd1YXJhbnRlZWRcbi8vIHNpbWlsYXIgdG8gdW5kZXJzY29yZS9sb2Rhc2ggXy51bmlxXG52YXIgdW5pcSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgdmFyIG1hcCA9IHt9O1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBtYXBbJyQnICsgYXJyW2ldXSA9IHRydWU7XG4gIH1cblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hcCk7XG4gIHZhciBvdXRwdXQgPSBuZXcgQXJyYXkoa2V5cy5sZW5ndGgpO1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRwdXRbaV0gPSBrZXlzW2ldLnN1YnN0cmluZygxKTtcbiAgfVxuICByZXR1cm4gb3V0cHV0O1xufTtcblxudmFyIHBlcnNpc3RlbnRRdWV1ZXMgPSB7fTtcbnZhciB0ZW1wVmlld1F1ZXVlID0gbmV3IFRhc2tRdWV1ZSQxKCk7XG52YXIgQ0hBTkdFU19CQVRDSF9TSVpFJDEgPSA1MDtcblxuZnVuY3Rpb24gcGFyc2VWaWV3TmFtZShuYW1lKSB7XG4gIC8vIGNhbiBiZSBlaXRoZXIgJ2Rkb2NuYW1lL3ZpZXduYW1lJyBvciBqdXN0ICd2aWV3bmFtZSdcbiAgLy8gKHdoZXJlIHRoZSBkZG9jIG5hbWUgaXMgdGhlIHNhbWUpXG4gIHJldHVybiBuYW1lLmluZGV4T2YoJy8nKSA9PT0gLTEgPyBbbmFtZSwgbmFtZV0gOiBuYW1lLnNwbGl0KCcvJyk7XG59XG5cbmZ1bmN0aW9uIGlzR2VuT25lKGNoYW5nZXMpIHtcbiAgLy8gb25seSByZXR1cm4gdHJ1ZSBpZiB0aGUgY3VycmVudCBjaGFuZ2UgaXMgMS1cbiAgLy8gYW5kIHRoZXJlIGFyZSBubyBvdGhlciBsZWFmc1xuICByZXR1cm4gY2hhbmdlcy5sZW5ndGggPT09IDEgJiYgL14xLS8udGVzdChjaGFuZ2VzWzBdLnJldik7XG59XG5cbmZ1bmN0aW9uIGVtaXRFcnJvcihkYiwgZSkge1xuICB0cnkge1xuICAgIGRiLmVtaXQoJ2Vycm9yJywgZSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGd1YXJkZWRDb25zb2xlKCdlcnJvcicsXG4gICAgICAnVGhlIHVzZXJcXCdzIG1hcC9yZWR1Y2UgZnVuY3Rpb24gdGhyZXcgYW4gdW5jYXVnaHQgZXJyb3IuXFxuJyArXG4gICAgICAnWW91IGNhbiBkZWJ1ZyB0aGlzIGVycm9yIGJ5IGRvaW5nOlxcbicgK1xuICAgICAgJ215RGF0YWJhc2Uub24oXFwnZXJyb3JcXCcsIGZ1bmN0aW9uIChlcnIpIHsgZGVidWdnZXI7IH0pO1xcbicgK1xuICAgICAgJ1BsZWFzZSBkb3VibGUtY2hlY2sgeW91ciBtYXAvcmVkdWNlIGZ1bmN0aW9uLicpO1xuICAgIGd1YXJkZWRDb25zb2xlKCdlcnJvcicsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeUNvZGUkMShkYiwgZnVuLCBhcmdzKSB7XG4gIC8vIGVtaXQgYW4gZXZlbnQgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHRocm93biBieSBhIG1hcC9yZWR1Y2UgZnVuY3Rpb24uXG4gIC8vIHB1dHRpbmcgdHJ5L2NhdGNoZXMgaW4gYSBzaW5nbGUgZnVuY3Rpb24gYWxzbyBhdm9pZHMgZGVvcHRpbWl6YXRpb25zLlxuICB0cnkge1xuICAgIHJldHVybiB7XG4gICAgICBvdXRwdXQgOiBmdW4uYXBwbHkobnVsbCwgYXJncylcbiAgICB9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgZW1pdEVycm9yKGRiLCBlKTtcbiAgICByZXR1cm4ge2Vycm9yOiBlfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzb3J0QnlLZXlUaGVuVmFsdWUoeCwgeSkge1xuICB2YXIga2V5Q29tcGFyZSA9IGNvbGxhdGUoeC5rZXksIHkua2V5KTtcbiAgcmV0dXJuIGtleUNvbXBhcmUgIT09IDAgPyBrZXlDb21wYXJlIDogY29sbGF0ZSh4LnZhbHVlLCB5LnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gc2xpY2VSZXN1bHRzKHJlc3VsdHMsIGxpbWl0LCBza2lwKSB7XG4gIHNraXAgPSBza2lwIHx8IDA7XG4gIGlmICh0eXBlb2YgbGltaXQgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHJlc3VsdHMuc2xpY2Uoc2tpcCwgbGltaXQgKyBza2lwKTtcbiAgfSBlbHNlIGlmIChza2lwID4gMCkge1xuICAgIHJldHVybiByZXN1bHRzLnNsaWNlKHNraXApO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiByb3dUb0RvY0lkKHJvdykge1xuICB2YXIgdmFsID0gcm93LnZhbHVlO1xuICAvLyBVc2VycyBjYW4gZXhwbGljaXRseSBzcGVjaWZ5IGEgam9pbmVkIGRvYyBfaWQsIG9yIGl0XG4gIC8vIGRlZmF1bHRzIHRvIHRoZSBkb2MgX2lkIHRoYXQgZW1pdHRlZCB0aGUga2V5L3ZhbHVlLlxuICB2YXIgZG9jSWQgPSAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmIHZhbC5faWQpIHx8IHJvdy5pZDtcbiAgcmV0dXJuIGRvY0lkO1xufVxuXG5mdW5jdGlvbiByZWFkQXR0YWNobWVudHNBc0Jsb2JPckJ1ZmZlciQxKHJlcykge1xuICByZXMucm93cy5mb3JFYWNoKGZ1bmN0aW9uIChyb3cpIHtcbiAgICB2YXIgYXR0cyA9IHJvdy5kb2MgJiYgcm93LmRvYy5fYXR0YWNobWVudHM7XG4gICAgaWYgKCFhdHRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE9iamVjdC5rZXlzKGF0dHMpLmZvckVhY2goZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICB2YXIgYXR0ID0gYXR0c1tmaWxlbmFtZV07XG4gICAgICBhdHRzW2ZpbGVuYW1lXS5kYXRhID0gYjY0VG9CbHVmZmVyKGF0dC5kYXRhLCBhdHQuY29udGVudF90eXBlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvc3Rwcm9jZXNzQXR0YWNobWVudHMob3B0cykge1xuICByZXR1cm4gZnVuY3Rpb24gKHJlcykge1xuICAgIGlmIChvcHRzLmluY2x1ZGVfZG9jcyAmJiBvcHRzLmF0dGFjaG1lbnRzICYmIG9wdHMuYmluYXJ5KSB7XG4gICAgICByZWFkQXR0YWNobWVudHNBc0Jsb2JPckJ1ZmZlciQxKHJlcyk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH07XG59XG5cbnZhciBidWlsdEluUmVkdWNlID0ge1xuICBfc3VtOiBmdW5jdGlvbiAoa2V5cywgdmFsdWVzKSB7XG4gICAgcmV0dXJuIHN1bSh2YWx1ZXMpO1xuICB9LFxuXG4gIF9jb3VudDogZnVuY3Rpb24gKGtleXMsIHZhbHVlcykge1xuICAgIHJldHVybiB2YWx1ZXMubGVuZ3RoO1xuICB9LFxuXG4gIF9zdGF0czogZnVuY3Rpb24gKGtleXMsIHZhbHVlcykge1xuICAgIC8vIG5vIG5lZWQgdG8gaW1wbGVtZW50IHJlcmVkdWNlPXRydWUsIGJlY2F1c2UgUG91Y2hcbiAgICAvLyB3aWxsIG5ldmVyIGNhbGwgaXRcbiAgICBmdW5jdGlvbiBzdW1zcXIodmFsdWVzKSB7XG4gICAgICB2YXIgX3N1bXNxciA9IDA7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBudW0gPSB2YWx1ZXNbaV07XG4gICAgICAgIF9zdW1zcXIgKz0gKG51bSAqIG51bSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3N1bXNxcjtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bSAgICAgOiBzdW0odmFsdWVzKSxcbiAgICAgIG1pbiAgICAgOiBNYXRoLm1pbi5hcHBseShudWxsLCB2YWx1ZXMpLFxuICAgICAgbWF4ICAgICA6IE1hdGgubWF4LmFwcGx5KG51bGwsIHZhbHVlcyksXG4gICAgICBjb3VudCAgIDogdmFsdWVzLmxlbmd0aCxcbiAgICAgIHN1bXNxciA6IHN1bXNxcih2YWx1ZXMpXG4gICAgfTtcbiAgfVxufTtcblxuZnVuY3Rpb24gYWRkSHR0cFBhcmFtKHBhcmFtTmFtZSwgb3B0cywgcGFyYW1zLCBhc0pzb24pIHtcbiAgLy8gYWRkIGFuIGh0dHAgcGFyYW0gZnJvbSBvcHRzIHRvIHBhcmFtcywgb3B0aW9uYWxseSBqc29uLWVuY29kZWRcbiAgdmFyIHZhbCA9IG9wdHNbcGFyYW1OYW1lXTtcbiAgaWYgKHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKGFzSnNvbikge1xuICAgICAgdmFsID0gZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgIH1cbiAgICBwYXJhbXMucHVzaChwYXJhbU5hbWUgKyAnPScgKyB2YWwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvZXJjZUludGVnZXIoaW50ZWdlckNhbmRpZGF0ZSkge1xuICBpZiAodHlwZW9mIGludGVnZXJDYW5kaWRhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIGFzTnVtYmVyID0gTnVtYmVyKGludGVnZXJDYW5kaWRhdGUpO1xuICAgIC8vIHByZXZlbnRzIGUuZy4gJzFmb28nIG9yICcxLjEnIGJlaW5nIGNvZXJjZWQgdG8gMVxuICAgIGlmICghaXNOYU4oYXNOdW1iZXIpICYmIGFzTnVtYmVyID09PSBwYXJzZUludChpbnRlZ2VyQ2FuZGlkYXRlLCAxMCkpIHtcbiAgICAgIHJldHVybiBhc051bWJlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGludGVnZXJDYW5kaWRhdGU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNvZXJjZU9wdGlvbnMob3B0cykge1xuICBvcHRzLmdyb3VwX2xldmVsID0gY29lcmNlSW50ZWdlcihvcHRzLmdyb3VwX2xldmVsKTtcbiAgb3B0cy5saW1pdCA9IGNvZXJjZUludGVnZXIob3B0cy5saW1pdCk7XG4gIG9wdHMuc2tpcCA9IGNvZXJjZUludGVnZXIob3B0cy5za2lwKTtcbiAgcmV0dXJuIG9wdHM7XG59XG5cbmZ1bmN0aW9uIGNoZWNrUG9zaXRpdmVJbnRlZ2VyKG51bWJlcikge1xuICBpZiAobnVtYmVyKSB7XG4gICAgaWYgKHR5cGVvZiBudW1iZXIgIT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gIG5ldyBRdWVyeVBhcnNlRXJyb3IoJ0ludmFsaWQgdmFsdWUgZm9yIGludGVnZXI6IFwiJyArXG4gICAgICBudW1iZXIgKyAnXCInKTtcbiAgICB9XG4gICAgaWYgKG51bWJlciA8IDApIHtcbiAgICAgIHJldHVybiBuZXcgUXVlcnlQYXJzZUVycm9yKCdJbnZhbGlkIHZhbHVlIGZvciBwb3NpdGl2ZSBpbnRlZ2VyOiAnICtcbiAgICAgICAgJ1wiJyArIG51bWJlciArICdcIicpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja1F1ZXJ5UGFyc2VFcnJvcihvcHRpb25zLCBmdW4pIHtcbiAgdmFyIHN0YXJ0a2V5TmFtZSA9IG9wdGlvbnMuZGVzY2VuZGluZyA/ICdlbmRrZXknIDogJ3N0YXJ0a2V5JztcbiAgdmFyIGVuZGtleU5hbWUgPSBvcHRpb25zLmRlc2NlbmRpbmcgPyAnc3RhcnRrZXknIDogJ2VuZGtleSc7XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zW3N0YXJ0a2V5TmFtZV0gIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIG9wdGlvbnNbZW5ka2V5TmFtZV0gIT09ICd1bmRlZmluZWQnICYmXG4gICAgY29sbGF0ZShvcHRpb25zW3N0YXJ0a2V5TmFtZV0sIG9wdGlvbnNbZW5ka2V5TmFtZV0pID4gMCkge1xuICAgIHRocm93IG5ldyBRdWVyeVBhcnNlRXJyb3IoJ05vIHJvd3MgY2FuIG1hdGNoIHlvdXIga2V5IHJhbmdlLCAnICtcbiAgICAncmV2ZXJzZSB5b3VyIHN0YXJ0X2tleSBhbmQgZW5kX2tleSBvciBzZXQge2Rlc2NlbmRpbmcgOiB0cnVlfScpO1xuICB9IGVsc2UgaWYgKGZ1bi5yZWR1Y2UgJiYgb3B0aW9ucy5yZWR1Y2UgIT09IGZhbHNlKSB7XG4gICAgaWYgKG9wdGlvbnMuaW5jbHVkZV9kb2NzKSB7XG4gICAgICB0aHJvdyBuZXcgUXVlcnlQYXJzZUVycm9yKCd7aW5jbHVkZV9kb2NzOnRydWV9IGlzIGludmFsaWQgZm9yIHJlZHVjZScpO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5rZXlzICYmIG9wdGlvbnMua2V5cy5sZW5ndGggPiAxICYmXG4gICAgICAgICFvcHRpb25zLmdyb3VwICYmICFvcHRpb25zLmdyb3VwX2xldmVsKSB7XG4gICAgICB0aHJvdyBuZXcgUXVlcnlQYXJzZUVycm9yKCdNdWx0aS1rZXkgZmV0Y2hlcyBmb3IgcmVkdWNlIHZpZXdzIG11c3QgdXNlICcgK1xuICAgICAgJ3tncm91cDogdHJ1ZX0nKTtcbiAgICB9XG4gIH1cbiAgWydncm91cF9sZXZlbCcsICdsaW1pdCcsICdza2lwJ10uZm9yRWFjaChmdW5jdGlvbiAob3B0aW9uTmFtZSkge1xuICAgIHZhciBlcnJvciA9IGNoZWNrUG9zaXRpdmVJbnRlZ2VyKG9wdGlvbnNbb3B0aW9uTmFtZV0pO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gaHR0cFF1ZXJ5KGRiLCBmdW4sIG9wdHMpIHtcbiAgLy8gTGlzdCBvZiBwYXJhbWV0ZXJzIHRvIGFkZCB0byB0aGUgUFVUIHJlcXVlc3RcbiAgdmFyIHBhcmFtcyA9IFtdO1xuICB2YXIgYm9keTtcbiAgdmFyIG1ldGhvZCA9ICdHRVQnO1xuXG4gIC8vIElmIG9wdHMucmVkdWNlIGV4aXN0cyBhbmQgaXMgZGVmaW5lZCwgdGhlbiBhZGQgaXQgdG8gdGhlIGxpc3RcbiAgLy8gb2YgcGFyYW1ldGVycy5cbiAgLy8gSWYgcmVkdWNlPWZhbHNlIHRoZW4gdGhlIHJlc3VsdHMgYXJlIHRoYXQgb2Ygb25seSB0aGUgbWFwIGZ1bmN0aW9uXG4gIC8vIG5vdCB0aGUgZmluYWwgcmVzdWx0IG9mIG1hcCBhbmQgcmVkdWNlLlxuICBhZGRIdHRwUGFyYW0oJ3JlZHVjZScsIG9wdHMsIHBhcmFtcyk7XG4gIGFkZEh0dHBQYXJhbSgnaW5jbHVkZV9kb2NzJywgb3B0cywgcGFyYW1zKTtcbiAgYWRkSHR0cFBhcmFtKCdhdHRhY2htZW50cycsIG9wdHMsIHBhcmFtcyk7XG4gIGFkZEh0dHBQYXJhbSgnbGltaXQnLCBvcHRzLCBwYXJhbXMpO1xuICBhZGRIdHRwUGFyYW0oJ2Rlc2NlbmRpbmcnLCBvcHRzLCBwYXJhbXMpO1xuICBhZGRIdHRwUGFyYW0oJ2dyb3VwJywgb3B0cywgcGFyYW1zKTtcbiAgYWRkSHR0cFBhcmFtKCdncm91cF9sZXZlbCcsIG9wdHMsIHBhcmFtcyk7XG4gIGFkZEh0dHBQYXJhbSgnc2tpcCcsIG9wdHMsIHBhcmFtcyk7XG4gIGFkZEh0dHBQYXJhbSgnc3RhbGUnLCBvcHRzLCBwYXJhbXMpO1xuICBhZGRIdHRwUGFyYW0oJ2NvbmZsaWN0cycsIG9wdHMsIHBhcmFtcyk7XG4gIGFkZEh0dHBQYXJhbSgnc3RhcnRrZXknLCBvcHRzLCBwYXJhbXMsIHRydWUpO1xuICBhZGRIdHRwUGFyYW0oJ3N0YXJ0X2tleScsIG9wdHMsIHBhcmFtcywgdHJ1ZSk7XG4gIGFkZEh0dHBQYXJhbSgnZW5ka2V5Jywgb3B0cywgcGFyYW1zLCB0cnVlKTtcbiAgYWRkSHR0cFBhcmFtKCdlbmRfa2V5Jywgb3B0cywgcGFyYW1zLCB0cnVlKTtcbiAgYWRkSHR0cFBhcmFtKCdpbmNsdXNpdmVfZW5kJywgb3B0cywgcGFyYW1zKTtcbiAgYWRkSHR0cFBhcmFtKCdrZXknLCBvcHRzLCBwYXJhbXMsIHRydWUpO1xuXG4gIC8vIEZvcm1hdCB0aGUgbGlzdCBvZiBwYXJhbWV0ZXJzIGludG8gYSB2YWxpZCBVUkkgcXVlcnkgc3RyaW5nXG4gIHBhcmFtcyA9IHBhcmFtcy5qb2luKCcmJyk7XG4gIHBhcmFtcyA9IHBhcmFtcyA9PT0gJycgPyAnJyA6ICc/JyArIHBhcmFtcztcblxuICAvLyBJZiBrZXlzIGFyZSBzdXBwbGllZCwgaXNzdWUgYSBQT1NUIHRvIGNpcmN1bXZlbnQgR0VUIHF1ZXJ5IHN0cmluZyBsaW1pdHNcbiAgLy8gc2VlIGh0dHA6Ly93aWtpLmFwYWNoZS5vcmcvY291Y2hkYi9IVFRQX3ZpZXdfQVBJI1F1ZXJ5aW5nX09wdGlvbnNcbiAgaWYgKHR5cGVvZiBvcHRzLmtleXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIE1BWF9VUkxfTEVOR1RIID0gMjAwMDtcbiAgICAvLyBhY2NvcmRpbmcgdG8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDE3MTg0LzY4MDc0MixcbiAgICAvLyB0aGUgZGUgZmFjdG8gVVJMIGxlbmd0aCBsaW1pdCBpcyAyMDAwIGNoYXJhY3RlcnNcblxuICAgIHZhciBrZXlzQXNTdHJpbmcgPVxuICAgICAgJ2tleXM9JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShvcHRzLmtleXMpKTtcbiAgICBpZiAoa2V5c0FzU3RyaW5nLmxlbmd0aCArIHBhcmFtcy5sZW5ndGggKyAxIDw9IE1BWF9VUkxfTEVOR1RIKSB7XG4gICAgICAvLyBJZiB0aGUga2V5cyBhcmUgc2hvcnQgZW5vdWdoLCBkbyBhIEdFVC4gd2UgZG8gdGhpcyB0byB3b3JrIGFyb3VuZFxuICAgICAgLy8gU2FmYXJpIG5vdCB1bmRlcnN0YW5kaW5nIDMwNHMgb24gUE9TVHMgKHNlZSBwb3VjaGRiL3BvdWNoZGIjMTIzOSlcbiAgICAgIHBhcmFtcyArPSAocGFyYW1zWzBdID09PSAnPycgPyAnJicgOiAnPycpICsga2V5c0FzU3RyaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICBtZXRob2QgPSAnUE9TVCc7XG4gICAgICBpZiAodHlwZW9mIGZ1biA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgYm9keSA9IHtrZXlzOiBvcHRzLmtleXN9O1xuICAgICAgfSBlbHNlIHsgLy8gZnVuIGlzIHttYXAgOiBtYXBmdW59LCBzbyBhcHBlbmQgdG8gdGhpc1xuICAgICAgICBmdW4ua2V5cyA9IG9wdHMua2V5cztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBXZSBhcmUgcmVmZXJlbmNpbmcgYSBxdWVyeSBkZWZpbmVkIGluIHRoZSBkZXNpZ24gZG9jXG4gIGlmICh0eXBlb2YgZnVuID09PSAnc3RyaW5nJykge1xuICAgIHZhciBwYXJ0cyA9IHBhcnNlVmlld05hbWUoZnVuKTtcbiAgICByZXR1cm4gZGIucmVxdWVzdCh7XG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIHVybDogJ19kZXNpZ24vJyArIHBhcnRzWzBdICsgJy9fdmlldy8nICsgcGFydHNbMV0gKyBwYXJhbXMsXG4gICAgICBib2R5OiBib2R5XG4gICAgfSkudGhlbihwb3N0cHJvY2Vzc0F0dGFjaG1lbnRzKG9wdHMpKTtcbiAgfVxuXG4gIC8vIFdlIGFyZSB1c2luZyBhIHRlbXBvcmFyeSB2aWV3LCB0ZXJyaWJsZSBmb3IgcGVyZm9ybWFuY2UsIGdvb2QgZm9yIHRlc3RpbmdcbiAgYm9keSA9IGJvZHkgfHwge307XG4gIE9iamVjdC5rZXlzKGZ1bikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZnVuW2tleV0pKSB7XG4gICAgICBib2R5W2tleV0gPSBmdW5ba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgYm9keVtrZXldID0gZnVuW2tleV0udG9TdHJpbmcoKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gZGIucmVxdWVzdCh7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgdXJsOiAnX3RlbXBfdmlldycgKyBwYXJhbXMsXG4gICAgYm9keTogYm9keVxuICB9KS50aGVuKHBvc3Rwcm9jZXNzQXR0YWNobWVudHMob3B0cykpO1xufVxuXG4vLyBjdXN0b20gYWRhcHRlcnMgY2FuIGRlZmluZSB0aGVpciBvd24gYXBpLl9xdWVyeVxuLy8gYW5kIG92ZXJyaWRlIHRoZSBkZWZhdWx0IGJlaGF2aW9yXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gY3VzdG9tUXVlcnkoZGIsIGZ1biwgb3B0cykge1xuICByZXR1cm4gbmV3IFBvdWNoUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZGIuX3F1ZXJ5KGZ1biwgb3B0cywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUocmVzKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8vIGN1c3RvbSBhZGFwdGVycyBjYW4gZGVmaW5lIHRoZWlyIG93biBhcGkuX3ZpZXdDbGVhbnVwXG4vLyBhbmQgb3ZlcnJpZGUgdGhlIGRlZmF1bHQgYmVoYXZpb3Jcbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBjdXN0b21WaWV3Q2xlYW51cChkYikge1xuICByZXR1cm4gbmV3IFBvdWNoUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZGIuX3ZpZXdDbGVhbnVwKGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKHJlcyk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0c1RvKHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICBpZiAocmVhc29uLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHJlYXNvbjtcbiAgICB9XG4gIH07XG59XG5cbi8vIHJldHVybnMgYSBwcm9taXNlIGZvciBhIGxpc3Qgb2YgZG9jcyB0byB1cGRhdGUsIGJhc2VkIG9uIHRoZSBpbnB1dCBkb2NJZC5cbi8vIHRoZSBvcmRlciBkb2Vzbid0IG1hdHRlciwgYmVjYXVzZSBwb3N0LTMuMi4wLCBidWxrRG9jc1xuLy8gaXMgYW4gYXRvbWljIG9wZXJhdGlvbiBpbiBhbGwgdGhyZWUgYWRhcHRlcnMuXG5mdW5jdGlvbiBnZXREb2NzVG9QZXJzaXN0KGRvY0lkLCB2aWV3LCBkb2NJZHNUb0NoYW5nZXNBbmRFbWl0cykge1xuICB2YXIgbWV0YURvY0lkID0gJ19sb2NhbC9kb2NfJyArIGRvY0lkO1xuICB2YXIgZGVmYXVsdE1ldGFEb2MgPSB7X2lkOiBtZXRhRG9jSWQsIGtleXM6IFtdfTtcbiAgdmFyIGRvY0RhdGEgPSBkb2NJZHNUb0NoYW5nZXNBbmRFbWl0c1tkb2NJZF07XG4gIHZhciBpbmRleGFibGVLZXlzVG9LZXlWYWx1ZXMgPSBkb2NEYXRhLmluZGV4YWJsZUtleXNUb0tleVZhbHVlcztcbiAgdmFyIGNoYW5nZXMgPSBkb2NEYXRhLmNoYW5nZXM7XG5cbiAgZnVuY3Rpb24gZ2V0TWV0YURvYygpIHtcbiAgICBpZiAoaXNHZW5PbmUoY2hhbmdlcykpIHtcbiAgICAgIC8vIGdlbmVyYXRpb24gMSwgc28gd2UgY2FuIHNhZmVseSBhc3N1bWUgaW5pdGlhbCBzdGF0ZVxuICAgICAgLy8gZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKGF2b2lkcyB1bm5lY2Vzc2FyeSBHRVRzKVxuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5yZXNvbHZlKGRlZmF1bHRNZXRhRG9jKTtcbiAgICB9XG4gICAgcmV0dXJuIHZpZXcuZGIuZ2V0KG1ldGFEb2NJZCkuY2F0Y2goZGVmYXVsdHNUbyhkZWZhdWx0TWV0YURvYykpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0S2V5VmFsdWVEb2NzKG1ldGFEb2MpIHtcbiAgICBpZiAoIW1ldGFEb2Mua2V5cy5sZW5ndGgpIHtcbiAgICAgIC8vIG5vIGtleXMsIG5vIG5lZWQgZm9yIGEgbG9va3VwXG4gICAgICByZXR1cm4gUG91Y2hQcm9taXNlLnJlc29sdmUoe3Jvd3M6IFtdfSk7XG4gICAgfVxuICAgIHJldHVybiB2aWV3LmRiLmFsbERvY3Moe1xuICAgICAga2V5czogbWV0YURvYy5rZXlzLFxuICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9jZXNzS3ZEb2NzKG1ldGFEb2MsIGt2RG9jc1Jlcykge1xuICAgIHZhciBrdkRvY3MgPSBbXTtcbiAgICB2YXIgb2xkS2V5c01hcCA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGt2RG9jc1Jlcy5yb3dzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgcm93ID0ga3ZEb2NzUmVzLnJvd3NbaV07XG4gICAgICB2YXIgZG9jID0gcm93LmRvYztcbiAgICAgIGlmICghZG9jKSB7IC8vIGRlbGV0ZWRcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBrdkRvY3MucHVzaChkb2MpO1xuICAgICAgb2xkS2V5c01hcFtkb2MuX2lkXSA9IHRydWU7XG4gICAgICBkb2MuX2RlbGV0ZWQgPSAhaW5kZXhhYmxlS2V5c1RvS2V5VmFsdWVzW2RvYy5faWRdO1xuICAgICAgaWYgKCFkb2MuX2RlbGV0ZWQpIHtcbiAgICAgICAgdmFyIGtleVZhbHVlID0gaW5kZXhhYmxlS2V5c1RvS2V5VmFsdWVzW2RvYy5faWRdO1xuICAgICAgICBpZiAoJ3ZhbHVlJyBpbiBrZXlWYWx1ZSkge1xuICAgICAgICAgIGRvYy52YWx1ZSA9IGtleVZhbHVlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG5ld0tleXMgPSBPYmplY3Qua2V5cyhpbmRleGFibGVLZXlzVG9LZXlWYWx1ZXMpO1xuICAgIG5ld0tleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBpZiAoIW9sZEtleXNNYXBba2V5XSkge1xuICAgICAgICAvLyBuZXcgZG9jXG4gICAgICAgIHZhciBrdkRvYyA9IHtcbiAgICAgICAgICBfaWQ6IGtleVxuICAgICAgICB9O1xuICAgICAgICB2YXIga2V5VmFsdWUgPSBpbmRleGFibGVLZXlzVG9LZXlWYWx1ZXNba2V5XTtcbiAgICAgICAgaWYgKCd2YWx1ZScgaW4ga2V5VmFsdWUpIHtcbiAgICAgICAgICBrdkRvYy52YWx1ZSA9IGtleVZhbHVlLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGt2RG9jcy5wdXNoKGt2RG9jKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBtZXRhRG9jLmtleXMgPSB1bmlxKG5ld0tleXMuY29uY2F0KG1ldGFEb2Mua2V5cykpO1xuICAgIGt2RG9jcy5wdXNoKG1ldGFEb2MpO1xuXG4gICAgcmV0dXJuIGt2RG9jcztcbiAgfVxuXG4gIHJldHVybiBnZXRNZXRhRG9jKCkudGhlbihmdW5jdGlvbiAobWV0YURvYykge1xuICAgIHJldHVybiBnZXRLZXlWYWx1ZURvY3MobWV0YURvYykudGhlbihmdW5jdGlvbiAoa3ZEb2NzUmVzKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzc0t2RG9jcyhtZXRhRG9jLCBrdkRvY3NSZXMpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuLy8gdXBkYXRlcyBhbGwgZW1pdHRlZCBrZXkvdmFsdWUgZG9jcyBhbmQgbWV0YURvY3MgaW4gdGhlIG1ydmlldyBkYXRhYmFzZVxuLy8gZm9yIHRoZSBnaXZlbiBiYXRjaCBvZiBkb2N1bWVudHMgZnJvbSB0aGUgc291cmNlIGRhdGFiYXNlXG5mdW5jdGlvbiBzYXZlS2V5VmFsdWVzKHZpZXcsIGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzLCBzZXEpIHtcbiAgdmFyIHNlcURvY0lkID0gJ19sb2NhbC9sYXN0U2VxJztcbiAgcmV0dXJuIHZpZXcuZGIuZ2V0KHNlcURvY0lkKVxuICAuY2F0Y2goZGVmYXVsdHNUbyh7X2lkOiBzZXFEb2NJZCwgc2VxOiAwfSkpXG4gIC50aGVuKGZ1bmN0aW9uIChsYXN0U2VxRG9jKSB7XG4gICAgdmFyIGRvY0lkcyA9IE9iamVjdC5rZXlzKGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzKTtcbiAgICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChkb2NJZHMubWFwKGZ1bmN0aW9uIChkb2NJZCkge1xuICAgICAgcmV0dXJuIGdldERvY3NUb1BlcnNpc3QoZG9jSWQsIHZpZXcsIGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzKTtcbiAgICB9KSkudGhlbihmdW5jdGlvbiAobGlzdE9mRG9jc1RvUGVyc2lzdCkge1xuICAgICAgdmFyIGRvY3NUb1BlcnNpc3QgPSBmbGF0dGVuKGxpc3RPZkRvY3NUb1BlcnNpc3QpO1xuICAgICAgbGFzdFNlcURvYy5zZXEgPSBzZXE7XG4gICAgICBkb2NzVG9QZXJzaXN0LnB1c2gobGFzdFNlcURvYyk7XG4gICAgICAvLyB3cml0ZSBhbGwgZG9jcyBpbiBhIHNpbmdsZSBvcGVyYXRpb24sIHVwZGF0ZSB0aGUgc2VxIG9uY2VcbiAgICAgIHJldHVybiB2aWV3LmRiLmJ1bGtEb2NzKHtkb2NzIDogZG9jc1RvUGVyc2lzdH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UXVldWUodmlldykge1xuICB2YXIgdmlld05hbWUgPSB0eXBlb2YgdmlldyA9PT0gJ3N0cmluZycgPyB2aWV3IDogdmlldy5uYW1lO1xuICB2YXIgcXVldWUgPSBwZXJzaXN0ZW50UXVldWVzW3ZpZXdOYW1lXTtcbiAgaWYgKCFxdWV1ZSkge1xuICAgIHF1ZXVlID0gcGVyc2lzdGVudFF1ZXVlc1t2aWV3TmFtZV0gPSBuZXcgVGFza1F1ZXVlJDEoKTtcbiAgfVxuICByZXR1cm4gcXVldWU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVZpZXcodmlldykge1xuICByZXR1cm4gc2VxdWVudGlhbGl6ZShnZXRRdWV1ZSh2aWV3KSwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB1cGRhdGVWaWV3SW5RdWV1ZSh2aWV3KTtcbiAgfSkoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVmlld0luUXVldWUodmlldykge1xuICAvLyBiaW5kIHRoZSBlbWl0IGZ1bmN0aW9uIG9uY2VcbiAgdmFyIG1hcFJlc3VsdHM7XG4gIHZhciBkb2M7XG5cbiAgZnVuY3Rpb24gZW1pdChrZXksIHZhbHVlKSB7XG4gICAgdmFyIG91dHB1dCA9IHtpZDogZG9jLl9pZCwga2V5OiBub3JtYWxpemVLZXkoa2V5KX07XG4gICAgLy8gRG9uJ3QgZXhwbGljaXRseSBzdG9yZSB0aGUgdmFsdWUgdW5sZXNzIGl0J3MgZGVmaW5lZCBhbmQgbm9uLW51bGwuXG4gICAgLy8gVGhpcyBzYXZlcyBvbiBzdG9yYWdlIHNwYWNlLCBiZWNhdXNlIG9mdGVuIHBlb3BsZSBkb24ndCB1c2UgaXQuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgIG91dHB1dC52YWx1ZSA9IG5vcm1hbGl6ZUtleSh2YWx1ZSk7XG4gICAgfVxuICAgIG1hcFJlc3VsdHMucHVzaChvdXRwdXQpO1xuICB9XG5cbiAgdmFyIG1hcEZ1bjtcbiAgLy8gZm9yIHRlbXBfdmlld3Mgb25lIGNhbiB1c2UgZW1pdChkb2MsIGVtaXQpLCBzZWUgIzM4XG4gIGlmICh0eXBlb2Ygdmlldy5tYXBGdW4gPT09IFwiZnVuY3Rpb25cIiAmJiB2aWV3Lm1hcEZ1bi5sZW5ndGggPT09IDIpIHtcbiAgICB2YXIgb3JpZ01hcCA9IHZpZXcubWFwRnVuO1xuICAgIG1hcEZ1biA9IGZ1bmN0aW9uIChkb2MpIHtcbiAgICAgIHJldHVybiBvcmlnTWFwKGRvYywgZW1pdCk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBtYXBGdW4gPSBldmFsRnVuY3Rpb25XaXRoRXZhbCh2aWV3Lm1hcEZ1bi50b1N0cmluZygpLCBlbWl0KTtcbiAgfVxuXG4gIHZhciBjdXJyZW50U2VxID0gdmlldy5zZXEgfHwgMDtcblxuICBmdW5jdGlvbiBwcm9jZXNzQ2hhbmdlKGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzLCBzZXEpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHNhdmVLZXlWYWx1ZXModmlldywgZG9jSWRzVG9DaGFuZ2VzQW5kRW1pdHMsIHNlcSk7XG4gICAgfTtcbiAgfVxuXG4gIHZhciBxdWV1ZSA9IG5ldyBUYXNrUXVldWUkMSgpO1xuICAvLyBUT0RPKG5lb2pza2kpOiBodHRwczovL2dpdGh1Yi5jb20vZGFsZWhhcnZleS9wb3VjaGRiL2lzc3Vlcy8xNTIxXG5cbiAgcmV0dXJuIG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG4gICAgZnVuY3Rpb24gY29tcGxldGUoKSB7XG4gICAgICBxdWV1ZS5maW5pc2goKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmlldy5zZXEgPSBjdXJyZW50U2VxO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzTmV4dEJhdGNoKCkge1xuICAgICAgdmlldy5zb3VyY2VEQi5jaGFuZ2VzKHtcbiAgICAgICAgY29uZmxpY3RzOiB0cnVlLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWUsXG4gICAgICAgIHN0eWxlOiAnYWxsX2RvY3MnLFxuICAgICAgICBzaW5jZTogY3VycmVudFNlcSxcbiAgICAgICAgbGltaXQ6IENIQU5HRVNfQkFUQ0hfU0laRSQxXG4gICAgICB9KS5vbignY29tcGxldGUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSByZXNwb25zZS5yZXN1bHRzO1xuICAgICAgICBpZiAoIXJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVzdWx0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB2YXIgY2hhbmdlID0gcmVzdWx0c1tpXTtcbiAgICAgICAgICBpZiAoY2hhbmdlLmRvYy5faWRbMF0gIT09ICdfJykge1xuICAgICAgICAgICAgbWFwUmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgZG9jID0gY2hhbmdlLmRvYztcblxuICAgICAgICAgICAgaWYgKCFkb2MuX2RlbGV0ZWQpIHtcbiAgICAgICAgICAgICAgdHJ5Q29kZSQxKHZpZXcuc291cmNlREIsIG1hcEZ1biwgW2RvY10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwUmVzdWx0cy5zb3J0KHNvcnRCeUtleVRoZW5WYWx1ZSk7XG5cbiAgICAgICAgICAgIHZhciBpbmRleGFibGVLZXlzVG9LZXlWYWx1ZXMgPSB7fTtcbiAgICAgICAgICAgIHZhciBsYXN0S2V5O1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsID0gbWFwUmVzdWx0cy5sZW5ndGg7IGogPCBqbDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBvYmogPSBtYXBSZXN1bHRzW2pdO1xuICAgICAgICAgICAgICB2YXIgY29tcGxleEtleSA9IFtvYmoua2V5LCBvYmouaWRdO1xuICAgICAgICAgICAgICBpZiAoY29sbGF0ZShvYmoua2V5LCBsYXN0S2V5KSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbXBsZXhLZXkucHVzaChqKTsgLy8gZHVwIGtleStpZCwgc28gbWFrZSBpdCB1bmlxdWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgaW5kZXhhYmxlS2V5ID0gdG9JbmRleGFibGVTdHJpbmcoY29tcGxleEtleSk7XG4gICAgICAgICAgICAgIGluZGV4YWJsZUtleXNUb0tleVZhbHVlc1tpbmRleGFibGVLZXldID0gb2JqO1xuICAgICAgICAgICAgICBsYXN0S2V5ID0gb2JqLmtleTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvY0lkc1RvQ2hhbmdlc0FuZEVtaXRzW2NoYW5nZS5kb2MuX2lkXSA9IHtcbiAgICAgICAgICAgICAgaW5kZXhhYmxlS2V5c1RvS2V5VmFsdWVzOiBpbmRleGFibGVLZXlzVG9LZXlWYWx1ZXMsXG4gICAgICAgICAgICAgIGNoYW5nZXM6IGNoYW5nZS5jaGFuZ2VzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyZW50U2VxID0gY2hhbmdlLnNlcTtcbiAgICAgICAgfVxuICAgICAgICBxdWV1ZS5hZGQocHJvY2Vzc0NoYW5nZShkb2NJZHNUb0NoYW5nZXNBbmRFbWl0cywgY3VycmVudFNlcSkpO1xuICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPCBDSEFOR0VTX0JBVENIX1NJWkUkMSkge1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9jZXNzTmV4dEJhdGNoKCk7XG4gICAgICB9KS5vbignZXJyb3InLCBvbkVycm9yKTtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICBmdW5jdGlvbiBvbkVycm9yKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwcm9jZXNzTmV4dEJhdGNoKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZWR1Y2VWaWV3KHZpZXcsIHJlc3VsdHMsIG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMuZ3JvdXBfbGV2ZWwgPT09IDApIHtcbiAgICBkZWxldGUgb3B0aW9ucy5ncm91cF9sZXZlbDtcbiAgfVxuXG4gIHZhciBzaG91bGRHcm91cCA9IG9wdGlvbnMuZ3JvdXAgfHwgb3B0aW9ucy5ncm91cF9sZXZlbDtcblxuICB2YXIgcmVkdWNlRnVuO1xuICBpZiAoYnVpbHRJblJlZHVjZVt2aWV3LnJlZHVjZUZ1bl0pIHtcbiAgICByZWR1Y2VGdW4gPSBidWlsdEluUmVkdWNlW3ZpZXcucmVkdWNlRnVuXTtcbiAgfSBlbHNlIHtcbiAgICByZWR1Y2VGdW4gPSBldmFsRnVuY3Rpb25XaXRoRXZhbCh2aWV3LnJlZHVjZUZ1bi50b1N0cmluZygpKTtcbiAgfVxuXG4gIHZhciBncm91cHMgPSBbXTtcbiAgdmFyIGx2bCA9IGlzTmFOKG9wdGlvbnMuZ3JvdXBfbGV2ZWwpID8gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZIDpcbiAgICBvcHRpb25zLmdyb3VwX2xldmVsO1xuICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgbGFzdCA9IGdyb3Vwc1tncm91cHMubGVuZ3RoIC0gMV07XG4gICAgdmFyIGdyb3VwS2V5ID0gc2hvdWxkR3JvdXAgPyBlLmtleSA6IG51bGw7XG5cbiAgICAvLyBvbmx5IHNldCBncm91cF9sZXZlbCBmb3IgYXJyYXkga2V5c1xuICAgIGlmIChzaG91bGRHcm91cCAmJiBBcnJheS5pc0FycmF5KGdyb3VwS2V5KSkge1xuICAgICAgZ3JvdXBLZXkgPSBncm91cEtleS5zbGljZSgwLCBsdmwpO1xuICAgIH1cblxuICAgIGlmIChsYXN0ICYmIGNvbGxhdGUobGFzdC5ncm91cEtleSwgZ3JvdXBLZXkpID09PSAwKSB7XG4gICAgICBsYXN0LmtleXMucHVzaChbZS5rZXksIGUuaWRdKTtcbiAgICAgIGxhc3QudmFsdWVzLnB1c2goZS52YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGdyb3Vwcy5wdXNoKHtcbiAgICAgIGtleXM6IFtbZS5rZXksIGUuaWRdXSxcbiAgICAgIHZhbHVlczogW2UudmFsdWVdLFxuICAgICAgZ3JvdXBLZXk6IGdyb3VwS2V5XG4gICAgfSk7XG4gIH0pO1xuICByZXN1bHRzID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBncm91cHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgZSA9IGdyb3Vwc1tpXTtcbiAgICB2YXIgcmVkdWNlVHJ5ID0gdHJ5Q29kZSQxKHZpZXcuc291cmNlREIsIHJlZHVjZUZ1bixcbiAgICAgIFtlLmtleXMsIGUudmFsdWVzLCBmYWxzZV0pO1xuICAgIGlmIChyZWR1Y2VUcnkuZXJyb3IgJiYgcmVkdWNlVHJ5LmVycm9yIGluc3RhbmNlb2YgQnVpbHRJbkVycm9yKSB7XG4gICAgICAvLyBDb3VjaERCIHJldHVybnMgYW4gZXJyb3IgaWYgYSBidWlsdC1pbiBlcnJvcnMgb3V0XG4gICAgICB0aHJvdyByZWR1Y2VUcnkuZXJyb3I7XG4gICAgfVxuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICAvLyBDb3VjaERCIGp1c3Qgc2V0cyB0aGUgdmFsdWUgdG8gbnVsbCBpZiBhIG5vbi1idWlsdC1pbiBlcnJvcnMgb3V0XG4gICAgICB2YWx1ZTogcmVkdWNlVHJ5LmVycm9yID8gbnVsbCA6IHJlZHVjZVRyeS5vdXRwdXQsXG4gICAgICBrZXk6IGUuZ3JvdXBLZXlcbiAgICB9KTtcbiAgfVxuICAvLyBubyB0b3RhbF9yb3dzL29mZnNldCB3aGVuIHJlZHVjaW5nXG4gIHJldHVybiB7cm93czogc2xpY2VSZXN1bHRzKHJlc3VsdHMsIG9wdGlvbnMubGltaXQsIG9wdGlvbnMuc2tpcCl9O1xufVxuXG5mdW5jdGlvbiBxdWVyeVZpZXcodmlldywgb3B0cykge1xuICByZXR1cm4gc2VxdWVudGlhbGl6ZShnZXRRdWV1ZSh2aWV3KSwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBxdWVyeVZpZXdJblF1ZXVlKHZpZXcsIG9wdHMpO1xuICB9KSgpO1xufVxuXG5mdW5jdGlvbiBxdWVyeVZpZXdJblF1ZXVlKHZpZXcsIG9wdHMpIHtcbiAgdmFyIHRvdGFsUm93cztcbiAgdmFyIHNob3VsZFJlZHVjZSA9IHZpZXcucmVkdWNlRnVuICYmIG9wdHMucmVkdWNlICE9PSBmYWxzZTtcbiAgdmFyIHNraXAgPSBvcHRzLnNraXAgfHwgMDtcbiAgaWYgKHR5cGVvZiBvcHRzLmtleXMgIT09ICd1bmRlZmluZWQnICYmICFvcHRzLmtleXMubGVuZ3RoKSB7XG4gICAgLy8gZXF1aXZhbGVudCBxdWVyeVxuICAgIG9wdHMubGltaXQgPSAwO1xuICAgIGRlbGV0ZSBvcHRzLmtleXM7XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaEZyb21WaWV3KHZpZXdPcHRzKSB7XG4gICAgdmlld09wdHMuaW5jbHVkZV9kb2NzID0gdHJ1ZTtcbiAgICByZXR1cm4gdmlldy5kYi5hbGxEb2NzKHZpZXdPcHRzKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHRvdGFsUm93cyA9IHJlcy50b3RhbF9yb3dzO1xuICAgICAgcmV0dXJuIHJlcy5yb3dzLm1hcChmdW5jdGlvbiAocmVzdWx0KSB7XG5cbiAgICAgICAgLy8gaW1wbGljaXQgbWlncmF0aW9uIC0gaW4gb2xkZXIgdmVyc2lvbnMgb2YgUG91Y2hEQixcbiAgICAgICAgLy8gd2UgZXhwbGljaXRseSBzdG9yZWQgdGhlIGRvYyBhcyB7aWQ6IC4uLiwga2V5OiAuLi4sIHZhbHVlOiAuLi59XG4gICAgICAgIC8vIHRoaXMgaXMgdGVzdGVkIGluIGEgbWlncmF0aW9uIHRlc3RcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgaWYgKCd2YWx1ZScgaW4gcmVzdWx0LmRvYyAmJiB0eXBlb2YgcmVzdWx0LmRvYy52YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIHJlc3VsdC5kb2MudmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJlc3VsdC5kb2MudmFsdWUpLnNvcnQoKTtcbiAgICAgICAgICAvLyB0aGlzIGRldGVjdGlvbiBtZXRob2QgaXMgbm90IHBlcmZlY3QsIGJ1dCBpdCdzIHVubGlrZWx5IHRoZSB1c2VyXG4gICAgICAgICAgLy8gZW1pdHRlZCBhIHZhbHVlIHdoaWNoIHdhcyBhbiBvYmplY3Qgd2l0aCB0aGVzZSAzIGV4YWN0IGtleXNcbiAgICAgICAgICB2YXIgZXhwZWN0ZWRLZXlzID0gWydpZCcsICdrZXknLCAndmFsdWUnXTtcbiAgICAgICAgICBpZiAoIShrZXlzIDwgZXhwZWN0ZWRLZXlzIHx8IGtleXMgPiBleHBlY3RlZEtleXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmRvYy52YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGFyc2VkS2V5QW5kRG9jSWQgPSBwYXJzZUluZGV4YWJsZVN0cmluZyhyZXN1bHQuZG9jLl9pZCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAga2V5OiBwYXJzZWRLZXlBbmREb2NJZFswXSxcbiAgICAgICAgICBpZDogcGFyc2VkS2V5QW5kRG9jSWRbMV0sXG4gICAgICAgICAgdmFsdWU6ICgndmFsdWUnIGluIHJlc3VsdC5kb2MgPyByZXN1bHQuZG9jLnZhbHVlIDogbnVsbClcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gb25NYXBSZXN1bHRzUmVhZHkocm93cykge1xuICAgIHZhciBmaW5hbFJlc3VsdHM7XG4gICAgaWYgKHNob3VsZFJlZHVjZSkge1xuICAgICAgZmluYWxSZXN1bHRzID0gcmVkdWNlVmlldyh2aWV3LCByb3dzLCBvcHRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmluYWxSZXN1bHRzID0ge1xuICAgICAgICB0b3RhbF9yb3dzOiB0b3RhbFJvd3MsXG4gICAgICAgIG9mZnNldDogc2tpcCxcbiAgICAgICAgcm93czogcm93c1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKG9wdHMuaW5jbHVkZV9kb2NzKSB7XG4gICAgICB2YXIgZG9jSWRzID0gdW5pcShyb3dzLm1hcChyb3dUb0RvY0lkKSk7XG5cbiAgICAgIHJldHVybiB2aWV3LnNvdXJjZURCLmFsbERvY3Moe1xuICAgICAgICBrZXlzOiBkb2NJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZSxcbiAgICAgICAgY29uZmxpY3RzOiBvcHRzLmNvbmZsaWN0cyxcbiAgICAgICAgYXR0YWNobWVudHM6IG9wdHMuYXR0YWNobWVudHMsXG4gICAgICAgIGJpbmFyeTogb3B0cy5iaW5hcnlcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGFsbERvY3NSZXMpIHtcbiAgICAgICAgdmFyIGRvY0lkc1RvRG9jcyA9IHt9O1xuICAgICAgICBhbGxEb2NzUmVzLnJvd3MuZm9yRWFjaChmdW5jdGlvbiAocm93KSB7XG4gICAgICAgICAgaWYgKHJvdy5kb2MpIHtcbiAgICAgICAgICAgIGRvY0lkc1RvRG9jc1snJCcgKyByb3cuaWRdID0gcm93LmRvYztcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByb3dzLmZvckVhY2goZnVuY3Rpb24gKHJvdykge1xuICAgICAgICAgIHZhciBkb2NJZCA9IHJvd1RvRG9jSWQocm93KTtcbiAgICAgICAgICB2YXIgZG9jID0gZG9jSWRzVG9Eb2NzWyckJyArIGRvY0lkXTtcbiAgICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgICByb3cuZG9jID0gZG9jO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmaW5hbFJlc3VsdHM7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZpbmFsUmVzdWx0cztcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZW9mIG9wdHMua2V5cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIga2V5cyA9IG9wdHMua2V5cztcbiAgICB2YXIgZmV0Y2hQcm9taXNlcyA9IGtleXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciB2aWV3T3B0cyA9IHtcbiAgICAgICAgc3RhcnRrZXkgOiB0b0luZGV4YWJsZVN0cmluZyhba2V5XSksXG4gICAgICAgIGVuZGtleSAgIDogdG9JbmRleGFibGVTdHJpbmcoW2tleSwge31dKVxuICAgICAgfTtcbiAgICAgIHJldHVybiBmZXRjaEZyb21WaWV3KHZpZXdPcHRzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChmZXRjaFByb21pc2VzKS50aGVuKGZsYXR0ZW4pLnRoZW4ob25NYXBSZXN1bHRzUmVhZHkpO1xuICB9IGVsc2UgeyAvLyBub3JtYWwgcXVlcnksIG5vICdrZXlzJ1xuICAgIHZhciB2aWV3T3B0cyA9IHtcbiAgICAgIGRlc2NlbmRpbmcgOiBvcHRzLmRlc2NlbmRpbmdcbiAgICB9O1xuICAgIGlmIChvcHRzLnN0YXJ0X2tleSkge1xuICAgICAgICBvcHRzLnN0YXJ0a2V5ID0gb3B0cy5zdGFydF9rZXk7XG4gICAgfVxuICAgIGlmIChvcHRzLmVuZF9rZXkpIHtcbiAgICAgICAgb3B0cy5lbmRrZXkgPSBvcHRzLmVuZF9rZXk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0cy5zdGFydGtleSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZpZXdPcHRzLnN0YXJ0a2V5ID0gb3B0cy5kZXNjZW5kaW5nID9cbiAgICAgICAgdG9JbmRleGFibGVTdHJpbmcoW29wdHMuc3RhcnRrZXksIHt9XSkgOlxuICAgICAgICB0b0luZGV4YWJsZVN0cmluZyhbb3B0cy5zdGFydGtleV0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdHMuZW5ka2V5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIGluY2x1c2l2ZUVuZCA9IG9wdHMuaW5jbHVzaXZlX2VuZCAhPT0gZmFsc2U7XG4gICAgICBpZiAob3B0cy5kZXNjZW5kaW5nKSB7XG4gICAgICAgIGluY2x1c2l2ZUVuZCA9ICFpbmNsdXNpdmVFbmQ7XG4gICAgICB9XG5cbiAgICAgIHZpZXdPcHRzLmVuZGtleSA9IHRvSW5kZXhhYmxlU3RyaW5nKFxuICAgICAgICBpbmNsdXNpdmVFbmQgPyBbb3B0cy5lbmRrZXksIHt9XSA6IFtvcHRzLmVuZGtleV0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdHMua2V5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIGtleVN0YXJ0ID0gdG9JbmRleGFibGVTdHJpbmcoW29wdHMua2V5XSk7XG4gICAgICB2YXIga2V5RW5kID0gdG9JbmRleGFibGVTdHJpbmcoW29wdHMua2V5LCB7fV0pO1xuICAgICAgaWYgKHZpZXdPcHRzLmRlc2NlbmRpbmcpIHtcbiAgICAgICAgdmlld09wdHMuZW5ka2V5ID0ga2V5U3RhcnQ7XG4gICAgICAgIHZpZXdPcHRzLnN0YXJ0a2V5ID0ga2V5RW5kO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlld09wdHMuc3RhcnRrZXkgPSBrZXlTdGFydDtcbiAgICAgICAgdmlld09wdHMuZW5ka2V5ID0ga2V5RW5kO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNob3VsZFJlZHVjZSkge1xuICAgICAgaWYgKHR5cGVvZiBvcHRzLmxpbWl0ID09PSAnbnVtYmVyJykge1xuICAgICAgICB2aWV3T3B0cy5saW1pdCA9IG9wdHMubGltaXQ7XG4gICAgICB9XG4gICAgICB2aWV3T3B0cy5za2lwID0gc2tpcDtcbiAgICB9XG4gICAgcmV0dXJuIGZldGNoRnJvbVZpZXcodmlld09wdHMpLnRoZW4ob25NYXBSZXN1bHRzUmVhZHkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGh0dHBWaWV3Q2xlYW51cChkYikge1xuICByZXR1cm4gZGIucmVxdWVzdCh7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgdXJsOiAnX3ZpZXdfY2xlYW51cCdcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvY2FsVmlld0NsZWFudXAoZGIpIHtcbiAgcmV0dXJuIGRiLmdldCgnX2xvY2FsL21ydmlld3MnKS50aGVuKGZ1bmN0aW9uIChtZXRhRG9jKSB7XG4gICAgdmFyIGRvY3NUb1ZpZXdzID0ge307XG4gICAgT2JqZWN0LmtleXMobWV0YURvYy52aWV3cykuZm9yRWFjaChmdW5jdGlvbiAoZnVsbFZpZXdOYW1lKSB7XG4gICAgICB2YXIgcGFydHMgPSBwYXJzZVZpZXdOYW1lKGZ1bGxWaWV3TmFtZSk7XG4gICAgICB2YXIgZGVzaWduRG9jTmFtZSA9ICdfZGVzaWduLycgKyBwYXJ0c1swXTtcbiAgICAgIHZhciB2aWV3TmFtZSA9IHBhcnRzWzFdO1xuICAgICAgZG9jc1RvVmlld3NbZGVzaWduRG9jTmFtZV0gPSBkb2NzVG9WaWV3c1tkZXNpZ25Eb2NOYW1lXSB8fCB7fTtcbiAgICAgIGRvY3NUb1ZpZXdzW2Rlc2lnbkRvY05hbWVdW3ZpZXdOYW1lXSA9IHRydWU7XG4gICAgfSk7XG4gICAgdmFyIG9wdHMgPSB7XG4gICAgICBrZXlzIDogT2JqZWN0LmtleXMoZG9jc1RvVmlld3MpLFxuICAgICAgaW5jbHVkZV9kb2NzIDogdHJ1ZVxuICAgIH07XG4gICAgcmV0dXJuIGRiLmFsbERvY3Mob3B0cykudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICB2YXIgdmlld3NUb1N0YXR1cyA9IHt9O1xuICAgICAgcmVzLnJvd3MuZm9yRWFjaChmdW5jdGlvbiAocm93KSB7XG4gICAgICAgIHZhciBkZG9jTmFtZSA9IHJvdy5rZXkuc3Vic3RyaW5nKDgpO1xuICAgICAgICBPYmplY3Qua2V5cyhkb2NzVG9WaWV3c1tyb3cua2V5XSkuZm9yRWFjaChmdW5jdGlvbiAodmlld05hbWUpIHtcbiAgICAgICAgICB2YXIgZnVsbFZpZXdOYW1lID0gZGRvY05hbWUgKyAnLycgKyB2aWV3TmFtZTtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgICBpZiAoIW1ldGFEb2Mudmlld3NbZnVsbFZpZXdOYW1lXSkge1xuICAgICAgICAgICAgLy8gbmV3IGZvcm1hdCwgd2l0aG91dCBzbGFzaGVzLCB0byBzdXBwb3J0IFBvdWNoREIgMi4yLjBcbiAgICAgICAgICAgIC8vIG1pZ3JhdGlvbiB0ZXN0IGluIHBvdWNoZGIncyBicm93c2VyLm1pZ3JhdGlvbi5qcyB2ZXJpZmllcyB0aGlzXG4gICAgICAgICAgICBmdWxsVmlld05hbWUgPSB2aWV3TmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHZpZXdEQk5hbWVzID0gT2JqZWN0LmtleXMobWV0YURvYy52aWV3c1tmdWxsVmlld05hbWVdKTtcbiAgICAgICAgICAvLyBkZXNpZ24gZG9jIGRlbGV0ZWQsIG9yIHZpZXcgZnVuY3Rpb24gbm9uZXhpc3RlbnRcbiAgICAgICAgICB2YXIgc3RhdHVzSXNHb29kID0gcm93LmRvYyAmJiByb3cuZG9jLnZpZXdzICYmXG4gICAgICAgICAgICByb3cuZG9jLnZpZXdzW3ZpZXdOYW1lXTtcbiAgICAgICAgICB2aWV3REJOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uICh2aWV3REJOYW1lKSB7XG4gICAgICAgICAgICB2aWV3c1RvU3RhdHVzW3ZpZXdEQk5hbWVdID1cbiAgICAgICAgICAgICAgdmlld3NUb1N0YXR1c1t2aWV3REJOYW1lXSB8fCBzdGF0dXNJc0dvb2Q7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB2YXIgZGJzVG9EZWxldGUgPSBPYmplY3Qua2V5cyh2aWV3c1RvU3RhdHVzKS5maWx0ZXIoXG4gICAgICAgIGZ1bmN0aW9uICh2aWV3REJOYW1lKSB7IHJldHVybiAhdmlld3NUb1N0YXR1c1t2aWV3REJOYW1lXTsgfSk7XG4gICAgICB2YXIgZGVzdHJveVByb21pc2VzID0gZGJzVG9EZWxldGUubWFwKGZ1bmN0aW9uICh2aWV3REJOYW1lKSB7XG4gICAgICAgIHJldHVybiBzZXF1ZW50aWFsaXplKGdldFF1ZXVlKHZpZXdEQk5hbWUpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBkYi5jb25zdHJ1Y3Rvcih2aWV3REJOYW1lLCBkYi5fX29wdHMpLmRlc3Ryb3koKTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtvazogdHJ1ZX07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgZGVmYXVsdHNUbyh7b2s6IHRydWV9KSk7XG59XG5cbnZhciB2aWV3Q2xlYW51cCA9IGNhbGxiYWNraWZ5KGZ1bmN0aW9uICgpIHtcbiAgdmFyIGRiID0gdGhpcztcbiAgaWYgKGRiLnR5cGUoKSA9PT0gJ2h0dHAnKSB7XG4gICAgcmV0dXJuIGh0dHBWaWV3Q2xlYW51cChkYik7XG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKHR5cGVvZiBkYi5fdmlld0NsZWFudXAgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gY3VzdG9tVmlld0NsZWFudXAoZGIpO1xuICB9XG4gIHJldHVybiBsb2NhbFZpZXdDbGVhbnVwKGRiKTtcbn0pO1xuXG5mdW5jdGlvbiBxdWVyeVByb21pc2VkKGRiLCBmdW4sIG9wdHMpIHtcbiAgaWYgKGRiLnR5cGUoKSA9PT0gJ2h0dHAnKSB7XG4gICAgcmV0dXJuIGh0dHBRdWVyeShkYiwgZnVuLCBvcHRzKTtcbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICh0eXBlb2YgZGIuX3F1ZXJ5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGN1c3RvbVF1ZXJ5KGRiLCBmdW4sIG9wdHMpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBmdW4gIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gdGVtcF92aWV3XG4gICAgY2hlY2tRdWVyeVBhcnNlRXJyb3Iob3B0cywgZnVuKTtcblxuICAgIHZhciBjcmVhdGVWaWV3T3B0cyA9IHtcbiAgICAgIGRiIDogZGIsXG4gICAgICB2aWV3TmFtZSA6ICd0ZW1wX3ZpZXcvdGVtcF92aWV3JyxcbiAgICAgIG1hcCA6IGZ1bi5tYXAsXG4gICAgICByZWR1Y2UgOiBmdW4ucmVkdWNlLFxuICAgICAgdGVtcG9yYXJ5IDogdHJ1ZVxuICAgIH07XG4gICAgdGVtcFZpZXdRdWV1ZS5hZGQoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVZpZXcoY3JlYXRlVmlld09wdHMpLnRoZW4oZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgICByZXR1cm4gdmlldy5kYi5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbih1cGRhdGVWaWV3KHZpZXcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeVZpZXcodmlldywgb3B0cyk7XG4gICAgICAgIH0pLCBjbGVhbnVwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0ZW1wVmlld1F1ZXVlLmZpbmlzaCgpO1xuICB9IGVsc2Uge1xuICAgIC8vIHBlcnNpc3RlbnQgdmlld1xuICAgIHZhciBmdWxsVmlld05hbWUgPSBmdW47XG4gICAgdmFyIHBhcnRzID0gcGFyc2VWaWV3TmFtZShmdWxsVmlld05hbWUpO1xuICAgIHZhciBkZXNpZ25Eb2NOYW1lID0gcGFydHNbMF07XG4gICAgdmFyIHZpZXdOYW1lID0gcGFydHNbMV07XG4gICAgcmV0dXJuIGRiLmdldCgnX2Rlc2lnbi8nICsgZGVzaWduRG9jTmFtZSkudGhlbihmdW5jdGlvbiAoZG9jKSB7XG4gICAgICB2YXIgZnVuID0gZG9jLnZpZXdzICYmIGRvYy52aWV3c1t2aWV3TmFtZV07XG5cbiAgICAgIGlmICghZnVuIHx8IHR5cGVvZiBmdW4ubWFwICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignZGRvYyAnICsgZGVzaWduRG9jTmFtZSArXG4gICAgICAgICcgaGFzIG5vIHZpZXcgbmFtZWQgJyArIHZpZXdOYW1lKTtcbiAgICAgIH1cbiAgICAgIGNoZWNrUXVlcnlQYXJzZUVycm9yKG9wdHMsIGZ1bik7XG5cbiAgICAgIHZhciBjcmVhdGVWaWV3T3B0cyA9IHtcbiAgICAgICAgZGIgOiBkYixcbiAgICAgICAgdmlld05hbWUgOiBmdWxsVmlld05hbWUsXG4gICAgICAgIG1hcCA6IGZ1bi5tYXAsXG4gICAgICAgIHJlZHVjZSA6IGZ1bi5yZWR1Y2VcbiAgICAgIH07XG4gICAgICByZXR1cm4gY3JlYXRlVmlldyhjcmVhdGVWaWV3T3B0cykudGhlbihmdW5jdGlvbiAodmlldykge1xuICAgICAgICBpZiAob3B0cy5zdGFsZSA9PT0gJ29rJyB8fCBvcHRzLnN0YWxlID09PSAndXBkYXRlX2FmdGVyJykge1xuICAgICAgICAgIGlmIChvcHRzLnN0YWxlID09PSAndXBkYXRlX2FmdGVyJykge1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHVwZGF0ZVZpZXcodmlldyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5Vmlldyh2aWV3LCBvcHRzKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gc3RhbGUgbm90IG9rXG4gICAgICAgICAgcmV0dXJuIHVwZGF0ZVZpZXcodmlldykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlWaWV3KHZpZXcsIG9wdHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG52YXIgcXVlcnkgPSBmdW5jdGlvbiAoZnVuLCBvcHRzLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIG9wdHMgPSBvcHRzID8gY29lcmNlT3B0aW9ucyhvcHRzKSA6IHt9O1xuXG4gIGlmICh0eXBlb2YgZnVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZnVuID0ge21hcCA6IGZ1bn07XG4gIH1cblxuICB2YXIgZGIgPSB0aGlzO1xuICB2YXIgcHJvbWlzZSA9IFBvdWNoUHJvbWlzZS5yZXNvbHZlKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHF1ZXJ5UHJvbWlzZWQoZGIsIGZ1biwgb3B0cyk7XG4gIH0pO1xuICBwcm9taXNlZENhbGxiYWNrKHByb21pc2UsIGNhbGxiYWNrKTtcbiAgcmV0dXJuIHByb21pc2U7XG59O1xuXG5cbnZhciBtYXByZWR1Y2UgPSB7XG4gIHF1ZXJ5OiBxdWVyeSxcbiAgdmlld0NsZWFudXA6IHZpZXdDbGVhbnVwXG59O1xuXG5mdW5jdGlvbiBpc0dlbk9uZSQxKHJldikge1xuICByZXR1cm4gL14xLS8udGVzdChyZXYpO1xufVxuXG5mdW5jdGlvbiBmaWxlSGFzQ2hhbmdlZChsb2NhbERvYywgcmVtb3RlRG9jLCBmaWxlbmFtZSkge1xuICByZXR1cm4gIWxvY2FsRG9jLl9hdHRhY2htZW50cyB8fFxuICAgICAgICAgIWxvY2FsRG9jLl9hdHRhY2htZW50c1tmaWxlbmFtZV0gfHxcbiAgICAgICAgIGxvY2FsRG9jLl9hdHRhY2htZW50c1tmaWxlbmFtZV0uZGlnZXN0ICE9PSByZW1vdGVEb2MuX2F0dGFjaG1lbnRzW2ZpbGVuYW1lXS5kaWdlc3Q7XG59XG5cbmZ1bmN0aW9uIGdldERvY0F0dGFjaG1lbnRzKGRiLCBkb2MpIHtcbiAgdmFyIGZpbGVuYW1lcyA9IE9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMpO1xuICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChmaWxlbmFtZXMubWFwKGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgIHJldHVybiBkYi5nZXRBdHRhY2htZW50KGRvYy5faWQsIGZpbGVuYW1lLCB7cmV2OiBkb2MuX3Jldn0pO1xuICB9KSk7XG59XG5cbmZ1bmN0aW9uIGdldERvY0F0dGFjaG1lbnRzRnJvbVRhcmdldE9yU291cmNlKHRhcmdldCwgc3JjLCBkb2MpIHtcbiAgdmFyIGRvQ2hlY2tGb3JMb2NhbEF0dGFjaG1lbnRzID0gc3JjLnR5cGUoKSA9PT0gJ2h0dHAnICYmIHRhcmdldC50eXBlKCkgIT09ICdodHRwJztcbiAgdmFyIGZpbGVuYW1lcyA9IE9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMpO1xuXG4gIGlmICghZG9DaGVja0ZvckxvY2FsQXR0YWNobWVudHMpIHtcbiAgICByZXR1cm4gZ2V0RG9jQXR0YWNobWVudHMoc3JjLCBkb2MpO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldC5nZXQoZG9jLl9pZCkudGhlbihmdW5jdGlvbiAobG9jYWxEb2MpIHtcbiAgICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChmaWxlbmFtZXMubWFwKGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgaWYgKGZpbGVIYXNDaGFuZ2VkKGxvY2FsRG9jLCBkb2MsIGZpbGVuYW1lKSkge1xuICAgICAgICByZXR1cm4gc3JjLmdldEF0dGFjaG1lbnQoZG9jLl9pZCwgZmlsZW5hbWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFyZ2V0LmdldEF0dGFjaG1lbnQobG9jYWxEb2MuX2lkLCBmaWxlbmFtZSk7XG4gICAgfSkpO1xuICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoZXJyb3Iuc3RhdHVzICE9PSA0MDQpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cblxuICAgIHJldHVybiBnZXREb2NBdHRhY2htZW50cyhzcmMsIGRvYyk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCdWxrR2V0T3B0cyhkaWZmcykge1xuICB2YXIgcmVxdWVzdHMgPSBbXTtcbiAgT2JqZWN0LmtleXMoZGlmZnMpLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgdmFyIG1pc3NpbmdSZXZzID0gZGlmZnNbaWRdLm1pc3Npbmc7XG4gICAgbWlzc2luZ1JldnMuZm9yRWFjaChmdW5jdGlvbiAobWlzc2luZ1Jldikge1xuICAgICAgcmVxdWVzdHMucHVzaCh7XG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgcmV2OiBtaXNzaW5nUmV2XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBkb2NzOiByZXF1ZXN0cyxcbiAgICByZXZzOiB0cnVlXG4gIH07XG59XG5cbi8vXG4vLyBGZXRjaCBhbGwgdGhlIGRvY3VtZW50cyBmcm9tIHRoZSBzcmMgYXMgZGVzY3JpYmVkIGluIHRoZSBcImRpZmZzXCIsXG4vLyB3aGljaCBpcyBhIG1hcHBpbmcgb2YgZG9jcyBJRHMgdG8gcmV2aXNpb25zLiBJZiB0aGUgc3RhdGUgZXZlclxuLy8gY2hhbmdlcyB0byBcImNhbmNlbGxlZFwiLCB0aGVuIHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVqZWN0ZWQuXG4vLyBFbHNlIGl0IHdpbGwgYmUgcmVzb2x2ZWQgd2l0aCBhIGxpc3Qgb2YgZmV0Y2hlZCBkb2N1bWVudHMuXG4vL1xuZnVuY3Rpb24gZ2V0RG9jcyhzcmMsIHRhcmdldCwgZGlmZnMsIHN0YXRlKSB7XG4gIGRpZmZzID0gY2xvbmUoZGlmZnMpOyAvLyB3ZSBkbyBub3QgbmVlZCB0byBtb2RpZnkgdGhpc1xuXG4gIHZhciByZXN1bHREb2NzID0gW10sXG4gICAgICBvayA9IHRydWU7XG5cbiAgZnVuY3Rpb24gZ2V0QWxsRG9jcygpIHtcblxuICAgIHZhciBidWxrR2V0T3B0cyA9IGNyZWF0ZUJ1bGtHZXRPcHRzKGRpZmZzKTtcblxuICAgIGlmICghYnVsa0dldE9wdHMuZG9jcy5sZW5ndGgpIHsgLy8gb3B0aW1pemF0aW9uOiBza2lwIGVtcHR5IHJlcXVlc3RzXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHNyYy5idWxrR2V0KGJ1bGtHZXRPcHRzKS50aGVuKGZ1bmN0aW9uIChidWxrR2V0UmVzcG9uc2UpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKHN0YXRlLmNhbmNlbGxlZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbmNlbGxlZCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFBvdWNoUHJvbWlzZS5hbGwoYnVsa0dldFJlc3BvbnNlLnJlc3VsdHMubWFwKGZ1bmN0aW9uIChidWxrR2V0SW5mbykge1xuICAgICAgICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChidWxrR2V0SW5mby5kb2NzLm1hcChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgdmFyIHJlbW90ZURvYyA9IGRvYy5vaztcblxuICAgICAgICAgIGlmIChkb2MuZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIHdoZW4gQVVUT19DT01QQUNUSU9OIGlzIHNldCwgZG9jcyBjYW4gYmUgcmV0dXJuZWQgd2hpY2ggbG9va1xuICAgICAgICAgICAgLy8gbGlrZSB0aGlzOiB7XCJtaXNzaW5nXCI6XCIxLTdjM2FjMjU2YjY5M2M0NjJhZjg0NDJmOTkyYjgzNjk2XCJ9XG4gICAgICAgICAgICBvayA9IGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghcmVtb3RlRG9jIHx8ICFyZW1vdGVEb2MuX2F0dGFjaG1lbnRzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3RlRG9jO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBnZXREb2NBdHRhY2htZW50c0Zyb21UYXJnZXRPclNvdXJjZSh0YXJnZXQsIHNyYywgcmVtb3RlRG9jKS50aGVuKGZ1bmN0aW9uIChhdHRhY2htZW50cykge1xuICAgICAgICAgICAgdmFyIGZpbGVuYW1lcyA9IE9iamVjdC5rZXlzKHJlbW90ZURvYy5fYXR0YWNobWVudHMpO1xuICAgICAgICAgICAgYXR0YWNobWVudHMuZm9yRWFjaChmdW5jdGlvbiAoYXR0YWNobWVudCwgaSkge1xuICAgICAgICAgICAgICB2YXIgYXR0ID0gcmVtb3RlRG9jLl9hdHRhY2htZW50c1tmaWxlbmFtZXNbaV1dO1xuICAgICAgICAgICAgICBkZWxldGUgYXR0LnN0dWI7XG4gICAgICAgICAgICAgIGRlbGV0ZSBhdHQubGVuZ3RoO1xuICAgICAgICAgICAgICBhdHQuZGF0YSA9IGF0dGFjaG1lbnQ7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlbW90ZURvYztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgfSkpXG5cbiAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHRzKSB7XG4gICAgICAgIHJlc3VsdERvY3MgPSByZXN1bHREb2NzLmNvbmNhdChmbGF0dGVuKHJlc3VsdHMpLmZpbHRlcihCb29sZWFuKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc0F0dGFjaG1lbnRzKGRvYykge1xuICAgIHJldHVybiBkb2MuX2F0dGFjaG1lbnRzICYmIE9iamVjdC5rZXlzKGRvYy5fYXR0YWNobWVudHMpLmxlbmd0aCA+IDA7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNDb25mbGljdHMoZG9jKSB7XG4gICAgcmV0dXJuIGRvYy5fY29uZmxpY3RzICYmIGRvYy5fY29uZmxpY3RzLmxlbmd0aCA+IDA7XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaFJldmlzaW9uT25lRG9jcyhpZHMpIHtcbiAgICAvLyBPcHRpbWl6YXRpb246IGZldGNoIGdlbi0xIGRvY3MgYW5kIGF0dGFjaG1lbnRzIGluXG4gICAgLy8gYSBzaW5nbGUgcmVxdWVzdCB1c2luZyBfYWxsX2RvY3NcbiAgICByZXR1cm4gc3JjLmFsbERvY3Moe1xuICAgICAga2V5czogaWRzLFxuICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlLFxuICAgICAgY29uZmxpY3RzOiB0cnVlXG4gICAgfSkudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICBpZiAoc3RhdGUuY2FuY2VsbGVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FuY2VsbGVkJyk7XG4gICAgICB9XG4gICAgICByZXMucm93cy5mb3JFYWNoKGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgaWYgKHJvdy5kZWxldGVkIHx8ICFyb3cuZG9jIHx8ICFpc0dlbk9uZSQxKHJvdy52YWx1ZS5yZXYpIHx8XG4gICAgICAgICAgICBoYXNBdHRhY2htZW50cyhyb3cuZG9jKSB8fCBoYXNDb25mbGljdHMocm93LmRvYykpIHtcbiAgICAgICAgICAvLyBpZiBhbnkgb2YgdGhlc2UgY29uZGl0aW9ucyBhcHBseSwgd2UgbmVlZCB0byBmZXRjaCB1c2luZyBnZXQoKVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0cmlwIF9jb25mbGljdHMgYXJyYXkgdG8gYXBwZWFzZSBDU0cgKCM1NzkzKVxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgICAgaWYgKHJvdy5kb2MuX2NvbmZsaWN0cykge1xuICAgICAgICAgIGRlbGV0ZSByb3cuZG9jLl9jb25mbGljdHM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGUgZG9jIHdlIGdvdCBiYWNrIGZyb20gYWxsRG9jcygpIGlzIHN1ZmZpY2llbnRcbiAgICAgICAgcmVzdWx0RG9jcy5wdXNoKHJvdy5kb2MpO1xuICAgICAgICBkZWxldGUgZGlmZnNbcm93LmlkXTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmV2aXNpb25PbmVEb2NzKCkge1xuICAgIC8vIGZpbHRlciBvdXQgdGhlIGdlbmVyYXRpb24gMSBkb2NzIGFuZCBnZXQgdGhlbVxuICAgIC8vIGxlYXZpbmcgdGhlIG5vbi1nZW5lcmF0aW9uIG9uZSBkb2NzIHRvIGJlIGdvdCBvdGhlcndpc2VcbiAgICB2YXIgaWRzID0gT2JqZWN0LmtleXMoZGlmZnMpLmZpbHRlcihmdW5jdGlvbiAoaWQpIHtcbiAgICAgIHZhciBtaXNzaW5nID0gZGlmZnNbaWRdLm1pc3Npbmc7XG4gICAgICByZXR1cm4gbWlzc2luZy5sZW5ndGggPT09IDEgJiYgaXNHZW5PbmUkMShtaXNzaW5nWzBdKTtcbiAgICB9KTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBmZXRjaFJldmlzaW9uT25lRG9jcyhpZHMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJldHVyblJlc3VsdCgpIHtcbiAgICByZXR1cm4geyBvazpvaywgZG9jczpyZXN1bHREb2NzIH07XG4gIH1cblxuICByZXR1cm4gUG91Y2hQcm9taXNlLnJlc29sdmUoKVxuICAgIC50aGVuKGdldFJldmlzaW9uT25lRG9jcylcbiAgICAudGhlbihnZXRBbGxEb2NzKVxuICAgIC50aGVuKHJldHVyblJlc3VsdCk7XG59XG5cbnZhciBDSEVDS1BPSU5UX1ZFUlNJT04gPSAxO1xudmFyIFJFUExJQ0FUT1IgPSBcInBvdWNoZGJcIjtcbi8vIFRoaXMgaXMgYW4gYXJiaXRyYXJ5IG51bWJlciB0byBsaW1pdCB0aGVcbi8vIGFtb3VudCBvZiByZXBsaWNhdGlvbiBoaXN0b3J5IHdlIHNhdmUgaW4gdGhlIGNoZWNrcG9pbnQuXG4vLyBJZiB3ZSBzYXZlIHRvbyBtdWNoLCB0aGUgY2hlY2twb2luZyBkb2NzIHdpbGwgYmVjb21lIHZlcnkgYmlnLFxuLy8gaWYgd2Ugc2F2ZSBmZXdlciwgd2UnbGwgcnVuIGEgZ3JlYXRlciByaXNrIG9mIGhhdmluZyB0b1xuLy8gcmVhZCBhbGwgdGhlIGNoYW5nZXMgZnJvbSAwIHdoZW4gY2hlY2twb2ludCBQVVRzIGZhaWxcbi8vIENvdWNoREIgMi4wIGhhcyBhIG1vcmUgaW52b2x2ZWQgaGlzdG9yeSBwcnVuaW5nLFxuLy8gYnV0IGxldCdzIGdvIGZvciB0aGUgc2ltcGxlIHZlcnNpb24gZm9yIG5vdy5cbnZhciBDSEVDS1BPSU5UX0hJU1RPUllfU0laRSA9IDU7XG52YXIgTE9XRVNUX1NFUSA9IDA7XG5cbmZ1bmN0aW9uIHVwZGF0ZUNoZWNrcG9pbnQoZGIsIGlkLCBjaGVja3BvaW50LCBzZXNzaW9uLCByZXR1cm5WYWx1ZSkge1xuICByZXR1cm4gZGIuZ2V0KGlkKS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKGVyci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgaWYgKGRiLnR5cGUoKSA9PT0gJ2h0dHAnKSB7XG4gICAgICAgIGV4cGxhaW5FcnJvcihcbiAgICAgICAgICA0MDQsICdQb3VjaERCIGlzIGp1c3QgY2hlY2tpbmcgaWYgYSByZW1vdGUgY2hlY2twb2ludCBleGlzdHMuJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2Vzc2lvbl9pZDogc2Vzc2lvbixcbiAgICAgICAgX2lkOiBpZCxcbiAgICAgICAgaGlzdG9yeTogW10sXG4gICAgICAgIHJlcGxpY2F0b3I6IFJFUExJQ0FUT1IsXG4gICAgICAgIHZlcnNpb246IENIRUNLUE9JTlRfVkVSU0lPTlxuICAgICAgfTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9KS50aGVuKGZ1bmN0aW9uIChkb2MpIHtcbiAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gaWYgdGhlIGNoZWNrcG9pbnQgaGFzIG5vdCBjaGFuZ2VkLCBkbyBub3QgdXBkYXRlXG4gICAgaWYgKGRvYy5sYXN0X3NlcSA9PT0gY2hlY2twb2ludCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZpbHRlciBvdXQgY3VycmVudCBlbnRyeSBmb3IgdGhpcyByZXBsaWNhdGlvblxuICAgIGRvYy5oaXN0b3J5ID0gKGRvYy5oaXN0b3J5IHx8IFtdKS5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnNlc3Npb25faWQgIT09IHNlc3Npb247XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdGhlIGxhdGVzdCBjaGVja3BvaW50IHRvIGhpc3RvcnlcbiAgICBkb2MuaGlzdG9yeS51bnNoaWZ0KHtcbiAgICAgIGxhc3Rfc2VxOiBjaGVja3BvaW50LFxuICAgICAgc2Vzc2lvbl9pZDogc2Vzc2lvblxuICAgIH0pO1xuXG4gICAgLy8gSnVzdCB0YWtlIHRoZSBsYXN0IHBpZWNlcyBpbiBoaXN0b3J5LCB0b1xuICAgIC8vIGF2b2lkIHJlYWxseSBiaWcgY2hlY2twb2ludCBkb2NzLlxuICAgIC8vIHNlZSBjb21tZW50IG9uIGhpc3Rvcnkgc2l6ZSBhYm92ZVxuICAgIGRvYy5oaXN0b3J5ID0gZG9jLmhpc3Rvcnkuc2xpY2UoMCwgQ0hFQ0tQT0lOVF9ISVNUT1JZX1NJWkUpO1xuXG4gICAgZG9jLnZlcnNpb24gPSBDSEVDS1BPSU5UX1ZFUlNJT047XG4gICAgZG9jLnJlcGxpY2F0b3IgPSBSRVBMSUNBVE9SO1xuXG4gICAgZG9jLnNlc3Npb25faWQgPSBzZXNzaW9uO1xuICAgIGRvYy5sYXN0X3NlcSA9IGNoZWNrcG9pbnQ7XG5cbiAgICByZXR1cm4gZGIucHV0KGRvYykuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVyci5zdGF0dXMgPT09IDQwOSkge1xuICAgICAgICAvLyByZXRyeTsgc29tZW9uZSBpcyB0cnlpbmcgdG8gd3JpdGUgYSBjaGVja3BvaW50IHNpbXVsdGFuZW91c2x5XG4gICAgICAgIHJldHVybiB1cGRhdGVDaGVja3BvaW50KGRiLCBpZCwgY2hlY2twb2ludCwgc2Vzc2lvbiwgcmV0dXJuVmFsdWUpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gQ2hlY2twb2ludGVyKHNyYywgdGFyZ2V0LCBpZCwgcmV0dXJuVmFsdWUpIHtcbiAgdGhpcy5zcmMgPSBzcmM7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICB0aGlzLmlkID0gaWQ7XG4gIHRoaXMucmV0dXJuVmFsdWUgPSByZXR1cm5WYWx1ZTtcbn1cblxuQ2hlY2twb2ludGVyLnByb3RvdHlwZS53cml0ZUNoZWNrcG9pbnQgPSBmdW5jdGlvbiAoY2hlY2twb2ludCwgc2Vzc2lvbikge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiB0aGlzLnVwZGF0ZVRhcmdldChjaGVja3BvaW50LCBzZXNzaW9uKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc2VsZi51cGRhdGVTb3VyY2UoY2hlY2twb2ludCwgc2Vzc2lvbik7XG4gIH0pO1xufTtcblxuQ2hlY2twb2ludGVyLnByb3RvdHlwZS51cGRhdGVUYXJnZXQgPSBmdW5jdGlvbiAoY2hlY2twb2ludCwgc2Vzc2lvbikge1xuICByZXR1cm4gdXBkYXRlQ2hlY2twb2ludCh0aGlzLnRhcmdldCwgdGhpcy5pZCwgY2hlY2twb2ludCxcbiAgICBzZXNzaW9uLCB0aGlzLnJldHVyblZhbHVlKTtcbn07XG5cbkNoZWNrcG9pbnRlci5wcm90b3R5cGUudXBkYXRlU291cmNlID0gZnVuY3Rpb24gKGNoZWNrcG9pbnQsIHNlc3Npb24pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAodGhpcy5yZWFkT25seVNvdXJjZSkge1xuICAgIHJldHVybiBQb3VjaFByb21pc2UucmVzb2x2ZSh0cnVlKTtcbiAgfVxuICByZXR1cm4gdXBkYXRlQ2hlY2twb2ludCh0aGlzLnNyYywgdGhpcy5pZCwgY2hlY2twb2ludCxcbiAgICBzZXNzaW9uLCB0aGlzLnJldHVyblZhbHVlKVxuICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoaXNGb3JiaWRkZW5FcnJvcihlcnIpKSB7XG4gICAgICAgIHNlbGYucmVhZE9ubHlTb3VyY2UgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbn07XG5cbnZhciBjb21wYXJpc29ucyA9IHtcbiAgXCJ1bmRlZmluZWRcIjogZnVuY3Rpb24gKHRhcmdldERvYywgc291cmNlRG9jKSB7XG4gICAgLy8gVGhpcyBpcyB0aGUgcHJldmlvdXMgY29tcGFyaXNvbiBmdW5jdGlvblxuICAgIGlmIChjb2xsYXRlKHRhcmdldERvYy5sYXN0X3NlcSwgc291cmNlRG9jLmxhc3Rfc2VxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNvdXJjZURvYy5sYXN0X3NlcTtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gMDtcbiAgfSxcbiAgXCIxXCI6IGZ1bmN0aW9uICh0YXJnZXREb2MsIHNvdXJjZURvYykge1xuICAgIC8vIFRoaXMgaXMgdGhlIGNvbXBhcmlzb24gZnVuY3Rpb24gcG9ydGVkIGZyb20gQ291Y2hEQlxuICAgIHJldHVybiBjb21wYXJlUmVwbGljYXRpb25Mb2dzKHNvdXJjZURvYywgdGFyZ2V0RG9jKS5sYXN0X3NlcTtcbiAgfVxufTtcblxuQ2hlY2twb2ludGVyLnByb3RvdHlwZS5nZXRDaGVja3BvaW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBzZWxmLnRhcmdldC5nZXQoc2VsZi5pZCkudGhlbihmdW5jdGlvbiAodGFyZ2V0RG9jKSB7XG4gICAgaWYgKHNlbGYucmVhZE9ubHlTb3VyY2UpIHtcbiAgICAgIHJldHVybiBQb3VjaFByb21pc2UucmVzb2x2ZSh0YXJnZXREb2MubGFzdF9zZXEpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmLnNyYy5nZXQoc2VsZi5pZCkudGhlbihmdW5jdGlvbiAoc291cmNlRG9jKSB7XG4gICAgICAvLyBTaW5jZSB3ZSBjYW4ndCBtaWdyYXRlIGFuIG9sZCB2ZXJzaW9uIGRvYyB0byBhIG5ldyBvbmVcbiAgICAgIC8vIChubyBzZXNzaW9uIGlkKSwgd2UganVzdCBnbyB3aXRoIHRoZSBsb3dlc3Qgc2VxIGluIHRoaXMgY2FzZVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAodGFyZ2V0RG9jLnZlcnNpb24gIT09IHNvdXJjZURvYy52ZXJzaW9uKSB7XG4gICAgICAgIHJldHVybiBMT1dFU1RfU0VRO1xuICAgICAgfVxuXG4gICAgICB2YXIgdmVyc2lvbjtcbiAgICAgIGlmICh0YXJnZXREb2MudmVyc2lvbikge1xuICAgICAgICB2ZXJzaW9uID0gdGFyZ2V0RG9jLnZlcnNpb24udG9TdHJpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlcnNpb24gPSBcInVuZGVmaW5lZFwiO1xuICAgICAgfVxuXG4gICAgICBpZiAodmVyc2lvbiBpbiBjb21wYXJpc29ucykge1xuICAgICAgICByZXR1cm4gY29tcGFyaXNvbnNbdmVyc2lvbl0odGFyZ2V0RG9jLCBzb3VyY2VEb2MpO1xuICAgICAgfVxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHJldHVybiBMT1dFU1RfU0VRO1xuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIuc3RhdHVzID09PSA0MDQgJiYgdGFyZ2V0RG9jLmxhc3Rfc2VxKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnNyYy5wdXQoe1xuICAgICAgICAgIF9pZDogc2VsZi5pZCxcbiAgICAgICAgICBsYXN0X3NlcTogTE9XRVNUX1NFUVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gTE9XRVNUX1NFUTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgIGlmIChpc0ZvcmJpZGRlbkVycm9yKGVycikpIHtcbiAgICAgICAgICAgIHNlbGYucmVhZE9ubHlTb3VyY2UgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldERvYy5sYXN0X3NlcTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICByZXR1cm4gTE9XRVNUX1NFUTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyLnN0YXR1cyAhPT0gNDA0KSB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuICAgIHJldHVybiBMT1dFU1RfU0VRO1xuICB9KTtcbn07XG4vLyBUaGlzIGNoZWNrcG9pbnQgY29tcGFyaXNvbiBpcyBwb3J0ZWQgZnJvbSBDb3VjaERCcyBzb3VyY2Vcbi8vIHRoZXkgY29tZSBmcm9tIGhlcmU6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vYXBhY2hlL2NvdWNoZGItY291Y2gtcmVwbGljYXRvci9ibG9iL21hc3Rlci9zcmMvY291Y2hfcmVwbGljYXRvci5lcmwjTDg2My1MOTA2XG5cbmZ1bmN0aW9uIGNvbXBhcmVSZXBsaWNhdGlvbkxvZ3Moc3JjRG9jLCB0Z3REb2MpIHtcbiAgaWYgKHNyY0RvYy5zZXNzaW9uX2lkID09PSB0Z3REb2Muc2Vzc2lvbl9pZCkge1xuICAgIHJldHVybiB7XG4gICAgICBsYXN0X3NlcTogc3JjRG9jLmxhc3Rfc2VxLFxuICAgICAgaGlzdG9yeTogc3JjRG9jLmhpc3RvcnlcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGNvbXBhcmVSZXBsaWNhdGlvbkhpc3Rvcnkoc3JjRG9jLmhpc3RvcnksIHRndERvYy5oaXN0b3J5KTtcbn1cblxuZnVuY3Rpb24gY29tcGFyZVJlcGxpY2F0aW9uSGlzdG9yeShzb3VyY2VIaXN0b3J5LCB0YXJnZXRIaXN0b3J5KSB7XG4gIC8vIHRoZSBlcmxhbmcgbG9vcCB2aWEgZnVuY3Rpb24gYXJndW1lbnRzIGlzIG5vdCBzbyBlYXN5IHRvIHJlcGVhdCBpbiBKU1xuICAvLyB0aGVyZWZvcmUsIGRvaW5nIHRoaXMgYXMgcmVjdXJzaW9uXG4gIHZhciBTID0gc291cmNlSGlzdG9yeVswXTtcbiAgdmFyIHNvdXJjZVJlc3QgPSBzb3VyY2VIaXN0b3J5LnNsaWNlKDEpO1xuICB2YXIgVCA9IHRhcmdldEhpc3RvcnlbMF07XG4gIHZhciB0YXJnZXRSZXN0ID0gdGFyZ2V0SGlzdG9yeS5zbGljZSgxKTtcblxuICBpZiAoIVMgfHwgdGFyZ2V0SGlzdG9yeS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGFzdF9zZXE6IExPV0VTVF9TRVEsXG4gICAgICBoaXN0b3J5OiBbXVxuICAgIH07XG4gIH1cblxuICB2YXIgc291cmNlSWQgPSBTLnNlc3Npb25faWQ7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoaGFzU2Vzc2lvbklkKHNvdXJjZUlkLCB0YXJnZXRIaXN0b3J5KSkge1xuICAgIHJldHVybiB7XG4gICAgICBsYXN0X3NlcTogUy5sYXN0X3NlcSxcbiAgICAgIGhpc3Rvcnk6IHNvdXJjZUhpc3RvcnlcbiAgICB9O1xuICB9XG5cbiAgdmFyIHRhcmdldElkID0gVC5zZXNzaW9uX2lkO1xuICBpZiAoaGFzU2Vzc2lvbklkKHRhcmdldElkLCBzb3VyY2VSZXN0KSkge1xuICAgIHJldHVybiB7XG4gICAgICBsYXN0X3NlcTogVC5sYXN0X3NlcSxcbiAgICAgIGhpc3Rvcnk6IHRhcmdldFJlc3RcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGNvbXBhcmVSZXBsaWNhdGlvbkhpc3Rvcnkoc291cmNlUmVzdCwgdGFyZ2V0UmVzdCk7XG59XG5cbmZ1bmN0aW9uIGhhc1Nlc3Npb25JZChzZXNzaW9uSWQsIGhpc3RvcnkpIHtcbiAgdmFyIHByb3BzID0gaGlzdG9yeVswXTtcbiAgdmFyIHJlc3QgPSBoaXN0b3J5LnNsaWNlKDEpO1xuXG4gIGlmICghc2Vzc2lvbklkIHx8IGhpc3RvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHNlc3Npb25JZCA9PT0gcHJvcHMuc2Vzc2lvbl9pZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGhhc1Nlc3Npb25JZChzZXNzaW9uSWQsIHJlc3QpO1xufVxuXG5mdW5jdGlvbiBpc0ZvcmJpZGRlbkVycm9yKGVycikge1xuICByZXR1cm4gdHlwZW9mIGVyci5zdGF0dXMgPT09ICdudW1iZXInICYmIE1hdGguZmxvb3IoZXJyLnN0YXR1cyAvIDEwMCkgPT09IDQ7XG59XG5cbnZhciBTVEFSVElOR19CQUNLX09GRiA9IDA7XG5cbmZ1bmN0aW9uIGJhY2tPZmYob3B0cywgcmV0dXJuVmFsdWUsIGVycm9yLCBjYWxsYmFjaykge1xuICBpZiAob3B0cy5yZXRyeSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm5WYWx1ZS5lbWl0KCdlcnJvcicsIGVycm9yKTtcbiAgICByZXR1cm5WYWx1ZS5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRzLmJhY2tfb2ZmX2Z1bmN0aW9uICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0cy5iYWNrX29mZl9mdW5jdGlvbiA9IGRlZmF1bHRCYWNrT2ZmO1xuICB9XG4gIHJldHVyblZhbHVlLmVtaXQoJ3JlcXVlc3RFcnJvcicsIGVycm9yKTtcbiAgaWYgKHJldHVyblZhbHVlLnN0YXRlID09PSAnYWN0aXZlJyB8fCByZXR1cm5WYWx1ZS5zdGF0ZSA9PT0gJ3BlbmRpbmcnKSB7XG4gICAgcmV0dXJuVmFsdWUuZW1pdCgncGF1c2VkJywgZXJyb3IpO1xuICAgIHJldHVyblZhbHVlLnN0YXRlID0gJ3N0b3BwZWQnO1xuICAgIHZhciBiYWNrT2ZmU2V0ID0gZnVuY3Rpb24gYmFja29mZlRpbWVTZXQoKSB7XG4gICAgICBvcHRzLmN1cnJlbnRfYmFja19vZmYgPSBTVEFSVElOR19CQUNLX09GRjtcbiAgICB9O1xuICAgIHZhciByZW1vdmVCYWNrT2ZmU2V0dGVyID0gZnVuY3Rpb24gcmVtb3ZlQmFja09mZlRpbWVTZXQoKSB7XG4gICAgICByZXR1cm5WYWx1ZS5yZW1vdmVMaXN0ZW5lcignYWN0aXZlJywgYmFja09mZlNldCk7XG4gICAgfTtcbiAgICByZXR1cm5WYWx1ZS5vbmNlKCdwYXVzZWQnLCByZW1vdmVCYWNrT2ZmU2V0dGVyKTtcbiAgICByZXR1cm5WYWx1ZS5vbmNlKCdhY3RpdmUnLCBiYWNrT2ZmU2V0KTtcbiAgfVxuXG4gIG9wdHMuY3VycmVudF9iYWNrX29mZiA9IG9wdHMuY3VycmVudF9iYWNrX29mZiB8fCBTVEFSVElOR19CQUNLX09GRjtcbiAgb3B0cy5jdXJyZW50X2JhY2tfb2ZmID0gb3B0cy5iYWNrX29mZl9mdW5jdGlvbihvcHRzLmN1cnJlbnRfYmFja19vZmYpO1xuICBzZXRUaW1lb3V0KGNhbGxiYWNrLCBvcHRzLmN1cnJlbnRfYmFja19vZmYpO1xufVxuXG5mdW5jdGlvbiBzb3J0T2JqZWN0UHJvcGVydGllc0J5S2V5KHF1ZXJ5UGFyYW1zKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhxdWVyeVBhcmFtcykuc29ydChjb2xsYXRlKS5yZWR1Y2UoZnVuY3Rpb24gKHJlc3VsdCwga2V5KSB7XG4gICAgcmVzdWx0W2tleV0gPSBxdWVyeVBhcmFtc1trZXldO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn1cblxuLy8gR2VuZXJhdGUgYSB1bmlxdWUgaWQgcGFydGljdWxhciB0byB0aGlzIHJlcGxpY2F0aW9uLlxuLy8gTm90IGd1YXJhbnRlZWQgdG8gYWxpZ24gcGVyZmVjdGx5IHdpdGggQ291Y2hEQidzIHJlcCBpZHMuXG5mdW5jdGlvbiBnZW5lcmF0ZVJlcGxpY2F0aW9uSWQoc3JjLCB0YXJnZXQsIG9wdHMpIHtcbiAgdmFyIGRvY0lkcyA9IG9wdHMuZG9jX2lkcyA/IG9wdHMuZG9jX2lkcy5zb3J0KGNvbGxhdGUpIDogJyc7XG4gIHZhciBmaWx0ZXJGdW4gPSBvcHRzLmZpbHRlciA/IG9wdHMuZmlsdGVyLnRvU3RyaW5nKCkgOiAnJztcbiAgdmFyIHF1ZXJ5UGFyYW1zID0gJyc7XG4gIHZhciBmaWx0ZXJWaWV3TmFtZSA9ICAnJztcblxuICBpZiAob3B0cy5maWx0ZXIgJiYgb3B0cy5xdWVyeV9wYXJhbXMpIHtcbiAgICBxdWVyeVBhcmFtcyA9IEpTT04uc3RyaW5naWZ5KHNvcnRPYmplY3RQcm9wZXJ0aWVzQnlLZXkob3B0cy5xdWVyeV9wYXJhbXMpKTtcbiAgfVxuXG4gIGlmIChvcHRzLmZpbHRlciAmJiBvcHRzLmZpbHRlciA9PT0gJ192aWV3Jykge1xuICAgIGZpbHRlclZpZXdOYW1lID0gb3B0cy52aWV3LnRvU3RyaW5nKCk7XG4gIH1cblxuICByZXR1cm4gUG91Y2hQcm9taXNlLmFsbChbc3JjLmlkKCksIHRhcmdldC5pZCgpXSkudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgdmFyIHF1ZXJ5RGF0YSA9IHJlc1swXSArIHJlc1sxXSArIGZpbHRlckZ1biArIGZpbHRlclZpZXdOYW1lICtcbiAgICAgIHF1ZXJ5UGFyYW1zICsgZG9jSWRzO1xuICAgIHJldHVybiBuZXcgUG91Y2hQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICBiaW5hcnlNZDUocXVlcnlEYXRhLCByZXNvbHZlKTtcbiAgICB9KTtcbiAgfSkudGhlbihmdW5jdGlvbiAobWQ1c3VtKSB7XG4gICAgLy8gY2FuJ3QgdXNlIHN0cmFpZ2h0LXVwIG1kNSBhbHBoYWJldCwgYmVjYXVzZVxuICAgIC8vIHRoZSBjaGFyICcvJyBpcyBpbnRlcnByZXRlZCBhcyBiZWluZyBmb3IgYXR0YWNobWVudHMsXG4gICAgLy8gYW5kICsgaXMgYWxzbyBub3QgdXJsLXNhZmVcbiAgICBtZDVzdW0gPSBtZDVzdW0ucmVwbGFjZSgvXFwvL2csICcuJykucmVwbGFjZSgvXFwrL2csICdfJyk7XG4gICAgcmV0dXJuICdfbG9jYWwvJyArIG1kNXN1bTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHJlcGxpY2F0ZSQxKHNyYywgdGFyZ2V0LCBvcHRzLCByZXR1cm5WYWx1ZSwgcmVzdWx0KSB7XG4gIHZhciBiYXRjaGVzID0gW107ICAgICAgICAgICAgICAgLy8gbGlzdCBvZiBiYXRjaGVzIHRvIGJlIHByb2Nlc3NlZFxuICB2YXIgY3VycmVudEJhdGNoOyAgICAgICAgICAgICAgIC8vIHRoZSBiYXRjaCBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkXG4gIHZhciBwZW5kaW5nQmF0Y2ggPSB7XG4gICAgc2VxOiAwLFxuICAgIGNoYW5nZXM6IFtdLFxuICAgIGRvY3M6IFtdXG4gIH07IC8vIG5leHQgYmF0Y2gsIG5vdCB5ZXQgcmVhZHkgdG8gYmUgcHJvY2Vzc2VkXG4gIHZhciB3cml0aW5nQ2hlY2twb2ludCA9IGZhbHNlOyAgLy8gdHJ1ZSB3aGlsZSBjaGVja3BvaW50IGlzIGJlaW5nIHdyaXR0ZW5cbiAgdmFyIGNoYW5nZXNDb21wbGV0ZWQgPSBmYWxzZTsgICAvLyB0cnVlIHdoZW4gYWxsIGNoYW5nZXMgcmVjZWl2ZWRcbiAgdmFyIHJlcGxpY2F0aW9uQ29tcGxldGVkID0gZmFsc2U7IC8vIHRydWUgd2hlbiByZXBsaWNhdGlvbiBoYXMgY29tcGxldGVkXG4gIHZhciBsYXN0X3NlcSA9IDA7XG4gIHZhciBjb250aW51b3VzID0gb3B0cy5jb250aW51b3VzIHx8IG9wdHMubGl2ZSB8fCBmYWxzZTtcbiAgdmFyIGJhdGNoX3NpemUgPSBvcHRzLmJhdGNoX3NpemUgfHwgMTAwO1xuICB2YXIgYmF0Y2hlc19saW1pdCA9IG9wdHMuYmF0Y2hlc19saW1pdCB8fCAxMDtcbiAgdmFyIGNoYW5nZXNQZW5kaW5nID0gZmFsc2U7ICAgICAvLyB0cnVlIHdoaWxlIHNyYy5jaGFuZ2VzIGlzIHJ1bm5pbmdcbiAgdmFyIGRvY19pZHMgPSBvcHRzLmRvY19pZHM7XG4gIHZhciByZXBJZDtcbiAgdmFyIGNoZWNrcG9pbnRlcjtcbiAgdmFyIGNoYW5nZWREb2NzID0gW107XG4gIC8vIExpa2UgY291Y2hkYiwgZXZlcnkgcmVwbGljYXRpb24gZ2V0cyBhIHVuaXF1ZSBzZXNzaW9uIGlkXG4gIHZhciBzZXNzaW9uID0gdXVpZCgpO1xuXG4gIHJlc3VsdCA9IHJlc3VsdCB8fCB7XG4gICAgb2s6IHRydWUsXG4gICAgc3RhcnRfdGltZTogbmV3IERhdGUoKSxcbiAgICBkb2NzX3JlYWQ6IDAsXG4gICAgZG9jc193cml0dGVuOiAwLFxuICAgIGRvY193cml0ZV9mYWlsdXJlczogMCxcbiAgICBlcnJvcnM6IFtdXG4gIH07XG5cbiAgdmFyIGNoYW5nZXNPcHRzID0ge307XG4gIHJldHVyblZhbHVlLnJlYWR5KHNyYywgdGFyZ2V0KTtcblxuICBmdW5jdGlvbiBpbml0Q2hlY2twb2ludGVyKCkge1xuICAgIGlmIChjaGVja3BvaW50ZXIpIHtcbiAgICAgIHJldHVybiBQb3VjaFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gZ2VuZXJhdGVSZXBsaWNhdGlvbklkKHNyYywgdGFyZ2V0LCBvcHRzKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJlcElkID0gcmVzO1xuICAgICAgY2hlY2twb2ludGVyID0gbmV3IENoZWNrcG9pbnRlcihzcmMsIHRhcmdldCwgcmVwSWQsIHJldHVyblZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyaXRlRG9jcygpIHtcbiAgICBjaGFuZ2VkRG9jcyA9IFtdO1xuXG4gICAgaWYgKGN1cnJlbnRCYXRjaC5kb2NzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZG9jcyA9IGN1cnJlbnRCYXRjaC5kb2NzO1xuICAgIHZhciBidWxrT3B0cyA9IHt0aW1lb3V0OiBvcHRzLnRpbWVvdXR9O1xuICAgIHJldHVybiB0YXJnZXQuYnVsa0RvY3Moe2RvY3M6IGRvY3MsIG5ld19lZGl0czogZmFsc2V9LCBidWxrT3B0cykudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChyZXR1cm5WYWx1ZS5jYW5jZWxsZWQpIHtcbiAgICAgICAgY29tcGxldGVSZXBsaWNhdGlvbigpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbmNlbGxlZCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBgcmVzYCBkb2Vzbid0IGluY2x1ZGUgZnVsbCBkb2N1bWVudHMgKHdoaWNoIGxpdmUgaW4gYGRvY3NgKSwgc28gd2UgY3JlYXRlIGEgbWFwIG9mIFxuICAgICAgLy8gKGlkIC0+IGVycm9yKSwgYW5kIGNoZWNrIGZvciBlcnJvcnMgd2hpbGUgaXRlcmF0aW5nIG92ZXIgYGRvY3NgXG4gICAgICB2YXIgZXJyb3JzQnlJZCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICByZXMuZm9yRWFjaChmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgICAgICBlcnJvcnNCeUlkW3Jlcy5pZF0gPSByZXM7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgZXJyb3JzTm8gPSBPYmplY3Qua2V5cyhlcnJvcnNCeUlkKS5sZW5ndGg7XG4gICAgICByZXN1bHQuZG9jX3dyaXRlX2ZhaWx1cmVzICs9IGVycm9yc05vO1xuICAgICAgcmVzdWx0LmRvY3Nfd3JpdHRlbiArPSBkb2NzLmxlbmd0aCAtIGVycm9yc05vO1xuXG4gICAgICBkb2NzLmZvckVhY2goZnVuY3Rpb24gKGRvYykge1xuICAgICAgICB2YXIgZXJyb3IgPSBlcnJvcnNCeUlkW2RvYy5faWRdO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXN1bHQuZXJyb3JzLnB1c2goZXJyb3IpO1xuICAgICAgICAgIGlmIChlcnJvci5uYW1lID09PSAndW5hdXRob3JpemVkJyB8fCBlcnJvci5uYW1lID09PSAnZm9yYmlkZGVuJykge1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUuZW1pdCgnZGVuaWVkJywgY2xvbmUoZXJyb3IpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoYW5nZWREb2NzLnB1c2goZG9jKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXN1bHQuZG9jX3dyaXRlX2ZhaWx1cmVzICs9IGRvY3MubGVuZ3RoO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluaXNoQmF0Y2goKSB7XG4gICAgaWYgKGN1cnJlbnRCYXRjaC5lcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGVyZSB3YXMgYSBwcm9ibGVtIGdldHRpbmcgZG9jcy4nKTtcbiAgICB9XG4gICAgcmVzdWx0Lmxhc3Rfc2VxID0gbGFzdF9zZXEgPSBjdXJyZW50QmF0Y2guc2VxO1xuICAgIHZhciBvdXRSZXN1bHQgPSBjbG9uZShyZXN1bHQpO1xuICAgIGlmIChjaGFuZ2VkRG9jcy5sZW5ndGgpIHtcbiAgICAgIG91dFJlc3VsdC5kb2NzID0gY2hhbmdlZERvY3M7XG4gICAgICByZXR1cm5WYWx1ZS5lbWl0KCdjaGFuZ2UnLCBvdXRSZXN1bHQpO1xuICAgIH1cbiAgICB3cml0aW5nQ2hlY2twb2ludCA9IHRydWU7XG4gICAgcmV0dXJuIGNoZWNrcG9pbnRlci53cml0ZUNoZWNrcG9pbnQoY3VycmVudEJhdGNoLnNlcSxcbiAgICAgICAgc2Vzc2lvbikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICB3cml0aW5nQ2hlY2twb2ludCA9IGZhbHNlO1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkKSB7XG4gICAgICAgIGNvbXBsZXRlUmVwbGljYXRpb24oKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5jZWxsZWQnKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRCYXRjaCA9IHVuZGVmaW5lZDtcbiAgICAgIGdldENoYW5nZXMoKTtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBvbkNoZWNrcG9pbnRFcnJvcihlcnIpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGlmZnMoKSB7XG4gICAgdmFyIGRpZmYgPSB7fTtcbiAgICBjdXJyZW50QmF0Y2guY2hhbmdlcy5mb3JFYWNoKGZ1bmN0aW9uIChjaGFuZ2UpIHtcbiAgICAgIC8vIENvdWNoYmFzZSBTeW5jIEdhdGV3YXkgZW1pdHMgdGhlc2UsIGJ1dCB3ZSBjYW4gaWdub3JlIHRoZW1cbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgICAgaWYgKGNoYW5nZS5pZCA9PT0gXCJfdXNlci9cIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkaWZmW2NoYW5nZS5pZF0gPSBjaGFuZ2UuY2hhbmdlcy5tYXAoZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHgucmV2O1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRhcmdldC5yZXZzRGlmZihkaWZmKS50aGVuKGZ1bmN0aW9uIChkaWZmcykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkKSB7XG4gICAgICAgIGNvbXBsZXRlUmVwbGljYXRpb24oKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5jZWxsZWQnKTtcbiAgICAgIH1cbiAgICAgIC8vIGN1cnJlbnRCYXRjaC5kaWZmcyBlbGVtZW50cyBhcmUgZGVsZXRlZCBhcyB0aGUgZG9jdW1lbnRzIGFyZSB3cml0dGVuXG4gICAgICBjdXJyZW50QmF0Y2guZGlmZnMgPSBkaWZmcztcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEJhdGNoRG9jcygpIHtcbiAgICByZXR1cm4gZ2V0RG9jcyhzcmMsIHRhcmdldCwgY3VycmVudEJhdGNoLmRpZmZzLCByZXR1cm5WYWx1ZSkudGhlbihmdW5jdGlvbiAoZ290KSB7XG4gICAgICBjdXJyZW50QmF0Y2guZXJyb3IgPSAhZ290Lm9rO1xuICAgICAgZ290LmRvY3MuZm9yRWFjaChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgIGRlbGV0ZSBjdXJyZW50QmF0Y2guZGlmZnNbZG9jLl9pZF07XG4gICAgICAgIHJlc3VsdC5kb2NzX3JlYWQrKztcbiAgICAgICAgY3VycmVudEJhdGNoLmRvY3MucHVzaChkb2MpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydE5leHRCYXRjaCgpIHtcbiAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkIHx8IGN1cnJlbnRCYXRjaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoYmF0Y2hlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHByb2Nlc3NQZW5kaW5nQmF0Y2godHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN1cnJlbnRCYXRjaCA9IGJhdGNoZXMuc2hpZnQoKTtcbiAgICBnZXREaWZmcygpXG4gICAgICAudGhlbihnZXRCYXRjaERvY3MpXG4gICAgICAudGhlbih3cml0ZURvY3MpXG4gICAgICAudGhlbihmaW5pc2hCYXRjaClcbiAgICAgIC50aGVuKHN0YXJ0TmV4dEJhdGNoKVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgYWJvcnRSZXBsaWNhdGlvbignYmF0Y2ggcHJvY2Vzc2luZyB0ZXJtaW5hdGVkIHdpdGggZXJyb3InLCBlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NQZW5kaW5nQmF0Y2goaW1tZWRpYXRlKSB7XG4gICAgaWYgKHBlbmRpbmdCYXRjaC5jaGFuZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKGJhdGNoZXMubGVuZ3RoID09PSAwICYmICFjdXJyZW50QmF0Y2gpIHtcbiAgICAgICAgaWYgKChjb250aW51b3VzICYmIGNoYW5nZXNPcHRzLmxpdmUpIHx8IGNoYW5nZXNDb21wbGV0ZWQpIHtcbiAgICAgICAgICByZXR1cm5WYWx1ZS5zdGF0ZSA9ICdwZW5kaW5nJztcbiAgICAgICAgICByZXR1cm5WYWx1ZS5lbWl0KCdwYXVzZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlc0NvbXBsZXRlZCkge1xuICAgICAgICAgIGNvbXBsZXRlUmVwbGljYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBpbW1lZGlhdGUgfHxcbiAgICAgIGNoYW5nZXNDb21wbGV0ZWQgfHxcbiAgICAgIHBlbmRpbmdCYXRjaC5jaGFuZ2VzLmxlbmd0aCA+PSBiYXRjaF9zaXplXG4gICAgKSB7XG4gICAgICBiYXRjaGVzLnB1c2gocGVuZGluZ0JhdGNoKTtcbiAgICAgIHBlbmRpbmdCYXRjaCA9IHtcbiAgICAgICAgc2VxOiAwLFxuICAgICAgICBjaGFuZ2VzOiBbXSxcbiAgICAgICAgZG9jczogW11cbiAgICAgIH07XG4gICAgICBpZiAocmV0dXJuVmFsdWUuc3RhdGUgPT09ICdwZW5kaW5nJyB8fCByZXR1cm5WYWx1ZS5zdGF0ZSA9PT0gJ3N0b3BwZWQnKSB7XG4gICAgICAgIHJldHVyblZhbHVlLnN0YXRlID0gJ2FjdGl2ZSc7XG4gICAgICAgIHJldHVyblZhbHVlLmVtaXQoJ2FjdGl2ZScpO1xuICAgICAgfVxuICAgICAgc3RhcnROZXh0QmF0Y2goKTtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGFib3J0UmVwbGljYXRpb24ocmVhc29uLCBlcnIpIHtcbiAgICBpZiAocmVwbGljYXRpb25Db21wbGV0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFlcnIubWVzc2FnZSkge1xuICAgICAgZXJyLm1lc3NhZ2UgPSByZWFzb247XG4gICAgfVxuICAgIHJlc3VsdC5vayA9IGZhbHNlO1xuICAgIHJlc3VsdC5zdGF0dXMgPSAnYWJvcnRpbmcnO1xuICAgIGJhdGNoZXMgPSBbXTtcbiAgICBwZW5kaW5nQmF0Y2ggPSB7XG4gICAgICBzZXE6IDAsXG4gICAgICBjaGFuZ2VzOiBbXSxcbiAgICAgIGRvY3M6IFtdXG4gICAgfTtcbiAgICBjb21wbGV0ZVJlcGxpY2F0aW9uKGVycik7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGNvbXBsZXRlUmVwbGljYXRpb24oZmF0YWxFcnJvcikge1xuICAgIGlmIChyZXBsaWNhdGlvbkNvbXBsZXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkKSB7XG4gICAgICByZXN1bHQuc3RhdHVzID0gJ2NhbmNlbGxlZCc7XG4gICAgICBpZiAod3JpdGluZ0NoZWNrcG9pbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQuc3RhdHVzID0gcmVzdWx0LnN0YXR1cyB8fCAnY29tcGxldGUnO1xuICAgIHJlc3VsdC5lbmRfdGltZSA9IG5ldyBEYXRlKCk7XG4gICAgcmVzdWx0Lmxhc3Rfc2VxID0gbGFzdF9zZXE7XG4gICAgcmVwbGljYXRpb25Db21wbGV0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKGZhdGFsRXJyb3IpIHtcbiAgICAgIGZhdGFsRXJyb3IucmVzdWx0ID0gcmVzdWx0O1xuXG4gICAgICBpZiAoZmF0YWxFcnJvci5uYW1lID09PSAndW5hdXRob3JpemVkJyB8fCBmYXRhbEVycm9yLm5hbWUgPT09ICdmb3JiaWRkZW4nKSB7XG4gICAgICAgIHJldHVyblZhbHVlLmVtaXQoJ2Vycm9yJywgZmF0YWxFcnJvcik7XG4gICAgICAgIHJldHVyblZhbHVlLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFja09mZihvcHRzLCByZXR1cm5WYWx1ZSwgZmF0YWxFcnJvciwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJlcGxpY2F0ZSQxKHNyYywgdGFyZ2V0LCBvcHRzLCByZXR1cm5WYWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm5WYWx1ZS5lbWl0KCdjb21wbGV0ZScsIHJlc3VsdCk7XG4gICAgICByZXR1cm5WYWx1ZS5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKGNoYW5nZSkge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChyZXR1cm5WYWx1ZS5jYW5jZWxsZWQpIHtcbiAgICAgIHJldHVybiBjb21wbGV0ZVJlcGxpY2F0aW9uKCk7XG4gICAgfVxuICAgIHZhciBmaWx0ZXIgPSBmaWx0ZXJDaGFuZ2Uob3B0cykoY2hhbmdlKTtcbiAgICBpZiAoIWZpbHRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwZW5kaW5nQmF0Y2guc2VxID0gY2hhbmdlLnNlcTtcbiAgICBwZW5kaW5nQmF0Y2guY2hhbmdlcy5wdXNoKGNoYW5nZSk7XG4gICAgcHJvY2Vzc1BlbmRpbmdCYXRjaChiYXRjaGVzLmxlbmd0aCA9PT0gMCAmJiBjaGFuZ2VzT3B0cy5saXZlKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gb25DaGFuZ2VzQ29tcGxldGUoY2hhbmdlcykge1xuICAgIGNoYW5nZXNQZW5kaW5nID0gZmFsc2U7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHJldHVyblZhbHVlLmNhbmNlbGxlZCkge1xuICAgICAgcmV0dXJuIGNvbXBsZXRlUmVwbGljYXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBpZiBubyByZXN1bHRzIHdlcmUgcmV0dXJuZWQgdGhlbiB3ZSdyZSBkb25lLFxuICAgIC8vIGVsc2UgZmV0Y2ggbW9yZVxuICAgIGlmIChjaGFuZ2VzLnJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgY2hhbmdlc09wdHMuc2luY2UgPSBjaGFuZ2VzLmxhc3Rfc2VxO1xuICAgICAgZ2V0Q2hhbmdlcygpO1xuICAgICAgcHJvY2Vzc1BlbmRpbmdCYXRjaCh0cnVlKTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICB2YXIgY29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb250aW51b3VzKSB7XG4gICAgICAgICAgY2hhbmdlc09wdHMubGl2ZSA9IHRydWU7XG4gICAgICAgICAgZ2V0Q2hhbmdlcygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoYW5nZXNDb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NQZW5kaW5nQmF0Y2godHJ1ZSk7XG4gICAgICB9O1xuXG4gICAgICAvLyB1cGRhdGUgdGhlIGNoZWNrcG9pbnQgc28gd2Ugc3RhcnQgZnJvbSB0aGUgcmlnaHQgc2VxIG5leHQgdGltZVxuICAgICAgaWYgKCFjdXJyZW50QmF0Y2ggJiYgY2hhbmdlcy5yZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB3cml0aW5nQ2hlY2twb2ludCA9IHRydWU7XG4gICAgICAgIGNoZWNrcG9pbnRlci53cml0ZUNoZWNrcG9pbnQoY2hhbmdlcy5sYXN0X3NlcSxcbiAgICAgICAgICAgIHNlc3Npb24pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHdyaXRpbmdDaGVja3BvaW50ID0gZmFsc2U7XG4gICAgICAgICAgcmVzdWx0Lmxhc3Rfc2VxID0gbGFzdF9zZXEgPSBjaGFuZ2VzLmxhc3Rfc2VxO1xuICAgICAgICAgIGNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChvbkNoZWNrcG9pbnRFcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gb25DaGFuZ2VzRXJyb3IoZXJyKSB7XG4gICAgY2hhbmdlc1BlbmRpbmcgPSBmYWxzZTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAocmV0dXJuVmFsdWUuY2FuY2VsbGVkKSB7XG4gICAgICByZXR1cm4gY29tcGxldGVSZXBsaWNhdGlvbigpO1xuICAgIH1cbiAgICBhYm9ydFJlcGxpY2F0aW9uKCdjaGFuZ2VzIHJlamVjdGVkJywgZXJyKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZ2V0Q2hhbmdlcygpIHtcbiAgICBpZiAoIShcbiAgICAgICFjaGFuZ2VzUGVuZGluZyAmJlxuICAgICAgIWNoYW5nZXNDb21wbGV0ZWQgJiZcbiAgICAgIGJhdGNoZXMubGVuZ3RoIDwgYmF0Y2hlc19saW1pdFxuICAgICAgKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGFuZ2VzUGVuZGluZyA9IHRydWU7XG4gICAgZnVuY3Rpb24gYWJvcnRDaGFuZ2VzKCkge1xuICAgICAgY2hhbmdlcy5jYW5jZWwoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoKSB7XG4gICAgICByZXR1cm5WYWx1ZS5yZW1vdmVMaXN0ZW5lcignY2FuY2VsJywgYWJvcnRDaGFuZ2VzKTtcbiAgICB9XG5cbiAgICBpZiAocmV0dXJuVmFsdWUuX2NoYW5nZXMpIHsgLy8gcmVtb3ZlIG9sZCBjaGFuZ2VzKCkgYW5kIGxpc3RlbmVyc1xuICAgICAgcmV0dXJuVmFsdWUucmVtb3ZlTGlzdGVuZXIoJ2NhbmNlbCcsIHJldHVyblZhbHVlLl9hYm9ydENoYW5nZXMpO1xuICAgICAgcmV0dXJuVmFsdWUuX2NoYW5nZXMuY2FuY2VsKCk7XG4gICAgfVxuICAgIHJldHVyblZhbHVlLm9uY2UoJ2NhbmNlbCcsIGFib3J0Q2hhbmdlcyk7XG5cbiAgICB2YXIgY2hhbmdlcyA9IHNyYy5jaGFuZ2VzKGNoYW5nZXNPcHRzKVxuICAgICAgLm9uKCdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gICAgY2hhbmdlcy50aGVuKHJlbW92ZUxpc3RlbmVyLCByZW1vdmVMaXN0ZW5lcik7XG4gICAgY2hhbmdlcy50aGVuKG9uQ2hhbmdlc0NvbXBsZXRlKVxuICAgICAgLmNhdGNoKG9uQ2hhbmdlc0Vycm9yKTtcblxuICAgIGlmIChvcHRzLnJldHJ5KSB7XG4gICAgICAvLyBzYXZlIGZvciBsYXRlciBzbyB3ZSBjYW4gY2FuY2VsIGlmIG5lY2Vzc2FyeVxuICAgICAgcmV0dXJuVmFsdWUuX2NoYW5nZXMgPSBjaGFuZ2VzO1xuICAgICAgcmV0dXJuVmFsdWUuX2Fib3J0Q2hhbmdlcyA9IGFib3J0Q2hhbmdlcztcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHN0YXJ0Q2hhbmdlcygpIHtcbiAgICBpbml0Q2hlY2twb2ludGVyKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChyZXR1cm5WYWx1ZS5jYW5jZWxsZWQpIHtcbiAgICAgICAgY29tcGxldGVSZXBsaWNhdGlvbigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hlY2twb2ludGVyLmdldENoZWNrcG9pbnQoKS50aGVuKGZ1bmN0aW9uIChjaGVja3BvaW50KSB7XG4gICAgICAgIGxhc3Rfc2VxID0gY2hlY2twb2ludDtcbiAgICAgICAgY2hhbmdlc09wdHMgPSB7XG4gICAgICAgICAgc2luY2U6IGxhc3Rfc2VxLFxuICAgICAgICAgIGxpbWl0OiBiYXRjaF9zaXplLFxuICAgICAgICAgIGJhdGNoX3NpemU6IGJhdGNoX3NpemUsXG4gICAgICAgICAgc3R5bGU6ICdhbGxfZG9jcycsXG4gICAgICAgICAgZG9jX2lkczogZG9jX2lkcyxcbiAgICAgICAgICByZXR1cm5fZG9jczogdHJ1ZSAvLyByZXF1aXJlZCBzbyB3ZSBrbm93IHdoZW4gd2UncmUgZG9uZVxuICAgICAgICB9O1xuICAgICAgICBpZiAob3B0cy5maWx0ZXIpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIG9wdHMuZmlsdGVyICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gcmVxdWlyZWQgZm9yIHRoZSBjbGllbnQtc2lkZSBmaWx0ZXIgaW4gb25DaGFuZ2VcbiAgICAgICAgICAgIGNoYW5nZXNPcHRzLmluY2x1ZGVfZG9jcyA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gZGRvYyBmaWx0ZXJcbiAgICAgICAgICAgIGNoYW5nZXNPcHRzLmZpbHRlciA9IG9wdHMuZmlsdGVyO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoJ2hlYXJ0YmVhdCcgaW4gb3B0cykge1xuICAgICAgICAgIGNoYW5nZXNPcHRzLmhlYXJ0YmVhdCA9IG9wdHMuaGVhcnRiZWF0O1xuICAgICAgICB9XG4gICAgICAgIGlmICgndGltZW91dCcgaW4gb3B0cykge1xuICAgICAgICAgIGNoYW5nZXNPcHRzLnRpbWVvdXQgPSBvcHRzLnRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdHMucXVlcnlfcGFyYW1zKSB7XG4gICAgICAgICAgY2hhbmdlc09wdHMucXVlcnlfcGFyYW1zID0gb3B0cy5xdWVyeV9wYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdHMudmlldykge1xuICAgICAgICAgIGNoYW5nZXNPcHRzLnZpZXcgPSBvcHRzLnZpZXc7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0Q2hhbmdlcygpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgYWJvcnRSZXBsaWNhdGlvbignZ2V0Q2hlY2twb2ludCByZWplY3RlZCB3aXRoICcsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBmdW5jdGlvbiBvbkNoZWNrcG9pbnRFcnJvcihlcnIpIHtcbiAgICB3cml0aW5nQ2hlY2twb2ludCA9IGZhbHNlO1xuICAgIGFib3J0UmVwbGljYXRpb24oJ3dyaXRlQ2hlY2twb2ludCBjb21wbGV0ZWQgd2l0aCBlcnJvcicsIGVycik7XG4gIH1cblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgaWYgKHJldHVyblZhbHVlLmNhbmNlbGxlZCkgeyAvLyBjYW5jZWxsZWQgaW1tZWRpYXRlbHlcbiAgICBjb21wbGV0ZVJlcGxpY2F0aW9uKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFyZXR1cm5WYWx1ZS5fYWRkZWRMaXN0ZW5lcnMpIHtcbiAgICByZXR1cm5WYWx1ZS5vbmNlKCdjYW5jZWwnLCBjb21wbGV0ZVJlcGxpY2F0aW9uKTtcblxuICAgIGlmICh0eXBlb2Ygb3B0cy5jb21wbGV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuVmFsdWUub25jZSgnZXJyb3InLCBvcHRzLmNvbXBsZXRlKTtcbiAgICAgIHJldHVyblZhbHVlLm9uY2UoJ2NvbXBsZXRlJywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICBvcHRzLmNvbXBsZXRlKG51bGwsIHJlc3VsdCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuVmFsdWUuX2FkZGVkTGlzdGVuZXJzID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb3B0cy5zaW5jZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBzdGFydENoYW5nZXMoKTtcbiAgfSBlbHNlIHtcbiAgICBpbml0Q2hlY2twb2ludGVyKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICB3cml0aW5nQ2hlY2twb2ludCA9IHRydWU7XG4gICAgICByZXR1cm4gY2hlY2twb2ludGVyLndyaXRlQ2hlY2twb2ludChvcHRzLnNpbmNlLCBzZXNzaW9uKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHdyaXRpbmdDaGVja3BvaW50ID0gZmFsc2U7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICAgIGlmIChyZXR1cm5WYWx1ZS5jYW5jZWxsZWQpIHtcbiAgICAgICAgY29tcGxldGVSZXBsaWNhdGlvbigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsYXN0X3NlcSA9IG9wdHMuc2luY2U7XG4gICAgICBzdGFydENoYW5nZXMoKTtcbiAgICB9KS5jYXRjaChvbkNoZWNrcG9pbnRFcnJvcik7XG4gIH1cbn1cblxuLy8gV2UgY3JlYXRlIGEgYmFzaWMgcHJvbWlzZSBzbyB0aGUgY2FsbGVyIGNhbiBjYW5jZWwgdGhlIHJlcGxpY2F0aW9uIHBvc3NpYmx5XG4vLyBiZWZvcmUgd2UgaGF2ZSBhY3R1YWxseSBzdGFydGVkIGxpc3RlbmluZyB0byBjaGFuZ2VzIGV0Y1xuaW5oZXJpdHMoUmVwbGljYXRpb24sIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xuZnVuY3Rpb24gUmVwbGljYXRpb24oKSB7XG4gIGV2ZW50cy5FdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcbiAgdGhpcy5jYW5jZWxsZWQgPSBmYWxzZTtcbiAgdGhpcy5zdGF0ZSA9ICdwZW5kaW5nJztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgcHJvbWlzZSA9IG5ldyBQb3VjaFByb21pc2UoZnVuY3Rpb24gKGZ1bGZpbGwsIHJlamVjdCkge1xuICAgIHNlbGYub25jZSgnY29tcGxldGUnLCBmdWxmaWxsKTtcbiAgICBzZWxmLm9uY2UoJ2Vycm9yJywgcmVqZWN0KTtcbiAgfSk7XG4gIHNlbGYudGhlbiA9IGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gIH07XG4gIHNlbGYuY2F0Y2ggPSBmdW5jdGlvbiAocmVqZWN0KSB7XG4gICAgcmV0dXJuIHByb21pc2UuY2F0Y2gocmVqZWN0KTtcbiAgfTtcbiAgLy8gQXMgd2UgYWxsb3cgZXJyb3IgaGFuZGxpbmcgdmlhIFwiZXJyb3JcIiBldmVudCBhcyB3ZWxsLFxuICAvLyBwdXQgYSBzdHViIGluIGhlcmUgc28gdGhhdCByZWplY3RpbmcgbmV2ZXIgdGhyb3dzIFVuaGFuZGxlZEVycm9yLlxuICBzZWxmLmNhdGNoKGZ1bmN0aW9uICgpIHt9KTtcbn1cblxuUmVwbGljYXRpb24ucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5jYW5jZWxsZWQgPSB0cnVlO1xuICB0aGlzLnN0YXRlID0gJ2NhbmNlbGxlZCc7XG4gIHRoaXMuZW1pdCgnY2FuY2VsJyk7XG59O1xuXG5SZXBsaWNhdGlvbi5wcm90b3R5cGUucmVhZHkgPSBmdW5jdGlvbiAoc3JjLCB0YXJnZXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoc2VsZi5fcmVhZHlDYWxsZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgc2VsZi5fcmVhZHlDYWxsZWQgPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIG9uRGVzdHJveSgpIHtcbiAgICBzZWxmLmNhbmNlbCgpO1xuICB9XG4gIHNyYy5vbmNlKCdkZXN0cm95ZWQnLCBvbkRlc3Ryb3kpO1xuICB0YXJnZXQub25jZSgnZGVzdHJveWVkJywgb25EZXN0cm95KTtcbiAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICBzcmMucmVtb3ZlTGlzdGVuZXIoJ2Rlc3Ryb3llZCcsIG9uRGVzdHJveSk7XG4gICAgdGFyZ2V0LnJlbW92ZUxpc3RlbmVyKCdkZXN0cm95ZWQnLCBvbkRlc3Ryb3kpO1xuICB9XG4gIHNlbGYub25jZSgnY29tcGxldGUnLCBjbGVhbnVwKTtcbn07XG5cbmZ1bmN0aW9uIHRvUG91Y2goZGIsIG9wdHMpIHtcbiAgdmFyIFBvdWNoQ29uc3RydWN0b3IgPSBvcHRzLlBvdWNoQ29uc3RydWN0b3I7XG4gIGlmICh0eXBlb2YgZGIgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIG5ldyBQb3VjaENvbnN0cnVjdG9yKGRiLCBvcHRzKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZGI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGljYXRlKHNyYywgdGFyZ2V0LCBvcHRzLCBjYWxsYmFjaykge1xuXG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRzID09PSAndW5kZWZpbmVkJykge1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuXG4gIGlmIChvcHRzLmRvY19pZHMgJiYgIUFycmF5LmlzQXJyYXkob3B0cy5kb2NfaWRzKSkge1xuICAgIHRocm93IGNyZWF0ZUVycm9yKEJBRF9SRVFVRVNULFxuICAgICAgICAgICAgICAgICAgICAgICBcImBkb2NfaWRzYCBmaWx0ZXIgcGFyYW1ldGVyIGlzIG5vdCBhIGxpc3QuXCIpO1xuICB9XG5cbiAgb3B0cy5jb21wbGV0ZSA9IGNhbGxiYWNrO1xuICBvcHRzID0gY2xvbmUob3B0cyk7XG4gIG9wdHMuY29udGludW91cyA9IG9wdHMuY29udGludW91cyB8fCBvcHRzLmxpdmU7XG4gIG9wdHMucmV0cnkgPSAoJ3JldHJ5JyBpbiBvcHRzKSA/IG9wdHMucmV0cnkgOiBmYWxzZTtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgb3B0cy5Qb3VjaENvbnN0cnVjdG9yID0gb3B0cy5Qb3VjaENvbnN0cnVjdG9yIHx8IHRoaXM7XG4gIHZhciByZXBsaWNhdGVSZXQgPSBuZXcgUmVwbGljYXRpb24ob3B0cyk7XG4gIHZhciBzcmNQb3VjaCA9IHRvUG91Y2goc3JjLCBvcHRzKTtcbiAgdmFyIHRhcmdldFBvdWNoID0gdG9Qb3VjaCh0YXJnZXQsIG9wdHMpO1xuICByZXBsaWNhdGUkMShzcmNQb3VjaCwgdGFyZ2V0UG91Y2gsIG9wdHMsIHJlcGxpY2F0ZVJldCk7XG4gIHJldHVybiByZXBsaWNhdGVSZXQ7XG59XG5cbmluaGVyaXRzKFN5bmMsIGV2ZW50cy5FdmVudEVtaXR0ZXIpO1xuZnVuY3Rpb24gc3luYyhzcmMsIHRhcmdldCwgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICBpZiAodHlwZW9mIG9wdHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIG9wdHMgPSBjbG9uZShvcHRzKTtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgb3B0cy5Qb3VjaENvbnN0cnVjdG9yID0gb3B0cy5Qb3VjaENvbnN0cnVjdG9yIHx8IHRoaXM7XG4gIHNyYyA9IHRvUG91Y2goc3JjLCBvcHRzKTtcbiAgdGFyZ2V0ID0gdG9Qb3VjaCh0YXJnZXQsIG9wdHMpO1xuICByZXR1cm4gbmV3IFN5bmMoc3JjLCB0YXJnZXQsIG9wdHMsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gU3luYyhzcmMsIHRhcmdldCwgb3B0cywgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmNhbmNlbGVkID0gZmFsc2U7XG5cbiAgdmFyIG9wdHNQdXNoID0gb3B0cy5wdXNoID8gZXh0ZW5kJDEoe30sIG9wdHMsIG9wdHMucHVzaCkgOiBvcHRzO1xuICB2YXIgb3B0c1B1bGwgPSBvcHRzLnB1bGwgPyBleHRlbmQkMSh7fSwgb3B0cywgb3B0cy5wdWxsKSA6IG9wdHM7XG5cbiAgdGhpcy5wdXNoID0gcmVwbGljYXRlKHNyYywgdGFyZ2V0LCBvcHRzUHVzaCk7XG4gIHRoaXMucHVsbCA9IHJlcGxpY2F0ZSh0YXJnZXQsIHNyYywgb3B0c1B1bGwpO1xuXG4gIHRoaXMucHVzaFBhdXNlZCA9IHRydWU7XG4gIHRoaXMucHVsbFBhdXNlZCA9IHRydWU7XG5cbiAgZnVuY3Rpb24gcHVsbENoYW5nZShjaGFuZ2UpIHtcbiAgICBzZWxmLmVtaXQoJ2NoYW5nZScsIHtcbiAgICAgIGRpcmVjdGlvbjogJ3B1bGwnLFxuICAgICAgY2hhbmdlOiBjaGFuZ2VcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBwdXNoQ2hhbmdlKGNoYW5nZSkge1xuICAgIHNlbGYuZW1pdCgnY2hhbmdlJywge1xuICAgICAgZGlyZWN0aW9uOiAncHVzaCcsXG4gICAgICBjaGFuZ2U6IGNoYW5nZVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIHB1c2hEZW5pZWQoZG9jKSB7XG4gICAgc2VsZi5lbWl0KCdkZW5pZWQnLCB7XG4gICAgICBkaXJlY3Rpb246ICdwdXNoJyxcbiAgICAgIGRvYzogZG9jXG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gcHVsbERlbmllZChkb2MpIHtcbiAgICBzZWxmLmVtaXQoJ2RlbmllZCcsIHtcbiAgICAgIGRpcmVjdGlvbjogJ3B1bGwnLFxuICAgICAgZG9jOiBkb2NcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBwdXNoUGF1c2VkKCkge1xuICAgIHNlbGYucHVzaFBhdXNlZCA9IHRydWU7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHNlbGYucHVsbFBhdXNlZCkge1xuICAgICAgc2VsZi5lbWl0KCdwYXVzZWQnKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcHVsbFBhdXNlZCgpIHtcbiAgICBzZWxmLnB1bGxQYXVzZWQgPSB0cnVlO1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICAgIGlmIChzZWxmLnB1c2hQYXVzZWQpIHtcbiAgICAgIHNlbGYuZW1pdCgncGF1c2VkJyk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHB1c2hBY3RpdmUoKSB7XG4gICAgc2VsZi5wdXNoUGF1c2VkID0gZmFsc2U7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgaWYgKHNlbGYucHVsbFBhdXNlZCkge1xuICAgICAgc2VsZi5lbWl0KCdhY3RpdmUnLCB7XG4gICAgICAgIGRpcmVjdGlvbjogJ3B1c2gnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gcHVsbEFjdGl2ZSgpIHtcbiAgICBzZWxmLnB1bGxQYXVzZWQgPSBmYWxzZTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi9cbiAgICBpZiAoc2VsZi5wdXNoUGF1c2VkKSB7XG4gICAgICBzZWxmLmVtaXQoJ2FjdGl2ZScsIHtcbiAgICAgICAgZGlyZWN0aW9uOiAncHVsbCdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHZhciByZW1vdmVkID0ge307XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQWxsKHR5cGUpIHsgLy8gdHlwZSBpcyAncHVzaCcgb3IgJ3B1bGwnXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCwgZnVuYykge1xuICAgICAgdmFyIGlzQ2hhbmdlID0gZXZlbnQgPT09ICdjaGFuZ2UnICYmXG4gICAgICAgIChmdW5jID09PSBwdWxsQ2hhbmdlIHx8IGZ1bmMgPT09IHB1c2hDaGFuZ2UpO1xuICAgICAgdmFyIGlzRGVuaWVkID0gZXZlbnQgPT09ICdkZW5pZWQnICYmXG4gICAgICAgIChmdW5jID09PSBwdWxsRGVuaWVkIHx8IGZ1bmMgPT09IHB1c2hEZW5pZWQpO1xuICAgICAgdmFyIGlzUGF1c2VkID0gZXZlbnQgPT09ICdwYXVzZWQnICYmXG4gICAgICAgIChmdW5jID09PSBwdWxsUGF1c2VkIHx8IGZ1bmMgPT09IHB1c2hQYXVzZWQpO1xuICAgICAgdmFyIGlzQWN0aXZlID0gZXZlbnQgPT09ICdhY3RpdmUnICYmXG4gICAgICAgIChmdW5jID09PSBwdWxsQWN0aXZlIHx8IGZ1bmMgPT09IHB1c2hBY3RpdmUpO1xuXG4gICAgICBpZiAoaXNDaGFuZ2UgfHwgaXNEZW5pZWQgfHwgaXNQYXVzZWQgfHwgaXNBY3RpdmUpIHtcbiAgICAgICAgaWYgKCEoZXZlbnQgaW4gcmVtb3ZlZCkpIHtcbiAgICAgICAgICByZW1vdmVkW2V2ZW50XSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHJlbW92ZWRbZXZlbnRdW3R5cGVdID0gdHJ1ZTtcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHJlbW92ZWRbZXZlbnRdKS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAvLyBib3RoIHB1c2ggYW5kIHB1bGwgaGF2ZSBhc2tlZCB0byBiZSByZW1vdmVkXG4gICAgICAgICAgc2VsZi5yZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGlmIChvcHRzLmxpdmUpIHtcbiAgICB0aGlzLnB1c2gub24oJ2NvbXBsZXRlJywgc2VsZi5wdWxsLmNhbmNlbC5iaW5kKHNlbGYucHVsbCkpO1xuICAgIHRoaXMucHVsbC5vbignY29tcGxldGUnLCBzZWxmLnB1c2guY2FuY2VsLmJpbmQoc2VsZi5wdXNoKSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRPbmVMaXN0ZW5lcihlZSwgZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgaWYgKGVlLmxpc3RlbmVycyhldmVudCkuaW5kZXhPZihsaXN0ZW5lcikgPT0gLTEpIHtcbiAgICAgIGVlLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5vbignbmV3TGlzdGVuZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgPT09ICdjaGFuZ2UnKSB7XG4gICAgICBhZGRPbmVMaXN0ZW5lcihzZWxmLnB1bGwsICdjaGFuZ2UnLCBwdWxsQ2hhbmdlKTtcbiAgICAgIGFkZE9uZUxpc3RlbmVyKHNlbGYucHVzaCwgJ2NoYW5nZScsIHB1c2hDaGFuZ2UpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09ICdkZW5pZWQnKSB7XG4gICAgICBhZGRPbmVMaXN0ZW5lcihzZWxmLnB1bGwsICdkZW5pZWQnLCBwdWxsRGVuaWVkKTtcbiAgICAgIGFkZE9uZUxpc3RlbmVyKHNlbGYucHVzaCwgJ2RlbmllZCcsIHB1c2hEZW5pZWQpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09ICdhY3RpdmUnKSB7XG4gICAgICBhZGRPbmVMaXN0ZW5lcihzZWxmLnB1bGwsICdhY3RpdmUnLCBwdWxsQWN0aXZlKTtcbiAgICAgIGFkZE9uZUxpc3RlbmVyKHNlbGYucHVzaCwgJ2FjdGl2ZScsIHB1c2hBY3RpdmUpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09ICdwYXVzZWQnKSB7XG4gICAgICBhZGRPbmVMaXN0ZW5lcihzZWxmLnB1bGwsICdwYXVzZWQnLCBwdWxsUGF1c2VkKTtcbiAgICAgIGFkZE9uZUxpc3RlbmVyKHNlbGYucHVzaCwgJ3BhdXNlZCcsIHB1c2hQYXVzZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgdGhpcy5vbigncmVtb3ZlTGlzdGVuZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQgPT09ICdjaGFuZ2UnKSB7XG4gICAgICBzZWxmLnB1bGwucmVtb3ZlTGlzdGVuZXIoJ2NoYW5nZScsIHB1bGxDaGFuZ2UpO1xuICAgICAgc2VsZi5wdXNoLnJlbW92ZUxpc3RlbmVyKCdjaGFuZ2UnLCBwdXNoQ2hhbmdlKTtcbiAgICB9IGVsc2UgaWYgKGV2ZW50ID09PSAnZGVuaWVkJykge1xuICAgICAgc2VsZi5wdWxsLnJlbW92ZUxpc3RlbmVyKCdkZW5pZWQnLCBwdWxsRGVuaWVkKTtcbiAgICAgIHNlbGYucHVzaC5yZW1vdmVMaXN0ZW5lcignZGVuaWVkJywgcHVzaERlbmllZCk7XG4gICAgfSBlbHNlIGlmIChldmVudCA9PT0gJ2FjdGl2ZScpIHtcbiAgICAgIHNlbGYucHVsbC5yZW1vdmVMaXN0ZW5lcignYWN0aXZlJywgcHVsbEFjdGl2ZSk7XG4gICAgICBzZWxmLnB1c2gucmVtb3ZlTGlzdGVuZXIoJ2FjdGl2ZScsIHB1c2hBY3RpdmUpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09ICdwYXVzZWQnKSB7XG4gICAgICBzZWxmLnB1bGwucmVtb3ZlTGlzdGVuZXIoJ3BhdXNlZCcsIHB1bGxQYXVzZWQpO1xuICAgICAgc2VsZi5wdXNoLnJlbW92ZUxpc3RlbmVyKCdwYXVzZWQnLCBwdXNoUGF1c2VkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHRoaXMucHVsbC5vbigncmVtb3ZlTGlzdGVuZXInLCByZW1vdmVBbGwoJ3B1bGwnKSk7XG4gIHRoaXMucHVzaC5vbigncmVtb3ZlTGlzdGVuZXInLCByZW1vdmVBbGwoJ3B1c2gnKSk7XG5cbiAgdmFyIHByb21pc2UgPSBQb3VjaFByb21pc2UuYWxsKFtcbiAgICB0aGlzLnB1c2gsXG4gICAgdGhpcy5wdWxsXG4gIF0pLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICB2YXIgb3V0ID0ge1xuICAgICAgcHVzaDogcmVzcFswXSxcbiAgICAgIHB1bGw6IHJlc3BbMV1cbiAgICB9O1xuICAgIHNlbGYuZW1pdCgnY29tcGxldGUnLCBvdXQpO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2sobnVsbCwgb3V0KTtcbiAgICB9XG4gICAgc2VsZi5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gb3V0O1xuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgc2VsZi5jYW5jZWwoKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIC8vIGlmIHRoZXJlJ3MgYSBjYWxsYmFjaywgdGhlbiB0aGUgY2FsbGJhY2sgY2FuIHJlY2VpdmVcbiAgICAgIC8vIHRoZSBlcnJvciBldmVudFxuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdGhlcmUncyBubyBjYWxsYmFjaywgdGhlbiB3ZSdyZSBzYWZlIHRvIGVtaXQgYW4gZXJyb3JcbiAgICAgIC8vIGV2ZW50LCB3aGljaCB3b3VsZCBvdGhlcndpc2UgdGhyb3cgYW4gdW5oYW5kbGVkIGVycm9yXG4gICAgICAvLyBkdWUgdG8gJ2Vycm9yJyBiZWluZyBhIHNwZWNpYWwgZXZlbnQgaW4gRXZlbnRFbWl0dGVyc1xuICAgICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfVxuICAgIHNlbGYucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAvLyBubyBzZW5zZSB0aHJvd2luZyBpZiB3ZSdyZSBhbHJlYWR5IGVtaXR0aW5nIGFuICdlcnJvcicgZXZlbnRcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xuXG4gIHRoaXMudGhlbiA9IGZ1bmN0aW9uIChzdWNjZXNzLCBlcnIpIHtcbiAgICByZXR1cm4gcHJvbWlzZS50aGVuKHN1Y2Nlc3MsIGVycik7XG4gIH07XG5cbiAgdGhpcy5jYXRjaCA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICByZXR1cm4gcHJvbWlzZS5jYXRjaChlcnIpO1xuICB9O1xufVxuXG5TeW5jLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghdGhpcy5jYW5jZWxlZCkge1xuICAgIHRoaXMuY2FuY2VsZWQgPSB0cnVlO1xuICAgIHRoaXMucHVzaC5jYW5jZWwoKTtcbiAgICB0aGlzLnB1bGwuY2FuY2VsKCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHJlcGxpY2F0aW9uKFBvdWNoREIpIHtcbiAgUG91Y2hEQi5yZXBsaWNhdGUgPSByZXBsaWNhdGU7XG4gIFBvdWNoREIuc3luYyA9IHN5bmM7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFBvdWNoREIucHJvdG90eXBlLCAncmVwbGljYXRlJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogZnVuY3Rpb24gKG90aGVyLCBvcHRzLCBjYWxsYmFjaykge1xuICAgICAgICAgIHJldHVybiBzZWxmLmNvbnN0cnVjdG9yLnJlcGxpY2F0ZShvdGhlciwgc2VsZiwgb3B0cywgY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICB0bzogZnVuY3Rpb24gKG90aGVyLCBvcHRzLCBjYWxsYmFjaykge1xuICAgICAgICAgIHJldHVybiBzZWxmLmNvbnN0cnVjdG9yLnJlcGxpY2F0ZShzZWxmLCBvdGhlciwgb3B0cywgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG5cbiAgUG91Y2hEQi5wcm90b3R5cGUuc3luYyA9IGZ1bmN0aW9uIChkYk5hbWUsIG9wdHMsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3Iuc3luYyh0aGlzLCBkYk5hbWUsIG9wdHMsIGNhbGxiYWNrKTtcbiAgfTtcbn1cblxuUG91Y2hEQi5wbHVnaW4oSURCUG91Y2gpXG4gIC5wbHVnaW4oV2ViU3FsUG91Y2gpXG4gIC5wbHVnaW4oSHR0cFBvdWNoJDEpXG4gIC5wbHVnaW4obWFwcmVkdWNlKVxuICAucGx1Z2luKHJlcGxpY2F0aW9uKTtcblxuLy8gUHVsbCBmcm9tIHNyYyBiZWNhdXNlIHBvdWNoZGItbm9kZS9wb3VjaGRiLWJyb3dzZXIgdGhlbXNlbHZlc1xuLy8gYXJlIGFnZ3Jlc3NpdmVseSBvcHRpbWl6ZWQgYW5kIGpzbmV4dDptYWluIHdvdWxkIG5vcm1hbGx5IGdpdmUgdXMgdGhpc1xuLy8gYWdncmVzc2l2ZSBidW5kbGUuXG5cbm1vZHVsZS5leHBvcnRzID0gUG91Y2hEQjsiXX0=
