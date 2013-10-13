var xmpp = require('node-xmpp');

exports.Presence = Presence;
function Presence(router) {
    this.router = router;
    router.match("self::presence", this.presence.bind(this));
};

var proto = Presence.prototype;

proto.send = function (opts) {
    var attrs = opts && opts.to ? {to:opts.to} : null;
    if (attrs && opts && opts.from) attrs.from = opts.from;
    if (attrs && opts && opts.type) attrs.type = opts.type;
    var presence = new xmpp.Presence(attrs);
    if (opts) {
        ["status", "priority", "show"].forEach(function (key) {
            if (opts[key]) presence.c(key).t(opts[key]);
        });
        if (opts.payload) presence.t(opts.payload);
    }
    this.router.emit('send presence', presence);
    console.log("presenceOUT", ""+presence)
    this.router.send(presence);
    return this;
};

proto.offline = function () {
    this.send({type:'unavailable', from:this.router.connection.jid});
};

proto.probe = function (to) {
    this.send({from:this.router.connection.jid, to:to});
//     this.send({type:'probe', from:this.router.connection.jid, to:to});
}

proto.presence = function (stanza) {
    console.log("presenceIN", ""+stanza)
    this.router.emit('presence', stanza);
};
