"use strict";

var bunyan = require('bunyan')

var trace;
var getTrace = function(options) {
    if (trace)
        return trace;

    options = options || {
        'name': 'imu-api',
        'stream': process.stdout,
        'level': 'warn'
    };

    // Create a child logger if parent logger supplied
    if (options.parent)
        trace = options.parent.child({widget_type: 'imu-api'});
    else
        trace = bunyan.createLogger(options);
    return trace;
}

module.exports = getTrace;