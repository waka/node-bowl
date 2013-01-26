/**
 * bowl
 * Copyright(c) 2013 Yoshimasa Wakahara <y.wakahara@gmail.com>
 * MIT Licensed
 */

'use strict';


/**
 * Provide object included methods.
 */

var _ = module.exports = {};


/**
 * @param {Object} target .
 * @param {Object} source .
 * @param {number=} opt_depth .
 * @return {Object} .
 */
_.extend = function(target, source, opt_depth) {
  if ((!_.isObject(target) && !Array.isArray(target)) ||
      (!_.isObject(source) && !Array.isArray(source))) {
    return target;
  }

  var depth = (opt_depth && typeof opt_depth === 'number') ? opt_depth : 6;
  if (0 > depth) {
    return target;
  }
  target = _.clone(target);

  for (var key in source) {
    if (_.isObject(target[key]) && _.isObject(source[key])) {
      extend(target[key], source[key], depth - 1);
    } else if (source[key] && typeof source[key] === 'object') {
      target[key] = _.clone(source[key], depth - 1);
    } else {
      target[key] = source[key];
    }
  }

  return target;
};


/**
 * @param {Object|Array.<*>} obj .
 * @param {number=} opt_depth .
 * @return {Object|Array.<*>} .
 */
_.clone = function(obj, opt_depth) {
  if (!_.isObject(obj) && !Array.isArray(obj)) {
    throw new Error('must be an object or array');
  }

  var depth = (opt_depth && typeof opt_depth === 'number') ? opt_depth : 6;
  if (0 > depth) {
    return {};
  }

  var copy = Array.isArray(obj) ? [] : {};

  // cycle through objects
  for (var key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      copy[key] = _.clone(obj[key], depth - 1);
    } else {
      copy[key] = obj[key];
    }
  }

  return copy;
};


/**
 * @param {*} obj .
 * @return {boolean} .
 */
_.isObject = function(obj) {
  return (obj !== null) && (typeof obj == 'object') && !(Array.isArray(obj));
};
