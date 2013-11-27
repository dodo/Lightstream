var util = require('./util');

var NS = {
    ping: 'urn:xmpp:ping',
};
exports.NS = NS;

// XEP-0199

exports.Ping = Ping;
function Ping(lightstream) {
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    this._emit = lightstream.emit.bind(lightstream);
    lightstream.registerExtension('ping', this);
    // initialize
    this.router.match("self::iq/urn:ping", {urn:NS.ping}, this.pong.bind(this));
    if (lightstream.extension['disco'])
        lightstream.extension.disco.addFeature(NS.ping);
};
Ping.NS = NS;
var proto = Ping.prototype;

proto.ping = function (to, callback) {
    this.router.send(new this._xmpp.Iq({to:to,id:util.id("ping"),type:'get'})
        .c("ping", {xmlns:NS.ping}).up(), callback);
};

proto.pong = function (stanza, match) {
    this._emit('ping', stanza, match);
    this.router.send(new this._xmpp.Iq({
        to:stanza.attrs.from,
        id:stanza.attrs.id,
        type:'result',
    }));
};
