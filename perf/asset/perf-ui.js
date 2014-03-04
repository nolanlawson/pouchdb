;(function(window) {
  'use strict';

  /** The base path of the builds */
  var basePath = '../';

  /** The Lo-Dash build to load */
  var build = (build = /build=([^&]+)/.exec(location.search)) && decodeURIComponent(build[1]);

  /** The other library to load */
  var other = (other = /other=([^&]+)/.exec(location.search)) && decodeURIComponent(other[1]);

  /** The `ui` object */
  var ui = {};

  /*--------------------------------------------------------------------------*/

  /**
   * Registers an event listener on an element.
   *
   * @private
   * @param {Element} element The element.
   * @param {string} eventName The name of the event.
   * @param {Function} handler The event handler.
   * @returns {Element} The element.
   */
  function addListener(element, eventName, handler) {
    if (typeof element.addEventListener != 'undefined') {
      element.addEventListener(eventName, handler, false);
    } else if (typeof element.attachEvent != 'undefined') {
      element.attachEvent('on' + eventName, handler);
    }
  }

  /*--------------------------------------------------------------------------*/

  // initialize controls
  addListener(window, 'load', function() {
    function eventHandler(event) {
      var buildIndex = buildList.selectedIndex,
          otherIndex = otherList.selectedIndex,
          search = location.search.replace(/^\?|&?(?:build|other)=[^&]*&?/g, '');

      if (event.stopPropagation) {
        event.stopPropagation();
      } else {
        event.cancelBubble = true;
      }
      location.href =
        location.href.split('?')[0] + '?' +
        (search ? search + '&' : '') +
        'build=' + (buildIndex < 0 ? build : buildList[buildIndex].value) + '&' +
        'other=' + (otherIndex < 0 ? other : otherList[otherIndex].value);
    }

    var span1 = document.createElement('span');
    span1.style.cssText = 'float:right';
    span1.innerHTML =
      '<label for="perf-build">Build: </label>' +
      '<select id="perf-build">' +
      '<option value="pouchdb-nightly">PouchDB nightly</option>' +
      '<option value="pouchdb-200">PouchDB v2.0.0</option>' +
      '<option value="pouchdb-110">PouchDB v1.1.0</option>' +
      '</select>';

    var span2 = document.createElement('span');
    span2.style.cssText = 'float:right';
    span2.innerHTML =
      '<label for="perf-other">Other Library: </label>' +
      '<select id="perf-other">' +
      '<option value="pouchdb-200">PouchDB v2.0.0</option>' +
      '<option value="pouchdb-110">PouchDB v1.1.0</option>' +
      '</select>';

    var buildList = span1.lastChild,
        otherList = span2.lastChild,
        toolbar = document.getElementById('perf-toolbar');

    toolbar.appendChild(span2);
    toolbar.appendChild(span1);

    buildList.selectedIndex = (function() {
      switch (build) {
        case 'pouchdb-nightly':     return 0;
        case 'pouchdb-200':       return 1;
        case 'pouchdb-110':       return 2;
        case null:                return 0;
      }
      return -1;
    }());

    otherList.selectedIndex = (function() {
      switch (other) {
        case 'pouchdb-200':       return 0;
        case 'pouchdb-110':       return 1;
        case null:                return 0;
      }
      return -1;
    }());

    addListener(buildList, 'change', eventHandler);
    addListener(otherList, 'change', eventHandler);
  });

  // expose Lo-Dash build file path
  ui.buildName = (function() {
    var result;
    switch (build) {
      case 'pouchdb-nightly':     result = 'pouchDB'; break;
      case 'pouchdb-200':         result = 'pouchDBVersion200'; break;
      case 'pouchdb-110':         result = 'pouchDBVersion110'; break;
      default:                    result = 'pouchDB';
    }
    return result;
  }());

  // expose other library file path
  ui.otherName = (function() {
    var result;
    switch (other) {
      case 'pouchdb-200':       result = 'pouchDBVersion200'; break;
      case 'pouchdb-110':       result = 'pouchDBVersion110'; break;
      default:                  result = 'pouchDBVersion200';
    }
    return result;
  }());

  // expose `ui.urlParams` properties
  ui.urlParams = {
    'build': build,
    'other': other
  };

  // expose `ui`
  window.ui = ui;

}(this));
