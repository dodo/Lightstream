var debug = require('debug')('ls:xep:version');
var util = require('./util');

var NS = {
    version: 'jabber:iq:version',
};
exports.NS = NS;

// XEP-0092

exports.Version = Version;
function Version(api) {
    this.api = api;
    // initialize
    this.identity = {};
    this.set();
    api.match("self::iq[@type=get]/version:query",
                 {version:NS.version},
                 this.request.bind(this));
    if (api.extension.disco) {
        api.extension.disco.addIdentity(this.identity);
        api.extension.disco.addFeature(NS.version);
    }
};
var proto = Version.prototype;

proto.set = function (options) {
    debug('set');
    options = options || {};
    var id = this.identity;
    ;["category","name"].forEach(function (k) { id[k] = options[k] || "" });
    this.version = options.version || "";
    id.type = options.type;
    this.os = options.os;
    this.api.emit('set', options);
    return options;
};

proto.fetch = function (to, callback) {
    debug('fetch');
    var id = util.id("version");
    var from = this.api.jid;
    var disco = this.api.extension.disco;
    var info = disco && disco.cache && disco.cache[to];
    if (info && info.features.indexOf(NS.version) === -1)
        return callback("doesnt support " + NS.version + " :(");
    this.api.send(new this.api.xmpp.Iq({from:from,to:to,id:id,type:'get'})
        .c("query", {xmlns:NS.version}).up(), {
        xpath:"self::iq[@type=result and @id='"+id+"']/version:query/child::*",
        ns:{version:NS.version},
        callback:this.on_version.bind(this, callback),
    });
};

proto.on_version = function (callback, err, stanza, items) {
    debug('got ' + (err||'version'));
    if (err) return callback(err);
    var res = {}; items.forEach(function (item) {
        switch(item.name) {
            case "version":
            case "name":
            case "os":
                res[item.name] = item.getText();
                break;
            default:break; // skip
        }
    });
    this.api.emit('fetch', res);
    callback(null, res);
};

proto.request = function (stanza, match) {
    debug('requested');
    this.api.emit('request', stanza, match);
    var query = new this.api.xmpp.Iq({
        to:stanza.attrs.from,
        id:stanza.attrs.id,
        type:'result',
    }).c("query", {xmlns:NS.version});
    query.c("version").t(this.version);
    query.c("name").t(this.identity.name);
    if (this.os) query.c("os").t(this.os);
    this.api.send(query.up());
};
