"use strict";

var Parser = require('../IMu').Parser;
var fs = require('fs');

var parser = new Parser();
var responseTest = null;
parser.on('data', function(response) {
    console.log(response);
    console.log('data');
    responseTest = response;
});

parser.on('close', function() {
    console.log('close');
});

parser.on('end', function() {
    console.log('end');
});

parser.on('drain', function() {
    console.log('drain');
});

parser.on('error', function(error) {
    console.log(error);
    console.log('error');
});


try
{
    var readStream = fs.createReadStream('./data/response.json');
    readStream.pipe(parser);
}
catch(e)
{
    console.log(e);
}
