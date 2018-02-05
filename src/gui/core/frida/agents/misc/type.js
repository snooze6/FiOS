module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            resolve('iOS')
        } else if (Java.available) {
            resolve('Android')
        } else {
            reject('Unknown device')
        }
    });
};