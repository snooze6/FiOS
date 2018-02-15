module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            resolve('iOS')
        } else if (Java.available || Java.androidVersion) {
            // Some android apps does not have Java available
            resolve('Android')
        } else {
            resolve('Unknown')
        }
    });
};