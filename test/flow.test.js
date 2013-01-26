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
var Flow = require('../lib/flow');


/**
 * n times loop.
 */
var times = function(t, fn) {
  var arr = new Array(t);
  for (var i = 0, len = arr.length; i < len; i++) {
    fn();
  }
};


describe('Flow', function() {

  var flow = null;


  beforeEach(function(done) {
    flow = new Flow();
    done();
  });

  afterEach(function(done) {
    flow.stop();
    flow = null;
    done();
  });


  it('On the fire', function(done) {
    flow.start(3, function() {
      done();
    });
    times(3, function() {
      flow.countup();
    });
  });

  it('restart again if already started', function(done) {
    flow.start(3, function() {
      assert(false, 'Should not reach here');
    });
    times(1, function() {
      flow.countup();
    });
    flow.start(3, function() {
      done();
    });
    times(3, function() {
      flow.countup();
    });
  });
});
