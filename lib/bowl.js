/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var cluster = require('cluster');
var Domain = require('domain');
var EventEmitter = require('events').EventEmitter;
var Flow = require('./flow');
var fs = require('fs');
var logger = require('./logger');
var path = require('path');
var pidfile = require('./pidfile');
var util = require('util');
var Watcher = require('./watcher');
var _ = require('./utility');


/**
 * Expose `Bowl`
 */

exports = module.exports = Bowl;


/**
 * Version.
 *
 * @type {string}
 */
exports.version = '0.0.1';


/**
 * @param {Object} config .
 * @param {winston.Logger=} opt_logger .
 * @constructor
 * @extends {EventEmitter}
 */
function Bowl(config, opt_logger) {
  EventEmitter.call(this);

  if (!config || !_.isObject(config)) {
    throw new Error('"config and config.exec" must be required');
  }
  if (!config.hasOwnProperty('exec') || typeof config.exec !== 'string') {
    throw new Error('"exec" must be required and string');
  }

  this.config_ = _.extend({
    forks: require('os').cpus().length,
    watch: process.env.NODE_ENV === 'production' ? null : ['.'],
    lifetime: 3000,
    plugins: [],
    pidfile: path.join(process.cwd(), 'bowl.pid')
  }, config);
  // lock config object
  Object.freeze(this.config_);

  this.logger_ = opt_logger || 
                 logger.createLogger(config.loglevel, config.logdir);
  this.logger_.debug(util.format('%j', this.config_));

  this.forkFlow_ = new Flow();
  this.killFlow_ = new Flow();

  this.plugins_ = [];
  this.destroyTimers_ = {};
  this.watcher_ = null;
  this.watchTimer_ = null;
}
util.inherits(Bowl, EventEmitter);


/**
 * @type {Object}
 * @private
 */
Bowl.prototype.config_;


/**
 * @type {winston.Logger}
 * @private
 */
Watcher.prototype.logger_;


/**
 * @type {Flow}
 * @private
 */
Watcher.prototype.forkFlow_;


/**
 * @type {Flow}
 * @private
 */
Watcher.prototype.killFlow_;


/**
 * @type {Array.<Object>}
 * @private
 */
Bowl.prototype.plugins_;


/**
 * @type {Object}
 * @private
 */
Bowl.prototype.destroyTimers_;

/**
 * @type {Watcher}
 * @private
 */
Bowl.prototype.watcher_;


/**
 * @type {number}
 * @private
 */
Bowl.prototype.watchTimer_;


/**
 * @type {Date}
 * @private
 */
Bowl.prototype.startAt_;


/**
 * @type {number}
 * @private
 */
Bowl.prototype.kills_;

/**
 * @type {boolean}
 * @private
 */
Bowl.prototype.running_ = false;


/**
 * @type {boolean}
 * @private
 */
Bowl.prototype.disposed_ = false;


/**
 * @return {boolean} .
 */
Bowl.prototype.isRunning = function() {
    return this.running_;
};


/**
 * @return {winston.Logger} .
 */
Bowl.prototype.getLogger = function() {
  return this.logger_;
};


/**
 * @return {Array.<number>} .
 */
Bowl.prototype.getWorkerPids = function() {
  var pids = [];
  for (var id in cluster.workers) {
    pids.push(cluster.workers[id].process.pid);
  }
  return pids;
};


/**
 * @return {Array.<number>} .
 */
Bowl.prototype.getWorkerIds = function() {
  return Object.keys(cluster.workers);
};


/**
 * Start bowl and fork workers.
 *
 * @param {Function=} opt_callback .
 * @protected
 */
Bowl.prototype.run = function(opt_callback) {
  if (this.isRunning()) {
    var errMessage = 'It has been already started';
    this.logger_.error(errMessage);
    this.emit('error.start', errMessage);
    return;
  }
  var self = this;
  this.startAt_ = new Date();
  this.kills_ = 0;

  this.setupCluster_();
  this.setupProcessHandlers_();
  this.setupPlugins_();
  this.setupWatcher_();

  // create and write pidfile
  if (this.config_.pidfile) {
    pidfile.writeFileSync(
      this.config_.pidfile, process.pid, this.getLogger());
  }

  this.getLogger().info('Starting workers...');
  this.runWorkers_(function(err) {
    if (err) {
      opt_callback && opt_callback(err);
      return;
    }
    self.running_ = true;
    self.getLogger().info('Started bowl');
    self.emit('start');
    opt_callback && opt_callback();
  });
};


/**
 * Shutdown bowl and kill workers.
 *
 * @param {Function=} opt_callback .
 * @protected
 */
