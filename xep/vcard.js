var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var debug = require('debug')('ls:xep:vcard');
var util = require('./util');

var NS = {
    vcard: 'vcard-temp',
    update: 'vcard-temp:x:update',
};
exports.NS = NS;

// XEP-0054
// XEP-0153

exports.VCard = VCard;
inherits(VCard, EventEmitter);
function VCard(lightstream) {
    VCard.super_.call(this);
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    this._emit = lightstream.emit.bind(lightstream);
    lightstream.registerExtension('vcard', this);
    // initialize
    this.on('newListener', onlistener);
    function onlistener(event, listener) {
        if (event !== 'update') return;
        this.removeListener('newListener', onlistener);
        this.router.match("self::presence[not(@type)]/child::vcupdate:x",
                          {vcupdate:NS.update},
                          this.emit.bind(this, 'update'));
    }
    this.router.on('send presence', function (presence) {
        if (!this.hash || presence.attrs.type) return;
        presence.c("x", {xmlns:NS.update}).c("photo", this.hash);
    }.bind(this));
};
var proto = VCard.prototype;

proto.setPhotoHash = function (hash) {
    this.hash = hash;
    debug("set hash: " + hash)
    return this;
};

proto.get = function (to, callback) {
    debug('get');
    if (!callback) {callback = to; to = undefined;}
    var id = util.id("vcard:get");
    if (to && typeof(to) === 'string') to = new this._xmpp.JID(to);
    if (to) to = to.bare();
    this.router.send(new this._xmpp.Iq({to:to,id:id,type:'get',from:this.router.jid})
        .c("vCard", {xmlns:NS.vcard}).up(), {
        xpath:"self::iq[@id='" + id + "']/vc:vCard/child::* | " +
              "self::iq[@id='" + id + "' and @type=error]/error/child::*",
        ns:{vc:NS.vcard},
        callback:function (err, stanza, match) {
            if (!err && stanza.attrs.type === "error")
                err = "error:" + (match[0]&&match[0].name);
            debug('got ' + (err||'vcard'));
            return callback(err, stanza, match);
        },
    });
};

proto.set = function (to, vcard, callback) {
    debug('set');
    if (!callback) {callback = vcard; vcard = to; to = undefined;}
    if (!callback) {callback = vcard; vcard = undefined;}
    var id = util.id("vcard:set");
    if (to) to = (new this._xmpp.JID(to)).bare();
    var iq = new this._xmpp.Iq({to:to,id:id,type:'set',from:this.router.jid})
        .c("vCard", {xmlns:NS.vcard}).up();
    if (vcard) iq.cnode(vcard);
    this.router.send(iq, callback);
};

proto.presence = function (stanza) {
    this._emit('presence', stanza);
};
