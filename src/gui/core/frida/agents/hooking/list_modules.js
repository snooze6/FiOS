// Lists the modules available in the current process.

module.exports = function(){
    return new Promise(function (resolve, reject) {

        var modules = [];

        var process_modules = Process.enumerateModules({
            onMatch: function(module) {
                modules.push(module);
            },
            onComplete: function() {}
        });

        resolve(modules)
    });
};