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
        find,
        fetch
    ], function(err, response) {
        if (err) {
            console.log(err);
            session.logout(function logout() {});
            session.disconnect();
            return;
        }
        
        console.log(response);
        if (response.rows[0].multimedia) {
            var resource = response.rows[0].multimedia[0].resource;
            var fileReadStream = resource.file;
            var fileWriteStream = fs.createWriteStream(os.tmpdir() + '/' + resource.identifier);
            fileReadStream.pipe(fileWriteStream);
        }
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

function find(callback) {
    var findHandler = new IMu.Handler(session, {
        'create': 'ecatalogue',
        'name': 'Module',
        'destroy': 0,
        'language': 'en-US'
    });
    var terms = new IMu.Terms('and');
    terms.add('irn', '2', '=');
    findHandler.invoke('findTerms', { 'terms': terms.toArray() }, function(err, response) {
        if (err)
            return callback(err);

        // We could use the same handler object for find/fetch, just illustrating the setting of id on handlers
        // See queryModule for an example of using the same Handler (Module).
        var id = findHandler.id;
        callback(null, id);
    });
}

function fetch(id, callback) {
    var fetchHandler = new IMu.Handler(session);
    fetchHandler.id = id;
    fetchHandler.destroy = 1;
    fetchHandler.invoke('fetch', {
         'columns' : ['SummaryData', 'multimedia.resource'],
         'count' : 30,
         'flag' : 'start',
         'offset': 0
    }, function(err, response) {
        if (err)
            return callback(err);

        callback(null, response);
    });
}
