var __slice = [].slice;
var inspect = require('util').inspect;
var debug = require('debug')('ls:xep:disco');
var extend = require('extend');
var util = require('./util');

var NS = {
    'disco#info': "http://jabber.org/protocol/disco#info",
    'disco#items': "http://jabber.org/protocol/disco#items",
};
exports.NS = NS;

var identities = [];

var features = [NS['disco#info']];

// XEP-0030

exports.Disco = Disco;
function Disco(api) {
    this.api = api;
    // initialize
    this.identities = identities.slice();
    this.features = features.slice();
    api.match("self::iq[@type=get]/info:query",
             {info:NS['disco#info']},
              this.query.bind(this));
};
Disco.identities = identities;
Disco.features = features;
var proto = Disco.prototype;

proto.clearCache = function () {
    debug('clear cache');
    this.api.cache = {};
    this.api.emit('clear cache');
    return this;
};

proto.addFeature = function (/* features… */) {
    var args = __slice.call(arguments);
    debug("addFeature: " + inspect(args));
    this.api.emit('identities', args);
    this.features.splice.apply(this.features,
        [this.features.length, 0].concat(__slice.call(arguments)));
    return this;
};

proto.addIdentity = function (/* identities */) {
    var args = __slice.call(arguments);
    debug("addIdentity: " + inspect(args));
    this.api.emit('identities', args);
    this.identities.splice.apply(this.identities,
        [this.identities.length, 0].concat(args));
    return this;
};

proto.info = function (to, callback) {
    to = typeof(to) === 'string' ? new this.api.xmpp.JID(to) : to;
    if(!to.resource) return; // skip
    var id = util.id("info");
    this.api.send(new this.api.xmpp.Iq({to:to,id:id,type:'get'})
        .c("query", {xmlns:NS['disco#info']}).up(), {
        xpath:"self::iq[@type=result and @id='" + id + "']/info:query",
        ns:{info:NS['disco#info']},
        callback:function (err, stanza, query) {
            if (err) return callback(err, stanza, query);
            var res = {
                identities:query.getChildren("identity").map(function (i) {return i.attrs}),
                features:query.getChildren("feature").map(function (f) {return f.attrs.var}),
            };
            if (this.api.cache) this.api.cache[stanza.attrs.from] =
                    extend(this.api.cache[stanza.attrs.from] || {}, res);
            this.api.emit('info', res);
            callback(null, res);
        }.bind(this),
    });
};

proto.query = function (stanza, match) {
    debug('query');
    var query = new this.api.xmpp.Iq({
        from:stanza.attrs.to,
        to:stanza.attrs.from,
        id:stanza.attrs.id,
        type:'result',
    }).c("query", {xmlns:NS['disco#info']});
    for (var i = 0, length = this.identities.length; i < length; i++) {
        query.c("identity", this.identities[i]);
    }
    for (var i = 0, length = this.features.length; i < length; i++) {
        query.c("feature", {var:this.features[i]});
    }
    this.api.emit('query', query);
    this.api.send(query.up());
    return this;
};

