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
function VCard(api) {
    this.api = api;
    api.on('presence.send', this.presence.bind(this));
    // lazy listener for vcard.update events
    api.on('newListener', onlistener);
    function onlistener(event, listener) {
        if (event !== 'vcard.update') return;
        api.removeListener('newListener', onlistener);
        api.match("/presence[not(@type)]/child::vcupdate:x",
                 {vcupdate:NS.update},
                  api.emit.bind(api, 'update'));
    }
};
var proto = VCard.prototype;

proto.setPhotoHash = function (hash) {
    this.hash = hash;
    debug("set hash: " + hash);
    this.api.emit('photo', hash);
    return this;
};

proto.get = function (to, callback) {
    debug('get');
    if (!callback) {callback = to; to = undefined;}
    var id = util.id("vcard:get");
    if (to && typeof(to) === 'string') to = new this.api.xmpp.JID(to);
    if (to) to = to.bare();
    this.api.send(new this.api.xmpp.Iq({to:to,id:id,type:'get',from:this.api.jid})
        .c("vCard", {xmlns:NS.vcard}).up(), {
        xpath:"/iq[@id='" + id + "']/vc:vCard/child::* | " +
              "/iq[@id='" + id + "' and @type=error]/error/child::*",
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
    if (to) to = (new this.api.xmpp.JID(to)).bare();
    var iq = new this.api.xmpp.Iq({to:to,id:id,type:'set',from:this.api.jid})
        .c("vCard", {xmlns:NS.vcard}).up();
    if (vcard) iq.cnode(vcard);
    this.api.send(iq, callback);
};

proto.presence = function (stanza) {
    if (!this.hash || stanza.attrs.type) return;
    stanza.c("x", {xmlns:NS.update}).c("photo", this.hash);
};
