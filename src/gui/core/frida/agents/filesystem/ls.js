module.exports = function(path){
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
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};
