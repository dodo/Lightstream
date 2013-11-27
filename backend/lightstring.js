var xmpp = window.lightstring;

module.exports = LightstringBackend;
exports.LightstringBackend = LightstringBackend;
function LightstringBackend(frontend) {
    this.frontend = frontend;
}
var proto = LightstringBackend.prototype;

proto.Presence = function (attrs) {xmpp.Element.call(this, 'presence', attrs)};
proto.Message  = function (attrs) {xmpp.Element.call(this, 'message',  attrs)};
proto.Iq       = function (attrs) {xmpp.Element.call(this, 'iq',       attrs)};
proto.Presence.prototype = proto.Message.prototype = proto.Iq.prototype = xmpp.Element.prototype;
proto.Stanza = xmpp.Element;
proto.JID = xmpp.JID;

proto.connect = function (options) {
    if (this.connection) return this;
    this.connection = new xmpp.Connection(options.url);
    this.connection.onStanza = this.frontend.onStanza;
    this.connection.onError  = this.frontend.onError;
    this.connection.onFailure= this.frontend.onError;
    this.connection.onClose  = this.frontend.emit.bind(this.frontend, 'end');
    this.connection.onConnected = this.frontend.emit.bind(this.frontend, 'online');
    this.connection.onDisconnecting = this.frontend.emit.bind(this.frontend, 'offline');
    this.connection.connect(options.jid, options.password);
    return this;
};

proto.disconnect = function (options) {
    if (this.connection) this.connection.disconnect();
    delete this.client;
    return this;
};

proto.send = function (stanza) {
    if (this.connection) this.connection.send(stanza);
    return this;
};

