module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            var out = [];
            for (var className in ObjC.classes) {
                if (ObjC.classes.hasOwnProperty(className)) {
                    out.push(className)
                }
            }
            resolve(out);
        } else if (Java.available) {
            Java.perform(function () {
                resolve(Java.enumerateLoadedClassesSync())
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};