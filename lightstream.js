var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var extend = require('extend');
var Router = require('./router').Router;


Lightstream.xmpp = {
    Presence: function () {throw Error("no backend loaded!")},
    Message: function () {throw Error("no backend loaded!")},
    Stanza: function () {throw Error("no backend loaded!")},
    JID: function () {throw Error("no backend loaded!")},
    Iq: function () {throw Error("no backend loaded!")},
};

module.exports = Lightstream;
Lightstream.Lightstream = Lightstream;
inherits(Lightstream, EventEmitter);
function Lightstream(options) {
    Lightstream.super_.call(this);
    options = options || {};
    this.extension = {};
    this.cache = options.cache;
    this.xmpp = extend({}, Lightstream.xmpp);
    this.registerBackend(options.backend);
    this.router = new Router(this, options.timeout);
    this.onStanza = this.router.onStanza;
    this.onError = this.emit.bind(this, 'error');
}
var proto = Lightstream.prototype;


proto.connect = function (jid, password, options) {
    options = extend({jid:jid, password:password}, options || {});
    this.backend.connect(options);
    return this;
};

proto.disconnect = function (options) {
    this.backend.disconnect(options);
    return this;
};
// mimick node-xmpp.Client
proto.end = proto.disconnect;

proto.send = function (stanza) {
    this.backend.send(stanza);
    return this;
};

proto.use = function (/*extensions…*/) {
    Array.prototype.forEach.call(arguments, function (Extension) {
        new Extension(this); // extension should register itself
    }.bind(this));
    return this;
}

proto.registerExtension = function (name, extension) {
    if (this.extension[name]) {
        console.warn("Extension '%s' exists allready.", name);
        return this;
    }
    return (this.extension[name] = extension);
};

proto.registerBackend = function (Backend) {
    var backend = new Backend(this);
    this.xmpp.Presence = backend.Presence;
    this.xmpp.Message = backend.Message;
    this.xmpp.Stanza = backend.Stanza;
    this.xmpp.JID = backend.JID;
    this.xmpp.Iq = backend.Iq;
    return (this.backend = backend);
};

