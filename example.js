var Lightstream = require('./lightstream').Lightstream;
var xep = require('./xep');

if (process.argv.length != 4) {
    console.error('Usage: node test.js <my-jid> <my-password>');
    process.exit(1);
}

var lightstream = new Lightstream({
    backend:require('./backend/node-xmpp'),
}).use(xep.Disco, xep.Presence, xep.Ping)
  .connect(process.argv[2], process.argv[3]);


lightstream.router.on('ping', function (stanza) {
   console.log("received a ping", stanza);
});

lightstream.router.on('info', function (stanza) {
   console.log("received a info disco query", stanza);
});

lightstream.router.on('presence', function (stanza) {
   console.log("received a presence", stanza);
});


lightstream.backend.client.on('online', function () {
    console.log("online");
    lightstream.extension.presence.send({
        show:"chat",
        status:"Happily echoing your <message/> stanzas",
        from:lightstream.backend.client.jid,
    });
});

lightstream.router.match("self::message", function (stanza) {
    if (stanza.attrs.type === 'error') return; // never reply to errors
    // Swap addresses...
    stanza.attrs.to = stanza.attrs.from;
    delete stanza.attrs.from;
    // and send back.
    lightstream.send(stanza);
});
