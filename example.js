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


lightstream.on('ping.receive', function (stanza) {
   console.log("received a ping  " + stanza);
});

lightstream.on('disco.info', function (stanza) {
   console.log("received a info disco query  " + stanza);
});

lightstream.on('presence.receive', function (stanza) {
   console.log("received a presence  " + stanza);
});

lightstream.on('message.receive', function (stanza) {
   console.log("received a message  " + stanza);
    if (stanza.attrs.type === 'error') return; // never reply to errors
    var body = stanza.getChildText('body');
    if (body && body.length) stanza.body = body;
    // Swap addresses...
    stanza.attrs.to = stanza.attrs.from;
    delete stanza.attrs.from;
    // and send back.
    lightstream.extension.message.send(stanza.attrs);
});


lightstream.on('online', function () {
    console.log("online");
    lightstream.extension.presence.send({
        show:"chat",
        status:"Happily echoing your <message/> stanzas",
        from:lightstream.backend.client.jid,
    });
});
