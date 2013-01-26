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
var cluster = require('cluster');
var http = require('http');
var mockLogger = require('./fixtures/logger');
var path = require('path');
var Bowl = require('../lib/bowl');


describe('bowl', function() {

  var bowl = null;
  var worker = path.join(global.dir.fixtures, 'worker.js');
  var plugin = path.join(global.dir.fixtures, 'plugin.js');


  beforeEach(function(done) {
    done();
  });

  afterEach(function(done) {
    if (bowl) {
      bowl.removeAllListeners();
      bowl.dispose();
    }
    done();
  });


  it('Smoke test (start and shutdown)', function(done) {
    bowl = new Bowl({exec: worker}, mockLogger);
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
      assert(bowl.isRunning(), 'should be a running status');
      process.nextTick(function() {
        bowl.stop(function() {
          done();
        });
      });
    });
  });

  it('Restart', function(done) {
    bowl = new Bowl({exec: worker}, mockLogger);
    bowl.on('restart', function(evt) {
      bowl.stop(function() {
        process.nextTick(function() {
          done();
        });
      });
    });
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
      process.nextTick(function() {
        bowl.restart(false);
      });
    });
  });

  it('Restart gracefully', function(done) {
    bowl = new Bowl({exec: worker}, mockLogger);
    bowl.on('restart', function(evt) {
      bowl.stop(function() {
        process.nextTick(function() {
          done();
        });
      });
    });
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
      process.nextTick(function() {
        bowl.restart(true);
      });
    });
  });

  it('Restart worker if killed', function(done) {
    bowl = new Bowl({exec: worker}, mockLogger);
    bowl.on('worker.respawn', function(evt) {
      bowl.stop(function() {
        process.nextTick(function() {
          done();
        });
      });
    });
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
      process.nextTick(function() {
        // kill worker
        var pids = bowl.getWorkerPids();
        assert.ok(pids.length > 0, 'worker is existed');
        process.kill(pids[0], 'SIGQUIT');
      });
    });
  });

  it('Handle SIGUSR2 signal', function(done) {
    bowl = new Bowl({exec: worker}, mockLogger);
    bowl.on('restart', function(evt) {
      bowl.stop(function() {
        process.nextTick(function() {
          done();
        });
      });
    });
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
      process.nextTick(function() {
        process.kill(process.pid, 'SIGUSR2');
      });
    });
  });

  it('Mixin plugins', function(done) {
    bowl = new Bowl({exec: worker, plugins: [plugin]}, mockLogger);
    bowl.on('plugin.included', function(evt) {
      bowl.on('start', function(evt) {
        bowl.stop(function() {
          process.nextTick(function() {
            done();
          });
        });
      });
    });
    bowl.run(function(err) {
      if (err) {
        assert(false, 'Failed to start workers');
      }
    });
  });

});
