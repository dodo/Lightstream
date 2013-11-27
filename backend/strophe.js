// Dependency: https://github.com/strophe/strophejs
// TODO
var xmpp = window.Strophe;

module.exports = StropheBackend;
exports.StropheBackend = StropheBackend;
function StropheBackend(frontend) {
    this.frontend = frontend;
}
var proto = StropheBackend.prototype;

proto.Presence = function (attrs) {xmpp.Builder.call(this, 'presence', attrs)};
proto.Message  = function (attrs) {xmpp.Builder.call(this, 'message',  attrs)};
proto.Iq       = function (attrs) {xmpp.Builder.call(this, 'iq',       attrs)};
proto.Presence.prototype = proto.Message.prototype = proto.Iq.prototype = xmpp.Builder.prototype;
proto.Stanza = xmpp.Builder;
proto.JID = xmpp.JID; // FIXME

proto.onState = function (state) {
    // FIXME add more eventhandlers to lightstream
};

proto.connect = function (options) {
    if (this.connection) return this;
    this.connection = new xmpp.Connection(options.url);
    this.connection.xmlInput = this.frontend.onStanza; // FIXME onStanza should only eat ltx style elements
    this.connection.error = this.frontend.onError;
    this.connection.fatal = this.frontend.onError;
    // FIXME add more eventhandlers to lightstream
    this.connection.connect(options.jid, options.password, this.onState.bind(this));
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

