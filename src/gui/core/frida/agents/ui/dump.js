module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            resolve(ObjC.classes.UIWindow.keyWindow().recursiveDescription().toString())
        } else if (Java.available) {
            Java.perform(function () {

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};