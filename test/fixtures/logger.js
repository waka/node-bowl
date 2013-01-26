/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var winston = require('winston');


var logger = module.exports = new (winston.Logger)({});

// use syslog's levels
logger.setLevels(winston.config.syslog.levels);