Bowl.prototype.shutdown = function(opt_callback) {
  var self = this;

  // delete pidfile
  if (this.config_.pidfile) {
    pidfile.unlinkSync(this.config_.pidfile);
  }


  this.getLogger().info('Killing workers...');
  this.killWorkers_(true, function() {
    self.getLogger().info('Shutdown bowl');
    self.emit('shutdown');
    opt_callback && opt_callback();
    self.dispose();
    process.nextTick(function() {
      self.getLogger().close();
      self.logger_ = null;
      process.exit(0);
    });
  });
};


/**
 * Shutdown gracefully and wait workers.
 *
 * @param {Function=} opt_callback .
 * @protected
 */
Bowl.prototype.stop = function(opt_callback) {
  var self = this;
  this.running_ = false;

  this.getLogger().info('Killing workers...');
  this.killWorkers_(false, function() {
    self.getLogger().info('Stop bowl');
    self.emit('stop');
    opt_callback && opt_callback();
  });
};


/**
 * Restart workers gracefully.
 *
 * @param {boolean} graceful .
 * @param {Function=} opt_callback .
 * @protected
 */
Bowl.prototype.restart = function(graceful, opt_callback) {
  var self = this;
  this.startAt_ = new Date();
  this.kills_ = 0;
  this.running_ = false;

  this.getLogger().info('Restart workers...');

  var killed = false;
  var forked = false;
  this.on('restart.kill', function() {
    killed = true;
    self.removeAllListeners('restart.kill');
    if (forked) {
      self.emit('restart');
    }
  });
  this.on('restart.fork', function() {
    forked = true;
    self.removeAllListeners('restart.fork');
    if (killed) {
      self.emit('restart');
    }
  });

  this.killWorkers_(graceful ? false : true, function() {
    self.emit('restart.kill');
  });

  this.runWorkers_(function(err) {
    if (err) {
      return;
    }
    self.running_ = true;
    self.getLogger().info('Restarting bowl');
    self.emit('restart.fork');
  });
};


/**
 * @private
 */
Bowl.prototype.setupCluster_ = function() {
  var self = this;

  cluster.setupMaster({
    exec: this.config_.exec,
    args: [],
    silent: false
  });

  // the new worker has started
  cluster.on('online', function(worker) {
    self.getLogger().info(
      util.format('Worker[%d] is up: %d', worker.id, worker.process.pid));
    self.forkFlow_.countup();
  });

  // if the worker died, respawn new worker
  cluster.on('exit', function(worker, code, signal) {
    self.getLogger().info(
      util.format('Worker[%d] died: %d', worker.id, worker.process.pid));
    self.killFlow_.countup();

    if (self.disposed_) {
      return;
    }

    // cleanup destroy timer
    var destroyTimer = self.destroyTimers_[worker.id];
    if (destroyTimer) {
      clearTimeout(destroyTimer);
      delete self.destroyTimers_[worker.id];
    }

    // if failed to fork worker 10 times in 10 seconds
    var time = Date.now() - self.startAt_;
    if (10000 > time && ++self.kills_ >= 10) {
      self.getLogger().info('Abort bowl! Worker has any problem?');
      process.exit(1);
    }

    if (self.isRunning() && !worker.suicide) {
      var domain = Domain.create();
      domain.on('error', function(err) {
        var errMessage = 'Failed to reborn worker.\n' + err.message;
        self.getLogger().error(errMessage);
      });
      domain.run(function() {
        self.getLogger().info('Since it was not a suicide, let it reborn!');
        cluster.fork();
        self.emit('worker.respawn');
      });
    }
  });

  // check worker does not died a long time
  cluster.on('disconnect', function(worker) {
    self.getLogger().info(
      util.format('Worker[%d] disconnected: %d',
                  worker.id, worker.process.pid));

    if (!self.destroyTimers_[worker.id]) {
      // force destroy after 5 seconds
      self.destroyTimers_[worker.id] = setTimeout(function() {
        worker.destroy();
        delete self.destroyTimers_[worker.id];
      }, self.config_.lifetime);
    }
  });
};


/**
 * This method must be called before running the workers.
 *
 * @private
 */
Bowl.prototype.setupProcessHandlers_ = function() {
  var self = this;

  // ignore
  process.on('SIGHUP', function() {});

  // shutdown
  ['SIGINT', 'SIGTERM'].forEach(function(signal) {
    process.on(signal, function() {
      cluster.isMaster && self.shutdown();
    });
  });

  process.on('SIGQUIT', function() {
    cluster.isMaster && self.stop();
  });

  // like the unicorn server
  process.on('SIGUSR2', function() {
    cluster.isMaster && self.restart(true);
  });
};


