module.exports = function(apath){
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

            resolve(Boolean(readable))
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
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};