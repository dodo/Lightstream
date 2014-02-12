var debug = require('debug')('ls:xep:version');
var util = require('./util');

var NS = {
    version: 'jabber:iq:version',
};
exports.NS = NS;

// XEP-0092

exports.Version = Version;
function Version(lightstream) {
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    this._emit = lightstream.emit.bind(lightstream);
    lightstream.registerExtension('version', this);
    // initialize
    this.identity = {};
    this.set();
    this.router.match("self::iq[@type=get]/version:query",
                 {version:NS.version},
                 this.get_version.bind(this));
    if (lightstream.extension['disco']) {
        this.disco = lightstream.extension['disco'];
        this.disco.addIdentity(this.identity);
        this.disco.addFeature(NS.version);
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
    return options;
};

proto.fetch = function (to, callback) {
    debug('fetch');
    var id = util.id("version");
    var from = this.router.jid;
    if (this.disco && this.disco.cache && this.disco.cache[to]) {
        var info = this.disco.cache[to];
        if (info.features.indexOf(NS.version) === -1)
            return callback("doesnt support " + NS.version + " :(");
    }
    this.router.send(new this._xmpp.Iq({from:from,to:to,id:id,type:'get'})
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
    callback(null, res);
};

proto.get_version = function (stanza, match) {
    debug('requested');
    this._emit('version', stanza, match);
    var query = new this._xmpp.Iq({
        to:stanza.attrs.from,
        id:stanza.attrs.id,
        type:'result',
    }).c("query", {xmlns:NS.version});
    query.c("version").t(this.version);
    query.c("name").t(this.identity.name);
    if (this.os) query.c("os").t(this.os);
    this.router.send(query.up());
};
