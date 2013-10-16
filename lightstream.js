var extend = require('extend');
var Router = require('./lib/router').Router;

exports.xmpp = {
    Presence: function () {throw Error("no backend loaded!")},
    Message: function () {throw Error("no backend loaded!")},
    Stanza: function () {throw Error("no backend loaded!")},
    JID: function () {throw Error("no backend loaded!")},
    Iq: function () {throw Error("no backend loaded!")},
};

exports.Lightstream = Lightstream;
function Lightstream(options) {
    options = options || {};
    this.extension = {};
    this.xmpp = extend({}, exports.xmpp);
    this.registerBackend(options.backend);
    this.router = new Router(this, options.timeout);
    this.onStanza = this.router.onStanza;
}

Lightstream.prototype.onError = function (err) {
    console.error(err);
};

Lightstream.prototype.connect = function (jid, password, options) {
    options = extend({jid:jid, password:password}, options || {});
    this.backend.connect(options);
    return this;
};

Lightstream.prototype.disconnect = function (options) {
    this.backend.disconnect(options);
    return this;
};

Lightstream.prototype.send = function (stanza) {
    this.backend.send(stanza);
    return this;
};

Lightstream.prototype.use = function (/*extensions…*/) {
    Array.prototype.forEach.call(arguments, function (Extension) {
        new Extension(this); // extension should register itself
    }.bind(this));
    return this;
}

Lightstream.prototype.registerExtension = function (name, extension) {
    if (this.extension[name]) {
        console.warn("Extension '%s' exists allready.", name);
        return this;
    }
    return (this.extension[name] = extension);
};

Lightstream.prototype.registerBackend = function (Backend) {
    var backend = new Backend(this);
    this.xmpp.Presence = backend.Presence;
    this.xmpp.Message = backend.Message;
    this.xmpp.Stanza = backend.Stanza;
    this.xmpp.JID = backend.JID;
    this.xmpp.Iq = backend.Iq;
    return (this.backend = backend);
};

