/**
 * saucer
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Module dependencies.
 */

var assert = require('assert');
var path = require('path');

module.exports = {
  assert: assert
};


/**
 * Common variables.
 */

global.dir = {
  root: path.join(__dirname, '../'),
  fixtures: path.join(__dirname, '../fixtures'),
  watch: path.join(__dirname, '../fixtures/watch')
};
