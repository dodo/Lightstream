
exports.id = function (aPrefix) {
    return (aPrefix || '') + Date.now() + Math.random();
};
