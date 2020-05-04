/*jshint node: true */
"use strict";

/**
 * 
 * 
 * @param {string} kind 
 */
var Terms = function(kind) {
    kind = kind || 'and';
    kind = kind.toLowerCase();
    if (kind != 'and' && kind != 'or')
        throw new Error('TermsIllegalKind', kind);
    
    this.s = {
        kind: kind,
        list: []
    };
};

Object.defineProperties(Terms.prototype, {
    'kind': {
        enumerable:true,
        get: function() { return this.s.kind; },
    },
    'list': {
        enumerable:true,
        get: function() { return this.s.list; }
    }
});

Terms.prototype.add = function(name, value, op) {
    var term = [name, value, op];
    this.s.list.push(term);
};

Terms.prototype.addTerms = function(kind) {
    var child = new Terms(kind);
    this.s.list.push(child);
    return child;
};

Terms.prototype.addAnd = function() {
    return this.addTerms('and');
};

Terms.prototype.addOr = function() {
    return this.addTerms('or');
};

Terms.prototype.toArray = function() {
    var result = [];
    result[0] = this.s.kind;

    var list = [];
    for (var i = 0; i < this.s.list.length; i++) {
        var term = this.s.list[i];
        if (term instanceof Terms)
            term = term.toArray();
        list.push(term);
    }
    result[1] = list;

    return result;
};

module.exports = Terms;
