
module.exports = NodeXmppBackend;
exports.NodeXmppBackend = NodeXmppBackend;
function NodeXmppBackend(frontend) {
    var xmpp = require('node-xmpp');
    this.xmpp = xmpp;
    this.frontend = frontend;
    this.Presence = xmpp.Presence;
    this.Message = xmpp.Message;
    this.Stanza = xmpp.Stanza;
    this.JID = xmpp.JID;
    this.Iq = xmpp.Iq;
}

NodeXmppBackend.prototype.connect = function (options) {
    if (this.client) return this;
    this.client = new this.xmpp.Client(options);
    this.client.on('stanza', this.frontend.onStanza);
    this.client.on('error',  this.frontend.onError);
    return this;
};

NodeXmppBackend.prototype.send = function (stanza) {
    if (this.client) this.client.send(stanza);
    return this;
};

