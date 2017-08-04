var IMu = require('../IMu');
var async = require('async');
var fs = require('fs');
var os = require('os');

var options = {host:'localhost', port:40000, timeout: 0, suspend: 1};
var session;
var module = null;

IMu.connect(options, function(err, sess) {
    if (err)
        throw err;
    session = sess;
    console.log(session);

    async.waterfall([
        login,
        find,
        fetch
    ], function(err, response) {
        if (err) {
            console.log(err);
            session.logout();
            session.disconnect();
            return;
        }
        console.log(response);
        if (response.rows[0].images.length) {
            console.log(response.rows[0].images[0].resource);
            var fileReadStream = response.rows[0].images[0].resource.file;
            var fileWriteStream = fs.createWriteStream(os.tmpdir() + '/testing123.jpeg');
            fileReadStream.pipe(fileWriteStream);
        }

        session.logout(function() {
            session.disconnect();
        });
    });
});

function login(callback) {
    session.login('emu', 'password', '', 0, function(err, response) {
        if (err)
            return callback(err);

        callback();
    });
}

function find(callback) {
    module = new IMu.Module('ecatalogue', session);
    module.destroy = 0
    var terms = new IMu.Terms();
    terms.add('irn', '2');
    module.findTerms(terms, function(err, response) {
    //module.findKey('2', function(err, response) {
        if (err)
            return callback(err);
        callback(null);
    });
}

function fetch(callback) {
    module.destroy = 1;
    module.fetch('start', 0, 1, ['SummaryData', 'images.resource'], function(err, response) {
        if (err)
            return callback(err);

        callback(null, response);
    });
}
