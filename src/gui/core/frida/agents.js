(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (apath) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Uploads a file to the remote iOS devices filesystem.
            // The file contents itself is a base64 encoded string. This might
            // not be the best implementation from a performance perspective.

            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance to work with
            var fm = NSFileManager.defaultManager();

            // init the path and data to write
            var destination = NSString.stringWithString_(apath);

            // if (fm["- isDeletableFileAtPath:"](destination)){
            // fm.createFileAtPath_contents_attributes_(destination, data, NULL);

            if (fm.isDeletableFileAtPath_(destination)) {
                if (fm.removeItemAtPath_error_(destination, NULL)) {
                    resolve('ok');
                } else {
                    reject('cannot remove');
                }
            } else {
                reject('is not renovable');
            }
        } else if (Java.available) {
            Java.perform(function () {
                // Uploads a file to the remote Android devices filesystem.
                // The file contents itself is a base64 encoded string. This might
                // not be the best implementation from a performance perspective.

                var File = Java.use('java.io.File');
                var FileOutputStream = Java.use('java.io.FileOutputStream');
                var Base64 = Java.use('android.util.Base64');

                var file = File.$new('{{ destination }}');
                var decoded_bytes = Base64.decode('{{ base64_data }}', 0);

                // check that the file exists, else create it
                if (!file.exists()) {

                    file.createNewFile();
                }

                // Write the data!
                var fos = FileOutputStream.$new(file.getAbsolutePath());
                fos.write(decoded_bytes, 0, decoded_bytes.length);
                fos.close();

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'file-upload',
                    data: 'File written to: ' + file.getAbsolutePath()
                };

                // send the response message
                send(response);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],2:[function(require,module,exports){
module.exports = function (apath) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Downloads a file off the iOS devices filesystem.

            var NSString = ObjC.classes.NSString;
            var NSData = ObjC.classes.NSData;

            // init the path we want to download
            var path = NSString.stringWithString_(apath);

            // 'download' data by reading it into an NSData object
            var data = NSData.dataWithContentsOfFile_(path);

            // convert the NSData to bytes we can push with send()
            var bytes = Memory.readByteArray(data.bytes(), data.length());

            // send the response message and the bytes 'downloaded'
            resolve(bytes);
        } else if (Java.available) {
            Java.perform(function () {
                // Downloads a file off the Android filesystem.
                // This method is unbelievably slow :(
                //
                // TODO: Fix this slow thing asap!

                var File = Java.use('java.io.File');
                var FileInputStream = Java.use('java.io.FileInputStream');
                var ByteArrayOutputStream = Java.use('java.io.ByteArrayOutputStream');

                var file = File.$new('{{ path }}');
                var file_length = parseInt(file.length());

                var file_input_stream = FileInputStream.$new(file);
                var bytes = ByteArrayOutputStream.$new(parseInt(file_length)).toByteArray();

                // Method that is run when the 'download' method is called.
                var populate_bytes = function () {

                    // console.log('Reading ' + file_length + ' bytes...');
                    for (var i = 0; i < file.length(); i++) {

                        // Cause this is sooooo slowwwwwww, progress report
                        // on the download.
                        if (i % 10000 == 0) {

                            var progress = i / file_length * 100;

                            if (progress > 0) {

                                console.log('Progress: ' + parseFloat(progress).toFixed(3) + ' %');
                            }
                        }

                        // Update the byte we have read.
                        bytes[i] = file_input_stream.read();
                    }
                };

                rpc.exports = {
                    download: function () {

                        Java.perform(function () {
                            populate_bytes();
                        });

                        return bytes;
                    }
                };
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],3:[function(require,module,exports){
module.exports = function (apath) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance and list the files in the path
            var fm = NSFileManager.defaultManager();

            // init the path we want to check
            var path = NSString.stringWithString_(apath);
            var exists = fm.fileExistsAtPath_(path);

            resolve(Boolean(exists));
        } else if (Java.available) {
            Java.perform(function () {
                var File = Java.use('java.io.File');
                var String = Java.use('java.lang.String');

                // get a string of the path to work with
                var path = String.$new(apath);

                // init a File object with the path in question
                var directory = File.$new(path);

                // check if the path exists
                var exists = directory.exists();

                resolve(Boolean(exists));
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],4:[function(require,module,exports){
module.exports = function (pathz) {
            return new Promise(function (resolve, reject) {
                        if (ObjC.available) {

                                    // hacky way to check if a path is a file. Using the nice class
                                    // fileExiststAtPath:isDirectory: method in a NSFileManager is a hard
                                    // convert to Frida due to the pointer needed to flag isDirectory:

                                    // so, here is a workaround reading the attributes of the file :D

                                    // TODO: Don't be dumb. We can init the pointer we need with Memory.alloc(Process.pointerSize);

                                    var NSFileManager = ObjC.classes.NSFileManager;
                                    var NSString = ObjC.classes.NSString;

                                    // get a file manager instance to work with
                                    var fm = NSFileManager.defaultManager();

                                    // init the path we want to test
                                    var path = NSString.stringWithString_(pathz);

                                    // get the attributes for the pathed item
                                    var attributes = fm.attributesOfItemAtPath_error_(path, NULL);

                                    // prep the response array with some default values. we assume
                                    // failure.
                                    var is_file = false;

                                    // if we were able to get attributes for the path, try and
                                    // read the NSFileType key
                                    if (attributes) {
                                                // noinspection EqualityComparisonWithCoercionJS
                                                if (attributes.objectForKey_('NSFileType') == 'NSFileTypeRegular') {
                                                            is_file = true;
                                                }
                                    }

                                    resolve(is_file);
                        } else if (Java.available) {
                                    Java.perform(function () {
                                                // Check if the path is a file.
                                                var File = Java.use('java.io.File');
                                                var file = File.$new(pathz);

                                                resolve(Boolean(file.isFile()));
                                    });
                        } else {
                                    reject(new Error('Language not supported'));
                        }
            });
};

},{}],5:[function(require,module,exports){
module.exports = function (path) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Obtains a directory listing for a specified path.

            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance to work with
            var fm = NSFileManager.defaultManager();
            // // init the path we want to list
            var apath = NSString.stringWithString_(path);

            // check read / write access on the current path
            var readable = fm.isReadableFileAtPath_(apath);
            var writable = fm.isWritableFileAtPath_(apath);

            // variable for file information
            var data = {
                path: path,
                readable: Boolean(readable),
                writable: Boolean(writable),
                files: {}
            };

            // If this directory is not readable, stop.
            if (!Boolean(readable)) {
                return;
            }

            // get the directory listing
            var contents = fm.contentsOfDirectoryAtPath_error_(apath, NULL);

            // file count
            var count = contents.count();

            // loop-de-loop files
            for (var i = 0; i < count; i++) {

                // pick a file off contents
                var file = contents.objectAtIndex_(i);

                var file_data = {
                    fileName: file.toString(),
                    readable: NaN,
                    writable: NaN,
                    attributes: {}
                };

                // generate a full path to the file
                var item_path = NSString.stringWithString_(apath + '/' + file);

                // check read / write
                file_data.readable = fm.isReadableFileAtPath_(item_path);
                file_data.writable = fm.isWritableFileAtPath_(item_path);

                // get attributes
                var attributes = fm.attributesOfItemAtPath_error_(item_path, NULL);

                // if we were able to get attributes for the item,
                // append them to those for this file. (example is listing
                // files in / have some that cant have attributes read for :|)
                if (attributes) {

                    // loop the attributes and set them in the file_data
                    // dictionary
                    var enumerator = attributes.keyEnumerator();
                    var key;
                    while ((key = enumerator.nextObject()) !== null) {

                        // get attribute data
                        var value = attributes.objectForKey_(key);
                        // add it to the attributes for this item
                        file_data.attributes[key] = value.toString();
                    }
                }

                // finally, add the file to the final response
                data.files[file] = file_data;
            }

            resolve(data);
        } else if (Java.available) {
            Java.perform(function () {
                var File = Java.use('java.io.File');
                var String = Java.use('java.lang.String');

                // get a string of the path to work with
                var path = String.$new('{{ path }}');

                // init a File object with the directory in question
                var directory = File.$new(path);

                // get a listing of the files in the directory
                var files = directory.listFiles();

                // check read / write access on the current path
                var readable = directory.canRead();
                var writable = directory.canWrite();

                // variable for file information
                var data = {
                    path: '{{ path }}',
                    readable: Boolean(readable),
                    writable: Boolean(writable),
                    files: {}
                };

                // if we can read the directory, process the files.
                if (Boolean(readable)) {

                    for (var i = 0; i < files.length; i++) {

                        // reference a specific file. This will be an instance
                        // of java.io.File already
                        var file = files[i];

                        data.files[file.getName()] = {
                            fileName: file.getName(),
                            readable: file.canRead(),
                            writable: file.canWrite(),
                            attributes: {
                                isDirectory: file.isDirectory(),
                                isFile: file.isFile(),
                                isHidden: file.isHidden(),
                                lastModified: file.lastModified(),
                                size: file.length()
                            }
                        };
                    }
                }

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'list-directory-contents',
                    data: data
                };

                send(response);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],6:[function(require,module,exports){
module.exports = function (apath, recursive) {
    recursive = recursive ? recursive : false;
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Classes needed
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance to work with
            var fm = NSFileManager.defaultManager();

            // init the path and data to write
            var destination = NSString.stringWithString_(apath);

            if (fm.createDirectoryAtPath_withIntermediateDirectories_attributes_error_(destination, recursive, NULL, NULL)) {
                resolve('ok');
            } else {
                reject('is not renovable');
            }
        } else if (Java.available) {
            Java.perform(function () {
                // Uploads a file to the remote Android devices filesystem.
                // The file contents itself is a base64 encoded string. This might
                // not be the best implementation from a performance perspective.

                var File = Java.use('java.io.File');
                var FileOutputStream = Java.use('java.io.FileOutputStream');
                var Base64 = Java.use('android.util.Base64');

                var file = File.$new('{{ destination }}');
                var decoded_bytes = Base64.decode('{{ base64_data }}', 0);

                // check that the file exists, else create it
                if (!file.exists()) {

                    file.createNewFile();
                }

                // Write the data!
                var fos = FileOutputStream.$new(file.getAbsolutePath());
                fos.write(decoded_bytes, 0, decoded_bytes.length);
                fos.close();

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'file-upload',
                    data: 'File written to: ' + file.getAbsolutePath()
                };

                // send the response message
                send(response);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],7:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSBundle = ObjC.classes.NSBundle;

            var fm = NSFileManager.defaultManager();
            var mb = NSBundle.mainBundle();

            var NSDocumentDirectory = 9,


            // lastly, NSUserDomainMask from NS_OPTIONS == 1
            NSUserDomainMask = 1;

            // Returns a string of the path from a ENUM.
            function getPathForNSLocation(NSSomeLocationDirectory) {

                var p = fm.URLsForDirectory_inDomains_(NSSomeLocationDirectory, NSUserDomainMask).lastObject();

                // check that the lookup had data
                if (p) {
                    return p.path().toString();
                } else {

                    return '';
                }
            }
            function snap(string) {
                return string.split('/').slice(0, -1).join('/');
            }

            var data = {
                // most interesting directories
                bin: snap(mb.bundlePath().toString()),
                data: snap(getPathForNSLocation(NSDocumentDirectory))
            };

            resolve(data);
        } else if (Java.available) {} else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],8:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSBundle = ObjC.classes.NSBundle;
            var BundleURL = NSBundle.mainBundle().bundlePath();

            resolve(String(BundleURL));
        } else if (Java.available) {
            Java.perform(function () {
                var ActivityThread = Java.use('android.app.ActivityThread');

                var currentApplication = ActivityThread.currentApplication();
                var context = currentApplication.getApplicationContext();

                resolve(context.getFilesDir().getAbsolutePath().toString());
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],9:[function(require,module,exports){
module.exports = function (apath) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Determine if a file is readable on the iOS filesystem.

            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance
            var fm = NSFileManager.defaultManager();

            // init the path we want to check
            var path = NSString.stringWithString_(apath);
            var readable = fm.isReadableFileAtPath_(path);

            resolve(Boolean(readable));
        } else if (Java.available) {
            Java.perform(function () {
                // Checks if a path is readable
                var File = Java.use('java.io.File');
                var file = File.$new('{{ path }}');

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'file-readable',
                    data: {
                        path: '{{ path }}',
                        readable: Boolean(file.canRead())
                    }
                };

                send(response);

                // -- Sample Java Code
                //
                // File d = new File(".");
                // d.canRead();
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],10:[function(require,module,exports){
module.exports = function (apath, adata) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Uploads a file to the remote iOS devices filesystem.
            // The file contents itself is a base64 encoded string. This might
            // not be the best implementation from a performance perspective.

            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;
            var NSData = ObjC.classes.NSData;

            // get a file manager instance to work with
            var fm = NSFileManager.defaultManager();

            // init the path and data to write
            var destination = NSString.stringWithString_(apath);
            var data = NSData.alloc().initWithBase64EncodedString_options_(adata, 0);

            // write the data
            fm.createFileAtPath_contents_attributes_(destination, data, NULL);

            // send the response message
            resolve('ok');
        } else if (Java.available) {
            Java.perform(function () {
                // Uploads a file to the remote Android devices filesystem.
                // The file contents itself is a base64 encoded string. This might
                // not be the best implementation from a performance perspective.

                var File = Java.use('java.io.File');
                var FileOutputStream = Java.use('java.io.FileOutputStream');
                var Base64 = Java.use('android.util.Base64');

                var file = File.$new('{{ destination }}');
                var decoded_bytes = Base64.decode('{{ base64_data }}', 0);

                // check that the file exists, else create it
                if (!file.exists()) {

                    file.createNewFile();
                }

                // Write the data!
                var fos = FileOutputStream.$new(file.getAbsolutePath());
                fos.write(decoded_bytes, 0, decoded_bytes.length);
                fos.close();

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'file-upload',
                    data: 'File written to: ' + file.getAbsolutePath()
                };

                // send the response message
                send(response);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],11:[function(require,module,exports){
module.exports = function (apath) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance
            var fm = NSFileManager.defaultManager();

            // init the path we want to check
            var path = NSString.stringWithString_(apath);
            var writable = fm.isWritableFileAtPath_(path);

            resolve(Boolean(writable));
        } else if (Java.available) {
            Java.perform(function () {
                // Determines if a path on the Android device is writable.

                var File = Java.use('java.io.File');
                var file = File.$new('{{ path }}');

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'file-writable',
                    data: {
                        path: '{{ path }}',
                        writable: Boolean(file.canWrite())
                    }
                };

                send(response);

                // -- Sample Java Code
                //
                // File d = new File(".");
                // d.canWrite();
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],12:[function(require,module,exports){
module.exports = function (clas, include) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Lists the methods available in an Objective-C class.
            // Based on the value of the include_parents Jinja template
            // variable, the return will either be the classes *own*
            // methods, or all of the methods including the parents'.

            var methods = [];

            if (include) {
                methods = ObjC.classes[clas].$methods;
                // console.log('caca: '+ObjC.classes[clas]['scheme_jailbreak:']())
                // methods = Object.keys(ObjC.classes[clas])
                // console.log(ObjC.classes[clas].$ivars);
                // console.log(ObjC.classes[clas].$protocols);
            } else {
                methods = ObjC.classes[clas].$ownMethods;
            }

            resolve(methods);
        } else if (Java.available) {
            Java.perform(function () {
                // Gets the declared methods for a Java class.

                var class_name = Java.use(clas);
                var methods = class_name.class.getDeclaredMethods().map(function (method) {
                    return method.toGenericString();
                });

                resolve(methods);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],13:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var out = [];
            for (var className in ObjC.classes) {
                if (ObjC.classes.hasOwnProperty(className)) {
                    out.push(className);
                }
            }
            resolve(out);
        } else if (Java.available) {
            Java.perform(function () {
                resolve(Java.enumerateLoadedClassesSync());
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],14:[function(require,module,exports){
// Lists exports from a specific import.

module.exports = function (module) {
    return new Promise(function (resolve, reject) {
        var exports = [];

        var process_modules = Module.enumerateExports(module, {
            onMatch: function (module) {
                exports.push(module);
            },
            onComplete: function () {}
        });

        resolve(exports);
    });
};

},{}],15:[function(require,module,exports){
// List imports

module.exports = function (module) {
    return new Promise(function (resolve, reject) {
        var exports = [];

        var process_modules = Module.enumerateImports(module, {
            onMatch: function (module) {
                exports.push(module);
            },
            onComplete: function () {}
        });

        resolve(exports);
    });
};

},{}],16:[function(require,module,exports){
// Lists the modules available in the current process.

module.exports = function () {
    return new Promise(function (resolve, reject) {

        var modules = [];

        var process_modules = Process.enumerateModules({
            onMatch: function (module) {
                modules.push(module);
            },
            onComplete: function () {}
        });

        resolve(modules);
    });
};

},{}],17:[function(require,module,exports){
// Misc
const env = require('./misc/env.js');
const info = require('./misc/info.js');
const frida = require('./misc/frida.js');
const type = require('./misc/type.js');
const pinning = require('./misc/pinning.js');

// Filesystem
const pwd = require('./filesystem/pwd.js');
const path = require('./filesystem/path.js');
const ls = require('./filesystem/ls.js');
const exists = require('./filesystem/exists.js');
const download = require('./filesystem/download.js');
const upload = require('./filesystem/upload.js');
const is_file = require('./filesystem/is_file.js');
const writable = require('./filesystem/writable.js');
const readable = require('./filesystem/readable.js');
const del = require('./filesystem/delete.js');
const mkdir = require('./filesystem/mkdir.js');

// UI
const alert = require('./ui/alert.js');
const uidump = require('./ui/dump');
const pasteboard = require('./ui/pasteboard.js');
const screenshot = require('./ui/screenshot.js');

// Root
const disable = require('./root/disable.js');
const simulate = require('./root/simulate.js');

// // Memory
// const search = require('./memory/search.js');
// const write = require('./memory/write.js');
const dump = require('./memory/dump.js');

// // Keychain
const key_clear = require('./keychain/clear.js');
const key_dump = require('./keychain/dump.js');

// // Hooking
// const dump_arguments = require('./hooking/dump_arguments.js');
// const list_activities = require('./hooking/list_activities.js');
// const list_broadcast_receiver = require('./hooking/list_broadcast_receivers.js');
const list_class_methods = require('./hooking/list_class_methods.js');
const list_classes = require('./hooking/list_classes.js');
const list_modules = require('./hooking/list_modules.js');
const list_exports = require('./hooking/list_exports.js');
const list_imports = require('./hooking/list_imports.js');
// const list_services = require('./hooking/list_services.js');
// const search_class = require('./hooking/search_class.js');
// const search_method = require('./hooking/search_method.js');
// const set_return = require('./hooking/set_return.js');
// const watch_class_methods = require('./hooking/watch_class_methods.js');
// const watch_method = require('./hooking/watch_method.js');


rpc.exports = {
  // Misc
  env: env,
  info: info,
  frida: frida,
  type: type,
  pinning: pinning,

  // Filesystem
  pwd: pwd,
  path: path,
  ls: ls,
  exists: exists,
  download: download,
  upload: upload,
  delete: del,
  isFile: is_file,
  writable: writable,
  readable: readable,
  mkdir: mkdir,

  // UI
  alert: alert,
  uidump: uidump,
  pasteboard: pasteboard,
  screenshot: screenshot,

  //Root
  disable: disable,
  simulate: simulate,

  // Memory
  dump: dump,

  // KeyChain
  key_clear: key_clear,
  key_dump: key_dump,

  // Hooking
  list_class_methods: list_class_methods,
  list_classes: list_classes,
  list_modules: list_modules,
  list_imports: list_imports,
  list_exports: list_exports

};

},{"./filesystem/delete.js":1,"./filesystem/download.js":2,"./filesystem/exists.js":3,"./filesystem/is_file.js":4,"./filesystem/ls.js":5,"./filesystem/mkdir.js":6,"./filesystem/path.js":7,"./filesystem/pwd.js":8,"./filesystem/readable.js":9,"./filesystem/upload.js":10,"./filesystem/writable.js":11,"./hooking/list_class_methods.js":12,"./hooking/list_classes.js":13,"./hooking/list_exports.js":14,"./hooking/list_imports.js":15,"./hooking/list_modules.js":16,"./keychain/clear.js":18,"./keychain/dump.js":19,"./memory/dump.js":20,"./misc/env.js":21,"./misc/frida.js":22,"./misc/info.js":23,"./misc/pinning.js":24,"./misc/type.js":25,"./root/disable.js":27,"./root/simulate.js":28,"./ui/alert.js":29,"./ui/dump":30,"./ui/pasteboard.js":31,"./ui/screenshot.js":32}],18:[function(require,module,exports){
module.exports = function () {
                return new Promise(function (resolve, reject) {
                                if (ObjC.available) {
                                                // Deletes all of the keychain items available to the current application.

                                                var NSMutableDictionary = ObjC.classes.NSMutableDictionary;
                                                var SecItemDelete = new NativeFunction(ptr(Module.findExportByName('Security', 'SecItemDelete')), 'pointer', ['pointer']);

                                                // the base query dictionary to use for the keychain lookups
                                                var search_dictionary = NSMutableDictionary.alloc().init();

                                                // constants
                                                var kSecClass = 'class',
                                                    kSecClassKey = 'keys',
                                                    kSecClassIdentity = 'idnt',
                                                    kSecClassCertificate = 'cert',
                                                    kSecClassGenericPassword = 'genp',
                                                    kSecClassInternetPassword = 'inet';

                                                // keychain item times to query for
                                                var item_classes = [kSecClassKey, kSecClassIdentity, kSecClassCertificate, kSecClassGenericPassword, kSecClassInternetPassword];

                                                for (var item_class_index in item_classes) {

                                                                var item_class = item_classes[item_class_index];

                                                                // set the class-type we are querying for now
                                                                search_dictionary.setObject_forKey_(item_class, kSecClass);

                                                                // delete the classes items.
                                                                SecItemDelete(search_dictionary);
                                                }

                                                resolve('ok');
                                } else if (Java.available) {
                                                Java.perform(function () {
                                                                // Delete all entries in the Android Keystore
                                                                //
                                                                // Ref: https://developer.android.com/reference/java/security/KeyStore.html#deleteEntry(java.lang.String)

                                                                var KeyStore = Java.use('java.security.KeyStore');

                                                                // Prepare the AndroidKeyStore keystore provider and load it.
                                                                // Maybe at a later stage we should support adding other stores
                                                                // like from file or JKS.
                                                                var ks = KeyStore.getInstance('AndroidKeyStore');
                                                                ks.load(null, null);

                                                                // Get the aliases and loop through them. The aliases() method
                                                                // return an Enumeration<String> type.
                                                                var aliases = ks.aliases();

                                                                while (aliases.hasMoreElements()) {

                                                                                ks.deleteEntry(aliases.nextElement());
                                                                }

                                                                resolve('ok');

                                                                // - Sample Java
                                                                //
                                                                // KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                                                                // ks.load(null);
                                                                // Enumeration<String> aliases = ks.aliases();
                                                                //
                                                                // while(aliases.hasMoreElements()) {
                                                                //     ks.deleteEntry(aliases.nextElement());
                                                                // }
                                                });
                                } else {
                                                reject(new Error('Language not supported'));
                                }
                });
};

},{}],19:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Dumps all of the keychain items available to the current application.

            var NSMutableDictionary = ObjC.classes.NSMutableDictionary;
            var NSString = ObjC.classes.NSString;

            // Ref: http://nshipster.com/bool/
            var kCFBooleanTrue = ObjC.classes.__NSCFBoolean.numberWithBool_(true);
            var SecItemCopyMatching = new NativeFunction(ptr(Module.findExportByName('Security', 'SecItemCopyMatching')), 'pointer', ['pointer', 'pointer']);
            var SecAccessControlGetConstraints = new NativeFunction(ptr(Module.findExportByName('Security', 'SecAccessControlGetConstraints')), 'pointer', ['pointer']);

            // constants
            var kSecReturnAttributes = 'r_Attributes',
                kSecReturnData = 'r_Data',
                kSecReturnRef = 'r_Ref',
                kSecMatchLimit = 'm_Limit',
                kSecMatchLimitAll = 'm_LimitAll',
                kSecClass = 'class',
                kSecClassKey = 'keys',
                kSecClassIdentity = 'idnt',
                kSecClassCertificate = 'cert',
                kSecClassGenericPassword = 'genp',
                kSecClassInternetPassword = 'inet',
                kSecAttrService = 'svce',
                kSecAttrAccount = 'acct',
                kSecAttrAccessGroup = 'agrp',
                kSecAttrLabel = 'labl',
                kSecAttrCreationDate = 'cdat',
                kSecAttrAccessControl = 'accc',
                kSecAttrGeneric = 'gena',
                kSecAttrSynchronizable = 'sync',
                kSecAttrModificationDate = 'mdat',
                kSecAttrServer = 'srvr',
                kSecAttrDescription = 'desc',
                kSecAttrComment = 'icmt',
                kSecAttrCreator = 'crtr',
                kSecAttrType = 'type',
                kSecAttrScriptCode = 'scrp',
                kSecAttrAlias = 'alis',
                kSecAttrIsInvisible = 'invi',
                kSecAttrIsNegative = 'nega',
                kSecAttrHasCustomIcon = 'cusi',
                kSecProtectedDataItemAttr = 'prot',
                kSecAttrAccessible = 'pdmn',
                kSecAttrAccessibleWhenUnlocked = 'ak',
                kSecAttrAccessibleAfterFirstUnlock = 'ck',
                kSecAttrAccessibleAlways = 'dk',
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly = 'aku',
                kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly = 'cku',
                kSecAttrAccessibleAlwaysThisDeviceOnly = 'dku';

            // dict for reverse constants lookups
            var kSecConstantReverse = {
                'r_Attributes': 'kSecReturnAttributes',
                'r_Data': 'kSecReturnData',
                'r_Ref': 'kSecReturnRef',
                'm_Limit': 'kSecMatchLimit',
                'm_LimitAll': 'kSecMatchLimitAll',
                'class': 'kSecClass',
                'keys': 'kSecClassKey',
                'idnt': 'kSecClassIdentity',
                'cert': 'kSecClassCertificate',
                'genp': 'kSecClassGenericPassword',
                'inet': 'kSecClassInternetPassword',
                'svce': 'kSecAttrService',
                'acct': 'kSecAttrAccount',
                'agrp': 'kSecAttrAccessGroup',
                'labl': 'kSecAttrLabel',
                'srvr': 'kSecAttrServer',
                'cdat': 'kSecAttrCreationDate',
                'accc': 'kSecAttrAccessControl',
                'gena': 'kSecAttrGeneric',
                'sync': 'kSecAttrSynchronizable',
                'mdat': 'kSecAttrModificationDate',
                'desc': 'kSecAttrDescription',
                'icmt': 'kSecAttrComment',
                'crtr': 'kSecAttrCreator',
                'type': 'kSecAttrType',
                'scrp': 'kSecAttrScriptCode',
                'alis': 'kSecAttrAlias',
                'invi': 'kSecAttrIsInvisible',
                'nega': 'kSecAttrIsNegative',
                'cusi': 'kSecAttrHasCustomIcon',
                'prot': 'kSecProtectedDataItemAttr',
                'pdmn': 'kSecAttrAccessible',
                'ak': 'kSecAttrAccessibleWhenUnlocked',
                'ck': 'kSecAttrAccessibleAfterFirstUnlock',
                'dk': 'kSecAttrAccessibleAlways',
                'aku': 'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
                'cku': 'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly',
                'dku': 'kSecAttrAccessibleAlwaysThisDeviceOnly'
            };

            // the base query dictionary to use for the keychain lookups
            var search_dictionary = NSMutableDictionary.alloc().init();
            search_dictionary.setObject_forKey_(kCFBooleanTrue, kSecReturnAttributes);
            search_dictionary.setObject_forKey_(kCFBooleanTrue, kSecReturnData);
            search_dictionary.setObject_forKey_(kCFBooleanTrue, kSecReturnRef);
            search_dictionary.setObject_forKey_(kSecMatchLimitAll, kSecMatchLimit);

            // keychain item times to query for
            var item_classes = [kSecClassKey, kSecClassIdentity, kSecClassCertificate, kSecClassGenericPassword, kSecClassInternetPassword];

            // get the string representation of some data
            // ref: https://www.frida.re/docs/examples/ios/
            function odas(raw_data) {

                // "objective-c data as string"

                // // TODO: check if this is something we need NSKeyedUnarchiver for
                // if (raw_data.toString().toLowerCase()
                //     .indexOf('62706c69 73743030 d4010203 04050609 0a582476 65727369 6f6e5824 6f626a65 63747359 24617263 68697665 72542474')) {

                //         var new_value = NSKeyedUnarchiver.unarchiveObjectWithData_(raw_data);
                //         console.log(new_value);
                //         console.log(new_value.$ownMethods);
                //     }

                // try and get a string representation of the data
                try {

                    var data_instance = new ObjC.Object(raw_data);
                    return Memory.readUtf8String(data_instance.bytes(), data_instance.length());
                } catch (_) {
                    try {
                        return raw_data.toString();
                    } catch (_) {
                        return '';
                    }
                }
            }

            // Decode the access control attributes on a keychain
            // entry into a human readable string. Getting an idea of what the
            // constriants actually are is done using an undocumented method,
            // SecAccessControlGetConstraints.
            function decode_acl(entry) {

                // No access control? Move along.
                if (!entry.containsKey_(kSecAttrAccessControl)) {
                    return '';
                }

                var access_controls = ObjC.Object(SecAccessControlGetConstraints(entry.objectForKey_(kSecAttrAccessControl)));

                // Ensure we were able to get the SecAccessControlRef
                if (access_controls.handle == 0x00) {
                    return '';
                }

                var flags = [];
                var access_control_enumerator = access_controls.keyEnumerator();
                var access_control_item_key;

                while ((access_control_item_key = access_control_enumerator.nextObject()) !== null) {

                    var access_control_item = access_controls.objectForKey_(access_control_item_key);

                    switch (odas(access_control_item_key)) {

                        // Defaults?
                        case 'dacl':
                            break;

                        case 'osgn':
                            flags.push('PrivateKeyUsage');

                        case 'od':
                            var constraints = access_control_item;
                            var constraint_enumerator = constraints.keyEnumerator();
                            var constraint_item_key;

                            while ((constraint_item_key = constraint_enumerator.nextObject()) !== null) {

                                switch (odas(constraint_item_key)) {
                                    case 'cpo':
                                        flags.push('kSecAccessControlUserPresence');
                                        break;

                                    case 'cup':
                                        flags.push('kSecAccessControlDevicePasscode');
                                        break;

                                    case 'pkofn':
                                        constraints.objectForKey_('pkofn') == 1 ? flags.push('Or') : flags.push('And');
                                        break;

                                    case 'cbio':
                                        constraints.objectForKey_('cbio').count() == 1 ? flags.push('kSecAccessControlTouchIDAny') : flags.push('kSecAccessControlTouchIDCurrentSet');
                                        break;

                                    default:
                                        break;
                                }
                            }

                            break;

                        case 'prp':
                            flags.push('ApplicationPassword');
                            break;

                        default:
                            break;
                    }
                }

                return flags.join(' ');
            }

            // helper to lookup the constant name of a constant value
            function get_constant_for_value(v) {

                for (var k in kSecConstantReverse) {
                    if (k == v) {
                        return kSecConstantReverse[v];
                    }
                }

                return v;
            }

            // a list of keychain items that will return
            var keychain_items = [];

            for (var item_class_index in item_classes) {

                var item_class = item_classes[item_class_index];

                // set the class-type we are querying for now
                search_dictionary.setObject_forKey_(item_class, kSecClass);

                // get a pointer to write results to. no type? guess that goes as id* then
                var results_pointer = Memory.alloc(Process.pointerSize);

                // get the keychain items
                var copy_results = SecItemCopyMatching(search_dictionary, results_pointer);

                // if we have no results, move to the next
                if (copy_results != 0x00) {
                    continue;
                }

                // read the resultant dict of the lookup from memory
                var search_results = new ObjC.Object(Memory.readPointer(results_pointer));

                // if there are search results, loop them each and populate the return
                // array with the data we got
                if (search_results.count() > 0) {

                    for (var i = 0; i < search_results.count(); i++) {

                        // the *actual* keychain item is here!
                        var search_result = search_results.objectAtIndex_(i);

                        // dumped entries from NSLog() look like
                        // 2017-06-20 11:25:07.645 PewPew[51023:7644106] {
                        //     acct = <63726564 735f6173 5f737472 696e67>;
                        //     agrp = "8AH3PS2AS7.com.sensepost.PewPew";
                        //     cdat = "2017-06-20 08:06:04 +0000";
                        //     class = genp;
                        //     gena = <63726564 735f6173 5f737472 696e67>;
                        //     mdat = "2017-06-20 08:06:04 +0000";
                        //     musr = <>;
                        //     pdmn = cku;
                        //     svce = "";
                        //     sync = 0;
                        //     tomb = 0;
                        //     "v_Data" = <7b227573 6e656b22 7d>;
                        // }

                        // Frida console.log() looks like...
                        // {
                        //     acct = "LOCALE_KEY";
                        //     agrp = "8AH3PS2AS7.com.sensepost.blank-provision";
                        //     cdat = "2017-06-23 09:51:37 +0000";
                        //     class = genp;
                        //     invi = 1;
                        //     labl = Supercell;
                        //     mdat = "2017-06-23 09:51:37 +0000";
                        //     musr = <>;
                        //     pdmn = ak;
                        //     svce = "com.supercell";
                        //     sync = 0;
                        //     tomb = 0;
                        //     "v_Data" = <454e>;
                        // }

                        // column definitions

                        // cdat	kSecAttrCreationDate	Item creation date in Unix epoch time format
                        // mdat	kSecAttrModificationDate	Item modification date in Unix epoch time format
                        // desc	kSecAttrDescription	User visible string that describes the item
                        // icmt	kSecAttrComment	User editable comment for the item
                        // crtr	kSecAttrCreator	Application created (4 char) code
                        // type	kSecAttrType	Item type
                        // scrp	kSecAttrScriptCode	String script code (such as encoding type)
                        // labl	kSecAttrLabel	Label to be displayed to the user (print name)
                        // alis	kSecAttrAlias	Item alias
                        // invi	kSecAttrIsInvisible	Invisible
                        // nega	kSecAttrIsNegative	Invalid item
                        // cusi	kSecAttrHasCustomIcon	Existence of application specific icon (Boolean)
                        // prot	kSecProtectedDataItemAttr ?	Items data is protected (Boolean)
                        // acct	kSecAttrAccount	Account key (such as user id)
                        // svce	kSecAttrService	Service name (such as Application identifier)
                        // gena	kSecAttrGeneric	User defined attribute
                        // data	kSecValueData Actual data (such as password, crypto key)
                        // agrp	kSecAttrAccessGroup	Keychain access group
                        // pdmn	kSecAttrAccessible	Access restrictions (Data protection classes)

                        var keychain_entry = {
                            'item_class': get_constant_for_value(item_class),
                            'create_date': odas(search_result.objectForKey_(kSecAttrCreationDate)),
                            'modification_date': odas(search_result.objectForKey_(kSecAttrModificationDate)),
                            'description': odas(search_result.objectForKey_(kSecAttrDescription)),
                            'comment': odas(search_result.objectForKey_(kSecAttrComment)),
                            'creator': odas(search_result.objectForKey_(kSecAttrCreator)),
                            'type': odas(search_result.objectForKey_(kSecAttrType)),
                            'script_code': odas(search_result.objectForKey_(kSecAttrScriptCode)),
                            'alias': odas(search_result.objectForKey_(kSecAttrAlias)),
                            'invisible': odas(search_result.objectForKey_(kSecAttrIsInvisible)),
                            'negative': odas(search_result.objectForKey_(kSecAttrIsNegative)),
                            'custom_icon': odas(search_result.objectForKey_(kSecAttrHasCustomIcon)),
                            'protected': odas(search_result.objectForKey_(kSecProtectedDataItemAttr)),
                            'access_control': decode_acl(search_result),
                            'accessible_attribute': get_constant_for_value(odas(search_result.objectForKey_(kSecAttrAccessible))),
                            'entitlement_group': odas(search_result.objectForKey_(kSecAttrAccessGroup)),
                            'generic': odas(search_result.objectForKey_(kSecAttrGeneric)),
                            'service': odas(search_result.objectForKey_(kSecAttrService)),
                            'account': odas(search_result.objectForKey_(kSecAttrAccount)),
                            'label': odas(search_result.objectForKey_(kSecAttrLabel)),
                            'data': odas(search_result.objectForKey_('v_Data'))
                        };

                        keychain_items.push(keychain_entry);
                    }
                }
            }

            resolve(keychain_items);
        } else if (Java.available) {

            Java.perform(function () {
                // Dump entries in the Android Keystore, together with a flag
                // indicating if its a key or a certificate.
                //
                // Ref: https://developer.android.com/reference/java/security/KeyStore.html

                var KeyStore = Java.use('java.security.KeyStore');
                var entries = [];

                // Prepare the AndroidKeyStore keystore provider and load it.
                // Maybe at a later stage we should support adding other stores
                // like from file or JKS.
                var ks = KeyStore.getInstance('AndroidKeyStore');
                ks.load(null, null);

                // Get the aliases and loop through them. The aliases() method
                // return an Enumeration<String> type.
                var aliases = ks.aliases();

                while (aliases.hasMoreElements()) {

                    var alias = aliases.nextElement();

                    entries.push({
                        'alias': alias.toString(),
                        'is_key': ks.isKeyEntry(alias),
                        'is_certificate': ks.isCertificateEntry(alias)
                    });
                }

                resolve(entries);

                // - Sample Java
                //
                // KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                // ks.load(null);
                // Enumeration<String> aliases = ks.aliases();
                //
                // while(aliases.hasMoreElements()) {
                //     Log.e("E", "Aliases = " + aliases.nextElement());
                // }
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],20:[function(require,module,exports){
module.exports = function (base, size) {
    return new Promise(function (resolve, reject) {

        var buf = Memory.readByteArray(ptr(base.toString(16)), size);
        // console.log(buf);
        resolve(buf);
    });
};

},{}],21:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {

            const NSFileManager = ObjC.classes.NSFileManager;
            const NSBundle = ObjC.classes.NSBundle;

            var fm = NSFileManager.defaultManager();
            var mb = NSBundle.mainBundle();

            // typedef NS_ENUM(NSUInteger, NSSearchPathDirectory) {
            //     NSApplicationDirectory = 1,             // supported applications (Applications)
            //     NSDemoApplicationDirectory,             // unsupported applications, demonstration versions (Demos)
            //     NSDeveloperApplicationDirectory,        // developer applications (Developer/Applications). DEPRECATED - there is no one single Developer directory.
            //     NSAdminApplicationDirectory,            // system and network administration applications (Administration)
            //     NSLibraryDirectory,                     // various documentation, support, and configuration files, resources (Library)
            //     NSDeveloperDirectory,                   // developer resources (Developer) DEPRECATED - there is no one single Developer directory.
            //     NSUserDirectory,                        // user home directories (Users)
            //     NSDocumentationDirectory,               // documentation (Documentation)
            //     NSDocumentDirectory,                    // documents (Documents)
            //     NSCoreServiceDirectory,                 // location of CoreServices directory (System/Library/CoreServices)
            //     NSAutosavedInformationDirectory NS_ENUM_AVAILABLE(10_6, 4_0) = 11,   // location of autosaved documents (Documents/Autosaved)
            //     NSDesktopDirectory = 12,                // location of user's desktop
            //     NSCachesDirectory = 13,                 // location of discardable cache files (Library/Caches)
            //     NSApplicationSupportDirectory = 14,     // location of application support files (plug-ins, etc) (Library/Application Support)
            //
            //     [... snip ...]
            //
            // };

            var NSApplicationDirectory = 1,
                NSDemoApplicationDirectory = 2,
                NSDeveloperApplicationDirectory = 3,
                NSAdminApplicationDirectory = 4,
                NSLibraryDirectory = 5,
                NSDeveloperDirectory = 6,
                NSUserDirectory = 7,
                NSDocumentationDirectory = 8,
                NSDocumentDirectory = 9,
                NSCoreServiceDirectory = 10,
                NSAutosavedInformationDirectory = 11,
                NSDesktopDirectory = 12,
                NSCachesDirectory = 13,
                NSApplicationSupportDirectory = 14,


            // lastly, NSUserDomainMask from NS_OPTIONS == 1
            NSUserDomainMask = 1;

            // Returns a string of the path from a ENUM.
            function getPathForNSLocation(NSSomeLocationDirectory) {

                var p = fm.URLsForDirectory_inDomains_(NSSomeLocationDirectory, NSUserDomainMask).lastObject();

                // check that the lookup had data
                if (p) {
                    return p.path().toString();
                } else {
                    return '';
                }
            }

            resolve({
                // most interesting directories
                DocumentDirectory: getPathForNSLocation(NSDocumentDirectory),
                LibraryDirectory: getPathForNSLocation(NSLibraryDirectory),
                CachesDirectory: getPathForNSLocation(NSCachesDirectory),
                BundlePath: mb.bundlePath().toString(),

                // other directories
                ApplicationDirectory: getPathForNSLocation(NSApplicationDirectory),
                DemoApplicationDirectory: getPathForNSLocation(NSDemoApplicationDirectory),
                DeveloperApplicationDirectory: getPathForNSLocation(NSDeveloperApplicationDirectory),
                UserDirectory: getPathForNSLocation(NSUserDirectory),
                CoreServiceDirectory: getPathForNSLocation(NSCoreServiceDirectory),
                AutosavedInformationDirectory: getPathForNSLocation(NSAutosavedInformationDirectory),
                DesktopDirectory: getPathForNSLocation(NSDesktopDirectory),
                ApplicationSupportDirectory: getPathForNSLocation(NSApplicationSupportDirectory),

                // data from the NSBundle
                ReceiptPath: mb.appStoreReceiptURL().path().toString(),
                ResourcePath: mb.resourcePath().toString()
            });

            // -- Sample Objective-C
            //
            // NSFileManager *fm = [NSFileManager defaultManager];
            // NSString *pictures = [[fm URLsForDirectory:NSPicturesDirectory inDomains:NSUserDomainMask] lastObject].path;
            // NSBundle *bundle = [NSBundle mainBundle];
            // NSString *bundlePath = [bundle bundlePath];
            // NSString *receipt = [bundle appStoreReceiptURL].path;
            // NSString *resourcePath = [bundle resourcePath];
        } else if (Java.available) {
            Java.perform(function () {
                const ActivityThread = Java.use('android.app.ActivityThread');

                const currentApplication = ActivityThread.currentApplication();
                const context = currentApplication.getApplicationContext();

                resolve({
                    filesDirectory: context.getFilesDir().getAbsolutePath().toString(),
                    cacheDirectory: context.getCacheDir().getAbsolutePath().toString(),
                    externalCacheDirectory: context.getExternalCacheDir().getAbsolutePath().toString(),
                    codeCacheDirectory: context.getCodeCacheDir().getAbsolutePath().toString(),
                    obbDir: context.getObbDir().getAbsolutePath().toString(),
                    packageCodePath: context.getPackageCodePath().toString()
                });
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],22:[function(require,module,exports){
// Returns information about Frida itself.
module.exports = function () {
    return new Promise(function (resolve, reject) {
        resolve({
            frida_version: Frida.version,
            process_arch: Process.arch,
            process_platform: Process.platform,
            process_has_debugger: Process.isDebuggerAttached()
        });
    });
};

},{}],23:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // https://developer.apple.com/documentation/uikit/uidevice
            // https://developer.apple.com/documentation/foundation/bundle

            const UIDevice = ObjC.classes.UIDevice;
            const NSBundle = ObjC.classes.NSBundle;

            resolve({
                applicationName: String(NSBundle.mainBundle().objectForInfoDictionaryKey_('CFBundleIdentifier')),
                deviceName: String(UIDevice.currentDevice().name()),
                systemName: String(UIDevice.currentDevice().systemName()),
                model: String(UIDevice.currentDevice().model()),
                systemVersion: String(UIDevice.currentDevice().systemVersion()),
                identifierForVendor: String(UIDevice.currentDevice().identifierForVendor())
            });
        } else if (Java.available) {
            Java.perform(function () {
                // https://developer.android.com/reference/android/os/Build.html
                const Build = Java.use('android.os.Build');

                const ActivityThread = Java.use('android.app.ActivityThread');

                var currentApplication = ActivityThread.currentApplication();
                var context = currentApplication.getApplicationContext();

                resolve({
                    application_name: context.getPackageName(),
                    model: Build.MODEL.value.toString(),
                    board: Build.BOARD.value.toString(),
                    brand: Build.BRAND.value.toString(),
                    device: Build.DEVICE.value.toString(),
                    host: Build.HOST.value.toString(),
                    id: Build.ID.value.toString(),
                    product: Build.PRODUCT.value.toString(),
                    user: Build.USER.value.toString(),
                    version: Java.androidVersion
                });
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],24:[function(require,module,exports){
module.exports = function (quiet) {
    return new Promise(function (resolve, reject) {
        var send = console.log;

        if (ObjC.available) {
            resolve = send;

            /* SSLContextRef SSLCreateContext ( CFAllocatorRef alloc, SSLProtocolSide protocolSide, SSLConnectionType connectionType );*/
            var SSLCreateContext = new NativeFunction(Module.findExportByName("Security", "SSLCreateContext"), 'pointer', ['pointer', 'int', 'int']);

            /* OSStatus SSLHandshake ( SSLContextRef context ); */
            var SSLHandshake = new NativeFunction(Module.findExportByName("Security", "SSLHandshake"), 'int', ['pointer']);

            /* OSStatus SSLSetSessionOption ( SSLContextRef context, SSLSessionOption option, Boolean value );*/
            var SSLSetSessionOption = new NativeFunction(Module.findExportByName("Security", "SSLSetSessionOption"), 'int', ['pointer', 'int', 'bool']);

            var errSSLServerAuthCompvared = -9481;
            var kSSLSessionOptionBreakOnServerAuth = 0;
            var noErr = 0;

            console.log('agent: ssl killer running!');

            Interceptor.replace(SSLHandshake, new NativeCallback(function (context) {
                var result = SSLHandshake(context);
                if (result === errSSLServerAuthCompvared) {
                    console.log('SSLHandshake override: ', result);
                    return SSLHandshake(context);
                } else {
                    //console.log('SSLHandshake(): ', result);
                    return result;
                }
            }, 'int', ['pointer']));

            Interceptor.replace(SSLCreateContext, new NativeCallback(function (alloc, protocolSide, connectionType) {
                console.log('SSLCreateContext: set break on server auth');
                var sslContext = SSLCreateContext(alloc, protocolSide, connectionType);
                SSLSetSessionOption(sslContext, kSSLSessionOptionBreakOnServerAuth, 1);
                return sslContext;
            }, 'pointer', ['pointer', 'int', 'int']));

            Interceptor.replace(SSLSetSessionOption, new NativeCallback(function (context, option, value) {
                if (option === kSSLSessionOptionBreakOnServerAuth) {
                    console.log('SSLSetSessionOption: override', option, '=>', value, ' ignored');
                    return noErr;
                }
                return SSLSetSessionOption(context, option, value);
            }, 'int', ['pointer', 'int', 'bool']));

            {
                // // This hook attempts many ways to kill SSL pinning and certificate
                // // validations. The first sections search for common libraries and
                // // class methods used in many examples online to demonstrate how
                // // to pin SSL certificates.
                //
                // // As far as libraries and classes go, this hook searches for:
                // //
                // //  - AFNetworking.
                // //      AFNetworking has a very easy pinning feature that can be disabled
                // //      by setting the 'PinningMode' to 'None'.
                // //
                // //  - NSURLSession.
                // //      NSURLSession makes use of a delegate method with the signature
                // //      'URLSession:didReceiveChallenge:completionHandler:' that allows
                // //      developers to extract the server presented certificate and make
                // //      decisions to complete the request or cancel it. The hook for this
                // //      Class searches for the selector and replaces it one that will
                // //      continue regardless of the logic in this method, and apply the
                // //      original block as a callback, with a successful return.
                // //
                // //  - NSURLConnection.
                // //      While an old method, works similar to NSURLSession, except there is
                // //      no completionHandler block, so just the successful challenge is returned.
                //
                // // The more 'lower level' stuff is basically a reimplementation of the commonly
                // // known 'SSL-Killswitch2'[1], which hooks and replaces lower level certificate validation
                // // methods with ones that will always pass. An important note should be made on the
                // // implementation changes from iOS9 to iOS10 as detailed here[2]. This hook also tries
                // // to implement those for iOS10.
                // //  [1] https://github.com/nabla-c0d3/ssl-kill-switch2/blob/master/SSLKillSwitch/SSLKillSwitch.m
                // //  [2] https://nabla-c0d3.github.io/blog/2017/02/05/ios10-ssl-kill-switch/
                //
                // // Many apps implement the SSL pinning in interesting ways, if this hook fails, all
                // // is not lost yet. Sometimes, there is a method that just checks some configuration
                // // item somewhere, and returns a BOOL, indicating whether pinning is applicable or
                // // not. So, hunt that method and hook it :)
                //
                // console.log('weia');
                //
                // // Some base handles
                // var resolver = new ApiResolver('objc');
                // var NSURLCredential = ObjC.classes.NSURLCredential;
                // var ignore_ios10_tls_helper = (!!tls_helper);
                // var quiet_output = (!!quiet);
                //
                // // Helper method to honor the quiet flag.
                // function quiet_send(data) {
                //     if (quiet_output)
                //         return;
                //     else
                //         resolve(data)
                // }
                //
                // // Process the Frameworks and Classes First
                //
                // // AFNetworking
                // if (ObjC.classes.AFHTTPSessionManager && ObjC.classes.AFSecurityPolicy) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: 'Found AFNetworking library'
                //     });
                //
                //     // -[AFSecurityPolicy setSSLPinningMode:]
                //     var AFSecurityPolicy_setSSLPinningMode = {};
                //     resolver.enumerateMatches('-[AFSecurityPolicy setSSLPinningMode:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_setSSLPinningMode.name = match.name;
                //             AFSecurityPolicy_setSSLPinningMode.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_setSSLPinningMode.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy setSSLPinningMode:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_setSSLPinningMode.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for setSSLPinningMode: ' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // -[AFSecurityPolicy setAllowInvalidCertificates:]
                //     var AFSecurityPolicy_setAllowInvalidCertificates = {};
                //     resolver.enumerateMatches('-[AFSecurityPolicy setAllowInvalidCertificates:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_setAllowInvalidCertificates.name = match.name;
                //             AFSecurityPolicy_setAllowInvalidCertificates.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_setAllowInvalidCertificates.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy setAllowInvalidCertificates:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_setAllowInvalidCertificates.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x1) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for setAllowInvalidCertificates:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x1;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // +[AFSecurityPolicy policyWithPinningMode:]
                //     var AFSecurityPolicy_policyWithPinningMode = {};
                //     resolver.enumerateMatches('+[AFSecurityPolicy policyWithPinningMode:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_policyWithPinningMode.name = match.name;
                //             AFSecurityPolicy_policyWithPinningMode.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_policyWithPinningMode.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy policyWithPinningMode:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_policyWithPinningMode.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for policyWithPinningMode:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // +[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]
                //     var AFSecurityPolicy_policyWithPinningModewithPinnedCertificates = {};
                //     resolver.enumerateMatches('+[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.name = match.name;
                //             AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for policyWithPinningMode:withPinnedCertificates:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                // }
                //
                // // NSURLSession
                // var search = resolver.enumerateMatchesSync('-[* URLSession:didReceiveChallenge:completionHandler:]');
                //
                // if (search.length > 0) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[NSURLSession] Found ' + search.length + ' matches for URLSession:didReceiveChallenge:completionHandler:'
                //     });
                //
                //     for (var i = 0; i < search.length; i++) {
                //
                //         Interceptor.attach(search[i].address, {
                //             onEnter: function (args) {
                //
                //                 // 0
                //                 // 1
                //                 // 2 URLSession
                //                 // 3 didReceiveChallenge
                //                 // 4 completionHandler
                //
                //                 // get handlers on some arguments
                //                 var receiver = new ObjC.Object(args[0]);
                //                 var selector = ObjC.selectorAsString(args[1]);
                //                 var challenge = new ObjC.Object(args[3]);
                //
                //                 quiet_send({
                //                     status: 'success',
                //                     error_reason: NaN,
                //                     type: 'ios-ssl-pinning-bypass',
                //                     data: '[NSURLSession] Got call to -[' + receiver + ' ' + selector + ']. Ensuring pinning passes.'
                //                 });
                //
                //                 // get the original completion handler, and save it
                //                 var completion_handler = new ObjC.Block(args[4]);
                //                 var saved_completion_handler = completion_handler.implementation;
                //
                //                 // ignore everything the original method wanted to do,
                //                 // and prepare the successful arguments for the original
                //                 // completion handler
                //                 completion_handler.implementation = function () {
                //
                //                     // Example handler source
                //
                //                     // SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
                //                     // SecCertificateRef certificate = SecTrustGetCertificateAtIndex(serverTrust, 0);
                //                     // NSData *remoteCertificateData = CFBridgingRelease(SecCertificateCopyData(certificate));
                //                     // NSString *cerPath = [[NSBundle mainBundle] pathForResource:@"swapi.co" ofType:@"der"];
                //                     // NSData *localCertData = [NSData dataWithContentsOfFile:cerPath];
                //
                //                     // if ([remoteCertificateData isEqualToData:localCertData]) {
                //
                //                     //     NSURLCredential *credential = [NSURLCredential credentialForTrust:serverTrust];
                //                     //     [[challenge sender] useCredential:credential forAuthenticationChallenge:challenge];
                //                     //     completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
                //
                //                     // } else {
                //
                //                     //     [[challenge sender] cancelAuthenticationChallenge:challenge];
                //                     //     completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
                //                     // }
                //
                //                     var credential = NSURLCredential.credentialForTrust_(challenge.protectionSpace().serverTrust());
                //                     challenge.sender().useCredential_forAuthenticationChallenge_(credential, challenge);
                //
                //                     // typedef NS_ENUM(NSInteger, NSURLSessionAuthChallengeDisposition) {
                //                     //     NSURLSessionAuthChallengeUseCredential = 0,
                //                     //     NSURLSessionAuthChallengePerformDefaultHandling = 1,
                //                     //     NSURLSessionAuthChallengeCancelAuthenticationChallenge = 2,
                //                     //     NSURLSessionAuthChallengeRejectProtectionSpace = 3,
                //                     // } NS_ENUM_AVAILABLE(NSURLSESSION_AVAILABLE, 7_0);
                //                     saved_completion_handler(0, credential);
                //                 }
                //             }
                //         });
                //     }
                // }
                //
                // // NSURLConnection
                // var search = resolver.enumerateMatchesSync('-[* connection:willSendRequestForAuthenticationChallenge:]');
                //
                // if (search.length > 0) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[NSURLConnection] Found ' + search.length + ' matches for connection:willSendRequestForAuthenticationChallenge:'
                //     });
                //
                //     for (var i = 0; i < search.length; i++) {
                //
                //         Interceptor.replace(search[i].address, new NativeCallback(function (a, b, connection, challenge) {
                //
                //             //TODO: Make sure we run the following method here too:
                //             // [[challenge sender] useCredential:credential forAuthenticationChallenge:challenge];
                //
                //         }, 'void', ['pointer', 'pointer', 'pointer', 'pointer']));
                //     }
                // }
                //
                // // Process the lower level methods, just like SSL-Killswitch2
                // //  https://github.com/nabla-c0d3/ssl-kill-switch2/blob/master/SSLKillSwitch/SSLKillSwitch.m
                // //
                // // iOS9 and below
                //
                // // Some constants
                // var errSSLServerAuthCompared = -9481;
                // var kSSLSessionOptionBreakOnServerAuth = 0;
                // var noErr = 0;
                // var errSecSuccess = 0;
                //
                // // SSLSetSessionOption
                // send({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLSetSessionOption'
                // });
                //
                // var SSLSetSessionOption = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLSetSessionOption'),
                //     'int', ['pointer', 'int', 'bool']);
                //
                // Interceptor.replace(SSLSetSessionOption, new NativeCallback(function (context, option, value) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SSLSetSessionOption] Called'
                //     });
                //
                //     if (option === kSSLSessionOptionBreakOnServerAuth) {
                //
                //         return noErr;
                //     }
                //
                //     return SSLSetSessionOption(context, option, value);
                // }, 'int', ['pointer', 'int', 'bool']));
                //
                // // SSLCreateContext
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLCreateContext'
                // });
                //
                // var SSLCreateContext = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLCreateContext'),
                //     'pointer', ['pointer', 'int', 'int']);
                //
                // Interceptor.replace(SSLCreateContext, new NativeCallback(function (alloc, protocolSide, connectionType) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SSLCreateContext] Called'
                //     });
                //
                //     var sslContext = SSLCreateContext(alloc, protocolSide, connectionType);
                //     SSLSetSessionOption(sslContext, kSSLSessionOptionBreakOnServerAuth, 1);
                //
                //     return sslContext;
                //
                // }, 'pointer', ['pointer', 'int', 'int']));
                //
                // // SSLHandshake
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLHandshake'
                // });
                //
                // var SSLHandshake = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLHandshake'),
                //     'int', ['pointer']);
                //
                // Interceptor.replace(SSLHandshake, new NativeCallback(function (context) {
                //
                //     var result = SSLHandshake(context);
                //
                //     if (result == errSSLServerAuthCompared) {
                //
                //         quiet_send({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: '[SSLHandshake] Calling SSLHandshake() again, skipping cert validation.'
                //         });
                //
                //         return SSLHandshake(context);
                //
                //     } else {
                //
                //         return result;
                //     }
                // }, 'int', ['pointer']));
                //
                // // SecTrustEvaluate
                // // Refs:
                // //  https://github.com/vtky/Swizzler2/blob/159a5eaf64bc56d92f823b028fd1c11b71324e90/SSLKillSwitch.js#L92
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SecTrustEvaluate'
                // });
                //
                // var SecTrustEvaluate = new NativeFunction(
                //     Module.findExportByName('Security', 'SecTrustEvaluate'),
                //     'int', ['pointer', 'pointer']
                // );
                //
                // Interceptor.replace(SecTrustEvaluate, new NativeCallback(function (trust, result) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SecTrustEvaluate] Called SecTrustEvaluate()'
                //     });
                //
                //     return errSecSuccess;
                //
                // }, 'int', ['pointer', 'pointer']));
                //
                // // iOS 10
                //
                // // tls_helper_create_peer_trust
                // var tls_helper_create_peer_trust_export = Module.findExportByName('libcoretls_cfhelpers.dylib',
                //     'tls_helper_create_peer_trust');
                //
                // // In the case of devices older than iOS 10, this export
                // // would not have been found.
                // if (tls_helper_create_peer_trust_export && !ignore_ios10_tls_helper) {
                //
                //     // TODO: This method broke SSL connections as per: https://github.com/sensepost/objection/issues/35
                //     // Figure out why!
                //     //  ref: https://opensource.apple.com/source/coreTLS/coreTLS-121.31.1/coretls_cfhelpers/tls_helpers.c
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: 'Hooking lower level method: tls_helper_create_peer_trust'
                //     });
                //
                //     var tls_helper_create_peer_trust = new NativeFunction(tls_helper_create_peer_trust_export,
                //         'int', ['void', 'bool', 'pointer']);
                //
                //     Interceptor.replace(tls_helper_create_peer_trust, new NativeCallback(function (hdsk, server, SecTrustRef) {
                //
                //         quiet_send({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: '[tls_helper_create_peer_trust] Called'
                //         });
                //
                //         return noErr;
                //
                //     }, 'int', ['void', 'bool', 'pointer']));
                // }
            }
        } else if (Java.available) {
            Java.perform(function () {
                // Attempts to bypass SSL pinning implementations in a number of
                // ways. These include implementing a new TrustManager that will
                // accept any SSL certificate, overriding OkHTTP v3 check()
                // method etc.

                const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
                const SSLContext = Java.use('javax.net.ssl.SSLContext');

                // Helper method to honor the quiet flag.
                function quiet_send(data) {
                    if (quiet === true) {
                        return;
                    }
                    send(data);
                }

                // Implement a new TrustManager
                // ref: https://gist.github.com/oleavr/3ca67a173ff7d207c6b8c3b0ca65a9d8
                var TrustManager = Java.registerClass({
                    name: 'com.sensepost.test.TrustManager',
                    implements: [X509TrustManager],
                    methods: {
                        checkClientTrusted: function (chain, authType) {},
                        checkServerTrusted: function (chain, authType) {},
                        getAcceptedIssuers: function () {
                            return [];
                        }
                    }
                });

                // Prepare the TrustManagers array to pass to SSLContext.init()
                var TrustManagers = [TrustManager.$new()];

                quiet_send('Create empty TrustManager');

                // Get a handle on the init() on the SSLContext class
                var SSLContext_init = SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');

                // Override the init method, specifying our new TrustManager
                SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {
                    quiet_send('Overriding SSLContext.init() with the custom TrustManager');
                    SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
                };

                // OkHTTP v3.x

                // Wrap the logic in a try/catch as not all applications will have
                // okhttp as part of the app.
                try {

                    var CertificatePinner = Java.use('okhttp3.CertificatePinner');

                    quiet_send('OkHTTP 3.x Found');

                    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function () {
                        quiet_send('OkHTTP 3.x check() called. Not throwing an exception.');
                    };
                } catch (err) {

                    // If we dont have a ClassNotFoundException exception, raise the
                    // problem encountered.
                    if (err.message.indexOf('ClassNotFoundException') === 0) {

                        throw new Error(err);
                    }
                }

                // Appcelerator Titanium PinningTrustManager

                // Wrap the logic in a try/catch as not all applications will have
                // appcelerator as part of the app.
                try {
                    var PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');

                    quiet_send('Appcelerator Titanium Found');

                    PinningTrustManager.checkServerTrusted.implementation = function () {
                        quiet_send('Appcelerator checkServerTrusted() called. Not throwing an exception.');
                    };
                } catch (err) {

                    // If we dont have a ClassNotFoundException exception, raise the
                    // problem encountered.
                    if (err.message.indexOf('ClassNotFoundException') === 0) {

                        throw new Error(err);
                    }
                }

                // -- Sample Java
                //
                // "Generic" TrustManager Example
                //
                // TrustManager[] trustAllCerts = new TrustManager[] {
                //     new X509TrustManager() {
                //         public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                //             return null;
                //         }
                //         public void checkClientTrusted(X509Certificate[] certs, String authType) {  }

                //         public void checkServerTrusted(X509Certificate[] certs, String authType) {  }

                //     }
                // };

                // SSLContext sslcontect = SSLContext.getInstance("TLS");
                // sslcontect.init(null, trustAllCerts, null);

                // OkHTTP 3 Pinning Example
                // String hostname = "swapi.co";
                // CertificatePinner certificatePinner = new CertificatePinner.Builder()
                //         .add(hostname, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                //         .build();

                // OkHttpClient client = new OkHttpClient.Builder()
                //         .certificatePinner(certificatePinner)
                //         .build();

                // Request request = new Request.Builder()
                //         .url("https://swapi.co/api/people/1")
                //         .build();

                // Response response = client.newCall(request).execute();
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],25:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            resolve('iOS');
        } else if (Java.available || Java.androidVersion) {
            // Some android apps does not have Java available
            resolve('Android');
        } else {
            resolve('Unknown');
        }
    });
};

},{}],26:[function(require,module,exports){
// Contains common paths used in both the root
// disable and simulation hooks. These paths are included
// using the //jinja: directive

var common_paths_android = ['/data/local/bin/su', '/data/local/su', '/data/local/xbin/su', '/dev/com.koushikdutta.superuser.daemon/', '/sbin/su', '/system/app/Superuser.apk', '/system/bin/failsafe/su', '/system/bin/su', '/system/etc/init.d/99SuperSUDaemon', '/system/sd/xbin/su', '/system/xbin/busybox', '/system/xbin/daemonsu', '/system/xbin/su', '/sbin/launch_daemonsu.sh', '/system/xbin/supolicy', '/system/lib/libsupol.so', '/system/lib(64)/libsupol.so', '/system/app/SuperSU/SuperSU.apk', '/su/bin/su', '/su/bin/daemonsu', '/su/bin/supolicy_wrapped', '/su/bin/supolicy', '/su/bin/sush', '/su/bin/app_process', '/su/bin/libsupol.so', '/data/SuperSU.apk', '/cache/SuperSU.apk', '/su/bin/sukernel'];

var common_packages_android = ['de.robv.android.xposed.installer', 'eu.chainfire.supersu', 'stericson.busybox', 'stericson.busybox.donate', 'com.koushikdutta.superuser', 'com.koushikdutta.rommanager', 'com.koushikdutta.rommanager.license', 'com.jmz.soft.twrpmanager', 'me.twrp.twrpapp', 'com.dimonvideo.luckypatcher', 'com.chelpus.lackypatch', 'com.topjohnwu.magisk'];

var common_paths_ios = ['/Applications/Cydia.app', '/Applications/FakeCarrier.app', '/Applications/Icy.app', '/Applications/IntelliScreen.app', '/Applications/MxTube.app', '/Applications/RockApp.app', '/Applications/SBSetttings.app', '/Applications/WinterBoard.app', '/Applications/blackra1n.app', '/bin/bash', '/bin/sh', '/etc/apt', '/etc/ssh/sshd_config', '/Library/MobileSubstrate/DynamicLibraries/Veency.plist', '/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist', '/Library/MobileSubstrate/MobileSubstrate.dylib', '/private/var/stash', '/private/var/tmp/cydia.log', '/private/var/lib/apt', '/private/var/lib/cydia', '/private/var/mobile/Library/SBSettings/Themes', '/System/Library/LaunchDaemons/com.ikey.bbot.plist', '/System/Library/LaunchDaemons/com.saurik.Cy@dia.Startup.plist', '/usr/bin/cycript', '/usr/bin/ssh', '/usr/bin/sshd', '/usr/libexec/sftp-server', '/usr/libexec/ssh-keysign', '/usr/sbin/sshd', '/var/cache/apt', '/var/lib/apt', '/var/lib/cydia', '/var/log/syslog', '/var/tmp/cydia.log'];

module.exports = {
    common_paths_android: common_paths_android,
    common_packages_android: common_packages_android,
    common_paths_ios: common_paths_ios
};

},{}],27:[function(require,module,exports){
module.exports = function () {
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
                            console.log('[+] --- File: ' + this.path);
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
                reject({ reason: 'Unable to find libSystem.B.dylib::fork(). Running on simulator?' });
            }

            // Hook schema
            Interceptor.attach(ObjC.classes.UIApplication['- canOpenURL:'].implementation, {
                onEnter: function (args) {
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
                            console.log('[+] --- URL: ' + this.url);
                            retval.replace(0x0);
                        }
                    }
                }
            });
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

                        send('Check for test-keys was detected. Marking it as failed.');

                        return false;
                    }

                    // call the original method
                    this.contains.apply(this, arguments);
                };

                // exec check for su command.
                Runtime.exec.overload('java.lang.String').implementation = function (command) {

                    if (command.endsWith('su')) {

                        send('Check for su detected with command \'' + command + '\'. Throwing an IOException.');

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

                        send('Check for \'' + filename + '\' was detected. Returning false.');

                        return false;
                    }

                    // call the original method
                    this.contains.apply(this, arguments);
                };

                var a = Java.use("com.bankinter.sdk.bkcore.managers.b.a");
                a.a.overload().implementation = function () {
                    send('com.bankinter.sdk.bkcore.managers.b.a');
                    return false;
                };
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{"./_common.js":26}],28:[function(require,module,exports){
module.exports = function () {
    // TODO: Simulate this
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            reject(new Error('Not implemented'));
        } else if (Java.available) {
            Java.perform(function () {
                reject(new Error('Not implemented'));
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],29:[function(require,module,exports){
module.exports = function (msg, timeout) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // ref: https://www.frida.re/docs/examples/ios/

            // Import ObjC classes
            var UIAlertController = ObjC.classes.UIAlertController;
            var UIAlertAction = ObjC.classes.UIAlertAction;
            var UIApplication = ObjC.classes.UIApplication;
            var pressed = false;

            // Defining a Block that will be passed as handler parameter
            // to +[UIAlertAction actionWithTitle:style:handler:]
            var handler = new ObjC.Block({
                retType: 'void',
                argTypes: ['object'],
                implementation: function () {
                    pressed = true;
                    resolve('ok');
                }
            });

            // Using Grand Central Dispatch to pass messages (invoke methods) in application's main thread
            ObjC.schedule(ObjC.mainQueue, function () {
                // Using integer numerals for preferredStyle which is of type enum UIAlertControllerStyle
                var alert = UIAlertController.alertControllerWithTitle_message_preferredStyle_(msg, '', 1);

                // Again using integer numeral for style parameter that is enum
                var ok_button = UIAlertAction.actionWithTitle_style_handler_('OK', 0, handler);
                alert.addAction_(ok_button);

                // Instead of using `ObjC.choose()` and looking for UIViewController instances
                // on the heap, we have direct access through UIApplication:
                UIApplication.sharedApplication().keyWindow().rootViewController().presentViewController_animated_completion_(alert, true, NULL);
            });

            function end() {
                if (!pressed) resolve('timeout');
            }
            if (timeout) {
                setTimeout(end, timeout);
            }
        } else if (Java.available) {
            Java.perform(function () {});
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],30:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            resolve(ObjC.classes.UIWindow.keyWindow().recursiveDescription().toString());
        } else if (Java.available) {
            Java.perform(function () {});
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],31:[function(require,module,exports){
module.exports = function (msg) {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var UIPasteboard = ObjC.classes.UIPasteboard;
            var pasteboard = UIPasteboard.generalPasteboard();

            if (msg) {
                var str = ObjC.classes.NSString.stringWithString_(msg);
                pasteboard['setString:'](str);
                resolve(pasteboard.string().toString());
            } else {

                // // TODO: Monitor for images and plists
                // var image_data;
                // var plist_data;

                resolve(pasteboard.string().toString());
            }
        } else if (Java.available) {
            Java.perform(function () {
                // Monitors the Android Clipboard and reports changes to
                // its contents.
                //
                // Ref: https://developer.android.com/guide/topics/text/copy-paste.html

                var ActivityThread = Java.use('android.app.ActivityThread');
                var ClipboardManager = Java.use('android.content.ClipboardManager');
                var CLIPBOARD_SERVICE = 'clipboard';

                var currentApplication = ActivityThread.currentApplication();
                var context = currentApplication.getApplicationContext();

                var clipboard_handle = context.getApplicationContext().getSystemService(CLIPBOARD_SERVICE);
                var clipboard = Java.cast(clipboard_handle, ClipboardManager);

                // Variable used for the current string data
                var string_data;

                function check_clipboard_data() {

                    Java.perform(function () {

                        var primary_clip = clipboard.getPrimaryClip();

                        // If we have managed to get the primary clipboard and there are
                        // items stored in it, process an update.
                        if (primary_clip != null && primary_clip.getItemCount() > 0) {

                            var data = primary_clip.getItemAt(0).coerceToText(context).toString();

                            // If the data is the same, just stop.
                            if (string_data == data) {
                                return;
                            }

                            // Update the data with the new string and report back.
                            string_data = data;

                            send({
                                status: 'success',
                                error_reason: NaN,
                                type: 'clipboard-monitor-string',
                                data: data
                            });
                        }
                    });
                }

                // Poll every 5 seconds
                setInterval(check_clipboard_data, 1000 * 5);
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}],32:[function(require,module,exports){
module.exports = function () {
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Attempts to take a screenshot of the current application
            // and foreground view.

            // init some types
            var CGFloat = Process.pointerSize === 4 ? 'float' : 'double';
            var CGSize = [CGFloat, CGFloat];

            // get objc objects
            var UIWindow = ObjC.classes.UIWindow;
            var UIGraphicsBeginImageContextWithOptions = new NativeFunction(Module.findExportByName('UIKit', 'UIGraphicsBeginImageContextWithOptions'), 'void', [CGSize, 'bool', CGFloat]);
            var UIGraphicsGetImageFromCurrentImageContext = new NativeFunction(Module.findExportByName('UIKit', 'UIGraphicsGetImageFromCurrentImageContext'), 'pointer', []);
            var UIGraphicsEndImageContext = new NativeFunction(Module.findExportByName('UIKit', 'UIGraphicsEndImageContext'), 'void', []);
            var UIImagePNGRepresentation = new NativeFunction(Module.findExportByName('UIKit', 'UIImagePNGRepresentation'), 'pointer', ['pointer']);

            var view = UIWindow.keyWindow();
            var bounds = view.bounds();
            var size = bounds[1];

            UIGraphicsBeginImageContextWithOptions(size, 0, 0);
            // view.drawViewHierarchyInRect_afterScreenUpdates_(bounds, true);  // <-- crashes =(

            var image = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();

            var png = new ObjC.Object(UIImagePNGRepresentation(image));
            var image_data = Memory.readByteArray(png.bytes(), png.length());

            resolve(image_data);

            // -- Sample Objective-C
            //
            // https://github.com/nowsecure/frida-screenshot \0/
            //
            // ref: https://stackoverflow.com/a/13559362
            //
            // UIGraphicsBeginImageContextWithOptions(self.view.bounds.size, self.view.opaque, 0.0);
            // [self.myView.layer renderInContext:UIGraphicsGetCurrentContext()];
            // UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
            // UIGraphicsEndImageContext();
            //
            // NSData *imageData = UIImageJPEGRepresentation(image, 1.0 ); //you can use PNG too
            // [imageData writeToFile:@"image1.jpeg" atomically:YES];
        } else if (Java.available) {
            Java.perform(function () {
                // Take a screenshot by making use of a View's drawing cache:
                //  ref: https://developer.android.com/reference/android/view/View.html#getDrawingCache(boolean)

                var ActivityThread = Java.use('android.app.ActivityThread');
                var Activity = Java.use('android.app.Activity');
                var ActivityClientRecord = Java.use('android.app.ActivityThread$ActivityClientRecord');
                var Bitmap = Java.use('android.graphics.Bitmap');
                var ByteArrayOutputStream = Java.use('java.io.ByteArrayOutputStream');
                var CompressFormat = Java.use('android.graphics.Bitmap$CompressFormat');

                var bytes;

                var populate_bytes = function () {

                    var activityThread = ActivityThread.currentActivityThread();
                    var activityRecords = activityThread.mActivities['value'].values().toArray();

                    var currentActivity;

                    for (var i in activityRecords) {

                        var activityRecord = Java.cast(activityRecords[i], ActivityClientRecord);

                        if (!activityRecord.paused['value']) {
                            currentActivity = Java.cast(Java.cast(activityRecord, ActivityClientRecord).activity['value'], Activity);

                            break;
                        }
                    }

                    if (currentActivity) {

                        var view = currentActivity.getWindow().getDecorView().getRootView();
                        view.setDrawingCacheEnabled(true);
                        var bitmap = Bitmap.createBitmap(view.getDrawingCache());
                        view.setDrawingCacheEnabled(false);

                        var outputStream = ByteArrayOutputStream.$new();
                        bitmap.compress(CompressFormat.PNG['value'], 100, outputStream);
                        bytes = outputStream.buf['value'];
                    }
                };

                rpc.exports = {
                    screenshot: function () {

                        Java.perform(function () {
                            populate_bytes();
                        });
                        return bytes;
                    }
                };
            });
        } else {
            reject(new Error('Language not supported'));
        }
    });
};

},{}]},{},[17])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9maWxlc3lzdGVtL2RlbGV0ZS5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL2ZpbGVzeXN0ZW0vZG93bmxvYWQuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9maWxlc3lzdGVtL2V4aXN0cy5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL2ZpbGVzeXN0ZW0vaXNfZmlsZS5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL2ZpbGVzeXN0ZW0vbHMuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9maWxlc3lzdGVtL21rZGlyLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvZmlsZXN5c3RlbS9wYXRoLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvZmlsZXN5c3RlbS9wd2QuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9maWxlc3lzdGVtL3JlYWRhYmxlLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvZmlsZXN5c3RlbS91cGxvYWQuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9maWxlc3lzdGVtL3dyaXRhYmxlLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvaG9va2luZy9saXN0X2NsYXNzX21ldGhvZHMuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9ob29raW5nL2xpc3RfY2xhc3Nlcy5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL2hvb2tpbmcvbGlzdF9leHBvcnRzLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvaG9va2luZy9saXN0X2ltcG9ydHMuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9ob29raW5nL2xpc3RfbW9kdWxlcy5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL2luZGV4LmpzIiwiY29yZS9mcmlkYS9hZ2VudHMva2V5Y2hhaW4vY2xlYXIuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9rZXljaGFpbi9kdW1wLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvbWVtb3J5L2R1bXAuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9taXNjL2Vudi5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL21pc2MvZnJpZGEuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9taXNjL2luZm8uanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9taXNjL3Bpbm5pbmcuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9taXNjL3R5cGUuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9yb290L19jb21tb24uanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9yb290L2Rpc2FibGUuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy9yb290L3NpbXVsYXRlLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvdWkvYWxlcnQuanMiLCJjb3JlL2ZyaWRhL2FnZW50cy91aS9kdW1wLmpzIiwiY29yZS9mcmlkYS9hZ2VudHMvdWkvcGFzdGVib2FyZC5qcyIsImNvcmUvZnJpZGEvYWdlbnRzL3VpL3NjcmVlbnNob3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxPQUFPLE9BQVAsR0FBaUIsVUFBUyxLQUFULEVBQWU7QUFDNUIsV0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFVLE9BQVYsRUFBbUIsTUFBbkIsRUFBMkI7QUFDMUMsWUFBSSxLQUFLLFNBQVQsRUFBb0I7QUFDaEI7QUFDQTtBQUNBOztBQUVBLGdCQUFJLGdCQUFnQixLQUFLLE9BQUwsQ0FBYSxhQUFqQztBQUNBLGdCQUFJLFdBQVcsS0FBSyxPQUFMLENBQWEsUUFBNUI7O0FBRUE7QUFDQSxnQkFBSSxLQUFLLGNBQWMsY0FBZCxFQUFUOztBQUVBO0FBQ0EsZ0JBQUksY0FBYyxTQUFTLGlCQUFULENBQTJCLEtBQTNCLENBQWxCOztBQUVBO0FBQ0E7O0FBRUEsZ0JBQUksR0FBRyxzQkFBSCxDQUEwQixXQUExQixDQUFKLEVBQTJDO0FBQ3ZDLG9CQUFJLEdBQUcsdUJBQUgsQ0FBMkIsV0FBM0IsRUFBd0MsSUFBeEMsQ0FBSixFQUFrRDtBQUM5Qyw0QkFBUSxJQUFSO0FBQ0gsaUJBRkQsTUFFTztBQUNILDJCQUFPLGVBQVA7QUFDSDtBQUNKLGFBTkQsTUFN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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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
