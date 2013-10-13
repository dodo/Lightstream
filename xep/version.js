var util = require('./util');

var NS = {
    version: 'jabber:iq:version',
};

// XEP-0092

exports.Version = Version;
function Version(lightstream, options) {
    this._xmpp = lightstream.xmpp;
    this.router = lightstream.router;
    lightstream.registerExtension('version', this);
    // initialize
    this.identity = {};
    options = this.set(options);
    router.match("self::iq[@type=get]/version:query",
                 {version:NS.version},
                 this.get_version.bind(this));
    if (options.disco) {
        this.disco = options.disco;
        this.disco.addIdentity(this.identity);
        this.disco.addFeature(NS.version);
    }
};
Version.NS = NS;
var proto = Version.prototype;

proto.set = function (options) {
    options = options || {};
    var id = this.identity;
    ;["category","name"].forEach(function (k) { id[k] = options[k] || "" });
    this.version = options.version || "";
    id.type = options.type;
    this.os = options.os;
    return options;
};

proto.fetch = function (to, callback) {
    var id = util.id("version");
    var from = this.router.connection.jid;
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
    this.router.emit('version', stanza, match);
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