/**
 * This method must be called before running the workers.
 *
 * @private
 */
Bowl.prototype.setupWatcher_ = function() {
  if (!this.config_.watch || 1 > this.config_.watch.length) {
    return;
  }
  var self = this;

  this.watcher_ = new Watcher(this.logger_);
  this.watcher_.watches(this.config_.watch);

  // if file has been modified, restart gracefully
  this.watcher_.on('watch', function(evt) {
    if (self.watchTimer_ !== null) {
      clearTimeout(self.watchTimer_);
      self.watchTimer_ = null;
    }
    // for sequencial changes
    self.watchTimer_ = setTimeout(function() {
      self.restart(true);
    }, 1000);
  });
};


/**
 * This method must be called before running the workers.
 *
 * @private
 */
Bowl.prototype.setupPlugins_ = function() {
  if (!this.config_.plugins || 1 > this.config_.plugins.length) {
    return;
  }
  var self = this;
  var plugins = this.config_.plugins;

  var domain = Domain.create();
  domain.on('error', function(err) {
    var errMessage = 'Failed to include plugin.\n' + err.message;
    self.getLogger().error(errMessage);
    self.emit('error', errMessage);
  });
  domain.run(function() {
    plugins.forEach(function(plugin) {
      if (path.extname(plugin) !== '.js') {
        throw new Error('Plugin must be javascript file');
      }
      var obj = require(path.resolve(process.cwd(), plugin));
      if (obj.included) {
        obj.included(self);
        self.plugins_.push(obj);
      } else {
        throw new Error('Plugin must implement "included" method');
      }
    });
  });
};


/**
 * Fork new child workers.
 *
 * @param {Function=} opt_callback .
 * @private
 */
Bowl.prototype.runWorkers_ = function(opt_callback) {
  var self = this;
  var forks = self.config_.forks;

  this.forkFlow_.start(forks, function() {
    opt_callback && opt_callback();
    self.emit('worker.fork');
  }, this);

  var domain = Domain.create();
  domain.on('error', function(err) {
    var errMessage = 'Failed to start new workers.\n' + err.message;
    self.getLogger().error(errMessage);
    self.emit('error', errMessage);
  });
  domain.run(function() {
    for (var i = 0; i < forks; i++) {
      cluster.fork();
    }
  });
};


/**
 * Kill all child workers.
 *
 * @param {boolean} force .
 * @param {Function=} opt_callback .
 * @private
 */
Bowl.prototype.killWorkers_ = function(force, opt_callback) {
  var self = this;
  var domain = Domain.create();

  var workers = Object.keys(cluster.workers).length;
  this.killFlow_.start(workers, function() {
    opt_callback && opt_callback();
    self.emit('worker.kill');
  }, this);

  if (force) {
    domain.on('error', function(err) {
      var errMessage = 'Failed to destroy workers.\n' + err.message;
      self.getLogger().error(errMessage);
      self.emit('error', errMessage);
    });
    domain.run(function() {
      for (var wid in cluster.workers) {
        var worker = cluster.workers[wid];
        worker.destroy();
        self.getLogger().info(
          util.format('Worker[%d] is killed: %d',
                      worker.id, worker.process.pid));
      }
    });
  } else {
    domain.on('error', function(err) {
      var errMessage = 'Failed to cluster.disconnect.\n' + err.message;
      self.getLogger().error(errMessage);

      // fallback force
      self.killWorkers_(true, opt_callback);
    });
    domain.run(function() {
      cluster.disconnect(function() {
        self.getLogger().info('workers disconnected');
      });
    });
  }
};


/**
 * Dispose objects and remove all listeners.
 *
 * @protected
 */
Bowl.prototype.dispose = function() {
  if (this.disposed_) {
    return;
  }
  var self = this;
  this.disposed_ = true;

  cluster.removeAllListeners();
  process.removeAllListeners();

  if (this.watcher_) {
    this.watcher_.dispose();
    this.watcher_ = null;
  }

  this.plugins_.forEach(function(plugin) {
    plugin.dispose && plugin.dispose(self);
  });
  this.plugins_ = null;

  for (var wid in this.destroyTimers_) {
    clearTimeout(this.destroyTimers_[wid]);
  }
  this.destroyTimers_ = null;

  if (this.watchTimer_ !== null) {
    clearTimeout(this.watchTimer_);
    this.watchTimer_ = null;
  }

  this.forkFlow_.stop();
  this.forkFlow_ = null;
  this.killFlow_.stop();
  this.killFlow_ = null;

  this.config_ = null;
  this.startAt_ = null;
  this.kills_ = 0;
  this.running_ = false;
};
