var IMu = require('../IMu');
var waterfall = require('async').waterfall;

var options = { host:'localhost', port:40000, timeout: 0, suspend: 1 };
var session = new IMu.Session(options);
var module = null;

var terms = new IMu.Terms();
terms.add('irn', '2', '=');

waterfall(
    [
        login('emu', 'password'),
        find(terms),
        fetch,
        handleResult
    ],
    function(err) {
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

// Fetch first query result
function fetch(hits, callback) {
    module.destroy = 1;
    module.fetch('start', 0, 1, ['SummaryData', 'images.resource'], function(err, response) {
        return callback(err, response);
    });
}

// Perform query
function find(terms) {
    return function(callback) {
        var options = { destroy: 0 };
        module = new IMu.Module('ecatalogue', session, options);
        module.findTerms(terms, function(err, hits) {
            return callback(err, hits);
        });
    };
}

// Output query results
function handleResult(result, callback) {
    console.log('Result:', result);
    return callback();
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
