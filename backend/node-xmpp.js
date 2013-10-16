var xmpp;

module.exports = NodeXmppBackend;
exports.NodeXmppBackend = NodeXmppBackend;
function NodeXmppBackend(frontend) {
    xmpp = xmpp || require('node-xmpp');
    this.frontend = frontend;
    this.Presence = xmpp.Presence;
    this.Message = xmpp.Message;
    this.Stanza = xmpp.Stanza;
    this.JID = xmpp.JID;
    this.Iq = xmpp.Iq;
}
var proto = NodeXmppBackend.prototype

proto.connect = function (options) {
    if (this.client) return this;
    this.client = new xmpp.Client(options);
    this.client.on('stanza', this.frontend.onStanza);
    this.client.on('error',  this.frontend.onError);
    return this;
};

proto.disconnect = function (options) {
    if (this.client) this.client.end();
    delete this.client;
    return this;
};

proto.send = function (stanza) {
    if (this.client) this.client.send(stanza);
    return this;
};

