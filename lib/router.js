var __slice = [].slice;
var EventEmitter = require('events').EventEmitter;

var inherits = require('inherits');
var ltxXPath = require('ltx-xpath').XPath;


exports.Router = Router;
inherits(Router, EventEmitter);
function Router(frontend, timeout) {
    this.frontend = frontend;
    this.timeout = timeout || 5000; // 5 seconds
    this.xpath = new ltxXPath();
    this.onStanza = this.onStanza.bind(this);
}

Router.prototype.match = function (xpath/*[*/, namespaces/*]*/, callback) {
    this.xpath.on(xpath, namespaces, callback);
    return this;
};

Router.prototype.send = function (stanza) {
    this.connection.send(stanza);
    return this;
};

Router.prototype.request = function (xpath/*[*/, namespaces/*]*/, callback) {
    // TODO autogenerate xpath from stanza to be send
    if (!callback) {
        callback = namespaces;
        namespaces = undefined;
    }
    var timeout = setTimeout(function () {
        this.xpath.removeListener(xpath, response);
        if (callback) callback("timeout");
    }.bind(this), this.timeout);
    var response = function (/*stanza, match*/) {
        clearTimeout(timeout);
        if (callback) callback.apply(this, [null].concat(__slice.call(arguments)));
    };
    this.xpath.once(xpath, namespaces, response);
    return this;
};

Router.prototype.onStanza = function (stanza) {
    // dispatch stanza to callback or handle error
    if (!this.xpath.match(stanza)) {
        this.emit('error', "unhandled stanza " + stanza, stanza);
    }
};

