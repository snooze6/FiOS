// Returns information about Frida itself.
module.exports = function(){
    return new Promise(function (resolve, reject) {
        resolve({
            frida_version: Frida.version,
            process_arch: Process.arch,
            process_platform: Process.platform,
            process_has_debugger: Process.isDebuggerAttached()
        });
    });
};
