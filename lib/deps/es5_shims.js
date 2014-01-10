// some small shims for es5 just for the features we commonly use
// some of this is copied from https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
'use strict';

var isNode = typeof module !== 'undefined' && module.exports;

if (!isNode) {

  if (!Object.keys) {
    Object.keys = function (object) {

      if ((typeof object !== 'object' && typeof object !== 'function') || object === null) {
        throw new TypeError('Object.keys called on a non-object');
      }

      var mykeys = [];
      for (var name in object) {
        if (Object.prototype.hasOwnProperty.call(object, name)) {
          mykeys.push(name);
        }
      }
      return mykeys;
    };
  }

  if (!Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function (action, that /*opt*/) {
      for (var i = 0, n = this.length; i < n; i++) {
        if (i in this) {
          action.call(that, this[i], i, this);
        }
      }
    };
  }

  if (!('map' in Array.prototype)) {
    Array.prototype.map = function (mapper, that /*opt*/) {
      var other = new Array(this.length);
      for (var i = 0, n = this.length; i < n; i++) {
        if (i in this) {
          other[i] = mapper.call(that, this[i], i, this);
        }
      }
      return other;
    };
  }

  // from Moz: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
  if (!('reduce' in Array.prototype)) {
    Array.prototype.reduce = function (callback, opt_initialValue) {
      if (null === this || 'undefined' === typeof this) {
        // At the moment all modern browsers, that support strict mode, have
        // native implementation of Array.prototype.reduce. For instance, IE8
        // does not support strict mode, so this check is actually useless.
        throw new TypeError(
          'Array.prototype.reduce called on null or undefined');
      }
      if ('function' !== typeof callback) {
        throw new TypeError(callback + ' is not a function');
      }
      var index, value,
        length = this.length >>> 0,
        isValueSet = false;
      if (1 < arguments.length) {
        value = opt_initialValue;
        isValueSet = true;
      }
      for (index = 0; length > index; ++index) {
        if (this.hasOwnProperty(index)) {
          if (isValueSet) {
            value = callback(value, this[index], index, this);
          }
          else {
            value = this[index];
            isValueSet = true;
          }
        }
      }
      if (!isValueSet) {
        throw new TypeError('Reduce of empty array with no initial value');
      }
      return value;
    };
  }


  if (!('addEventListener' in window)) {
    window.addEventListener = window.attachEvent; // older IE requires this
  }
}