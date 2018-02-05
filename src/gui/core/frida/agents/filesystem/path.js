module.exports = function(){
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
            function snap(string){
                return (string.split('/').slice(0,-1)).join('/');
            }

            var data = {
                // most interesting directories
                bin: snap(mb.bundlePath().toString()),
                data: snap(getPathForNSLocation(NSDocumentDirectory))
            };

            resolve(data);
        } else if (Java.available) {

        } else {
            reject(new Error('Language not supported'))
        }

    });
};