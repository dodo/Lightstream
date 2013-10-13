var __slice = [].slice;
var extend = require('extend');
var util = require('./util');

var NS = {
    'disco#info': "http://jabber.org/protocol/disco#info",
    'disco#items': "http://jabber.org/protocol/disco#items",
};

var identities = [];

var features = [NS['disco#info']];

// XEP-0030

exports.Disco = Disco;
function Disco(lightstream) {
    this._xmpp = lightstream.xmpp;
    this.cache = lightstream.cache;
    this.router = lightstream.router;
    lightstream.registerExtension('disco', this);
    // initialize
    this.identities = identities.slice();
    this.features = features.slice();
    this.router.match("self::iq[@type=get]/info:query",
                        {info:NS['disco#info']},
                        this.get_info.bind(this));
};
Disco.identities = identities;
Disco.features = features;
Disco.NS = NS;
var proto = Disco.prototype;

proto.clearCache = function () {
    this.cache = {};
    return this;
};

proto.addFeature = function (/* features… */) {
    this.features.splice.apply(this.features,
        [this.features.length, 0].concat(__slice.call(arguments)));
    return this;
};

proto.addIdentity = function (/* identities */) {
    this.identities.splice.apply(this.identities,
        [this.identities.length, 0].concat(__slice.call(arguments)));
    return this;
};

proto.info = function (to, callback) {
    to = typeof(to) === 'string' ? new this._xmpp.JID(to) : to;
    if(!to.resource) return; // skip
    var id = util.id("info");
    this.router.send(new this._xmpp.Iq({to:to,id:id,type:'get'})
        .c("query", {xmlns:NS['disco#info']}).up(), {
        xpath:"self::iq[@type=result and @id='" + id + "']/info:query",
        ns:{info:NS['disco#info']},
        callback:function (err, stanza) {
            if (err) return callback(err, stanza);
            var query = stanza.getChild("query");
            var res = {
                identities:query.getChildren("identity").map(function (i) {return i.attrs}),
                features:query.getChildren("feature").map(function (f) {return f.attrs.var}),
            };
            if (this.cache) this.cache[stanza.attrs.from] =
                    extend(this.cache[stanza.attrs.from] || {}, res);
            callback(null, res);
        }.bind(this),
    });
};

proto.get_info = function (stanza, match) {
    this.router.emit('info', stanza, match);
    var query = new this._xmpp.Iq({
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
    this.router.send(query.up());
    return this;
};

