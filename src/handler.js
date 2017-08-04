"use strict";

var Session = require('./session');

var defaults = {
    create: null,
    destroy: null,
    id: null,
    language: null,
    name: null
}

/**
 * Creates an IMu handler object.
 * @class
 * @param {object} [session] IMu server session object
 * @param {object} [options=null] Optional settings
 * @param {object} [options.create=null] Handler create value
 * @param {object} [options.destroy=null] Handler destroy flag
 * @param {object} [options.id=null] Handler Id
 * @param {object} [options.language=null] Handler language
 * @param {object} [options.name=null] Handler name
 * @return {object} A Handler object.
 */
var Handler = function(session, options) {
    options = Object.assign({}, defaults, options);
    if (typeof session === 'undefined')
        session = new Session();

    this.s = {
        session: session,
        create: options.create,
        destroy: options.destroy,
        id: options.id,
        language: options.language,
        name: options.name,
        options: options
    }
}

Object.defineProperties(Handler.prototype, {
    'session': {
        enumerable:true,
        get: function() { return this.s.session; },
        set: function(session) { this.s.session = session; }
    },
    'create': {
        enumerable:true,
        get: function() { return this.s.create; },
        set: function(create) { this.s.create = create; }
    },
    'destroy': {
        enumerable:true,
        get: function() { return this.s.destroy; },
        set: function(destroy) { this.s.destroy = destroy; }
    },
    'id': {
        enumerable:true,
        get: function() { return this.s.id; },
        set: function(id) { this.s.id = id; }
    },
    'language': {
        enumerable:true,
        get: function() { return this.s.language; },
        set: function(language) { this.s.language = language; }
    },
    'name': {
        enumerable:true,
        get: function() { return this.s.name; },
        set: function(name) { this.s.name = name; }
    }
});

/**
 * @param  {string} [method]
 * @param  {object} [params]
 * @param  {Function} [callback] 
 */
Handler.prototype.invoke = function(method, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params = undefined;
    }

    var request = {};
    request.method = method;
    if (params)
        request.params = params;
    this.request(request, callback);
}

/**
 * @param  {object} [params]
 * @param  {Function} [callback] 
 */
Handler.prototype.request = function(request, callback) {
    callback = callback || function(){};
    var self = this;
    if (self.s.id)
        request.id = self.s.id;
    else if (self.s.name) {
        request.name = self.s.name;
        if (self.s.create)
            request.create = self.s.create;
    }

    if (self.s.destroy)
        request.destroy = self.s.destroy;
    if (self.s.language)
        request.language = self.s.language;

    self.s.session.request(request, function(err, response) {
        if (err)
            return callback(err);

        if (response.hasOwnProperty('id'))
            self.s.id = response.id;

        return callback(null, response.result);
    });
}

/**
 * Set handler values
 * @deprecated [Legacy method, left for compatibility]
 * @param  {object} [options]
 */
Handler.prototype.set = function(options) {
    this.s = Object.assign(this.s, options);
}

module.exports = Handler;