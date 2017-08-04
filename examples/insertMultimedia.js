var IMu = require('../IMu');
var async = require('async');
var fs = require('fs');
var os = require('os');

var session;
var options = {host:'localhost', port:40000, timeout: 0, suspend: 1};
IMu.connect(options, function(err, sess) {
    if (err)
        throw err;
    session = sess;
    console.log(session);

    async.waterfall([
        login,
        insert
    ], function(err, response) {
        if (err) {
            console.log(err);
            session.logout();
            session.disconnect();            
            return;
        }
        
        console.log(response);
        session.logout();
        session.disconnect();
        
    });
});

function login(callback) {
    session.login('emu', 'password', null, 0, function(err, response) {
        if (err)
            return callback(err);

        callback();
    });
}

function insert(callback) {
    var findHandler = new IMu.Handler(session, {
        'name': 'Service::Multimedia::Insert',
        'destroy': 1,
        'language': 'en-US'
    });
    var terms = new IMu.Terms('and');
    terms.add('irn', '2', '=');
    findHandler.invoke('process', { 'fileName': 'testingInsert.mp4', 'fileData': fs.createReadStream('/path/to/file.mp4') }, function(err, response) {
        if (err)
            return callback(err);
        callback(null, response);
    });
}
