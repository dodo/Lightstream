'use strict';

~function () {
    var ltxXPath = "require('ltx-xpath')"; // FIXME

/* Lightstream xmpp framework */

window.Lightstream = {};

// config
Lightstream.timeout = 1000; // does a second make sense?

Lightstream.Router = function (con) {
    this.connection = con;
    this.xpath = new ltxXPath();
    // listen for events
    if (con.onstanza || con.onstatechange) {
        throw new Error("please provide unused lightstring connection.");
    }
    con.onstatechange = this.onstatechange.bind(this);
    con.onstanza = this.onstanza.bind(this);
};

Lightstream.Router.prototype = new EventEmitter();

Lightstream.Router.prototype.match = function (xpath, namespaces, callback) {
    this.xpath.on(xpath, namespaces, callback);
    return this;
};

Lightstream.Router.prototype.send = function (stanza) {
    this.connection.send(stanza);
    return this;
};

Lightstream.Router.prototype.request = function (xpath, namespaces, callback) {
    // TODO autogenerate xpath from stanza to be send
    var that = this;
    if (typeof(namespaces) === 'function') {
        callback = namespaces;
        namespaces = undefined;
    }
    var timeout = setTimeout(function () {
        that.xpath.removeListener(xpath, response);
        if (callback) callback("timeout");
    }, Lightstream.timeout);
    this.xpath.on(xpath, namespaces, function response(stanza) {
        clearTimeout(timeout);
        that.xpath.removeListener(xpath, response);
        if (callback) callback(null, stanza);
    });
    return this;
};

// connection handlers

Lightstream.prototype.onstanza = function (stanza) {
    // dispatch stanza to callback or handle error
    if (!this.xpath.match(stanza)) {
        this.emit('error', "unhandled stanza", stanza);
    }
};

Lightstream.Router.prototype.onstatechange = function (state) {
    // supose the state is a string
    this.emit(state);
};


}();
