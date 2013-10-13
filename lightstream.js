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
    this.backend = options.backend;
    this.xmpp = extend({}, exports.xmpp);
    this.connection = this.backend.connection;
    this.router = new Router(this, options.timeout);
    this.extension = {};
}

Lightstream.prototype.send = function (stanza) {
    this.backend.send(stanza);
    return this;
};

Lightstream.prototype.registerExtension = function (name, extension) {
    if (this.extension[name]) {
        console.warn("Extension '%s' exists allready.", name);
        return this;
    }
    return (this.extension[name] = extension);
};
