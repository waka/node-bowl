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
var path = require('path');
var util = require('util');
var winston = require('winston');
var _ = require('./utility');


/**
 * @type {string}
 * @const
 */
var FILE_NAME = 'bowl.log';


/**
 * @type {string}
 * @const
 */
var ERROR_FILE_NAME = 'bowl-error.log';


/**
 * Default configurations.
 *
 * @type {Object}
 */
var defaultConfig = {
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  file: {
    dir: process.cwd(),// current directory
    maxsize: 314572800,// 300MB
    maxfiles: 3
  }
};
Object.freeze(defaultConfig);


/**
 * Provide winston factory.
 */

exports.createLogger = createLogger;


/**
 * Instantiate winston logger.
 *
 * @param {string=} opt_level .
 * @param {string=} opt_dir .
 * @return {winston.Logger} .
 */
function createLogger(opt_level, opt_dir) {
  var config = getLogConfig(opt_level, opt_dir);
  var transports = getTransports(config);

  // check logdir
  if (!fs.existsSync(config.file.dir)) {
    throw new Error(
      util.format('The logdir does not exist: %s', config.file.dir));
  }

  // create instance
  var logger = new (winston.Logger)({
    transports: [
      new winston.transports.Console(transports.console),
      new winston.transports.File(transports.file)
    ],
    exitOnError: false,
    exceptionHandlers: [
      new winston.transports.File(transports.error)
    ]
  });

  // use syslog's levels
  logger.setLevels(winston.config.syslog.levels);

  // if production env, remove console logger
  if (process.env.NODE_ENV === 'production') {
    logger.remove(winston.transports.Console);
  }

  return logger;
}


/**
 * Merge user's configurations.
 *
 * @param {string=} opt_level .
 * @param {string=} opt_dir .
 * @return {Object} .
 */
function getLogConfig(opt_level, opt_dir) {
  var config = _.clone(defaultConfig);
  if (opt_level) {
    config.level = opt_level;
  }
  if (opt_dir) {
    config.file.dir = opt_dir;
  }
  return config;
}


/**
 * winston transports.
 *
 * @param {Object} config .
 * @return {Object} .
 */
function getTransports(config) {
  var transports = {
    console: {
      level: config.level,
      handleExceptions: true,
      colorize: true,
      prettyPrint: true
    },
    file: {
      level: config.level,
      filename: path.join(config.file.dir, FILE_NAME),
      maxsize: config.file.maxsize,
      maxFiles: config.file.maxfiles,
      json: false,
      timestamp: true
    }
  };
  transports.error = {
    filename: path.join(config.file.dir, ERROR_FILE_NAME),
    maxsize: config.file.maxsize,
    maxFiles: config.file.maxfiles,
    timestamp: true,
    json: true,
    prettyPrint: true
  };

  return transports;
}
