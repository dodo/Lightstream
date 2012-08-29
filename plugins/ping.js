'use strict';

~function () {

    var NS = { // TODO global namespace vault or managed by plugins?
        ping: 'urn:xmpp:ping',
    };


    window.Lightstream_Ping = function (router, disco) {
        this.router = router;
        router.match("self::iq/urn:ping", {urn:NS.ping}, this.pong.bind(this));
        if (disco) disco.addFeature(NS.ping);
    };
    Lightstream_Ping.NS = NS;
    var proto = Lightstream_Ping.prototype;

    proto.ping = function (to, callback) {
        var id = Lightstring.id("ping");
        this.router.request("self::iq[@id='" + id + "']", callback);
        this.router.send(new Lightstring.Stanza("iq", {to:to,id:id,type:'get'})
            .c("ping", {xmlns:NS.ping}).up());
    };

    proto.pong = function (stanza) {
        this.router.emit('ping', stanza); // TODO is this ugly?
        this.router.send(new Lightstring.Stanza("iq", {
            to:stanza.attrs.from,
            id:stanza.attrs.id,
            type:'result',
        }));
    };

}();
