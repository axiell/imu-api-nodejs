"use strict";

var util = require('util');
var Handler = require('./handler');
var Terms = require('./terms');

/**
 * Creates an IMu module handler object.
 * @class
 * @param {string} [table] The EMu table name
 * @param {object} [session] IMu server session object
 * @param {object} [options=null] Optional settings
 * @param {object} [options.create=null] Handler create value
 * @param {object} [options.destroy=null] Handler destroy flag
 * @param {object} [options.id=null] Handler Id
 * @param {object} [options.language=null] Handler language
 * @return {object} A Handler object.
 */
var Module = function(table, session, options) {
    var self = this;
    Handler.call(self, session, options);

    self.s.table = table;
    self.s.create = table;
    self.s.name = 'Module';
}
util.inherits(Module, Handler);

Object.defineProperties(Module.prototype, {
    'table': {
        enumerable:true,
        get: function() { return this.s.table; },
        set: function(table) { this.s.table = table; }
    }
});

/**
 * 
 * 
 * @param {any} name 
 * @param {any} columns 
 * @param {any} callback 
 */
Module.prototype.addFetchSet = function(name, columns, callback) {
    var args = {};

    args.name = name;
    args.columns = columns;
    this.invoke('addFetchSet', args, callback);
}

/**
 * 
 * 
 * @param {any} sets 
 * @param {any} callback 
 */
Module.prototype.addFetchSets = function(sets, callback) {
    this.invoke('addFetchSets', sets, callback);
}

/**
 * 
 * 
 * @param {any} name 
 * @param {any} columns 
 * @param {any} callback 
 */
Module.prototype.addSearchAlias = function(name, columns, callback) {
    var args = {};

    args.name = name;
    args.columns = columns;
    this.invoke('addSearchAlias', args, callback);
}

/**
 * 
 * 
 * @param {any} aliases 
 * @param {any} callback 
 */
Module.prototype.addSearchAliases = function(aliases, callback) {
    this.invoke('addSearchAliases', aliases, callback);
}

/**
 * 
 * 
 * @param {any} name 
 * @param {any} columns 
 * @param {any} callback 
 */
Module.prototype.addSortSet = function(name, columns, callback) {
    var args = {};

    args.name = name;
    args.columns = columns;
    this.invoke('addSortSet', args, callback);
}

/**
 * 
 * 
 * @param {any} sets 
 * @param {any} callback 
 */
Module.prototype.addSortSets = function(sets, callback) {
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
Module.prototype.fetch = function(flag, offset, count, columns, callback) {
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
 * @param {any} key 
 * @param {any} callback 
 */
Module.prototype.findKey = function(key, callback) {
    this.invoke('findKey', key, callback);
}

/**
 * 
 * 
 * @param {any} keys 
 * @param {any} callback 
 */
Module.prototype.findKeys = function(keys, callback) {
    this.invoke('findKeys', keys, callback);
}

/**
 * 
 * 
 * @param {any} terms 
 * @param {any} callback 
 */
Module.prototype.findTerms = function(terms, callback) {
    if (terms instanceof Terms)
        terms = terms.toArray();
    this.invoke('findTerms', terms, callback);
}

/**
 * 
 * 
 * @param {any} where 
 * @param {any} callback 
 */
Module.prototype.findWhere = function(where, callback) {
    this.invoke('findWhere', where, callback);
}

/**
 * 
 * 
 * @param {any} values 
 * @param {any} columns 
 * @param {any} callback 
 */
Module.prototype.insert = function(values, columns, callback) {
    if (typeof columns === 'function') {
        callback = columns;
        columns = undefined;
    }

    var args = {};
    args.values = values;
    if (columns)
        args.columns = columns;
    this.invoke('insert', args, callback);
}

/**
 * 
 * 
 * @param {any} flag 
 * @param {any} offset 
 * @param {any} count 
 * @param {any} callback 
 */
Module.prototype.remove = function(flag, offset, count, callback) {
    if (typeof count === 'function')
    {
        callback = count;
        count = undefined;
    }

    var args = {};
    args.flag = flag;
    args.offset = offset;
    args.count = count;
    this.invoke('remove', args, callback);
}

/**
 * 
 * 
 * @param {any} file 
 * @param {any} callback 
 */
Module.prototype.restoreFromFile = function(file, callback) {
    var args = {};

    args.file = file;
    this.invoke('restoreFromFile', args, callback);
}

/**
 * 
 * 
 * @param {any} file 
 * @param {any} callback 
 */
Module.prototype.restoreFromTemp = function(file, callback) {
    var args = {};

    args.file = file;
    this.invoke('restoreFromTemp', args, callback);
}

/**
 * 
 * 
 * @param {any} columns 
 * @param {any} flags 
 * @param {any} callback 
 */
Module.prototype.sort = function(columns, flags, callback) {
    if (typeof flags === 'function') {
        callback = flags;
        flags = undefined;
    }

    var args = {};
    args.columns = columns;
    args.flags = flags;
    this.invoke('sort', args, callback);
}

/**
 * 
 * 
 * @param {any} flag 
 * @param {any} offset 
 * @param {any} count 
 * @param {any} values 
 * @param {any} columns 
 * @param {any} callback 
 */
Module.prototype.update = function(flag, offset, count, values, columns, callback) {
    if (typeof columns === 'function') {
        callback = columns;
        columns = undefined;
    }

    var args = {};
    args.flag = flag;
    args.offset = offset;
    args.count = count;
    args.values = values;
    args.columns = columns;
    this.invoke('update', args, callback);
}

/**
 * 
 * @deprecated [Legacy method, left for compatibility]
 * @returns 
 */
Module.prototype.getTable = function() {
    return this.table;
}

module.exports = Module;