module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {

        } else if (Java.available) {
            Java.perform(function () {
                // Lists the registered services from android.app.LoadedApk
                // as well as the android packageManager.

                var ActivityThread = Java.use('android.app.ActivityThread');
                var ArrayMap = Java.use('android.util.ArrayMap');
                var PackageManager = Java.use('android.content.pm.PackageManager');

                var GET_SERVICES = PackageManager.GET_SERVICES.value;

                var currentApplication = ActivityThread.currentApplication();
                var context = currentApplication.getApplicationContext();

                var services = [];

                currentApplication.mLoadedApk['value'].mServices['value'].values().toArray().map(function (arrayMap) {

                    Java.cast(arrayMap, ArrayMap).keySet().toArray().map(function (service) {

                        services.push(service.$className)
                    });
                });

                services = services.concat(context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), GET_SERVICES).services['value'].map(function (activity_info) {

                        return activity_info.name['value'];
                    })
                );

                resolve(services);

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};