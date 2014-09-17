var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var debug = require('debug')('ls:client');
var extend = require('extend');
var Router = require('./router').Router;
var Capsule = require('./lib/capsule');


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
    this.router.on('error', this.onError);
}
var proto = Lightstream.prototype;


proto.connect = function (jid, password, options) {
    debug('connect');
    options = extend({jid:jid, password:password}, options || {});
    this.backend.connect(options);
    this.emit('connect', jid);
    return this;
};

proto.disconnect = function (options) {
    debug('disconnect');
    var jid = this.jid;
    this.backend.disconnect(options);
    this.emit('disconnect', jid);
    return this;
};
// mimick node-xmpp.Client
proto.end = proto.disconnect;

proto.send = function (stanza) {
    this.backend.send(stanza);
    return this;
};

proto.use = function (arg0/*extensions…*/) {
    var args = arguments.length === 1 && Array.isArray(arg0) ? arg0 : arguments;
    Array.prototype.forEach.call(args, function (Extension) {
        var name = Extension.name.toLowerCase();
        debug('use ' + name);
        this.registerExtension(name, new Extension(new Capsule(this, name)));
    }.bind(this));
    return this;
}

proto.registerExtension = function (name, extension) {
    debug('register ' + name);
    if (this.extension[name]) {
        console.warn("Extension '%s' exists allready.", name);
        return this;
    }
    this.emit('register extension', extension);
    return (this.extension[name] = extension);
};

proto.registerBackend = function (Backend) {
    debug('reference ' + Backend.name);
    var backend = new Backend(this);
    this.xmpp.Presence = backend.Presence;
    this.xmpp.Message = backend.Message;
    this.xmpp.Element = backend.Element;
    this.xmpp.Stanza = backend.Stanza;
    this.xmpp.JID = backend.JID;
    this.xmpp.Iq = backend.Iq;
    this.emit('register backend', backend);
    return (this.backend = backend);
};

