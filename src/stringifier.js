/*jshint node: true */
"use strict";

var Duplex = require('stream').Duplex;
var fs = require('fs');
var util = require('util');
var APIError = require('./error');

var EOL = new Buffer.from('\r\n');

var Stringifier = function(options) {
    Duplex.call(this, options);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
    this.pause(); // No data yet..
    this.s = {
        state: null,
        buffer: [],
        iterator: null,
        file: false
    };
};
util.inherits(Stringifier, Duplex);

Stringifier.prototype._write = function(object, encoding, callback) {
    this.s.buffer.push(object);
    this.resume(); // Resume now we have data.
    callback();
};

Stringifier.prototype._read = function(size) {
    return read(this, size);
};

var read = function(self, size) {
    var iterator;
    if (self.s.file || ! (iterator = getIterator(self))) {
        self.push();
        self.pause();
        return;
    }

    var state = self.s.state;
    var length = 0;
    var output;
    var current = iterator();

    while (current && length < size) {
        output = null;
        switch (current.type) {
            case 'stream':
                output = comma(state) + key(current);
                self.push(output);
                var stream = current.value;
                return readFileStream(self, size, stream);
            case 'object':
                output = comma(state) + key(current) + '{';
                ++state.nested;
                state.first[state.nested] = true;
                break;
            case 'end-object':
                output = '}';
                --state.nested;
                break;
            case 'array':
                output = comma(state) + key(current) + '[';
                ++state.nested;
                state.first[state.nested] = true;
                break;
            case 'end-array':
                output = ']';
                --state.nested;
                break;
            case 'function':
                current = iterator();
                continue;
            default:
                if (current.value === undefined)
                    current.value = null; // IMu server dislikes undefined.
                output = comma(state) + key(current) + JSON.stringify(current.value);
                break;
        }

        length += output.length;
        self.push(output + EOL);
        current = iterator();
    }
    if (! current) {
        objectComplete(self);
    }
};

var readFileStream = function(self, readSize, stream) {
    var fileReadStream = stream;
    fileReadStream.on('data', function(chunk) {
        self.push(chunk);
        self.resume();
    });
    fileReadStream.on('end', function() {
        self.s.file = false;
        self.push(EOL);
        self.resume();
    });
    
    if (! self.s.file) {
        var fileStats = fs.statSync(fileReadStream.path); // TODO: make this async, handle fileReadStream errors.
        if (fileStats.isFile()) {
            self.s.file = true;
            self.push('*' + fileStats.size);
            self.push(EOL);
        }
        else {
            fileReadStream.destroy();
            // Salvage session by ensuring request is valid. No file data sent.
            self.push(JSON.stringify(null));
            self.push(EOL);
            self.s.file = false;
            self.resume();
            return;
        }
    }
    self.pause();
};

var getIterator = function(self) {
    if (! self.s.iterator) {
        var object = self.s.buffer.shift();
        if (object) {
            self.s.state = {
                nested: 0,
                first: {}
            };
            self.s.iterator = Iterator(object);
        }
    }
    return self.s.iterator;
};

var objectComplete = function(self) {
    self.s.iterator = null;
    self.push();
};

var comma = function(state) {
    var out = '';
    if (state.nested && ! state.first[state.nested]) {
        out = ',';
    }
    state.first[state.nested] = false;
    return out;
};

var key = function(current) {
    if (typeof current.key === 'string') {
        return JSON.stringify(current.key) + ':';
    }
    return '';
};


/**
 * 
 * 
 * @param {any} root 
 * @returns 
 */
var Iterator = function(root) {
    var childIterator;
    var type = getType(root);
    var leaf = false;
    var state = 'start';

    if (isValue(type)) {
        return function () {
            if (leaf)
                return null;
            leaf = true;
            return {
                type: type,
                value: root
            };
        };
    }
    
    var next = makeNext(root);
    return function iterator() {
        switch(state) {
            case 'start':
                state = 'traversing';
                return {
                    type: type,
                    value: root
                };
            case 'traversing':
                if(! childIterator) {
                    var child = next();
                    if(next.end === false) {
                        childIterator = Iterator(child);
                    }
                    else
                        state = 'ending';
                    return iterator();
                }
                else {
                    var res = childIterator();
                    if(! res) {
                        childIterator = null;
                        return iterator();
                    }
                    if(! res.key && res.key !== 0)
                        res.key = next.key;

                    return res;
                }
                break;
            case 'ending':
                state = 'ended';
                return {
                    type: 'end-'+type,
                    value: root
                };
            case 'ended':
                return undefined;
            default:
                throw new APIError('StreamStringifyError'); // TODO: Perhaps shouldn't throw here...
        }
    };
};


var makeNext = function(value) {
    var getNext;
    if(Array.isArray(value)) {
        getNext = function() {
            if(getNext.key >= value.length-1) {
                getNext.end = true;
                return;
            }
            return value[++getNext.key];
        };
        getNext.key = -1;
    }
    else {
        var keys = Object.keys(value);
        getNext = function() {
            if(! keys.length) {
                getNext.end = true;
                return;
            }
            getNext.key = keys.shift();
            return value[getNext.key];
        };
    }
    getNext.end = false;
    return getNext;   
};

var isValue = function(type) {
    if (type === 'object' || type === 'array') {
        return false;
    }
    
    return true;
};

var isReadableStream = function(node) {
    if (node === null || typeof node !== 'object')
        return false;
    if (typeof node._read == 'function' && typeof node._readableState == 'object')
        return true;
    return false;
};

var getType = function(node) {
    var type;
    if(node === null)
        type = 'null';
    else if (isReadableStream(node))
        type = 'stream';
    else
        type = Array.isArray(node) ? 'array' : typeof node;
    return type;
};

module.exports = Stringifier;
