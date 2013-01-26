/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */


/**
 * Expose `Saucer`
 */

exports = module.exports = Flow;


/**
 * @constructor
 */
function Flow() {}


/**
 * @enum {string}
 */
Flow.State = {
  START: 'start',
  STOP: 'stop'
};


/**
 * @type {number}
 * @private
 */
Flow.prototype.test_ = 0;


/**
 * @type {Function}
 * @private
 */
Flow.prototype.callback_;


/**
 * @type {number}
 * @private
 */
Flow.prototype.count_ = 0;


/**
 * @type {Flow.State}
 * @private
 */
Flow.prototype.state_ = Flow.State.STOP;


/**
 * @param {number} test .
 * @param {Function} callback .
 * @param {Object=} opt_scope .
 */
Flow.prototype.start = function(test, callback, opt_scope) {
  if (this.isStarted()) {
    this.reset();
  }
  this.test_ = test;
  this.callback_ = opt_scope ? callback.bind(opt_scope) : callback;
  this.state_ = Flow.State.START;
};


/**
 * @return {void} .
 */
Flow.prototype.countup = function() {
  if (!this.isStarted()) {
    return;
  }

  this.count_ += 1;
  if (this.count_ >= this.test_) {
    this.fire_();
  }
};


/**
 */
Flow.prototype.stop = function() {
  this.reset();
};


/**
 */
Flow.prototype.reset = function() {
  this.state_ = Flow.State.STOP;
  this.test_ = 0;
  this.count_ = 0;
  this.callback_ = null;
};


/**
 * @private
 */
Flow.prototype.fire_ = function() {
  this.callback_ && this.callback_();
  this.reset();
};


/**
 * @return {boolean}
 */
Flow.prototype.isStarted = function() {
  return this.state_ === Flow.State.START;
};
