'use strict';

~function () {

    window.Lightstream_Presence = function (router) {
        this.router = router;
        router.match("presence", this.presence.bind(this));
    };
    var proto = Lightstream_Ping.prototype;

    proto.send = function (to, opts) {
        if (!to && opts) to = opts.to;
        var attrs = to ? {to:to} : null;
        if (attrs && opts && opts.type) attrs.type = opts.type;
        var presence = new Lightstring.Stanza("presence", attrs);
        if (opts) {
            ["status", "priority", "show"].forEach(function (key) {
                if (opts[key]) presence.c(key).t(opts[key]);
            });
            if (opts.payload) presence.t(opts.payload);
        }
        this.router.send(presence);
        return this;
    };

    proto.presence = function (stanza) {
        this.router.emit('presence', stanza);
    };

}();
