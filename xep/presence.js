var debug = require('debug')('ls:xep:presence');

exports.NS = {};

// XMPP-Core

exports.Presence = Presence;
function Presence(api) {
    this.api = api;
    // initialize
    api.match("/presence", this.presence.bind(this));
};

var proto = Presence.prototype;

proto.send = function (opts) {
    var attrs = opts && opts.to ? {to:opts.to} : null;
    if (attrs && opts && opts.from) attrs.from = opts.from;
    if (attrs && opts && opts.type) attrs.type = opts.type;
    var presence = new this.api.xmpp.Presence(attrs);
    if (opts) {
        ["status", "priority", "show"].forEach(function (key) {
            if (opts[key]) presence.c(key).t(opts[key]);
        });
        if (opts.payload) presence.t(opts.payload);
    }
    this.api.emit('send', presence);
    debug("send: " + presence)
    this.api.send(presence);
    return this;
};

proto.offline = function () {
    this.api.emit('offline');
    this.send({type:'unavailable'});
};

proto.probe = function (to) {
    this.api.emit('probe', to);
    this.send({type:'probe', from:this.api.jid.bare(), to:to});
}

proto.presence = function (stanza) {
    debug("receive: " + stanza)
    this.api.emit('receive', stanza);
};
