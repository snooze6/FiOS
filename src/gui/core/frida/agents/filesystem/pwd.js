module.exports = function(){
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
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};