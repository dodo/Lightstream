
# [lightstream](https://github.com/dodo/lightstream)

This module trys to implement the xmpp protocol and expose it as javascript functions.
Internal it uses XPath to filter and match stanzas comming in.

```
npm install lightstream
```


## example

```javascript
var Lightstream = require('lightstream').Lightstream
var xep = require('lightstream/xep')

var lightstream = new Lightstream({
    backend:require('lightstream/backend/node-xmpp'),
}).use(xep.Disco, xep.Ping)
  .connect(process.argv[2], process.argv[3]) // jid, password

lightstream.on('ping', function (stanza) {
   console.log("received a ping", stanza)
})
```

## current extensions

 * **Presence**
 * **Disco** (XEP-0030)
 * **VCard** (XEP-0054, XEP-0153)
 * **Roster** (XEP-0083, XEP-0144)
 * **Ping** (XEP-0199)
 * **Version** (XEP-0092)


## API

### `Lightstream({options})`

```javascript
var lightstream = new Lightstream({
    backend: require('lightstream/backend/<favourite>'),
//  cache: {},
//  timeout: 5000, // 5sec router.request timeout
})
```
Creates a new Lightstream instance.

Some XEPs (disco, version) require a cache object to store data.
Default is just an object.


#### `.connect(jid, password, /*{options}*/)`

```javascript
lightstream.connect('juliet@capulet.lit', "secret love")
```

Start a new XMPP connection (by triggering the backend).


#### `.disconnect({options})`

```javascript
lightstream.disconnect()
```

Close current XMPP connection (by triggering the backend).


#### `.send(stanza)`

```javascript
lightstream.send(new lightstream.xmpp.Message({type:'chat',to:'romeo@capulet.lit'})
                 .c('body').t('Hello there.'))
```

Sends a stanza (by triggering the backend).


#### `.use(/*extensions…*/)`

```javascript
var xep = require('lightstream/xep')
lightstream.use(xep.Disco, xep.VCard, xep.Presence, xep.Roster, xep.Ping, xep.Version)
```

Plug-in one of the extensions or your own implementation of a XEP.

The functions passed in should be constructors that get one argument, the lightstream instance.


#### `.registerExtension(name, extension)`

```javascript
function MyXEP(lightstream) {
    lightstream.registerExtension('ping', this);
//  lightstream.router.match("xpath", {ns:NS.ns}, this.callback.bind(this));
};
```

Used by XEP implementations to expose themself, so other extensions or developer can use them as dependency for example.


#### `.registerBackend(Backend)`

Used internal to set `options.backend` in Lightstream constructor.

Can be used to reset backend.


#### `.router.match("xpath", /*{namespaces}*/, callback)`

```javascript
lightstream.router.match("self::iq/urn:ping", {urn:'urn:xmpp:ping'}, function (stanza, match) {
    console.log("ping!")
})
```

Listen for a stanza comming in that matches the given xpath.
The second Argument to the callback is the matching element within the Stanza.



## implement XEP

if you want to implement your own XEP you get some helpful tools to your hands
like [ltx](https://github.com/node-xmpp/ltx) with [xpath](http://www.w3.org/TR/xpath/) ([ltx-xpath](https://github.com/dodo/ltx-xpath))

The method `use` ,where you'll pass in your XEP, is expecting constructors that get one argument (the lightstream instance).
Your implementation can either work just in the background or expose its own api by registering itself by calling `lightstream.registerExtension('name', this)`.
You can reach your api via `lightstream.extension.name.yourAPIMethod(args)`.


If you notice that you don't get any stanza with your xpath, a reason for that ATM might be that ltx-xpath is just simply missing the xpath feature that you're using because initially lightstream was intended to run in browser only.

### TODO

 - use faster xpath implementation when using node
 - implement more xpath features in ltx-xpath
 - document each xep

