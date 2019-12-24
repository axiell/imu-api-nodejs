var IMu = require('../IMu');
var waterfall = require('async').waterfall;
var fs = require('fs');

var options = { host:'localhost', port:40000, timeout: 0, suspend: 1 };
var session = new IMu.Session(options);

waterfall(
    [
        login('emu', 'password'),
        insert
    ],
    function(err, response) {
        if (err)
            console.log('Error:', err);
        disconnect();
    }
);


// Logout and disconnect from session
function disconnect(callback) {
    session.destroy = 1;
    session.logout(function() {
        session.disconnect(callback);
    });
}

// Create Multimedia Insert service handler process multimedia resource
function insert(callback) {
    var findHandler = new IMu.Handler(session, {
        'name': 'Service::Multimedia::Insert',
        'destroy': 1,
        'language': 'en-US'
    });
    findHandler.invoke('process', { 'fileName': 'testingInsert.mp4', 'fileData': fs.createReadStream('/path/to/file.mp4') }, function(err, response) {
        if (err)
            return callback(err);
        return callback(null, response);
    });
}

// Create authenticated session
function login(un, pw, grp) {
    un = un || '';
    pw = pw || '';
    grp = grp || '';
    return function(callback) {
        session.login(un, pw, grp, 0, function(err, response) {
            return callback(err);
        });
    };
}
