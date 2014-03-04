var debug = require('debug')('ls:xep:ping');
var util = require('./util');

var NS = {
    ping: 'urn:xmpp:ping',
};
exports.NS = NS;

// XEP-0199

exports.Ping = Ping;
function Ping(api) {
    this.api = api;
    // initialize
    api.match("self::iq/urn:ping", {urn:NS.ping}, this.pong.bind(this));
    if (api.extension['disco'])
        api.extension.disco.addFeature(NS.ping);
};
Ping.NS = NS;
var proto = Ping.prototype;

proto.ping = function (to, callback) {
    debug('ping');
    this.api.emit('send', stanza, match);
    this.api.send(new this.api.xmpp.Iq({to:to,id:util.id("ping"),type:'get'})
        .c("ping", {xmlns:NS.ping}).up(), callback);
};

proto.pong = function (stanza, match) {
    debug('pong');
    this.api.emit('receive', stanza, match);
    this.api.send(new this.api.xmpp.Iq({
        to:stanza.attrs.from,
        id:stanza.attrs.id,
        type:'result',
    }));
};
