var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var xmpp = require('node-xmpp');
var util = require('./util');

var NS = {
    vcard: 'vcard-temp',
    update: 'vcard-temp:x:update',
};

exports.VCard = VCard;
inherits(VCard, EventEmitter);
function VCard(router) {
    VCard.super.call(this);
    this.router = router;
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
VCard.NS = NS;
var proto = VCard.prototype;

proto.setPhotoHash = function (hash) {
    this.hash = hash;
    console.error("set hash", hash)
    return this;
};

proto.get = function (to, callback) {
    if (!callback) {callback = to; to = undefined;}
    var id = util.id("vcard:get");
    if (to && typeof(to) === 'string') to = new xmpp.JID(to);
    if (to) to = to.bare();
    this.router.request("self::iq[@id='" + id + "']/vc:vCard/child::* | "+
                        "self::iq[@id='" + id + "' and @type=error]/error/child::*",
                        {vc:NS.vcard}, function (err, stanza, match) {
        if (!err && stanza.attrs.type === "error")
            err = "error:" + (match[0]&&match[0].name);
        return callback(err, stanza, match);
    });
    this.router.send(new xmpp.Iq({to:to,id:id,type:'get',from:this.router.connection.jid})
        .c("vCard", {xmlns:NS.vcard}).up());
};

proto.set = function (to, vcard, callback) {
    if (!callback) {callback = vcard; vcard = to; to = undefined;}
    if (!callback) {callback = vcard; vcard = undefined;}
    var id = util.id("vcard:set");
    if (to) to = (new xmpp.JID(to)).bare();
    this.router.request("self::iq[@id='" + id + "']", callback);
    var iq = new xmpp.Iq({to:to,id:id,type:'set',from:this.router.connection.jid})
        .c("vCard", {xmlns:NS.vcard}).up();
    if (vcard) iq.cnode(vcard);
    this.router.send(iq);
};

proto.presence = function (stanza) {
    this.router.emit('presence', stanza);
};
