module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {

        } else if (Java.available) {
            Java.perform(function () {
                // Lists the registered activities from the android packageManager.

                var ActivityThread = Java.use('android.app.ActivityThread');
                var PackageManager = Java.use('android.content.pm.PackageManager');

                var GET_ACTIVITIES = PackageManager.GET_ACTIVITIES.value;

                var currentApplication = ActivityThread.currentApplication();
                var context = currentApplication.getApplicationContext();

                var activities = [];

                activities = activities.concat(context.getPackageManager()
                        .getPackageInfo(context.getPackageName(), GET_ACTIVITIES).activities['value'].map(function (activity_info) {

                        return activity_info.name['value'];
                    })
                );

                var response = {
                    status: 'success',
                    error_reason: NaN,
                    type: 'android-activities',
                    data: activities
                };

                send(response);

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};