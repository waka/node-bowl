/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var fs = require('fs');
var util = require('util');


/**
 * Provide object included methods.
 */

var pidfile = module.exports = {};


/**
 * @param {string} file The pid file path.
 * @param {number} pid The process id.
 * @param {winston.Logger=} opt_logger .
 */
pidfile.writeFileSync = function(file, pid, opt_logger) {
  try {
    fs.writeFileSync(file, pid);
  } catch (err) {
    var errMessage = util.format('Could not write pidfile: %s, %d', file);
    opt_logger && logger.error(errMessage);
    throw new Error(errMessage);
  }
  opt_logger && opt_logger.info(util.format('Wrote pidfile: %s, %d', file, pid));
};


/**
 * @param {string} file The pid file path.
 * @param {winston.Logger=} opt_logger .
 */
pidfile.unlinkSync = function(file, opt_logger) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      opt_logger && opt_logger.error(err.message);
    }
  }
};

