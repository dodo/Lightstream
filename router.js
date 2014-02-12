var __slice = [].slice;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var debug = require('debug')('ls:router');
var ltxXPath = require('ltx-xpath').XPath;


exports.Router = Router;
inherits(Router, EventEmitter);
function Router(frontend, timeout) {
    Router.super_.call(this);
    this.frontend = frontend;
    this.callbacks = {};
    this.timeout = timeout || 5000; // 5 seconds
    this.xpath = new ltxXPath();
    this.onStanza = this.onStanza.bind(this);
}
var proto = Router.prototype;

proto.match = function (xpath/*[*/, namespaces/*]*/, callback) {
    this.xpath.on(xpath, namespaces, callback);
    return this;
};

proto.send = function (stanza/*[*/, options) {
    if (options) {
        var callback;
        if (typeof options !== 'function') {
            callback = options.callback;
        } else {
            callback = options;
            options = {};
        }
        if (stanza.attrs.id) {
            // when no xpath then no namespaces, so we track by id and name
            this.request(options.xpath,
                         options.ns || {id:stanza.attrs.id, name:stanza.name},
                         callback);
        } else {
            console.warn("router.send(…): stanza callback ignored. missing attr 'id'.");
        }
    }
    this.frontend.send(stanza);
    return (options && options.chain === false) ? stanza : this;
};

proto.request = function (xpath/*[*/, namespaces/*]*/, callback) {
    debug('request');
    var stanza;
    if (!callback) {
        callback = namespaces;
        namespaces = undefined;
    }
    if (!xpath) {
        stanza = namespaces;
        namespaces = undefined;
    }
    var timeout = setTimeout(function () {
        debug("timeout");
        if (xpath) {
            this.xpath.removeListener(xpath, response);
        } else {
            delete this.callbacks[stanza.id];
        }
        if (callback) callback("timeout");
    }.bind(this), this.timeout);
    var response = function (/*stanza, match*/) {
        clearTimeout(timeout);
        if (callback) callback.apply(this, [null].concat(__slice.call(arguments)));
    };
    if (xpath) {
        this.xpath.once(xpath, namespaces, response);
    } else {
        if (this.callbacks[stanza.id]) {
            console.warn("overwriting callback for stanza id '"+stanza.id+"'.");
        }
        stanza.cb = response;
        this.callbacks[stanza.id] = stanza;
    }
    return this;
};

proto.onStanza = function (stanza) {
    // dispatch stanza to callback or handle error
    var id = stanza.attrs.id;
    if (id && this.callbacks[id] && this.callbacks[id].name === stanza.name) {
        this.callbacks[id].cb();
        delete this.callbacks[id];
    } else if (!this.xpath.match(stanza)) {
        debug("unhandled stanza " + stanza);
        this.emit('error', "unhandled stanza " + stanza, stanza);
    }
};

