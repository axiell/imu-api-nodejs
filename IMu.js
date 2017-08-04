"use strict";

module.exports.version = require(__dirname + '/package.json').version;
module.exports.APIVersion = '2.0';
module.exports.trace = require('./src/trace');
module.exports.Error = require('./src/error');
module.exports.Session = require('./src/session');
module.exports.Stream = require('./src/stream');
module.exports.Parser = require('./src/parser');
module.exports.Handler = require('./src/handler');
module.exports.Module = require('./src/module');
module.exports.Modules = require('./src/modules');
module.exports.Luts = require('./src/module/luts');
module.exports.Terms = require('./src/terms');
module.exports.connect = connect;

function connect(options, callback) {
    var session = new module.exports.Session(options);
    return session.connect(function (err) {
        if (err)
            return callback(err);
        return callback(null, session);
    });
}
