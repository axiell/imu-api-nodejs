/*jshint node: true */
"use strict";

var util = require('util');
var fs = require('fs');
var Transform = require('stream').Transform;
var temp = require('temp');
var APIError = require('./error');


var encoding = 'utf8';
var EOL = new Buffer.from('\r\n');
var tx = /^[\u0020\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|(?:\*(\d*))|"((?:[^\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;
var nonws = /[^\u0020\t\n\r]/;
var ws = /^[^\u0020\t\n\r]+$/;
var escapes = { // Escapement translation table
    "\\": "\\",
    "\"": "\"",
    "/": "/",
    "t": "\t",
    "n": "\n",
    "r": "\r",
    "f": "\f",
    "b": "\b"
};

/**
 * Parser is a state machine which will build a JS object from a stream of JSON while
 * also extracting embedded IMu extension binary data out of the stream.
 * Binary data is embedded using the property value * followed by a value
 * indicating the bytes size of the binary data to follow.
 * e.g: "file": *5467\r\n
 * The following 5467 bytes are the contents of a binary file, after which regular
 * JSON resumes.
 *
 * IMu server also returns invalid JSON by way of not escaping control chars \r,\n or \t
 * in string values. As such the regex above only contains [^\\\"] rather than [^\r\n\t\\\"]
 * for unaccepted string characters in non-escapement match.
 *
 * The result from Parser is a JS object which includes a readStream pointing to
 * temporary files containing any binary data encountered.
 *
 * Writes to Parser should be Buffers while the parser outputs in objectMode.
 *
 * Adapted from reference JSON parser implementation by Douglas Crockford:
 * See: https://github.com/douglascrockford/JSON-js
 *
 * @param {object} optional transform stream options
 */
function Parser(options)
{
    Transform.call(this, options);
    this._writableState.objectMode = false;
    this._readableState.objectMode = true;

    this.s = {
        // Buffers
        buffer: Buffer.alloc(0),
        binaryBuffer: Buffer.alloc(0),
        input: '',

        // Parser state
        bytesLeft: 0,
        file: null,
        IOWait: false,
        finished: false,
        state: "go",
        stack: [],
        container: null,
        key: null,
        value: null,
        next: null
    };
}
util.inherits(Parser, Transform);

Parser.prototype._transform = function transform(chunk, encoding, callback) {
    this.s.buffer = Buffer.concat([this.s.buffer, chunk], this.s.buffer.length + chunk.length);
    this.s.next = callback;
    process(this);
};

Parser.prototype._flush = function flush(callback) {
    this.s.finished = true;
    this.s.next = callback;
    process(this);
};

var initialise = function(self) {
    self.s.buffer = new Buffer.alloc(0);
    self.s.binaryBuffer = new Buffer.alloc(0);
    self.s.state = "go";
    self.s.input = '';
    self.s.file = null;
    self.s.value = null;
};

var process = function(self) {
    var s = self.s;
    try {
        if (parse(self)) {
            self.push(s.value);
            initialise(self);
        }
        else if (s.finished)
            throw new APIError('StreamEOF');

        if (s.IOWait)
            return; // don't call next until IO has finished.
    }
    catch(e) {
        s.next(e);
        return;
    }

    s.next();
};

var getInput = function(self) {
    var s = self.s;
    // Only grab data from buffer if input is empty or whitespace only.
    // Ensures that we don't mistakenly extract binary data from queue.
    if (s.input.length > 0 && nonws.test(s.input))
        return;

    var index = s.buffer.indexOf(EOL);
    while (index == 0) {
        s.input += s.buffer.slice(0, EOL.length).toString(encoding);
        s.buffer = s.buffer.slice(EOL.length, s.buffer.length);
        index = s.buffer.indexOf(EOL);
    }

    if (index !== -1) {
        index += EOL.length;
        s.input += s.buffer.slice(0, index).toString(encoding);
        s.buffer = s.buffer.slice(index, s.buffer.length);
        return;
    }
    s.input = '';
};

var getBinaryInput = function(self) {
    var s = self.s;
    if (s.bytesLeft > 0) {
        var index = s.bytesLeft > s.buffer.length ? s.buffer.length : s.bytesLeft;
        s.binaryBuffer = Buffer.concat([s.binaryBuffer, s.buffer.slice(0, index)]);
        s.buffer = s.buffer.slice(index, s.buffer.length);
        s.bytesLeft -= index;
    }
};

var saveBinaryData = function(self) {
    var s = self.s;
    if (! s.binaryBuffer.length)
        return;

    if (s.file == null) {
        s.IOWait = true;

        // Create a temp file
        temp.open({prefix: 'imu-'}, function(err, info) {
            if (err)
                throw err;

            s.IOWait = false;
            s.file = {};
            s.file.fd = info.fd;
            s.file.path = info.path;
            s.file.stream = fs.createWriteStream(null, {
                fd: s.file.fd
                // TODO: Investigate bug with streams, appears to close FD regardless of autoClose value
                //autoClose: false
            });

            s.file.stream.on('finish', function() {
                s.IOWait = false;
                s.file = null;
                process(self);
            });
            s.file.stream.on('error', function(e) {
                throw new APIError('StreamInput', e);
            });

            process(self);
        });
    }
    else {
        // Write binaryBuffer to file
        s.file.stream.write(s.binaryBuffer);
        s.binaryBuffer = s.binaryBuffer.slice(s.binaryBuffer.length);

        if (! s.bytesLeft && ! s.binaryBuffer.length) {
            s.IOWait = true;
            var readStream = fs.createReadStream(s.file.path);
            readStream.on('open', function(fd) {
                s.fileSize = 0;
                s.value = readStream;
                fs.unlink(s.file.path, function(e) {});
                s.file.stream.end();
            });
        }
    }
};

var parse = function(self) {
    var s = self.s;
    var result;

    try {
        while (true) {
            if (s.IOWait)
                return false; // Wait for IO.

            if (s.buffer.length == 0 && s.state !== "ok")
                return false; // Wait for input.

            if (s.fileSize > 0) {
                getBinaryInput(self);
                saveBinaryData(self);
                continue;
            }

            getInput(self);
            if (s.input.length == 0 && s.state !== "ok")
                return false; // Wait for input

            result = tx.exec(s.input);
            if (! result)
                break; // done or error.

            //  result[0] contains everything that matched, including any initial whitespace.
            //  result[1] contains any punctuation that was matched, or true, false, or null.
            //  result[2] contains a matched number, still in string form.
            //  result[3] contains a matched binary marker
            //  result[4] contains a matched string, without quotes but with escapement.
            if (result[1]) {
                // Token: Execute the action for this state and token.
                tokenActions.action[result[1]][s.state](self);
            }
            else if (result[2]) {
                // Number token: Convert the number string into a number value and execute
                // the action for this state and number.
                s.value = +result[2];
                tokenActions.number[s.state](self);
            }
            else if (result[3]) {
                s.fileSize = +result[3];
                s.bytesLeft = s.fileSize;
                tokenActions.binary[s.state](self);
            }
            else {
                // String token: Replace the escapement sequences and execute the action for
                // this state and string.
                s.value = debackslashify(result[4]);
                tokenActions.string[s.state](self);
            }

            s.input = s.input.slice(result[0].length);
        }
    }
    catch (e) {
        s.state = e;
    }

    // If state isn't ok or values other than whitespace at the end then
    // JSON was malformed.
    if (s.state !== "ok" || nonws.test(s.input)) {
        throw (s.state instanceof APIError) ? s.state : new APIError('StreamSyntaxError');
    }

    return true; // Successfully parsed
};

var tokenActions = {
    string: {   // The actions for string tokens
        go: function(self) {
            self.s.state = "ok";
        },
        firstokey: function(self) {
            self.s.key = self.s.value;
            self.s.state = "colon";
        },
        okey: function(self) {
            self.s.key = self.s.value;
            self.s.state = "colon";
        },
        ovalue: function(self) {
            self.s.state = "ocomma";
        },
        firstavalue: function(self) {
            self.s.state = "acomma";
        },
        avalue: function(self) {
            self.s.state = "acomma";
        }
    },

    number: {   // The actions for number tokens
        go: function(self) {
            self.s.state = "ok";
        },
        ovalue: function(self) {
            self.s.state = "ocomma";
        },
        firstavalue: function(self) {
            self.s.state = "acomma";
        },
        avalue: function(self) {
            self.s.state = "acomma";
        }
    },

    binary: {   // The actions for binary tokens
        go: function(self) {
            self.s.state = "ok";
        },
        ovalue: function(self) {
            self.s.state = "ocomma";
        }
    },

    action: {
        "{": {
            go: function(self) {
                self.s.stack.push({state: "ok"});
                self.s.container = {};
                self.s.state = "firstokey";
            },
            ovalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "ocomma", key: self.s.key});
                self.s.container = {};
                self.s.state = "firstokey";
            },
            firstavalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "acomma"});
                self.s.container = {};
                self.s.state = "firstokey";
            },
            avalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "acomma"});
                self.s.container = {};
                self.s.state = "firstokey";
            }
        },
        "}": {
            firstokey: function(self) {
                var pop = self.s.stack.pop();
                self.s.value = self.s.container;
                self.s.container = pop.container;
                self.s.key = pop.key;
                self.s.state = pop.state;
            },
            ocomma: function(self) {
                var pop = self.s.stack.pop();
                self.s.container[self.s.key] = self.s.value;
                self.s.value = self.s.container;
                self.s.container = pop.container;
                self.s.key = pop.key;
                self.s.state = pop.state;
            }
        },
        "[": {
            go: function(self) {
                self.s.stack.push({state: "ok"});
                self.s.container = [];
                self.s.state = "firstavalue";
            },
            ovalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "ocomma", key: self.s.key});
                self.s.container = [];
                self.s.state = "firstavalue";
            },
            firstavalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "acomma"});
                self.s.container = [];
                self.s.state = "firstavalue";
            },
            avalue: function(self) {
                self.s.stack.push({container: self.s.container, state: "acomma"});
                self.s.container = [];
                self.s.state = "firstavalue";
            }
        },
        "]": {
            firstavalue: function(self) {
                var pop = self.s.stack.pop();
                self.s.value = self.s.container;
                self.s.container = pop.container;
                self.s.key = pop.key;
                self.s.state = pop.state;
            },
            acomma: function(self) {
                var pop = self.s.stack.pop();
                self.s.container.push(self.s.value);
                self.s.value = self.s.container;
                self.s.container = pop.container;
                self.s.key = pop.key;
                self.s.state = pop.state;
            }
        },
        ":": {
            colon: function(self) {
                if (Object.hasOwnProperty.call(self.s.container, self.s.key)) {
                    throw new APIError('StreamSyntaxDuplicateKey', self.s.key); // Duplicate key
                }
                self.s.state = "ovalue";
            }
        },
        ",": {
            ocomma: function(self) {
                self.s.container[self.s.key] = self.s.value;
                self.s.state = "okey";
            },
            acomma: function(self) {
                self.s.container.push(self.s.value);
                self.s.state = "avalue";
            }
        },
        "true": {
            go: function(self) {
                self.s.value = true;
                self.s.state = "ok";
            },
            ovalue: function(self) {
                self.s.value = true;
                self.s.state = "ocomma";
            },
            firstavalue: function(self) {
                self.s.value = true;
                self.s.state = "acomma";
            },
            avalue: function(self) {
                self.s.value = true;
                self.s.state = "acomma";
            }
        },
        "false": {
            go: function(self) {
                self.s.value = false;
                self.s.state = "ok";
            },
            ovalue: function(self) {
                self.s.value = false;
                self.s.state = "ocomma";
            },
            firstavalue: function(self) {
                self.s.value = false;
                self.s.state = "acomma";
            },
            avalue: function(self) {
                self.s.value = false;
                self.s.state = "acomma";
            }
        },
        "null": {
            go: function(self) {
                self.s.value = null;
                self.s.state = "ok";
            },
            ovalue: function(self) {
                self.s.value = null;
                self.s.state = "ocomma";
            },
            firstavalue: function(self) {
                self.s.value = null;
                self.s.state = "acomma";
            },
            avalue: function(self) {
                self.s.value = null;
                self.s.state = "acomma";
            }
        }
    }
};

var debackslashify = function(text)
{
    return text.replace(/\\(?:u(.{4})|([^u]))/g, function (ignore, b, c) {
        return b ? String.fromCharCode(parseInt(b, 16)) : escapes[c];
    });
};

module.exports = Parser;
