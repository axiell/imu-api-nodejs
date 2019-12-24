/*jshint node: true */
"use strict";

var util = require("util");
var Module = require('../module');

/**
 * Creates an IMu luts handler object.
 * @class
 * @param {object} [session] IMu server session object
 * @param {object} [options=null] Optional settings
 * @param {object} [options.destroy=null] Handler destroy flag
 * @param {object} [options.id=null] Handler Id
 * @param {object} [options.language=null] Handler language
 * @return {object} A Handler object.
 */
var Luts = function(session, options) {
    Module.call(this, 'eluts', session, options);
    this.s.name = 'Module::Luts';
    this.s.create = null;
}
util.inherits(Luts, Module);

/**
 * 
 * 
 * @param {any} name 
 * @param {any} langid 
 * @param {any} level 
 * @param {any} keys 
 * @param {any} callback 
 * @returns 
 */
Luts.prototype.lookup = function(name, langid, level, keys, callback) {
    if (typeof langid === 'function') {
        callback = langid;
        langid = undefined;
        level = undefined;
        keys = undefined;
    }
    else if (typeof level === 'function') {
        callback = level;
        level = undefined;
        keys = undefined;
    }
    else if (typeof keys === 'function') {
        callback = keys;
        keys = undefined;
    }

    var args = {};
    args.name = name;
    args.langid = langid;
    args.level = level;
    args.keys = keys;

    return this.invoke('lookup', args, callback);
};

/**
 * 
 * 
 * @param {any} name 
 * @param {any} langid 
 * @param {any} level 
 * @param {any} filter 
 * @param {any} callback 
 * @returns 
 */
Luts.prototype.hierarchy = function(name, langid, level, filter, callback) {
    if (typeof langid === 'function') {
        callback = langid;
        langid = undefined;
        level = undefined;
        filter = undefined;
    }
    else if (typeof level === 'function') {
        callback = level;
        level = undefined;
        filter = undefined;
    }
    else if (typeof filter === 'function') {
        callback = filter;
        filter = undefined;
    }

    var args = {};
    args.name = name;
    args.langid = langid;
    args.level = level;
    args.filter = filter;

    return this.invoke('hierarchy', args, callback);
};

module.exports = Luts;