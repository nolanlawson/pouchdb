;(function() {

  /** Used to access the Firebug Lite panel (set by `run`) */
  var fbPanel;

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used as a reference to the global object */
  var root = typeof global == 'object' && global || this;

  /** Method and object shortcuts */
  var phantom = root.phantom,
      amd = root.define && define.amd,
      argv = root.process && process.argv,
      document = !phantom && root.document,
      noop = function() {},
      params = root.arguments,
      system = root.system;

  /** Add `console.log()` support for Narwhal, Rhino, and RingoJS */
  var console = root.console || (root.console = { 'log': root.print });

  /** The file path of the Lo-Dash file to test */
  var filePath = (function() {
    var min = 0,
        result = [];

    if (phantom) {
      result = params = phantom.args;
    } else if (system) {
      min = 1;
      result = params = system.args;
    } else if (argv) {
      min = 2;
      result = params = argv;
    } else if (params) {
      result = params;
    }
    var last = result[result.length - 1];
    result = (result.length > min && !/perf(?:\.js)?$/.test(last)) ? last : '../lodash.js';

    if (!amd) {
      try {
        result = require('fs').realpathSync(result);
      } catch(e) { }

      try {
        result = require.resolve(result);
      } catch(e) { }
    }
    return result;
  }());

  /** Used to match path separators */
  var rePathSeparator = /[\/\\]/;

  /** Used to detect primitive types */
  var rePrimitive = /^(?:boolean|number|string|undefined)$/;

  /** Used to match RegExp special characters */
  var reSpecialChars = /[.*+?^=!:${}()|[\]\/\\]/g;

  /** The `ui` object */
  var ui = root.ui || (root.ui = {
    'buildName': 'pouchDB',
    'otherName': 'pouchDBVersion200'
  });

  var buildName = root.buildName = root.ui.buildName;
  var otherName = root.otherName = root.ui.otherName;

  /** Used to score performance */
  var score = { 'a': [], 'b': [] };

  /** Used to queue benchmark suites */
  var suites = [];

  /** Used to resolve a value's internal [[Class]] */
  var toString = Object.prototype.toString;

  /** Detect if in a browser environment */
  var isBrowser = isHostType(root, 'document') && isHostType(root, 'navigator');

  /** Detect if in a Java environment */
  var isJava = !isBrowser && /Java/.test(toString.call(root.java));

  /** Use a single "load" function */
  var load = (typeof require == 'function' && !amd)
    ? require
    : (isJava && root.load) || noop;

  /** Load Lo-Dash */
  var lodash = root._;

  /** Load PouchDB */
  var PouchDB = root.PouchDB;
  var PouchDBVersion110 = root.PouchDBVersion110;
  var PouchDBVersion200 = root.PouchDBVersion200;

  /** Load Benchmark.js */
  var Benchmark = root.Benchmark || (root.Benchmark = (
    Benchmark = load('../vendor/benchmark.js/benchmark.js') || root.Benchmark,
    Benchmark = Benchmark.Benchmark || Benchmark,
    Benchmark.runInContext(lodash.extend({}, root, { '_': lodash }))
  ));

  var formatNumber = Benchmark.formatNumber;

  window.root = root;

  /*--------------------------------------------------------------------------*/

  /**
   * Gets the basename of the given `filePath`. If the file `extension` is passed,
   * it will be removed from the basename.
   *
   * @private
   * @param {string} path The file path to inspect.
   * @param {string} extension The extension to remove.
   * @returns {string} Returns the basename.
   */
  function basename(filePath, extension) {
    var result = (filePath || '').split(rePathSeparator).pop();
    return (arguments.length < 2)
      ? result
      : result.replace(RegExp(extension.replace(reSpecialChars, '\\$&') + '$'), '');
  }

  /**
   * Computes the geometric mean (log-average) of an array of values.
   * See http://en.wikipedia.org/wiki/Geometric_mean#Relationship_with_arithmetic_mean_of_logarithms.
   *
   * @private
   * @param {Array} array The array of values.
   * @returns {number} The geometric mean.
   */
  function getGeometricMean(array) {
    return Math.pow(Math.E, lodash.reduce(array, function(sum, x) {
      return sum + Math.log(x);
    }, 0) / array.length) || 0;
  }

  /**
   * Gets the Hz, i.e. operations per second, of `bench` adjusted for the
   * margin of error.
   *
   * @private
   * @param {Object} bench The benchmark object.
   * @returns {number} Returns the adjusted Hz.
   */
  function getHz(bench) {
    var result = 1 / (bench.stats.mean + bench.stats.moe);
    return isFinite(result) ? result : 0;
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of "object", "function", or "unknown".
   *
   * @private
   * @param {*} object The owner of the property.
   * @param {string} property The property to check.
   * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    if (object == null) {
      return false;
    }
    var type = typeof object[property];
    return !rePrimitive.test(type) && (type != 'object' || !!object[property]);
  }

  /**
   * Logs text to the console.
   *
   * @private
   * @param {string} text The text to log.
   */
  function log(text) {
    console.log(text + '');
    if (fbPanel) {
      // scroll the Firebug Lite panel down
      fbPanel.scrollTop = fbPanel.scrollHeight;
    }
  }

  /**
   * Runs all benchmark suites.
   *
   * @private (@public in the browser)
   */
  function run() {
    fbPanel = (fbPanel = root.document && document.getElementById('FirebugUI')) &&
      (fbPanel = (fbPanel = fbPanel.contentWindow || fbPanel.contentDocument).document || fbPanel) &&
      fbPanel.getElementById('fbPanel1');

    log('\nSit back and relax, this may take a while.');
    suites[0].run({ 'async': !isJava });
  }

  /*--------------------------------------------------------------------------*/

  lodash.extend(Benchmark.Suite.options, {
    'onStart': function() {
      log('\n' + this.name + ':');
    },
    'onCycle': function(event) {
      log(event.target);
    },
    'onComplete': function() {
      for (var index = 0, length = this.length; index < length; index++) {
        var bench = this[index];
        if (bench.error) {
          console.log(bench.error);
          var errored = true;
        }
      }
      if (errored) {
        log('There was a problem, skipping...');
      }
      else {
        var fastest = this.filter('fastest'),
            fastestHz = getHz(fastest[0]),
            slowest = this.filter('slowest'),
            slowestHz = getHz(slowest[0]),
            aHz = getHz(this[0]),
            bHz = getHz(this[1]);

        if (fastest.length > 1) {
          log('It\'s too close to call.');
          aHz = bHz = slowestHz;
        }
        else {
          var percent = ((fastestHz / slowestHz) - 1) * 100;

          log(
            fastest[0].name + ' is ' +
            formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent)) +
            '% faster.'
          );
        }
        // add score adjusted for margin of error
        score.a.push(aHz);
        score.b.push(bHz);
      }
      // remove current suite from queue
      suites.shift();

      if (suites.length) {
        // run next suite
        suites[0].run({ 'async': !isJava });
      }
      else {
        var aMeanHz = getGeometricMean(score.a),
            bMeanHz = getGeometricMean(score.b),
            fastestMeanHz = Math.max(aMeanHz, bMeanHz),
            slowestMeanHz = Math.min(aMeanHz, bMeanHz),
            xFaster = fastestMeanHz / slowestMeanHz,
            percentFaster = formatNumber(Math.round((xFaster - 1) * 100)),
            message = 'is ' + percentFaster + '% ' + (xFaster == 1 ? '' : '(' + formatNumber(xFaster.toFixed(2)) + 'x) ') + 'faster than';

        // report results
        if (aMeanHz >= bMeanHz) {
          log('\n' + buildName + ' ' + message + ' ' + otherName + '.');
        } else {
          log('\n' + otherName + ' ' + message + ' ' + buildName + '.');
        }
      }
    }
  });

  /*--------------------------------------------------------------------------*/

  lodash.extend(Benchmark.options, {
    'async': true,
    'setup': '\
      var pouchDB = new root.PouchDB("foo"),\
          pouchDBVersion110 = new root.PouchDBVersion110("bar"),\
          pouchDBVersion200 = new root.PouchDBVersion200("baz");\
          \
          '
  });

  /*--------------------------------------------------------------------------*/

  function replaceDB(pouchName, script) {
    return script.replace(/POUCH/g, pouchName);
  }

  suites.push(
    Benchmark.Suite('db.get() on missing document')
      .add(buildName, replaceDB(buildName, '\
        POUCH.get("foo")'
      ))
      .add(otherName, replaceDB(otherName, '\
        POUCH.get("bar")'
      ))
  );


  /*--------------------------------------------------------------------------*/

  if (Benchmark.platform + '') {
    log(Benchmark.platform);
  }
  // in the browser, expose `run` to be called later
  if (document) {
    root.run = run;
  } else {
    run();
  }
}.call(this));
