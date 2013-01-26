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
var mockLogger = require('./fixtures/logger');
var path = require('path');
var Watcher = require('../lib/watcher');


describe('Watcher', function() {

  var watcher = null;
  var okDir    = global.dir.watch;
  var okSubDir = path.join(okDir, 'sub');
  var ngDir    = path.join(okDir, 'not_exist');
  var okFile      = path.join(okDir, 'test.txt');
  var okFile2     = path.join(okSubDir, 'test2.txt');
  var ngFile      = path.join(okDir, 'test_not_exist.txt');
  var renameFile  = path.join(okDir, 'test_rename.txt');
  var renameFile2 = path.join(okSubDir, 'test2_rename.txt');
  var newFile     = path.join(okDir, 'test_new.txt');


  beforeEach(function(done) {
    watcher = new Watcher(mockLogger);
    done();
  });

  afterEach(function(done) {
    if (watcher) {
      watcher.dispose();
      watcher = null;
    }
    process.nextTick(function() {
      done();
    });
  });

  after(function(done) {
    if (!fs.existsSync(okFile)) {
      fs.writeFileSync(okFile, '');
    }
    if (!fs.existsSync(okFile2)) {
      fs.writeFileSync(okFile2, '');
    }
    if (fs.existsSync(renameFile)) {
      fs.unlinkSync(renameFile);
    }
    if (fs.existsSync(renameFile2)) {
      fs.unlinkSync(renameFile2);
    }
    if (fs.existsSync(newFile)) {
      fs.unlinkSync(newFile);
    }
    done();
  });


  it('Smoke test (instantiate)', function(done) {
    assert(watcher !== null, 'Could not instantiated');
    done();
  });


  it('Watch file that exists', function(done) {
    watcher.watch(okFile, function() {
      done();
    });
  });

  it('Throw "error.watch" event if watch file does not exist', function(done) {
    watcher.on('error.watch', function(msg) {
      done();
    });
    watcher.watch(ngFile, function() {});
  });

  it('Watch directory that exists', function(done) {
    watcher.watch(okDir, function() {
      setTimeout(function() {
        done();
      }, 1000);
    });
  });

  it('Throw "error.watch" event if watch directory does not exist', function(done) {
    watcher.on('error.watch', function(msg) {
      done();
    });
    watcher.watch(ngDir, function() {
      assert(false, 'Did not dispatched event');
    });
  });


  it('Throw "watch" event if watched file has saved', function(done) {
    watcher.on('watch', function() {
      done();
    });
    watcher.watch(okFile, function() {
      fs.writeFile(okFile, 'test', function(err) {
        if (err) {
          assert(false, 'Did not write file');
        }
      });
    });
  });

  it('Not throw "watch" event if watched file has renamed', function(done) {
    watcher.on('error.watch', function(msg) {
      assert(false, msg);
    });
    watcher.watch(okFile, function() {
      fs.rename(okFile, renameFile, function(err) {
        if (err) {
          assert(false, 'Did not rename file');
        }
      });
    });
    setTimeout(function() {
      done();
    }, 1000);
  });

  it('Not throw "watch" event if watched file has deleted', function(done) {
    watcher.on('error.watch', function(msg) {
      assert(false, msg);
    });
    watcher.watch(renameFile, function() {
      fs.unlink(renameFile, function(err) {
        if (err) {
          assert(false, 'Did not unlink file');
        }
      });
    });
    setTimeout(function() {
      done();
    }, 1000);
  });


  it('Throw "watch" event if added new file into watched directory', function(done) {
    watcher.on('watch', function() {
      done();
    });
    watcher.watch(okDir, function() {
      setTimeout(function() {
        fs.writeFile(newFile, 'test', function(err) {
          if (err) {
            assert(false, 'Did not write file');
          }
        });
      }, 1000);
    });
  });

  it('Throw "watch" event if saved file into watched directory', function(done) {
    watcher.on('watch', function() {
      done();
    });
    watcher.watch(okDir, function() {
      setTimeout(function() {
        fs.writeFile(okFile, 'test\ntest', function(err) {
          if (err) {
            assert(false, 'Did not write file');
          }
        });
      }, 1000);
    });
  });

  it('Throw "watch" event if renamed file into watched directory', function(done) {
    watcher.on('watch', function() {
      done();
    });
    watcher.watch(okDir, function() {
      setTimeout(function() {
        fs.rename(okFile2, renameFile2, function(err) {
          if (err) {
            assert(false, 'Did not rename file');
          }
        });
      }, 1000);
    });
  });

  it('Throw "watch" event if deleted file into watched directory', function(done) {
    watcher.on('watch', function() {
      done();
    });
    watcher.on('error.watch', function(msg) {
      assert(false, msg);
    });
    watcher.watch(okDir, function() {
      setTimeout(function() {
        fs.unlink(renameFile2, function(err) {
          if (err) {
            assert(false, 'Did not unlink file');
          }
        });
      }, 1000);
    });
  });

});
