// Lists exports from a specific import.

module.exports = function(module){
    return new Promise(function (resolve, reject) {
        var exports = [];

        var process_modules = Module.enumerateExports(module, {
            onMatch: function(module) {
                exports.push(module);
            },
            onComplete: function() {}
        });

        resolve(exports);
    });
};


