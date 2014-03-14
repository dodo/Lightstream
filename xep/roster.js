var debug = require('debug')('ls:xep:roster');
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
function Roster(api) {
    this.api = api;
    // initialize
    api.match("/roster:iq[@type=set]",
             {roster:NS.roster},
              this.update_items.bind(this));
    api.match("/presence[@type="+T.join(" or @type=")+" or not(@type)]",
              this.update_presence.bind(this));
    api.match("/message/roster:x/item",
             {roster:NS.rosterx},
              this.on_message.bind(this));
    if (api.extension.disco)
        api.extension.disco.addFeature(NS.roster, NS.rosterx);
};
Roster.NS = NS;
var proto = Roster.prototype;


proto.get = function (callback) {
    debug('fetch roster');
    var id = util.id("roster");
    var id2 = util.id("request:roster");
    var from = this.api.jid;
    this.api.emit('get');
    this.api.send(new this.api.xmpp.Iq({id:id, type:'get'})
        .c("query", {xmlns:NS.roster}).up(), {
        xpath:"/iq[@type=result and @id='" + id +
              "']/roster:query/descendant-or-self::(self::query | self::item)",
        ns:{roster:NS.roster},
        callback:this.request.bind(this, callback),
    });
//     this.api.send(new xmpp.Message({from:from,to:from.bare(),id:id2})
//         .c("x", {xmlns:NS.rosterx}));

};

proto.getDelimiter = function (callback) {
    var id = util.id("roster:delimiter");
    this.api.send(new this.api.xmpp.Iq({id:id, type:'get'})
        .c("query",  {xmlns:NS.private})
        .c("roster", {xmlns:NS.delimiter})
        .up().up(), {
        xpath:"/iq[@type=result and @id='"+id+"']/priv:query/del:roster",
        ns:{priv:NS.private,del:NS.delimiter},
        callback:callback,
    });
};

proto.subscribe = function (jid, message) {
    debug('subscribe ' + jid);
    this.api.emit('subscribe', jid, message);
    var pres = new this.api.xmpp.Presence({to:jid, type:'subscribe'});
    if (message && message != "") pres.c("status").t(message);
    this.api.send(pres);
};

proto.unsubscribe = function (jid, message) {
    debug('unsubscribe ' + jid);
    this.api.emit('unsubscribe', jid, message);
    var pres = new this.api.xmpp.Presence({to:jid, type:'unsubscribe'});
    if (message && message != "") pres.c("status").t(message);
    this.api.send(pres);
};

proto.authorize = function (jid, message) {
    debug('authorize ' + jid);
    this.api.emit('authorize', jid, message);
    var pres = new this.api.xmpp.Presence({to:jid, type:'subscribed'});
    if (message && message != "") pres.c("status").t(message);
    this.api.send(pres);
};

proto.unauthorize = function (jid, message) {
    debug('unauthorize ' + jid);
    this.api.emit('unauthorize', jid, message);
    var pres = new this.api.xmpp.Presence({to:jid, type:'unsubscribed'});
    if (message && message != "") pres.c("status").t(message);
    this.api.send(pres);
};


proto.request = function (callback, err, stanza, match) {
    if (err || !match.length) return this.api.emit('error', err, stanza);
    debug('request');
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
        debug('send roster');
        items = items.map(function (item) {
            item.groups = item.groups.map(function (path) {
                return delimiter ? path.split(delimiter) : [path];
            });
            return item;
        });
        this.api.emit('request', items);
        return callback(items);

    }.bind(this));
};

proto.update_items = function (stanza, match) {
    debug("update_items: " + stanza.toString() + " " + match.toString());
};

proto.update_presence = function (stanza) {
//     debug("update_presence: " + stanza.toString());
    debug("update_presence: " + stanza.attrs.type);
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
    if (event)
        this.api.emit(event, new this.api.xmpp.JID(stanza.attrs.from), stanza);
};

proto.on_message = function (stanza, items) {
    debug("on_message: " + stanza.toString() + " " + items.toString());
};

