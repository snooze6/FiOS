module.exports = function(){
    return new Promise(function (resolve, reject) {
        var common = require('./_common.js');
        var send = console.log;
        
        if (ObjC.available) {
            // Attempts to disable Jailbreak detection.
            // This seems like an odd thing to do on a device that is probably not
            // jailbroken. However, in the case of a device losing a jailbreak due to
            // an OS upgrade, some filesystem artifacts may still exist, causing some
            // of the typical checks to incorrectly detect the jailbreak status!

            var common_paths_ios = common.common_paths_ios;

            // Hook NSFileManager calls and check if it is to a common path.
            // TODO: Hook fopen too.
            Interceptor.attach(ObjC.classes.NSFileManager['- fileExistsAtPath:'].implementation, {
                onEnter: function (args) {
                    // Use a marker to check onExit if we need to manipulate
                    // the response.
                    this.is_common_path = false;

                    // Extract the path
                    this.path = ObjC.Object(args[2]).toString();

                    // check if the looked up path is in the list of common_paths
                    if (common_paths_ios.indexOf(this.path) >= 0) {

                        // Mark this path as one that should have its response
                        // modified if needed.
                        this.is_common_path = true;
                    }
                }, onLeave: function (retval) {
                    // check if the method call matched a common_path.
                    // if that's the case, respond with a failure instead if needed.
                    if (this.is_common_path) {
                        if (retval != 0x0) {
                            console.log('[+] --- File: '+this.path);
                            retval.replace(0x0);
                        }
                    }
                }
            });

            // Hook fork() in libSystem.B.dylib and return 0
            // TODO: Hook vfork
            var libSystem_B_dylib_fork = Module.findExportByName('libSystem.B.dylib', 'fork');
            if (libSystem_B_dylib_fork) {
                Interceptor.attach(libSystem_B_dylib_fork, {
                    onLeave: function (retval) {
                        console.log('[+] --- Fork ');
                        retval.replace(0x0);
                    }
                });
            } else {
                reject({ reason: 'Unable to find libSystem.B.dylib::fork(). Running on simulator?'});
            }
            
            // Hook schema
            Interceptor.attach(ObjC.classes.UIApplication['- canOpenURL:'].implementation,{
                onEnter: function(args){
                    // Use a marker to check onExit if we need to manipulate
                    // the response.
                    this.is_common_path = false;

                    // Extract the url
                    this.url = ObjC.Object(args[2]).toString();

                    // check if the url is cydia://
                    if (this.url.indexOf('cydia://') >= 0) {

                        // Mark this path as one that should have its response
                        // modified if needed.
                        this.is_common_path = true;
                    }
                }, onLeave: function (retval) {
                    // check if the method call matched a common_path.
                    // if that's the case, respond with a failure instead if needed.
                    if (this.is_common_path) {
                        if (retval != 0x0) {
                            console.log('[+] --- URL: '+this.url);
                            retval.replace(0x0);
                        }
                    }
                }
            })

        } else if (Java.available) {
            Java.perform(function () {
                // Attempts to disable root detection.
                // Again, a weird thing considering what objection tries to do,
                // but there may be cases where this makes sense.

                send('Disabling root');

                var String = Java.use('java.lang.String');
                var Runtime = Java.use('java.lang.Runtime');
                var IOException = Java.use('java.io.IOException');
                var File = Java.use('java.io.File');

                // Get the common_paths for Android
                //jinja: include 'android/root/_common_paths.js'

                // 'test-keys' check.
                String.contains.implementation = function (check) {

                    if (check === 'test-keys') {

                        send(
                            'Check for test-keys was detected. Marking it as failed.'
                        );

                        return false;
                    }

                    // call the original method
                    this.contains.apply(this, arguments);
                };

                // exec check for su command.
                Runtime.exec.overload('java.lang.String').implementation = function (command) {

                    if (command.endsWith('su')) {

                        send(
                            'Check for su detected with command \'' +
                            command +
                            '\'. Throwing an IOException.'
                        );

                        throw IOException.$new('anti-root');
                    }

                    // call the original method
                    this.contains.apply(this, arguments);
                };

                // file existence checks.
                File.exists.implementation = function () {

                    // grab the filename we are working with
                    var filename = this.getAbsolutePath();

                    // check if the looked up path is in the list of common_paths
                    if (common_paths.indexOf(filename) >= 0) {

                        send(
                            'Check for \'' + filename + '\' was detected. Returning false.'
                        );

                        return false
                    }

                    // call the original method
                    this.contains.apply(this, arguments);
                };

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};