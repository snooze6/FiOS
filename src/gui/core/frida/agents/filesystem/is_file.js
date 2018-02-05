module.exports = function(pathz){
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

            resolve(is_file)

        } else if (Java.available) {
            Java.perform(function () {
                // Check if the path is a file.
                var File = Java.use('java.io.File');
                var file = File.$new(pathz);

                resolve(Boolean(file.isFile()));
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};