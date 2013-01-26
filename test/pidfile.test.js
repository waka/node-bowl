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
var fs = require('fs');
var path = require('path');
var pidfile = require('../lib/pidfile');


describe('pidfile', function() {

  var file = path.join(global.dir.root, 'test.pid');


  after(function(done) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    done();
  });


  it('write pid in "test/tmp/test.pid"', function(done) {
    pidfile.writeFileSync(file, 10);
    var existence = fs.existsSync(file);
    assert(existence, 'test.pid should exist');
    done();
  });

  it('unlink "test/tmp/test.pid"', function(done) {
    pidfile.unlinkSync(file);
    var noExistence = !fs.existsSync(file);
    assert(noExistence, 'test.pid should not exist');
    done();
  });

});
