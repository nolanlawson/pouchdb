/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict';

window.app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function () {
    var script = document.createElement('script');
    script.src = 'tests/all-test-files.js';
    document.getElementsByTagName('body')[0].appendChild(script);
    var intervalId = window.setInterval(function () {
      if (window.allTestFiles) {
        clearInterval(intervalId);
        window.app.init('deviceready');
      }
    }, 10);
  },
  // Update DOM on a Received Event
  init: function (id) {
    var testFile = document.getElementById("testfile");
    var testFiles = window.allTestFiles.slice().sort();
    for (var i = 0; i < testFiles.length; i++) {
      var file = testFiles[i];
      testFile.options[testFile.options.length] = new Option(file, file);
    }
    var host = document.getElementById("host");
    if (window.localStorage && window.localStorage['couchdb_host']) {
      host.value = window.localStorage['couchdb_host'];
    } else {
      host.value = 'http://10.0.2.2:5984';
    }

    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.receivedarea');

    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');

    console.log('Initialized!');
  },
  // go to test page
  test: function () {
    var testFile = document.getElementById("testfile");
    var host = document.getElementById("host");

    if (window.localStorage) {
      window.localStorage['couchdb_host'] = host.value;
    }

    var url = "tests/test.html?host=" + host.value;
    if (testFile.value) {
      url += "&grep=" + testFile.value.match(/([^\.]+)\.js/)[1];
    }
    console.log('url is ' + url);

    window.location = url;
  }
};
