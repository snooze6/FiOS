module.exports = function(apath){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var NSFileManager = ObjC.classes.NSFileManager;
            var NSString = ObjC.classes.NSString;

            // get a file manager instance
            var fm = NSFileManager.defaultManager();

            // init the path we want to check
            var path = NSString.stringWithString_(apath);
            var writable = fm.isWritableFileAtPath_(path);

            resolve(Boolean(writable))
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
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};