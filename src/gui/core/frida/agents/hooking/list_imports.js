// List imports

module.exports = function(module){
    return new Promise(function (resolve, reject) {
        var exports = [];

        var process_modules = Module.enumerateImports(module, {
            onMatch: function(module) {
                exports.push(module);
            },
            onComplete: function() {}
        });

        resolve(exports);
    });
};