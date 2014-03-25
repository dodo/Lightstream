var debug = require('debug')('ls:xep:message');
var util = require('./util');

// XEP-Core

exports.Message = Message;
function Message(api) {
    this.api = api;
    // initialize
    api.match("/message", this.on_message.bind(this));
};
var proto = Message.prototype;

proto.send = function (opts) {
    var attrs = {};
    if (opts && opts.id) attrs.id = opts.id;
    if (opts && opts.to) attrs.to = opts.to;
    if (opts && opts.from) attrs.from = opts.from;
    if (opts && opts.type) attrs.type = opts.type;
    if (opts && opts.lang) attrs['xml:lang'] = opts.lang;
    var message = new this.api.xmpp.Message(attrs);
    if (opts && opts.body) message.c('body').t(opts.body);
    this.api.emit('send', message);
    debug("send: " + message)
    this.api.send(message);
    return this;
};

proto.on_message = function (stanza) {
    this.api.emit('receive', stanza);
    return this;
};
