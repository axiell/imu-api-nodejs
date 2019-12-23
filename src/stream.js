/*jshint node: true */
"use strict";

var net = require('net');
var Parser = require('./parser');
var Stringifier = require('./stringifier');
var APIError = require('./error');
var trace = require('./trace');

var encoding = 'utf8';
var blockSize = 8192;

/**
 * 
 * @class
 * @param {object} socket 
 */
var Stream = function(socket) {
    var parser = new Parser();
    var stringifier = new Stringifier({highWaterMark: blockSize});
    this.s = {
        socket: socket,
        parser: parser,
        stringifier: stringifier,
        callbacks: [],
        finished: false,
        tracer: trace()
    };
    stringifier.pipe(socket).pipe(parser);

    parser.on('data', createListener(this, onData));
    parser.on('error', createListener(this, onError));
    socket.on('close', createListener(this, onClose));
    socket.on('end', createListener(this, onEnd));
    socket.on('drain', createListener(this, onDrain));
    socket.on('timeout', createListener(this, onTimeout));
};

/**
 * 
 * 
 * @param {any} data 
 * @param {any} callback 
 */
Stream.prototype.put = function(data, callback) {
    callback = callback || function(){};
    this.s.callbacks.push(callback);
    this.s.stringifier.write(data, encoding);
};

/**
 * 
 * 
 */
Stream.prototype.close = function(force) {
    this.s.finished = true;

    // Wait for any outstanding responses if there
    // are still unfired callbacks. Likely means calls made without
    // waiting for a callback.
    if (force || (this.s.stringifier && this.s.callbacks.length === 0)) {
        this.s.stringifier.unpipe();
        this.s.stringifier = null;
        this.s.socket.destroy();
        this.s.socket = null;
    }
};

var invokeCallback = function(self, err, response) {
    var callback = self.s.callbacks.shift();
    if (self.s.finished)
        self.close();

    if (err) {
        if (callback) {
            return callback(err);
        }
        else {
            self.close(true);
            throw err;
        }
            
    }

    if (! callback) {
        self.close(true);
        throw new APIError('StreamNoResponseCallback');
    }
        

    return callback(null, response);
};

var onData = function(response) {
    return invokeCallback(this, null, response);
};

var onError = function(error) {
    this.s.tracer.error({ event:'StreamError', error: error.toString() });
    return invokeCallback(this, error);
};

var onClose = function(had_error) {
    this.s.tracer.info({ event:'StreamClose'});
    if (had_error) {
        var error = new APIError('StreamTransmissionError');
        return invokeCallback(this, error);
    }
};

var onEnd = function() {
    this.s.tracer.info({ event:'StreamEnded'});
    var error = new APIError('StreamEnded');
    return invokeCallback(this, error);
};

var onDrain = function() {
};

var onTimeout = function() {
    if (this.s.socket.destroyed)
        return;

    this.s.socket.destroy();
    this.s.tracer.info({ event:'StreamTimeout'});
    var error = new APIError('StreamTimeout');
    return invokeCallback(this, error);
};

var createListener = function(self, handler) {
    return handler.bind(self);
};

module.exports = Stream;