module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Attempts to take a screenshot of the current application
            // and foreground view.

            // init some types
            var CGFloat = (Process.pointerSize === 4) ? 'float' : 'double';
            var CGSize = [CGFloat, CGFloat];

            // get objc objects
            var UIWindow = ObjC.classes.UIWindow;
            var UIGraphicsBeginImageContextWithOptions = new NativeFunction(
                Module.findExportByName('UIKit', 'UIGraphicsBeginImageContextWithOptions'),
                'void', [CGSize, 'bool', CGFloat]);
            var UIGraphicsGetImageFromCurrentImageContext = new NativeFunction(
                Module.findExportByName('UIKit', 'UIGraphicsGetImageFromCurrentImageContext'),
                'pointer', []);
            var UIGraphicsEndImageContext = new NativeFunction(
                Module.findExportByName('UIKit', 'UIGraphicsEndImageContext'), 'void', []);
            var UIImagePNGRepresentation = new NativeFunction(
                Module.findExportByName('UIKit', 'UIImagePNGRepresentation'),
                'pointer', ['pointer']);

            var view = UIWindow.keyWindow();
            var bounds = view.bounds();
            var size = bounds[1];

            UIGraphicsBeginImageContextWithOptions(size, 0, 0);
            // view.drawViewHierarchyInRect_afterScreenUpdates_(bounds, true);  // <-- crashes =(

            var image = UIGraphicsGetImageFromCurrentImageContext();
            UIGraphicsEndImageContext();

            var png =  new ObjC.Object(UIImagePNGRepresentation(image));
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
                            currentActivity = Java.cast(Java.cast(activityRecord, ActivityClientRecord)
                                .activity['value'], Activity);

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

                        Java.perform(function () { populate_bytes(); });
                        return bytes;
                    }
                };

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};