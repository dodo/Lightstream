'use strict';

~function () {

/** future Lightstring stub
 * this is how it will look like
 */

window.Lightstring = {};

window.Lightstring.id = function (aPrefix) { };

Lightstring.Connection = function (transport) {

};

Lightstring.Connection.prototype.onstanza = null;
Lightstring.Connection.prototype.onstatechange = null;
Lightstring.Connection.prototype.send = function (stanza) { };
Lightstring.Connection.prototype.connect = function (jid, password) { };
Lightstring.Connection.prototype.disconnect = function () { };


Lightstring.Stanza = function () {
    // returns ltx.Element but auto fills id when not provided
}; // FIXME TODO

}();
