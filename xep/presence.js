
exports.NS = {};

// XMPP-Core

exports.Presence = Presence;
function Presence(lightstream) {
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    this._emit = lightstream.emit.bind(lightstream);
    lightstream.registerExtension('presence', this);
    // initialize
    this.router.match("self::presence", this.presence.bind(this));
};

var proto = Presence.prototype;

proto.send = function (opts) {
    var attrs = opts && opts.to ? {to:opts.to} : null;
    if (attrs && opts && opts.from) attrs.from = opts.from;
    if (attrs && opts && opts.type) attrs.type = opts.type;
    var presence = new this._xmpp.Presence(attrs);
    if (opts) {
        ["status", "priority", "show"].forEach(function (key) {
            if (opts[key]) presence.c(key).t(opts[key]);
        });
        if (opts.payload) presence.t(opts.payload);
    }
    this._emit('send presence', presence);
    console.log("presenceOUT", ""+presence)
    this.router.send(presence);
    return this;
};

proto.offline = function () {
    this.send({type:'unavailable'});
};

proto.probe = function (to) {
    this.send({type:'probe', from:this.router.jid.bare(), to:to});
}

proto.presence = function (stanza) {
    console.log("presenceIN", ""+stanza)
    this._emit('presence', stanza);
};
