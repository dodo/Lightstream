// Dependency: npm install node-xmpp-core node-xmpp-client
var xmpp;

module.exports = NodeXmppBackend;
exports.NodeXmppBackend = NodeXmppBackend;
function NodeXmppBackend(frontend) {
    xmpp = xmpp || require('node-xmpp-core');
    xmpp.Client = xmpp.Client || require('node-xmpp-client');
    this.frontend = frontend;
    this.Presence = xmpp.Stanza.Presence;
    this.Message = xmpp.Stanza.Message;
    this.Element = xmpp.ltx.Element;
    this.Stanza = xmpp.Stanza.Stanza;
    this.Iq = xmpp.Stanza.Iq;
    this.JID = xmpp.JID;
}
var proto = NodeXmppBackend.prototype

proto.connect = function (options) {
    if (this.client) return this;
    var frontend = this.frontend;
    var client = this.client = new xmpp.Client(options);
    if (!frontend.router.jid) {
        var that = this;
        Object.defineProperty(frontend.router, 'jid', {
            get: function() {
                return that.client.jid;
            }
        });
    }
    client.on('stanza', frontend.onStanza);
    client.on('error',  frontend.onError);
    ['online','offline','reconnect','disconnect','end'].forEach(function (event) {
        client.on(event, frontend.emit.bind(frontend, event));
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

