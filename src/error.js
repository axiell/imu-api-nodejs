/*jshint node: true */
"use strict";

var util = require('util');

var IMuAPIError = function(message, extra, code) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
    this.code = code;
};

util.inherits(IMuAPIError, Error);

module.exports = IMuAPIError;