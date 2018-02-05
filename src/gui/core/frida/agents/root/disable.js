module.exports = function(){
    return new Promise(function (resolve, reject) {
        var common = require('./_common.js');

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

                console.log('Weeeeeia');

                // file existence checks.
                var File = Java.use('java.io.File');
                var Process = Java.use('android.os.Process');
                File.exists.implementation = function () {
                    // grab the filename we are working with
                    var filename = this.getAbsolutePath();
                    console.log('[+] --- File: '+filename);
                    // check if the looked up path is in the list of common_paths
                    if (common.common_paths_android.indexOf(filename) >= 0) {
                        console.log('[+] --- File: '+filename);
                        return false
                    } else {
                        // TODO: Explain this
                        if (filename.indexOf('/proc/'+Process.myPid()+'/maps')>=0){
                            console.log('[+] --- File: '+filename);
                            return true
                        }
                    }
                    // call the original method
                    return this.contains.apply(this, arguments);
                };

                // 'test-keys' check.
                var String = Java.use('java.lang.String');
                String.contains.implementation = function (check) {
                    if (check === 'test-keys') {
                        console.log('[+] --- String: '+check);
                        console.log('Check for test-keys was detected. Marking it as failed.');
                        return false;
                    }
                    // call the original method
                    this.contains.apply(this, arguments);
                };

                // Exec check for su command.
                var Runtime = Java.use('java.lang.Runtime');
                var IOException = Java.use('java.io.IOException');
                Runtime.exec.overload('java.lang.String').implementation = function (command) {
                    // console.log('[+] --- Command: '+command);
                    if (command.endsWith('su')) {
                        console.log('[+] --- Command: '+command);
                        throw IOException.$new('anti-root');
                    }
                    // call the original method
                    this.contains.apply(this, arguments);
                };

                // https://github.com/frida/frida/issues/257
                // Class loaded at runtime
                var PackageManager = Java.use('android.app.ApplicationPackageManager');
                PackageManager.getApplicationInfo.overload('java.lang.String','int').implementation = function (str,i) {
                    // console.log('[+] --- Package: '+str);
                    if (common.common_packages_android.indexOf(str)>=0){
                        console.log('[+] --- Package: '+str);
                        return this.getApplicationInfo('r4nd0m5tr1ngtof4i1', i);
                    } else {
                        return this.getApplicationInfo(str, i);
                    }
                };

                // var a = Java.use('apptesthce.redsys.com.bankinterwallet.utils.a');
                // a.a.overload("android.app.Activity", "android.content.pm.PackageManager").implementation = function (act, pm) {
                //     console.log('[+] --- Called root check');
                //     return this.a(act, pm)
                // };
                // a.a.overload("java.lang.String", "android.content.pm.PackageManager").implementation = function (str, pm) {
                //     // console.log('[+] ------ Called PackageManager Check - '+str);
                //     return this.a(str, pm);
                //     // return false;
                // };
                // a.a.overload("java.lang.String").implementation = function (str) {
                //     return this.a(str);
                // };
                // a.a.overload("android.app.Activity").implementation = function (str) {
                //     console.log('[+] ------ Called Activity Check - '+str);
                //     return this.a(str);
                // };

                // // CRC
                // var ZipEntry = Java.use('java.util.zip.ZipEntry');
                // ZipEntry.getCrc.implementation = function () {
                //     console.log('[+] --- CRC: '+this.getCrc());
                //     console.log('[+] --- CRC: '+this.getCrc());
                //     return 1708056381;
                //     // // call the original method
                //     // return this.contains.apply(this, arguments);
                // };

                // // CRC check
                // String.equals.overload("java.lang.String").implementation = function (str) {
                //     console.log('[+] --- String compare <'+this+'>==<'+str+'>')
                // };

                // // Context
                // var Context = Java.use('android.content.Context');
                // Context.getString.implementation = function(){
                //     console.log('[+] --- getString from context');
                //     // call the original method
                //     return this.contains.apply(this, arguments);
                // };
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};