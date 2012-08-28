
var con = new Lightstring.Connection("https://bosh.example.lit");

var router = new Lightstream.Router(con);
var disco = new Lightstream_Disco(router);
var presence = new Lightstream_Presence(router);
var ping = new Lightstream_Ping(router, disco);

router.on('ping', function (stanza) {
   console.log("received a ping", stanza);
});

router.on('info', function (stanza) {
   console.log("received a info disco query", stanza);
});

router.on('presence', function (stanza) {
   console.log("received a presence", stanza);
});

con.connect("jid", "password");

window.connection = con; // playground
