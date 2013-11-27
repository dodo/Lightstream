// Dependency: npm install node-xmpp-core node-xmpp-client
var xmpp;

module.exports = NodeXmppBackend;
exports.NodeXmppBackend = NodeXmppBackend;
function NodeXmppBackend(frontend) {
    xmpp = xmpp || require('node-xmpp-core');
    xmpp.Client = xmpp.Client || require('node-xmpp-client');
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
    var client = this.client = new xmpp.Client(options);
    // FIXME
    Object.defineProperty(this.frontend.router, 'jid', {
        get: function() {
            return client.jid;
        }
    });
    this.client.on('stanza', this.frontend.onStanza);
    this.client.on('error',  this.frontend.onError);
    ['online','offline','end'].forEach(function (event) {
        client.on('event', this.frontend.emit.bind(this.frontend, event));
    });
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

