"use strict";

if (typeof module !== undefined && module.exports) {
  require('../lib/deps/es5_shims');
}

QUnit.module("es5", {
});

test("Array.prototype.map", 1, function () {
  deepEqual([1, 2, 3, 4].map(function (x) { return x.toString(); }), ["1", "2", "3", "4"]);
});

test("Object.keys", 2, function () {
  ok(Object.keys, 'has Object.keys');
  deepEqual(Object.keys({1 : 'foo', 2: 'bar', "3" : 'baz'}), ["1", "2", "3"]);
});

test("Array.isArray", 10, function () {
  ok(Array.isArray, 'has Array.isArray');
  ok(!Array.isArray(undefined));
  ok(!Array.isArray(null));
  ok(!Array.isArray(""));
  ok(!Array.isArray("foo"));
  ok(!Array.isArray(1));
  ok(!Array.isArray({}));
  ok(!Array.isArray(new Date()));
  ok(Array.isArray([]));
  ok(Array.isArray([1, 2, 3]));
});

test("Array.prototype.forEach", 4, function () {
  [0, 1, 2, 3].forEach(function (element, idx) {
    equal(element, idx);
  });
});

test("Array.prototype.reduce", 2, function () {
  var flattened = [[0, 1], [2, 3], [4, 5]].reduce(function (a, b) {
    return a.concat(b);
  });
  deepEqual(flattened, [0, 1, 2, 3, 4, 5]);

  var total = [0, 1, 2, 3].reduce(function (a, b) {
    return a + b;
  });
  equal(total, 6);
});