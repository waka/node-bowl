/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var assert = require('./support/helper').assert;
var _ = require('../lib/utility');


describe('utility', function() {

  var testObj = {
    a: 'aaa',
    b: [1,2,3],
    c: {
      d: true,
      e: [1,2,3],
      f: {
        g: 'ggg'
      }
    },
    h: undefined,
    i: null
  };
  var testArr = ['aaa', 1, true, [1,2,3], {a: 'aaa'}, undefined, null];


  it('extend object', function(done) {
    var result = _.extend({}, testObj);
    assert.deepEqual(result, testObj, 'not equal to object');

    result = _.extend({a: 'aa', j: 'jj'}, testObj);
    assert.equal(result.a, 'aaa', 'overwrite value if there is same key');
    assert.equal(result.j, 'jj', 'maintain original value if there is not key');

    done();
  });

  it('extend array', function(done) {
    var result = _.extend([], testArr);
    assert.deepEqual(result, testArr, 'not equal to array');

    result = _.extend([1], testArr);
    assert.deepEqual(result, testArr, 'not maintain original value if array');

    done();
  });

  it('not extend if target is primitive', function(done) {
    var result = _.extend('', testObj);
    assert.equal(result, '', 'primitive should not be extended');

    result = _.extend(1, testObj);
    assert.equal(result, 1, 'primitive should not be extended');

    result = _.extend(false, testObj);
    assert.equal(result, false, 'primitive should not be extended');

    result = _.extend(undefined, testObj);
    assert.equal(result, undefined, 'primitive should not be extended');

    result = _.extend(null, testObj);
    assert.equal(result, null, 'primitive should not be extended');

    done();
  });

  it('not extend if source is primitive', function(done) {
    var obj = {foo: 'bar'};

    var result = _.extend(obj, '');
    assert.notEqual(result, '', 'should not be extended with priitive');

    var result = _.extend(obj, 1);
    assert.notEqual(result, 1, 'should not be extended with priitive');

    var result = _.extend(obj, false);
    assert.notEqual(result, false, 'should not be extended with priitive');

    var result = _.extend(obj, undefined);
    assert.notEqual(result, undefined, 'should not be extended with priitive');

    var result = _.extend(obj, null);
    assert.notEqual(result, null, 'should not be extended with priitive');

    done();
  });


  it('is object?', function(done) {
    assert(_.isObject({}) === true, 'oops');
    assert(_.isObject([]) === false, 'oops');
    assert(_.isObject('aaa') === false, 'oops');
    assert(_.isObject(123) === false, 'oops');
    assert(_.isObject(true) === false, 'oops');
    assert(_.isObject(undefined) === false, 'oops');
    assert(_.isObject(null) === false, 'oops');

    done();
  });

});
