"use strict";

var util = require('util');
var Handler = require('./handler');
var Terms = require('./terms');

/**
 * Creates an IMu modules handler object.
 * @class
 * @param {object} [session] IMu server session object
 * @param {object} [options=null] Optional settings
 * @param {object} [options.create=null] Handler create value
 * @param {object} [options.destroy=null] Handler destroy flag
 * @param {object} [options.id=null] Handler Id
 * @param {object} [options.language=null] Handler language
 * @return {object} A Handler object.
 */
var Modules = function(session, options) {
    Handler.call(self, session, options);
    this.s.name = 'Modules';
}
util.inherits(Modules, Handler);


/**
 * 
 * 
 * @param {any} name 
 * @param {any} set 
 * @param {any} callback 
 */
Modules.prototype.addFetchSet = function(name, set, callback) {
    var args = {};

    args.name = name;
    args.set = set;
    this.invoke('addFetchSet', args, callback);
}

/**
 * 
 * 
 * @param {any} sets 
 * @param {any} callback 
 */
Modules.prototype.addFetchSets = function(sets, callback) {
    this.invoke('addFetchSets', sets, callback);
}

/**
 * 
 * 
 * @param {any} name 
 * @param {any} set 
 * @param {any} callback 
 */
Modules.prototype.addSearchAlias = function(name, set, callback) {
    var args = {};

    args.name = name;
    args.set = set;
    this.invoke('addSearchAlias', args, callback);
}

/**
 * 
 * 
 * @param {any} aliases 
 * @param {any} callback 
 */
Modules.prototype.addSearchAliases = function(aliases, callback) {
    this.invoke('addSearchAliases', aliases, callback);
}

/**
 * 
 * 
 * @param {any} name 
 * @param {any} set 
 * @param {any} callback 
 */
Modules.prototype.addSortSet = function(name, set, callback) {
    var args = {};

    args.name = name;
    args.set = set;
    this.invoke('addSortSet', args, callback);
}

/**
 * 
 * 
 * @param {any} sets 
 * @param {any} callback 
 */
Modules.prototype.addSortSets = function(sets, callback) {
    this.invoke('addSortSets', sets, callback);
}

/**
 * 
 * 
 * @param {any} flag 
 * @param {any} offset 
 * @param {any} count 
 * @param {any} columns 
 * @param {any} callback 
 */
Modules.prototype.fetch = function(flag, offset, count, columns, callback) {
    if (typeof columns === 'function') {
        callback = columns;
        columns = undefined;
    }

    var args = {};
    args.flag = flag;
    args.offset = offset;
    args.count = count;
    args.columns = columns;
    this.invoke('fetch', args, callback);
}

/**
 * 
 * 
 * @param {any} table 
 * @param {any} column 
 * @param {any} key 
 * @param {any} callback 
 */
Modules.prototype.findAttachments = function(table, column, key, callback) {
    var args = {};

    args.table = table;
    args.column = column;
    args.key = key;
    this.invoke('findAttachments', args, callback);
}

/**
 * 
 * 
 * @param {any} keys 
 * @param {any} include 
 * @param {any} callback 
 */
Modules.prototype.findKeys = function(keys, include, callback) {
    if (typeof include === 'function') {
        callback = include;
        include = undefined;
    }

    var args = {};
    args.keys = keys;
    args.include = include;
    this.invoke('findKeys', args, callback);
}

/**
 * 
 * 
 * @param {any} terms 
 * @param {any} include 
 * @param {any} callback 
 */
Modules.prototype.findTerms = function(terms, include, callback) {
    if (typeof include === 'function') {
        callback = include;
        include = undefined;
    }

    var args = {};
    if (terms instanceof Terms)
        terms = terms.toArray();
    args.terms = terms;
    args.include = include;
    this.invoke('findTerms', args, callback);
}

/**
 * 
 * 
 * @param {any} callback 
 */
Modules.prototype.getAllHits = function(callback) {
    this.invoke('getAllHits', callback);
}

/**
 * 
 * 
 * @param {any} module 
 * @param {any} callback 
 */
Modules.prototype.getHits = function(module, callback) {
    this.invoke('getHits', module, callback);
}

/**
 * 
 * 
 * @param {any} file 
 * @param {any} module 
 * @param {any} callback 
 */
Modules.prototype.restoreFromFile = function(file, module, callback) {
    if (typeof module === 'function') {
        callback = module;
        module = undefined;
    }

    var args = {};
    args.file = file;
    args.module = module;
    this.invoke('restoreFromFile', args, callback);
}

/**
 * 
 * 
 * @param {any} file 
 * @param {any} module 
 * @param {any} callback 
 */
Modules.prototype.restoreFromTemp = function(file, module, callback) {
    if (typeof module === 'function') {
        callback = module;
        module = undefined;
    }

    var args = {};
    args.file = file;
    args.module = module;
    this.invoke('restoreFromTemp', args, callback);
}

/**
 * 
 * 
 * @param {any} list 
 * @param {any} callback 
 */
Modules.prototype.setModules = function(list, callback) {
    this.invoke('setModules', list, callback);
}

/**
 * 
 * 
 * @param {any} set 
 * @param {any} flags 
 * @param {any} callback 
 */
Modules.prototype.sort = function(set, flags, callback) {
    if (typeof flags === 'function')
    {
        callback = flags;
        flags = undefined;
    }

    var args = {};
    args.set = set;
    args.flags = flags;
    this.invoke('sort', args, callback);
}

module.exports = Modules;