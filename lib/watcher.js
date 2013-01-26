/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('./utility');


/**
 * Expose `Watcher`
 */

module.exports = Watcher;


/**
 * @param {winston.Logger} logger .
 * @constructor
 * @extends {EventEmitter}
 */
function Watcher(logger) {
  EventEmitter.call(this);
  this.targets_ = [];
  this.logger_ = logger;
}
util.inherits(Watcher, EventEmitter);


/**
 * @type {Array.<string>}
 * @private
 */
Watcher.prototype.targets_;


/**
 * @type {winston.Logger}
 * @private
 */
Watcher.prototype.logger_;


/**
 * @param {Array.<string>} files .
 */
Watcher.prototype.watches = function(files) {
  if (!Array.isArray(files)) {
    return;
  }
  var self = this;

  files.forEach(function(file) {
    self.watch(file);
  });
};


/**
 * @param {string} dir .
 */
Watcher.prototype.watchChildDirectory = function(dir) {
  var self = this;

  fs.readdir(dir, function(err, files) {
    if (err) {
      self.logger_.error(err.message);
      self.emit('error.watch', err.message);
      return;
    }
    files.forEach(function(file) {
      var realPath = path.join(dir, file);
      fs.stat(realPath, function(err, stats) {
        if (err) {
          self.logger_.error(err.message);
          self.emit('error.watch', err.message);
          return;
        }
        if (stats.isDirectory()) {
          self.watch(realPath);
        }
      });
    });
  });
};


/**
 * @param {string} file The directory or file.
 * @param {Function=} opt_callback .
 */
Watcher.prototype.watch = function(file, opt_callback) {
  var self = this;
  var realPath = path.resolve(process.cwd(), file);

  var fn = !!fs.watchFile ? this.watchFile_ : this.watchFileFallback_;
  fn.call(this, realPath, function(stats) {
    if (stats.isDirectory()) {
      self.watchChildDirectory(realPath);
    }
    process.nextTick(function() {
      opt_callback && opt_callback();
    });
  });
};


/**
 * @param {string} file .
 * @param {Function} callback .
 * @private
 */
Watcher.prototype.watchFile_ = function(file, callback) {
  var self = this;
  var options = {interval: 2000, persistent: true};

  fs.stat(file, function(err, stats) {
    if (err) {
      self.logger_.error(err.message);
      self.emit('error.watch', err.message);
      return;
    }

    try {
      fs.watchFile(file, options, function(current, prev) {
        if (current && +current.mtime > +prev.mtime) {
          self.logger_.debug(util.format('%s has been modified', file));
          self.emit('watch');
        }
      });
    } catch (err) {
      self.watchFileFallback_(file, callback);
      return;
    }
    self.addTarget(file);

    process.nextTick(function() {
      callback(stats);
    });
  });
};


/**
 * @param {string} file .
 * @param {Function} callback .
 * @private
 */
Watcher.prototype.watchFileFallback_ = function(file, callback) {
  var self = this;
  var options = {persistent: true};
  var prev = null;

  // filename is not supported when MacOSX
  var watchListener = function(evt) {
    if (evt !== 'change' && evt !== 'rename') {
      return;
    }
    fs.stat(file, function(err, current) {
      if (err) {
        self.logger_.error(err.message);
        self.emit('error.watch', err.message);
        return;
      }
      if (current.size !== prev.size || +current.mtime > +prev.mtime) {
        prev = current; // save new stats
        self.logger_.debug(util.format('%s has been modified', file));
        self.emit('watch');
      }
    });
  };

  fs.stat(file, function(err, stats) {
    if (err) {
      self.logger_.error(err.message);
      self.emit('error.watch', err.message);
      return;
    }
    prev = stats;
    fs.watch(file, options, watchListener);
    self.addTarget(file);

    process.nextTick(function() {
      callback(stats);
    });
  });
};


/**
 * @param {string} target .
 */
Watcher.prototype.addTarget = function(target) {
  if (this.targets_ && 0 > this.targets_.indexOf(target)) {
    this.targets_.push(target);
  }
};


/**
 * Dispose all objects and listeners.
 *
 * @protected
 */
Watcher.prototype.dispose = function() {
  this.targets_.forEach(function(target) {
    try {
      fs.unwatchFile && fs.unwatchFile(target);
    } catch (err) {
      // nothing to do
    }
  });
  this.targets_ = null;
};
