module.exports = function(){
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

            })
        } else {
            reject(new Error('Language not supported'))
        }
    });
};