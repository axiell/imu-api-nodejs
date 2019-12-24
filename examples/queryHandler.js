var IMu = require('../IMu');
var waterfall = require('async').waterfall;
var fs = require('fs');
var os = require('os');

var options = { host:'localhost', port:40000, timeout: 0, suspend: 1 };
var session = new IMu.Session(options);

var terms = new IMu.Terms('and');
terms.add('irn', '2', '=');

waterfall(
    [
        login('emu', 'password'),
        find(terms),
        fetch,
        handleResult
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

// Fetch first 30 query results
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
        return callback(err, response);
    });
}

// Perform query
function find(terms) {
    return function(callback) {
        var findHandler = new IMu.Handler(session, {
            'create': 'ecatalogue',
            'name': 'Module',
            'destroy': 0,
            'language': 'en-US'
        });
        findHandler.invoke('findTerms', { 'terms': terms.toArray() }, function(err, response) {
            if (err)
                return callback(err);

            // We could use the same handler object for find/fetch, just illustrating the setting of id on handlers
            // See queryModule for an example of using the same Handler (Module).
            var id = findHandler.id;
            return callback(null, id);
        });
    };
}

// Output query result and write resource to file
function handleResult(result, callback) {
    console.log('Result:', result);
    if (result.count > 0 && result.rows[0].multimedia != undefined) {
        var resource = result.rows[0].multimedia[0].resource;
        var fileReadStream = resource.file;
        var fileWriteStream = fs.createWriteStream(os.tmpdir() + '/' + resource.identifier);
        fileReadStream.pipe(fileWriteStream);
    }
    return callback();
}

// Create authenticated session
function login(un, pw, grp) {
    un = un || '';
    pw = pw || '';
    grp = grp || '';
    return function (callback) {
        session.login(un, pw, grp, 0, function(err, response) {
            return callback(err);
        });
    };
}
