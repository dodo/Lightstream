'use strict';

~function () {

    var NS = {
        'disco#info': "http://jabber.org/protocol/disco#info",
        'disco#items': "http://jabber.org/protocol/disco#items",
    };

    var identities = [{category: 'client', type: 'browser'}];

    var features = [NS['disco#info']];

    window.Lightstring_Disco = function (router) {
        this.router = router;
        this.identities = identities.slice();
        this.features = features.slice();
        this.router.match("iq[@type=get]/info:query",
                          {info:NS['disco#info']},
                          this.get_info.bind(this));
    };
    Lightstring_Disco.identities = identities;
    Lightstring_Disco.features = features;
    Lightstring_Disco.NS = NS;
    var proto = Lightstring_Disco.prototype;

    proto.addFeature = function (/* features… */) {
        this.features.splice.apply(this.features,
            [this.features.length, 0].concat(arguments));
        return this;
    };

    proto.addIdentity = function (/* identities */) {
        this.identities.splice.apply(this.identities,
            [this.identities.length, 0].concat(arguments));
        return this;
    };

    proto.info = function (to, callback) {
        var id = Lightstring.id("info");
        this.router.request("iq[@type=result]/info:query[@id='" + id + "']",
                            {info:NS['disco#info']}, callback);
        this.router.send(new Lightstring.Stanza("iq", {to:to,id:id})
            .c("query", {xmlns:NS['disco#info']}).up());
    };

    proto.get_info = function (stanza) {
        this.router.emit('info', stanza); // TODO is this ugly?
        var query = new Lightstring.Stanza("iq", {
            to:stanza.attrs.from,
            id:stanza.attrs.id,
            type:'result',
        }).c("query", {xmlns:NS['disco#info']});
        for (var i = 0, length = this.identities.length; i < length; i++) {
            query.c("identity", this.identities[i]);
        }
        for (var i = 0, length = this.features.length; i < length; i++) {
            query.c("feature", {var:this.features[i]});
        }
        this.router.send(query.up());
        return this;
    };

}();
