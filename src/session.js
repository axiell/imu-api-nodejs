/*jshint node: true */
"use strict";

var net = require('net');
var Stream = require('./stream');
var APIError = require('./error');
var trace = require('./trace');

var defaults = {
    host: '127.0.0.1',
    port: 40000,
    timeout: 120000,
    context: null,
    suspend: null,
    close: null
};

/**
 * Creates a Session object which represents an IMu server connection.
 * @class
 * @param {object} [options=null] Optional settings
 * @param {object} [options.host=localhost] IMu server host
 * @param {object} [options.port=40000] IMu server port
 * @param {object} [options.timeout=120000] Session timeout value, 0 = none
 * @param {object} [options.context=null] IMu context identifier
 * @param {object} [options.suspend=null] IMu context suspend indicator
 * @param {object} [options.close=null] IMu session close indicator
 * @return {object} A Session object.
 */
var Session = function(options) {
    options = Object.assign({}, defaults, options);

    // internal state
    this.s = {
        host: options.host,
        port: options.port,
        timeout: options.timeout,
        context: options.context,
        suspend: options.suspend,
        close: options.close,
        options: options,
        stream: null,
        tracer: trace()
    };
};

Object.defineProperties(Session.prototype, {
    'host': {
        enumerable:true,
        get: function() { return this.s.host; },
        set: function(host) { this.s.host = host; }
    },
    'port': {
        enumerable:true,
        get: function() { return this.s.port; },
        set: function(port) { this.s.port = port; }
    },
    'timeout': {
        enumerable:true,
        get: function() { return this.s.timeout; },
        set: function(timeout) { this.s.timeout = timeout; }
    },
    'context': {
        enumerable:true,
        get: function() { return this.s.context; },
        set: function(context) { this.s.context = context; }        
    },
    'suspend': {
        enumerable:true,
        get: function() { return this.s.suspend; },
        set: function(suspend) { this.s.suspend = suspend; }        
    },
    'close': {
        enumerable:true,
        get: function() { return this.s.close; },
        set: function(close) { this.s.close = close; }        
    }
});

/**
 * Connect to IMu server
 * @param  {Function} [callback] The callback fired upon connection or error.
 */
Session.prototype.connect = function(callback) {
    var self = this;
    callback = callback || function(){};

    if (self.s.stream) {
        return process.nextTick(function() {
            return callback(null);
        });
    }

    var socket = new net.Socket();
    socket.connect(
        self.s.port,
        self.s.host
    );
    socket.on('connect', function() {
        self.s.tracer.info({ event:'SessionConnect', host:self.s.host, port:self.s.port, context:self.s.context });
        self.s.stream = new Stream(socket);
        socket.setTimeout(self.s.timeout);
        return process.nextTick(function() {
            callback(null, self);
        });
    });
    socket.on('error', function(err) {
        var error = new APIError('SessionError', err);
        self.s.tracer.error(error);
        return process.nextTick(function() {
            callback(error);
        });
    });
};

/**
 * Disconnect from IMu server
 */
Session.prototype.disconnect = function(callback) {
    var self = this;
    callback = callback || function(){};

    self.s.tracer.info({ event:'SessionDisconnect', context:self.s.context });

    // Make sure any requests finish before disconnecting
    process.nextTick(function() {
        if (self.s.stream)
            self.s.stream.close();

        // Ensure session object can be reused
        self.s.stream = null;
        // self.s.suspend = null;
        // self.s.close = null;

        callback();
    });
};

/**
 * Send request to IMu server
 * @param  {object}   request  The request object.
 * @param  {Function} [callback] The callback fired upon response or error.
 */
Session.prototype.request = function(request, callback) {
    var self = this;
    callback = callback || function(){};

    self.connect(function(err) {
        if (err)
            return callback(err);

        if (self.s.close)
            request.close = self.s.close;
        if (self.s.context)
            request.context = self.s.context;
        if (self.s.suspend)
            request.suspend = self.s.suspend;

        var logRequest = Object.assign({}, request);
        if (logRequest.password) {
            logRequest.password = 'xxxxxx';
        }
        self.s.tracer.info({ event:'SessionRequest', context:self.s.context, request:logRequest });
        var stream = self.s.stream;
        stream.put(request, function(err, response) {
            if (err)
                return callback(err);

            if (! response) {
                var sessionResponseError = new APIError('SessionResponseError');
                self.s.tracer.error(sessionResponseError);
                return callback(sessionResponseError);
            }

            if (response.context)
                self.s.context = response.context;
            if (response.reconnect)
                self.s.port = response.reconnect;
            var disconnect = self.s.close || 0;
            if (disconnect)
                self.disconnect();

            self.s.tracer.info({ event:'SessionResponse', context:self.s.context, response:response });
            if (response.status == 'error') {
                var id = 'SessionServerError';
                if (response.error)
                    id = response.error;
                else if (response.id)
                    id = response.id;

                var args = '';
                if (response.args)
                    args += response.args;
                var code;
                if (response.code)
                    code = response.code;
                var error = new APIError(id, args, code);
                self.s.tracer.error(error);
                return callback(error);
            }
            return callback(null, response);
        });
    });
};

/**
 * Login to IMu server
 * @param  {string}   user     The username
 * @param  {string}   password The password
 * @param  {string}   group The group
 * @param  {number}   [spawn=0]    Server process spawn indicator
 * @param  {Function} callback The callback fired upon response or error.
 */
Session.prototype.login = function(user, password, group, spawn, callback) {
    if (typeof spawn === 'function') {
        callback = spawn;
        spawn = 0;
    }
    if (group === '')
        group = null;

    var content = {};
    content.login = user;
    content.password = password;
    content.group = group;
    content.spawn = spawn;

    var logContent = Object.assign({}, content);
    if (logContent.password)
        logContent.password = 'xxxxxx';
    this.s.tracer.info({ event:'SessionLogin', context:this.s.context, request:logContent });
    this.request(content, callback);
};

/**
 * Logout from IMu server
 * @param  {Function} callback The callback fired upon response or error.
 */
Session.prototype.logout = function(callback) {
    var self = this;
    var content = {};
    content.logout = 1;
    self.s.tracer.info({ event:'SessionLogout', context:this.s.context, request:content });
    self.request(content, function(err, response) {
        self.s.context = null;
        return callback(err, response);
    });
};

/**
 * Check the status of IMu server
 * @param  {Function} callback The callback fired upon response or error.
 */
Session.prototype.checkStatus = function(callback) {
    var content = {};
    content.checkStatus = 1;
    this.s.tracer.info({ event:'SessionCheckStatus', context:this.s.context, request:content });
    this.request(content, callback);
};

module.exports = Session;
