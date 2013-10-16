var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var util = require('./util');

var NS = {
    rosterx:'http://jabber.org/protocol/rosterx',
    roster: 'jabber:iq:roster',
    private:'jabber:iq:private',
    delimiter:'roster:delimiter',
};
exports.NS = NS;

var T = ["unavailable","subscribed","unsubscribed","subscribe","unsubscribe"];

// XMPP-Core
// XEP-0144
// XEP-0083

exports.Roster = Roster;
inherits(Roster, EventEmitter);
function Roster(lightstream) {
    Roster.super_.call(this);
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    lightstream.registerExtension('roster', this);
    // initialize
    this.router.match("self::roster:iq[@type=set]",
                      {roster:NS.roster},
                      this.update_items.bind(this));
    this.router.match("self::presence[@type="+T.join(" or @type=")+" or not(@type)]",
                      this.update_presence.bind(this));
    this.router.match("self::message/roster:x/item",
                      {roster:NS.rosterx},
                      this.on_message.bind(this));
    if (lightstream.extension['disco'])
        lightstream.extension.disco.addFeature(NS.roster, NS.rosterx);
};
Roster.NS = NS;
var proto = Roster.prototype;


proto.get = function (callback) {
    var id = util.id("roster");
    var id2 = util.id("request:roster");
    var from = this.router.jid;
    this.router.send(new this._xmpp.Iq({id:id,type:'get'})
        .c("query", {xmlns:NS.roster}).up(), {
        xpath:"self::iq[@type=result and @id='" + id +
              "']/roster:query/descendant-or-self::(self::query | self::item)",
        ns:{roster:NS.roster},
        callback:this.get_roster.bind(this, callback),
    });
//     this.router.send(new xmpp.Message({from:from,to:from.bare(),id:id2})
//         .c("x", {xmlns:NS.rosterx}));

};

proto.getDelimiter = function (callback) {
    var id = util.id("roster:delimiter");
    this.router.send(new this._xmpp.Iq({id:id,type:'get'})
        .c("query", {xmlns:NS.private})
        .c("roster",{xmlns:NS.delimiter})
        .up().up(), {
        xpath:"self::iq[@type=result and @id='"+id+"']/priv:query/del:roster",
        ns:{priv:NS.private,del:NS.delimiter},
        callback:callback,
    });
};

proto.subscribe = function(jid, message) {
    var pres = new this._xmpp.Presence({to:jid, type:'subscribe'});
    if (message && message != "") pres.c("status").t(message);
    this.router.send(pres);
};

proto.unsubscribe = function(jid, message) {
    var pres = new this._xmpp.Presence({to:jid, type:'unsubscribe'});
    if (message && message != "") pres.c("status").t(message);
    this.router.send(pres);
};

proto.authorize = function(jid, message) {
    var pres = new this._xmpp.Presence({to:jid, type:'subscribed'});
    if (message && message != "") pres.c("status").t(message);
    this.router.send(pres);
};

proto.unauthorize = function(jid, message) {
    var pres = new this._xmpp.Presence({to:jid, type:'unsubscribed'});
    if (message && message != "") pres.c("status").t(message);
    this.router.send(pres);
};


proto.get_roster = function (callback, err, stanza, match) {
    if (err || !match.length) return this.emit('error', err, stanza);
    var needdelimiter = false;
    if (match[0].is('query')) return;
    var items = []; match.forEach(function (item) {
        var groups = item.getChildren("group").map(function (group) {
            return group && group.getText ? group.getText() : "";
        });
        needdelimiter = needdelimiter || groups.length;
        items.push({
            subscription:item.attrs.subscription,
            jid:item.attrs.jid,
            ask:item.attrs.ask,
            groups:groups,
        });
    });
    if (!needdelimiter) return callback(items);
    this.getDelimiter(function (err, stanza, match) {
        if (err || !match.length) return callback(items);
        var delimiter = match[0].getText();
        return callback(items.map(function (item) {
            item.groups = item.groups.map(function (path) {
                return delimiter ? path.split(delimiter) : [path];
            });
            return item;
        }));

    });
};

proto.update_items = function (stanza, match) {
    console.log("update_items", stanza.toString(), match.toString());
};

proto.update_presence = function (stanza) {
//     console.error("update_presence", stanza.toString());
    console.error("update_presence", stanza.attrs.type);
    var event;
    switch(stanza.attrs.type) {
        case "unavailable":  event = "offline"; break;
        case "subscribed":   event = "add"; break;
        case "unsubscribed": event = "remove"; break;
        case "subscribe": case "unsubscribe":
            event = stanza.attrs.type; break;
        case undefined: event = "online"; break;
        default: break;
    }
    if (event) this.emit(event, new this._xmpp.JID(stanza.attrs.from), stanza);
};

proto.on_message = function (stanza, items) {
    console.log("on_message", stanza.toString(), items.toString());
};

