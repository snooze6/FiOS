module.exports = function(apath){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance and list the files in the path
            var fm = NSFileManager.defaultManager();

            // init the path we want to check
            var path = NSString.stringWithString_(apath);
            var exists = fm.fileExistsAtPath_(path);

            resolve(Boolean(exists))
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
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};