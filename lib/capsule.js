var __slice = Array.prototype.slice;
var debug = require('debug')('ls:capsule');


module.exports = Capsule;
function Capsule(fd, name) {
    this.name = name || '';
    this.fd = fd;
    debug(this.name);
}
var proto = Capsule.prototype;

['xmpp','extension'].forEach(function (propery) {
    Object.defineProperty(proto, propery, {
        get: function () {return this.fd[propery]},
    });
}.bind(this));

Object.defineProperty(proto, 'jid', {
    get: function () {return this.fd.router.jid},
});

Object.defineProperty(proto, 'cache', {
    set: function (cache) {return this.fd.cache = cache},
    get: function (     ) {return this.fd.cache},
});

proto.emit = function () {
    var args = __slice.call(arguments);
    if (args[0] && args[0] !== 'error') { // event
        // this is the reasion why capsule exists:
        args[0] = this.name + "." + args[0];
        // (… and to limit access to internal api)
    }
    return this.fd.emit.apply(this.fd, args);
};

['on','once','listeners','removeListener'].forEach(function (method) {
    proto[method] = function () {
        var args = __slice.call(arguments);
        return this.fd[method].apply(this.fd, args);
    };
});


['match','send','request'].forEach(function (method) {
    proto[method] = function () {
        var args = __slice.call(arguments);
        return this.fd.router[method].apply(this.fd.router, args);
    };
});
